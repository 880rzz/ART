import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildPressGraph } from './lib/archive-graph-builders.mjs';

const root = path.resolve(import.meta.dirname, '..');
const registry = JSON.parse(await readFile(path.join(root, 'press-source-registry.json'), 'utf8'));
const relations = JSON.parse(await readFile(path.join(root, 'data/archive/press-relations.hu.json'), 'utf8'));
const output = buildPressGraph(registry, relations);

await writeFile(
  path.join(root, 'press-knowledge-graph.hu.jsonld'),
  `${JSON.stringify(output, null, 2)}\n`,
  'utf8',
);

const projectCount = Object.keys(relations.projects).length;
console.log(`✓ ${output['@graph'].length - projectCount - 1} ellenőrzött sajtóentitás`);
console.log(`✓ ${projectCount} projekthez kapcsolva`);
