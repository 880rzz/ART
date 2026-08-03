import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'data', 'image-metadata.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const errors = [];
const warnings = [];

const requiredLangs = ['hu', 'en', 'de'];
const seenIds = new Set();
const seenAssets = new Set();

function requireText(value, label) {
  if (typeof value !== 'string' || !value.trim()) errors.push(`${label} must be a non-empty string`);
}

function checkI18n(record, field, required = true) {
  const value = record[field];
  if (!value) {
    if (required) errors.push(`${record.id}: missing ${field}`);
    return;
  }
  for (const lang of requiredLangs) {
    const text = value[lang];
    if (required) requireText(text, `${record.id}.${field}.${lang}`);
    if (typeof text === 'string') {
      const clean = text.trim();
      if (field === 'alt' && clean.length < 30) warnings.push(`${record.id}.${field}.${lang} may be too short (${clean.length})`);
      if (field === 'alt' && clean.length > 220) warnings.push(`${record.id}.${field}.${lang} may be too long (${clean.length})`);
    }
  }
}

if (!Array.isArray(registry.records)) errors.push('data/image-metadata.json: records must be an array');

for (const record of registry.records || []) {
  requireText(record.id, 'record.id');
  requireText(record.asset, `${record.id}.asset`);
  if (seenIds.has(record.id)) errors.push(`duplicate record id: ${record.id}`);
  if (seenAssets.has(record.asset)) warnings.push(`asset has multiple records: ${record.asset}`);
  seenIds.add(record.id);
  seenAssets.add(record.asset);

  const localAsset = path.join(root, record.asset.replace(/^\//, ''));
  if (!fs.existsSync(localAsset)) errors.push(`${record.id}: asset does not exist: ${record.asset}`);

  checkI18n(record, 'title');
  checkI18n(record, 'alt');
  checkI18n(record, 'caption', false);
  checkI18n(record, 'longDescription', false);
  checkI18n(record, 'curatorialNote', false);
  checkI18n(record, 'aiSummary', false);

  if (record.decorative === true) {
    for (const lang of requiredLangs) {
      if ((record.alt?.[lang] || '').trim()) errors.push(`${record.id}: decorative record must have empty ALT text`);
    }
  }

  if (!record.creator || record.creator.id !== 'https://www.norbertbanhalmi.com/about/') {
    errors.push(`${record.id}: canonical creator entity is missing or incorrect`);
  }
  if (!record.rights?.copyrightNotice || !record.rights?.creditText) {
    errors.push(`${record.id}: rights metadata is incomplete`);
  }
  if (!record.review?.status) warnings.push(`${record.id}: review status is missing`);
  if (record.review?.status === 'verified' && record.review?.humanReviewed !== true) {
    errors.push(`${record.id}: verified records must be human reviewed`);
  }
}

console.log(`Image metadata records: ${registry.records?.length || 0}`);
for (const warning of warnings) console.warn(`WARN ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}
console.log('Image metadata registry audit passed.');
