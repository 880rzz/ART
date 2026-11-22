import assert from 'node:assert/strict';
import fs from 'node:fs';
const urls=[...fs.readFileSync('sitemap.xml','utf8').matchAll(/<loc>https:\/\/www\.banhalmi\.art\/([^<]*)<\/loc>/g)];
assert.equal(urls.length,93,'Validate sitemap when route count changes');
let verified=0;
for(const [,route] of urls){
 const path=route?(route.endsWith('/')?route+'index.html':route):'index.html';
 const html=fs.readFileSync(path,'utf8');
 for(const [,body] of html.matchAll(/<script\b[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/gi)){
  let graph;try{graph=JSON.parse(body)}catch{continue}
  const walk=node=>{
   if(Array.isArray(node)){node.forEach(walk);return}
   if(!node||typeof node!=='object')return;
   const kinds=Array.isArray(node['@type'])?node['@type']:[node['@type']];
   if(kinds.includes('ImageObject')&&node.license&&node.acquireLicensePage){
    assert.match(node.acquireLicensePage,/^https:\/\//,path+': acquireLicensePage must be a real HTTPS page, not mailto');
    verified++;
   }
   for(const [k,v] of Object.entries(node))if(k!=='@context')walk(v);
  };walk(graph);
 }
}
assert.ok(verified>=180,'Expected multi-page Google image license records');
console.log('ART ImageObject acquisition pages are HTTPS URLs: '+verified+' records');
