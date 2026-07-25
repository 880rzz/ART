import { readFile, writeFile } from 'node:fs/promises';

const INDEX_PATH = new URL('../hu/index.html', import.meta.url);
const SITEMAP_PATH = new URL('../sitemap.xml', import.meta.url);

const menuAnchor = '<a class="m-main" href="index.html#about">Bemutatkozás</a>';
const menuBlock = `${menuAnchor}\n    <p class="m-desc">Ki vagyok, honnan jövök, és mit keresek huszonöt éve az objektíven keresztül.</p>\n    <a class="m-main" href="csaladi-gyokerek.html">Családi gyökerek</a>\n    <p class="m-desc">Rövid háttér a Cseuz–Ferenczy ágról, valamint az alkotás, a tervezés és a fotográfia családi jelenlétéről.</p>`;

const bioAnchor = '<a href="community.html">Közösség és oktatás →</a> ·';
const bioBlock = `<a href="csaladi-gyokerek.html">Családi gyökerek →</a> ·\n      ${bioAnchor}`;

const sitemapAnchor = '<url><loc>https://www.banhalmi.art/press.html</loc>';
const sitemapEntry = '<url><loc>https://www.banhalmi.art/hu/csaladi-gyokerek.html</loc><lastmod>2026-07-25</lastmod><changefreq>yearly</changefreq></url>\n';

async function updateFile(url, transform) {
  const original = await readFile(url, 'utf8');
  const updated = transform(original);
  if (updated === original) return false;
  await writeFile(url, updated, 'utf8');
  return true;
}

const indexChanged = await updateFile(INDEX_PATH, (html) => {
  let next = html;

  if (!next.includes('href="csaladi-gyokerek.html"')) {
    if (!next.includes(menuAnchor)) {
      throw new Error('Nem található a magyar főmenü Bemutatkozás hivatkozása.');
    }
    next = next.replace(
      `${menuAnchor}\n    <p class="m-desc">Ki vagyok, honnan jövök, és mit keresek huszonöt éve az objektíven keresztül.</p>`,
      menuBlock,
    );
  }

  if (!next.includes('Családi gyökerek →')) {
    if (!next.includes(bioAnchor)) {
      throw new Error('Nem található az életrajzi kapcsolati sor.');
    }
    next = next.replace(bioAnchor, bioBlock);
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
