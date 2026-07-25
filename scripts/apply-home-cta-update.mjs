import fs from 'node:fs';

const pages = [
  {
    path: 'index.html',
    after: '<a class="btn" href="#exhibitions">Exhibitions</a>',
    service: '<a class="btn" href="https://www.norbertbanhalmi.com/#services">Services</a>'
  },
  {
    path: 'hu/index.html',
    after: '<a class="btn" href="#exhibitions">Kiállítások</a>',
    service: '<a class="btn" href="https://www.norbertbanhalmi.com/hu/#services">Szolgáltatások</a>'
  },
  {
    path: 'de-at/index.html',
    after: '<a class="btn" href="#exhibitions">Ausstellungen</a>',
    service: '<a class="btn" href="https://www.norbertbanhalmi.com/de-at/#services">Leistungen</a>'
  }
];

for (const page of pages) {
  let html = fs.readFileSync(page.path, 'utf8');

  if (!html.includes(page.service)) {
    if (!html.includes(page.after)) {
      throw new Error(`Hero CTA anchor not found in ${page.path}`);
    }
    html = html.replace(page.after, `${page.after}\n      ${page.service}`);
  }

  html = html.replace(/<button([^>]*\bid=["']galmore["'][^>]*)>/i, (match, attrs) => {
    const classMatch = attrs.match(/\bclass=["']([^"']*)["']/i);
    if (classMatch) {
      const classes = new Set(classMatch[1].split(/\s+/).filter(Boolean));
      classes.add('btn');
      const replacement = `class="${[...classes].join(' ')}"`;
      return `<button${attrs.replace(classMatch[0], replacement)}>`;
    }
    return `<button${attrs} class="btn">`;
  });

  fs.writeFileSync(page.path, html);
}

console.log('Updated hero service CTAs and gallery buttons on all three homepages.');
