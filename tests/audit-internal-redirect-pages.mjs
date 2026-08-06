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
const normalizeRoute = value => {
  const route = decodeURIComponent(value).replace(/\/$/, '') || '/';
  return route.startsWith('/') ? route : `/${route}`;
};
const routeFromUrl = value => normalizeRoute(new URL(value).pathname);
const fileFor = route => {
  const clean = normalizeRoute(route).replace(/^\//, '');
  return path.join(root, clean.endsWith('.html') ? clean : path.join(clean, 'index.html'));
};
const walkHtml = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  if (['.git', 'node_modules', 'dist', 'build', '.cache'].includes(entry.name)) return [];
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walkHtml(full);
  return entry.isFile() && /\.html?$/i.test(entry.name) ? [full] : [];
});
const routeForFile = file => {
  const rel = path.relative(root, file).replaceAll('\\', '/');
  if (rel.endsWith('/index.html')) return normalizeRoute(rel.slice(0, -'/index.html'.length));
  return normalizeRoute(rel);
};

const redirects = data.redirects || {};
const normalizedSources = new Map();
for (const [route, target] of Object.entries(redirects)) {
  const source = normalizeRoute(route);
  if (normalizedSources.has(source)) errors.push(`${route}: duplicate normalized redirect source`);
  normalizedSources.set(source, target);
  if (source !== route) errors.push(`${route}: redirect source must use canonical route formatting (${source})`);
  if (typeof target !== 'string' || !target.trim()) {
    errors.push(`${route}: redirect target missing`);
    continue;
  }
  if (target === route || canonical(target) === `${base}${source}`) errors.push(`${route}: self redirect`);
  if (target.startsWith('/')) {
    const targetRoute = normalizeRoute(target.split(/[?#]/, 1)[0]);
    if (Object.prototype.hasOwnProperty.call(redirects, targetRoute)) {
      errors.push(`${route}: redirect chain points to another legacy source ${targetRoute}`);
    }
  }

  const file = fileFor(route);
  if (!fs.existsSync(file)) {
    errors.push(`${route}: internal redirect page missing at ${path.relative(root, file)}`);
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  const expectedTarget = absolute(target);
  const expectedCanonical = canonical(target);
  if (!text.includes('name="robots" content="noindex,follow"')) errors.push(`${route}: noindex,follow missing`);
  if (!text.includes(`http-equiv="refresh" content="0; url=${expectedTarget}"`)) errors.push(`${route}: meta refresh target mismatch`);
  if (!text.includes(`rel="canonical" href="${expectedCanonical}"`)) errors.push(`${route}: canonical target mismatch`);
  if (!text.includes(`const target = new URL(${JSON.stringify(expectedTarget)})`)) errors.push(`${route}: JavaScript target mismatch`);
  if (!text.includes('window.location.replace(target.href)')) errors.push(`${route}: window.location.replace missing`);
  if (text.includes('norbertbanhalmi.wixsite.com')) errors.push(`${route}: stale Wix target remains`);
  if (sitemap.includes(`<loc>${base}${route}</loc>`)) errors.push(`${route}: redirect source must not be listed in sitemap`);
}

for (const file of walkHtml(root)) {
  const text = fs.readFileSync(file, 'utf8');
  const looksLikeRedirect = /http-equiv=["']refresh["']/i.test(text)
    && /location\.replace\s*\(/.test(text)
    && /rel=["']canonical["']/i.test(text);
  if (!looksLikeRedirect) continue;
  const route = routeForFile(file);
  if (!normalizedSources.has(route)) {
    errors.push(`${route}: redirect page exists outside redirects.json (${path.relative(root, file)})`);
  }
}

const expectedSources = {
  posts: 'https://blog.banhalmi.art/blog-posts-sitemap.xml',
  categories: 'https://blog.banhalmi.art/blog-categories-sitemap.xml'
};
for (const [kind, expected] of Object.entries(expectedSources)) {
  if (inventory.sourceSitemaps?.[kind] !== expected) errors.push(`blog inventory: ${kind} sitemap source mismatch`);
  if (!Array.isArray(inventory[kind]) || inventory[kind].length === 0) errors.push(`blog inventory: ${kind} URLs missing`);
}

const allBlogUrls = [...(inventory.posts || []), ...(inventory.categories || [])];
if (inventory.counts?.total !== allBlogUrls.length) errors.push('blog inventory: total count mismatch');
if (inventory.counts?.posts !== (inventory.posts || []).length) errors.push('blog inventory: post count mismatch');
if (inventory.counts?.categories !== (inventory.categories || []).length) errors.push('blog inventory: category count mismatch');

for (const url of inventory.posts || []) {
  const parsed = new URL(url);
  const route = routeFromUrl(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'blog.banhalmi.art' || !route.startsWith('/post/')) {
    errors.push(`blog inventory: invalid post URL ${url}`);
    continue;
  }
  const expected = route.toLowerCase() === '/post/euforia' ? '/hu/exhibitions/euforia.html' : url;
  if (redirects[route] !== expected) errors.push(`${route}: sitemap post redirect mismatch`);
}

for (const url of inventory.categories || []) {
  const parsed = new URL(url);
  const route = routeFromUrl(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'blog.banhalmi.art' || !(route === '/blog' || route === '/blog/categories' || route.startsWith('/blog/categories/'))) {
    errors.push(`blog inventory: invalid category URL ${url}`);
    continue;
  }
  if (redirects[route] !== url) errors.push(`${route}: sitemap category redirect mismatch`);
}

if (redirects['/post/euforia'] !== '/hu/exhibitions/euforia.html') errors.push('/post/euforia: ART exception missing');
if (String(redirects['/post/euforia'] || '').includes('blog.banhalmi.art')) errors.push('/post/euforia: must not redirect to blog');
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
console.log(`Internal redirect audit passed: ${Object.keys(redirects).length} exact legacy routes with two-way source/page parity, including ${inventory.counts.posts} blog posts and ${inventory.counts.categories} blog categories.`);
