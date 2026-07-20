import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const htmlFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}

walk(root);

const failures = [];
const warnings = [];
const imageRefs = new Set();
const routeFor = (file) => '/' + path.relative(root, file).replaceAll(path.sep, '/');

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const route = routeFor(file);
  const isRedirect = /http-equiv=["']refresh["']/.test(html);
  const ids = new Set([...html.matchAll(/\sid=["']([^"']+)["']/g)].map((m) => m[1]));
  const allIds = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((m) => m[1]);
  const h1Count = (html.match(/<h1\b/g) || []).length;
  if (!isRedirect && h1Count !== 1) failures.push(`${route}: expected one h1, found ${h1Count}`);
  if (!isRedirect && !/<main\b[^>]*id=["']main-content["']/.test(html)) failures.push(`${route}: missing semantic main landmark`);
  if (!isRedirect && !/class=["'][^"']*skip-link/.test(html)) failures.push(`${route}: missing skip link`);
  if (!isRedirect && !/:focus-visible/.test(html)) failures.push(`${route}: missing visible keyboard focus style`);
  if (ids.size !== allIds.length) failures.push(`${route}: duplicate id attribute`);

  for (const image of html.matchAll(/<img\b([^>]*)>/g)) {
    if (!/\balt=["'][^"']*["']/.test(image[1])) failures.push(`${route}: image without alt`);
    if (/\bsrc=["']["']/.test(image[1])) failures.push(`${route}: image with empty src`);
  }
  for (const link of html.matchAll(/<a\b([^>]*)>/g)) {
    if (/\btarget=["']_blank["']/.test(link[1]) && !/\brel=["'][^"']*noopener/.test(link[1])) {
      failures.push(`${route}: target=_blank without rel=noopener`);
    }
  }

  const requiredTags = isRedirect ? ['<title>', 'rel="canonical"'] : ['<title>', 'name="description"', 'rel="canonical"', 'hreflang="x-default"'];
  for (const required of requiredTags) {
    if (!html.includes(required)) failures.push(`${route}: missing ${required}`);
  }
  if (!isRedirect) {
    const description = html.match(/<meta name=["']description["'] content=["']([^"']*)["']/)?.[1] || '';
    if (description.endsWith('…') || description.endsWith('...')) failures.push(`${route}: truncated meta description`);
    if (!html.includes('property="og:image:width"') || !html.includes('property="og:image:height"')) {
      failures.push(`${route}: missing Open Graph image dimensions`);
    }
    if (!/<button\b[^>]*class=["'][^"']*burger[^>]*aria-controls=["']menu["']/.test(html)) failures.push(`${route}: menu button missing aria-controls`);
  }

  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const json = JSON.parse(match[1]);
      for (const entity of json['@graph'] || []) {
        if (entity['@type'] === 'ExhibitionEvent' && entity.eventStatus === 'https://schema.org/EventScheduled') {
          const start = String(entity.startDate || '');
          if (start && start < new Date().toISOString().slice(0, 10)) failures.push(`${route}: past exhibition marked EventScheduled`);
        }
      }
    }
    catch (error) { failures.push(`${route}: invalid JSON-LD (${error.message})`); }
  }

  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
    const ref = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|javascript:)/.test(ref) || ref === '#') continue;
    const [pathname, hash = ''] = ref.split('#');
    let target = pathname
      ? (pathname.startsWith('/') ? path.join(root, pathname) : path.resolve(path.dirname(file), pathname))
      : file;
    if (pathname && !path.extname(target)) target = path.join(target, 'index.html');
    if (pathname && !fs.existsSync(target)) failures.push(`${route}: missing local target ${ref}`);
    if (hash && fs.existsSync(target)) {
      const targetHtml = fs.readFileSync(target, 'utf8');
      if (!new RegExp(`\\sid=["']${hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(targetHtml)) {
        failures.push(`${route}: missing anchor ${ref}`);
      }
    }
    if (/\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(pathname)) imageRefs.add(target);
  }

  if (route.includes('/exhibitions/') && !route.endsWith('/404.html')) {
    const figures = (html.match(/<figure\b/g) || []).length;
    if (!html.includes('class="collage"')) warnings.push(`${route}: no collage gallery`);
    if (/\bid=["']galmore["']/.test(html)) failures.push(`${route}: exhibition galleries must not use a 15-image load-more button`);
    if (/<div\b[^>]*class=["'][^"']*gal-batch[^"']*["'][^>]*\bhidden\b/.test(html)) failures.push(`${route}: exhibition gallery batch is hidden`);
    for (const figure of html.matchAll(/<figure\b([^>]*)><img[^>]+\/assets\/img\/exhibitions\//g)) {
      if (!/role=["']button["']/.test(figure[1]) || !/tabindex=["']0["']/.test(figure[1])) failures.push(`${route}: gallery figure is not keyboard operable`);
    }
  }

  if (!isRedirect && html.includes('<div id="menu"')) {
    const menuStart = html.indexOf('<div id="menu"');
    const menuChunk = html.slice(menuStart, menuStart + 7000);
    const firstColumnEnd = menuChunk.indexOf('\n  </div>\n  <div>');
    const curatorsPosition = menuChunk.indexOf('curators.html');
    if (curatorsPosition === -1 || firstColumnEnd === -1 || curatorsPosition > firstColumnEnd) {
      failures.push(`${route}: curators and commissions menu block must be in the left column`);
    }
  }
}

for (const homeRoute of ['/', '/hu/index.html', '/de-at/index.html']) {
  const file = homeRoute === '/' ? path.join(root, 'index.html') : path.join(root, homeRoute.slice(1));
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes("querySelectorAll('.gal-batch[hidden]')")) failures.push(`${homeRoute}: homepage gallery button must reveal every hidden batch at once`);
}

for (const exhibitionDir of fs.readdirSync(path.join(root, 'assets/img/exhibitions'), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)) {
  for (const prefix of ['', 'hu/', 'de-at/']) {
    const file = path.join(root, prefix, 'exhibitions', `${exhibitionDir}.html`);
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    const imageCount = fs.readdirSync(path.join(root, 'assets/img/exhibitions', exhibitionDir)).filter((name) => name.endsWith('.webp')).length;
    const referenced = new Set([...html.matchAll(new RegExp(`/assets/img/exhibitions/${exhibitionDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/[^"\\s<>]+\\.webp`, 'g'))].map((match) => match[0])).size;
    if (referenced !== imageCount) failures.push(`/${prefix}exhibitions/${exhibitionDir}.html: references ${referenced} gallery images, expected ${imageCount}`);
  }
}

for (const image of imageRefs) {
  if (!fs.existsSync(image)) failures.push(`missing referenced image: ${path.relative(root, image)}`);
  else if (fs.statSync(image).size < 100) failures.push(`empty image: ${path.relative(root, image)}`);
}

console.log(`Audited ${htmlFiles.length} HTML files and ${imageRefs.size} unique local images.`);
for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const failure of failures) console.error(`FAIL ${failure}`);
if (failures.length) process.exitCode = 1;
