import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://www.banhalmi.art';
const data = JSON.parse(fs.readFileSync(path.join(root, 'redirects.json'), 'utf8'));
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'data/blog-sitemap-redirect-inventory.json'), 'utf8'));
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const errors = [];

const absolute = target => target.startsWith('/') ? `${base}${target}` : target;
const canonical = target => absolute(target).split('#', 1)[0];
const routeFromUrl = value => decodeURIComponent(new URL(value).pathname).replace(/\/$/, '') || '/';
const fileFor = route => {
  const clean = route.replace(/^\//, '');
  return path.join(root, clean.endsWith('.html') ? clean : path.join(clean, 'index.html'));
};

for (const [route, target] of Object.entries(data.redirects || {})) {
  const file = fileFor(route);
  if (!fs.existsSync(file)) {
    errors.push(`${route}: internal redirect page missing at ${path.relative(root, file)}`);
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  const expectedTarget = absolute(target);
  const expectedCanonical = canonical(target);
  if (/noindex/i.test(text)) errors.push(`${route}: redirect source must not carry noindex; redirect and canonical are the consolidation signals`);
  if (!text.includes(`http-equiv="refresh" content="0; url=${expectedTarget}"`)) errors.push(`${route}: meta refresh target mismatch`);
  if (!text.includes(`rel="canonical" href="${expectedCanonical}"`)) errors.push(`${route}: canonical target mismatch`);
  if (!text.includes(`const target = new URL(${JSON.stringify(expectedTarget)})`)) errors.push(`${route}: JavaScript target mismatch`);
  if (!text.includes('window.location.replace(target.href)')) errors.push(`${route}: window.location.replace missing`);
  if (text.includes('norbertbanhalmi.wixsite.com')) errors.push(`${route}: stale Wix target remains`);
  if (sitemap.includes(`<loc>${base}${route}</loc>`)) errors.push(`${route}: redirect source must not be listed in sitemap`);
}

const expectedSources = {
  index: 'https://blog.banhalmi.art/sitemap.xml',
  posts: 'https://blog.banhalmi.art/blog-posts-sitemap.xml',
  tags: 'https://blog.banhalmi.art/blog-tags-sitemap.xml',
  categories: 'https://blog.banhalmi.art/blog-categories-sitemap.xml'
};
for (const [kind, expected] of Object.entries(expectedSources)) {
  if (inventory.sourceSitemaps?.[kind] !== expected) errors.push(`blog inventory: ${kind} sitemap source mismatch`);
}
for (const kind of ['posts', 'tags', 'categories', 'pages']) {
  if (!Array.isArray(inventory[kind]) || inventory[kind].length === 0) errors.push(`blog inventory: ${kind} URLs missing`);
}

const observedCounts = Object.fromEntries(['posts', 'tags', 'categories', 'pages'].map(kind => [kind, (inventory[kind] || []).length]));
const observedTotal = Object.values(observedCounts).reduce((sum, count) => sum + count, 0);
if (inventory.counts?.total !== observedTotal) errors.push(`blog inventory: total count mismatch; declared ${String(inventory.counts?.total)}, observed ${observedTotal} (${JSON.stringify(observedCounts)})`);
for (const kind of ['posts', 'tags', 'categories', 'pages']) {
  if (inventory.counts?.[kind] !== observedCounts[kind]) errors.push(`blog inventory: ${kind} count mismatch; declared ${String(inventory.counts?.[kind])}, observed ${observedCounts[kind]}`);
}

for (const url of inventory.posts || []) {
  const parsed = new URL(url);
  const route = routeFromUrl(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'blog.banhalmi.art' || !route.startsWith('/post/')) {
    errors.push(`blog inventory: invalid post URL ${url}`);
    continue;
  }
  const expected = route.toLowerCase() === '/post/euforia' ? '/hu/exhibitions/euforia.html' : url;
  if (data.redirects?.[route] !== expected) errors.push(`${route}: sitemap post redirect mismatch`);
}

for (const url of inventory.tags || []) {
  const parsed = new URL(url);
  const route = routeFromUrl(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'blog.banhalmi.art' || !route.startsWith('/blog/tags/')) {
    errors.push(`blog inventory: invalid tag URL ${url}`);
    continue;
  }
  if (data.redirects?.[route] !== url) errors.push(`${route}: sitemap tag redirect mismatch`);
}

for (const url of inventory.categories || []) {
  const parsed = new URL(url);
  const route = routeFromUrl(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'blog.banhalmi.art' || !(route === '/blog' || route === '/blog/categories' || route.startsWith('/blog/categories/'))) {
    errors.push(`blog inventory: invalid category URL ${url}`);
    continue;
  }
  if (data.redirects?.[route] !== url) errors.push(`${route}: sitemap category redirect mismatch`);
}

for (const url of inventory.pages || []) {
  const parsed = new URL(url);
  const route = routeFromUrl(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'blog.banhalmi.art' || !/^\/blog\/page\/\d+$/.test(route)) {
    errors.push(`blog inventory: invalid pagination URL ${url}`);
    continue;
  }
  if (data.redirects?.[route] !== url) errors.push(`${route}: pagination redirect mismatch`);
}

if (data.redirects?.['/post/euforia'] !== '/hu/exhibitions/euforia.html') errors.push('/post/euforia: ART exception missing');
if (String(data.redirects?.['/post/euforia'] || '').includes('blog.banhalmi.art')) errors.push('/post/euforia: must not redirect to blog');
if (inventory.exception?.target !== 'https://www.banhalmi.art/hu/exhibitions/euforia.html') errors.push('blog inventory: EUFÓRIA exception target mismatch');

for (const obsolete of [
  'cloudflare-bulk-redirects.csv',
  'docs/CLOUDFLARE_REDIRECTS_10_OF_10.md',
  'tests/audit-edge-redirects.mjs'
]) {
  if (fs.existsSync(path.join(root, obsolete))) errors.push(`${obsolete}: obsolete Cloudflare redirect artifact remains`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Internal redirect audit passed: ${Object.keys(data.redirects).length} exact legacy routes, including ${observedCounts.posts} posts, ${observedCounts.tags} tags, ${observedCounts.categories} categories and ${observedCounts.pages} pagination routes.`);
