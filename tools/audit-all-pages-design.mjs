import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl=(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const siteDir=process.env.AUDIT_SITE_DIR||'_site';
const widths=(process.env.ART_DESIGN_WIDTHS||'390,768,1440').split(',').map(Number).filter(Boolean);
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,e.name);if(e.isDirectory())walk(full);else if(e.isFile()&&e.name.endsWith('.html'))files.push(full)}}
walk(siteDir);
const contentFiles=files.filter(file=>{
  const rel=path.relative(siteDir,file).replaceAll('\\','/');
  const html=fs.readFileSync(file,'utf8');
  if(rel.startsWith('redirects/')) return false;
  if(/http-equiv=["']refresh["']/i.test(html)&&html.length<6000) return false;
  return /<main\b/i.test(html)&&!/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html);
});
function urlFor(file){let rel=path.relative(siteDir,file).replaceAll('\\','/');rel=rel.replace(/index\.html$/,'');return `${baseUrl}/${rel}`.replace(/([^:]\/)\/+/g,'$1')}
const browser=await chromium.launch({headless:true});
const failures=[];let checks=0;
for(const width of widths){const page=await browser.newPage({viewport:{width,height:1100}});for(const file of contentFiles){const rel=path.relative(siteDir,file).replaceAll('\\','/');await page.goto(urlFor(file),{waitUntil:'networkidle'});const r=await page.evaluate(()=>{
  const de=document.documentElement, body=document.body, main=document.querySelector('main');
  const nav=document.querySelector('body>nav');
  const visible=el=>{if(!el)return false;const s=getComputedStyle(el),b=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&b.width>0&&b.height>0};
  const outside=[];
  for(const el of document.querySelectorAll('h1,h2,h3,p,li,blockquote,a,button,summary')){if(!visible(el))continue;const b=el.getBoundingClientRect();if(b.right>innerWidth+2||b.left<-2)outside.push(`${el.tagName.toLowerCase()}.${el.className||''} [${b.left.toFixed(1)},${b.right.toFixed(1)}]`);if(outside.length>=6)break;}
  const axis=[];
  for(const c of document.querySelectorAll('main .wrap.narrow')){if(!visible(c))continue;const cr=c.getBoundingClientRect();const cs=getComputedStyle(c);const expected=cr.left+(parseFloat(cs.paddingLeft)||0);for(const el of c.querySelectorAll(':scope > h1,:scope > h2,:scope > h3,:scope > p.lead,:scope > p.meta,:scope > .note')){if(!visible(el))continue;const x=el.getBoundingClientRect().left;if(Math.abs(x-expected)>5)axis.push(`${el.tagName.toLowerCase()}.${el.className||''} offset=${(x-expected).toFixed(1)}px`);}}
  const pressFacts=document.querySelector('.press-facts');let press=null;if(visible(pressFacts)){const facts=[...pressFacts.querySelectorAll('.press-fact')].filter(visible);press={count:facts.length,issues:[]};for(const fact of facts){const s=getComputedStyle(fact),b=fact.getBoundingClientRect(),strong=fact.querySelector('strong'),span=fact.querySelector('span');if(!strong||!span)press.issues.push('missing value/label');if(s.display!=='flex'&&s.display!=='grid')press.issues.push(`fact display=${s.display}`);if(b.width<100)press.issues.push(`fact width=${b.width.toFixed(1)}`);if(strong&&span&&strong.getBoundingClientRect().bottom>span.getBoundingClientRect().top+2)press.issues.push('value/label overlap');}}
  const first=main?[...main.querySelectorAll('h1,h2')].find(visible):null;const navBottom=visible(nav)?nav.getBoundingClientRect().bottom:0;const firstTop=first?first.getBoundingClientRect().top:null;
  const footer=document.querySelector('footer');const footerHeight=visible(footer)?footer.getBoundingClientRect().height:0;
  return {overflow:de.scrollWidth-de.clientWidth,outside,axis,press,navHeight:visible(nav)?nav.getBoundingClientRect().height:0,firstGap:firstTop==null?null:firstTop-navBottom,footerHeight,bodyWidth:body.getBoundingClientRect().width};
});
  if(r.overflow>1)failures.push(`${rel} @${width}: horizontal overflow ${r.overflow}px`);
  for(const x of r.outside)failures.push(`${rel} @${width}: viewport escape ${x}`);
  for(const x of r.axis)failures.push(`${rel} @${width}: editorial axis drift ${x}`);
  if(r.press){if(r.press.count!==4)failures.push(`${rel} @${width}: press facts count ${r.press.count}`);for(const x of r.press.issues)failures.push(`${rel} @${width}: press facts ${x}`);}
  if(r.navHeight&& (r.navHeight<48||r.navHeight>96))failures.push(`${rel} @${width}: nav height ${r.navHeight.toFixed(1)}px`);
  if(r.firstGap!=null&&r.firstGap>300)failures.push(`${rel} @${width}: excessive nav-to-first-heading gap ${r.firstGap.toFixed(1)}px`);
  if(r.footerHeight>1100)failures.push(`${rel} @${width}: footer height ${r.footerHeight.toFixed(1)}px`);
  checks++;
}
await page.close();}
await browser.close();
if(failures.length){console.error(`ART exhaustive design audit failed (${failures.length} issue(s), ${checks} route/viewport checks):`);for(const f of failures.slice(0,250))console.error(`- ${f}`);if(failures.length>250)console.error(`... ${failures.length-250} more`);process.exit(1)}
console.log(`ART exhaustive design audit passed: ${contentFiles.length} content pages × ${widths.length} viewports = ${checks} render checks.`);
