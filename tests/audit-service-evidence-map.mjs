import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const map = JSON.parse(fs.readFileSync('service-evidence-map.json', 'utf8'));

const canonicalTrustindex = 'https://www.trustindex.io/reviews/norbertbanhalmi.com';
const authorityBridge = JSON.parse(fs.readFileSync('authority-bridge.json', 'utf8'));
const deepSearch = JSON.parse(fs.readFileSync('deep-search-evidence.json', 'utf8'));
assert(authorityBridge.professionalReviewEvidence?.source === canonicalTrustindex,
  'ART authority bridge must link to verified professional Trustindex evidence, not a retired review hostname');
assert(deepSearch.verifiedRecords?.find(x => x.id === 'trustindex-google-reviews-2026')?.url === canonicalTrustindex,
  'ART third-party review evidence must keep canonical Trustindex source');
// ART review links are references to professional customer experiences,
// never a claim of artistic critical reception or an AggregateRating.
const trackedTrustFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0').filter(Boolean);
for (const file of trackedTrustFiles) {
  if (!/\.(?:html?|json|jsonld|mjs|js|ts|tsx|py|md|txt|xml|yml|yaml|css|csv|toml)$/i.test(file)) continue;
  if (!fs.existsSync(file) || fs.statSync(file).size > 8_000_000) continue;
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(/https?:\/\/(?:www\.)?trustindex\.io\/reviews\/[a-z0-9.-]+(?:\/lang\/[a-z-]+)?/gi)) {
    assert(match[0] === canonicalTrustindex, 'Stale Trustindex review link in '+file+': '+match[0]);
  }
}

assert(map?.['@type'] === 'Dataset', 'Service evidence map must remain a Dataset');
assert(map?.canonicalPerson === 'https://www.banhalmiphotography.com/about/', 'Canonical Person drift');
assert(map?.services?.portrait?.en === 'https://www.banhalmiphotography.com/portrait/#service', 'EN portrait service drift');
assert(map?.services?.fineArtPerformer?.hu === 'https://www.banhalmiphotography.com/hu/muveszi-fotografia/#service', 'HU fine-art service drift');
assert(map?.services?.fineArtPerformer?.de === 'https://www.banhalmiphotography.com/de-at/fine-art/#service', 'DE fine-art service drift');

const exhibitions = new Map((map.exhibitionMappings || []).map((x) => [x.id, x]));
for (const id of ['euforia','ebredes','femmefatale','balerina-project-new-york']) {
  assert(exhibitions.has(id), `Required exhibition evidence mapping missing: ${id}`);
}
assert(exhibitions.get('euforia').service === 'portrait', 'EUFÓRIA must remain portrait evidence');
for (const id of ['ebredes','femmefatale','balerina-project-new-york']) {
  assert(exhibitions.get(id).service === 'fineArtPerformer', `${id} must remain fine-art/performer evidence`);
}

const press = new Map((map.pressMappings || []).map((x) => [x.record, x]));
for (const id of ['press-06','press-07','press-09','press-15','press-21','press-24']) {
  assert(press.has(id), `Required press-to-service mapping missing: ${id}`);
}
assert(press.get('press-06').service === 'portrait', 'Portrait psychology press evidence drift');
assert(press.get('press-07').service === 'fineArtPerformer', 'Artistic nude press evidence drift');
assert(press.get('press-21').service === 'portrait', 'Péter Magyar portrait press evidence drift');

const exhibitionPages = [
  ['exhibitions/euforia.html','https://www.banhalmiphotography.com/portrait/#service'],
  ['hu/exhibitions/euforia.html','https://www.banhalmiphotography.com/hu/portre/#service'],
  ['de-at/exhibitions/euforia.html','https://www.banhalmiphotography.com/de-at/portrait/#service'],
  ['exhibitions/ebredes.html','https://www.banhalmiphotography.com/fine-art/#service'],
  ['hu/exhibitions/ebredes.html','https://www.banhalmiphotography.com/hu/muveszi-fotografia/#service'],
  ['de-at/exhibitions/ebredes.html','https://www.banhalmiphotography.com/de-at/fine-art/#service'],
  ['exhibitions/femmefatale.html','https://www.banhalmiphotography.com/fine-art/#service'],
  ['hu/exhibitions/femmefatale.html','https://www.banhalmiphotography.com/hu/muveszi-fotografia/#service'],
  ['de-at/exhibitions/femmefatale.html','https://www.banhalmiphotography.com/de-at/fine-art/#service'],
  ['exhibitions/balerina-project-new-york.html','https://www.banhalmiphotography.com/fine-art/#service'],
  ['hu/exhibitions/balerina-project-new-york.html','https://www.banhalmiphotography.com/hu/muveszi-fotografia/#service'],
  ['de-at/exhibitions/balerina-project-new-york.html','https://www.banhalmiphotography.com/de-at/fine-art/#service']
];

for (const [path, service] of exhibitionPages) {
  const html = fs.readFileSync(path, 'utf8');
  assert(html.includes('href="/service-evidence-map.json"'), `Service evidence map link missing: ${path}`);
  assert(html.includes(service), `Localized professional service relation missing: ${path} -> ${service}`);
  assert(html.includes('https://www.banhalmi.art/service-evidence-map.json'), `Machine evidence-map relation missing: ${path}`);
}

for (const path of ['press.html','hu/press.html','de-at/press.html']) {
  const html = fs.readFileSync(path, 'utf8');
  assert(html.includes('href="/service-evidence-map.json"'), `Press page evidence map link missing: ${path}`);
  assert(html.includes('https://www.banhalmi.art/service-evidence-map.json'), `Press CollectionPage relation missing: ${path}`);
}

const external = map.externalPublicationEvidence || {};
assert(external.professionalRegistry === 'https://www.banhalmiphotography.com/external-photography-evidence.json', 'Professional external evidence registry drift');
assert((external.eventEvidenceIncludes || []).includes('linkedin-us-embassy-vienna-7422226435219607553'), 'U.S. Embassy Vienna event evidence mapping missing');
assert((external.eventEvidenceIncludes || []).includes('linkedin-kwwalsh-selectusa-7505169409309782017'), 'SelectUSA event evidence mapping missing');
assert(/only when an exact public post URL and attribution are present/i.test(external.xRule || ''), 'X post-level evidence guardrail missing');

const visitor = map.artVisitorServices || {};
for (const key of ['artisticPortrait', 'lifestyleFashion', 'artisticNudeBoudoir']) {
  assert(visitor[key], `ART visitor service taxonomy missing: ${key}`);
  assert(Array.isArray(visitor[key].htmlIds) && visitor[key].htmlIds.length, `${key} must declare htmlIds`);
  assert(visitor[key].routes?.en && visitor[key].routes?.hu && visitor[key].routes?.de, `${key} must keep EN/HU/DE routes`);
}
assert(visitor.artisticPortrait.htmlIds.includes('artistic-portrait'), 'artisticPortrait must map to artistic-portrait');
assert(visitor.lifestyleFashion.htmlIds.includes('lifestyle-fashion'), 'lifestyleFashion must map to lifestyle-fashion');
assert(visitor.artisticNudeBoudoir.htmlIds.includes('nude-boudoir'), 'artisticNudeBoudoir must map to nude-boudoir');
assert(visitor.lifestyleFashion.subtypes?.artistBranding?.parentService === 'lifestyleFashion', 'artistBranding subtype parent drift');
assert(visitor.lifestyleFashion.subtypes?.fashionEditorial?.parentService === 'lifestyleFashion', 'fashionEditorial subtype parent drift');
assert(visitor.artisticNudeBoudoir.subtypes?.boudoir?.parentService === 'artisticNudeBoudoir', 'boudoir subtype parent drift');
assert(visitor.artisticNudeBoudoir.subtypes?.artisticNude?.canonicalRoutes?.en === 'https://www.banhalmi.art/exhibitions/ebredes.html', 'artisticNude must route to Ébredés');
assert(exhibitions.get('euforia').parentArtService === 'artisticPortrait', 'EUFÓRIA must parent to artisticPortrait');
assert(exhibitions.get('ebredes').parentArtService === 'artisticNudeBoudoir', 'Ébredés must parent to artisticNudeBoudoir');
assert(exhibitions.get('ebredes').evidenceSubtype === 'artisticNude', 'Ébredés evidenceSubtype must be artisticNude');
assert(exhibitions.get('femmefatale').parentArtService === 'lifestyleFashion', 'Femme Fatale must parent to lifestyleFashion');
assert(exhibitions.get('balerina-project-new-york').parentArtService === 'lifestyleFashion', 'Ballerina must parent to lifestyleFashion');
assert(press.get('press-21').parentArtService === 'artisticPortrait', 'Péter Magyar press evidence must parent to artisticPortrait');
assert(press.get('press-07').parentArtService === 'artisticNudeBoudoir', 'Artistic nude press evidence must parent to artisticNudeBoudoir');
assert(map.services?.portrait && map.services?.fineArtPerformer && map.services?.event, 'Professional service keys must remain intact');

const privatePages = [
  ['private-photography.html', 'https://www.banhalmiphotography.com/fine-art/#service'],
  ['hu/private-photography.html', 'https://www.banhalmiphotography.com/hu/muveszi-fotografia/#service'],
  ['de-at/private-photography.html', 'https://www.banhalmiphotography.com/de-at/fine-art/#service']
];
for (const [path, service] of privatePages) {
  const html = fs.readFileSync(path, 'utf8');
  assert(html.includes('href="/service-evidence-map.json"'), `Private page evidence map link missing: ${path}`);
  assert(html.includes('https://www.banhalmi.art/service-evidence-map.json'), `Private page machine evidence-map relation missing: ${path}`);
  assert(html.includes(service), `Private page localized professional service relation missing: ${path} -> ${service}`);
  for (const id of ['artistic-portrait', 'lifestyle-fashion', 'nude-boudoir']) {
    assert(html.includes(`id="${id}"`), `Private page visitor lane anchor missing: ${path} #${id}`);
  }
}

const machine = JSON.parse(fs.readFileSync('data/machine-core.json', 'utf8'));
assert(machine.privateCommissionRouting?.visitorLanes?.artisticPortrait?.htmlId === 'artistic-portrait', 'machine-core artisticPortrait lane drift');
assert(machine.privateCommissionRouting?.visitorLanes?.lifestyleFashion?.htmlId === 'lifestyle-fashion', 'machine-core lifestyleFashion lane drift');
assert(machine.privateCommissionRouting?.visitorLanes?.artisticNudeBoudoir?.htmlId === 'nude-boudoir', 'machine-core artisticNudeBoudoir lane drift');

const bridge = JSON.parse(fs.readFileSync('ecosystem-bridge.json', 'utf8'));
assert(bridge.commercialFineArtBridge?.visitorLanes?.artisticPortrait?.en?.includes('#artistic-portrait'), 'ecosystem-bridge artisticPortrait lane missing');
assert(bridge.commercialFineArtBridge?.visitorLanes?.artisticNudeBoudoir?.artisticNude?.en?.includes('/exhibitions/ebredes.html'), 'ecosystem-bridge artisticNude Ébredés route missing');
assert(bridge.commercialFineArtBridge?.serviceEvidenceMap === 'https://www.banhalmi.art/service-evidence-map.json', 'ecosystem-bridge must point at service evidence map');

console.log('Service evidence map audit passed: ART visitor lanes, exhibitions, press and external publication evidence are conservatively linked to professional services.');
