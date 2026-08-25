import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const cssPath = 'assets/css/site.css';
const historicalRef = '31ba54d7358f1a151defa4552051810902bd345f';
const historicalPath = 'assets/css/homepage-two-tone-authority.css';
const appleEnd = '/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
const finalStart = '/* ART-SINGLE-DESIGN-AUTHORITY-20260825:START */';
const finalEnd = '/* ART-SINGLE-DESIGN-AUTHORITY-20260825:END */';
const exactStart = '/* ART-EXACT-APPLE-AUTHORITY-20260825:START */';
const exactEnd = '/* ART-EXACT-APPLE-AUTHORITY-20260825:END */';

let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes(appleEnd)) throw new Error('Apple contract END marker missing');
if (!css.includes(finalStart) || !css.includes(finalEnd)) throw new Error('Final single-design authority block missing');

function removeBlock(source, start, end) {
  const a = source.indexOf(start);
  if (a < 0) return source;
  const b = source.indexOf(end, a);
  if (b < 0) throw new Error(`Missing end marker for ${start}`);
  return source.slice(0, a) + source.slice(b + end.length);
}

css = removeBlock(css, exactStart, exactEnd);

const historical = execFileSync('git', ['show', `${historicalRef}:${historicalPath}`], { encoding: 'utf8' }).trim();
if (!historical.includes('STAGE142-UNIVERSAL-APPLE-DESIGN-CONTRACT:START')) {
  throw new Error('Historical Apple design authority marker missing');
}
if (!historical.includes('main>section:nth-of-type(even)')) {
  throw new Error('Historical alternating section rule missing');
}
if (!historical.includes('[data-archive-page="curators"]')) {
  throw new Error('Historical curators layout authority missing');
}

const exact = `\n${exactStart}\n/* Exact restoration of the approved 2026-08-14 universal Apple editorial authority.\n   It lives inside the one final ART design-authority block so there is still one CSS authority. */\n${historical}\n${exactEnd}\n`;
const finalEndIndex = css.indexOf(finalEnd);
if (finalEndIndex < 0) throw new Error('Final single-design authority END marker missing');
css = css.slice(0, finalEndIndex) + exact + '\n' + css.slice(finalEndIndex);

fs.writeFileSync(cssPath, css);
console.log('Restored exact approved ART Apple editorial authority inside the single final CSS authority from', historicalRef);
