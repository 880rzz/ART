import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const pages = {
  'hu/community.html': {
    title: 'Közösségi és oktatási projektek | BANHALMI ART archívum',
    description: 'Bánhalmi Norbert közösségi, kurátori és oktatási projektjei:',
    required: ['Rege Galéria', 'VIPACH', 'Bécsi Magyar Iskola', 'Be Smart Kids Club'],
  },
  'hu/writing.html': {
    title: 'Publikációk és OM SYSTEM nagyköveti munka | BANHALMI ART',
    description: 'Bánhalmi Norbert szakmai publikációi, OM SYSTEM nagyköveti munkája',
    required: ['OM SYSTEM', 'publikáció'],
  },
  'hu/press.html': {
    title: 'A jelenlét nyilvános története | BANHALMI sajtóarchívum',
    description: 'Bánhalmi Norbert sajtó-, interjú- és videóarchívuma a jelenlét kutatásának életszakaszai szerint rendezve.',
    required: ['Sajtóarchívum', 'A jelenlét kutatása'],
  },
  'hu/curators.html': {
    title: 'Kurátori dosszié és életmű-kontextus | BANHALMI ART',
    description: 'Kurátori összefoglaló Bánhalmi Norbert fotóművészeti életművéről',
    required: ['Kurátori', 'életmű'],
  },
};

const failures = [];
const legacy = [
  'Ki vagyok, honnan jövök, és mit keresek huszonöt éve az objektíven keresztül.',
  'A fotózás mindent megadott nekem, amim van. Ez az a rész, ahol visszaadok belőle valamennyit',
  'A csillogás nélküli állványzat, ami a művészetet tartja.',
];

for (const [file, expected] of Object.entries(pages)) {
  const html = await readFile(new URL(file, root), 'utf8');
  if (!html.includes(`<title>${expected.title}</title>`)) failures.push(`${file}: hibás title`);
  if (!html.includes(expected.description)) failures.push(`${file}: hibás vagy hiányzó meta description`);
  if (!html.includes('property="og:title"')) failures.push(`${file}: hiányzó og:title`);
  if (!html.includes('property="og:description"')) failures.push(`${file}: hiányzó og:description`);
  for (const text of expected.required) if (!html.includes(text)) failures.push(`${file}: hiányzó archívumi tartalom: ${text}`);
}

const huFiles = [
  'hu/index.html', 'hu/community.html', 'hu/writing.html', 'hu/press.html', 'hu/curators.html',
  'hu/books/book-ebredes.html', 'hu/books/book-szosszenetek.html', 'hu/books/book-anovilaga.html',
];
for (const file of huFiles) {
  const html = await readFile(new URL(file, root), 'utf8');
  for (const text of legacy) if (html.includes(text)) failures.push(`${file}: régi menüszöveg maradt: ${text.slice(0, 42)}…`);
}

for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`Audited ${Object.keys(pages).length} secondary pages and ${huFiles.length} representative Hungarian menu instances.`);
if (failures.length) process.exitCode = 1;
