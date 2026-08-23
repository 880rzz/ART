import fs from 'node:fs';
import path from 'node:path';

export function hardenProductionArtifact(siteRoot) {
  const root = path.resolve(siteRoot || '_site');
  const forbidden = [
    '.github', 'tests', 'tools', 'scripts', 'docs', 'node_modules', 'reports',
    '.gitignore', '.DS_Store', 'package.json', 'package-lock.json', 'README.md',
    'netlify.toml', 'vercel.json', 'middleware.js',
    'playwright.config.js', 'playwright.config.mjs',
    'lighthouserc.mobile.cjs', 'lighthouserc.desktop.cjs',
    'lighthouserc.production-mobile.cjs', 'lighthouserc.production-desktop.cjs'
  ];

  for (const rel of forbidden) fs.rmSync(path.join(root, rel), { recursive: true, force: true });
  for (const rel of forbidden) {
    if (fs.existsSync(path.join(root, rel))) throw new Error(`ART production artifact leaked repository-only path: ${rel}`);
  }

  const required = [
    'index.html', 'hu/index.html', 'de-at/index.html', 'CNAME', '.nojekyll',
    'robots.txt', 'sitemap.xml', 'llms.txt', 'ai.txt', '.well-known/agent.json',
    'assets/css/site.css', 'assets/img/responsive/portrait-circle-480.webp',
    'assets/img/responsive/portrait-circle-720.webp'
  ];
  for (const rel of required) {
    if (!fs.existsSync(path.join(root, rel))) throw new Error(`ART production artifact lost required public file: ${rel}`);
  }

  return { forbidden: forbidden.length, required: required.length };
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith(path.join('scripts', 'harden-production-artifact.mjs'))) {
  const result = hardenProductionArtifact(process.argv[2] || '_site');
  console.log(`ART production surface hardened: ${result.forbidden} repository-only paths excluded; ${result.required} public contracts present.`);
}
