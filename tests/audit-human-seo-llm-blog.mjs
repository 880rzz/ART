import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const errors = [];
const read = (relative) => readFile(path.join(root, relative), 'utf8');

const redirectsText = await read('_redirects');
const redirects = JSON.parse(await read('redirects.json'));
const llms = await read('llms.txt');
const ai = await read('ai.txt');
const plan = await read('docs/HUMAN_SEO_GEO_LLM_AUDIT_PLAN.md');

for (const [name, text] of Object.entries({ _redirects: redirectsText, 'redirects.json': JSON.stringify(redirects), 'llms.txt': llms, 'ai.txt': ai })) {
  if (text.includes('norbertbanhalmi.wixsite.com/norbertbanhalmi')) {
    errors.push(`${name}: retired Wix blog host remains`);
  }
}

const redirectRules = [
  '/post/*  https://blog.banhalmi.art/post/:splat  301',
  '/blog  https://blog.banhalmi.art/  301',
  '/blog/categories/*  https://blog.banhalmi.art/blog/categories/:splat  301',
  '/blog/*  https://blog.banhalmi.art/blog/:splat  301',
  '/post/euforia  /hu/exhibitions/euforia.html  301'
];
for (const rule of redirectRules) {
  if (!redirectsText.includes(rule)) errors.push(`_redirects: missing final blog rule: ${rule}`);
}

if (redirects.blogArchive !== 'https://blog.banhalmi.art/') errors.push('redirects.json: final blog archive mismatch');
if (redirects.sitemapSources?.['art-blog-posts'] !== 'https://blog.banhalmi.art/blog-posts-sitemap.xml') errors.push('redirects.json: post sitemap mismatch');
if (redirects.sitemapSources?.['art-blog-categories'] !== 'https://blog.banhalmi.art/blog-categories-sitemap.xml') errors.push('redirects.json: category sitemap mismatch');

for (const [source, target] of Object.entries(redirects.redirects || {})) {
  if (source.startsWith('/post/') && source !== '/post/euforia' && !String(target).startsWith('https://blog.banhalmi.art/post/')) {
    errors.push(`redirects.json: migrated post does not terminate at the final blog host: ${source} -> ${target}`);
  }
}
if (redirects.redirects?.['/post/euforia'] !== '/hu/exhibitions/euforia.html') errors.push('redirects.json: EUFÓRIA archive exception changed');

for (const [name, text] of Object.entries({ 'llms.txt': llms, 'ai.txt': ai })) {
  for (const required of ['https://www.norbertbanhalmi.com/about/', 'https://www.banhalmi.art/', 'https://www.norbertbanhalmi.com/', 'https://blog.banhalmi.art/', 'MOL Y2K', '1.3-megapixel']) {
    if (!text.includes(required)) errors.push(`${name}: missing ecosystem/origin statement: ${required}`);
  }
  if (/corporate-beginnings|early corporate assignment/i.test(text)) errors.push(`${name}: obsolete corporate-origin framing remains`);
  if (/first camera.*military|military service.*first camera/i.test(text)) errors.push(`${name}: obsolete military-origin claim remains`);
}

for (const required of ['Personal artistic voice', 'Curatorial and archive voice', 'SEO audit', 'Schema audit', 'GEO audit', 'LLM audit']) {
  if (!plan.includes(required)) errors.push(`audit plan: missing section ${required}`);
}

const corePages = ['index.html', 'hu/index.html', 'de-at/index.html', 'curators.html', 'hu/curators.html', 'de-at/curators.html'];
const bannedCliches = /\b(timeless|seamless|elevate|unique journey|autentikus élmény|egyedülálló utazás|zeitlose Reise|nahtlos)\b/i;
for (const relative of corePages) {
  const html = await read(relative);
  const visible = html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  if (bannedCliches.test(visible)) errors.push(`${relative}: high-risk generic marketing phrase found`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Human/SEO/GEO/schema/LLM/blog audit passed: site roles, origin story and final blog routes are consistent.');
