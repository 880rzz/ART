import fs from 'node:fs';
import { chromium } from 'playwright';
const base=(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const routes=[...fs.readFileSync('sitemap.xml','utf8').matchAll(/<loc>https:\/\/www\.banhalmi\.art([^<]*)<\/loc>/g)].map(m=>m[1]||'/');
const widths=[375,390,768,1440];
const browser=await chromium.launch();const failures=[];let states=0;
for(const width of widths){
 const page=await browser.newPage({viewport:{width,height:844}});
 for(const route of routes){
  await page.goto(base+route);await page.locator('.burger').first().click();
  await page.waitForFunction(()=>document.querySelector('main').inert);
  const issues=await page.evaluate(()=>{
   const issues=[];const menu=document.querySelector('#menu'),nav=document.querySelector('body>nav');
   if(menu.getBoundingClientRect().top>nav.getBoundingClientRect().bottom+.1)issues.push('Background gap between header and menu');
   if(getComputedStyle(menu).backgroundColor!=='rgb(32, 37, 48)')issues.push('Menu background is translucent');
   const dock=document.querySelector('.banhalmi-contact-dock');
   if(dock&&getComputedStyle(dock).visibility!=='hidden')issues.push('Contact dock covers the menu');
   for(const description of menu.querySelectorAll('.m-desc')){
    const next=description.nextElementSibling;
    if(next?.matches('.m-main')&&next.getBoundingClientRect().top-description.getBoundingClientRect().bottom<16)issues.push('Description touches the next menu rule');
   }
   menu.scrollTop=menu.scrollHeight;
   for(const link of menu.querySelectorAll('.m-foot a')){
    const r=link.getBoundingClientRect();if(r.width&&r.top>nav.getBoundingClientRect().bottom&&r.bottom<innerHeight){const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(!link.contains(hit))issues.push('Menu footer link is covered');}
   }
   return issues;
  });
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('main').inert);
  const closed=await page.evaluate(()=>!document.querySelector('main').inert&&!document.body.classList.contains('menu-open'));
  if(!closed)issues.push('Closing menu did not restore the page');
  for(const issue of issues)failures.push({width,route,issue});states++;
 }
 await page.close();
}
await browser.close();fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/menu-footer-rhythm.json',JSON.stringify({states,widths,failures},null,2));
if(failures.length){console.error(JSON.stringify(failures));process.exit(1);}console.log(`Menu/footer overlay rhythm passed: ${states} page/viewport states.`);
