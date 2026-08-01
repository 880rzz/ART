import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { requireExplicitRun } from './lib/one-time-migration.mjs';
requireExplicitRun('fix-cross-site-audit', 'Double-escapes HTML entities, turning &#x27; into &amp;#x27; in visible text.');

const root = path.resolve(import.meta.dirname, '..');
const htmlFiles = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'data') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}

function langFor(rel) {
  if (rel.startsWith('hu/')) return { html: 'hu', og: 'hu_HU', alternates: ['en_US', 'de_AT'] };
  if (rel.startsWith('de-at/')) return { html: 'de-AT', og: 'de_AT', alternates: ['en_US', 'hu_HU'] };
  return { html: 'en', og: 'en_US', alternates: ['de_AT', 'hu_HU'] };
}

function attr(html, property, name = 'property') {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<meta\\s+${name}=["']${escaped}["']\\s+content=["']([^"']*)["'][^>]*>`, 'i'))?.[1]
    || html.match(new RegExp(`<meta\\s+content=["']([^"']*)["']\\s+${name}=["']${escaped}["'][^>]*>`, 'i'))?.[1]
    || '';
}

function escapeAttr(value = '') {
  return value.replace(/&(?!(?:amp|quot|#39|lt|gt);)/g, '&amp;').replace(/"/g, '&quot;');
}

function replaceOrInsert(html, selector, tag) {
  const re = selector;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace('</head>', `${tag}\n</head>`);
}

function removeMeta(html, key, name = 'name') {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`\\n?<meta\\b[^>]*${name}=["']${escaped}["'][^>]*>`, 'gi'), '');
}

function normalizeSocial(html, rel) {
  const language = langFor(rel);
  html = html.replace(/<meta\b[^>]*property=["']og:locale(?::alternate)?["'][^>]*>\s*/gi, '');
  const localeTags = [
    `<meta property="og:locale" content="${language.og}">`,
    ...language.alternates.map((value) => `<meta property="og:locale:alternate" content="${value}">`),
  ].join('\n');
  const anchor = html.match(/<meta\b[^>]*property=["']og:site_name["'][^>]*>/i)?.[0]
    || html.match(/<meta\b[^>]*property=["']og:type["'][^>]*>/i)?.[0];
  if (anchor) html = html.replace(anchor, `${anchor}\n${localeTags}`);
  else html = html.replace('</head>', `${localeTags}\n</head>`);

  const title = attr(html, 'og:title') || html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
  const description = attr(html, 'og:description') || attr(html, 'description', 'name');
  const image = attr(html, 'og:image');
  const imageAlt = attr(html, 'og:image:alt') || title;

  html = replaceOrInsert(html, /<meta\b[^>]*name=["']twitter:card["'][^>]*>/i, '<meta name="twitter:card" content="summary_large_image">');
  if (title) html = replaceOrInsert(html, /<meta\b[^>]*name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${escapeAttr(title)}">`);
  if (description) html = replaceOrInsert(html, /<meta\b[^>]*name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${escapeAttr(description)}">`);
  if (image) html = replaceOrInsert(html, /<meta\b[^>]*name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${escapeAttr(image)}">`);
  if (imageAlt) html = replaceOrInsert(html, /<meta\b[^>]*name=["']twitter:image:alt["'][^>]*>/i, `<meta name="twitter:image:alt" content="${escapeAttr(imageAlt)}">`);
  return html;
}

function syncDescription(html, description) {
  const escaped = escapeAttr(description);
  html = html.replace(/<meta\b[^>]*name=["']description["'][^>]*>/i, `<meta name="description" content="${escaped}">`);
  html = html.replace(/<meta\b[^>]*property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escaped}">`);
  html = html.replace(/<meta\b[^>]*name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${escaped}">`);
  html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/i, (match, open, jsonText, close) => {
    try {
      const data = JSON.parse(jsonText);
      for (const node of data['@graph'] || []) {
        if (node['@type'] === 'Book' || node['@type'] === 'ExhibitionEvent' || node['@type'] === 'WebPage') {
          if (node.url && html.includes(node.url)) node.description = description;
          else if (node['@type'] === 'Book') node.description = description;
        }
      }
      return `${open}${JSON.stringify(data)}${close}`;
    } catch { return match; }
  });
  return html;
}

const snippetsDescriptions = {
  'books/book-szosszenetek.html': 'Snippets is a 2017 interdisciplinary book combining poetry, photography and moving image. It was created by Vincent & Vincent, Olga Kovács, Péter Telekes and Norbert Bánhalmi.',
  'de-at/books/book-szosszenetek.html': 'Szösszenetek ist ein interdisziplinäres Buch aus dem Jahr 2017, das Lyrik, Fotografie und Bewegtbild verbindet. Es entstand mit Vincent & Vincent, Olga Kovács, Péter Telekes und Norbert Bánhalmi.',
  'hu/books/book-szosszenetek.html': 'A Szösszenetek 2017-ben megjelent összművészeti kötet, amely költészetet, fotográfiát és mozgóképes gondolkodást kapcsol össze. A projekt Vincent & Vincent, Kovács Olga, Telekes Péter és Bánhalmi Norbert együttműködésében készült.',
};

await walk(root);
const changed = [];
for (const file of htmlFiles) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const original = await readFile(file, 'utf8');
  let html = original;

  if (/\/(?:books|exhibitions)\//.test(`/${rel}`)) {
    for (const key of ['geo.region', 'geo.placename', 'ICBM', 'geo.position']) html = removeMeta(html, key);
  }

  html = html.replaceAll('G-YLEMCP6YQ8', 'G-90C452LJKQ');
  html = html.replace(/gtag\('config','G-90C452LJKQ',\{'anonymize_ip':true\}\);/g,
    "gtag('config','G-90C452LJKQ',{'anonymize_ip':true,'allow_google_signals':false,'allow_ad_personalization_signals':false,'linker':{'domains':['banhalmi.art','norbertbanhalmi.com']}});");

  if (/szosszenetek/i.test(rel) || /Szösszenetek|Snippets/i.test(html)) {
    html = html.replace(/2310005245015|9786155596766|978-615-5596-76-6|9786150000534|978-615-00-0053-4/g, '9786150000534');
    html = html.replace(/("isbn"\s*:\s*")[^"]+("\s*[,}])/g, '$19786150000534$2');
  }

  if (snippetsDescriptions[rel]) html = syncDescription(html, snippetsDescriptions[rel]);

  html = html
    .replace(/twenty[- ]five years/gi, 'since 1999')
    .replace(/25 years/gi, 'since 1999')
    .replace(/huszonöt éve/gi, '1999 óta')
    .replace(/25 éve/gi, '1999 óta')
    .replace(/seit 25 Jahren/gi, 'seit 1999');

  html = html
    .replace(/twenty documented exhibitions and long-term projects/gi, 'nineteen completed exhibitions and one project in development')
    .replace(/20 documented exhibitions and long-term projects/gi, '19 completed exhibitions and 1 project in development')
    .replace(/húsz dokumentált kiállítás(?: és hosszú távú projekt)?/gi, 'tizenkilenc megvalósult kiállítás és egy fejlesztés alatt álló projekt')
    .replace(/zwanzig dokumentierte Ausstellungen(?: und langfristige Projekte)?/gi, 'neunzehn realisierte Ausstellungen und ein Projekt in Entwicklung');

  if (!/http-equiv=["']refresh["']/i.test(html)) html = normalizeSocial(html, rel);

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    changed.push(rel);
  }
}
console.log(JSON.stringify({ changed, total: changed.length }, null, 2));
