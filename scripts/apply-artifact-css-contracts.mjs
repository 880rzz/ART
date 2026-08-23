import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hardenProductionArtifact } from './harden-production-artifact.mjs';

export const HOME_HERO_CTA_START = '/* STAGE154-HOME-HERO-CTA-SIZE-CONSISTENCY:START */';
export const HOME_HERO_CTA_END = '/* STAGE154-HOME-HERO-CTA-SIZE-CONSISTENCY:END */';
export const EXHIBITION_AXIS_START = '/* EXHIBITION-MOBILE-EDITORIAL-AXIS:START */';
export const EXHIBITION_AXIS_END = '/* EXHIBITION-MOBILE-EDITORIAL-AXIS:END */';
export const APPLE_RESPONSIVE_END = '/* APPLE-RESPONSIVE-CONTRACT-V1:END */';

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
/* Record-style subpages use one mobile editorial x-axis. This selector is intentionally based only on source-static structure so route-specific CSS optimization cannot drop it before runtime metadata is attached. */
@media (max-width:430px){
  html body.apple-archive main > header.sub .wrap,
  html body.apple-archive main > header.sub ~ section.wrap{
    box-sizing:border-box!important;
    width:100%!important;
    max-width:100%!important;
    margin-left:auto!important;
    margin-right:auto!important;
    padding-left:6vw!important;
    padding-right:6vw!important;
  }
}
${EXHIBITION_AXIS_END}`;

function ensureBlock(css, start, end, block) {
  const hasStart = css.includes(start);
  const hasEnd = css.includes(end);
  if (hasStart !== hasEnd) throw new Error(`Partial artifact CSS marker state: ${start}`);
  if (hasStart) return css;
  if (!css.includes(APPLE_RESPONSIVE_END)) throw new Error('Canonical Apple responsive CSS anchor missing.');
  return css.replace(APPLE_RESPONSIVE_END, `${block}\n\n${APPLE_RESPONSIVE_END}`);
}

export function applyArtifactCssContracts(css) {
  let out = ensureBlock(css, HOME_HERO_CTA_START, HOME_HERO_CTA_END, HOME_HERO_CTA_BLOCK);
  out = ensureBlock(out, EXHIBITION_AXIS_START, EXHIBITION_AXIS_END, EXHIBITION_AXIS_BLOCK);
  return out;
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
  const surface = hardenProductionArtifact(siteRoot);
  console.log(`Artifact CSS contracts ${result.changed ? 'applied' : 'already satisfied'}: ${result.cssPath}`);
  console.log(`ART production surface hardened: ${surface.forbidden} repository-only paths excluded; ${surface.required} public contracts present.`);
}
