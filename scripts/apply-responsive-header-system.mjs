import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignored = new Set(['node_modules', '.git', 'dist']);
const presenceCssTag = '<link rel="stylesheet" href="/assets/css/presence-core.css">';
const cssTag = '<link rel="stylesheet" href="/assets/css/responsive-header-system.css?v=20260731-responsive-v3">';
const jsTag = '<script defer src="/assets/js/responsive-header-system.js?v=20260731-responsive-v3"></script>';
const explicitHeaderTargets = new Set(['hu/curators.html']);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

let changed = 0;
for (const file of walk(root)) {
  if (!file.endsWith('.html')) continue;
  let html = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const isArchivePage = /class=["'][^"']*apple-archive/.test(html);
  if (!isArchivePage && !explicitHeaderTargets.has(relative)) continue;
  if (!/<html\b/i.test(html) || !html.includes('</head>')) continue;

  const before = html;

  /* Insert only what is missing. This used to strip the stylesheet and script
     tags and re-append them before </head> on every run, which moved them past
     layers that must load after them and rewrote pages that were already
     correct — the cascade is order-dependent, so that alone can make the site
     look like two stylesheets are fighting. The release step at the end of the
     chain owns ordering and versioning. */
  const hasPresenceCssLink = /<link\b[^>]*href=["']\/assets\/css\/presence-core\.css(?:\?[^"']*)?["'][^>]*>/i.test(html);
  const hasHeaderCss = /responsive-header-system\.css/i.test(html);
  const hasHeaderJs = /responsive-header-system\.js/i.test(html);

  const tags = [
    hasPresenceCssLink ? '' : presenceCssTag,
    hasHeaderCss ? '' : cssTag,
    hasHeaderJs ? '' : jsTag,
  ].filter(Boolean).join('\n');

  if (tags) html = html.replace('</head>', `${tags}\n</head>`);

  if (html !== before) {
    fs.writeFileSync(file, html);
    changed += 1;
  }
}

console.log(`Responsive header system applied to ${changed} HTML files.`);
