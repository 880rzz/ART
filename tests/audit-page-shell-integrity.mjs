/* Page shell integrity.
 *
 * Written after an audit found that the English and German curators pages had
 * the entire <section id="curatorial-periods"> injected inside the cookie
 * dialog. Because #consent is hidden until a visitor has to decide, a whole
 * content section was invisible on those pages, and any visitor who did see
 * the banner got that section inside it. A generator anchored its insertion
 * on the first ".c-actions"-like element in the document rather than inside
 * <main>, so nothing failed loudly.
 *
 * These checks assert the structural invariants every content page must hold,
 * so the same class of silent injection cannot return.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const skip = new Set(['.git', 'node_modules', '.github', 'data']);
const failures = [];
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

/* Return the substring of `html` spanned by the element that starts at
   `startIndex`, counting nested <tag> openings so we stop at the right close. */
function elementAt(html, startIndex, tag) {
  const open = new RegExp(`<${tag}\\b`, 'gi');
  const close = new RegExp(`</${tag}>`, 'gi');
  let depth = 0;
  let i = startIndex;
  while (i < html.length) {
    open.lastIndex = i;
    close.lastIndex = i;
    const o = open.exec(html);
    const c = close.exec(html);
    if (!c) return html.slice(startIndex);
    if (o && o.index < c.index) { depth += 1; i = o.index + o[0].length; continue; }
    depth -= 1;
    i = c.index + c[0].length;
    if (depth === 0) return html.slice(startIndex, i);
  }
  return html.slice(startIndex);
}

let checked = 0;

for (const file of files) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const html = await readFile(file, 'utf8');
  if (/http-equiv=["']refresh["']/i.test(html)) continue;
  if (!/<body\b[^>]*class=["'][^"']*apple-archive/i.test(html)) continue;
  checked += 1;

  /* Every content page carries the same shell: a header nav, the mega menu,
     a main landmark, a footer and the consent dialog its footer advertises. */
  for (const [label, present] of [
    ['header nav', /<nav>/i.test(html)],
    ['mega menu', /id=["']menu["']/i.test(html)],
    ['main landmark', /<main\b/i.test(html)],
    ['footer', /<footer\b/i.test(html)],
  ]) if (!present) failures.push(`${rel}: missing ${label}`);

  /* A cookie-settings control in the footer is only honest if the dialog it
     resets actually exists on the page. */
  if (/class=["'][^"']*consent-reset/i.test(html) && !/id=["']consent["']/i.test(html)) {
    failures.push(`${rel}: footer offers cookie settings but the page has no #consent dialog`);
  }

  const consentIndex = html.search(/<div\b[^>]*id=["']consent["']/i);
  if (consentIndex > -1) {
    const dialog = elementAt(html, consentIndex, 'div');
    /* The dialog holds a notice and its two buttons — nothing else. */
    if (/<section\b/i.test(dialog)) failures.push(`${rel}: a <section> is nested inside the consent dialog`);
    if (/<h[1-4]\b/i.test(dialog)) failures.push(`${rel}: a heading is nested inside the consent dialog`);
    for (const cls of ['c-yes', 'c-no']) {
      if (!new RegExp(`class=["'][^"']*${cls}`, 'i').test(dialog)) {
        failures.push(`${rel}: consent dialog has no .${cls} button`);
      }
    }
    const words = dialog.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    if (words > 60) failures.push(`${rel}: consent dialog holds ${words} words — content has leaked into it`);
  }

  /* Content sections belong to main, never to the dialog or a stray wrapper. */
  const mainStart = html.search(/<main\b/i);
  if (mainStart > -1) {
    const main = elementAt(html, mainStart, 'main');
    for (const id of ['curatorial-periods']) {
      if (html.includes(`id="${id}"`) && !main.includes(`id="${id}"`)) {
        failures.push(`${rel}: #${id} sits outside <main>`);
      }
    }
  }

  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((m) => m[1]);
  const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (dupes.length) failures.push(`${rel}: duplicate id(s) ${dupes.join(', ')}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Page shell integrity audit passed across ${checked} content pages: consistent header, menu, main, footer and a self-contained consent dialog.`);
