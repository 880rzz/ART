import { readFile, writeFile } from 'node:fs/promises';

const INDEX_PATH = new URL('../hu/index.html', import.meta.url);
const SITEMAP_PATH = new URL('../sitemap.xml', import.meta.url);
const ABOUT_PARTIAL_PATH = new URL('../data/archive/about.hu.html', import.meta.url);
const HOME_INTRO_PATH = new URL('../data/archive/home-intro.hu.json', import.meta.url);
const HOME_META_PATH = new URL('../data/archive/home-meta.hu.json', import.meta.url);
const JOURNEY_PARTIAL_PATH = new URL('../data/archive/career-chronology.hu.html', import.meta.url);
const SECTION_INTROS_PATH = new URL('../data/archive/section-intros.hu.json', import.meta.url);
const PROJECT_SUMMARIES_PATH = new URL('../data/archive/project-summaries.hu.json', import.meta.url);
const CONTACT_FOOTER_PATH = new URL('../data/archive/contact-footer.hu.json', import.meta.url);
const DOMAIN_ECOSYSTEM_PATH = new URL('../data/archive/domain-ecosystem.hu.json', import.meta.url);

const menuAnchors = [
  '<a class="m-main" href="index.html#about">A jelenlét kutatása</a>',
  '<a class="m-main" href="index.html#about">Bemutatkozás</a>',
];
const menuDescription = '<p class="m-desc">Honnan indultam, hogyan lett a dokumentációból portrészemlélet, majd művészeti és vizuális stratégiai munka.</p>';
const journeyMenuBlock = '<a class="m-main" href="index.html#journey">Pályaív</a>\n    <p class="m-desc">A dokumentációtól és a portréiskolától a könyveken, kiállításokon és közösségi munkán át a bécsi–budapesti alkotói korszakig.</p>';

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
  if (start === -1 || end === -1 || end <= start) throw new Error(`Nem található biztonságosan a szakasz: ${sectionStart}`);
  const section = html.slice(start, end);
  const introPattern = /<div class="intro">[\s\S]*?<\/div>/;
  if (!introPattern.test(section)) throw new Error(`Nem található a bevezető blokk: ${sectionStart}`);
  const newIntro = `<div class="intro">\n    <p class="label">${data.label}</p><h2>${data.title}</h2>\n    <p class="lead">${data.lead}</p>\n  </div>`;
  return `${html.slice(0, start)}${section.replace(introPattern, newIntro)}${html.slice(end)}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function titlePattern(value) {
  return escapeRegExp(value).replace(/&/g, '(?:&|&amp;)');
}

function replaceSummaryByTitle(html, entry) {
  const title = titlePattern(entry.title);
  const pattern = new RegExp(`(<h3>(?:<a[^>]*>)?${title}(?:<\\/a>)?<\\/h3>[\\s\\S]*?<p(?: class="[^"]*")?>)([\\s\\S]*?)(<\\/p>)`);
  if (!pattern.test(html)) throw new Error(`Nem található cím alapján a projektleírás: ${entry.title}`);
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

function replaceRequired(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`Nem található a metaadat: ${label}`);
  return html.replace(pattern, replacement);
}

function integrateContactFooter(html, contactFooter) {
  let next = html;
  const contactStart = next.indexOf('<section id="contact"');
  const footerStart = next.indexOf('<footer', contactStart);
  if (contactStart === -1 || footerStart === -1) throw new Error('Nem található biztonságosan a Kapcsolat vagy a lábléc szakasza.');

  let contactSection = next.slice(contactStart, footerStart);
  const contactIntroPattern = /(<p class="label">)[\s\S]*?(<\/p>\s*<h2>)[\s\S]*?(<\/h2>\s*<p class="lead">)[\s\S]*?(<\/p>)/;
  if (!contactSection.includes(contactFooter.contact.lead)) {
    if (!contactIntroPattern.test(contactSection)) throw new Error('Nem található a Kapcsolat bevezető blokkja.');
    contactSection = contactSection.replace(contactIntroPattern, `$1${contactFooter.contact.label}$2${contactFooter.contact.title}$3${contactFooter.contact.lead}$4`);
  }

  const professionalNotePattern = /(<section id="contact"[\s\S]*?<\/p>)/;
  if (!contactSection.includes(contactFooter.contact.professionalText)) {
    if (!professionalNotePattern.test(contactSection)) throw new Error('Nem található a szakmai megjegyzés beszúrási pontja.');
    const note = `<p class="meta"><strong>${contactFooter.contact.professionalLabel}:</strong> ${contactFooter.contact.professionalText}</p>`;
    contactSection = contactSection.replace(professionalNotePattern, `$1\n    ${note}`);
  }

  next = `${next.slice(0, contactStart)}${contactSection}${next.slice(footerStart)}`;

  const footerEnd = next.indexOf('</footer>', footerStart);
  if (footerEnd === -1) throw new Error('Nem található a lábléc vége.');
  let footerSection = next.slice(footerStart, footerEnd);
  /* footer.domainLine is intentionally NOT rendered. The footer already
     lists banhalmi.art and norbertbanhalmi.com as links directly above, so
     spelling the two-centre model out in prose repeated information the
     reader had just been given. The line is kept in the source data as the
     canonical wording of the model (and is asserted by
     tests/audit-contact-footer.mjs) for use in briefs and metadata. */
  const footerNotes = [
    `<p class="archive-identity">${contactFooter.footer.identity}</p>`,
    `<p class="archive-contact">${contactFooter.footer.contactLine}</p>`,
  ].filter((line) => !footerSection.includes(line.slice(line.indexOf('>') + 1, -4)));

  if (footerNotes.length) footerSection = `${footerSection}\n  ${footerNotes.join('\n  ')}`;
  return `${next.slice(0, footerStart)}${footerSection}${next.slice(footerEnd)}`;
}

function integrateDomainEcosystem(html, ecosystem) {
  let next = html;
  const allDomains = [...ecosystem.primaryDomains.map((item) => item.domain), ...ecosystem.languageEntryDomains.map((item) => item.domain)];
  const sameAsAnchor = '"https://www.saatchiart.com/norbertbanhalmi"]';
  if (!allDomains.every((domain) => next.includes(`"${domain}"`))) {
    if (!next.includes(sameAsAnchor)) throw new Error('Nem található a Person sameAs domain-beszúrási pontja.');
    const domainItems = allDomains.map((domain) => `"${domain}"`).join(',');
    next = next.replace(sameAsAnchor, `"https://www.saatchiart.com/norbertbanhalmi",${domainItems}]`);
  }
  const professionalLink = '<a href="https://www.norbertbanhalmi.com/" target="_blank" rel="noopener">norbertbanhalmi.com</a>';
  const languageLinks = '<a href="https://www.banhalminorbert.hu/" target="_blank" rel="noopener">banhalminorbert.hu</a><a href="https://www.banhalmi.at/" target="_blank" rel="noopener">banhalmi.at</a>';
  if (!next.includes('>banhalminorbert.hu</a>') || !next.includes('>banhalmi.at</a>')) {
    if (!next.includes(professionalLink)) throw new Error('Nem található a lábléc domain-beszúrási pontja.');
    next = next.replace(professionalLink, `${professionalLink}${languageLinks}`);
  }
  return next;
}

const aboutPartial = (await readFile(ABOUT_PARTIAL_PATH, 'utf8')).trim();
const journeyPartial = (await readFile(JOURNEY_PARTIAL_PATH, 'utf8')).trim();
const homeIntro = JSON.parse(await readFile(HOME_INTRO_PATH, 'utf8'));
const homeMeta = JSON.parse(await readFile(HOME_META_PATH, 'utf8'));
const sectionIntros = JSON.parse(await readFile(SECTION_INTROS_PATH, 'utf8'));
const projectSummaries = JSON.parse(await readFile(PROJECT_SUMMARIES_PATH, 'utf8'));
const contactFooter = JSON.parse(await readFile(CONTACT_FOOTER_PATH, 'utf8'));
const domainEcosystem = JSON.parse(await readFile(DOMAIN_ECOSYSTEM_PATH, 'utf8'));

const indexChanged = await updateFile(INDEX_PATH, (html) => {
  let next = html;
  const oldMenuDescription = '<p class="m-desc">Ki vagyok, honnan jövök, és mit keresek huszonöt éve az objektíven keresztül.</p>';
  if (next.includes(oldMenuDescription)) next = next.replace(oldMenuDescription, menuDescription);

  const menuAnchor = menuAnchors.find((candidate) => next.includes(candidate));
  const menuBase = menuAnchor ? `${menuAnchor}\n    ${menuDescription}` : '';
  if (!next.includes('href="index.html#journey"')) {
    if (!menuAnchor) throw new Error('Nem található a magyar főmenü életmű-hivatkozása.');
    if (!next.includes(menuBase)) throw new Error('Nem található a Pályaív menüpont beszúrási helye.');
    next = next.replace(menuBase, `${menuBase}\n    ${journeyMenuBlock}`);
  } else {
    next = next.replace(/<a class="m-main" href="index\.html#journey">Pályaív<\/a>\s*<p class="m-desc">[\s\S]*?<\/p>/, journeyMenuBlock);
  }
  // The standalone family-origins page was retired on 2026-07-31: its essence now
  // lives inline in the About section (see data/archive/about.hu.html), and the
  // mega-menu entry is intentionally not reinserted here.
  next = next.replace(/\s*<a class="m-main" href="(?:\/hu\/)?csaladi-gyokerek\.html">Családi gyökerek<\/a>\s*<p class="m-desc">[\s\S]*?<\/p>/i, '');

  next = replaceRequired(next, /<title>[\s\S]*?<\/title>/, `<title>${homeMeta.title}</title>`, 'title');
  next = replaceRequired(next, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${homeMeta.description}">`, 'description');
  next = replaceRequired(next, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${homeMeta.ogTitle}">`, 'og:title');
  next = replaceRequired(next, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${homeMeta.ogDescription}">`, 'og:description');
  next = replaceRequired(next, /<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${homeMeta.imageAlt}">`, 'og:image:alt');

  next = next
    .replace(/<p class="label">(?:Fotóművészet · 1999 óta|Fotográfia · művészeti archívum · 1999 óta)<\/p>/, `<p class="label">${homeIntro.hero.label}</p>`)
    .replace(/<p class="hero-sub">[\s\S]*?<\/p>/, `<p class="hero-sub">${homeIntro.hero.subtitle}</p>`)
    .replace(/<section class="statement[\s\S]*?<blockquote>[\s\S]*?<\/blockquote>/, (block) => block.replace(/<p class="label">[\s\S]*?<\/p>/, `<p class="label">${homeIntro.statement.label}</p>`).replace(/<blockquote>[\s\S]*?<\/blockquote>/, `<blockquote>${homeIntro.statement.text}</blockquote>`))
    .replace(/<h2>(?:Best of — a referenciagaléria|Válogatás az archívumból)<\/h2>/, `<h2>${homeIntro.works.title}</h2>`)
    .replace(/<p class="lead">Portrék, megbízásos munkák,[\s\S]*?<\/p>/, `<p class="lead">${homeIntro.works.lead}</p>`)
    .replace(/<p class="label">(?:Válogatott munkák|Életmű és dokumentáció)<\/p>/, `<p class="label">${homeIntro.works.label}</p>`)
    .replace('"name":"Bánhalmi Norbert — fotóművész | Életmű és kiállítások"', `"name":"${homeMeta.schemaPageName}"`)
    .replace('"headline":"Bánhalmi Norbert — fotóművész | Életmű és kiállítások"', `"headline":"${homeMeta.schemaPageHeadline}"`)
    .replace(/"dateModified":"[^"]*"/, `"dateModified":"${homeMeta.dateModified}"`);

  const aboutIndex = next.indexOf(aboutStart);
  const booksIndex = next.indexOf(booksStart);
  if (aboutIndex === -1 || booksIndex === -1 || booksIndex <= aboutIndex) throw new Error('Nem található biztonságosan a Bemutatkozás szakasz határa.');
  const existingJourneyIndex = next.indexOf(journeyStart, aboutIndex);
  const aboutEnd = existingJourneyIndex !== -1 && existingJourneyIndex < booksIndex ? existingJourneyIndex : booksIndex;
  if (next.slice(aboutIndex, aboutEnd).trim() !== aboutPartial) next = `${next.slice(0, aboutIndex)}${aboutPartial}\n\n${next.slice(aboutEnd)}`;

  const refreshedBooksIndex = next.indexOf(booksStart);
  const refreshedJourneyIndex = next.indexOf(journeyStart);
  if (refreshedJourneyIndex === -1) next = `${next.slice(0, refreshedBooksIndex)}${journeyPartial}\n\n${next.slice(refreshedBooksIndex)}`;
  else {
    const journeyEnd = next.indexOf(booksStart, refreshedJourneyIndex);
    if (journeyEnd === -1) throw new Error('Nem található a Pályaív szakasz vége.');
    if (next.slice(refreshedJourneyIndex, journeyEnd).trim() !== journeyPartial) next = `${next.slice(0, refreshedJourneyIndex)}${journeyPartial}\n\n${next.slice(journeyEnd)}`;
  }

  next = replaceSectionIntro(next, booksStart, exhibitionsStart, sectionIntros.books);
  const exhibitionsIndex = next.indexOf(exhibitionsStart);
  const nextSectionAfterExhibitions = next.indexOf('<section ', exhibitionsIndex + exhibitionsStart.length);
  if (nextSectionAfterExhibitions === -1) throw new Error('Nem található a Kiállítások utáni következő szakasz.');
  const exhibitionsEndMarker = next.slice(nextSectionAfterExhibitions, next.indexOf('>', nextSectionAfterExhibitions) + 1);
  next = replaceSectionIntro(next, exhibitionsStart, exhibitionsEndMarker, sectionIntros.exhibitions);

  next = replaceProjectSummaries(next, projectSummaries.books);
  next = replaceProjectSummaries(next, projectSummaries.exhibitions);
  next = integrateContactFooter(next, contactFooter);
  next = integrateDomainEcosystem(next, domainEcosystem);
  return next;
});

// The standalone family-origins page was retired on 2026-07-31; its old
// sitemap entry is intentionally not reinserted here (see also the menu
// removal above).
const sitemapChanged = await updateFile(SITEMAP_PATH, (xml) =>
  xml.replace(sitemapEntry, '').replace('https://www.banhalmi.art/hu/csaladi-gyokerek.html', '')
);

console.log(JSON.stringify({ indexChanged, sitemapChanged }, null, 2));