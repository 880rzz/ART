import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dataPath = path.join(root, 'data/archive/oeuvre-relations.hu.json');
const graph = JSON.parse(await readFile(dataPath, 'utf8'));

const relationStyles = `<style id="archive-relations-style">
.archive-relations{border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.archive-relations .wrap{max-width:980px}
.archive-status{display:inline-flex;align-items:center;gap:.5rem;margin:.35rem 0 1.25rem;padding:.42rem .78rem;border:1px solid var(--gold);border-radius:999px;color:var(--gold);font-size:.78rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
.archive-status::before{content:"";width:.45rem;height:.45rem;border-radius:50%;background:currentColor}
.archive-relations h3{margin-top:2rem;font-size:1rem;letter-spacing:.02em}
.archive-relation-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem 1.25rem;margin:1rem 0 0;padding:0;list-style:none}
.archive-relation-list li{border-top:1px solid var(--line);padding:.85rem 0;display:flex;justify-content:space-between;gap:1rem;align-items:baseline}
.archive-relation-list a{color:var(--ink);font-weight:600}
.archive-relation-type{color:var(--ink-soft);font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
@media(max-width:680px){.archive-relation-list{grid-template-columns:1fr}.archive-relation-list li{align-items:flex-start}.archive-relation-type{white-space:normal}}
</style>`;

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

function typeLabel(type) {
  return ({ book: 'Könyv', exhibition: 'Kiállítás', project: 'Projekt', work: 'Mű' })[type] || type;
}

function relatedBlock(record, currentPath) {
  const links = record.pages
    .filter((page) => page.path !== currentPath)
    .map((page) => `<li><a href="${relativeHref(currentPath, page.path)}">${escapeHtml(page.label)}</a><span class="archive-relation-type">${escapeHtml(typeLabel(page.type))}</span></li>`)
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

function ensureStyles(html) {
  if (html.includes('id="archive-relations-style"')) return html;
  const headEnd = html.indexOf('</head>');
  if (headEnd === -1) throw new Error('Nem található a dokumentum fejrészének vége.');
  return `${html.slice(0, headEnd)}${relationStyles}\n${html.slice(headEnd)}`;
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

function repairEuforiaStructuredData(html) {
  let next = html;
  const falseLocation = /"location":\{"@type":"Place","name":"Tisztelgés Robert Capa szellemisége előtt · 20 alkotás · Készül 2026\. március – 2027\. szeptember","address":\{"@type":"PostalAddress","addressCountry":"HU"\}\},/;
  next = next.replace(falseLocation, '');
  next = next.replace(
    '"eventStatus":"https://schema.org/EventScheduled"',
    '"eventStatus":"https://schema.org/EventScheduled","eventAttendanceMode":"https://schema.org/OfflineEventAttendanceMode"',
  );
  next = next.replace(
    '"headline":"EUFÓRIA — a Jelenlét anatómiája"',
    '"headline":"EUFÓRIA — a Jelenlét anatómiája","additionalType":"https://schema.org/CreativeWork","keywords":["fejlesztés alatt","fotóművészeti projekt","tervezett kiállítás"]',
  );
  return next;
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

    let next = ensureStyles(insertOrReplace(html, record, page.path));

    if (record.status === 'in-development') {
      next = next
        .replace(/<meta name="description" content="([^"]*)">/, (match, description) => description.includes('Fejlesztés alatt') ? match : `<meta name="description" content="Fejlesztés alatt. ${description}">`)
        .replace(/<meta property="og:description" content="([^"]*)">/, (match, description) => description.includes('Fejlesztés alatt') ? match : `<meta property="og:description" content="Fejlesztés alatt. ${description}">`)
        .replace(/<meta name="twitter:description" content="([^"]*)">/, (match, description) => description.includes('Fejlesztés alatt') ? match : `<meta name="twitter:description" content="Fejlesztés alatt. ${description}">`);
      if (record.id === 'euforia') next = repairEuforiaStructuredData(next);
    }

    if (next !== html) {
      await writeFile(file, next, 'utf8');
      changed.push(page.path);
    }
  }
}

console.log(JSON.stringify({ changed, records: graph.records.length }, null, 2));