import { test, expect } from '@playwright/test';

const pages = [
  '/', '/hu/', '/de-at/',
  '/press.html', '/hu/press.html', '/de-at/press.html',
  '/community.html', '/hu/community.html', '/de-at/community.html',
  '/writing.html', '/hu/writing.html', '/de-at/writing.html',
  '/curators.html', '/hu/curators.html', '/de-at/curators.html'
];

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 }
];

for (const viewport of viewports) {
  test.describe(`design system ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const path of pages) {
      test(`${path} keeps the museum layout intact`, async ({ page }) => {
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle');

        const metrics = await page.evaluate(() => {
          const root = document.documentElement;
          const body = document.body;
          const sections = [...document.querySelectorAll('main > section')];
          const headings = [...document.querySelectorAll('main h1, main h2, main h3')];
          const footer = document.querySelector('footer');
          const controls = [...document.querySelectorAll('main a.btn, main a.button, main button, main summary')]
            .filter(el => {
              const s = getComputedStyle(el);
              const r = el.getBoundingClientRect();
              return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
            });
          return {
            viewport: innerWidth,
            scrollWidth: Math.max(root.scrollWidth, body.scrollWidth),
            sections: sections.map(el => {
              const r = el.getBoundingClientRect();
              return { left: r.left, right: r.right, width: r.width };
            }),
            headings: headings.map(el => {
              const r = el.getBoundingClientRect();
              return { text: (el.textContent || '').trim(), width: r.width, fontSize: parseFloat(getComputedStyle(el).fontSize) };
            }).filter(x => x.text.length > 8),
            footer: footer ? (() => { const r = footer.getBoundingClientRect(); return { left:r.left,right:r.right,width:r.width }; })() : null,
            controls: controls.map(el => { const r=el.getBoundingClientRect(); return { text:(el.textContent||'').trim(), width:r.width, height:r.height }; })
          };
        });

        expect(metrics.scrollWidth, 'page must not horizontally overflow').toBeLessThanOrEqual(metrics.viewport + 2);
        for (const section of metrics.sections) {
          expect(section.left, 'section must not escape left viewport edge').toBeGreaterThanOrEqual(-2);
          expect(section.right, 'section must not escape right viewport edge').toBeLessThanOrEqual(metrics.viewport + 2);
        }
        if (metrics.footer) {
          expect(metrics.footer.left).toBeGreaterThanOrEqual(-2);
          expect(metrics.footer.right).toBeLessThanOrEqual(metrics.viewport + 2);
        }
        for (const heading of metrics.headings) {
          const minWidth = viewport.width >= 1000 ? 120 : 70;
          expect(heading.width, `heading collapsed into an unreadably narrow column: ${heading.text}`).toBeGreaterThan(minWidth);
        }
        if (viewport.width <= 560) {
          for (const control of metrics.controls) {
            expect(control.width, `mobile control overflows: ${control.text}`).toBeLessThanOrEqual(viewport.width + 1);
          }
        }
      });
    }
  });
}
