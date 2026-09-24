import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const errors = [];
const routes = {
  '/headshot-fotozas': 'https://www.norbertbanhalmi.com/hu/portre/',
  '/portfolio-fotozas': 'https://www.norbertbanhalmi.com/hu/brand/',
  '/rendezvenyfotozas': 'https://www.norbertbanhalmi.com/hu/rendezvenyfotozas/',
  '/muveszi-aktfotozas': 'https://www.banhalmi.art/hu/exhibitions/ebredes.html',
  '/service-page/headshot': 'https://www.norbertbanhalmi.com/hu/portre/',
  '/service-page/headshot-budapest': 'https://www.norbertbanhalmi.com/hu/portre/',
  '/service-page/lifestyle': 'https://www.norbertbanhalmi.com/hu/brand/',
  '/service-page/uzleti-portre-fotozas': 'https://www.norbertbanhalmi.com/hu/portre/',
  '/service-page/nudeart': 'https://www.norbertbanhalmi.com/hu/muveszi-fotografia/'
};

const redirects = fs.readFileSync(path.join(root, '_redirects'), 'utf8');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
const exactLiveChecks = [
  "https://www.banhalmi.art/headshot-fotozas",
  "https://www.banhalmi.art/service-page/headshot",
  "https://www.banhalmi.art/portfolio-fotozas",
  "https://www.banhalmi.art/rendezvenyfotozas"
];
for (const url of exactLiveChecks) {
  if (!workflow.includes(`check_stub '${url}'`)) errors.push(`production workflow missing exact legacy URL live check: ${url}`);
}
for (const [route, target] of Object.entries(routes)) {
  const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(`^${escapedRoute}\\s+${escapedTarget}\\s+301$`, 'm').test(redirects)) {
    errors.push(`_redirects missing exact 301: ${route} -> ${target}`);
  }

  const stub = path.join(root, route.slice(1), 'index.html');
  if (!fs.existsSync(stub)) {
    errors.push(`legacy redirect stub missing: ${route}`);
    continue;
  }
  const html = fs.readFileSync(stub, 'utf8');
  for (const token of [
    `<link rel="canonical" href="${target}">`,
    `content="0; url=${target}"`,
    `new URL("${target}")`,
    'location.search',
    'location.hash',
    'location.replace(target.href)'
  ]) if (!html.includes(token)) errors.push(`${route} missing redirect token: ${token}`);
  if (/noindex/i.test(html)) errors.push(`${route} must remain crawlable for canonical consolidation`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Stage94 legacy search-index cleanup audit passed for ${Object.keys(routes).length} indexed legacy business routes.`);
