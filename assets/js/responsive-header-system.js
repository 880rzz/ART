(() => {
  const body = document.body;
  if (!body || !body.classList.contains('apple-archive')) return;

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