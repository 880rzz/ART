/* Language purity.
 *
 * Every page should read in its own language. What made this worth automating
 * is that the failures were small and invisible: on the EUFÓRIA page the press
 * list carried English descriptors ("report in Russian", "the story of the
 * photograph") in all three languages, and the community page labelled its
 * exhibitions "(photography)" on the Hungarian and German versions too. Nobody
 * notices four words; they just make the page feel unfinished.
 *
 * Two things this audit is careful about, because a naive version is worse
 * than none:
 *
 *   Proper nouns are not prose. A Hungarian article title stays Hungarian on
 *   the German page — that is archival accuracy, not a defect. Any segment
 *   whose words are mostly capitalised is treated as a name and skipped.
 *
 *   Only unambiguous function words count. "a" is both the Hungarian definite
 *   article and the English indefinite article; "in" and "was" belong to
 *   English and German alike. With those in the vocabulary the detector
 *   reported plain English prose as Hungarian — 34 of its first 50 findings
 *   were false. They are excluded rather than weighted.
 *
 * Segments listed in ALLOWED are deliberate: titles of Hungarian-language
 * articles on the English and German writing pages, where the standfirst says
 * in each language that the articles are in Hungarian.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

/* JavaScript's \b is ASCII-only: in "láthatóvá" the accented letters count as
   non-word characters, so /\bthat\b/ matches inside a Hungarian word and the
   segment is reported as English. Unicode-aware boundaries are built from
   lookarounds instead, with the u flag. */
const boundary = (alternatives) =>
  new RegExp(`(?<![\\p{L}\\p{N}_])(?:${alternatives})(?![\\p{L}\\p{N}_])`, 'giu');

const MARKERS = {
  hu: boundary('az|és|hogy|nem|volt|egy|ez|de|már|még|csak|vagy|amikor|mint|ban|ben|nak|nek|ról|ről|tól|től|val|vel|című|szerint'),
  en: boundary('the|and|of|to|that|with|but|are|from|which|this|his|her|had|were|been|their|about|report|commentary|interview|story|photography|member|usage|on|by'),
  de: boundary('der|die|das|und|ist|nicht|von|mit|den|dem|ein|eine|auch|sich|auf|für|wurde|dass|als|aus|bei|nach|über|einer|meinen|eigenen|worten|wenn|sie'),
};
const HU_ACCENTS = /[őűáéíóöúüÁÉÍÓÖŐÚÜŰ]/;
const DE_UMLAUTS = /[äöüßÄÖÜ]/;

/* Titles of Hungarian-language articles, shown as themselves on every page. */
const ALLOWED = new Set([
  'Amikor csak egy táncpartnered van egész estére',
  'Amikor kéznél van pár Lume Cube',
  'A legkisebbel a nagyok között',
  'Aktfotózás otthon, a fürdőszobában',
  'RGB fotózás – az új trend',
  'Egy kezdő fotós New Yorkban',
]);

function languageOf(rel) {
  if (rel.startsWith('hu/')) return 'hu';
  if (rel.startsWith('de-at/')) return 'de';
  return 'en';
}

function isProperNoun(segment) {
  const words = segment.match(/[A-Za-zÀ-ſ][\wÀ-ſ’'-]*/g) || [];
  if (!words.length) return true;
  return words.filter((w) => w[0] === w[0].toUpperCase()).length / words.length >= 0.6;
}

function detect(segment) {
  const lower = segment.toLowerCase();
  const total = Math.max((lower.match(/[\wÀ-ſ’'-]+/g) || []).length, 1);
  const scores = {};
  for (const [lang, re] of Object.entries(MARKERS)) {
    scores[lang] = ((lower.match(re) || []).length) / total;
  }
  if (HU_ACCENTS.test(segment)) scores.hu += 0.05;
  if (DE_UMLAUTS.test(segment)) scores.de += 0.05;
  const best = Object.keys(scores).reduce((a, b) => (scores[a] >= scores[b] ? a : b));
  const ranked = Object.values(scores).sort((a, b) => b - a);
  return { best, confidence: scores[best], margin: ranked[0] - ranked[1] };
}

/* Text-bearing elements, minus anything a browser would not render. */
const TEXT_TAGS = /<(p|h1|h2|h3|h4|li|blockquote|figcaption|dd|summary)\b[^>]*>([\s\S]*?)<\/\1>/gi;
/* Also split on brackets, so an exhibition title and the genre label
   beside it are judged separately: "The Frame" is a name, "(digitális
   fotográfia)" is prose that must match the page. */
const SEGMENT = /\s+[—–]\s+|\s*·\s*|\s*\|\s*|\s*[()]\s*/;

const skip = new Set(['.git', 'node_modules', '.github', 'data']);
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}
await walk(root);

const failures = [];
let pages = 0;
let segments = 0;

for (const file of files) {
  const html = await readFile(file, 'utf8');
  if (/http-equiv=["']refresh["']/i.test(html)) continue;
  if (!/<body\b[^>]*class=["'][^"']*apple-archive/i.test(html)) continue;
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const want = languageOf(rel);
  pages += 1;

  const main = /<main\b[\s\S]*?<\/main>/i.exec(html);
  if (!main) continue;
  const body = main[0].replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, '');

  for (const match of body.matchAll(TEXT_TAGS)) {
    if (/<(p|li|h1|h2|h3|h4|blockquote)\b/i.test(match[2])) continue; // container, not a leaf
    const text = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    for (const raw of text.split(SEGMENT)) {
      const segment = raw.replace(/^[\s.,;]+|[\s.,;]+$/g, '');
      if (segment.split(/\s+/).length < 4) continue;
      if (isProperNoun(segment) || ALLOWED.has(segment)) continue;
      segments += 1;
      const { best, confidence, margin } = detect(segment);
      if (best !== want && margin > 0.05 && confidence > 0.09) {
        failures.push(`${rel} [${want} page]: reads as ${best} — “${segment.slice(0, 110)}”`);
      }
    }
  }
}

if (failures.length) {
  console.error(
    `${failures.length} text segment(s) are not in their page's language:\n\n` +
    failures.join('\n') +
    `\n\nIf a segment is a proper noun or a title that must stay in its original ` +
    `language, add it to ALLOWED in this file with a note about why.`
  );
  process.exit(1);
}
console.log(`Language purity audit passed: ${segments} descriptive segments across ${pages} pages, each in its page's language.`);
