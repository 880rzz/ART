/* ART Expanded State Final Authority 2026-08-27
   Global closure for disclosure geometry found by exact-artifact QA.
   Presentation only: applies across every language and page template. */

/* Footer disclosures are a centered footer control on every page. Historical
   summary rules used text-align:left on mobile; this final layer owns the state. */
html body.apple-archive footer details,
html body.apple-archive footer details[open]{
  box-sizing:border-box!important;
  width:100%!important;
  max-width:100%!important;
  margin-left:auto!important;
  margin-right:auto!important;
  text-align:center!important;
}
html body.apple-archive footer details>summary,
html body.apple-archive footer details[open]>summary{
  box-sizing:border-box!important;
  display:flex!important;
  width:100%!important;
  max-width:100%!important;
  min-height:44px!important;
  margin:0 auto!important;
  padding-left:0!important;
  padding-right:0!important;
  align-items:center!important;
  justify-content:center!important;
  justify-self:stretch!important;
  text-align:center!important;
}
html body.apple-archive footer details>summary::marker,
html body.apple-archive footer details>summary::-webkit-details-marker{
  text-align:center!important;
}
html body.apple-archive footer details :is(p,div,.footer-social-links,.socials){
  margin-left:auto!important;
  margin-right:auto!important;
  text-align:center!important;
  justify-content:center!important;
}

/* Expanded editorial disclosures must remain real reading columns rather than
   narrow grid tracks. Apply by page role so EN/HU/DE inherit the same geometry. */
html body.apple-archive[data-archive-page="curators"] main#main-content details[open],
html body.apple-archive.press-page main#main-content details[open]{
  min-width:0!important;
  box-sizing:border-box!important;
}
html body.apple-archive[data-archive-page="curators"] main#main-content details[open] :is(p,li),
html body.apple-archive.press-page main#main-content details[open] :is(p,li){
  box-sizing:border-box!important;
  min-width:0!important;
  width:100%!important;
  max-width:var(--dc-reading)!important;
}

@media(min-width:700px){
  html body.apple-archive.press-page main#main-content details[open] :is(p.desc,p,li){
    min-width:280px!important;
    width:100%!important;
    max-width:var(--dc-reading)!important;
  }
}

@media(min-width:769px){
  html body.apple-archive[data-archive-page="curators"] main#main-content details[open]{
    display:block!important;
    grid-template-columns:none!important;
    grid-template-rows:none!important;
    columns:auto!important;
    column-count:auto!important;
    width:100%!important;
    max-width:none!important;
  }
  html body.apple-archive[data-archive-page="curators"] main#main-content details[open]>:not(summary){
    box-sizing:border-box!important;
    min-width:0!important;
    width:100%!important;
    max-width:none!important;
  }
  html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-grid-disclosure[open],
  html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-grid-disclosure[open] .curatorial-periods__grid,
  html body.apple-archive[data-archive-page="curators"] main#main-content .life-journey-disclosure[open],
  html body.apple-archive[data-archive-page="curators"] main#main-content .life-journey-disclosure[open] .life-journey__stages{
    box-sizing:border-box!important;
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
  }
  html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-grid-disclosure[open] .curatorial-periods__grid{
    display:grid!important;
    grid-template-columns:minmax(0,1fr)!important;
  }
  html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-grid-disclosure[open] .curatorial-period,
  html body.apple-archive[data-archive-page="curators"] main#main-content .life-journey-disclosure[open] .life-stage,
  html body.apple-archive[data-archive-page="curators"] main#main-content .life-journey-disclosure[open] .life-stage__head,
  html body.apple-archive[data-archive-page="curators"] main#main-content .life-journey-disclosure[open] .life-stage__records{
    box-sizing:border-box!important;
    min-width:0!important;
    width:100%!important;
    max-width:none!important;
  }
  html body.apple-archive[data-archive-page="curators"] main#main-content .life-journey-disclosure[open] .life-stage{
    display:block!important;
    grid-template-columns:none!important;
    column-gap:0!important;
  }
  html body.apple-archive[data-archive-page="curators"] main#main-content details[open] :is(p,li){
    min-width:280px!important;
    width:100%!important;
    max-width:var(--dc-reading)!important;
  }
}

/* Exact-artifact first-principles closure.
   Homepage narrative cards and Community timeline cells are real painted cells,
   so they receive balanced four-side insets at every viewport instead of the
   historical top-only / axis-skewed values. */
html body.apple-archive[data-archive-page="home"] main#main-content .card,
html body.apple-archive:not([data-archive-page]) main#main-content .card{
  box-sizing:border-box!important;
  padding:30px!important;
}
html body.apple-archive[data-archive-page="community"] main#main-content .t-item{
  box-sizing:border-box!important;
  padding:20px!important;
}
html body.apple-archive[data-archive-page="community"] main#main-content h2 + :is(p,.lead){
  margin-top:16px!important;
}
html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-section{
  padding-bottom:88px!important;
}

/* The visual-perfection layer intentionally carries repeated-ID selectors to
   defeat legacy archive specificity. Mirror that specificity here because this
   fragment is the final cascade owner. Explicit physical padding also prevents
   legacy logical-axis declarations from zeroing three sides of homepage cards. */
html body.apple-archive:not([data-archive-page]) main#main-content#main-content#main-content .card,
html body.apple-archive[data-archive-page="home"] main#main-content#main-content#main-content .card{
  box-sizing:border-box!important;
  padding-top:30px!important;
  padding-right:30px!important;
  padding-bottom:30px!important;
  padding-left:30px!important;
}
html body.apple-archive[data-archive-page="community"] main#main-content#main-content#main-content h2{
  margin-bottom:0!important;
}
html body.apple-archive[data-archive-page="community"] main#main-content#main-content#main-content h2 + :is(p,.lead){
  margin-top:20px!important;
}
html body.apple-archive[data-archive-page="curators"] main#main-content#main-content#main-content .curatorial-section{
  padding-bottom:88px!important;
}

@media(max-width:900px){
  html body.apple-archive:not([data-archive-page]) main#main-content#main-content#main-content .card,
  html body.apple-archive[data-archive-page="home"] main#main-content#main-content#main-content .card{
    padding-top:24px!important;
    padding-right:24px!important;
    padding-bottom:24px!important;
    padding-left:24px!important;
  }
}

@media(max-width:620px){
  html body.apple-archive footer details,
  html body.apple-archive footer details[open],
  html body.apple-archive footer details>summary,
  html body.apple-archive footer details[open]>summary{
    width:100%!important;
    max-width:100%!important;
    text-align:center!important;
    justify-content:center!important;
  }
  html body.apple-archive[data-archive-page="community"] main#main-content .t-item{
    padding:18px!important;
  }
  html body.apple-archive[data-archive-page="community"] main#main-content#main-content#main-content h2 + :is(p,.lead){
    margin-top:16px!important;
  }
  html body.apple-archive:not([data-archive-page]) main#main-content#main-content#main-content .card,
  html body.apple-archive[data-archive-page="home"] main#main-content#main-content#main-content .card{
    padding-top:20px!important;
    padding-right:20px!important;
    padding-bottom:20px!important;
    padding-left:20px!important;
  }
}
