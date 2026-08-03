import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'image-metadata.json'), 'utf8'));
const langForPage = (page) => page.startsWith('/hu/') ? 'hu' : page.startsWith('/de-at/') ? 'de' : 'en';
const decode = (value) => String(value)
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');
const normaliseAsset = (value) => {
  try { return new URL(value, 'https://www.banhalmi.art').pathname; }
  catch { return value; }
};

const failures = [];
let checked = 0;

for (const record of registry.records ?? []) {
  if (record.decorative) continue;
  for (const page of record.relatedPages ?? []) {
    const rel = page.replace(/^\//, '');
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) {
      failures.push(`${record.id}: missing related page ${page}`);
      continue;
    }

    const lang = langForPage(page);
    const expected = record.alt?.[lang];
    if (!expected) {
      failures.push(`${record.id}: no ${lang} ALT in registry for ${page}`);
      continue;
    }

    const asset = normaliseAsset(record.asset);
    const base = path.basename(asset);
    const html = fs.readFileSync(file, 'utf8');
    const tags = html.match(/<img\b[^>]*>/gi) ?? [];
    const matching = tags.filter((tag) => {
      const src = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i)?.[2];
      if (!src) return false;
      const normalised = normaliseAsset(src);
      return normalised === asset || path.basename(normalised) === base;
    });

    if (!matching.length) {
      failures.push(`${record.id}: asset ${record.asset} not used in ${page}`);
      continue;
    }

    for (const tag of matching) {
      checked += 1;
      const actual = tag.match(/\balt\s*=\s*(["'])(.*?)\1/i)?.[2];
      if (actual == null) failures.push(`${record.id}: image has no ALT in ${page}`);
      else if (decode(actual).trim() !== expected.trim()) {
        failures.push(`${record.id}: ALT mismatch in ${page}\n  expected: ${expected}\n  actual:   ${decode(actual)}`);
      }
    }
  }
}

if (failures.length) {
  console.error(`Image HTML sync audit failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Image HTML sync audit passed (${checked} image occurrence(s) checked).`);
