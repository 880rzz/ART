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
const inventory = {
  generatedAt: null,
  schemaVersion: '1.0.0',
  totalImages: relative.length,
  images: relative.map((src) => ({
    src,
    extension: path.extname(src).toLowerCase(),
    classification: 'unclassified',
    recordId: null,
    humanReviewed: false,
    notes: ''
  }))
};

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(inventory, null, 2) + '\n', 'utf8');
console.log(`Image inventory written: ${relative.length} files -> ${path.relative(ROOT, OUTPUT)}`);
