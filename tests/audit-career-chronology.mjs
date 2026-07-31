import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../data/archive/career-chronology.hu.json', import.meta.url), 'utf8'));
const partial = await readFile(new URL('../data/archive/career-chronology.hu.html', import.meta.url), 'utf8');
const integration = await readFile(new URL('../scripts/integrate-family-origins.mjs', import.meta.url), 'utf8');

const mythologyPattern = /(?:^|[^\p{L}])(küldetés|dinasztia|végzet|eleve elrendelt|zseni)(?=$|[^\p{L}])/giu;
const mythologyMatches = [...partial.matchAll(mythologyPattern)].map((match) => ({
  term: match[1],
  context: partial.slice(Math.max(0, match.index - 45), Math.min(partial.length, match.index + match[0].length + 45)).replace(/\s+/g, ' '),
}));

const checks = [
  ['chronology record type', data.recordType === 'CareerChronology'],
  ['family background period', partial.includes('1979–1998') && partial.includes('Családi és vizuális háttér')],
  ['1999 origin', partial.includes('1999–2006') && partial.includes('Magyar Honvédség') && partial.includes('HIPStudio')],
  ['portrait school', partial.includes('2006–2013') && partial.includes('Több tízezer portré után')],
  ['authorial projects', ['Az igazi Nők', 'Magyar nők New Yorkban', 'Mérföldkövek ’56'].every((item) => partial.includes(item))],
  ['books and transformation', ['Szösszenetek', 'Ébredés', 'A Nő világa'].every((item) => partial.includes(item))],
  ['ambassador and curatorial period', partial.includes('2018–2022') && partial.includes('OM SYSTEM') && partial.includes('kurátori')],
  ['Vienna Budapest period', partial.includes('2023–2026') && partial.includes('Bécs és Budapest')],
  ['archive purpose', partial.includes('Az életmű rendszerezése') && partial.includes('kutatható megőrzése')],
  ['future project status', partial.includes('Fejlesztés alatt') && partial.includes('EUFÓRIA') && partial.includes('nem megvalósult kiállításként')],
  ['no domain-led milestones', !partial.includes('Négy működő domain, két központ') && !partial.includes('banhalmi.at') && !partial.includes('banhalminorbert.hu')],
  ['data and html entry alignment', data.entries.length === 9 && data.entries[0].period === '1979–1998' && data.entries.at(-1).title === 'EUFÓRIA'],
  ['menu integration', integration.includes('href="index.html#journey"')],
  ['bounded journey replacement', integration.includes('journeyStart') && integration.includes('journeyPartial')],
  ['no grandiose mythology', mythologyMatches.length === 0],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}
if (mythologyMatches.length) {
  for (const match of mythologyMatches) console.log(`  offending mythology term: “${match.term}” — ${match.context}`);
}

if (failed.length) {
  throw new Error(`A pályaív audit ${failed.length} hibát talált: ${failed.map(([name]) => name).join(', ')}`);
}
