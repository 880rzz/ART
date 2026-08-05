
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const canonical = 'https://www.norbertbanhalmi.com/about/';
const data = JSON.parse(fs.readFileSync(path.join(root, 'redirects.json'), 'utf8'));
const csv = fs.readFileSync(path.join(root, 'cloudflare-bulk-redirects.csv'), 'utf8');
const staticMap = fs.readFileSync(path.join(root, '_redirects'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const stub = fs.readFileSync(path.join(root, 'norbert-banhalmi/index.html'), 'utf8');
const errors = [];
const required = {
  '/norbert-banhalmi': canonical,
  '/hu/norbert-banhalmi': canonical,
  '/de-at/norbert-banhalmi': canonical,
  '/kapcsolat': 'https://www.norbertbanhalmi.com/hu/kapcsolat/',
  '/fotozas-arak': 'https://www.norbertbanhalmi.com/hu/ajanlatkeres/',
  '/arak': 'https://www.norbertbanhalmi.com/hu/ajanlatkeres/',
  '/gyakori-kerdesek': 'https://www.norbertbanhalmi.com/hu/gyik/',
  '/post/euforia': '/hu/exhibitions/euforia.html'
};
const absolute = value => value.startsWith('/') ? `https://www.banhalmi.art${value}` : value;

for (const [route, target] of Object.entries(required)) {
  if (data.redirects?.[route] !== target) errors.push(`redirects.json: ${route} target mismatch`);
  if (!staticMap.includes(`${route}  ${target}  301`)) errors.push(`_redirects: ${route} missing`);
  for (const host of ['banhalmi.art', 'www.banhalmi.art']) {
    const expected = `${host}${route},${absolute(target)},301,TRUE,FALSE,FALSE,FALSE`;
    if (!csv.includes(expected)) errors.push(`Cloudflare CSV: ${host}${route} missing`);
  }
}

for (const host of ['banhalmi.art', 'www.banhalmi.art']) {
  if (!csv.includes(`${host}/post/,https://blog.banhalmi.art/post/,301,TRUE,FALSE,TRUE,TRUE`)) errors.push(`${host}: blog post suffix rule missing`);
  if (!csv.includes(`${host}/blog/,https://blog.banhalmi.art/blog/,301,TRUE,FALSE,TRUE,TRUE`)) errors.push(`${host}: blog suffix rule missing`);
}

if (!readme.includes(`Canonical Person identifier: \`${canonical}\``)) errors.push('README: canonical Person contract missing');
if (readme.includes('Canonical Person identifier: `/norbert-banhalmi#person`')) errors.push('README: alternate Person identifier remains');
if (!stub.includes(`rel="canonical" href="${canonical}"`)) errors.push('Person fallback: canonical target mismatch');
if (!stub.includes('name="robots" content="noindex,follow"')) errors.push('Person fallback: noindex,follow missing');
if (/\/\*\s+https?:\/\/www\.banhalmi\.art\/?\s+301/.test(staticMap)) errors.push('Do not redirect unknown URLs to the homepage');
if (!staticMap.includes('/*  /404.html  404')) errors.push('Genuine 404 fallback missing');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Edge redirect audit passed for ${Object.keys(data.redirects).length} exact routes, apex and www.`);
