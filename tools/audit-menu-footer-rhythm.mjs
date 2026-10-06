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
  issues.push(...await page.evaluate(()=>{
   const issues=[];
   const email=document.querySelector('footer p.meta a');
   if(email&&parseFloat(getComputedStyle(email).paddingBottom)<6)issues.push('Footer email rule touches its label');
   for(const link of document.querySelectorAll('footer .banhalmi-ecosystem>a'))if(parseFloat(getComputedStyle(link).borderRightWidth)>0)issues.push('Redundant footer vertical separator');
   if(innerWidth<=560)for(const label of document.querySelectorAll('footer .socials.lang-switch>*'))if(parseFloat(getComputedStyle(label).paddingBottom)<12)issues.push('Footer language rule touches its label');
   for(const control of document.querySelectorAll('main .btn,main .actions a,main .gal-actions label,main .svc-cta')){
    const box=control.getBoundingClientRect();if(!box.width||!box.height||!parseFloat(getComputedStyle(control).borderWidth))continue;
    const range=document.createRange();range.selectNodeContents(control);const text=range.getBoundingClientRect();
    if(Math.min(text.left-box.left,box.right-text.right,text.top-box.top,box.bottom-text.bottom)<7)issues.push('Button border touches its label');
   }
   for(const row of document.querySelectorAll('main .gal-actions,main .actions,main .buttons,main .cta-row,main .hero-cta')){
    const note=row.nextElementSibling;if(!note?.matches('p,ul,blockquote'))continue;
    const controls=[...row.querySelectorAll('button,a,label')].map(e=>e.getBoundingClientRect()).filter(r=>r.width&&r.height);
    const noteBox=note.getBoundingClientRect();if(!controls.length||!noteBox.width||!noteBox.height)continue;
    if(noteBox.top-Math.max(...controls.map(r=>r.bottom))<20)issues.push('Supporting text touches the control row');
   }
   return issues;
  }));


  await page.locator('.banhalmi-contact-trigger').click();
  const contact=page.locator('.banhalmi-contact-panel');
  if(/\+43\s?677/.test(await contact.innerText()))issues.push('Contact number exposed before disclosure');
  const whatsapp=contact.locator('a[href*="wa.me/"]');
  if(!(await whatsapp.getAttribute('href')).includes('wa.me/4367761655592'))issues.push('Wrong WhatsApp contact authority');
  await contact.locator('[data-contact-kind="phone"]').click();
  const phone=contact.locator('a[href="tel:+4367761655592"]');
  if(await phone.count()!==1||!(await phone.innerText()).includes('+43 677 616 55592'))issues.push('Phone disclosure did not reveal the callable number');
  if(!(await phone.evaluate(e=>document.activeElement===e)))issues.push('Phone disclosure lost keyboard focus');
  await contact.locator('.banhalmi-contact-close').click();
  for(const issue of issues)failures.push({width,route,issue});states++;
 }
 await page.close();
}
await browser.close();fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/menu-footer-rhythm.json',JSON.stringify({states,widths,failures},null,2));
if(failures.length){console.error(JSON.stringify(failures));process.exit(1);}console.log(`Menu/footer overlay rhythm passed: ${states} page/viewport states.`);
