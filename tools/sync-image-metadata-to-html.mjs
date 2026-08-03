import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const write = process.argv.includes('--write');
const registryPath = path.join(root, 'data', 'image-metadata.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const langForPage = (page) => page.startsWith('/hu/') ? 'hu' : page.startsWith('/de-at/') ? 'de' : 'en';
const escAttr = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const normaliseAsset = (value) => {
  try {
    const u = new URL(value, 'https://www.banhalmi.art');
    return u.pathname;
  } catch {
    return value;
  }
};

let changedFiles = 0;
let replacements = 0;
const warnings = [];

for (const record of registry.records ?? []) {
  if (record.decorative) continue;
  for (const page of record.relatedPages ?? []) {
    const rel = page.replace(/^\//, '');
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) {
      warnings.push(`${record.id}: related page not found: ${page}`);
      continue;
    }

    const lang = langForPage(page);
    const alt = record.alt?.[lang];
    if (!alt) {
      warnings.push(`${record.id}: missing ${lang} alt for ${page}`);
      continue;
    }

    const asset = normaliseAsset(record.asset);
    const base = path.basename(asset);
    let html = fs.readFileSync(file, 'utf8');
    const before = html;

    html = html.replace(/<img\b[^>]*>/gi, (tag) => {
      const srcMatch = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
      if (!srcMatch) return tag;
      const src = normaliseAsset(srcMatch[2]);
      if (src !== asset && path.basename(src) !== base) return tag;
      if (/\balt\s*=\s*(["']).*?\1/i.test(tag)) {
        return tag.replace(/\balt\s*=\s*(["']).*?\1/i, `alt="${escAttr(alt)}"`);
      }
      return tag.replace(/\s*\/?>(?=\s*$)/, (end) => ` alt="${escAttr(alt)}"${end}`);
    });

    const socialAlt = escAttr(record.title?.[lang] || alt);
    html = html.replace(/<meta\b([^>]*property=["']og:image:alt["'][^>]*)>/i, `<meta$1>`)
      .replace(/(<meta\b[^>]*property=["']og:image:alt["'][^>]*content=["'])[^"']*(["'][^>]*>)/i, `$1${socialAlt}$2`)
      .replace(/(<meta\b[^>]*name=["']twitter:image:alt["'][^>]*content=["'])[^"']*(["'][^>]*>)/i, `$1${socialAlt}$2`);

    if (html !== before) {
      changedFiles += 1;
      replacements += 1;
      if (write) fs.writeFileSync(file, html);
      console.log(`${write ? 'UPDATED' : 'WOULD UPDATE'} ${rel} <- ${record.id} (${lang})`);
    }
  }
}

console.log(`\n${write ? 'Updated' : 'Would update'} ${changedFiles} file(s); ${replacements} registry-page sync operation(s).`);
if (warnings.length) {
  console.warn(`Warnings (${warnings.length}):`);
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (!write) console.log('Dry run only. Re-run with --write to apply changes.');
