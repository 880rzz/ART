import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dataPath = path.join(root, 'data/archive/oeuvre-relations.hu.json');
const graph = JSON.parse(await readFile(dataPath, 'utf8'));

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function relativeHref(fromPath, toPath) {
  const fromDir = path.posix.dirname(fromPath);
  const relative = path.posix.relative(fromDir, toPath);
  return relative || path.posix.basename(toPath);
}

function relatedBlock(record, currentPath) {
  const links = record.pages
    .filter((page) => page.path !== currentPath)
    .map((page) => `<li><a href="${relativeHref(currentPath, page.path)}">${escapeHtml(page.label)}</a><span class="archive-relation-type">${escapeHtml(page.type)}</span></li>`)
    .join('\n        ');

  const status = graph.statusLabels[record.status];
  return `<!-- oeuvre-relations:start:${record.id} -->
<section class="archive-relations tone-a" aria-labelledby="archive-relations-${record.id}">
  <div class="wrap">
    <p class="label">Életmű-kapcsolatok</p>
    <h2 id="archive-relations-${record.id}">${escapeHtml(record.title)}</h2>
    <p class="archive-status" data-archive-status="${record.status}">${escapeHtml(status)}</p>
    <p class="lead">${escapeHtml(record.summary)}</p>
    ${links ? `<h3>Kapcsolódó archívumi rekordok</h3>\n    <ul class="archive-relation-list">\n        ${links}\n    </ul>` : ''}
  </div>
</section>
<!-- oeuvre-relations:end:${record.id} -->`;
}

function insertOrReplace(html, record, currentPath) {
  const start = `<!-- oeuvre-relations:start:${record.id} -->`;
  const end = `<!-- oeuvre-relations:end:${record.id} -->`;
  const block = relatedBlock(record, currentPath);

  if (html.includes(start) && html.includes(end)) {
    const pattern = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    return html.replace(pattern, block);
  }

  const footerIndex = html.indexOf('<footer');
  if (footerIndex === -1) throw new Error(`${currentPath}: nem található a lábléc beszúrási pontja.`);
  return `${html.slice(0, footerIndex)}${block}\n\n${html.slice(footerIndex)}`;
}

const changed = [];
for (const record of graph.records) {
  for (const page of record.pages) {
    const file = path.join(root, page.path);
    let html;
    try {
      html = await readFile(file, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') throw new Error(`Hiányzó kapcsolati céloldal: ${page.path}`);
      throw error;
    }

    let next = insertOrReplace(html, record, page.path);

    if (record.status === 'in-development') {
      next = next
        .replace(/<meta name="description" content="([^"]*)">/, (match, description) => description.includes('Fejlesztés alatt') ? match : `<meta name="description" content="Fejlesztés alatt. ${description}">`)
        .replace(/<meta property="og:description" content="([^"]*)">/, (match, description) => description.includes('Fejlesztés alatt') ? match : `<meta property="og:description" content="Fejlesztés alatt. ${description}">`)
        .replace(/<meta name="twitter:description" content="([^"]*)">/, (match, description) => description.includes('Fejlesztés alatt') ? match : `<meta name="twitter:description" content="Fejlesztés alatt. ${description}">`);
    }

    if (next !== html) {
      await writeFile(file, next, 'utf8');
      changed.push(page.path);
    }
  }
}

console.log(JSON.stringify({ changed, records: graph.records.length }, null, 2));
