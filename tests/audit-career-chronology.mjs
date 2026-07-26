import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../data/archive/career-chronology.hu.json', import.meta.url), 'utf8'));
const partial = await readFile(new URL('../data/archive/career-chronology.hu.html', import.meta.url), 'utf8');
const integration = await readFile(new URL('../scripts/integrate-family-origins.mjs', import.meta.url), 'utf8');

const checks = [
  ['chronology record type', data.recordType === 'CareerChronology'],
  ['1999 origin', partial.includes('1999') && partial.includes('Magyar Honvédség') && partial.includes('HIPStudio')],
  ['2006 domain date', partial.includes('2006. március 15-én') && partial.includes('hipstudio.hu')],
  ['portrait school', partial.includes('partyfotózás mint portréiskola') && partial.includes('Több tízezer portré után')],
  ['accident scope limited', partial.includes('Egy súlyos baleset után döntöttem úgy') && !partial.includes('megmarad-e a látásom')],
  ['first personal domain', partial.includes('banhalminorbert.hu')],
  ['English international domain', partial.includes('norbertbanhalmi.com') && partial.includes('nemzetközi, angol nyelvű szakmai központ')],
  ['Hungarian continuity', partial.includes('magyar nyelvű rész szerepét vitte tovább')],
  ['art split after Covid', partial.includes('Covid-időszak után') && partial.includes('banhalmi.art')],
  ['German entry point', partial.includes('2025') && partial.includes('banhalmi.at')],
  ['four active domains two hubs', partial.includes('Négy működő domain, két központ')],
  ['current hub roles', partial.includes('szakmai oldalakat és a nyelvi változatokat') && partial.includes('művészeti archívum központja')],
  ['menu integration', integration.includes('href="index.html#journey"')],
  ['bounded journey replacement', integration.includes('journeyStart') && integration.includes('journeyPartial')],
  ['no grandiose mythology', !/küldetés|dinasztia|végzet|eleve elrendelt|zseni/iu.test(partial)],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}

if (failed.length) {
  throw new Error(`A pályaív audit ${failed.length} hibát talált.`);
}
