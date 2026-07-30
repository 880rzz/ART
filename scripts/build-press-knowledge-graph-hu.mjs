import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const registry = JSON.parse(await readFile(path.join(root, 'press-source-registry.json'), 'utf8'));
const relations = JSON.parse(await readFile(path.join(root, 'data/archive/press-relations.hu.json'), 'utf8'));
const records = registry.languages?.hu?.records || [];
const byAnchor = new Map(records.map((record) => [record.anchor, record]));
const accepted = new Set(relations.rules.acceptedSourceQuality);

const graph = [{
  '@type': 'CollectionPage',
  '@id': 'https://www.banhalmi.art/hu/press.html#collection',
  url: 'https://www.banhalmi.art/hu/press.html',
  name: 'Sajtó, interjúk és mozgóképes dokumentumok',
  inLanguage: 'hu-HU',
  about: {'@id': 'https://www.banhalmi.art/norbert-banhalmi#person'},
  isPartOf: {'@id': 'https://www.banhalmi.art/#website'}
}];

for (const [projectKey, relation] of Object.entries(relations.projects)) {
  const mentions = [];
  for (const anchor of relation.pressAnchors) {
    const record = byAnchor.get(anchor);
    if (!record) throw new Error(`${projectKey}: hiányzó sajtórekord: ${anchor}`);
    if (!accepted.has(record.sourceQuality)) throw new Error(`${anchor}: nem elfogadott forrásminőség: ${record.sourceQuality}`);

    const id = `https://www.banhalmi.art/hu/press.html#${anchor}-record`;
    const isVideo = /youtube|youtu\.be/i.test(record.sourceUrl) || /videó|video/i.test(record.publicationNote || '');
    graph.push({
      '@type': isVideo ? ['VideoObject', 'CreativeWork'] : ['Article', 'CreativeWork'],
      '@id': id,
      name: record.title,
      description: record.description,
      url: record.archiveUrl,
      sameAs: record.sourceUrl,
      inLanguage: 'hu-HU',
      isPartOf: {'@id': 'https://www.banhalmi.art/hu/press.html#collection'},
      about: {'@id': relation.projectId},
      mentions: {'@id': 'https://www.banhalmi.art/norbert-banhalmi#person'},
      archiveStatus: 'verified-press-source',
      sourceQuality: record.sourceQuality,
      publicationNote: record.publicationNote
    });
    mentions.push({'@id': id});
  }

  graph.push({
    '@type': 'CreativeWorkSeries',
    '@id': relation.projectId,
    subjectOf: mentions
  });
}

const output = {
  '@context': {
    '@vocab': 'https://schema.org/',
    archiveStatus: 'https://www.banhalmi.art/vocabulary/archiveStatus',
    sourceQuality: 'https://www.banhalmi.art/vocabulary/sourceQuality',
    publicationNote: 'https://www.banhalmi.art/vocabulary/publicationNote'
  },
  '@graph': graph
};

await writeFile(path.join(root, 'press-knowledge-graph.hu.jsonld'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`✓ ${graph.length - Object.keys(relations.projects).length - 1} ellenőrzött sajtóentitás`);
console.log(`✓ ${Object.keys(relations.projects).length} projekthez kapcsolva`);
