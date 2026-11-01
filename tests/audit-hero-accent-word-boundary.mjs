import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('assets/js/responsive-header-system.js', 'utf8');
assert.ok(source.includes('/portraits/i'), 'EN plural portrait form must be preferred');
assert.ok(source.includes('/porträts/i'), 'DE plural Porträt form must be preferred');
assert.ok(source.includes('letter.test'), 'Accent matcher must reject mid-word hits');

function applyAccent(language, headingText) {
  const heading = {
    querySelector() { return null; },
    children: { length: 0 },
    textContent: headingText,
    nodes: null,
    replaceChildren(...nodes) { this.nodes = nodes; }
  };
  const sandbox = {
    language,
    document: {
      createElement() {
        return { className: '', textContent: '' };
      },
      createTextNode(text) {
        return { nodeType: 3, textContent: text };
      }
    },
    main: {
      querySelector() { return heading; }
    }
  };
  const start = source.indexOf('/* v67: visually emphasise');
  const end = source.indexOf('const buttons = [...document.querySelectorAll');
  assert.ok(start >= 0 && end > start, 'Hero accent block bounds');
  vm.runInNewContext(source.slice(start, end), sandbox);
  const accent = heading.nodes?.find((node) => node.className === 'art-hero-accent');
  return accent?.textContent || null;
}

assert.equal(
  applyAccent('en', 'Artistic portraits, fashion and intimate photography'),
  'portraits'
);
assert.equal(
  applyAccent('de', 'Künstlerische Porträts, Fashion und intime Fotografie'),
  'Porträts'
);
assert.equal(
  applyAccent('en', 'Intimate portraiture and artistic boudoir'),
  null,
  'Do not accent the portrait stem inside portraiture when no later whole-word hit exists'
);
assert.equal(
  applyAccent('hu', 'Művészi portré, divat és intim fotográfia'),
  'portré'
);

console.log('Hero accent word-boundary audit PASS.');
