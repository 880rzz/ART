import { readFile, writeFile } from 'node:fs/promises';

const INDEX_PATH = new URL('../hu/index.html', import.meta.url);
const SITEMAP_PATH = new URL('../sitemap.xml', import.meta.url);
const ABOUT_PARTIAL_PATH = new URL('../data/archive/about.hu.html', import.meta.url);

const menuAnchor = '<a class="m-main" href="index.html#about">Bemutatkozás</a>';
const menuBlock = `${menuAnchor}\n    <p class="m-desc">Honnan indultam, hogyan lett a dokumentációból portrészemlélet, majd művészeti és vizuális stratégiai munka.</p>\n    <a class="m-main" href="csaladi-gyokerek.html">Családi gyökerek</a>\n    <p class="m-desc">Rövid háttér a Cseuz–Ferenczy ágról, valamint az alkotás, a tervezés és a fotográfia családi jelenlétéről.</p>`;

const sitemapAnchor = '<url><loc>https://www.banhalmi.art/press.html</loc>';
const sitemapEntry = '<url><loc>https://www.banhalmi.art/hu/csaladi-gyokerek.html</loc><lastmod>2026-07-25</lastmod><changefreq>yearly</changefreq></url>\n';
const aboutStart = '<section id="about" class="tone-b">';
const aboutEnd = '<section id="books" class="tone-a">';

async function updateFile(url, transform) {
  const original = await readFile(url, 'utf8');
  const updated = transform(original);
  if (updated === original) return false;
  await writeFile(url, updated, 'utf8');
  return true;
}

const aboutPartial = (await readFile(ABOUT_PARTIAL_PATH, 'utf8')).trim();

const indexChanged = await updateFile(INDEX_PATH, (html) => {
  let next = html;

  const oldMenuDescription = `${menuAnchor}\n    <p class="m-desc">Ki vagyok, honnan jövök, és mit keresek huszonöt éve az objektíven keresztül.</p>`;
  const newMenuDescription = `${menuAnchor}\n    <p class="m-desc">Honnan indultam, hogyan lett a dokumentációból portrészemlélet, majd művészeti és vizuális stratégiai munka.</p>`;

  if (next.includes(oldMenuDescription)) {
    next = next.replace(oldMenuDescription, newMenuDescription);
  }

  if (!next.includes('<a class="m-main" href="csaladi-gyokerek.html">')) {
    if (!next.includes(newMenuDescription)) {
      throw new Error('Nem található a magyar főmenü Bemutatkozás blokkja.');
    }
    next = next.replace(newMenuDescription, menuBlock);
  }

  const startIndex = next.indexOf(aboutStart);
  const endIndex = next.indexOf(aboutEnd);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error('Nem található biztonságosan a Bemutatkozás szakasz határa.');
  }

  const currentAbout = next.slice(startIndex, endIndex).trim();
  if (currentAbout !== aboutPartial) {
    next = `${next.slice(0, startIndex)}${aboutPartial}\n\n${next.slice(endIndex)}`;
  }

  return next;
});

const sitemapChanged = await updateFile(SITEMAP_PATH, (xml) => {
  if (xml.includes('https://www.banhalmi.art/hu/csaladi-gyokerek.html')) return xml;
  if (!xml.includes(sitemapAnchor)) {
    throw new Error('Nem található a sitemap beszúrási pontja.');
  }
  return xml.replace(sitemapAnchor, `${sitemapEntry}${sitemapAnchor}`);
});

console.log(JSON.stringify({ indexChanged, sitemapChanged }, null, 2));
