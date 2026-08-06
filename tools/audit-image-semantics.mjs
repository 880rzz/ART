#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const STRICT = process.argv.includes('--strict');
const REPORT_PATH = path.join(ROOT, 'docs', 'image-alt-audit.json');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.cache']);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && /\.html?$/i.test(entry.name)) out.push(full);
  }
  return out;
}

function attrs(tag) {
  const map = new Map();
  const re = /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let match;
  while ((match = re.exec(tag))) {
    const key = match[1].toLowerCase();
    if (key === 'img') continue;
    map.set(key, match[2] ?? match[3] ?? match[4] ?? '');
  }
  return map;
}

function languageFor(file, html) {
  const declared = html.match(/<html[^>]*\blang\s*=\s*["']([^"']+)["']/i)?.[1];
  if (declared) return declared;
  const rel = path.relative(ROOT, file).replaceAll('\\', '/');
  if (rel.startsWith('hu/')) return 'hu-HU';
  if (rel.startsWith('de-at/')) return 'de-AT';
  return 'en';
}

function normalize(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function isGenericAlt(alt) {
  const value = alt.toLowerCase();
  return /^(image|photo|photograph|picture|hero image|gallery image|book cover|banhalmi|logo|artwork|illustration)(\s+\d+)?$/.test(value)
    || /^(kép|fotó|fénykép|galériakép|borító|könyvborító|alkotás)(\s+\d+)?$/.test(value)
    || /^(bild|foto|fotografie|galeriebild|buchcover|kunstwerk)(\s+\d+)?$/.test(value);
}

function looksLikeFilename(alt) {
  return /\.(jpe?g|png|webp|avif|gif|svg)$/i.test(alt) || /[_-]{2,}/.test(alt);
}

const files = walk(ROOT);
const records = [];
const altUse = new Map();

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const lang = languageFor(file, html);
  const rel = path.relative(ROOT, file).replaceAll('\\', '/');
  const tags = html.match(/<img\b[^>]*>/gi) ?? [];

  tags.forEach((tag, index) => {
    const a = attrs(tag);
    const src = a.get('src') || a.get('data-src') || '';
    const hasAlt = a.has('alt');
    const alt = normalize(a.get('alt') ?? '');
    const role = normalize(a.get('role') ?? '').toLowerCase();
    const ariaHidden = normalize(a.get('aria-hidden') ?? '').toLowerCase() === 'true';
    const decorative = alt === '' && (role === 'presentation' || role === 'none' || ariaHidden || a.has('data-decorative'));
    const issues = [];

    if (!hasAlt) issues.push('missing-alt-attribute');
    else if (alt === '' && !decorative) issues.push('empty-alt-unclassified');
    if (alt && isGenericAlt(alt)) issues.push('generic-alt');
    if (alt && looksLikeFilename(alt)) issues.push('filename-like-alt');
    if (alt && alt.length < 12) issues.push('too-short');
    if (alt && alt.length > 220) issues.push('too-long');

    const key = `${lang}\u0000${alt.toLowerCase()}`;
    if (alt) {
      const previous = altUse.get(key) ?? [];
      previous.push({ file: rel, src, index: index + 1 });
      altUse.set(key, previous);
    }

    records.push({ file: rel, lang, image: index + 1, src, alt, decorative, issues });
  });
}

for (const [key, uses] of altUse) {
  if (uses.length < 2) continue;
  const alt = key.split('\u0000')[1];
  if (!alt) continue;
  for (const use of uses) {
    const record = records.find(r => r.file === use.file && r.image === use.index);
    if (record && !record.issues.includes('duplicate-alt-in-language')) {
      record.issues.push('duplicate-alt-in-language');
    }
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  htmlFiles: files.length,
  images: records.length,
  compliant: records.filter(r => r.issues.length === 0).length,
  decorative: records.filter(r => r.decorative).length,
  withIssues: records.filter(r => r.issues.length > 0).length,
  issueCounts: {}
};

for (const record of records) {
  for (const issue of record.issues) {
    summary.issueCounts[issue] = (summary.issueCounts[issue] ?? 0) + 1;
  }
}

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, `${JSON.stringify({ summary, records }, null, 2)}\n`, 'utf8');

console.log(`Image semantics audit: ${summary.images} images in ${summary.htmlFiles} HTML files.`);
console.log(`Compliant: ${summary.compliant}; classified decorative: ${summary.decorative}; with issues: ${summary.withIssues}.`);
console.log(`Report: ${path.relative(ROOT, REPORT_PATH)}`);
for (const [issue, count] of Object.entries(summary.issueCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`- ${issue}: ${count}`);
}

if (STRICT && summary.withIssues > 0) process.exitCode = 1;
