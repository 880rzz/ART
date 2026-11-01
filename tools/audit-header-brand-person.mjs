import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const skip = new Set(['.git', 'node_modules', '_site', 'artifacts', 'dist', 'build', 'coverage']);
const errors = [];
const css = fs.readFileSync(path.join(root, 'assets/css/site.css'), 'utf8');

for (const token of [
  'brand-lockup',
  'brand-word',
  'brand-person',
  'font-size:.70em'
]) {
  if (!css.includes(token)) errors.push(`site.css missing header brand person rule token: ${token}`);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

let pages = 0;
for (const file of walk(root)) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('class="brand"') || !/<body\b[^>]*apple-archive/i.test(html)) continue;
  if (/http-equiv=["']refresh["']/i.test(html)) continue;
  pages += 1;
  const relative = path.relative(root, file).split(path.sep).join('/');
  const lockup = html.match(/<span class="brand-lockup">([\s\S]*?)<\/span>\s*<\/a>/);
  if (!lockup) {
    errors.push(`${relative}: brand lockup missing`);
    continue;
  }
  if (!lockup[1].includes('<span class="brand-word">BANHALMI</span>')) {
    errors.push(`${relative}: BANHALMI brand-word missing`);
  }
  const person = lockup[1].match(/<span class="brand-person">([^<]+)<\/span>/)?.[1];
  const expected = relative.startsWith('hu/') ? 'Bánhalmi Norbert' : 'Norbert Banhalmi';
  if (person !== expected) errors.push(`${relative}: expected person subtitle "${expected}", found "${person || ''}"`);
}

if (pages < 80) errors.push(`unexpectedly few archive pages with brand lockup: ${pages}`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Header brand person audit passed: ${pages} archive pages keep BANHALMI + localized person subtitle.`);
