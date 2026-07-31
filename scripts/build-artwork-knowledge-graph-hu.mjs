import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildArtworkGraph } from './lib/archive-graph-builders.mjs';

const root = path.resolve(import.meta.dirname, '..');
const registry = JSON.parse(await readFile(path.join(root, 'data/archive/artwork-registry.hu.json'), 'utf8'));
const output = buildArtworkGraph(registry);

await writeFile(
  path.join(root, 'artwork-knowledge-graph.hu.jsonld'),
  `${JSON.stringify(output, null, 2)}\n`,
  'utf8',
);

console.log(`✓ ${output['@graph'].length} ellenőrzött műtárgy-entitás létrehozva`);
