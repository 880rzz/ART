import { readFile, writeFile } from 'node:fs/promises';

const INDEX_PATH = new URL('../hu/index.html', import.meta.url);
const expectedDescription = '<p class="m-desc">Honnan indultam, hogyan lett a dokumentációból portrészemlélet, majd művészeti és vizuális stratégiai munka.</p>';
const acceptedDescriptions = [
  '<p class="m-desc">Honnan ered a munka, és miért maradt 1999 óta a jelenlét kutatása a középpontjában.</p>',
  '<p class="m-desc">Ki vagyok, honnan jövök, és mit keresek huszonöt éve az objektíven keresztül.</p>',
];

const original = await readFile(INDEX_PATH, 'utf8');
let updated = original;
for (const description of acceptedDescriptions) {
  if (updated.includes(description)) updated = updated.replace(description, expectedDescription);
}
updated = updated.replace('href="/hu/csaladi-gyokerek.html"', 'href="csaladi-gyokerek.html"');

if (updated !== original) await writeFile(INDEX_PATH, updated, 'utf8');
console.log(updated === original ? 'Family menu already prepared.' : 'Family menu prepared for deterministic integration.');
