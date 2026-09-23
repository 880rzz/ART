import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const route = '/post/újrakezdeni-mindent-40-felett';
const target = 'https://blog.banhalmi.art/post/újrakezdeni-mindent-40-felett';
const mojibakeRoute = Buffer.from(route, 'utf8').toString('latin1');
const expectedMojibakeRoute = '/post/Ãºjrakezdeni-mindent-40-felett';

const errors = [];
const redirects = JSON.parse(fs.readFileSync(path.join(root, 'redirects.json'), 'utf8')).redirects || {};

if (redirects[route] !== target) {
  errors.push(`redirects.json mapping mismatch for ${route}`);
}
if (mojibakeRoute !== expectedMojibakeRoute) {
  errors.push(`UTF-8/latin1 compatibility route changed: ${JSON.stringify(mojibakeRoute)}`);
}

const sourceFile = path.join(root, route.slice(1), 'index.html');
const compatFile = path.join(root, mojibakeRoute.slice(1), 'index.html');
if (!fs.existsSync(sourceFile)) errors.push(`missing canonical legacy redirect page: ${route}`);
if (!fs.existsSync(compatFile)) errors.push(`missing GitHub Pages compatibility route: ${mojibakeRoute}`);

if (fs.existsSync(sourceFile) && fs.existsSync(compatFile)) {
  const source = fs.readFileSync(sourceFile, 'utf8');
  const compat = fs.readFileSync(compatFile, 'utf8');
  if (source !== compat) errors.push('compatibility page must stay byte-for-byte equivalent to the canonical legacy redirect page');
  if (!compat.includes(`<link rel="canonical" href="${target}">`)) errors.push('compatibility page canonical target mismatch');
  if (!compat.includes(`url=${target}`)) errors.push('compatibility page meta refresh target mismatch');
}

if (errors.length) {
  console.error('Unicode legacy redirect compatibility audit failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}

console.log(`Unicode legacy redirect compatibility audit passed: ${route} -> ${mojibakeRoute} -> ${target}`);
