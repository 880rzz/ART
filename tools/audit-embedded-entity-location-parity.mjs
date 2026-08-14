import fs from 'node:fs';
import path from 'node:path';

const PERSON_ID='https://www.norbertbanhalmi.com/about/';
const ORG_ID='https://www.norbertbanhalmi.com/#organization';
const EXPECTED=[
  'https://www.norbertbanhalmi.com/#vienna-studio',
  'https://www.norbertbanhalmi.com/#budapest-studio',
  'https://www.norbertbanhalmi.com/#vienna-gersthofer-office'
];
const failures=[];
const authority=JSON.parse(fs.readFileSync('authority-bridge.json','utf8'));
const roles=authority?.professionalAuthorityMirror?.locationRoles||{};
if(!/physical photography studio/i.test(roles.viennaStudio||''))failures.push('authority-bridge: Vienna studio role drift');
if(!/office and client meeting location/i.test(roles.viennaOffice||'')||!/not a studio/i.test(roles.viennaOffice||''))failures.push('authority-bridge: Gersthofer office/non-studio role drift');
if(!/physical studio/i.test(roles.budapestStudio||''))failures.push('authority-bridge: Budapest studio role drift');

const skip=new Set(['.git','node_modules','_site','dist','coverage','assets','.well-known']);
const sameType=(node,type)=>node?.['@type']===type||(Array.isArray(node?.['@type'])&&node['@type'].includes(type));
const refs=value=>(Array.isArray(value)?value:value?[value]:[]).map(v=>typeof v==='string'?v:v?.['@id']).filter(Boolean);
let personObjects=0,orgObjects=0,pages=0;
function checkRefs(rel,label,value){const ids=refs(value);if(ids.length!==EXPECTED.length||!EXPECTED.every(id=>ids.includes(id)))failures.push(`${rel}: ${label} must reference Vienna studio, Budapest studio and Gersthofer office exactly once; got ${JSON.stringify(ids)}`)}
function inspect(file){const rel=file.replaceAll('\\','/');const html=fs.readFileSync(file,'utf8');let pageHas=false;for(const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){let data;try{data=JSON.parse(m[1])}catch(e){failures.push(`${rel}: invalid JSON-LD (${e.message})`);continue;}const graph=Array.isArray(data?.['@graph'])?data['@graph']:[data];const person=graph.find(n=>n?.['@id']===PERSON_ID&&sameType(n,'Person'));const org=graph.find(n=>n?.['@id']===ORG_ID&&sameType(n,'Organization'));if(person){pageHas=true;personObjects++;checkRefs(rel,'Person.workLocation',person.workLocation)}if(org){pageHas=true;orgObjects++;checkRefs(rel,'Organization.location',org.location)}}if(pageHas)pages++;}
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.isDirectory()&&skip.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.html'))inspect(p)}}
walk('.');
if(personObjects<20)failures.push(`embedded Person coverage unexpectedly low: ${personObjects}`);
if(orgObjects<20)failures.push(`embedded Organization coverage unexpectedly low: ${orgObjects}`);
if(failures.length){console.error('ART embedded entity location parity FAILED:\n'+failures.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log(`ART embedded entity location parity passed across ${pages} pages; Person ${personObjects}, Organization ${orgObjects}.`);
