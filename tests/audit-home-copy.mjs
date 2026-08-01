/* The three homepages carry the approved editorial copy.
 *
 * This copy has a history. It used to live as a hard-coded table inside a
 * generator, and that table had gone stale: every run silently reverted the
 * works lead and the Hungarian hero subtitle to older wording. The generator
 * is gone, so nothing can revert it now — but the copy is still the most
 * carefully worked text on the site, and it sits in three separate files that
 * nobody diffs against each other.
 *
 * data/archive/home-copy.json is the reference. This audit checks the pages
 * still say what it says. If you deliberately change a homepage, change the
 * JSON in the same commit — that is the whole contract.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const copy = JSON.parse(await readFile(path.join(root, 'data/archive/home-copy.json'), 'utf8'));

/* Compare as a reader would, not as a byte stream: entities decoded,
   whitespace collapsed, typographic and straight quotes treated alike. */
const ENTITIES = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
  '&nbsp;': ' ', '&hellip;': '…', '&mdash;': '—', '&ndash;': '–',
  '&middot;': '·', '&bdquo;': '"', '&ldquo;': '"', '&rdquo;': '"', '&rsquo;': "'",
};
const normalise = (s) =>
  s.replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? e)
    .replace(/[“”„]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const failures = [];
let checked = 0;

for (const [page, fields] of Object.entries(copy.pages)) {
  const html = await readFile(path.join(root, page), 'utf8');
  const text = normalise(html);
  for (const [field, expected] of Object.entries(fields)) {
    checked += 1;
    if (!text.includes(normalise(expected))) {
      failures.push(
        `${page} → ${field}\n     expected: “${expected.slice(0, 120)}${expected.length > 120 ? '…' : ''}”`
      );
    }
  }
}

if (failures.length) {
  console.error(
    `${failures.length} homepage passage(s) no longer match data/archive/home-copy.json:\n\n` +
    failures.join('\n') +
    `\n\nIf the page is right and the JSON is out of date, update ` +
    `data/archive/home-copy.json to match. Never leave the two disagreeing.`
  );
  process.exit(1);
}
console.log(`Home copy audit passed: ${checked} passages across ${Object.keys(copy.pages).length} homepages match the approved copy.`);
