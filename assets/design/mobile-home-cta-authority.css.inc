/* ART Mobile Home CTA Authority 2026-08-26
   Mobile homepage CTA geometry only.
   Shared presentation contract for EN/HU/DE; no content, metadata, schema, routing, analytics, consent or crawler changes. */

@media(max-width:620px){
  html body.apple-archive header.hero .hero-cta,
  html body.apple-archive main header.hero .hero-cta,
  html body.apple-archive main#main header.hero .hero-cta,
  html body.apple-archive main#main-content header.hero .hero-cta{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    gap:12px!important;
    width:100%!important;
    max-width:none!important;
    align-items:stretch!important;
  }

  html body.apple-archive header.hero .hero-cta>:is(a,button),
  html body.apple-archive main header.hero .hero-cta>:is(a,button),
  html body.apple-archive main#main header.hero .hero-cta>:is(a,button),
  html body.apple-archive main#main-content header.hero .hero-cta>:is(a,button){
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    margin:0!important;
    min-height:56px!important;
    padding-inline:14px!important;
  }
}
