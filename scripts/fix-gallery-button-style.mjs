import fs from 'node:fs';

const pages = ['index.html', 'hu/index.html', 'de-at/index.html'];
const before = '.gal-more-btn{cursor:pointer;font:inherit}';
const after = '.gal-more-btn{cursor:pointer;font:inherit;background:transparent;color:var(--gold);appearance:none;-webkit-appearance:none}';

for (const path of pages) {
  let html = fs.readFileSync(path, 'utf8');
  if (!html.includes(before) && !html.includes(after)) {
    throw new Error(`Gallery button style rule not found in ${path}`);
  }
  html = html.replace(before, after);
  fs.writeFileSync(path, html);
}

console.log('Normalised gallery button appearance on all three homepages.');
