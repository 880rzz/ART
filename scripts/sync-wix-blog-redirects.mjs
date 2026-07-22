import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, 'redirects.json');
const sitemapUrl = 'https://norbertbanhalmi.wixsite.com/norbertbanhalmi/blog/blog-posts-sitemap.xml';
const wixOrigin = 'https://norbertbanhalmi.wixsite.com';
const wixSitePrefix = '/norbertbanhalmi';
const protectedRoutes = new Set(['/post/euforia']);

const response = await fetch(sitemapUrl, {
  headers: {
    'user-agent': 'BANHALMI migration sync/1.0 (+https://www.banhalmi.art/)'
  }
});

if (!response.ok) {
  throw new Error(`Wix sitemap request failed: ${response.status} ${response.statusText}`);
}

const xml = await response.text();
const locations = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].trim());
if (!locations.length) throw new Error('No <loc> entries found in Wix blog sitemap.');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
config.blogArchive = `${wixOrigin}${wixSitePrefix}/blog`;
config.blogSitemap = sitemapUrl;
config.redirects ??= {};

let added = 0;
let updated = 0;
let skipped = 0;

for (const location of locations) {
  let url;
  try {
    url = new URL(location);
  } catch {
    skipped += 1;
    continue;
  }

  if (url.origin !== wixOrigin || !url.pathname.startsWith(`${wixSitePrefix}/post/`)) {
    skipped += 1;
    continue;
  }

  const slug = url.pathname.slice(`${wixSitePrefix}/post/`.length).replace(/^\/+|\/+$/g, '');
  if (!slug) {
    skipped += 1;
    continue;
  }

  const source = `/post/${decodeURIComponent(slug)}`;
  if (protectedRoutes.has(source)) {
    skipped += 1;
    continue;
  }

  const target = `${wixOrigin}${wixSitePrefix}/post/${slug}`;
  if (!(source in config.redirects)) added += 1;
  else if (config.redirects[source] !== target) updated += 1;
  config.redirects[source] = target;
}

config.redirects = Object.fromEntries(Object.entries(config.redirects).sort(([a], [b]) => a.localeCompare(b, 'hu')));
fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

console.log(`Wix sitemap entries: ${locations.length}; added: ${added}; updated: ${updated}; skipped: ${skipped}.`);
