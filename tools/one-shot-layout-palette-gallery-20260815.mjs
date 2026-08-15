import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, v) => fs.writeFileSync(path.join(root, p), v);

// 1) Final CSS authority: one axis, protected cells, exact two-blue palette,
// left-aligned Writing, centred desktop ecosystem row.
const cssPath = 'assets/css/site.css';
let css = read(cssPath);
const start = '/* STAGE144-VISUAL-CONSISTENCY-AUTHORITY:START */';
const end = '/* STAGE144-VISUAL-CONSISTENCY-AUTHORITY:END */';
if (css.includes(start)) {
  css = css.replace(new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\n?`, 'g'), '');
}
const marker = '/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
if (!css.includes(marker)) throw new Error('site.css final authority marker missing');
const block = `
${start}
/* Final visual contract based on the approved ART screenshots: exactly one
   deep blue canvas, one lighter blue content surface, one editorial x-axis,
   and no text touching a cell wall. This block intentionally carries stronger
   specificity than legacy archive layers so older page-specific CSS cannot
   reintroduce drift. */
:root{
  --art-bg:#202530!important;
  --art-surface:#2D3444!important;
  --art-raised:#29303F!important;
  --art-surface-dark:#202530!important;
  --art-surface-light:#2D3444!important;
  --art-axis-max:1200px;
  --art-axis-gutter:clamp(24px,6vw,88px);
  --art-prose-max:68ch;
  --art-cell-pad-x:clamp(22px,2.4vw,34px);
  --art-cell-pad-y:clamp(20px,2.2vw,30px);
  --art-row-gap:clamp(16px,1.6vw,24px);
}

html body.apple-archive.apple-archive.apple-archive{
  background:var(--art-bg)!important;
}
html body.apple-archive.apple-archive.apple-archive main{
  background:var(--art-bg)!important;
}

/* The universal archive rhythm is dark / light-blue / dark / light-blue.
   Retire the old #484F60 slab: every light section now uses #2D3444. */
html body.apple-archive.apple-archive.apple-archive main>section{
  --banhalmi-section-surface:var(--art-bg)!important;
}
html body.apple-archive.apple-archive.apple-archive main>section:nth-of-type(even){
  --banhalmi-section-surface:var(--art-surface)!important;
}
html body.apple-archive.apple-archive.apple-archive main>section:nth-of-type(odd){
  --banhalmi-section-surface:var(--art-bg)!important;
}
html body.apple-archive.apple-archive.apple-archive main>section::before{
  background:var(--banhalmi-section-surface)!important;
}

/* One start axis for hero, content, records and footer. Narrow controls prose
   width, not the section's left edge. */
html body.apple-archive.apple-archive.apple-archive :is(
  main>header .wrap,
  main>header .wrap.narrow,
  main>section.wrap,
  main>section.wrap.narrow,
  .press-shell,
  .press-period>.wrap,
  .record-depth>.wrap,
  .record-relationships>.wrap,
  .project-evidence>.wrap,
  footer>.wrap
){
  box-sizing:border-box!important;
  width:min(calc(100% - (2 * var(--art-axis-gutter))),var(--art-axis-max))!important;
  max-width:var(--art-axis-max)!important;
  margin-left:auto!important;
  margin-right:auto!important;
  padding-left:0!important;
  padding-right:0!important;
}

/* Prose stays readable but always begins on the shared x-axis. */
html body.apple-archive.apple-archive.apple-archive main :is(
  p.lead,.lead,.loc,.era-copy,.press-hero__lead,.press-overview p,.t-item>p,[data-prose]
){
  width:auto!important;
  max-width:var(--art-prose-max)!important;
  margin-left:0!important;
  margin-right:0!important;
  text-align:left!important;
}

/* Card/cell safety. The previous rule lost to older high-specificity layers;
   this is the final authority and therefore cannot collapse to zero padding. */
html body.apple-archive.apple-archive.apple-archive :is(
  .t-item,.press-fact,.press-record,.facts>div,.card,.tile,.panel,[class$="__card"]
){
  box-sizing:border-box!important;
}
html body.apple-archive.apple-archive.apple-archive :is(
  .t-item,.press-fact,.press-record,.facts>div,[class$="__card"]
){
  padding:var(--art-cell-pad-y) var(--art-cell-pad-x)!important;
  background:var(--art-surface)!important;
}
html body.apple-archive.apple-archive.apple-archive :is(
  .t-item,.press-record,.facts>div,.press-fact,[class$="__card"]
)>*+*{
  margin-top:var(--art-row-gap)!important;
}
html body.apple-archive.apple-archive.apple-archive .linklist>li{
  box-sizing:border-box!important;
  padding-top:var(--art-cell-pad-y)!important;
  padding-bottom:var(--art-cell-pad-y)!important;
}

/* Writing: desktop and mobile use the same left-aligned editorial logic.
   No centred milestone heading and no inset secondary text column. */
html body.apple-archive.apple-archive.apple-archive[data-archive-page="writing"] main,
html body.apple-archive.apple-archive.apple-archive[data-archive-page="writing"] main :is(header,section,h1,h2,h3,p,ul,li,.label,.loc,.lead,.facts,.linklist){
  text-align:left!important;
}
html body.apple-archive.apple-archive.apple-archive[data-archive-page="writing"] main>section.wrap,
html body.apple-archive.apple-archive.apple-archive[data-archive-page="writing"] main>section.wrap.narrow,
html body.apple-archive.apple-archive.apple-archive[data-archive-page="writing"] main>header .wrap,
html body.apple-archive.apple-archive.apple-archive[data-archive-page="writing"] main>header .wrap.narrow{
  width:min(calc(100% - (2 * var(--art-axis-gutter))),var(--art-axis-max))!important;
  max-width:var(--art-axis-max)!important;
  margin-inline:auto!important;
  padding-inline:0!important;
}
html body.apple-archive.apple-archive.apple-archive[data-archive-page="writing"] main>section>*{
  margin-left:0!important;
  margin-right:0!important;
}
html body.apple-archive.apple-archive.apple-archive[data-archive-page="writing"] main>section:nth-of-type(even)::before{
  background:var(--art-surface)!important;
}

/* Community timeline cells use the approved lighter blue and retain real
   interior breathing room at every width. */
html body.apple-archive.apple-archive.apple-archive[data-archive-page="community"] .timeline{
  width:100%!important;
  max-width:none!important;
}
html body.apple-archive.apple-archive.apple-archive[data-archive-page="community"] .t-item{
  width:min(100%,68rem)!important;
  max-width:68rem!important;
  padding:var(--art-cell-pad-y) var(--art-cell-pad-x)!important;
  background:var(--art-surface)!important;
}

/* Footer: the three official destinations are independent of the global nav
   geometry and form one truly centred desktop row. */
html body.apple-archive.apple-archive.apple-archive footer .banhalmi-ecosystem{
  position:static!important;
  inset:auto!important;
  transform:none!important;
  height:auto!important;
  min-height:0!important;
  background:transparent!important;
  border:0!important;
  box-shadow:none!important;
  box-sizing:border-box!important;
  margin-left:auto!important;
  margin-right:auto!important;
  padding:clamp(18px,2.5vw,30px) 20px!important;
  text-align:center!important;
}
@media(min-width:900px){
  html body.apple-archive.apple-archive.apple-archive footer .banhalmi-ecosystem{
    width:min(calc(100% - 40px),48rem)!important;
    max-width:48rem!important;
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:clamp(18px,2.5vw,32px)!important;
    align-items:center!important;
    justify-content:center!important;
  }
  html body.apple-archive.apple-archive.apple-archive footer .banhalmi-ecosystem>a{
    display:flex!important;
    width:100%!important;
    min-width:0!important;
    min-height:44px!important;
    align-items:center!important;
    justify-content:center!important;
    margin:0!important;
    padding:8px 0!important;
    text-align:center!important;
    white-space:nowrap!important;
  }
}

/* Exhibition galleries are content, not progressive disclosures. */
html body.apple-archive.apple-archive.apple-archive[data-record-type="exhibition"] .record-gallery-disclosure>summary,
html body.apple-archive.apple-archive.apple-archive[data-record-type="exhibition"] #galmore{
  display:none!important;
}
html body.apple-archive.apple-archive.apple-archive[data-record-type="exhibition"] :is(.collage,.masonry,.strip){
  width:100%!important;
}

@media(max-width:760px){
  :root{
    --art-axis-gutter:20px;
    --art-cell-pad-x:18px;
    --art-cell-pad-y:16px;
    --art-row-gap:14px;
  }
  html body.apple-archive.apple-archive.apple-archive footer .banhalmi-ecosystem{
    width:min(calc(100% - 40px),32rem)!important;
    display:flex!important;
    flex-wrap:wrap!important;
    justify-content:center!important;
    gap:10px 18px!important;
  }
  html body.apple-archive.apple-archive.apple-archive footer .banhalmi-ecosystem>a{
    min-height:44px!important;
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    margin:0!important;
  }
}
${end}

`;
css = css.replace(marker, block + marker);
write(cssPath, css);

// 2) Exhibition galleries: do not dynamically collapse them. If a stale page
// contains hidden gallery batches, expand them at runtime as a safety net.
const jsPath = 'assets/js/responsive-header-system.js';
let js = read(jsPath);
const oldGalleryBlock = `  if (isExhibitionRecord) {\n    const gallerySection = [...document.querySelectorAll('main > section')]\n      .find((section) => section.querySelectorAll('img').length >= 6);\n    const gallery = gallerySection\n      ? [...gallerySection.children].find((child) => child.querySelectorAll('img').length >= 6)\n      : null;\n    const imageCount = gallery?.querySelectorAll('img').length || 0;\n    wrapInDisclosure(\n      gallery,\n      'record-gallery-disclosure',\n      \`${'${disclosureLabels.gallery}'} · ${'${String(imageCount).padStart(2, \'0\')}'}\`\n    );\n  }`;
const newGalleryBlock = `  if (isExhibitionRecord) {\n    document.querySelectorAll('.gal-batch[hidden]').forEach((batch) => {\n      batch.hidden = false;\n      batch.querySelectorAll('img').forEach((image) => { image.loading = 'lazy'; });\n    });\n    const more = document.getElementById('galmore');\n    if (more) more.hidden = true;\n    const disclosure = document.querySelector('details.record-gallery-disclosure');\n    if (disclosure) {\n      const summary = disclosure.querySelector(':scope > summary');\n      summary?.remove();\n      disclosure.replaceWith(...disclosure.childNodes);\n    }\n  }`;
if (!js.includes(oldGalleryBlock)) throw new Error('responsive-header exhibition disclosure block changed unexpectedly');
js = js.replace(oldGalleryBlock, newGalleryBlock);
write(jsPath, js);

// 3) Static exhibition pages: remove hidden from gallery batches so galleries
// are open even before JavaScript executes.
const exhibitionRoots = ['exhibitions', 'hu/exhibitions', 'de-at/exhibitions'];
let expandedPages = 0;
for (const relDir of exhibitionRoots) {
  const dir = path.join(root, relDir);
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const file = path.join(dir, entry.name);
    let html = fs.readFileSync(file, 'utf8');
    const before = html;
    html = html.replace(/(<div\b[^>]*class=["'][^"']*\bgal-batch\b[^"']*["'][^>]*?)\s+hidden(?=[\s>])/gi, '$1');
    if (html !== before) {
      fs.writeFileSync(file, html);
      expandedPages += 1;
    }
  }
}

// 4) Palette audit must reflect the restored vector favicon rather than the
// obsolete embedded-JPEG contract.
const palettePath = 'tools/audit-blue-palette-contrast-stage43.mjs';
let palette = read(palettePath);
const oldFaviconAudit = `const favicon = fs.readFileSync('assets/img/favicon.svg', 'utf8');\nif (!favicon.includes('viewBox="0 0 185 185"') || !favicon.includes('data:image/jpeg;base64,')) {\n  errors.push('signature favicon contract missing');\n}\nconst logo = fs.readFileSync('assets/img/banhalmi-logo.svg', 'utf8');\nif (!logo.includes('fill="#DCC56B"')) errors.push('canonical gold logo missing');`;
const newFaviconAudit = `const favicon = fs.readFileSync('assets/img/favicon.svg', 'utf8');\nconst logo = fs.readFileSync('assets/img/banhalmi-logo.svg', 'utf8');\nconst compactSvg = value => value.replace(/>\\s+</g, '><').replace(/\\s+/g, ' ').trim();\nif (!favicon.includes('<path') || favicon.includes('<image') || favicon.includes('data:image') || compactSvg(favicon) !== compactSvg(logo)) {\n  errors.push('canonical vector favicon contract missing');\n}\nif (!logo.includes('fill="#DCC56B"')) errors.push('canonical gold logo missing');`;
if (!palette.includes(oldFaviconAudit)) throw new Error('palette favicon audit block changed unexpectedly');
palette = palette.replace(oldFaviconAudit, newFaviconAudit);
write(palettePath, palette);

// 5) Harden browser audit for the exact regressions reported from screenshots.
const auditPath = 'tools/audit-first-principles-layout.mjs';
let audit = read(auditPath);
const needle = `      // Press is information-dense: values, labels and periods must never fuse.`;
if (!audit.includes(needle)) throw new Error('first-principles audit insertion marker missing');
const extraAudit = `      // Screenshot contract: all constrained hero/section wrappers share one x-axis.\n      const axisNodes=[...document.querySelectorAll('main>header .wrap,main>section.wrap')].filter(visible);\n      if(axisNodes.length>1){const lefts=axisNodes.map(el=>el.getBoundingClientRect().left);const spread=Math.max(...lefts)-Math.min(...lefts);if(spread>3)out.push(\`editorial x-axis drift ${'${spread.toFixed(1)}'}px\`);}\n\n      // Screenshot contract: text may never sit on a visible cell wall.\n      for(const cell of document.querySelectorAll('.t-item,.press-fact,.press-record,.facts>div,[class$="__card"]')){\n        if(!visible(cell))continue;const s=getComputedStyle(cell),pl=px(s.paddingLeft),pr=px(s.paddingRight);if(pl<16||pr<16)out.push(\`${'${name(cell)}'} cell padding ${'${pl.toFixed(0)}'}/${'${pr.toFixed(0)}'}px\`);\n      }\n\n      // Writing is deliberately left-aligned at every viewport and uses only the\n      // approved deep/light blue pair.\n      if(document.body.dataset.archivePage==='writing'){\n        for(const el of document.querySelectorAll('main h1,main h2,main p,main li')){if(visible(el)&&getComputedStyle(el).textAlign!=='left')out.push(\`writing text not left-aligned: ${'${name(el)}'}\`);}\n        for(const section of document.querySelectorAll('main>section')){if(!visible(section))continue;const c=getComputedStyle(section,'::before').backgroundColor.replace(/\\s+/g,'');if(c&&c!=='rgba(0,0,0,0)'&&c!=='rgb(32,37,48)'&&c!=='rgb(45,52,68)')out.push(\`writing section surface ${'${c}'}\`);}\n      }\n\n      // Exhibition record galleries stay open; they are never hidden behind a\n      // disclosure or a progressive "more" control.\n      if(document.body.dataset.recordType==='exhibition'){\n        if(document.querySelector('details.record-gallery-disclosure'))out.push('exhibition gallery collapsed in disclosure');\n        if([...document.querySelectorAll('.gal-batch[hidden]')].some(el=>visible(el)===false))out.push('exhibition gallery batch remains hidden');\n        const more=document.getElementById('galmore');if(more&&visible(more))out.push('exhibition gallery more control remains visible');\n      }\n\n`;
audit = audit.replace(needle, extraAudit + needle);
write(auditPath, audit);

// 6) Remove this one-shot machinery in the same final commit.
for (const temp of [
  'tools/one-shot-layout-palette-gallery-20260815.mjs',
  '.github/workflows/one-shot-layout-palette-gallery-20260815.yml'
]) {
  const p = path.join(root, temp);
  if (fs.existsSync(p)) fs.rmSync(p);
}

console.log(`Stage 144 remediation prepared. Static gallery batches expanded on ${expandedPages} exhibition pages.`);
