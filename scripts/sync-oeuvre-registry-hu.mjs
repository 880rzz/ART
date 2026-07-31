import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const relationPath = path.join(root, 'data/archive/oeuvre-relations.hu.json');
const registryPath = path.join(root, 'archive-record-registry.json');

const relations = JSON.parse(await readFile(relationPath, 'utf8'));
const registry = JSON.parse(await readFile(registryPath, 'utf8'));

function absoluteUrl(pagePath) {
  return `https://www.banhalmi.art/${pagePath.replace(/^hu\//, 'hu/')}`;
}

const relationByUrl = new Map();
for (const record of relations.records) {
  const projectId = `https://www.banhalmi.art/hu/projects/${record.id}#project`;
  for (const page of record.pages) {
    relationByUrl.set(absoluteUrl(page.path), {
      oeuvreProjectId: projectId,
      oeuvreProjectTitle: record.title,
      archiveStatus: record.status,
      archiveStatusLabel: relations.statusLabels[record.status],
      archiveRecordType: page.type,
      relatedOeuvreRecords: record.pages
        .filter((candidate) => candidate.path !== page.path)
        .map((candidate) => absoluteUrl(candidate.path)),
    });
  }
}

let changed = 0;
for (const record of registry.records || []) {
  const canonical = record.canonicalUrl;
  const relation = relationByUrl.get(canonical);
  if (!relation) continue;

  for (const [key, value] of Object.entries(relation)) {
    if (JSON.stringify(record[key]) !== JSON.stringify(value)) {
      record[key] = value;
      changed += 1;
    }
  }

  const related = new Set(record.relatedRecords || []);
  for (const url of relation.relatedOeuvreRecords) related.add(url);
  related.add(relation.oeuvreProjectId);
  record.relatedRecords = [...related];
}

registry.oeuvreRelationModel = {
  language: relations.language,
  updatedAt: relations.updatedAt,
  source: 'data/archive/oeuvre-relations.hu.json',
  knowledgeGraph: 'oeuvre-knowledge-graph.hu.jsonld',
  statuses: relations.statusLabels,
};

await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ changedFields: changed, matchedRecords: relationByUrl.size }, null, 2));
