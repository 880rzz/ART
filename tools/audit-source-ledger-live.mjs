#!/usr/bin/env node
// Read-only evidence audit for ART issue #393. Never rewrites the provenance ledger.
import fs from 'node:fs';
import net from 'node:net';

const manifestPath = 'master-source-database.json';
const outputPath = 'artifacts/source-ledger/public-url-evidence.json';
const network = process.argv.includes('--network');
const ledger = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const items = ledger.sources;
if (!Array.isArray(items) || items.length !== ledger.sourceCount) {
  throw new Error('Source ledger count does not match sources[]');
}

function validatePublicUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { throw new Error('Invalid source URL'); }
  const h = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password ||
      (url.port && url.port !== '443') || net.isIP(h) ||
      h === 'localhost' || h.endsWith('.localhost') ||
      h.endsWith('.local') || !h.includes('.')) {
    throw new Error('Non-public HTTPS URL');
  }
  return url;
}

// An independently indexed exact public source can legitimately be cited in
// separate Wikipedia and Wikidata provenance registries. Source IDs remain
// unique; shared URL evidence is allowed only across distinct registries.
const ids = new Set();
const byUrl = new Map();
const rows = items.map((item, i) => {
  if (typeof item.sourceId !== 'string' || !item.sourceId ||
      typeof item.url !== 'string' || !item.url ||
      ids.has(item.sourceId)) {
    throw new Error('Missing or duplicate source identity at entry ' + (i + 1));
  }
  const previousRegistries = byUrl.get(item.url);
  const currentRegistries = new Set(item.registries ?? []);
  if (previousRegistries) {
    if (!previousRegistries.size || !currentRegistries.size ||
        [...currentRegistries].some(name => previousRegistries.has(name))) {
      throw new Error('Duplicate source URL within the same or unknown registry at entry ' + (i + 1));
    }
    for (const name of currentRegistries) previousRegistries.add(name);
  } else {
    byUrl.set(item.url, currentRegistries);
  }
  ids.add(item.sourceId);
  validatePublicUrl(item.url);
  return {
    sourceId: item.sourceId,
    url: item.url,
    recordedVerificationStatus: item.verification?.status ?? 'not-recorded',
    reportedHttpStatus: null,
    finalUrl: null,
    contentType: null,
    checkOutcome: 'not-run',
    note: null
  };
});

async function check(row) {
  let target = row.url;
  try {
    for (let hop = 0; hop < 6; hop++) {
      validatePublicUrl(target);
      const response = await fetch(target, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'BANHALMI-ART-Source-Evidence/1.0 (read-only)',
          'Range': 'bytes=0-0',
          'Accept': 'text/html,application/xhtml+xml,application/pdf,*/*;q=0.5'
        }
      });
      row.reportedHttpStatus = response.status;
      row.contentType = response.headers.get('content-type');
      await response.body?.cancel();
      const location = response.headers.get('location');
      if (response.status >= 300 && response.status < 400 && location) {
        target = new URL(location, target).href;
        continue;
      }
      row.finalUrl = target;
      row.checkOutcome = response.status >= 200 && response.status < 300
        ? 'http-reachable-not-claim-verified'
        : 'requires-human-review';
      return;
    }
    row.checkOutcome = 'requires-human-review';
    row.note = 'redirect-limit';
  } catch (error) {
    row.checkOutcome = 'requires-human-review';
    row.note = error?.name === 'TimeoutError' ? 'timeout' : 'fetch-or-redirect-unavailable';
  }
}

// Fetch each distinct public URL once, then attach the same observed HTTP
// result to every registry entry citing it (without modifying its evidence
// status, source ID, attribution or claim interpretation).
const uniqueRows = new Map();
for (const row of rows) if (!uniqueRows.has(row.url)) uniqueRows.set(row.url, row);
if (network) {
  const targets = [...uniqueRows.values()];
  let cursor = 0;
  const workers = Array.from({ length: 6 }, async () => {
    while (cursor < targets.length) {
      const current = targets[cursor++];
      await check(current);
    }
  });
  await Promise.all(workers);
  for (const row of rows) {
    const observed = uniqueRows.get(row.url);
    if (row === observed) continue;
    for (const field of ['reportedHttpStatus', 'finalUrl', 'contentType', 'checkOutcome', 'note']) {
      row[field] = observed[field];
    }
  }
}

const tally = {};
for (const row of rows) tally[row.checkOutcome] = (tally[row.checkOutcome] ?? 0) + 1;
const report = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  repository: '880rzz/ART',
  sourceCount: rows.length,
  uniqueUrlCount: uniqueRows.size,
  sharedUrlRegistries: [...uniqueRows.keys()].filter(url => rows.filter(r => r.url === url).length > 1).map(url => ({
    url,
    sourceIds: rows.filter(r => r.url === url).map(r => r.sourceId)
  })),
  networkPerformed: network,
  outcomeCounts: tally,
  interpretation: 'HTTP accessibility is not claim corroboration, license verification or independent authority. HTTP failures are not automatically dead sources. No source status is promoted automatically.',
  rows
};
fs.mkdirSync('artifacts/source-ledger', { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
console.log('Source manifest:', rows.length, 'unique source IDs /', uniqueRows.size, 'distinct public URLs; network:', network, '; outcomes:', JSON.stringify(tally));
console.log('Evidence:', outputPath);
