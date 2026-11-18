import fs from 'node:fs';
import assert from 'node:assert/strict';
import { transformJsonLdScripts } from '../scripts/harden-machine-layer.mjs';
const map=JSON.parse(fs.readFileSync('service-evidence-map.json','utf8'));
const core=JSON.parse(fs.readFileSync('data/machine-core.json','utf8'));
const eco=JSON.parse(fs.readFileSync('ecosystem-bridge.json','utf8'));
assert.equal(map['@type'],'Dataset');
assert.equal(map.canonicalPerson,'https://www.banhalmiphotography.com/about/');
assert.ok(!('services' in map),'business service catalogue prohibited');
assert.ok(!('commercialFineArtBridge' in eco),'commercial Fine Art route reintroduced');
assert.ok(eco.artisticJourneyBridge?.artisticEvidenceMap==='https://www.banhalmi.art/service-evidence-map.json');
assert.ok(!eco.artisticJourneyBridge?.visitorThemes?.professionalHandoff,'professional handoff prohibited');
for(const lang of ['en','hu','de']){
 assert.ok(map.artisticThemes?.presencePortrait?.[lang]?.startsWith('https://www.banhalmi.art/'));
 assert.ok(map.artisticThemes?.bodyIdentity?.[lang]?.endsWith('/exhibitions/ebredes.html'));
}
const exhibitions=['euforia','ebredes','femmefatale','balerina-project-new-york'];
for(const id of exhibitions)assert.ok(map.exhibitionMappings.some(x=>x.id===id),'historical exhibition lost: '+id);
const press=['press-06','press-07','press-09','press-15','press-21','press-24'];
for(const id of press)assert.ok(map.pressMappings.some(x=>x.record===id),'historical press credit lost: '+id);
for(const locale of ['','hu/','de-at/']){
 for(const id of exhibitions){
  const file=locale+'exhibitions/'+id+'.html';
  const html=fs.readFileSync(file,'utf8');
  assert.ok(html.includes('https://www.banhalmi.art/service-evidence-map.json'),file+': source index lost');
  const projected=transformJsonLdScripts(html,{maxAssociatedMedia:12,dateModified:'2026-11-18',professionalIdentityMirror:core.professionalIdentityMirror,personAuthority:core.person}).html;
  assert.doesNotMatch(projected,/https:\/\/www\.banhalmiphotography\.com\/[^"\s]*#(?:service|professional-portfolio|request-quote)/i,file+': exported business service edge');
 }
 const privatePage=fs.readFileSync(locale+'private-photography.html','utf8');
 assert.ok(privatePage.includes('href="/'+locale+'exhibitions/ebredes.html"'),locale+': art-nude to Ébredés link lost');
 assert.doesNotMatch(privatePage.replace(/<script\b[\s\S]*?<\/script>/gi,''),/href=["']https:\/\/www\.banhalmiphotography\.com\/fine-art\//i,locale+': commission handoff');
}
for(const x of map.pressMappings)assert.match(x.sourceUrl,/^https:\/\//,'source provenance lost');
const refs=map.externalPublicationEvidence||{};
assert.ok((refs.eventEvidenceIncludes||[]).includes('linkedin-us-embassy-vienna-7422226435219607553'),'U.S. Embassy Vienna credit lost');
assert.ok((refs.eventEvidenceIncludes||[]).includes('linkedin-kwwalsh-selectusa-7505169409309782017'),'SelectUSA documentation lost');
console.log('Art-only evidence publication passed: historical credits preserved without sales-linked service classification; 3L exhibition schema projected.');
