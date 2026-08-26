/* ART Visual Perfection Authority 2026-08-26
   Final computed presentation authority after Design Constitution and screenshot layers.
   Presentation only: no content, schema, metadata, routing, analytics, consent or crawler changes. */
:root{--vp-section-pad:72px;--vp-cell:28px;--vp-heading-gap:20px;--vp-action-gap:14px;--vp-divider:rgba(255,255,255,.12)}
html body.apple-archive main#main-content h1{font-size:clamp(42px,5vw,73.5px)!important;line-height:1.02!important;letter-spacing:-.022em!important}
html body.apple-archive main#main-content h2{font-size:clamp(31px,3.2vw,48px)!important;line-height:1.08!important;letter-spacing:-.022em!important}
html body.apple-archive main#main-content h3{font-size:clamp(18px,1.8vw,26px)!important;line-height:1.16!important;letter-spacing:-.018em!important}
html body.apple-archive main#main-content :is(h1,h2,h3):has(+ :is(p,.lead,.meta,.press-hero__lead,.description,.section-description,.hero-description,.presence-copy)){margin-bottom:0!important}
html body.apple-archive main#main-content :is(h1,h2,h3)+:is(p,.lead,.meta,.press-hero__lead,.description,.section-description,.hero-description,.presence-copy){margin-top:var(--vp-heading-gap)!important}
html body.apple-archive.press-page main#main-content .press-hero :is(h1,h2,h3)+:is(p,.lead,.press-hero__lead){margin-top:20px!important}
html body.apple-archive main#main-content>section:not(.hero):not(.hero-section):not(.immersive):not(.statement):not([data-layout="immersive"]){padding-top:var(--vp-section-pad)!important;padding-bottom:var(--vp-section-pad)!important}
html body.apple-archive main#main-content :is(section.book-lead,section.life-journey,section#exhibitions,section.curatorial-section)>:first-child{margin-top:0!important}
html body.apple-archive main#main-content :is(section.book-lead,section.life-journey,section#exhibitions,section.curatorial-section)>:last-child{margin-bottom:0!important}
html body.apple-archive main#main-content :is(.card,.archive-card,.press-fact,.press-record,.curatorial-period,.t-item,.source-card,.writing-card,.cell,.panel,.orientation-card,[class$="__card"]){box-sizing:border-box!important;padding-top:var(--vp-cell)!important;padding-right:var(--vp-cell)!important;padding-bottom:var(--vp-cell)!important;padding-left:var(--vp-cell)!important}
html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-period{padding:28px!important}

/* Editorial axis contract: nested wrappers may not create a second left edge. */
html body.apple-archive main#main-content>section:not(.statement):not(.center):not(.centered):not([data-align="center"]):not([data-layout="immersive"]) :is(.section-head,.section-intro,.section-copy,.content-copy,.presence-context,.presence-copy,.archive-source-hub,.book-lead,.life-journey,.press-section__intro,.curatorial-periods__intro) :is(.label,.presence-kicker,.period-no,h1,h2,h3,h4,p,.lead,.meta,blockquote,.note,ul,ol){margin-left:0!important;margin-right:auto!important;text-align:left!important}
html body.apple-archive[data-archive-page="curators"] main#main-content :is(.presence-context,.curatorial-periods__intro,.section-intro,.section-head)>:is(.label,.presence-kicker,h1,h2,h3,h4,p,.lead,.meta,blockquote){margin-left:0!important;margin-right:auto!important;text-align:left!important}

/* Action groups belong to the same editorial axis and always have real spacing. */
html body.apple-archive main#main-content>section:not(.statement):not(.center):not(.centered):not([data-align="center"]) :is(.actions,.action-row,.cta-row,.button-row,.link-row,.orientation-actions,.archive-actions,.section-actions,.source-actions){display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:flex-start!important;gap:var(--vp-action-gap)!important;margin-left:0!important;margin-right:auto!important;text-align:left!important}
html body.apple-archive main#main-content :is(p,.lead,.meta,.note)>a+a{margin-left:var(--vp-action-gap)!important}

/* Links are identified by weight/colour/interaction, never by permanent underline. */
html body.apple-archive main#main-content a,html body.apple-archive footer a{text-decoration:none!important;text-decoration-line:none!important}
html body.apple-archive main#main-content a:not(.btn):not([class*="button"]),html body.apple-archive footer a:not(.btn):not([class*="button"]){font-weight:600}
html body.apple-archive main#main-content a:hover,html body.apple-archive main#main-content a:focus-visible,html body.apple-archive footer a:hover,html body.apple-archive footer a:focus-visible{opacity:1!important;text-decoration:none!important}

/* Divider density contract: one boundary owns one line; nested rows do not double it. */
html body.apple-archive main#main-content :is(.press-grid,.source-grid,.article-list,.writing-list,.timeline,.facts)>*{border-top:1px solid var(--vp-divider)!important;border-bottom:0!important}
html body.apple-archive main#main-content :is(.press-grid,.source-grid,.article-list,.writing-list,.timeline,.facts)>*:last-child{border-bottom:1px solid var(--vp-divider)!important}
html body.apple-archive main#main-content :is(.press-grid,.source-grid,.article-list,.writing-list,.timeline,.facts)>:is(.card,.press-card,.source-card,.writing-card,.press-record,.press-fact,.t-item,[class$="__card"]){border-left:0!important;border-right:0!important;box-shadow:none!important}
html body.apple-archive main#main-content :is(.press-grid,.source-grid,.article-list,.writing-list,.timeline,.facts)>* :is(.card,.press-card,.source-card,.writing-card,.press-record,.press-fact,.t-item){border-top:0!important;border-bottom:0!important}

/* Computed-layout closure: historical archive selectors were still winning on
   the final render. This layer owns the physical spacing measured by the gate. */
html body.apple-archive.apple-archive.apple-archive.apple-archive main#main-content :is(.t-item,.press-fact,.press-record,.archive-card.orientation-card,.curatorial-period,.source-card,.writing-card,.card,.cell,.panel){box-sizing:border-box!important;padding:28px!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive.press-page main#main-content .press-hero :is(h1,h2,h3)+:is(p,.lead,.press-hero__lead){margin-top:20px!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="community"] main#main-content :is(h1,h2,h3)+p{margin-top:20px!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive main#main-content :is(section.book-lead,section.life-journey,section#exhibitions)>:first-child{margin-top:0!important;padding-top:0!important}

@media(max-width:900px){
  :root{--vp-section-pad:64px;--vp-cell:24px}
  html body.apple-archive main#main-content h2{font-size:clamp(31px,4vw,48px)!important}
  html body.apple-archive.apple-archive.apple-archive.apple-archive main#main-content :is(.t-item,.press-fact,.press-record,.archive-card.orientation-card,.curatorial-period,.source-card,.writing-card,.card,.cell,.panel){padding:24px!important}
}
@media(max-width:620px){
  :root{--vp-section-pad:56px;--vp-cell:20px;--vp-heading-gap:16px;--vp-action-gap:12px}
  html body.apple-archive main#main-content h1{font-size:clamp(34px,10vw,50px)!important}
  html body.apple-archive main#main-content h2{font-size:clamp(29px,7.4vw,40px)!important}
  html body.apple-archive main#main-content h3{font-size:clamp(18px,5vw,24px)!important}
  html body.apple-archive main#main-content :is(.card,.archive-card,.press-fact,.press-record,.curatorial-period,.t-item,.source-card,.writing-card,.cell,.panel,.orientation-card,[class$="__card"]){padding:20px!important}
  html body.apple-archive.apple-archive.apple-archive.apple-archive main#main-content :is(.t-item,.press-fact,.press-record,.archive-card.orientation-card,.curatorial-period,.source-card,.writing-card,.card,.cell,.panel){padding:20px!important}
  html body.apple-archive main#main-content :is(.actions,.action-row,.cta-row,.button-row,.link-row,.orientation-actions,.archive-actions,.section-actions,.source-actions){gap:12px!important}
}

/* Absolute final computed authority. The screenshot layer intentionally uses
   high-specificity historical compatibility selectors; this last source fragment
   is the selected Design Constitution outcome and therefore must win the cascade. */
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content h1{font-size:clamp(42px,5vw,73.5px)!important;line-height:1.02!important;letter-spacing:-.022em!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content h2{font-size:clamp(31px,3.2vw,48px)!important;line-height:1.08!important;letter-spacing:-.022em!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content h3{font-size:clamp(18px,1.8vw,26px)!important;line-height:1.16!important;letter-spacing:-.018em!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content :is(h1,h2,h3):has(+ :is(p,.lead,.meta,.press-hero__lead,.description,.section-description,.hero-description,.presence-copy)){margin-bottom:0!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content :is(h1,h2,h3)+:is(p,.lead,.meta,.press-hero__lead,.description,.section-description,.hero-description,.presence-copy){margin-top:20px!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content>section:not(.hero):not(.hero-section):not(.immersive):not(.statement):not([data-layout="immersive"]){min-height:0!important;height:auto!important;padding-top:72px!important;padding-bottom:72px!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content :is(section.book-lead,section.life-journey,section#exhibitions,section.curatorial-section)>:first-child{margin-top:0!important;padding-top:0!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content :is(section.book-lead,section.life-journey,section#exhibitions,section.curatorial-section)>:last-child{margin-bottom:0!important;padding-bottom:0!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content :is(.t-item,.press-fact,.press-record,.facts>div,[class$="__card"],.card,.curatorial-period,.press-card,.source-card,.archive-card,.writing-card,.cell,.panel,.orientation-card){box-sizing:border-box!important;padding:28px!important}

@media(max-width:900px){
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content h2{font-size:clamp(31px,4vw,48px)!important}
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content>section:not(.hero):not(.hero-section):not(.immersive):not(.statement):not([data-layout="immersive"]){padding-top:64px!important;padding-bottom:64px!important}
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content :is(.t-item,.press-fact,.press-record,.facts>div,[class$="__card"],.card,.curatorial-period,.press-card,.source-card,.archive-card,.writing-card,.cell,.panel,.orientation-card){padding:24px!important}
}
@media(max-width:620px){
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content h1{font-size:clamp(34px,10vw,50px)!important}
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content h2{font-size:clamp(29px,7.4vw,40px)!important}
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content h3{font-size:clamp(18px,5vw,24px)!important}
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content :is(h1,h2,h3)+:is(p,.lead,.meta,.press-hero__lead,.description,.section-description,.hero-description,.presence-copy){margin-top:16px!important}
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content>section:not(.hero):not(.hero-section):not(.immersive):not(.statement):not([data-layout="immersive"]){padding-top:56px!important;padding-bottom:56px!important}
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main#main-content :is(.t-item,.press-fact,.press-record,.facts>div,[class$="__card"],.card,.curatorial-period,.press-card,.source-card,.archive-card,.writing-card,.cell,.panel,.orientation-card){padding:20px!important}
}

/* Last-resort cascade owner for legacy selectors that still survive in optimized pages.
   Repeating the same valid ID selector raises specificity without changing the match. */
html body.apple-archive main#main-content#main-content#main-content h1{font-size:clamp(42px,5vw,73px)!important}
html body.apple-archive main#main-content#main-content#main-content h2{font-size:clamp(31px,3.2vw,48px)!important}
html body.apple-archive main#main-content#main-content#main-content h3{font-size:clamp(18px,1.8vw,26px)!important}
html body.apple-archive main#main-content#main-content#main-content :is(h1,h2,h3)+:is(p,.lead,.meta,.press-hero__lead,.description,.section-description,.hero-description,.presence-copy){margin-top:20px!important}
html body.apple-archive main#main-content#main-content#main-content>section:not(.hero):not(.hero-section):not(.immersive):not(.statement):not([data-layout="immersive"]){min-height:0!important;height:auto!important;padding-top:72px!important;padding-bottom:72px!important}
html body.apple-archive main#main-content#main-content#main-content :is(.t-item,.press-fact,.press-record,.facts>div,[class$="__card"],.card,.curatorial-period,.press-card,.source-card,.archive-card,.writing-card,.cell,.panel,.orientation-card){box-sizing:border-box!important;padding:28px!important}
html body.apple-archive main#main-content#main-content#main-content :is(section.book-lead,section.life-journey,section#exhibitions,section.curatorial-section)>:first-child{margin-top:0!important;padding-top:0!important}
html body.apple-archive main#main-content#main-content#main-content :is(section.book-lead,section.life-journey,section#exhibitions,section.curatorial-section)>:last-child{margin-bottom:0!important;padding-bottom:0!important}
@media(max-width:900px){
  html body.apple-archive main#main-content#main-content#main-content h2{font-size:clamp(31px,4vw,48px)!important}
  html body.apple-archive main#main-content#main-content#main-content>section:not(.hero):not(.hero-section):not(.immersive):not(.statement):not([data-layout="immersive"]){padding-top:64px!important;padding-bottom:64px!important}
  html body.apple-archive main#main-content#main-content#main-content :is(.t-item,.press-fact,.press-record,.facts>div,[class$="__card"],.card,.curatorial-period,.press-card,.source-card,.archive-card,.writing-card,.cell,.panel,.orientation-card){padding:24px!important}
}
@media(max-width:620px){
  html body.apple-archive main#main-content#main-content#main-content h1{font-size:clamp(34px,10vw,50px)!important}
  html body.apple-archive main#main-content#main-content#main-content h2{font-size:clamp(29px,7.4vw,40px)!important}
  html body.apple-archive main#main-content#main-content#main-content h3{font-size:clamp(18px,5vw,24px)!important}
  html body.apple-archive main#main-content#main-content#main-content :is(h1,h2,h3)+:is(p,.lead,.meta,.press-hero__lead,.description,.section-description,.hero-description,.presence-copy){margin-top:16px!important}
  html body.apple-archive main#main-content#main-content#main-content>section:not(.hero):not(.hero-section):not(.immersive):not(.statement):not([data-layout="immersive"]){padding-top:56px!important;padding-bottom:56px!important}
  html body.apple-archive main#main-content#main-content#main-content :is(.t-item,.press-fact,.press-record,.facts>div,[class$="__card"],.card,.curatorial-period,.press-card,.source-card,.archive-card,.writing-card,.cell,.panel,.orientation-card){padding:20px!important}
}
