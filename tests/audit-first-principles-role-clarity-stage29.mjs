import fs from 'node:fs';

const pages = [
  {
    file: 'index.html',
    role: /official art archive/i,
    since: /since 1999/i,
    categories: [/photographs?/i, /books?/i, /exhibitions?/i, /films?|moving image/i],
    serviceLink: /https:\/\/www\.norbertbanhalmi\.com\//i
  },
  {
    file: 'hu/index.html',
    role: /hivatalos művészeti archívum/i,
    since: /1999 óta/i,
    categories: [/fénykép|fotó/i, /könyv/i, /kiállítás/i, /mozgókép|film/i],
    serviceLink: /https:\/\/www\.norbertbanhalmi\.com\/hu\//i
  },
  {
    file: 'de-at/index.html',
    role: /offizielles kunstarchiv|offizielles künstlerisches archiv/i,
    since: /seit 1999/i,
    categories: [/fotograf/i, /bücher?/i, /ausstellungen?/i, /film|bewegtbild/i],
    serviceLink: /https:\/\/www\.norbertbanhalmi\.com\/de-at\//i
  }
];

const errors = [];
for (const page of pages) {
  const html = fs.readFileSync(page.file, 'utf8');
  if (!page.role.test(html)) errors.push(`${page.file}: archive role is not explicit`);
  if (!page.since.test(html)) errors.push(`${page.file}: 1999 provenance is missing`);
  for (const pattern of page.categories) {
    if (!pattern.test(html)) errors.push(`${page.file}: missing oeuvre category ${pattern}`);
  }
  if (!page.serviceLink.test(html)) errors.push(`${page.file}: language-correct service-site bridge is missing`);
  if (!/@type":"WebSite"/.test(html) || !/https:\/\/www\.banhalmi\.art\/#website/.test(html)) {
    errors.push(`${page.file}: archive WebSite entity is missing`);
  }
  if (!/https:\/\/www\.norbertbanhalmi\.com\/#organization/.test(html)) {
    errors.push(`${page.file}: BANHALMI business entity bridge is missing`);
  }
  if (/request a quote|ajánlatkérő űrlap|angebotsformular/i.test(html)) {
    errors.push(`${page.file}: archive homepage must not become the commercial quote funnel`);
  }
}

const english = fs.readFileSync('index.html', 'utf8');
if (!/The Anatomy of Presence/i.test(english)) errors.push('index.html: central artistic thesis is missing');
const hungarian = fs.readFileSync('hu/index.html', 'utf8');
if (!/A jelenlét anatómiája/i.test(hungarian)) errors.push('hu/index.html: central artistic thesis is missing');
const german = fs.readFileSync('de-at/index.html', 'utf8');
if (!/Anatomie der Präsenz/i.test(german)) errors.push('de-at/index.html: central artistic thesis is missing');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Stage 29 first-principles role clarity audit passed for EN/HU/DE.');
