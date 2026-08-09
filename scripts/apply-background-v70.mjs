import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const release = '20260809-blue-subpages-v70';

const configPath = path.join(root, 'data/design-release.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
config.release = release;
config.note = 'Stage 70 design release: cache-busted runtime lock for the canonical ART blue palette. Curatorial page identities are present in source HTML, and high-specificity blue surface rules cannot be overwritten by the later museum editorial layer or a stale runtime-only page marker.';
await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

const palettePath = path.join(root, 'assets/css/palette-blue-final.css');
let palette = await readFile(palettePath, 'utf8');
const marker = 'STAGE70-BACKGROUND-RUNTIME-LOCK:START';
if (!palette.includes(marker)) {
  palette += `\n\n/* STAGE70-BACKGROUND-RUNTIME-LOCK:START
   v69 was correct in source, but returning visitors could still render the
   former brown museum surface. The page marker depended on JS, while the
   museum layer loaded later. This lock uses source page classes and enough
   specificity to make the canonical blue palette authoritative. */
html body.apple-archive.apple-archive.apple-archive{
  --c-ground:#202530!important;
  --c-raised:#29303F!important;
  --c-panel:#2D3444!important;
  --mus-ground:#202530!important;
  --mus-raised:#29303F!important;
  --mus-panel:#2D3444!important;
  background:#202530!important;
  color:#F5F5F7!important;
}
html body.apple-archive.apple-archive.apple-archive main:is(.community-page,.writing-page,.press-redesign){background:#202530!important;color:#F5F5F7!important}
html body.apple-archive.apple-archive.apple-archive main:is(.community-page,.writing-page)>section{--banhalmi-section-surface:#202530!important;background:#202530!important}
html body.apple-archive.apple-archive.apple-archive main:is(.community-page,.writing-page)>section:nth-of-type(even){--banhalmi-section-surface:#2D3444!important;background:#2D3444!important}
html body.apple-archive.apple-archive.apple-archive main:is(.community-page,.writing-page)>section.tone-a{--banhalmi-section-surface:#202530!important;background:#202530!important}
html body.apple-archive.apple-archive.apple-archive main:is(.community-page,.writing-page)>section.tone-b{--banhalmi-section-surface:#29303F!important;background:#29303F!important}
html body.apple-archive.apple-archive.apple-archive main:is(.community-page,.writing-page)>section.tone-c{--banhalmi-section-surface:#2D3444!important;background:#2D3444!important}
html body.apple-archive.apple-archive.apple-archive main:is(.community-page,.writing-page)>section::before{background:var(--banhalmi-section-surface,#202530)!important}
html body.apple-archive.apple-archive.apple-archive .curatorial-section{--curatorial-surface:#202530!important;background:#202530!important}
html body.apple-archive.apple-archive.apple-archive .curatorial-section[data-curatorial-surface="2"]{--curatorial-surface:#2D3444!important;background:#2D3444!important}
html body.apple-archive.apple-archive.apple-archive .curatorial-section[data-curatorial-surface="3"]{--curatorial-surface:#202530!important;background:#202530!important}
html body.apple-archive.apple-archive.apple-archive main.press-redesign{--press-paper:#202530!important;--press-warm:#29303F!important;--press-ink:#F5F5F7!important;--press-muted:#AFC4D9!important;background:#202530!important}
html body.apple-archive.apple-archive.apple-archive main.press-redesign :is(.press-overview,.press-period){background:#202530!important;color:#F5F5F7!important}
html body.apple-archive.apple-archive.apple-archive main.press-redesign .press-period:nth-child(even){background:#29303F!important}
/* STAGE70-BACKGROUND-RUNTIME-LOCK:END */\n`;
  await writeFile(palettePath, palette, 'utf8');
}

const footerPath = path.join(root, 'assets/css/footer-elegant.css');
let footer = await readFile(footerPath, 'utf8');
footer = footer.replace(/@import url\('\.\/palette-blue-final\.css\?v=[^']+'\);/, `@import url('./palette-blue-final.css?v=${release}');`);
await writeFile(footerPath, footer, 'utf8');

const curatorial = new Set(['curators', 'press', 'community', 'writing']);
const skip = new Set(['.git', 'node_modules', '_site', 'playwright-report', 'test-results']);
const htmlFiles = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
await walk(root);

let identities = 0;
for (const file of htmlFiles) {
  const page = path.basename(file, '.html').toLowerCase();
  if (!curatorial.has(page)) continue;
  let html = await readFile(file, 'utf8');
  const match = html.match(/<body\b[^>]*\bclass=["'][^"']*\bapple-archive\b[^"']*["'][^>]*>/i);
  if (!match) continue;
  if (!/data-archive-page=/i.test(match[0])) {
    const tag = match[0].slice(0, -1) + ` data-archive-page="${page}">`;
    html = html.replace(match[0], tag);
    await writeFile(file, html, 'utf8');
    identities += 1;
  }
}

console.log(`Stage70 source lock applied; ${identities} curatorial page identities materialised; release=${release}.`);
