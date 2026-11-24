import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Public, read-only editorial guard. Private correspondence is never a test fixture.
const ROOT = path.resolve(import.meta.dirname, '..');
const projects = [
  'avalosag', 'balerina-project-new-york', 'enano', 'fotokiallitas1',
  'fotokiallitas2', 'fotokiallitas3', 'fotokiallitas4', 'fotokiallitas5',
  'theframe', 'themensdream', 'szosszenetek', 'teislehetsz', 'mas-kepp-mas',
  'anovilaga', 'femmefatale', 'fotokiallitas8', 'merfoldkovek1956', 'touch-wien',
  'ebredes', 'euforia'
];
const locales = {
  hu: { prefix: 'hu/', firstPerson: /(?:engem|nekem|számomra|szerettem|fotóztam|fényképeztem|voltam|készítettem|figyeltem|mutattam|foglalkoztam|kerestem|szeretnék)/i },
  en: { prefix: '', firstPerson: /\b(?:I|me|my)\b/ },
  de: { prefix: 'de-at/', firstPerson: /\b(?:ich|mich|mir|mein|meine|meinen)\b/i },
};
const inflatedClaims = [
  /lump in my throat|my muse|digital surgery|first real statement|perfect arabesque|quiet rehearsal|wonderfully strange|cynicism.{0,25}hygiene/i,
  /Kloß im Hals|meine Muse|digitale Chirurgie|erste echte Aussage|perfekte Arabeske|stille Generalprobe|wunderbar seltsam|Zynismus.{0,25}Hygiene/i,
  /gombóc nélkül|a múzsám adta|digitális sebészet|első igazi állításom|gombóc nélkül|csodálatosan furcsa|csendes főpróba|cinizmus.{0,25}higiénia/i,
];
const errors = [];
for (const slug of projects) {
  for (const [lang, { prefix, firstPerson }] of Object.entries(locales)) {
    const rel = prefix + 'exhibitions/' + slug + '.html';
    const source = await readFile(path.join(ROOT, rel), 'utf8');
    const main = source.indexOf('<main');
    const start = source.indexOf('<section class="wrap narrow">', main);
    const end = source.indexOf('</section>', start);
    if (main < 0 || start < 0 || end < 0) {
      errors.push(rel + ': exhibition introduction not found');
      continue;
    }
    const intro = source.slice(start, end + '</section>'.length);
    const leads = [...intro.matchAll(/<p class="lead">([\s\S]*?)<\/p>/g)].map(m => m[1]);
    const expected = slug === 'euforia' ? 5 : slug === 'ebredes' ? 3 : 2;
    if (leads.length !== expected) errors.push(rel + ': expected ' + expected + ' complete paragraphs');
    const text = leads.join(' ').replace(/<[^>]*>/g, ' ');
    if (!firstPerson.test(text)) errors.push(rel + ': personal perspective missing');
    if (inflatedClaims.some(pattern => pattern.test(text))) errors.push(rel + ': ungrounded theatrical phrasing returned');
    if (/mail\.google\.com|gmail\.com\/mail|thread_id|message_id|Reply-To:/i.test(intro))
      errors.push(rel + ': private correspondence indicator in public intro');
  }
}
// Artist-voice release guard: only six archival home/press introductions are eligible.
// Commission enquiries and private-photography templates are deliberately excluded.
const authoredArchiveIntros = [
  ['index.html', 'lead', 'I have photographed people since 1999. Today I work primarily from Vienna, and Budapest is still part of my practice.'],
  ['hu/index.html', 'lead', '1999 óta fényképezek. A fő bázisom Bécs, és Budapesten is dolgozom.'],
  ['de-at/index.html', 'lead', 'Seit 1999 fotografiere ich Menschen. Heute arbeite ich vor allem von Wien aus, aber auch in Budapest.'],
  ['press.html', 'press-hero__lead', 'I have collected interviews, articles, reports and films'],
  ['hu/press.html', 'press-hero__lead', 'Itt gyűjtöttem össze azokat az interjúkat, cikkeket, riportokat és filmeket'],
  ['de-at/press.html', 'press-hero__lead', 'Hier habe ich Interviews, Artikel, Berichte und Filme zusammengetragen'],
];
for (const [rel, role, needle] of authoredArchiveIntros) {
  const html = await readFile(path.join(ROOT, rel), 'utf8');
  const intro = html.match(new RegExp('<p class="' + role + '">([\\s\\S]*?)<\\/p>'))?.[1];
  if (!intro || !intro.includes(needle)) errors.push(rel + ': archival author voice absent');
  if (intro && /(?:request a quote|ask for an offer|book (?:a )?session|data-private-quote|data-private-enquiry|Angebot anfordern|árajánlatkérés)/i.test(intro))
    errors.push(rel + ': commercial lead-generation wording returned to archival lead');
}
if (errors.length) {
  console.error('ART VOICE / PRIVACY CONTRACT FAILED');
  for (const error of errors) console.error(' - ' + error);
  process.exit(1);
}
console.log('ART VOICE / PRIVACY CONTRACT PASSED: ' + projects.length * 3 + ' localized exhibition introductions');
