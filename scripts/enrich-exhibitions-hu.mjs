import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { requireExplicitRun } from './lib/one-time-migration.mjs';
requireExplicitRun('enrich-exhibitions-hu', 'Overwrites exhibition meta descriptions, dropping the in-development note.');

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
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeAttribute(value = '') {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function cleanLocation(value = '', year = '') {
  let location = text(value);
  const escapedYear = year.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (escapedYear) {
    location = location
      .replace(new RegExp(`^${escapedYear}\\s*[·–—-]\\s*`, 'i'), '')
      .replace(new RegExp(`^${escapedYear}\\.?\\s*`, 'i'), '');
  }
  location = location
    .replace(/^\d{4}\.\s*(?:január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)\s+\d{1,2}\.\s*[·–—-]\s*/i, '')
    .replace(/^\d{4}[.–-]\d{2}[.–-]\d{2}\.?\s*[·–—-]\s*/, '')
    .trim();
  return location;
}

function removeLegacyGeoMeta(html) {
  return html
    .replace(/\n?<meta name="geo\.region"[^>]*>/g, '')
    .replace(/\n?<meta name="geo\.placename"[^>]*>/g, '')
    .replace(/\n?<meta name="ICBM"[^>]*>/g, '')
    .replace(/\n?<meta name="geo\.position"[^>]*>/g, '');
}

for (const name of files) {
  const file = path.join(dir, name);
  const original = await readFile(file, 'utf8');
  let html = original.replaceAll('>Ahogy én mesélném<', '>Archívumi összefoglaló<');

  const completedYear = text(html.match(/<p class="label">Kiállítás · ([^<]+)<\/p>/)?.[1]);
  const plannedYear = text(html.match(/<p class="label">Készülő kiállítás · ([^<]+)<\/p>/)?.[1]);
  const year = completedYear || plannedYear;
  const title = text(html.match(/<h1>([\s\S]*?)<\/h1>/)?.[1]);
  const rawLocation = html.match(/<h1>[\s\S]*?<\/h1><p class="loc">([\s\S]*?)<\/p>/)?.[1] || '';
  const location = cleanLocation(rawLocation, year);
  const workCount = Number(html.match(/id="galwrap"[^>]*data-total="(\d+)"/)?.[1] || 0);
  const hasMedia = /<p class="label">Sajtó és média<\/p>/.test(html);
  const relatedBook = relatedBooks[name];
  const isPlanned = Boolean(plannedYear);

  if (!year || !title || !location) throw new Error(`${name}: nem olvasható ki az év, cím vagy helyszín/státusz`);

  if (!html.includes('data-archive-facts="true"')) {
    const items = [
      `<li><strong>Év:</strong> ${year}</li>`,
      `<li><strong>Helyszín / státusz:</strong> ${location}</li>`,
      workCount ? `<li><strong>Digitalizált művek:</strong> ${workCount} kép az archívumban</li>` : '<li><strong>Dokumentáció:</strong> az archívumi anyag folyamatosan bővül</li>',
      hasMedia ? '<li><strong>Kapcsolódó dokumentum:</strong> sajtó- vagy médiaforrás az oldalon</li>' : '',
      relatedBook ? `<li><strong>Kapcsolódó könyv:</strong> <a href="${relatedBook}">${title}</a></li>` : '',
    ].filter(Boolean).join('');

    const block = `<section class="wrap narrow" data-archive-facts="true"><p class="label">Archívumi adatok</p><h2 style="margin-top:.4rem">A kiállítás dokumentációja</h2><ul class="linklist" style="margin-top:1.4rem">${items}</ul></section>`;
    const galleryMarker = '<section class="wrap"><div class="intro"><p class="label">Galéria</p>';
    const fallbackMarker = '</main>';
    if (html.includes(galleryMarker)) html = html.replace(galleryMarker, `${block}\n${galleryMarker}`);
    else if (html.includes(fallbackMarker)) html = html.replace(fallbackMarker, `${block}\n${fallbackMarker}`);
    else throw new Error(`${name}: nincs beillesztési pont az archívumi adatblokkhoz`);
  } else {
    html = html.replace(/(<strong>Helyszín \/ státusz:<\/strong>\s*)([^<]+)(<\/li>)/, `$1${location}$3`);
  }

  const description = isPlanned
    ? `${title} készülő fotóművészeti projekt archívumi oldala. Tervezett időszak: ${year}. ${location}.`
    : `${title} című, ${year}-ben bemutatott kiállítás archívumi oldala. Helyszín: ${location}.${workCount ? ` ${workCount} digitalizált mű az archívumban.` : ''}`;
  const escapedDescription = escapeAttribute(description);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapedDescription}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapedDescription}">`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escapedDescription}">`);
  html = removeLegacyGeoMeta(html);

  html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (match, open, jsonText, close) => {
    const graph = JSON.parse(jsonText);
    const event = graph['@graph']?.find((node) => node['@type'] === 'ExhibitionEvent');
    if (!event) throw new Error(`${name}: ExhibitionEvent schema nem található`);
    event.description = description;
    event.eventStatus = isPlanned ? 'https://schema.org/EventScheduled' : 'https://schema.org/EventCompleted';
    if (event.location && typeof event.location === 'object') event.location.name = location;
    return `${open}${JSON.stringify(graph)}${close}`;
  });

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    changed.push(`hu/exhibitions/${name}`);
  }
}

console.log(JSON.stringify({ changed, total: changed.length }, null, 2));
