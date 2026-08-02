(() => {
  const body = document.body;
  if (!body || !body.classList.contains('apple-archive')) return;

  const cleanPath = window.location.pathname.replace(/\/+$/, '');
  let page = cleanPath.split('/').pop() || 'index';
  page = page.replace(/\.html$/i, '');
  if (page === 'hu' || page === 'de-at' || page === '') page = 'index';

  const curatorialPages = new Set(['index', 'curators', 'press', 'community', 'writing']);
  if (curatorialPages.has(page)) body.dataset.archivePage = page;

  /* The press guide used to precede its own page title. Move the real page
     header to the beginning of main so visual and reading order agree. */
  if (page === 'press') {
    const main = document.querySelector('main');
    const header = main?.querySelector(':scope > header');
    if (main && header && main.firstElementChild !== header) main.prepend(header);
  }

  /* One curatorial template system for the dossier, press, community and
     writing pages, plus the two long-form chapters on the homepage. It is
     deliberately injected last because the archive still carries several
     legacy inline layers with !important declarations. */
  const curatorialSystem = document.createElement('style');
  curatorialSystem.dataset.curatorialTemplateSystem = '20260802-v23';
  curatorialSystem.textContent = `
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
      html body.apple-archive main>section.presence-context--intro h2{
        max-width:24ch!important;
      }
      html body.apple-archive main>section.presence-context--intro .presence-copy{
        max-width:58ch!important;
      }
    }

    html body.apple-archive[data-archive-page="curators"] main>header,
    html body.apple-archive[data-archive-page="press"] main>header,
    html body.apple-archive[data-archive-page="community"] main>header,
    html body.apple-archive[data-archive-page="writing"] main>header{
      position:relative!important;
      isolation:isolate!important;
      display:flex!important;
      align-items:flex-end!important;
      min-height:clamp(410px,56svh,620px)!important;
      margin:0!important;
      padding:clamp(9rem,15vh,12rem) 0 clamp(4.5rem,8vh,7rem)!important;
      background:transparent!important;
      border:0!important;
      overflow:visible!important;
    }
    html body.apple-archive[data-archive-page="curators"] main>header::before,
    html body.apple-archive[data-archive-page="press"] main>header::before,
    html body.apple-archive[data-archive-page="community"] main>header::before,
    html body.apple-archive[data-archive-page="writing"] main>header::before{
      content:""!important;
      position:absolute!important;
      z-index:-1!important;
      inset:0 auto 0 50%!important;
      width:100vw!important;
      transform:translateX(-50%)!important;
      background:linear-gradient(135deg,#121212 0%,#242424 62%,#191711 100%)!important;
      box-shadow:inset 0 1px rgba(255,255,255,.12),inset 0 -1px rgba(0,0,0,.42)!important;
      pointer-events:none!important;
    }
    html body.apple-archive[data-archive-page="curators"] main>header>.wrap,
    html body.apple-archive[data-archive-page="press"] main>header>.wrap,
    html body.apple-archive[data-archive-page="community"] main>header>.wrap,
    html body.apple-archive[data-archive-page="writing"] main>header>.wrap{
      width:min(calc(100% - clamp(2.5rem,10vw,10rem)),1180px)!important;
      max-width:1180px!important;
      margin:0 auto!important;
      padding:0!important;
      text-align:left!important;
    }
    html body.apple-archive[data-archive-page="curators"] main>header h1,
    html body.apple-archive[data-archive-page="press"] main>header h1,
    html body.apple-archive[data-archive-page="community"] main>header h1,
    html body.apple-archive[data-archive-page="writing"] main>header h1{
      max-width:18ch!important;
      margin:.65rem 0 1.15rem!important;
      font-size:clamp(2.55rem,5vw,4.75rem)!important;
      line-height:1.04!important;
      letter-spacing:-.025em!important;
      text-align:left!important;
    }
    html body.apple-archive[data-archive-page="curators"] main>header :is(.loc,.lead),
    html body.apple-archive[data-archive-page="press"] main>header :is(.loc,.lead),
    html body.apple-archive[data-archive-page="community"] main>header :is(.loc,.lead),
    html body.apple-archive[data-archive-page="writing"] main>header :is(.loc,.lead){
      max-width:60ch!important;
      margin-left:0!important;
      margin-right:auto!important;
      color:var(--mus-soft)!important;
      text-align:left!important;
    }

    html body.apple-archive[data-archive-page="curators"] main>section>.wrap,
    html body.apple-archive[data-archive-page="press"] main>section>.wrap,
    html body.apple-archive[data-archive-page="community"] main>section>.wrap,
    html body.apple-archive[data-archive-page="writing"] main>section>.wrap,
    html body.apple-archive[data-archive-page="curators"] main>section.wrap,
    html body.apple-archive[data-archive-page="press"] main>section.wrap,
    html body.apple-archive[data-archive-page="community"] main>section.wrap,
    html body.apple-archive[data-archive-page="writing"] main>section.wrap{
      text-align:left!important;
    }
    html body.apple-archive[data-archive-page="curators"] main>section :is(h2,.lead,.era-copy),
    html body.apple-archive[data-archive-page="press"] main>section :is(h2,.lead,.era-copy),
    html body.apple-archive[data-archive-page="community"] main>section :is(h2,.lead,.era-copy),
    html body.apple-archive[data-archive-page="writing"] main>section :is(h2,.lead,.era-copy){
      margin-left:0!important;
      margin-right:auto!important;
      text-align:left!important;
    }
    html body.apple-archive[data-archive-page="press"] main>section.press-types,
    html body.apple-archive[data-archive-page="press"] main>section.intro,
    html body.apple-archive[data-archive-page="press"] main>section.thesis{
      --banhalmi-section-surface:var(--mus-raised)!important;
    }
    html body.apple-archive[data-archive-page="press"] .era-head{
      display:grid!important;
      grid-template-columns:minmax(15rem,.72fr) minmax(0,1.28fr)!important;
      gap:clamp(2rem,6vw,6rem)!important;
      align-items:start!important;
      margin-bottom:clamp(2.75rem,5vw,4.75rem)!important;
    }
    html body.apple-archive[data-archive-page="press"] .era-head :is(h2,.era-copy){
      margin-top:0!important;
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
    html body.apple-archive[data-archive-page="index"] :is(#journey,#exhibitions) .timeline[data-chronology]>.t-item>h3{
      max-width:38ch!important;
    }

    /* The last section already meets the footer. Its lower inset rule and the
       footer border previously produced two thin lines on some templates. */
    html body.apple-archive main>:last-child{
      border-bottom:0!important;
    }
    html body.apple-archive main>:last-child::before{
      box-shadow:inset 0 1px var(--mus-section-edge)!important;
    }
    html body.apple-archive main+footer{
      border-top:1px solid var(--mus-hair)!important;
    }

    @media(max-width:900px){
      html body.apple-archive[data-archive-page="curators"] main>header,
      html body.apple-archive[data-archive-page="press"] main>header,
      html body.apple-archive[data-archive-page="community"] main>header,
      html body.apple-archive[data-archive-page="writing"] main>header{
        min-height:auto!important;
        padding:8.25rem 0 4.5rem!important;
      }
      html body.apple-archive[data-archive-page="curators"] main>header>.wrap,
      html body.apple-archive[data-archive-page="press"] main>header>.wrap,
      html body.apple-archive[data-archive-page="community"] main>header>.wrap,
      html body.apple-archive[data-archive-page="writing"] main>header>.wrap{
        width:min(calc(100% - 2rem),1180px)!important;
      }
      html body.apple-archive[data-archive-page="press"] .era-head{
        grid-template-columns:1fr!important;
        gap:1.25rem!important;
      }
    }
    @media(max-width:700px){
      html body.apple-archive[data-archive-page="index"] :is(#journey,#exhibitions) .timeline[data-chronology]>.t-item{
        grid-template-columns:1fr!important;
        row-gap:.55rem!important;
      }
    }
  `;
  document.head.append(curatorialSystem);

  const buttons = [...document.querySelectorAll('.burger')];
  const menu = document.querySelector('#menu, body > .menu');
  if (!buttons.length || !menu) return;

  const language = (document.documentElement.lang || 'en').toLowerCase();
  const labels = language.startsWith('hu')
    ? { open: 'Menü megnyitása', close: 'Menü bezárása' }
    : language.startsWith('de')
      ? { open: 'Menü öffnen', close: 'Menü schließen' }
      : { open: 'Open menu', close: 'Close menu' };

  buttons.forEach((button) => {
    if (!button.querySelector('span')) {
      button.textContent = '';
      for (let index = 0; index < 3; index += 1) {
        button.append(document.createElement('span'));
      }
    }
  });

  const iconOverride = document.createElement('style');
  iconOverride.dataset.responsiveHeaderIcon = 'true';
  iconOverride.textContent = 'body.apple-archive .burger::before,body.apple-archive .burger::after{content:none!important;box-shadow:none!important}';
  document.head.append(iconOverride);

  const sync = () => {
    const open = body.classList.contains('menu-open');
    buttons.forEach((button) => {
      button.setAttribute('aria-expanded', String(open));
      if (!button.hasAttribute('aria-controls') && menu.id) button.setAttribute('aria-controls', menu.id);
      button.setAttribute('aria-label', open ? labels.close : labels.open);
    });
    menu.setAttribute('aria-hidden', String(!open));
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => requestAnimationFrame(sync));
  });

  menu.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    body.classList.remove('menu-open');
    sync();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !body.classList.contains('menu-open')) return;
    body.classList.remove('menu-open');
    sync();
    buttons[0]?.focus();
  });

  window.addEventListener('resize', sync, { passive: true });
  sync();
})();