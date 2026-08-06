import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules']);
const htmlFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}

walk(root);

const forbiddenRuntimeReferences = [
  'data/image-metadata.json',
  'data/image-metadata.schema.json',
  'data/image-inventory.json',
  'tools/build-image-inventory.mjs',
  'tools/sync-image-metadata-to-html.mjs',
  'tests/audit-image-',
];

const failures = [];
for (const file of htmlFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const token of forbiddenRuntimeReferences) {
    if (source.includes(token)) {
      failures.push(`${path.relative(root, file)} references internal-only resource: ${token}`);
    }
  }
}

const graphPath = path.join(root, 'data', 'image-knowledge-graph.jsonld');
if (fs.existsSync(graphPath)) {
  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  if (!graph || graph['@context'] !== 'https://schema.org' || !Array.isArray(graph['@graph'])) {
    failures.push('data/image-knowledge-graph.jsonld is not a valid standalone Schema.org graph');
  }
}

if (failures.length) {
  console.error('Image system runtime isolation audit failed:\n' + failures.map(x => `- ${x}`).join('\n'));
  process.exit(1);
}

console.log(`Image system runtime isolation audit passed across ${htmlFiles.length} HTML files.`);
