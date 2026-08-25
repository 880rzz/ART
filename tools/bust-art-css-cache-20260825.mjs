import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const VERSION = '20260825-art-design-v2';
const skip = new Set(['.git','node_modules','artifacts','dist']);
let changed = 0;
let checked = 0;

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.isFile() && p.endsWith('.html')) {
      checked++;
      const before = fs.readFileSync(p, 'utf8');
      const after = before.replace(/\/assets\/css\/site\.css\?v=[^"'\s>]+/g, `/assets/css/site.css?v=${VERSION}`);
      if (after !== before) {
        fs.writeFileSync(p, after);
        changed++;
      }
    }
  }
}

walk(root);
if (!changed) throw new Error('No HTML stylesheet cache keys were updated');
console.log(`ART CSS cache key updated on ${changed}/${checked} HTML files to ${VERSION}.`);
