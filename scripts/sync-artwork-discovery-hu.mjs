import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const registry = JSON.parse(await readFile(path.join(root, 'data/archive/artwork-registry.hu.json'), 'utf8'));
const sitemapPath = path.join(root, 'sitemap.xml');
let sitemap = await readFile(sitemapPath, 'utf8');

const closingTag = '</urlset>';
if (!sitemap.includes(closingTag)) throw new Error('A sitemap.xml nem szabályos urlset dokumentum.');

for (const record of registry.records) {
  const entry = `<url><loc>${record.url}</loc><lastmod>2026-07-30</lastmod><changefreq>monthly</changefreq></url>`;
  if (!sitemap.includes(`<loc>${record.url}</loc>`)) {
    sitemap = sitemap.replace(closingTag, `${entry}\n${closingTag}`);
  }

  if (record.project === 'https://www.banhalmi.art/hu/projects/euforia#project') {
    const projectPath = path.join(root, 'hu/exhibitions/euforia.html');
    let projectHtml = await readFile(projectPath, 'utf8');
    const href = new URL(record.url).pathname;
    if (!projectHtml.includes(href)) {
      const link = `<p class="archive-related-work"><a href="${href}">Kapcsolódó műtárgyrekord: ${record.title}</a></p>`;
      projectHtml = projectHtml.replace('</main>', `${link}\n</main>`);
      await writeFile(projectPath, projectHtml, 'utf8');
    }
  }
}

await writeFile(sitemapPath, sitemap, 'utf8');
console.log(`✓ ${registry.records.length} műtárgyoldal discovery-kapcsolatai szinkronizálva`);
