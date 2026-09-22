import fs from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const map = JSON.parse(fs.readFileSync('service-evidence-map.json', 'utf8'));
assert(map?.['@type'] === 'Dataset', 'Service evidence map must remain a Dataset');
assert(map?.canonicalPerson === 'https://www.norbertbanhalmi.com/about/', 'Canonical Person drift');
assert(map?.services?.portrait?.en === 'https://www.norbertbanhalmi.com/portrait/#service', 'EN portrait service drift');
assert(map?.services?.fineArtPerformer?.hu === 'https://www.norbertbanhalmi.com/hu/muveszi-fotografia/#service', 'HU fine-art service drift');
assert(map?.services?.fineArtPerformer?.de === 'https://www.norbertbanhalmi.com/de-at/fine-art/#service', 'DE fine-art service drift');

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
  ['exhibitions/euforia.html','https://www.norbertbanhalmi.com/portrait/#service'],
  ['hu/exhibitions/euforia.html','https://www.norbertbanhalmi.com/hu/portre/#service'],
  ['de-at/exhibitions/euforia.html','https://www.norbertbanhalmi.com/de-at/portrait/#service'],
  ['exhibitions/ebredes.html','https://www.norbertbanhalmi.com/glamour/#service'],
  ['hu/exhibitions/ebredes.html','https://www.norbertbanhalmi.com/hu/muveszi-fotografia/#service'],
  ['de-at/exhibitions/ebredes.html','https://www.norbertbanhalmi.com/de-at/fine-art/#service'],
  ['exhibitions/femmefatale.html','https://www.norbertbanhalmi.com/glamour/#service'],
  ['hu/exhibitions/femmefatale.html','https://www.norbertbanhalmi.com/hu/muveszi-fotografia/#service'],
  ['de-at/exhibitions/femmefatale.html','https://www.norbertbanhalmi.com/de-at/fine-art/#service'],
  ['exhibitions/balerina-project-new-york.html','https://www.norbertbanhalmi.com/glamour/#service'],
  ['hu/exhibitions/balerina-project-new-york.html','https://www.norbertbanhalmi.com/hu/muveszi-fotografia/#service'],
  ['de-at/exhibitions/balerina-project-new-york.html','https://www.norbertbanhalmi.com/de-at/fine-art/#service']
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
assert(external.professionalRegistry === 'https://www.norbertbanhalmi.com/external-photography-evidence.json', 'Professional external evidence registry drift');
assert((external.eventEvidenceIncludes || []).includes('linkedin-us-embassy-vienna-7422226435219607553'), 'U.S. Embassy Vienna event evidence mapping missing');
assert((external.eventEvidenceIncludes || []).includes('linkedin-kwwalsh-selectusa-7505169409309782017'), 'SelectUSA event evidence mapping missing');
assert(/Do not create post-level X evidence relationships/.test(external.xRule || ''), 'X post-level evidence guardrail missing');

console.log('Service evidence map audit passed: exhibitions, press and external publication evidence are conservatively linked to professional services.');
