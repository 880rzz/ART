import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'image-metadata.json'), 'utf8'));
const errors = [];
const warnings = [];
const ids = new Set();
const assets = new Set();
const langs = ['hu', 'en', 'de'];
const text = (value, label) => { if (typeof value !== 'string' || !value.trim()) errors.push(label + ' must be a non-empty string'); };

if (!Array.isArray(registry.records)) errors.push('records must be an array');
for (const record of registry.records || []) {
  text(record.id, 'record.id'); text(record.asset, record.id + '.asset');
  if (ids.has(record.id)) errors.push('duplicate record id: ' + record.id);
  if (assets.has(record.asset)) errors.push('duplicate asset record: ' + record.asset);
  ids.add(record.id); assets.add(record.asset);
  if (!fs.existsSync(path.join(root, record.asset.replace(/^\//, '')))) errors.push(record.id + ': missing asset ' + record.asset);
  for (const field of ['title', 'alt']) for (const lang of langs) text(record[field]?.[lang], record.id + '.' + field + '.' + lang);
  for (const lang of langs) {
    const alt = record.alt?.[lang]?.trim() || '';
    if (alt.length < 30) warnings.push(record.id + '.alt.' + lang + ' may be too short');
    if (alt.length > 220) warnings.push(record.id + '.alt.' + lang + ' may be too long');
  }
  if (record.creator?.id !== 'https://www.norbertbanhalmi.com/about/') errors.push(record.id + ': canonical creator id is incorrect');
  if (!record.rights?.copyrightNotice || !record.rights?.creditText) errors.push(record.id + ': rights metadata is incomplete');
  if (typeof record.review?.humanReviewed !== 'boolean') errors.push(record.id + ': humanReviewed must be explicit');
  if (typeof record.review?.visualReviewed !== 'boolean') errors.push(record.id + ': visualReviewed must be explicit');
  if (record.review?.status === 'verified') {
    if (record.review.visualReviewed !== true) errors.push(record.id + ': verified records require visual review');
    if (!record.review.reviewer) errors.push(record.id + ': verified records require a reviewer');
    if (!Array.isArray(record.review.evidence) || !record.review.evidence.length) errors.push(record.id + ': verified records require evidence');
  }
}
for (const warning of warnings) console.warn('WARN ' + warning);
if (errors.length) { for (const error of errors) console.error('ERROR ' + error); process.exit(1); }
console.log('Image metadata registry audit passed (' + (registry.records?.length || 0) + ' record(s)).');
