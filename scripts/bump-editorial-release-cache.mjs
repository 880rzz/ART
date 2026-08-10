import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const skip = new Set(['.git', 'node_modules', '.github']);

const { release } = JSON.parse(await readFile(path.join(root, 'data/design-release.json'), 'utf8'));

const presenceCssTag = `<link rel="stylesheet" href="/assets/css/presence-core.css?v=${release}">`;
const museumCssTag = `<link rel="stylesheet" href="/assets/css/museum-editorial.css?v=${release}">`;
const homepageAuthorityCssTag = `<link rel="stylesheet" href="/assets/css/homepage-two-tone-authority.css?v=${release}">`;
const requiredPresenceCssPages = new Set(['hu/curators.html']);
const pageBaseCssTag = `<link rel="stylesheet" href="/assets/css/page-base.css?v=${release}">`;

function ensurePageBaseCss(html) {
  if (!/<body\b[^>]*class=["'][^"']*apple-archive/i.test(html)) return html;
  if (!/<main\b/i.test(html) || !/<footer\b/i.test(html)) return html;
  html = html.replace(/\s*<link\b[^>]*href=["']\/assets\/css\/page-base\.css(?:\?[^"']*)?["'][^>]*>/gi, '');
  const anchor = /<link\b[^>]*href=["']\/assets\/css\/[^"']+\.css(?:\?[^"']*)?["'][^>]*>/i.exec(html);
  if (anchor) return `${html.slice(0, anchor.index)}${pageBaseCssTag}\n${html.slice(anchor.index)}`;
  if (/<\/head\s*>/i.test(html)) return html.replace(/<\/head\s*>/i, `${pageBaseCssTag}\n</head>`);
  throw new Error('Cannot insert page-base.css because the document has no </head>.');
}

function hasPresenceCssLink(html) {
  return /<link\b[^>]*href=["']\/assets\/css\/presence-core\.css(?:\?[^"']*)?["'][^>]*>/i.test(html);
}

function ensureDocumentHeadAndPresenceCss(html, relativePath) {
  if (!requiredPresenceCssPages.has(relativePath)) return html;
  if (!/<html\b/i.test(html)) throw new Error(`Cannot repair non-document HTML: ${relativePath}`);
  const headClose = /<\/head\s*>/i;
  const bodyOpen = /<body\b/i;
  if (!headClose.test(html)) {
    if (!bodyOpen.test(html)) throw new Error(`Cannot repair document because both </head> and <body> are missing: ${relativePath}`);
    html = html.replace(bodyOpen, `</head>\n<body`);
  }
  if (!hasPresenceCssLink(html)) html = html.replace(headClose, `${presenceCssTag}\n</head>`);
  return html;
}

/* Component styles may be static or runtime-assisted, but none may load after the
   final visual authority. Remove the two authority links, then append museum +
   homepage authority after the last local stylesheet. This matches the Stage 87
   runtime contract and prevents record/archive layers from reviving old surfaces. */
function ensureFinalVisualStack(html) {
  html = html.replace(/\s*<link\b[^>]*href=["']\/assets\/css\/museum-editorial\.css[^"']*["'][^>]*>/gi, '');
  html = html.replace(/\s*<link\b[^>]*href=["']\/assets\/css\/homepage-two-tone-authority\.css[^"']*["'][^>]*>/gi, '');
  const stack = `${museumCssTag}\n${homepageAuthorityCssTag}`;
  const localStyles = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']\/assets\/css\/[^"']+\.css(?:\?[^"']*)?["'][^>]*>/gi)];
  const last = localStyles.at(-1);
  if (last) {
    const end = last.index + last[0].length;
    return `${html.slice(0, end)}\n${stack}${html.slice(end)}`;
  }
  if (/<\/head\s*>/i.test(html)) return html.replace(/<\/head\s*>/i, `${stack}\n</head>`);
  return html;
}

let pages = 0;
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { await walk(full); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const relativePath = path.relative(root, full).replaceAll('\\', '/');
    const original = await readFile(full, 'utf8');
    if (!/<html\b/i.test(original)) continue;
    let updated = ensurePageBaseCss(original);
    updated = ensureDocumentHeadAndPresenceCss(updated, relativePath);
    updated = ensureFinalVisualStack(updated);
    updated = updated.replace(/(href=["']\/assets\/(?:css|js|video)\/[^"'?]+\.(?:css|js|mp4))(?:\?[^"']*)?(["'])/g, `$1?v=${release}$2`);
    updated = updated.replace(/(src=["']\/assets\/(?:css|js|video)\/[^"'?]+\.js)(?:\?[^"']*)?(["'])/g, `$1?v=${release}$2`);
    updated = updated.replace(/((?:href|src)=["']\/assets\/[^"'?]+\.json)(?:\?[^"']*)?(["'])/g, `$1?v=${release}$2`);
    updated = updated.replace(/(["'`])(\/?(?:\.\.\/)*assets\/data\/[^"'`?]+\.json)(?:\?[^"'`]*)?\1/g, `$1$2?v=${release}$1`);
    pages += 1;
    if (updated !== original) await writeFile(full, updated, 'utf8');
  }
}
await walk(root);

for (const relativePath of requiredPresenceCssPages) {
  const html = await readFile(path.join(root, relativePath), 'utf8');
  if (!/<\/head\s*>/i.test(html)) throw new Error(`Final generated page still lacks </head>: ${relativePath}`);
  if (!hasPresenceCssLink(html)) throw new Error(`Final generated page still lacks presence CSS: ${relativePath}`);
}
console.log(`Release cache key ${release} applied across ${pages} pages; component styles precede museum structure and homepage visual authority.`);
