import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const expected = [
  [
    "index.html",
    "I have photographed people since 1999"
  ],
  [
    "hu/index.html",
    "1999 óta fényképezek."
  ],
  [
    "de-at/index.html",
    "Seit 1999 fotografiere ich Menschen"
  ],
  [
    "press.html",
    "I have collected interviews, articles, reports and films"
  ],
  [
    "hu/press.html",
    "gyűjtöttem össze azokat az interjúkat"
  ],
  [
    "de-at/press.html",
    "habe ich Interviews, Artikel, Berichte und Filme"
  ],
  [
    "private-photography.html",
    "We begin with what you need the images for"
  ],
  [
    "hu/private-photography.html",
    "Először azt beszéljük meg"
  ],
  [
    "de-at/private-photography.html",
    "Zuerst besprechen wir, wofür Sie die Bilder brauchen"
  ]
];
assert.equal(expected.length,9);
for (const [file, needle] of expected) {
 const html = fs.readFileSync(path.join(root, file), 'utf8');
 assert.ok(html.includes(needle),file+': authorial prose missing');
 assert.ok(html.includes('rel="canonical"'),file+': canonical link missing');
 assert.ok(html.includes('hreflang='),file+': hreflang missing');
}
console.log('Nine editorial introductions are present in EN/HU/DE with canonical and hreflang.');
