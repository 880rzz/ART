import assert from 'node:assert/strict';
import fs from 'node:fs';
import { transformJsonLdScripts } from '../scripts/harden-machine-layer.mjs';

const origin = 'https://www.banhalmi.art/';
const portraitId = origin + '#about#portrait';
const portraitFile = 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Norbert-Banhalmi-self-portrait.jpg';
const legalId = 'https://www.banhalmiphotography.com/#organization';
const core = JSON.parse(fs.readFileSync('data/machine-core.json','utf8'));
const patterns = {
  en: { site: /official archive/, role: 'Photographic artist', subject:'Human presence', legal:/Legal-operator identity/ },
  de: { site: /offizielle Archiv/, role: 'Fotokünstler', subject:'Menschliche Präsenz', legal:/rechtliche Betreiberschaft/ },
  hu: { site: /hivatalos archívuma/, role: 'Fotóművész', subject:'Emberi jelenlét', legal:/üzemeltető jogi azonosítására/ }
};
const opts = { maxAssociatedMedia: 12, dateModified: '2026-11-28', professionalIdentityMirror: core.professionalIdentityMirror, personAuthority: core.person };
const graphs = (html) => [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap((m) => {
  const g = JSON.parse(m[1]);
  return g['@graph'] || (Array.isArray(g) ? g : [g]);
});
const byId = (schema, id) => schema.find((node) => node['@id'] === id);
const xml = fs.readFileSync('sitemap.xml', 'utf8');
const locs = [...xml.matchAll(/<loc>(https:\/\/www\.banhalmi\.art\/[^<]*)<\/loc>/g)].map((m) => m[1]);
let found = 0;
let complete = 0;
for (const url of locs) {
  const loc = new URL(url);
  const file = loc.pathname.slice(1) + (loc.pathname.endsWith('/') ? 'index.html' : '');
  const source = fs.readFileSync(file, 'utf8');
  const locale = loc.pathname.startsWith('/hu/') ? 'hu' : loc.pathname.startsWith('/de-at/') ? 'de' : 'en';
  const expected = patterns[locale];
  const output = transformJsonLdScripts(source, opts).html;
  const schema = graphs(output);
  const person = byId(schema, origin+'#about');
  const org = byId(schema, legalId);
  const site = byId(schema, origin+'#website');
  const portrait = schema.filter(node=>node['@type']==='ImageObject' && node['@id']===portraitId);
  found++;
  if (!person && !org && !site) {
    assert.ok(['press.html','hu/press.html','de-at/press.html'].includes(file),file+': unexpected absent shared graph');
    assert.ok(schema.some(node=>node['@type']==='CollectionPage'),file+': keep its own collection schema');
    continue;
  }
  assert.match(site?.description || '', expected.site, file+': localized ART WebSite description');
  assert.ok(person?.jobTitle.includes(expected.role) && person?.knowsAbout.includes(expected.subject), file+': localized Person roles/subjects');
  assert.match(org?.description || '', expected.legal, file+': localized legal provenance');
  assert.equal(person?.image?.['@id'], portraitId, file+': same Person portrait reference');
  assert.equal(portrait.length, 1, file+': exactly one matching ART portrait');
  const sourcePortrait = graphs(source).find(node => node.contentUrl === portraitFile);
  assert.deepEqual(portrait[0], {...sourcePortrait, '@id':portraitId}, file+': preserve portrait metadata and license');
  assert.equal(portrait[0].contentUrl, portraitFile, file+': confirmed same Commons file');
  assert.equal(transformJsonLdScripts(output, opts).html, output, file+': idempotence');
  complete++;
}
assert.ok(found >= 90 && complete === found - 3, 'cover the live ART canonical census');
const eventPage = fs.readFileSync('hu/exhibitions/anovilaga.html','utf8');
const event = graphs(eventPage).find(node=>node['@type']==='ExhibitionEvent');
assert.equal(event.startDate,'2018-09-07');
assert.equal(event.location.name,'Stefánia Palota, Budapest');
assert.match(event.description,/2018\. szeptember 7-én.*81 digitalizált mű/);
assert.match(fs.readFileSync('archive-record-registry.json','utf8'),/A Nő világa című kiállítás 2018\. szeptember 7-én nyílt meg a budapesti Stefánia Palotában\./);
console.log('Localized ART entity projection, stable portrait provenance and idempotence verified on '+found+' canonical pages.');
