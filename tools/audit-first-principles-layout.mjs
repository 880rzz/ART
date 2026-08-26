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

      for(const el of document.querySelectorAll('main p,main li')){
        if(!visible(el)||(el.innerText||'').trim().length<140)continue;const r=el.getBoundingClientRect();if(w>=1024&&r.width>860)out.push(`${name(el)} long-form width ${r.width.toFixed(0)}px`);const s=getComputedStyle(el),lh=px(s.lineHeight),fs=px(s.fontSize);if(fs>0&&lh/fs<1.32)out.push(`${name(el)} body leading ${(lh/fs).toFixed(2)} < 1.32`)
      }

      for(const el of document.querySelectorAll('main section')){
        if(!visible(el)||el.matches('.hero,.hero-section,.statement,.archive-statement,.editorial-statement,.immersive,[data-layout="immersive"]')||el.closest('.gallery'))continue;const r=el.getBoundingClientRect(),text=(el.textContent||'').replace(/\s+/g,' ').trim(),media=el.querySelectorAll('img,video,figure,.gallery,.collage').length;if(w>=1024&&r.height>1500&&text.length<420&&media<2)out.push(`${name(el)} sparse section ${r.height.toFixed(0)}px / ${text.length} chars`);const s=getComputedStyle(el);if(w>=1024&&(px(s.paddingTop)>112||px(s.paddingBottom)>112)&&!el.matches('.presence-context'))out.push(`${name(el)} excessive section padding ${s.paddingTop}/${s.paddingBottom}`);const kids=[...el.children].filter(visible);if(kids.length){const first=kids[0].getBoundingClientRect(),last=kids[kids.length-1].getBoundingClientRect();const lim=w<=620?110:150;if(first.top-r.top>lim)out.push(`${name(el)} unexplained top whitespace ${(first.top-r.top).toFixed(0)}px`);if(r.bottom-last.bottom>lim)out.push(`${name(el)} unexplained bottom whitespace ${(r.bottom-last.bottom).toFixed(0)}px`)}}

      for(const h of document.querySelectorAll('main h1,main h2,header h1')){if(!visible(h))continue;const fs=px(getComputedStyle(h).fontSize),max=w<=430?50:w<=768?58:76;if(fs>max)out.push(`${name(h)} display size ${fs.toFixed(1)}px > ${max}px`)}

      const axisNodes=[...document.querySelectorAll('main>header .wrap,main>section.wrap')].filter(visible);if(axisNodes.length>1){const lefts=axisNodes.map(el=>el.getBoundingClientRect().left),spread=Math.max(...lefts)-Math.min(...lefts);if(spread>4.5)out.push(`editorial x-axis drift ${spread.toFixed(1)}px`)}
      for(const intro of document.querySelectorAll('main .section-head,main .section-intro,main .curatorial-periods__intro,main .press-section__intro')){if(!visible(intro))continue;const nodes=[...intro.children].filter(el=>visible(el)&&el.matches('h1,h2,h3,p,.lead,.label,.presence-kicker,.period-no'));if(nodes.length<2)continue;const lefts=nodes.map(el=>el.getBoundingClientRect().left),spread=Math.max(...lefts)-Math.min(...lefts);if(spread>5)out.push(`${name(intro)} optical-axis drift ${spread.toFixed(1)}px`)}

      for(const cell of document.querySelectorAll('.t-item,.press-fact,.press-record,.facts>div,[class$="__card"],.card,.curatorial-period,.press-card,.source-card,.archive-card,.writing-card,.cell,.panel')){if(!visible(cell))continue;const s=getComputedStyle(cell),r=cell.getBoundingClientRect();const wall=s.backgroundColor!=='rgba(0, 0, 0, 0)'||px(s.borderLeftWidth)+px(s.borderRightWidth)+px(s.borderTopWidth)+px(s.borderBottomWidth)>0;if(!wall)continue;const pl=px(s.paddingLeft),pr=px(s.paddingRight);if(pl<16||pr<16)out.push(`${name(cell)} cell padding ${pl.toFixed(0)}/${pr.toFixed(0)}px`);if(w<=620&&(cell.innerText||'').trim().length>100&&r.width<240)out.push(`${name(cell)} cramped mobile text cell ${r.width.toFixed(0)}px`)}

      /* Future-proof mobile density guard independent of class names. */
      if(w<=620){
        for(const layout of document.querySelectorAll('main *')){
          if(!visible(layout))continue;const s=getComputedStyle(layout);if(!['grid','flex'].includes(s.display))continue;
          const kids=[...layout.children].filter(visible);if(kids.length<2)continue;
          const rows=new Set(kids.map(k=>Math.round(k.getBoundingClientRect().top/4)*4));if(rows.size>=kids.length)continue;
          for(const kid of kids){const text=(kid.innerText||'').replace(/\s+/g,' ').trim();const r=kid.getBoundingClientRect();if(text.length>100&&r.width<240)out.push(`${name(layout)} generic cramped mobile child ${name(kid)} ${r.width.toFixed(0)}px`)}
        }
      }

      const eco=document.querySelector('footer .banhalmi-ecosystem');if(eco&&visible(eco)&&w>=1024){const links=[...eco.querySelectorAll(':scope > a')].filter(visible);if(links.length!==3)out.push(`footer ecosystem expected 3 links, found ${links.length}`);if(links.length===3){const rr=links.map(a=>a.getBoundingClientRect()),tops=rr.map(r=>r.top);if(Math.max(...tops)-Math.min(...tops)>2)out.push(`footer ecosystem wraps across rows`);const er=eco.getBoundingClientRect(),pageCenter=innerWidth/2,ecoCenter=(er.left+er.right)/2;if(Math.abs(ecoCenter-pageCenter)>3)out.push(`footer ecosystem off-centre by ${Math.abs(ecoCenter-pageCenter).toFixed(1)}px`)}}

      /* Main/footer distance only counts as dead space when nothing visible and substantive
         exists between the two landmarks. Record-depth and project-evidence disclosures are
         intentionally outside <main> on legacy archive pages and must not be misclassified. */
      const footer=document.querySelector('footer'),main=document.querySelector('main');
      if(main&&footer&&visible(main)&&visible(footer)){
        const gap=footer.getBoundingClientRect().top-main.getBoundingClientRect().bottom;
        if(gap>80){
          let node=main.nextElementSibling;let substantive=false;
          while(node&&node!==footer){
            if(visible(node)){
              const text=(node.innerText||node.textContent||'').replace(/\s+/g,' ').trim();
              const media=node.querySelectorAll?.('img,video,figure,svg,a,button,summary').length||0;
              if(text.length>20||media>0){substantive=true;break}
            }
            node=node.nextElementSibling;
          }
          if(!substantive)out.push(`main/footer unexplained gap ${gap.toFixed(0)}px`)
        }
      }

      for(const a of document.querySelectorAll('.site-header a.active,.site-header a[aria-current="page"],header[role="banner"] a.active,header[role="banner"] a[aria-current="page"]')){if(!visible(a))continue;const s=getComputedStyle(a);if(px(s.borderRadius)>8)out.push(`active navigation pill radius ${s.borderRadius}`);if(px(s.borderTopWidth)+px(s.borderRightWidth)+px(s.borderBottomWidth)+px(s.borderLeftWidth)>0)out.push(`active navigation framed`)}

      if(document.body.dataset.archivePage==='writing'){for(const el of document.querySelectorAll('main h1,main h2,main p,main li'))if(visible(el)&&getComputedStyle(el).textAlign!=='left')out.push(`writing text not left-aligned: ${name(el)}`)}
      if(document.body.dataset.recordType==='exhibition'){if(document.querySelector('details.record-gallery-disclosure'))out.push('exhibition gallery collapsed in disclosure');const more=document.getElementById('galmore');if(more&&visible(more))out.push('exhibition gallery more control remains visible')}
      if(document.body.classList.contains('press-page')){for(const fact of document.querySelectorAll('.press-fact')){if(!visible(fact))continue;const kids=[...fact.children].filter(visible);if(kids.length<2)continue;const a=kids[0].getBoundingClientRect(),b=kids[1].getBoundingClientRect(),same=Math.abs(a.top-b.top)<8;if(same&&b.left-a.right<10)out.push(`press fact fused`);if(!same&&b.top-a.bottom<7)out.push(`press fact vertical gap too small`)}}

      return [...new Set(out)].slice(0,160);
    });
    if(issues.length)failures.push(`${width}px ${pathname}: ${issues.join(' | ')}`);
    await page.close();
  }
  await context.close();
}
await browser.close();
if(failures.length){console.error(`First-principles ART layout audit found ${failures.length} failing page/viewport combinations.`);console.error(failures.join('\n'));process.exit(1)}
console.log(`First-principles ART layout audit passed: ${pages.length} pages across ${widths.length} widths; screenshot-derived axis, whitespace, reading measure, leading, cell inset, generic mobile density, navigation, Press and footer geometry are within contract.`);
