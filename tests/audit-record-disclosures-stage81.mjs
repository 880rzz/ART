import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const failures=[];
const css=await readFile(path.join(root,'assets/css/record-editorial-system.css'),'utf8');
const runtime=await readFile(path.join(root,'assets/js/responsive-header-system.js'),'utf8');
const release=JSON.parse(await readFile(path.join(root,'data/design-release.json'),'utf8')).release;
if(typeof release!=='string'||release.length<8) failures.push('missing active release');
if(release&&!runtime.includes('?v='+release)) failures.push('runtime does not reference active release '+release);
for(const token of ['STAGE81-RECORD-SUPPORTING-DISCLOSURES:START','details.record-supporting','summary::after']) if(!css.includes(token)) failures.push('missing CSS '+token);
const labels={en:['Why it belongs here','Connected records','Sources & documentation'],hu:['Miért tartozik ide','Kapcsolódó rekordok','Források és dokumentáció'],de:['Warum es hierher gehört','Verbundene Einträge','Quellen und Dokumentation']};
let checked=0,wrapped=0;
for(const prefix of ['', 'hu', 'de-at']) for(const family of ['exhibitions','books']){const dir=path.join(root,prefix,family);let files=[];try{files=(await readdir(dir)).filter(f=>f.endsWith('.html'))}catch{continue}for(const file of files){const html=await readFile(path.join(dir,file),'utf8');checked++;const lang=prefix==='hu'?'hu':prefix==='de-at'?'de':'en';const markers=['RECORD-DEPTH','RECORD-RELATIONSHIPS','PROJECT-EVIDENCE'];for(let i=0;i<markers.length;i++){if(html.includes('<!-- '+markers[i]+':START -->')){wrapped++;if(!html.includes('<details class="record-supporting record-supporting--'+markers[i].toLowerCase()+'">')) failures.push(prefix+'/'+family+'/'+file+' missing disclosure '+markers[i]);if(!html.includes('<summary><span>'+labels[lang][i]+'</span></summary>')) failures.push(prefix+'/'+family+'/'+file+' wrong summary '+markers[i]);}}if(/<details class="record-supporting[^>]*\sopen(?:\s|>)/i.test(html)) failures.push(prefix+'/'+family+'/'+file+' supporting disclosure must default closed');}}
if(wrapped===0) failures.push('no record supporting blocks found');
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('Stage 81 record disclosure audit passed: '+checked+' record pages checked, '+wrapped+' supporting archive blocks remain default closed across EN/HU/DE-AT under the active release.');
