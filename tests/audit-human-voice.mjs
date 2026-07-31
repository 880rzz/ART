import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}

function decode(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function visibleText(html) {
  return decode(html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

const patterns = [
  ['more-than', /\bmore than\b/gi], ['not-just', /\bnot just\b/gi], ['not-only', /\bnot only\b/gi],
  ['every', /\bevery\b/gi], ['journey', /\bjourney\b/gi], ['timeless', /\btimeless\b/gi],
  ['authentic', /\bauthentic\b/gi], ['unique', /\bunique\b/gi], ['discover', /\bdiscover\b/gi],
  ['Mehr-als', /\bmehr als\b/gi], ['nicht-nur', /\bnicht nur\b/gi], ['authentisch', /\bauthentisch\w*\b/gi],
  ['einzigartig', /\beinzigartig\w*\b/gi], ['több-mint', /\btöbb mint\b/gi], ['nem-csak', /\bnem csak\b/gi],
  ['autentikus', /\bautentikus\w*\b/gi], ['egyedi', /\begyedi\w*\b/gi], ['minden', /\bminden\b/gi]
];

function sentenceStats(text) {
  const sentences = text.split(/(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÖŐÚÜŰÄÖÜ])/u).map((s) => s.trim()).filter((s) => s.length >= 18);
  const lengths = sentences.map((s) => s.split(/\s+/).length);
  if (!lengths.length) return { count: 0, average: 0, spread: 0, starts: [] };
  const average = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const spread = Math.sqrt(lengths.reduce((sum, n) => sum + ((n - average) ** 2), 0) / lengths.length);
  const starts = new Map();
  for (const sentence of sentences) {
    const start = sentence.toLocaleLowerCase().split(/\s+/).slice(0, 3).join(' ');
    starts.set(start, (starts.get(start) || 0) + 1);
  }
  return {
    count: sentences.length,
    average: Number(average.toFixed(1)),
    spread: Number(spread.toFixed(1)),
    starts: [...starts.entries()].filter(([, count]) => count >= 3).sort((a, b) => b[1] - a[1]).slice(0, 6)
  };
}

walk(root);
const reports = [];
for (const file of files) {
  const text = visibleText(fs.readFileSync(file, 'utf8'));
  if (text.length < 180) continue;
  const words = text.split(/\s+/).length;
  const cliches = {};
  let total = 0;
  for (const [name, regex] of patterns) {
    const count = (text.match(regex) || []).length;
    if (count) cliches[name] = count;
    total += count;
  }
  const stats = sentenceStats(text);
  const density = words ? total / words * 1000 : 0;
  const monotony = stats.count >= 8 && stats.spread < 6 ? 3 : stats.count >= 8 && stats.spread < 9 ? 1 : 0;
  const repeatedStarts = stats.starts.reduce((sum, [, count]) => sum + count - 2, 0);
  reports.push({
    file: '/' + path.relative(root, file).replaceAll(path.sep, '/'),
    words,
    score: Number((density + monotony + repeatedStarts).toFixed(2)),
    cliches,
    sentenceAverage: stats.average,
    sentenceSpread: stats.spread,
    repeatedStarts: stats.starts
  });
}

reports.sort((a, b) => b.score - a.score || b.words - a.words);
console.log(`Human-voice audit: ${reports.length} content pages checked.`);
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), highestRisk: reports.slice(0, 40), pages: reports }, null, 2));
