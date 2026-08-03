#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const inventoryPath = path.join(ROOT, 'docs', 'image-inventory.json');
const registryPath = path.join(ROOT, 'data', 'image-metadata.json');

if (!fs.existsSync(inventoryPath)) {
  console.error('Missing docs/image-inventory.json. Run npm run inventory:images first.');
  process.exit(1);
}
if (!fs.existsSync(registryPath)) {
  console.error('Missing data/image-metadata.json.');
  process.exit(1);
}

const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const records = Array.isArray(registry.records) ? registry.records : [];
const byAsset = new Map(records.map((record) => [record.asset, record]));

const meaningful = inventory.images.filter((image) => image.classification !== 'decorative');
const missing = meaningful.filter((image) => !byAsset.has(image.src));
const unreviewed = meaningful
  .map((image) => byAsset.get(image.src))
  .filter(Boolean)
  .filter((record) => record.review?.humanReviewed !== true);
const orphaned = records.filter((record) => !inventory.images.some((image) => image.src === record.asset));

const report = {
  generatedAt: new Date().toISOString(),
  totalInventoryImages: inventory.images.length,
  meaningfulImages: meaningful.length,
  registryRecords: records.length,
  missingRegistryRecords: missing.map((image) => image.src),
  unreviewedRecords: unreviewed.map((record) => record.id),
  orphanedRegistryRecords: orphaned.map((record) => record.id),
  coveragePercent: meaningful.length === 0 ? 100 : Number((((meaningful.length - missing.length) / meaningful.length) * 100).toFixed(2))
};

const outputPath = path.join(ROOT, 'docs', 'image-registry-coverage.json');
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

console.log(`Image metadata coverage: ${report.coveragePercent}%`);
console.log(`Missing records: ${missing.length}; unreviewed: ${unreviewed.length}; orphaned: ${orphaned.length}`);

if (missing.length || orphaned.length) process.exitCode = 1;
