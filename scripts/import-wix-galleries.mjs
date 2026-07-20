import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sourceFile = process.argv[2];
if (!sourceFile || !fs.existsSync(sourceFile)) {
  throw new Error('Usage: node scripts/import-wix-galleries.mjs /path/to/wix-galleries.json');
}

const galleries = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
const manifestPath = path.join(root, 'images_from_banhalmi_art.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const copies = {
  en: { label: 'Gallery', heading: 'Works from the exhibition', more: 'Load 15 more works', rights: 'Images from the BANHALMI archive, 1999–2026.' },
  hu: { label: 'Galéria', heading: 'Művek a kiállításról', more: 'További 15 mű betöltése', rights: 'Képek a BANHALMI archívumból, 1999–2026.' },
  'de-AT': { label: 'Galerie', heading: 'Werke aus der Ausstellung', more: 'Weitere 15 Werke laden', rights: 'Bilder aus dem BANHALMI Archiv, 1999–2026.' },
};

function esc(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

for (const [slug, items] of Object.entries(galleries)) {
  items.forEach((item, index) => {
    const local = `assets/img/exhibitions/${slug}/${slug}-${String(index + 1).padStart(2, '0')}.webp`;
    manifest[local] = item.original;
  });

  for (const prefix of ['', 'hu', 'de-at']) {
    const file = path.join(root, prefix, 'exhibitions', `${slug}.html`);
    let html = fs.readFileSync(file, 'utf8');
    const lang = html.match(/<html\s+lang="([^"]+)"/)?.[1] || 'en';
    const copy = copies[lang] || copies.en;
    const title = html.match(/<h1>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, '').trim() || slug;
    const total = items.length;
    const figures = items.map((_, index) => {
      const src = `/assets/img/exhibitions/${slug}/${slug}-${String(index + 1).padStart(2, '0')}.webp`;
      return `<figure><img src="${src}" alt="${esc(title)} — ${copy.heading}" title="${esc(title)} — Photo: Norbert Banhalmi" loading="lazy" decoding="async"></figure>`;
    });
    const batches = [];
    for (let i = 0; i < figures.length; i += 15) {
      batches.push(`<div class="gal-batch"${i ? ' hidden' : ''}>${figures.slice(i, i + 15).join('')}</div>`);
    }
    const button = total > 15
      ? `<button class="btn gal-more" id="galmore" type="button" data-shown="15" data-label="${copy.more}">${copy.more} (15/${total})</button>`
      : '';
    const section = `<section class="wrap"><div class="intro"><p class="label">${copy.label}</p><h2 style="margin-top:.4rem">${copy.heading}</h2></div><div class="collage" id="galwrap" data-step="15" data-total="${total}">${batches.join('')}</div>${button}<p class="meta" style="text-align:center">© Norbert Bánhalmi / BANHALMI. All rights reserved. ${copy.rights}</p></section>\n`;

    if (!html.includes('id="galwrap"')) {
      const marker = '<section class="wrap narrow"><p class="label">';
      const markerIndex = html.indexOf(marker, html.indexOf('</header>'));
      if (markerIndex < 0) throw new Error(`Cannot find insertion point in ${file}`);
      html = html.slice(0, markerIndex) + section + html.slice(markerIndex);
    }

    const firstUrl = `https://www.banhalmi.art/assets/img/exhibitions/${slug}/${slug}-01.webp`;
    html = html.replace(/(<meta property="og:image" content=")[^"]+(">)/, `$1${firstUrl}$2`);
    html = html.replace(/(<meta name="twitter:image" content=")[^"]+(">)/, `$1${firstUrl}$2`);

    html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/, (whole, raw) => {
      const data = JSON.parse(raw);
      const graph = data['@graph'];
      const event = graph.find((entry) => entry['@type'] === 'ExhibitionEvent');
      const pageUrl = event?.url || html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
      const imageUrls = items.map((_, index) => `https://www.banhalmi.art/assets/img/exhibitions/${slug}/${slug}-${String(index + 1).padStart(2, '0')}.webp`);
      if (event) event.image = imageUrls.slice(0, 6);
      const media = imageUrls.map((url) => ({
        '@type': 'ImageObject', '@id': `${url}#image`, contentUrl: url, url,
        name: title, caption: `${title} — ${copy.heading}`, description: `${title} — ${copy.heading}`,
        encodingFormat: 'image/webp', creator: { '@id': 'https://www.norbertbanhalmi.com/about/' },
        copyrightHolder: { '@id': 'https://www.norbertbanhalmi.com/about/' },
        copyrightNotice: '© Norbert Banhalmi / BANHALMI. All rights reserved.',
        creditText: 'Norbert Banhalmi / BANHALMI', creditedTo: 'Norbert Banhalmi',
        license: 'https://www.banhalmi.art/#copyright', acquireLicensePage: 'https://www.norbertbanhalmi.com/contact/',
        isFamilyFriendly: true, representativeOfPage: false, inLanguage: lang,
      }));
      const gallery = { '@type': 'ImageGallery', name: title, creator: { '@id': 'https://www.norbertbanhalmi.com/about/' }, copyrightHolder: { '@id': 'https://www.norbertbanhalmi.com/about/' }, inLanguage: lang, numberOfItems: total, associatedMedia: media, url: pageUrl };
      const oldIndex = graph.findIndex((entry) => entry['@type'] === 'ImageGallery');
      if (oldIndex >= 0) graph[oldIndex] = gallery;
      else graph.push(gallery);
      return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    });
    fs.writeFileSync(file, html);
  }
}

const orderedManifest = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(manifestPath, `${JSON.stringify(orderedManifest, null, 1)}\n`);
console.log(`Imported ${Object.values(galleries).reduce((sum, items) => sum + items.length, 0)} Wix gallery images into ${Object.keys(galleries).length} exhibitions.`);
