import { readFile } from 'node:fs/promises';

const checks = [
  {
    file: 'index.html',
    contact: 'https://www.norbertbanhalmi.com/contact/',
    galleryText: 'Print, publication or exhibition use',
    curatorText: 'High-resolution files, exhibition documentation and publication rights.'
  },
  {
    file: 'hu/index.html',
    contact: 'https://www.norbertbanhalmi.com/hu/kapcsolat/',
    galleryText: 'Print, publikáció vagy kiállítási felhasználás',
    curatorText: 'Nagy felbontású fájlok, kiállítási dokumentáció és publikációs felhasználás.'
  },
  {
    file: 'de-at/index.html',
    contact: 'https://www.norbertbanhalmi.com/de-at/kontakt/',
    galleryText: 'Print, Publikation oder Ausstellungsnutzung',
    curatorText: 'Hochauflösende Dateien, Ausstellungsdokumentation und Publikationsrechte.'
  }
];

const curatorFiles = {
  'index.html': 'curators.html',
  'hu/index.html': 'hu/curators.html',
  'de-at/index.html': 'de-at/curators.html'
};

const errors = [];

for (const entry of checks) {
  const home = await readFile(entry.file, 'utf8');
  if (!home.includes('data-ecosystem-path="art-rights"')) errors.push(`${entry.file}: visible art-rights path missing`);
  if (!home.includes(entry.contact)) errors.push(`${entry.file}: localized professional contact target missing`);
  if (!home.includes(entry.galleryText)) errors.push(`${entry.file}: localized art-rights copy missing`);
  if (!home.includes('data-total="131"')) errors.push(`${entry.file}: 131-work reference-gallery contract changed`);

  const curator = await readFile(curatorFiles[entry.file], 'utf8');
  if (!curator.includes('data-ecosystem-path="curatorial-rights"')) errors.push(`${curatorFiles[entry.file]}: curatorial-rights path missing`);
  if (!curator.includes(entry.contact)) errors.push(`${curatorFiles[entry.file]}: localized professional contact target missing`);
  if (!curator.includes('mailto:hello@norbertbanhalmi.com')) errors.push(`${curatorFiles[entry.file]}: direct studio email missing`);
  if (!curator.includes(entry.curatorText)) errors.push(`${curatorFiles[entry.file]}: localized curator decision copy missing`);
}

for (const file of Object.keys(curatorFiles)) {
  const html = await readFile(file, 'utf8');
  if (/href=["']\/(?:works|archive)\/?["']/i.test(html)) errors.push(`${file}: do not create a parallel /works or /archive destination on ART`);
}

if (errors.length) {
  console.error('Stage93 ecosystem decision-path audit failed:');
  for (const error of errors) console.error(' - ' + error);
  process.exit(1);
}

console.log('Stage93 passed: EN/HU/DE ART homepages expose a localized print/publication/exhibition enquiry path, curator dossiers expose high-res/licensing contact paths, and the 131-work archive remains on the existing information architecture.');
