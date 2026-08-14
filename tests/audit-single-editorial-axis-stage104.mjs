import fs from 'node:fs';

const css = fs.readFileSync('assets/css/homepage-two-tone-authority.css', 'utf8');
const release = JSON.parse(fs.readFileSync('data/design-release.json', 'utf8')).release;
const errors = [];

/* Stage 142 supersedes the old independently-centred 72ch curator column.
   The invariant is stronger now: all ordinary introductions use the same
   left-anchored reading measure inside the shared page canvas, while centring
   is permitted only through an explicit semantic centre selector. */
for (const token of [
  'STAGE142-UNIVERSAL-APPLE-DESIGN-CONTRACT:START',
  '--art-canvas:calc(100% - 8vw)',
  '--art-reading-wide:82ch',
  '.intro,.section-head,.section-intro,.curatorial-periods__intro,.life-journey__intro',
  'margin-left:0!important',
  'margin-right:auto!important',
  'text-align:left!important',
  '[data-align="center"]'
]) {
  if (!css.includes(token)) errors.push('universal editorial axis missing ' + token);
}

for (const forbidden of [
  'STAGE104-SINGLE-EDITORIAL-AXIS:START',
  'width:min(100%,72ch)!important'
]) {
  if (css.includes(forbidden)) errors.push('obsolete independently-centred axis returned: ' + forbidden);
}

for (const file of ['curators.html', 'hu/curators.html', 'de-at/curators.html']) {
  const html = fs.readFileSync(file, 'utf8');
  const intros = (html.match(/class="curatorial-periods__intro"/g) || []).length;
  if (intros < 3) errors.push(`${file}: expected at least three curatorial introductions, found ${intros}`);
  if (!html.includes('class="intro life-journey__intro"')) errors.push(`${file}: life-journey introduction missing`);
  if (!html.includes('homepage-two-tone-authority.css?v=' + release)) errors.push(`${file}: stale authority release`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Stage 104/142 single editorial axis passed on ${release}: curator labels, titles and introductions share the universal left anchor, and only explicit semantic centre sections may centre.`);
