/* Stage 120: Books is a plain destination, never a disclosure, and menu titles outrank descriptions. */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const skip = new Set(['.git', 'node_modules', '.github', 'data']);
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}
await walk(root);

const failures = [];
const counts = { en: 0, hu: 0, de: 0 };
let menuPages = 0;
for (const file of files) {
  const html = await readFile(file, 'utf8');
  if (!/id=["']menu["']/i.test(html)) continue;
  menuPages += 1;
  const lang = (html.match(/<html\b[^>]*lang=["']([^"']+)/i)?.[1] || 'en').toLowerCase();
  if (lang.startsWith('hu')) counts.hu += 1;
  else if (lang.startsWith('de')) counts.de += 1;
  else counts.en += 1;
  if (/<summary>(?:All books|Összes könyv|Alle Bücher)<\/summary>/i.test(html)) {
    failures.push(`${path.relative(root, file)} still contains a Books disclosure`);
  }
  if (!/<a class="m-main"[^>]*href="[^"]*#books"[^>]*>(?:Books|Könyvek|Bücher)<\/a><p class="m-desc">/i.test(html)) {
    failures.push(`${path.relative(root, file)} has no plain Books destination followed by its description`);
  }
}
if (menuPages < 87) failures.push(`Only ${menuPages} menu pages were audited; expected at least 87`);
for (const [lang, count] of Object.entries(counts)) if (count < 20) failures.push(`${lang} menu coverage is unexpectedly low: ${count}`);

const css = await readFile(path.join(root, 'assets/css/final-layout-fixes.css'), 'utf8');
if (css.includes('data-nav-role="books"')) failures.push('CSS still contains a Books disclosure fallback selector');
if (!/body\.apple-archive #menu \.m-main\{[\s\S]*?font-size:clamp\(1\.12rem,[\s\S]*?1\.48rem\)!important;/m.test(css)) failures.push('Global menu-title hierarchy guard is missing');
if (!/body\.apple-archive #menu \.m-desc\{[\s\S]*?font-size:clamp\(\.76rem,[\s\S]*?\.86rem\)!important;/m.test(css)) failures.push('Global menu-description hierarchy guard is missing');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Stage 120 Books menu audit passed: ${menuPages} EN/HU/DE menu pages use a plain Books destination with no disclosure; title/description hierarchy remains guarded.`);
