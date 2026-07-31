import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = [];
const failures = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git','node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (/\.(?:html|json|jsonld|md|txt)$/i.test(entry.name)) files.push(full);
  }
}
await walk(root);

const banned = [
  /for\s+since\s+1999/iu,
  /több mint huszonöt éves?/iu,
  /more than twenty[- ]five years/iu,
  /mehr als fünfundzwanzig Jahren/iu,
  /Twenty exhibitions between 2014 and 2027/iu,
  /Húsz kiállítás 2014 és 2027 között/iu,
  /Zwanzig Ausstellungen zwischen 2014 und 2027/iu,
  /profi fotós fotóművész budapest bécs BANHALMI/iu,
  /intimitá\s+s/iu,
  /nagykövete loo\b/iu,
  /Berufs fotograf Austria/iu,
  /alt=["']Best of — the reference gallery — Works from the exhibition["']/iu,
];
for (const file of files) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const content = await readFile(file, 'utf8');
  for (const pattern of banned) if (pattern.test(content)) failures.push(`${rel}: banned stale, malformed or generic copy ${pattern}`);
}

const redirects = await readFile(path.join(root, '_redirects'), 'utf8');
for (const required of [
  '/norbert-banhalmi  /about.html  301',
  '/curators  /curators.html  301',
  '/fotokiallitasok  /#exhibitions  301',
  '/mediamegjelenesek  /hu/press.html  301',
]) if (!redirects.includes(required)) failures.push(`_redirects: missing ${required}`);

for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`Strict ART audit checked ${files.length} content files.`);
if (failures.length) process.exitCode = 1;