import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Read-only release gate: every committed image must be represented in the
// review inventory, and no phantom/deleted asset may retain a review record.
// This checks inventory coverage, NOT copyright, authorship or visual truth.
const roots = ['assets/img', 'images', 'img'];
const extensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg']);
const files = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) {
      files.push('/' + full.split(path.sep).join('/'));
    }
  }
}
for (const dir of roots) walk(dir);
const discovered = [...new Set(files)].sort();
const ledger = JSON.parse(fs.readFileSync('docs/image-inventory.json', 'utf8'));
assert.ok(Array.isArray(ledger.images), 'Image inventory must have an images array');
const recorded = ledger.images.map(item => item.src);
const recordedSet = new Set(recorded);
assert.equal(recordedSet.size, recorded.length, 'Duplicate image inventory paths');
assert.equal(ledger.totalImages, ledger.images.length, 'Manifest totalImages does not equal images.length');
assert.deepEqual(recorded, discovered, [
  'Image review inventory is stale: missing or deleted files detected.',
  'Regenerate with: node tools/build-image-inventory.mjs',
  'Never auto-promote humanReviewed, attribution, licences or rights based on a filename.'
].join(' '));
for (const item of ledger.images) {
  assert.equal(item.extension, path.extname(item.src).toLowerCase(), 'Incorrect extension: ' + item.src);
  assert.equal(typeof item.humanReviewed, 'boolean', 'Invalid humanReviewed flag: ' + item.src);
  assert.equal(typeof item.notes, 'string', 'Invalid review notes: ' + item.src);
  if (item.humanReviewed) {
    assert.ok(typeof item.recordId === 'string' && item.recordId.trim(),
      'Human-reviewed image must reference its review record: ' + item.src);
    assert.ok(item.notes.trim(), 'Human-reviewed image requires review notes: ' + item.src);
  }
}
console.log('ART image inventory coverage PASS:', discovered.length,
  'files catalogued; review states preserved (no rights or authorship inferred).');
