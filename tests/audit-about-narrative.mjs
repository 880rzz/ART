import { readFile } from 'node:fs/promises';

const partial = await readFile(new URL('../data/archive/about.hu.html', import.meta.url), 'utf8');
const integration = await readFile(new URL('../scripts/integrate-family-origins.mjs', import.meta.url), 'utf8');

const checks = [
  ['first-person voice', partial.includes('1979-ben születtem Budapesten') && partial.includes('Ma Bécsben élek és dolgozom')],
  ['family roots concise link', partial.includes('A családi háttér rövid története') && partial.includes('Nem kész művészeti programot örököltem')],
  ['defence forces origin', partial.includes('Magyar Honvédség Híradó és Informatikai Parancsnokságán')],
  ['HIPStudio inside command', partial.includes('Itt hoztuk létre a HIPStudio nevű médiastúdiót')],
  ['domain registration date', partial.includes('2006. március 15-én') && partial.includes('hipstudio.hu')],
  ['early online ordering', partial.includes('online galériából rendelhették meg')],
  ['party photography as portrait school', partial.includes('A partyfotózás lett az igazi portréiskolám')],
  ['portrait volume', partial.includes('Több tízezer portré után')],
  ['named documentary partners', ['Roxy Rádió', 'Rise FM', 'Coke Club', 'EVO', 'Hungaroring'].every((name) => partial.includes(name))],
  ['Győry László not teacher', partial.includes('Nem ő tanított meg fényképezni') && partial.includes('nem volt közöttünk mester–tanítvány kapcsolat')],
  ['accident limited to brand transition', partial.includes('Egy súlyos baleset után döntöttem úgy') && !partial.includes('megmarad-e a látásom') && !partial.includes('abból az éjszakából')],
  ['first personal domain', partial.includes('első ilyen weboldalam') && partial.includes('banhalminorbert.hu')],
  ['English international domain after New York', partial.includes('New York-i kiállítás után') && partial.includes('norbertbanhalmi.com') && partial.includes('nemzetközi, angol nyelvű szakmai jelenlétem')],
  ['art and professional split after Covid', partial.includes('Covid-időszak után') && partial.includes('banhalmi.art')],
  ['German domain in 2025', partial.includes('2025-ben') && partial.includes('banhalmi.at')],
  ['four-domain interpretation', partial.includes('Ez a négy domain nem négy külön identitás')],
  ['HIPStudio continuity', partial.includes('Németh Tímeával') && partial.includes('HIPStudio Kft.')],
  ['Vienna company transition', partial.includes('Bánhalmi Norbert e.U.-t') && partial.includes('tulajdonrészemet átadtam neki')],
  ['Speier Viko role', partial.includes('Speier Viko') && partial.includes('AmCham Austria')],
  ['no grandiose mythology', !/küldetés|dinasztia|végzet|eleve elrendelt|zseni/iu.test(partial)],
  ['safe bounded replacement', integration.includes('aboutStart') && integration.includes('aboutEnd') && integration.includes('currentAbout')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}

if (failed.length) {
  throw new Error(`A bemutatkozás-narratíva audit ${failed.length} hibát talált.`);
}
