import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const additions={
  '/en/work':'/',
  '/about/norbert-banhalmi':'https://www.norbertbanhalmi.com/about/',
  '/hu/rolam/banhalmi-norbert':'https://www.norbertbanhalmi.com/about/',
  '/de/ueber-mich/norbert-banhalmi':'https://www.norbertbanhalmi.com/about/',
  '/press':'/press.html',
  '/old-print':'/press.html',
  '/hu/sajto/megjelenesek':'/hu/press.html',
  '/hu/sajto/nyomtatott':'/hu/press.html',
  '/de/presse/presseauftritte':'/de-at/press.html',
  '/de/presse/print':'/de-at/press.html'
};
const rpath=path.join(root,'redirects.json'); const data=JSON.parse(fs.readFileSync(rpath,'utf8'));
data.policy='Every known legacy URL with a real content-equivalent successor is represented by a lightweight permanent redirect bridge with canonical, instant meta refresh and JavaScript forwarding. Redirect documents do not use noindex. URLs without a relevant successor remain true 404s.';
for(const [route,target] of Object.entries(additions)) data.redirects[route]=target;
fs.writeFileSync(rpath,JSON.stringify(data,null,2)+'\n');
const abs=t=>t.startsWith('/')?'https://www.banhalmi.art'+t:t;
for(const [route,target] of Object.entries(additions)){
  const file=path.join(root,route.replace(/^\//,''),'index.html'); fs.mkdirSync(path.dirname(file),{recursive:true});
  const a=abs(target); const canonical=a.split('#')[0];
  const lang=route.startsWith('/hu/')?'hu':route.startsWith('/de/')?'de':'en';
  const msg=lang==='hu'?'Ez a cím megváltozott.':lang==='de'?'Diese Adresse wurde verschoben.':'This address has moved.';
  const link=lang==='hu'?'Tovább az aktuális oldalra':lang==='de'?'Zur aktuellen Seite':'Continue to the current page';
  fs.writeFileSync(file,`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Redirecting | BANHALMI ART</title><link rel="canonical" href="${canonical}"><meta http-equiv="refresh" content="0; url=${a}"><script>window.location.replace(${JSON.stringify(a)});</script></head><body><main><p>${msg} <a href="${a}">${link}</a>.</p></main></body></html>`);
}
const audit=path.join(root,'tests/audit-live-indexing-legacy-routes-stage47.mjs');
fs.writeFileSync(audit,`import fs from 'node:fs';import path from 'node:path';const root=process.cwd(),errors=[];const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{if(['.git','node_modules'].includes(e.name))return[];const f=path.join(d,e.name);return e.isDirectory()?walk(f):[f]});for(const file of walk(root).filter(f=>f.endsWith('.html'))){const rel=path.relative(root,file),html=fs.readFileSync(file,'utf8'),redirect=/http-equiv=[\\\"']refresh[\\\"']/i.test(html),is404=rel==='404.html';if(/<meta\\b[^>]*name=[\\\"']robots[\\\"'][^>]*content=[\\\"'][^\\\"']*noindex/i.test(html)&&!is404)errors.push(rel+': noindex on a live or redirect document');if(!redirect&&!is404&&!/<link\\b[^>]*rel=[\\\"']canonical[\\\"']/i.test(html))errors.push(rel+': indexable live page missing canonical');}const data=JSON.parse(fs.readFileSync(path.join(root,'redirects.json'),'utf8'));for(const [route,target] of Object.entries(data.redirects)){const f=path.join(root,route.replace(/^\\//,''),'index.html');if(!fs.existsSync(f))errors.push(route+': redirect bridge missing');if(target.startsWith('/')){const clean=target.split('#')[0].replace(/^\\//,'');const tf=path.join(root,clean.endsWith('.html')?clean:path.join(clean,'index.html'));if(!fs.existsSync(tf))errors.push(route+': internal redirect target missing '+target);else{const th=fs.readFileSync(tf,'utf8');if(/noindex/i.test(th))errors.push(route+': redirect target is not indexable '+target);}}}if(errors.length){console.error('STAGE47 FAILED');errors.forEach(e=>console.error('-',e));process.exit(1)}console.log('Stage 47 passed: all live archive pages are indexable and all known equivalent legacy routes resolve directly to existing indexable targets.');`);
const ppath=path.join(root,'package.json');const pkg=JSON.parse(fs.readFileSync(ppath,'utf8'));const token='node tests/audit-live-indexing-legacy-routes-stage47.mjs';if(!pkg.scripts.test.includes(token))pkg.scripts.test+=' && '+token;fs.writeFileSync(ppath,JSON.stringify(pkg,null,2)+'\n');
