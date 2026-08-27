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

/* Press hero uses the same heading-description rhythm as the Design Constitution.
   Historical grid/flex gaps were additive to margins, so explicitly collapse them. */
html body.apple-archive.press-page main#main-content#main-content#main-content .press-hero{
  row-gap:0!important;
  gap:0!important;
}
html body.apple-archive.press-page main#main-content#main-content#main-content .press-hero h1{
  margin-bottom:0!important;
}
html body.apple-archive.press-page main#main-content#main-content#main-content .press-hero h1+p.press-hero__lead{
  margin-top:20px!important;
}

/* Book leads are editorial introductions, not viewport fillers. */
html body.apple-archive main#main-content#main-content#main-content>section.book-lead{
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
}
