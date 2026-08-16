import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let changed = 0;
let htmlChanged = 0;

function writeIfChanged(file, before, after) {
  if (before === after) return false;
  fs.writeFileSync(file, after, 'utf8');
  changed += 1;
  return true;
}

function walk(dir = root) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '_site', 'artifacts'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) {
      const before = fs.readFileSync(full, 'utf8');
      const after = before.replaceAll('https://blog.banhalmi.art/lang=en-GB', 'https://blog.banhalmi.art/?lang=en-GB');
      if (writeIfChanged(full, before, after)) htmlChanged += 1;
    }
  }
}
walk();

for (const relative of ['redirects.json', 'vercel.json']) {
  const file = path.join(root, relative);
  const before = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(before);
  if (relative === 'redirects.json') {
    if (data.redirects?.['/blog/categories']) data.redirects['/blog/categories'] = 'https://blog.banhalmi.art/blog';
  } else {
    for (const rule of data.redirects || []) {
      if (rule.source === '/blog/categories') rule.destination = 'https://blog.banhalmi.art/blog';
    }
  }
  const after = `${JSON.stringify(data, null, 2)}\n`;
  writeIfChanged(file, before, after);
}

const optimizerPath = path.join(root, 'scripts/optimize-pages-artifact.mjs');
const optimizerBefore = fs.readFileSync(optimizerPath, 'utf8');
const marker = `    if (bundleCount !== 1) throw new Error(\`${'${rel}'}: production homepage must load exactly one blocking content-hashed CSS bundle; found ${'${bundleCount}'}.\`);`;
const insertion = `${marker}\n    const homepageBundleTag = html.match(/<link rel="stylesheet" href="\\/assets\\/css\\/bundles\\/art-[a-f0-9]{16}\\.css">/)?.[0];\n    if (!homepageBundleTag) throw new Error(\`${'${rel}'}: production homepage CSS bundle tag missing.\`);\n    html = html.replace(homepageBundleTag, '');\n    html = html.replace(/(<meta name="viewport"[^>]*>)/i, \`$1\\n${'${homepageBundleTag}'}\`);`;
let optimizerAfter = optimizerBefore;
if (!optimizerBefore.includes('const homepageBundleTag = html.match(')) {
  if (!optimizerBefore.includes(marker)) throw new Error('Homepage bundle contract marker not found in optimizer.');
  optimizerAfter = optimizerBefore.replace(marker, insertion);
}
writeIfChanged(optimizerPath, optimizerBefore, optimizerAfter);

console.log(`Audit remediation normalized ${htmlChanged} HTML files; ${changed} files changed in total.`);
