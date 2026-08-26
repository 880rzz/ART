/* ART Screenshot Optical Authority 2026-08-26
   Presentation-only corrections derived from approved desktop screenshots.
   No content, metadata, schema, routes, analytics, consent or crawler behavior. */

/* Home hero: keep the visual layer on one deterministic geometry from first paint.
   The previous oversized (-12% / 124%) image box was visually stable after load but
   Lighthouse still observed the image element moving while the hero settled. The
   image is decorative; pinning it to the hero box removes CLS without changing the
   content hierarchy, metadata, responsive crop intent or interaction model. */
html body.apple-archive main#main header.hero>img.bg.hero-bg-img,
html body.apple-archive main#main-content header.hero>img.bg.hero-bg-img{
  position:absolute!important;
  inset:0!important;
  width:100%!important;
  height:100%!important;
  max-width:none!important;
  object-fit:cover!important;
  object-position:right center!important;
  transform:none!important;
  will-change:auto!important;
}

/* Apple-like editorial axis contract.
   In a linear content section the label/kicker, heading, description, body copy and
   editorial lists share one left optical axis. Their readable max-width may differ;
   their starting x-coordinate may not. Deliberately centred compositions remain
   excluded, as do genuine grid/card layouts. */
html body.apple-archive main#main-content>section.wrap:not(.statement):not(.center):not(.centered):not([data-align="center"])>
:is(.label,.presence-kicker,.period-no,h1,h2,h3,p,.lead,.meta,blockquote,.note,.linklist,.article-list,.writing-list,.presence-copy,.archive-source-hub){
  margin-left:0!important;
  margin-right:auto!important;
}
html body.apple-archive main#main-content :is(.section-head,.section-intro,.curatorial-periods__intro,.press-section__intro)>
:is(.label,.presence-kicker,.period-no,h1,h2,h3,p,.lead,.meta,blockquote){
  margin-left:0!important;
  margin-right:auto!important;
}
html body.apple-archive header.sub>.wrap>
:is(.label,.presence-kicker,h1,h2,p,.lead,.meta){
  margin-left:0!important;
  margin-right:auto!important;
}

/* Curators: disclosure grids use the full editorial shell on desktop instead of
   inheriting a historical narrow/two-column measure that left half the viewport empty. */
html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-periods>.wrap{
  width:min(100%,var(--dc-shell))!important;
  max-width:var(--dc-shell)!important;
  margin-inline:auto!important;
  padding-inline:var(--dc-gutter)!important;
}
html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-grid-disclosure{
  width:100%!important;
  max-width:none!important;
  margin-inline:0!important;
}
html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-grid-disclosure>.curatorial-periods__grid{
  width:100%!important;
  max-width:none!important;
  margin-inline:0!important;
  gap:16px!important;
}
html body.apple-archive[data-archive-page="curators"] main#main-content #presence-anatomy .curatorial-periods__grid{
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
}
html body.apple-archive[data-archive-page="curators"] main#main-content #curatorial-periods .curatorial-periods__grid{
  grid-template-columns:repeat(6,minmax(0,1fr))!important;
}
html body.apple-archive[data-archive-page="curators"] main#main-content #curatorial-periods .curatorial-period:nth-child(-n+3){grid-column:span 2!important}
html body.apple-archive[data-archive-page="curators"] main#main-content #curatorial-periods .curatorial-period:nth-child(n+4){grid-column:span 3!important}
html body.apple-archive[data-archive-page="curators"] main#main-content #creative-method .curatorial-periods__grid{
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
}

/* Reference layer: heading, explanatory copy and source inventory share one left
   optical axis while preserving a comfortable reading measure. */
html body.apple-archive[data-archive-page="curators"] main#main-content .presence-context>.wrap.narrow{
  width:min(100%,var(--dc-shell))!important;
  max-width:var(--dc-shell)!important;
  margin-inline:auto!important;
  padding-inline:var(--dc-gutter)!important;
}
html body.apple-archive[data-archive-page="curators"] main#main-content .presence-context :is(.presence-kicker,h2,.presence-copy,.archive-source-hub){
  margin-left:0!important;
  margin-right:auto!important;
}
html body.apple-archive[data-archive-page="curators"] main#main-content .presence-context .presence-copy{max-width:var(--dc-reading)!important}
html body.apple-archive[data-archive-page="curators"] main#main-content .presence-context .archive-source-hub{max-width:var(--dc-reading-wide)!important}

/* The historical desktop footer authority used a five-class specificity hack and
   forced the expanded social disclosure back into two columns. This final rule is
   intentionally more specific and restores the approved single optical axis. */
@media(min-width:1025px){
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive footer .footer-social-disclosure[open]{
    display:grid!important;
    grid-template-columns:minmax(0,1fr)!important;
    justify-items:center!important;
    align-items:start!important;
    row-gap:.55rem!important;
    column-gap:0!important;
    width:100%!important;
    text-align:center!important;
  }
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive footer .footer-social-disclosure[open]>summary{
    grid-column:1/-1!important;
    width:100%!important;
    max-width:none!important;
    margin:0!important;
    justify-content:center!important;
    justify-self:stretch!important;
    text-align:center!important;
  }
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive footer .footer-social-disclosure[open] .footer-social-links{
    grid-column:1/-1!important;
    display:flex!important;
    width:max-content!important;
    max-width:100%!important;
    margin-inline:auto!important;
    padding:0!important;
    justify-self:center!important;
    justify-content:center!important;
    align-items:center!important;
    flex-wrap:wrap!important;
    white-space:normal!important;
    text-align:center!important;
    position:static!important;
    inset:auto!important;
    transform:none!important;
    float:none!important;
  }
}

@media(max-width:900px){
  html body.apple-archive[data-archive-page="curators"] main#main-content #presence-anatomy .curatorial-periods__grid,
  html body.apple-archive[data-archive-page="curators"] main#main-content #curatorial-periods .curatorial-periods__grid,
  html body.apple-archive[data-archive-page="curators"] main#main-content #creative-method .curatorial-periods__grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  html body.apple-archive[data-archive-page="curators"] main#main-content #curatorial-periods .curatorial-period:nth-child(n){grid-column:auto!important}
}
@media(max-width:620px){
  html body.apple-archive[data-archive-page="curators"] main#main-content #presence-anatomy .curatorial-periods__grid,
  html body.apple-archive[data-archive-page="curators"] main#main-content #curatorial-periods .curatorial-periods__grid,
  html body.apple-archive[data-archive-page="curators"] main#main-content #creative-method .curatorial-periods__grid{grid-template-columns:1fr!important}
}
