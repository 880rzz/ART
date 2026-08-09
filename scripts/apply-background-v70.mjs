import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const release = '20260809-homepage-palette-v70';

const configPath = path.join(root, 'data/design-release.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
config.release = release;
config.note = 'Stage 70: the ART homepage palette is the single visual source of truth across every archive page and all three languages. Legacy neutral/brown curatorial surfaces are mapped to the homepage blue ground, raised and panel surfaces, and the release is cache-busted.';
await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

// Remove the remaining legacy neutral curatorial surfaces at their source.
const finalPath = path.join(root, 'assets/css/final-layout-fixes.css');
let finalCss = await readFile(finalPath, 'utf8');
const replacements = new Map([
  ['background:rgba(12,13,20,.94)!important;', 'background:rgba(32,37,48,.97)!important;'],
  ['background:rgba(12,13,20,.985)!important;', 'background:rgba(32,37,48,.985)!important;'],
  ['background:#0f0f0f!important;', 'background:var(--c-ground)!important;'],
  ['--press-paper:#0f0f0f!important;', '--press-paper:var(--c-ground)!important;'],
  ['--press-warm:#171717!important;', '--press-warm:var(--c-raised)!important;'],
  ['background:#171717!important;', 'background:var(--c-raised)!important;'],
  ['--press-muted:#b7b7bb!important;', '--press-muted:#AFC4D9!important;'],
  ['color:#b7b7bb!important;', 'color:#AFC4D9!important;']
]);
for (const [from, to] of replacements) finalCss = finalCss.split(from).join(to);
await writeFile(finalPath, finalCss, 'utf8');

// Final authority: exactly the homepage surfaces, on every ART page.
const palettePath = path.join(root, 'assets/css/palette-blue-final.css');
let palette = await readFile(palettePath, 'utf8');
const marker = 'STAGE70-HOMEPAGE-PALETTE-AUTHORITY:START';
if (!palette.includes(marker)) {
  palette += `\n\n/* STAGE70-HOMEPAGE-PALETTE-AUTHORITY:START
   The homepage is the canonical ART design. No subpage may introduce a
   separate black, grey or brown surface system. These values intentionally
   mirror page-base.css and the homepage section rhythm. */
html body.apple-archive.apple-archive.apple-archive{
  --c-ground:#202530!important;
  --c-raised:#29303F!important;
  --c-panel:#2D3444!important;
  --c-ink:#F5F5F7!important;
  --c-ink-soft:#AFC4D9!important;
  --c-gold:#B79C44!important;
  --mus-ground:#202530!important;
  --mus-raised:#29303F!important;
  --mus-panel:#2D3444!important;
  --mus-ink:#F5F5F7!important;
  --mus-soft:#AFC4D9!important;
  background:#202530!important;
  color:#F5F5F7!important;
}
html body.apple-archive.apple-archive.apple-archive main{
  background:#202530!important;
  color:#F5F5F7!important;
}
html body.apple-archive.apple-archive.apple-archive main>section{
  --banhalmi-section-surface:#202530!important;
  background:transparent!important;
}
html body.apple-archive.apple-archive.apple-archive main>section:nth-of-type(even){
  --banhalmi-section-surface:#2D3444!important;
}
html body.apple-archive.apple-archive.apple-archive main>section.tone-a{
  --banhalmi-section-surface:#202530!important;
}
html body.apple-archive.apple-archive.apple-archive main>section.tone-b{
  --banhalmi-section-surface:#29303F!important;
}
html body.apple-archive.apple-archive.apple-archive main>section.tone-c{
  --banhalmi-section-surface:#2D3444!important;
}
html body.apple-archive.apple-archive.apple-archive main>section::before{
  background:var(--banhalmi-section-surface)!important;
}
html body.apple-archive.apple-archive.apple-archive .curatorial-section{
  --curatorial-surface:#202530!important;
  background:transparent!important;
}
html body.apple-archive.apple-archive.apple-archive .curatorial-section[data-curatorial-surface="2"]{
  --curatorial-surface:#2D3444!important;
}
html body.apple-archive.apple-archive.apple-archive .curatorial-section[data-curatorial-surface="3"]{
  --curatorial-surface:#202530!important;
}
html body.apple-archive.apple-archive.apple-archive .curatorial-section::before{
  background:var(--curatorial-surface)!important;
}
html body.apple-archive.apple-archive.apple-archive main.press-redesign{
  --press-paper:#202530!important;
  --press-warm:#29303F!important;
  --press-ink:#F5F5F7!important;
  --press-muted:#AFC4D9!important;
  background:#202530!important;
}
html body.apple-archive.apple-archive.apple-archive main.press-redesign :is(.press-overview,.press-period){
  background:#202530!important;
  color:#F5F5F7!important;
}
html body.apple-archive.apple-archive.apple-archive main.press-redesign .press-period:nth-child(even){
  background:#29303F!important;
}
html body.apple-archive.apple-archive.apple-archive > nav:not(.archive-nav),
html body.apple-archive.apple-archive.apple-archive #menu{
  background:#202530!important;
}
/* STAGE70-HOMEPAGE-PALETTE-AUTHORITY:END */\n`;
  await writeFile(palettePath, palette, 'utf8');
}

const footerPath = path.join(root, 'assets/css/footer-elegant.css');
let footer = await readFile(footerPath, 'utf8');
footer = footer.replace(/@import url\('\.\/palette-blue-final\.css\?v=[^']+'\);/, `@import url('./palette-blue-final.css?v=${release}');`);
await writeFile(footerPath, footer, 'utf8');

// Make curatorial page identity available before JS, in all language trees.
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

console.log(`Homepage palette authority applied; ${identities} curatorial identities materialised; release=${release}.`);
