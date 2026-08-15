import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const requiredAssets = [
  'favicon.ico',
  'assets/img/favicon.svg',
  'assets/img/banhalmi-logo.svg',
  'assets/img/favicon-32x32.png',
  'assets/img/favicon-192x192.png',
  'assets/img/favicon-512x512.png',
  'assets/img/apple-touch-icon.png',
  'site.webmanifest'
];

for (const asset of requiredAssets) {
  if (!fs.existsSync(path.join(root, asset))) failures.push(`${asset}: missing`);
}

const faviconSvgPath = path.join(root, 'assets/img/favicon.svg');
const canonicalLogoPath = path.join(root, 'assets/img/banhalmi-logo.svg');
if (fs.existsSync(faviconSvgPath) && fs.existsSync(canonicalLogoPath)) {
  const faviconSvg = fs.readFileSync(faviconSvgPath, 'utf8').trim();
  const canonicalLogo = fs.readFileSync(canonicalLogoPath, 'utf8').trim();
  if (faviconSvg !== canonicalLogo) failures.push('assets/img/favicon.svg: must be the canonical BANHALMI vector mark from assets/img/banhalmi-logo.svg');
  if (/<image\b/i.test(faviconSvg) || /data:image\//i.test(faviconSvg)) failures.push('assets/img/favicon.svg: embedded raster images are forbidden');
  if (!/<path\b/i.test(faviconSvg)) failures.push('assets/img/favicon.svg: vector path missing');
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (['.git', 'node_modules', '_site'].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const contentPages = walk(root).filter(file => {
  if (!file.endsWith('.html')) return false;
  const html = fs.readFileSync(file, 'utf8');
  return /<html\b/i.test(html) && !/http-equiv=["']refresh["']/i.test(html);
});

for (const file of contentPages) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file).replaceAll('\\', '/');
  for (const [label, pattern] of [
    ['SVG favicon', /<link\b(?=[^>]*rel=["']icon["'])(?=[^>]*href=["']\/assets\/img\/favicon\.svg["'])[^>]*>/i],
    ['ICO favicon', /<link\b(?=[^>]*rel=["']icon["'])(?=[^>]*href=["']\/favicon\.ico["'])[^>]*>/i],
    ['32 px PNG favicon', /<link\b(?=[^>]*rel=["']icon["'])(?=[^>]*href=["']\/assets\/img\/favicon-32x32\.png["'])[^>]*>/i],
    ['Apple touch icon', /<link\b(?=[^>]*rel=["']apple-touch-icon["'])(?=[^>]*href=["']\/assets\/img\/apple-touch-icon\.png["'])[^>]*>/i],
    ['web manifest', /<link\b(?=[^>]*rel=["']manifest["'])(?=[^>]*href=["']\/site\.webmanifest["'])[^>]*>/i]
  ]) if (!pattern.test(html)) failures.push(`${rel}: ${label} link missing`);
}

if (fs.existsSync(path.join(root, 'site.webmanifest'))) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'site.webmanifest'), 'utf8'));
  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  for (const expected of [
    ['/assets/img/favicon.svg', 'any', 'image/svg+xml'],
    ['/assets/img/favicon-192x192.png', '192x192', 'image/png'],
    ['/assets/img/favicon-512x512.png', '512x512', 'image/png']
  ]) if (!icons.some(icon => icon.src === expected[0] && icon.sizes === expected[1] && icon.type === expected[2])) {
    failures.push(`site.webmanifest: ${expected[1]} ${expected[2]} icon missing`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`ART favicon contract passed: canonical vector favicon, seven fallback assets and complete icon metadata on ${contentPages.length} content pages.`);
