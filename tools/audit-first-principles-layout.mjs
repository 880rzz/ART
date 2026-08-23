import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173';
const siteDir=path.resolve(process.env.AUDIT_SITE_DIR||'_site');
const widths=[390,768,1024,1440];
const failures=[];

function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(f));else if(e.isFile()&&e.name.endsWith('.html'))out.push(f)}return out}
function toUrl(file){const rel=path.relative(siteDir,file).split(path.sep).join('/');if(rel==='index.html')return '/';if(rel.endsWith('/index.html'))return `/${rel.slice(0,-10)}`;return `/${rel}`}
function discover(){const pages=[];for(const file of walk(siteDir)){const html=fs.readFileSync(file,'utf8');if(!/<main\b/i.test(html)||/http-equiv=["']refresh["']/i.test(html)||!/assets\/css\//i.test(html))continue;pages.push(toUrl(file))}return [...new Set(pages)].sort()}
const pages=discover();
const browser=await chromium.launch({headless:true});

for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1});
  for(const pathname of pages){
    const page=await context.newPage();
    try{await page.goto(new URL(pathname,base).href,{waitUntil:'domcontentloaded',timeout:30000})}catch(e){failures.push(`${width}px ${pathname}: navigation ${e.message}`);await page.close();continue}
    await page.waitForTimeout(180);
    const issues=await page.evaluate(()=>{
      const out=[];
      const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0};
      const px=v=>parseFloat(v)||0;
      const name=el=>`${el.tagName.toLowerCase()}${el.id?'#'+el.id:''}${el.className?'.'+String(el.className).trim().replace(/\s+/g,'.').slice(0,90):''}`;
      const w=innerWidth;

      // First principle: long-form text should not span billboard widths.
      for(const el of document.querySelectorAll('main p,main li')){
        if(!visible(el)||(el.innerText||'').trim().length<140)continue;
        const r=el.getBoundingClientRect();
        if(w>=1024&&r.width>860)out.push(`${name(el)} long-form width ${r.width.toFixed(0)}px`);
      }

      // First principle: regular sections should not consume huge empty slabs.
      for(const el of document.querySelectorAll('main section')){
        if(!visible(el)||el.matches('.statement,.archive-statement,.editorial-statement')||el.closest('.gallery'))continue;
        const r=el.getBoundingClientRect(),text=(el.textContent||'').replace(/\s+/g,' ').trim();
        const media=el.querySelectorAll('img,video,figure,.gallery,.collage').length;
        if(w>=1024&&r.height>1500&&text.length<420&&media<2)out.push(`${name(el)} sparse section ${r.height.toFixed(0)}px / ${text.length} chars`);
        const s=getComputedStyle(el); if(w>=1024&&(px(s.paddingTop)>132||px(s.paddingBottom)>132)&&!el.matches('.hero,.presence-context'))out.push(`${name(el)} excessive section padding ${s.paddingTop}/${s.paddingBottom}`);
      }

      // Headings must dominate, not consume the interface.
      for(const h of document.querySelectorAll('main h1,main h2,header h1')){
        if(!visible(h))continue; const fs=px(getComputedStyle(h).fontSize);
        const max=w<=430?50:w<=768?58:70;
        if(fs>max)out.push(`${name(h)} display size ${fs.toFixed(1)}px > ${max}px`);
      }

      // ART footer: the three ecosystem destinations are one centered line on desktop.
      const eco=document.querySelector('footer .banhalmi-ecosystem');
      if(eco&&visible(eco)&&w>=1024){
        const links=[...eco.querySelectorAll(':scope > a')].filter(visible);
        if(links.length!==3)out.push(`footer ecosystem expected 3 links, found ${links.length}`);
        if(links.length===3){
          const rr=links.map(a=>a.getBoundingClientRect());
          const tops=rr.map(r=>r.top); if(Math.max(...tops)-Math.min(...tops)>2)out.push(`footer ecosystem wraps across rows`);
          for(let i=0;i<3;i++){
            const range=document.createRange();range.selectNodeContents(links[i]);
            const textLines=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0);
            const lineTops=[...new Set(textLines.map(r=>Math.round(r.top)))];
            if(lineTops.length>1)out.push(`footer ecosystem link ${i+1} wraps (${lineTops.length} lines)`);
          }
          const er=eco.getBoundingClientRect(),pageCenter=innerWidth/2,ecoCenter=(er.left+er.right)/2;
          if(Math.abs(ecoCenter-pageCenter)>3)out.push(`footer ecosystem off-centre by ${Math.abs(ecoCenter-pageCenter).toFixed(1)}px`);
          const centres=rr.map(r=>(r.left+r.right)/2),g1=centres[1]-centres[0],g2=centres[2]-centres[1];
          if(Math.abs(g1-g2)>12)out.push(`footer ecosystem unbalanced centres ${g1.toFixed(1)}/${g2.toFixed(1)}px`);
        }
      }

      // Screenshot contract: all constrained hero/section wrappers share one x-axis.
      const axisNodes=[...document.querySelectorAll('main>header .wrap,main>section.wrap')].filter(visible);
      if(axisNodes.length>1){
        const lefts=axisNodes.map(el=>el.getBoundingClientRect().left);
        const spread=Math.max(...lefts)-Math.min(...lefts);
        if(spread>3){
          const geometry=axisNodes.map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return `${name(el)}@left=${r.left.toFixed(1)},width=${r.width.toFixed(1)},ml=${s.marginLeft},mr=${s.marginRight},pl=${s.paddingLeft},pr=${s.paddingRight},transform=${s.transform}`}).join(' ; ');
          out.push(`editorial x-axis drift ${spread.toFixed(1)}px [${geometry}]`);
        }
      }

      // Screenshot contract: text may never sit on a real visible cell wall.
      // Legacy structural wrappers whose class happens to end in __card but have
      // no visible background/border are not cells and must not create false alarms.
      for(const cell of document.querySelectorAll('.t-item,.press-fact,.press-record,.facts>div,[class$="__card"]')){
        if(!visible(cell))continue;
        const s=getComputedStyle(cell);
        const semanticCell=cell.matches('.t-item,.press-fact,.press-record,.facts>div');
        const visibleWall=s.backgroundColor!=='rgba(0, 0, 0, 0)'||px(s.borderLeftWidth)>0||px(s.borderRightWidth)>0||px(s.borderTopWidth)>0||px(s.borderBottomWidth)>0;
        if(!semanticCell&&!visibleWall)continue;
        const pl=px(s.paddingLeft),pr=px(s.paddingRight);if(pl<16||pr<16)out.push(`${name(cell)} cell padding ${pl.toFixed(0)}/${pr.toFixed(0)}px`);
      }

      // Writing is deliberately left-aligned at every viewport and uses only the
      // approved deep/light blue pair.
      if(document.body.dataset.archivePage==='writing'){
        for(const el of document.querySelectorAll('main h1,main h2,main p,main li')){if(visible(el)&&getComputedStyle(el).textAlign!=='left')out.push(`writing text not left-aligned: ${name(el)}`);}
        for(const section of document.querySelectorAll('main>section')){if(!visible(section))continue;const c=getComputedStyle(section,'::before').backgroundColor.replace(/\s+/g,'');if(c&&c!=='rgba(0,0,0,0)'&&c!=='rgb(32,37,48)'&&c!=='rgb(45,52,68)')out.push(`writing section surface ${c}`);}
      }

      // Exhibition record galleries stay open; they are never hidden behind a
      // disclosure or a progressive "more" control.
      if(document.body.dataset.recordType==='exhibition'){
        if(document.querySelector('details.record-gallery-disclosure'))out.push('exhibition gallery collapsed in disclosure');
        if([...document.querySelectorAll('.gal-batch[hidden]')].some(el=>visible(el)===false))out.push('exhibition gallery batch remains hidden');
        const more=document.getElementById('galmore');if(more&&visible(more))out.push('exhibition gallery more control remains visible');
      }

      // Press is information-dense: values, labels and periods must never fuse.
      if(document.body.classList.contains('press-page')){
        for(const fact of document.querySelectorAll('.press-fact')){
          if(!visible(fact))continue;const kids=[...fact.children].filter(visible);if(kids.length<2)continue;
          const a=kids[0].getBoundingClientRect(),b=kids[1].getBoundingClientRect();
          const same=Math.abs(a.top-b.top)<8;
          if(same&&b.left-a.right<10)out.push(`press fact fused: ${(fact.innerText||'').replace(/\s+/g,' ').trim()}`);
          if(!same&&b.top-a.bottom<7)out.push(`press fact vertical gap too small`);
        }
        const nav=document.querySelector('.press-period-nav');
        if(nav&&visible(nav)){
          for(const a of nav.querySelectorAll('a')){
            const kids=[...a.children].filter(visible);for(let i=1;i<kids.length;i++){const x=kids[i-1].getBoundingClientRect(),y=kids[i].getBoundingClientRect();if(Math.abs(x.top-y.top)<8&&y.left-x.right<10)out.push(`press period components fused`)}
          }
        }
      }

      return [...new Set(out)].slice(0,80);
    });
    if(issues.length)failures.push(`${width}px ${pathname}: ${issues.join(' | ')}`);
    await page.close();
  }
  await context.close();
}
await browser.close();
if(failures.length){console.error(`First-principles ART layout audit found ${failures.length} failing page/viewport combinations.`);console.error(failures.join('\n'));process.exit(1)}
console.log(`First-principles ART layout audit passed: ${pages.length} pages across ${widths.length} widths; density, hierarchy, cell walls, Writing, exhibitions, Press and footer geometry are within contract.`);
