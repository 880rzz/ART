import { readFile } from 'node:fs/promises';

const books = [
  {
    file: 'book-ebredes.html',
    title: 'Ébredés — az Új kezdet!',
    isbn: '978-963-12-8663-2',
    related: '../exhibitions/ebredes.html'
  },
  {
    file: 'book-szosszenetek.html',
    title: 'Szösszenetek',
    isbn: '2310005245015',
    related: '../exhibitions/szosszenetek.html'
  },
  {
    file: 'book-anovilaga.html',
    title: 'A Nő világa',
    isbn: '978-615-00-1829-4',
    related: '../exhibitions/anovilaga.html'
  }
];

const base = new URL('../hu/books/', import.meta.url);
const failures = [];

for (const book of books) {
  const html = await readFile(new URL(book.file, base), 'utf8');
  const checks = [
    ['cím', html.includes(`<h1>${book.title}</h1>`) || html.includes(`<h1>${book.title}`)],
    ['ISBN', html.includes(book.isbn)],
    ['Archívumi összefoglaló', html.includes('>Archívumi összefoglaló<')],
    ['régi személyes szekciócím eltávolítása', !html.includes('>Ahogy én mesélném<')],
    ['kapcsolódó kiállítás', html.includes(book.related)],
    ['visszalépés a könyvekhez', html.includes('../index.html#books')]
  ];

  for (const [label, ok] of checks) {
    if (!ok) failures.push(`${book.file}: ${label}`);
  }
}

for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`Audited ${books.length} Hungarian book pages.`);
if (failures.length) process.exitCode = 1;
