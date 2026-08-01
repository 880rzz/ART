import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { requireExplicitRun } from './lib/one-time-migration.mjs';
requireExplicitRun('integrate-secondary-pages', 'Renames a menu entry, breaking navigation parity across languages.');

const root = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(await readFile(path.join(root, 'data/archive/secondary-pages.hu.json'), 'utf8'));

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await htmlFiles(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function replaceRequired(html, oldValue, newValue, label, file) {
  if (html.includes(newValue)) return html;
  if (!html.includes(oldValue)) throw new Error(`${file}: nem található a cserélendő ${label}`);
  return html.replaceAll(oldValue, newValue);
}

function replaceMeta(html, selector, value, file) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(<meta ${escaped} content=")[^"]*(">)`);
  if (!pattern.test(html)) throw new Error(`${file}: hiányzó meta ${selector}`);
  return html.replace(pattern, `$1${value}$2`);
}

function replaceTitle(html, value, file) {
  if (!/<title>[\s\S]*?<\/title>/.test(html)) throw new Error(`${file}: hiányzó title`);
  return html.replace(/<title>[\s\S]*?<\/title>/, `<title>${value}</title>`);
}

function replaceSchemaField(html, field, oldValue, newValue) {
  if (!oldValue || !newValue || oldValue === newValue || html.includes(`"${field}":"${newValue}"`)) return html;
  return html.replace(`"${field}":"${oldValue}"`, `"${field}":"${newValue}"`);
}

const huFiles = await htmlFiles(path.join(root, 'hu'));
const changed = [];

for (const file of huFiles) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const original = await readFile(file, 'utf8');
  let next = original;

  for (const item of data.globalMenuReplacements) {
    if (next.includes(item.old)) next = next.replaceAll(item.old, item.new);
  }

  const page = data.pages[rel];
  if (page) {
    const previousTitle = original.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
    const previousDescription = original.match(/<meta name="description" content="([^"]*)">/)?.[1] || '';
    const previousOgTitle = original.match(/<meta property="og:title" content="([^"]*)">/)?.[1] || '';
    const previousOgDescription = original.match(/<meta property="og:description" content="([^"]*)">/)?.[1] || '';
    const previousImageAlt = original.match(/<meta property="og:image:alt" content="([^"]*)">/)?.[1] || '';

    next = replaceTitle(next, page.title, rel);
    next = replaceMeta(next, 'name="description"', page.description, rel);
    next = replaceMeta(next, 'property="og:title"', page.ogTitle, rel);
    next = replaceMeta(next, 'property="og:description"', page.ogDescription, rel);
    next = replaceMeta(next, 'property="og:image:alt"', page.imageAlt, rel);

    next = replaceSchemaField(next, 'name', previousTitle.replace(/\s+[—·|].*$/, ''), page.schemaName);
    next = replaceSchemaField(next, 'description', previousDescription, page.schemaDescription || page.description);
    next = replaceSchemaField(next, 'description', previousOgDescription, page.schemaDescription || page.description);
    next = replaceSchemaField(next, 'name', previousOgTitle.replace(/\s+[—·|].*$/, ''), page.schemaName);
    if (previousImageAlt && previousImageAlt !== page.imageAlt) next = next.replaceAll(previousImageAlt, page.imageAlt);
    if (page.leadOld && page.leadNew) next = replaceRequired(next, page.leadOld, page.leadNew, 'bevezető szöveg', rel);
  }

  if (next !== original) {
    await writeFile(file, next, 'utf8');
    changed.push(rel);
  }
}

console.log(JSON.stringify({ changed }, null, 2));
