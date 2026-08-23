import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hardenProductionArtifact } from './harden-production-artifact.mjs';

export const HOME_HERO_CTA_START = '/* STAGE154-HOME-HERO-CTA-SIZE-CONSISTENCY:START */';
export const HOME_HERO_CTA_END = '/* STAGE154-HOME-HERO-CTA-SIZE-CONSISTENCY:END */';
export const EXHIBITION_AXIS_START = '/* EXHIBITION-MOBILE-EDITORIAL-AXIS:START */';
export const EXHIBITION_AXIS_END = '/* EXHIBITION-MOBILE-EDITORIAL-AXIS:END */';
export const APPLE_RESPONSIVE_END = '/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
export const EXHIBITION_AXIS_STYLE_MARKER = 'data-exhibition-axis-contract="v1"';
export const STAGE132_START = '/* STAGE132-UNIFIED-EXHIBITION-GALLERY-GRID:START';
export const STAGE132_END = '/* STAGE132-UNIFIED-EXHIBITION-GALLERY-GRID:END */';

export const HOME_HERO_CTA_BLOCK = `${HOME_HERO_CTA_START}
/* Homepage hero CTA geometry. Desktop buttons share one fixed width; mobile buttons share one exact box model so the first CTA cannot inherit a larger global margin/height. */
@media (min-width:641px){
  html body.apple-archive[data-archive-page="index"] header.hero .hero-cta .btn{
    box-sizing:border-box!important;
    inline-size:10.5rem!important;
    min-inline-size:10.5rem!important;
    max-inline-size:10.5rem!important;
  }
}
@media (max-width:640px){
  html body.apple-archive[data-archive-page="index"] header.hero .hero-cta .btn,
  html body.apple-archive[data-archive-page="index"] header.hero .hero-cta .btn + .btn{
    box-sizing:border-box!important;
    margin:0!important;
    min-height:3.5rem!important;
    padding:.85rem .55rem!important;
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
  }
}
${HOME_HERO_CTA_END}`;

export const EXHIBITION_AXIS_BLOCK = `${EXHIBITION_AXIS_START}
/* Defensive fallback only. The canonical mobile gutter is repaired directly in STAGE132 before route bundling. */
@media (max-width:430px){
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content > header.sub ~ section.wrap{
    box-sizing:border-box!important;
    width:calc(100% - 40px)!important;
    max-width:calc(100% - 40px)!important;
    margin-left:20px!important;
    margin-right:20px!important;
    padding-left:0!important;
    padding-right:0!important;
  }
}
${EXHIBITION_AXIS_END}`;

export const EXHIBITION_AXIS_INLINE_STYLE = `<style ${EXHIBITION_AXIS_STYLE_MARKER}>@media (max-width:430px){html body.apple-archive main#main-content>header.sub~section.wrap{box-sizing:border-box!important;width:calc(100% - 40px)!important;max-width:calc(100% - 40px)!important;margin-left:20px!important;margin-right:20px!important;padding-left:0!important;padding-right:0!important}}</style>`;

function ensureBeforeResponsiveEnd(css, start, end, block) {
  const hasStart = css.includes(start);
  const hasEnd = css.includes(end);
  if (hasStart !== hasEnd) throw new Error(`Partial artifact CSS marker state: ${start}`);
  if (hasStart) return css;
  if (!css.includes(APPLE_RESPONSIVE_END)) throw new Error('Canonical Apple responsive CSS anchor missing.');
  return css.replace(APPLE_RESPONSIVE_END, `${block}\n\n${APPLE_RESPONSIVE_END}`);
}

function ensureAtEnd(css, start, end, block) {
  const hasStart = css.includes(start);
  const hasEnd = css.includes(end);
  if (hasStart !== hasEnd) throw new Error(`Partial artifact CSS marker state: ${start}`);
  if (hasStart) return css;
  return `${css.trimEnd()}\n\n${block}\n`;
}

export function repairStage132MobileGutter(css) {
  const start = css.indexOf(STAGE132_START);
  const end = css.indexOf(STAGE132_END, start);
  if (start < 0 || end < 0) throw new Error('STAGE132 exhibition gallery contract is missing.');

  const endOffset = end + STAGE132_END.length;
  const block = css.slice(start, endOffset);
  const legacy = 'width:calc(100% - 2rem)!important;';
  const canonical = 'width:calc(100% - 40px)!important;';
  const legacyCount = block.split(legacy).length - 1;
  const canonicalCount = block.split(canonical).length - 1;

  if (legacyCount > 1) throw new Error(`STAGE132 contains ${legacyCount} legacy mobile gutter declarations; expected at most one.`);
  if (legacyCount === 0) {
    if (canonicalCount !== 1) throw new Error(`STAGE132 canonical 40px mobile gutter count is ${canonicalCount}; expected exactly one.`);
    return { css, changed: false };
  }

  const repairedBlock = block.replace(legacy, canonical);
  return { css: css.slice(0, start) + repairedBlock + css.slice(endOffset), changed: true };
}

export function applyArtifactCssContracts(css) {
  const repaired = repairStage132MobileGutter(css);
  let out = ensureBeforeResponsiveEnd(repaired.css, HOME_HERO_CTA_START, HOME_HERO_CTA_END, HOME_HERO_CTA_BLOCK);
  out = ensureAtEnd(out, EXHIBITION_AXIS_START, EXHIBITION_AXIS_END, EXHIBITION_AXIS_BLOCK);
  return out;
}

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

export function patchExhibitionHtmlContracts(siteRoot) {
  let changed = 0;
  let checked = 0;
  for (const htmlPath of walkHtml(siteRoot)) {
    const rel = path.relative(siteRoot, htmlPath).replaceAll('\\', '/');
    if (!/(^|\/)exhibitions\/[^/]+\.html$/.test(rel)) continue;
    checked += 1;
    const before = fs.readFileSync(htmlPath, 'utf8');
    if (before.includes(EXHIBITION_AXIS_STYLE_MARKER)) continue;
    if (!before.includes('</head>')) throw new Error(`${rel}: missing </head> for exhibition axis contract.`);
    const after = before.replace('</head>', `${EXHIBITION_AXIS_INLINE_STYLE}\n</head>`);
    fs.writeFileSync(htmlPath, after, 'utf8');
    changed += 1;
  }
  if (checked === 0) throw new Error('No exhibition HTML pages found for mobile editorial-axis contract.');
  return { checked, changed };
}

export function patchArtifactCss(siteRoot) {
  const cssPath = path.join(siteRoot, 'assets/css/site.css');
  const before = fs.readFileSync(cssPath, 'utf8');
  const after = applyArtifactCssContracts(before);
  if (after !== before) fs.writeFileSync(cssPath, after, 'utf8');
  return { cssPath, changed: after !== before };
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const siteRoot = path.resolve(process.argv[2] || '_site');
  const result = patchArtifactCss(siteRoot);
  const exhibitions = patchExhibitionHtmlContracts(siteRoot);
  const surface = hardenProductionArtifact(siteRoot);
  console.log(`Artifact CSS contracts ${result.changed ? 'applied' : 'already satisfied'}: ${result.cssPath}`);
  console.log('ART STAGE132 mobile exhibition gutter: canonical 20px-per-side / 40px-total contract enforced before route bundling.');
  console.log(`ART exhibition mobile-axis contract: ${exhibitions.checked} pages checked; ${exhibitions.changed} injected.`);
  console.log(`ART production surface hardened: ${surface.forbidden} repository-only paths excluded; ${surface.required} public contracts present.`);
}
