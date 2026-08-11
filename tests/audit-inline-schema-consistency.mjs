import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const canonicalPersonId = 'https://www.norbertbanhalmi.com/about/';
const canonicalPersonUrl = canonicalPersonId;
const canonicalOrganizationId = 'https://www.norbertbanhalmi.com/#organization';
const canonicalOrganizationName = 'BANHALMI';
const canonicalOrganizationLegalName = 'Norbert Banhalmi e.U.';
const canonicalLogoId = 'https://www.norbertbanhalmi.com/#logo';
const canonicalLogoUrl = 'https://www.norbertbanhalmi.com/assets/img/brand/android-chrome-512x512.png';
const retiredBrandId = 'https://www.norbertbanhalmi.com/#brand';
const retiredCommonsLogo = 'Norbert_Banhalmi_gold_emblem.jpg';
const artWebsiteId = 'https://www.banhalmi.art/#website';
const blogWebsiteId = 'https://blog.banhalmi.art/#website';
const professionalWebsiteId = 'https://www.norbertbanhalmi.com/#website';
const localizedPersonUrls = new Set([
  'https://www.banhalmi.art/hu/norbert-banhalmi',
  'https://www.banhalmi.art/de-at/norbert-banhalmi',
]);
const expectedLanguages = new Map([
  ['hu', 'hu-HU'],
  ['hu-hu', 'hu-HU'],
  ['en', 'en-GB'],
  ['en-gb', 'en-GB'],
  ['de', 'de-AT'],
  ['de-at', 'de-AT'],
]);
const excludedDirectories = new Set(['.git', 'node_modules', '.netlify']);
const errors = [];
const entityDefinitions = new Map();
let htmlCount = 0;
let blockCount = 0;
let canonicalPersonDefinitions = 0;
let canonicalOrgDefinitions = 0;
let canonicalLogoDefinitions = 0;
let artWebsiteDefinitions = 0;

async function collectHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.well-known') continue;
    if (excludedDirectories.has(entry.name)) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtml(absolute));
    else if (entry.isFile() && extname(entry.name).toLowerCase() === '.html') files.push(absolute);
  }
  return files;
}

function asArray(value) {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

function walk(value, visit) {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
    return;
  }
  if (!value || typeof value !== 'object') return;
  visit(value);
  for (const child of Object.values(value)) walk(child, visit);
}

function normalizeTypes(value) {
  return asArray(value).filter(item => typeof item === 'string').sort();
}

function hasAny(node, keys) {
  return keys.some(key => Object.prototype.hasOwnProperty.call(node, key));
}

function isDefinition(node, type, keys) {
  return normalizeTypes(node['@type']).includes(type) || hasAny(node, keys);
}

function isAllowedPersonUrlDifference(id, firstUrl, nextUrl) {
  if (id !== canonicalPersonId) return false;
  const urls = new Set([firstUrl, nextUrl]);
  if (!urls.has(canonicalPersonUrl)) return false;
  return [...urls].every(url => url === canonicalPersonUrl || localizedPersonUrls.has(url));
}

function registerEntity(node, source) {
  const id = node['@id'];
  if (typeof id !== 'string' || !id.startsWith('https://www.banhalmi.art/')) return;
  const signature = {
    types: normalizeTypes(node['@type']),
    url: typeof node.url === 'string' ? node.url : null,
  };
  const previous = entityDefinitions.get(id);
  if (!previous) {
    entityDefinitions.set(id, { signature, source });
    return;
  }
  if (previous.signature.types.length && signature.types.length &&
      JSON.stringify(previous.signature.types) !== JSON.stringify(signature.types)) {
    errors.push(`${source}: conflicting @type for ${id}; previously defined in ${previous.source}`);
  }
  if (previous.signature.url && signature.url && previous.signature.url !== signature.url &&
      !isAllowedPersonUrlDifference(id, previous.signature.url, signature.url)) {
    errors.push(`${source}: conflicting url for ${id}; previously defined in ${previous.source}`);
  }
}

function relationIds(value) {
  return asArray(value).map(item => item && typeof item === 'object' ? item['@id'] : null).filter(Boolean);
}

function inspectNode(node, source, expectedLanguage) {
  const id = node['@id'];
  if (typeof id === 'string' && id.includes('/entities/')) {
    errors.push(`${source}: legacy /entities/ identifier remains: ${id}`);
  }
  if (id === retiredBrandId) {
    errors.push(`${source}: retired standalone Brand identity remains: ${retiredBrandId}`);
  }

  const types = normalizeTypes(node['@type']);
  const personDefinition = id === canonicalPersonId && isDefinition(node, 'Person', ['name','alternateName','givenName','familyName','jobTitle','sameAs','identifier','url']);
  const organizationDefinition = id === canonicalOrganizationId && isDefinition(node, 'Organization', ['name','legalName','founder','sameAs','description','url','logo']);
  const logoDefinition = id === canonicalLogoId && isDefinition(node, 'ImageObject', ['url','contentUrl','caption','width','height','creator','copyrightHolder']);
  const websiteDefinition = id === artWebsiteId && isDefinition(node, 'WebSite', ['url','name','inLanguage','publisher','creator','about','copyrightHolder']);

  if (types.includes('Person')) {
    const name = typeof node.name === 'string' ? node.name.toLowerCase() : '';
    const isNorbert = name.includes('bánhalmi norbert') || name.includes('banhalmi norbert') || id === canonicalPersonId;
    if (isNorbert && id !== canonicalPersonId) {
      errors.push(`${source}: Norbert Bánhalmi Person must use ${canonicalPersonId}, found ${String(id)}`);
    }
    if (isNorbert && typeof node.url === 'string' &&
        node.url !== canonicalPersonUrl && !localizedPersonUrls.has(node.url)) {
      errors.push(`${source}: unexpected Norbert Bánhalmi Person url: ${node.url}`);
    }
  }

  if (personDefinition) {
    canonicalPersonDefinitions += 1;
    if (node.name !== 'Bánhalmi Norbert') errors.push(`${source}: canonical Person name must be Bánhalmi Norbert`);
    if (node.url !== canonicalPersonUrl) errors.push(`${source}: canonical Person url must be ${canonicalPersonUrl}`);
  }

  if (organizationDefinition) {
    canonicalOrgDefinitions += 1;
    if (node.name !== canonicalOrganizationName || node.legalName !== canonicalOrganizationLegalName) {
      errors.push(`${source}: canonical Organization name/legalName must be ${canonicalOrganizationName} / ${canonicalOrganizationLegalName}`);
    }
    if (Object.prototype.hasOwnProperty.call(node, 'brand')) {
      errors.push(`${source}: canonical Organization still references retired ${retiredBrandId}`);
    }
    if (node.logo?.['@id'] !== canonicalLogoId) {
      errors.push(`${source}: canonical Organization logo must reference ${canonicalLogoId}`);
    }
  }

  if (logoDefinition) {
    canonicalLogoDefinitions += 1;
    if (!types.includes('ImageObject')) errors.push(`${source}: canonical logo must be ImageObject`);
    if (node.url !== canonicalLogoUrl || node.contentUrl !== canonicalLogoUrl) {
      errors.push(`${source}: canonical logo URL/contentUrl must both use ${canonicalLogoUrl}`);
    }
    if (node.width !== 512 || node.height !== 512 || node.caption !== 'BANHALMI') {
      errors.push(`${source}: canonical logo dimensions/caption must be 512×512 / BANHALMI`);
    }
  }

  if (websiteDefinition) {
    artWebsiteDefinitions += 1;
    if (node.inLanguage !== expectedLanguage) {
      errors.push(`${source}: ART WebSite inLanguage must be ${expectedLanguage}, found ${String(node.inLanguage)}`);
    }
    const related = new Set(relationIds(node.isRelatedTo));
    if (!related.has(professionalWebsiteId) || !related.has(blogWebsiteId)) {
      errors.push(`${source}: ART WebSite must relate to the professional and blog WebSites`);
    }
  }

  registerEntity(node, source);
}

const htmlFiles = await collectHtml(root);
for (const file of htmlFiles) {
  htmlCount += 1;
  const source = relative(root, file).replaceAll('\\', '/');
  const html = await readFile(file, 'utf8');
  const htmlLang = html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i)?.[1]?.toLowerCase() || '';
  const expectedLanguage = expectedLanguages.get(htmlLang) || (source.startsWith('hu/') ? 'hu-HU' : source.startsWith('de-at/') ? 'de-AT' : 'en-GB');
  const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let index = 0;
  while ((match = pattern.exec(html)) !== null) {
    index += 1;
    blockCount += 1;
    const label = `${source}#jsonld-${index}`;
    if (match[1].includes(retiredCommonsLogo)) {
      errors.push(`${label}: retired Wikimedia logo definition remains`);
    }
    let parsed;
    try {
      parsed = JSON.parse(match[1].trim());
    } catch (error) {
      errors.push(`${label}: invalid JSON-LD (${error.message})`);
      continue;
    }
    walk(parsed, node => inspectNode(node, label, expectedLanguage));
  }
}

if (canonicalPersonDefinitions === 0) errors.push('no canonical Person definitions were found');
if (canonicalOrgDefinitions === 0) errors.push('no canonical Organization definitions were found');
if (canonicalLogoDefinitions === 0) errors.push('no canonical logo definitions were found');
if (artWebsiteDefinitions === 0) errors.push('no ART WebSite definitions were found');

if (errors.length) {
  console.error(`Inline schema consistency audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Inline schema consistency audit passed: ${htmlCount} HTML files, ${blockCount} JSON-LD blocks, ${entityDefinitions.size} local entity identifiers; ${canonicalPersonDefinitions} Person, ${canonicalOrgDefinitions} Organization, ${canonicalLogoDefinitions} logo and ${artWebsiteDefinitions} ART WebSite definitions are aligned without expanding bare @id references.`);
