import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const siteDir=path.resolve(process.env.AUDIT_SITE_DIR||'_site');
const widths=[390,768,1024,1440];
const failures=[];
let checks=0, expandedPages=0, expandedDetails=0;
function walk(d){const out=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())out.push(...walk(f));else if(e.isFile()&&e.name.endsWith('.html'))out.push(f)}return out}
function toUrl(file){const rel=path.relative(siteDir,file).split(path.sep).join('/');if(rel==='index.html')return '/';if(rel.endsWith('/index.html'))return `/${rel.slice(0,-10)}`;return `/${rel}`}
const pages=[...new Set(walk(siteDir).filter(file=>{const h=fs.readFileSync(file,'utf8');return /<main\b/i.test(h)&&!/http-equiv=["']refresh["']/i.test(h)&&/assets\/css\//i.test(h)}).map(toUrl))].sort();
const browser=await chromium.launch({headless:true});
for(const width of widths){
 const ctx=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1});
 for(const pathname of pages){
  const page=await ctx.newPage();
  await page.goto(base+pathname,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(120);
  const result=await page.evaluate(()=>{
   const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0};
   const candidates=[...document.querySelectorAll('main details,footer details')].filter(d=>{const s=d.querySelector(':scope>summary');return s&&visible(s)});
   for(const d of candidates)d.open=true;
   const local=[];
   for(const d of candidates){
    const r=d.getBoundingClientRect();
    if(r.left<-1||r.right>innerWidth+1)local.push(`details out of viewport: ${d.className||d.id||'details'} ${r.left.toFixed(1)}..${r.right.toFixed(1)}`);
    const summary=d.querySelector(':scope>summary');
    if(summary){const sr=summary.getBoundingClientRect();if(sr.height<40)local.push(`summary target too short: ${d.className||d.id||'details'} ${sr.height.toFixed(1)}px`)}
    for(const el of [...d.children].slice(1)){
      if(!visible(el))continue;const er=el.getBoundingClientRect();if(er.left<-1||er.right>innerWidth+1)local.push(`expanded child overflow: ${el.className||el.tagName} ${er.left.toFixed(1)}..${er.right.toFixed(1)}`);
    }
   }
   for(const d of document.querySelectorAll('footer .footer-social-disclosure[open]')){
    if(!visible(d))continue;const links=d.querySelector('.footer-social-links');if(links&&visible(links)){const r=links.getBoundingClientRect(),center=(r.left+r.right)/2;if(Math.abs(center-innerWidth/2)>4)local.push(`footer social links off-centre by ${Math.abs(center-innerWidth/2).toFixed(1)}px`);const s=getComputedStyle(links);if(s.textAlign!=='center'&&s.justifyContent!=='center')local.push('footer social links are not centered')}
   }
   const overflow=document.documentElement.scrollWidth-document.documentElement.clientWidth;if(overflow>1)local.push(`horizontal overflow ${overflow}px`);
   return {count:candidates.length,failures:[...new Set(local)]};
  });
  if(result.count){expandedPages++;expandedDetails+=result.count}
  for(const issue of result.failures)failures.push(`${width}px ${pathname}: ${issue}`);
  checks++;await page.close();
 }
 await ctx.close();
}
await browser.close();
if(failures.length){console.error(`Expanded-state responsive audit failed (${failures.length} issue(s), ${checks} page/viewport checks):`);for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log(`Expanded-state responsive audit passed: ${pages.length} pages × ${widths.length} widths; ${expandedPages} page/viewport states opened, ${expandedDetails} visible main/footer disclosures verified.`);
