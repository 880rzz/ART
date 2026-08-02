import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const failures = [];
const files = [];
const allowed = new Set(['.html', '.json', '.jsonld', '.txt', '.xml']);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (allowed.has(path.extname(entry.name).toLowerCase())) files.push(full);
  }
}

function normalizeUrl(value) {
  if (typeof value !== 'string') return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

walk(root);
const corpus = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const assert = (condition, message) => { if (!condition) failures.push(message); };

const personId = 'https://www.norbertbanhalmi.com/about/';
const archiveProfile = 'https://www.banhalmi.art/#about';
const organizationId = 'https://www.norbertbanhalmi.com/#organization';
const currentWko = 'https://firmen.wko.at/norbert-banhalmi-visuelle-strategische-partnerschaft-für-führungskräfte/wien/?firmaid=12bd142c-5fcf-4457-9a90-47fbff162b40';
const currentWkoEncoded = encodeURI(currentWko);

assert(corpus.includes(personId), 'canonical professional Person ID is missing');
assert(corpus.includes(archiveProfile), 'human-readable ART profile is missing');
assert(corpus.includes(organizationId), 'canonical Organization ID is missing');
assert(corpus.includes(currentWko) || corpus.includes(currentWkoEncoded), 'current WKO company profile is missing');
assert(!corpus.includes('norbert-banhalmi-executive-portr%C3%A4t-und-visuelle-positionieru'), 'obsolete encoded WKO profile remains');
assert(!corpus.includes('norbert-banhalmi-executive-porträt-und-visuelle-positionieru'), 'obsolete WKO profile remains');
assert(!/hreflang=["']hu["']/.test(corpus), 'generic hu hreflang remains; use hu-HU');
assert(/hreflang=["']hu-HU["']/.test(corpus), 'hu-HU hreflang is missing');

for (const file of ['index.html', 'hu/index.html', 'de-at/index.html']) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const lower = html.toLowerCase();
  assert(lower.includes('www.norbertbanhalmi.com'), `${file}: professional-site bridge is missing`);
  assert(lower.includes('stratégiai vizuális partnerség') || lower.includes('strategic visual partnership') || lower.includes('strategischen visuellen partnerschaft'), `${file}: strategic visual partnership meaning is missing`);
  assert(lower.includes('vizuális bizalom') || lower.includes('visual trust') || lower.includes('visuelles vertrauen'), `${file}: visual trust meaning is missing`);

  const jsonLdBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  const graph = jsonLdBlocks.flatMap((block) => block['@graph'] || []);
  const person = graph.find((node) => node['@id'] === personId);
  const organization = graph.find((node) => node['@id'] === organizationId);
  assert(person?.['@type'] === 'Person', `${file}: canonical professional Person node is missing`);
  assert(organization?.['@type'] === 'Organization', `${file}: canonical Organization node is missing`);
  assert(organization?.founder?.['@id'] === personId, `${file}: Organization founder does not reference the canonical Person`);
  const organizationSameAs = Array.isArray(organization?.sameAs) ? organization.sameAs.map(normalizeUrl) : [];
  assert(organizationSameAs.includes(currentWko), `${file}: Organization does not expose the current WKO profile`);
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log(`BANHALMI ecosystem alignment passed across ${files.length} machine-readable and HTML files.`);
