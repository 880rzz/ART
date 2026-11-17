import assert from 'node:assert/strict';
import fs from 'node:fs';

const exhibitions = [
  'anovilaga','avalosag','balerina-project-new-york','ebredes','enano','euforia',
  'femmefatale','fotokiallitas1','fotokiallitas2','fotokiallitas3','fotokiallitas4',
  'fotokiallitas5','fotokiallitas8','mas-kepp-mas','merfoldkovek1956',
  'szosszenetek','teislehetsz','theframe','themensdream','touch-wien'
];
const books = ['ebredes','szosszenetek','anovilaga','meses-konyv','menopauza-szexi'];
const locales = [
  { prefix: '', tag: 'en', pattern: /\b(?:I|my|me)\b/i },
  { prefix: 'hu/', tag: 'hu', pattern: /(?:fényképez|fotóztam|fotográfiáim|készítettem|szerettem|érdekelt|kerestem|fontosnak tartottam|működtem|gyűjtöttem|számomra|munkámban|dolgozom|dolgoztam|akartam)/i },
  { prefix: 'de-at/', tag: 'de', pattern: /\b(?:ich|mir|mich|mein(?:e|en|em|er)?)\b/i }
];
let validated = 0;
const source = path => fs.readFileSync(path, 'utf8');
const stripTags = text => text.replace(/<[^>]+>/g, ' ').replace(/&(?:nbsp|amp);/g, ' ').replace(/\s+/g, ' ').trim();
function check(path, section, pattern, category) {
  assert.ok(section, path + ': ' + category + ' intro missing');
  const plain = stripTags(section);
  assert.ok(plain.length >= 95, path + ': ' + category + ' intro too short');
  assert.match(plain, pattern, path + ': ' + category + ' lost the photographer-authored voice');
  assert.ok(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(section), path + ': secret inserted');
  validated++;
}
for (const {prefix,tag,pattern} of locales) {
  for (const slug of exhibitions) {
    const path = prefix + 'exhibitions/' + slug + '.html';
    const html = source(path);
    const main = html.indexOf('<main');
    const headEnd = html.indexOf('</header>', main);
    const sectionStart = html.indexOf('<section class="wrap narrow">', headEnd);
    const sectionEnd = html.indexOf('</section>', sectionStart);
    assert.ok(main >= 0 && headEnd > main && sectionStart > headEnd && sectionEnd > sectionStart, path + ': section structure');
    const block = html.slice(sectionStart,sectionEnd);
    const lead = [...block.matchAll(/<p class="lead">([\s\S]*?)<\/p>/g)].slice(0,3).map(x=>x[1]).join(' ');
    check(path,lead,pattern,'exhibition');
    assert.ok(html.includes('rel="canonical"'),path + ': canonical lost');
    assert.ok(html.includes('hreflang="hu-HU"')&&html.includes('hreflang="en"')&&html.includes('hreflang="de-AT"'),path + ': locale links lost');
  }
  for (const slug of books) {
    const path = prefix + 'books/book-' + slug + '.html';
    const html = source(path);
    const start = html.indexOf('<section class="wrap narrow book-lead">');
    const end = html.indexOf('</section>',start);
    assert.ok(start >= 0 && end > start,path + ': book lead structure');
    const leads = [...html.slice(start,end).matchAll(/<p class="lead">([\s\S]*?)<\/p>/g)];
    assert.equal(leads.length,1,path + ': redundant/retired dramatic book introductory copy');
    check(path,leads[0][1],pattern,'book');
    assert.ok(html.includes('data-book-editorial-dossier="'),path + ': independent sourced dossier missing');
  }
  const home = source(prefix + 'index.html');
  check(prefix+'index.html',home.match(/<p class="lead">([\s\S]*?)<\/p>/)?.[1],pattern,'homepage');
  const curator=source(prefix+'curators.html');
  check(prefix+'curators.html',curator.match(/<div class="note"><p class="label u-mb-sm">[\s\S]*?<\/p>\s*<p>([\s\S]*?)<\/p>/)?.[1],pattern,'curator');
  const privatePage=source(prefix+'private-photography.html');
  check(prefix+'private-photography.html',privatePage.match(/<header class="sub"><div class="wrap narrow"><p class="label">[\s\S]*?<\/h1><p class="loc">([\s\S]*?)<\/p>/)?.[1],pattern,'private');
  const press=source(prefix+'press.html');
  check(prefix+'press.html',press.match(/<p class="press-hero__lead">([\s\S]*?)<\/p>/)?.[1],pattern,'press');
}
assert.equal(validated,87,'All 87 substantive public ART pages must have intentional personal editorial framing');
console.log('ART authored voice PASS: 87 canonical public content pages; EN/HU/DE personal intros and source-backed factual layers preserved');
