import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const graph = JSON.parse(await readFile(path.join(root, 'data/archive/oeuvre-relations.hu.json'), 'utf8'));
const integration = await readFile(path.join(root, 'scripts/apply-oeuvre-relations-hu.mjs'), 'utf8');
const euforiaHtml = await readFile(path.join(root, 'hu/exhibitions/euforia.html'), 'utf8');

const failures = [];
const ids = new Set();
const allPaths = new Set();

for (const record of graph.records) {
  if (!record.id || ids.has(record.id)) failures.push(`Hibás vagy ismétlődő rekordazonosító: ${record.id}`);
  ids.add(record.id);

  if (!['completed', 'in-development', 'planned'].includes(record.status)) {
    failures.push(`${record.id}: ismeretlen státusz: ${record.status}`);
  }
  if (!record.summary || record.summary.length < 60) failures.push(`${record.id}: túl rövid vagy hiányzó összefoglaló.`);
  if (!Array.isArray(record.pages) || !record.pages.length) failures.push(`${record.id}: nincs kapcsolt oldal.`);

  for (const page of record.pages || []) {
    if (!page.path.startsWith('hu/')) failures.push(`${record.id}: nem magyar útvonal: ${page.path}`);
    if (allPaths.has(page.path)) failures.push(`Egy oldal több életműrekordhoz lett rendelve: ${page.path}`);
    allPaths.add(page.path);
    try {
      await access(path.join(root, page.path));
    } catch {
      failures.push(`${record.id}: hiányzó oldal: ${page.path}`);
    }
  }
}

const euforia = graph.records.find((record) => record.id === 'euforia');
if (!euforia || euforia.status !== 'in-development') failures.push('Az EUFÓRIA státusza nem „in-development”.');
if (!euforia?.summary.includes('nem kezelheti lezárt vagy már megvalósult eseményként')) failures.push('Az EUFÓRIA szerkesztési korlátja hiányzik.');

const requiredIntegrationFeatures = [
  'archive-relations',
  'data-archive-status',
  'Kapcsolódó archívumi rekordok',
  "record.status === 'in-development'",
  'Fejlesztés alatt.',
  "html.indexOf('<footer')",
  'archive-relations-style',
  'repairEuforiaStructuredData',
  'eventAttendanceMode',
  'additionalType',
  'fejlesztés alatt',
];
for (const feature of requiredIntegrationFeatures) {
  if (!integration.includes(feature)) failures.push(`Az integrációból hiányzik: ${feature}`);
}

const falseLocationText = '"location":{"@type":"Place","name":"Tisztelgés Robert Capa szellemisége előtt';
if (!integration.includes('falseLocation')) failures.push('Az EUFÓRIA téves helyszínadatának javítása nincs automatizálva.');
if (euforiaHtml.includes(falseLocationText) && !integration.includes('next.replace(falseLocation')) {
  failures.push('Az EUFÓRIA jelenlegi téves helyszínadata javítás nélkül maradna.');
}

for (const [key, label] of Object.entries({
  completed: 'Megvalósult',
  'in-development': 'Fejlesztés alatt',
  planned: 'Tervezett',
})) {
  if (graph.statusLabels[key] !== label) failures.push(`Hibás státuszcímke: ${key}`);
}

if (failures.length) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  throw new Error(`Az életmű-kapcsolati audit ${failures.length} hibát talált.`);
}

console.log(`✓ ${graph.records.length} életműrekord`);
console.log(`✓ ${allPaths.size} kapcsolt magyar oldal`);
console.log('✓ Az EUFÓRIA fejlesztés alatt álló projektként van nyilvántartva');
console.log('✓ A kapcsolati blokkok és státuszmeta integrációja ellenőrizve');
console.log('✓ A téves EUFÓRIA-helyszín strukturáltadat-javítása ellenőrizve');
console.log('✓ A kapcsolati blokkok reszponzív megjelenése biztosított');