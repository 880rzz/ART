#!/usr/bin/env node
// Read-only consistency audit; no source registry is rewritten.
import { readFileSync } from 'node:fs';
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const map = read('service-evidence-map.json');
const deep = read('deep-search-evidence.json');
const verified = new Set((deep.verifiedRecords || []).map(record => record.id));
const pending = new Set((deep.pendingCandidates || []).map(record => record.id));
const errors = [];
for (const [service, ids] of Object.entries(map.deepSearchMappings || {})) {
  if (!Array.isArray(ids)) { errors.push(service + ': mappings must be an array'); continue; }
  for (const id of ids) {
    if (!verified.has(id)) errors.push(service + ': unresolved verified evidence ' + id);
    if (pending.has(id)) errors.push(service + ': pending candidate used as verified evidence ' + id);
  }
}
for (const entry of map.exhibitionMappings || []) {
  if (!map.services?.[entry.service]) errors.push(entry.id + ': unknown service ' + entry.service);
  for (const lang of ['en', 'hu', 'de']) {
    if (!entry.urls?.[lang]) errors.push(entry.id + ': missing ' + lang + ' exhibition URL');
    if (!map.services?.[entry.service]?.[lang]) errors.push(entry.id + ': missing ' + lang + ' service URL');
  }
}
for (const entry of map.pressMappings || []) {
  if (!map.services?.[entry.service]) errors.push(entry.record + ': unknown service');
  if (!/^https:\/\//.test(entry.sourceUrl || '')) errors.push(entry.record + ': missing HTTPS source');
}
if (errors.length) {
  console.error('Evidence integrity audit failed:\n' + errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Evidence integrity audit passed: ' +
    Object.values(map.deepSearchMappings || {}).reduce((n, ids) => n + ids.length, 0) +
    ' verified mappings; ' + (map.exhibitionMappings || []).length +
    ' multilingual exhibitions; ' + (map.pressMappings || []).length + ' press mappings.');
}
