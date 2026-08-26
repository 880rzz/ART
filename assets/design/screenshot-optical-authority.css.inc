/* ART Screenshot Optical Authority 2026-08-26
   Screenshot-derived presentation contract.
   No content, metadata, schema, routes, analytics, consent or crawler behavior. */

:root{
  --oa-cell-inset:clamp(22px,2.4vw,34px);
  --oa-block-gap:clamp(28px,3.4vw,48px);
  --oa-section-gap:clamp(64px,7vw,104px);
  --oa-section-pad:clamp(56px,6vw,88px);
  --oa-divider:rgba(17,17,17,.10);
  --oa-reading:68ch;
  --oa-reading-wide:78ch;
}

html body.apple-archive main#main header.hero>img.bg.hero-bg-img,
html body.apple-archive main#main-content header.hero>img.bg.hero-bg-img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important;object-position:right center!important;transform:none!important;will-change:auto!important}

html body.apple-archive main#main-content>section.wrap:not(.statement):not(.center):not(.centered):not([data-align="center"])>:is(.label,.presence-kicker,.period-no,h1,h2,h3,p,.lead,.meta,blockquote,.note,.linklist,.article-list,.writing-list,.presence-copy,.archive-source-hub){margin-left:0!important;margin-right:auto!important}
html body.apple-archive main#main-content :is(.section-head,.section-intro,.curatorial-periods__intro,.press-section__intro)>:is(.label,.presence-kicker,.period-no,h1,h2,h3,p,.lead,.meta,blockquote){margin-left:0!important;margin-right:auto!important}
html body.apple-archive header.sub>.wrap>:is(.label,.presence-kicker,h1,h2,p,.lead,.meta){margin-left:0!important;margin-right:auto!important}

html body.apple-archive main#main-content :is(.presence-copy,.section-copy,.content-copy,.section-intro p,.section-head p){max-width:min(100%,var(--oa-reading-wide))}
html body.apple-archive main#main-content p,html body.apple-archive main#main-content li{line-height:max(1.45,1.45em);text-wrap:pretty}
html body.apple-archive main#main-content :is(h1,h2,h3,h4){text-wrap:balance}

html body.apple-archive main#main-content>section:not(.hero):not(.hero-section):not(.immersive):not(.statement):not([data-layout="immersive"]),
html body.apple-archive main#main>section:not(.hero):not(.hero-section):not(.immersive):not(.statement):not([data-layout="immersive"]){min-height:0!important;height:auto!important;padding-top:var(--oa-section-pad)!important;padding-bottom:var(--oa-section-pad)!important}
html body.apple-archive main#main-content>section:last-child:not(.hero):not(.hero-section):not(.immersive):not(.statement):not([data-layout="immersive"]),
html body.apple-archive main#main>section:last-child:not(.hero):not(.hero-section):not(.immersive):not(.statement):not([data-layout="immersive"]){margin-bottom:0!important;padding-bottom:clamp(48px,5vw,76px)!important}
html body.apple-archive main#main-content>section+section,html body.apple-archive main#main>section+section{margin-top:0!important}
html body.apple-archive main+footer,html body.apple-archive footer{margin-top:0!important}
html body.apple-archive footer{min-height:0!important;height:auto!important;padding-top:clamp(44px,5vw,68px)!important;padding-bottom:clamp(28px,3vw,44px)!important}

html body.apple-archive main#main-content :is(.card,.curatorial-period,.press-card,.source-card,.archive-card,.writing-card,.cell,.panel){box-sizing:border-box!important;min-width:0!important;padding:var(--oa-cell-inset)!important}
html body.apple-archive main#main-content :is(.card,.curatorial-period,.press-card,.source-card,.archive-card,.writing-card,.cell,.panel)>:is(h1,h2,h3,h4,p,.lead,.meta,ul,ol,blockquote){max-width:100%;overflow-wrap:normal;word-break:normal}

html body.apple-archive main#main-content :is(.section-head,.section-intro,.curatorial-periods__intro,.press-section__intro){margin-bottom:var(--oa-block-gap)!important}
html body.apple-archive main#main-content :is(.cards,.grid,.source-grid,.curatorial-periods__grid,.article-list,.writing-list){gap:clamp(14px,1.5vw,20px)!important}

html body.apple-archive main#main-content :is(.card,.curatorial-period,.press-card,.source-card,.archive-card,.writing-card,.cell,.panel){border-width:1px!important;box-shadow:none!important}
html body.apple-archive main#main-content details>summary{border-top:1px solid var(--oa-divider)!important;border-bottom:0!important}
html body.apple-archive main#main-content details:last-of-type>summary{border-bottom:1px solid var(--oa-divider)!important}

html body.apple-archive :is(.site-header,header.site-header,header[role="banner"]) :is(nav,.nav,.nav-links,.menu,.mega-menu,.mega-panel) a{border-radius:0!important;box-shadow:none!important;outline-offset:3px;font-weight:500}
html body.apple-archive :is(.site-header,header.site-header,header[role="banner"]) :is(.nav-links,.menu,.mega-menu,.mega-panel){gap:clamp(10px,1.4vw,20px)}
html body.apple-archive :is(.site-header,header.site-header,header[role="banner"]) :is(.nav-links,.menu,.mega-menu,.mega-panel) a:is(.active,[aria-current="page"]){border:0!important;outline:0!important;box-shadow:none!important;background:transparent!important;font-weight:650}
html body.apple-archive :is(.mega-menu,.mega-panel,details.nav-disclosure) :is(a,summary){min-height:44px;display:flex;align-items:center}
html body.apple-archive :is(.mega-menu,.mega-panel){padding:clamp(14px,1.6vw,22px)!important}

html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-periods>.wrap{width:min(100%,var(--dc-shell))!important;max-width:var(--dc-shell)!important;margin-inline:auto!important;padding-inline:var(--dc-gutter)!important}
html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-grid-disclosure{width:100%!important;max-width:none!important;margin-inline:0!important}
html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-grid-disclosure>.curatorial-periods__grid{width:100%!important;max-width:none!important;margin-inline:0!important;gap:16px!important}
html body.apple-archive[data-archive-page="curators"] main#main-content #presence-anatomy .curatorial-periods__grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
html body.apple-archive[data-archive-page="curators"] main#main-content #curatorial-periods .curatorial-periods__grid{grid-template-columns:repeat(6,minmax(0,1fr))!important}
html body.apple-archive[data-archive-page="curators"] main#main-content #curatorial-periods .curatorial-period:nth-child(-n+3){grid-column:span 2!important}
html body.apple-archive[data-archive-page="curators"] main#main-content #curatorial-periods .curatorial-period:nth-child(n+4){grid-column:span 3!important}
html body.apple-archive[data-archive-page="curators"] main#main-content #creative-method .curatorial-periods__grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}

html body.apple-archive[data-archive-page="curators"] main#main-content .presence-context>.wrap.narrow{width:min(100%,var(--dc-shell))!important;max-width:var(--dc-shell)!important;margin-inline:auto!important;padding-inline:var(--dc-gutter)!important}
html body.apple-archive[data-archive-page="curators"] main#main-content .presence-context :is(.presence-kicker,h2,.presence-copy,.archive-source-hub){margin-left:0!important;margin-right:auto!important}
html body.apple-archive[data-archive-page="curators"] main#main-content .presence-context .presence-copy{max-width:var(--dc-reading)!important}
html body.apple-archive[data-archive-page="curators"] main#main-content .presence-context .archive-source-hub{max-width:var(--dc-reading-wide)!important}

@media(min-width:1025px){
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive footer .footer-social-disclosure[open]{display:grid!important;grid-template-columns:minmax(0,1fr)!important;justify-items:center!important;align-items:start!important;row-gap:.55rem!important;column-gap:0!important;width:100%!important;text-align:center!important}
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive footer .footer-social-disclosure[open]>summary{grid-column:1/-1!important;width:100%!important;max-width:none!important;margin:0!important;justify-content:center!important;justify-self:stretch!important;text-align:center!important}
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive footer .footer-social-disclosure[open] .footer-social-links{grid-column:1/-1!important;display:flex!important;width:max-content!important;max-width:100%!important;margin-inline:auto!important;padding:0!important;justify-self:center!important;justify-content:center!important;align-items:center!important;flex-wrap:wrap!important;white-space:normal!important;text-align:center!important;position:static!important;inset:auto!important;transform:none!important;float:none!important}
}

@media(max-width:900px){
  html body.apple-archive[data-archive-page="curators"] main#main-content #presence-anatomy .curatorial-periods__grid,
  html body.apple-archive[data-archive-page="curators"] main#main-content #curatorial-periods .curatorial-periods__grid,
  html body.apple-archive[data-archive-page="curators"] main#main-content #creative-method .curatorial-periods__grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  html body.apple-archive[data-archive-page="curators"] main#main-content #curatorial-periods .curatorial-period:nth-child(n){grid-column:auto!important}
}
@media(max-width:620px){
  :root{--oa-cell-inset:20px;--oa-block-gap:28px;--oa-section-pad:clamp(44px,12vw,64px)}
  html body.apple-archive main#main-content :is(.cards,.grid,.source-grid,.curatorial-periods__grid,.article-list,.writing-list,.press-grid,.archive-grid){grid-template-columns:1fr!important}
  html body.apple-archive[data-archive-page="curators"] main#main-content #presence-anatomy .curatorial-periods__grid,
  html body.apple-archive[data-archive-page="curators"] main#main-content #curatorial-periods .curatorial-periods__grid,
  html body.apple-archive[data-archive-page="curators"] main#main-content #creative-method .curatorial-periods__grid{grid-template-columns:1fr!important}
}

html body.apple-archive.apple-archive main#main-content,
html body.apple-archive.apple-archive main#main{display:flow-root!important;margin-bottom:0!important;padding-bottom:0!important}
html body.apple-archive.apple-archive main#main-content>:last-child,
html body.apple-archive.apple-archive main#main>:last-child{margin-bottom:0!important}
html body.apple-archive.apple-archive main#main-content+footer,
html body.apple-archive.apple-archive main#main+footer{margin-top:0!important}

html body.apple-archive.apple-archive main#main-content>section:not(.hero):not(.hero-section):not(.immersive):not(.statement):not([data-layout="immersive"])>:first-child:is(h1,h2,h3,h4),
html body.apple-archive.apple-archive main#main>section:not(.hero):not(.hero-section):not(.immersive):not(.statement):not([data-layout="immersive"])>:first-child:is(h1,h2,h3,h4){margin-top:0!important}
html body.apple-archive.apple-archive main#main-content>section.wrap.narrow:not(.hero):not(.immersive):not(.statement),
html body.apple-archive.apple-archive main#main>section.wrap.narrow:not(.hero):not(.immersive):not(.statement){padding-top:var(--oa-section-pad)!important;padding-bottom:var(--oa-section-pad)!important}

/* Final screenshot-backed edge rhythm: the section inset owns the exterior rhythm. */
html body.apple-archive.apple-archive main#main-content :is(section.book-lead,section.life-journey,section#exhibitions,section.curatorial-section)>:first-child,
html body.apple-archive.apple-archive main#main :is(section.book-lead,section.life-journey,section#exhibitions,section.curatorial-section)>:first-child{margin-top:0!important}
html body.apple-archive.apple-archive main#main-content :is(section.book-lead,section.life-journey,section#exhibitions,section.curatorial-section)>:last-child,
html body.apple-archive.apple-archive main#main :is(section.book-lead,section.life-journey,section#exhibitions,section.curatorial-section)>:last-child{margin-bottom:0!important}
