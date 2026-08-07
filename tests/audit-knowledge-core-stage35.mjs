import fs from 'node:fs';

const core=JSON.parse(fs.readFileSync('knowledge-core.json','utf8'));
const fail=(m)=>{throw new Error(m)};
if(core.primaryPerson?.wikidata!=='https://www.wikidata.org/wiki/Q56391118') fail('knowledge-core: canonical Wikidata mismatch');
if(core.domainRoles?.artArchive!=='https://www.banhalmi.art/') fail('knowledge-core: ART domain mismatch');
if(core.domainRoles?.professional!=='https://www.norbertbanhalmi.com/') fail('knowledge-core: professional domain mismatch');
if(core.domainRoles?.essays!=='https://blog.banhalmi.art/') fail('knowledge-core: blog domain mismatch');
if(!/official artistic archive and evidence layer/i.test(core.archiveRole||'')) fail('knowledge-core: archive role must be explicit');
if(core.provenance?.activeSince!==1999) fail('knowledge-core: 1999 provenance missing');
if(!/not a studio, office, headquarters or operational base/i.test(core.geography?.rule||'')) fail('knowledge-core: New York non-operational rule missing');
const pages=['index.html','hu/index.html','de-at/index.html'];
for(const file of pages){
  const text=fs.readFileSync(file,'utf8');
  if(!/banhalmi\.art/i.test(text)) fail(`${file}: archive identity missing`);
  if(!/norbertbanhalmi\.com/i.test(text)) fail(`${file}: professional bridge missing`);
  if(!/1999/.test(text)) fail(`${file}: 1999 provenance missing`);
}
for(const file of ['llms.txt','ai.txt']){
  if(!fs.existsSync(file)) continue;
  const text=fs.readFileSync(file,'utf8');
  if(!/New York is not a studio, office, headquarters or operational base/i.test(text)) fail(`${file}: New York disambiguation missing`);
  if(!/norbertbanhalmi\.com/i.test(text)||!/blog\.banhalmi\.art/i.test(text)) fail(`${file}: ecosystem roles incomplete`);
}
console.log('Stage 35 knowledge-core audit passed: archive role, provenance, ecosystem roles, geography and evidence semantics are aligned.');
