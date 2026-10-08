import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const now=Date.UTC(2026,9,8),ttl=180*24*60*60*1000;
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>['.git','node_modules','_site'].includes(e.name)?[]:e.isDirectory()?walk(path.join(d,e.name)):e.name.endsWith('.html')?[path.join(d,e.name)]:[])}
let pages=0;
for(const file of walk('.')){
 const h=fs.readFileSync(file,'utf8');const script=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes("localStorage.getItem('bn-consent')"));if(!script)continue;pages++;
 for(const [name,record,granted,banner] of [
  ['missing',null,false,true],['legacy grant','granted',false,true],['legacy denial','denied',false,true],['broken JSON','{',false,true],
  ['fresh grant',JSON.stringify({value:'granted',at:now-1000}),true,false],['fresh denial',JSON.stringify({value:'denied',at:now-1000}),false,false],
  ['expiry boundary',JSON.stringify({value:'granted',at:now-ttl}),false,true],['expired',JSON.stringify({value:'granted',at:now-ttl-1}),false,true],
  ['future timestamp',JSON.stringify({value:'granted',at:now+1000}),false,true],['string timestamp',JSON.stringify({value:'granted',at:String(now)}),false,true],
  ['unknown choice',JSON.stringify({value:'yes',at:now-1000}),false,true]
 ]){
  const requests=[],panel={hidden:true},store=new Map(record===null?[]:[['bn-consent',record]]);
  const sandbox={Date:class extends Date{static now(){return now}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},document:{cookie:'',head:{appendChild:s=>requests.push(s.src)},createElement:()=>({}),getElementById:()=>panel,addEventListener:(event,cb)=>{if(event==='DOMContentLoaded')cb()}}};sandbox.window=sandbox;
  vm.runInNewContext(script,sandbox,{timeout:1000});assert.equal(requests.length>0,granted,`${file}: ${name} optional requests`);assert.equal(!panel.hidden,banner,`${file}: ${name} consent prompt`);
  if(granted){assert.equal(requests.length,2);assert.ok(requests.some(u=>u.includes('googletagmanager')));assert.ok(requests.some(u=>u.includes('clarity.ms')))}
  sandbox.bnConsent(false);const renewed=JSON.parse(store.get('bn-consent'));assert.deepEqual(renewed,{value:'denied',at:now},`${file}: renewed denial timestamp`);
 }
}
assert.equal(pages,87);console.log(`Consent expiry behavior passed: ${pages} pages × 11 stored-choice scenarios; untimestamped, expired and invalid consent cannot load analytics.`);
