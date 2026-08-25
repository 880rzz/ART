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

// The approved ART visual source of truth is the committed assets/css/site.css
// from the last-known-perfect design baseline. Production must never invent,
// append, reorder or override visual rules after source audits have passed.
export const HOME_HERO_CTA_BLOCK = '';
export const EXHIBITION_AXIS_BLOCK = '';
export const EXHIBITION_AXIS_INLINE_STYLE = '';

export function repairStage132MobileGutter(css) {
  return { css, changed: false };
}

export function applyArtifactCssContracts(css) {
  return css;
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
  let checked = 0;
  let changed = 0;
  const injectedStyle = /<style\s+data-exhibition-axis-contract=["']v1["']>[\s\S]*?<\/style>\s*/gi;
  for (const htmlPath of walkHtml(siteRoot)) {
    const rel = path.relative(siteRoot, htmlPath).replaceAll('\\', '/');
    if (!/(^|\/)exhibitions\/[^/]+\.html$/.test(rel)) continue;
    checked += 1;
    const before = fs.readFileSync(htmlPath, 'utf8');
    const after = before.replace(injectedStyle, '');
    if (after !== before) {
      fs.writeFileSync(htmlPath, after, 'utf8');
      changed += 1;
    }
  }
  if (checked === 0) throw new Error('No exhibition HTML pages found while validating production design integrity.');
  return { checked, changed };
}

export function patchArtifactCss(siteRoot) {
  const cssPath = path.join(siteRoot, 'assets/css/site.css');
  const before = fs.readFileSync(cssPath, 'utf8');
  const after = applyArtifactCssContracts(before);
  if (after !== before) throw new Error('Production attempted to mutate the approved ART CSS authority.');
  return { cssPath, changed: false };
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const siteRoot = path.resolve(process.argv[2] || '_site');
  const result = patchArtifactCss(siteRoot);
  const exhibitions = patchExhibitionHtmlContracts(siteRoot);
  const surface = hardenProductionArtifact(siteRoot);
  console.log(`Approved ART CSS preserved byte-for-byte: ${result.cssPath}`);
  console.log(`ART exhibition pages validated: ${exhibitions.checked}; stale production-only inline styles removed: ${exhibitions.changed}.`);
  console.log(`ART production surface hardened: ${surface.forbidden} repository-only paths excluded; ${surface.required} public contracts present.`);
}
