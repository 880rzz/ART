import { readFile } from 'node:fs/promises';

// The standalone family-origins page was folded into the short introduction on
// each homepage (2026-07-31). These three files are now redirect stubs that
// send visitors to index.html#about; the actual family-background sentence
// lives inline in the "about" section of each homepage.

const stub = await readFile(new URL('../hu/csaladi-gyokerek.html', import.meta.url), 'utf8');
const englishStub = await readFile(new URL('../family-origins.html', import.meta.url), 'utf8');
const germanStub = await readFile(new URL('../de-at/familienwurzeln.html', import.meta.url), 'utf8');

const hu = await readFile(new URL('../hu/index.html', import.meta.url), 'utf8');
const en = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const de = await readFile(new URL('../de-at/index.html', import.meta.url), 'utf8');

const menuLeak = (text) => text.includes('csaladi-gyokerek.html">Családi') || text.includes('family-origins.html">Family origins') || text.includes('familienwurzeln.html">Familienwurzeln');

const checks = [
  ['HU stub redirects to about', stub.includes('url=https://www.banhalmi.art/hu/index.html#about')],
  ['EN stub redirects to about', englishStub.includes('url=https://www.banhalmi.art/index.html#about')],
  ['DE stub redirects to about', germanStub.includes('url=https://www.banhalmi.art/de-at/index.html#about')],
  ['no leftover mega-menu link HU', !menuLeak(hu)],
  ['no leftover mega-menu link EN', !menuLeak(en)],
  ['no leftover mega-menu link DE', !menuLeak(de)],
  ['family essence present HU', hu.includes('erdélyi gyökerű') && hu.includes('Ferenczy-ágon')],
  ['family essence present EN', en.includes('Transylvanian roots') && en.includes('Ferenczy line')],
  ['family essence present DE', de.includes('siebenbürgische Wurzeln') && de.includes('Linie Ferenczy')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}

if (failed.length) {
  throw new Error(`A családi gyökerek audit ${failed.length} hibát talált.`);
}
