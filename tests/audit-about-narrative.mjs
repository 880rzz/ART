import { readFile } from 'node:fs/promises';

const partial = await readFile(new URL('../data/archive/about.hu.html', import.meta.url), 'utf8');
const integration = await readFile(new URL('../scripts/integrate-family-origins.mjs', import.meta.url), 'utf8');

const text = partial
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

const hasAll = (...needles) => needles.every((needle) => text.includes(needle));

const checks = [
  ['first-person voice', hasAll('1979-ben születtem Budapesten', 'Ma Bécsben élek és dolgozom')],
  ['family roots concise link', hasAll('A családi háttér rövid története', 'Nem kész művészeti programot örököltem')],
  ['defence forces origin', text.includes('Magyar Honvédség Híradó és Informatikai Parancsnokságán')],
  ['HIPStudio inside command', text.includes('Itt hoztuk létre a HIPStudio nevű médiastúdiót')],
  ['domain registration date', hasAll('2006. március 15-én', 'hipstudio.hu')],
  ['early online ordering', text.includes('online galériából rendelhették meg')],
  ['party photography as portrait school', text.includes('A partyfotózás lett az igazi portréiskolám')],
  ['portrait volume', text.includes('Több tízezer portré után')],
  ['named documentary partners', ['Roxy Rádió', 'Rise FM', 'Coke Club', 'EVO', 'Hungaroring'].every((name) => text.includes(name))],
  ['accident limited to brand transition', text.includes('Egy súlyos baleset után döntöttem úgy') && !/megmarad-e a látásom|abból az éjszakából/iu.test(text)],
  ['first personal domain', hasAll('első ilyen weboldalam', 'banhalminorbert.hu')],
  ['Hungarian domain continued', hasAll('banhalminorbert.hu', 'magyar nyelvű rész szerepét vitte tovább')],
  ['English international domain after New York', hasAll('New York-i kiállítás után', 'norbertbanhalmi.com', 'nemzetközi, angol nyelvű szakmai jelenlétem')],
  ['art and professional split after Covid', hasAll('Covid-időszak után', 'banhalmi.art')],
  ['German domain in 2025', hasAll('2025-ben', 'banhalmi.at')],
  ['two primary domains', hasAll('két fő domainre épül', 'norbertbanhalmi.com', 'banhalmi.art')],
  ['all four domains active', text.includes('mind a négy domain él')],
  ['language entry points', hasAll('magyar', 'német nyelvű belépési pontot biztosítja')],
  ['HIPStudio continuity', hasAll('Németh Tímeával', 'HIPStudio Kft.')],
  ['Vienna company transition', hasAll('Bánhalmi Norbert e.U.-t', 'tulajdonrészemet átadtam neki')],
  ['Speier Viko role', hasAll('Speier Viko', 'AmCham Austria')],
  ['no grandiose mythology', !/küldetés|dinasztia|végzet|eleve elrendelt|zseni/iu.test(text)],
  ['safe bounded replacement', /const aboutIndex = next\.indexOf\(aboutStart\)/.test(integration) && /const aboutEnd =/.test(integration) && /next\.slice\(aboutIndex, aboutEnd\)\.trim\(\)/.test(integration) && integration.includes('aboutPartial')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}

if (failed.length) {
  const names = failed.map(([name]) => name).join(', ');
  console.error(`Hibás ellenőrzések: ${names}`);
  throw new Error(`A bemutatkozás-narratíva audit ${failed.length} hibát talált.`);
}
