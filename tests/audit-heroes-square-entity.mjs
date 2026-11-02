import fs from 'node:fs';

const CANONICAL = 'https://www.wikidata.org/wiki/Q299973';
const FORBIDDEN = [
  'https://www.wikidata.org/wiki/Q146913',
  'https://www.wikidata.org/wiki/Q193202',
  'https://www.wikidata.org/wiki/Q189040',
  'https://www.wikidata.org/wiki/Q189130'
];
const files = [
  'data/image-metadata.json',
  'data/image-knowledge-graph.jsonld',
  'oeuvre-knowledge-graph.hu.jsonld'
];
const failures = [];
for (const file of files) {
  if (!fs.existsSync(file)) { failures.push(`${file}: missing`); continue; }
  const text = fs.readFileSync(file, 'utf8');
  for (const bad of FORBIDDEN) {
    if (text.includes(bad)) failures.push(`${file}: forbidden Heroes Square ID ${bad}`);
  }
  if (!text.includes('Q299973')) failures.push(`${file}: canonical Heroes Square ID Q299973 missing`);
}

const assertPlace = (label, place) => {
  if (!place || typeof place !== 'object') return;
  const name = `${place.name || ''} ${place.alternateName || ''}`;
  if (!/Hősök tere|Heroes.?Square/i.test(name) && !/heroes-square/i.test(place['@id'] || '')) return;
  const ids = [place.wikidata, place.sameAs].flat().filter(Boolean).map(String);
  if (!ids.some(id => id.includes('Q299973'))) {
    failures.push(`${label}: Heroes Square place missing canonical ${CANONICAL}; got ${ids.join(',') || 'none'}`);
  }
};

const meta = JSON.parse(fs.readFileSync('data/image-metadata.json', 'utf8'));
for (const [key, record] of Object.entries(meta.records || {})) {
  assertPlace(`image-metadata:${key}`, record.contentLocation);
}
const kg = JSON.parse(fs.readFileSync('data/image-knowledge-graph.jsonld', 'utf8'));
const kgNodes = Array.isArray(kg) ? kg : (kg['@graph'] || [kg]);
for (const node of kgNodes) {
  assertPlace('image-kg', node.contentLocation);
  if (node['@type'] === 'Place' || (Array.isArray(node['@type']) && node['@type'].includes('Place'))) {
    assertPlace('image-kg-place', node);
  }
}
const oeuvre = JSON.parse(fs.readFileSync('oeuvre-knowledge-graph.hu.jsonld', 'utf8'));
for (const node of oeuvre['@graph'] || []) {
  if (String(node['@id'] || '').includes('heroes-square')) assertPlace('oeuvre-hu', node);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Heroes Square entity audit passed: canonical ${CANONICAL} locked across metadata, image KG and oeuvre place graph.`);
