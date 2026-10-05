import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const TOKEN = JSON.parse(await readFile(path.join(ROOT, 'data/design-authority.json'), 'utf8')).assetVersion;
const EXCLUDED_DIRS = new Set(['.git', 'node_modules', '_site', 'artifacts', 'dist', 'build', 'coverage']);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) yield full;
  }
}

const rules = [
  [/\/assets\/js\/responsive-header-system\.js(?:\?v=[^\"'\s<>]+)?/g, '/assets/js/responsive-header-system.js?v=' + TOKEN],
  [/\/assets\/css\/site\.css(?:\?v=[^\"'\s<>]+)?/g, '/assets/css/site.css?v=' + TOKEN]
];

let scanned = 0;
let changedFiles = 0;
let replacements = 0;

for await (const file of walk(ROOT)) {
  scanned += 1;
  const before = await readFile(file, 'utf8');
  let after = before;
  for (const [rule, replacement] of rules) {
    after = after.replace(rule, (match) => {
      replacements += 1;
      return replacement;
    });
  }
  if (after !== before) {
    await writeFile(file, after, 'utf8');
    changedFiles += 1;
  }
}

console.log('Contact Dock asset sync complete: scanned=' + scanned + ' changedFiles=' + changedFiles + ' replacements=' + replacements + ' token=' + TOKEN);
