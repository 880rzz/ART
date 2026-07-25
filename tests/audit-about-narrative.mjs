import { readFile } from 'node:fs/promises';

const partial = await readFile(new URL('../data/archive/about.hu.html', import.meta.url), 'utf8');
const integration = await readFile(new URL('../scripts/integrate-family-origins.mjs', import.meta.url), 'utf8');

const text = partial
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

const hasAll = (...needles) => needles.every((needle) => text.includes(needle));

const requiredChecks = [
  ['first-person voice', hasAll('1979-ben születtem Budapesten', 'Ma Bécsben élek és dolgozom')],
  ['defence and HIPStudio origin', hasAll('Magyar Honvédség Híradó és Informatikai Parancsnokságán', 'HIPStudio nevű médiastúdiót')],
  ['portrait practice', hasAll('partyfotózás', 'Több tízezer portré után')],
  ['domain history', ['banhalminorbert.hu', 'norbertbanhalmi.com', 'banhalmi.art', 'banhalmi.at'].every((domain) => text.includes(domain))],
  ['two-centre current system', hasAll('két fő domainre épül', 'mind a négy domain él')],
  ['partners and continuity', hasAll('Németh Tímeával', 'HIPStudio Kft.', 'Speier Viko', 'AmCham Austria')],
  ['no grandiose mythology', !/küldetés|dinasztia|végzet|eleve elrendelt|zseni/iu.test(text)],
  ['safe bounded replacement', /const aboutIndex = next\.indexOf\(aboutStart\)/.test(integration) && /const aboutEnd =/.test(integration) && /next\.slice\(aboutIndex, aboutEnd\)\.trim\(\)/.test(integration) && integration.includes('aboutPartial')],
];

const advisoryChecks = [
  ['family roots concise link', hasAll('A családi háttér rövid története', 'Nem kész művészeti programot örököltem')],
  ['domain registration date', hasAll('2006. március 15-én', 'hipstudio.hu')],
  ['early online ordering', text.includes('online galériából rendelhették meg')],
  ['named documentary partners', ['Roxy Rádió', 'Rise FM', 'Coke Club', 'EVO', 'Hungaroring'].every((name) => text.includes(name))],
  ['accident limited to brand transition', text.includes('Egy súlyos baleset után döntöttem úgy') && !/megmarad-e a látásom|abból az éjszakából/iu.test(text)],
  ['domain sequence details', hasAll('New York-i kiállítás után', 'Covid-időszak után', '2025-ben')],
  ['Vienna company transition', hasAll('Bánhalmi Norbert e.U.-t', 'tulajdonrészemet átadtam neki')],
];

for (const [name, passed] of requiredChecks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}
for (const [name, passed] of advisoryChecks) {
  console.log(`${passed ? '✓' : 'WARN'} ${name}`);
}

const failed = requiredChecks.filter(([, passed]) => !passed);
if (failed.length) {
  const names = failed.map(([name]) => name).join(', ');
  throw new Error(`A bemutatkozás-narratíva audit kötelező hibái: ${names}`);
}
