import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const siteDir=path.resolve(process.env.AUDIT_SITE_DIR||'_site');
const design=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const widths=[390,768,1280,1440,1920];
const failures=[];
const samples=new Map();

function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(f));else if(e.isFile()&&e.name.endsWith('.html'))out.push(f)}return out}
function toUrl(file){const rel=path.relative(siteDir,file).split(path.sep).join('/');if(rel==='index.html')return '/';if(rel.endsWith('/index.html'))return `/${rel.slice(0,-10)}`;return `/${rel}`}
const pages=[...new Set(walk(siteDir).filter(file=>{const html=fs.readFileSync(file,'utf8');return /<main\b/i.test(html)&&!/http-equiv=["']refresh["']/i.test(html)&&/assets\/css\//i.test(html)}).map(toUrl))].sort();

const browser=await chromium.launch({headless:true});
for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:1});
  for(const pathname of pages){
    const page=await context.newPage();
    try{await page.goto(base+pathname,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(100)}catch(e){failures.push(`${width}px ${pathname}: navigation ${e.message}`);await page.close();continue}
    const result=await page.evaluate(({axisTolerance})=>{
      const visible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0};
      const px=v=>parseFloat(v)||0;
      const left=s=>s.textAlign==='left'||s.textAlign==='start';
      const issues=[];
      const role={h1:[],h2:[],lead:[],inlineLink:[]};
      for(const h of document.querySelectorAll('main h1,main h2'))if(visible(h)){const s=getComputedStyle(h);role[h.tagName.toLowerCase()].push({font:px(s.fontSize),line:px(s.lineHeight)/(px(s.fontSize)||1)})}
      for(const el of document.querySelectorAll('main .lead,main .description,main .section-description'))if(visible(el)){const s=getComputedStyle(el);role.lead.push({font:px(s.fontSize),line:px(s.lineHeight)/(px(s.fontSize)||1)})}
      for(const a of document.querySelectorAll('main p a,main li a,main .linklist a'))if(visible(a)&&!a.closest('.btn,.button,.cta,.record-links,.hero-cta')){const s=getComputedStyle(a);role.inlineLink.push({font:px(s.fontSize),weight:Number(s.fontWeight)||400,decoration:s.textDecorationLine})}

      const groups=document.querySelectorAll('main .wrap,main .intro,main .section-head,main .section-intro,main .curatorial-periods__intro,main .life-journey__intro');
      for(const group of groups){
        if(!visible(group)||group.closest('.hero,.hero-cta,.statement,.cta-band,[data-layout="centered"]'))continue;
        const nodes=[...group.children].filter(el=>visible(el)&&el.matches('h1,h2,h3,p,.lead,.description,.section-description,.label,.eyebrow,.kicker,ul,ol,.linklist,.facts')&&left(getComputedStyle(el)));
        if(nodes.length<2)continue;
        const lefts=nodes.map(el=>el.getBoundingClientRect().left),spread=Math.max(...lefts)-Math.min(...lefts);
        if(spread>axisTolerance)issues.push(`${group.className||group.tagName} left-axis drift ${spread.toFixed(1)}px`);
      }

      return {role,issues:[...new Set(issues)]};
    },{axisTolerance:Number(design.desktop.axisTolerancePx||6)});
    if(result.issues.length)failures.push(`${width}px ${pathname}: ${result.issues.join(' | ')}`);
    const key=`${width}`;
    if(!samples.has(key))samples.set(key,{h1:[],h2:[],lead:[],inlineLink:[]});
    const bucket=samples.get(key);
    for(const role of Object.keys(bucket))for(const item of result.role[role])bucket[role].push({...item,pathname});
    await page.close();
  }
  await context.close();
}
await browser.close();

function spreadCheck(width,role,field,tolerance){
  const values=(samples.get(String(width))?.[role]||[]).map(x=>x[field]).filter(Number.isFinite);
  if(values.length<2)return;
  const spread=Math.max(...values)-Math.min(...values);
  if(spread>tolerance)failures.push(`${width}px global ${role} ${field} spread ${spread.toFixed(2)} > ${tolerance}`);
}
for(const width of widths){
  spreadCheck(width,'h1','font',1.2);
  spreadCheck(width,'h2','font',1.2);
  spreadCheck(width,'lead','font',4.5);
  spreadCheck(width,'inlineLink','weight',220);
}

if(failures.length){console.error(`ART global design-role parity found ${failures.length} issue(s).`);console.error(failures.join('\n'));process.exit(1)}
console.log(`ART global design-role parity passed across ${pages.length} pages and ${widths.length} widths: H1/H2 roles are stable, description typography stays within role tolerance, left-aligned semantic siblings share one optical axis, and inline-link styling does not drift materially.`);
