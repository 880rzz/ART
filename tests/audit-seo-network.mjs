import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const warnings = [];
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const assert = (ok, message) => { if (!ok) failures.push(message); };

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([:\w-]+)\s*=\s*["']([^"']*)["']/g)) out[m[1].toLowerCase()] = m[2];
  return out;
}
function localFile(url) {
  let p = decodeURIComponent(new URL(url).pathname).replace(/^\//, '');
  if (!p) return 'index.html';
  if (p.endsWith('/')) return `${p}index.html`;
  return path.extname(p) ? p : `${p}/index.html`;
}

for (const file of ['robots.txt','sitemap.xml','llms.txt','ai.txt','knowledge-graph.jsonld','oeuvre-context.json']) {
  assert(exists(file), `missing machine-readable file: ${file}`);
}
for (const file of ['knowledge-graph.jsonld','oeuvre-context.json']) {
  if (!exists(file)) continue;
  try { JSON.parse(read(file)); } catch (error) { failures.push(`${file}: invalid JSON (${error.message})`); }
}
const robots = exists('robots.txt') ? read('robots.txt') : '';
assert(/User-agent:\s*\*/i.test(robots) && /Allow:\s*\//i.test(robots), 'robots.txt must allow crawling');
assert(robots.includes('Sitemap: https://www.banhalmi.art/sitemap.xml'), 'robots.txt sitemap declaration mismatch');

const sitemap = exists('sitemap.xml') ? read('sitemap.xml') : '';
const urls = [...sitemap.matchAll(/<loc>(https:\/\/www\.banhalmi\.art\/[^<]*)<\/loc>/g)].map((m) => m[1]);
assert(urls.length > 0, 'sitemap has no canonical URLs');
assert(new Set(urls).size === urls.length, 'sitemap contains duplicate URLs');

const htmlFiles = [];
function walk(dir='.') {
  for (const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})) {
    if (['.git','node_modules'].includes(e.name)) continue;
    const rel=path.join(dir,e.name);
    if(e.isDirectory()) walk(rel);
    else if(e.name.endsWith('.html')) htmlFiles.push(rel.replaceAll('\\','/').replace(/^\.\//,''));
  }
}
walk();
const external = new Set();
for (const url of urls) {
  const file = localFile(url);
  assert(exists(file), `sitemap URL missing local file: ${url} -> ${file}`);
  if (!exists(file)) continue;
  const html = read(file);
  const links=[...html.matchAll(/<link\b[^>]*>/gi)].map((m)=>attrs(m[0]));
  const canonical=links.find((a)=>(a.rel||'').toLowerCase().split(/\s+/).includes('canonical'))?.href;
  assert(canonical===url, `${file}: canonical mismatch (${canonical||'missing'} != ${url})`);
  const hreflangs=links.filter((a)=>a.hreflang&&a.href).map((a)=>a.hreflang.toLowerCase());
  assert(hreflangs.includes('x-default'), `${file}: missing x-default hreflang`);
  assert(new Set(hreflangs).size===hreflangs.length, `${file}: duplicate hreflang`);
}
for(const file of htmlFiles){
  const html=read(file);
  for(const m of html.matchAll(/\b(?:href|src)=["'](https?:\/\/[^"']+)["']/gi)){
    const url=m[1].replace(/&amp;/g,'&');
    if(!url.startsWith('https://www.banhalmi.art/')) external.add(url);
  }
}

const critical=[
  'https://www.banhalmi.art/','https://www.banhalmi.art/robots.txt','https://www.banhalmi.art/sitemap.xml',
  'https://www.banhalmi.art/llms.txt','https://www.banhalmi.art/ai.txt','https://www.banhalmi.art/knowledge-graph.jsonld',
  'https://www.norbertbanhalmi.com/','https://www.norbertbanhalmi.com/about/'
];
const htmlRedirectTarget = /https:\/\/www\.norbertbanhalmi\.com\/(?:hu\/|de-at\/)?/i;
async function check(url){
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),15000);
  try{
    let r=await fetch(url,{method:'HEAD',redirect:'follow',signal:controller.signal,headers:{'user-agent':'BANHALMI-ART-LinkAudit/1.0'}});
    let htmlRedirect = false;
    if([400,404,405].includes(r.status)) {
      r=await fetch(url,{method:'GET',redirect:'follow',signal:controller.signal,headers:{'user-agent':'BANHALMI-ART-LinkAudit/1.0','accept':'text/html,application/xhtml+xml'}});
      if ([404,410].includes(r.status) && (r.headers.get('content-type') || '').includes('text/html')) {
        const body = (await r.text()).slice(0, 12000);
        htmlRedirect = /http-equiv=["']refresh["']/i.test(body) || htmlRedirectTarget.test(body);
      }
    }
    return {
      url,
      status:r.status,
      reachable:r.status<400||[401,403,429].includes(r.status)||htmlRedirect,
      finalUrl:r.url,
      ...(htmlRedirect ? {htmlRedirect:true} : {})
    };
  }catch(error){return {url,status:0,reachable:false,error:error.name==='AbortError'?'timeout':error.message};}
  finally{clearTimeout(timer);}
}
if(process.env.LIVE_AUDIT==='1'){
  const queue=[...new Set([...critical,...external])], results=[];
  await Promise.all(Array.from({length:8},async()=>{while(queue.length) results.push(await check(queue.shift()));}));
  results.sort((a,b)=>a.url.localeCompare(b.url));
  fs.writeFileSync('link-audit-results.json',JSON.stringify({generatedAt:new Date().toISOString(),checked:results.length,results},null,2)+'\n');
  for(const r of results){if(!r.reachable) failures.push(`unreachable external URL: ${r.url} (${r.status||r.error})`); else if(r.status>=300) warnings.push(`${r.status}${r.htmlRedirect?' HTML redirect':''}: ${r.url}`);}
  console.log(`Checked ${results.length} live and external URLs.`);
}else console.log(`Collected ${external.size} external URLs; LIVE_AUDIT=1 enables network checks.`);
for(const w of warnings) console.warn(`WARN ${w}`);
for(const f of failures) console.error(`FAIL ${f}`);
console.log(`Validated ${urls.length} sitemap URLs and ${htmlFiles.length} HTML files.`);
if(failures.length) process.exitCode=1;
