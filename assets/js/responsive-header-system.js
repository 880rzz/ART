(() => {
  const body = document.body;
  if (!body || !body.classList.contains('apple-archive')) return;

  /* v90 final visual authority. Static page markup already links the shared
     design stack; append this narrow override after that stack so no legacy
     museum/curatorial !important rule can reintroduce black/brown surfaces or
     transparent chronology rows. */
  if (!document.querySelector('link[data-art-chronology-surface-authority]')) {
    const chronologySurfaceAuthority = document.createElement('link');
    chronologySurfaceAuthority.rel = 'stylesheet';
    chronologySurfaceAuthority.href = '/assets/css/chronology-surface-authority.css?v=20260810-chronology-surface-v90';
    chronologySurfaceAuthority.dataset.artChronologySurfaceAuthority = 'true';
    document.head.appendChild(chronologySurfaceAuthority);
  }

  /* Runtime component styles must stay below the canonical homepage visual
     authority in the cascade. Appending them to <head> used to place them
     after homepage-two-tone-authority.css, which let record/curatorial rules
     reintroduce different hero sizing and section surfaces after page load. */
  const insertPresentationBeforeFinalAuthority = (link) => {
    const authority = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .find((candidate) => candidate.href.includes('/assets/css/homepage-two-tone-authority.css'));
    if (authority) document.head.insertBefore(link, authority);
    else document.head.appendChild(link);
  };

  /* Stage 74: one structural content-flow layer for the four dense curatorial
     index pages. It is loaded before the final homepage authority so structure
     can vary without taking ownership of the shared palette or typography. */
  if (!document.querySelector('link[data-art-content-flow]')) {
    const contentFlow = document.createElement('link');
    contentFlow.rel = 'stylesheet';
    contentFlow.href = '/assets/css/archive-content-flow.css?v=20260810-chronology-surface-v90';
    contentFlow.dataset.artContentFlow = 'true';
    insertPresentationBeforeFinalAuthority(contentFlow);
  }

  const language = (document.documentElement.lang || 'en').toLowerCase();
  const cleanPath = window.location.pathname.replace(/\/+$/, '');

  /* Stage 75: exhibition and book record pages share one catalogue design
     without rewriting their archival HTML. The canonical path is sufficient
     to classify the record family in all three language trees. */
  const isExhibitionRecord = /\/exhibitions\/[^/]+\.html$/i.test(cleanPath);
  const isBookRecord = /\/books\/[^/]+\.html$/i.test(cleanPath);
  if (isExhibitionRecord) {
    body.dataset.recordType = 'exhibition';
    body.dataset.recordSlug = (cleanPath.split('/').pop() || '').replace(/\.html$/i, '');
  } else if (isBookRecord) {
    body.dataset.recordType = 'book';
    body.dataset.recordSlug = (cleanPath.split('/').pop() || '').replace(/\.html$/i, '');
  }

  if ((isExhibitionRecord || isBookRecord) && !document.querySelector('link[data-art-record-editorial]')) {
    const recordEditorial = document.createElement('link');
    recordEditorial.rel = 'stylesheet';
    recordEditorial.href = '/assets/css/record-editorial-system.css?v=20260810-chronology-surface-v90';
    recordEditorial.dataset.artRecordEditorial = 'true';
    insertPresentationBeforeFinalAuthority(recordEditorial);
  }
  let page = cleanPath.split('/').pop() || 'index';
  page = page.replace(/\.html$/i, '');
  if (page === 'hu' || page === 'de-at' || page === '') page = 'index';

  const curatorialPages = new Set(['curators', 'press', 'community', 'writing']);
  const archivePages = new Set(['index', ...curatorialPages]);
  if (archivePages.has(page)) body.dataset.archivePage = page;

  /* STAGE80-CONTENT-FAMILY-CLASSIFIER
     Every non-record page receives one restrained editorial family. This is
     presentation metadata only: URLs, visible copy, schema and source facts
     stay untouched. It lets the archive simplify dense pages consistently
     instead of adding another page-specific CSS patch. */
  if (!body.dataset.recordType) {
    const familyPage = page.toLowerCase();
    const collectionPages = new Set(['archive','archives','exhibitions','books','projects','works','gallery','search']);
    const chronologyPages = new Set(['chronology','timeline','life','journey','oeuvre']);
    const utilityPages = new Set(['contact','contacts','imprint','impressum','privacy','cookies','cookie-policy','accessibility','404']);
    if (familyPage === 'index') body.dataset.contentFamily = 'home';
    else if (curatorialPages.has(familyPage)) body.dataset.contentFamily = 'curatorial';
    else if (collectionPages.has(familyPage)) body.dataset.contentFamily = 'collection';
    else if (chronologyPages.has(familyPage)) body.dataset.contentFamily = 'chronology';
    else if (utilityPages.has(familyPage)) body.dataset.contentFamily = 'utility';
    else body.dataset.contentFamily = 'editorial';
  }

  /* STAGE89-PAGE-BY-PAGE-DENSITY */
  const densityMain = document.querySelector('main');
  if (densityMain) {
    const densitySections = [...densityMain.querySelectorAll(':scope > section')];
    const densityWords = (densityMain.textContent || '').trim().split(/\s+/).filter(Boolean).length;
    const densityLinks = densityMain.querySelectorAll('a').length;
    const densityItems = densityMain.querySelectorAll('li').length;
    const pageDensityScore = densityWords + densityLinks * 18 + densityItems * 10 + densitySections.length * 55;
    body.dataset.pageDensity = pageDensityScore > 2600 ? 'dense' : pageDensityScore > 1350 ? 'balanced' : 'quiet';
    const secondaryHeading = /^(sources?|references?|documentation|related|further|see also|forr[aá]s|hivatkoz[aá]s|dokument[aá]ci[oó]|kapcsol[oó]d[oó]|tov[aá]bbi|quellen?|referenzen?|dokumentation|verwandt|weiterf[uü]hrend)/i;
    densitySections.forEach(section => { const words=(section.textContent||'').trim().split(/\s+/).filter(Boolean).length; const links=section.querySelectorAll('a').length; const items=section.querySelectorAll('li').length; const score=words+links*20+items*12; section.dataset.sectionDensity=score>900?'heavy':score>450?'medium':'light'; const heading=(section.querySelector('h2,h3')?.textContent||'').trim(); if(secondaryHeading.test(heading)) section.dataset.sectionRole='secondary'; });
  }

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
        /* Strict 1/2 alternation. The previous 1/2/3 cycle mapped 3 back to
           dark, which created dark-dark joins between cycles. */
        section.dataset.curatorialSurface = String((index % 2) + 1);
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

  /* Fragment alignment is owned by CSS scroll-margin-top. The runtime never
     reads layout and writes scroll position in the same turn; that old
     defensive loop caused forced reflow and is now removed from source, not
     merely patched in the deployment artifact. */
  const alignFragmentTarget = (focusTarget = false) => {
    if (page !== 'index' || !window.location.hash) return false;
    let target;
    try {
      target = document.querySelector(window.location.hash);
    } catch {
      return false;
    }
    if (!target) return false;
    target.scrollIntoView({ block: 'start', behavior: 'auto' });
    if (focusTarget) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    return true;
  };

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

  /* v67: visually emphasise one meaningful word/phrase in archive heroes.
     Text content is not rewritten, so headings keep their original human/SEO meaning. */
  const heroHeading = main?.querySelector(':scope > header h1, :scope > .hero h1, h1');
  if (heroHeading && !heroHeading.querySelector('.art-hero-accent') && heroHeading.children.length === 0) {
    const patterns = language.startsWith('hu')
      ? [/jelenlét/i,/eufória/i,/ébredés/i,/nő világa/i,/portré/i,/aktfotózás/i,/fotográfia/i,/archívum/i,/sajtó/i,/kurátor/i,/közösség/i,/könyv/i,/kiállítás/i,/projekt/i]
      : language.startsWith('de')
        ? [/präsenz/i,/euforia/i,/erwachen/i,/welt der frau/i,/porträt/i,/aktfotografie/i,/fotografie/i,/archiv/i,/presse/i,/kurat/i,/gemeinschaft/i,/buch|bücher/i,/ausstellung/i,/projekt/i]
        : [/presence/i,/euphoria|euforia/i,/awakening/i,/world of woman/i,/portrait/i,/nude/i,/photography/i,/archive/i,/press/i,/curator/i,/community/i,/book/i,/exhibition/i,/project/i];
    const source = heroHeading.textContent || '';
    const match = patterns.map(pattern => source.match(pattern)).find(Boolean);
    if (match && Number.isInteger(match.index)) {
      const before = source.slice(0, match.index);
      const hit = source.slice(match.index, match.index + match[0].length);
      const after = source.slice(match.index + match[0].length);
      const accent = document.createElement('span');
      accent.className = 'art-hero-accent';
      accent.textContent = hit;
      heroHeading.replaceChildren(document.createTextNode(before), accent, document.createTextNode(after));
    }
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

  /* Same-page fragment navigation runs only after the fixed overlay releases
     the body's scroll lock. Cross-page fragments use the browser's native
     anchor scroll plus CSS scroll-margin-top. */
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

    requestAnimationFrame(() => {
      alignFragmentTarget(true);
    });
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