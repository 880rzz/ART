#!/usr/bin/env node
/**
 * Read-only, post-deployment 5 x 3 ART book exact-live gate.
 * Do not infer successful publication from merged Git or a completed build.
 * Usage: node tools/audit-art-five-books-live.mjs <expected-main-sha>
 */
import assert from 'node:assert/strict';

const root = 'https://www.banhalmi.art';
const sha = process.argv[2];
assert.match(sha || '', /^[0-9a-f]{40}$/, 'Exact expected production SHA is required');

const books = ['ebredes', 'szosszenetek', 'anovilaga', 'meses-konyv', 'menopauza-szexi'];
const locales = ['', 'hu/', 'de-at/'];
const languages = ['en', 'hu-HU', 'de-AT'];
const imgCache = new Set();

async function download(path, binary = false) {
  const url = new URL(path, root);
  url.searchParams.set('deploy', sha);
  let error;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'BANHALMI-ART-Exact-Live-Books/1.0', 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(30000),
      });
      assert.equal(response.status, 200, 'Non-200 live response for ' + url);
      return binary ? Buffer.from(await response.arrayBuffer()) : await response.text();
    } catch (e) {
      error = e;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 2500 * (attempt + 1)));
    }
  }
  throw error;
}

function schemaNodes(html) {
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length, 'Missing JSON-LD script');
  return scripts.flatMap(m => {
    const data = JSON.parse(m[1]);
    return Array.isArray(data['@graph']) ? data['@graph'] : [data];
  });
}

function canonicalAndAlternates(html, routeByLocale, route) {
  assert.ok(html.includes('rel="canonical" href="' + root + route + '"'), 'Canonical: ' + route);
  for (let i = 0; i < 3; i += 1) {
    assert.ok(html.includes('hreflang="' + languages[i] + '" href="' + root + routeByLocale[i] + '"'), 'Hreflang ' + languages[i] + ': ' + route);
  }
  assert.ok(html.includes('hreflang="x-default" href="' + root + routeByLocale[0] + '"'), 'x-default: ' + route);
}

const liveSha = (await download('/deployment-sha.txt')).trim();
assert.equal(liveSha, sha, 'Custom domain serves a different Pages SHA');

const requiredSitemapUrls = [];
for (const slug of books) {
  const filename = 'book-' + slug + '.html';
  const paths = locales.map(prefix => '/' + prefix + 'books/' + filename);
  for (let i = 0; i < 3; i += 1) {
    const route = paths[i];
    const html = await download(route);
    requiredSitemapUrls.push(root + route);
    canonicalAndAlternates(html, paths, route);
    assert.ok(/<h1(?:\s[^>]*)?>[^<]+<\/h1>/.test(html), 'Visible book heading: ' + route);
    assert.ok(html.includes('data-book-editorial-dossier='), 'Research dossier: ' + route);
    const graph = schemaNodes(html);
    const book = graph.find(node => node['@type'] === 'Book');
    assert.ok(book && typeof book.name === 'string' && book.name.length > 0, 'Book schema: ' + route);
    assert.equal(book.url, root + route, 'Book schema URL: ' + route);
    assert.ok(graph.some(node => node['@type'] === 'ImageObject'), 'ImageObject schema: ' + route);
    const og = html.match(/property="og:image" content="([^"]+)"/)?.[1];
    assert.ok(og && og.startsWith(root + '/assets/img/books/book-' + slug + '/'), 'Book image OG provenance: ' + route);
    const bodyImage = html.match(/<main[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>/)?.[1];
    assert.ok(bodyImage && bodyImage.startsWith('/assets/img/books/book-' + slug + '/'), 'Visible book cover: ' + route);
    assert.equal(og, root + bodyImage, 'OG image and visible book cover differ: ' + route);
    if (!imgCache.has(bodyImage)) {
      const img = await download(bodyImage, true);
      assert.ok(img.length > 2000, 'Cover payload too small: ' + bodyImage);
      assert.equal(img.subarray(0, 4).toString('ascii'), 'RIFF', 'Cover RIFF: ' + bodyImage);
      assert.equal(img.subarray(8, 12).toString('ascii'), 'WEBP', 'Cover WebP: ' + bodyImage);
      imgCache.add(bodyImage);
    }
    if (slug === 'menopauza-szexi') {
      assert.ok(html.includes('data-book-creative-start="2022"'), 'Approximate creative start missing: ' + route);
      assert.ok(html.includes('data-creative-start-approximate="true"'), 'Creative start must be approximate: ' + route);
      assert.ok(html.includes('record-period__no">IV'), 'Not Period IV: ' + route);
      assert.equal(book.author?.name, 'Papaya Therapy', 'Author attribution: ' + route);
      assert.equal(book.datePublished, '2026-11-13', '2026 publication: ' + route);
      assert.ok(book.contributor?.some(x => x.name === 'Nagy Réka Hanna'), 'Distinct Nagy Réka Hanna credit: ' + route);
      assert.ok(book.contributor?.some(x => x['@id'] === 'https://www.banhalmiphotography.com/about/'), 'Distinct Bánhalmi photo credit: ' + route);
    }
    console.log('PASS book ' + route);
  }
}

for (let i = 0; i < 3; i += 1) {
  const prefix = locales[i];
  const html = await download('/' + prefix);
  const paths = locales.map(x => '/' + x);
  canonicalAndAlternates(html, paths, '/' + prefix);
  const section = html.split('id="books"')[1]?.split('</section>')[0];
  assert.ok(section, 'Books section absent: /' + prefix);
  assert.equal((section.match(/<div class="card">/g) || []).length, 5, 'Not five homepage cards: /' + prefix);
  for (const slug of books) assert.ok(section.includes('href="books/book-' + slug + '.html"'), 'Missing homepage card ' + slug + ': /' + prefix);
  console.log('PASS homepage five cards /' + prefix);
}

const exhibitPaths = locales.map(prefix => '/' + prefix + 'exhibitions/ebredes.html');
for (const route of exhibitPaths) {
  const html = await download(route);
  canonicalAndAlternates(html, exhibitPaths, route);
  assert.ok(html.includes('book-menopauza-szexi.html'), 'Ébredés to book cross-link missing: ' + route);
  requiredSitemapUrls.push(root + route);
  console.log('PASS exhibition ' + route);
}

const legacy = await download('/muveszi-aktfotozas/');
const target = root + '/hu/exhibitions/ebredes.html';
assert.ok(legacy.includes('rel="canonical" href="' + target + '"'), 'Legacy artistic-nude canonical');
assert.ok(legacy.includes('url=' + target), 'Legacy artistic-nude redirect');
const sitemap = await download('/sitemap.xml');
assert.ok(sitemap.startsWith('<?xml'), 'Live sitemap is not XML');
for (const loc of requiredSitemapUrls) assert.ok(sitemap.includes('<loc>' + loc + '</loc>'), 'Missing live sitemap URL ' + loc);
console.log('PASS exact-live: SHA ' + sha + ', 15 books, ' + imgCache.size + ' WebP covers, 15 cards, 3 exhibitions, legacy routing, and 18 sitemap URLs');
