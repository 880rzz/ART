import assert from 'node:assert/strict';
import fs from 'node:fs';

const books = [
  { slug: 'ebredes', period: 'III', evidence: 'www.veol.hu/vezeto-hirek/2018/03/' },
  { slug: 'szosszenetek', period: 'III', evidence: 'epa.oszk.hu/01900/01927/00394/' },
  { slug: 'anovilaga', period: 'III', evidence: 'youtu.be/ZzZj0ompifI' },
  { slug: 'meses-konyv', dossier: 'meses', period: 'IV', evidence: 'bookberry.hu/termek/meses-konyv/' },
  { slug: 'menopauza-szexi', dossier: 'menopauza', period: 'IV', evidence: 'fuga.org.hu/fevent/a-menopauza-szexi-konyvbemutato-es-kiallitas/' }
];
const locales = ['', 'hu/', 'de-at/'];
let audited = 0;
for (const book of books) {
  for (const prefix of locales) {
    const pathname = prefix + 'books/book-' + book.slug + '.html';
    const html = fs.readFileSync(pathname, 'utf8');
    const marker = 'data-book-editorial-dossier="' + (book.dossier || book.slug) + '"';
    const start = html.indexOf(marker);
    assert.ok(start >= 0, pathname + ': missing researched, visible editorial dossier');
    assert.equal(html.split(marker).length - 1, 1, pathname + ': duplicated dossier');
    const section = html.slice(start, html.indexOf('</section>', start));
    assert.ok(section.length > 2200, pathname + ': research section is not detailed enough');
    assert.ok((section.match(/<h3>/g) || []).length >= 3, pathname + ': too few thematic sub-sections');
    assert.ok((section.match(/<p\b/g) || []).length >= 5, pathname + ': missing explanatory paragraphs');
    assert.ok(section.includes(book.period), pathname + ': oeuvre period absent');
    assert.ok(section.includes(book.evidence), pathname + ': cited source is absent');
    assert.ok(section.includes('rel="noopener noreferrer"'), pathname + ': sourced external links must be safe');
    assert.ok(html.includes('rel="canonical"'), pathname + ': canonical must be preserved');
    assert.ok(html.includes('hreflang="en"') && html.includes('hreflang="hu-HU"') && html.includes('hreflang="de-AT"'), pathname + ': three-way hreflang parity must survive');
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(scripts.length, pathname + ': original structured data missing');
    for (const m of scripts) JSON.parse(m[1]);
    audited++;
  }
}
assert.equal(audited, 15, 'Five books must be documented in all three languages');
for (const prefix of locales) {
  const page = fs.readFileSync(prefix + 'books/book-szosszenetek.html', 'utf8');
  assert.ok(page.includes('9786150000534'), 'Keep National Bibliography ISBN for Szösszenetek');
  const literary = fs.readFileSync(prefix + 'books/book-meses-konyv.html', 'utf8');
  assert.ok(literary.includes('Hayden Moore') && literary.includes('Carol Souya') && literary.includes('Becca Prior'), 'Literary authors must remain explicit');
  assert.ok(!literary.includes('webaruhaz.rozsavolgyi.hu'), 'Retired antiquarian URL must not return');
  const menopause = fs.readFileSync(prefix + 'books/book-menopauza-szexi.html', 'utf8');
  assert.ok(menopause.includes('Papaya Therapy') && menopause.includes('Nagy'), 'Preserve separate literary and photo credits');
  assert.ok(menopause.includes('data-book-creative-start="2022"'), 'Book origin circa 2022 must survive in all languages');
  assert.ok(menopause.includes('record-period__no">IV'), 'Artistic period must reflect project origin, not publication');
}

const originalBibliographicTitles = [
  { slug: 'ebredes', original: 'Ébredés — az Új kezdet!', isbn: '9789631286632', alternates: ['Awakening: The New Beginning!', 'Erwachen: Der neue Anfang!'] },
  { slug: 'szosszenetek', original: 'Szösszenetek', isbn: '9786150000534', alternates: ['Snippets', 'Schnipsel'] },
  { slug: 'anovilaga', original: 'A Nő világa', isbn: '9786150018294', alternates: ['The World of Woman', 'Die Welt der Frau'] }
];
for (const book of originalBibliographicTitles) {
  for (const prefix of locales) {
    const pathname = prefix + 'books/book-' + book.slug + '.html';
    const html = fs.readFileSync(pathname, 'utf8');
    const scripts = [...html.matchAll(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/g)];
    const graph = scripts.flatMap(m => JSON.parse(m[1])['@graph'] || []);
    const structuredBook = graph.find(x => x['@type'] === 'Book');
    assert.ok(structuredBook, pathname + ': missing Book schema');
    assert.equal(structuredBook.name, book.original, pathname + ': bibliographic Book.name must remain in original language');
    assert.equal(structuredBook.isbn, book.isbn, pathname + ': original ISBN drift');
    for (const alternate of book.alternates) {
      assert.ok(structuredBook.alternateName?.includes(alternate), pathname + ': missing alternate title ' + alternate);
    }
  }
}

console.log('Five research-backed books: 15 expanded archive pages, source URLs, period attribution, structured data and roles PASS');
