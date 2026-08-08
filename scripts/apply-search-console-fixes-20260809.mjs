import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const today = '2026-08-09';
const personId = 'https://www.norbertbanhalmi.com/about/';

function patchJsonLd(html, file) {
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
  const m = html.match(re);
  if (!m) throw new Error(`${file}: missing JSON-LD`);
  const data = JSON.parse(m[1]);
  const graph = Array.isArray(data['@graph']) ? data['@graph'] : [];
  const profile = graph.find(n => n && (n['@type'] === 'ProfilePage' || (Array.isArray(n['@type']) && n['@type'].includes('ProfilePage'))));
  if (!profile) throw new Error(`${file}: missing ProfilePage node`);
  profile.mainEntity = { '@id': personId };
  profile.dateModified = today;
  return html.replace(re, `<script type="application/ld+json">${JSON.stringify(data)}</script>`);
}

for (const file of ['writing.html', 'hu/writing.html', 'de-at/writing.html']) {
  const full = path.join(root, file);
  const html = await readFile(full, 'utf8');
  await writeFile(full, patchJsonLd(html, file), 'utf8');
}

// A real English alias for hosts that do not execute Vercel/Netlify redirect rules (notably GitHub Pages).
const rootIndex = await readFile(path.join(root, 'index.html'), 'utf8');
let enAlias = rootIndex;
if (!/<base\b/i.test(enAlias)) enAlias = enAlias.replace(/<head>/i, '<head>\n<base href="/">');
enAlias = enAlias.replace(/<meta name="robots"[^>]*>/i, '<meta name="robots" content="index, follow, max-image-preview:large">');
enAlias = enAlias.replace('</head>', '<!-- /en/ is a compatibility alias; canonical English URL remains /. -->\n</head>');
await mkdir(path.join(root, 'en'), { recursive: true });
await writeFile(path.join(root, 'en/index.html'), enAlias, 'utf8');

// Physical legacy profile route for GitHub Pages. It deliberately contains no stale Person/Profile schema.
const legacy = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Norbert Bánhalmi — profile moved</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://www.norbertbanhalmi.com/about/"><meta http-equiv="refresh" content="0; url=https://www.norbertbanhalmi.com/about/"><script>window.location.replace("https://www.norbertbanhalmi.com/about/");</script></head><body><main><p>This profile has moved to <a href="https://www.norbertbanhalmi.com/about/">norbertbanhalmi.com/about/</a>.</p></main></body></html>`;
await mkdir(path.join(root, 'norbert-banhalmi'), { recursive: true });
await writeFile(path.join(root, 'norbert-banhalmi/index.html'), legacy, 'utf8');

// Keep redirect-capable hosts aligned too.
const redirectsPath = path.join(root, '_redirects');
let redirects = await readFile(redirectsPath, 'utf8');
if (!/^\/en\s+/m.test(redirects)) redirects = redirects.replace('# Exact legacy URLs: content-equivalent permanent destinations', '# Exact legacy URLs: content-equivalent permanent destinations\n/en  /  301\n/en/  /  301');
await writeFile(redirectsPath, redirects, 'utf8');

const vercelPath = path.join(root, 'vercel.json');
const vercel = JSON.parse(await readFile(vercelPath, 'utf8'));
if (!vercel.redirects.some(r => r.source === '/en')) vercel.redirects.unshift({ source: '/en', destination: '/', permanent: true });
if (!vercel.redirects.some(r => r.source === '/en/')) vercel.redirects.unshift({ source: '/en/', destination: '/', permanent: true });
await writeFile(vercelPath, JSON.stringify(vercel, null, 2) + '\n', 'utf8');

// Lighthouse link-in-text-block: consent/privacy links must have a non-colour affordance.
const cssPath = path.join(root, 'assets/css/museum-editorial.css');
let css = await readFile(cssPath, 'utf8');
const marker = '/* Search Console / Lighthouse: consent links must not rely on colour alone. */';
if (!css.includes(marker)) css += `\n\n${marker}\n#consent a, [id*="consent"] a, .consent a, .privacy-note a {\n  text-decoration-line: underline;\n  text-decoration-thickness: max(1px, 0.08em);\n  text-underline-offset: 0.16em;\n}\n`;
await writeFile(cssPath, css, 'utf8');

// Retire any genuinely stale inline dateModified left in legacy HTML.
let stale = 0;
async function walk(dir) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '_site'].includes(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) await walk(full);
    else if (ent.name.endsWith('.html')) {
      const src = await readFile(full, 'utf8');
      if (src.includes('2026-07-14') && /dateModified/.test(src)) {
        await writeFile(full, src.replaceAll('"dateModified":"2026-07-14"', `"dateModified":"${today}"`), 'utf8');
        stale++;
      }
    }
  }
}
await walk(root);
console.log(`Updated stale dateModified HTML files: ${stale}`);

// Version the changed shared CSS and propagate the new release URL across all pages.
const releasePath = path.join(root, 'data/design-release.json');
const releaseData = JSON.parse(await readFile(releasePath, 'utf8'));
releaseData.release = '20260809-search-console-a11y-v66';
await writeFile(releasePath, JSON.stringify(releaseData, null, 2) + '\n', 'utf8');

// Add a permanent regression contract and wire it into npm test.
const test = `import assert from 'node:assert/strict';\nimport { readFile } from 'node:fs/promises';\n\nconst personId='https://www.norbertbanhalmi.com/about/';\nfor (const file of ['writing.html','hu/writing.html','de-at/writing.html']) {\n  const html=await readFile(file,'utf8');\n  const m=html.match(/<script type=\\"application\\/ld\\+json\\">([\\s\\S]*?)<\\/script>/);\n  assert.ok(m, file+' JSON-LD');\n  const data=JSON.parse(m[1]);\n  const p=data['@graph'].find(n=>n['@type']==='ProfilePage'||(Array.isArray(n['@type'])&&n['@type'].includes('ProfilePage')));\n  assert.equal(p?.mainEntity?.['@id'],personId,file+' mainEntity');\n}\nconst en=await readFile('en/index.html','utf8');\nassert.match(en,/<base href=\\"\\/\\">/);\nassert.match(en,/<meta name=\\"robots\\" content=\\"index, follow, max-image-preview:large\\">/);\nassert.match(en,/<link rel=\\"canonical\\" href=\\"https:\\/\\/www\\.banhalmi\\.art\\/\\">/);\nconst legacy=await readFile('norbert-banhalmi/index.html','utf8');\nassert.doesNotMatch(legacy,/dateModified|application\\/ld\\+json/);\nconst css=await readFile('assets/css/museum-editorial.css','utf8');\nassert.match(css,/#consent a[\\s\\S]*text-decoration-line:\\s*underline/);\nconst vercel=JSON.parse(await readFile('vercel.json','utf8'));\nassert.ok(vercel.redirects.some(r=>r.source==='/en'&&r.destination==='/'));\nconsole.log('Search Console/schema/accessibility regression contract: OK');\n`;
await writeFile(path.join(root, 'tests/audit-search-console-stage49.mjs'), test, 'utf8');

const packagePath = path.join(root, 'package.json');
const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
if (!pkg.scripts.test.includes('audit-search-console-stage49.mjs')) pkg.scripts.test += ' && node tests/audit-search-console-stage49.mjs';
pkg.scripts['test:search-console'] = 'node tests/audit-search-console-stage49.mjs';
await writeFile(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

console.log('Search Console, writing schema, /en alias and consent accessibility fixes prepared.');
