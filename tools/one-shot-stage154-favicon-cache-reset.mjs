import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const NEW_SVG = '/assets/img/favicon-banhalmi-20260815.svg';
const ICO = '/favicon.ico?v=20260815-2';
const PNG32 = '/assets/img/favicon-32x32.png?v=20260815-2';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (['.git', 'node_modules', '_site'].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

let touched = 0;
for (const file of walk(root).filter(file => file.endsWith('.html'))) {
  let html = fs.readFileSync(file, 'utf8');
  if (!/<html\b/i.test(html) || /http-equiv=["']refresh["']/i.test(html)) continue;
  const before = html;
  html = html
    .replace(/<link\s+rel=["']icon["']\s+href=["']\/assets\/img\/favicon\.svg["']\s+type=["']image\/svg\+xml["']\s*>/gi,
      `<link rel="icon" href="${NEW_SVG}" type="image/svg+xml" sizes="any">`)
    .replace(/<link\s+rel=["']icon["']\s+href=["']\/favicon\.ico(?:\?[^"']*)?["'][^>]*>/gi,
      `<link rel="shortcut icon" href="${ICO}" type="image/x-icon">`)
    .replace(/<link\s+rel=["']icon["']\s+href=["']\/assets\/img\/favicon-32x32\.png(?:\?[^"']*)?["'][^>]*>/gi,
      `<link rel="icon" href="${PNG32}" type="image/png" sizes="32x32">`);
  if (!html.includes(`href="${NEW_SVG}"`)) throw new Error(`${path.relative(root, file)}: new SVG favicon link missing after migration`);
  if (html !== before) {
    fs.writeFileSync(file, html);
    touched++;
  }
}

const manifestPath = path.join(root, 'site.webmanifest');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
for (const icon of manifest.icons || []) {
  if (icon.src === '/assets/img/favicon.svg') icon.src = NEW_SVG;
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

const swPath = path.join(root, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw
  .replace('banhalmi-art-20260814-live-refresh-v84', 'banhalmi-art-20260815-favicon-reset-v85')
  .replace('const PRE=["/assets/img/favicon.svg","/site.webmanifest"];', 'const PRE=["/site.webmanifest"];');
if (sw.includes('/assets/img/favicon.svg')) throw new Error('sw.js still contains legacy favicon cache path');
fs.writeFileSync(swPath, sw);

const auditPath = path.join(root, 'tools/audit-favicon-contract.mjs');
let audit = fs.readFileSync(auditPath, 'utf8');
audit = audit
  .replace("  'assets/img/favicon.svg',\n", "  'assets/img/favicon.svg',\n  'assets/img/favicon-banhalmi-20260815.svg',\n")
  .replace("const faviconSvgPath = path.join(root, 'assets/img/favicon.svg');", "const faviconSvgPath = path.join(root, 'assets/img/favicon-banhalmi-20260815.svg');")
  .replace("if (faviconSvg !== canonicalLogo) failures.push('assets/img/favicon.svg: must be the canonical BANHALMI vector mark from assets/img/banhalmi-logo.svg');\n", "")
  .replace(/\['SVG favicon',[^\n]+\n/, `['SVG favicon', /<link\\b(?=[^>]*rel=["']icon["'])(?=[^>]*href=["']\\/assets\\/img\\/favicon-banhalmi-20260815\\.svg["'])(?=[^>]*sizes=["']any["'])[^>]*>/i],\n`)
  .replace(/\['ICO favicon',[^\n]+\n/, `['ICO favicon', /<link\\b(?=[^>]*rel=["']shortcut icon["'])(?=[^>]*href=["']\\/favicon\\.ico\\?v=20260815-2["'])[^>]*>/i],\n`)
  .replace(/\['32 px PNG favicon',[^\n]+\n/, `['32 px PNG favicon', /<link\\b(?=[^>]*rel=["']icon["'])(?=[^>]*href=["']\\/assets\\/img\\/favicon-32x32\\.png\\?v=20260815-2["'])[^>]*>/i],\n`)
  .replace("    ['/assets/img/favicon.svg', 'any', 'image/svg+xml'],", "    ['/assets/img/favicon-banhalmi-20260815.svg', 'any', 'image/svg+xml'],");

audit = audit.replace(
  "  if (/<image\\b/i.test(faviconSvg) || /data:image\\//i.test(faviconSvg)) failures.push('assets/img/favicon.svg: embedded raster images are forbidden');",
  "  if (/<image\\b/i.test(faviconSvg) || /data:image\\//i.test(faviconSvg)) failures.push('cache-safe SVG favicon: embedded raster images are forbidden');"
).replace(
  "  if (!/<path\\b/i.test(faviconSvg)) failures.push('assets/img/favicon.svg: vector path missing');",
  "  if (!/<path\\b/i.test(faviconSvg)) failures.push('cache-safe SVG favicon: vector path missing');\n  if (!/#202530/i.test(faviconSvg) || !/#DCC56B/i.test(faviconSvg)) failures.push('cache-safe SVG favicon: approved dark-blue/gold contrast pair missing');"
);

audit += `\nconst sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');\nif (/PRE=.*favicon/i.test(sw) || /PRESET[\\s\\S]*favicon/i.test(sw)) failures.push('sw.js: favicon must not be intercepted by Cache Storage');\n`;
fs.writeFileSync(auditPath, audit);

console.log(`Stage154 favicon cache reset touched ${touched} HTML content pages.`);
