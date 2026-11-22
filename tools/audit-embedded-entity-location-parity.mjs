import fs from 'node:fs';
import path from 'node:path';
import { transformJsonLdScripts } from '../scripts/harden-machine-layer.mjs';

// Verify exactly what the Pages artifact publishes, not the historical
// raw authoring graph. Legal Person and Organization @id remain stable.
const personId='https://www.banhalmi.art/#about';
const orgId='https://www.banhalmiphotography.com/#organization';
const core=JSON.parse(fs.readFileSync('data/machine-core.json','utf8'));
const qPerson='https://www.wikidata.org/wiki/Q56391118';
const skip=new Set(['.git','node_modules','_site','dist','coverage','assets','.well-known']);
const failures=[];
let pages=0,personObjects=0,orgObjects=0;
function array(value){return Array.isArray(value)?value:value?[value]:[]}
function inspect(file){
 const rel=file.replaceAll('\\','/');
 const html=fs.readFileSync(file,'utf8');
 const transformed=transformJsonLdScripts(html,{maxAssociatedMedia:12,dateModified:'2026-11-18',professionalIdentityMirror:core.professionalIdentityMirror,personAuthority:core.person}).html;
 let found=false;
 for(const match of transformed.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  let data;
  try{data=JSON.parse(match[1])}catch(e){failures.push(rel+': invalid JSON-LD '+e.message);continue}
  const graph=Array.isArray(data?.['@graph'])?data['@graph']:[data];
  for(const node of graph){
   const id=String(node?.['@id']||'');
   const types=array(node?.['@type']);
   if(id===personId&&types.includes('Person')){
    found=true;personObjects++;
    if(node.workLocation||node.worksFor||node.homeLocation)failures.push(rel+': Person includes business locations/employment');
    if(!array(node.sameAs).includes(qPerson))failures.push(rel+': canonical Wikidata person lost');
   }
   if(id===orgId&&types.includes('Organization')){
    found=true;orgObjects++;
    for(const key of ['location','contactPoint','makesOffer','hasOfferCatalog','telephone','areaServed'])
     if(key in node)failures.push(rel+': legal identity includes business attribute '+key);
   }
   if(id.startsWith('https://www.banhalmiphotography.com/#')&&types.some(t=>['ProfessionalService','LocalBusiness','Service','Place','WebSite'].includes(t)))
    failures.push(rel+': materialized business entity '+id);
  }
 }
 if(found)pages++;
}
function walk(dir){
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  if(e.isDirectory()&&skip.has(e.name))continue;
  const abs=path.join(dir,e.name);
  if(e.isDirectory())walk(abs);
  else if(e.isFile()&&e.name.endsWith('.html'))inspect(abs);
 }
}
walk('.');
if(pages<90||personObjects<20||orgObjects<20)failures.push('ART projected entity coverage degraded '+JSON.stringify({pages,personObjects,orgObjects}));
if(failures.length){console.error('ART publication identity boundary FAILED:\n'+failures.join('\n'));process.exit(1)}
console.log('ART publication identity passed: '+pages+' pages projected; legal identity and Person Wikidata retained, no materialized business places or services.');
