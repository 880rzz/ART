import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const graphFiles = [
  'oeuvre-knowledge-graph.hu.jsonld',
  'press-knowledge-graph.hu.jsonld',
  'artwork-knowledge-graph.hu.jsonld',
];

const failures = [];
const occurrences = new Map();

for (const file of graphFiles) {
  const document = JSON.parse(await readFile(path.join(root, file), 'utf8'));
  for (const node of document['@graph'] || []) {
    const id = node['@id'];
    if (!id) continue;
    const list = occurrences.get(id) || [];
    list.push({file, node});
    occurrences.set(id, list);
  }
}

const comparableFields = [
  'name',
  'url',
  'dateCreated',
  'archiveStatus',
  'sourceQuality',
];
const relationFields = [
  'creator',
  'about',
  'isPartOf',
  'contentLocation',
];

const stable = (value) => JSON.stringify(value ?? null);
const relationId = (value) => value?.['@id'] ?? null;
const types = (node) => new Set(Array.isArray(node['@type']) ? node['@type'] : [node['@type']].filter(Boolean));

for (const [id, entries] of occurrences) {
  if (entries.length < 2) continue;
  const [first, ...rest] = entries;

  for (const entry of rest) {
    for (const field of comparableFields) {
      if (first.node[field] === undefined || entry.node[field] === undefined) continue;
      if (stable(first.node[field]) !== stable(entry.node[field])) {
        failures.push(`${id}: eltérő ${field} mező (${first.file} ↔ ${entry.file}).`);
      }
    }

    for (const field of relationFields) {
      if (first.node[field] === undefined || entry.node[field] === undefined) continue;
      if (relationId(first.node[field]) !== relationId(entry.node[field])) {
        failures.push(`${id}: eltérő ${field} kapcsolat (${first.file} ↔ ${entry.file}).`);
      }
    }

    const firstTypes = types(first.node);
    const entryTypes = types(entry.node);
    const shared = [...firstTypes].some((type) => entryTypes.has(type));
    if (!shared) failures.push(`${id}: összeegyeztethetetlen @type értékek (${first.file} ↔ ${entry.file}).`);
  }
}

const oeuvre = JSON.parse(await readFile(path.join(root, 'oeuvre-knowledge-graph.hu.jsonld'), 'utf8'));
const artwork = JSON.parse(await readFile(path.join(root, 'artwork-knowledge-graph.hu.jsonld'), 'utf8'));
const oeuvreById = new Map((oeuvre['@graph'] || []).map((node) => [node['@id'], node]));

for (const node of artwork['@graph'] || []) {
  const creatorId = relationId(node.creator);
  const subjectId = relationId(node.about);
  const projectId = relationId(node.isPartOf);
  const placeId = relationId(node.contentLocation);

  for (const [label, linkedId] of [
    ['alkotó', creatorId],
    ['alany', subjectId],
    ['projekt', projectId],
    ['helyszín', placeId],
  ]) {
    if (linkedId && !oeuvreById.has(linkedId)) {
      failures.push(`${node['@id']}: a(z) ${label} azonosító nincs definiálva az életműgráfban: ${linkedId}`);
    }
  }
}

const canonicalIds = {
  person: 'https://www.banhalmi.art/norbert-banhalmi#person',
  magyarPeter: 'https://www.banhalmi.art/people/peter-magyar#person',
  heroesSquare: 'https://www.banhalmi.art/places/heroes-square-budapest#place',
  euforia: 'https://www.banhalmi.art/hu/projects/euforia#project',
  artwork: 'https://www.banhalmi.art/hu/works/magyar-peter-portre-2026.html#record',
};

for (const [label, id] of Object.entries(canonicalIds)) {
  if (!occurrences.has(id)) failures.push(`Hiányzó kanonikus ${label} azonosító: ${id}`);
}

const forbiddenPrefixes = [
  'https://www.banhalmi.art/entities/people/',
  'https://www.banhalmi.art/entities/places/',
];
for (const [id, entries] of occurrences) {
  if (forbiddenPrefixes.some((prefix) => id.startsWith(prefix))) {
    failures.push(`Elavult, párhuzamos entitásazonosító maradt a gráfokban: ${id} (${entries.map((entry) => entry.file).join(', ')})`);
  }
  for (const {file, node} of entries) {
    for (const field of relationFields) {
      const linkedId = relationId(node[field]);
      if (linkedId && forbiddenPrefixes.some((prefix) => linkedId.startsWith(prefix))) {
        failures.push(`${file}: elavult ${field} kapcsolat: ${linkedId}`);
      }
    }
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error(`✗ ${failure}`));
  throw new Error(`A cross-graph audit ${failures.length} konzisztenciahibát talált.`);
}

const duplicated = [...occurrences.values()].filter((entries) => entries.length > 1).length;
console.log(`✓ ${graphFiles.length} tudásgráf összevetve`);
console.log(`✓ ${occurrences.size} egyedi entitásazonosító ellenőrizve`);
console.log(`✓ ${duplicated} több gráfban előforduló entitás konzisztens`);
console.log('✓ Minden műtárgyi alkotó-, alany-, projekt- és helyszínkapcsolat feloldható');
