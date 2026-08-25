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
  if (!/<main\b[^>]*\bid=["']main["']/i.test(out)) out = out.replace(/<main\b/i, '<main id="main"');
  if (/class=["'][^"']*\bskip-link\b/i.test(out)) {
    out = out.replace(/(<a\b[^>]*class=["'][^"']*\bskip-link\b[^>]*href=["'])#[^"']*(["'])/i, '$1#main$2');
    out = out.replace(/(<a\b[^>]*href=["'])#[^"']*(["'][^>]*class=["'][^"']*\bskip-link\b)/i, '$1#main$2');
    return { html: out, changed: out !== html };
  }
  const lang = out.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1]?.toLowerCase() || 'en';
  const label = lang.startsWith('hu') ? 'Ugrás a tartalomra' : lang.startsWith('de') ? 'Zum Inhalt springen' : 'Skip to content';
  out = out.replace(/(<body\b[^>]*>)/i, `$1<a class="skip-link" href="#main">${label}</a>`);
  return { html: out, changed: out !== html };
}

function fixVisibleLabelParity(html) {
  return html
    .replace('aria-label="Open Budapest studio in Google Maps"', 'aria-label="Lágymányosi u. 15. — Open Budapest studio in Google Maps"')
    .replace('aria-label="Budapesti stúdió megnyitása a Google Térképen"', 'aria-label="Lágymányosi u. 15. — Budapesti stúdió megnyitása a Google Térképen"')
    .replace('aria-label="Budapester Studio in Google Maps öffnen"', 'aria-label="Lágymányosi u. 15. — Budapester Studio in Google Maps öffnen"');
}

export function hardenProductionArtifact(siteRoot) {
  const root = path.resolve(siteRoot || '_site');
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

  return { forbidden: forbidden.length, required: required.length, skipLinksAdded, buttonTypesAdded, labelParityPages };
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith(path.join('scripts', 'harden-production-artifact.mjs'))) {
  const result = hardenProductionArtifact(process.argv[2] || '_site');
  console.log(`ART production surface hardened: ${result.forbidden} repository-only paths excluded; ${result.required} public contracts present; ${result.skipLinksAdded} missing skip links, ${result.buttonTypesAdded} non-form button types and ${result.labelParityPages} accessible-name parity page(s) normalized.`);
}
