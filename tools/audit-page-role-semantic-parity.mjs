import fs from 'node:fs';

const failures=[];
const fail=(ok,msg)=>{if(!ok) failures.push(msg)};
const read=(p)=>fs.readFileSync(p,'utf8');
const sitemap=read('sitemap.xml');
const urls=[...sitemap.matchAll(/<loc>https:\/\/www\.banhalmi\.art\/([^<]*)<\/loc>/g)].map(m=>m[1]);
const fileFor=(p)=>!p?'index.html':p.endsWith('/')?p+'index.html':p;
const stripLang=(p)=>p.replace(/^(hu|de-at)\//,'');
const roleFor=(p)=>{
 const q=stripLang(p);
 if(q===''||q==='index.html') return 'UNDERSTAND';
 if(q.includes('curators')) return 'INTERPRET_EVALUATE';
 if(q.includes('press')) return 'VERIFY';
 if(q.includes('writing')) return 'UNDERSTAND_PRACTICE';
 if(q.includes('community')) return 'UNDERSTAND_SOCIAL_PRACTICE';
 if(q.includes('contact')) return 'ACT';
 if(q.includes('archive')) return 'FIND_RETRIEVE';
 if(q.includes('book')) return 'UNDERSTAND_PUBLICATION';
 if(q.includes('exhibitions/')||q.includes('gallery')||q.includes('fine-art')||q.includes('artistic-nude')||q.includes('works/')) return 'EXPERIENCE_UNDERSTAND';
 return 'UNDERSTAND';
};
const groups=new Map();
for(const p of urls){
 const file=fileFor(p); if(!fs.existsSync(file)) continue;
 const html=read(file);
 fail(/<h1\b/i.test(html),`${file}: page-role contract requires H1`);
 fail(/<meta\s+name=["']description["']/i.test(html),`${file}: page-role contract requires meta description`);
 fail(/https:\/\/www\.norbertbanhalmi\.com\/about\//.test(html),`${file}: canonical Person authority missing`);
 const key=stripLang(p), lang=p.startsWith('hu/')?'hu':p.startsWith('de-at/')?'de-at':'en';
 if(!groups.has(key)) groups.set(key,new Map());
 groups.get(key).set(lang,{file,html,role:roleFor(p)});
}
for(const [key,g] of groups){
 if(g.size!==3) continue;
 const roles=new Set([...g.values()].map(x=>x.role));
 fail(roles.size===1,`${key}: EN/HU/DE page-role drift`);
 for(const [lang,x] of g){
   const canon=(x.html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)||x.html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i))?.[1];
   fail(Boolean(canon),`${x.file}: canonical missing`);
   for(const code of ['en','hu-hu','de-at','x-default']) fail(new RegExp(`hreflang=["']${code}["']`,'i').test(x.html),`${x.file}: hreflang ${code} missing`);
 }
}
const euforiaContract=read('docs/EUFORIA-CURATORIAL-ARCHITECTURE.md');
fail(!/2027\s+(?:exhibition|may be described|horizon|deadline)/i.test(euforiaContract),'docs/EUFORIA-CURATORIAL-ARCHITECTURE.md: stale 2027 exhibition horizon must not return');
fail(/No exhibition year, opening date, completion deadline or venue is currently determined\./.test(euforiaContract),'docs/EUFORIA-CURATORIAL-ARCHITECTURE.md: undated exhibition contract missing');

for(const file of ['exhibitions/euforia.html','hu/exhibitions/euforia.html','de-at/exhibitions/euforia.html']){
 const html=read(file);
 fail(/Q138717398/.test(html),`${file}: EUFÓRIA Wikidata authority missing`);
 fail(/Category:Euphoria_%E2%80%93_Anatomy_of_Presence/.test(html),`${file}: EUFÓRIA Commons authority missing`);
 fail(!/["']@type["']\s*:\s*["'](?:Event|ExhibitionEvent)["']/.test(html),`${file}: unsupported Event schema`);
 fail(/Not yet determined|még nincs meghatározva|noch nicht festgelegt|noch nicht bestimmt/i.test(html),`${file}: unknown venue/date status must remain explicit`);
 fail(/CreativeWork/.test(html),`${file}: project CreativeWork schema missing`);
}
console.log(`Page-role/semantic-parity audit: ${urls.length} canonical URLs, ${groups.size} translation groups.`);
for(const f of failures) console.error('FAIL '+f);
if(failures.length) process.exitCode=1;
