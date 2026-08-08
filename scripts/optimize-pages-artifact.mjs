import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '_site');
const cssBundleDir = path.join(root, 'assets/css/bundles');
await mkdir(cssBundleDir, { recursive: true });

const htmlFiles = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
await walk(root);

const cssCache = new Map();
const bundleCache = new Map();
async function cssFor(webPath) {
  if (cssCache.has(webPath)) return cssCache.get(webPath);
  const diskPath = path.join(root, webPath.replace(/^\//, ''));
  const source = await readFile(diskPath, 'utf8');
  /* Production-only conservative minification: comments and empty lines are
     removed, but declaration whitespace is left intact so calc(), strings and
     custom properties cannot be changed by an over-aggressive minifier. */
  const compact = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\n/gm, '')
    .trim();
  cssCache.set(webPath, compact);
  return compact;
}

function localStylesheetLinks(html) {
  const links = [];
  const tagRe = /<link\b[^>]*>/gi;
  for (const match of html.matchAll(tagRe)) {
    const tag = match[0];
    if (!/\brel=["']stylesheet["']/i.test(tag)) continue;
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    const pathname = href.split('?')[0];
    if (!pathname.startsWith('/assets/css/') || !pathname.endsWith('.css')) continue;
    links.push({ tag, href, pathname });
  }
  return links;
}

async function bundleFor(links) {
  const key = links.map((link) => link.pathname).join('\n');
  if (bundleCache.has(key)) return bundleCache.get(key);
  const parts = [];
  for (const link of links) parts.push(await cssFor(link.pathname));

  /* Lighthouse reports the old gallery hover filter as a non-composited
     animation. Keep the visual zoom, drop animated filter work. */
  parts.push(`\n/* Production performance hardening */\n.collage img{transition:transform .7s var(--ease-standard)!important}\n.collage figure:hover img{filter:none!important}\n`);

  const css = `${parts.join('\n')}\n`;
  const hash = createHash('sha256').update(css).digest('hex').slice(0, 16);
  const filename = `art-${hash}.css`;
  await writeFile(path.join(cssBundleDir, filename), css, 'utf8');
  const webPath = `/assets/css/bundles/${filename}`;
  bundleCache.set(key, webPath);
  return webPath;
}

let bundledPages = 0;
let homepages = 0;
for (const file of htmlFiles) {
  let html = await readFile(file, 'utf8');
  const links = localStylesheetLinks(html);
  if (links.length > 1) {
    const bundle = await bundleFor(links);
    let first = true;
    for (const link of links) {
      html = html.replace(
        link.tag,
        first ? `<link rel="stylesheet" href="${bundle}">` : ''
      );
      first = false;
    }
    bundledPages += 1;
  }

  const rel = path.relative(root, file).replaceAll('\\', '/');
  const isHomepage = rel === 'index.html' || rel === 'hu/index.html' || rel === 'de-at/index.html';
  if (isHomepage) {
    /* The hero is CSS-background based, so preload makes the LCP request
       discoverable from the head instead of waiting for style/layout work. */
    if (!html.includes('href="/assets/img/hero.webp"')) {
      html = html.replace(
        '</head>',
        '<link rel="preload" as="image" href="/assets/img/hero.webp" fetchpriority="high">\n</head>'
      );
    }

    /* The gallery starts well below the hero. Its first plate was marked
       eager/high and competed with LCP on mobile; it belongs to the same
       lazy/low policy as the rest of the first batch. */
    html = html.replace(
      /(src=["']\/assets\/img\/best-of\/best-of-01\.webp["'][^>]*?)loading=["']eager["']([^>]*?)fetchpriority=["']high["']/i,
      '$1loading="lazy"$2fetchpriority="low"'
    );
    html = html.replace(
      /(src=["']\/assets\/img\/best-of\/best-of-01\.webp["'][^>]*?)fetchpriority=["']high["']([^>]*?)loading=["']eager["']/i,
      '$1fetchpriority="low"$2loading="lazy"'
    );
    homepages += 1;
  }

  await writeFile(file, html, 'utf8');
}

console.log(`Production artifact optimized: ${bundledPages} pages use content-hashed CSS bundles; ${homepages} homepages received LCP/gallery priority fixes.`);
