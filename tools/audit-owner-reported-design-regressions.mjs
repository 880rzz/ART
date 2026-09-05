import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173';
const siteDir=path.resolve(process.env.AUDIT_SITE_DIR||'_site');
const widths=[375,390,430,768,1024,1280,1440];
const candidates=['/','/hu/','/de-at/','/curators.html','/hu/curators.html','/de-at/curators.html','/press.html','/hu/press.html','/de-at/press.html','/writing.html','/hu/writing.html','/de-at/writing.html','/community.html','/hu/community.html','/de-at/community.html','/books/book-anovilaga.html','/hu/books/book-anovilaga.html','/de-at/books/book-anovilaga.html'];
const pages=candidates.filter(p=>fs.existsSync(path.join(siteDir,p==='/'?'index.html':p.replace(/^\//,''))));
const failures=[];
const browser=await chromium.launch({headless:true});
for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1});
  for(const pathname of pages){
    const page=await context.newPage();
    await page.goto(new URL(pathname,base).href,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForTimeout(180);
    const issues=await page.evaluate(()=>{
      const out=[];const px=v=>parseFloat(v)||0;const vis=e=>{if(!e)return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};const w=innerWidth;
      const ident=e=>`${e.tagName.toLowerCase()}${e.id?'#'+e.id:''}${e.className?'.'+String(e.className).trim().replace(/\s+/g,'.'):''}`;
      if(document.documentElement.scrollWidth>w+2)out.push(`horizontal overflow ${document.documentElement.scrollWidth-w}px`);
      for(const h of document.querySelectorAll('main h1,main h2,main h3')){if(!vis(h))continue;const fs=px(getComputedStyle(h).fontSize);const max=h.matches('h1')?(w<=430?50:w<=768?58:62):h.matches('h2')?(w<=430?40:42):28;if(fs>max)out.push(`${h.tagName} oversized ${fs.toFixed(1)}>${max}`)}
      for(const intro of document.querySelectorAll('main .section-head,main .section-intro,main .curatorial-periods__intro,main .press-section__intro')){if(!vis(intro))continue;const kids=[...intro.children].filter(e=>vis(e)&&e.matches('h1,h2,h3,p,.lead,.label,.kicker,.eyebrow'));if(kids.length<2)continue;const lefts=kids.map(e=>e.getBoundingClientRect().left),spread=Math.max(...lefts)-Math.min(...lefts);if(spread>5){const parts=kids.map(e=>`${ident(e)}@${e.getBoundingClientRect().left.toFixed(1)}w${e.getBoundingClientRect().width.toFixed(1)} ml=${getComputedStyle(e).marginLeft} mr=${getComputedStyle(e).marginRight}`);out.push(`editorial-axis drift ${ident(intro)} spread=${spread.toFixed(1)} [${parts.join('; ')}]`)}}
      const main=document.querySelector('main'),footer=document.querySelector('footer');if(vis(main)&&vis(footer)){const mr=main.getBoundingClientRect(),fr=footer.getBoundingClientRect(),gap=fr.top-mr.bottom;if(gap>80){let node=main.nextElementSibling,substantive=false;const between=[];while(node&&node!==footer){if(vis(node)){const r=node.getBoundingClientRect(),text=(node.innerText||node.textContent||'').replace(/\s+/g,' ').trim(),media=node.querySelectorAll?.('img,video,figure,svg,a,button,summary').length||0;between.push(`${ident(node)} h=${r.height.toFixed(0)} text=${text.length} media=${media}${node.matches('details')?` open=${node.open}`:''}`);if(text.length>20||media>0)substantive=true}node=node.nextElementSibling}if(!substantive){const bs=getComputedStyle(document.body),ms=getComputedStyle(main),fs=getComputedStyle(footer);out.push(`main/footer empty gap ${gap.toFixed(0)}px bodyDisplay=${bs.display} bodyMinH=${bs.minHeight} mainFlex=${ms.flex} footerMarginTop=${fs.marginTop} between=[${between.join(', ')}]`)} }}
      if(document.body.dataset.archivePage==='press'){for(const details of document.querySelectorAll('.press-archive-disclosure')){if(!vis(details))continue;details.open=true;const records=details.querySelector('.press-period .grid,.press-records');if(vis(records)){const rr=records.getBoundingClientRect(),dr=details.getBoundingClientRect();if(w>=1024&&rr.width<Math.min(760,dr.width*.72))out.push(`press open state too narrow ${rr.width.toFixed(0)}px`)}for(const grid of details.querySelectorAll('.press-period .grid')){if(vis(grid)&&getComputedStyle(grid).gridTemplateColumns.split(' ').length!==1)out.push('press open grid not single-column')}}}
      if(document.body.dataset.archivePage==='curators'){for(const grid of document.querySelectorAll('.curatorial-periods__grid')){if(!vis(grid))continue;const gap=px(getComputedStyle(grid).columnGap)||px(getComputedStyle(grid).gap);if(gap>40)out.push(`curators grid gap too wide ${gap.toFixed(0)}px`)}}
      if(w<=430){for(const collage of document.querySelectorAll('.collage')){if(!vis(collage))continue;const cols=getComputedStyle(collage).columnCount;if(Number(cols)>1)out.push(`mobile gallery remains ${cols} columns`)}}
      const eco=document.querySelector('footer .banhalmi-ecosystem');if(vis(eco)&&w>=1024){const links=[...eco.querySelectorAll(':scope>a')].filter(vis);if(links.length===3){const tops=links.map(a=>Math.round(a.getBoundingClientRect().top));if(new Set(tops).size!==1)out.push('footer ecosystem wraps on desktop');const r=eco.getBoundingClientRect();if(Math.abs((r.left+r.right)/2-innerWidth/2)>4)out.push('footer ecosystem off-centre')}}
      return [...new Set(out)];
    });
    if(issues.length)failures.push(`${width}px ${pathname}: ${issues.join(' | ')}`);
    await page.close();
  }
  await context.close();
}
await browser.close();
if(failures.length){console.error('Owner-reported ART design regression diagnostic failed:\n'+failures.join('\n'));process.exit(1)}
console.log(`Owner-reported ART design regression diagnostic passed: ${pages.length} pages × ${widths.length} required widths.`);
