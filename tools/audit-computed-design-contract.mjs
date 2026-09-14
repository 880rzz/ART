import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173';
const siteDir=path.resolve(process.env.AUDIT_SITE_DIR||'_site');
const design=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const widths=[1280,1440,1920];
const failures=[];
function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(f));else if(e.isFile()&&e.name.endsWith('.html'))out.push(f)}return out}
function toUrl(file){const rel=path.relative(siteDir,file).split(path.sep).join('/');if(rel==='index.html')return '/';if(rel.endsWith('/index.html'))return `/${rel.slice(0,-10)}`;return `/${rel}`}
function discover(){return [...new Set(walk(siteDir).filter(file=>{const html=fs.readFileSync(file,'utf8');return /<main\b/i.test(html)&&!/http-equiv=["']refresh["']/i.test(html)&&/assets\/css\//i.test(html)}).map(toUrl))].sort()}
const pages=discover();
const browser=await chromium.launch({headless:true});
for(const width of widths){
 const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1});
 for(const pathname of pages){
  const page=await context.newPage();
  try{await page.goto(new URL(pathname,base).href,{waitUntil:'domcontentloaded',timeout:30000})}catch(e){failures.push(`${width}px ${pathname}: navigation ${e.message}`);await page.close();continue}
  await page.waitForTimeout(120);
  const issues=await page.evaluate(({design,width,route})=>{
   const out=[],d=design.desktop||{};
   const visible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0};
   const rect=el=>el.getBoundingClientRect();const nm=el=>`${el.tagName.toLowerCase()}${el.id?'#'+el.id:''}${el.className?'.'+String(el.className).trim().replace(/\s+/g,'.').slice(0,70):''}`;
   const tol=Number(d.axisTolerancePx||6),proseMax=Number(d.proseMaxPx||860),g=Number(d.gutterPx||36),pageMax=Number(design.pageMaxPx||1440);
   const expectedPageWidth=Math.min(width-2*g,pageMax),expectedLeft=(width-expectedPageWidth)/2;
   const axis=(els,label,left)=>{for(const el of els.filter(visible)){const r=rect(el);if(Math.abs(r.left-left)>tol)out.push(`${label} ${nm(el)} left ${r.left.toFixed(1)}px vs ${left.toFixed(1)}px`)}};
   const outer=[...document.querySelectorAll('main>header.sub>.wrap.narrow,main>section.wrap.narrow,main>section:not([data-layout="centered"])>.wrap.narrow,body[data-archive-page="curators"] main>.curatorial-periods>.wrap')].filter(visible);
   for(const w of outer){const r=rect(w);if(Math.abs(r.left-expectedLeft)>tol)out.push(`${nm(w)} outer page axis ${r.left.toFixed(1)}px != ${expectedLeft.toFixed(1)}px`);if(r.width<expectedPageWidth-2)out.push(`${nm(w)} outer canvas ${r.width.toFixed(0)}px < ${expectedPageWidth.toFixed(0)}px`);const direct=[...w.querySelectorAll(':scope > .label,:scope > .eyebrow,:scope > .kicker,:scope > h1,:scope > h2,:scope > h3,:scope > p,:scope > .lead,:scope > .description,:scope > .section-description')];axis(direct,`outer ${route}`,r.left);for(const p of direct)if(visible(p)&&p.matches('p,.lead,.description,.section-description')&&rect(p).width>proseMax+2)out.push(`${nm(p)} prose ${rect(p).width.toFixed(0)}px > ${proseMax}px`)}
   const recordCheck=(selector,max,label)=>{for(const rec of document.querySelectorAll(selector)){if(!visible(rec))continue;const r=rect(rec);let owner=rec.closest('.wrap.narrow');if(rec.classList.contains('curatorial-periods__grid'))owner=rec.closest('.wrap');if(owner&&visible(owner)){const or=rect(owner);if(Math.abs(r.left-or.left)>tol)out.push(`${label} ${nm(rec)} is indented ${Math.abs(r.left-or.left).toFixed(1)}px from owner axis`)}if(r.width>Number(max)+2)out.push(`${label} ${nm(rec)} ${r.width.toFixed(0)}px > ${max}px`)}};
   recordCheck('main.writing-page>section.wrap.narrow :is(.linklist,.facts)',d.writingStructuredMaxPx,'writing');
   recordCheck('.presence-context[data-source-hub] .archive-source-hub',d.sourceHubStructuredMaxPx,'source hub');
   recordCheck('body[data-archive-page="curators"] main :is(.curatorial-periods__grid,.curatorial-section:not(.wrap))',d.curatorsStructuredMaxPx,'curators');
   recordCheck('body[data-archive-page="community"] main>section.wrap.narrow .timeline',d.curatorsStructuredMaxPx,'community');
   if(document.body.dataset.archivePage==='curators'){for(const rec of document.querySelectorAll('.curatorial-period,.curatorial-section'))if(visible(rec)){const rr=rect(rec);axis([...rec.querySelectorAll(':scope > .label,:scope > .eyebrow,:scope > .kicker,:scope > .period-no,:scope > h2,:scope > h3,:scope > p,:scope > .lead,:scope > ul,:scope > blockquote')],`curators record ${route}`,rr.left)}}
   const retired=(design.palette?.retiredPanelAliases||[]).map(x=>x.toLowerCase());for(const el of document.querySelectorAll('main,main *')){if(!visible(el))continue;const c=getComputedStyle(el).backgroundColor,m=c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(!m)continue;const hex='#'+[m[1],m[2],m[3]].map(v=>Number(v).toString(16).padStart(2,'0')).join('');if(retired.includes(hex))out.push(`${nm(el)} retired panel ${hex}`)}
   return [...new Set(out)].slice(0,180);
  },{design,width,route:pathname});
  if(issues.length)failures.push(`${width}px ${pathname}: ${issues.join(' | ')}`);await page.close();
 }
 await context.close();
}
await browser.close();
if(failures.length){console.error(`ART computed design contract found ${failures.length} failing page/viewport combinations.`);console.error(failures.join('\n'));process.exit(1)}
console.log(`ART computed design contract passed across ${pages.length} pages: viewport-derived page canvas, left-anchored structured records, <=${design.desktop.proseMaxPx}px prose, curatorial record alignment and no retired panel aliases at ${widths.join('/')}px.`);
