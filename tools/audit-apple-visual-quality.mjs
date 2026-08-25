import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

// Release gate: every published ART page is measured against the approved Aug-15 visual contract.
const base=(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const siteDir=path.resolve(process.env.AUDIT_SITE_DIR||'_site');
const widths=[390,768,1024,1440];
const failures=[];
const reports=[];
function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(f));else if(e.isFile()&&e.name.endsWith('.html'))out.push(f)}return out}
function toUrl(file){const rel=path.relative(siteDir,file).split(path.sep).join('/');if(rel==='index.html')return '/';if(rel.endsWith('/index.html'))return `/${rel.slice(0,-10)}`;return `/${rel}`}
function discover(){const pages=[];for(const file of walk(siteDir)){const html=fs.readFileSync(file,'utf8');if(!/<main\b/i.test(html)||/http-equiv=["']refresh["']/i.test(html)||/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html))continue;pages.push(toUrl(file))}return [...new Set(pages)].sort()}
const pages=discover();
const browser=await chromium.launch({headless:true});
for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1});
  for(const pathname of pages){
    const page=await context.newPage();
    try{await page.goto(new URL(pathname,base).href,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(120)}catch(e){failures.push(`${width}px ${pathname}: navigation ${e.message}`);await page.close();continue}
    const result=await page.evaluate(()=>{
      const issues=[];const stats={};const px=v=>parseFloat(v)||0;
      const visible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0};
      const name=el=>`${el.tagName.toLowerCase()}${el.id?'#'+el.id:''}${el.className?'.'+String(el.className).trim().replace(/\s+/g,'.').slice(0,100):''}`;
      const w=innerWidth,bodyBg=getComputedStyle(document.body).backgroundColor;
      const textNodes=[...document.querySelectorAll('main p,main li,main blockquote')].filter(visible);
      const longText=textNodes.filter(el=>(el.innerText||'').replace(/\s+/g,' ').trim().length>=120);
      if(document.documentElement.scrollWidth>document.documentElement.clientWidth+1)issues.push(`document horizontal overflow ${document.documentElement.scrollWidth-document.documentElement.clientWidth}px`);

      for(const el of longText){
        const s=getComputedStyle(el),r=el.getBoundingClientRect(),txt=(el.innerText||'').replace(/\s+/g,' ').trim();
        if(s.textAlign==='justify')issues.push(`${name(el)} uses justified text`);
        const centeredAllowed=!!el.closest('.cta-band,footer,.archive-statement,.editorial-statement,.statement');
        if(s.textAlign!=='left'&&s.textAlign!=='start'&&!centeredAllowed)issues.push(`${name(el)} long prose text-align=${s.textAlign}`);
        const fs=px(s.fontSize),lh=px(s.lineHeight)/(fs||1);
        const editorialLead=!!el.closest('[data-archive-page="press"],.press-hero')||el.classList.contains('lead');
        if(fs<(editorialLead?15:16))issues.push(`${name(el)} long prose font-size ${fs.toFixed(1)}px < ${editorialLead?15:16}px`);
        if(lh<1.35||lh>1.82)issues.push(`${name(el)} long prose line-height ${lh.toFixed(2)}`);
        if(w>=1024&&r.width>860)issues.push(`${name(el)} long prose width ${r.width.toFixed(0)}px > 860px`);
        if(w<=768&&!el.closest('.gallery,.collage,.record-gallery,.archive-source-hub')){
          if(r.left<12)issues.push(`${name(el)} mobile/tablet left gutter ${r.left.toFixed(1)}px`);
          if(r.right>w-12)issues.push(`${name(el)} mobile/tablet right gutter ${(w-r.right).toFixed(1)}px`);
        }
        if(txt.length>500&&r.width<Math.min(280,w-40))issues.push(`${name(el)} reading column too narrow ${r.width.toFixed(0)}px`);
      }

      for(const h of document.querySelectorAll('main h1,main h2,main h3,header h1')){
        if(!visible(h))continue;const s=getComputedStyle(h),r=h.getBoundingClientRect(),fs=px(s.fontSize),lh=px(s.lineHeight)/(fs||1);
        if(lh<0.98||lh>1.32)issues.push(`${name(h)} heading line-height ${lh.toFixed(2)}`);
        const tag=h.tagName.toLowerCase(),lim=tag==='h1'?(w<=430?[32,50]:w<=768?[34,58]:[38,76]):tag==='h2'?(w<=430?[24,40]:[24,48]):[18,34];
        if(fs<lim[0]||fs>lim[1])issues.push(`${name(h)} font-size ${fs.toFixed(1)}px outside ${lim[0]}–${lim[1]}px`);
        if(w<=768&&!h.closest('.gallery,.collage')&&(r.left<12||r.right>w-12))issues.push(`${name(h)} heading violates page gutter [${r.left.toFixed(1)},${r.right.toFixed(1)}]`);
      }

      // Curators must never regress into the former two-column dossier layout. Headings may be intrinsically narrow; prose columns may not.
      if(document.body.dataset.archivePage==='curators'){
        for(const c of document.querySelectorAll('main section.wrap.narrow')){
          if(!visible(c))continue;const cs=getComputedStyle(c),cr=c.getBoundingClientRect();
          const cols=cs.gridTemplateColumns.trim().split(/\s+/).filter(Boolean);
          if((cs.display==='grid'||cs.display==='inline-grid')&&cols.length>1)issues.push(`curators multi-column regression ${cols.join(' ')}`);
          for(const el of c.querySelectorAll(':scope > p.lead,:scope > p.meta,:scope > ul.linklist,:scope > blockquote')){
            if(!visible(el))continue;const r=el.getBoundingClientRect();if(r.width<Math.min(280,cr.width*.45))issues.push(`curators reading column too narrow ${name(el)} ${r.width.toFixed(0)}px`);
          }
        }
      }
      if(document.body.dataset.archivePage==='writing')for(const el of document.querySelectorAll('main h1,main h2,main h3,main p,main li'))if(visible(el)&&!['left','start'].includes(getComputedStyle(el).textAlign))issues.push(`writing alignment ${name(el)}=${getComputedStyle(el).textAlign}`);

      // Only sections that explicitly declare full-bleed semantics are required to span the viewport.
      for(const sec of document.querySelectorAll('main > section.full-bleed,main > section[data-full-bleed="true"]')){
        if(!visible(sec))continue;const r=sec.getBoundingClientRect(),s=getComputedStyle(sec),bg=s.backgroundColor;
        const visibleOwn=bg!=='rgba(0, 0, 0, 0)'&&bg!==bodyBg;
        if(visibleOwn&&r.width<w-2)issues.push(`${name(sec)} colored section not full viewport (${r.width.toFixed(0)}/${w})`);
        if(s.contentVisibility==='auto')issues.push(`${name(sec)} content-visibility:auto can create blank visual bands`);
      }

      for(const h of document.querySelectorAll('main h1,main h2,main h3')){
        if(!visible(h))continue;let n=h.nextElementSibling;while(n&&!visible(n))n=n.nextElementSibling;if(!n||!n.matches('p,ul,ol,blockquote,.lead,.meta,.cards,.archive-grid,.press-facts'))continue;
        const a=h.getBoundingClientRect(),b=n.getBoundingClientRect(),gap=b.top-a.bottom;
        if(gap<-1)issues.push(`${name(h)} → ${name(n)} vertical overlap ${gap.toFixed(1)}px`);
        const pressHero=!!h.closest('.press-hero,[data-archive-page="press"]');
        if(gap>(pressHero?96:64)&&!h.closest('.hero'))issues.push(`${name(h)} → ${name(n)} vertical gap ${gap.toFixed(1)}px too loose`);
      }

      if(w<=768){const controls=[...document.querySelectorAll('button,summary,input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]),select,textarea,.btn,.menu-btn,.nav-links a')].filter(visible);for(const el of controls){const r=el.getBoundingClientRect();if(r.height<43.5)issues.push(`${name(el)} touch height ${r.height.toFixed(1)}px < 44px`);if((el.matches('button,.menu-btn')||el.getAttribute('role')==='button')&&r.width<43.5)issues.push(`${name(el)} touch width ${r.width.toFixed(1)}px < 44px`);}}
      for(const el of document.querySelectorAll('.card,.archive-card,.press-fact,.press-record,.curatorial-period,.t-item')){
        if(!visible(el))continue;const s=getComputedStyle(el),r=el.getBoundingClientRect(),pl=px(s.paddingLeft),pr=px(s.paddingRight),pt=px(s.paddingTop),pb=px(s.paddingBottom);
        const hasWall=s.backgroundColor!=='rgba(0, 0, 0, 0)'||px(s.borderTopWidth)+px(s.borderRightWidth)+px(s.borderBottomWidth)+px(s.borderLeftWidth)>0;
        if(hasWall&&(pl<12||pr<12))issues.push(`${name(el)} cell horizontal padding ${pl.toFixed(0)}/${pr.toFixed(0)}px`);
        if(hasWall&&px(s.borderRadius)>28)issues.push(`${name(el)} radius ${s.borderRadius} > 28px`);
        if(r.width<120&&(el.innerText||'').trim().length>80)issues.push(`${name(el)} text cell width ${r.width.toFixed(0)}px`);
        if(pt>80||pb>80)issues.push(`${name(el)} cell vertical padding ${pt.toFixed(0)}/${pb.toFixed(0)}px`);
      }
      stats.longText=longText.length;stats.sections=[...document.querySelectorAll('main>section')].filter(visible).length;stats.controls=[...document.querySelectorAll('button,summary,input:not([type="hidden"]),select,textarea,.btn,.menu-btn,.nav-links a')].filter(visible).length;
      return {issues:[...new Set(issues)].slice(0,160),stats};
    });
    reports.push({width,pathname,...result.stats,issues:result.issues.length});if(result.issues.length)failures.push(`${width}px ${pathname}: ${result.issues.join(' | ')}`);await page.close();
  }
  await context.close();
}
await browser.close();fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/apple-visual-quality.json',JSON.stringify({pages:pages.length,widths,reports,failures},null,2));
if(failures.length){console.error(`ART Apple visual quality audit found ${failures.length} failing page/viewport combinations.`);console.error(failures.join('\n'));process.exit(1)}
console.log(`ART Apple visual quality audit passed: ${pages.length} pages × ${widths.length} viewports; typography, leading, alignment, reading measure, gutters, explicit full-bleed surfaces, touch geometry and editorial spacing verified.`);
