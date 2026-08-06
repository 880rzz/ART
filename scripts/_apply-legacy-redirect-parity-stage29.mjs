import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const redirectsPath = path.join(root, 'redirects.json');
const data = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
const additions = {
  '/service-page/headshot': 'https://www.norbertbanhalmi.com/hu/portre/',
  '/service-page/lifestyle': 'https://www.norbertbanhalmi.com/hu/brand/'
};

data.redirects = Object.fromEntries(
  Object.entries({ ...(data.redirects || {}), ...additions })
    .sort(([a], [b]) => a.localeCompare(b, 'en'))
);
fs.writeFileSync(redirectsPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
function absolute(target) {
  return target.startsWith('/') ? `https://www.banhalmi.art${target}` : target;
}
function fileFor(route) {
  const clean = route.replace(/^\//, '');
  return path.join(root, clean.endsWith('.html') ? clean : clean, clean.endsWith('.html') ? '' : 'index.html');
}
function page(target) {
  const full = absolute(target);
  const canonical = full.split('#', 1)[0];
  return `<!doctype html>
<html lang="hu-HU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,follow">
<meta http-equiv="refresh" content="0; url=${escapeHtml(full)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<title>Az oldal új helyre költözött</title>
<script>
(() => {
  const target = new URL(${JSON.stringify(full)});
  if (location.search) target.search = location.search;
  if (!target.hash && location.hash) target.hash = location.hash;
  window.location.replace(target.href);
})();
</script>
</head>
<body>
<p>Ez az oldal véglegesen új helyre költözött. Ha az átirányítás nem indul el, nyissa meg az új oldalt. <a href="${escapeHtml(full)}">Az oldal új helyre költözött</a>.</p>
</body>
</html>
`;
}

for (const [route, target] of Object.entries(additions)) {
  const file = fileFor(route);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page(target), 'utf8');
}

console.log(`Registered and materialized ${Object.keys(additions).length} legacy service aliases.`);
