import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

// Every image in this discovery sitemap must already have independently
// documented first-party rights metadata on its canonical landing page.
// Never infer ownership or license the unresolved hero.webp/portrait-circle.png.
const origin = 'https://www.banhalmi.art';
const sitemap = fs.readFileSync('image-sitemap.xml', 'utf8');
const canonical = fs.readFileSync('sitemap.xml', 'utf8');
const robots = fs.readFileSync('robots.txt', 'utf8');
const pages = [
  ['exhibitions/ebredes.html', 18],
  ['hu/exhibitions/ebredes.html', 18],
  ['de-at/exhibitions/ebredes.html', 18],
  ['', 19],
  ['hu/', 132],
  ['de-at/', 19],
];
assert.ok(sitemap.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'));
assert.equal((sitemap.match(/<url>/g) || []).length, pages.length);
assert.equal((canonical.match(/<url>/g) || []).length, 93, 'preserve all 93 canonical URLs');
assert.ok(robots.includes('Sitemap: ' + origin + '/image-sitemap.xml'));
assert.ok(!/\/assets\/img\/(?:hero\.webp|portrait-circle\.png)/.test(sitemap), 'unverified provenance asset included');

function imageObjects(document) {
  const images = [];
  const visit = node => {
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (!node || typeof node !== 'object') return;
    if (node['@type'] === 'ImageObject' ||
        (Array.isArray(node['@type']) && node['@type'].includes('ImageObject'))) images.push(node);
    Object.values(node).forEach(visit);
  };
  const scripts = [...document.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length, 'missing JSON-LD schema');
  for (const script of scripts) visit(JSON.parse(script[1]));
  return images;
}

let count = 0;
for (const [route, expected] of pages) {
  const page = origin + '/' + route;
  const block = sitemap.split('<url><loc>' + page + '</loc>')[1]?.split('</url>')[0];
  assert.ok(block, 'missing image sitemap landing page: ' + page);
  const urls = [...block.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(match => match[1]);
  assert.equal(urls.length, expected, page + ': wrong image association count');
  assert.equal(new Set(urls).size, urls.length, page + ': duplicate image URL');
  const localHTML = route.endsWith('/') || !route ? route + 'index.html' : route;
  const images = imageObjects(fs.readFileSync(localHTML, 'utf8'));
  for (const url of urls) {
    assert.ok(url.startsWith(origin + '/assets/img/'), page + ': non-canonical image URL: ' + url);
    const asset = path.join('assets/img', url.slice((origin + '/assets/img/').length));
    assert.ok(fs.existsSync(asset), page + ': sitemap image asset missing: ' + asset);
    const schema = images.find(image => image.contentUrl === url);
    assert.ok(schema, page + ': ImageObject not found for ' + url);
    for (const key of ['license', 'acquireLicensePage']) {
      assert.match(schema[key] || '', /^https:\/\//, page + ': missing HTTPS ' + key + ' for ' + url);
    }
    assert.ok(typeof schema.creditText === 'string' && schema.creditText.trim(), page + ': credit missing for ' + url);
    assert.ok(typeof schema.copyrightNotice === 'string' && schema.copyrightNotice.trim(), page + ': copyright missing for ' + url);
  }
  count += urls.length;
}
assert.equal(count, 224, 'expected precisely 224 documented image/page associations');
console.log('ART image sitemap rights PASS: 224 associations, six localized landing pages, 93 unchanged canonical URLs.');
