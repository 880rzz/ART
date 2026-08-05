from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlsplit
from urllib.request import Request, urlopen
import html
import json
import xml.etree.ElementTree as ET

ROOT = Path('.')
BLOG_HOST = 'blog.banhalmi.art'
ART_BASE = 'https://www.banhalmi.art'
POSTS_SITEMAP = 'https://blog.banhalmi.art/blog-posts-sitemap.xml'
CATEGORIES_SITEMAP = 'https://blog.banhalmi.art/blog-categories-sitemap.xml'
EUFORIA_ROUTE = '/post/euforia'
EUFORIA_TARGET = '/hu/exhibitions/euforia.html'


def fetch_xml(url: str) -> bytes:
    request = Request(
        url,
        headers={
            'User-Agent': 'BANHALMI-archive-sitemap-sync/1.0 (+https://www.banhalmi.art/)'
        },
    )
    with urlopen(request, timeout=45) as response:
        if response.status != 200:
            raise RuntimeError(f'{url}: HTTP {response.status}')
        payload = response.read()
    if not payload.strip():
        raise RuntimeError(f'{url}: empty response')
    return payload


def sitemap_urls(url: str, required_prefix: str) -> list[str]:
    root = ET.fromstring(fetch_xml(url))
    urls: list[str] = []
    for node in root.iter():
        if node.tag.rsplit('}', 1)[-1] != 'loc' or not node.text:
            continue
        candidate = node.text.strip()
        parts = urlsplit(candidate)
        if parts.scheme != 'https' or parts.netloc.lower() != BLOG_HOST:
            raise RuntimeError(f'{url}: unexpected sitemap URL {candidate}')
        decoded_path = unquote(parts.path)
        if not decoded_path.startswith(required_prefix):
            raise RuntimeError(f'{url}: unexpected path {decoded_path}')
        urls.append(candidate)
    unique = sorted(set(urls), key=lambda item: unquote(urlsplit(item).path).casefold())
    if not unique:
        raise RuntimeError(f'{url}: no URLs found')
    return unique


def route_for(url: str) -> str:
    path = unquote(urlsplit(url).path)
    if not path.startswith('/') or '..' in Path(path).parts:
        raise RuntimeError(f'Unsafe route: {path}')
    return path.rstrip('/') or '/'


def absolute_target(target: str) -> str:
    return ART_BASE + target if target.startswith('/') else target


def canonical_target(target: str) -> str:
    return absolute_target(target).split('#', 1)[0]


def output_path(route: str) -> Path:
    clean = route.lstrip('/')
    if not clean:
        raise RuntimeError('Refusing to replace the site root')
    if clean.endswith('.html'):
        return ROOT / clean
    return ROOT / clean / 'index.html'


def render_redirect(route: str, target: str) -> str:
    absolute = absolute_target(target)
    canonical = canonical_target(target)
    target_json = json.dumps(absolute, ensure_ascii=False)
    target_attr = html.escape(absolute, quote=True)
    canonical_attr = html.escape(canonical, quote=True)
    return f'''<!doctype html>
<html lang="hu-HU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,follow">
<meta http-equiv="refresh" content="0; url={target_attr}">
<link rel="canonical" href="{canonical_attr}">
<title>Az oldal új helyre költözött</title>
<script>
(() => {{
  const target = new URL({target_json});
  if (location.search) target.search = location.search;
  if (!target.hash && location.hash) target.hash = location.hash;
  window.location.replace(target.href);
}})();
</script>
</head>
<body>
<p>Ez az oldal véglegesen új helyre költözött. Ha az átirányítás nem indul el, <a href="{target_attr}">nyissa meg az új oldalt</a>.</p>
</body>
</html>
'''


posts = sitemap_urls(POSTS_SITEMAP, '/post/')
categories = sitemap_urls(CATEGORIES_SITEMAP, '/blog/categories/')

redirects_path = ROOT / 'redirects.json'
data = json.loads(redirects_path.read_text(encoding='utf-8'))
redirects = dict(data.get('redirects', {}))

created = 0
updated = 0
for url in posts + categories:
    route = route_for(url)
    target = EUFORIA_TARGET if route.casefold() == EUFORIA_ROUTE else url
    redirects[route] = target
    destination = output_path(route)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        previous = destination.read_text(encoding='utf-8')
        if '<meta http-equiv="refresh"' not in previous or 'location.replace' not in previous:
            raise RuntimeError(f'Refusing to overwrite non-redirect content: {destination}')
        updated += 1
    else:
        created += 1
    destination.write_text(render_redirect(route, target), encoding='utf-8')

# EUFÓRIA is intentionally part of the ART exhibition archive, never the blog target.
redirects[EUFORIA_ROUTE] = EUFORIA_TARGET
output_path(EUFORIA_ROUTE).write_text(
    render_redirect(EUFORIA_ROUTE, EUFORIA_TARGET), encoding='utf-8'
)

data['policy'] = (
    'Every known legacy URL is represented by a lightweight internal HTML redirect page with '
    'noindex,follow, canonical, meta refresh and JavaScript forwarding. Blog post and category '
    'coverage is synchronized from the live blog sitemaps. EUFÓRIA remains in the ART exhibition archive. '
    'Unmapped removed URLs remain 404.'
)
data['blogRoutePolicy'] = {
    'posts': '/post/{slug} -> https://blog.banhalmi.art/post/{slug}',
    'categories': '/blog/categories/{slug} -> https://blog.banhalmi.art/blog/categories/{slug}',
    'sourceSitemaps': [POSTS_SITEMAP, CATEGORIES_SITEMAP],
    'exception': '/post/euforia -> https://www.banhalmi.art/hu/exhibitions/euforia.html',
}
data['redirects'] = dict(sorted(redirects.items(), key=lambda item: item[0].casefold()))
data['updatedAt'] = datetime.now(timezone.utc).date().isoformat()
redirects_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

inventory = {
    'generatedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'),
    'sourceSitemaps': {
        'posts': POSTS_SITEMAP,
        'categories': CATEGORIES_SITEMAP,
    },
    'counts': {
        'posts': len(posts),
        'categories': len(categories),
        'total': len(posts) + len(categories),
    },
    'exception': {
        'route': EUFORIA_ROUTE,
        'target': absolute_target(EUFORIA_TARGET),
        'reason': 'EUFÓRIA is an exhibition record in the BANHALMI ART archive.',
    },
    'posts': posts,
    'categories': categories,
}
inventory_path = ROOT / 'data/blog-sitemap-redirect-inventory.json'
inventory_path.parent.mkdir(parents=True, exist_ok=True)
inventory_path.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

readme_path = ROOT / 'README.md'
readme = readme_path.read_text(encoding='utf-8')
old = 'Known former Wix and service URLs are listed in `redirects.json`. Each exact route has a lightweight HTML fallback page with `noindex,follow`, an absolute canonical, immediate meta refresh and JavaScript forwarding. These pages are intentionally outside the sitemap. Unknown removed URLs remain genuine 404 responses.'
new = 'Known former Wix and service URLs are listed in `redirects.json`. Each exact route has a lightweight HTML fallback page with `noindex,follow`, an absolute canonical, immediate meta refresh and JavaScript forwarding. Blog posts and categories are synchronized from the two live `blog.banhalmi.art` sitemaps and recorded in `data/blog-sitemap-redirect-inventory.json`; `/post/euforia` remains in the ART exhibition archive. Redirect pages are intentionally outside the sitemap. Unknown removed URLs remain genuine 404 responses.'
if old in readme:
    readme = readme.replace(old, new)
elif new not in readme:
    raise RuntimeError('README legacy forwarding paragraph not found')
readme_path.write_text(readme, encoding='utf-8')

audit_path = ROOT / 'tests/audit-internal-redirect-pages.mjs'
audit = r'''import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://www.banhalmi.art';
const data = JSON.parse(fs.readFileSync(path.join(root, 'redirects.json'), 'utf8'));
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'data/blog-sitemap-redirect-inventory.json'), 'utf8'));
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const errors = [];

const absolute = target => target.startsWith('/') ? `${base}${target}` : target;
const canonical = target => absolute(target).split('#', 1)[0];
const routeFromUrl = value => decodeURIComponent(new URL(value).pathname).replace(/\/$/, '') || '/';
const fileFor = route => {
  const clean = route.replace(/^\//, '');
  return path.join(root, clean.endsWith('.html') ? clean : path.join(clean, 'index.html'));
};

for (const [route, target] of Object.entries(data.redirects || {})) {
  const file = fileFor(route);
  if (!fs.existsSync(file)) {
    errors.push(`${route}: internal redirect page missing at ${path.relative(root, file)}`);
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  const expectedTarget = absolute(target);
  const expectedCanonical = canonical(target);
  if (!text.includes('name="robots" content="noindex,follow"')) errors.push(`${route}: noindex,follow missing`);
  if (!text.includes(`http-equiv="refresh" content="0; url=${expectedTarget}"`)) errors.push(`${route}: meta refresh target mismatch`);
  if (!text.includes(`rel="canonical" href="${expectedCanonical}"`)) errors.push(`${route}: canonical target mismatch`);
  if (!text.includes(`const target = new URL(${JSON.stringify(expectedTarget)})`)) errors.push(`${route}: JavaScript target mismatch`);
  if (!text.includes('window.location.replace(target.href)')) errors.push(`${route}: window.location.replace missing`);
  if (text.includes('norbertbanhalmi.wixsite.com')) errors.push(`${route}: stale Wix target remains`);
  if (sitemap.includes(`<loc>${base}${route}</loc>`)) errors.push(`${route}: redirect source must not be listed in sitemap`);
}

const expectedSources = {
  posts: 'https://blog.banhalmi.art/blog-posts-sitemap.xml',
  categories: 'https://blog.banhalmi.art/blog-categories-sitemap.xml'
};
for (const [kind, expected] of Object.entries(expectedSources)) {
  if (inventory.sourceSitemaps?.[kind] !== expected) errors.push(`blog inventory: ${kind} sitemap source mismatch`);
  if (!Array.isArray(inventory[kind]) || inventory[kind].length === 0) errors.push(`blog inventory: ${kind} URLs missing`);
}

const allBlogUrls = [...(inventory.posts || []), ...(inventory.categories || [])];
if (inventory.counts?.total !== allBlogUrls.length) errors.push('blog inventory: total count mismatch');
if (inventory.counts?.posts !== (inventory.posts || []).length) errors.push('blog inventory: post count mismatch');
if (inventory.counts?.categories !== (inventory.categories || []).length) errors.push('blog inventory: category count mismatch');

for (const url of inventory.posts || []) {
  const parsed = new URL(url);
  const route = routeFromUrl(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'blog.banhalmi.art' || !route.startsWith('/post/')) {
    errors.push(`blog inventory: invalid post URL ${url}`);
    continue;
  }
  const expected = route.toLowerCase() === '/post/euforia' ? '/hu/exhibitions/euforia.html' : url;
  if (data.redirects?.[route] !== expected) errors.push(`${route}: sitemap post redirect mismatch`);
}

for (const url of inventory.categories || []) {
  const parsed = new URL(url);
  const route = routeFromUrl(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'blog.banhalmi.art' || !route.startsWith('/blog/categories/')) {
    errors.push(`blog inventory: invalid category URL ${url}`);
    continue;
  }
  if (data.redirects?.[route] !== url) errors.push(`${route}: sitemap category redirect mismatch`);
}

if (data.redirects?.['/post/euforia'] !== '/hu/exhibitions/euforia.html') errors.push('/post/euforia: ART exception missing');
if (String(data.redirects?.['/post/euforia'] || '').includes('blog.banhalmi.art')) errors.push('/post/euforia: must not redirect to blog');
if (inventory.exception?.target !== 'https://www.banhalmi.art/hu/exhibitions/euforia.html') errors.push('blog inventory: EUFÓRIA exception target mismatch');

for (const obsolete of [
  'cloudflare-bulk-redirects.csv',
  'docs/CLOUDFLARE_REDIRECTS_10_OF_10.md',
  'tests/audit-edge-redirects.mjs'
]) {
  if (fs.existsSync(path.join(root, obsolete))) errors.push(`${obsolete}: obsolete Cloudflare redirect artifact remains`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Internal redirect audit passed: ${Object.keys(data.redirects).length} exact legacy routes, including ${inventory.counts.posts} blog posts and ${inventory.counts.categories} blog categories.`);
'''
audit_path.write_text(audit, encoding='utf-8')

print(
    f'Blog sitemap sync complete: {len(posts)} posts, {len(categories)} categories; '
    f'{created} redirect pages created, {updated} updated; EUFÓRIA kept in ART.'
)
