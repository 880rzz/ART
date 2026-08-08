import { access, readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
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

  const css = `${parts.join('\n')}\n`;
  const hash = createHash('sha256').update(css).digest('hex').slice(0, 16);
  const filename = `art-${hash}.css`;
  await writeFile(path.join(cssBundleDir, filename), css, 'utf8');
  const webPath = `/assets/css/bundles/${filename}`;
  bundleCache.set(key, webPath);
  return webPath;
}

async function validateResponsiveHeaderRuntime() {
  const runtimePath = path.join(root, 'assets/js/responsive-header-system.js');
  const source = await readFile(runtimePath, 'utf8');
  const executable = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1');

  if (executable.includes('getBoundingClientRect')) {
    throw new Error('Canonical responsive header runtime contains getBoundingClientRect().');
  }
  if (executable.includes('settleCurrentFragment')) {
    throw new Error('Canonical responsive header runtime contains repeated fragment settling.');
  }
  if (!executable.includes("target.scrollIntoView({ block: 'start', behavior: 'auto' })")) {
    throw new Error('Canonical responsive header runtime lost native fragment scrolling.');
  }

  const hash = createHash('sha256').update(source).digest('hex').slice(0, 16);
  return `src-${hash}`;
}

async function exists(webPath) {
  try {
    await access(path.join(root, webPath.replace(/^\//, '')));
    return true;
  } catch {
    return false;
  }
}

function setAttribute(tag, name, value) {
  const attrRe = new RegExp(`\\s+${name}=["'][^"']*["']`, 'i');
  if (attrRe.test(tag)) return tag.replace(attrRe, ` ${name}="${value}"`);
  return tag.replace(/\s*\/>$|>$/, (end) => ` ${name}="${value}"${end}`);
}

async function addResponsiveHomepageGallery(html) {
  let responsiveImages = 0;
  const gallerySizes = '(max-width: 640px) calc(100vw - 70px), (max-width: 1000px) calc(50vw - 48px), 33vw';

  for (let index = 1; index <= 15; index += 1) {
    const stem = `best-of-${String(index).padStart(2, '0')}`;
    const sourcePath = `/assets/img/best-of/${stem}.webp`;
    const escaped = sourcePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const imgRe = new RegExp(`<img\\b(?=[^>]*\\bsrc=["']${escaped}["'])[^>]*>`, 'i');
    const match = html.match(imgRe);
    if (!match) continue;

    let tag = match[0];
    const originalWidth = Number(tag.match(/\bwidth=["'](\d+)["']/i)?.[1] || 0);
    if (!originalWidth) continue;

    const candidates = [];
    // Keep the established 640px production-gate fallback first while still
    // exposing smaller low-DPR mobile choices to the browser via descriptors.
    for (const targetWidth of [640, 384, 480, 720, 960]) {
      const variant = `/assets/img/best-of/responsive/${stem}-${targetWidth}.webp`;
      if (await exists(variant)) candidates.push(`${variant} ${targetWidth}w`);
    }
    candidates.push(`${sourcePath} ${originalWidth}w`);
    if (candidates.length <= 1) continue;

    tag = setAttribute(tag, 'srcset', candidates.join(', '));
    tag = setAttribute(tag, 'sizes', gallerySizes);
    html = html.replace(match[0], tag);
    responsiveImages += 1;
  }
  return { html, responsiveImages };
}

async function addResponsiveHomepagePortrait(html) {
  const sourcePath = '/assets/img/portrait-circle.png';
  const escaped = sourcePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const imgRe = new RegExp(`<img\\b(?=[^>]*\\bsrc=["']${escaped}["'])[^>]*>`, 'i');
  const match = html.match(imgRe);
  if (!match) return { html, changed: false };

  const candidates = [];
  for (const targetWidth of [480, 720]) {
    const variant = `/assets/img/responsive/portrait-circle-${targetWidth}.webp`;
    if (await exists(variant)) candidates.push(`${variant} ${targetWidth}w`);
  }
  if (!candidates.length) return { html, changed: false };

  let tag = match[0];
  tag = tag.replace(new RegExp(`\\bsrc=["']${escaped}["']`, 'i'), 'src="/assets/img/responsive/portrait-circle-480.webp"');
  tag = setAttribute(tag, 'srcset', candidates.join(', '));
  tag = setAttribute(tag, 'sizes', '(max-width: 640px) 274px, 480px');
  tag = setAttribute(tag, 'width', '480');
  tag = setAttribute(tag, 'height', '480');
  html = html.replace(match[0], tag);
  return { html, changed: true };
}

const responsiveHeaderRuntimeVersion = await validateResponsiveHeaderRuntime();

let bundledPages = 0;
let homepages = 0;
let responsiveHomepageImages = 0;
let responsiveHomepagePortraits = 0;
let runtimeReferences = 0;
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

  const beforeRuntime = html;
  html = html.replace(
    /(src=["']\/assets\/js\/responsive-header-system\.js)(?:\?[^"']*)?(["'])/g,
    `$1?v=${responsiveHeaderRuntimeVersion}$2`
  );
  if (html !== beforeRuntime) runtimeReferences += 1;

  const rel = path.relative(root, file).replaceAll('\\', '/');
  const isHomepage = rel === 'index.html' || rel === 'hu/index.html' || rel === 'de-at/index.html';
  if (isHomepage) {
    if (!html.includes('href="/assets/img/hero.webp"')) {
      html = html.replace(
        '</head>',
        '<link rel="preload" as="image" href="/assets/img/hero.webp" fetchpriority="high">\n</head>'
      );
    }

    html = html.replace(
      /(src=["']\/assets\/img\/best-of\/best-of-01\.webp["'][^>]*?)loading=["']eager["']([^>]*?)fetchpriority=["']high["']/i,
      '$1loading="lazy"$2fetchpriority="low"'
    );
    html = html.replace(
      /(src=["']\/assets\/img\/best-of\/best-of-01\.webp["'][^>]*?)fetchpriority=["']high["']([^>]*?)loading=["']eager["']/i,
      '$1fetchpriority="low"$2loading="lazy"'
    );

    const responsive = await addResponsiveHomepageGallery(html);
    html = responsive.html;
    responsiveHomepageImages += responsive.responsiveImages;

    const portrait = await addResponsiveHomepagePortrait(html);
    html = portrait.html;
    if (portrait.changed) responsiveHomepagePortraits += 1;

    homepages += 1;
  }

  await writeFile(file, html, 'utf8');
}

if (runtimeReferences < 80) {
  throw new Error(`Production responsive-header runtime was linked by too few pages: ${runtimeReferences}.`);
}
if (responsiveHomepagePortraits !== 3) {
  throw new Error(`Responsive homepage portrait was applied to ${responsiveHomepagePortraits} homepages; expected 3.`);
}

console.log(
  `Production artifact optimized: ${bundledPages} pages use content-hashed CSS bundles; ` +
  `${homepages} homepages received LCP/gallery priority fixes; ` +
  `${responsiveHomepageImages} homepage gallery image instances received responsive srcset/sizes; ` +
  `${responsiveHomepagePortraits} homepage portraits received modern responsive sources; ` +
  `${runtimeReferences} pages use canonical forced-reflow-free responsive-header runtime ${responsiveHeaderRuntimeVersion}.`
);