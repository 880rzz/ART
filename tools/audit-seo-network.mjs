import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const warnings = [];
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const assert = (ok, msg) => { if (!ok) failures.push(msg); };

function localPathForUrl(url) {
  const parsed = new URL(url);
  let pathname = decodeURIComponent(parsed.pathname);
  if (pathname === '/') return 'index.html';
  pathname = pathname.replace(/^\//, '');
  if (pathname.endsWith('/')) return `${pathname}index.html`;
  return path.extname(pathname) ? pathname : `${pathname}.html`;
}

function attrs(tag) {
  const out = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*["']([^"']*)["']/g)) out[match[1].toLowerCase()] = match[2];
  return out;
}

for (const required of ['robots.txt', 'sitemap.xml', 'llms.txt', 'ai.txt', 'knowledge-graph.jsonld', 'ecosystem-bridge.json', 'ecosystem-bridge.jsonld']) {
  assert(exists(required), `missing machine-readable file: ${required}`);
}

for (const jsonFile of ['knowledge-graph.jsonld', 'ecosystem-bridge.json', 'ecosystem-bridge.jsonld']) {
  if (!exists(jsonFile)) continue;
  try { JSON.parse(read(jsonFile)); }
  catch (error) { failures.push(`${jsonFile}: invalid JSON (${error.message})`); }
}

const robots = exists('robots.txt') ? read('robots.txt') : '';
assert(/User-agent:\s*\*/i.test(robots), 'robots.txt: wildcard user agent missing');
assert(/Allow:\s*\//i.test(robots), 'robots.txt: site is not explicitly crawlable');
assert(robots.includes('Sitemap: https://www.banhalmi.art/sitemap.xml'), 'robots.txt: canonical sitemap missing');

const sitemap = exists('sitemap.xml') ? read('sitemap.xml') : '';
const urls = [...sitemap.matchAll(/<loc>(https:\/\/www\.banhalmi\.art\/[^<]*)<\/loc>/g)]
  .map((m) => m[1])
  .filter((url) => !/\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(url));
assert(urls.length > 0, 'sitemap.xml: no page URLs found');
assert(new Set(urls).size === urls.length, 'sitemap.xml: duplicate URL');

for (const url of urls) {
  const file = localPathForUrl(url);
  assert(exists(file), `sitemap URL has no local file: ${url} -> ${file}`);
  if (!exists(file)) continue;
  const html = read(file);
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => attrs(m[0]));
  const canonical = links.find((a) => (a.rel || '').toLowerCase().split(/\s+/).includes('canonical'))?.href;
  assert(canonical === url, `${file}: canonical mismatch (${canonical || 'missing'} != ${url})`);
  const alternates = links.filter((a) => a.hreflang && a.href && (a.rel || '').toLowerCase().split(/\s+/).includes('alternate'));
  assert(alternates.some((a) => a.hreflang.toLowerCase() === 'x-default'), `${file}: x-default hreflang missing`);
  const langs = alternates.map((a) => a.hreflang.toLowerCase());
  assert(new Set(langs).size === langs.length, `${file}: duplicate hreflang value`);
}

const htmlFiles = [];
function walk(dir = '.') {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (['.git', 'node_modules', 'playwright-report', 'test-results', 'artifacts'].includes(entry.name)) continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel);
    else if (entry.name.endsWith('.html')) htmlFiles.push(rel.replaceAll('\\', '/').replace(/^\.\//, ''));
  }
}
walk();

const externalUrls = new Set();
for (const file of htmlFiles) {
  const html = read(file);
  for (const match of html.matchAll(/\b(?:href|src)=["'](https?:\/\/[^"'#\s]+(?:#[^"']*)?)["']/gi)) {
    const url = match[1].replace(/&amp;/g, '&');
    if (/^https:\/\/www\.banhalmi\.art\//.test(url)) continue;
    externalUrls.add(url);
  }
}

const critical = [
  'https://www.banhalmi.art/',
  'https://www.banhalmi.art/robots.txt',
  'https://www.banhalmi.art/sitemap.xml',
  'https://www.banhalmi.art/llms.txt',
  'https://www.banhalmi.art/ai.txt',
  'https://www.banhalmi.art/knowledge-graph.jsonld',
  'https://www.banhalmi.art/ecosystem-bridge.json',
  'https://www.banhalmi.art/ecosystem-bridge.jsonld',
  'https://www.norbertbanhalmi.com/',
  'https://www.norbertbanhalmi.com/llms.txt',
  'https://blog.banhalmi.art/'
];
const criticalSet = new Set(critical);

async function check(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'BANHALMI-ART-LinkAudit/2.0' }
    });
    if ([400, 405].includes(response.status)) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': 'BANHALMI-ART-LinkAudit/2.0', range: 'bytes=0-1024' }
      });
    }
    return {
      url,
      status: response.status,
      ok: response.status < 400 || [401, 403, 429, 999].includes(response.status),
      finalUrl: response.url
    };
  } catch (error) {
    return { url, status: 0, ok: false, error: error.name === 'AbortError' ? 'timeout' : error.message };
  } finally {
    clearTimeout(timer);
  }
}

if (process.env.LIVE_AUDIT === '1') {
  const queue = [...new Set([...critical, ...externalUrls])];
  const results = [];
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) results.push(await check(queue.shift()));
  });
  await Promise.all(workers);
  results.sort((a, b) => a.url.localeCompare(b.url));
  fs.writeFileSync('link-audit-results.json', JSON.stringify({ generatedAt: new Date().toISOString(), checked: results.length, results }, null, 2) + '\n');
  for (const result of results) {
    if (!result.ok && criticalSet.has(result.url)) failures.push(`unreachable critical URL: ${result.url} (${result.status || result.error})`);
    else if (!result.ok) warnings.push(`third-party URL could not be verified: ${result.url} (${result.status || result.error})`);
    else if (result.status >= 300) warnings.push(`external URL returned ${result.status}: ${result.url}`);
  }
  console.log(`Checked ${results.length} live and external URLs.`);
} else {
  console.log(`Static ART SEO/network contract collected ${externalUrls.size} unique external URLs; set LIVE_AUDIT=1 to verify them.`);
}

for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`Validated ${urls.length} sitemap URLs and ${htmlFiles.length} HTML files.`);
if (failures.length) process.exitCode = 1;
