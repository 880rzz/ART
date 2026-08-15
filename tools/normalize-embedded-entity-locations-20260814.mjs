import fs from 'node:fs';
import path from 'node:path';

const PERSON_ID='https://www.norbertbanhalmi.com/about/';
const ORG_ID='https://www.norbertbanhalmi.com/#organization';
const refs=[
  {'@id':'https://www.norbertbanhalmi.com/#vienna-studio'},
  {'@id':'https://www.norbertbanhalmi.com/#budapest-studio'},
  {'@id':'https://www.norbertbanhalmi.com/#vienna-gersthofer-office'}
];
const skip=new Set(['.git','node_modules','_site','dist','coverage','assets','.well-known']);
let changedPages=0,personObjects=0,orgObjects=0;

const sameType=(node,type)=>node?.['@type']===type||(Array.isArray(node?.['@type'])&&node['@type'].includes(type));
const refIds=value=>(Array.isArray(value)?value:value?[value]:[]).map(v=>typeof v==='string'?v:v?.['@id']).filter(Boolean);
const targetIds=refs.map(r=>r['@id']);
const sameRefs=value=>{const ids=refIds(value);return ids.length===targetIds.length&&targetIds.every(id=>ids.includes(id));};

function normalizeJsonLd(raw){
  let data;try{data=JSON.parse(raw)}catch{return {raw,changed:false};}
  const graph=Array.isArray(data?.['@graph'])?data['@graph']:[data];
  let changed=false;
  for(const node of graph){
    if(node?.['@id']===PERSON_ID&&sameType(node,'Person')){
      personObjects++;
      if(Object.hasOwn(node,'homeLocation')){delete node.homeLocation;changed=true;}
      if(!sameRefs(node.workLocation)){node.workLocation=refs.map(r=>({...r}));changed=true;}
    }
    if(node?.['@id']===ORG_ID&&sameType(node,'Organization')){
      orgObjects++;
      if(!sameRefs(node.location)){node.location=refs.map(r=>({...r}));changed=true;}
    }
  }
  return {raw:changed?JSON.stringify(data):raw,changed};
}

function inspect(file){
  const rel=file.replaceAll('\\','/');let html=fs.readFileSync(file,'utf8');let pageChanged=false;
  html=html.replace(/(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,(all,open,raw,close)=>{
    const result=normalizeJsonLd(raw);if(result.changed)pageChanged=true;return open+result.raw+close;
  });
  if(pageChanged){fs.writeFileSync(file,html);changedPages++;console.log(`${rel}: normalized canonical Person/Organization work locations and removed residence misuse.`);}
}
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.isDirectory()&&skip.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.html'))inspect(p)}}
walk('.');
if(personObjects<20||orgObjects<20)throw new Error(`Embedded entity coverage unexpectedly low: Person ${personObjects}, Organization ${orgObjects}`);
console.log(`Normalized ART embedded entity locations across ${changedPages} pages; inspected Person ${personObjects}, Organization ${orgObjects}.`);
