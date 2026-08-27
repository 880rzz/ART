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
   The runtime classifies all localized homepages as data-archive-page="index".
   Target that computed state explicitly so the final authority remains active
   after responsive-header-system.js has finished page classification. */
html body.apple-archive[data-archive-page="index"] main#main-content .card,
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
html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-section > :last-child{
  margin-bottom:0!important;
}

/* The visual-perfection layer intentionally carries repeated-ID selectors to
   defeat legacy archive specificity. Mirror that specificity here because this
   fragment is the final cascade owner. Explicit physical padding also prevents
   legacy logical-axis declarations from zeroing three sides of homepage cards. */
html body.apple-archive[data-archive-page="index"] main#main-content#main-content#main-content .card,
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
html body.apple-archive[data-archive-page="curators"] main#main-content#main-content#main-content .curatorial-section > :last-child{
  margin-bottom:0!important;
}

@media(max-width:900px){
  html body.apple-archive[data-archive-page="index"] main#main-content#main-content#main-content .card,
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
  html body.apple-archive[data-archive-page="index"] main#main-content#main-content#main-content .card,
  html body.apple-archive:not([data-archive-page]) main#main-content#main-content#main-content .card,
  html body.apple-archive[data-archive-page="home"] main#main-content#main-content#main-content .card{
    padding-top:20px!important;
    padding-right:20px!important;
    padding-bottom:20px!important;
    padding-left:20px!important;
  }
}

/* Final computed typography owner. A historical archive rule with repeated-ID
   specificity was still winning after the geometry closure and resolving long
   prose to 1.74 leading. This final appended layer deliberately mirrors that
   specificity so the programmed 1.68 editorial rhythm is what production paints
   in every language and viewport. */
html body.apple-archive main#main-content#main-content#main-content :is(p,li){
  line-height:1.68!important;
}
html body.apple-archive main#main-content#main-content#main-content :is(p.hero-sub,p.presence-copy){
  line-height:1.68!important;
}
html body.apple-archive[data-archive-page="index"] main#main-content#main-content#main-content p.meta{
  font-size:16px!important;
  line-height:1.6!important;
}

/* Press hero lead is classified as lead copy by the approved visual contract,
   whose upper bound is 1.68. Keep it slightly inside that boundary to avoid
   computed-pixel floating point rounding at 1024/1440 while preserving the
   same editorial rhythm across EN/HU/DE. */
html body.apple-archive.press-page main#main-content#main-content#main-content p.press-hero__lead{
  line-height:1.66!important;
}

/* Expanded-state compact-width closure. Screenshot authority intentionally keeps
   default Curators grids multi-column; only the opened disclosure state becomes
   a full reading stack. Repeated IDs make this final layer stronger than the
   historical per-section !important selectors without changing closed states. */
@media(min-width:769px) and (max-width:1100px){
  html body.apple-archive[data-archive-page="curators"] main#main-content#main-content#main-content :is(#presence-anatomy,#curatorial-periods,#creative-method) .curatorial-grid-disclosure[open] .curatorial-periods__grid{
    display:grid!important;
    grid-template-columns:minmax(0,1fr)!important;
    width:100%!important;
    max-width:none!important;
  }
  html body.apple-archive[data-archive-page="curators"] main#main-content#main-content#main-content details[open] :is(p,li){
    min-width:280px!important;
    width:100%!important;
    max-width:var(--dc-reading)!important;
  }
}

/* At tablet widths Press disclosures must stop using narrow record tracks when
   opened. This affects only expanded state and prevents 200–240px prose columns. */
@media(min-width:700px) and (max-width:900px){
  html body.apple-archive.press-page main#main-content#main-content#main-content details[open]{
    display:block!important;
    grid-template-columns:none!important;
    grid-template-rows:none!important;
    columns:auto!important;
    column-count:auto!important;
    width:100%!important;
    max-width:none!important;
  }
  html body.apple-archive.press-page main#main-content#main-content#main-content details[open]>:not(summary){
    box-sizing:border-box!important;
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
  }
  html body.apple-archive.press-page main#main-content#main-content#main-content details[open] :is(.press-grid,.press-records,.press-list,.facts,[class*="grid"],[class*="records"]){
    display:grid!important;
    grid-template-columns:minmax(0,1fr)!important;
    width:100%!important;
    max-width:none!important;
  }
  html body.apple-archive.press-page main#main-content#main-content#main-content details[open] :is(p.desc,p,li){
    min-width:280px!important;
    width:100%!important;
    max-width:var(--dc-reading)!important;
  }
}
