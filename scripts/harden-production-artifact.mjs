import fs from 'node:fs';
import path from 'node:path';

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function walkPublicText(dir, out = []) {
  const allowed = new Set(['.html', '.json', '.jsonld', '.txt', '.xml']);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkPublicText(full, out);
    else if (entry.isFile() && allowed.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

function addExplicitButtonTypes(html) {
  let depth = 0;
  let changed = 0;
  const out = html.replace(/<\/?form\b[^>]*>|<button\b[^>]*>/gi, (tag) => {
    if (/^<form\b/i.test(tag)) { depth += 1; return tag; }
    if (/^<\/form\b/i.test(tag)) { depth = Math.max(0, depth - 1); return tag; }
    if (depth > 0 || /\btype\s*=/i.test(tag)) return tag;
    changed += 1;
    return tag.replace(/>$/, ' type="button">');
  });
  return { html: out, changed };
}

function ensureSkipLink(html) {
  if (/http-equiv=["']?refresh/i.test(html) || /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) return { html, changed: false };
  if (!/<main\b/i.test(html)) return { html, changed: false };
  let out = html;
  let mainId = out.match(/<main\b[^>]*\bid=["']([^"']+)["']/i)?.[1] || '';
  if (!mainId) {
    out = out.replace(/<main\b/i, '<main id="main"');
    mainId = 'main';
  }
  const target = `#${mainId}`;
  if (/class=["'][^"']*\bskip-link\b/i.test(out)) {
    out = out.replace(/(<a\b[^>]*class=["'][^"']*\bskip-link\b[^>]*href=["'])#[^"']*(["'])/i, `$1${target}$2`);
    out = out.replace(/(<a\b[^>]*href=["'])#[^"']*(["'][^>]*class=["'][^"']*\bskip-link\b)/i, `$1${target}$2`);
    return { html: out, changed: out !== html };
  }
  const lang = out.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1]?.toLowerCase() || 'en';
  const label = lang.startsWith('hu') ? 'Ugrás a tartalomra' : lang.startsWith('de') ? 'Zum Inhalt springen' : 'Skip to content';
  out = out.replace(/(<body\b[^>]*>)/i, `$1<a class="skip-link" href="${target}">${label}</a>`);
  return { html: out, changed: out !== html };
}

function fixVisibleLabelParity(html) {
  return html.replace(/<a\b[^>]*>/gi, (tag) => {
    if (!/\bhref=["'][^"']*google\.com\/maps[^"']*["']/i.test(tag)) return tag;
    return tag.replace(/\s+aria-label=["'][^"']*["']/i, '');
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function setMetaDescription(html, description) {
  const patterns = [
    /(<meta name="description" content=")[^"]*(">)/i,
    /(<meta property="og:description" content=")[^"]*(">)/i,
    /(<meta name="twitter:description" content=")[^"]*(">)/i
  ];
  let out = html;
  for (const pattern of patterns) {
    if (pattern.test(out)) out = out.replace(pattern, `$1${description}$2`);
  }
  return out;
}

function setPageTitle(html, title) {
  let out = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  const patterns = [
    /(<meta property="og:title" content=")[^"]*(">)/i,
    /(<meta name="twitter:title" content=")[^"]*(">)/i
  ];
  for (const pattern of patterns) {
    if (pattern.test(out)) out = out.replace(pattern, `$1${escapeHtml(title)}$2`);
  }
  return out;
}

function injectSemanticIntentBlock(html, page, locale, groupName) {
  if (html.includes('data-artistic-nude-semantic=')) return html;
  if (!page?.semanticHeading || !page?.semanticIntro) throw new Error(`ART semantic artistic intent copy missing for ${groupName}/${locale}.`);
  const section = `<section class="wrap narrow" data-artistic-nude-semantic="${escapeHtml(groupName)}"><div class="intro"><p class="label">${locale === 'hu-HU' ? 'Művészi aktfotográfia' : locale === 'de-AT' ? 'Künstlerische Aktfotografie' : 'Artistic nude photography'}</p><h2>${escapeHtml(page.semanticHeading)}</h2><p class="lead">${escapeHtml(page.semanticIntro)}</p></div></section>\n`;
  if (!/<\/main>/i.test(html)) throw new Error(`ART artistic semantic page has no main element for ${groupName}/${locale}.`);
  return html.replace(/<\/main>/i, `${section}</main>`);
}

function injectArtisticNudeClusterLinks(html, locale, groupName) {
  if (html.includes('data-artistic-nude-cluster=')) return html;
  const lang = locale === 'hu-HU' ? 'hu' : locale === 'de-AT' ? 'de' : 'en';
  const routes = {
    en: {
      hub: '/exhibitions/ebredes.html',
      touch: '/exhibitions/touch-wien.html',
      dream: '/exhibitions/themensdream.html',
      hubTitle: 'Awakening — The New Beginning',
      touchTitle: 'Touch Vienna & Touch Munich',
      dreamTitle: 'The Men’s Dream',
      primaryLabel: 'Artistic nude — related projects',
      supportLabel: 'Artistic nude — central project'
    },
    hu: {
      hub: '/hu/exhibitions/ebredes.html',
      touch: '/hu/exhibitions/touch-wien.html',
      dream: '/hu/exhibitions/themensdream.html',
      hubTitle: 'Ébredés — az Új kezdet',
      touchTitle: 'Touch Bécs & Touch München',
      dreamTitle: 'The Men’s Dream',
      primaryLabel: 'Művészi akt — kapcsolódó projektek',
      supportLabel: 'Művészi akt — központi projekt'
    },
    de: {
      hub: '/de-at/exhibitions/ebredes.html',
      touch: '/de-at/exhibitions/touch-wien.html',
      dream: '/de-at/exhibitions/themensdream.html',
      hubTitle: 'Erwachen — Ein neuer Anfang',
      touchTitle: 'Touch Wien & Touch München',
      dreamTitle: 'The Men’s Dream',
      primaryLabel: 'Künstlerische Aktfotografie — verwandte Projekte',
      supportLabel: 'Künstlerische Aktfotografie — zentrales Projekt'
    }
  }[lang];
  const links = groupName === 'primary'
    ? `<li><a href="${routes.touch}"><strong>${routes.touchTitle}</strong></a></li><li><a href="${routes.dream}"><strong>${routes.dreamTitle}</strong></a></li>`
    : `<li><a href="${routes.hub}"><strong>${routes.hubTitle}</strong></a></li>`;
  const label = groupName === 'primary' ? routes.primaryLabel : routes.supportLabel;
  const section = `<section class="wrap narrow" data-artistic-nude-cluster="${groupName}"><p class="label">${label}</p><ul class="linklist">${links}</ul></section>\n`;
  if (!/<\/main>/i.test(html)) throw new Error(`ART artistic cluster page has no main element for ${groupName}/${locale}.`);
  return html.replace(/<\/main>/i, `${section}</main>`);
}

function mergeAbout(existing, terms) {
  const current = existing == null ? [] : Array.isArray(existing) ? existing : [existing];
  const serialized = new Set(current.map((item) => JSON.stringify(item)));
  for (const term of terms) {
    const node = { '@type': 'DefinedTerm', name: term };
    const key = JSON.stringify(node);
    if (!serialized.has(key)) {
      current.push(node);
      serialized.add(key);
    }
  }
  return current;
}

function enrichArtisticNudeJsonLd(html, page, locale, groupName, keywords) {
  const terms = Array.from(new Set(keywords || [])).slice(0, 12);
  if (!terms.length) throw new Error(`ART artistic keywords missing for ${locale}.`);
  let touched = 0;
  const scriptRe = /<script\b([^>]*\btype=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi;
  const out = html.replace(scriptRe, (full, attrs, jsonText) => {
    let data;
    try { data = JSON.parse(jsonText); } catch { return full; }
    let changed = false;
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { for (const item of node) visit(item); return; }
      const rawType = node['@type'];
      const types = Array.isArray(rawType) ? rawType : rawType ? [rawType] : [];
      if (types.some((type) => ['ExhibitionEvent', 'ImageGallery', 'ImageObject', 'WebPage'].includes(type))) {
        node.about = mergeAbout(node.about, terms.slice(0, 6));
        node.keywords = terms;
        if (types.includes('ImageGallery')) node.genre = ['Fine art photography', 'Artistic nude photography'];
        if (types.includes('ExhibitionEvent')) {
          node.description = page.metaDescription;
          node.subjectOf = Array.from(new Set([
            ...(Array.isArray(node.subjectOf) ? node.subjectOf : node.subjectOf ? [node.subjectOf] : []),
            'https://www.banhalmi.art/data/machine-core.json'
          ]));
        }
        if (!node.creator && !types.includes('ExhibitionEvent')) node.creator = { '@id': 'https://www.norbertbanhalmi.com/about/' };
        touched += 1;
        changed = true;
      }
      for (const value of Object.values(node)) visit(value);
    };
    visit(data);
    if (!changed) return full;
    return `<script${attrs}>${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
  });
  if (!touched) throw new Error(`ART artistic Schema projection found no eligible JSON-LD nodes for ${groupName}/${locale}.`);
  return out;
}

function projectCanonicalIdentity(root, legalName) {
  const retiredLegalName = 'Norbert Banhalmi e.U.';
  let filesChanged = 0;
  let replacements = 0;
  for (const file of walkPublicText(root)) {
    const before = fs.readFileSync(file, 'utf8');
    const matches = before.split(retiredLegalName).length - 1;
    if (!matches) continue;
    fs.writeFileSync(file, before.replaceAll(retiredLegalName, legalName), 'utf8');
    filesChanged += 1;
    replacements += matches;
  }
  return { filesChanged, replacements };
}

function applyArtisticIntentProjection(root, projection) {
  if (!projection || typeof projection !== 'object') throw new Error('ART artistic intent projection missing from canonical machine core.');
  const authorityPages = projection.authorityPages || {};
  const supportingAuthorityPages = projection.supportingAuthorityPages || {};
  const searchIntentKeywords = projection.searchIntentKeywords || {};
  if (!projection.directAnswerContract?.['hu-HU'] || !projection.directAnswerContract?.en || !projection.directAnswerContract?.['de-AT']) {
    throw new Error('ART artistic direct-answer contract incomplete.');
  }
  const expectedPrimaryPaths = {
    en: 'exhibitions/ebredes.html',
    'hu-HU': 'hu/exhibitions/ebredes.html',
    'de-AT': 'de-at/exhibitions/ebredes.html'
  };
  const expectedTouchPaths = {
    en: 'exhibitions/touch-wien.html',
    'hu-HU': 'hu/exhibitions/touch-wien.html',
    'de-AT': 'de-at/exhibitions/touch-wien.html'
  };
  const expectedMensDreamPaths = {
    en: 'exhibitions/themensdream.html',
    'hu-HU': 'hu/exhibitions/themensdream.html',
    'de-AT': 'de-at/exhibitions/themensdream.html'
  };

  for (const [locale, expectedPath] of Object.entries(expectedPrimaryPaths)) {
    if (authorityPages?.[locale]?.path !== expectedPath) throw new Error(`ART central artistic-nude authority must remain Ébredés for ${locale}.`);
  }
  for (const [locale, expectedPath] of Object.entries(expectedTouchPaths)) {
    if (supportingAuthorityPages?.['touch-tantra']?.[locale]?.path !== expectedPath) throw new Error(`ART Touch/Tantra supporting authority drift for ${locale}.`);
  }
  for (const [locale, expectedPath] of Object.entries(expectedMensDreamPaths)) {
    if (supportingAuthorityPages?.['the-mens-dream']?.[locale]?.path !== expectedPath) throw new Error(`ART The Men’s Dream supporting authority drift for ${locale}.`);
  }

  const groups = [
    ['primary', authorityPages],
    ...Object.entries(supportingAuthorityPages)
  ];
  let pagesChecked = 0;
  let pagesChanged = 0;
  for (const [groupName, pages] of groups) {
    for (const [locale, page] of Object.entries(pages || {})) {
      if (!page?.path || !page?.url || !page?.metaDescription || !page?.pageTitle || !page?.semanticHeading || !page?.semanticIntro) {
        throw new Error(`ART artistic intent projection incomplete for ${groupName}/${locale}.`);
      }
      if (!page.url.startsWith('https://www.banhalmi.art/')) throw new Error(`ART artistic authority escaped the ART domain for ${groupName}/${locale}.`);
      const file = path.join(root, page.path);
      if (!fs.existsSync(file)) throw new Error(`ART artistic authority page missing: ${page.path}`);
      const before = fs.readFileSync(file, 'utf8');
      let after = setMetaDescription(before, page.metaDescription);
      after = setPageTitle(after, page.pageTitle);
      after = enrichArtisticNudeJsonLd(after, page, locale, groupName, searchIntentKeywords[locale]);
      after = injectSemanticIntentBlock(after, page, locale, groupName);
      after = injectArtisticNudeClusterLinks(after, locale, groupName);
      if (!after.includes(`rel="canonical" href="${page.url}"`)) throw new Error(`${page.path}: canonical URL drift for artistic intent authority.`);
      if (!after.includes(page.metaDescription)) throw new Error(`${page.path}: artistic intent description projection failed.`);
      if (!after.includes(`<title>${escapeHtml(page.pageTitle)}</title>`)) throw new Error(`${page.path}: artistic intent title projection failed.`);
      if (!after.includes('data-artistic-nude-semantic=')) throw new Error(`${page.path}: semantic artistic intent block projection failed.`);
      if (!after.includes('data-artistic-nude-cluster=')) throw new Error(`${page.path}: artistic intent internal-link cluster projection failed.`);
      if (!after.includes('"keywords"')) throw new Error(`${page.path}: artistic Schema keyword projection failed.`);
      if (after !== before) {
        fs.writeFileSync(file, after, 'utf8');
        pagesChanged += 1;
      }
      pagesChecked += 1;
    }
  }
  if (projection.editorialContext !== 'https://blog.banhalmi.art/blog/categories/aktfotozas-muveszi-szemmel') throw new Error('ART artistic intent editorial boundary drift.');
  for (const [locale, url] of Object.entries(projection.currentCommissionRoutes || {})) {
    if (!url.startsWith('https://www.norbertbanhalmi.com/')) throw new Error(`ART current commission route must stay on the professional domain for ${locale}.`);
  }
  return { pagesChecked, pagesChanged };
}

export function hardenProductionArtifact(siteRoot) {
  const root = path.resolve(siteRoot || '_site');
  const machineCorePath = path.join(root, 'data/machine-core.json');
  if (!fs.existsSync(machineCorePath)) throw new Error('ART production artifact lost canonical machine core before hardening.');
  const core = JSON.parse(fs.readFileSync(machineCorePath, 'utf8'));
  const legalName = core.professionalIdentityMirror?.organization?.legalName;
  if (legalName !== 'Banhalmi Norbert e.U.') throw new Error(`ART canonical legal identity drift: ${String(legalName)}`);

  const identityProjection = projectCanonicalIdentity(root, legalName);
  const artisticIntent = applyArtisticIntentProjection(root, core.artisticIntentProjection);

  let skipLinksAdded = 0;
  let buttonTypesAdded = 0;
  let labelParityPages = 0;

  for (const file of walkHtml(root)) {
    let html = fs.readFileSync(file, 'utf8');
    const hadSkip = /class=["'][^"']*\bskip-link\b/i.test(html);
    const skip = ensureSkipLink(html);
    if (!hadSkip && skip.changed && /class=["'][^"']*\bskip-link\b/i.test(skip.html)) skipLinksAdded += 1;
    html = skip.html;
    const beforeLabelParity = html;
    html = fixVisibleLabelParity(html);
    if (html !== beforeLabelParity) labelParityPages += 1;
    const buttons = addExplicitButtonTypes(html);
    buttonTypesAdded += buttons.changed;
    fs.writeFileSync(file, buttons.html);
  }

  for (const file of walkPublicText(root)) {
    const text = fs.readFileSync(file, 'utf8');
    if (text.includes('Norbert Banhalmi e.U.')) throw new Error(`${path.relative(root, file)}: retired legal identity survived production projection.`);
  }

  const forbidden = [
    '.github', 'tests', 'tools', 'scripts', 'docs', 'node_modules', 'reports',
    '.gitignore', '.DS_Store', 'package.json', 'package-lock.json', 'README.md',
    'netlify.toml', 'vercel.json', 'middleware.js',
    'playwright.config.js', 'playwright.config.mjs',
    'lighthouserc.mobile.cjs', 'lighthouserc.desktop.cjs',
    'lighthouserc.production-mobile.cjs', 'lighthouserc.production-desktop.cjs'
  ];

  for (const rel of forbidden) fs.rmSync(path.join(root, rel), { recursive: true, force: true });
  for (const rel of forbidden) {
    if (fs.existsSync(path.join(root, rel))) throw new Error(`ART production artifact leaked repository-only path: ${rel}`);
  }

  const required = [
    'index.html', 'hu/index.html', 'de-at/index.html', 'CNAME', '.nojekyll',
    'robots.txt', 'sitemap.xml', 'llms.txt', 'ai.txt', '.well-known/agent.json',
    'assets/css/site.css', 'assets/img/responsive/portrait-circle-480.webp',
    'assets/img/responsive/portrait-circle-720.webp'
  ];
  for (const rel of required) {
    if (!fs.existsSync(path.join(root, rel))) throw new Error(`ART production artifact lost required public file: ${rel}`);
  }

  return {
    forbidden: forbidden.length,
    required: required.length,
    skipLinksAdded,
    buttonTypesAdded,
    labelParityPages,
    identityFilesChanged: identityProjection.filesChanged,
    identityReplacements: identityProjection.replacements,
    artisticIntentPagesChecked: artisticIntent.pagesChecked,
    artisticIntentPagesChanged: artisticIntent.pagesChanged
  };
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith(path.join('scripts', 'harden-production-artifact.mjs'))) {
  const result = hardenProductionArtifact(process.argv[2] || '_site');
  console.log(`ART production surface hardened: ${result.forbidden} repository-only paths excluded; ${result.required} public contracts present; ${result.skipLinksAdded} missing skip links, ${result.buttonTypesAdded} non-form button types and ${result.labelParityPages} accessible-name parity page(s) normalized; ${result.identityReplacements} retired legal-name occurrence(s) projected across ${result.identityFilesChanged} public file(s); ${result.artisticIntentPagesChecked} artistic-intent authority page(s) verified, ${result.artisticIntentPagesChanged} full SEO/Schema/semantic/internal-link projection(s) updated.`);
}
