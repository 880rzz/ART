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

const ids = new Set();
const urls = new Set();
const rows = items.map((item, i) => {
  if (typeof item.sourceId !== 'string' || !item.sourceId ||
      typeof item.url !== 'string' || !item.url ||
      ids.has(item.sourceId) || urls.has(item.url)) {
    throw new Error('Missing or duplicate source identity at entry ' + (i + 1));
  }
  ids.add(item.sourceId);
  urls.add(item.url);
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

if (network) {
  let cursor = 0;
  const workers = Array.from({ length: 6 }, async () => {
    while (cursor < rows.length) {
      const current = rows[cursor++];
      await check(current);
    }
  });
  await Promise.all(workers);
}

const tally = {};
for (const row of rows) tally[row.checkOutcome] = (tally[row.checkOutcome] ?? 0) + 1;
const report = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  repository: '880rzz/ART',
  sourceCount: rows.length,
  networkPerformed: network,
  outcomeCounts: tally,
  interpretation: 'HTTP accessibility is not claim corroboration, license verification or independent authority. HTTP failures are not automatically dead sources. No source status is promoted automatically.',
  rows
};
fs.mkdirSync('artifacts/source-ledger', { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
console.log('Source manifest:', rows.length, 'unique URLs / IDs; network:', network, '; outcomes:', JSON.stringify(tally));
console.log('Evidence:', outputPath);
