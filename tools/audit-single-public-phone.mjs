import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
// Viko / non-Norbert numbers stay retired. Budapest +36 is the local studio
// line on ART contact cards; Vienna +43 remains the Person / WhatsApp line.
const RETIRED = [
  '+4367764733262',
  '+43 677 647 332 62'
];
const CANONICAL_VIENNA = ['+4367761655592', '+43 677 616 55592'];
const CANONICAL_BUDAPEST = ['+36704698397', '+36 70 469 83 97'];
const HOME_PAGES = ['index.html', 'hu/index.html', 'de-at/index.html'];
const SKIP = new Set(['.git', 'node_modules', '_site', 'artifacts']);

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? files(full) : [full];
  });
}

const failures = [];
let viennaHits = 0;
let budapestHits = 0;
for (const file of files(ROOT)) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  const rel = path.relative(ROOT, file).replaceAll('\\', '/');
  if (rel === 'tools/audit-single-public-phone.mjs' || rel === 'tools/audit-person-social-phone-authority.mjs') continue;
  for (const token of RETIRED) {
    if (text.includes(token)) failures.push(`${rel}: retired public phone token ${token}`);
  }
  for (const token of CANONICAL_VIENNA) if (text.includes(token)) viennaHits += 1;
  for (const token of CANONICAL_BUDAPEST) if (text.includes(token)) budapestHits += 1;
}
if (!viennaHits) failures.push('canonical Vienna +43 677 616 55592 contact missing');
if (!budapestHits) failures.push('canonical Budapest +36 70 469 83 97 studio contact missing');
for (const page of HOME_PAGES) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const budapestCard = html.match(/data-studio-phone="budapest"[\s\S]{0,180}/);
  if (!budapestCard) {
    failures.push(`${page}: Budapest studio phone marker missing`);
    continue;
  }
  if (!budapestCard[0].includes('tel:+36704698397') || !budapestCard[0].includes('+36 70 469 83 97')) {
    failures.push(`${page}: Budapest studio must publish +36 70 469 83 97`);
  }
  if (budapestCard[0].includes('+4367761655592') || budapestCard[0].includes('+43 677 616 55592')) {
    failures.push(`${page}: Budapest studio must not reuse the Vienna number`);
  }
}
if (failures.length) {
  console.error('Public studio phone contract failed:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('Public studio phone contract OK: Vienna +43 677 616 55592 and Budapest +36 70 469 83 97.');
