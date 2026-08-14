import fs from 'node:fs';

const files = ['index.html','hu/index.html','de-at/index.html'];
const GERSTHOFER_ID = 'https://www.norbertbanhalmi.com/#vienna-gersthofer-office';
const PERSON_ID = 'https://www.norbertbanhalmi.com/about/';
const ORG_ID = 'https://www.norbertbanhalmi.com/#organization';
const HU_DESC = 'Bánhalmi Norbert 1999 óta épülő életművének hivatalos archívuma: fotográfiák, könyvek, kiállítások, filmek és a hozzájuk kapcsolódó történetek.';

const office = {
  '@type': 'Place',
  '@id': GERSTHOFER_ID,
  name: 'BANHALMI Vienna — Gersthofer office & client meeting location',
  description: 'Active Vienna office and client meeting location. This is not a photographic studio.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Gersthofer Straße 150–154/6/2',
    postalCode: '1180',
    addressLocality: 'Wien',
    addressCountry: 'AT'
  },
  containedInPlace: {
    '@type': 'City',
    name: 'Wien',
    sameAs: 'https://www.wikidata.org/wiki/Q1741'
  }
};

function ensureRef(list, id) {
  const out = Array.isArray(list) ? [...list] : [];
  if (!out.some(x => x && x['@id'] === id)) out.push({'@id': id});
  return out;
}

function patchJsonLd(html, file) {
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i;
  const m = html.match(re);
  if (!m) throw new Error(`${file}: primary JSON-LD script missing`);
  const data = JSON.parse(m[1]);
  if (!Array.isArray(data['@graph'])) throw new Error(`${file}: @graph missing`);
  const graph = data['@graph'];
  const person = graph.find(x => x && x['@id'] === PERSON_ID && x['@type'] === 'Person');
  const org = graph.find(x => x && x['@id'] === ORG_ID && x['@type'] === 'Organization');
  if (!person || !org) throw new Error(`${file}: canonical Person/Organization missing`);
  person.workLocation = ensureRef(person.workLocation, GERSTHOFER_ID);
  org.location = ensureRef(org.location, GERSTHOFER_ID);
  const existingOffice = graph.find(x => x && x['@id'] === GERSTHOFER_ID);
  if (existingOffice) Object.assign(existingOffice, office);
  else graph.push(office);
  for (const node of graph) {
    if (node && (node['@type'] === 'WebPage' || (Array.isArray(node['@type']) && node['@type'].includes('WebPage')))) {
      node.dateModified = '2026-08-14';
      if (file === 'hu/index.html') node.description = HU_DESC;
    }
  }
  return html.replace(re, `<script type="application/ld+json">${JSON.stringify(data)}</script>`);
}

for (const file of files) {
  let html = fs.readFileSync(file,'utf8');
  html = html.replace(/<meta property="og:site_name" content="BANHALMI">/g, '<meta property="og:site_name" content="BANHALMI ART">');
  html = html.replace(/^<meta name="(?:geo\.region|geo\.placename|ICBM|geo\.position)"[^>]*>\s*$/gmi, '');
  html = patchJsonLd(html, file);
  if (file === 'hu/index.html') {
    html = html.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${HU_DESC}">`);
    html = html.replace(/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${HU_DESC}">`);
    html = html.replace(/Az vezetői portré-/g, 'A vezetői portré-');
  }
  fs.writeFileSync(file, html);
}
console.log('ART homepage entity/meta remediation complete for EN/HU/DE.');
