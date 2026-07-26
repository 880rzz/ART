import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git','node_modules','.github'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (/\.(?:html|json|jsonld|md|txt)$/i.test(entry.name)) files.push(full);
  }
}

const replacements = [
  [/for\s+since\s+1999/giu, 'since 1999'],
  [/több mint huszonöt éves?/giu, '1999 óta épülő'],
  [/huszonöt éves?/giu, '1999 óta épülő'],
  [/more than twenty[- ]five years/giu, 'since 1999'],
  [/twenty[- ]five years/giu, 'since 1999'],
  [/mehr als fünfundzwanzig Jahren/giu, 'seit 1999'],
  [/seit fünfundzwanzig Jahren/giu, 'seit 1999'],
  [/Twenty exhibitions between 2014 and 2027/giu, 'Nineteen completed exhibitions and one project in development'],
  [/Húsz kiállítás 2014 és 2027 között/giu, 'Tizenkilenc megvalósult kiállítás és egy fejlesztés alatt álló projekt'],
  [/Zwanzig Ausstellungen zwischen 2014 und 2027/giu, 'Neunzehn realisierte Ausstellungen und ein Projekt in Entwicklung'],
  [/intimitá\s+s/giu, 'intimitás'],
  [/nagykövete loo\b/giu, 'nagykövete'],
  [/Berufs fotograf Austria/giu, 'Berufsfotografie Austria'],
  [/\bprofi fotós fotóművész budapest bécs BANHALMI\b/giu, 'Bánhalmi Norbert fotográfiája'],
];

await walk(root);
const changed = [];
for (const file of files) {
  const original = await readFile(file, 'utf8');
  let content = original;
  for (const [pattern, replacement] of replacements) content = content.replace(pattern, replacement);

  if (file.endsWith('.html')) {
    content = content.replace(/(<[^>]+class=["'][^"']*(?:marquee|logo-track|partner-track)[^"']*["'][^>]*)(>)/giu, (m, open, close) => /aria-hidden=/i.test(open) ? m : `${open} aria-hidden="true"${close}`);
    content = content.replace(/(<button\b[^>]*class=["'][^"']*(?:menu|nav-toggle)[^"']*["'][^>]*)(>)/giu, (m, open, close) => {
      let tag = open;
      if (!/aria-label=/i.test(tag)) tag += ' aria-label="Menu"';
      if (!/aria-expanded=/i.test(tag)) tag += ' aria-expanded="false"';
      return `${tag}${close}`;
    });
  }

  if (content !== original) {
    await writeFile(file, content, 'utf8');
    changed.push(path.relative(root, file).replaceAll(path.sep, '/'));
  }
}
console.log(JSON.stringify({ changed, total: changed.length }, null, 2));
