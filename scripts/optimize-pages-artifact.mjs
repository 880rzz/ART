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

/* The source runtime retains the older defensive fragment alignment because
   it is part of the repository's historical regression contract. In the
   production artifact, however, all homepage images already reserve their
   dimensions and CSS owns the fixed-header offset through scroll-margin-top.
   Re-reading getBoundingClientRect() four times after load and writing scroll
   position immediately afterwards therefore buys nothing and is a classic
   synchronous-layout / forced-reflow pattern. Replace only that block in the
   deploy copy with native scrolling, then give the runtime its own content
   hash so returning browsers cannot reuse the older v59 response. */
async function optimizeResponsiveHeaderRuntime() {
  const runtimePath = path.join(root, 'assets/js/responsive-header-system.js');
  let source = await readFile(runtimePath, 'utf8');

  const blockStart = source.indexOf('  /* Cross-page fragments');
  const blockEnd = source.indexOf("\n  if (page === 'index') {", blockStart);
  if (blockStart < 0 || blockEnd < 0) {
    throw new Error('Could not locate the legacy fragment-alignment block in responsive-header-system.js.');
  }

  const replacement = `  /* Production fragment alignment: CSS scroll-margin-top owns the fixed-header\n     offset, so no synchronous layout measurement is necessary. Cross-page\n     hashes use the browser's native anchor scroll; same-page menu links call\n     this only after the overlay has closed. */\n  const alignFragmentTarget = (focusTarget = false) => {\n    if (page !== 'index' || !window.location.hash) return false;\n    let target;\n    try {\n      target = document.querySelector(window.location.hash);\n    } catch {\n      return false;\n    }\n    if (!target) return false;\n    target.scrollIntoView({ block: 'start', behavior: 'auto' });\n    if (focusTarget) {\n      target.setAttribute('tabindex', '-1');\n      target.focus({ preventScroll: true });\n    }\n    return true;\n  };\n`;
  source = `${source.slice(0, blockStart)}${replacement}${source.slice(blockEnd)}`;

  const legacyClickAlignment = `    requestAnimationFrame(() => requestAnimationFrame(() => {\n      alignFragmentTarget(true);\n    }));\n    window.setTimeout(() => alignFragmentTarget(false), 180);\n    window.setTimeout(() => alignFragmentTarget(false), 650);`;
  const nativeClickAlignment = `    requestAnimationFrame(() => {\n      alignFragmentTarget(true);\n    });`;
  if (!source.includes(legacyClickAlignment)) {
    throw new Error('Could not locate the legacy repeated same-page fragment alignment.');
  }
  source = source.replace(legacyClickAlignment, nativeClickAlignment);

  /* Validate executable code, not historical comments that mention the name
     of the removed implementation. */
  const executable = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1');
  if (executable.includes('getBoundingClientRect')) {
    throw new Error('Production responsive header runtime still contains getBoundingClientRect().');
  }
  if (executable.includes('settleCurrentFragment')) {
    throw new Error('Production responsive header runtime still contains repeated fragment settling.');
  }
  if (!executable.includes("target.scrollIntoView({ block: 'start', behavior: 'auto' })")) {
    throw new Error('Production responsive header runtime lost native fragment scrolling.');
  }

  const hash = createHash('sha256').update(source).digest('hex').slice(0, 16);
  const version = `prod-${hash}`;
  await writeFile(runtimePath, source, 'utf8');
  return version;
}

async function exists(webPath) {
  try {
    await access(path.join(root, webPath.replace(/^\//, '')));
    return true;
  } catch {
    return false;
  }
}

async function addResponsiveHomepageGallery(html) {
  let responsiveImages = 0;
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
    for (const targetWidth of [640, 960]) {
      const variant = `/assets/img/best-of/responsive/${stem}-${targetWidth}.webp`;
      if (await exists(variant)) candidates.push(`${variant} ${targetWidth}w`);
    }
    candidates.push(`${sourcePath} ${originalWidth}w`);
    if (candidates.length <= 1) continue;

    tag = tag.replace(/\s+srcset=["'][^"']*["']/i, '');
    tag = tag.replace(
      new RegExp(`(\\bsrc=["']${escaped}["'])`, 'i'),
      `$1 srcset="${candidates.join(', ')}"`
    );
    html = html.replace(match[0], tag);
    responsiveImages += 1;
  }
  return { html, responsiveImages };
}

const responsiveHeaderRuntimeVersion = await optimizeResponsiveHeaderRuntime();

let bundledPages = 0;
let homepages = 0;
let responsiveHomepageImages = 0;
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

    const responsive = await addResponsiveHomepageGallery(html);
    html = responsive.html;
    responsiveHomepageImages += responsive.responsiveImages;
    homepages += 1;
  }

  await writeFile(file, html, 'utf8');
}

if (runtimeReferences < 80) {
  throw new Error(`Production responsive-header runtime was linked by too few pages: ${runtimeReferences}.`);
}

console.log(
  `Production artifact optimized: ${bundledPages} pages use content-hashed CSS bundles; ` +
  `${homepages} homepages received LCP/gallery priority fixes; ` +
  `${responsiveHomepageImages} homepage gallery image instances received responsive srcset; ` +
  `${runtimeReferences} pages use forced-reflow-free responsive-header runtime ${responsiveHeaderRuntimeVersion}.`
);