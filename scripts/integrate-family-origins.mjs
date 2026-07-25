import { readFile, writeFile } from 'node:fs/promises';

const INDEX_PATH = new URL('../hu/index.html', import.meta.url);
const SITEMAP_PATH = new URL('../sitemap.xml', import.meta.url);
const ABOUT_PARTIAL_PATH = new URL('../data/archive/about.hu.html', import.meta.url);
const HOME_INTRO_PATH = new URL('../data/archive/home-intro.hu.json', import.meta.url);
const JOURNEY_PARTIAL_PATH = new URL('../data/archive/career-chronology.hu.html', import.meta.url);
const SECTION_INTROS_PATH = new URL('../data/archive/section-intros.hu.json', import.meta.url);
const PROJECT_SUMMARIES_PATH = new URL('../data/archive/project-summaries.hu.json', import.meta.url);

const menuAnchor = '<a class="m-main" href="index.html#about">Bemutatkozás</a>';
const menuDescription = '<p class="m-desc">Honnan indultam, hogyan lett a dokumentációból portrészemlélet, majd művészeti és vizuális stratégiai munka.</p>';
const journeyMenuBlock = '<a class="m-main" href="index.html#journey">Pályaív</a>\n    <p class="m-desc">A Magyar Honvédségtől és a HIPStudio indulásától a négy domainből felépülő mai rendszerig.</p>';
const familyMenuBlock = '<a class="m-main" href="csaladi-gyokerek.html">Családi gyökerek</a>\n    <p class="m-desc">Rövid háttér a Cseuz–Ferenczy ágról, valamint az alkotás, a tervezés és a fotográfia családi jelenlétéről.</p>';

const sitemapAnchor = '<url><loc>https://www.banhalmi.art/press.html</loc>';
const sitemapEntry = '<url><loc>https://www.banhalmi.art/hu/csaladi-gyokerek.html</loc><lastmod>2026-07-25</lastmod><changefreq>yearly</changefreq></url>\n';
const aboutStart = '<section id="about" class="tone-b">';
const booksStart = '<section id="books" class="tone-a">';
const exhibitionsStart = '<section id="exhibitions" class="tone-c">';
const journeyStart = '<section id="journey" class="tone-a">';

async function updateFile(url, transform) {
  const original = await readFile(url, 'utf8');
  const updated = transform(original);
  if (updated === original) return false;
  await writeFile(url, updated, 'utf8');
  return true;
}

function replaceSectionIntro(html, sectionStart, nextSectionStart, data) {
  const start = html.indexOf(sectionStart);
  const end = html.indexOf(nextSectionStart, start + sectionStart.length);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Nem található biztonságosan a szakasz: ${sectionStart}`);
  }

  const section = html.slice(start, end);
  const introPattern = /<div class="intro">[\s\S]*?<\/div>/;
  if (!introPattern.test(section)) {
    throw new Error(`Nem található a bevezető blokk: ${sectionStart}`);
  }

  const newIntro = `<div class="intro">\n    <p class="label">${data.label}</p><h2>${data.title}</h2>\n    <p class="lead">${data.lead}</p>\n  </div>`;
  const updatedSection = section.replace(introPattern, newIntro);
  return `${html.slice(0, start)}${updatedSection}${html.slice(end)}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceSummaryByTitle(html, entry) {
  const title = escapeRegExp(entry.title);
  const pattern = new RegExp(`(<h3>(?:<a[^>]*>)?${title}(?:<\\/a>)?<\\/h3>[\\s\\S]*?<p(?: class="[^"]*")?>)([\\s\\S]*?)(<\\/p>)`);
  if (!pattern.test(html)) {
    throw new Error(`Nem található cím alapján a projektleírás: ${entry.title}`);
  }
  return html.replace(pattern, `$1${entry.new}$3`);
}

function replaceProjectSummaries(html, entries) {
  let next = html;
  for (const entry of entries) {
    if (next.includes(entry.new)) continue;
    if (entry.old && next.includes(entry.old)) {
      next = next.replace(entry.old, entry.new);
      continue;
    }
    next = replaceSummaryByTitle(next, entry);
  }
  return next;
}

const aboutPartial = (await readFile(ABOUT_PARTIAL_PATH, 'utf8')).trim();
const journeyPartial = (await readFile(JOURNEY_PARTIAL_PATH, 'utf8')).trim();
const homeIntro = JSON.parse(await readFile(HOME_INTRO_PATH, 'utf8'));
const sectionIntros = JSON.parse(await readFile(SECTION_INTROS_PATH, 'utf8'));
const projectSummaries = JSON.parse(await readFile(PROJECT_SUMMARIES_PATH, 'utf8'));

const indexChanged = await updateFile(INDEX_PATH, (html) => {
  let next = html;

  const oldMenuDescription = '<p class="m-desc">Ki vagyok, honnan jövök, és mit keresek huszonöt éve az objektíven keresztül.</p>';
  if (next.includes(oldMenuDescription)) {
    next = next.replace(oldMenuDescription, menuDescription);
  }

  const menuBase = `${menuAnchor}\n    ${menuDescription}`;
  if (!next.includes(menuAnchor)) {
    throw new Error('Nem található a magyar főmenü Bemutatkozás hivatkozása.');
  }

  if (!next.includes('href="index.html#journey"')) {
    if (!next.includes(menuBase)) {
      throw new Error('Nem található a Pályaív menüpont beszúrási helye.');
    }
    next = next.replace(menuBase, `${menuBase}\n    ${journeyMenuBlock}`);
  }

  if (!next.includes('<a class="m-main" href="csaladi-gyokerek.html">')) {
    const journeyMenu = `${menuBase}\n    ${journeyMenuBlock}`;
    if (!next.includes(journeyMenu)) {
      throw new Error('Nem található a Családi gyökerek menüpont beszúrási helye.');
    }
    next = next.replace(journeyMenu, `${journeyMenu}\n    ${familyMenuBlock}`);
  }

  next = next
    .replace('<p class="label">Fotóművészet · 1999 óta</p>', `<p class="label">${homeIntro.hero.label}</p>`)
    .replace('<p class="hero-sub">Magyar fotóművész · Bécs / Budapest / New York</p>', `<p class="hero-sub">${homeIntro.hero.subtitle}</p>`)
    .replace('„Számomra a fotózás fegyelem: <span class="gold">meglátni az embert</span>, mielőtt a világ megmondaná, kicsoda.”', homeIntro.statement)
    .replace('<h2>Best of — a referenciagaléria</h2>', `<h2>${homeIntro.gallery.title}</h2>`)
    .replace('Széles válogatás az archívumból: portrék, megbízásos munkák, személyes képtörténetek, városi megfigyelések, művészeti sorozatok és kulturális pillanatok 1999-től napjainkig.', homeIntro.gallery.lead);

  const aboutIndex = next.indexOf(aboutStart);
  const booksIndex = next.indexOf(booksStart);
  if (aboutIndex === -1 || booksIndex === -1 || booksIndex <= aboutIndex) {
    throw new Error('Nem található biztonságosan a Bemutatkozás szakasz határa.');
  }

  const existingJourneyIndex = next.indexOf(journeyStart, aboutIndex);
  const aboutEnd = existingJourneyIndex !== -1 && existingJourneyIndex < booksIndex ? existingJourneyIndex : booksIndex;
  const currentAbout = next.slice(aboutIndex, aboutEnd).trim();
  if (currentAbout !== aboutPartial) {
    next = `${next.slice(0, aboutIndex)}${aboutPartial}\n\n${next.slice(aboutEnd)}`;
  }

  const refreshedBooksIndex = next.indexOf(booksStart);
  const refreshedJourneyIndex = next.indexOf(journeyStart);
  if (refreshedJourneyIndex === -1) {
    next = `${next.slice(0, refreshedBooksIndex)}${journeyPartial}\n\n${next.slice(refreshedBooksIndex)}`;
  } else {
    const journeyEnd = next.indexOf(booksStart, refreshedJourneyIndex);
    if (journeyEnd === -1) {
      throw new Error('Nem található a Pályaív szakasz vége.');
    }
    const currentJourney = next.slice(refreshedJourneyIndex, journeyEnd).trim();
    if (currentJourney !== journeyPartial) {
      next = `${next.slice(0, refreshedJourneyIndex)}${journeyPartial}\n\n${next.slice(journeyEnd)}`;
    }
  }

  next = replaceSectionIntro(next, booksStart, exhibitionsStart, sectionIntros.books);

  const exhibitionsIndex = next.indexOf(exhibitionsStart);
  const nextSectionAfterExhibitions = next.indexOf('<section ', exhibitionsIndex + exhibitionsStart.length);
  if (nextSectionAfterExhibitions === -1) {
    throw new Error('Nem található a Kiállítások utáni következő szakasz.');
  }
  const exhibitionsEndMarker = next.slice(nextSectionAfterExhibitions, next.indexOf('>', nextSectionAfterExhibitions) + 1);
  next = replaceSectionIntro(next, exhibitionsStart, exhibitionsEndMarker, sectionIntros.exhibitions);

  next = replaceProjectSummaries(next, projectSummaries.books);
  next = replaceProjectSummaries(next, projectSummaries.exhibitions);

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
