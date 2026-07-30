import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = [];
const skip = new Set(['.git', 'node_modules', '.github']);

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) {
      const rel = path.relative(root, full).replaceAll('\\', '/');
      if (rel.startsWith('hu/') || rel.startsWith('data/archive/') || rel.startsWith('fotokiallitasok/') || rel.startsWith('post/') || rel.startsWith('kapcsolat/') || rel.startsWith('konyveim/') || rel.startsWith('mediamegjelenesek/') || rel.startsWith('norbert-banhalmi/')) files.push(full);
    }
  }
}

await walk(root);

const replacements = [
  [/Ha kurátorként, igazgatóként vagy gyűjtőként olvasod ezt: isten hozott, és köszönöm az időt\./gi,
    'Ha kurátorként, igazgatóként vagy gyűjtőként olvassa ezt, köszönöm, hogy időt szán rá.'],
  [/Ha bármi beszélgetést indít belőle, pontosan azt teszi, amiért készült\./gi,
    'Ha a dosszié beszélgetést indít, már elérte a célját.'],
  [/Miért lehet ez érdekes neked/gi, 'Miért lehet ez érdekes Önnek'],
  [/Kiállítási koncepciók, amiket szívesen építenék veled/gi,
    'Kiállítási koncepciók, amelyeket szívesen dolgoznék ki Önnel'],
  [/Nyisd meg bármelyiket a teljes történetért és galériáért\./gi,
    'A könyvek külön oldalakon nyithatók meg, a teljes történettel és galériával.'],
  [/Írj kölcsönzésről vagy projektről/gi, 'Kiállítási vagy kölcsönzési megkeresés'],
  [/Írj nekem/gi, 'Írjon nekem'],
  [/Írj üzenetet/gi, 'Küldjön üzenetet'],
  [/Nézd meg/gi, 'Tekintse meg'],
  [/Olvasd el/gi, 'Olvassa el'],
  [/Ismerd meg/gi, 'Ismerje meg'],
  [/Lépj kapcsolatba/gi, 'Lépjen kapcsolatba'],
  [/Válassz/gi, 'Válasszon'],
  [/Kattints/gi, 'Kattintson'],
  [/Tudj meg többet/gi, 'Tudjon meg többet'],
  [/neked szól/gi, 'Önnek szól'],
  [/számodra/gi, 'az Ön számára'],
  [/veled együtt/gi, 'Önnel együtt'],
  [/veled/gi, 'Önnel'],
  [/neked/gi, 'Önnek']
];

const changed = [];
for (const file of files) {
  const original = await readFile(file, 'utf8');
  let html = original;
  for (const [pattern, replacement] of replacements) html = html.replace(pattern, replacement);
  if (html !== original) {
    await writeFile(file, html, 'utf8');
    changed.push(path.relative(root, file).replaceAll('\\', '/'));
  }
}

console.log(JSON.stringify({ changed, total: changed.length }, null, 2));
