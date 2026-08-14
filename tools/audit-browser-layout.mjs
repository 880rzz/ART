import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4173';
const paths = (process.env.AUDIT_PATHS || '/,/hu/,/de-at/,/exhibitions/ebredes.html,/books/book-ebredes.html,/curators.html').split(',').filter(Boolean);
const widths = [390,430,768,1024,1280,1440];
const failures=[];
fs.mkdirSync('artifacts/browser-layout',{recursive:true});
const browser=await chromium.launch({headless:true});
for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:width<=430?900:1000},deviceScaleFactor:1});
  for(const pathname of paths){
    const page=await context.newPage();
    const jsErrors=[];
    page.on('pageerror',e=>jsErrors.push(e.message));
    const response=await page.goto(new URL(pathname,base).href,{waitUntil:'domcontentloaded',timeout:30000});
    if(!response||!response.ok()) failures.push(`${width}px ${pathname}: HTTP ${response?.status() ?? 'no response'}`);
    await page.waitForTimeout(350);
    const result=await page.evaluate(()=>{
      const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0};
      const doc=document.documentElement,body=document.body;
      const overflow=Math.max(doc.scrollWidth,body.scrollWidth)-window.innerWidth;
      const alignSelectors=['.section-head','.section-intro','.intro','.prose','.copy','.text','.timeline','.chronology','.faq','.form','.legal','.archive-grid','.project-grid','.record-grid','.source-grid'];
      const badAlign=[];
      for(const sel of alignSelectors) for(const el of document.querySelectorAll(sel)){
        if(!visible(el)||el.closest('.statement,.archive-statement,.editorial-statement,.text-center,.cta-band')) continue;
        const a=getComputedStyle(el).textAlign;
        if(a!=='left'&&a!=='start') badAlign.push(`${sel}:${a}`);
      }
      const badTargets=[];
      if(window.innerWidth<=768){
        for(const el of document.querySelectorAll('.btn,button,.menu-btn,.burger,summary,input[type="submit"],input[type="button"],select')){
          if(!visible(el)) continue;
          const r=el.getBoundingClientRect();
          if(r.height<43.5) badTargets.push(`${el.tagName.toLowerCase()}.${el.className||''}:${r.height.toFixed(1)}px`);
        }
      }
      return {overflow,badAlign:[...new Set(badAlign)].slice(0,20),badTargets:[...new Set(badTargets)].slice(0,20)};
    });
    if(result.overflow>2) failures.push(`${width}px ${pathname}: horizontal overflow ${result.overflow}px`);
    if(result.badAlign.length) failures.push(`${width}px ${pathname}: non-left editorial axis ${result.badAlign.join(', ')}`);
    if(result.badTargets.length) failures.push(`${width}px ${pathname}: touch targets below 44px ${result.badTargets.join(', ')}`);
    if(jsErrors.length) failures.push(`${width}px ${pathname}: page errors ${jsErrors.join(' | ')}`);
    const safe=pathname==='/'?'home':pathname.replace(/^\/+|\/+$/g,'').replace(/[^a-z0-9]+/gi,'-');
    await page.screenshot({path:path.join('artifacts/browser-layout',`${width}-${safe}.png`),fullPage:true});
    await page.close();
  }
  await context.close();
}
await browser.close();
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`Browser layout audit passed for ${paths.length} ART page types across ${widths.length} responsive widths.`);
