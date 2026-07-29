import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = [];
const failures = [];
const pages = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git', '.github', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}

function decode(text) {
  return text
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—');
}

function plain(text) {
  return decode(text.replace(/<script\b[\s\S]*?<\/script>/giu, ' ').replace(/<style\b[\s\S]*?<\/style>/giu, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function key(text) {
  return plain(text).toLocaleLowerCase('und').replace(/[“”„"'’.,:;!?()\[\]{}–—-]/g, '').replace(/\s+/g, ' ').trim();
}

function languageOf(rel, html) {
  const attr = (html.match(/<html\b[^>]*lang=["']([^"']+)/i) || [])[1] || '';
  if (rel.startsWith('hu/')) return 'hu';
  if (rel.startsWith('de-at/')) return 'de';
  return attr.toLowerCase().startsWith('hu') ? 'hu' : attr.toLowerCase().startsWith('de') ? 'de' : 'en';
}

function mainHtml(html) {
  return (html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) || [,''])[1];
}

function isTechnicalRedirect(html) {
  return /<meta\b[^>]*http-equiv=["']refresh["'][^>]*>/i.test(html)
    || /<meta\b[^>]*content=["'][^"']*url=[^"']+["'][^>]*http-equiv=["']refresh["'][^>]*>/i.test(html);
}

await walk(root);
for (const file of files) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const html = await readFile(file, 'utf8');
  if (isTechnicalRedirect(html)) continue;
  const main = mainHtml(html);
  const lang = languageOf(rel, html);
  if (!main) failures.push(`${rel}: missing main content landmark`);
  const h1s = [...main.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/giu)].map(m => plain(m[1])).filter(Boolean);
  if (h1s.length !== 1) failures.push(`${rel}: expected exactly one visible H1, found ${h1s.length}`);
  const sections = [...main.matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/giu)];
  if (sections.length > 1) {
    const meaningful = sections.filter(m => plain(m[1]).length >= 60);
    if (!meaningful.length) failures.push(`${rel}: section structure contains no substantial content block`);
  }
  const blocks = [...main.matchAll(/<(p|h2|h3|li)\b[^>]*>([\s\S]*?)<\/\1>/giu)]
    .map(m => ({ tag: m[1].toLowerCase(), text: plain(m[2]), key: key(m[2]) }))
    .filter(b => b.key.length >= 24);
  const seen = new Map();
  for (const block of blocks) {
    if (seen.has(block.key)) failures.push(`${rel}: duplicate ${block.tag} content: “${block.text.slice(0, 100)}”`);
    else seen.set(block.key, block);
  }
  const title = plain((html.match(/<title>([\s\S]*?)<\/title>/i) || [,''])[1]);
  const description = (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)/i) || html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i) || [,''])[1];
  if (!title) failures.push(`${rel}: missing title`);
  if (!description || plain(description).length < 45) failures.push(`${rel}: missing or thin meta description`);
  pages.push({ rel, lang, title: key(title), description: key(description), paragraphs: blocks.filter(b => b.tag === 'p' && b.key.length >= 120) });
}

for (const lang of ['en','hu','de']) {
  const group = pages.filter(p => p.lang === lang && !p.rel.endsWith('404.html'));
  const titles = new Map();
  const descriptions = new Map();
  const paragraphs = new Map();
  for (const page of group) {
    if (page.title) {
      const other = titles.get(page.title);
      if (other) failures.push(`${page.rel}: duplicate title with ${other}`); else titles.set(page.title, page.rel);
    }
    if (page.description) {
      const other = descriptions.get(page.description);
      if (other) failures.push(`${page.rel}: duplicate meta description with ${other}`); else descriptions.set(page.description, page.rel);
    }
    for (const paragraph of page.paragraphs) {
      const other = paragraphs.get(paragraph.key);
      if (other && other !== page.rel) failures.push(`${page.rel}: substantial paragraph duplicated from ${other}: “${paragraph.text.slice(0, 110)}”`);
      else paragraphs.set(paragraph.key, page.rel);
    }
  }
}

for (const failure of failures) console.error('FAIL', failure);
console.log(`Content and structure audit checked ${files.length} HTML files across EN/HU/DE.`);
if (failures.length) process.exitCode = 1;
