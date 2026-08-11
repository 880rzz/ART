/* Navigation and footer parity.
 *
 * An audit found that within each language there were exactly two menu shapes
 * and two footer shapes, and in every language the odd one out was the
 * homepage: inner pages carried a 14-link footer including the contact email,
 * the homepages carried 11–13 links without it, and the Hungarian homepage menu
 * had nine entries where every other Hungarian page had eight. One generator
 * was also deleting a menu entry on every run, so the languages drifted apart
 * silently.
 *
 * These checks assert that a reader meets the same navigation everywhere:
 * one menu shape and one footer shape per language, and the same number of
 * menu entries across all three languages.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
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

function languageOf(rel) {
  if (rel.startsWith('hu/')) return 'hu';
  if (rel.startsWith('de-at/')) return 'de';
  return 'en';
}

/* Compare destinations, not the strings that spell them. A page in
   exhibitions/ legitimately writes "../curators.html" where a page at the
   language root writes "curators.html"; both resolve to the same document and
   must count as the same menu entry. So each href is resolved against the
   directory of the page that carries it, then stripped of the language prefix
   so the three languages can be compared with each other. */
function normaliseHref(href = '', pageRel = '') {
  let value = href.replace(/^https?:\/\/(www\.)?banhalmi\.art/i, '').trim();
  if (!value || /^(mailto:|tel:|https?:)/i.test(value)) return value;

  const [target, fragment = ''] = value.split('#');
  let resolved;
  if (target.startsWith('/')) {
    resolved = target;
  } else {
    const dir = path.posix.dirname('/' + pageRel);
    resolved = path.posix.resolve(dir, target || '.');
  }
  resolved = resolved.replace(/^\/(hu|de-at)(\/|$)/, '/');
  if (resolved === '/') resolved = '/index.html';
  return fragment ? `${resolved}#${fragment}` : resolved;
}

const menus = new Map();
const footers = new Map();
const failures = [];
const approvedHungarianMenuCopy = [
  'Portrék és képtörténetek az elmúlt huszonöt évből.',
  'Húsz kiállítás 2014 óta, New Yorkban, Bécsben, Budapesten és Tihanyban.',
  'Három könyv, amelyeket írókkal, orvosokkal és a képek szereplőivel közösen készítettem.',
  'Ki vagyok, hogyan dolgozom, és miért építem ezt az archívumot.',
  'A katonai dokumentációtól a könyveken és kiállításokon át a mai portrémunkákig.',
  'Interjúk, riportok, kritikák és televíziós anyagok az elmúlt évekből.',
  'Közösségi projektek Tihanyban és Bécsben, valamint oktatás a Bécsi Magyar Iskolában.',
  'Szakmai írások, OM SYSTEM nagyköveti munka, oktatás és szakmai közösségek.',
  'Rövid áttekintés az életmű korszakairól, fontosabb összefüggéseiről és forrásairól.',
  'Portré-, brand- és rendezvényfotózás a szakmai weboldalon.',
  'Vezetői és személyes portrék Bécsben és Budapesten.',
  'Vizuális márkaépítéshez készített fotók cégeknek és szakértőknek.',
  'Konferenciák, gálák és vezetői rendezvények dokumentálása.',
  'Egyedi művészeti megbízások a kiállításokon látható szemlélettel.',
  'Kérjen személyre szabott ajánlatot →',
  'A budapesti és bécsi stúdió elérhetőségei és megközelítése.',
];

for (const file of files) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const html = await readFile(file, 'utf8');
  if (/http-equiv=["']refresh["']/i.test(html)) continue;
  if (!/<body\b[^>]*class=["'][^"']*apple-archive/i.test(html)) continue;

  const lang = languageOf(rel);

  const menuMatch = /<div[^>]*id=["']menu["'][\s\S]*?(?=<main\b|<footer\b)/i.exec(html);
  if (menuMatch) {
    const hrefs = [...menuMatch[0].matchAll(/<a[^>]*class=["'][^"']*m-main[^"']*["'][^>]*href=["']([^"']+)["']/gi)]
      .map((m) => normaliseHref(m[1], rel));
    const shape = hrefs.join(' | ');
    if (!menus.has(lang)) menus.set(lang, new Map());
    if (!menus.get(lang).has(shape)) menus.get(lang).set(shape, []);
    menus.get(lang).get(shape).push(rel);
    if (lang === 'hu') {
      for (const approved of approvedHungarianMenuCopy) {
        if (!menuMatch[0].includes(approved)) {
          failures.push(`menu copy (hu): ${rel} is missing approved text: ${approved}`);
        }
      }
    }
  }

  const footerMatch = /<footer[\s\S]*?<\/footer>/i.exec(html);
  if (footerMatch) {
    const hrefs = [...footerMatch[0].matchAll(/<a[^>]*href=["']([^"']+)["']/gi)].map((m) => normaliseHref(m[1], rel));
    const shape = hrefs.join(' | ');
    if (!footers.has(lang)) footers.set(lang, new Map());
    if (!footers.get(lang).has(shape)) footers.get(lang).set(shape, []);
    footers.get(lang).get(shape).push(rel);
  }
}

function reportVariants(label, collected) {
  for (const [lang, shapes] of collected) {
    if (shapes.size <= 1) continue;
    const ranked = [...shapes.entries()].sort((a, b) => b[1].length - a[1].length);
    const [, majorityPages] = ranked[0];
    const odd = ranked.slice(1);
    const detail = odd
      .map(([, pages]) => `${pages.length} page(s): ${pages.slice(0, 4).join(', ')}`)
      .join('; ');
    failures.push(
      `${label} (${lang}): ${shapes.size} different shapes. ` +
      `${majorityPages.length} pages agree, but ${detail} differ.`
    );
  }
}

reportVariants('menu', menus);
reportVariants('footer', footers);

/* The three languages must offer the same set of destinations. */
const perLanguageMenu = new Map();
for (const [lang, shapes] of menus) {
  const [dominant] = [...shapes.entries()].sort((a, b) => b[1].length - a[1].length);
  perLanguageMenu.set(lang, dominant[0].split(' | ').filter(Boolean));
}
const counts = [...perLanguageMenu].map(([lang, items]) => `${lang}:${items.length}`);
if (new Set([...perLanguageMenu.values()].map((i) => i.length)).size > 1) {
  failures.push(`menu entry counts differ across languages (${counts.join(', ')}) — the menus are not translations of each other`);
}
const [reference] = perLanguageMenu.values();
for (const [lang, items] of perLanguageMenu) {
  const missing = reference.filter((href) => !items.includes(href));
  const extra = items.filter((href) => !reference.includes(href));
  if (missing.length || extra.length) {
    failures.push(`menu (${lang}) diverges: missing ${missing.join(', ') || 'none'}; extra ${extra.join(', ') || 'none'}`);
  }
}

/* Fragment integrity: every same-domain href with a #fragment must resolve to
   a real HTML document and a real id/name in that document. This covers menu
   links, hero CTAs, chronology/press cross-links, footer links and ordinary
   body links across EN, HU and DE. CSS owns viewport offset, so this static
   audit verifies destination correctness independent of desktop/mobile size. */
const htmlByRel = new Map();
for (const file of files) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  htmlByRel.set(rel, await readFile(file, 'utf8'));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resolveFragmentHref(href, pageRel) {
  const value = String(href || '').trim();
  if (!value || /^(mailto:|tel:|javascript:|data:)/i.test(value)) return null;

  let url;
  try {
    url = new URL(value, `https://www.banhalmi.art/${pageRel}`);
  } catch {
    return null;
  }
  if (!/^(www\.)?banhalmi\.art$/i.test(url.hostname) || !url.hash) return null;

  let pathname = decodeURIComponent(url.pathname || '/');
  if (pathname.endsWith('/')) pathname += 'index.html';
  const targetRel = pathname.replace(/^\/+/, '');
  const fragment = decodeURIComponent(url.hash.slice(1));
  if (!fragment) return null;
  return { targetRel, fragment };
}

for (const [rel, html] of htmlByRel) {
  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    const href = match[1];
    const resolved = resolveFragmentHref(href, rel);
    if (!resolved) continue;

    const targetHtml = htmlByRel.get(resolved.targetRel);
    if (!targetHtml) {
      failures.push(`fragment target document missing: ${rel} -> ${href} (${resolved.targetRel})`);
      continue;
    }

    const escaped = escapeRegExp(resolved.fragment);
    const targetPattern = new RegExp(`\\b(?:id|name)=["']${escaped}["']`, 'i');
    if (!targetPattern.test(targetHtml)) {
      failures.push(`fragment target id missing: ${rel} -> ${href} (#${resolved.fragment})`);
    }
  }
}

/* Exhibition catalogue disclosures are structurally absent; Stage 121 guards this contract. */

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  `Navigation parity + fragment audit passed: one menu and one footer shape per language, ` +
  `${[...perLanguageMenu.values()][0].length} matching entries in all three, with all internal fragment targets present.`
);
