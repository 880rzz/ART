import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'art-image-ledger-'));
const generator = path.resolve('tools/build-image-inventory.mjs');
try {
  fs.mkdirSync(path.join(root, 'assets/img'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'assets/img/old.webp'), '');
  fs.writeFileSync(path.join(root, 'assets/img/new.png'), '');
  const previous = {
    generatedAt: null, schemaVersion: '1.0.0', totalImages: 2,
    images: [
      { src: '/assets/img/old.webp', extension: '.webp', classification: 'portrait',
        recordId: 'owner-verified-old', humanReviewed: true, notes: 'Source reviewed by owner' },
      { src: '/assets/img/removed.jpg', extension: '.jpg', classification: 'artwork',
        recordId: 'removed', humanReviewed: true, notes: 'No longer present' }
    ]
  };
  const inventoryPath = path.join(root, 'docs/image-inventory.json');
  fs.writeFileSync(inventoryPath, JSON.stringify(previous) + '\n');
  const run = () => execFileSync(process.execPath, [generator], { cwd: root, encoding: 'utf8' });
  run();
  const first = fs.readFileSync(inventoryPath, 'utf8');
  const data = JSON.parse(first);
  assert.equal(data.totalImages, 2);
  assert.deepEqual(data.images.map(v => v.src), ['/assets/img/new.png','/assets/img/old.webp']);
  assert.deepEqual(data.images.find(v => v.src.endsWith('old.webp')), previous.images[0],
    'human-approved provenance must never be lost on inventory regeneration');
  assert.deepEqual(data.images.find(v => v.src.endsWith('new.png')), {
    src: '/assets/img/new.png', extension: '.png', classification: 'unclassified',
    recordId: null, humanReviewed: false, notes: ''
  }, 'new assets must not inherit copyright or editorial review automatically');
  assert.ok(!first.includes('removed.jpg'), 'removed files cannot remain catalogued as present');
  run();
  assert.equal(fs.readFileSync(inventoryPath, 'utf8'), first, 'regeneration must be byte-identical');

  data.images.push({ ...data.images[0] });
  fs.writeFileSync(inventoryPath, JSON.stringify(data) + '\n');
  assert.throws(() => run(), /Command failed/, 'duplicate asset identities must fail closed');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
console.log('Image inventory regeneration preserves human review; new asset defaults and duplicate rejection pass.');
