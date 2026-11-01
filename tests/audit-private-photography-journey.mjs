import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { hardenMachineLayer } from '../scripts/harden-machine-layer.mjs';
import { applyArtisticIntentProjection } from '../scripts/harden-production-artifact.mjs';

const origin = 'https://www.banhalmi.art';
// Professional provider entity follows the current BANHALMI Photography domain.
const provider = 'https://www.banhalmiphotography.com/#organization';
const core = JSON.parse(fs.readFileSync('data/machine-core.json', 'utf8'));
const copy = JSON.parse(fs.readFileSync('data/private-photography-copy.json', 'utf8'));
const variants = [['en', ''], ['hu-HU', 'hu/'], ['de-AT', 'de-at/']];
const copyLocale = { en: 'en', 'hu-HU': 'hu', 'de-AT': 'de-AT' };
const humanMarkers = {
  en: {
    h1: 'From your idea to the finished photographs.',
    situations: 'data-human-situations="true"',
    posing: 'id="posing"',
    ideas: 'id="idea-paths"',
    nude: 'Artistic nude — Ébredés'
  },
  'hu-HU': {
    h1: 'Az elképzelésétől a kész képekig.',
    situations: 'data-human-situations="true"',
    posing: 'id="posing"',
    ideas: 'id="idea-paths"',
    nude: 'Művészi akt — Ébredés'
  },
  'de-AT': {
    h1: 'Von Ihrer Idee zu den fertigen Bildern.',
    situations: 'data-human-situations="true"',
    posing: 'id="posing"',
    ideas: 'id="idea-paths"',
    nude: 'Künstlerischer Akt — Ébredés'
  }
};
const retiredCategoryFirst = [
  'Choose the work you need',
  'Válassza ki a szükséges munkát',
  'Wählen Sie die passende Arbeit',
  'Your idea and the photographs you want',
  'Az elképzelése és a kívánt képek',
  'Ihre Idee und die gewünschten Fotografien'
];
const files = ['data/machine-core.json', 'data/private-photography-copy.json', 'ai.txt', 'llms.txt'];
for (const page of Object.values(core.artisticIntentProjection.authorityPages)) files.push(page.path);
for (const group of Object.values(core.artisticIntentProjection.supportingAuthorityPages)) {
  for (const page of Object.values(group)) files.push(page.path);
}

assert.equal(copy.version, '2026-11-01-human-conversion');
assert.deepEqual(copy.ia, ['hero','situations','help','posing','idea-paths','process','privacy','references','pricing','enquiry','reading']);

for (const [locale, prefix] of variants) {
  const route = `${origin}/${prefix}private-photography.html`;
  const file = `${prefix}private-photography.html`;
  const html = fs.readFileSync(file, 'utf8');
  const sot = copy.locales[copyLocale[locale]];
  assert.equal(core.artisticIntentProjection.currentCommissionRoutes[locale], `${origin}/${prefix}exhibitions/ebredes.html`);
  assert.ok(html.includes(`data-artistic-nude-entry href="/${prefix}exhibitions/ebredes.html"`));
  const nude = fs.readFileSync(`${prefix}exhibitions/ebredes.html`, "utf8");
  assert.ok(nude.includes("data-artistic-nude-service"));
  assert.ok(nude.includes("data-artistic-nude-enquiry href=\"mailto:"));
  assert.ok(!nude.includes('aria-label="Professional Fine Art"'));
  const nudeGraph = [...nude.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap(m => JSON.parse(m[1])['@graph'] || []);
  const nudeService = nudeGraph.find(n => n['@type'] === 'Service');
  assert.equal(nudeService?.url, `${origin}/${prefix}exhibitions/ebredes.html`);
  assert.equal(nudeService?.provider?.['@id'], provider);
  assert.ok(!nudeService.offers, 'No invented price or availability');
  assert.ok(nudeGraph.some(n => n['@type'] === 'ExhibitionEvent'), 'The historical exhibition remains a distinct record');
  assert.equal(core.privateCommissionRouting.routes[locale], route);
  assert.ok(html.includes(`rel="canonical" href="${route}"`));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.ok(html.includes(`<h1>${humanMarkers[locale].h1}</h1>`), `${locale} human H1`);
  assert.equal(sot.h1, humanMarkers[locale].h1, `${locale} SoT H1 parity`);
  assert.ok(html.includes(`<title>${sot.title}</title>`), `${locale} SoT title parity`);
  assert.ok(html.includes(humanMarkers[locale].situations), `${locale} situations-first IA`);
  assert.ok(html.includes(humanMarkers[locale].posing), `${locale} posing reassurance`);
  assert.ok(html.includes(humanMarkers[locale].ideas), `${locale} idea / no-idea paths`);
  assert.ok(html.includes(humanMarkers[locale].nude), `${locale} Ébredés nude lane`);
  for (const retired of retiredCategoryFirst) {
    assert.ok(!html.includes(retired), `${locale} must not keep category-first heading: ${retired}`);
  }
  assert.ok(html.includes('data-archive-page="private-photography" data-content-family="editorial"'), 'Use the private page family from first paint');
  for (const width of [480,720,1080]) {
    assert.ok(html.includes(`/assets/img/private-photography-${width}.webp ${width}w`));
    assert.ok(fs.statSync(`assets/img/private-photography-${width}.webp`).size > 1000, 'Real responsive photo derivative');
  }
  const graph = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap(m => JSON.parse(m[1])['@graph'] || []);
  const service = graph.find(n => n['@type'] === 'Service');
  assert.equal(service?.url, route);
  assert.equal(service?.provider?.['@id'], provider);
  assert.ok(!service.offers, 'Do not invent private prices or availability');
  assert.ok(/artistic portrait|művészi portr|Künstlerische Portr/i.test(service?.description || ''), `${locale} Service covers artistic portrait spectrum`);
  assert.ok(/fashion|lifestyle|editorial|catalogue|katalog|katalógus/i.test(service?.description || ''), `${locale} Service covers fashion/editorial/catalogue`);
  assert.ok(/intimate|intim|boudoir/i.test(service?.description || ''), `${locale} Service covers intimate/boudoir`);
  assert.ok(Array.isArray(service?.areaServed) && service.areaServed.some(a => a.name === 'Vienna') && service.areaServed.some(a => a.name === 'Budapest'));
  assert.ok(html.includes('data-private-enquiry="true" href="mailto:hello@norbertbanhalmi.com?subject='));
  assert.ok(html.includes('data-private-quote="true"'), 'Personal ART commissions use tailored-quote CTAs');
  assert.ok(!html.includes('art_type=artportrait'), 'Do not bounce private enquiries through the fine-art calculator');
  assert.ok(html.includes('data-service-choice="true"'), 'Service selection is visible on the private entry page');
  assert.ok(html.includes('femmefatale.html'), 'Fashion evidence stays visible');
  assert.ok(html.includes('euforia.html'), 'Artist-portrait evidence stays visible');
  assert.ok(html.includes('data-external="true" href="https://www.banhalmiphotography.com/'));
  assert.ok(html.includes('/exhibitions/ebredes.html'));
  assert.ok(fs.readFileSync(`${prefix}curators.html`, 'utf8').includes('id="collectors"'));
  assert.ok(fs.readFileSync(`${prefix}index.html`, 'utf8').includes(`href="/${prefix}private-photography.html"`));
  for (const [, otherPrefix] of variants) {
    assert.ok(html.includes(`href="/${otherPrefix}private-photography.html"`), 'Language switch preserves the private task');
  }
  files.push(file, `${prefix}index.html`, `${prefix}curators.html`);
}

// The artifact compiler used to project the retired professional-only routing.
// Prove both localized routes and the visitor-facing pages survive two passes.
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'art-private-journey-'));
try {
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(temp, file)), { recursive: true });
    fs.copyFileSync(file, path.join(temp, file));
  }
  for (let pass = 0; pass < 2; pass++) {
    applyArtisticIntentProjection(temp, core.artisticIntentProjection);
    hardenMachineLayer(temp);
    assert.ok(fs.statSync(path.join(temp,'llms.txt')).size <= 9000, 'Production llms index stays within the same 9 KB budget as source');
    for (const [locale, prefix] of variants) {
      const route = core.privateCommissionRouting.routes[locale];
      for (const guide of ['ai.txt', 'llms.txt']) {
        assert.ok(fs.readFileSync(path.join(temp, guide), 'utf8').includes(route), `${guide} retains ${locale} private destination`);
        assert.ok(fs.readFileSync(path.join(temp, guide), 'utf8').includes(core.artisticIntentProjection.currentCommissionRoutes[locale]), `${guide} retains the Ébredés nude owner`);
      }
      const html = fs.readFileSync(path.join(temp, prefix + 'private-photography.html'), 'utf8');
      assert.ok(html.includes('data-private-enquiry="true"'));
      assert.ok(html.includes(`"@id":"${route}#service"`));
      assert.ok(html.includes(`href="/${prefix}curators.html#collectors"`));
    }
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
console.log('Private ART journey passed: three localized services, real collector anchors, canonical provider, unchanged terms and repeated artifact routing preservation.');
