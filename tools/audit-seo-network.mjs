import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const failures=[];
const warnings=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));
const assert=(ok,msg)=>{if(!ok)failures.push(msg)};

function localPathForUrl(url){
  const parsed=new URL(url);let pathname=decodeURIComponent(parsed.pathname);
  if(pathname==='/')return'index.html';
  pathname=pathname.replace(/^\//,'');
  if(pathname.endsWith('/'))return`${pathname}index.html`;
  return path.extname(pathname)?pathname:`${pathname}.html`;
}
function attrs(tag){const o={};for(const m of tag.matchAll(/([:\w-]+)\s*=\s*["']([^"']*)["']/g))o[m[1].toLowerCase()]=m[2];return o}
for(const required of ['robots.txt','sitemap.xml','llms.txt','ai.txt','knowledge-graph.jsonld','ecosystem-bridge.json','ecosystem-bridge.jsonld'])assert(exists(required),`missing machine-readable file: ${required}`);
for(const jsonFile of ['knowledge-graph.jsonld','ecosystem-bridge.json','ecosystem-bridge.jsonld']){if(!exists(jsonFile))continue;try{JSON.parse(read(jsonFile))}catch(e){failures.push(`${jsonFile}: invalid JSON (${e.message})`)}}
const robots=exists('robots.txt')?read('robots.txt'):'';
assert(/User-agent:\s*\*/i.test(robots),'robots.txt: wildcard user agent missing');
assert(/Allow:\s*\//i.test(robots),'robots.txt: site is not explicitly crawlable');
assert(robots.includes('Sitemap: https://www.banhalmi.art/sitemap.xml'),'robots.txt: canonical sitemap missing');
const sitemap=exists('sitemap.xml')?read('sitemap.xml'):'';
const urls=[...sitemap.matchAll(/<loc>(https:\/\/www\.banhalmi\.art\/[^<]*)<\/loc>/g)].map(m=>m[1]).filter(u=>!(/\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(u)));
assert(urls.length>0,'sitemap.xml: no page URLs found');
assert(new Set(urls).size===urls.length,'sitemap.xml: duplicate URL');
for(const url of urls){const file=localPathForUrl(url);assert(exists(file),`sitemap URL has no local file: ${url} -> ${file}`);if(!exists(file))continue;const html=read(file);const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0]));const canonical=links.find(a=>(a.rel||'').toLowerCase().split(/\s+/).includes('canonical'))?.href;assert(canonical===url,`${file}: canonical mismatch (${canonical||'missing'} != ${url})`);const alts=links.filter(a=>a.hreflang&&a.href&&(a.rel||'').toLowerCase().split(/\s+/).includes('alternate'));assert(alts.some(a=>a.hreflang.toLowerCase()==='x-default'),`${file}: x-default hreflang missing`);const langs=alts.map(a=>a.hreflang.toLowerCase());assert(new Set(langs).size===langs.length,`${file}: duplicate hreflang value`)}
const critical=['https://www.banhalmi.art/','https://www.banhalmi.art/robots.txt','https://www.banhalmi.art/sitemap.xml','https://www.banhalmi.art/llms.txt','https://www.banhalmi.art/ai.txt','https://www.banhalmi.art/knowledge-graph.jsonld','https://www.banhalmi.art/ecosystem-bridge.json','https://www.norbertbanhalmi.com/','https://www.norbertbanhalmi.com/llms.txt','https://blog.banhalmi.art/'];
async function check(url){const c=new AbortController();const t=setTimeout(()=>c.abort(),15000);try{let r=await fetch(url,{method:'HEAD',redirect:'follow',signal:c.signal,headers:{'user-agent':'BANHALMI-ART-LinkAudit/1.0'}});if([400,405].includes(r.status))r=await fetch(url,{method:'GET',redirect:'follow',signal:c.signal,headers:{'user-agent':'BANHALMI-ART-LinkAudit/1.0',range:'bytes=0-1024'}});return{url,status:r.status,ok:r.status<400||[401,403,429,999].includes(r.status),finalUrl:r.url}}catch(e){return{url,status:0,ok:false,error:e.name==='AbortError'?'timeout':e.message}}finally{clearTimeout(t)}}
if(process.env.LIVE_AUDIT==='1'){const results=await Promise.all(critical.map(check));fs.writeFileSync('link-audit-results.json',JSON.stringify({generatedAt:new Date().toISOString(),results},null,2)+'\n');for(const r of results)if(!r.ok)failures.push(`unreachable critical URL: ${r.url} (${r.status||r.error})`)}else console.log('Static ART SEO/network contract complete; set LIVE_AUDIT=1 for critical live URL checks.');
for(const w of warnings)console.warn(`WARN ${w}`);for(const f of failures)console.error(`FAIL ${f}`);console.log(`Validated ${urls.length} sitemap URLs.`);if(failures.length)process.exitCode=1;
