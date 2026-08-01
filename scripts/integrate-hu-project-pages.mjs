import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { requireExplicitRun } from './lib/one-time-migration.mjs';
requireExplicitRun('integrate-hu-project-pages', 'Overwrites the meta descriptions of the Hungarian project pages.');

const root = path.resolve(import.meta.dirname, '..');
const overrides = JSON.parse(await readFile(path.join(root, 'data/archive/hu-project-page-overrides.json'), 'utf8'));

async function listHtml(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listHtml(full));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function text(html, regex) {
  return html.match(regex)?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || '';
}

function setTag(html, regex, replacement, file, label) {
  if (!regex.test(html)) throw new Error(`${file}: hiányzó ${label}`);
  return html.replace(regex, replacement);
}

const files = [
  ...await listHtml(path.join(root, 'hu/books')),
  ...await listHtml(path.join(root, 'hu/exhibitions')),
];
const changed = [];

for (const file of files) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const original = await readFile(file, 'utf8');
  let html = original;

  const h1 = text(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const oldTitle = text(html, /<title>([\s\S]*?)<\/title>/i);
  const oldDescription = text(html, /<meta name="description" content="([^"]*)">/i);
  if (!h1) throw new Error(`${rel}: hiányzó H1`);

  const isBook = rel.includes('/books/');
  const year = oldTitle.match(/\((\d{4}(?:[–-]\d{4})?)\)/)?.[1]
    || oldTitle.match(/(?:·|—)\s*(\d{4}(?:[–-]\d{4})?)/)?.[1]
    || '';
  const typeLabel = isBook ? 'könyv' : 'kiállítás';
  const archiveTitle = `${h1}${year ? ` (${year})` : ''} | ${typeLabel} | BANHALMI ART`;
  const description = overrides[rel]?.description || oldDescription;

  html = setTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${archiveTitle}</title>`, rel, 'title');
  html = setTag(html, /<meta name="description" content="[^"]*">/i, `<meta name="description" content="${description}">`, rel, 'meta description');
  html = setTag(html, /<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${archiveTitle}">`, rel, 'og:title');
  html = setTag(html, /<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${description}">`, rel, 'og:description');
  html = setTag(html, /<meta property="og:image:alt" content="[^"]*">/i, `<meta property="og:image:alt" content="${h1} — ${typeLabel} a BANHALMI ART archívumban">`, rel, 'og:image:alt');

  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
  if (jsonLd) {
    try {
      const graph = JSON.parse(jsonLd);
      const nodes = Array.isArray(graph['@graph']) ? graph['@graph'] : [];
      const pageNode = nodes.find((node) => node && typeof node === 'object' && ['CreativeWork','Book','VisualArtwork','ExhibitionEvent','WebPage'].some((t) => Array.isArray(node['@type']) ? node['@type'].includes(t) : node['@type'] === t) && node.url?.includes(rel.replace(/^hu\//, '/hu/')));
      if (pageNode) {
        pageNode.name = h1;
        pageNode.headline = h1;
        pageNode.description = description;
        pageNode.inLanguage = 'hu-HU';
        html = html.replace(jsonLd, JSON.stringify(graph));
      }
    } catch (error) {
      throw new Error(`${rel}: hibás JSON-LD: ${error.message}`);
    }
  }

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    changed.push(rel);
  }
}

console.log(JSON.stringify({ changed, count: changed.length }, null, 2));
