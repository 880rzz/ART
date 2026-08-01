/* Internal links stay in their own language.
 *
 * A reader on the English EUFÓRIA page clicked "Archive record" and landed on
 * the Hungarian version — even though the English one existed. The hreflang
 * markup was correct; only the link in the body was wrong, which is why
 * nothing caught it. One link is enough to drop somebody out of their language
 * with no way of knowing why.
 *
 * Three kinds of crossing are legitimate and are allowed by name:
 *   - the language switcher, whose entire job is to cross;
 *   - shared machine-readable data files at the root, which have no language;
 *   - redirect stubs for the old Wix blog, which are Hungarian-only.
 * Everything else must resolve inside the language of the page that links it.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

/* Language-neutral targets: data, not pages. */
const NEUTRAL = [
  /^\/[\w-]+\.json$/,          // /archive-source-map.json, /wikipedia-source-registry.json
  /^\/assets\//,
  /^\/sitemap\.xml$/,
  /^\/robots\.txt$/,
  /^\/post\//,                 // Hungarian-only redirect stubs to the former Wix blog
  /^\/sw\.js$/,
];

function languageOf(p) {
  const clean = p.replace(/^\//, '');
  if (clean.startsWith('hu/')) return 'hu';
  if (clean.startsWith('de-at/')) return 'de';
  return 'en';
}

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
let checked = 0;
let switcher = 0;

for (const file of files) {
  const html = await readFile(file, 'utf8');
  if (/http-equiv=["']refresh["']/i.test(html)) continue;
  if (!/<body\b[^>]*class=["'][^"']*apple-archive/i.test(html)) continue;

  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const from = languageOf(rel);
  const dir = '/' + path.posix.dirname(rel);

  /* Collect the switcher's own hrefs so they are not counted as defects. */
  const switcherHrefs = new Set();
  for (const block of html.matchAll(/<div class="langs">([\s\S]*?)<\/div>/g)) {
    for (const a of block[1].matchAll(/href="([^"]+)"/g)) switcherHrefs.add(a[1]);
  }

  for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    const href = match[1];
    if (/^(https?:|\/\/|mailto:|tel:|#|javascript:)/i.test(href)) continue;
    const target = href.split('#')[0].split('?')[0];
    if (!target) continue;
    checked += 1;

    const resolved = target.startsWith('/') ? target : path.posix.resolve(dir, target);
    if (NEUTRAL.some((re) => re.test(resolved))) continue;
    if (switcherHrefs.has(href)) { switcher += 1; continue; }

    const to = languageOf(resolved);
    if (to !== from) {
      /* Only a defect if the reader's own language has this page. */
      const own = from === 'en'
        ? resolved.replace(/^\/(hu|de-at)\//, '/')
        : `/${from === 'de' ? 'de-at' : 'hu'}${resolved.replace(/^\/(hu|de-at)\//, '/')}`;
      const exists = files.some((f) => '/' + path.relative(root, f).replaceAll(path.sep, '/') === own);
      failures.push(
        `${rel} [${from}] links to ${resolved} [${to}]  via href="${href}"` +
        (exists ? `\n     the ${from} version exists at ${own} and should be used instead` : '')
      );
    }
  }
}

if (failures.length) {
  console.error(
    `${failures.length} internal link(s) leave their page's language outside the switcher:\n\n` +
    failures.join('\n') +
    `\n\nIf a target is genuinely language-neutral, add it to NEUTRAL in this file.`
  );
  process.exit(1);
}
console.log(
  `Internal link language audit passed: ${checked} links checked, ` +
  `${switcher} language-switcher crossings, none stranded outside their own language.`
);
