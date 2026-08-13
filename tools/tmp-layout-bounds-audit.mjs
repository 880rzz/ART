import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
const pages = [
  ['home','en','/'], ['home','hu','/hu/'], ['home','de','/de-at/'],
  ['curators','en','/curators.html'], ['curators','hu','/hu/curators.html'], ['curators','de','/de-at/curators.html'],
  ['community','en','/community.html'], ['community','hu','/hu/community.html'], ['community','de','/de-at/community.html'],
  ['writing','en','/writing.html'], ['writing','hu','/hu/writing.html'], ['writing','de','/de-at/writing.html'],
  ['press','en','/press.html'], ['press','hu','/hu/press.html'], ['press','de','/de-at/press.html'],
  ['404','en','/404.html'], ['404','hu','/hu/404.html'], ['404','de','/de-at/404.html'],
  ['exhibition','en','/exhibitions/euforia.html'], ['exhibition','hu','/hu/exhibitions/euforia.html'], ['exhibition','de','/de-at/exhibitions/euforia.html'],
  ['book','en','/books/book-anovilaga.html'], ['book','hu','/hu/books/book-anovilaga.html'], ['book','de','/de-at/books/book-anovilaga.html']
];
const widths = [1280, 1440, 1920, 2560];
const introSelector = '.intro,.section-head,.section-intro,[class*="__intro"]';
const gridSelector = '.collage,#galwrap,.source-grid,.press-facts,.press-period-nav,.record-links,.archive-source-hub,[class*="-grid"],[class*="__grid"]';
const heroSelector = 'header.sub,header.hero,.press-hero,[class*="curator"][class*="hero"],[class*="curatorial"][class*="hero"]';
const wrapperSelector = '.wrap,.press-shell,[class*="-shell"],[class*="__shell"]';

function round(n) { return Math.round(n * 100) / 100; }

const browser = await chromium.launch({ headless: true });
const report = { generatedAt: new Date().toISOString(), base, pages: [], flags: [] };

for (const [template, locale, path] of pages) {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 1400 }, deviceScaleFactor: 1 });
    const url = new URL(path, base).href;
    let response;
    try {
      response = await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
      await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; });
      await page.waitForTimeout(150);
    } catch (error) {
      report.flags.push({ type: 'navigation', template, locale, path, width, error: String(error) });
      await page.close();
      continue;
    }
    const status = response?.status() ?? 0;
    const data = await page.evaluate(({introSelector,gridSelector,heroSelector,wrapperSelector}) => {
      const visible = (el) => {
        if (!el) return false;
        const s = getComputedStyle(el); const r = el.getBoundingClientRect();
        return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0.5 && r.height > 0.5;
      };
      const rect = (el) => { const r = el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}; };
      const label = (el) => {
        if (!el) return null;
        const id = el.id ? `#${el.id}` : '';
        const cls = [...el.classList].slice(0,5).map(c=>`.${c}`).join('');
        return `${el.tagName.toLowerCase()}${id}${cls}`;
      };
      const sourceRef = (sheet, rule) => ({ href: sheet.href || 'inline', selector: rule.selectorText, cssText: rule.style.cssText });
      const matchedLayoutRules = (el) => {
        const props = ['width','max-width','min-width','margin','margin-left','margin-right','padding','padding-left','padding-right','left','right','position','display','grid-template-columns'];
        const out = [];
        const walk = (rules, sheet) => {
          for (const rule of rules) {
            if (rule.cssRules) { walk(rule.cssRules, sheet); continue; }
            if (!rule.selectorText || !rule.style) continue;
            let match = false; try { match = el.matches(rule.selectorText); } catch {}
            if (!match) continue;
            const decls = {};
            for (const p of props) {
              const v = rule.style.getPropertyValue(p);
              if (v) decls[p] = `${v}${rule.style.getPropertyPriority(p) ? ' !important' : ''}`;
            }
            if (Object.keys(decls).length) out.push({...sourceRef(sheet,rule), decls});
          }
        };
        for (const sheet of [...document.styleSheets]) { try { walk(sheet.cssRules, sheet); } catch {} }
        return out;
      };
      const nearestWrapper = (el) => el.closest(wrapperSelector) || el.parentElement;
      const intros = [...document.querySelectorAll(introSelector)].filter(visible).map(el => {
        const parent = el.parentElement;
        const section = el.closest('section') || parent;
        const siblings = [...parent.children].filter(s => s !== el && visible(s));
        const fullSibling = siblings.sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width)[0] ||
          [...section.querySelectorAll(gridSelector)].filter(s => s !== el && visible(s)).sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width)[0] || null;
        const wrapper = nearestWrapper(el);
        return { element:label(el), rect:rect(el), parent:label(parent), parentRect:rect(parent), wrapper:label(wrapper), wrapperRect:rect(wrapper), sibling:label(fullSibling), siblingRect:fullSibling?rect(fullSibling):null, rules:matchedLayoutRules(el) };
      });
      const grids = [...new Set([...document.querySelectorAll(gridSelector)])].filter(visible).map(el => {
        const wrapper = nearestWrapper(el);
        return { element:label(el), rect:rect(el), wrapper:label(wrapper), wrapperRect:rect(wrapper), rules:matchedLayoutRules(el) };
      });
      const heroes = [...document.querySelectorAll(heroSelector)].filter(visible).map(el => {
        const title = el.querySelector('h1,.title,[class*="title"]') || el;
        const wrapper = title.closest(wrapperSelector) || el.querySelector(wrapperSelector) || el;
        return { hero:label(el), heroRect:rect(el), title:label(title), titleRect:rect(title), wrapper:label(wrapper), wrapperRect:rect(wrapper), rules:matchedLayoutRules(title) };
      });
      let menu = null;
      const mwrap = document.querySelector('#menu .mwrap');
      if (mwrap) {
        document.body.classList.add('menu-open');
        const menuEl = document.querySelector('#menu');
        const old = menuEl?.getAttribute('style');
        if (menuEl) { menuEl.style.visibility='visible'; menuEl.style.opacity='1'; menuEl.style.pointerEvents='auto'; }
        const mr = mwrap.getBoundingClientRect();
        menu = { element:label(mwrap), rect:rect(mwrap), rules:matchedLayoutRules(mwrap) };
        if (menuEl) { if (old === null) menuEl.removeAttribute('style'); else menuEl.setAttribute('style',old); }
        document.body.classList.remove('menu-open');
      }
      return { title:document.title, bodyClass:document.body.className, intros, grids, heroes, menu };
    }, {introSelector,gridSelector,heroSelector,wrapperSelector});

    const entry = { template, locale, path, width, status, ...data };
    report.pages.push(entry);

    for (const item of data.intros) {
      if (!item.siblingRect) continue;
      const dx = Math.abs(item.rect.x - item.siblingRect.x);
      if (dx > 4) report.flags.push({ type:'intro-left-edge', template, locale, path, width, element:item.element, sibling:item.sibling, dx:round(dx), elementRect:Object.fromEntries(Object.entries(item.rect).map(([k,v])=>[k,round(v)])), siblingRect:Object.fromEntries(Object.entries(item.siblingRect).map(([k,v])=>[k,round(v)])), rules:item.rules });
    }
    for (const item of data.grids) {
      const ratio = item.wrapperRect.width ? item.rect.width / item.wrapperRect.width : 1;
      const dx = Math.abs(item.rect.x - item.wrapperRect.x);
      if (ratio < 0.60) report.flags.push({ type:'grid-underwidth', template, locale, path, width, element:item.element, wrapper:item.wrapper, ratio:round(ratio), dx:round(dx), elementRect:Object.fromEntries(Object.entries(item.rect).map(([k,v])=>[k,round(v)])), wrapperRect:Object.fromEntries(Object.entries(item.wrapperRect).map(([k,v])=>[k,round(v)])), rules:item.rules });
    }
    if (data.menu) {
      const ratio = data.menu.rect.width / width;
      if (ratio < 0.75) report.flags.push({ type:'menu-underwidth', template, locale, path, width, element:data.menu.element, ratio:round(ratio), rect:Object.fromEntries(Object.entries(data.menu.rect).map(([k,v])=>[k,round(v)])), rules:data.menu.rules });
    }
    await page.close();
  }
}
await browser.close();
fs.writeFileSync('layout-audit-report.json', JSON.stringify(report, null, 2));
console.log(`Measured ${report.pages.length} page/viewport combinations.`);
console.log(`Flags: ${report.flags.length}`);
for (const f of report.flags) {
  console.log(`FLAG ${f.type} ${f.locale}/${f.template} ${f.path} @${f.width}px ${f.element || ''} ${f.sibling ? `vs ${f.sibling}` : ''} ${f.dx !== undefined ? `dx=${f.dx}` : ''} ${f.ratio !== undefined ? `ratio=${f.ratio}` : ''}`);
}
