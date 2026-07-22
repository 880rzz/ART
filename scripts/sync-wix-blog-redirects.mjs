import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, 'redirects.json');
const inventoryPath = path.join(root, 'wix-sitemap-inventory.json');
const wixOrigin = 'https://norbertbanhalmi.wixsite.com';

const sources = [
  {
    id: 'art-blog-posts',
    role: 'blog-archive',
    language: 'hu-HU',
    url: 'https://norbertbanhalmi.wixsite.com/norbertbanhalmi/blog/blog-posts-sitemap.xml',
    sitePrefix: '/norbertbanhalmi',
  },
  {
    id: 'art-pages',
    role: 'legacy-art-pages',
    language: 'hu-HU',
    url: 'https://norbertbanhalmi.wixsite.com/norbertbanhalmi/pages-sitemap.xml',
    sitePrefix: '/norbertbanhalmi',
  },
  {
    id: 'legacy-commercial-site',
    role: 'legacy-commercial-pages',
    language: 'en',
    url: 'https://norbertbanhalmi.wixsite.com/banhalmi/sitemap.xml',
    sitePrefix: '/banhalmi',
  },
  {
    id: 'legacy-commercial-site-de-at',
    role: 'legacy-commercial-pages-de-at',
    language: 'de-AT',
    url: 'https://norbertbanhalmi.wixsite.com/banhalmi/de-at/sitemap.xml',
    sitePrefix: '/banhalmi/de-at',
  },
];

const protectedRoutes = new Set(['/post/euforia']);

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

async function readSitemap(source) {
  const response = await fetch(source.url, {
    headers: {
      'user-agent': 'BANHALMI migration sync/2.1 (+https://www.banhalmi.art/)',
      accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
    },
  });
  if (!response.ok) {
    throw new Error(`${source.id}: sitemap request failed: ${response.status} ${response.statusText}`);
  }
  const xml = await response.text();
  const locations = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => decodeXml(match[1].trim()));
  if (!locations.length) throw new Error(`${source.id}: no <loc> entries found.`);
  return locations;
}

function localTargetExists(target) {
  if (/^https?:\/\//i.test(target)) return false;
  const clean = target.split(/[?#]/)[0].replace(/^\/+/, '');
  const candidates = clean.endsWith('.html')
    ? [clean]
    : [clean, path.join(clean, 'index.html')];
  return candidates.some((candidate) => fs.existsSync(path.join(root, candidate)));
}

function legacyPath(url, sitePrefix) {
  if (url.origin !== wixOrigin || !url.pathname.startsWith(sitePrefix)) return null;
  const value = url.pathname.slice(sitePrefix.length) || '/';
  return value.startsWith('/') ? value : `/${value}`;
}

function suggestedLocalTarget(source, oldPath) {
  if (source.language === 'de-AT') return oldPath === '/' ? '/de-at/' : `/de-at${oldPath}`;
  if (source.language === 'hu-HU') return oldPath === '/' ? '/hu/' : `/hu${oldPath}`;
  return oldPath === '/' ? '/' : oldPath;
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
config.blogArchive = `${wixOrigin}/norbertbanhalmi/blog`;
config.sitemapSources = Object.fromEntries(sources.map((source) => [source.id, source.url]));
config.redirects ??= {};

const inventory = {
  generatedAt: new Date().toISOString(),
  policy: 'Exact blog matches are redirected automatically. Legacy pages are inventoried and only redirected when an explicit, content-equivalent mapping exists.',
  sources: {},
  totals: { discovered: 0, redirected: 0, protected: 0, review: 0, invalid: 0 },
};

let added = 0;
let updated = 0;

for (const source of sources) {
  const locations = await readSitemap(source);
  const entries = [];

  for (const location of locations) {
    inventory.totals.discovered += 1;
    let url;
    try {
      url = new URL(location);
    } catch {
      inventory.totals.invalid += 1;
      entries.push({ location, status: 'invalid-url' });
      continue;
    }

    const oldPath = legacyPath(url, source.sitePrefix);
    if (!oldPath) {
      inventory.totals.invalid += 1;
      entries.push({ location, status: 'unexpected-host-or-prefix' });
      continue;
    }

    if (source.role === 'blog-archive' && oldPath.startsWith('/post/')) {
      const encodedSlug = url.pathname.slice(`${source.sitePrefix}/post/`.length).replace(/^\/+|\/+$/g, '');
      if (!encodedSlug) {
        inventory.totals.invalid += 1;
        entries.push({ location, sourcePath: oldPath, status: 'missing-slug' });
        continue;
      }

      const sourcePath = `/post/${decodeURIComponent(encodedSlug)}`;
      if (protectedRoutes.has(sourcePath)) {
        inventory.totals.protected += 1;
        entries.push({ location, sourcePath, target: config.redirects[sourcePath], status: 'protected-explicit-target' });
        continue;
      }

      const target = `${wixOrigin}${source.sitePrefix}/post/${encodedSlug}`;
      if (!(sourcePath in config.redirects)) added += 1;
      else if (config.redirects[sourcePath] !== target) updated += 1;
      config.redirects[sourcePath] = target;
      inventory.totals.redirected += 1;
      entries.push({ location, sourcePath, target, status: 'exact-blog-redirect' });
      continue;
    }

    const explicitTarget = config.redirects[oldPath];
    if (explicitTarget) {
      inventory.totals.redirected += 1;
      entries.push({ location, sourcePath: oldPath, target: explicitTarget, status: 'explicit-content-equivalent-redirect' });
      continue;
    }

    const samePathTarget = suggestedLocalTarget(source, oldPath);
    if (localTargetExists(samePathTarget)) {
      inventory.totals.redirected += 1;
      entries.push({
        location,
        sourcePath: oldPath,
        language: source.language,
        suggestedTarget: samePathTarget,
        status: 'exact-local-path-found-review-before-redirect',
      });
      inventory.totals.review += 1;
      continue;
    }

    inventory.totals.review += 1;
    entries.push({
      location,
      sourcePath: oldPath,
      siteRole: source.role,
      language: source.language,
      status: 'manual-content-mapping-required',
    });
  }

  inventory.sources[source.id] = {
    sitemap: source.url,
    role: source.role,
    language: source.language,
    count: locations.length,
    entries,
  };
}

config.redirects = Object.fromEntries(
  Object.entries(config.redirects).sort(([a], [b]) => a.localeCompare(b, 'hu')),
);

fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
fs.writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);

console.log(
  `Wix sitemaps: ${sources.length}; discovered: ${inventory.totals.discovered}; ` +
  `redirected: ${inventory.totals.redirected}; review: ${inventory.totals.review}; ` +
  `protected: ${inventory.totals.protected}; added: ${added}; updated: ${updated}.`,
);
