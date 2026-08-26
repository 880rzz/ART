import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

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
    try{await page.goto(new URL(pathname,base).href,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(150)}catch(e){failures.push(`${width}px ${pathname}: navigation ${e.message}`);await page.close();continue}
    const result=await page.evaluate(()=>{
      const issues=[];const px=v=>parseFloat(v)||0;const abs=Math.abs;
      const visible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0};
      const name=el=>`${el.tagName.toLowerCase()}${el.id?'#'+el.id:''}${el.className?'.'+String(el.className).trim().replace(/\s+/g,'.').slice(0,100):''}`;
      const w=innerWidth,bodyBg=getComputedStyle(document.body).backgroundColor;
      const left=s=>s.textAlign==='left'||s.textAlign==='start';
      const shortCentered=el=>!!el.closest('.hero,.press-hero,.cta-band,footer,.archive-statement,.editorial-statement,.statement')&&((el.innerText||'').trim().length<=220);
      const displayQuote=el=>el.matches('blockquote')&&(!!el.closest('.statement,.hero,.editorial-statement,.archive-statement')||px(getComputedStyle(el).fontSize)>21.5);
      const leadCopy=el=>el.classList.contains('lead')||el.matches('p.lead')||!!el.closest('.press-hero');
      if(document.documentElement.scrollWidth>document.documentElement.clientWidth+1)issues.push(`document horizontal overflow ${document.documentElement.scrollWidth-document.documentElement.clientWidth}px`);

      const text=[...document.querySelectorAll('main p,main li,main blockquote')].filter(visible);
      const longText=text.filter(el=>(el.innerText||'').replace(/\s+/g,' ').trim().length>=120);
      for(const el of longText){
        const s=getComputedStyle(el),r=el.getBoundingClientRect(),fs=px(s.fontSize),lh=px(s.lineHeight)/(fs||1),fw=Number(s.fontWeight)||400,ls=px(s.letterSpacing);
        if(s.textAlign==='justify')issues.push(`${name(el)} uses justified text`);
        if(!left(s)&&!shortCentered(el)&&!displayQuote(el))issues.push(`${name(el)} long prose text-align=${s.textAlign}`);
        if(displayQuote(el)){
          if(fs<22||fs>34)issues.push(`${name(el)} display quote font-size ${fs.toFixed(1)}px outside 22–34px`);
          if(lh<1.08||lh>1.45)issues.push(`${name(el)} display quote line-height ${lh.toFixed(2)} outside 1.08–1.45`);
          if(fw<400||fw>700)issues.push(`${name(el)} display quote weight ${fw}`);
        }else if(leadCopy(el)){
          const pressLead=!!el.closest('.press-hero');
          if(fs<(pressLead?15:16)||fs>28)issues.push(`${name(el)} lead font-size ${fs.toFixed(1)}px outside ${pressLead?'15':'16'}–28px`);
          if(lh<1.3||lh>(pressLead?1.68:1.58))issues.push(`${name(el)} lead line-height ${lh.toFixed(2)} outside 1.30–${pressLead?'1.68':'1.58'}`);
          if(fw<300||fw>600)issues.push(`${name(el)} lead weight ${fw}`);
        }else{
          if(fs<16||fs>21.5)issues.push(`${name(el)} long prose font-size ${fs.toFixed(1)}px outside 16–21.5px`);
          if(lh<1.4||lh>1.72)issues.push(`${name(el)} long prose line-height ${lh.toFixed(2)} outside 1.40–1.72`);
          if(fw<300||fw>600)issues.push(`${name(el)} long prose weight ${fw}`);
        }
        if(!displayQuote(el)&&abs(ls)>1)issues.push(`${name(el)} long prose tracking ${ls.toFixed(2)}px`);
        if(w>=1024&&!displayQuote(el)&&r.width>860)issues.push(`${name(el)} long prose width ${r.width.toFixed(0)}px > 860px`);
        if(w<=768&&!displayQuote(el)&&!el.closest('.gallery,.collage,.record-gallery,.archive-source-hub,.full-bleed,[data-full-bleed="true"]')&&(r.left<12||r.right>w-12))issues.push(`${name(el)} mobile/tablet gutter [${r.left.toFixed(1)},${(w-r.right).toFixed(1)}]px`);
        if(!displayQuote(el)&&(el.innerText||'').trim().length>500&&r.width<Math.min(280,w-40))issues.push(`${name(el)} reading column too narrow ${r.width.toFixed(0)}px`);
      }

      for(const h of document.querySelectorAll('main h1,main h2,main h3,header h1')){
        if(!visible(h))continue;const s=getComputedStyle(h),r=h.getBoundingClientRect(),fs=px(s.fontSize),lh=px(s.lineHeight)/(fs||1),fw=Number(s.fontWeight)||400,ls=px(s.letterSpacing);if(fs<1)continue;
        const tag=h.tagName.toLowerCase(),lim=tag==='h1'?(w<=430?[34,50]:w<=768?[34,58]:[38,76]):tag==='h2'?(w<=430?[24,42]:[24,48]):[17.75,34];const lhLim=tag==='h1'?[0.98,1.18]:[1.02,1.30];
        if(fs<lim[0]||fs>lim[1])issues.push(`${name(h)} font-size ${fs.toFixed(1)}px outside ${lim[0]}–${lim[1]}px`);
        if(lh<lhLim[0]||lh>lhLim[1])issues.push(`${name(h)} heading line-height ${lh.toFixed(2)}`);
        if(fw<500||fw>750)issues.push(`${name(h)} heading weight ${fw}`);
        if(fs&&abs(ls/fs)>.055)issues.push(`${name(h)} heading tracking ${(ls/fs).toFixed(3)}em (${ls.toFixed(2)}px)`);
        const sec=h.closest('section');const sr=sec?.getBoundingClientRect();const centeredViewportDisplay=(s.textAlign==='center'&&r.width>=w-2&&!!sr&&sr.width>=w-2);const fullWidthDisplay=!!h.closest('.full-bleed,[data-full-bleed="true"]')||centeredViewportDisplay;
        if(w<=768&&!fullWidthDisplay&&!h.closest('.gallery,.collage')&&(r.left<12||r.right>w-12))issues.push(`${name(h)} heading violates page gutter [${r.left.toFixed(1)},${(w-r.right).toFixed(1)}]`);
      }

      if(document.body.dataset.archivePage==='curators'){
        for(const c of document.querySelectorAll('main section.wrap.narrow')){
          if(!visible(c))continue;const cs=getComputedStyle(c),cr=c.getBoundingClientRect();const cols=cs.gridTemplateColumns.trim().split(/\s+/).filter(Boolean);if((cs.display==='grid'||cs.display==='inline-grid')&&cols.length>1)issues.push(`curators multi-column regression ${cols.join(' ')}`);for(const el of c.querySelectorAll(':scope > p.lead,:scope > p.meta,:scope > ul.linklist,:scope > blockquote')){if(!visible(el))continue;const r=el.getBoundingClientRect();if(r.width<Math.min(280,cr.width*.45))issues.push(`curators reading column too narrow ${name(el)} ${r.width.toFixed(0)}px`);}
        }
      }
      if(document.body.dataset.archivePage==='writing')for(const el of document.querySelectorAll('main h1,main h2,main h3,main p,main li'))if(visible(el)&&!left(getComputedStyle(el)))issues.push(`writing alignment ${name(el)}=${getComputedStyle(el).textAlign}`);

      for(const sec of [...document.querySelectorAll('main>section')].filter(visible)){
        const r=sec.getBoundingClientRect(),s=getComputedStyle(sec),bg=s.backgroundColor,pt=px(s.paddingTop),pb=px(s.paddingBottom);const colored=bg!=='rgba(0, 0, 0, 0)'&&bg!==bodyBg;const constrained=sec.matches('.wrap,.container,.content-wrap,.narrow');
        if(colored&&!constrained&&r.width<w-2){const before=getComputedStyle(sec,'::before'),bw=px(before.width),bbg=before.backgroundColor;const visualBleed=before.content!=='none'&&bw>=w-2&&bbg!=='rgba(0, 0, 0, 0)';if(!visualBleed)issues.push(`${name(sec)} colored top-level section not visually full viewport (${r.width.toFixed(0)}/${w})`);}
        if(s.contentVisibility==='auto')issues.push(`${name(sec)} content-visibility:auto can create blank visual bands`);const special=sec.classList.contains('hero')||sec.classList.contains('gallery')||!!sec.closest('.gallery,.collage');if(!special&&colored&&((w<=768&&(pt<32||pb<32))||(w>768&&(pt<48||pb<48))))issues.push(`${name(sec)} colored section vertical padding ${pt.toFixed(0)}/${pb.toFixed(0)}px too tight`);
      }

      for(const wrap of document.querySelectorAll('main .wrap,main .container,main .content-wrap')){
        if(!visible(wrap))continue;const r=wrap.getBoundingClientRect(),s=getComputedStyle(wrap),pl=px(s.paddingLeft),pr=px(s.paddingRight);if(r.right>w+2||r.left<-2)issues.push(`${name(wrap)} wrap escapes viewport [${r.left.toFixed(1)},${r.right.toFixed(1)}]`);if(w>=1024&&r.width>1400.5)issues.push(`${name(wrap)} content width ${r.width.toFixed(0)}px > 1400px`);if(w<=768&&!wrap.closest('.full-bleed,[data-full-bleed="true"],.gallery,.collage')&&r.width>=w-2&&Math.min(pl,pr)<12)issues.push(`${name(wrap)} full-width wrapper lacks internal gutter ${pl.toFixed(1)}/${pr.toFixed(1)}px`);if(w<=768&&r.width<w-2&&!wrap.closest('.full-bleed,[data-full-bleed="true"],.gallery,.collage')&&(r.left<12||r.right>w-12))issues.push(`${name(wrap)} mobile/tablet outer gutter [${r.left.toFixed(1)},${(w-r.right).toFixed(1)}]px`);if(w>=1024&&r.width<w-80&&abs(r.left-(w-r.right))>5)issues.push(`${name(wrap)} container not centered (${r.left.toFixed(1)} vs ${(w-r.right).toFixed(1)})`);
      }

      for(const h of document.querySelectorAll('main h1,main h2,main h3')){
        if(!visible(h))continue;let n=h.nextElementSibling;while(n&&!visible(n))n=n.nextElementSibling;if(!n||!n.matches('p,ul,ol,blockquote,.lead,.meta,.cards,.archive-grid,.press-facts'))continue;const a=h.getBoundingClientRect(),b=n.getBoundingClientRect(),gap=b.top-a.bottom;if(gap<4)issues.push(`${name(h)} → ${name(n)} gap ${gap.toFixed(1)}px too tight`);const pressHero=!!h.closest('.press-hero,[data-archive-page="press"]');if(gap>(pressHero?96:64)&&!h.closest('.hero'))issues.push(`${name(h)} → ${name(n)} vertical gap ${gap.toFixed(1)}px too loose`);
      }

      for(const el of document.querySelectorAll('.card,.archive-card,.press-fact,.press-record,.curatorial-period,.t-item')){
        if(!visible(el))continue;const s=getComputedStyle(el),r=el.getBoundingClientRect(),pl=px(s.paddingLeft),pr=px(s.paddingRight),pt=px(s.paddingTop),pb=px(s.paddingBottom);const wall=s.backgroundColor!=='rgba(0, 0, 0, 0)'||px(s.borderTopWidth)+px(s.borderRightWidth)+px(s.borderBottomWidth)+px(s.borderLeftWidth)>0;if(wall&&(pl<(w<=768?16:20)||pr<(w<=768?16:20)))issues.push(`${name(el)} cell horizontal padding ${pl.toFixed(0)}/${pr.toFixed(0)}px`);if(wall&&px(s.borderRadius)>28)issues.push(`${name(el)} radius ${s.borderRadius} > 28px`);if(r.width<120&&(el.innerText||'').trim().length>80)issues.push(`${name(el)} text cell width ${r.width.toFixed(0)}px`);if(pt>80||pb>80)issues.push(`${name(el)} cell vertical padding ${pt.toFixed(0)}/${pb.toFixed(0)}px`);
      }

      for(const grid of [...document.querySelectorAll('main [style*="grid"],main .grid,main .archive-grid,main .cards')].filter(visible)){
        if(grid.closest('.gallery,.collage,.record-gallery'))continue;const gs=getComputedStyle(grid);if(gs.display!=='grid'&&gs.display!=='inline-grid')continue;for(const child of [...grid.children].filter(visible)){const r=child.getBoundingClientRect();if((child.innerText||'').trim().length>120&&r.width<220)issues.push(`${name(child)} text column too narrow ${r.width.toFixed(0)}px`);}
      }

      if(w<=768){for(const el of [...document.querySelectorAll('button,summary,input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]),select,textarea,.btn,.menu-btn,.nav-links a')].filter(visible)){const r=el.getBoundingClientRect();if(r.height<43.5)issues.push(`${name(el)} touch height ${r.height.toFixed(1)}px < 44px`);if((el.matches('button,.menu-btn')||el.getAttribute('role')==='button')&&r.width<43.5)issues.push(`${name(el)} touch width ${r.width.toFixed(1)}px < 44px`);}}
      for(const el of [...document.querySelectorAll('main .hero a,main .hero button,main .cta-band a,main .cta-band button,main .press-hero a')].filter(visible)){if((el.innerText||'').trim().length>64)issues.push(`${name(el)} CTA label too long (${(el.innerText||'').trim().length} chars)`);}

      return {issues:[...new Set(issues)].slice(0,240),longText:longText.length,sections:[...document.querySelectorAll('main>section')].filter(visible).length};
    });
    reports.push({width,pathname,longText:result.longText,sections:result.sections,issues:result.issues.length});if(result.issues.length)failures.push(`${width}px ${pathname}: ${result.issues.join(' | ')}`);await page.close();
  }
  await context.close();
}
await browser.close();
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/apple-visual-quality.json',JSON.stringify({contract:'approved-art-visual-20260826',pages:pages.length,widths,reports,failures},null,2));
if(failures.length){console.error(`ART approved visual contract found ${failures.length} failing page/viewport combinations.`);console.error(failures.join('\n'));process.exit(1)}
console.log(`ART approved visual contract passed: ${pages.length} pages × ${widths.length} viewports; typography, weight, approved tracking, leading, alignment, reading measure, gutters, intentional constrained color surfaces, spacing rhythm, controls, grids and cell geometry verified.`);
