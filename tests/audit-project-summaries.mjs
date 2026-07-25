import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../data/archive/project-summaries.hu.json', import.meta.url), 'utf8'));
const integration = await readFile(new URL('../scripts/integrate-family-origins.mjs', import.meta.url), 'utf8');

const all = [...data.books, ...data.exhibitions];
const banned = /legszemélyesebb|mai napig vállalom|valahogy két borító közé|hála istennek|perverz|gyönyörűen elszabadult/iu;

const checks = [
  ['three books', data.books.length === 3],
  ['first exhibition batch', data.exhibitions.length === 6],
  ['old and new source pairs', all.every((entry) => entry.title && entry.old && entry.new)],
  ['rewrites differ', all.every((entry) => entry.old !== entry.new)],
  ['fact-preserving book titles', ['Ébredés — az Új kezdet!', 'Szösszenetek', 'A Nő világa'].every((title) => data.books.some((entry) => entry.title === title))],
  ['restrained tone', all.every((entry) => !banned.test(entry.new))],
  ['no unsupported superlatives', all.every((entry) => !/legjobb|legfontosabb|egyedülálló|világszínvonalú/iu.test(entry.new))],
  ['integration reads data', integration.includes('PROJECT_SUMMARIES_PATH') && integration.includes('replaceProjectSummaries')],
  ['idempotent replacement', integration.includes('if (next.includes(entry.new)) continue')],
  ['missing source fails loudly', integration.includes('Nem található a projektleírás')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}

if (failed.length) {
  throw new Error(`A projektleírás-audit ${failed.length} hibát talált.`);
}
