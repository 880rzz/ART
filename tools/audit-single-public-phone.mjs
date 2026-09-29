import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RETIRED = [
  '+36704698397',
  '+36 70 469 8397',
  '+36 70 469 83 97',
  '+4367764733262',
  '+43 677 647 332 62'
];
const CANONICAL = ['+4367761655592', '+43 677 616 55592'];
const SKIP = new Set(['.git', 'node_modules', '_site', 'artifacts']);

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? files(full) : [full];
  });
}

const failures = [];
let canonicalHits = 0;
for (const file of files(ROOT)) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  const rel = path.relative(ROOT, file).replaceAll('\\\\', '/');
  if (rel === 'tools/audit-single-public-phone.mjs') continue;
  for (const token of RETIRED) {
    if (text.includes(token)) failures.push(`${rel}: retired public phone token ${token}`);
  }
  for (const token of CANONICAL) if (text.includes(token)) canonicalHits += 1;
}
if (!canonicalHits) failures.push('canonical +43 677 616 55592 contact missing');
if (failures.length) {
  console.error('Single public phone contract failed:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('Single public phone contract OK: +43 677 616 55592.');
