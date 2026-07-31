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
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}

const copy = {
  hu: {
    title: 'Szolgáltatások',
    desc: 'Executive portré, vizuális branding, vállalati és művészi fotográfiai megbízások.',
    href: 'https://www.norbertbanhalmi.com/hu/#services',
    contact: /<a class="menu-item" href="[^"]*(?:#contact|kapcsolat)[^"]*">/i
  },
  de: {
    title: 'Leistungen',
    desc: 'Executive-Porträts, visuelle Markenpositionierung sowie Unternehmens- und Fine-Art-Fotografie.',
    href: 'https://www.norbertbanhalmi.com/de-at/#services',
    contact: /<a class="menu-item" href="[^"]*(?:#contact|kontakt)[^"]*">/i
  },
  en: {
    title: 'Services',
    desc: 'Executive portraiture, visual branding, corporate and commissioned fine-art photography.',
    href: 'https://www.norbertbanhalmi.com/#services',
    contact: /<a class="menu-item" href="[^"]*(?:#contact|contact)[^"]*">/i
  }
};

await walk(root);
const changed = [];
for (const file of files) {
  const rel = path.relative(root, file).replaceAll('\\', '/');
  const lang = rel.startsWith('hu/') ? 'hu' : rel.startsWith('de-at/') ? 'de' : 'en';
  const c = copy[lang];
  const original = await readFile(file, 'utf8');
  let html = original;

  html = html.replace(/(<details\s+class="svc"[^>]*>\s*<summary>)[\s\S]*?(<\/summary>)/i, `$1${c.title}$2`);

  if (html.includes('class="menu-grid"') && !/menu-item--services/i.test(html)) {
    const service = `<a class="menu-item menu-item--services" href="${c.href}" target="_blank" rel="noopener"><strong>${c.title}</strong><span>${c.desc}</span></a>`;
    if (c.contact.test(html)) html = html.replace(c.contact, `${service}$&`);
    else html = html.replace(/(<div class="menu-grid">)/i, `$1${service}`);
  }

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    changed.push(rel);
  }
}

console.log(JSON.stringify({ changed, total: changed.length }, null, 2));
