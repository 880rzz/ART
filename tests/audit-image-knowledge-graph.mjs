import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'image-metadata.json'), 'utf8'));
const doc = JSON.parse(fs.readFileSync(path.join(root, 'data', 'image-knowledge-graph.jsonld'), 'utf8'));
const graph = Array.isArray(doc['@graph']) ? doc['@graph'] : [];
const expected = registry.records.filter((record) => record.review?.status === 'verified' && record.review?.visualReviewed === true);
const errors = [];

const asTypes = (node) => (Array.isArray(node['@type']) ? node['@type'] : [node['@type']]).filter(Boolean);
const imageNodes = graph.filter((node) => asTypes(node).includes('ImageObject'));
const personNodes = graph.filter((node) => asTypes(node).includes('Person') && !asTypes(node).includes('ImageObject'));

if (doc['@context'] !== 'https://schema.org') errors.push('JSON-LD context must be Schema.org');

for (const node of graph) {
  const types = asTypes(node);
  if (!node['@id'] || types.length === 0) errors.push('Graph node identity/type is incomplete');
  if (!types.includes('ImageObject') && !types.includes('Person')) {
    errors.push((node['@id'] || 'unknown') + ' has unsupported root type ' + types.join(','));
  }
}

if (imageNodes.length < expected.length) {
  errors.push('Expected at least ' + expected.length + ' ImageObject node(s), found ' + imageNodes.length);
}

for (const record of expected) {
  const assetUrl = new URL(record.asset, 'https://www.banhalmi.art').href;
  const sameAs = new Set((record.sameAs || []).map(String));
  const match = imageNodes.find((node) => {
    const nodeSameAs = Array.isArray(node.sameAs) ? node.sameAs.map(String) : node.sameAs ? [String(node.sameAs)] : [];
    return (
      node.contentUrl === assetUrl ||
      node.url === assetUrl ||
      String(node['@id'] || '').includes(record.id) ||
      nodeSameAs.some((value) => sameAs.has(value)) ||
      (sameAs.size > 0 && sameAs.has(String(node.contentUrl || '')))
    );
  });
  if (!match) errors.push('Missing ImageObject for verified registry record ' + record.id);
}

for (const node of imageNodes) {
  for (const key of ['contentUrl', 'name', 'description', 'creator', 'copyrightNotice']) {
    if (!node[key]) errors.push((node['@id'] || 'unknown') + ' missing ' + key);
  }
  if (node.creator?.['@id'] !== 'https://www.banhalmiphotography.com/about/') {
    errors.push((node['@id'] || 'unknown') + ' has non-canonical creator');
  }
  const languages = new Set((Array.isArray(node.description) ? node.description : []).map((item) => item['@language']).filter(Boolean));
  // Multilingual description arrays are required for registry-built nodes; EUFÓRIA work photos may use a string description.
  if (Array.isArray(node.description)) {
    for (const lang of ['hu', 'en', 'de']) {
      if (!languages.has(lang)) errors.push((node['@id'] || 'unknown') + ' missing ' + lang + ' description');
    }
  } else if (!node.description) {
    errors.push((node['@id'] || 'unknown') + ' missing description');
  }
}

for (const node of personNodes) {
  if (!node.name || !node['@id']) errors.push((node['@id'] || 'unknown') + ' Person node incomplete');
  if (node.image?.['@id']) {
    const photo = imageNodes.find((image) => image['@id'] === node.image['@id']);
    if (!photo) errors.push((node['@id'] || 'unknown') + ' Person.image does not resolve to an ImageObject in the graph');
  }
}

if (errors.length) {
  for (const error of errors) console.error('ERROR ' + error);
  process.exit(1);
}
console.log(
  'Image knowledge graph audit passed (' +
    imageNodes.length +
    ' ImageObject node(s), ' +
    personNodes.length +
    ' subject Person node(s)).'
);
