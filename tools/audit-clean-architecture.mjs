import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));
const rel = p => path.relative(root, p).replaceAll('\\', '/');
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() && !['node_modules', '.git'].includes(e.name)
    ? walk(path.join(d, e.name))
    : e.isFile() ? [path.join(d, e.name)] : []
);

const files = walk(root);
const htmlFiles = files.filter(f => f.endsWith('.html') && /<html\b/i.test(fs.readFileSync(f, 'utf8')));
const cssFiles = files.filter(f => f.endsWith('.css')).map(rel).sort();
const approvedCss = [
  'assets/css/site.css',
  'assets/css/apple-editorial-system.css',
  'assets/css/archive-content-flow.css',
  'assets/css/archive-system.css',
  'assets/css/chronology-surface-authority.css',
  'assets/css/design-refinements.css',
  'assets/css/final-layout-fixes.css',
  'assets/css/footer-elegant.css',
  'assets/css/homepage-two-tone-authority.css',
  'assets/css/museum-editorial.css',
  'assets/css/page-base.css',
  'assets/css/palette-blue-final.css',
  'assets/css/presence-core.css',
  'assets/css/record-editorial-system.css',
  'assets/css/responsive-header-system.css'
].sort();
if (JSON.stringify(cssFiles) !== JSON.stringify(approvedCss)) {
  errors.push(`source CSS module inventory drift: ${cssFiles.join(', ')}`);
}

const redirectStub = h => /http-equiv=["']refresh["']/i.test(h);
let contentPages = 0;
for (const f of htmlFiles) {
  const h = fs.readFileSync(f, 'utf8');
  if (redirectStub(h)) continue;
  contentPages += 1;
  const links = [...h.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)]
    .map(m => m[1].split('?')[0])
    .filter(href => href.startsWith('/assets/css/'));
  if (!links.length) errors.push(`${rel(f)}: no local source stylesheet`);
  for (const href of links) {
    if (!exists(href.replace(/^\//, ''))) errors.push(`${rel(f)}: missing stylesheet ${href}`);
    if (!approvedCss.includes(href.replace(/^\//, ''))) errors.push(`${rel(f)}: unapproved stylesheet ${href}`);
  }
}

// Source CSS is intentionally modular. The immutable Pages build must bundle
// all multi-stylesheet pages to one content-hashed CSS request before deploy.
if (!exists('scripts/optimize-pages-artifact.mjs')) errors.push('production CSS bundler missing');
else {
  const optimizer = read('scripts/optimize-pages-artifact.mjs');
  for (const token of [
    'const cssBundleDir',
    'async function bundleFor(links)',
    'if (links.length > 1)',
    '<link rel="stylesheet" href="${bundle}">',
    'production homepage must load exactly one blocking content-hashed CSS bundle'
  ]) if (!optimizer.includes(token)) errors.push(`production bundler contract missing: ${token}`);
}

// Runtime stylesheet additions are a documented presentation mechanism for
// archive record/content families. No other JS may introduce stylesheet links.
const runtime = 'assets/js/responsive-header-system.js';
if (!exists(runtime)) errors.push(`${runtime}: missing`);
else {
  const source = read(runtime);
  for (const token of [
    '/assets/css/chronology-surface-authority.css',
    '/assets/css/archive-content-flow.css',
    '/assets/css/record-editorial-system.css'
  ]) if (!source.includes(token)) errors.push(`${runtime}: approved runtime style contract missing ${token}`);
}
for (const f of files.filter(f => /\.(?:js|mjs)$/.test(f) && rel(f) !== runtime && !rel(f).startsWith('scripts/'))) {
  const s = fs.readFileSync(f, 'utf8');
  if (/createElement\(["']link["']\)[\s\S]{0,250}stylesheet/i.test(s)) errors.push(`${rel(f)}: unexpected runtime stylesheet injection`);
}

const required = [
  'llms.txt', 'ai.txt', 'robots.txt', 'sitemap.xml', '_redirects',
  '.well-known/agent.json',
  'api/v1/identity.json', 'api/v1/actions.json', 'api/v1/archive.json',
  'archive-record-registry.json', 'archive-source-map.json',
  'ecosystem-bridge.json', 'ecosystem-bridge.jsonld',
  'data/image-knowledge-graph.jsonld', 'data/life-journey.json'
];
for (const p of required) if (!exists(p)) errors.push(`${p}: missing`);

if (exists('api/v1/identity.json')) {
  const identity = JSON.parse(read('api/v1/identity.json'));
  if (identity?.entityType !== 'ArtArchive') errors.push('identity.json: entityType must remain ArtArchive');
  if (identity?.canonicalUrl !== 'https://www.banhalmi.art/') errors.push('identity.json: canonical archive URL drift');
  if (identity?.about?.wikidata !== 'https://www.wikidata.org/wiki/Q56391118') errors.push('identity.json: Wikidata-first Person identity drift');
  if (identity?.commercialAuthority !== 'https://www.norbertbanhalmi.com/') errors.push('identity.json: professional authority bridge drift');
}

if (exists('.well-known/agent.json')) {
  const agent = JSON.parse(read('.well-known/agent.json'));
  if (agent?.canonical !== 'https://www.banhalmi.art/') errors.push('agent.json: canonical archive URL drift');
  if (agent?.commercialAuthority !== 'https://www.norbertbanhalmi.com/') errors.push('agent.json: commercial authority bridge missing');
  if (agent?.read?.identity !== '/api/v1/identity.json' || agent?.read?.archive !== '/api/v1/archive.json') errors.push('agent.json: read discovery contract drift');
  if (agent?.actions !== '/api/v1/actions.json' || agent?.openapi !== null) errors.push('agent.json: action/OpenAPI contract drift');
}

if (exists('api/v1/actions.json')) {
  const actions = JSON.parse(read('api/v1/actions.json'));
  if (actions?.writeApiAvailable !== false) errors.push('actions.json: archive must not expose autonomous write API');
  const enquiry = actions?.actions?.find?.(a => a.id === 'professional-enquiry');
  if (enquiry?.url !== 'https://www.norbertbanhalmi.com/contact/') errors.push('actions.json: professional handoff route drift');
}

for (const p of ['llms.txt', 'ai.txt']) {
  if (!exists(p)) continue;
  const text = read(p);
  for (const token of ['Q56391118', 'https://www.norbertbanhalmi.com/', 'https://www.banhalmi.art/', 'https://blog.banhalmi.art/']) {
    if (!text.includes(token)) errors.push(`${p}: missing ecosystem identity token ${token}`);
  }
  if (!text.includes('New York is not a studio, office, headquarters or operational base')) errors.push(`${p}: New York location disambiguation missing`);
}

if (exists('_redirects')) {
  const redirects = read('_redirects');
  const critical = [
    '/post/*  https://blog.banhalmi.art/post/:splat  301',
    '/blog/post/*  https://blog.banhalmi.art/post/:splat  301',
    '/blog/categories/*  https://blog.banhalmi.art/blog/categories/:splat  301',
    '/blog/tags/*  https://blog.banhalmi.art/blog/tags/:splat  301',
    '/blog/page/*  https://blog.banhalmi.art/blog/page/:splat  301',
    '/fotokiallitasok/ebredes  /hu/exhibitions/ebredes.html  301',
    '/ajanlatkeres  https://www.norbertbanhalmi.com/hu/ajanlatkeres/  301',
    '/kapcsolat  https://www.norbertbanhalmi.com/hu/kapcsolat/  301',
    '/norbert-banhalmi  https://www.norbertbanhalmi.com/about/  301',
    '/service-page/portrait  https://www.norbertbanhalmi.com/hu/portre/  301',
    '/*  /404.html  404'
  ];
  for (const token of critical) if (!redirects.includes(token)) errors.push(`_redirects: missing legacy contract ${token}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Clean ART contract passed: ${contentPages} content pages, ${cssFiles.length} approved source CSS modules with production bundling, Wikidata-first identity, agent/LLM discovery and legacy redirects preserved.`);
