import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const graph = JSON.parse(await readFile(path.join(root, 'press-knowledge-graph.hu.jsonld'), 'utf8'));
const registry = JSON.parse(await readFile(path.join(root, 'press-source-registry.json'), 'utf8'));
const relations = JSON.parse(await readFile(path.join(root, 'data/archive/press-relations.hu.json'), 'utf8'));
const builderEntry = await readFile(path.join(root, 'scripts/build-press-knowledge-graph-hu.mjs'), 'utf8');
const builderLibrary = await readFile(path.join(root, 'scripts/lib/archive-graph-builders.mjs'), 'utf8');
const builder = `${builderEntry}\n${builderLibrary}`;

const failures = [];
const nodes = graph['@graph'] || [];
const byId = new Map();
for (const node of nodes) {
  if (!node['@id']) failures.push('Az egyik sajtóentitásnak nincs @id mezője.');
  if (byId.has(node['@id'])) failures.push(`Ismétlődő @id: ${node['@id']}`);
  byId.set(node['@id'], node);
}

const huRecords = new Map((registry.languages?.hu?.records || []).map((record) => [record.anchor, record]));
const collectionId = 'https://www.banhalmi.art/hu/press.html#collection';
if (!byId.has(collectionId)) failures.push('Hiányzik a magyar sajtógyűjtemény entitása.');

let pressCount = 0;
for (const [projectKey, relation] of Object.entries(relations.projects)) {
  const projectNode = byId.get(relation.projectId);
  if (!projectNode) {
    failures.push(`${projectKey}: hiányzik a projekt kapcsolati csomópontja.`);
    continue;
  }
  const subjectIds = new Set((projectNode.subjectOf || []).map((item) => item['@id']));

  for (const anchor of relation.pressAnchors) {
    const source = huRecords.get(anchor);
    if (!source) {
      failures.push(`${projectKey}: a forrásjegyzékből hiányzik ${anchor}.`);
      continue;
    }
    if (!relations.rules.acceptedSourceQuality.includes(source.sourceQuality)) {
      failures.push(`${anchor}: nem elfogadott forrásminőség.`);
    }

    const id = `https://www.banhalmi.art/hu/press.html#${anchor}-record`;
    const node = byId.get(id);
    if (!node) {
      failures.push(`${anchor}: hiányzik az önálló sajtóentitás.`);
      continue;
    }
    pressCount += 1;
    if (node.about?.['@id'] !== relation.projectId) failures.push(`${anchor}: hibás projektkapcsolat.`);
    if (node.isPartOf?.['@id'] !== collectionId) failures.push(`${anchor}: hibás gyűjteménykapcsolat.`);
    if (node.sameAs !== source.sourceUrl) failures.push(`${anchor}: eltér a hiteles forrás URL-je.`);
    if (node.sourceQuality !== source.sourceQuality) failures.push(`${anchor}: eltér a forrásminőség.`);
    if (!subjectIds.has(id)) failures.push(`${projectKey}: a subjectOf kapcsolatból hiányzik ${anchor}.`);
  }
}

const euforia = byId.get('https://www.banhalmi.art/hu/press.html#press-21-record');
if (!euforia) failures.push('Hiányzik az EUFÓRIA / Magyar Péter dokumentációs rekord.');
if (euforia && !Array.isArray(euforia.mentions)) failures.push('A Magyar Péter-rekordnak az alkotót és a művet is említenie kell.');

for (const required of ['acceptedSourceQuality', 'publisherHomepageIsEvidence', 'channelCollectionIsIndividualCoverage']) {
  if (!(required in relations.rules)) failures.push(`Hiányzik a forráskezelési szabály: ${required}`);
}
for (const required of ['sourceQuality', 'publicationNote', 'subjectOf', 'sameAs']) {
  if (!builder.includes(required)) failures.push(`A gráfépítő modulokból hiányzik: ${required}`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(`✗ ${failure}`));
  throw new Error(`A magyar sajtógráf audit ${failures.length} hibát talált.`);
}

console.log(`✓ ${pressCount} önálló, ellenőrzött sajtóentitás`);
console.log(`✓ ${Object.keys(relations.projects).length} projekthez kapcsolva`);
console.log('✓ A forrásminőség és a kétirányú subjectOf/about kapcsolatok ellenőrizve');
