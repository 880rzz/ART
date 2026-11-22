import assert from 'node:assert/strict';
import { transformJsonLdScripts } from '../scripts/harden-machine-layer.mjs';

const personId = 'https://www.banhalmi.art/#about';
const person = {
  '@type':'Person', '@id':personId, name:'Bánhalmi Norbert',
  description:'Strategic visual partnership for C-level executive clients',
  jobTitle:['Fine-art photographer','Executive portrait photographer'],
  knowsAbout:['Executive branding','Corporate services'],
  worksFor:{'@id':'https://www.banhalmiphotography.com/#organization'},
  workLocation:[{'@id':'https://www.banhalmiphotography.com/#vienna-studio'}],
  memberOf:[{'@type':'Organization',name:'AmCham Austria'}]
};
for (const language of ['en','hu','de-AT']) {
  const source = `<html lang="${language}"><head><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':[person]})}</script></head></html>`;
  const result = transformJsonLdScripts(source,{
    maxAssociatedMedia:12, dateModified:'2026-11-18',
    professionalIdentityMirror:{},
    personAuthority:{wikidata:'https://www.wikidata.org/wiki/Q56391118',activeSocialProfiles:[]}
  });
  const graph = JSON.parse(result.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const art = graph.find(node=>node['@type']==='Person' && node['@id']===personId);
  assert.ok(art, language+': source person preserved');
  assert.ok(/presence|jelenlét|Präsenz/i.test(art.description),language+': artist-first presence thesis');
  assert.ok(/photographic artist/i.test(art.jobTitle.join(' ')),language+': artwork role');
  assert.ok(art.knowsAbout.includes('Artistic nude photography'),language+': relevant artistic subject');
  assert.ok(!/executive|C-level|corporate|branding|portfolio package/i.test(JSON.stringify({description:art.description,jobTitle:art.jobTitle,knowsAbout:art.knowsAbout})),language+': no professional service promotion');
  for (const forbidden of ['workLocation','worksFor','memberOf']) assert.ok(!(forbidden in art),language+': '+forbidden+' must not be cloned into ART graph');
  assert.ok(art.sameAs.includes('https://www.wikidata.org/wiki/Q56391118'),language+': canonical Wikidata kept');
  assert.equal(transformJsonLdScripts(result.html,{maxAssociatedMedia:12,dateModified:'2026-11-18',professionalIdentityMirror:{},personAuthority:{wikidata:'https://www.wikidata.org/wiki/Q56391118',activeSocialProfiles:[]}}).html,result.html,language+': production projection idempotent');
}
console.log('ART Person Schema projection: EN/HU/de-AT artist-only identity, no C-level promotion, no operational network copy, immutable Wikidata.');
