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
