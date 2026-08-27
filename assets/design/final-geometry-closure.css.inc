/* ART Final Geometry Closure 2026-08-27
   Final computed geometry after all historical/screenshot layers.
   Presentation only; keeps full-width section paint while the actual content axis remains constrained. */

/* Header and section wrappers share one physical box. Full-viewport colour is
   painted by the section pseudo-element; it must never be achieved by widening
   the content wrapper itself. */
html body.apple-archive main#main-content#main-content#main-content>header .wrap,
html body.apple-archive main#main-content#main-content#main-content>section.wrap{
  width:min(100%,var(--dc-shell))!important;
  max-width:var(--dc-shell)!important;
  margin-left:auto!important;
  margin-right:auto!important;
  padding-left:var(--dc-gutter)!important;
  padding-right:var(--dc-gutter)!important;
  box-sizing:border-box!important;
  position:relative!important;
}
html body.apple-archive main#main-content#main-content#main-content>header .wrap.narrow,
html body.apple-archive main#main-content#main-content#main-content>section.wrap.narrow{
  width:min(100%,var(--dc-shell))!important;
  max-width:var(--dc-shell)!important;
}
html body.apple-archive main#main-content#main-content#main-content>section.wrap{
  isolation:isolate!important;
}
html body.apple-archive main#main-content#main-content#main-content>section.wrap::before{
  content:""!important;
  position:absolute!important;
  z-index:-1!important;
  inset-block:0!important;
  left:50%!important;
  width:100vw!important;
  transform:translateX(-50%)!important;
  background:inherit!important;
  pointer-events:none!important;
}
html body.apple-archive main#main-content#main-content#main-content>section.wrap.narrow>:is(p,.lead,.meta,blockquote,.note,ul,ol,h1,h2,h3,h4){
  max-width:var(--dc-reading)!important;
}

/* Press hero: the historical press-shell grid supplied a viewport-dependent gap
   in addition to the paragraph margin. That doubled the intended h1-to-lead
   rhythm (38–58px). The shell is now an ordinary editorial stack and each
   intentional boundary owns its own spacing exactly once. */
html body.apple-archive.press-page .press-hero{
  display:block!important;
  grid-template-columns:none!important;
  grid-template-rows:none!important;
  row-gap:0!important;
  gap:0!important;
}
html body.apple-archive.press-page .press-hero .press-shell{
  display:block!important;
  grid-template-columns:none!important;
  grid-template-rows:none!important;
  row-gap:0!important;
  gap:0!important;
}
html body.apple-archive.press-page .press-hero .press-kicker{
  margin:0 0 22px!important;
}
html body.apple-archive.press-page .press-hero h1{
  margin-top:0!important;
  margin-bottom:0!important;
  padding-bottom:0!important;
  transform:none!important;
  position:static!important;
}
html body.apple-archive.press-page .press-hero h1+p.press-hero__lead{
  margin:20px 0 0!important;
  padding:0!important;
  transform:none!important;
  position:static!important;
}
@media(max-width:620px){
  html body.apple-archive.press-page .press-hero .press-kicker{
    margin-bottom:18px!important;
  }
  html body.apple-archive.press-page .press-hero h1+p.press-hero__lead{
    margin-top:16px!important;
  }
}

/* Book leads are editorial introductions, not viewport/grid fillers. Historical
   grid/flex definitions could stretch the final direct child and leave a large
   empty tail. A block formatting context keeps the lead intrinsically sized. */
html body.apple-archive main#main-content#main-content#main-content>section.book-lead{
  display:block!important;
  grid-template-columns:none!important;
  grid-template-rows:none!important;
  min-height:0!important;
  height:auto!important;
  align-content:start!important;
  align-items:start!important;
  justify-content:start!important;
  padding-top:64px!important;
  padding-bottom:24px!important;
}
html body.apple-archive main#main-content#main-content#main-content>section.book-lead>:first-child{
  margin-top:0!important;
  padding-top:0!important;
}
html body.apple-archive main#main-content#main-content#main-content>section.book-lead>:last-child{
  margin-bottom:0!important;
  padding-bottom:0!important;
}

/* 404 is a utility row, so its return action stays on the same shared shell axis. */
html body.apple-archive main#main-content#main-content#main-content:has(>section.wrap.narrow>a.btn:only-child)>section.wrap.narrow{
  width:min(100%,var(--dc-shell))!important;
  max-width:var(--dc-shell)!important;
  margin-inline:auto!important;
  padding-inline:var(--dc-gutter)!important;
}

/* Expanded-state closure. Footer disclosure is a centered global component on
   every language/page. Curatorial and Press disclosures must not collapse long
   prose into narrow card columns when open. */
html body.apple-archive footer .footer-social-disclosure,
html body.apple-archive footer .footer-social-disclosure[open]{
  width:100%!important;
  max-width:none!important;
  margin-left:auto!important;
  margin-right:auto!important;
  text-align:center!important;
  box-sizing:border-box!important;
}
html body.apple-archive footer .footer-social-disclosure>summary,
html body.apple-archive footer .footer-social-disclosure[open]>summary{
  display:flex!important;
  width:100%!important;
  max-width:none!important;
  min-height:44px!important;
  margin:0!important;
  padding-left:0!important;
  padding-right:0!important;
  align-items:center!important;
  justify-content:center!important;
  justify-self:stretch!important;
  text-align:center!important;
}
html body.apple-archive footer .footer-social-disclosure .footer-social-links,
html body.apple-archive footer .footer-social-disclosure[open] .footer-social-links{
  display:flex!important;
  width:max-content!important;
  max-width:100%!important;
  margin-left:auto!important;
  margin-right:auto!important;
  justify-content:center!important;
  align-items:center!important;
  flex-wrap:wrap!important;
  text-align:center!important;
}
html body.apple-archive[data-archive-page="curators"] main#main-content details[open],
html body.apple-archive.press-page main#main-content details[open]{
  min-width:0!important;
}
html body.apple-archive[data-archive-page="curators"] main#main-content details[open] :is(p,li),
html body.apple-archive.press-page main#main-content details[open] :is(p,li){
  width:100%!important;
  max-width:min(100%,var(--dc-reading))!important;
}

/* 768px is a tablet audit boundary. Long Press disclosure prose must already
   have a real reading measure there; waiting until 769px leaves a 247px column. */
@media(min-width:700px){
  html body.apple-archive.press-page main#main-content details[open] :is(p.desc,p,li){
    min-width:250px!important;
    width:auto!important;
    max-width:var(--dc-reading)!important;
  }
}

@media(min-width:769px){
  html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-grid-disclosure[open]{
    grid-column:1/-1!important;
    width:100%!important;
    max-width:none!important;
  }
  html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-grid-disclosure[open] .curatorial-periods__grid{
    grid-template-columns:repeat(2,minmax(320px,1fr))!important;
    width:100%!important;
    max-width:none!important;
  }
  html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-grid-disclosure[open] .curatorial-period,
  html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-grid-disclosure[open] .curatorial-period :is(p,li){
    min-width:0!important;
    width:100%!important;
    max-width:none!important;
  }
  html body.apple-archive[data-archive-page="curators"] main#main-content details[open] :is(p,li){
    min-width:250px!important;
  }
}

@media(max-width:620px){
  html body.apple-archive main#main-content#main-content#main-content>header .wrap,
  html body.apple-archive main#main-content#main-content#main-content>section.wrap,
  html body.apple-archive main#main-content#main-content#main-content>header .wrap.narrow,
  html body.apple-archive main#main-content#main-content#main-content>section.wrap.narrow,
  html body.apple-archive main#main-content#main-content#main-content:has(>section.wrap.narrow>a.btn:only-child)>section.wrap.narrow{
    width:100%!important;
    max-width:100%!important;
    padding-left:20px!important;
    padding-right:20px!important;
  }
  html body.apple-archive main#main-content#main-content#main-content>section.book-lead{
    padding-top:48px!important;
    padding-bottom:24px!important;
  }
  html body.apple-archive footer .footer-social-disclosure,
  html body.apple-archive footer .footer-social-disclosure[open],
  html body.apple-archive footer .footer-social-disclosure>summary,
  html body.apple-archive footer .footer-social-disclosure[open]>summary{
    width:100%!important;
    max-width:none!important;
    text-align:center!important;
    justify-content:center!important;
  }
}
