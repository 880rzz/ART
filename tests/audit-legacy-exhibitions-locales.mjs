import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (file) => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const html = read('fotokiallitasok/index.html');
const code = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(code, 'Legacy exhibition locale-resolver script missing');
const origin = 'https://www.banhalmi.art';
const run = (search) => {
  let visit;
  const location = { search, replace: (href) => { visit = href; } };
  vm.runInNewContext(code, { URL, URLSearchParams, location, window: { location } });
  assert.ok(visit, 'Legacy route must navigate');
  return visit;
};

const expectations = [
  ['', '/hu/#exhibitions'],
  ['?lang=en-GB', '/#exhibitions'],
  ['?lang=DE-at', '/de-at/#exhibitions'],
  ['?lang=hu-HU', '/hu/#exhibitions'],
  ['?lang=de&source=archive&source=old', '/de-at/?source=archive&source=old#exhibitions'],
  ['?campaign=old', '/hu/?campaign=old#exhibitions'],
  ['?lang=fr-FR', '/hu/?lang=fr-FR#exhibitions'],
  ['?lang=https://example.com', '/hu/?lang=https://example.com#exhibitions'],
];
for (const [search, destination] of expectations) assert.equal(run(search), origin + destination);
assert.ok(html.includes('<link rel="canonical" href="' + origin + '/hu/">'));
assert.ok(html.includes('<noscript><meta http-equiv="refresh" content="0; url=' + origin + '/hu/#exhibitions"></noscript>'));
for (const [href, file] of [['/', 'index.html'], ['/hu/', 'hu/index.html'], ['/de-at/', 'de-at/index.html']]) {
  assert.ok(html.includes('href="' + origin + href + '#exhibitions"'));
  assert.match(read(file), /\bid="exhibitions"/);
}
assert.equal(JSON.parse(read('redirects.json')).redirects['/fotokiallitasok'], '/hu/#exhibitions');
assert.match(read('_redirects'), /^\/fotokiallitasok +\/hu\/#exhibitions +301$/m);
assert.equal(JSON.parse(read('vercel.json')).redirects.find((x) => x.source === '/fotokiallitasok')?.destination, '/hu/#exhibitions');
console.log('ART legacy exhibition archive: selected locales, URL preservation, canonical and fallback anchors pass.');
