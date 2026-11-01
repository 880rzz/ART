import fs from 'node:fs';

const pages = [
  { path: 'index.html', expectedVisible: 18 },
  { path: 'hu/index.html', expectedVisible: 131 },
  { path: 'de-at/index.html', expectedVisible: 18 }
];

const errors = [];

for (const page of pages) {
  const html = fs.readFileSync(page.path, 'utf8');
  const scripts = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);

  let gallery = null;
  for (const source of scripts) {
    let doc;
    try { doc = JSON.parse(source); } catch { continue; }
    const nodes = Array.isArray(doc?.['@graph']) ? doc['@graph'] : [doc];
    gallery = nodes.find((node) => {
      const types = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
      return types.includes('ImageGallery');
    });
    if (gallery) break;
  }

  if (!gallery) {
    errors.push(`${page.path}: ImageGallery schema missing`);
    continue;
  }

  const media = Array.isArray(gallery.associatedMedia) ? gallery.associatedMedia : [];
  const copyrightTargets = (html.match(/id=["']copyright["']/g) || []).length;
  if (copyrightTargets !== 1) {
    errors.push(`${page.path}: expected exactly one #copyright licensing target, found ${copyrightTargets}`);
  }
  if (gallery.numberOfItems !== media.length) {
    errors.push(`${page.path}: numberOfItems=${gallery.numberOfItems} but associatedMedia=${media.length}`);
  }
  if (media.length !== page.expectedVisible) {
    errors.push(`${page.path}: expected ${page.expectedVisible} gallery images, found ${media.length}`);
  }

  for (const [index, image] of media.entries()) {
    const label = `${page.path} image ${index + 1}`;
    const types = Array.isArray(image?.['@type']) ? image['@type'] : [image?.['@type']];
    if (!types.includes('ImageObject')) errors.push(`${label}: missing ImageObject type`);
    for (const key of ['contentUrl','url','creator','copyrightHolder','copyrightNotice','creditText','license','acquireLicensePage']) {
      if (!image?.[key]) errors.push(`${label}: missing ${key}`);
    }
    if (image?.creator?.['@id'] !== 'https://www.banhalmiphotography.com/about/') {
      errors.push(`${label}: non-canonical creator`);
    }
    if (image?.copyrightHolder?.['@id'] !== 'https://www.banhalmiphotography.com/about/') {
      errors.push(`${label}: non-canonical copyrightHolder`);
    }
    if (image?.license !== 'https://www.banhalmi.art/#copyright') {
      errors.push(`${label}: non-canonical license target`);
    }
    if (!String(image?.acquireLicensePage || '').startsWith('https://www.banhalmiphotography.com/')) {
      errors.push(`${label}: acquireLicensePage must use the canonical Professional domain`);
    }
  }
}

const sharedIdentityChecks = [
  {
    path: 'index.html',
    id: 'https://www.banhalmi.art/#primaryimage',
    contentUrlIncludes: 'hero-signature',
    license: 'https://www.banhalmi.art/#copyright',
    acquireIncludes: 'https://www.banhalmiphotography.com/'
  },
  {
    path: 'index.html',
    id: 'https://www.banhalmiphotography.com/#logo',
    contentUrlIncludes: 'android-chrome-512x512.png',
    license: 'https://www.banhalmiphotography.com/terms-conditions/',
    acquireIncludes: 'https://www.banhalmiphotography.com/requestaquote/'
  },
  {
    path: 'index.html',
    id: 'https://www.banhalmiphotography.com/about/#portrait',
    contentUrlIncludes: 'Norbert-Banhalmi-self-portrait.jpg',
    license: 'https://creativecommons.org/licenses/by-sa/4.0/',
    acquireIncludes: 'commons.wikimedia.org/wiki/File:Norbert-Banhalmi-self-portrait.jpg'
  }
];

function findImageById(html, id) {
  const scripts = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  for (const source of scripts) {
    let doc;
    try { doc = JSON.parse(source); } catch { continue; }
    const nodes = [];
    collectNodes(doc, nodes);
    const match = nodes.find((node) => {
      const types = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
      return types.includes('ImageObject') && node?.['@id'] === id;
    });
    if (match) return match;
  }
  return null;
}

for (const check of sharedIdentityChecks) {
  const html = fs.readFileSync(check.path, 'utf8');
  const image = findImageById(html, check.id);
  if (!image) {
    errors.push(`${check.path}: missing shared ImageObject ${check.id}`);
    continue;
  }
  for (const key of ['contentUrl', 'creator', 'copyrightHolder', 'copyrightNotice', 'creditText', 'license', 'acquireLicensePage']) {
    if (!image[key]) errors.push(`${check.path}: ${check.id} missing ${key}`);
  }
  if (!String(image.contentUrl || '').includes(check.contentUrlIncludes)) {
    errors.push(`${check.path}: ${check.id} unexpected contentUrl`);
  }
  if (image.license !== check.license) {
    errors.push(`${check.path}: ${check.id} non-canonical license`);
  }
  if (!String(image.acquireLicensePage || '').includes(check.acquireIncludes)) {
    errors.push(`${check.path}: ${check.id} non-canonical acquireLicensePage`);
  }
}

console.log('Homepage image licensing audit passed: HU 131/131, EN 18/18, DE 18/18 visible ImageObject records have complete licensing metadata.');


const bookPages = [
  'books/book-ebredes.html','books/book-szosszenetek.html','books/book-anovilaga.html',
  'hu/books/book-ebredes.html','hu/books/book-szosszenetek.html','hu/books/book-anovilaga.html',
  'de-at/books/book-ebredes.html','de-at/books/book-szosszenetek.html','de-at/books/book-anovilaga.html'
];

for (const path of bookPages) {
  const html = fs.readFileSync(path, 'utf8');
  const scripts = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  let cover = null;
  for (const source of scripts) {
    try {
      const doc = JSON.parse(source);
      const nodes = Array.isArray(doc?.['@graph']) ? doc['@graph'] : [doc];
      cover = nodes.find((node) => node?.['@type'] === 'ImageObject' && String(node?.['@id'] || '').endsWith('#cover'));
      if (cover) break;
    } catch {}
  }
  if (!cover) { errors.push(path + ': cover ImageObject missing'); continue; }
  for (const key of ['contentUrl','creator','copyrightHolder','copyrightNotice','creditText','license','acquireLicensePage']) {
    if (!cover[key]) errors.push(path + ': cover missing ' + key);
  }
}

const euforiaPages = [
  'exhibitions/euforia.html','hu/exhibitions/euforia.html','de-at/exhibitions/euforia.html'
];
const euforiaAsset = 'https://www.banhalmi.art/assets/img/peter-magyar-portrait-2026-by-norbert-banhalmi.webp';
const euforiaWorkIds = [
  'https://www.banhalmi.art/exhibitions/euforia.html#work-fellegi',
  'https://www.banhalmi.art/exhibitions/euforia.html#work-bence'
];
function collectNodes(value, acc = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectNodes(item, acc);
  } else if (value && typeof value === 'object') {
    acc.push(value);
    for (const nested of Object.values(value)) collectNodes(nested, acc);
  }
  return acc;
}
for (const path of euforiaPages) {
  const html = fs.readFileSync(path, 'utf8');
  const scripts = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  let image = null;
  const nodes = [];
  for (const source of scripts) {
    try {
      const doc = JSON.parse(source);
      collectNodes(doc, nodes);
      if (!image) {
        image = nodes.find((node) => {
          const types = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
          return types.includes('ImageObject') && node?.contentUrl === euforiaAsset;
        });
      }
    } catch {}
  }
  if (!image) { errors.push(path + ': EUFORIA local portrait ImageObject missing'); }
  else {
    for (const key of ['contentUrl','creator','copyrightHolder','copyrightNotice','creditText','license','acquireLicensePage']) {
      if (!image[key]) errors.push(path + ': EUFORIA portrait missing ' + key);
    }
  }
  for (const workId of euforiaWorkIds) {
    const suffix = workId.split('#').pop();
    const work = nodes.find((node) => {
      const types = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
      const id = String(node?.['@id'] || '');
      return (types.includes('Photograph') || types.includes('ImageObject')) && (id === workId || id.endsWith('#' + suffix)) && node?.contentUrl;
    });
    if (!work) { errors.push(path + ': missing EUFORIA work ImageObject/Photograph ' + workId); continue; }
    for (const key of ['contentUrl','creator','copyrightHolder','copyrightNotice','creditText','license','acquireLicensePage']) {
      if (!work[key]) errors.push(path + ': ' + workId + ' missing ' + key);
    }
    if (work.license !== 'https://creativecommons.org/licenses/by-sa/4.0/') {
      errors.push(path + ': ' + workId + ' must use Commons CC BY-SA 4.0 license');
    }
    if (!String(work.acquireLicensePage || '').includes('commons.wikimedia.org/wiki/File:')) {
      errors.push(path + ': ' + workId + ' acquireLicensePage must be Commons file page');
    }
  }
}

if (errors.length) {
  for (const error of errors) console.error('ERROR ' + error);
  process.exit(1);
}

console.log('Book cover and EUFORIA ImageObject licensing checks passed.');
