import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const skip = new Set(['.git', 'node_modules', 'dist', 'build', '.cache']);
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && /\.html?$/i.test(entry.name)) files.push(full);
  }
}
walk(root);

const errors = [];
let lightboxes = 0;
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('id="lb"')) continue;
  lightboxes += 1;
  const rel = path.relative(root, file).replaceAll('\\', '/');
  if (!/<div id="lb"[^>]*aria-hidden="true"/.test(html)) errors.push(rel + ': lightbox dialog must start aria-hidden');
  if (!/<img src="\/assets\/img\/favicon\.svg" alt="" aria-hidden="true" data-lightbox-placeholder>/.test(html)) errors.push(rel + ': placeholder must be explicitly hidden');
  for (const contract of [
    "img.removeAttribute('aria-hidden')",
    "lb.setAttribute('aria-hidden','false')",
    "lb.setAttribute('aria-hidden','true')",
    "img.setAttribute('aria-hidden','true')"
  ]) if (!html.includes(contract)) errors.push(rel + ': missing runtime contract ' + contract);
}
if (lightboxes !== 84) errors.push('Expected 84 lightbox pages, found ' + lightboxes);
if (errors.length) { for (const error of errors) console.error('ERROR ' + error); process.exit(1); }
console.log('Lightbox accessibility audit passed (' + lightboxes + ' pages).');
