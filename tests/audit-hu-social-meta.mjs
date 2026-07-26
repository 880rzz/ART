import { readFile, readdir } from 'node:fs/promises';

const roots = [
  new URL('../hu/books/', import.meta.url),
  new URL('../hu/exhibitions/', import.meta.url),
];
const failures = [];
let count = 0;

function match(html, pattern) {
  return html.match(pattern)?.[1]?.trim() || '';
}

for (const root of roots) {
  const names = (await readdir(root)).filter((name) => name.endsWith('.html')).sort();
  for (const name of names) {
    count += 1;
    const html = await readFile(new URL(name, root), 'utf8');
    const title = match(html, /<meta property="og:title" content="([^"]+)">/);
    const description = match(html, /<meta property="og:description" content="([^"]+)">/);
    const imageAlt = match(html, /<meta property="og:image:alt" content="([^"]+)">/);
    const twitterTitle = match(html, /<meta name="twitter:title" content="([^"]+)">/);
    const twitterDescription = match(html, /<meta name="twitter:description" content="([^"]+)">/);
    const twitterImageAlt = match(html, /<meta name="twitter:image:alt" content="([^"]+)">/);

    if (!html.includes('<meta property="og:locale" content="hu_HU">')) failures.push(`${name}: hibás og:locale`);
    if (!html.includes('<meta property="og:locale:alternate" content="en_US">')) failures.push(`${name}: hiányzó angol OG locale`);
    if (!html.includes('<meta property="og:locale:alternate" content="de_AT">')) failures.push(`${name}: hiányzó német OG locale`);
    if (!title || twitterTitle !== title) failures.push(`${name}: twitter:title nincs szinkronban`);
    if (!description || twitterDescription !== description) failures.push(`${name}: twitter:description nincs szinkronban`);
    if (!imageAlt || twitterImageAlt !== imageAlt) failures.push(`${name}: twitter:image:alt nincs szinkronban`);
  }
}

for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`Audited ${count} Hungarian archive pages for social metadata.`);
if (failures.length) process.exitCode = 1;
