#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ASSET_DIRS = ['assets/img', 'images', 'img'];
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg']);
const OUTPUT = path.join(ROOT, 'docs', 'image-inventory.json');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

const files = ASSET_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
const relative = [...new Set(files.map((file) => '/' + path.relative(ROOT, file).split(path.sep).join('/')))].sort();
// Preserve reviewed decisions across regeneration; never mark a new asset
// reviewed solely because the owner supplied a copyright declaration.
const classifications = new Set([
  'unclassified', 'artwork', 'portrait', 'documentary', 'exhibition-view',
  'book-cover', 'publication', 'identity', 'decorative'
]);
let previousBySrc = new Map();
if (fs.existsSync(OUTPUT)) {
  const old = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));
  if (!Array.isArray(old.images)) throw new Error('Existing inventory has no images array');
  const seen = new Set();
  for (const item of old.images) {
    if (typeof item.src !== 'string' || seen.has(item.src)) {
      throw new Error('Duplicate or invalid asset key in existing image inventory');
    }
    seen.add(item.src);
    previousBySrc.set(item.src, item);
  }
}
const inventory = {
  generatedAt: null,
  schemaVersion: '1.0.0',
  totalImages: relative.length,
  images: relative.map((src) => {
    const prior = previousBySrc.get(src);
    if (prior && (
      !classifications.has(prior.classification) ||
      !(prior.recordId === null || typeof prior.recordId === 'string') ||
      typeof prior.humanReviewed !== 'boolean' ||
      typeof prior.notes !== 'string'
    )) throw new Error('Invalid reviewed inventory data: ' + src);
    return {
      src,
      extension: path.extname(src).toLowerCase(),
      classification: prior?.classification ?? 'unclassified',
      recordId: prior?.recordId ?? null,
      humanReviewed: prior?.humanReviewed ?? false,
      notes: prior?.notes ?? ''
    };
  })
};

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(inventory, null, 2) + '\n', 'utf8');
console.log(`Image inventory written: ${relative.length} files -> ${path.relative(ROOT, OUTPUT)}`);
