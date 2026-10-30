import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { hardenMachineLayer } from '../scripts/harden-machine-layer.mjs';
import { applyArtisticIntentProjection } from '../scripts/harden-production-artifact.mjs';

const origin = 'https://www.banhalmi.art';
const provider = 'https://www.banhalmiphotography.com/#organization';
const core = JSON.parse(fs.readFileSync('data/machine-core.json', 'utf8'));
const variants = [['en', ''], ['hu-HU', 'hu/'], ['de-AT', 'de-at/']];
const files = ['data/machine-core.json', 'ai.txt', 'llms.txt'];
for (const page of Object.values(core.artisticIntentProjection.authorityPages)) files.push(page.path);
for (const group of Object.values(core.artisticIntentProjection.supportingAuthorityPages)) {
  for (const page of Object.values(group)) files.push(page.path);
}

for (const [locale, prefix] of variants) {
  const route = `${origin}/${prefix}private-photography.html`;
  const file = `${prefix}private-photography.html`;
  const html = fs.readFileSync(file, 'utf8');
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
  assert.ok(html.includes('data-private-enquiry="true" href="mailto:hello@norbertbanhalmi.com?subject='));
  assert.ok(html.includes('data-external="true" href="https://www.norbertbanhalmi.com/'));
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
