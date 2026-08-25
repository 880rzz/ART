import fs from 'node:fs';

const cssPath='assets/css/site.css';
let css=fs.readFileSync(cssPath,'utf8');
const START='/* CLEAN-ART-DESIGN-AUTHORITY-20260825:START */';
const END='/* CLEAN-ART-DESIGN-AUTHORITY-20260825:END */';
const appleEnd='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
const oldRe=new RegExp(START.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[\\s\\S]*?'+END.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*','g');
css=css.replace(oldRe,'');
if(!css.includes(appleEnd)) throw new Error('ART Apple responsive END marker missing');
const block=`${START}
/* Final visual source of truth. This block adapts current markup to the approved Apple editorial baseline without introducing a second stylesheet or artifact-only layout mutation. */
:root{
  --clean-page:1200px;
  --clean-editorial:900px;
  --clean-reading:760px;
  --clean-gutter:clamp(20px,4vw,56px);
  --clean-section:clamp(64px,7vw,104px);
  --clean-gap:clamp(18px,2.2vw,30px);
}
html,body{max-width:100%;overflow-x:clip}
body.apple-archive{background:#202530;color:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Helvetica Neue',Arial,sans-serif;font-size:17px;line-height:1.62;letter-spacing:-.018em}
body.apple-archive main#main-content{width:100%;min-width:0;overflow:visible}
body.apple-archive .wrap{box-sizing:border-box;width:100%;max-width:var(--clean-page);margin-inline:auto;padding-inline:var(--clean-gutter)}
body.apple-archive .wrap.narrow{max-width:var(--clean-editorial)}
body.apple-archive h1,body.apple-archive h2,body.apple-archive h3{text-wrap:balance;transform:none}
body.apple-archive h1{font-size:clamp(2.5rem,5.5vw,4.9rem);line-height:1.03;letter-spacing:-.045em}
body.apple-archive h2{font-size:clamp(1.8rem,3vw,2.75rem);line-height:1.08;letter-spacing:-.035em;margin:0 0 clamp(18px,2vw,28px)}
body.apple-archive h3{font-size:clamp(1.28rem,2vw,1.65rem);line-height:1.18;letter-spacing:-.026em;margin:clamp(30px,4vw,52px) 0 12px}
body.apple-archive p,body.apple-archive li{max-width:var(--clean-reading)}
body.apple-archive .lead{max-width:var(--clean-reading);font-size:clamp(1.06rem,1.4vw,1.22rem);line-height:1.62;color:#BED0E2;margin:0 0 clamp(26px,3vw,42px)}
body.apple-archive .meta{max-width:var(--clean-reading);margin:12px 0 clamp(34px,4vw,52px)}
body.apple-archive main>section{content-visibility:visible!important;contain-intrinsic-size:none!important}
body.apple-archive body>nav,body.apple-archive>nav{min-height:68px;height:auto;padding:12px var(--clean-gutter);border-bottom:1px solid rgba(190,208,226,.16);background:#202530}
body.apple-archive>nav .brand{min-height:44px}
body.apple-archive header.sub{padding:clamp(108px,13vw,160px) 0 clamp(50px,6vw,82px);border-bottom:1px solid rgba(190,208,226,.16)}
body.apple-archive header.sub>.wrap{margin-inline:auto}
body.apple-archive header.sub h1{max-width:18ch;margin:10px 0 18px}
body.apple-archive header.sub .loc{max-width:var(--clean-reading);font-size:clamp(1.06rem,1.5vw,1.24rem);line-height:1.55}

/* Curatorial reading axis: headings and prose share one left edge; no historical grid or auto-centering may shift paragraphs to the right. */
body.apple-archive[data-archive-page="curators"] main#main-content>section.wrap.narrow{display:block!important;width:100%;max-width:var(--clean-editorial)!important;margin-inline:auto!important;padding:var(--clean-section) var(--clean-gutter)!important}
body.apple-archive[data-archive-page="curators"] main#main-content>section.wrap.narrow>:is(h2,h3,p,ul,blockquote,.note,.btn){margin-left:0!important;transform:none!important;float:none!important}
body.apple-archive[data-archive-page="curators"] main#main-content>section.wrap.narrow>h2{max-width:24ch;margin-top:clamp(54px,7vw,88px)!important}
body.apple-archive[data-archive-page="curators"] main#main-content>section.wrap.narrow>h2:first-of-type{margin-top:clamp(36px,4vw,56px)!important}
body.apple-archive[data-archive-page="curators"] main#main-content>section.wrap.narrow>h3,
body.apple-archive[data-archive-page="curators"] main#main-content>section.wrap.narrow>p.lead,
body.apple-archive[data-archive-page="curators"] main#main-content>section.wrap.narrow>p.meta,
body.apple-archive[data-archive-page="curators"] main#main-content>section.wrap.narrow>ul,
body.apple-archive[data-archive-page="curators"] main#main-content>section.wrap.narrow>blockquote{width:100%!important;max-width:var(--clean-reading)!important;margin-right:auto!important}
body.apple-archive[data-archive-page="curators"] .note{max-width:var(--clean-reading);padding:24px 0;border-top:1px solid rgba(190,208,226,.18);border-bottom:1px solid rgba(190,208,226,.18)}
body.apple-archive[data-archive-page="curators"] .linklist{padding-left:1.2em}
body.apple-archive[data-archive-page="curators"] .linklist li+li{margin-top:12px}
body.apple-archive .curatorial-periods{padding:var(--clean-section) 0}
body.apple-archive .curatorial-periods__intro{max-width:var(--clean-editorial)}
body.apple-archive .curatorial-periods__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:rgba(190,208,226,.16);border:1px solid rgba(190,208,226,.16)}
body.apple-archive .curatorial-period{background:#29303F;padding:clamp(24px,3vw,38px);min-width:0}
body.apple-archive .curatorial-period p{max-width:60ch;color:#BED0E2}

/* Press archive components inherit the same editorial geometry rather than falling back to unstyled block flow. */
body.apple-archive.press-page .press-hero{padding:clamp(118px,14vw,176px) 0 clamp(60px,7vw,94px);border-bottom:1px solid rgba(190,208,226,.17);background:#202530}
body.apple-archive.press-page .press-shell{box-sizing:border-box;width:100%;max-width:var(--clean-page);margin-inline:auto;padding-inline:var(--clean-gutter)}
body.apple-archive.press-page .press-kicker,body.apple-archive.press-page .press-overview__eyebrow{font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:#DCC56B;margin:0 0 18px}
body.apple-archive.press-page .press-hero h1{max-width:17ch;margin:0 0 24px}
body.apple-archive.press-page .press-hero__lead{max-width:var(--clean-reading);font-size:clamp(1.08rem,1.6vw,1.28rem);line-height:1.58;color:#BED0E2;margin:0}
body.apple-archive.press-page .press-facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;margin-top:clamp(40px,5vw,66px);border-top:1px solid rgba(190,208,226,.18);border-bottom:1px solid rgba(190,208,226,.18)}
body.apple-archive.press-page .press-fact{display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:6px;min-width:0;padding:20px 18px 22px 0}
body.apple-archive.press-page .press-fact strong{font-size:clamp(1.45rem,2.3vw,2rem);line-height:1.05;color:#F5F5F7;font-weight:600}
body.apple-archive.press-page .press-fact span{font-size:.86rem;line-height:1.35;color:#AFC4D9}
body.apple-archive.press-page .press-overview{padding:var(--clean-section) 0;background:#29303F}
body.apple-archive.press-page .press-overview__grid{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:clamp(34px,6vw,86px);align-items:start}
body.apple-archive.press-page .press-overview h2{max-width:18ch}
body.apple-archive.press-page .press-overview p{color:#BED0E2}
body.apple-archive.press-page .press-period-nav{position:static;display:grid;grid-template-columns:1fr;background:transparent;padding:0;border:0;z-index:auto}
body.apple-archive.press-page .press-period-nav a{display:grid;grid-template-columns:42px 1fr;gap:14px;padding:15px 0;border-top:1px solid rgba(190,208,226,.18);color:#F5F5F7;min-width:0}
body.apple-archive.press-page .press-period-nav__index{color:#DCC56B;font-variant-numeric:tabular-nums}
body.apple-archive.press-page .press-period-nav__copy{display:flex;justify-content:space-between;gap:16px;min-width:0}
body.apple-archive.press-page .press-period-nav__range{color:#AFC4D9}
body.apple-archive.press-page .press-records .press-period{padding:var(--clean-section) 0}
body.apple-archive.press-page .press-records .press-period:nth-child(even){background:#29303F}
body.apple-archive.press-page .press-period .era-head{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(28px,5vw,72px);align-items:start;margin-bottom:clamp(36px,5vw,62px)}
body.apple-archive.press-page .press-period .era-copy{color:#BED0E2;margin:0}
body.apple-archive.press-page .press-period .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:rgba(190,208,226,.16);border:1px solid rgba(190,208,226,.16)}
body.apple-archive.press-page .press-record{position:relative;display:grid;grid-template-columns:42px 1fr;column-gap:16px;row-gap:10px;background:#202530;padding:clamp(22px,3vw,34px);min-width:0}
body.apple-archive.press-page .press-period:nth-child(even) .press-record{background:#2D3444}
body.apple-archive.press-page .press-record__index{grid-row:1 / span 3;color:#DCC56B;font-variant-numeric:tabular-nums}
body.apple-archive.press-page .press-record__title{font-size:clamp(1.08rem,1.5vw,1.28rem);line-height:1.3;color:#F5F5F7}
body.apple-archive.press-page .press-record .desc,body.apple-archive.press-page .press-record .note{grid-column:2;margin:0;max-width:none;color:#BED0E2}
body.apple-archive.press-page .press-record .note{font-size:.82rem;color:#AFC4D9}

/* Full-screen menu: one calm editorial grid, no inherited card/pill geometry. */
body.apple-archive #menu{inset:0!important;padding:clamp(94px,11vw,132px) var(--clean-gutter) 48px!important;background:#202530!important;overflow-y:auto!important}
body.apple-archive #menu .mwrap{box-sizing:border-box;width:100%;max-width:var(--clean-page)!important;margin:0 auto!important;display:grid!important;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr)!important;gap:clamp(36px,7vw,96px)!important;align-items:start!important}
body.apple-archive #menu .m-main{font-size:clamp(1.35rem,2.4vw,2.1rem)!important;line-height:1.16!important;padding:9px 0!important;border:0!important;border-radius:0!important;color:#F5F5F7!important}
body.apple-archive #menu .m-desc{max-width:54ch!important;margin:0 0 18px!important;color:#AFC4D9!important;font-size:.95rem!important;line-height:1.5!important}
body.apple-archive #menu details{border-top:1px solid rgba(190,208,226,.18)!important;padding:16px 0!important;border-radius:0!important;background:transparent!important}
body.apple-archive #menu details summary{min-height:44px;display:flex;align-items:center;justify-content:space-between;cursor:pointer}
body.apple-archive #menu .sub{margin-top:8px!important;column-gap:26px!important}
body.apple-archive #menu .sub a{padding:7px 0!important;border:0!important;border-radius:0!important}

/* Preserve the approved exact homepage CTA geometry expected by production verification. */
@media (min-width:641px){html body.apple-archive[data-archive-page="index"] header.hero .hero-cta .btn{box-sizing:border-box!important;inline-size:10.5rem!important;min-inline-size:10.5rem!important;max-inline-size:10.5rem!important}}
@media (max-width:1024px){
  body.apple-archive.press-page .press-overview__grid,body.apple-archive.press-page .press-period .era-head{grid-template-columns:1fr}
  body.apple-archive #menu .mwrap{grid-template-columns:1fr!important}
}
@media (max-width:768px){
  body.apple-archive header.sub{padding-top:104px}
  body.apple-archive.press-page .press-facts{grid-template-columns:repeat(2,minmax(0,1fr))}
  body.apple-archive.press-page .press-period .grid,body.apple-archive .curatorial-periods__grid{grid-template-columns:1fr}
  body.apple-archive.press-page .press-period-nav__copy{display:block}
}
@media (max-width:560px){
  body.apple-archive{font-size:16px}
  body.apple-archive h1{font-size:clamp(2.2rem,11vw,3.3rem)}
  body.apple-archive .wrap,body.apple-archive.press-page .press-shell{padding-inline:20px}
  body.apple-archive[data-archive-page="curators"] main#main-content>section.wrap.narrow{padding-inline:20px!important}
  body.apple-archive.press-page .press-facts{grid-template-columns:1fr 1fr}
  body.apple-archive.press-page .press-fact{padding-right:10px}
  body.apple-archive.press-page .press-record{grid-template-columns:34px 1fr;padding:22px 18px}
  body.apple-archive #menu{padding-inline:20px!important}
}
${END}`;
css=css.replace(appleEnd,`${block}\n\n${appleEnd}`);
fs.writeFileSync(cssPath,css,'utf8');

for(const workflowPath of ['.github/workflows/pages.yml','.github/workflows/desktop-regression.yml']){
  let w=fs.readFileSync(workflowPath,'utf8');
  w=w.replace(/^\s*node scripts\/apply-artifact-css-contracts\.mjs _site\s*\n/gm,'');
  if(!w.includes('node scripts/restore-production-design-authority.mjs _site')){
    w=w.replace('node scripts/optimize-pages-artifact.mjs _site','node scripts/optimize-pages-artifact.mjs _site\n          node scripts/restore-production-design-authority.mjs _site');
  }
  if(workflowPath.includes('desktop-regression')&&!w.includes('node tools/audit-all-pages-design.mjs')){
    w=w.replace('AUDIT_BASE_URL=http://127.0.0.1:4173 AUDIT_SITE_DIR=_site node tools/audit-first-principles-layout.mjs','AUDIT_BASE_URL=http://127.0.0.1:4173 AUDIT_SITE_DIR=_site node tools/audit-first-principles-layout.mjs\n          AUDIT_BASE_URL=http://127.0.0.1:4173 AUDIT_SITE_DIR=_site node tools/audit-all-pages-design.mjs');
  }
  fs.writeFileSync(workflowPath,w,'utf8');
}
console.log('ART clean design authority applied; production-only layout mutation removed and exhaustive render audit wired.');
