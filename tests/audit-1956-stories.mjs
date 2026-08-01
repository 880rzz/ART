/* The 1956 life stories, in three languages.
 *
 * All three language versions of the Milestones '56 exhibition page fetched
 * the same Hungarian data file — the URL was hard-coded to "-hu.json" in the
 * English and German pages — so an English or German reader opening a life
 * story got Hungarian text, and the panel's own subtitle admitted as much.
 *
 * These are the recorded testimonies of real people, so the translations must
 * stay structurally identical to the source: the same fifteen people, in the
 * same order, each with the same number of paragraphs and the same portrait.
 * A missing paragraph here is a missing part of somebody's life.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const failures = [];

const langs = ['hu', 'en', 'de'];
const data = {};
for (const lang of langs) {
  const file = path.join(root, `assets/data/merfoldkovek1956-stories-${lang}.json`);
  try {
    data[lang] = JSON.parse(await readFile(file, 'utf8'));
  } catch {
    failures.push(`assets/data/merfoldkovek1956-stories-${lang}.json is missing or unreadable`);
  }
}

if (Object.keys(data).length === langs.length) {
  const source = data.hu.stories;
  for (const lang of ['en', 'de']) {
    const translated = data[lang].stories;
    if (translated.length !== source.length) {
      failures.push(`${lang}: ${translated.length} stories against ${source.length} in the Hungarian source`);
      continue;
    }
    source.forEach((story, index) => {
      const other = translated[index];
      if (other.image !== story.image) {
        failures.push(`${lang} story ${index + 1}: portrait ${other.image} does not match the source's ${story.image}`);
      }
      if (other.paragraphs.length !== story.paragraphs.length) {
        failures.push(
          `${lang} story ${index + 1} (${story.name}): ${other.paragraphs.length} paragraphs against ` +
          `${story.paragraphs.length} in the Hungarian — part of the testimony is missing`
        );
      }
      for (const [i, paragraph] of other.paragraphs.entries()) {
        if (!paragraph || paragraph.trim().length < 20) {
          failures.push(`${lang} story ${index + 1} (${story.name}): paragraph ${i + 1} is empty or a stub`);
        }
      }
      /* Years are the load-bearing facts in these accounts. */
      const years = (text) => new Set((text.match(/(?:1[89]|20)\d{2}/g) || []));
      const missing = [...years(story.paragraphs.join(' '))].filter((y) => !years(other.paragraphs.join(' ')).has(y));
      if (missing.length) {
        failures.push(`${lang} story ${index + 1} (${story.name}): year(s) ${missing.join(', ')} lost in translation`);
      }
    });
  }
}

/* Each page must read its own language's file. */
const pages = {
  'exhibitions/merfoldkovek1956.html': 'en',
  'hu/exhibitions/merfoldkovek1956.html': 'hu',
  'de-at/exhibitions/merfoldkovek1956.html': 'de',
};
for (const [rel, lang] of Object.entries(pages)) {
  const html = await readFile(path.join(root, rel), 'utf8');
  const expected = `merfoldkovek1956-stories-${lang}.json`;
  const used = html.match(/merfoldkovek1956-stories-[a-z]+\.json/);
  if (!used) failures.push(`${rel}: does not load any story data`);
  else if (used[0] !== expected) failures.push(`${rel}: loads ${used[0]} instead of ${expected}`);
}

/* The panel has to be able to scroll: design-refinements.css sets
   overflow:visible on every <article>, which silently beat the page's own
   rule and left long stories cut off on phones with no way to reach the end. */
const css = await readFile(path.join(root, 'assets/css/museum-editorial.css'), 'utf8');
if (!/\.story-panel\{[^}]*overflow-y:auto!important/s.test(css.replace(/\s+/g, ''))) {
  failures.push('museum-editorial.css: the story panel no longer restores its own scrolling');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
const total = data.hu.stories.reduce((n, s) => n + s.paragraphs.length, 0);
console.log(
  `1956 stories audit passed: ${data.hu.stories.length} testimonies in three languages, ` +
  `${total} paragraphs each, portraits and years aligned, every page reading its own language.`
);
