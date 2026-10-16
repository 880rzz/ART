import fs from 'node:fs';
import assert from 'node:assert/strict';

const parts=['context','photograph','interpretation','provenance','circulation'];
const pages=[['','Details and documentation'],['hu/','Részletek és dokumentáció'],['de-at/','Details und Dokumentation']];
const inventories=[];
for(const [prefix,label] of pages){
 const path=prefix+'exhibitions/euforia.html',html=fs.readFileSync(path,'utf8');
 const openings=[...html.matchAll(/<details\b[^>]*data-euforia-record="([^"]+)"[^>]*>/g)];
 const ids=openings.map(m=>m[1]);
 assert.ok(ids.length>=4,path+': every existing and future work needs a disclosure');
 assert.equal(new Set(ids).size,ids.length,path+': record identifiers must be unique');
 assert.equal((html.match(/id="euforia-work-/g)||[]).length,ids.length,path+': every displayed work owns one record');
 for(const m of openings){
  assert.ok(!/\sopen(?:\s|=|>)/.test(m[0]),path+': records start closed');
  let depth=1,end=-1;
  const tags=/<\/?details\b[^>]*>/g;tags.lastIndex=m.index+m[0].length;
  for(let n;(n=tags.exec(html));){depth+=n[0].startsWith('</')?-1:1;if(!depth){end=n.index;break;}}
  assert.ok(end>m.index,path+': balanced disclosure '+m[1]);
  const body=html.slice(m.index,end);
  assert.ok(body.includes('<summary>'+label+'</summary>'),path+': localized summary');
  assert.deepEqual([...body.matchAll(/data-record-part="([^"]+)"/g)].map(x=>x[1]),parts,path+': five ordered topics for '+m[1]);
  for(const part of parts)assert.ok(body.includes('id="'+m[1]+'-record-'+part+'"'),path+': stable topic anchor '+part);
  if(m[1]==='peter')for(const id of ['euforia-public-history','peter-magyar-provenance','peter-magyar-portrait'])assert.ok(body.includes('id="'+id+'"'),path+': complete first-work dossier stays in its own disclosure');
  if(['fellegi','bence'].includes(m[1]))assert.ok(body.includes('data-record-status="collecting"'),path+': incomplete circulation record has an explicit status');
 }
 inventories.push(ids);
}
for(const ids of inventories.slice(1))assert.deepEqual(ids,inventories[0],'all languages expose the same works');
const css=fs.readFileSync('assets/css/site.css','utf8');
for(const token of ['.euforia-record>summary{font-size:1rem','.euforia-record-content{padding:clamp(1rem,2vw,1.5rem);max-width:72ch','.euforia-record-content p{font-size:1rem;font-weight:400;line-height:1.65','.euforia-record-part+.euforia-record-part{margin-top:2rem'])assert.ok(css.includes(token),'canonical typography missing: '+token);
assert.ok(css.includes('.euforia-artwork{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))'),'desktop EUFORIA artwork contract must use two columns');
assert.ok(css.includes('@media(max-width:820px){\n .euforia-artwork,.euforia-artwork--reverse{grid-template-columns:1fr'),'EUFORIA artwork contract must collapse to one column at 820px');
assert.ok(css.includes('.euforia-artwork--reverse .euforia-artwork__media{order:1}')&&css.includes('.euforia-artwork--reverse .euforia-artwork__copy{order:0}'),'desktop reverse artwork must alternate image and copy while mobile restores image-first order');
assert.ok(css.includes('p.meta:has(>a[data-external="true"]){display:grid;grid-template-columns:repeat(2,minmax(0,1fr))'),'EUFORIA evidence links must use an aligned two-column grid');
assert.ok(css.includes('p.meta:has(>a[data-external="true"])>a{display:flex;align-items:center;width:100%'),'EUFORIA evidence links must own their full grid cell without separator drift');
assert.ok(css.includes('@media(max-width:700px){.euforia-artwork__copy .euforia-record-content p.meta:has(>a[data-external="true"]){grid-template-columns:1fr;}'),'EUFORIA evidence links must collapse to one column on small screens');
assert.ok(fs.existsSync('EUFORIA-GALLERY-CONTRACT.md'),'normative gallery rules must ship with source');

// Prevent reintroducing literal middle-dot separators as anonymous grid items.
for(const [prefix] of pages){
 const path=prefix+'exhibitions/euforia.html';
 const html=fs.readFileSync(path,'utf8');
 assert.ok(!/<\/a>\s*·\s*<a\b/.test(html),path+': adjacent evidence links must not have middle-dot separators');
 const evidence=[...html.matchAll(/<p class="meta">((?:(?!<\/p>)[\s\S])*?<a\b[^>]*data-external="true"[^>]*>[\s\S]*?<\/a>[\s\S]*?)<\/p>/g)];
 for(const group of evidence){
  const textOnly=group[1].replace(/<a\b[^>]*>[\s\S]*?<\/a>/g,'').trim();
  assert.ok(!/^[·\s]+$/.test(textOnly),path+': evidence group contains standalone separator text');
 }
}

console.log('EUFORIA gallery contract passed: every work, five ordered topics, localized closed disclosures, evidence containment and canonical typography.');
