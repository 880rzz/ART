import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'image-metadata.json'), 'utf8'));
const doc = JSON.parse(fs.readFileSync(path.join(root, 'data', 'image-knowledge-graph.jsonld'), 'utf8'));
const graph = Array.isArray(doc['@graph']) ? doc['@graph'] : [];
const expected = registry.records.filter((record) => record.review?.status === 'verified' && record.review?.visualReviewed === true);
const errors = [];
if (doc['@context'] !== 'https://schema.org') errors.push('JSON-LD context must be Schema.org');
if (graph.length !== expected.length) errors.push('Expected ' + expected.length + ' public nodes, found ' + graph.length);
for (const node of graph) {
  const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
  if (!node['@id'] || !types.includes('ImageObject')) errors.push('Image node identity/type is incomplete');
  for (const key of ['contentUrl', 'name', 'description', 'creator', 'copyrightNotice']) if (!node[key]) errors.push((node['@id'] || 'unknown') + ' missing ' + key);
  if (node.creator?.['@id'] !== 'https://www.norbertbanhalmi.com/about/') errors.push((node['@id'] || 'unknown') + ' has non-canonical creator');
  const languages = new Set((Array.isArray(node.description) ? node.description : []).map((item) => item['@language']));
  for (const lang of ['hu', 'en', 'de']) if (!languages.has(lang)) errors.push((node['@id'] || 'unknown') + ' missing ' + lang + ' description');
}
if (errors.length) { for (const error of errors) console.error('ERROR ' + error); process.exit(1); }
console.log('Image knowledge graph audit passed (' + graph.length + ' verified node(s)).');
