import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git', '.github', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}

function normalize(text) {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('und');
}

function removeAdjacentDuplicates(html, tag) {
  const pattern = new RegExp(`(<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>)(\\s*)(<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>)`, 'giu');
  let changed = true;
  let output = html;
  while (changed) {
    changed = false;
    output = output.replace(pattern, (match, first, gap, second) => {
      const a = normalize(first);
      const b = normalize(second);
      if (a.length >= 24 && a === b) {
        changed = true;
        return first;
      }
      return match;
    });
  }
  return output;
}

await walk(root);
const changedFiles = [];
for (const file of files) {
  const original = await readFile(file, 'utf8');
  let html = original;
  for (const tag of ['p', 'h2', 'h3', 'li', 'figure']) html = removeAdjacentDuplicates(html, tag);
  html = html.replace(/(<section\b[^>]*>[\s\S]*?<\/section>)(\s*)(\1)/giu, '$1');
  if (html !== original) {
    await writeFile(file, html, 'utf8');
    changedFiles.push(path.relative(root, file).replaceAll(path.sep, '/'));
  }
}
console.log(JSON.stringify({ changedFiles, total: changedFiles.length }, null, 2));
