import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const skip = new Set(['.git', 'node_modules', '.github']);

/* The release token lives in data/design-release.json so the generator chain,
   the audits and any future stylesheet change all agree on one value.
   Browsers cache CSS and JS by exact URL including the query string, so a
   stylesheet edit without a token bump leaves returning visitors — including
   the site owner — on a stale copy indefinitely. */
const { release } = JSON.parse(await readFile(path.join(root, 'data/design-release.json'), 'utf8'));

const presenceCssTag = `<link rel="stylesheet" href="/assets/css/presence-core.css?v=${release}">`;
const museumCssTag = `<link rel="stylesheet" href="/assets/css/museum-editorial.css?v=${release}">`;
const requiredPresenceCssPages = new Set(['hu/curators.html']);

const pageBaseCssTag = `<link rel="stylesheet" href="/assets/css/page-base.css?v=${release}">`;

function ensurePageBaseCss(html) {
  if (!/<body\b[^>]*class=["'][^"']*apple-archive/i.test(html)) return html;
  if (!/<main\b/i.test(html) || !/<footer\b/i.test(html)) return html;

  /* Normalise to exactly one dependency link, and make it the first
     local stylesheet so every later token alias resolves. */
  html = html.replace(
    /\s*<link\b[^>]*href=["']\/assets\/css\/page-base\.css(?:\?[^"']*)?["'][^>]*>/gi,
    ''
  );
  const anchor = /<link\b[^>]*href=["']\/assets\/css\/[^"']+\.css(?:\?[^"']*)?["'][^>]*>/i.exec(html);
  if (anchor) {
    return `${html.slice(0, anchor.index)}${pageBaseCssTag}\n${html.slice(anchor.index)}`;
  }
  if (/<\/head\s*>/i.test(html)) return html.replace(/<\/head\s*>/i, `${pageBaseCssTag}\n</head>`);
  throw new Error('Cannot insert page-base.css because the document has no </head>.');
}


function hasPresenceCssLink(html) {
  return /<link\b[^>]*href=["']\/assets\/css\/presence-core\.css(?:\?[^"']*)?["'][^>]*>/i.test(html);
}

function ensureDocumentHeadAndPresenceCss(html, relativePath) {
  if (!requiredPresenceCssPages.has(relativePath)) return html;
  if (!/<html\b/i.test(html)) {
    throw new Error(`Cannot repair non-document HTML: ${relativePath}`);
  }

  const headClose = /<\/head\s*>/i;
  const bodyOpen = /<body\b/i;

  if (!headClose.test(html)) {
    if (!bodyOpen.test(html)) {
      throw new Error(`Cannot repair document because both </head> and <body> are missing: ${relativePath}`);
    }
    html = html.replace(bodyOpen, `</head>\n<body`);
  }

  if (!hasPresenceCssLink(html)) {
    html = html.replace(headClose, `${presenceCssTag}\n</head>`);
  }

  return html;
}

/* The museum editorial layer must load after every other stylesheet. Earlier
   scripts in the integration chain remove and re-insert their own <link> at
   </head>, which would leave them cascading over the museum layer, so this
   step — which runs last — strips any existing museum link and re-anchors it
   after the final stylesheet in the stack rather than trusting its position. */
function ensureMuseumLayer(html) {
  html = html.replace(/\s*<link\b[^>]*href=["']\/assets\/css\/museum-editorial\.css[^"']*["'][^>]*>/gi, '');
  const anchor = /<link\b[^>]*href=["']\/assets\/css\/responsive-header-system\.css[^"']*["'][^>]*>/i.exec(html);
  if (anchor) {
    const end = anchor.index + anchor[0].length;
    return `${html.slice(0, end)}\n${museumCssTag}${html.slice(end)}`;
  }
  if (/<\/head\s*>/i.test(html)) return html.replace(/<\/head\s*>/i, `${museumCssTag}\n</head>`);
  return html;
}

let pages = 0;

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (!entry.name.endsWith('.html')) continue;

    const relativePath = path.relative(root, full).replaceAll('\\', '/');
    const original = await readFile(full, 'utf8');
    if (!/<html\b/i.test(original)) continue; // generator source fragments are not pages

    let updated = ensurePageBaseCss(original);
    updated = ensureMuseumLayer(updated);
    updated = updated.replace(
      /(href=["']\/assets\/(?:css|js|video)\/[^"'?]+\.(?:css|js|mp4))(?:\?[^"']*)?(["'])/g,
      `$1?v=${release}$2`
    );
    updated = updated.replace(
      /(src=["']\/assets\/(?:css|js|video)\/[^"'?]+\.js)(?:\?[^"']*)?(["'])/g,
      `$1?v=${release}$2`
    );
    /* The data files need the token too, and for two days they did not have it.
       The 1956 testimonies are fetched from assets/data at runtime; when ten of
       the fifteen were re-paired with the right photographs, the corrected file
       sat on the server while every returning reader kept being served the old
       one from cache — the most serious content fix of the week, invisible.
       Any path ending in .json under assets/ is versioned here, whether it is
       written as a quoted attribute or inside a fetch() in an inline script. */
    updated = updated.replace(
      /((?:href|src)=["']\/assets\/[^"'?]+\.json)(?:\?[^"']*)?(["'])/g,
      `$1?v=${release}$2`
    );
    updated = updated.replace(
      /(["'`])(\/?(?:\.\.\/)*assets\/data\/[^"'`?]+\.json)(?:\?[^"'`]*)?\1/g,
      `$1$2?v=${release}$1`
    );
    updated = ensureDocumentHeadAndPresenceCss(updated, relativePath);

    pages += 1;
    if (updated !== original) await writeFile(full, updated, 'utf8');
  }
}

await walk(root);

for (const relativePath of requiredPresenceCssPages) {
  const html = await readFile(path.join(root, relativePath), 'utf8');
  if (!/<\/head\s*>/i.test(html)) {
    throw new Error(`Final generated page still lacks </head>: ${relativePath}`);
  }
  if (!hasPresenceCssLink(html)) {
    throw new Error(`Final generated page still lacks presence CSS: ${relativePath}`);
  }
}

console.log(`Release cache key ${release} applied to every local stylesheet and script across ${pages} pages; museum editorial layer linked last.`);
