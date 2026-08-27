/* ART Final Geometry Closure 2026-08-27
   Final computed geometry after all historical/screenshot layers.
   Presentation only; keeps full-width section paint while the actual content axis remains constrained. */
html body.apple-archive main#main-content#main-content#main-content>section.wrap{
  width:min(100%,var(--dc-shell))!important;
  max-width:var(--dc-shell)!important;
  margin-left:auto!important;
  margin-right:auto!important;
  padding-left:var(--dc-gutter)!important;
  padding-right:var(--dc-gutter)!important;
  position:relative!important;
  isolation:isolate!important;
}
html body.apple-archive main#main-content#main-content#main-content>section.wrap.narrow{
  width:min(100%,var(--dc-shell))!important;
  max-width:var(--dc-shell)!important;
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
html body.apple-archive.press-page main#main-content#main-content#main-content .press-hero h1{
  margin-bottom:0!important;
}
html body.apple-archive.press-page main#main-content#main-content#main-content .press-hero h1+p.press-hero__lead{
  margin-top:20px!important;
}
html body.apple-archive main#main-content#main-content#main-content>section.book-lead{
  min-height:0!important;
  height:auto!important;
  padding-bottom:24px!important;
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
  html body.apple-archive main#main-content#main-content#main-content>section.wrap,
  html body.apple-archive main#main-content#main-content#main-content>section.wrap.narrow,
  html body.apple-archive main#main-content#main-content#main-content:has(>section.wrap.narrow>a.btn:only-child)>section.wrap.narrow{
    width:100%!important;
    max-width:100%!important;
    padding-left:20px!important;
    padding-right:20px!important;
  }
  html body.apple-archive main#main-content#main-content#main-content>section.book-lead{padding-bottom:24px!important}
}
