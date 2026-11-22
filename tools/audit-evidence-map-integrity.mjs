#!/usr/bin/env node
// Strict publication-source audit. External evidence and archived routes
// are preserved; commercial Service paths may not be reintroduced.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const map=read('service-evidence-map.json');
const deep=read('deep-search-evidence.json');
const verified=new Set((deep.verifiedRecords||[]).map(x=>x.id));
const pending=new Set((deep.pendingCandidates||[]).map(x=>x.id));
assert.equal(map['@type'],'Dataset','artistic evidence must remain structured Dataset');
assert.equal(map.canonicalPerson,'https://www.banhalmi.art/#about','stable Person provenance');
assert.ok(!('services' in map) && !('professionalAuthority' in map),'commercial service graph reintroduced');
for(const [theme,ids] of Object.entries(map.artisticResearchMappings||{})){
 assert.ok(Array.isArray(ids),theme+': mapping not an array');
 for(const id of ids){assert.ok(verified.has(id),theme+': unverified '+id);assert.ok(!pending.has(id),theme+': pending '+id);}
}
for(const entry of map.exhibitionMappings||[]){
 assert.ok(map.artisticThemes?.[entry.artisticTheme],entry.id+': no historical theme');
 assert.ok(!('service' in entry),entry.id+': professional service attachment');
 for(const lang of ['en','hu','de']){
  assert.ok(entry.urls?.[lang]?.startsWith('https://www.banhalmi.art/'),entry.id+': missing ART '+lang);
  assert.ok(map.artisticThemes[entry.artisticTheme][lang]?.startsWith('https://www.banhalmi.art/'),entry.id+': missing ART theme '+lang);
 }
 for(const source of entry.supportingEvidence||[])assert.match(source,/^https:\/\//,entry.id+': unqualified source');
}
for(const entry of map.pressMappings||[]){
 assert.ok(map.artisticThemes?.[entry.artisticTheme],entry.record+': unlinked cultural context');
 assert.match(entry.sourceUrl||'',/^https:\/\//,entry.record+': missing HTTPS evidence');
 assert.ok(!('service' in entry),entry.record+': commercial service attachment');
}
for(const category of ['artisticPortrait','lifestyleFashion','artisticNudeBoudoir']){
 const theme=map.artVisitorThemes?.[category];
 assert.ok(theme?.htmlIds?.length,category+': lost visitor theme');
 for(const lang of ['en','hu','de'])assert.ok(theme.routes?.[lang]?.startsWith('https://www.banhalmi.art/'),category+': lost '+lang);
 assert.ok(!('professionalCapability' in theme),category+': professional sales classification');
}
assert.ok(map.artVisitorThemes.artisticNudeBoudoir.subtypes.artisticNude.canonicalRoutes.en.endsWith('/exhibitions/ebredes.html'),'Ébredés route missing');
assert.doesNotMatch(JSON.stringify(map),/banhalmiphotography\.com\/[^"\s]*#(?:service|professional-portfolio|request-quote)/i,'business conversion edge in artistic evidence');
assert.ok((map.exhibitionMappings||[]).length>=4 && (map.pressMappings||[]).length>=6,'verified exhibition/press mapping degraded');
console.log('ART source evidence passed: verified source IDs, four exhibitions, six press records, three languages, artistic-only thematic routes.');
