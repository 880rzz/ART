import assert from 'node:assert/strict';
import fs from 'node:fs';
import { transformJsonLdScripts } from '../scripts/harden-machine-layer.mjs';

const core = JSON.parse(fs.readFileSync('data/machine-core.json', 'utf8'));
const prefixes = ['', 'hu/', 'de-at/'];
const works = ['ebredes', 'euforia', 'femmefatale', 'balerina-project-new-york'];
const commercial = /^https:\/\/www\.banhalmiphotography\.com\/[^?#]*#(?:service|professional-portfolio|request-quote)$/i;

function graphOf(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
}
function commercialEdges(graph) {
  const hits = [];
  function visit(value, parent = '') {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { for (const item of value) visit(item, parent); return; }
    for (const [key, child] of Object.entries(value)) {
      if (key === '@id' && ['about','mentions','subjectOf','isRelatedTo','relatedTo'].includes(parent)
          && commercial.test(String(child))) hits.push(child);
      visit(child, key);
    }
  }
  visit(graph);
  return hits;
}
let checked = 0;
for (const prefix of prefixes) {
  for (const name of works) {
    const file = prefix + 'exhibitions/' + name + '.html';
    const original = fs.readFileSync(file, 'utf8');
    const projected = transformJsonLdScripts(original, {
      maxAssociatedMedia: 12, dateModified: '2026-11-18',
      professionalIdentityMirror: core.professionalIdentityMirror,
      personAuthority: core.person
    }).html;
    const originalGraphs = graphOf(original);
    const graphs = graphOf(projected);
    assert.equal(graphs.length, originalGraphs.length, file + ': JSON-LD records lost');
    assert.deepEqual(commercialEdges(graphs), [], file + ': commercial service edge in ART JSON-LD');
    if (name === 'ebredes') {
      assert.ok(graphs.flatMap((x) => x['@graph'] || [x]).some((x) => x?.['@type'] === 'ExhibitionEvent'), file + ': historic exhibition lost');
      assert.ok(!JSON.stringify(graphs).includes('banhalmiphotography.com/fine-art/#service'), file + ': business fine-art link remains');
    }
    checked += 1;
  }
}
assert.equal(checked, 12);
console.log('ART exhibition JSON-LD has no Professional sales edges on 12 EN/HU/de-AT pages; historical exhibition entities retained.');
