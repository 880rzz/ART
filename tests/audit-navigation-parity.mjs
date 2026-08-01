/* Navigation and footer parity.
 *
 * An audit found that within each language there were exactly two menu shapes
 * and two footer shapes, and in every language the odd one out was the
 * homepage: inner pages carried a 14-link footer including the contact email,
 * the homepages carried 11–13 links without it, and the Hungarian homepage menu
 * had nine entries where every other Hungarian page had eight. One generator
 * was also deleting a menu entry on every run, so the languages drifted apart
 * silently.
 *
 * These checks assert that a reader meets the same navigation everywhere:
 * one menu shape and one footer shape per language, and the same number of
 * menu entries across all three languages.
 */
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

function languageOf(rel) {
  if (rel.startsWith('hu/')) return 'hu';
  if (rel.startsWith('de-at/')) return 'de';
  return 'en';
}

/* Compare destinations, not the strings that spell them. A page in
   exhibitions/ legitimately writes "../curators.html" where a page at the
   language root writes "curators.html"; both resolve to the same document and
   must count as the same menu entry. So each href is resolved against the
   directory of the page that carries it, then stripped of the language prefix
   so the three languages can be compared with each other. */
function normaliseHref(href = '', pageRel = '') {
  let value = href.replace(/^https?:\/\/(www\.)?banhalmi\.art/i, '').trim();
  if (!value || /^(mailto:|tel:|https?:)/i.test(value)) return value;

  const [target, fragment = ''] = value.split('#');
  let resolved;
  if (target.startsWith('/')) {
    resolved = target;
  } else {
    const dir = path.posix.dirname('/' + pageRel);
    resolved = path.posix.resolve(dir, target || '.');
  }
  resolved = resolved.replace(/^\/(hu|de-at)(\/|$)/, '/');
  if (resolved === '/') resolved = '/index.html';
  return fragment ? `${resolved}#${fragment}` : resolved;
}

const menus = new Map();
const footers = new Map();
const failures = [];

for (const file of files) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const html = await readFile(file, 'utf8');
  if (/http-equiv=["']refresh["']/i.test(html)) continue;
  if (!/<body\b[^>]*class=["'][^"']*apple-archive/i.test(html)) continue;

  const lang = languageOf(rel);

  const menuMatch = /<div[^>]*id=["']menu["'][\s\S]*?(?=<main\b|<footer\b)/i.exec(html);
  if (menuMatch) {
    const hrefs = [...menuMatch[0].matchAll(/<a[^>]*class=["'][^"']*m-main[^"']*["'][^>]*href=["']([^"']+)["']/gi)]
      .map((m) => normaliseHref(m[1], rel));
    const shape = hrefs.join(' | ');
    if (!menus.has(lang)) menus.set(lang, new Map());
    if (!menus.get(lang).has(shape)) menus.get(lang).set(shape, []);
    menus.get(lang).get(shape).push(rel);
  }

  const footerMatch = /<footer[\s\S]*?<\/footer>/i.exec(html);
  if (footerMatch) {
    const hrefs = [...footerMatch[0].matchAll(/<a[^>]*href=["']([^"']+)["']/gi)].map((m) => normaliseHref(m[1], rel));
    const shape = hrefs.join(' | ');
    if (!footers.has(lang)) footers.set(lang, new Map());
    if (!footers.get(lang).has(shape)) footers.get(lang).set(shape, []);
    footers.get(lang).get(shape).push(rel);
  }
}

function reportVariants(label, collected) {
  for (const [lang, shapes] of collected) {
    if (shapes.size <= 1) continue;
    const ranked = [...shapes.entries()].sort((a, b) => b[1].length - a[1].length);
    const [, majorityPages] = ranked[0];
    const odd = ranked.slice(1);
    const detail = odd
      .map(([, pages]) => `${pages.length} page(s): ${pages.slice(0, 4).join(', ')}`)
      .join('; ');
    failures.push(
      `${label} (${lang}): ${shapes.size} different shapes. ` +
      `${majorityPages.length} pages agree, but ${detail} differ.`
    );
  }
}

reportVariants('menu', menus);
reportVariants('footer', footers);

/* The three languages must offer the same set of destinations. */
const perLanguageMenu = new Map();
for (const [lang, shapes] of menus) {
  const [dominant] = [...shapes.entries()].sort((a, b) => b[1].length - a[1].length);
  perLanguageMenu.set(lang, dominant[0].split(' | ').filter(Boolean));
}
const counts = [...perLanguageMenu].map(([lang, items]) => `${lang}:${items.length}`);
if (new Set([...perLanguageMenu.values()].map((i) => i.length)).size > 1) {
  failures.push(`menu entry counts differ across languages (${counts.join(', ')}) — the menus are not translations of each other`);
}
const [reference] = perLanguageMenu.values();
for (const [lang, items] of perLanguageMenu) {
  const missing = reference.filter((href) => !items.includes(href));
  const extra = items.filter((href) => !reference.includes(href));
  if (missing.length || extra.length) {
    failures.push(`menu (${lang}) diverges: missing ${missing.join(', ') || 'none'}; extra ${extra.join(', ') || 'none'}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  `Navigation parity audit passed: one menu and one footer shape per language, ` +
  `${[...perLanguageMenu.values()][0].length} matching entries in all three.`
);
