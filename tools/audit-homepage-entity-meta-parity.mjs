import fs from 'node:fs';

const files = ['index.html','hu/index.html','de-at/index.html'];
const GERSTHOFER_ID = 'https://www.banhalmiphotography.com/#vienna-gersthofer-office';
const PERSON_ID = 'https://www.banhalmiphotography.com/about/';
const ORG_ID = 'https://www.banhalmiphotography.com/#organization';
const HU_DESC = 'Bánhalmi Norbert 1999 óta épülő életművének hivatalos archívuma: fotográfiák, könyvek, kiállítások, filmek és a hozzájuk kapcsolódó történetek.';
const failures = [];

for (const file of files) {
  const html = fs.readFileSync(file,'utf8');
  if (!/<meta property="og:site_name" content="BANHALMI ART">/i.test(html)) failures.push(`${file}: og:site_name must be BANHALMI ART`);
  if (/<meta name="(?:geo\.region|geo\.placename|ICBM|geo\.position)"/i.test(html)) failures.push(`${file}: legacy single-city GEO meta survived`);
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (!m) { failures.push(`${file}: JSON-LD missing`); continue; }
  let data;
  try { data = JSON.parse(m[1]); } catch (e) { failures.push(`${file}: invalid JSON-LD ${e.message}`); continue; }
  const graph = data['@graph'];
  if (!Array.isArray(graph)) { failures.push(`${file}: @graph missing`); continue; }
  const person = graph.find(x => x && x['@id'] === PERSON_ID && x['@type'] === 'Person');
  const org = graph.find(x => x && x['@id'] === ORG_ID && x['@type'] === 'Organization');
  const office = graph.find(x => x && x['@id'] === GERSTHOFER_ID);
  if (!person?.workLocation?.some(x => x?.['@id'] === GERSTHOFER_ID)) failures.push(`${file}: Person Gersthofer workLocation missing`);
  if (!org?.location?.some(x => x?.['@id'] === GERSTHOFER_ID)) failures.push(`${file}: Organization Gersthofer location missing`);
  if (!office || !/not a photographic studio/i.test(office.description || '')) failures.push(`${file}: Gersthofer non-studio Place contract missing`);
  const pages = graph.filter(x => x && (x['@type'] === 'WebPage' || (Array.isArray(x['@type']) && x['@type'].includes('WebPage'))));
  if (!pages.length || pages.some(x => x.dateModified !== '2026-10-31')) failures.push(`${file}: WebPage dateModified freshness drift`);

  const expectedTitle = {
    'index.html':'Norbert Banhalmi — The Anatomy of Presence | Official Art Archive',
    'hu/index.html':'Bánhalmi Norbert fotóművész | BANHALMI ART',
    'de-at/index.html':'Norbert Banhalmi Künstlerarchiv | BANHALMI ART'
  }[file];
  if (!html.includes('<title>'+expectedTitle+'</title>')) failures.push(file+': localized title mismatch');
  for(const [attr,key] of [['property','og:title'],['name','twitter:title'],['property','og:image:alt'],['name','twitter:image:alt']]){
    if(!html.includes('<meta '+attr+'="'+key+'" content="'+expectedTitle+'">')) failures.push(file+': localized '+key+' mismatch');
  }
  if (pages.some(x => x.name !== expectedTitle || x.headline !== expectedTitle)) failures.push(file+': WebPage localized title/headline drift');

  if (file === 'hu/index.html' && pages.some(x => x.description !== HU_DESC)) failures.push(`${file}: WebPage Hungarian description parity drift`);
}


const machine = JSON.parse(fs.readFileSync('data/machine-core.json','utf8'));
const knowledge = JSON.parse(fs.readFileSync('knowledge-core.json','utf8'));
const expectedNames = {'hu':'Bánhalmi Norbert','en':'Norbert Banhalmi','de-AT':'Norbert Banhalmi'};
for(const source of [machine,knowledge]){
  for(const [lang,name] of Object.entries(expectedNames)){
    if(source.archiveIdentity?.primaryByLanguage?.[lang] !== name) failures.push('ART archiveIdentity policy drift '+lang);
    if(!source.archiveIdentity?.secondaryByLanguage?.[lang]?.includes('BANHALMI')) failures.push('ART secondary brand missing '+lang);
  }
}

const hu = fs.readFileSync('hu/index.html','utf8');
if (hu.includes('Az vezetői portré-')) failures.push('hu/index.html: Hungarian article typo survived');
const metaDesc = hu.match(/<meta name="description" content="([^"]*)">/i)?.[1];
const ogDesc = hu.match(/<meta property="og:description" content="([^"]*)">/i)?.[1];
if (metaDesc !== HU_DESC) failures.push('hu/index.html: corrected meta description missing');
if (ogDesc !== HU_DESC) failures.push('hu/index.html: corrected OG description missing');

if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('ART homepage entity/meta parity passed for EN/HU/DE, including Gersthofer non-studio role and corrected Hungarian metadata.');
