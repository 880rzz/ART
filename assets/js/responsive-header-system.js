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