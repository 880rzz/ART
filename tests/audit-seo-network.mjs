import fs from 'node:fs';

const BASE='https://blog.banhalmi.art';
const roots=[['hu',`${BASE}/`],['en',`${BASE}/en`],['de',`${BASE}/de`]];
const sitemaps=[`${BASE}/blog-posts-sitemap.xml`,`${BASE}/blog-categories-sitemap.xml`];
const failures=[],warnings=[],pages=[],internal=new Set();
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const locs=xml=>[...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m=>decode(m[1].trim()));
const attr=(tag,n)=>tag.match(new RegExp(`${n}\\s*=\\s*["']([^"']+)["']`,'i'))?.[1]||'';
function canonical(html){for(const m of html.matchAll(/<link\b[^>]*>/gi)){const t=m[0];if(attr(t,'rel').toLowerCase().split(/\s+/).includes('canonical'))return attr(t,'href')}return ''}
function hreflangs(html){const out=[];for(const m of html.matchAll(/<link\b[^>]*>/gi)){const t=m[0],r=attr(t,'rel').toLowerCase().split(/\s+/),l=attr(t,'hreflang'),h=attr(t,'href');if(r.includes('alternate')&&l&&h)out.push({lang:l.toLowerCase(),href:h})}return out}
const htmlLang=html=>html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i)?.[1]?.toLowerCase()||'';
function langOf(url){const p=new URL(url).pathname;return p==='/en'||p.startsWith('/en/')?'en':p==='/de'||p.startsWith('/de/')?'de':'hu'}
function norm(raw,base){try{const u=new URL(decode(raw),base);if(u.hostname!=='blog.banhalmi.art'||!['http:','https:'].includes(u.protocol))return null;u.hash='';if(/\.(?:avif|css|gif|ico|jpe?g|js|json|mp4|pdf|png|svg|webm|webp|xml)$/i.test(u.pathname))return null;return u.href}catch{return null}}
function internalLinks(html,base){const out=[];for(const m of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)){if(/^(?:mailto:|tel:|javascript:|#)/i.test(m[1]))continue;const u=norm(m[1],base);if(u)out.push(u)}return out}
const eco=html=>({commercial:(html.match(/https:\/\/(?:www\.)?norbertbanhalmi\.com\//gi)||[]).length,archive:(html.match(/https:\/\/(?:www\.)?banhalmi\.art\//gi)||[]).length});
function same(a,b){try{const A=new URL(a),B=new URL(b),c=u=>`${u.origin}${u.pathname.replace(/\/$/,'')||'/'}${u.search}`;return c(A)===c(B)}catch{return false}}
async function get(url){const c=new AbortController(),t=setTimeout(()=>c.abort(),25000);try{const r=await fetch(url,{redirect:'follow',signal:c.signal,headers:{'user-agent':'BANHALMI-BlogAudit/1.0','cache-control':'no-cache'}});return{status:r.status,finalUrl:r.url,body:await r.text()}}catch(e){return{status:0,finalUrl:url,body:'',error:e.name==='AbortError'?'timeout':e.message}}finally{clearTimeout(t)}}
async function mapLimit(items,n,fn){let i=0;await Promise.all(Array.from({length:Math.min(n,items.length||1)},async()=>{while(true){const x=i++;if(x>=items.length)return;await fn(items[x],x)}}))}

console.log('=== LIVE BLOG AUDIT HU / EN / DE ===');
for(const [lang,url] of roots){const r=await get(url);console.log(`ROOT ${lang} ${r.status} ${r.finalUrl}`);if(r.status<200||r.status>=400)failures.push(`root ${lang} unreachable: ${url} (${r.status||r.error})`);const hl=htmlLang(r.body);if(hl&&!hl.startsWith(lang))warnings.push(`root ${lang} html lang=${hl}`)}
const listed=[];
for(const sm of sitemaps){const r=await get(sm);console.log(`SITEMAP ${r.status} ${sm}`);if(r.status<200||r.status>=400){failures.push(`sitemap unreachable: ${sm}`);continue}const xs=locs(r.body);console.log(`SITEMAP_LOCS ${xs.length} ${sm}`);listed.push(...xs.map(url=>({url,sm})))}
const unique=[...new Map(listed.map(x=>[x.url,x])).values()];
await mapLimit(unique,10,async item=>{const r=await get(item.url),lang=langOf(item.url),row={url:item.url,source:item.sm,status:r.status,finalUrl:r.finalUrl,lang};if(r.status<200||r.status>=400){failures.push(`sitemap URL failed: ${item.url} (${r.status||r.error})`);pages.push(row);return}row.canonical=canonical(r.body);row.hreflangs=hreflangs(r.body);row.htmlLang=htmlLang(r.body);row.ecosystem=eco(r.body);pages.push(row);if(!row.canonical)failures.push(`missing canonical: ${item.url}`);else if(!same(row.canonical,r.finalUrl)&&!same(row.canonical,item.url))failures.push(`canonical mismatch: ${item.url} -> ${row.canonical}`);if(row.htmlLang&&!row.htmlLang.startsWith(lang))warnings.push(`language mismatch: ${item.url} expected ${lang} got ${row.htmlLang}`);const ls=row.hreflangs.map(x=>x.lang);if(new Set(ls).size!==ls.length)failures.push(`duplicate hreflang: ${item.url}`);if(!ls.length)warnings.push(`no hreflang: ${item.url}`);for(const u of internalLinks(r.body,r.finalUrl))internal.add(u)});
const internalResults=[];
await mapLimit([...internal],12,async url=>{const r=await get(url);internalResults.push({url,status:r.status,finalUrl:r.finalUrl,error:r.error||null});if(r.status<200||r.status>=400)failures.push(`broken internal link: ${url} (${r.status||r.error})`)});
const byLang={hu:0,en:0,de:0},commercial={hu:0,en:0,de:0},archive={hu:0,en:0,de:0},hreflang={hu:0,en:0,de:0};
for(const p of pages){byLang[p.lang]++;if(p.ecosystem?.commercial)commercial[p.lang]++;if(p.ecosystem?.archive)archive[p.lang]++;if(p.hreflangs?.length)hreflang[p.lang]++}
const report={generatedAt:new Date().toISOString(),sitemapCount:unique.length,languageCounts:byLang,internalLinkCount:internal.size,ecosystemCoverage:{commercial,archive},hreflangCoverage:hreflang,failures,warnings,pages,internalResults};
fs.writeFileSync('link-audit-results.json',JSON.stringify(report,null,2)+'\n');
console.log(`SUMMARY sitemap=${unique.length} HU=${byLang.hu} EN=${byLang.en} DE=${byLang.de} internal=${internal.size} failures=${failures.length} warnings=${warnings.length}`);
console.log(`ECOSYSTEM commercial HU=${commercial.hu} EN=${commercial.en} DE=${commercial.de}; archive HU=${archive.hu} EN=${archive.en} DE=${archive.de}`);
console.log(`HREFLANG HU=${hreflang.hu} EN=${hreflang.en} DE=${hreflang.de}`);
for(const w of warnings.slice(0,30))console.warn(`WARN ${w}`);if(warnings.length>30)console.warn(`WARN ... ${warnings.length-30} more in artifact`);
for(const f of failures)console.error(`FAIL ${f}`);
if(failures.length)process.exitCode=1;
