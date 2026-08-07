(() => {
  const body = document.body;
  if (!body || !body.classList.contains('apple-archive')) return;

  const language = (document.documentElement.lang || 'en').toLowerCase();
  const cleanPath = window.location.pathname.replace(/\/+$/, '');
  let page = cleanPath.split('/').pop() || 'index';
  page = page.replace(/\.html$/i, '');
  if (page === 'hu' || page === 'de-at' || page === '') page = 'index';

  const curatorialPages = new Set(['curators', 'press', 'community', 'writing']);
  const archivePages = new Set(['index', ...curatorialPages]);
  if (archivePages.has(page)) body.dataset.archivePage = page;

  const main = document.querySelector('main');

  /* One structural contract for Curators, Press, Community and Writing.
     Press historically placed a guide before its actual page header; the
     shared hero is now the first element in visual and reading order. */
  if (main && curatorialPages.has(page)) {
    const hero = main.querySelector(':scope > header') || main.querySelector('header');
    if (hero) {
      hero.classList.add('curatorial-hero');
      if (main.firstElementChild !== hero) main.prepend(hero);
    }

    [...main.children]
      .filter((element) => element.tagName === 'SECTION')
      .forEach((section, index) => {
        section.classList.add('curatorial-section');
        section.dataset.curatorialSurface = String((index % 3) + 1);
      });
  }

  /* Curatorial subpages must keep the visitor on the equivalent page when
     switching language. A copied Press header still pointed to Curators;
     normalising the three links at runtime prevents that class of regression
     on Press, Community, Writing and Curators in every language. */
  if (curatorialPages.has(page)) {
    const switcher = document.querySelector('.langs');
    if (switcher) {
      const filename = `${page}.html`;
      const routes = {
        en: `/${filename}`,
        de: `/de-at/${filename}`,
        hu: `/hu/${filename}`
      };
      const links = [...switcher.querySelectorAll('a')];
      links.forEach((link) => {
        const hreflang = String(link.getAttribute('hreflang') || link.getAttribute('lang') || '').toLowerCase();
        const key = hreflang.startsWith('de') ? 'de' : hreflang.startsWith('hu') ? 'hu' : 'en';
        link.href = routes[key];
        link.classList.toggle('on',
          (key === 'hu' && language.startsWith('hu')) ||
          (key === 'de' && language.startsWith('de')) ||
          (key === 'en' && !language.startsWith('hu') && !language.startsWith('de'))
        );
      });
    }
  }

  /* The introduction now speaks from the central thesis of the oeuvre rather
     than using a generic autobiographical label. Source HTML is migrated in
     the same release; this also protects visitors with a stale HTML shell. */
  if (page === 'index') {
    const aboutHeading = document.querySelector('#about h2');
    const presenceHeading = language.startsWith('hu')
      ? 'A jelenlét nyomában'
      : language.startsWith('de')
        ? 'Auf den Spuren der Präsenz'
        : 'In pursuit of presence';
    if (aboutHeading) aboutHeading.textContent = presenceHeading;
  }

  const systemStyle = document.createElement('style');
  systemStyle.dataset.archiveInterfaceSystem = '20260807-v27';
  systemStyle.textContent = `
    :root{
      --apple-space-1:.5rem;
      --apple-space-2:1rem;
      --apple-space-3:1.5rem;
      --apple-space-4:2rem;
      --apple-space-5:3rem;
      --apple-cell-pad:clamp(1.5rem,2.6vw,2.5rem);
      --apple-reading-measure:60ch;
      --curatorial-1:#0f0f0f;
      --curatorial-2:#171717;
      --curatorial-3:#211f1a;
      --curatorial-line:rgba(255,255,255,.13);
      --curatorial-soft:rgba(245,245,247,.7);
    }

    html body.apple-archive{
      font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display","Helvetica Neue",Arial,sans-serif!important;
      font-size:clamp(16px,.16vw + 15.4px,17.5px)!important;
      line-height:1.62!important;
      letter-spacing:-.011em!important;
      text-rendering:optimizeLegibility;
      -webkit-font-smoothing:antialiased;
      font-synthesis:none;
    }
    html body.apple-archive :is(h1,h2,h3,h4){
      font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif!important;
      text-wrap:balance;
    }
    html body.apple-archive h1{
      font-size:clamp(2.4rem,4.4vw,4.25rem)!important;
      line-height:1.04!important;
      letter-spacing:-.035em!important;
      font-weight:500!important;
    }
    html body.apple-archive h2{
      font-size:clamp(1.75rem,2.8vw,2.75rem)!important;
      line-height:1.1!important;
      letter-spacing:-.025em!important;
      font-weight:500!important;
    }
    html body.apple-archive h3{
      font-size:clamp(1.08rem,1.15vw,1.32rem)!important;
      line-height:1.26!important;
      letter-spacing:-.012em!important;
      font-weight:500!important;
    }
    html body.apple-archive :is(p,li){line-height:1.62!important}
    html body.apple-archive main p{max-width:var(--apple-reading-measure)!important}
    html body.apple-archive #about{scroll-margin-top:calc(var(--bn-header-height,72px) + 1.25rem)!important}

    @media (min-width:901px){
      html body.apple-archive main>section.presence-context--intro>.wrap,
      html body.apple-archive main>section.presence-context--intro>.wrap.narrow{
        text-align:left!important;
      }
      html body.apple-archive main>section.presence-context--intro .presence-kicker,
      html body.apple-archive main>section.presence-context--intro h2,
      html body.apple-archive main>section.presence-context--intro .presence-copy,
      html body.apple-archive main>section.presence-context--intro .presence-link{
        margin-left:0!important;
        margin-right:auto!important;
        text-align:left!important;
      }
      html body.apple-archive main>section.presence-context--intro h2{max-width:24ch!important}
      html body.apple-archive main>section.presence-context--intro .presence-copy{max-width:58ch!important}
    }

    html body.apple-archive .curatorial-hero{
      position:relative!important;
      isolation:isolate!important;
      display:flex!important;
      align-items:flex-end!important;
      min-height:clamp(410px,56svh,620px)!important;
      width:auto!important;
      max-width:none!important;
      margin:0!important;
      padding:clamp(9rem,15vh,12rem) 0 clamp(4.5rem,8vh,7rem)!important;
      background:transparent!important;
      border:0!important;
      overflow:visible!important;
    }
    html body.apple-archive .curatorial-hero::before{
      content:""!important;
      position:absolute!important;
      z-index:-1!important;
      inset:0 auto 0 50%!important;
      width:100vw!important;
      transform:translateX(-50%)!important;
      background:linear-gradient(135deg,#111 0%,#252525 62%,#1d1912 100%)!important;
      box-shadow:inset 0 1px rgba(255,255,255,.12),inset 0 -1px rgba(0,0,0,.48)!important;
      pointer-events:none!important;
    }
    html body.apple-archive .curatorial-hero>.wrap{
      width:min(calc(100% - clamp(2.5rem,10vw,10rem)),1180px)!important;
      max-width:1180px!important;
      margin:0 auto!important;
      padding:0!important;
      text-align:left!important;
    }
    html body.apple-archive .curatorial-hero h1{
      max-width:18ch!important;
      margin:.65rem 0 1.15rem!important;
      font-size:clamp(2.55rem,5vw,4.75rem)!important;
      line-height:1.04!important;
      letter-spacing:-.035em!important;
      text-align:left!important;
    }
    html body.apple-archive .curatorial-hero :is(.label,.eyebrow,.loc,.lead){
      max-width:60ch!important;
      margin-left:0!important;
      margin-right:auto!important;
      text-align:left!important;
    }
    html body.apple-archive .curatorial-hero :is(.loc,.lead){color:var(--curatorial-soft)!important}

    html body.apple-archive .curatorial-section{
      --curatorial-surface:var(--curatorial-1);
      position:relative!important;
      isolation:isolate!important;
      width:auto!important;
      min-width:0!important;
      margin:0 auto!important;
      padding-top:clamp(4.5rem,8vw,7.5rem)!important;
      padding-bottom:clamp(4.5rem,8vw,7.5rem)!important;
      background:transparent!important;
      border:0!important;
      box-shadow:none!important;
      text-align:left!important;
    }
    html body.apple-archive .curatorial-section[data-curatorial-surface="2"]{--curatorial-surface:var(--curatorial-2)}
    html body.apple-archive .curatorial-section[data-curatorial-surface="3"]{--curatorial-surface:var(--curatorial-3)}
    html body.apple-archive .curatorial-section::before{
      content:""!important;
      position:absolute!important;
      z-index:-1!important;
      inset:0 auto 0 50%!important;
      width:100vw!important;
      transform:translateX(-50%)!important;
      background:var(--curatorial-surface)!important;
      box-shadow:inset 0 1px var(--curatorial-line)!important;
      pointer-events:none!important;
    }
    html body.apple-archive .curatorial-section.wrap{
      width:min(calc(100% - clamp(2.5rem,10vw,10rem)),1180px)!important;
      max-width:1180px!important;
    }
    html body.apple-archive .curatorial-section:not(.wrap)>.wrap{
      width:min(calc(100% - clamp(2.5rem,10vw,10rem)),1180px)!important;
      max-width:1180px!important;
      margin-left:auto!important;
      margin-right:auto!important;
      padding-left:0!important;
      padding-right:0!important;
    }
    html body.apple-archive .curatorial-section :is(h2,.lead,.era-copy,.label,.eyebrow){
      margin-left:0!important;
      margin-right:auto!important;
      text-align:left!important;
    }
    html body.apple-archive .curatorial-section>.lead:first-child,
    html body.apple-archive .curatorial-section>.wrap>.lead:first-child{
      max-width:68ch!important;
      font-size:clamp(1.12rem,1.45vw,1.34rem)!important;
      line-height:1.55!important;
    }

    html body.apple-archive .curatorial-section .era-head{
      display:grid!important;
      grid-template-columns:minmax(15rem,.72fr) minmax(0,1.28fr)!important;
      gap:clamp(2rem,6vw,6rem)!important;
      align-items:start!important;
      margin-bottom:clamp(2.75rem,5vw,4.75rem)!important;
    }
    html body.apple-archive .curatorial-section .era-head :is(h2,.era-copy){margin-top:0!important}

    html body.apple-archive .curatorial-section :is(.grid,.press-type-grid,.source-grid){
      display:grid!important;
      grid-template-columns:repeat(2,minmax(0,1fr))!important;
      gap:0 clamp(2rem,5vw,5rem)!important;
      margin-top:clamp(2.5rem,5vw,4.5rem)!important;
      border:0!important;
      background:transparent!important;
    }
    html body.apple-archive .curatorial-section :is(.grid,.press-type-grid,.source-grid)>*{
      min-width:0!important;
      margin:0!important;
      padding:clamp(1.6rem,2.8vw,2.4rem) 0!important;
      border:0!important;
      border-top:1px solid var(--curatorial-line)!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
    }
    html body.apple-archive .curatorial-section :is(.grid,.press-type-grid,.source-grid)>*>:last-child{margin-bottom:0!important}
    html body.apple-archive .curatorial-section :is(.item,.press-type-grid>div,.source-grid>a) a,
    html body.apple-archive .curatorial-section .grid>.item>a{
      font-size:clamp(1.05rem,1.3vw,1.28rem)!important;
      line-height:1.3!important;
      font-weight:500!important;
      text-decoration:none!important;
    }
    html body.apple-archive .curatorial-section :is(.desc,.note,small){color:var(--curatorial-soft)!important}

    html body.apple-archive .curatorial-section .timeline{
      margin-top:clamp(2.75rem,5vw,4.5rem)!important;
      padding-left:0!important;
      border-left:0!important;
      border-top:1px solid var(--curatorial-line)!important;
    }
    html body.apple-archive .curatorial-section .timeline>.t-item{
      display:grid!important;
      grid-template-columns:minmax(8rem,11rem) minmax(0,1fr)!important;
      column-gap:clamp(2rem,5vw,5rem)!important;
      padding:clamp(2rem,3vw,3rem) 0!important;
      border-bottom:1px solid var(--curatorial-line)!important;
    }
    html body.apple-archive .curatorial-section .timeline>.t-item::before{content:none!important}
    html body.apple-archive .curatorial-section .timeline>.t-item>.yr{
      grid-column:1!important;
      grid-row:1 / span 20!important;
      color:var(--mus-gold,#B79C44)!important;
    }
    html body.apple-archive .curatorial-section .timeline>.t-item>:not(.yr){grid-column:2!important}

    html body.apple-archive .curatorial-section :is(.note,.chapter-nav){
      margin:clamp(2rem,4vw,3.5rem) 0!important;
      padding:clamp(1.5rem,2.8vw,2.4rem)!important;
      border:1px solid var(--curatorial-line)!important;
      border-radius:0!important;
      background:rgba(255,255,255,.025)!important;
      box-shadow:none!important;
    }
    html body.apple-archive .curatorial-section .chapter-nav{
      display:flex!important;
      flex-wrap:wrap!important;
      gap:.75rem 1.5rem!important;
    }

    html body.apple-archive[data-archive-page="index"] #journey{
      --banhalmi-section-surface:linear-gradient(135deg,#171717 0%,#242424 100%)!important;
    }
    html body.apple-archive[data-archive-page="index"] #exhibitions{
      --banhalmi-section-surface:linear-gradient(225deg,#171717 0%,#292929 100%)!important;
    }
    html body.apple-archive[data-archive-page="index"] :is(#journey,#exhibitions)>.wrap>.intro{
      max-width:72ch!important;
      margin-left:0!important;
      margin-right:auto!important;
      text-align:left!important;
    }
    html body.apple-archive[data-archive-page="index"] :is(#journey,#exhibitions)>.wrap>.intro :is(h2,.lead,.label){
      margin-left:0!important;
      margin-right:auto!important;
      text-align:left!important;
    }
    html body.apple-archive[data-archive-page="index"] :is(#journey,#exhibitions) .timeline[data-chronology]{
      border-top-color:var(--mus-hair-strong)!important;
    }
    html body.apple-archive[data-archive-page="index"] :is(#journey,#exhibitions) .timeline[data-chronology]>.t-item{
      grid-template-columns:minmax(9rem,12rem) minmax(0,1fr)!important;
      column-gap:clamp(2.25rem,5vw,5.5rem)!important;
      padding-block:clamp(2rem,3.4vw,3rem)!important;
    }
    html body.apple-archive[data-archive-page="index"] :is(#journey,#exhibitions) .timeline[data-chronology]>.t-item>h3{max-width:38ch!important}

    html body.apple-archive :is(
      .cards>.card,
      .grid>.item,
      .press-type-grid>div,
      .record-links>*,
      .project-evidence-grid>*,
      .oeuvre-phase-grid>*,
      .curatorial-periods__grid>*,
      .archive-source-hub>a,
      .evidence-item
    ){
      min-width:0!important;
    }
    html body.apple-archive[data-archive-page="index"] :is(
      .cards>.card,
      .grid>.item,
      .press-type-grid>div,
      .record-links>*,
      .project-evidence-grid>*,
      .oeuvre-phase-grid>*,
      .curatorial-periods__grid>*,
      .archive-source-hub>a,
      .evidence-item
    ){
      padding:var(--apple-cell-pad)!important;
    }
    html body.apple-archive :is(
      .cards>.card,
      .grid>.item,
      .press-type-grid>div,
      .record-links>*,
      .project-evidence-grid>*,
      .oeuvre-phase-grid>*,
      .curatorial-periods__grid>*,
      .archive-source-hub>a,
      .evidence-item
    )>:last-child{margin-bottom:0!important}

    html body.apple-archive[data-archive-page="index"] .professional-side{
      padding:0!important;
      border:0!important;
      background:transparent!important;
      box-shadow:none!important;
      max-width:64ch!important;
    }
    html body.apple-archive[data-archive-page="index"] .professional-side__cta{
      display:block!important;
      width:auto!important;
      min-height:0!important;
      margin-top:clamp(1.5rem,2.5vw,2rem)!important;
      padding:0!important;
      border:0!important;
      background:transparent!important;
      box-shadow:none!important;
    }
    html body.apple-archive[data-archive-page="index"] .professional-side__cta .btn{
      display:inline-flex!important;
      width:auto!important;
      margin:0!important;
    }

    html body.apple-archive footer .meta{
      max-width:none!important;
      white-space:nowrap!important;
      font-size:clamp(.68rem,.12vw + .66rem,.75rem)!important;
      line-height:1.65!important;
      letter-spacing:.025em!important;
    }
    html body.apple-archive main>:last-child{border-bottom:0!important}
    html body.apple-archive main>:last-child::before{box-shadow:inset 0 1px var(--mus-section-edge)!important}
    html body.apple-archive main+footer{border-top:1px solid var(--mus-hair)!important}

    @media(max-width:900px){
      html body.apple-archive .curatorial-hero{
        min-height:auto!important;
        padding:8.25rem 0 4.5rem!important;
      }
      html body.apple-archive .curatorial-hero>.wrap,
      html body.apple-archive .curatorial-section.wrap,
      html body.apple-archive .curatorial-section:not(.wrap)>.wrap{
        width:min(calc(100% - 2rem),1180px)!important;
      }
      html body.apple-archive .curatorial-section .era-head{
        grid-template-columns:1fr!important;
        gap:1.25rem!important;
      }
      html body.apple-archive .curatorial-section :is(.grid,.press-type-grid,.source-grid){
        grid-template-columns:1fr!important;
      }
    }
    @media(max-width:700px){
      html body.apple-archive .curatorial-section .timeline>.t-item,
      html body.apple-archive[data-archive-page="index"] :is(#journey,#exhibitions) .timeline[data-chronology]>.t-item{
        grid-template-columns:1fr!important;
        row-gap:.65rem!important;
      }
      html body.apple-archive .curatorial-section .timeline>.t-item>.yr,
      html body.apple-archive .curatorial-section .timeline>.t-item>:not(.yr){
        grid-column:1!important;
        grid-row:auto!important;
      }
      html body.apple-archive footer .meta{
        font-size:.68rem!important;
        letter-spacing:0!important;
      }
    }
  `;
  document.head.append(systemStyle);

  /* Cross-page fragments (for example Press -> /#about) are first resolved by
     the browser before the large archive gallery has fully settled. Re-align
     the target after layout and again after the load event so About, Gallery,
     Oeuvre, Exhibitions, Books and Contact land at their actual section on
     desktop and mobile instead of drifting into the image grid. */
  const alignFragmentTarget = (focusTarget = false) => {
    if (page !== 'index' || !window.location.hash) return false;
    let target;
    try {
      target = document.querySelector(window.location.hash);
    } catch {
      return false;
    }
    if (!target) return false;
    const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bn-header-height')) || 72;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 16);
    const previousBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    document.documentElement.scrollTop = top;
    document.body.scrollTop = top;
    document.documentElement.style.scrollBehavior = previousBehavior;
    if (focusTarget) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    return true;
  };

  const settleCurrentFragment = () => {
    if (page !== 'index' || !window.location.hash) return;
    requestAnimationFrame(() => requestAnimationFrame(() => alignFragmentTarget(false)));
    [120, 360, 800, 1500].forEach((delay) => window.setTimeout(() => alignFragmentTarget(false), delay));
  };

  settleCurrentFragment();
  window.addEventListener('load', settleCurrentFragment, { once: true });
  window.addEventListener('hashchange', settleCurrentFragment);

  if (page === 'index') {
    document.querySelectorAll('main a[href="tel:+4367761655592"]').forEach((phoneLink) => {
      const row = phoneLink.closest('p');
      if (!row || row.querySelector('a[href^="https://wa.me/"]')) return;
      const textNode = [...row.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent.includes('WhatsApp')
      );
      if (!textNode) return;
      const marker = 'WhatsApp';
      const markerIndex = textNode.textContent.indexOf(marker);
      const whatsappLink = document.createElement('a');
      whatsappLink.href = 'https://wa.me/4367761655592';
      whatsappLink.target = '_blank';
      whatsappLink.rel = 'noopener noreferrer';
      whatsappLink.textContent = marker;
      whatsappLink.setAttribute('aria-label', 'WhatsApp · +43 677 616 55592');
      textNode.replaceWith(
        document.createTextNode(textNode.textContent.slice(0, markerIndex)),
        whatsappLink,
        document.createTextNode(textNode.textContent.slice(markerIndex + marker.length))
      );
    });
  }

  const buttons = [...document.querySelectorAll('.burger')];
  const menu = document.querySelector('#menu, body > .menu');
  const menuLabels = language.startsWith('hu')
    ? { open: 'Menü megnyitása', close: 'Menü bezárása' }
    : language.startsWith('de')
      ? { open: 'Menü öffnen', close: 'Menü schließen' }
      : { open: 'Open menu', close: 'Close menu' };

  buttons.forEach((button) => {
    if (!button.querySelector('span')) {
      button.textContent = '';
      for (let index = 0; index < 3; index += 1) button.append(document.createElement('span'));
    }
  });

  const iconOverride = document.createElement('style');
  iconOverride.dataset.responsiveHeaderIcon = 'true';
  iconOverride.textContent = 'body.apple-archive .burger::before,body.apple-archive .burger::after{content:none!important;box-shadow:none!important}';
  document.head.append(iconOverride);

  const syncMenu = () => {
    const open = body.classList.contains('menu-open');
    buttons.forEach((button) => {
      button.setAttribute('aria-expanded', String(open));
      if (!button.hasAttribute('aria-controls') && menu?.id) button.setAttribute('aria-controls', menu.id);
      button.setAttribute('aria-label', open ? menuLabels.close : menuLabels.open);
    });
    if (menu) menu.setAttribute('aria-hidden', String(!open));
  };

  const closeMenu = () => {
    body.classList.remove('menu-open');
    syncMenu();
  };

  /* Same-page fragment navigation is executed only after the fixed overlay
     releases the body's scroll lock. Cross-page fragments are stabilised by
     settleCurrentFragment() when the destination document loads. */
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link || page !== 'index') return;

    let destination;
    try {
      destination = new URL(link.href, window.location.href);
    } catch {
      return;
    }
    if (destination.origin !== window.location.origin || !destination.hash) return;
    if (destination.pathname.replace(/\/+$/, '') && destination.pathname.replace(/\/+$/, '') !== cleanPath) return;

    const target = document.querySelector(destination.hash);
    if (!target) return;
    event.preventDefault();
    closeMenu();
    target.setAttribute('tabindex', '-1');
    history.pushState(null, '', `${destination.pathname}${destination.search}${destination.hash}`);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      alignFragmentTarget(true);
    }));
    window.setTimeout(() => alignFragmentTarget(false), 180);
    window.setTimeout(() => alignFragmentTarget(false), 650);
  }, true);

  if (!buttons.length || !menu) return;

  buttons.forEach((button) => {
    button.addEventListener('click', () => requestAnimationFrame(syncMenu));
  });

  menu.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !body.classList.contains('menu-open')) return;
    closeMenu();
    buttons[0]?.focus();
  });

  window.addEventListener('resize', syncMenu, { passive: true });
  syncMenu();
})();