import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

// Stage-one permanent guard: canonical studio Place IDs and visible ecosystem navigation.
const root = path.resolve(import.meta.dirname, '..');
const errors = [];
const oldIds = [
  'https://www.banhalmi.art/#studio-vienna',
  'https://www.banhalmi.art/#studio-budapest'
];
const textExtensions = new Set(['.html', '.json', '.jsonld', '.txt', '.md', '.js', '.mjs', '.py', '.xml']);
const htmlFiles = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    const extension = path.extname(entry.name).toLowerCase();
    if (!textExtensions.has(extension)) continue;
    const text = await readFile(full, 'utf8');
    for (const id of oldIds) {
      if (text.includes(id)) errors.push(`${path.relative(root, full)}: legacy duplicate Place ID remains: ${id}`);
    }
    if (extension === '.html') htmlFiles.push({ full, text });
  }
}
await walk(root);

let auditedContentPages = 0;
for (const { full, text: html } of htmlFiles) {
  const relative = path.relative(root, full).replaceAll(path.sep, '/');
  const isRedirectOrNoindex = /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)
    || /window\.location\.(?:replace|href)/i.test(html);
  if (isRedirectOrNoindex || !html.includes('</footer>')) continue;
  auditedContentPages += 1;
  if (!html.includes('data-banhalmi-ecosystem')) errors.push(`${relative}: visible official ecosystem navigation missing`);
  const lang = html.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1]?.toLowerCase() || 'en';
  const professional = lang.startsWith('hu')
    ? 'https://www.norbertbanhalmi.com/hu/'
    : lang.startsWith('de')
      ? 'https://www.norbertbanhalmi.com/de-at/'
      : 'https://www.norbertbanhalmi.com/';
  const archive = lang.startsWith('hu')
    ? 'https://www.banhalmi.art/hu/'
    : lang.startsWith('de')
      ? 'https://www.banhalmi.art/de-at/'
      : 'https://www.banhalmi.art/';
  for (const url of [professional, archive, 'https://blog.banhalmi.art/']) {
    if (!html.includes(`href="${url}"`)) errors.push(`${relative}: ecosystem link missing ${url}`);
  }
}
if (auditedContentPages < 80) errors.push(`Unexpectedly low ART content-page coverage: ${auditedContentPages}`);

for (const relative of ['llms.txt', 'ai.txt']) {
  const text = await readFile(path.join(root, relative), 'utf8');
  for (const url of ['https://www.norbertbanhalmi.com/', 'https://www.banhalmi.art/', 'https://blog.banhalmi.art/']) {
    if (!text.includes(url)) errors.push(`${relative}: official ecosystem URL missing ${url}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Stage-one entity ecosystem audit passed across ${auditedContentPages} ART content pages: one Place identity per studio and consistent visible three-site navigation.`);
