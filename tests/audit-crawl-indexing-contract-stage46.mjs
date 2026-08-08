import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
if (/^Disallow:\s*\/data\//mi.test(robots)) errors.push('robots.txt must not block public /data/ evidence referenced by llms.txt');
if (!/^Disallow:\s*\/reports\//mi.test(robots)) errors.push('robots.txt must keep internal /reports/ blocked');
const llms = fs.readFileSync(path.join(root, 'llms.txt'), 'utf8');
for (const href of [...llms.matchAll(/https:\/\/www\.banhalmi\.art\/(data\/[^)\s]+)/g)].map((m) => m[1])) {
  if (!fs.existsSync(path.join(root, href))) errors.push('llms.txt references missing public evidence: ' + href);
}
const walk = (dir) => fs.readdirSync(dir, {withFileTypes:true}).flatMap((e) => {
  if (['.git','node_modules'].includes(e.name)) return [];
  const full = path.join(dir,e.name);
  return e.isDirectory() ? walk(full) : [full];
});
for (const file of walk(root).filter((p) => p.endsWith('.html'))) {
  const rel = path.relative(root, file).replaceAll('\\','/');
  const html = fs.readFileSync(file, 'utf8');
  const is404 = rel === '404.html' || rel.endsWith('/404.html');
  if (!is404 && /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
    errors.push(rel + ': live or redirect document must not carry noindex');
  }
}
const redirects = JSON.parse(fs.readFileSync(path.join(root, 'redirects.json'), 'utf8')).redirects || {};
for (const [route, target] of Object.entries(redirects)) {
  const cleanRoute = route.replace(/^\//, '');
  const routeFile = path.join(root, cleanRoute.endsWith('.html') ? cleanRoute : path.join(cleanRoute, 'index.html'));
  if (!fs.existsSync(routeFile)) errors.push(route + ': redirect bridge missing');
  if (target.startsWith('/')) {
    const clean = target.split('#')[0].replace(/^\//, '');
    const targetFile = path.join(root, clean.endsWith('.html') ? clean : path.join(clean, 'index.html'));
    if (!fs.existsSync(targetFile)) errors.push(route + ': internal redirect target missing ' + target);
    else if (/noindex/i.test(fs.readFileSync(targetFile, 'utf8'))) errors.push(route + ': internal redirect target is not indexable ' + target);
  }
}
if (errors.length) { console.error('CRAWL / INDEXING CONTRACT FAILED'); errors.forEach((e) => console.error('-',e)); process.exit(1); }
console.log('Crawl/indexing contract passed: every live ART page is indexable, localized 404s remain excluded, public evidence is crawlable, reports stay blocked, and internal legacy redirects resolve to existing indexable targets.');
