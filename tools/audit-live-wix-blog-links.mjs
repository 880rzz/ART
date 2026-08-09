const ROOT='https://blog.banhalmi.art';
const UA='Mozilla/5.0 (compatible; BANHALMI-LinkAudit/1.0; +https://www.banhalmi.art/)';
const timeoutMs=20000;
const fetchText=async(url)=>{const c=new AbortController();const t=setTimeout(()=>c.abort(),timeoutMs);try{const r=await fetch(url,{headers:{'user-agent':UA,'accept':'text/html,application/xml;q=0.9,*/*;q=0.8'},redirect:'follow',signal:c.signal});return {status:r.status,url:r.url,text:await r.text(),headers:r.headers}}finally{clearTimeout(t)}};
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&#38;','&');
const locs=xml=>[...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map(m=>decode(m[1].trim()));
async function sitemapUrls(){
  const seen=new Set(), pages=new Set();
  async function walk(url){if(seen.has(url))return;seen.add(url);const r=await fetchText(url);if(r.status>=400)throw new Error(`sitemap ${url} -> ${r.status}`);for(const u of locs(r.text)){if(/sitemap/i.test(u)&&u.endsWith('.xml'))await walk(u);else if(u.startsWith(ROOT))pages.add(u)}}
  await walk(`${ROOT}/sitemap.xml`);return [...pages];
}
const attr=(html,re)=>{const m=html.match(re);return m?decode(m[1].trim()):''};
const stripQuery=u=>{try{const x=new URL(u);x.hash='';return x.href}catch{return u}};
const hrefs=html=>[...html.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)].map(m=>decode(m[1]));
const schemaTypes=html=>[...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const concurrency=async(items,n,fn)=>{let i=0;const out=new Array(items.length);await Promise.all(Array.from({length:Math.min(n,items.length)},async()=>{while(true){const k=i++;if(k>=items.length)return;out[k]=await fn(items[k],k)}}));return out};
const pages=await sitemapUrls();
const posts=pages.filter(u=>new URL(u).pathname.startsWith('/post/'));
console.log(`SITEMAP: ${pages.length} total URLs, ${posts.length} blog posts`);
const externalMap=new Map();
const pageResults=await concurrency(posts,5,async url=>{
  try{
    const r=await fetchText(url);const html=r.text;const canonical=attr(html,/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)||attr(html,/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
    const title=attr(html,/<title[^>]*>([\s\S]*?)<\/title>/i);const desc=attr(html,/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)||attr(html,/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
    const h1=(html.match(/<h1\b/gi)||[]).length;const schemas=schemaTypes(html).join('\n');const blogPosting=/["']@type["']\s*:\s*(?:["']BlogPosting["']|\[[^\]]*["']BlogPosting["'])/i.test(schemas)||/BlogPosting/i.test(schemas);
    const author=/["']author["']\s*:/i.test(schemas), publisher=/["']publisher["']\s*:/i.test(schemas);
    const critical=[];if(r.status!==200)critical.push(`HTTP ${r.status}`);if(!title)critical.push('missing title');if(!canonical)critical.push('missing canonical');else if(stripQuery(canonical)!==stripQuery(url))critical.push(`canonical mismatch -> ${canonical}`);if(!desc)critical.push('missing meta description');if(h1<1)critical.push('missing H1');if(!blogPosting)critical.push('BlogPosting schema not detected');if(blogPosting&&!author)critical.push('BlogPosting author not detected');if(blogPosting&&!publisher)critical.push('BlogPosting publisher not detected');
    for(const raw of hrefs(html)){let u;try{u=new URL(raw,url)}catch{continue}if(!['http:','https:'].includes(u.protocol)||u.hostname==='blog.banhalmi.art')continue;u.hash='';const key=u.href;const e=externalMap.get(key)||{url:key,sources:new Set()};e.sources.add(url);externalMap.set(key,e)}
    return {url,status:r.status,title:title.slice(0,120),descLength:desc.length,h1,blogPosting,author,publisher,critical};
  }catch(e){return {url,status:0,critical:[`fetch error: ${e.message}`]}}
});
const external=[...externalMap.values()];
console.log(`EXTERNAL: ${external.length} unique outbound URLs`);
const checks=await concurrency(external,8,async e=>{const c=new AbortController();const t=setTimeout(()=>c.abort(),15000);try{const r=await fetch(e.url,{headers:{'user-agent':UA,'accept':'text/html,*/*;q=0.8'},redirect:'follow',signal:c.signal});const status=r.status;const category=status<400?'ok':([401,403,429].includes(status)?'blocked':([404,410].includes(status)?'broken':'error'));return {...e,sources:[...e.sources],status,finalUrl:r.url,category}}catch(err){return {...e,sources:[...e.sources],status:0,finalUrl:'',category:'network',error:err.message}}finally{clearTimeout(t)}});
const seoProblems=pageResults.filter(x=>x.critical?.length);
const broken=checks.filter(x=>['broken','error','network'].includes(x.category));
const blocked=checks.filter(x=>x.category==='blocked');
console.log('\n=== SEO / LLM PAGE PROBLEMS ===');
if(!seoProblems.length)console.log('none');else for(const p of seoProblems)console.log(JSON.stringify(p));
console.log('\n=== BROKEN / ERROR EXTERNAL LINKS ===');
if(!broken.length)console.log('none');else for(const x of broken)console.log(JSON.stringify(x));
console.log('\n=== BLOCKED-BY-SITE EXTERNAL LINKS (not automatically broken) ===');
if(!blocked.length)console.log('none');else for(const x of blocked)console.log(JSON.stringify(x));
const summary={sitemapUrls:pages.length,posts:posts.length,postFetchFailures:pageResults.filter(x=>!x.status).length,seoLlmProblemPages:seoProblems.length,externalUnique:checks.length,externalOk:checks.filter(x=>x.category==='ok').length,externalBlocked:blocked.length,externalBrokenOrError:broken.length};
console.log('\nAUDIT_SUMMARY '+JSON.stringify(summary));
if(seoProblems.length||broken.length)process.exitCode=1;
