import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pages = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'data'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) pages.push(full);
  }
}

function text(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|amp|quot|#39);/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function match(html, pattern) {
  return html.match(pattern)?.[1]?.replace(/\s+/g, ' ').trim() || '';
}

function classify(route) {
  if (/\/books\//.test(route)) return 'book';
  if (/\/exhibitions\//.test(route)) return 'exhibition';
  if (/community\.html$/.test(route)) return 'community';
  if (/writing\.html$/.test(route)) return 'writing';
  if (/press\.html$/.test(route)) return 'press';
  if (/curators\.html$/.test(route)) return 'curators';
  if (/csaladi-gyokerek\.html$/.test(route)) return 'family';
  if (/404\.html$/.test(route)) return 'utility';
  if (/index\.html$/.test(route)) return 'home';
  return 'other';
}

walk(root);

const records = [];
const descriptionOwners = new Map();
for (const file of pages.sort()) {
  const html = fs.readFileSync(file, 'utf8');
  const route = '/' + path.relative(root, file).replaceAll(path.sep, '/');
  const redirect = /http-equiv=["']refresh["']/i.test(html);
  const lang = match(html, /<html\b[^>]*\blang=["']([^"']+)["']/i) || 'unknown';
  const title = match(html, /<title>([\s\S]*?)<\/title>/i);
  const description = match(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  const h1 = match(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const visible = text(html);
  const type = classify(route);
  const issues = [];

  if (!redirect) {
    if (!title) issues.push('missing-title');
    if (!description) issues.push('missing-description');
    if (!h1) issues.push('missing-h1');
    if (description.length > 0 && description.length < 80) issues.push('short-description');
    if (/\b(?:a|az|egy|és|hogy|amit|amely)\.$/iu.test(description) || /(?:…|\.\.\.)$/.test(description)) issues.push('truncated-description');
    if (/^(?:BANHALMI|Books|Exhibitions|Press|Community|Writing|Curators)\s*(?:— BANHALMI)?$/i.test(title)) {
      issues.push('generic-title');
    }
    if (/A fotózás mindent megadott nekem, amim van\./i.test(visible)) issues.push('legacy-give-back-boilerplate');
    if (/Ki vagyok, honnan jövök, és mit keresek/i.test(visible)) issues.push('legacy-menu-copy');
    if (lang.startsWith('hu') && ['community', 'writing', 'press', 'curators'].includes(type)) {
      const hasArchiveRole = /archívum|életmű|dokumentáció|forrás|kurátor|publikáció|közösségi/i.test(visible);
      if (!hasArchiveRole) issues.push('missing-archive-role');
    }
  }

  if (description) {
    const owners = descriptionOwners.get(description) || [];
    owners.push(route);
    descriptionOwners.set(description, owners);
  }

  records.push({ route, lang, type, title, description, h1, redirect, wordCount: visible ? visible.split(' ').length : 0, issues });
}

for (const record of records) {
  const owners = descriptionOwners.get(record.description) || [];
  if (record.description && owners.length > 1) record.issues.push('duplicate-description');
}

const byLanguage = {};
const byType = {};
const issueCounts = {};
for (const record of records) {
  byLanguage[record.lang] = (byLanguage[record.lang] || 0) + 1;
  byType[record.type] = (byType[record.type] || 0) + 1;
  for (const issue of record.issues) issueCounts[issue] = (issueCounts[issue] || 0) + 1;
}

const report = {
  summary: {
    totalPages: records.length,
    pagesNeedingEditorialWork: records.filter((record) => record.issues.length).length,
    cleanPages: records.filter((record) => !record.issues.length).length,
    byLanguage,
    byType,
    issueCounts,
  },
  priority: records
    .filter((record) => record.issues.length)
    .sort((a, b) => {
      const hu = Number(b.lang.startsWith('hu')) - Number(a.lang.startsWith('hu'));
      if (hu) return hu;
      return b.issues.length - a.issues.length || a.route.localeCompare(b.route);
    }),
  pages: records,
};

fs.writeFileSync(path.join(root, 'content-coverage-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Inventoried ${report.summary.totalPages} public HTML files.`);
console.log(`${report.summary.pagesNeedingEditorialWork} page(s) still need editorial or metadata work; ${report.summary.cleanPages} passed this coverage inventory.`);
for (const [issue, count] of Object.entries(issueCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`- ${issue}: ${count}`);
}
