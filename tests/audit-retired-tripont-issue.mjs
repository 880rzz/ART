import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const retiredUrl=['https://issuu.com/','tripont/docs/','issue_trip_magazin/76'].join('');
const retiredId=['trip','magazin','76'].join('-');
const allowedText=new Set(['.html','.json','.jsonld','.mjs','.js','.ts','.tsx','.py','.md','.txt','.xml','.yml','.yaml','.css','.csv','.toml','.svg']);
const paths=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const violations=[];
for(const file of paths){
  if(!allowedText.has(path.extname(file).toLowerCase()))continue;
  if(!fs.existsSync(file)||fs.statSync(file).size>8_000_000)continue;
  const content=fs.readFileSync(file,'utf8');
  if(content.includes(retiredUrl)||content.includes(retiredId))violations.push(file+': retired URL or source ID restored by a source registry or generator');
}
const chapters=['exhibitions/ebredes.html','hu/exhibitions/ebredes.html','de-at/exhibitions/ebredes.html',
                'exhibitions/touch-wien.html','hu/exhibitions/touch-wien.html','de-at/exhibitions/touch-wien.html'];
for(const file of chapters){
 const text=fs.readFileSync(file,'utf8');
 if(text.includes('historical-source-reference')||text.includes('Tripont Mag')||text.includes('tripont/docs'))violations.push(file+': obsolete magazine reference remains visible');
}
const inventory=JSON.parse(fs.readFileSync('data/wikidata-source-inventory.json','utf8'));
const registry=JSON.parse(fs.readFileSync('wikidata-source-registry.json','utf8'));
const master=JSON.parse(fs.readFileSync('master-source-database.json','utf8'));
const deep=JSON.parse(fs.readFileSync('deep-search-evidence.json','utf8'));
if(inventory.sources.length!==registry.sources.length)violations.push('Wikidata inventory/registry source count mismatch');
if(registry.sourceCount!==registry.sources.length||registry.sources.length<23)violations.push('Wikidata registry sourceCount invalid');
if(master.sourceCount!==master.sources.length||deep.masterSourceCount!==master.sources.length)violations.push('Master-source inventory and dependent deep-search count mismatch');
if(violations.length){console.error(violations.join('\n'));process.exit(1)}
console.log('Retired Tripont issue absent from tracked sources, generators and six localized art pages; source counts consistent.');
