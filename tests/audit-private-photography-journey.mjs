import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyArtisticIntentProjection, normalizeArchiveNav } from '../scripts/harden-production-artifact.mjs';
import { transformJsonLdScripts } from '../scripts/harden-machine-layer.mjs';

const origin='https://www.banhalmi.art';
const core=JSON.parse(fs.readFileSync('data/machine-core.json','utf8'));
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const pages=[...sitemap.matchAll(/<loc>https:\/\/www\.banhalmi\.art\/([^<]*)<\/loc>/g)]
  .map(x=>x[1]?(x[1].endsWith('/')?x[1]+'index.html':x[1]):'index.html');
const variants=[
 {locale:'en',prefix:'',home:'index.html'},
 {locale:'hu-HU',prefix:'hu/',home:'hu/index.html'},
 {locale:'de-AT',prefix:'de-at/',home:'de-at/index.html'}
];
const allowedLegal=/^https:\/\/www\.banhalmiphotography\.com\/(?:impressum\/|privacy-policy\/|trust\/|hu\/(?:impresszum\/|adatvedelem\/|bizalom\/)|de-at\/(?:impressum\/|datenschutz\/|vertrauen\/))$/;
assert.ok(pages.length>=93, 'All public artistic routes must be covered, not sampled');
let checked=0;
for(const file of [...new Set([...pages,'404.html','hu/404.html','de-at/404.html'])]){
 const html=fs.readFileSync(file,'utf8');
 const projected=normalizeArchiveNav(html);
 assert.equal(normalizeArchiveNav(projected),projected,file+': editorial menu transformation must be idempotent');
 if(html.includes('data-nav-role="collectors"')){
   assert.ok(/data-nav-role="collectors"[^>]*>(?:Artwork documentation|Művek dokumentációja|Werkdokumentation)<\/a>/.test(projected),file+': nav must identify artworks, not collectors as customers');
   assert.ok(!/Information on available works and collecting|Információk a művek elérhetőségéről és a gyűjtésről|Informationen zur Verfügbarkeit von Werken und zum Sammeln/.test(projected),file+': publication nav must not sell works');
 }

 assert.ok(!/class="m-main professional-bridge"/.test(html),file+': retired Professional navigation');
 assert.ok(!/<(?:a|button)\b[^>]*class="[^"]*\bbanhalmi-contact-dock\b/.test(html),file+': floating sales dock');
 const visibleHtml=html.replace(/<script\b[\s\S]*?<\/script>/gi,'');
 assert.ok(!/elfsight-app-|class=["'][^"']*\breviews-drawer\b/i.test(visibleHtml),file+': visible commercial client-review widget not part of personal ART');
 assert.ok(!/<script\b[^>]*src=["'][^"']*(?:elfsight\.com|trustindex\.io)[^"']*["']/i.test(html),file+': external commercial review loader prohibited');
 const body=html.replace(/<script\b[\s\S]*?<\/script>/gi,'');
 for(const m of body.matchAll(/<a\b[^>]*href=["'](https:\/\/www\.banhalmiphotography\.com[^"']+)["']/gi)){
  assert.ok(allowedLegal.test(m[1]),file+': commercial outbound link '+m[1]);
 }
 assert.ok(!/href=["'][^"']*(?:requestaquote|quote-calculator|\/ajanlatkeres\/|\/anfrage\/)[^"']*["']/.test(body),file+': business quote handoff');
 checked+=1;
}
for(const {locale,prefix,home} of variants){
 const index=fs.readFileSync(home,'utf8');

 // The exact production projection must not repeat executive/team sales
 // descriptions inside ART's legal Organization/Brand identity references.
 const artifactGraph=transformJsonLdScripts(index,{
   maxAssociatedMedia:12,dateModified:'2026-11-18',
   professionalIdentityMirror:core.professionalIdentityMirror,
   personAuthority:core.person
 }).html;
 const graphNodes=[...artifactGraph.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
   .flatMap(match=>{try{const j=JSON.parse(match[1]);return j['@graph']||[j]}catch{return []}});
 const legal=graphNodes.filter(x=>x?.['@id']===core.professionalIdentityMirror.organization.id && x?.['@type']==='Organization');
 const brand=graphNodes.filter(x=>x?.['@id']===core.professionalIdentityMirror.brand.id && x?.['@type']==='Brand');
 assert.ok(legal.length>0,locale+': legal operator attribution lost');
 assert.ok(legal.every(x=>/Legal-operator identity attribution only/.test(x.description||'')),locale+': corporate marketing leaked into ART legal schema');
 assert.ok(legal.every(x=>!('makesOffer' in x)&&!('hasOfferCatalog' in x)&&!('contactPoint' in x)),locale+': corporate sales metadata leaked into ART');
 assert.ok(brand.length>0 && brand.every(x=>/Historical brand-identity reference only/.test(x.description||'')),locale+': ART schema has a commercial team-positioning Brand');

 const privatePath=prefix+'private-photography.html';
 const page=fs.readFileSync(privatePath,'utf8');
 const openScope=locale==='en'?/any subject and style/i:locale==='hu-HU'?/bármilyen téma és stílus/i:/jedes Thema und jeden Stil/i;
 assert.match(page,openScope,locale+': personal ART must be open to any subject and style, not a single commercial category');
 assert.doesNotMatch(page.replace(/<script\b[\s\S]*?<\/script>/gi,''),/(?:EUR|HUF|€)\s*\d+/,locale+': ART personal/nude work must not publish package amounts');
 const nudePath=prefix+'exhibitions/ebredes.html';
 const nude=fs.readFileSync(nudePath,'utf8');
 assert.ok(index.includes('class="exhibition-map__row" href="exhibitions/ebredes.html"'),locale+': Ébredés remains listed in the exhibitions catalogue');
 assert.ok(!index.includes('class="m-main" href="/'+nudePath+'"'),locale+': historical Ébredés must not become a standalone main-menu item');
 assert.ok(index.includes('LIFE-JOURNEY:START'),locale+': five-period artistic narrative preserved');
 assert.ok(page.includes('rel="canonical" href="'+origin+'/'+privatePath+'"'),locale+': archived page canonical preserved');
 assert.ok(page.includes('href="/'+nudePath+'"'),locale+': historic Ébredés link preserved');
 assert.ok(!page.includes('data-private-quote="true"'),locale+': no private commercial funnel');
 assert.ok(!page.includes('data-service-choice="true"'),locale+': no service selection');
 assert.ok(!page.includes('data-artistic-nude-enquiry'),locale+': no nude quote CTA');
 assert.ok(!nude.includes('data-artistic-nude-enquiry'),locale+': no Ébredés quote CTA');
 assert.ok(!nude.includes('data-artistic-nude-service'),locale+': no Ébredés service offer');
 assert.ok(!/(?:EUR|HUF|€)\s*[0-9]+/.test(nude.replace(/<script\b[\s\S]*?<\/script>/gi,'')),locale+': never price artistic nude');
 const graphs=[...nude.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
   .flatMap(m=>JSON.parse(m[1])['@graph']||[]);
 assert.ok(graphs.some(x=>x['@type']==='ExhibitionEvent'),locale+': art exhibition entity must survive');
 assert.ok(!graphs.some(x=>x['@type']==='Service'&&x.offers),locale+': nude commercial offer not permitted');
 const provenance=fs.readFileSync(prefix+'curators.html','utf8');
 assert.ok(provenance.includes('data-artwork-provenance="true"'),locale+': factual artwork provenance preserved');
 assert.ok(!provenance.includes('data-collector-enquiry="true"'),locale+': archive must not contain a collector sales funnel');
 const section=provenance.match(/<section\b[^>]*\bid=["']collectors["'][^>]*>[\s\S]*?<\/section>/i)?.[0]||'';
 assert.ok(section && !/mailto:|\bprice\b|\bPreis\b|árat|available\s+(?:works?|prints?|editions?)|for\s+sale|Verfügbarkeit|elérhetőséget/i.test(section),locale+': archival provenance must not offer prices or collector acquisition');
}
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'art-oeuvre-projection-'));
try{
 const groups=[core.artisticIntentProjection.authorityPages,...Object.values(core.artisticIntentProjection.supportingAuthorityPages)];
 for(const pages of groups){for(const page of Object.values(pages)){fs.mkdirSync(path.dirname(path.join(temp,page.path)),{recursive:true});fs.copyFileSync(page.path,path.join(temp,page.path));}}
 for(let pass=0;pass<2;pass++){
  applyArtisticIntentProjection(temp,core.artisticIntentProjection);
  for(const {prefix,locale} of variants){
   const html=fs.readFileSync(path.join(temp,prefix+'exhibitions/ebredes.html'),'utf8');
   assert.ok(!html.includes('data-artistic-nude-enquiry'),locale+': artifact regeneration must not restore commercial quotes');
  }
 }
}finally{fs.rmSync(temp,{recursive:true,force:true});}
console.log('ART-only publication boundary passed: '+checked+' public HTML records; three-locale artistic routes, no professional quote paths, no floating sales CTA, no nude price; artifact projection idempotent.');
