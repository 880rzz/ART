import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const htmlFiles=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules','_site'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html'))htmlFiles.push(p);}}
walk(root);

let gaPatched=0, schemaPatched=0;
for(const file of htmlFiles){
  let html=fs.readFileSync(file,'utf8');
  const before=html;
  if(html.includes('G-90C452LJKQ') && !html.includes("ad_storage':'denied'")){
    html=html.replace("analytics_storage':'denied'", "analytics_storage':'denied','ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','personalization_storage':'denied'");
    if(html!==before) gaPatched++;
  }
  html=html.replace(/<script([^>]+type=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi,(whole,attrs,raw)=>{
    let data;
    try{data=JSON.parse(raw);}catch{return whole;}
    const graph=Array.isArray(data?.['@graph'])?data['@graph']:[data];
    let changed=false;
    for(const node of graph){
      const types=Array.isArray(node?.['@type'])?node['@type']:[node?.['@type']];
      if(!types.includes('Person'))continue;
      if(Array.isArray(node.memberOf)){
        const clean=node.memberOf.filter(item=>!(/OM SYSTEM|Olympus/i.test(typeof item==='string'?item:(item?.name||''))));
        if(clean.length!==node.memberOf.length){node.memberOf=clean;changed=true;}
      }
      const aff=Array.isArray(node.affiliation)?node.affiliation:[];
      if(!aff.some(item=>/OM SYSTEM/i.test(typeof item==='string'?item:(item?.name||'')))){
        node.affiliation=[...aff,{"@type":"Organization","name":"OM SYSTEM","url":"https://explore.omsystem.com/"}];changed=true;
      }
      const props=Array.isArray(node.additionalProperty)?node.additionalProperty:[];
      if(!props.some(item=>item?.propertyID==='professionalRole' && /OM SYSTEM Ambassador/i.test(item?.name||''))){
        node.additionalProperty=[...props,{"@type":"PropertyValue","propertyID":"professionalRole","name":"OM SYSTEM Ambassador","value":"Since 2018-09-18"}];changed=true;
      }
    }
    if(!changed)return whole;
    schemaPatched++;
    return `<script${attrs}>${JSON.stringify(data)}</script>`;
  });
  if(html!==before) fs.writeFileSync(file,html);
}
console.log(`HTML hardening: GA changed on ${gaPatched} files; JSON-LD blocks changed: ${schemaPatched}`);

function appendSection(file,title,body){
  let text=fs.readFileSync(file,'utf8');
  if(text.includes(`## ${title}`))return;
  text += `\n\n## ${title}\n${body}\n`;
  fs.writeFileSync(file,text);
}
const policy='BANHALMI follows the transparency principle of Article 50 of Regulation (EU) 2024/1689. Synthetic or materially AI-manipulated image, audio or video content is disclosed when it could reasonably be mistaken for authentic content; artistic disclosures are made in an appropriate manner. AI-assisted public-interest information remains under human editorial review and a responsible human publisher. AI does not independently decide publication, sensitive retouching, biometric categorisation or who is photographed. Client-confidential material is not intentionally submitted for public-model training. Authoritative governance: https://www.norbertbanhalmi.com/trust/ . Privacy: https://www.norbertbanhalmi.com/privacy-policy/ . Legal notice: https://www.norbertbanhalmi.com/impressum/ .';
appendSection('ai.txt','AI transparency and human editorial responsibility',policy);
const llmsLinks='- [Trust Center](https://www.norbertbanhalmi.com/trust/): EU AI Act Article 50 transparency policy, synthetic-content disclosure and human editorial responsibility.\n- [Privacy policy](https://www.norbertbanhalmi.com/privacy-policy/): controller, processors, retention and data-subject rights.\n- [Legal notice](https://www.norbertbanhalmi.com/impressum/): Austrian operator identity and legal disclosure.';
appendSection('llms.txt','AI transparency and trust route',llmsLinks);

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
if(!pkg.scripts.test.includes('audit-strict-trust-legal-stage48.mjs')) pkg.scripts.test += ' && node tests/audit-strict-trust-legal-stage48.mjs';
pkg.scripts['test:strict-trust-legal']='node tests/audit-strict-trust-legal-stage48.mjs';
fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');
