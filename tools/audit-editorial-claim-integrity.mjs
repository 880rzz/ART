import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(path, 'utf8');

const forbidden = new Map([
  ['curators.html', ['first professional photo studio of the Hungarian Defence Forces', "The Japan Times covered how I renewed the brand's communication"]],
  ['hu/curators.html', ['első professzionális fotóstúdióját', 'hogyan újítottam meg a márka magyarországi kommunikációját']],
  ['de-at/curators.html', ['erste professionelle Fotostudio der Ungarischen Streitkräfte', 'wie ich die Markenkommunikation in Ungarn erneuert habe']],
  ['oeuvre-context.json', ['The first professional photo studio of the Hungarian Defence Forces']],
  ['exhibitions/theframe.html', ['For my twentieth year in photography']],
  ['hu/exhibitions/theframe.html', ['A fotózásban töltött huszadik évemre']],
  ['de-at/exhibitions/theframe.html', ['Zu meinem zwanzigsten Jahr in der Fotografie']],
  ['exhibitions/themensdream.html', ['A few years later everyone was there']],
  ['hu/exhibitions/themensdream.html', ['Pár évvel később mindenki ott volt']],
  ['de-at/exhibitions/themensdream.html', ['Ein paar Jahre später waren alle dort']],
  ['exhibitions/touch-wien.html', ['people go weeks without being touched by anyone']],
  ['hu/exhibitions/touch-wien.html', ['emberek hetekig nem érintenek meg senkit']],
  ['de-at/exhibitions/touch-wien.html', ['Menschen wochenlang von niemandem berührt werden']],
  ['de-at/exhibitions/euforia.html', ['Die Anatomie der Gegenwart', 'Completed · documented', 'charismatische Person']],
  ['hu/index.html', ['az vezetői portréfotózás']],
  ['exhibitions/anovilaga.html', ['>beszámoló</a>']],
  ['de-at/exhibitions/anovilaga.html', ['>beszámoló</a>']],
  ['exhibitions/fotokiallitas8.html', ['>beszámoló</span>']],
  ['de-at/exhibitions/fotokiallitas8.html', ['>beszámoló</span>']],
  ['de-at/exhibitions/teislehetsz.html', ['>video riport</a>']],
  ['de-at/exhibitions/fotokiallitas4.html', ['>riport film</a>']],
]);

for (const [path, tokens] of forbidden) {
  const source = read(path);
  for (const token of tokens) assert(!source.includes(token), `${path}: retired editorial claim/label returned: ${token}`);
}

const registry = JSON.parse(read('archive-record-registry.json'));
const find = (language, slug) => registry.records.find(r => r.language === language && r.slug === slug);
assert.equal(find('de-AT', 'euforia')?.title, 'EUFÓRIA — Die Anatomie der Präsenz');
assert.equal(find('en', 'theframe')?.description, 'For The Frame — 20 Years, I did something slightly perverse: I printed nothing.');
assert.equal(find('de-AT', 'theframe')?.description, 'Für The Frame — 20 Jahre tat ich etwas leicht Perverses: Ich druckte nichts.');

console.log('Editorial claim integrity passed: firstness, chronology, multilingual labels and visible/machine parity are guarded.');
