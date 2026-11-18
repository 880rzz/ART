import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
for(const path of ['community.html','hu/community.html','de-at/community.html']){
  const html=read(path);
  for(const source of [
    'https://apatsagicukraszda.hu/rolunk',
    'https://www.regegaleria.hu/m%C3%A9dia',
    'https://www.vipach.at/kapcsolat/impresszum',
    'https://www.vipach.at/event-details/spontan-vipach-fotokiallitas-2026'
  ]) assert.ok(html.includes(source),path+' missing source '+source);
  assert.ok(!html.includes('Be Smart Kids Club'),path+' must not restore non-art AI programme');
  assert.ok(!html.includes('700+'),path+' must not claim unsupported member count');
}
for(const path of ['person-authority.jsonld','ecosystem-bridge.jsonld']){
  const data=JSON.parse(read(path)), matches=[];
  const visit=(value)=>{
    if(!value || typeof value!=='object')return;
    if(Array.isArray(value)){value.forEach(visit);return;}
    if(value['@id']==='https://www.vipach.at/#organization')matches.push(value);
    Object.values(value).forEach(visit);
  };
  visit(data);
  assert.ok(matches.length>0,path+' missing VIPACH identity');
  for(const affiliation of matches){
    assert.ok(String(affiliation.description||'').includes('not an independent legal entity'),path+' missing role distinction');
    assert.ok(String(affiliation.description||'').includes('not employment, ownership of the federation'),path+' implies legal ownership');
  }
}
console.log('ART REGE/VIPACH 3L sources and legal-role boundaries consistent.');
