import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const directories = ['hu/books', 'hu/exhibitions'];
const changed = [];

function attr(html, pattern, label) {
  const value = html.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`${label} nem található`);
  return value;
}

for (const relDir of directories) {
  const dir = path.join(root, relDir);
  const names = (await readdir(dir)).filter((name) => name.endsWith('.html')).sort();

  for (const name of names) {
    const rel = `${relDir}/${name}`;
    const file = path.join(root, rel);
    const original = await readFile(file, 'utf8');
    let html = original;

    const title = attr(html, /<meta property="og:title" content="([^"]+)">/, `${rel}: og:title`);
    const description = attr(html, /<meta property="og:description" content="([^"]+)">/, `${rel}: og:description`);
    const imageAlt = attr(html, /<meta property="og:image:alt" content="([^"]+)">/, `${rel}: og:image:alt`);

    html = html.replace(/<meta property="og:locale" content="[^"]+">/, '<meta property="og:locale" content="hu_HU">');

    if (!html.includes('<meta property="og:locale:alternate" content="en_US">')) {
      html = html.replace(
        '<meta property="og:locale" content="hu_HU">',
        '<meta property="og:locale" content="hu_HU">\n<meta property="og:locale:alternate" content="en_US">\n<meta property="og:locale:alternate" content="de_AT">'
      );
    }

    if (!html.includes('<meta name="twitter:title"')) {
      html = html.replace(
        '<meta name="twitter:card" content="summary_large_image">',
        `<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${title}">\n<meta name="twitter:description" content="${description}">`
      );
    } else {
      html = html.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${title}">`);
      html = html.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${description}">`);
    }

    if (!html.includes('<meta name="twitter:image:alt"')) {
      html = html.replace(
        /(<meta name="twitter:image" content="[^"]+">)/,
        `$1\n<meta name="twitter:image:alt" content="${imageAlt}">`
      );
    } else {
      html = html.replace(/<meta name="twitter:image:alt" content="[^"]*">/, `<meta name="twitter:image:alt" content="${imageAlt}">`);
    }

    if (html !== original) {
      await writeFile(file, html, 'utf8');
      changed.push(rel);
    }
  }
}

console.log(JSON.stringify({ changed, total: changed.length }, null, 2));
