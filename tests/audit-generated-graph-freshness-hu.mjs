import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { buildArtworkGraph, buildPressGraph } from '../scripts/lib/archive-graph-builders.mjs';

const root = path.resolve(import.meta.dirname, '..');
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));

const checks = [
  {
    name: 'műtárgygráf',
    outputPath: 'artwork-knowledge-graph.hu.jsonld',
    expected: buildArtworkGraph(await readJson('data/archive/artwork-registry.hu.json')),
  },
  {
    name: 'sajtógráf',
    outputPath: 'press-knowledge-graph.hu.jsonld',
    expected: buildPressGraph(
      await readJson('press-source-registry.json'),
      await readJson('data/archive/press-relations.hu.json'),
    ),
  },
];

const failures = [];

for (const check of checks) {
  const actual = await readJson(check.outputPath);
  if (!isDeepStrictEqual(actual, check.expected)) {
    const actualIds = new Set((actual['@graph'] || []).map((node) => node['@id']).filter(Boolean));
    const expectedIds = new Set((check.expected['@graph'] || []).map((node) => node['@id']).filter(Boolean));
    const missing = [...expectedIds].filter((id) => !actualIds.has(id));
    const unexpected = [...actualIds].filter((id) => !expectedIds.has(id));
    failures.push(
      `${check.name} elavult: ${check.outputPath}` +
      `${missing.length ? `; hiányzó entitások: ${missing.join(', ')}` : ''}` +
      `${unexpected.length ? `; váratlan entitások: ${unexpected.join(', ')}` : ''}`,
    );
  } else {
    console.log(`✓ ${check.name}: a generált fájl pontosan egyezik a forrás-registryvel`);
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error(`✗ ${failure}`));
  console.error('Javítás: futtasd az npm run integrate:artwork-graph-hu és npm run integrate:press-graph-hu parancsokat, majd commitold a generált fájlokat.');
  throw new Error(`${failures.length} generált tudásgráf nincs szinkronban a forrásával.`);
}

console.log('✓ Minden ellenőrzött generált tudásgráf friss és determinisztikus.');
