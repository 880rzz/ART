import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../data/archive/project-summaries.hu.json', import.meta.url), 'utf8'));
const integration = await readFile(new URL('../scripts/integrate-family-origins.mjs', import.meta.url), 'utf8');

const all = [...data.books, ...data.exhibitions];
const banned = /legszemélyesebb|mai napig vállalom|valahogy két borító közé|hála istennek|perverz|gyönyörűen elszabadult|zseniális|ikonikus/iu;
const expectedExhibitions = [
  'Az igazi Nők — 30+1 portré a természetes szépségről',
  'Régi csibészes idők — a pin-up rehabilitációja',
  'Magyar nők New Yorkban',
  'A Nő ötven árnyalata',
  'Apa lettem',
  'Mérföldkövek ’56',
  'Szösszenetek',
  'Ébredés — az Új kezdet',
  'A Nő világa',
  'Ballerina Project New York — Strut Your Stuff',
  'Pest megye kortárs művészei',
  'The Frame — 20 év',
  'Te is lehetsz…',
  'The Men’s Dream — A szépség genezise',
  'A valóság hamis arcai / Az internet hazugságai',
  'Touch Bécs & Touch München',
  'Én a Nő',
  'Femme Fatale',
  'Más kép / Más',
  'EUFÓRIA — a Jelenlét anatómiája',
];

const checks = [
  ['three books', data.books.length === 3],
  ['complete exhibition set', data.exhibitions.length === 20],
  ['all entries have title and rewrite', all.every((entry) => entry.title && entry.new)],
  ['legacy pairs differ where present', all.filter((entry) => entry.old).every((entry) => entry.old !== entry.new)],
  ['fact-preserving book titles', ['Ébredés — az Új kezdet!', 'Szösszenetek', 'A Nő világa'].every((title) => data.books.some((entry) => entry.title === title))],
  ['all exhibition titles covered', expectedExhibitions.every((title) => data.exhibitions.some((entry) => entry.title === title))],
  ['restrained tone', all.every((entry) => !banned.test(entry.new))],
  ['no unsupported superlatives', all.every((entry) => !/legjobb|legfontosabb|egyedülálló|világszínvonalú/iu.test(entry.new))],
  ['integration reads data', integration.includes('PROJECT_SUMMARIES_PATH') && integration.includes('replaceProjectSummaries')],
  ['idempotent replacement', integration.includes('if (next.includes(entry.new)) continue')],
  ['title-based fallback', integration.includes('replaceSummaryByTitle') && integration.includes('escapeRegExp')],
  ['missing source fails loudly', integration.includes('Nem található cím alapján a projektleírás')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}

if (failed.length) {
  throw new Error(`A projektleírás-audit ${failed.length} hibát talált.`);
}
