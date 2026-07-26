import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const origin = 'https://www.banhalmi.art';
const sitemapPath = path.join(root, 'sitemap.xml');
const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const failures = [];

const decodeXml = (value = '') => value
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');

const localFileForUrl = (url) => {
  if (!url.startsWith(origin)) return null;
  const pathname = new URL(url).pathname;
  if (pathname === '/') return path.join(root, 'index.html');
  const relative = decodeURIComponent(pathname).replace(/^\//, '');
  return path.join(root, relative.endsWith('/') ? relative + 'index.html' : relative);
};

const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decodeXml(m[1].trim()));
if (!locs.length) failures.push('sitemap: no <loc> entries');
if (new Set(locs).size !== locs.length) failures.push('sitemap: duplicate <loc> entries');

for (const url of locs) {
  if (!url.startsWith(origin + '/')) failures.push(`sitemap: foreign or non-canonical URL ${url}`);
  const file = localFileForUrl(url);
  if (!file || !fs.existsSync(file)) {
    failures.push(`sitemap: missing local file for ${url}`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  if (/http-equiv=["']refresh["']/i.test(html)) failures.push(`sitemap: redirect page listed ${url}`);
  if (/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) failures.push(`sitemap: noindex page listed ${url}`);
  const canonical = decodeXml(html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] || '');
  if (!canonical) failures.push(`${url}: missing canonical`);
  else if (canonical !== url) failures.push(`${url}: canonical mismatch (${canonical})`);
}

for (const block of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const body = block[1];
  const loc = decodeXml(body.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim() || 'unknown');
  const alternates = [...body.matchAll(/<xhtml:link\b[^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*\/>/g)]
    .map((m) => ({ lang: m[1], href: decodeXml(m[2]) }));
  const seen = new Set();
  for (const alternate of alternates) {
    if (seen.has(alternate.lang)) failures.push(`${loc}: duplicate hreflang ${alternate.lang}`);
    seen.add(alternate.lang);
    const file = localFileForUrl(alternate.href);
    if (!file || !fs.existsSync(file)) failures.push(`${loc}: hreflang target missing ${alternate.lang} -> ${alternate.href}`);
  }
  const lastmod = body.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim();
  if (lastmod && !/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) failures.push(`${loc}: invalid lastmod ${lastmod}`);
}

for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`Audited ${locs.length} sitemap URLs and their canonical targets.`);
if (failures.length) process.exitCode = 1;
