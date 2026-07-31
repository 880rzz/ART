import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

async function listHtml(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listHtml(full));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

const files = [
  ...await listHtml(path.join(root, 'hu/books')),
  ...await listHtml(path.join(root, 'hu/exhibitions')),
];
const failures = [];

for (const file of files) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const html = await readFile(file, 'utf8');
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
  const description = html.match(/<meta name="description" content="([^"]*)">/i)?.[1]?.trim() || '';
  const ogTitle = html.match(/<meta property="og:title" content="([^"]*)">/i)?.[1]?.trim() || '';
  const ogDescription = html.match(/<meta property="og:description" content="([^"]*)">/i)?.[1]?.trim() || '';
  const imageAlt = html.match(/<meta property="og:image:alt" content="([^"]*)">/i)?.[1]?.trim() || '';
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || '';

  if (!title.includes('| BANHALMI ART')) failures.push(`${rel}: nem archívumi title`);
  if (!title.includes(rel.includes('/books/') ? '| könyv |' : '| kiállítás |')) failures.push(`${rel}: hiányzó oldaltípus a title-ban`);
  if (!h1 || !title.startsWith(h1)) failures.push(`${rel}: a title nem a H1-ből indul`);
  if (description.length < 90 || description.length > 190) failures.push(`${rel}: meta description hossza ${description.length}`);
  if (/[.]$/.test(description) === false) failures.push(`${rel}: a meta description nincs lezárva`);
  if (ogTitle !== title) failures.push(`${rel}: az og:title eltér a title-tól`);
  if (ogDescription !== description) failures.push(`${rel}: az og:description eltér a meta descriptiontől`);
  if (!imageAlt.includes('BANHALMI ART archívumban')) failures.push(`${rel}: hiányzó archívumi kép-alt`);
  if (description.endsWith(' a.') || description.endsWith(' amely.') || description.endsWith(' baráti.')) failures.push(`${rel}: levágott meta description`);
}

for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`Audited ${files.length} Hungarian book and exhibition pages.`);
if (failures.length) process.exitCode = 1;
