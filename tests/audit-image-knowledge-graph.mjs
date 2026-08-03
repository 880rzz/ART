import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'image-metadata.json'), 'utf8'));
const graphDoc = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'image-knowledge-graph.jsonld'), 'utf8'));
const graph = Array.isArray(graphDoc['@graph']) ? graphDoc['@graph'] : [];
const expected = registry.records.filter((record) => record.review?.humanReviewed === true && record.review?.status === 'verified');
const errors = [];

if (graphDoc['@context'] !== 'https://schema.org') errors.push('JSON-LD context must be https://schema.org');
if (graph.length !== expected.length) errors.push(`Expected ${expected.length} verified nodes, found ${graph.length}`);

const ids = new Set();
for (const node of graph) {
  if (!node['@id']) errors.push('Image node missing @id');
  if (ids.has(node['@id'])) errors.push(`Duplicate @id: ${node['@id']}`);
  ids.add(node['@id']);
  const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
  if (!types.includes('ImageObject')) errors.push(`${node['@id'] || 'unknown'} missing ImageObject type`);
  for (const key of ['contentUrl', 'name', 'description', 'creator', 'copyrightNotice']) {
    if (!node[key]) errors.push(`${node['@id'] || 'unknown'} missing ${key}`);
  }
  if (node.creator?.['@id'] !== 'https://www.norbertbanhalmi.com/about/') {
    errors.push(`${node['@id'] || 'unknown'} uses a non-canonical creator id`);
  }
}

if (errors.length) {
  console.error(`Image knowledge graph audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Image knowledge graph audit passed (${graph.length} verified image nodes).`);
