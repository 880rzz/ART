import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const skip = new Set(['.git', 'node_modules', '.github']);
const release = '20260730-final-release-v2';
const presenceCssTag = '<link rel="stylesheet" href="/assets/css/presence-core.css">';
const requiredPresenceCssPages = new Set(['hu/curators.html']);

function hasPresenceCssLink(html) {
  return /<link\b[^>]*href=["']\/assets\/css\/presence-core\.css(?:\?[^"']*)?["'][^>]*>/i.test(html);
}

function ensurePresenceCss(html, relativePath) {
  if (!requiredPresenceCssPages.has(relativePath) || hasPresenceCssLink(html)) return html;
  if (!/<html\b/i.test(html)) {
    throw new Error(`Cannot restore presence CSS in non-document HTML: ${relativePath}`);
  }
  const headClose = /<\/head\s*>/i;
  if (!headClose.test(html)) {
    throw new Error(`Cannot restore presence CSS because </head> is missing: ${relativePath}`);
  }
  return html.replace(headClose, `${presenceCssTag}\n</head>`);
}

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
    let updated = original.replace(
      /\/assets\/css\/apple-editorial-system\.css(?:\?v=[^"']+)?/g,
      `/assets/css/apple-editorial-system.css?v=${release}`
    );
    updated = ensurePresenceCss(updated, relativePath);

    if (updated !== original) await writeFile(full, updated, 'utf8');
  }
}

await walk(root);

for (const relativePath of requiredPresenceCssPages) {
  const html = await readFile(path.join(root, relativePath), 'utf8');
  if (!hasPresenceCssLink(html)) {
    throw new Error(`Final generated page still lacks presence CSS: ${relativePath}`);
  }
}

console.log(`Editorial release cache key applied: ${release}; final presence CSS verified.`);
