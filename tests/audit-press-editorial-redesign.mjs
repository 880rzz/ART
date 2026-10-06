import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pages = [
  ['press.html', 'Articles, interviews and television conversations'],
  ['hu/press.html', 'Cikkek, interjúk és televíziós beszélgetések'],
  ['de-at/press.html', 'Artikel, Interviews und Fernsehgespräche']
];
const errors = [];
const hrefSets = [];
const recordCounts = [];
const css = fs.readFileSync(path.join(root,'assets/css/site.css'),'utf8');

const start = 'APPLE-RESPONSIVE-CONTRACT-V1:START';
const end = 'APPLE-RESPONSIVE-CONTRACT-V1:END';
if (!css.includes(start) || !css.includes(end)) errors.push('site.css: final Apple responsive authority missing');
if (css.indexOf(start) !== css.lastIndexOf(start) || css.indexOf(end) !== css.lastIndexOf(end)) errors.push('site.css: multiple Apple authorities detected');

for (const [relative, heading] of pages) {
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  if (!html.includes('<main id="main-content" class="press-redesign">')) errors.push(`${relative}: redesigned main missing`);
  if (!html.includes(`<h1>${heading}</h1>`)) errors.push(`${relative}: direct H1 missing`);
  if (!html.includes('id="press-list" class="press-records"')) errors.push(`${relative}: visible press-list missing`);
  if (/<style\b/i.test(html) || /id=["']press-editorial-redesign["']/i.test(html)) errors.push(`${relative}: inline Press CSS returned; site.css must remain the sole authority`);
  if (html.includes('class="press-types"') || html.includes('class="thesis"')) errors.push(`${relative}: old abstract preamble remains`);
  if (html.includes('verified from the current Wikipedia source list') || html.includes('a jelenlegi Wikipédia-forrásjegyzék alapján ellenőrizve') || html.includes('anhand der aktuellen Wikipedia-Quellenliste geprüft')) errors.push(`${relative}: repetitive video notes remain`);
  const ids = [...html.matchAll(/<article class="item press-record" id="press-(\d{2})"/g)].map(m => m[1]);
  const expected = Array.from({length: ids.length}, (_, i) => String(i + 1).padStart(2, '0'));
  if (!ids.length) errors.push(`${relative}: no press records found`);
  if (JSON.stringify(ids) !== JSON.stringify(expected)) errors.push(`${relative}: press IDs are not unique and sequential; found ${ids.length}`);
  const schemaCountMatch = html.match(/"numberOfItems":(\d+)/);
  const schemaCount = schemaCountMatch ? Number(schemaCountMatch[1]) : NaN;
  if (schemaCount !== ids.length) errors.push(`${relative}: schema numberOfItems ${schemaCount} differs from visible record count ${ids.length}`);
  const listItems = (html.match(/"@type":"ListItem"/g) || []).length;
  if (listItems !== ids.length) errors.push(`${relative}: schema ListItems ${listItems} differ from visible record count ${ids.length}`);
  recordCounts.push([relative, ids.length]);
  const hrefs = [...html.matchAll(/<article class="item press-record"[^>]*>.*?<a class="press-record__title" href="([^"]+)"/gs)].map(m => m[1]);
  hrefSets.push([relative, hrefs]);
  for (const token of ['press-facts', 'press-period-nav', 'press-period-count', 'press-sources']) {
    if (!html.includes(token)) errors.push(`${relative}: ${token} missing`);
  }
}

const referenceHrefs = JSON.stringify(hrefSets[0][1]);
const referenceCount = recordCounts[0][1];
for (const [relative, hrefs] of hrefSets.slice(1)) {
  if (JSON.stringify(hrefs) !== referenceHrefs) errors.push(`${relative}: press source links differ from English`);
}
for (const [relative, count] of recordCounts.slice(1)) {
  if (count !== referenceCount) errors.push(`${relative}: visible record count ${count} differs from English ${referenceCount}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Press editorial audit passed: ${recordCounts[0][1]} data-driven records with matching schema/list parity across three languages and one final Apple CSS authority.`);
