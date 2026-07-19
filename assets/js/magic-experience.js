(() => {
  'use strict';

  const doc = document;
  const htmlLang = (doc.documentElement.lang || 'hu').toLowerCase();
  const isEn = htmlLang.startsWith('en');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const copy = isEn ? {
    open: 'Open experience compass',
    close: 'Close experience compass',
    title: 'Experience compass',
    current: 'Current area',
    continue: 'Continue to the next area',
    top: 'Back to the beginning',
    sections: 'Main areas',
    active: 'Current',
    ready: 'The next step is ready'
  } : {
    open: 'Élményiránytű megnyitása',
    close: 'Élményiránytű bezárása',
    title: 'Élményiránytű',
    current: 'Jelenlegi terület',
    continue: 'Tovább a következő területhez',
    top: 'Vissza az elejére',
    sections: 'Fő területek',
    active: 'Itt jársz',
    ready: 'A következő lépés készen áll'
  };

  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);

  const slugify = (text) => text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'section';

  const findSectionRoot = (heading) => {
    const direct = heading.closest('section, article, [data-experience-section], .kids-card, .deck-overview');
    if (direct) return direct;
    let node = heading.parentElement;
    while (node && node !== doc.body) {
      const headingCount = node.querySelectorAll(':scope > h1, :scope > h2').length;
      if (headingCount === 1 && node.getBoundingClientRect().height > 120) return node;
      node = node.parentElement;
    }
    return heading.parentElement;
  };

  const headings = [...doc.querySelectorAll('main h2, body > div h2, section h2')]
    .filter((heading) => heading.offsetParent !== null)
    .filter((heading) => heading.textContent.trim().length > 1);

  const used = new Set();
  const sections = headings.map((heading, index) => {
    const root = findSectionRoot(heading);
    if (!root) return null;
    const title = heading.textContent.trim().replace(/\s+/g, ' ');
    let id = root.id || `experience-${slugify(title)}`;
    while (used.has(id) || (doc.getElementById(id) && doc.getElementById(id) !== root)) id = `${id}-${index + 1}`;
    used.add(id);
    if (!root.id) root.id = id;
    root.dataset.experienceSection = 'true';
    root.classList.add('magic-section');
    return { root, heading, title, id };
  }).filter(Boolean);

  if (!sections.length) return;

  const shell = doc.createElement('div');
  shell.className = 'magic-compass-shell';
  shell.innerHTML = `
    <button class="magic-compass-trigger" type="button" aria-label="${escapeHtml(copy.open)}" aria-expanded="false">
      <span aria-hidden="true" class="magic-compass-glyph">✦</span>
      <span class="sr-only">${escapeHtml(copy.open)}</span>
    </button>
    <div class="magic-compass-backdrop" hidden></div>
    <aside class="magic-compass-panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(copy.title)}" hidden>
      <div class="magic-compass-head">
        <div>
          <span class="magic-compass-eyebrow">${escapeHtml(copy.current)}</span>
          <strong class="magic-compass-current"></strong>
        </div>
        <button class="magic-compass-close" type="button" aria-label="${escapeHtml(copy.close)}">×</button>
      </div>
      <div class="magic-compass-progress" aria-hidden="true"><span></span></div>
      <p class="magic-compass-count"></p>
      <nav aria-label="${escapeHtml(copy.sections)}" class="magic-compass-nav"></nav>
      <div class="magic-compass-actions">
        <button class="magic-compass-next" type="button">${escapeHtml(copy.continue)} <span aria-hidden="true">↓</span></button>
        <button class="magic-compass-top" type="button">${escapeHtml(copy.top)}</button>
      </div>
    </aside>`;
  doc.body.append(shell);

  const trigger = shell.querySelector('.magic-compass-trigger');
  const panel = shell.querySelector('.magic-compass-panel');
  const backdrop = shell.querySelector('.magic-compass-backdrop');
  const closeBtn = shell.querySelector('.magic-compass-close');
  const currentText = shell.querySelector('.magic-compass-current');
  const countText = shell.querySelector('.magic-compass-count');
  const progressBar = shell.querySelector('.magic-compass-progress span');
  const nav = shell.querySelector('.magic-compass-nav');
  const nextBtn = shell.querySelector('.magic-compass-next');
  const topBtn = shell.querySelector('.magic-compass-top');

  nav.innerHTML = sections.map((section, index) => `
    <button type="button" data-magic-target="${escapeHtml(section.id)}">
      <span class="magic-compass-number">${String(index + 1).padStart(2, '0')}</span>
      <span>${escapeHtml(section.title)}</span>
      <small></small>
    </button>`).join('');

  let activeIndex = 0;
  let lastFocus = null;

  const scrollToSection = (index) => {
    const item = sections[Math.max(0, Math.min(index, sections.length - 1))];
    if (!item) return;
    item.root.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    item.root.classList.remove('magic-arrival');
    requestAnimationFrame(() => item.root.classList.add('magic-arrival'));
    setTimeout(() => item.root.classList.remove('magic-arrival'), 1200);
  };

  const updateCompass = (index) => {
    activeIndex = Math.max(0, Math.min(index, sections.length - 1));
    const active = sections[activeIndex];
    currentText.textContent = active.title;
    countText.textContent = `${activeIndex + 1} / ${sections.length}`;
    progressBar.style.width = `${((activeIndex + 1) / sections.length) * 100}%`;
    [...nav.querySelectorAll('button')].forEach((button, idx) => {
      const isActive = idx === activeIndex;
      button.classList.toggle('is-active', isActive);
      button.querySelector('small').textContent = isActive ? copy.active : '';
      if (isActive) button.setAttribute('aria-current', 'location');
      else button.removeAttribute('aria-current');
    });
    nextBtn.disabled = activeIndex >= sections.length - 1;
  };

  const open = () => {
    lastFocus = doc.activeElement;
    panel.hidden = false;
    backdrop.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    doc.body.classList.add('magic-compass-open');
    requestAnimationFrame(() => panel.classList.add('is-open'));
    closeBtn.focus({ preventScroll: true });
  };

  const close = () => {
    panel.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    doc.body.classList.remove('magic-compass-open');
    setTimeout(() => {
      panel.hidden = true;
      backdrop.hidden = true;
    }, reduceMotion ? 0 : 220);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
  };

  trigger.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  nextBtn.addEventListener('click', () => { close(); scrollToSection(activeIndex + 1); });
  topBtn.addEventListener('click', () => { close(); scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });
  nav.addEventListener('click', (event) => {
    const button = event.target.closest('[data-magic-target]');
    if (!button) return;
    const index = sections.findIndex((section) => section.id === button.dataset.magicTarget);
    close();
    scrollToSection(index);
  });

  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) close();
    if (event.key !== 'Tab' || panel.hidden) return;
    const focusables = [...panel.querySelectorAll('button:not([disabled]), a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])')];
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => Math.abs(a.boundingClientRect.top - innerHeight * 0.28) - Math.abs(b.boundingClientRect.top - innerHeight * 0.28));
    if (!visible.length) return;
    const index = sections.findIndex((section) => section.root === visible[0].target);
    if (index >= 0) updateCompass(index);
  }, { rootMargin: '-18% 0px -62% 0px', threshold: [0, 0.01, 0.2] });
  sections.forEach((section) => observer.observe(section.root));

  // Keep long accordion groups manageable on small screens.
  doc.addEventListener('toggle', (event) => {
    const details = event.target;
    if (!(details instanceof HTMLDetailsElement) || !details.open || innerWidth > 760) return;
    const scope = details.parentElement;
    if (!scope) return;
    [...scope.children].forEach((sibling) => {
      if (sibling !== details && sibling instanceof HTMLDetailsElement && sibling.open) sibling.open = false;
    });
  }, true);

  // Add a subtle, short-lived visual response to newly generated results.
  const resultSelectors = [
    '#result', '#pendulumFound', '#pendulumClear', '#pendulumBless', '#pendulumOracleOut',
    '#kidsResult', '.reading', '.oracle-out', '.kids-result', '.shadow-result', '.draw-result'
  ];
  const resultNodes = [...new Set(resultSelectors.flatMap((selector) => [...doc.querySelectorAll(selector)]))];
  const resultObserver = new MutationObserver((mutations) => {
    const touched = new Set(mutations.map((mutation) => mutation.target.closest?.(resultSelectors.join(','))).filter(Boolean));
    touched.forEach((node) => {
      if (!node.textContent.trim() || node.offsetParent === null) return;
      node.classList.remove('magic-result-awake');
      requestAnimationFrame(() => node.classList.add('magic-result-awake'));
      setTimeout(() => node.classList.remove('magic-result-awake'), 1400);
    });
  });
  resultNodes.forEach((node) => resultObserver.observe(node, { childList: true, subtree: true, characterData: true }));

  updateCompass(0);
  doc.documentElement.classList.add('magic-experience-ready');
})();
