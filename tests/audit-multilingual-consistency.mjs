import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const failures = [];
const htmlFiles = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'data') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}

function rel(file) { return path.relative(root, file).replaceAll(path.sep, '/'); }
function getMeta(html, key, attr = 'name') {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<meta\\b[^>]*${attr}=["']${escaped}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i'))?.[1]
    || html.match(new RegExp(`<meta\\b[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${escaped}["'][^>]*>`, 'i'))?.[1]
    || '';
}

await walk(root);
for (const file of htmlFiles) {
  const route = rel(file);
  const html = await readFile(file, 'utf8');
  if (/http-equiv=["']refresh["']/i.test(html)) continue;

  const expectedLocale = route.startsWith('hu/') ? 'hu_HU' : route.startsWith('de-at/') ? 'de_AT' : 'en_US';
  if (getMeta(html, 'og:locale', 'property') !== expectedLocale) failures.push(`${route}: invalid og:locale`);
  for (const key of ['twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) {
    if (!getMeta(html, key)) failures.push(`${route}: missing ${key}`);
  }
  const description = getMeta(html, 'description');
  const ogDescription = getMeta(html, 'og:description', 'property');
  const twitterDescription = getMeta(html, 'twitter:description');
  if (!description) failures.push(`${route}: missing meta description`);
  if (description && /(?:\.\.\.|…|multi-sensory\.)$/.test(description)) failures.push(`${route}: truncated description`);
  if (description && ogDescription !== description) failures.push(`${route}: meta and Open Graph descriptions differ`);
  if (description && twitterDescription !== description) failures.push(`${route}: meta and Twitter descriptions differ`);

  if (/\/(?:books|exhibitions)\//.test(`/${route}`) && /geo\.region|geo\.placename|geo\.position|name=["']ICBM["']/i.test(html)) {
    failures.push(`${route}: legacy page-level GEO metadata remains`);
  }
  if (/G-YLEMCP6YQ8/.test(html)) failures.push(`${route}: old ART analytics property remains`);
  if (/szosszenetek/i.test(route)) {
    const isbnValues = [...html.matchAll(/(?:isbn[^0-9]{0,20}|ISBN\s*)([0-9-]{10,17})/gi)].map((m) => m[1].replaceAll('-', ''));
    if (isbnValues.some((value) => value !== '9786150000534')) failures.push(`${route}: inconsistent Szösszenetek ISBN`);
  }
}

for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`Audited ${htmlFiles.length} multilingual HTML files.`);
if (failures.length) process.exitCode = 1;
