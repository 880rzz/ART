/* The defects of 2 August, locked shut.
 *
 * Each check below exists because the thing it forbids was actually on the live
 * site today, and in every case it survived a full pass of the other audits.
 * They are all statically decidable: what a browser computes still needs a
 * browser, but a rule that must not exist can be found in the stylesheet.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const failures = [];

const css = {};
for (const name of (await readdir(path.join(root, 'assets/css'))).filter((f) => f.endsWith('.css'))) {
  css[name] = await readFile(path.join(root, 'assets/css', name), 'utf8');
}
const allCss = Object.entries(css);

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

/* 1. Photographs keep their own shape.
   The equal 4:3 plate cropped nothing but letterboxed everything: a 420×315
   cell holding a 420×280 photograph, 89% filled, an empty band under every
   landscape picture in a photographic archive. */
for (const [name, text] of allCss) {
  const body = strip(text);
  if (/aspect-ratio\s*:\s*4\s*\/\s*3/.test(body)) {
    failures.push(`${name}: sets aspect-ratio 4/3 — gallery plates must keep the photograph's own ratio`);
  }
  for (const m of body.matchAll(/([^{}]+)\{[^}]*object-fit\s*:\s*cover[^}]*\}/g)) {
    const sel = m[1].trim();
    if (/collage|gallery|gal-batch|galwrap|figure|art-gallery|data-gallery/.test(sel)) {
      failures.push(`${name}: object-fit:cover on "${sel.slice(0, 60)}" — a normal gallery image is never cropped`);
    }
  }
}

/* 2. `anywhere` is not a typographic setting.
   Applied to every paragraph, heading, list item, link and span, it lets a
   heading in a narrow column collapse to one letter per line. It belongs on
   URLs and identifiers, nowhere else. */
for (const [name, text] of allCss) {
  for (const m of strip(text).matchAll(/([^{}]+)\{[^}]*overflow-wrap\s*:\s*anywhere[^}]*\}/g)) {
    const sel = m[1].trim();
    if (/\b(h1|h2|h3|h4|p|li)\b/.test(sel) && !/meta|fineprint|socials|story-source|loc\b|code|kbd|samp/.test(sel)) {
      failures.push(`${name}: overflow-wrap:anywhere on typography — "${sel.slice(0, 70)}"`);
    }
  }
}

/* 3. The timeline year column cannot grow.
   .t-item is a two-column grid, but 87 of them carry three or four children.
   Auto-placement dropped the paragraphs back into the year track, which was
   sized auto, so it grew to 745px and the content column collapsed to zero —
   a heading nine pixels wide, eighteen lines, 1.1 characters a line. WebKit
   showed it far more readily than Chromium. */
{
  const owner = css['archive-system.css'] ?? '';
  if (/\.timeline>\*[^{]*\{[^}]*grid-template-columns\s*:\s*minmax\([^,]+,\s*auto\)/.test(strip(owner))) {
    failures.push('archive-system.css: the timeline year track is sized auto — cap it, or a stray child will stretch it');
  }
  if (!/\.timeline>\*>\*:not\(\.yr\)/.test(owner)) {
    failures.push('archive-system.css: timeline children are not pinned to their grid columns');
  }
}

/* 4. .svc-cta is two components, not one.
   The same class serves the commissions button in main and the entry in the
   mega-menu. A single global button rule claimed both, and the menu got a
   bordered plate whose horizontal padding another sheet then zeroed, so the
   label sat flush against its own frame. */
for (const [name, text] of allCss) {
  for (const m of strip(text).matchAll(/([^{}]*\.svc-cta[^{}]*)\{/g)) {
    const sel = m[1].trim();
    const scoped = /(^|,)\s*[^,]*(#menu|\bmain\b|details\.svc)[^,]*\.svc-cta/.test(sel) ||
                   sel.split(',').every((s) => /#menu|\bmain\b|details\.svc/.test(s));
    if (!scoped) {
      failures.push(`${name}: .svc-cta styled without saying where — "${sel.slice(0, 70)}". Scope it to main or #menu.`);
    }
  }
}

/* 5. No language marker that the translation has made untrue.
   "Life story (HU)" and "Lebensgeschichte (HU)" stayed on the English and
   German 1956 pages after the testimonies were translated. */
const htmlFiles = [];
const skip = new Set(['.git', 'node_modules', '.github', 'reports', 'audit-artifacts']);
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
await walk(root);

const VAGUE = /(^|>)\s*(Tovább|Bővebben|Megnyitás|Részletek|Kattintson ide|Click here|Read more|More|Weiter|Mehr|Hier klicken)\s*(<|$)/;
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  if (/\((HU|EN|DE)\)/.test(html.replace(/<!--[\s\S]*?-->/g, ''))) {
    failures.push(`${rel}: carries a "(HU)"-style language marker — say it in the page's own language or drop it`);
  }
  /* 6. A link must name its destination. */
  for (const m of html.matchAll(/<a\b[^>]*>([^<]{1,24})<\/a>/g)) {
    if (VAGUE.test('>' + m[1] + '<')) {
      failures.push(`${rel}: link labelled "${m[1].trim()}" — name the destination instead`);
    }
  }
}

/* 7. A section that carries a background must be full width.
   <section class="intro"> was given the 728px reading measure, so the raised
   tone painted only half the page and read as a stray dark box. */
if (/(^|,|\s)\.intro\s*[,{][^}]*max-width/.test(strip(css['archive-system.css'] ?? '')) &&
    !/:not\(section\)/.test(css['archive-system.css'] ?? '')) {
  failures.push('archive-system.css: the reading measure reaches <section class="intro"> — a toned section must be full width');
}

/* 8. Two kinds of dated list, two orders — and the difference is declared.
 *
 * A catalogue answers "what is there": the reader wants the latest work first.
 * Community and teaching was neither ascending nor descending — 2020, 2024,
 * 2024, 2026, 2025, 2021 in all three languages, wrong in either direction.
 * Exhibitions ran oldest-first across twenty entries.
 *
 * An account answers "how did this happen": reversing it turns cause into
 * effect. The career arc runs from the family background to the present.
 *
 * The first attempt at this check tried to infer which was which from the
 * markup — a timeline whose every entry links somewhere is a catalogue — and
 * it was wrong: only two of the six community entries carry a link. So the
 * intent is declared instead, in data-chronology, where the next person to
 * edit the page can see it. A dated timeline without the attribute fails,
 * because silence is how the jumbled order survived in the first place.
 */
const NARRATIVE_TAIL = /jelen|present|gegenwart|fejlesztés|development|entwicklung/i;
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const main = /<main\b[\s\S]*?<\/main>/i.exec(html);
  if (!main) continue;
  for (const open of main[0].matchAll(/<div class="timeline"([^>]*)>/g)) {
    let depth = 0;
    let i = open.index;
    while (i < main[0].length) {
      if (main[0].startsWith('<div', i)) depth += 1;
      else if (main[0].startsWith('</div>', i)) {
        depth -= 1;
        if (depth === 0) { i += 6; break; }
      }
      i += 1;
    }
    const block = main[0].slice(open.index, i);
    const items = [...block.matchAll(/<div class="t-item">([\s\S]*?)<\/div>/g)].map((m) => m[1]);
    if (items.length < 3) continue;
    const years = items.map((it) => {
      const yr = /<span class="yr">([\s\S]*?)<\/span>/.exec(it);
      const text = yr ? yr[1].replace(/<[^>]+>/g, '') : '';
      const found = [...text.matchAll(/(?:19|20)\d{2}/g)].map((m) => Number(m[0]));
      return { year: found.length ? Math.max(...found) : null, text: text.trim() };
    });
    const dated = years.filter((y) => y.year !== null).map((y) => y.year);
    if (dated.length < 3) continue;

    const kind = /data-chronology="(catalogue|account)"/.exec(open[1] || '')?.[1];
    if (!kind) {
      failures.push(`${rel}: a dated timeline does not say whether it is a catalogue or an account — add data-chronology`);
      continue;
    }
    if (kind === 'catalogue') {
      if (!dated.every((y, n) => n === 0 || dated[n - 1] >= y)) {
        failures.push(`${rel}: catalogue timeline is not newest-first — ${dated.join(', ')}`);
      }
    } else {
      if (!dated.every((y, n) => n === 0 || dated[n - 1] <= y)) {
        failures.push(`${rel}: account is not in chronological order — ${dated.join(', ')}`);
      }
      const undated = years.map((y, n) => (y.year === null ? n : -1)).filter((n) => n >= 0);
      for (const n of undated) {
        if (n < years.length - 2 && !NARRATIVE_TAIL.test(years[n].text)) {
          failures.push(`${rel}: undated entry "${years[n].text}" sits mid-sequence`);
        }
      }
    }
  }
}

if (failures.length) {
  console.error(`${failures.length} design regression(s):\n\n` + failures.join('\n'));
  process.exit(1);
}
console.log(
  `Design regression audit passed across ${allCss.length} stylesheets and ${htmlFiles.length} pages: ` +
  `natural image ratios, typographic wrapping, timeline columns, scoped CTAs, honest language labels, ` +
  `named link destinations, full-width toned sections.`
);
