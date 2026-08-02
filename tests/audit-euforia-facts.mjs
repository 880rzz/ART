import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Permanent factual guard for the three localized EUFÓRIA records.
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
const errors = [];

for (const relative of pages) {
  const html = await readFile(path.join(root, relative), 'utf8');
  for (const phrase of forbidden) {
    if (html.includes(phrase)) errors.push(`${relative}: unsupported portrait-status claim remains: ${phrase}`);
  }
  for (const phrase of required) {
    if (!html.includes(phrase)) errors.push(`${relative}: verified portrait context missing: ${phrase}`);
  }
  if (!/Quality Image|minőségi kép|Qualitätsbild/.test(html)) {
    errors.push(`${relative}: Wikimedia quality-image status is not stated`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('EUFÓRIA factual audit passed: the portrait is described through verifiable Commons, Wikipedia and Wikidata usage without an official-portrait claim.');
