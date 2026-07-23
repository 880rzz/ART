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

walk(root);
const corpus = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const assert = (condition, message) => { if (!condition) failures.push(message); };

const personId = 'https://www.norbertbanhalmi.com/about/';
const organizationId = 'https://www.norbertbanhalmi.com/#organization';
const currentWko = 'https://firmen.wko.at/norbert-banhalmi-visuelle-strategische-partnerschaft-für-führungskräfte/wien/?firmaid=12bd142c-5fcf-4457-9a90-47fbff162b40';

assert(corpus.includes(personId), 'canonical Person ID is missing');
assert(corpus.includes(organizationId), 'canonical Organization ID is missing');
assert(!corpus.includes('https://www.banhalmi.art/norbert-banhalmi'), 'obsolete ART Person ID remains');
assert(corpus.includes(currentWko), 'current WKO company profile is missing');
assert(!corpus.includes('norbert-banhalmi-executive-portr%C3%A4t-und-visuelle-positionieru'), 'obsolete encoded WKO profile remains');
assert(!corpus.includes('norbert-banhalmi-executive-porträt-und-visuelle-positionieru'), 'obsolete WKO profile remains');
assert(!/hreflang=["']hu["']/.test(corpus), 'generic hu hreflang remains; use hu-HU');
assert(/hreflang=["']hu-HU["']/.test(corpus), 'hu-HU hreflang is missing');

const homepageExpectations = {
  'index.html': ['strategic visual partnership', 'visual trust'],
  'hu/index.html': ['stratégiai vizuális partnerség', 'vizuális bizalom'],
  'de-at/index.html': ['strategischen visuellen Partnerschaft', 'visuelles Vertrauen']
};
for (const [file, phrases] of Object.entries(homepageExpectations)) {
  const html = fs.readFileSync(path.join(root, file), 'utf8').toLowerCase();
  for (const phrase of phrases) assert(html.includes(phrase.toLowerCase()), `${file}: missing ecosystem phrase ${phrase}`);
  assert(html.includes('www.norbertbanhalmi.com'), `${file}: professional-site bridge is missing`);
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log(`BANHALMI ecosystem alignment passed across ${files.length} machine-readable and HTML files.`);
