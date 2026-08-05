import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const base = 'https://www.banhalmi.art';
const data = JSON.parse(fs.readFileSync(path.join(root, 'redirects.json'), 'utf8'));
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const errors = [];

const absolute = target => target.startsWith('/') ? `${base}${target}` : target;
const canonical = target => absolute(target).split('#', 1)[0];
const fileFor = route => {
  const clean = route.replace(/^\//, '');
  return path.join(root, clean.endsWith('.html') ? clean : path.join(clean, 'index.html'));
};

for (const [route, target] of Object.entries(data.redirects || {})) {
  const file = fileFor(route);
  if (!fs.existsSync(file)) {
    errors.push(`${route}: internal redirect page missing at ${path.relative(root, file)}`);
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  const expectedTarget = absolute(target);
  const expectedCanonical = canonical(target);
  if (!text.includes('name="robots" content="noindex,follow"')) errors.push(`${route}: noindex,follow missing`);
  if (!text.includes(`http-equiv="refresh" content="0; url=${expectedTarget}"`)) errors.push(`${route}: meta refresh target mismatch`);
  if (!text.includes(`rel="canonical" href="${expectedCanonical}"`)) errors.push(`${route}: canonical target mismatch`);
  if (!text.includes(`const target = new URL(${JSON.stringify(expectedTarget)})`)) errors.push(`${route}: JavaScript target mismatch`);
  if (!text.includes('window.location.replace(target.href)')) errors.push(`${route}: window.location.replace missing`);
  if (text.includes('norbertbanhalmi.wixsite.com')) errors.push(`${route}: stale Wix target remains`);
  if (sitemap.includes(`<loc>${base}${route}</loc>`)) errors.push(`${route}: redirect source must not be listed in sitemap`);
}

for (const obsolete of [
  'cloudflare-bulk-redirects.csv',
  'docs/CLOUDFLARE_REDIRECTS_10_OF_10.md',
  'tests/audit-edge-redirects.mjs'
]) {
  if (fs.existsSync(path.join(root, obsolete))) errors.push(`${obsolete}: obsolete Cloudflare redirect artifact remains`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Internal redirect audit passed: ${Object.keys(data.redirects).length} exact legacy routes.`);
