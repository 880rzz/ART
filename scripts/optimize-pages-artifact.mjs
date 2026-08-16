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
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
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
  if (executable.includes('getBoundingClientRect')) throw new Error('Canonical responsive header runtime contains getBoundingClientRect().');
  if (executable.includes('settleCurrentFragment')) throw new Error('Canonical responsive header runtime contains repeated fragment settling.');
  if (!executable.includes("target.scrollIntoView({ block: 'start', behavior: 'auto' })")) throw new Error('Canonical responsive header runtime lost native fragment scrolling.');
  return `src-${createHash('sha256').update(source).digest('hex').slice(0, 16)}`;
}

async function exists(webPath) {
  try { await access(path.join(root, webPath.replace(/^\//, ''))); return true; }
  catch { return false; }
}

function setAttribute(tag, name, value) {
  const attrRe = new RegExp(`\\s+${name}=["'][^"']*["']`, 'i');
  if (attrRe.test(tag)) return tag.replace(attrRe, ` ${name}="${value}"`);
  return tag.replace(/\s*\/>$|>$/, (end) => ` ${name}="${value}"${end}`);
}

function trimHomepageImageGallerySchema(html, maxAssociatedMedia = 18) {
  let galleries = 0, removedMedia = 0, validGalleries = 0;
  const scriptRe = /<script\b([^>]*\btype=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi;
  html = html.replace(scriptRe, (full, attrs, jsonText) => {
    let data;
    try { data = JSON.parse(jsonText); } catch { return full; }
    let changed = false;
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { for (const item of node) visit(item); return; }
      const rawType = node['@type'];
      const types = Array.isArray(rawType) ? rawType : [rawType];
      if (types.includes('ImageGallery') && Array.isArray(node.associatedMedia) && node.associatedMedia.length > 0) {
        if (node.associatedMedia.length > maxAssociatedMedia) {
          removedMedia += node.associatedMedia.length - maxAssociatedMedia;
          node.associatedMedia = node.associatedMedia.slice(0, maxAssociatedMedia);
          galleries += 1; changed = true;
        }
        if (node.associatedMedia.length <= maxAssociatedMedia) validGalleries += 1;
      }
      for (const value of Object.values(node)) visit(value);
    };
    visit(data);
    if (!changed) return full;
    return `<script${attrs}>${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
  });
  return { html, galleries, removedMedia, validGalleries };
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
  const originalPath = '/assets/img/portrait-circle.png';
  const optimizedPath = '/assets/img/responsive/portrait-circle-480.webp';
  const optimized720 = '/assets/img/responsive/portrait-circle-720.webp';
  const originalEscaped = originalPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const optimizedEscaped = optimizedPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const originalRe = new RegExp(`<img\\b(?=[^>]*\\bsrc=["']${originalEscaped}["'])[^>]*>`, 'i');
  const optimizedRe = new RegExp(`<img\\b(?=[^>]*\\bsrc=["']${optimizedEscaped}["'])[^>]*>`, 'i');
  const originalMatch = html.match(originalRe);
  const optimizedMatch = html.match(optimizedRe);
  const candidates = [];
  for (const targetWidth of [480, 720]) {
    const variant = `/assets/img/responsive/portrait-circle-${targetWidth}.webp`;
    if (await exists(variant)) candidates.push(`${variant} ${targetWidth}w`);
  }
  if (candidates.length !== 2) return { html, valid: false, changed: false };
  if (originalMatch) {
    let tag = originalMatch[0];
    tag = tag.replace(new RegExp(`\\bsrc=["']${originalEscaped}["']`, 'i'), `src="${optimizedPath}"`);
    tag = setAttribute(tag, 'srcset', candidates.join(', '));
    tag = setAttribute(tag, 'sizes', '(max-width: 640px) 274px, 480px');
    tag = setAttribute(tag, 'width', '480');
    tag = setAttribute(tag, 'height', '480');
    html = html.replace(originalMatch[0], tag);
    return { html, valid: true, changed: true };
  }
  if (optimizedMatch) {
    const tag = optimizedMatch[0];
    const srcset = tag.match(/\bsrcset=["']([^"']+)["']/i)?.[1] || '';
    const sizes = tag.match(/\bsizes=["']([^"']+)["']/i)?.[1] || '';
    const width = tag.match(/\bwidth=["'](\d+)["']/i)?.[1];
    const height = tag.match(/\bheight=["'](\d+)["']/i)?.[1];
    const valid = srcset.includes(`${optimizedPath} 480w`) &&
      srcset.includes(`${optimized720} 720w`) &&
      sizes === '(max-width: 640px) 274px, 480px' &&
      width === '480' && height === '480';
    return { html, valid, changed: false };
  }
  return { html, valid: false, changed: false };
}

async function addResponsiveHomepageHero(html) {
  const sourcePath = '/assets/img/hero.webp';
  const imgRe = /<img\b(?=[^>]*\bsrc=["']\/assets\/img\/hero\.webp["'])[^>]*>/i;
  const match = html.match(imgRe);
  if (!match) return { html, valid: false };
  const candidates = [];
  for (const width of [640, 800, 960, 1280, 1600]) {
    const variant = `/assets/img/responsive/hero-${width}.webp`;
    if (await exists(variant)) candidates.push(`${variant} ${width}w`);
  }
  if (candidates.length < 2) return { html, valid: false };
  let tag = match[0];
  tag = setAttribute(tag, 'srcset', candidates.join(', '));
  tag = setAttribute(tag, 'sizes', '100vw');
  tag = setAttribute(tag, 'fetchpriority', 'high');
  tag = setAttribute(tag, 'loading', 'eager');
  tag = setAttribute(tag, 'decoding', 'async');
  html = html.replace(match[0], tag);
  const preload = `<link rel="preload" as="image" href="/assets/img/responsive/hero-640.webp" imagesrcset="${candidates.join(', ')}" imagesizes="100vw" fetchpriority="high">`;
  html = html.replace(/<link rel=["']preload["'] as=["']image["'] href=["']\/assets\/img\/hero\.webp["'][^>]*>/i, preload);
  return { html, valid: true };
}

async function deferHomepageGalleryBatches(html, rel) {
  const lang = rel.startsWith('hu/') ? 'hu' : rel.startsWith('de-at/') ? 'de-at' : 'en';
  const fragmentPath = `/assets/fragments/home-gallery-${lang}.html`;
  if (html.includes(`data-deferred-src="${fragmentPath}"`) && await exists(fragmentPath)) {
    const fragment = await readFile(path.join(root, fragmentPath.replace(/^\//, '')), 'utf8');
    const deferredImages = (fragment.match(/<img\b/gi) || []).length;
    if (deferredImages < 80) throw new Error(`${rel}: existing deferred gallery fragment contains only ${deferredImages} images.`);
    return { html, deferredImages, valid: true };
  }
  const galleryRe = /(<div id="galwrap"[^>]*>)(<div class="collage gal-batch" data-batch="0"[\s\S]*?<\/div>)([\s\S]*?)(<\/div>\s*<div class="gal-actions">\s*<button type="button" class="btn gal-more-btn" id="galmore")/;
  const match = html.match(galleryRe);
  if (!match) return { html, deferredImages: 0, valid: false };
  const hiddenBatches = match[3];
  if (!/\bgal-batch\b[\s\S]*?\bhidden\b/.test(hiddenBatches)) return { html, deferredImages: 0, valid: false };
  const deferredImages = (hiddenBatches.match(/<img\b/gi) || []).length;
  if (deferredImages < 80) throw new Error(`${rel}: homepage deferred gallery extraction found only ${deferredImages} images.`);
  await mkdir(path.join(root, 'assets/fragments'), { recursive: true });
  await writeFile(path.join(root, fragmentPath.replace(/^\//, '')), hiddenBatches, 'utf8');
  const openTag = match[1].includes('data-deferred-src=') ? match[1] : match[1].replace(/>$/, ` data-deferred-src="${fragmentPath}">`);
  html = html.replace(match[0], `${openTag}${match[2]}${match[4]}`);
  const legacyGalleryRuntime = `(function(){var b=document.getElementById('galmore');if(!b)return;var w=document.getElementById('galwrap');var total=+w.dataset.total||0;b.addEventListener('click',function(){var hidden=[].slice.call(w.querySelectorAll('.gal-batch[hidden]'));if(!hidden.length){b.style.display='none';return;}hidden.forEach(function(batch){batch.hidden=false;batch.querySelectorAll('img').forEach&&batch.querySelectorAll('img').forEach(function(i){i.loading='eager';});});b.dataset.shown=total;b.textContent=b.dataset.label+' ('+total+'/'+total+')';b.style.display='none';if(window.__lbCollect)window.__lbCollect();});})();`;
  const deferredGalleryRuntime = `(function(){var b=document.getElementById('galmore');if(!b)return;var w=document.getElementById('galwrap');var total=+w.dataset.total||0;var loading=false;function reveal(){var hidden=[].slice.call(w.querySelectorAll('.gal-batch[hidden]'));if(!hidden.length){b.style.display='none';return;}hidden.forEach(function(batch){batch.hidden=false;batch.querySelectorAll('img').forEach&&batch.querySelectorAll('img').forEach(function(i){i.loading='eager';});});b.dataset.shown=total;b.textContent=b.dataset.label+' ('+total+'/'+total+')';b.style.display='none';if(window.__lbCollect)window.__lbCollect();}b.addEventListener('click',function(){var hidden=[].slice.call(w.querySelectorAll('.gal-batch[hidden]'));if(hidden.length){reveal();return;}var src=w&&w.dataset.deferredSrc;if(!src||loading){b.style.display='none';return;}loading=true;b.disabled=true;fetch(src,{credentials:'same-origin'}).then(function(r){if(!r.ok)throw new Error('gallery');return r.text();}).then(function(fragment){w.insertAdjacentHTML('beforeend',fragment);reveal();}).catch(function(){loading=false;b.disabled=false;});});})();`;
  if (!html.includes(legacyGalleryRuntime)) throw new Error(`${rel}: homepage gallery runtime marker was not found.`);
  html = html.replace(legacyGalleryRuntime, deferredGalleryRuntime);
  return { html, deferredImages, valid: true };
}

const responsiveHeaderRuntimeVersion = await validateResponsiveHeaderRuntime();
let bundledPages = 0, homepages = 0, responsiveHomepageImages = 0, responsiveHomepagePortraits = 0;
let deferredHomepageGalleryImages = 0, deferredHomepageGalleryPages = 0, runtimeReferences = 0;
let trimmedHomepageSchemaGalleries = 0, trimmedHomepageSchemaMedia = 0;
const homepageHtmlBytes = [];

for (const file of htmlFiles) {
  let html = await readFile(file, 'utf8');
  const rel = path.relative(root, file).replaceAll('\\', '/');
  const isHomepage = rel === 'index.html' || rel === 'hu/index.html' || rel === 'de-at/index.html';
  const links = localStylesheetLinks(html);
  if (links.length >= 1) {
    const bundle = await bundleFor(links);
    let first = true;
    for (const link of links) {
      html = html.replace(link.tag, first ? `<link rel="stylesheet" href="${bundle}">` : '');
      first = false;
    }
    bundledPages += 1;
  }

  const beforeRuntime = html;
  html = html.replace(/(src=["']\/assets\/js\/responsive-header-system\.js)(?:\?[^"']*)?(["'])/g, `$1?v=${responsiveHeaderRuntimeVersion}$2`);
  if (html !== beforeRuntime) runtimeReferences += 1;

  if (isHomepage) {
    const bundleCount = (html.match(/<link rel="stylesheet" href="\/assets\/css\/bundles\/art-[a-f0-9]{16}\.css">/g) || []).length;
    if (bundleCount !== 1) throw new Error(`${rel}: production homepage must load exactly one blocking content-hashed CSS bundle; found ${bundleCount}.`);
    const homepageBundleTag = html.match(/<link rel="stylesheet" href="\/assets\/css\/bundles\/art-[a-f0-9]{16}\.css">/)?.[0];
    if (!homepageBundleTag) throw new Error(`${rel}: production homepage CSS bundle tag missing.`);
    html = html.replace(homepageBundleTag, '');
    html = html.replace(/(<meta name="viewport"[^>]*>)/i, `$1\n${homepageBundleTag}`);
    if (html.includes('data-critical-css="homepage"') || html.includes("onload=\"this.onload=null;this.rel='stylesheet'\"")) throw new Error(`${rel}: retired late homepage CSS swap returned.`);
    if (!html.includes('href="/assets/img/hero.webp"')) html = html.replace('</head>', '<link rel="preload" as="image" href="/assets/img/hero.webp" fetchpriority="high">\n</head>');
    const responsiveHero = await addResponsiveHomepageHero(html); html = responsiveHero.html;
    if (!responsiveHero.valid) throw new Error(`${rel}: responsive homepage hero contract failed.`);
    html = html.replace(/(src=["']\/assets\/img\/best-of\/best-of-01\.webp["'][^>]*?)loading=["']eager["']([^>]*?)fetchpriority=["']high["']/i, '$1loading="lazy"$2fetchpriority="low"');
    html = html.replace(/(src=["']\/assets\/img\/best-of\/best-of-01\.webp["'][^>]*?)fetchpriority=["']high["']([^>]*?)loading=["']eager["']/i, '$1fetchpriority="low"$2loading="lazy"');

    const responsive = await addResponsiveHomepageGallery(html); html = responsive.html; responsiveHomepageImages += responsive.responsiveImages;
    const portrait = await addResponsiveHomepagePortrait(html); html = portrait.html; if (portrait.valid) responsiveHomepagePortraits += 1;
    const schema = trimHomepageImageGallerySchema(html); html = schema.html; trimmedHomepageSchemaGalleries += schema.validGalleries; trimmedHomepageSchemaMedia += schema.removedMedia;
    const deferredGallery = await deferHomepageGalleryBatches(html, rel); html = deferredGallery.html;
    if (deferredGallery.valid) { deferredHomepageGalleryImages += deferredGallery.deferredImages; deferredHomepageGalleryPages += 1; }
    homepageHtmlBytes.push(`${rel}:${Buffer.byteLength(html, 'utf8')}`); homepages += 1;
  }
  await writeFile(file, html, 'utf8');
}

if (runtimeReferences < 80) throw new Error(`Production responsive-header runtime was linked by too few pages: ${runtimeReferences}.`);
if (responsiveHomepagePortraits !== 3) throw new Error(`Responsive homepage portrait contract is valid on ${responsiveHomepagePortraits} homepages; expected 3.`);
if (trimmedHomepageSchemaGalleries !== 3) throw new Error(`Homepage ImageGallery schema contract is valid on ${trimmedHomepageSchemaGalleries} pages; expected exactly 3.`);
if (deferredHomepageGalleryPages !== 3 || deferredHomepageGalleryImages < 300) throw new Error(`Homepage deferred gallery extraction covered ${deferredHomepageGalleryPages} pages and ${deferredHomepageGalleryImages} images; expected 3 pages and at least 300 images.`);

console.log(`Production artifact optimized: ${bundledPages} pages use content-hashed CSS bundles; ${homepages} homepages use one blocking content-hashed bundle from first paint and received LCP/gallery priority fixes; ${responsiveHomepageImages} homepage gallery image instances received responsive srcset/sizes; ${responsiveHomepagePortraits} homepage portraits received modern responsive sources; ${deferredHomepageGalleryImages} below-fold homepage gallery images moved into on-demand fragments; ${trimmedHomepageSchemaMedia} duplicate inline ImageGallery media records were removed across ${trimmedHomepageSchemaGalleries} homepages; optimized homepage HTML bytes ${homepageHtmlBytes.join(', ')}; ${runtimeReferences} pages use canonical forced-reflow-free responsive-header runtime ${responsiveHeaderRuntimeVersion}.`);
