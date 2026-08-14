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
const html = files.filter(f => f.endsWith('.html') && /<html\b/i.test(fs.readFileSync(f, 'utf8')));
const css = files.filter(f => f.endsWith('.css'));
if (css.length !== 1 || !css[0].endsWith('/assets/css/site.css')) {
  errors.push(`expected one CSS authority, found ${css.length}: ${css.map(rel).join(', ')}`);
}

for (const f of html) {
  const h = fs.readFileSync(f, 'utf8');
  const links = [...h.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["'](?!https?:|\/\/)([^"']+)/gi)];
  if (links.length !== 1 || !links[0][1].includes('/assets/css/site.css')) errors.push(`${rel(f)}: must load exactly one canonical CSS`);
  if (/<style\b/i.test(h)) errors.push(`${rel(f)}: inline <style> forbidden`);
  if (/\sstyle=["']/i.test(h)) errors.push(`${rel(f)}: style attribute forbidden`);
  if (!/rel=["']icon["']/i.test(h)) errors.push(`${rel(f)}: favicon missing`);
}

for (const f of files.filter(f => /\.(?:js|mjs)$/.test(f))) {
  const s = fs.readFileSync(f, 'utf8');
  if (/createElement\(["']link["']\)[\s\S]{0,250}stylesheet/i.test(s) || /data-art-(?:chronology|content-flow|record-editorial)/i.test(s)) {
    errors.push(`${rel(f)}: runtime stylesheet injection forbidden`);
  }
}

const required = [
  'llms.txt', 'ai.txt', 'robots.txt', 'sitemap.xml', '_redirects',
  '.well-known/agent.json',
  'api/v1/identity.json', 'api/v1/actions.json', 'api/v1/archive.json',
  'archive-record-registry.json', 'archive-source-map.json', 'ecosystem-bridge.json', 'ecosystem-bridge.jsonld'
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
  if (agent?.read?.identity !== '/api/v1/identity.json' || agent?.actions !== '/api/v1/actions.json') errors.push('agent.json: machine discovery contract drift');
}

for (const p of ['llms.txt', 'ai.txt']) {
  if (!exists(p)) continue;
  const text = read(p);
  for (const token of ['Q56391118', 'https://www.norbertbanhalmi.com/', 'https://www.banhalmi.art/', 'https://blog.banhalmi.art/']) {
    if (!text.includes(token)) errors.push(`${p}: missing ecosystem identity token ${token}`);
  }
}

if (exists('_redirects')) {
  const redirects = read('_redirects');
  const critical = [
    '/post/*  https://blog.banhalmi.art/post/:splat  301',
    '/blog/post/*  https://blog.banhalmi.art/post/:splat  301',
    '/blog/tags/*  https://blog.banhalmi.art/blog/tags/:splat  301',
    '/fotokiallitasok/ebredes  /hu/exhibitions/ebredes.html  301',
    '/ajanlatkeres  https://www.norbertbanhalmi.com/hu/ajanlatkeres/  301',
    '/kapcsolat  https://www.norbertbanhalmi.com/hu/kapcsolat/  301',
    '/norbert-banhalmi  https://www.norbertbanhalmi.com/about/  301',
    '/*  /404.html  404'
  ];
  for (const token of critical) if (!redirects.includes(token)) errors.push(`_redirects: missing legacy contract ${token}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Clean ART architecture passed: ${html.length} HTML pages, one CSS authority, machine discovery, Wikidata-first identity and legacy redirects preserved.`);
