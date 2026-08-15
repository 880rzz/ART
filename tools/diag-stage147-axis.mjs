import { chromium } from 'playwright';
const base=process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:390,height:1000},deviceScaleFactor:1});
for(const pathname of ['/exhibitions/anovilaga.html','/hu/exhibitions/anovilaga.html','/de-at/exhibitions/anovilaga.html']){
  const page=await ctx.newPage();
  await page.goto(new URL(pathname,base).href,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(300);
  const data=await page.evaluate(()=>{
    const nodes=[...document.querySelectorAll('main>header .wrap,main>section.wrap')].filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width&&r.height&&s.display!=='none'});
    const snap=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {tag:el.tagName,cls:el.className,left:r.left,right:r.right,width:r.width,marginLeft:s.marginLeft,marginRight:s.marginRight,paddingLeft:s.paddingLeft,paddingRight:s.paddingRight,position:s.position,leftCss:s.left,transform:s.transform,parent:el.parentElement?{tag:el.parentElement.tagName,cls:el.parentElement.className,left:el.parentElement.getBoundingClientRect().left,width:el.parentElement.getBoundingClientRect().width,paddingLeft:getComputedStyle(el.parentElement).paddingLeft,marginLeft:getComputedStyle(el.parentElement).marginLeft}:null}};
    return {bodyDataset:{...document.body.dataset},main:snap(document.querySelector('main')),nodes:nodes.map(snap)};
  });
  console.log('\n'+pathname+'\n'+JSON.stringify(data,null,2));
  await page.close();
}
await browser.close();
