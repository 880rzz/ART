import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

// Final permanent protected stage-one guard: canonical studio Place IDs, 404 parity, release freshness and sitewide ecosystem navigation.
const root = path.resolve(import.meta.dirname, '..');
const errors = [];
const legacyArchiveOrigin = ['https://www.', 'banhalmi.art', '/#studio-'].join('');
const oldIds = [
  `${legacyArchiveOrigin}vienna`,
  `${legacyArchiveOrigin}budapest`
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
  const hasNoindex = /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
  const hasRedirect = /window\.location\.(?:replace|href)/i.test(html);
  const isRedirectStub = hasNoindex && hasRedirect && !/(?:^|\/)404\.html$/i.test(relative);
  if (isRedirectStub || !html.includes('</footer>')) continue;
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
  /* The blog is one system with three language entry points, and the URL
     shapes are not symmetrical — English has no question mark, German does.
     Until now every page linked the Hungarian root, so an English reader
     following "Essays & blog" landed in Hungarian. */
  const blog = lang.startsWith('hu')
    ? 'https://blog.banhalmi.art/'
    : lang.startsWith('de')
      ? 'https://blog.banhalmi.art/?lang=de'
      : 'https://blog.banhalmi.art/lang=en-GB';
  for (const url of [professional, archive, blog]) {
    if (!html.includes(`href="${url}"`)) errors.push(`${relative}: ecosystem link missing ${url}`);
  }
  /* and no page may carry two languages of the same blog at once */
  const foreign = ['https://blog.banhalmi.art/"', 'https://blog.banhalmi.art/?lang=de', 'https://blog.banhalmi.art/lang=en-GB']
    .filter((u) => u !== (blog === 'https://blog.banhalmi.art/' ? 'https://blog.banhalmi.art/"' : blog))
    .filter((u) => html.includes(`href="${u.replace(/"$/, '"')}`));
  for (const u of foreign) {
    errors.push(`${relative}: carries a blog link in another language — ${u.replace(/"$/, '')}`);
  }
}
if (auditedContentPages < 83) errors.push(`Unexpectedly low ART content-page coverage: ${auditedContentPages}`);

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
