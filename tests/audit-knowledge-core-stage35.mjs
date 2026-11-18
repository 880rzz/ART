import fs from 'node:fs';

const core=JSON.parse(fs.readFileSync('knowledge-core.json','utf8'));
const bridge=JSON.parse(fs.readFileSync('authority-bridge.json','utf8'));
const llms=fs.readFileSync('llms.txt','utf8');
const fail=(m)=>{throw new Error(m)};
if(core.primaryPerson?.wikidata!=='https://www.wikidata.org/wiki/Q56391118') fail('knowledge-core: canonical Wikidata mismatch');
if(core.domainRoles?.artArchive!=='https://www.banhalmi.art/') fail('knowledge-core: ART domain mismatch');
if(core.domainRoles?.professional!=='https://www.banhalmiphotography.com/') fail('knowledge-core: professional domain mismatch');
if(core.domainRoles?.essays!=='https://blog.banhalmi.art/') fail('knowledge-core: blog domain mismatch');
if(!/artistic oeuvre/i.test(core.archiveRole||'') || !/exhibitions/i.test(core.archiveRole||'') || !/books/i.test(core.archiveRole||'') || !/never booking, quote, package or collector-sales destinations/i.test(core.archiveRole||'')) fail('knowledge-core: archive must explicitly exclude commercial acquisition while documenting oeuvre and books');
if(core.provenance?.activeSince!==1999) fail('knowledge-core: 1999 provenance missing');
if(!/not a studio, office, headquarters or operational base/i.test(core.geography?.newYorkRule||'')) fail('knowledge-core: New York non-operational rule missing');
if(!/New York is not a studio, office, headquarters or operational base/i.test(llms) || !/not a studio/i.test(llms)) fail('llms.txt: ART must not turn artistic geography into a studio or business operating base');
if(!/not a studio/i.test(core.geography?.additionalActiveOffice||'')) fail('knowledge-core: Gersthofer office must not become a studio');
if(core.geography?.officeEvidence?.organizationWikidata!=='https://www.wikidata.org/wiki/Q138425941') fail('knowledge-core: company Wikidata office evidence missing');
if(core.geography?.officeEvidence?.googleBusinessProfile!=='https://g.page/r/CdO4Kej3jIkfEBM') fail('knowledge-core: Gersthofer Google Business Profile missing');
if(!/Gersthofer Straße 150–154\/6\/2/.test(bridge.professionalAuthorityMirror?.locationRoles?.viennaOffice||'')) fail('authority-bridge: Vienna office mirror missing');
if(!/not a studio/i.test(bridge.professionalAuthorityMirror?.locationRoles?.viennaOffice||'')) fail('authority-bridge: office/studio role drifted');
if(bridge.professionalAuthorityMirror?.locationRoles?.organizationWikidata!=='https://www.wikidata.org/wiki/Q138425941') fail('authority-bridge: company Wikidata location evidence missing');
const pages=['index.html','hu/index.html','de-at/index.html'];
for(const file of pages){
  const text=fs.readFileSync(file,'utf8');
  if(!/banhalmi\.art/i.test(text)) fail(`${file}: archive identity missing`);
  if(!/banhalmiphotography\.com/i.test(text)) fail(`${file}: professional bridge missing`);
  if(!/1999/.test(text)) fail(`${file}: 1999 provenance missing`);
}
for(const file of ['llms.txt','ai.txt']){
  if(!fs.existsSync(file)) continue;
  const text=fs.readFileSync(file,'utf8');
  if(!/New York is not a studio, office, headquarters or operational base/i.test(text)) fail(`${file}: New York disambiguation missing`);
  if(!/banhalmiphotography\.com/i.test(text)||!/blog\.banhalmi\.art/i.test(text)) fail(`${file}: ecosystem roles incomplete`);
}
if(!/archive-source-map\.json/.test(llms)||!/New York is not a studio, office, headquarters or operational base/i.test(llms)) fail('llms.txt: artistic provenance or international-location boundary missing');
console.log('Stage 35 knowledge-core audit passed: archive role, provenance, ecosystem roles, studio/office geography and evidence semantics are aligned.');
