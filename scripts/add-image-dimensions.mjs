import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
walk(root);

const refs = new Set();
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g)) {
    const src = match[1];
    if (!src || /^(?:https?:|data:)/.test(src)) continue;
    const target = src.startsWith('/') ? path.join(root, src) : path.resolve(path.dirname(file), src);
    if (fs.existsSync(target) && !target.endsWith('.svg')) refs.add(target);
  }
}

const dimensions = new Map();
const list = [...refs];
for (let start = 0; start < list.length; start += 100) {
  const chunk = list.slice(start, start + 100);
  const output = execFileSync('/usr/bin/sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', ...chunk], { encoding: 'utf8' });
  let current = null;
  let width = null;
  for (const line of output.split('\n')) {
    if (line && !line.startsWith(' ')) {
      current = line.trim();
      width = null;
    } else if (line.includes('pixelWidth:')) {
      width = Number(line.split(':').pop().trim());
    } else if (line.includes('pixelHeight:') && current && width) {
      const height = Number(line.split(':').pop().trim());
      if (height) dimensions.set(current, { width, height });
    }
  }
}

for (const file of htmlFiles) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<img\b([^>]*?)\bsrc=(["'])([^"']+)\2([^>]*)>/g, (tag, before, quote, src, after) => {
    if (/\bwidth=["']/.test(tag) || !src || /^(?:https?:|data:)/.test(src)) return tag;
    const target = src.startsWith('/') ? path.join(root, src) : path.resolve(path.dirname(file), src);
    const size = dimensions.get(target);
    if (!size) return tag;
    return `<img${before}src=${quote}${src}${quote} width="${size.width}" height="${size.height}"${after}>`;
  });
  fs.writeFileSync(file, html);
}

console.log(`Added intrinsic dimensions for ${dimensions.size} image files across ${htmlFiles.length} HTML pages.`);
