/* ART Visual Perfection Authority 2026-08-26
   Final computed presentation authority after Design Constitution and screenshot layers.
   Presentation only: no content, schema, metadata, routing, analytics, consent or crawler changes. */
:root{--vp-section-pad:72px;--vp-cell:28px;--vp-heading-gap:20px}
html body.apple-archive main#main-content h1{font-size:clamp(42px,5vw,74px)!important;line-height:1.02!important;letter-spacing:-.022em!important}
html body.apple-archive main#main-content h2{font-size:clamp(29px,3.2vw,48px)!important;line-height:1.08!important;letter-spacing:-.022em!important}
html body.apple-archive main#main-content h3{font-size:clamp(18px,1.8vw,26px)!important;line-height:1.16!important;letter-spacing:-.018em!important}
html body.apple-archive main#main-content :is(h1,h2,h3):has(+ :is(p,.lead,.meta,.press-hero__lead,.description,.section-description,.hero-description,.presence-copy)){margin-bottom:0!important}
html body.apple-archive main#main-content :is(h1,h2,h3)+:is(p,.lead,.meta,.press-hero__lead,.description,.section-description,.hero-description,.presence-copy){margin-top:var(--vp-heading-gap)!important}
html body.apple-archive.press-page main#main-content .press-hero :is(h1,h2,h3)+:is(p,.lead,.press-hero__lead){margin-top:20px!important}
html body.apple-archive main#main-content>section:not(.hero):not(.hero-section):not(.immersive):not(.statement):not([data-layout="immersive"]){padding-top:var(--vp-section-pad)!important;padding-bottom:var(--vp-section-pad)!important}
html body.apple-archive main#main-content :is(section.book-lead,section.life-journey,section#exhibitions,section.curatorial-section)>:first-child{margin-top:0!important}
html body.apple-archive main#main-content :is(section.book-lead,section.life-journey,section#exhibitions,section.curatorial-section)>:last-child{margin-bottom:0!important}
html body.apple-archive main#main-content :is(.card,.archive-card,.press-fact,.press-record,.curatorial-period,.t-item,.source-card,.writing-card,.cell,.panel,.orientation-card,[class$="__card"]){box-sizing:border-box!important;padding-top:var(--vp-cell)!important;padding-right:var(--vp-cell)!important;padding-bottom:var(--vp-cell)!important;padding-left:var(--vp-cell)!important}
html body.apple-archive[data-archive-page="curators"] main#main-content .curatorial-period{padding:28px!important}
@media(max-width:900px){:root{--vp-section-pad:64px;--vp-cell:24px}}
@media(max-width:620px){:root{--vp-section-pad:56px;--vp-cell:20px;--vp-heading-gap:16px}html body.apple-archive main#main-content h1{font-size:clamp(34px,10vw,50px)!important}html body.apple-archive main#main-content h2{font-size:clamp(27px,7.4vw,40px)!important}html body.apple-archive main#main-content h3{font-size:clamp(18px,5vw,24px)!important}html body.apple-archive main#main-content :is(.card,.archive-card,.press-fact,.press-record,.curatorial-period,.t-item,.source-card,.writing-card,.cell,.panel,.orientation-card,[class$="__card"]){padding:20px!important}}
