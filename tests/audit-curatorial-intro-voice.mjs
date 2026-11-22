import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const cases = [
  { file: 'curators.html', expected: 'I have gathered the history of my work since 1999', retired: 'written to save you an afternoon', books: 'Five books' },
  { file: 'hu/curators.html', expected: 'Ezen az oldalon az 1999 óta készült munkáim történetét', retired: 'megspóroljak Önnek egy délutánt', books: 'Öt könyv' },
  { file: 'de-at/curators.html', expected: 'Hier habe ich meine Arbeiten seit 1999', retired: 'um Ihnen einen Nachmittag zu ersparen', books: 'Fünf Bücher' },
];
for (const { file, expected, retired, books } of cases) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(html.includes(expected), file + ': missing evidenced, personal curator introduction');
  assert.ok(!html.includes(retired), file + ': outdated promotional introduction remains');
  assert.ok(html.includes(books), file + ': five-book navigation parity regressed');
  for (const id of ['period-i', 'period-ii', 'period-iii', 'period-iv', 'period-v']) {
    assert.ok(html.includes('id="' + id + '"'), file + ': missing curator period ' + id);
  }
  assert.ok(html.includes('hello@norbertbanhalmi.com'), file + ': curator contact missing');
  assert.ok(html.includes('hreflang='), file + ': localized alternatives missing');
}
console.log('Three localized curator introductions, five-book navigation, period anchors and locale metadata are synchronized.');


// The book landing's authored first-person introduction must not silently regress
// to a third-person archive summary in only one locale. Data and citations stay
// in the independently sourced dossier below each introduction.
for (const [slug, phrases] of Object.entries({
  'book-anovilaga': ['szerettem', 'portréim', 'Máig megérint'],
  'book-ebredes': ['Ez a könyv', 'közösen', 'nők saját szavai'],
  'book-szosszenetek': ['érdekelt bennünket', 'értelmeztük újra', 'magunknak'],
})) {
  const huPath = 'hu/books/' + slug + '.html';
  const hu = fs.readFileSync(path.join(root, huPath), 'utf8');
  const start = hu.indexOf('<div class="book-text">');
  const end = hu.indexOf('</div>', start);
  assert.ok(start !== -1 && end > start, huPath + ': missing book landing');
  const intro = hu.slice(start, end);
  assert.ok(intro.includes('Saját szavaimmal'), huPath + ': author label is missing');
  assert.ok(!intro.includes('Archívumi összefoglaló'), huPath + ': obsolete archive-summary framing');
  assert.equal((intro.match(/<p class="lead">/g) || []).length, 3, huPath + ': incomplete authored introduction');
  for (const phrase of phrases) assert.ok(intro.includes(phrase), huPath + ': missing authored source-translation anchor ' + phrase);
  assert.ok(hu.includes('data-book-editorial-dossier='), huPath + ': independently sourced curatorial dossier removed');
  assert.ok(hu.includes('hreflang='), huPath + ': locale metadata missing');
}
console.log('Hungarian book artist voice parity (3 titles) and separate curatorial dossiers preserved.');


// In all published exhibitions with a first-person opening, HU must use the
// same editorial role label as EN/DE. EUFÓRIA has a separate project structure.
const authoredExhibitions = [
  'anovilaga', 'avalosag', 'balerina-project-new-york', 'ebredes',
  'enano', 'femmefatale', 'fotokiallitas1', 'fotokiallitas2',
  'fotokiallitas3', 'fotokiallitas4', 'fotokiallitas5', 'fotokiallitas8',
  'mas-kepp-mas', 'merfoldkovek1956', 'szosszenetek', 'teislehetsz',
  'theframe', 'themensdream', 'touch-wien'
];
for (const slug of authoredExhibitions) {
  const huPath = 'hu/exhibitions/' + slug + '.html';
  const html = fs.readFileSync(path.join(root, huPath), 'utf8');
  const main = html.slice(html.indexOf('<main'));
  const label = '<p class="label u-mb-xs">Saját szavaimmal</p>';
  assert.ok(main.includes(label), huPath + ': first-person artist label missing');
  assert.ok(!main.includes('<p class="label u-mb-xs">Archívumi összefoglaló</p>'),
    huPath + ': first-person project text incorrectly labeled as archival summary');
  assert.ok((main.match(/<p class="lead">/g) || []).length >= 2,
    huPath + ': artist narration is incomplete');
  assert.ok(html.includes('hreflang='), huPath + ': localized alternatives missing');
}
console.log('Hungarian exhibition author-label parity (19 projects) preserved.');
