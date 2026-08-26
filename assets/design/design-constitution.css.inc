/* BANHALMI ART — Design Constitution 2026-08-25
   Purpose: one restrained Apple-like editorial system across archive pages.
   This fragment is deterministically merged into production CSS bundles by the design-authority restore step.
   It changes presentation only; content, metadata, schema, routes and analytics remain untouched. */

:root{
  --dc-shell:1200px;
  --dc-reading:760px;
  --dc-reading-wide:920px;
  --dc-gutter:clamp(24px,5vw,72px);
  --dc-section:clamp(72px,8vw,120px);
  --dc-section-tight:clamp(48px,5.5vw,80px);
  --dc-heading-gap:clamp(20px,2.5vw,34px);
  --dc-radius:24px;
  --dc-radius-small:16px;
  --dc-soft-surface:rgba(255,255,255,.025);
  --dc-softer-line:rgba(255,255,255,.10);
}
html body.apple-archive .wrap{width:min(100%,var(--dc-shell));max-width:var(--dc-shell);padding-inline:var(--dc-gutter)}
html body.apple-archive .wrap.narrow{width:min(100%,calc(var(--dc-reading) + 2 * var(--dc-gutter)));max-width:calc(var(--dc-reading) + 2 * var(--dc-gutter))}
html body.apple-archive main{overflow:clip}
html body.apple-archive main>section,html body.apple-archive main>header+section{padding-block:var(--dc-section)}
html body.apple-archive header.sub{padding-top:clamp(132px,13vw,184px);padding-bottom:var(--dc-section-tight)}
html body.apple-archive header.sub+section{padding-top:var(--dc-section-tight)}
html body.apple-archive section+section{margin-top:0}
html body.apple-archive h1{max-width:18ch;font-size:clamp(2.7rem,5.2vw,4.65rem);line-height:1.02;letter-spacing:-.024em}
html body.apple-archive h2{max-width:22ch;font-size:clamp(1.875rem,3.2vw,3rem);line-height:1.06;letter-spacing:-.024em;margin-top:clamp(2.75rem,5vw,4.5rem);margin-bottom:var(--dc-heading-gap)}
html body.apple-archive h3{font-size:clamp(1.25rem,1.7vw,1.55rem);line-height:1.16;letter-spacing:-.022em}
html body.apple-archive p,html body.apple-archive li{text-wrap:pretty}
html body.apple-archive .lead{max-width:62ch;font-size:clamp(1.08rem,1.35vw,1.28rem);line-height:1.55;letter-spacing:-.018em}
html body.apple-archive .label,html body.apple-archive .presence-kicker,html body.apple-archive .period-no{letter-spacing:.16em;font-weight:650}
html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow{max-width:calc(var(--dc-reading-wide) + 2 * var(--dc-gutter))}
html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow>.lead,html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow>p:not(.meta),html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow>blockquote,html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow>.linklist{max-width:var(--dc-reading)}
html body.apple-archive[data-archive-page="curators"] .note{max-width:var(--dc-reading);padding:clamp(24px,3vw,36px);border:1px solid var(--dc-softer-line);border-radius:var(--dc-radius-small);background:var(--dc-soft-surface)}
html body.apple-archive[data-archive-page="curators"] blockquote{margin-block:clamp(48px,6vw,80px);padding-left:clamp(20px,3vw,34px);border-left:2px solid var(--gold);font-size:clamp(1.375rem,2.1vw,1.8rem);line-height:1.35}
html body.apple-archive[data-archive-page="curators"] .linklist{list-style:none;padding:0;margin:0 0 clamp(32px,5vw,56px)}
html body.apple-archive[data-archive-page="curators"] .linklist li{padding:18px 0;border-bottom:1px solid var(--dc-softer-line)}
html body.apple-archive[data-archive-page="curators"] .linklist li:last-child{border-bottom:0}
html body.apple-archive .curatorial-periods{padding-block:var(--dc-section)}
html body.apple-archive .curatorial-periods__intro{max-width:var(--dc-reading-wide);margin:0 0 clamp(40px,5vw,68px)}
html body.apple-archive .curatorial-grid-disclosure>summary{min-height:64px;padding:20px 0;border-top:1px solid var(--dc-softer-line);border-bottom:1px solid var(--dc-softer-line);font-size:1rem;font-weight:600}
html body.apple-archive .curatorial-grid-disclosure[open]>summary{margin-bottom:24px}
html body.apple-archive .curatorial-periods__grid{width:100%;max-width:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;background:transparent}
html body.apple-archive .curatorial-period{min-width:0;padding:clamp(28px,3vw,42px);border:1px solid var(--dc-softer-line);border-radius:var(--dc-radius-small);background:var(--dc-soft-surface)}
html body.apple-archive .curatorial-period h3{max-width:18ch;margin-top:18px}
html body.apple-archive .curatorial-period p{max-width:36ch;color:rgba(225,231,239,.78);line-height:1.55}
html body.apple-archive #curatorial-periods .curatorial-periods__grid{grid-template-columns:repeat(6,minmax(0,1fr))}
html body.apple-archive #curatorial-periods .curatorial-period:nth-child(-n+3){grid-column:span 2}
html body.apple-archive #curatorial-periods .curatorial-period:nth-child(n+4){grid-column:span 3}
html body.apple-archive #creative-method .curatorial-periods__grid{grid-template-columns:repeat(2,minmax(0,1fr))}
html body.apple-archive .presence-context .wrap{display:block}
html body.apple-archive .presence-context .presence-copy{max-width:var(--dc-reading);margin:0 0 clamp(36px,4vw,54px)}
html body.apple-archive .archive-source-hub{width:100%;max-width:var(--dc-reading-wide);display:grid;grid-template-columns:1fr 1fr;gap:0}
html body.apple-archive .archive-source-hub>a{min-width:0;padding:20px 0;border:0;border-bottom:1px solid var(--dc-softer-line);background:transparent;display:grid;grid-template-columns:minmax(150px,.7fr) 1fr;gap:24px;align-items:baseline}
html body.apple-archive .archive-source-hub>a:nth-last-child(-n+2){border-bottom:0}
html body.apple-archive .archive-source-hub strong{font-size:1rem}
html body.apple-archive .archive-source-hub small{line-height:1.45;color:rgba(225,231,239,.62)}
html body.apple-archive main.writing-page>section>.wrap,html body.apple-archive main.community-page>section>.wrap,html body.apple-archive main.press-redesign>section>.wrap{max-width:var(--dc-shell)}
html body.apple-archive main.writing-page :is(.article-list,.writing-list,.linklist),html body.apple-archive main.community-page :is(.article-list,.writing-list,.linklist){max-width:var(--dc-reading-wide)}
html body.apple-archive main.writing-page li,html body.apple-archive main.community-page li{border-color:var(--dc-softer-line)}
html body.apple-archive.press-page .press-source-grid,html body.apple-archive.press-page .source-grid,html body.apple-archive.press-page .archive-source-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;background:transparent}
html body.apple-archive.press-page :is(.press-source-grid,.source-grid,.archive-source-grid)>*{border:1px solid var(--dc-softer-line);border-radius:var(--dc-radius-small);background:var(--dc-soft-surface)}
html body.apple-archive.press-page :is(.press-source-grid,.source-grid,.archive-source-grid)>*:empty{display:none!important}
html body.apple-archive main.exhibition-page section,html body.apple-archive main[class*="exhibition"] section{scroll-margin-top:96px}
html body.apple-archive .press-media,html body.apple-archive .media-links{max-width:var(--dc-reading-wide)}
html body.apple-archive footer{padding-block:clamp(56px,7vw,88px)!important}
html body.apple-archive footer>.wrap{max-width:var(--dc-shell)!important}
html body.apple-archive footer :is(p,a,summary,small){font-size:clamp(.74rem,.72vw,.84rem)!important;line-height:1.45!important}
html body.apple-archive footer .banhalmi-ecosystem{margin-top:32px!important;padding-top:24px!important}
html body.apple-archive footer details .footer-social-links{margin-inline:auto!important;justify-content:center!important;text-align:center!important}
@media(max-width:900px){:root{--dc-gutter:clamp(20px,5vw,40px);--dc-section:clamp(64px,10vw,88px)}html body.apple-archive .curatorial-periods__grid,html body.apple-archive #curatorial-periods .curatorial-periods__grid,html body.apple-archive #creative-method .curatorial-periods__grid{grid-template-columns:repeat(2,minmax(0,1fr))}html body.apple-archive #curatorial-periods .curatorial-period:nth-child(n){grid-column:auto}html body.apple-archive .archive-source-hub{grid-template-columns:1fr}html body.apple-archive .archive-source-hub>a:nth-last-child(-n+2){border-bottom:1px solid var(--dc-softer-line)}html body.apple-archive .archive-source-hub>a:last-child{border-bottom:0}}
@media(max-width:620px){:root{--dc-gutter:20px;--dc-section:56px;--dc-section-tight:40px}html body.apple-archive h1{font-size:clamp(2.35rem,11vw,3.125rem)}html body.apple-archive h2{font-size:clamp(1.8rem,8vw,2.4rem);margin-top:3.25rem}html body.apple-archive .curatorial-periods__grid,html body.apple-archive #curatorial-periods .curatorial-periods__grid,html body.apple-archive #creative-method .curatorial-periods__grid,html body.apple-archive.press-page :is(.press-source-grid,.source-grid,.archive-source-grid){grid-template-columns:1fr}html body.apple-archive .archive-source-hub>a{grid-template-columns:1fr;gap:6px;padding:18px 0}html body.apple-archive .curatorial-period{padding:24px}html body.apple-archive footer{padding-block:48px!important}}

/* Final computed-style authority.
   Legacy archive selectors may be more specific than the shared rules above;
   these declarations deliberately win after the production merge so every route
   resolves to the same accepted typography, shell and surface geometry. */
html body.apple-archive main :is(.wrap,.container,.content-wrap){box-sizing:border-box!important;max-width:var(--dc-shell)!important;margin-inline:auto!important}
html body.apple-archive main .wrap{width:min(100%,var(--dc-shell))!important;padding-inline:var(--dc-gutter)!important}
html body.apple-archive main .wrap.narrow{width:min(100%,calc(var(--dc-reading) + 2 * var(--dc-gutter)))!important;max-width:calc(var(--dc-reading) + 2 * var(--dc-gutter))!important}
html body.apple-archive main h1{letter-spacing:-.022em!important;line-height:1.02!important}
html body.apple-archive main h2{letter-spacing:-.022em!important;line-height:1.06!important}
html body.apple-archive main h3{letter-spacing:-.018em!important;line-height:1.16!important}
html body.apple-archive main .lead{line-height:1.50!important}
html body.apple-archive.press-page main :is(.press-hero__lead,p.lead){font-size:max(1rem,clamp(1rem,1.35vw,1.28rem))!important;line-height:1.50!important}
html body.apple-archive main :is(h1,h2,h3)+:is(p,.lead,.meta,ul,ol,blockquote){margin-top:12px!important}
html body.apple-archive main>section.wrap{position:relative;isolation:isolate}
html body.apple-archive main>section.wrap::before{content:"";position:absolute;z-index:-1;inset-block:0;left:50%;width:100vw;transform:translateX(-50%);background:inherit;pointer-events:none}
html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow{max-width:calc(var(--dc-reading-wide) + 2 * var(--dc-gutter))!important}

/* Absolute final authority: the historical archive stylesheet contains a few
   highly-specific !important selectors. Bind the Constitution to the canonical
   main landmark ID so those legacy declarations cannot win on specificity. */
html body.apple-archive main#main-content h1{letter-spacing:-.022em!important;line-height:1.02!important}
html body.apple-archive main#main-content h2{letter-spacing:-.022em!important;line-height:1.06!important}
html body.apple-archive main#main-content h3{letter-spacing:-.018em!important;line-height:1.16!important}
html body.apple-archive main#main-content .lead{line-height:1.50!important}
html body.apple-archive main#main-content :is(.press-hero__lead,p.lead){font-size:clamp(1rem,1.35vw,1.28rem)!important;line-height:1.50!important}

/* Top-level section surfaces are genuinely viewport-wide while their text keeps
   the shared shell/readability contract. This replaces the earlier pseudo-bleed,
   whose paint was full-width but whose section geometry remained inset. */
html body.apple-archive main#main-content>section.wrap{width:100vw!important;max-width:none!important;margin-left:calc(50% - 50vw)!important;margin-right:calc(50% - 50vw)!important;padding-left:max(var(--dc-gutter),calc((100vw - var(--dc-shell))/2 + var(--dc-gutter)))!important;padding-right:max(var(--dc-gutter),calc((100vw - var(--dc-shell))/2 + var(--dc-gutter)))!important}
html body.apple-archive main#main-content>section.wrap.narrow{width:100vw!important;max-width:none!important;padding-left:max(var(--dc-gutter),calc((100vw - var(--dc-reading))/2))!important;padding-right:max(var(--dc-gutter),calc((100vw - var(--dc-reading))/2))!important}
html body.apple-archive main#main-content>section.wrap::before{content:none!important}

/* A 404 page has no coloured/content surface to bleed: its only section is the
   single return action. Keep that action on the exact same editorial axis as the
   subheader instead of promoting the utility row to viewport width. */
html body.apple-archive main#main-content:has(>section.wrap.narrow>a.btn:only-child)>section.wrap.narrow{width:min(88%,var(--dc-shell))!important;max-width:var(--dc-shell)!important;margin-left:auto!important;margin-right:auto!important;padding-left:0!important;padding-right:0!important}
@media(max-width:620px){html body.apple-archive main#main-content:has(>section.wrap.narrow>a.btn:only-child)>section.wrap.narrow{width:calc(100% - 40px)!important}}
