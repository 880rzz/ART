import { readFile, readdir } from 'node:fs/promises';

const groups = [
  { dir: new URL('../hu/books/', import.meta.url), type: 'Book' },
  { dir: new URL('../hu/exhibitions/', import.meta.url), type: 'ExhibitionEvent' },
];
const failures = [];
let audited = 0;

for (const group of groups) {
  const files = (await readdir(group.dir)).filter((name) => name.endsWith('.html')).sort();
  for (const name of files) {
    audited += 1;
    const html = await readFile(new URL(name, group.dir), 'utf8');
    const meta = html.match(/<meta name="description" content="([^"]+)">/)?.[1];
    const og = html.match(/<meta property="og:description" content="([^"]+)">/)?.[1];
    if (!meta) failures.push(`${name}: hiányzó meta description`);
    if (!og) failures.push(`${name}: hiányzó og:description`);
    if (meta && og && meta !== og) failures.push(`${name}: eltérő meta és Open Graph leírás`);
    if (meta && /Ez volt|Ahogy én|nekem|próbáltuk|mesélném/i.test(meta)) failures.push(`${name}: személyes hangú meta description maradt`);

    const jsonText = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    if (!jsonText) {
      failures.push(`${name}: hiányzó JSON-LD`);
      continue;
    }
    let data;
    try { data = JSON.parse(jsonText); }
    catch { failures.push(`${name}: hibás JSON-LD`); continue; }
    const node = data['@graph']?.find((item) => item['@type'] === group.type);
    if (!node) failures.push(`${name}: hiányzó ${group.type} schema`);
    else if (meta && node.description !== meta.replace(/&quot;/g, '"').replace(/&amp;/g, '&')) failures.push(`${name}: a schema leírása nincs szinkronban a meta leírással`);
  }
}

for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`Audited metadata on ${audited} Hungarian archive pages.`);
if (failures.length) process.exitCode = 1;
