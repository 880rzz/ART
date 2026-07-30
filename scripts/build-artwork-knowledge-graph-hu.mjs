import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const registry = JSON.parse(await readFile(path.join(root, 'data/archive/artwork-registry.hu.json'), 'utf8'));

const graph = registry.records.map((record) => ({
  '@type': record.type,
  '@id': record.archiveId,
  name: record.title,
  url: record.url,
  creator: {'@id': record.creator},
  ...(record.subject ? {about: {'@id': record.subject}} : {}),
  ...(record.project ? {isPartOf: {'@id': record.project}} : {}),
  ...(record.dateCreated ? {dateCreated: record.dateCreated} : {}),
  ...(record.contentLocation ? {contentLocation: {'@id': record.contentLocation}} : {}),
  ...(record.sameAs?.length ? {sameAs: record.sameAs} : {}),
  inLanguage: registry.language,
  archiveStatus: record.archiveStatus,
  sourceQuality: record.sourceQuality,
}));

const output = {
  '@context': {
    '@vocab': 'https://schema.org/',
    archiveStatus: 'https://www.banhalmi.art/vocabulary/archiveStatus',
    sourceQuality: 'https://www.banhalmi.art/vocabulary/sourceQuality',
  },
  '@graph': graph,
};

await writeFile(
  path.join(root, 'artwork-knowledge-graph.hu.jsonld'),
  `${JSON.stringify(output, null, 2)}\n`,
  'utf8',
);

console.log(`✓ ${graph.length} ellenőrzött műtárgy-entitás létrehozva`);
