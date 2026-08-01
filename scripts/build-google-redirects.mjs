import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { requireExplicitRun } from './lib/one-time-migration.mjs';
requireExplicitRun('build-google-redirects', 'Replaces 37 live pages with redirect stubs pointing at the old Wix site.');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'redirects.json'), 'utf8'));
const siteOrigin = 'https://www.banhalmi.art';

function normalizeSource(source) {
  return source.replace(/^\/+|\/+$/g, '');
}

function absoluteTarget(target) {
  if (/^https?:\/\//i.test(target)) return target;
  return new URL(target, siteOrigin).href;
}

function redirectDocument(target) {
  const absolute = absoluteTarget(target);
  const escapedTarget = JSON.stringify(target);
  return `<!doctype html>
<html lang="hu-HU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0; url=${absolute}">
<link rel="canonical" href="${absolute}">
<title>Az oldal új helyre költözött — BANHALMI</title>
<script>location.replace(${escapedTarget}+location.search+location.hash)</script>
</head>
<body>
<p>Az oldal véglegesen új helyre költözött. <a href="${absolute}">Tovább az új oldalra</a>.</p>
</body>
</html>
`;
}

for (const [source, target] of Object.entries(config.redirects)) {
  const relative = normalizeSource(source);
  const destination = path.join(root, relative, 'index.html');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, redirectDocument(target));
}

console.log(`Generated ${Object.keys(config.redirects).length} Google-compatible legacy redirects.`);
