#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const skip = new Set(['.git', 'node_modules', 'dist', 'build', '.cache']);
const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && /\.html?$/i.test(entry.name)) htmlFiles.push(full);
  }
}
walk(root);

let changedFiles = 0;
let placeholders = 0;
let dialogs = 0;
let scriptContracts = 0;

for (const file of htmlFiles) {
  const original = fs.readFileSync(file, 'utf8');
  let html = original;

  html = html.replace(/<div id="lb" role="dialog" aria-modal="true"(?![^>]*\baria-hidden=)/g, (match) => {
    dialogs += 1;
    return `${match} aria-hidden="true"`;
  });

  html = html.replace(/<figure><img src="\/assets\/img\/favicon\.svg" alt="">/g, () => {
    placeholders += 1;
    return '<figure><img src="/assets/img/favicon.svg" alt="" aria-hidden="true" data-lightbox-placeholder>';
  });

  const oldShow = "img.src=m.currentSrc||m.src;img.alt=m.alt||'';}";
  const newShow = "img.src=m.currentSrc||m.src;img.alt=m.alt||'';img.removeAttribute('aria-hidden');}";
  const oldOpen = "function open(i){show(i);lb.classList.add('open');document.body.style.overflow='hidden';}";
  const newOpen = "function open(i){show(i);lb.classList.add('open');lb.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}";
  const oldClose = "function close(){lb.classList.remove('open');document.body.style.overflow='';}";
  const newClose = "function close(){lb.classList.remove('open');lb.setAttribute('aria-hidden','true');img.setAttribute('aria-hidden','true');document.body.style.overflow='';}";

  if (html.includes(oldShow) && html.includes(oldOpen) && html.includes(oldClose)) {
    html = html.replace(oldShow, newShow).replace(oldOpen, newOpen).replace(oldClose, newClose);
    scriptContracts += 1;
  }

  if (html !== original) {
    fs.writeFileSync(file, html, 'utf8');
    changedFiles += 1;
  }
}

const expected = 84;
if (placeholders !== expected || dialogs !== expected || scriptContracts !== expected || changedFiles !== expected) {
  throw new Error(`Expected ${expected} complete lightbox upgrades; got placeholders=${placeholders}, dialogs=${dialogs}, scripts=${scriptContracts}, changedFiles=${changedFiles}`);
}

const testPath = path.join(root, 'tests', 'audit-lightbox-accessibility-stage28.mjs');
fs.writeFileSync(testPath, `import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const skip = new Set(['.git', 'node_modules', 'dist', 'build', '.cache']);
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && /\\.html?$/i.test(entry.name)) files.push(full);
  }
}
walk(root);

const errors = [];
let lightboxes = 0;
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('id="lb"')) continue;
  lightboxes += 1;
  const rel = path.relative(root, file).replaceAll('\\\\', '/');
  if (!/<div id="lb"[^>]*aria-hidden="true"/.test(html)) errors.push(rel + ': lightbox dialog must start aria-hidden');
  if (!/<img src="\\/assets\\/img\\/favicon\\.svg" alt="" aria-hidden="true" data-lightbox-placeholder>/.test(html)) errors.push(rel + ': placeholder must be explicitly hidden');
  for (const contract of [
    "img.removeAttribute('aria-hidden')",
    "lb.setAttribute('aria-hidden','false')",
    "lb.setAttribute('aria-hidden','true')",
    "img.setAttribute('aria-hidden','true')"
  ]) if (!html.includes(contract)) errors.push(rel + ': missing runtime contract ' + contract);
}
if (lightboxes !== 84) errors.push('Expected 84 lightbox pages, found ' + lightboxes);
if (errors.length) { for (const error of errors) console.error('ERROR ' + error); process.exit(1); }
console.log('Lightbox accessibility audit passed (' + lightboxes + ' pages).');
`, 'utf8');

const packagePath = path.join(root, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const command = 'node tests/audit-lightbox-accessibility-stage28.mjs';
if (!packageJson.scripts.test.includes(command)) packageJson.scripts.test += ' && ' + command;
packageJson.scripts['test:lightbox-accessibility'] = command;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

console.log(`Upgraded ${changedFiles} shared lightbox instances.`);
