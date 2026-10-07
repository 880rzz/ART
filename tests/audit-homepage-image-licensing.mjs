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
  if (!html.includes('id="copyright"')) {
    errors.push(`${page.path}: #copyright licensing target missing`);
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
    if (image?.creator?.['@id'] !== 'https://www.norbertbanhalmi.com/about/') {
      errors.push(`${label}: non-canonical creator`);
    }
    if (image?.copyrightHolder?.['@id'] !== 'https://www.norbertbanhalmi.com/about/') {
      errors.push(`${label}: non-canonical copyrightHolder`);
    }
  }
}

if (errors.length) {
  for (const error of errors) console.error('ERROR ' + error);
  process.exit(1);
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
for (const path of euforiaPages) {
  const html = fs.readFileSync(path, 'utf8');
  const scripts = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  let image = null;
  for (const source of scripts) {
    try {
      const doc = JSON.parse(source);
      const nodes = Array.isArray(doc?.['@graph']) ? doc['@graph'] : [doc];
      image = nodes.find((node) => node?.['@type'] === 'ImageObject' && node?.contentUrl === euforiaAsset);
      if (image) break;
    } catch {}
  }
  if (!image) { errors.push(path + ': EUFORIA local portrait ImageObject missing'); continue; }
  for (const key of ['contentUrl','creator','copyrightHolder','copyrightNotice','creditText','license','acquireLicensePage']) {
    if (!image[key]) errors.push(path + ': EUFORIA portrait missing ' + key);
  }
}
