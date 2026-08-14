import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173';
const siteDir=path.resolve(process.env.AUDIT_SITE_DIR||'_site');
const widths=[390,768,1440];
const outDir='artifacts/exhaustive-visual';
fs.mkdirSync(outDir,{recursive:true});
function walk(d){const out=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())out.push(...walk(f));else if(e.isFile()&&e.name.endsWith('.html'))out.push(f)}return out}
function toUrl(file){const rel=path.relative(siteDir,file).split(path.sep).join('/');if(rel==='index.html')return '/';if(rel.endsWith('/index.html'))return `/${rel.slice(0,-10)}`;return `/${rel}`}
const pages=[...new Set(walk(siteDir).filter(file=>{const h=fs.readFileSync(file,'utf8');return /<main\b/i.test(h)&&!/http-equiv=["']refresh["']/i.test(h)&&/assets\/css\//i.test(h)}).map(toUrl))].sort();
const browser=await chromium.launch({headless:true});
for(const width of widths){const ctx=await browser.newContext({viewport:{width,height:width===390?900:1000},deviceScaleFactor:1});for(const pathname of pages){const p=await ctx.newPage();await p.goto(new URL(pathname,base).href,{waitUntil:'domcontentloaded',timeout:30000});await p.evaluate(()=>{for(const img of document.images){img.loading='eager';img.decoding='async'}});const height=await p.evaluate(()=>Math.max(document.body.scrollHeight,document.documentElement.scrollHeight));for(let y=0;y<height;y+=Math.max(500,innerHeight*.75)){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(35)}await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(250);await p.evaluate(async()=>{await Promise.all([...document.images].filter(i=>i.complete&&i.naturalWidth).map(i=>i.decode?.().catch(()=>{})))});const safe=pathname==='/'?'home':pathname.replace(/^\/+|\/+$/g,'').replace(/[^a-z0-9]+/gi,'-').slice(0,120);await p.screenshot({path:path.join(outDir,`${width}-${safe}.png`),fullPage:true});await p.close()}await ctx.close()}
await browser.close();
console.log(`Captured ${pages.length} ART content pages at ${widths.join('/')}px after lazy media activation.`);
