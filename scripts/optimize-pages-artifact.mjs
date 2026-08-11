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
  /* Production-only conservative minification: comments, empty lines and
     separator whitespace are removed, while ordinary value whitespace remains
     intact so calc(), strings and custom properties are not reinterpreted. */
  const compact = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
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

const criticalHomepageCss = [
  ':root{--c-ground:#202530;--c-ink:#F5F7FA;--c-ink-soft:#B8C7D9;--gold:#DCC56B;--line:rgba(255,255,255,.12);--c-radius-pill:999px;--wrap:min(1180px,calc(100% - 2.5rem))}',
  '*{box-sizing:border-box}',
  'html{background:var(--c-ground);color:var(--c-ink);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased}',
  'body{margin:0;background:var(--c-ground);color:var(--c-ink)}',
  'a{color:inherit}img{max-width:100%;display:block}',
  '.skip-link{position:fixed;left:1rem;top:1rem;z-index:1000;padding:.75rem 1rem;border-radius:.5rem;background:#f0c674;color:#29303F;font-weight:700;transform:translateY(-180%)}.skip-link:focus{transform:translateY(0)}',
  'body.apple-archive>nav{position:fixed;inset:0 0 auto 0;height:62px;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(1rem,4vw,5rem);background:rgba(8,10,14,.86);border-bottom:1px solid var(--line);backdrop-filter:saturate(160%) blur(18px)}',
  'body.apple-archive>nav .brand{display:flex;align-items:center;gap:.85rem;text-decoration:none;color:#fff;font-size:.82rem;font-weight:700;letter-spacing:.32em}',
  'body.apple-archive>nav .brand svg{width:44px;height:44px;color:var(--gold)}.u-inline-flex-row{display:flex;align-items:center;gap:.75rem}',
  '.langs{display:flex;align-items:center;gap:1.3rem}.langs a{font-size:.74rem;font-weight:700;letter-spacing:.18em;color:rgba(255,255,255,.68);text-decoration:none}.langs a.on{color:var(--gold);border-bottom:2px solid var(--gold);padding-bottom:.72rem}',
  '.burger{width:44px;height:44px;border:0;background:transparent;display:grid;place-content:center;gap:5px}.burger span{display:block;width:28px;height:2px;background:#fff;border-radius:2px}',
  'body:not(.menu-open) #menu{display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important}',
  '#main-content{display:block}',
  'header.hero{position:relative;isolation:isolate;background:var(--c-ground);color:var(--c-ink);min-height:min(92svh,860px);display:flex;align-items:center;overflow:hidden;padding-top:62px}',
  'header.hero .bg{position:absolute;inset:-12% 0 -12% 0;z-index:-2;width:100%;height:124%;object-fit:cover;object-position:right center;background-position:right center;background-size:cover;background-repeat:no-repeat}',
  'header.hero .hero-bg-img{width:100%;height:124%;object-fit:cover;object-position:right center}',
  'header.hero .veil{position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(32,37,48,.92) 0%,rgba(32,37,48,.80) 34%,rgba(32,37,48,.30) 62%,rgba(32,37,48,0) 100%)}',
  'header.hero .wrap{position:relative;z-index:1;width:var(--wrap);margin-inline:auto;text-align:left}',
  'header.hero .hero-inner{max-width:44ch}.hero-logo{width:64px;height:64px;color:var(--gold);fill:currentColor;margin:0 0 1.2rem;opacity:.95}',
  'header.hero .label{margin:0 0 .7rem;color:var(--gold);font-size:.72rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase}',
  'header.hero h1{margin:0;font-size:clamp(2.4rem,7vw,5.4rem);letter-spacing:.14em;font-weight:600;line-height:1;color:#fff}',
  '.hero-sub{margin:1rem 0 0;color:#c9d6e4;letter-spacing:-.014em;font-size:clamp(1.0625rem,1.7vw,1.375rem);line-height:1.4;font-weight:400;max-width:30ch}',
  '.hero-line{width:56px;height:1px;background:var(--gold);margin:1.3rem 0}.hero-cta{display:flex;flex-wrap:wrap;gap:.7rem;justify-content:flex-start}.hero-cta .btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;border:1px solid rgba(255,255,255,.4);border-radius:var(--c-radius-pill);padding:.72rem 1.25rem;color:#fff;text-decoration:none;font-size:.9rem}',
  'main section{scroll-margin-top:5.5rem}main>section{position:relative;padding-block:clamp(4rem,8vw,7rem)}main section>.wrap,body.apple-archive .wrap{width:min(1180px,calc(100% - 2.5rem));margin-inline:auto}.intro{max-width:58ch;margin:0 0 clamp(2.8rem,5vw,4.4rem)}.intro .lead{max-width:58ch;line-height:1.65;color:var(--c-ink-soft)}',
  '.collage{columns:3;column-gap:clamp(14px,1.4vw,18px)}.collage .gal-batch{columns:3;column-gap:clamp(14px,1.4vw,18px)}.collage figure,[data-gallery] figure{break-inside:avoid;display:block;width:100%;margin:0 0 clamp(14px,1.4vw,18px);min-width:0;overflow:hidden;border-radius:0}.collage img,[data-gallery] img{width:100%;height:auto;display:block}',
  '#consent{position:fixed;z-index:80;left:1rem;right:1rem;bottom:1rem;max-width:46rem;margin:auto;padding:1rem;border:1px solid var(--line);border-radius:1rem;background:rgba(32,37,48,.96);color:#fff;box-shadow:0 24px 80px rgba(0,0,0,.32)}#consent[hidden]{display:none!important}#consent p{margin:.2rem 0 .8rem;color:var(--c-ink-soft);line-height:1.45}#consent button{min-height:44px;border-radius:var(--c-radius-pill);border:1px solid var(--gold);background:transparent;color:var(--gold);padding:.65rem 1rem}',
  '@media(max-width:1000px){.collage,.collage .gal-batch{columns:2}}',
  '@media(max-width:900px){body.apple-archive>nav{height:62px;padding-inline:1rem}.langs{gap:1rem}header.hero{min-height:88svh}header.hero .veil{background:linear-gradient(180deg,rgba(32,37,48,.55) 0%,rgba(32,37,48,.86) 46%,rgba(32,37,48,.96) 100%)}header.hero .wrap{width:min(100% - 2rem,1180px)}header.hero .hero-inner{max-width:none}.hero-sub{max-width:38ch}header.hero .hero-bg-img{z-index:0!important;inset:0!important;height:100%!important;transform:none!important;will-change:auto!important}header.hero .veil{z-index:1!important}header.hero .wrap{z-index:2!important}header.hero .hero-hover-video{display:none!important}}',
  '@media(max-width:640px){main section>.wrap,body.apple-archive .wrap{width:min(100% - 1.5rem,1180px)}main>section{padding-block:clamp(3.6rem,13vw,4.75rem)}.intro{margin-bottom:2.6rem}.collage,.collage .gal-batch{columns:1}.hero-cta{display:grid;grid-template-columns:1fr 1fr;width:100%;max-width:360px}.hero-cta .btn{width:100%}}'
].join('');

function asyncStylesheetMarkup(bundle) {
  return `<style data-critical-css="homepage">${criticalHomepageCss}</style>\n<link rel="preload" href="${bundle}" as="style" onload="this.onload=null;this.rel='stylesheet'">\n<noscript><link rel="stylesheet" href="${bundle}"></noscript>`;
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

/* The homepage carries a full 131-image visual gallery in the DOM and also
   repeated all 131 ImageObject records inside inline ImageGallery JSON-LD.
   Search engines only need a representative associatedMedia sample here: the
   canonical numberOfItems remains untouched and the complete machine-readable
   image graph still lives in /data/image-knowledge-graph.jsonld. Trimming only
   the duplicate inline array cuts HTML transfer/parse work without changing a
   single visible image, URL, alt text or archive fact. */
function trimHomepageImageGallerySchema(html, maxAssociatedMedia = 18) {
  let galleries = 0;
  let removedMedia = 0;
  const scriptRe = /<script\b([^>]*\btype=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi;

  html = html.replace(scriptRe, (full, attrs, jsonText) => {
    let data;
    try {
      data = JSON.parse(jsonText);
    } catch {
      return full;
    }

    let changed = false;
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        for (const item of node) visit(item);
        return;
      }

      const rawType = node['@type'];
      const types = Array.isArray(rawType) ? rawType : [rawType];
      if (
        types.includes('ImageGallery') &&
        Array.isArray(node.associatedMedia) &&
        node.associatedMedia.length > maxAssociatedMedia
      ) {
        removedMedia += node.associatedMedia.length - maxAssociatedMedia;
        node.associatedMedia = node.associatedMedia.slice(0, maxAssociatedMedia);
        galleries += 1;
        changed = true;
      }

      for (const value of Object.values(node)) visit(value);
    };

    visit(data);
    if (!changed) return full;
    const safeJson = JSON.stringify(data).replace(/</g, '\\u003c');
    return `<script${attrs}>${safeJson}</script>`;
  });

  return { html, galleries, removedMedia };
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
    // Keep width descriptors in natural ascending order so browsers can
    // reliably select the smallest suitable low-DPR mobile derivative.
    for (const targetWidth of [384, 480, 640, 720, 960]) {
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

async function deferHomepageGalleryBatches(html, rel) {
  const lang = rel.startsWith('hu/') ? 'hu' : rel.startsWith('de-at/') ? 'de-at' : 'en';
  const fragmentPath = `/assets/fragments/home-gallery-${lang}.html`;
  const galleryRe = /(<div id="galwrap"[^>]*>)(<div class="collage gal-batch" data-batch="0"[\s\S]*?<\/div>)([\s\S]*?)(<\/div>\s*<div class="gal-actions">\s*<button type="button" class="btn gal-more-btn" id="galmore")/;
  const match = html.match(galleryRe);
  if (!match) return { html, deferredImages: 0 };

  const hiddenBatches = match[3];
  if (!/\bgal-batch\b[\s\S]*?\bhidden\b/.test(hiddenBatches)) return { html, deferredImages: 0 };

  const deferredImages = (hiddenBatches.match(/<img\b/gi) || []).length;
  if (deferredImages < 80) {
    throw new Error(`${rel}: homepage deferred gallery extraction found only ${deferredImages} images.`);
  }

  await mkdir(path.join(root, 'assets/fragments'), { recursive: true });
  await writeFile(path.join(root, fragmentPath.replace(/^\//, '')), hiddenBatches, 'utf8');

  const openTag = match[1].includes('data-deferred-src=')
    ? match[1]
    : match[1].replace(/>$/, ` data-deferred-src="${fragmentPath}">`);
  html = html.replace(match[0], `${openTag}${match[2]}${match[4]}`);

  const legacyGalleryRuntime = `(function(){var b=document.getElementById('galmore');if(!b)return;var w=document.getElementById('galwrap');var total=+w.dataset.total||0;b.addEventListener('click',function(){var hidden=[].slice.call(w.querySelectorAll('.gal-batch[hidden]'));if(!hidden.length){b.style.display='none';return;}hidden.forEach(function(batch){batch.hidden=false;batch.querySelectorAll('img').forEach&&batch.querySelectorAll('img').forEach(function(i){i.loading='eager';});});b.dataset.shown=total;b.textContent=b.dataset.label+' ('+total+'/'+total+')';b.style.display='none';if(window.__lbCollect)window.__lbCollect();});})();`;
  const deferredGalleryRuntime = `(function(){var b=document.getElementById('galmore');if(!b)return;var w=document.getElementById('galwrap');var total=+w.dataset.total||0;var loading=false;function reveal(){var hidden=[].slice.call(w.querySelectorAll('.gal-batch[hidden]'));if(!hidden.length){b.style.display='none';return;}hidden.forEach(function(batch){batch.hidden=false;batch.querySelectorAll('img').forEach&&batch.querySelectorAll('img').forEach(function(i){i.loading='eager';});});b.dataset.shown=total;b.textContent=b.dataset.label+' ('+total+'/'+total+')';b.style.display='none';if(window.__lbCollect)window.__lbCollect();}b.addEventListener('click',function(){var hidden=[].slice.call(w.querySelectorAll('.gal-batch[hidden]'));if(hidden.length){reveal();return;}var src=w&&w.dataset.deferredSrc;if(!src||loading){b.style.display='none';return;}loading=true;b.disabled=true;fetch(src,{credentials:'same-origin'}).then(function(r){if(!r.ok)throw new Error('gallery');return r.text();}).then(function(fragment){w.insertAdjacentHTML('beforeend',fragment);reveal();}).catch(function(){loading=false;b.disabled=false;});});})();`;
  if (!html.includes(legacyGalleryRuntime)) {
    throw new Error(`${rel}: homepage gallery runtime marker was not found.`);
  }
  html = html.replace(legacyGalleryRuntime, deferredGalleryRuntime);

  return { html, deferredImages };
}

const responsiveHeaderRuntimeVersion = await validateResponsiveHeaderRuntime();

let bundledPages = 0;
let homepages = 0;
let responsiveHomepageImages = 0;
let responsiveHomepagePortraits = 0;
let deferredHomepageGalleryImages = 0;
let deferredHomepageGalleryPages = 0;
let runtimeReferences = 0;
let trimmedHomepageSchemaGalleries = 0;
let trimmedHomepageSchemaMedia = 0;
const homepageHtmlBytes = [];
for (const file of htmlFiles) {
  let html = await readFile(file, 'utf8');
  const rel = path.relative(root, file).replaceAll('\\', '/');
  const isHomepage = rel === 'index.html' || rel === 'hu/index.html' || rel === 'de-at/index.html';
  const links = localStylesheetLinks(html);
  if (links.length > 1) {
    const bundle = await bundleFor(links);
    let first = true;
    for (const link of links) {
      html = html.replace(
        link.tag,
        first ? (isHomepage ? asyncStylesheetMarkup(bundle) : `<link rel="stylesheet" href="${bundle}">`) : ''
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

  if (isHomepage) {
    if (!html.includes('data-critical-css="homepage"') || !html.includes("onload=\"this.onload=null;this.rel='stylesheet'\"")) {
      throw new Error(`${rel}: production homepage critical CSS/deferred bundle contract missing.`);
    }
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

    const schema = trimHomepageImageGallerySchema(html);
    html = schema.html;
    trimmedHomepageSchemaGalleries += schema.galleries;
    trimmedHomepageSchemaMedia += schema.removedMedia;

    const deferredGallery = await deferHomepageGalleryBatches(html, rel);
    html = deferredGallery.html;
    if (deferredGallery.deferredImages) {
      deferredHomepageGalleryImages += deferredGallery.deferredImages;
      deferredHomepageGalleryPages += 1;
    }

    homepageHtmlBytes.push(`${rel}:${Buffer.byteLength(html, 'utf8')}`);
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
if (trimmedHomepageSchemaGalleries !== 3) {
  throw new Error(`Homepage ImageGallery schema was trimmed on ${trimmedHomepageSchemaGalleries} pages; expected exactly 3.`);
}
if (deferredHomepageGalleryPages !== 3 || deferredHomepageGalleryImages < 300) {
  throw new Error(`Homepage deferred gallery extraction covered ${deferredHomepageGalleryPages} pages and ${deferredHomepageGalleryImages} images; expected 3 pages and at least 300 images.`);
}

console.log(
  `Production artifact optimized: ${bundledPages} pages use content-hashed CSS bundles; ` +
  `${homepages} homepages received LCP/gallery priority fixes; ` +
  `${responsiveHomepageImages} homepage gallery image instances received responsive srcset/sizes; ` +
  `${responsiveHomepagePortraits} homepage portraits received modern responsive sources; ` +
  `${deferredHomepageGalleryImages} below-fold homepage gallery images moved into on-demand fragments; ` +
  `${trimmedHomepageSchemaMedia} duplicate inline ImageGallery media records were removed across ${trimmedHomepageSchemaGalleries} homepages; ` +
  `optimized homepage HTML bytes ${homepageHtmlBytes.join(', ')}; ` +
  `${runtimeReferences} pages use canonical forced-reflow-free responsive-header runtime ${responsiveHeaderRuntimeVersion}.`
);
