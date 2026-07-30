import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const registry = JSON.parse(await readFile(path.join(root, 'data/archive/artwork-registry.hu.json'), 'utf8'));
const graph = JSON.parse(await readFile(path.join(root, 'artwork-knowledge-graph.hu.jsonld'), 'utf8'));
const builder = await readFile(path.join(root, 'scripts/build-artwork-knowledge-graph-hu.mjs'), 'utf8');

const failures = [];
const nodes = graph['@graph'] || [];
const byId = new Map();

for (const node of nodes) {
  if (!node['@id']) failures.push('Az egyik műtárgy-entitásból hiányzik az @id.');
  else if (byId.has(node['@id'])) failures.push(`Ismétlődő műtárgyazonosító: ${node['@id']}`);
  else byId.set(node['@id'], node);
}

for (const record of registry.records) {
  const node = byId.get(record.archiveId);
  if (!node) {
    failures.push(`Hiányzó műtárgy-entitás: ${record.id}`);
    continue;
  }
  const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
  for (const requiredType of record.type) {
    if (!types.includes(requiredType)) failures.push(`${record.id}: hiányzó típus: ${requiredType}`);
  }
  if (node.creator?.['@id'] !== record.creator) failures.push(`${record.id}: hibás alkotói kapcsolat.`);
  if (record.subject && node.about?.['@id'] !== record.subject) failures.push(`${record.id}: hibás alanykapcsolat.`);
  if (record.project && node.isPartOf?.['@id'] !== record.project) failures.push(`${record.id}: hibás projektkapcsolat.`);
  if (record.contentLocation && node.contentLocation?.['@id'] !== record.contentLocation) failures.push(`${record.id}: hibás helyszínkapcsolat.`);
  if (record.dateCreated && node.dateCreated !== record.dateCreated) failures.push(`${record.id}: hibás készítési dátum.`);
  if (record.sourceQuality !== node.sourceQuality) failures.push(`${record.id}: hibás forrásminőség.`);
  if (!record.sameAs?.every((url) => (node.sameAs || []).includes(url))) failures.push(`${record.id}: hiányzó nyilvános forráskapcsolat.`);
}

for (const forbidden of registry.sourcePolicy.forbidden || []) {
  if (!forbidden) failures.push('Üres tiltott forrásszabály.');
}

for (const required of ['archiveStatus', 'sourceQuality', 'contentLocation', 'sameAs']) {
  if (!builder.includes(required)) failures.push(`A műtárgygráf-építőből hiányzik: ${required}`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(`✗ ${failure}`));
  throw new Error(`A műtárgy-tudásgráf audit ${failures.length} hibát talált.`);
}

console.log(`✓ ${registry.records.length} forrásolt műtárgyrekord`);
console.log(`✓ ${nodes.length} műtárgy-entitás`);
console.log('✓ Alkotó-, alany-, projekt-, helyszín- és forráskapcsolatok ellenőrizve');
console.log('✓ A nem igazolt műtárgyadatok felvételét forráspolitika korlátozza');
