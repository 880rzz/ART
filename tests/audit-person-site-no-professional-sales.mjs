import fs from 'node:fs';
import assert from 'node:assert/strict';

const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
const paths = [...sitemap.matchAll(/<loc>https:\/\/www\.banhalmi\.art\/([^<]*)<\/loc>/g)]
  .map((m) => !m[1] ? 'index.html' : m[1].endsWith('/') ? m[1] + 'index.html' : m[1]);

assert.equal(paths.length, 93, 'Guard all 93 indexable ART URLs; update deliberately if sitemap scope changes');
for (const path of [...paths, '404.html', 'hu/404.html', 'de-at/404.html']) {
  const html = fs.readFileSync(path, 'utf8');
  assert.ok(!/class=["'][^"']*\bprofessional-bridge\b/i.test(html), path + ': professional navigation must not return');
  assert.ok(!/class=["'][^"']*\bprofessional-side\b/i.test(html), path + ': business callout must not return');
  for (const match of html.matchAll(/<a\b[^>]*href=["'](https:\/\/www\.banhalmiphotography\.com\/[^"']*)["'][^>]*>/gi)) {
    const href = match[1];
    const legal = /\/(?:impressum|privacy-policy|adatvedelem|datenschutz)\//i.test(href);
    assert.ok(legal, path + ': business/quote navigation returned: ' + href);
  }
}
const localized = {
  'private-photography.html': /any theme, subject or style/i,
  'hu/private-photography.html': /bármilyen témát és stílust/i,
  'de-at/private-photography.html': /jedes Thema und jeden Stil/i
};
for (const [path, wording] of Object.entries(localized)) {
  const html = fs.readFileSync(path, 'utf8');
  const section = html.match(/<section class="wrap narrow" id="pricing">([\s\S]*?)<\/section>/i)?.[1] || '';
  assert.ok(wording.test(section), path + ': open-ended personal artistic scope must be visible');
  assert.ok(!/\b(?:EUR|HUF|Ft|gross|brutto|starting from)\b|€/i.test(section), path + ': personal nude art must not show prices');
  assert.ok(!/data-professional-service=/i.test(html), path + ': no professional service referral data attributes');
}
console.log('ART person-only role check: 93 canonical pages and 3 localized 404 pages free of commercial links; personal art has no fixed nude price.');
