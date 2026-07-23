import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const allowed = new Set(['.html', '.json', '.jsonld', '.txt', '.xml', '.md']);
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (allowed.has(path.extname(entry.name).toLowerCase())) files.push(full);
  }
}

walk(root);

const oldWkoUrls = [
  'https://firmen.wko.at/norbert-banhalmi-executive-portr%C3%A4t-und-visuelle-positionieru/wien/',
  'https://firmen.wko.at/norbert-banhalmi-executive-porträt-und-visuelle-positionieru/wien/',
  'https://firmen.wko.at/norbert-banhalmi-executive-portr%C3%A4t-und-visuelle-positionieru/wien'
];
const newWkoUrl = 'https://firmen.wko.at/norbert-banhalmi-visuelle-strategische-partnerschaft-für-führungskräfte/wien/?firmaid=12bd142c-5fcf-4457-9a90-47fbff162b40';

const replacements = [
  ...oldWkoUrls.map((url) => [url, newWkoUrl]),
  ['hreflang="hu"', 'hreflang="hu-HU"'],
  ["hreflang='hu'", "hreflang='hu-HU'"],
  ['Nemzetközi fotográfiai és vizuális brandstratégiai műhely Bécs és Budapest között.', 'A BANHALMI Bánhalmi Norbert fotográfiai és művészeti praxisa, valamint a norbertbanhalmi.com oldalon kínált stratégiai vizuális partnerség művészeti alapja. Az 1999 óta épülő könyvek, kiállítások, portréprojektek és kurátori munka üzleti eredménye a vizuális bizalom.'],
  ['International photographic and visual brand strategy studio between Vienna and Budapest.', 'BANHALMI is the photographic and artistic practice of Norbert Bánhalmi and the artistic foundation of the strategic visual partnership offered through norbertbanhalmi.com. Books, exhibitions, portrait projects and curatorial work developed since 1999 support one professional outcome: visual trust.'],
  ['Internationales Fotografie- und Visual-Branding-Studio zwischen Wien und Budapest.', 'BANHALMI ist die fotografische und künstlerische Praxis von Norbert Bánhalmi und die künstlerische Grundlage der strategischen visuellen Partnerschaft auf norbertbanhalmi.com. Bücher, Ausstellungen, Porträtprojekte und kuratorische Arbeit seit 1999 führen zu einem professionellen Ergebnis: visuelles Vertrauen.']
];

let changed = 0;
for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  const before = text;
  for (const [from, to] of replacements) text = text.replaceAll(from, to);
  if (text !== before) {
    fs.writeFileSync(file, text);
    changed += 1;
  }
}

console.log(`Aligned BANHALMI ecosystem references in ${changed} file(s).`);
