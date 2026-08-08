import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Permanent factual and evidence guard for the three localized EUFÓRIA records.
const root = path.resolve(import.meta.dirname, '..');
const pages = [
  'exhibitions/euforia.html',
  'hu/exhibitions/euforia.html',
  'de-at/exhibitions/euforia.html'
];
const forbidden = [
  'official portrait of Hungary&#x27;s Prime Minister',
  'miniszterelnökének hivatalos portré',
  'offiziellen Porträt des ungarischen Ministerpräsidenten',
  'more than fourteen Wikipedia language editions',
  'több mint tizennégy Wikipédia-nyelv',
  'mehr als vierzehn Wikipedia-Sprachversionen'
];
const required = [
  'https://commons.wikimedia.org/wiki/File:Peter-Magyar-portrait-2026.jpg',
  'Wikidata'
];
const independentSources = [
  'https://www.kiskegyed.hu/nepszeru/kulfoldon-is-hatalmasat-ment-a-magyar-peterrol-keszult-foto/gqlpkqw',
  'https://rolunk.at/aktualis/a-fiataloknak-ma-mar-bizonyitek-kell-egy-becsi-kreativ-kozosseg-uj-generaciot-epit/'
];
const errors = [];

for (const relative of pages) {
  const html = await readFile(path.join(root, relative), 'utf8');
  for (const phrase of forbidden) {
    if (html.includes(phrase)) errors.push(`${relative}: unsupported portrait-status claim remains: ${phrase}`);
  }
  for (const phrase of required) {
    if (!html.includes(phrase)) errors.push(`${relative}: verified portrait context missing: ${phrase}`);
  }
  for (const url of independentSources) {
    if (!html.includes(url)) errors.push(`${relative}: independent EUFÓRIA source missing: ${url}`);
  }
  if (!/Quality Image|minőségi kép|Qualitätsbild/.test(html)) {
    errors.push(`${relative}: Wikimedia quality-image status is not stated`);
  }
}

const backbone = await readFile(path.join(root, 'period-evidence-backbone.json'), 'utf8');
for (const url of independentSources) {
  if (!backbone.includes(url)) errors.push(`period-evidence-backbone.json: independent EUFÓRIA source missing: ${url}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('EUFÓRIA factual audit passed: verifiable Commons/Wikipedia/Wikidata usage and both independent 2026 press sources are locked into visible and machine evidence without an official-portrait claim.');
