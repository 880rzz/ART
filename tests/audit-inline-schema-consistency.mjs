import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const canonicalPersonId = 'https://www.norbertbanhalmi.com/about/';
const canonicalPersonUrl = 'https://www.norbertbanhalmi.com/about/';
const localizedPersonUrls = new Set([
  'https://www.banhalmi.art/hu/norbert-banhalmi',
  'https://www.banhalmi.art/de-at/norbert-banhalmi',
]);
const excludedDirectories = new Set(['.git', 'node_modules', '.netlify']);
const errors = [];
const entityDefinitions = new Map();
let htmlCount = 0;
let blockCount = 0;

/* This used to assert that a generator contained the line that normalises the
   canonical Person URL. That checked the pipeline, not the site: the generator
   could be correct while a page was wrong, and vice versa. The generators are
   gone and the HTML is the source of truth, so the property is asserted where
   it matters — on the pages themselves, below. */

async function collectHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.well-known') continue;
    if (excludedDirectories.has(entry.name)) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtml(absolute));
    else if (entry.isFile() && extname(entry.name).toLowerCase() === '.html') files.push(absolute);
  }
  return files;
}

function asArray(value) {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

function walk(value, visit) {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
    return;
  }
  if (!value || typeof value !== 'object') return;
  visit(value);
  for (const child of Object.values(value)) walk(child, visit);
}

function normalizeTypes(value) {
  return asArray(value).filter(item => typeof item === 'string').sort();
}

function isPipelineNormalizedPersonConflict(id, firstUrl, nextUrl) {
  if (id !== canonicalPersonId || !pipelineNormalizesPersonUrl) return false;
  const urls = new Set([firstUrl, nextUrl]);
  if (!urls.has(canonicalPersonUrl)) return false;
  return [...urls].every(url => url === canonicalPersonUrl || localizedPersonUrls.has(url));
}

function registerEntity(node, source) {
  const id = node['@id'];
  if (typeof id !== 'string' || !id.startsWith('https://www.banhalmi.art/')) return;
  const signature = {
    types: normalizeTypes(node['@type']),
    url: typeof node.url === 'string' ? node.url : null,
  };
  const previous = entityDefinitions.get(id);
  if (!previous) {
    entityDefinitions.set(id, { signature, source });
    return;
  }
  if (previous.signature.types.length && signature.types.length &&
      JSON.stringify(previous.signature.types) !== JSON.stringify(signature.types)) {
    errors.push(`${source}: conflicting @type for ${id}; previously defined in ${previous.source}`);
  }
  if (previous.signature.url && signature.url && previous.signature.url !== signature.url &&
      !isPipelineNormalizedPersonConflict(id, previous.signature.url, signature.url)) {
    errors.push(`${source}: conflicting url for ${id}; previously defined in ${previous.source}`);
  }
}

function inspectNode(node, source) {
  const id = node['@id'];
  if (typeof id === 'string' && id.includes('/entities/')) {
    errors.push(`${source}: legacy /entities/ identifier remains: ${id}`);
  }

  const types = normalizeTypes(node['@type']);
  if (types.includes('Person')) {
    const name = typeof node.name === 'string' ? node.name.toLowerCase() : '';
    const isNorbert = name.includes('bánhalmi norbert') || name.includes('banhalmi norbert') || id === canonicalPersonId;
    if (isNorbert && id !== canonicalPersonId) {
      errors.push(`${source}: Norbert Bánhalmi Person must use ${canonicalPersonId}, found ${String(id)}`);
    }
    if (isNorbert && typeof node.url === 'string' &&
        node.url !== canonicalPersonUrl && !localizedPersonUrls.has(node.url)) {
      errors.push(`${source}: unexpected Norbert Bánhalmi Person url: ${node.url}`);
    }
  }

  registerEntity(node, source);
}

const htmlFiles = await collectHtml(root);
for (const file of htmlFiles) {
  htmlCount += 1;
  const source = relative(root, file).replaceAll('\\', '/');
  const html = await readFile(file, 'utf8');
  const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let index = 0;
  while ((match = pattern.exec(html)) !== null) {
    index += 1;
    blockCount += 1;
    const label = `${source}#jsonld-${index}`;
    let parsed;
    try {
      parsed = JSON.parse(match[1].trim());
    } catch (error) {
      errors.push(`${label}: invalid JSON-LD (${error.message})`);
      continue;
    }
    walk(parsed, node => inspectNode(node, label));
  }
}

if (errors.length) {
  console.error(`Inline schema consistency audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Inline schema consistency audit passed: ${htmlCount} HTML files, ${blockCount} JSON-LD blocks, ${entityDefinitions.size} local entity identifiers.`);
