import { readFile, writeFile } from 'node:fs/promises';

const INDEX_PATH = new URL('../hu/index.html', import.meta.url);
const SITEMAP_PATH = new URL('../sitemap.xml', import.meta.url);
const ABOUT_PARTIAL_PATH = new URL('../data/archive/about.hu.html', import.meta.url);
const HOME_INTRO_PATH = new URL('../data/archive/home-intro.hu.json', import.meta.url);

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

function replaceRequired(text, current, replacement, label) {
  if (text.includes(replacement)) return text;
  if (!text.includes(current)) {
    throw new Error(`Nem található a cserélendő ${label}.`);
  }
  return text.replace(current, replacement);
}

const aboutPartial = (await readFile(ABOUT_PARTIAL_PATH, 'utf8')).trim();
const homeIntro = JSON.parse(await readFile(HOME_INTRO_PATH, 'utf8'));

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

  next = replaceRequired(
    next,
    '<p class="label">Fotóművészet · 1999 óta</p>',
    `<p class="label">${homeIntro.hero.label}</p>`,
    'hero címke',
  );
  next = replaceRequired(
    next,
    '<p class="hero-sub">Magyar fotóművész · Bécs / Budapest / New York</p>',
    `<p class="hero-sub">${homeIntro.hero.subtitle}</p>`,
    'hero alcím',
  );
  next = replaceRequired(
    next,
    '<p class="label">Művészi hitvallás</p>',
    `<p class="label">${homeIntro.statement.label}</p>`,
    'hitvallás címke',
  );
  next = replaceRequired(
    next,
    '<blockquote>„Számomra a fotózás fegyelem: <span class="gold">meglátni az embert</span>, mielőtt a világ megmondaná, kicsoda.”</blockquote>',
    `<blockquote>„${homeIntro.statement.text}”</blockquote>`,
    'nyitó állítás',
  );
  next = replaceRequired(
    next,
    '<p class="label">Életmű</p>',
    `<p class="label">${homeIntro.works.label}</p>`,
    'életmű címke',
  );
  next = replaceRequired(
    next,
    '<h2>Best of — a referenciagaléria</h2>',
    `<h2>${homeIntro.works.title}</h2>`,
    'galéria cím',
  );
  next = replaceRequired(
    next,
    '<p class="lead">Széles válogatás az archívumból: portrék, megbízásos munkák, személyes képtörténetek, városi megfigyelések, művészeti sorozatok és kulturális pillanatok 1999-től napjainkig.</p>',
    `<p class="lead">${homeIntro.works.lead}</p>`,
    'galéria bevezető',
  );

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
