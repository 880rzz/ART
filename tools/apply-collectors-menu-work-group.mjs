#!/usr/bin/env node
/**
 * Move collectors into the Work group (4th item after Gallery, Exhibitions, Books)
 * across every static HTML menu. Idempotent: re-running converges to the same markup.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const skip = new Set(['.git', 'node_modules', '.github', 'artifacts', '_site', 'data']);

const COLLECTORS = {
  hu: {
    href: '/hu/curators.html#collectors',
    title: 'Gyűjtőknek',
    desc: 'Információk a művek elérhetőségéről és a gyűjtésről.',
  },
  en: {
    href: '/curators.html#collectors',
    title: 'For collectors',
    desc: 'Information on available works and collecting.',
  },
  de: {
    href: '/de-at/curators.html#collectors',
    title: 'Für Sammler:innen',
    desc: 'Informationen zur Verfügbarkeit von Werken und zum Sammeln.',
  },
};

const COLLECTORS_BLOCK_RE =
  /<a class="m-main"[^>]*\bdata-nav-role="collectors"[^>]*>[\s\S]*?<\/a>(?:\s*<p class="m-desc">[\s\S]*?<\/p>)?/g;

const BOOKS_THEN_GROUP_CLOSE_RE =
  /(<a class="m-main"[^>]*href="[^"]*#books"[^>]*>[\s\S]*?<\/a><p class="m-desc">[\s\S]*?<\/p>)(<\/div>)/;

function languageOf(rel) {
  if (rel.startsWith('hu/') || rel === 'hu') return 'hu';
  if (rel.startsWith('de-at/') || rel === 'de-at') return 'de';
  return 'en';
}

function collectorsMarkup(lang) {
  const c = COLLECTORS[lang];
  return (
    `<a class="m-main" data-nav-role="collectors" href="${c.href}">${c.title}</a>` +
    `<p class="m-desc">${c.desc}</p>`
  );
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function transform(html, lang) {
  if (!html.includes('data-nav-role="collectors"') && !html.includes('id="menu"')) {
    return { html, changed: false, skipped: true };
  }
  if (!html.includes('id="menu"')) return { html, changed: false, skipped: true };

  let next = html.replace(COLLECTORS_BLOCK_RE, '');
  const block = collectorsMarkup(lang);
  if (!BOOKS_THEN_GROUP_CLOSE_RE.test(next)) {
    throw new Error(`Work-group Books destination not found for lang=${lang}`);
  }
  next = next.replace(BOOKS_THEN_GROUP_CLOSE_RE, `$1${block}$2`);

  // Idempotent: if collectors somehow remained duplicated, collapse to one block after Books.
  const roles = [...next.matchAll(/\bdata-nav-role="collectors"/g)];
  if (roles.length !== 1) {
    throw new Error(`Expected exactly one collectors nav role, found ${roles.length}`);
  }
  if (!next.includes(block)) {
    throw new Error('Collectors block with language-correct href/title/desc missing after transform');
  }

  return { html: next, changed: next !== html, skipped: false };
}

const files = walk(root);
let changed = 0;
let touched = 0;
for (const file of files) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('id="menu"')) continue;
  if (!src.includes('data-nav-role="collectors"') && !/<h3 class="m-group-title">(?:A mű|The work|Das Werk)<\/h3>/.test(src)) {
    continue;
  }
  touched += 1;
  const lang = languageOf(rel);
  const result = transform(src, lang);
  if (result.skipped) continue;
  if (result.changed) {
    fs.writeFileSync(file, result.html);
    changed += 1;
  }
}

console.log(
  `Collectors menu: Work-group placement applied across ${touched} menu pages (${changed} files rewritten).`
);
