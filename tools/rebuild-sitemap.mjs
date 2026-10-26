#!/usr/bin/env node
/**
 * Rebuild sitemap.xml from the committed HTML inventory.
 * Never accept truncated tool output; emit only well-formed XML.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://www.banhalmi.art';
const sitemapPath = path.join(root, 'sitemap.xml');
const skipDirParts = new Set(['node_modules', '.git', 'tests', 'tools', 'docs', 'assets']);

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full);
    if (entry.isDirectory()) {
      if (skipDirParts.has(entry.name)) continue;
      if (rel.split(path.sep).some((p) => skipDirParts.has(p))) continue;
      walkHtml(full, out);
      continue;
    }
    if (!entry.name.endsWith('.html')) continue;
    out.push(rel.split(path.sep).join('/'));
  }
  return out;
}

function isIndexable(rel) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  if (/http-equiv=["']refresh["']/i.test(html)) return false;
  if (/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) return false;
  return true;
}

function familyKey(rel) {
  if (rel.startsWith('hu/')) return rel.slice(3);
  if (rel.startsWith('de-at/')) return rel.slice(6);
  return rel;
}

function locFor(rel) {
  if (rel === 'index.html') return `${origin}/`;
  if (rel === 'hu/index.html') return `${origin}/hu/`;
  if (rel === 'de-at/index.html') return `${origin}/de-at/`;
  return `${origin}/${rel}`;
}

function gitDate(rel) {
  if (!fs.existsSync(path.join(root, rel))) return null;
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', rel], {
      cwd: root,
      encoding: 'utf8',
    }).trim() || null;
  } catch {
    return null;
  }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const files = walkHtml(root).filter(isIndexable).sort();
const families = new Map();
for (const rel of files) {
  const key = familyKey(rel);
  const bucket = families.get(key) || {};
  if (rel.startsWith('hu/')) bucket.hu = rel;
  else if (rel.startsWith('de-at/')) bucket.de = rel;
  else bucket.en = rel;
  families.set(key, bucket);
}

const entries = [];
for (const [, langs] of [...families.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  // Prefer complete triads; skip orphan fragments (should not occur after filter).
  const members = [
    langs.en && { lang: 'en', rel: langs.en },
    langs.hu && { lang: 'hu-HU', rel: langs.hu },
    langs.de && { lang: 'de-AT', rel: langs.de },
  ].filter(Boolean);
  if (!members.length) continue;

  const hrefByLang = Object.fromEntries(members.map((m) => [m.lang, locFor(m.rel)]));
  const xDefault = hrefByLang.en || hrefByLang['hu-HU'] || hrefByLang['de-AT'];

  for (const member of members) {
    const loc = locFor(member.rel);
    const lastmod = gitDate(member.rel) || new Date().toISOString().slice(0, 10);
    const links = [
      { hreflang: 'x-default', href: xDefault },
      ...Object.entries(hrefByLang).map(([hreflang, href]) => ({ hreflang, href })),
    ];
    // Stable order: x-default, en, de-AT, hu-HU when present
    const order = ['x-default', 'en', 'de-AT', 'hu-HU'];
    links.sort((a, b) => order.indexOf(a.hreflang) - order.indexOf(b.hreflang));
    const linkXml = links
      .map(
        (l) =>
          `<xhtml:link rel="alternate" hreflang="${escapeXml(l.hreflang)}" href="${escapeXml(l.href)}"/>`,
      )
      .join('');
    entries.push(
      `<url><loc>${escapeXml(loc)}</loc>${linkXml}<lastmod>${escapeXml(lastmod)}</lastmod><changefreq>monthly</changefreq></url>`,
    );
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;

if (/Warning:\s*truncated|tokens truncated|Total output lines:/i.test(xml)) {
  console.error('Refusing to write sitemap with tool-residue markers.');
  process.exit(1);
}

fs.writeFileSync(sitemapPath, xml);
console.log(`Rebuilt sitemap.xml with ${entries.length} URL entries from ${files.length} indexable HTML files.`);
