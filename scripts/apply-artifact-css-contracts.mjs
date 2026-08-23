import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HOME_HERO_CTA_START = '/* STAGE154-HOME-HERO-CTA-SIZE-CONSISTENCY:START */';
export const HOME_HERO_CTA_END = '/* STAGE154-HOME-HERO-CTA-SIZE-CONSISTENCY:END */';
export const APPLE_RESPONSIVE_END = '/* APPLE-RESPONSIVE-CONTRACT-V1:END */';

export const HOME_HERO_CTA_BLOCK = `${HOME_HERO_CTA_START}
/* Homepage-only desktop CTA geometry. Mobile <=640px remains governed by the existing two-column/narrow-viewport authority. */
@media (min-width:641px){
  html body.apple-archive[data-archive-page="index"] header.hero .hero-cta .btn{
    box-sizing:border-box!important;
    inline-size:10.5rem!important;
    min-inline-size:10.5rem!important;
    max-inline-size:10.5rem!important;
  }
}
${HOME_HERO_CTA_END}`;

export function applyArtifactCssContracts(css) {
  const hasStart = css.includes(HOME_HERO_CTA_START);
  const hasEnd = css.includes(HOME_HERO_CTA_END);
  if (hasStart !== hasEnd) throw new Error('Partial STAGE154 homepage CTA marker state.');
  if (hasStart) return css;
  if (!css.includes(APPLE_RESPONSIVE_END)) throw new Error('Canonical Apple responsive CSS anchor missing.');
  return css.replace(APPLE_RESPONSIVE_END, `${HOME_HERO_CTA_BLOCK}\n\n${APPLE_RESPONSIVE_END}`);
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
  console.log(`Artifact CSS contracts ${result.changed ? 'applied' : 'already satisfied'}: ${result.cssPath}`);
}
