import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173';
const siteDir=path.resolve(process.env.AUDIT_SITE_DIR||'_site');
const design=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const d=design.desktop||{};
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
    try{await page.goto(new URL(pathname,base).href,{waitUntil:'domcontentloaded',timeout:30000})}
    catch(e){failures.push(`${width}px ${pathname}: navigation ${e.message}`);await page.close();continue}
    await page.waitForTimeout(120);
    const issues=await page.evaluate(({design,width})=>{
      const out=[];
      const d=design.desktop||{};
      const visible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0};
      const rect=el=>el.getBoundingClientRect();
      const name=el=>`${el.tagName.toLowerCase()}${el.id?'#'+el.id:''}${el.className?'.'+String(el.className).trim().replace(/\s+/g,'.').slice(0,90):''}`;
      const required=max=>Math.min(width*Number(d.structuredMinViewportFraction||0.72),Math.min(1100,Number(max||1180)));
      const axisTol=Number(d.axisTolerancePx||6),proseMax=Number(d.proseMaxPx||860);
      const axis=(els,label)=>{const rs=els.filter(visible).map(rect);if(rs.length<2)return;const lefts=rs.map(r=>r.left),spread=Math.max(...lefts)-Math.min(...lefts);if(spread>axisTol)out.push(`${label} left-axis drift ${spread.toFixed(1)}px > ${axisTol}px`)};

      if(document.body.dataset.archivePage==='writing'){
        for(const section of document.querySelectorAll('main.writing-page>section.wrap.narrow')){
          if(!visible(section))continue;
          const records=[...section.querySelectorAll(':scope > .linklist,:scope > .facts')].filter(visible);
          if(!records.length)continue;
          const sr=rect(section),req=required(d.writingStructuredMaxPx);
          if(sr.width+1<req)out.push(`${name(section)} writing section ${sr.width.toFixed(0)}px < ${req.toFixed(0)}px`);
          for(const record of records){const rr=rect(record);if(rr.width<sr.width*.94)out.push(`${name(record)} writing record uses only ${(rr.width/sr.width*100).toFixed(1)}% of structured canvas`)}
          for(const p of section.querySelectorAll(':scope > p,:scope > .lead'))if(visible(p)&&rect(p).width>proseMax+2)out.push(`${name(p)} writing prose ${rect(p).width.toFixed(0)}px > ${proseMax}px`);
          axis([...section.querySelectorAll(':scope > h2,:scope > h3,:scope > .label,:scope > .eyebrow,:scope > .kicker,:scope > p,:scope > .lead'),...records],`writing ${pathname}`);
        }
      }

      for(const wrap of document.querySelectorAll('.presence-context[data-source-hub] .wrap.narrow')){
        if(!visible(wrap))continue;
        const wr=rect(wrap),req=required(d.sourceHubStructuredMaxPx);
        if(wr.width+1<req)out.push(`${name(wrap)} source-hub section ${wr.width.toFixed(0)}px < ${req.toFixed(0)}px`);
        const grid=wrap.querySelector('.archive-source-hub');
        if(visible(grid)){const gr=rect(grid);if(gr.width<wr.width*.94)out.push(`${name(grid)} source-hub records use only ${(gr.width/wr.width*100).toFixed(1)}% of structured canvas`)}
        for(const p of wrap.querySelectorAll(':scope > p,:scope > .presence-copy,:scope > .lead'))if(visible(p)&&rect(p).width>proseMax+2)out.push(`${name(p)} source-hub prose ${rect(p).width.toFixed(0)}px > ${proseMax}px`);
        axis([...wrap.querySelectorAll(':scope > .presence-kicker,:scope > .label,:scope > .eyebrow,:scope > h1,:scope > h2,:scope > h3,:scope > p,:scope > .presence-copy,:scope > .lead'),grid],`source hub ${pathname}`);
      }

      if(document.body.dataset.archivePage==='curators'){
        for(const section of document.querySelectorAll('main section.wrap.narrow')){
          if(!visible(section))continue;
          const text=(section.innerText||'').replace(/\s+/g,' ').trim();if(text.length<220)continue;
          const sr=rect(section),req=required(d.curatorsStructuredMaxPx);
          if(sr.width+1<req)out.push(`${name(section)} curators section ${sr.width.toFixed(0)}px < ${req.toFixed(0)}px`);
          const direct=[...section.querySelectorAll(':scope > h2,:scope > h3,:scope > .label,:scope > .eyebrow,:scope > .kicker,:scope > p,:scope > .lead')];
          axis(direct,`curators ${pathname}`);
          for(const el of direct)if(visible(el)&&el.matches('p,.lead')&&rect(el).width>proseMax+2)out.push(`${name(el)} curators prose ${rect(el).width.toFixed(0)}px > ${proseMax}px`);
        }
      }
      return [...new Set(out)].slice(0,120);
    },{design,width});
    if(issues.length)failures.push(`${width}px ${pathname}: ${issues.join(' | ')}`);
    await page.close();
  }
  await context.close();
}
await browser.close();
if(failures.length){console.error(`ART computed design contract found ${failures.length} failing page/viewport combinations.`);console.error(failures.join('\n'));process.exit(1)}
console.log(`ART computed design contract passed: rendered Writing records, source hubs and Curators sections use their structured canvases, retain narrow prose and share a single left axis at ${widths.join('/')}px.`);
