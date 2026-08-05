from pathlib import Path
import html
import json

root = Path('.')
redirects_path = root / 'redirects.json'
data = json.loads(redirects_path.read_text(encoding='utf-8'))
base = 'https://www.banhalmi.art'


def absolute_target(target: str) -> str:
    return base + target if target.startswith('/') else target


def canonical_target(target: str) -> str:
    return absolute_target(target).split('#', 1)[0]


def output_path(route: str) -> Path:
    clean = route.lstrip('/')
    if clean.endswith('.html'):
        return root / clean
    return root / clean / 'index.html'


def language(route: str) -> tuple[str, str, str]:
    if route.startswith('/de-at/'):
        return (
            'de-AT',
            'Diese Seite ist umgezogen',
            'Diese Seite ist dauerhaft umgezogen. Falls die Weiterleitung nicht startet, öffnen Sie die neue Seite.'
        )
    if route.startswith('/works/'):
        return (
            'en',
            'This page has moved',
            'This page has permanently moved. If the redirect does not start, open the new page.'
        )
    return (
        'hu-HU',
        'Az oldal új helyre költözött',
        'Ez az oldal véglegesen új helyre költözött. Ha az átirányítás nem indul el, nyissa meg az új oldalt.'
    )


def render(route: str, target: str) -> str:
    absolute = absolute_target(target)
    canonical = canonical_target(target)
    lang, title, message = language(route)
    target_json = json.dumps(absolute, ensure_ascii=False)
    target_attr = html.escape(absolute, quote=True)
    canonical_attr = html.escape(canonical, quote=True)
    return f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,follow">
<meta http-equiv="refresh" content="0; url={target_attr}">
<link rel="canonical" href="{canonical_attr}">
<title>{html.escape(title)}</title>
<script>
(() => {{
  const target = new URL({target_json});
  if (location.search) target.search = location.search;
  if (!target.hash && location.hash) target.hash = location.hash;
  location.replace(target.href);
}})();
</script>
</head>
<body>
<p>{html.escape(message)} <a href="{target_attr}">{html.escape(title)}</a>.</p>
</body>
</html>
'''


created = 0
updated = 0
for route, target in data['redirects'].items():
    destination = output_path(route)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        previous = destination.read_text(encoding='utf-8')
        if '<meta http-equiv="refresh"' not in previous or 'location.replace' not in previous:
            raise SystemExit(f'Refusing to overwrite non-redirect content: {destination}')
        updated += 1
    else:
        created += 1
    destination.write_text(render(route, target), encoding='utf-8')

# The project now intentionally uses repository-native HTML redirect pages only.
for obsolete in [
    root / 'cloudflare-bulk-redirects.csv',
    root / 'docs/CLOUDFLARE_REDIRECTS_10_OF_10.md',
    root / 'tests/audit-edge-redirects.mjs',
]:
    if obsolete.exists():
        obsolete.unlink()

data['policy'] = (
    'Every known legacy URL is represented by a lightweight internal HTML redirect page with '
    'noindex,follow, canonical, meta refresh and JavaScript forwarding. Unmapped removed URLs remain 404.'
)
data['updatedAt'] = '2026-08-05'
redirects_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

readme_path = root / 'README.md'
readme = readme_path.read_text(encoding='utf-8')
readme = readme.replace(
    '- Canonical Person identifier: `https://www.norbertbanhalmi.com/about/`; legacy `/norbert-banhalmi` routes permanently move to that professional Person page.',
    '- Canonical Person identifier: `https://www.norbertbanhalmi.com/about/`; legacy `/norbert-banhalmi` routes immediately forward to that professional Person page.'
)
legacy_section = '''\n### Legacy URL forwarding\n\nKnown former Wix and service URLs are listed in `redirects.json`. Each exact route has a lightweight HTML fallback page with `noindex,follow`, an absolute canonical, immediate meta refresh and JavaScript forwarding. These pages are intentionally outside the sitemap. Unknown removed URLs remain genuine 404 responses.\n'''
if '### Legacy URL forwarding' not in readme:
    readme = readme.replace('\n## Requirements\n', legacy_section + '\n## Requirements\n')
readme_path.write_text(readme, encoding='utf-8')

internal_audit = r'''import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const base = 'https://www.banhalmi.art';
const data = JSON.parse(fs.readFileSync(path.join(root, 'redirects.json'), 'utf8'));
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const errors = [];

const absolute = target => target.startsWith('/') ? `${base}${target}` : target;
const canonical = target => absolute(target).split('#', 1)[0];
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
  if (!text.includes('location.replace(target.href)')) errors.push(`${route}: location.replace missing`);
  if (text.includes('norbertbanhalmi.wixsite.com')) errors.push(`${route}: stale Wix target remains`);
  if (sitemap.includes(`<loc>${base}${route}</loc>`)) errors.push(`${route}: redirect source must not be listed in sitemap`);
}

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
console.log(`Internal redirect audit passed: ${Object.keys(data.redirects).length} exact legacy routes.`);
'''
(root / 'tests/audit-internal-redirect-pages.mjs').write_text(internal_audit, encoding='utf-8')

package_path = root / 'package.json'
package = json.loads(package_path.read_text(encoding='utf-8'))
old_command = 'node tests/audit-edge-redirects.mjs'
new_command = 'node tests/audit-internal-redirect-pages.mjs'
commands = [item.strip() for item in package['scripts']['test'].split('&&')]
commands = [item for item in commands if item and item != old_command and item != new_command]
commands.append(new_command)
package['scripts']['test'] = ' && '.join(commands)
package['scripts'].pop('test:edge-redirects', None)
package['scripts']['test:internal-redirects'] = new_command
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print(f'Internal redirect pages synchronized: {updated} updated, {created} created.')
