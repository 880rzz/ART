import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  if (['.git', 'node_modules'].includes(entry.name)) return [];
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});

for (const file of walk(root).filter((f) => f.endsWith('.html'))) {
  const rel = path.relative(root, file);
  const html = fs.readFileSync(file, 'utf8');
  const redirect = /http-equiv=["']refresh["']/i.test(html);
  const is404 = rel === '404.html';
  if (/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html) && !is404) {
    errors.push(`${rel}: live or redirect document must not carry noindex`);
  }
  if (!redirect && !is404 && !/<link\b[^>]*rel=["']canonical["']/i.test(html)) {
    errors.push(`${rel}: live content page missing canonical`);
  }
}

const recovered = {
  'en/work/index.html': 'https://www.banhalmi.art/',
  'about/norbert-banhalmi/index.html': 'https://www.norbertbanhalmi.com/about/',
  'hu/rolam/banhalmi-norbert/index.html': 'https://www.norbertbanhalmi.com/about/',
  'de/ueber-mich/norbert-banhalmi/index.html': 'https://www.norbertbanhalmi.com/about/',
  'press/index.html': 'https://www.banhalmi.art/press.html',
  'old-print/index.html': 'https://www.banhalmi.art/press.html',
  'hu/sajto/megjelenesek/index.html': 'https://www.banhalmi.art/hu/press.html',
  'hu/sajto/nyomtatott/index.html': 'https://www.banhalmi.art/hu/press.html',
  'de/presse/presseauftritte/index.html': 'https://www.banhalmi.art/de-at/press.html',
  'de/presse/print/index.html': 'https://www.banhalmi.art/de-at/press.html'
};
for (const [rel, target] of Object.entries(recovered)) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  if (!html.includes(`rel="canonical" href="${target}"`)) errors.push(`${rel}: canonical target mismatch`);
  if (!html.includes(`url=${target}`)) errors.push(`${rel}: meta refresh target mismatch`);
  if (!html.includes('window.location.replace')) errors.push(`${rel}: JavaScript redirect missing`);
}

if (errors.length) {
  console.error('STAGE 47 LIVE INDEXING / LEGACY ROUTE AUDIT FAILED');
  errors.forEach((e) => console.error('-', e));
  process.exit(1);
}
console.log('Stage 47 passed: live archive pages are indexable/self-canonical and recovered historical routes resolve to current equivalents.');
