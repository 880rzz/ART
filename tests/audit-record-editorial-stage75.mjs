/* Stage 75/76 permanent regression gate: the shared exhibition/book record system and landmark exhibition signatures stay multilingual, cache-safe, structurally scoped, and release-verified. */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const css = await readFile(path.join(root, 'assets/css/record-editorial-system.css'), 'utf8');
const runtime = await readFile(path.join(root, 'assets/js/responsive-header-system.js'), 'utf8');
const release = JSON.parse(await readFile(path.join(root, 'data/design-release.json'), 'utf8'));
const failures = [];

const must = (condition, message) => { if (!condition) failures.push(message); };

must(typeof release.release === 'string' && release.release.length > 0, 'record editorial release token is not active');
must(release.stylesheets.includes('record-editorial-system.css'), 'record-editorial-system.css is not release-guarded');
must(runtime.includes("body.dataset.recordType = 'exhibition'"), 'runtime does not classify exhibition records');
must(runtime.includes("body.dataset.recordType = 'book'"), 'runtime does not classify book records');
must(runtime.includes(`/assets/css/record-editorial-system.css?v=${release.release}`), 'record editorial stylesheet is not loaded with the active cache token');
must(css.includes('main>section:nth-of-type(even)'), 'record stylesheet does not enforce alternating even sections');
must(css.includes('main>section:nth-of-type(odd)'), 'record stylesheet does not enforce alternating odd sections');
must(css.includes('[data-record-type="exhibition"] .collage'), 'exhibition gallery authority is missing');
must(css.includes('[data-record-type="book"] .book-lead'), 'book artefact layout authority is missing');
must(css.includes('@media(max-width:640px)'), 'record system has no mobile contract');
must(runtime.includes('body.dataset.recordSlug'), 'runtime does not expose the canonical record slug');
must(['euforia','merfoldkovek1956','anovilaga','theframe'].every((slug) => css.includes(`[data-record-slug=\"${slug}\"]`)), 'Stage 76 exhibition signature selectors are missing');
must(['book-ebredes','book-szosszenetek','book-anovilaga'].every((slug) => css.includes(`[data-record-slug=\"${slug}\"]`)), 'Stage 77 book signature selectors are missing');

const trees = [
  { lang: 'en', prefix: '' },
  { lang: 'hu', prefix: 'hu' },
  { lang: 'de-at', prefix: 'de-at' }
];
for (const { lang, prefix } of trees) {
  for (const family of ['exhibitions', 'books']) {
    const dir = path.join(root, prefix, family);
    let files = [];
    try { files = (await readdir(dir)).filter((f) => f.endsWith('.html')); }
    catch { failures.push(`${lang}/${family} directory missing`); continue; }
    must(files.length > 0, `${lang}/${family} has no HTML records`);
    for (const file of files) {
      const html = await readFile(path.join(dir, file), 'utf8');
      must(html.includes(`responsive-header-system.js?v=${release.release}`), `${lang}/${family}/${file} does not load the active record runtime`);
      must(/<main\b/i.test(html), `${lang}/${family}/${file} has no main landmark`);
      must(/<h1\b/i.test(html), `${lang}/${family}/${file} has no H1`);
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Stage 75/76 record editorial audit passed for exhibition and book records in EN/HU/DE-AT, including landmark exhibition signatures.');
