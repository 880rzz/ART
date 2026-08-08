import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  if (['.git', 'node_modules'].includes(entry.name)) return [];
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});

let changedRedirects = 0;
for (const file of walk(ROOT).filter((p) => p.endsWith('.html'))) {
  let html = fs.readFileSync(file, 'utf8');
  if (!/http-equiv=["']refresh["']/i.test(html)) continue;
  const next = html.replace(/<meta\b[^>]*>/gi, (tag) => {
    const robots = /name=["']robots["']/i.test(tag);
    const noindex = /content=["'][^"']*noindex[^"']*["']/i.test(tag);
    return robots && noindex ? '' : tag;
  });
  if (next !== html) {
    fs.writeFileSync(file, next);
    changedRedirects++;
  }
}

const robotsPath = path.join(ROOT, 'robots.txt');
let robots = fs.readFileSync(robotsPath, 'utf8');
robots = robots.replace(/^Disallow:\s*\/data\/\s*\r?\n/gm, '');
fs.writeFileSync(robotsPath, robots);

const redirectAuditPath = path.join(ROOT, 'tests/audit-internal-redirect-pages.mjs');
let redirectAudit = fs.readFileSync(redirectAuditPath, 'utf8');
redirectAudit = redirectAudit.replace(
  "  if (!text.includes('name=\"robots\" content=\"noindex,follow\"')) errors.push(`${route}: noindex,follow missing`);",
  "  if (/noindex/i.test(text)) errors.push(`${route}: redirect source must not carry noindex; redirect and canonical are the consolidation signals`);"
);
fs.writeFileSync(redirectAuditPath, redirectAudit);

const auditPath = path.join(ROOT, 'tests/audit-crawl-indexing-contract-stage46.mjs');
fs.writeFileSync(auditPath, `import fs from 'node:fs';\nimport path from 'node:path';\n\nconst root = process.cwd();\nconst errors = [];\nconst robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');\nif (/^Disallow:\\s*\\/data\\//mi.test(robots)) errors.push('robots.txt must not block public /data/ evidence referenced by llms.txt');\nif (!/^Disallow:\\s*\\/reports\\//mi.test(robots)) errors.push('robots.txt must keep internal /reports/ blocked');\nconst llms = fs.readFileSync(path.join(root, 'llms.txt'), 'utf8');\nfor (const href of [...llms.matchAll(/https:\\/\\/www\\.banhalmi\\.art\\/(data\\/[^)\\s]+)/g)].map((m) => m[1])) {\n  if (!fs.existsSync(path.join(root, href))) errors.push('llms.txt references missing public evidence: ' + href);\n}\nconst walk = (dir) => fs.readdirSync(dir, {withFileTypes:true}).flatMap((e) => {\n  if (['.git','node_modules'].includes(e.name)) return [];\n  const full = path.join(dir,e.name);\n  return e.isDirectory() ? walk(full) : [full];\n});\nfor (const file of walk(root).filter((p) => p.endsWith('.html'))) {\n  const html = fs.readFileSync(file, 'utf8');\n  if (/http-equiv=[\\\"']refresh[\\\"']/i.test(html) && /<meta\\b[^>]*name=[\\\"']robots[\\\"'][^>]*content=[\\\"'][^\\\"']*noindex/i.test(html)) {\n    errors.push(path.relative(root,file) + ': redirect document must not combine meta refresh with noindex');\n  }\n}\nif (errors.length) { console.error('CRAWL / INDEXING CONTRACT FAILED'); errors.forEach((e) => console.error('-',e)); process.exit(1); }\nconsole.log('Crawl/indexing contract passed: public evidence crawlable, reports blocked, redirects free of noindex.');\n`);

const packagePath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const token = 'node tests/audit-crawl-indexing-contract-stage46.mjs';
if (!pkg.scripts.test.includes(token)) pkg.scripts.test += ' && ' + token;
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');

console.log(`Applied ART crawl/indexing fixes; cleaned ${changedRedirects} redirect document(s).`);
