/* ART Screenshot Optical Authority 2026-08-26
   Presentation-only corrections derived from approved desktop screenshots.
   No content, metadata, schema, routes, analytics, consent or crawler behavior. */

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
