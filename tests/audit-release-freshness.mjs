/* Release freshness.
 *
 * Browsers and CDN edges cache CSS and JS by exact URL, query string included.
 * So a stylesheet can be rewritten, committed, pushed and deployed, and every
 * returning visitor still gets the old file — because the URL never changed.
 *
 * This is not hypothetical. Between releases 20260731-museum-v1 and
 * 20260801-museum-v2, museum-editorial.css was rewritten four times while the
 * token stood still. Everything passed: the tests were green, the file was on
 * the server, the pages linked it. The deployed site nevertheless served the
 * first day's stylesheet, and three of the design fixes were invisible.
 *
 * Hence this audit. data/design-release.json records a digest of every
 * versioned asset. If the assets change and the digest does not, the release
 * token was not bumped and the change will not reach anybody: fail, and say
 * what to do about it.
 */
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const configPath = path.join(root, 'data/design-release.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
const failures = [];

/* Hash every stylesheet in the folder, not a list somebody has to remember to
   extend. page-base.css was added and this audit went on passing, because the
   list in design-release.json had not been updated — the one guard against a
   stale cache key was blind to the newest file. The list is still declared, so
   the intended load order stays documented, but a file that exists and is not
   listed is now itself a failure. */
const cssDir = path.join(root, 'assets/css');
const present = (await readdir(cssDir)).filter((f) => f.endsWith('.css')).sort();
const missing = present.filter((f) => !config.stylesheets.includes(f));
if (missing.length) {
  failures.push(
    `assets/css contains ${missing.join(', ')}, which data/design-release.json does not list.\n` +
    `  Add them to "stylesheets" so the cache key is guarded, in the order they are linked.`
  );
}

const hash = createHash('sha256');
for (const name of present) {
  hash.update(await readFile(path.join(cssDir, name)));
}
for (const file of (await readdir(path.join(root, 'assets/js'))).filter((f) => f.endsWith('.js')).sort()) {
  hash.update(await readFile(path.join(root, 'assets/js', file)));
}
for (const file of (await readdir(path.join(root, 'assets/video'))).filter((f) => f.endsWith('.mp4')).sort()) {
  hash.update(await readFile(path.join(root, 'assets/video', file)));
}
const digest = hash.digest('hex').slice(0, 16);

if (!config.assetDigest) {
  failures.push('data/design-release.json has no assetDigest — nothing is guarding the cache key.');
} else if (config.assetDigest !== digest) {
  /* Surface the calculated value as a native Actions annotation as well as in
     the audit log. This keeps cache-freshness failures actionable even when a
     CI client cannot download the uploaded log artifact. */
  console.error(`::error title=ART design asset digest mismatch::recorded ${config.assetDigest}; actual ${digest}; release ${config.release}`);
  failures.push(
    `The versioned assets have changed but the release token has not.\n` +
    `  recorded digest : ${config.assetDigest}\n` +
    `  actual digest   : ${digest}\n` +
    `  release token   : ${config.release}\n\n` +
    `  Visitors and the CDN cache these files by URL, so the change would not reach anybody.\n` +
    `  Bump "release" in data/design-release.json, set "assetDigest" to ${digest},\n` +
    `  then run: npm run bump:release`
  );
}

/* Every page must carry the current token, and nothing older. */
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

/* A link with no ?v= at all is invisible to the check above, and that is
 * exactly how this went unnoticed: page-base.css was linked as a relative,
 * unversioned href on 81 pages. It hashed correctly, it existed, every page
 * linked it — and every edit to it (including the body>nav fix for the
 * ecosystem strip) sat uncached-but-cacheable indefinitely, because the URL
 * never changed. An unversioned reference is now a failure in its own right,
 * not a silent skip. */
const unversioned = new Map();
const stale = new Map();
let checked = 0;
for (const file of files) {
  const html = await readFile(file, 'utf8');
  if (!/<html\b/i.test(html)) continue;
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const tokens = [...html.matchAll(/\/assets\/(?:css|js|video)\/[^"'?]+\.(?:css|js|mp4)\?v=([^"']+)/g)].map((m) => m[1]);
  const bare = [...html.matchAll(/(?:href|src)=["']((?:\.\.\/)*\/?assets\/(?:css|js)\/[^"'?]+\.(?:css|js|mp4))["']/g)].map((m) => m[1]);
  if (bare.length) {
    for (const b of bare) {
      if (!unversioned.has(b)) unversioned.set(b, []);
      unversioned.get(b).push(rel);
    }
  }
  if (!tokens.length) continue;
  checked += 1;
  for (const token of new Set(tokens)) {
    if (token !== config.release) {
      if (!stale.has(token)) stale.set(token, []);
      stale.get(token).push(rel);
    }
  }
}
for (const [asset, pages] of unversioned) {
  failures.push(
    `${asset} is linked without ?v= on ${pages.length} page(s) (e.g. ${pages.slice(0, 3).join(', ')}) — ` +
    `it will never be cache-busted. Use an absolute /assets/... href so bump:release can version it.`
  );
}
for (const [token, pages] of stale) {
  failures.push(
    `${pages.length} page(s) still link assets at the old token ${token} instead of ${config.release} ` +
    `(e.g. ${pages.slice(0, 3).join(', ')}). Run: npm run bump:release`
  );
}

if (failures.length) {
  console.error(failures.join('\n\n'));
  process.exit(1);
}
console.log(
  `Release freshness audit passed: assets match digest ${digest}, ` +
  `and all ${checked} pages link them at ${config.release}.`
);
