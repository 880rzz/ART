import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(await readFile(path.join(root, 'data/life-journey.json'), 'utf8'));
const registry = JSON.parse(await readFile(path.join(root, 'archive-record-registry.json'), 'utf8'));
const redirects = JSON.parse(await readFile(path.join(root, 'redirects.json'), 'utf8'));
const errors = [];

const expectedExhibitions = new Set([
  'fotokiallitas1', 'fotokiallitas2', 'fotokiallitas3', 'fotokiallitas4', 'fotokiallitas5',
  'merfoldkovek1956', 'szosszenetek', 'ebredes', 'anovilaga', 'balerina-project-new-york',
  'fotokiallitas8', 'theframe', 'teislehetsz', 'themensdream', 'avalosag',
  'touch-wien', 'enano', 'mas-kepp-mas', 'femmefatale', 'euforia'
]);
const expectedBooks = new Set(['book-szosszenetek', 'book-ebredes', 'book-anovilaga']);
const expectedPress = new Set(Array.from({ length: 35 }, (_, index) => `press-${String(index + 1).padStart(2, '0')}`));

function collect(field) {
  return data.stages.flatMap((stage) => stage[field] || []);
}
function compareExact(field, expected) {
  const values = collect(field);
  const counts = new Map(values.map((value) => [value, values.filter((item) => item === value).length]));
  for (const value of expected) {
    if (!counts.has(value)) errors.push(`life-journey.json: missing ${field} record ${value}`);
    else if (counts.get(value) !== 1) errors.push(`life-journey.json: ${field} record ${value} appears ${counts.get(value)} times`);
  }
  for (const value of counts.keys()) if (!expected.has(value)) errors.push(`life-journey.json: unexpected ${field} record ${value}`);
}

if (data.person !== 'https://www.norbertbanhalmi.com/about/') errors.push('life-journey.json: canonical Person mismatch');
if (data.stages.length !== 9) errors.push(`life-journey.json: expected 9 stages, found ${data.stages.length}`);
compareExact('exhibitions', expectedExhibitions);
compareExact('books', expectedBooks);
compareExact('press', expectedPress);

for (const lang of ['hu', 'en', 'de']) {
  const origin = data.stages.find((stage) => stage.id === 'digital-origin')?.narrative?.[lang] || '';
  if (!/MOL.?Y2K/i.test(origin)) errors.push(`life-journey.json: ${lang} MOL Y2K origin missing`);
  if (!/1[,.]3/.test(origin)) errors.push(`life-journey.json: ${lang} 1.3-megapixel fact missing`);
}

const pageSets = {
  en: ['index.html', 'curators.html'],
  hu: ['hu/index.html', 'hu/curators.html'],
  de: ['de-at/index.html', 'de-at/curators.html']
};
for (const [lang, files] of Object.entries(pageSets)) {
  for (const relative of files) {
    const html = await readFile(path.join(root, relative), 'utf8');
    if (!html.includes('<!-- LIFE-JOURNEY:START -->') || !html.includes('<!-- LIFE-JOURNEY:END -->')) {
      errors.push(`${relative}: canonical life journey markers missing`);
    }
    const stages = [...html.matchAll(/class="life-stage"/g)].length;
    if (stages !== 9) errors.push(`${relative}: expected 9 visible life stages, found ${stages}`);
    for (const stage of data.stages) {
      if (!html.includes(`id="journey-${stage.id}"`)) errors.push(`${relative}: missing stage journey-${stage.id}`);
    }
    if (!/MOL.?Y2K/i.test(html)) errors.push(`${relative}: MOL Y2K origin is not visible`);
    if (!/1[,.]3/.test(html)) errors.push(`${relative}: 1.3-megapixel fact is not visible`);
    for (const anchor of expectedPress) {
      const prefix = lang === 'en' ? '/press.html#' : lang === 'hu' ? '/hu/press.html#' : '/de-at/press.html#';
      if (!html.includes(prefix + anchor)) errors.push(`${relative}: missing press relationship ${anchor}`);
    }
  }
}

const workRoutes = {
  'works/peter-magyar-portrait-2026.html': '/exhibitions/euforia.html#peter-magyar-portrait',
  'hu/works/magyar-peter-portre-2026.html': '/hu/exhibitions/euforia.html#peter-magyar-portrait',
  'de-at/works/peter-magyar-portraet-2026.html': '/de-at/exhibitions/euforia.html#peter-magyar-portrait'
};
for (const [relative, target] of Object.entries(workRoutes)) {
  const html = await readFile(path.join(root, relative), 'utf8');
  if (!/noindex,follow/i.test(html)) errors.push(`${relative}: redirect bridge must be noindex,follow`);
  if (!html.includes('window.location.replace')) errors.push(`${relative}: redirect bridge script missing`);
  if (!html.includes(target)) errors.push(`${relative}: redirect target must be localized EUFÓRIA anchor`);
  if (/"@type"\s*:\s*\[?\s*"Photograph"/.test(html)) errors.push(`${relative}: standalone Photograph schema remains`);
  if (redirects.redirects['/' + relative] !== target) errors.push(`redirects.json: /${relative} mismatch`);
}

for (const relative of ['exhibitions/euforia.html', 'hu/exhibitions/euforia.html', 'de-at/exhibitions/euforia.html']) {
  const html = await readFile(path.join(root, relative), 'utf8');
  if (!html.includes('id="peter-magyar-portrait"')) errors.push(`${relative}: embedded portrait anchor missing`);
  if (!html.includes('https://commons.wikimedia.org/wiki/File:Peter-Magyar-portrait-2026.jpg')) errors.push(`${relative}: Commons source missing`);
  if (/href=["'][^"']*works\//.test(html)) errors.push(`${relative}: links to a standalone artwork page remain`);
}

for (const record of registry.records || []) {
  if (String(record.canonicalUrl || '').includes('/works/')) errors.push(`archive-record-registry.json: standalone work record remains ${record.canonicalUrl}`);
}
if (!String(registry.origin || '').includes('MOL Y2K')) errors.push('archive-record-registry.json: corrected MOL Y2K origin missing');

const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
if (/works\/(peter-magyar|magyar-peter)/.test(sitemap)) errors.push('sitemap.xml: standalone portrait URL remains');
const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
if (robots.includes('sitemap-artworks.xml')) errors.push('robots.txt: obsolete artwork sitemap reference remains');

async function mustNotExist(relative) {
  try {
    await access(path.join(root, relative));
    errors.push(`${relative}: obsolete file still exists`);
  } catch {}
}
await mustNotExist('sitemap-artworks.xml');
await mustNotExist('artwork-knowledge-graph.hu.jsonld');
await mustNotExist('archive-audit-diagnostics.txt');
await mustNotExist('reports/page-inventory.md');
await mustNotExist('reports/page-inventory.json');

const historicalExtracts = [
  'about.hu.html', 'artwork-registry.hu.json', 'books.hu.json', 'career-chronology.hu.html',
  'career-chronology.hu.json', 'contact-footer.hu.json', 'family-origins.hu.json',
  'home-intro.hu.json', 'home-meta.hu.json', 'hu-project-page-overrides.json',
  'oeuvre-relations.hu.json', 'press-relations.hu.json', 'project-summaries.hu.json',
  'secondary-pages.hu.json', 'section-intros.hu.json', 'vocabulary-policy.json'
];
for (const file of historicalExtracts) await mustNotExist(path.join('data/archive', file));

const archiveFiles = await readdir(path.join(root, 'data/archive'));
for (const required of ['README.md', 'home-copy.json', 'oeuvre-periods.json', 'domain-ecosystem.hu.json']) {
  if (!archiveFiles.includes(required)) errors.push(`data/archive/${required}: active reference missing`);
}

const css = await readFile(path.join(root, 'assets/css/museum-editorial.css'), 'utf8');
if (!css.includes('18. Canonical life journey')) errors.push('museum-editorial.css: canonical life journey component missing');
if (!css.includes('.life-record-group summary')) errors.push('museum-editorial.css: disclosure spacing rules missing');

const backbone = JSON.parse(await readFile(path.join(root, 'period-evidence-backbone.json'), 'utf8'));
if (!String(backbone.periods?.[0]?.anchorProject?.name || '').includes('MOL Y2K')) errors.push('period-evidence-backbone.json: MOL Y2K origin missing');
if ((backbone.periods?.[0]?.evidence || []).length !== 0) errors.push('period-evidence-backbone.json: personal origin must not claim external evidence');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Life journey audit passed: 9 stages, 20 exhibitions, 3 books, 35 press records, EUFÓRIA-only portrait context and repository cleanup are consistent.');
