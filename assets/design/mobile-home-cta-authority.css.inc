/* ART Mobile Home CTA Authority 2026-08-26
   Shared mobile homepage, link and footer presentation contract for EN/HU/DE.
   No metadata, schema, routing, analytics, consent or crawler changes. */

/* One link language across ART: links are identified by colour/weight and hover/focus,
   never by permanent underlines. Buttons retain their bordered CTA treatment. */
html body.apple-archive a:not(.btn){
  text-decoration:none!important;
  text-underline-offset:0!important;
  text-decoration-thickness:0!important;
}
html body.apple-archive a:not(.btn):hover{opacity:.78}
html body.apple-archive a:focus-visible,
html body.apple-archive button:focus-visible,
html body.apple-archive summary:focus-visible{
  outline:2px solid var(--c-gold)!important;
  outline-offset:4px!important;
  border-radius:4px;
}
html body.apple-archive .btn{text-decoration:none!important}

@media(max-width:620px){
  /* Move the complete homepage hero copy + CTA block down by exactly one
     mobile CTA row. Shared CSS means EN/HU/DE keep identical geometry. */
  html body.apple-archive header.hero>.wrap,
  html body.apple-archive main header.hero>.wrap,
  html body.apple-archive main#main header.hero>.wrap,
  html body.apple-archive main#main-content header.hero>.wrap{
    transform:translateY(68px)!important;
  }

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

  /* Coloured editorial cells are viewport-wide on mobile; text keeps a safe inset
     instead of touching the panel edge. */
  html body.apple-archive.apple-archive main#main-content>section.wrap:is(.tone-b,.tone-c){
    box-sizing:border-box!important;
    width:100vw!important;
    max-width:none!important;
    margin-left:calc(50% - 50vw)!important;
    margin-right:calc(50% - 50vw)!important;
    padding-left:24px!important;
    padding-right:24px!important;
    border-left:0!important;
    border-right:0!important;
  }

  /* Footer legal links stay on one centred line when they fit and wrap as a unit
     when they do not. Thin separators replace stacked rows. */
  html body.apple-archive footer .fineprint{
    display:flex!important;
    flex-wrap:wrap!important;
    align-items:center!important;
    justify-content:center!important;
    gap:8px 0!important;
    width:100%!important;
    max-width:none!important;
    margin-inline:auto!important;
    padding-inline:20px!important;
    text-align:center!important;
  }
  html body.apple-archive footer .fineprint>:is(a,button){
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    margin:0!important;
    padding:0 12px!important;
    min-height:32px!important;
    white-space:nowrap!important;
    text-decoration:none!important;
    background:none!important;
    border:0!important;
    color:inherit!important;
    font:inherit!important;
  }
  html body.apple-archive footer .fineprint>:is(a,button)+:is(a,button){
    border-left:1px solid rgba(255,255,255,.16)!important;
  }

  /* The three-site ecosystem is one centred horizontal group on mobile with
     restrained separators; no item may drift left or occupy a private row. */
  html body.apple-archive footer .banhalmi-ecosystem{
    display:flex!important;
    flex-wrap:wrap!important;
    align-items:center!important;
    justify-content:center!important;
    gap:0!important;
    width:100%!important;
    max-width:none!important;
    margin-inline:auto!important;
    padding-inline:20px!important;
    text-align:center!important;
  }
  html body.apple-archive footer .banhalmi-ecosystem>:is(a,span){
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    width:auto!important;
    margin:0!important;
    padding:6px 14px!important;
    text-align:center!important;
    white-space:nowrap!important;
    text-decoration:none!important;
  }
  html body.apple-archive footer .banhalmi-ecosystem>:is(a,span)+:is(a,span){
    border-left:1px solid rgba(255,255,255,.16)!important;
  }

  html body.apple-archive footer .footer-social-disclosure,
  html body.apple-archive footer .footer-social-disclosure>summary,
  html body.apple-archive footer .footer-social-links{
    width:100%!important;
    max-width:none!important;
    margin-inline:auto!important;
    text-align:center!important;
    justify-content:center!important;
  }
}
