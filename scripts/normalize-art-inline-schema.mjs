import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const personId = 'https://www.norbertbanhalmi.com/about/';
const organizationId = 'https://www.norbertbanhalmi.com/#organization';
const organizationName = 'Bánhalmi Norbert e.U.';
const logoId = 'https://www.norbertbanhalmi.com/#logo';
const logoUrl = 'https://www.norbertbanhalmi.com/assets/img/brand/android-chrome-512x512.png';
const retiredBrandId = 'https://www.norbertbanhalmi.com/#brand';
const artWebsiteId = 'https://www.banhalmi.art/#website';
const professionalWebsiteId = 'https://www.norbertbanhalmi.com/#website';
const blogWebsiteId = 'https://blog.banhalmi.art/#website';
const skip = new Set(['.git', 'node_modules', '_site', 'playwright-report', 'test-results']);
const files = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}
await walk(root);

function pageLanguage(html, file) {
  const raw = html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i)?.[1]?.toLowerCase();
  if (raw === 'hu' || raw === 'hu-hu' || file.includes(`${path.sep}hu${path.sep}`)) return 'hu-HU';
  if (raw === 'de' || raw === 'de-at' || file.includes(`${path.sep}de-at${path.sep}`)) return 'de-AT';
  return 'en-GB';
}

function sameId(value, id) {
  return value && typeof value === 'object' && value['@id'] === id;
}

function typesOf(value) {
  const raw = value?.['@type'];
  return new Set((Array.isArray(raw) ? raw : raw ? [raw] : []).filter(item => typeof item === 'string'));
}

function hasAny(value, keys) {
  return keys.some(key => Object.prototype.hasOwnProperty.call(value, key));
}

function isDefinition(value, type, keys) {
  return typesOf(value).has(type) || hasAny(value, keys);
}

function normalize(value, language, stats) {
  if (Array.isArray(value)) {
    return value
      .filter(item => !sameId(item, retiredBrandId))
      .map(item => normalize(item, language, stats));
  }
  if (!value || typeof value !== 'object') return value;

  const id = value['@id'];
  const personDefinition = id === personId && isDefinition(value, 'Person', ['name','alternateName','givenName','familyName','jobTitle','sameAs','identifier','url']);
  const organizationDefinition = id === organizationId && isDefinition(value, 'Organization', ['name','legalName','founder','sameAs','description','url','logo']);
  const logoDefinition = id === logoId && isDefinition(value, 'ImageObject', ['url','contentUrl','caption','width','height','creator','copyrightHolder']);
  const artWebsiteDefinition = id === artWebsiteId && isDefinition(value, 'WebSite', ['url','name','inLanguage','publisher','creator','about','copyrightHolder']);

  for (const key of Object.keys(value)) {
    if (key === 'brand' && sameId(value[key], retiredBrandId)) {
      delete value[key];
      stats.brandReferencesRemoved += 1;
      continue;
    }
    value[key] = normalize(value[key], language, stats);
  }

  if (personDefinition) {
    value.name = 'Bánhalmi Norbert';
    value.url = personId;
    stats.personDefinitions += 1;
  }

  if (organizationDefinition) {
    value.name = organizationName;
    value.legalName = organizationName;
    delete value.brand;
    value.logo = { '@id': logoId };
    stats.organizationDefinitions += 1;
  }

  if (logoDefinition) {
    value['@type'] = 'ImageObject';
    value.url = logoUrl;
    value.contentUrl = logoUrl;
    value.width = 512;
    value.height = 512;
    value.caption = 'BANHALMI';
    value.creator = { '@id': personId };
    value.copyrightHolder = { '@id': personId };
    delete value.creditText;
    stats.logoDefinitions += 1;
  }

  if (artWebsiteDefinition) {
    value.inLanguage = language;
    value.publisher = { '@id': organizationId };
    value.creator = { '@id': personId };
    value.about = { '@id': personId };
    const current = Array.isArray(value.isRelatedTo) ? value.isRelatedTo : value.isRelatedTo ? [value.isRelatedTo] : [];
    const ids = new Set(current.map(item => item?.['@id']).filter(Boolean));
    ids.add(professionalWebsiteId);
    ids.add(blogWebsiteId);
    value.isRelatedTo = [...ids].map(idValue => ({ '@id': idValue }));
    stats.websiteDefinitions += 1;
  }

  if (typeof value.inLanguage === 'string') {
    if (value.inLanguage === 'hu') value.inLanguage = 'hu-HU';
    else if (value.inLanguage === 'en') value.inLanguage = 'en-GB';
    else if (value.inLanguage === 'de') value.inLanguage = 'de-AT';
  }

  return value;
}

const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
const stats = {
  filesChanged: 0,
  blocksChanged: 0,
  brandNodesRemoved: 0,
  brandReferencesRemoved: 0,
  personDefinitions: 0,
  organizationDefinitions: 0,
  logoDefinitions: 0,
  websiteDefinitions: 0,
};

for (const file of files) {
  const original = await readFile(file, 'utf8');
  const language = pageLanguage(original, file);
  const updated = original.replace(pattern, (whole, body) => {
    let parsed;
    try { parsed = JSON.parse(body.trim()); }
    catch { return whole; }

    if (Array.isArray(parsed['@graph'])) {
      const before = parsed['@graph'].length;
      parsed['@graph'] = parsed['@graph'].filter(node => node?.['@id'] !== retiredBrandId);
      stats.brandNodesRemoved += before - parsed['@graph'].length;
    }

    const before = JSON.stringify(parsed);
    normalize(parsed, language, stats);
    const after = JSON.stringify(parsed);
    if (before === after) return whole;
    stats.blocksChanged += 1;
    const openTag = whole.slice(0, whole.indexOf('>') + 1);
    return `${openTag}${after}</script>`;
  });

  if (updated !== original) {
    await writeFile(file, updated, 'utf8');
    stats.filesChanged += 1;
  }
}

console.log(JSON.stringify(stats, null, 2));
if (stats.organizationDefinitions === 0 || stats.logoDefinitions === 0 || stats.websiteDefinitions === 0) {
  throw new Error('Canonical inline schema definitions were not found; refusing a partial normalization.');
}
