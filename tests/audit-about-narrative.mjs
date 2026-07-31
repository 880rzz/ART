import { readFile } from 'node:fs/promises';

const partial = await readFile(new URL('../data/archive/about.hu.html', import.meta.url), 'utf8');
const integration = await readFile(new URL('../scripts/integrate-family-origins.mjs', import.meta.url), 'utf8');

const text = partial
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

const hasAll = (...needles) => needles.every((needle) => text.includes(needle));
const grandioseMythologyPattern = /(?:^|[^\p{L}])(küldetés|dinasztia|végzet|eleve elrendelt|zseni)(?:$|[^\p{L}])/iu;

const checks = [
  ['first-person voice', hasAll('1979-ben születtem Budapesten', 'Ma Bécsben élek és dolgozom')],
  ['defence and HIPStudio origin', hasAll('Magyar Honvédség Híradó és Informatikai Parancsnokságán', 'HIPStudio nevű médiastúdió')],
  ['portrait practice', hasAll('partyfotózás lett az igazi portréiskolám', 'Több tízezer portré után')],
  ['archive and professional practice separated', hasAll('professzionális és a művészeti praxist', 'külön felülete van')],
  ['no obsolete four-domain explanation', !hasAll('két fő domainre épül', 'mind a négy domain él')],
  ['no secondary entry-domain inventory', !text.includes('banhalmi.at') && !text.includes('banhalminorbert.hu')],
  ['partners and continuity', hasAll('Németh Tímeával', 'HIPStudio Kft.', 'Speier Viko', 'AmCham Austria')],
  ['no grandiose mythology', !grandioseMythologyPattern.test(text)],
  ['safe bounded replacement', integration.includes('const aboutIndex = next.indexOf(aboutStart);') && integration.includes('const aboutEnd =') && integration.includes('next.slice(aboutIndex, aboutEnd).trim()') && integration.includes('aboutPartial')],
  ['family roots concise mention', hasAll('Anyai ágon több generáción át jelen volt a festészet', 'Nem kész művészeti programot örököltem') && !text.includes('csaladi-gyokerek')],
  ['artistic transition after accident', hasAll('Egy súlyos baleset után', 'önálló szerzői munkára is szükségem van')],
  ['Vienna company transition', hasAll('Bánhalmi Norbert e.U.-t', 'tulajdonrészemet átadtam neki')],
  ['professional activity link label', text.includes('Szakmai tevékenység')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}

if (failed.length) {
  throw new Error(`A Bemutatkozás audit ${failed.length} hibát talált: ${failed.map(([name]) => name).join(', ')}`);
}
