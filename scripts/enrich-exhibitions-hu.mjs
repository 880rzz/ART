import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dir = path.join(root, 'hu/exhibitions');
const relatedBooks = {
  'ebredes.html': '../books/book-ebredes.html',
  'szosszenetek.html': '../books/book-szosszenetek.html',
  'anovilaga.html': '../books/book-anovilaga.html',
};

const files = (await readdir(dir)).filter((name) => name.endsWith('.html')).sort();
const changed = [];

function text(value = '') {
  return value.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, '’').replace(/\s+/g, ' ').trim();
}

for (const name of files) {
  const file = path.join(dir, name);
  const original = await readFile(file, 'utf8');
  let html = original.replaceAll('>Ahogy én mesélném<', '>Archívumi összefoglaló<');

  if (!html.includes('data-archive-facts="true"')) {
    const year = text(html.match(/<p class="label">Kiállítás · ([^<]+)<\/p>/)?.[1]);
    const title = text(html.match(/<h1>([\s\S]*?)<\/h1>/)?.[1]);
    const location = text(html.match(/<h1>[\s\S]*?<\/h1><p class="loc">([\s\S]*?)<\/p>/)?.[1]);
    const workCount = Number(html.match(/id="galwrap"[^>]*data-total="(\d+)"/)?.[1] || 0);
    const hasMedia = /<p class="label">Sajtó és média<\/p>/.test(html);
    const relatedBook = relatedBooks[name];

    if (!year || !title || !location) throw new Error(`${name}: nem olvasható ki az év, cím vagy helyszín`);

    const items = [
      `<li><strong>Év:</strong> ${year}</li>`,
      `<li><strong>Helyszín:</strong> ${location}</li>`,
      workCount ? `<li><strong>Digitalizált művek:</strong> ${workCount} kép az archívumban</li>` : '',
      hasMedia ? '<li><strong>Kapcsolódó dokumentum:</strong> sajtó- vagy médiaforrás az oldalon</li>' : '',
      relatedBook ? `<li><strong>Kapcsolódó könyv:</strong> <a href="${relatedBook}">${title}</a></li>` : '',
    ].filter(Boolean).join('');

    const block = `<section class="wrap narrow" data-archive-facts="true"><p class="label">Archívumi adatok</p><h2 style="margin-top:.4rem">A kiállítás dokumentációja</h2><ul class="linklist" style="margin-top:1.4rem">${items}</ul></section>`;
    const marker = '<section class="wrap"><div class="intro"><p class="label">Galéria</p>';
    if (!html.includes(marker)) throw new Error(`${name}: hiányzó galériaszakasz`);
    html = html.replace(marker, `${block}\n${marker}`);
  }

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    changed.push(`hu/exhibitions/${name}`);
  }
}

console.log(JSON.stringify({ changed, total: changed.length }, null, 2));
