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
