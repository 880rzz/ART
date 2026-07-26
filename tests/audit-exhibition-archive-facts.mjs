import { readFile, readdir } from 'node:fs/promises';

const base = new URL('../hu/exhibitions/', import.meta.url);
const files = (await readdir(base)).filter((name) => name.endsWith('.html')).sort();
const failures = [];

for (const name of files) {
  const html = await readFile(new URL(name, base), 'utf8');
  if (html.includes('>Ahogy én mesélném<')) failures.push(`${name}: régi személyes szekciócím maradt`);
  if (!html.includes('>Archívumi összefoglaló<') && !html.includes('>A koncepció<')) failures.push(`${name}: hiányzó archívumi vagy koncepció-összefoglaló`);
  if (!html.includes('data-archive-facts="true"')) failures.push(`${name}: hiányzó archívumi adatblokk`);
  if (!html.includes('<strong>Év:</strong>')) failures.push(`${name}: hiányzó év`);
  if (!html.includes('<strong>Helyszín / státusz:</strong>')) failures.push(`${name}: hiányzó helyszín vagy státusz`);
  const total = Number(html.match(/id="galwrap"[^>]*data-total="(\d+)"/)?.[1] || 0);
  if (total && !html.includes(`<strong>Digitalizált művek:</strong> ${total} kép`)) failures.push(`${name}: hibás digitalizált műszám`);
  if (!total && !html.includes('<strong>Digitalizált művek:</strong> a projekt dokumentációja folyamatosan bővül')) failures.push(`${name}: hiányzó bővülő projektstátusz`);
}

for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`Audited ${files.length} Hungarian exhibition pages.`);
if (failures.length) process.exitCode = 1;
