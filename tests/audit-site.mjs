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
  if (ids.size !== allIds.length) failures.push(`${route}: duplicate id attribute`);

  for (const image of html.matchAll(/<img\b([^>]*)>/g)) {
    if (!/\balt=["'][^"']*["']/.test(image[1])) failures.push(`${route}: image without alt`);
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

  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); }
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
    const firstBatch = html.match(/<div class="gal-batch">([\s\S]*?)<\/div>/)?.[1] || '';
    const firstBatchFigures = (firstBatch.match(/<figure\b/g) || []).length;
    if (figures > 15 && firstBatchFigures !== 15) failures.push(`${route}: first gallery batch has ${firstBatchFigures}, expected 15`);
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
