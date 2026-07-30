import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const graph = JSON.parse(await readFile(path.join(root, 'oeuvre-knowledge-graph.hu.jsonld'), 'utf8'));
const relations = JSON.parse(await readFile(path.join(root, 'data/archive/oeuvre-relations.hu.json'), 'utf8'));
const sync = await readFile(path.join(root, 'scripts/sync-oeuvre-registry-hu.mjs'), 'utf8');

const failures = [];
const nodes = graph['@graph'] || [];
const byId = new Map(nodes.map((node) => [node['@id'], node]));

if (!graph['@context']) failures.push('Hiányzik a JSON-LD @context.');
if (!nodes.length) failures.push('Üres az életmű tudásgráf.');

const personId = 'https://www.banhalmi.art/norbert-banhalmi#person';
const websiteId = 'https://www.banhalmi.art/#website';
if (!byId.has(personId)) failures.push('Hiányzik a Person entitás.');
if (!byId.has(websiteId)) failures.push('Hiányzik a WebSite entitás.');

for (const relation of relations.records) {
  const projectId = `https://www.banhalmi.art/hu/projects/${relation.id}#project`;
  const project = byId.get(projectId);
  if (!project) {
    failures.push(`Hiányzó projektentitás: ${relation.id}`);
    continue;
  }
  if (project.archiveStatus !== relation.status) failures.push(`${relation.id}: eltérő státusz a tudásgráfban.`);
  if (project.creator?.['@id'] !== personId) failures.push(`${relation.id}: hibás alkotói kapcsolat.`);
  if (project.isPartOf?.['@id'] !== websiteId) failures.push(`${relation.id}: hibás archívumkapcsolat.`);

  const parts = new Set((project.hasPart || []).map((item) => item['@id']));
  for (const page of relation.pages) {
    const pageId = `https://www.banhalmi.art/${page.path}#record`;
    if (!parts.has(pageId)) failures.push(`${relation.id}: hiányzó hasPart kapcsolat: ${page.path}`);
    if (!byId.has(pageId)) failures.push(`${relation.id}: hiányzó rekordentitás: ${page.path}`);
  }
}

const euforiaProject = byId.get('https://www.banhalmi.art/hu/projects/euforia#project');
const euforiaEvent = byId.get('https://www.banhalmi.art/hu/exhibitions/euforia.html#record');
if (euforiaProject?.archiveStatus !== 'in-development') failures.push('Az EUFÓRIA projekt nem fejlesztés alatt állóként szerepel.');
if (euforiaEvent?.archiveStatus !== 'planned') failures.push('Az EUFÓRIA kiállítás nem tervezettként szerepel.');
if (euforiaEvent?.eventStatus !== 'https://schema.org/EventScheduled') failures.push('Az EUFÓRIA eseménystátusza hibás.');
if (euforiaEvent?.location) failures.push('Az EUFÓRIA tudásgráfban nem kaphat nem igazolt helyszínt.');

for (const required of ['oeuvreProjectId', 'archiveStatus', 'archiveRecordType', 'relatedOeuvreRecords', 'oeuvreRelationModel']) {
  if (!sync.includes(required)) failures.push(`A rekordjegyzék-szinkronból hiányzik: ${required}`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(`✗ ${failure}`));
  throw new Error(`Az életmű tudásgráf audit ${failures.length} hibát talált.`);
}

console.log(`✓ ${nodes.length} JSON-LD entitás`);
console.log(`✓ ${relations.records.length} központi életműegység`);
console.log('✓ Könyv–kiállítás–mű kapcsolatok ellenőrizve');
console.log('✓ EUFÓRIA projekt- és eseménystátusz szétválasztva');
