import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const changed = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '_site', 'test-results', 'playwright-report'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) patch(full);
  }
}

function patch(file) {
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('G-90C452LJKQ')) return;
  if (html.includes("personalization_storage':'denied'")) return;

  const before = html;
  html = html.replace(
    "'analytics_storage':'denied','wait_for_update':500",
    "'analytics_storage':'denied','personalization_storage':'denied','wait_for_update':500"
  );

  if (html === before) {
    throw new Error(`GA-enabled page has an unexpected consent-default shape: ${path.relative(root, file)}`);
  }

  fs.writeFileSync(file, html);
  changed.push(path.relative(root, file));
}

walk(root);

if (!changed.length) {
  console.log('No consent personalization changes were needed.');
} else {
  console.log(`Added denied personalization_storage to ${changed.length} GA-enabled HTML files.`);
}
