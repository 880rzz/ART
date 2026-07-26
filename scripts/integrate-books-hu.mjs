import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pages = JSON.parse(await readFile(path.join(root, 'data/archive/books.hu.json'), 'utf8'));
const changed = [];

function plain(value = '') {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function firstParagraph(value = '') {
  return plain(value.match(/<p class="lead">([\s\S]*?)<\/p>/)?.[1] || value);
}

function escapeAttribute(value = '') {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function removeLegacyGeoMeta(html) {
  return html
    .replace(/\n?<meta name="geo\.region"[^>]*>/g, '')
    .replace(/\n?<meta name="geo\.placename"[^>]*>/g, '')
    .replace(/\n?<meta name="ICBM"[^>]*>/g, '')
    .replace(/\n?<meta name="geo\.position"[^>]*>/g, '');
}

for (const [rel, page] of Object.entries(pages)) {
  const file = path.join(root, rel);
  const original = await readFile(file, 'utf8');
  let html = original;

  html = html.replace(
    /<p class="label" style="margin-bottom:\.4rem">[^<]*<\/p>/,
    `<p class="label" style="margin-bottom:.4rem">${page.labelNew}</p>`
  );

  const bookTextPattern = /(<div class="book-text">\s*<p class="label" style="margin-bottom:\.4rem">[^<]*<\/p>)([\s\S]*?)(\s*<p class="meta">)/;
  if (!bookTextPattern.test(html)) throw new Error(`${rel}: a könyvszöveg blokk nem található`);
  html = html.replace(bookTextPattern, `$1\n    ${page.bodyNew.trim()}$3`);

  const description = firstParagraph(page.bodyNew);
  const escapedDescription = escapeAttribute(description);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapedDescription}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapedDescription}">`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escapedDescription}">`);
  html = removeLegacyGeoMeta(html);

  html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (match, open, jsonText, close) => {
    const graph = JSON.parse(jsonText);
    const book = graph['@graph']?.find((node) => node['@type'] === 'Book');
    if (!book) throw new Error(`${rel}: Book schema nem található`);
    book.description = description;
    return `${open}${JSON.stringify(graph)}${close}`;
  });

  const backSection = '<section class="wrap narrow"><a class="btn" href="../index.html#books">← Összes könyv</a></section>';
  if (!html.includes(page.related)) {
    if (!html.includes(backSection)) throw new Error(`${rel}: a könyv-visszalépő szakasz nem található`);
    html = html.replace(backSection, `${page.related}\n${backSection}`);
  }

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    changed.push(rel);
  }
}

console.log(JSON.stringify({ changed }, null, 2));
