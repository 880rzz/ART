import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyArtisticIntentProjection } from '../scripts/harden-production-artifact.mjs';

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
 const privatePath=prefix+'private-photography.html';
 const page=fs.readFileSync(privatePath,'utf8');
 const openScope=locale==='en'?/any subject and style/i:locale==='hu-HU'?/bármilyen téma és stílus/i:/jedes Thema und jeden Stil/i;
 assert.match(page,openScope,locale+': personal ART must be open to any subject and style, not a single commercial category');
 assert.doesNotMatch(page.replace(/<script\b[\s\S]*?<\/script>/gi,''),/(?:EUR|HUF|€)\s*\d+/,locale+': ART personal/nude work must not publish package amounts');
 const nudePath=prefix+'exhibitions/ebredes.html';
 const nude=fs.readFileSync(nudePath,'utf8');
 assert.ok(index.includes('href="/'+nudePath+'"'),locale+': Ébredés remains in artistic menu');
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
 assert.ok(fs.readFileSync(prefix+'curators.html','utf8').includes('id="collectors"'),locale+': artwork enquiry remains');
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
