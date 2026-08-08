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
  const html = fs.readFileSync(file, 'utf8');
  if (/http-equiv=[\"']refresh[\"']/i.test(html) && /<meta\b[^>]*name=[\"']robots[\"'][^>]*content=[\"'][^\"']*noindex/i.test(html)) {
    errors.push(path.relative(root,file) + ': redirect document must not combine meta refresh with noindex');
  }
}
if (errors.length) { console.error('CRAWL / INDEXING CONTRACT FAILED'); errors.forEach((e) => console.error('-',e)); process.exit(1); }
console.log('Crawl/indexing contract passed: public evidence crawlable, reports blocked, redirects free of noindex.');
