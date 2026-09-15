import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const OLD_LEGAL = 'Norbert Banhalmi e.U.';
const NEW_LEGAL = 'Banhalmi Norbert e.U.';
const excludedDirs = new Set(['.git', 'node_modules', '_site', 'dist', 'coverage', '.netlify', '.github', 'docs', 'tests', 'tools', 'scripts']);
const runtimeExts = new Set(['.html', '.json', '.jsonld', '.txt', '.xml']);
const changed = [];

function writeIfChanged(rel, next) {
  const file = path.join(root, rel);
  const before = fs.readFileSync(file, 'utf8');
  if (before === next) return false;
  fs.writeFileSync(file, next, 'utf8');
  changed.push(rel);
  return true;
}

function walkRuntime(dir = root) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkRuntime(full);
    else if (entry.isFile()) {
      const rel = path.relative(root, full).replaceAll(path.sep, '/');
      const ext = path.extname(entry.name).toLowerCase();
      if (!runtimeExts.has(ext) && rel !== 'README.md') continue;
      const before = fs.readFileSync(full, 'utf8');
      if (!before.includes(OLD_LEGAL)) continue;
      fs.writeFileSync(full, before.replaceAll(OLD_LEGAL, NEW_LEGAL), 'utf8');
      changed.push(rel);
    }
  }
}

function replaceRequired(rel, from, to) {
  const file = path.join(root, rel);
  const before = fs.readFileSync(file, 'utf8');
  if (!before.includes(from)) throw new Error(`${rel}: required source token not found: ${from}`);
  writeIfChanged(rel, before.replaceAll(from, to));
}

function updateJson(rel, mutate) {
  const file = path.join(root, rel);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  mutate(data);
  writeIfChanged(rel, `${JSON.stringify(data, null, 2)}\n`);
}

function setHeadDescription(rel, description) {
  const file = path.join(root, rel);
  let html = fs.readFileSync(file, 'utf8');
  const replacements = [
    [/(<meta name="description" content=")[^"]*(">)/i, `$1${description}$2`],
    [/(<meta property="og:description" content=")[^"]*(">)/i, `$1${description}$2`],
    [/(<meta name="twitter:description" content=")[^"]*(">)/i, `$1${description}$2`]
  ];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(html)) html = html.replace(pattern, replacement);
  }
  writeIfChanged(rel, html);
}

walkRuntime();

replaceRequired(
  'tests/audit-inline-schema-consistency.mjs',
  "const canonicalOrganizationLegalName = 'Norbert Banhalmi e.U.';",
  "const canonicalOrganizationLegalName = 'Banhalmi Norbert e.U.';"
);
replaceRequired(
  'tests/audit-ecosystem-alignment.mjs',
  "bridgeOrganization?.name === 'BANHALMI' && bridgeOrganization?.legalName === 'Norbert Banhalmi e.U.'",
  "bridgeOrganization?.name === 'BANHALMI' && bridgeOrganization?.legalName === 'Banhalmi Norbert e.U.'"
);

updateJson('data/machine-core.json', (core) => {
  core.schemaVersion = '1.5';
  core.evidence.artisticNudeAuthority = 'https://www.banhalmi.art/exhibitions/themensdream.html';
  core.evidence.artisticNudeEditorialContext = 'https://blog.banhalmi.art/blog/categories/aktfotozas-muveszi-szemmel';
  core.archiveRoutes.artisticNude = 'https://www.banhalmi.art/exhibitions/themensdream.html';
  const rule = 'The Men’s Dream (2022) is the canonical ART archive route for artistic-nude/fine-art-nude oeuvre context; editorial history remains on blog.banhalmi.art and current commissions remain on norbertbanhalmi.com.';
  if (!core.disambiguationRules.includes(rule)) core.disambiguationRules.splice(6, 0, rule);
});

updateJson('ecosystem-bridge.json', (bridge) => {
  bridge.schemaVersion = '2026-09-15-v9';
  bridge.dateModified = '2026-09-15T11:30:00+02:00';
  const fineArt = bridge.commercialFineArtBridge;
  fineArt.artisticAuthorityRoutes = {
    en: 'https://www.banhalmi.art/exhibitions/themensdream.html',
    hu: 'https://www.banhalmi.art/hu/exhibitions/themensdream.html',
    'de-AT': 'https://www.banhalmi.art/de-at/exhibitions/themensdream.html'
  };
  fineArt.editorialContext = 'https://blog.banhalmi.art/blog/categories/aktfotozas-muveszi-szemmel';
  fineArt.legacyIntentRule = 'Legacy /blog/tags/muveszi-akt-fotozas traffic remains an editorial migration to the blog category. Do not turn that legacy blog URL into a commercial landing page. Use The Men’s Dream as artistic oeuvre authority and norbertbanhalmi.com only for current commission intent.';
});

setHeadDescription(
  'exhibitions/themensdream.html',
  'The Men’s Dream (2022): artistic nude photography exploring body, beauty and digital authenticity; 18 works from the New York exhibition.'
);
setHeadDescription(
  'hu/exhibitions/themensdream.html',
  'The Men’s Dream (2022): művészi aktfotózás és fine-art fotográfia a test, szépség és digitális hitelesség témájában; 18 mű New Yorkból.'
);
setHeadDescription(
  'de-at/exhibitions/themensdream.html',
  'The Men’s Dream (2022): künstlerische Aktfotografie über Körper, Schönheit und digitale Authentizität; 18 Arbeiten aus der New Yorker Ausstellung.'
);

replaceRequired(
  'tests/audit-fine-art-commercial-bridge.mjs',
  "for (const locale of ['en', 'hu', 'de-AT']) {\n  if (!bridge?.routes?.[locale]) failures.push(`ecosystem-bridge.json: Fine Art route missing for ${locale}`);\n}",
  "for (const locale of ['en', 'hu', 'de-AT']) {\n  if (!bridge?.routes?.[locale]) failures.push(`ecosystem-bridge.json: Fine Art route missing for ${locale}`);\n  if (!bridge?.artisticAuthorityRoutes?.[locale]) failures.push(`ecosystem-bridge.json: artistic Fine Art authority route missing for ${locale}`);\n  if (!bridge?.artisticAuthorityRoutes?.[locale]?.startsWith('https://www.banhalmi.art/')) failures.push(`ecosystem-bridge.json: artistic authority must remain on BANHALMI ART for ${locale}`);\n}\nif (bridge?.editorialContext !== 'https://blog.banhalmi.art/blog/categories/aktfotozas-muveszi-szemmel') {\n  failures.push('ecosystem-bridge.json: artistic-nude editorial context drift');\n}\nif (!/legacy \/blog\/tags\/muveszi-akt-fotozas/i.test(bridge?.legacyIntentRule || '')) {\n  failures.push('ecosystem-bridge.json: legacy artistic-nude search-intent boundary missing');\n}"
);

const regressionTest = `import fs from 'node:fs';\nimport path from 'node:path';\n\nconst failures = [];\nconst root = process.cwd();\nconst OLD = 'Norbert Banhalmi e.U.';\nconst NEW = 'Banhalmi Norbert e.U.';\nconst excluded = new Set(['.git','node_modules','_site','dist','coverage','.netlify','.github','docs','tests','tools','scripts']);\nconst extensions = new Set(['.html','.json','.jsonld','.txt','.xml']);\nconst files = [];\nfunction walk(dir = root) {\n  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {\n    if (entry.isDirectory() && excluded.has(entry.name)) continue;\n    const full = path.join(dir,entry.name);\n    if (entry.isDirectory()) walk(full);\n    else if (entry.isFile()) {\n      const rel = path.relative(root,full).replaceAll(path.sep,'/');\n      if (extensions.has(path.extname(entry.name).toLowerCase()) || rel === 'README.md') files.push(rel);\n    }\n  }\n}\nwalk();\nfor (const rel of files) {\n  const text = fs.readFileSync(rel,'utf8');\n  if (text.includes(OLD)) failures.push(\`${'${rel}'}: retired legal identity remains\`);\n}\nconst core = JSON.parse(fs.readFileSync('data/machine-core.json','utf8'));\nif (core.professionalIdentityMirror?.organization?.legalName !== NEW) failures.push('machine-core: canonical legalName drift');\nif (core.evidence?.artisticNudeAuthority !== 'https://www.banhalmi.art/exhibitions/themensdream.html') failures.push('machine-core: artistic nude authority route missing');\nif (core.evidence?.artisticNudeEditorialContext !== 'https://blog.banhalmi.art/blog/categories/aktfotozas-muveszi-szemmel') failures.push('machine-core: artistic nude editorial context missing');\nconst bridge = JSON.parse(fs.readFileSync('ecosystem-bridge.json','utf8'));\nfor (const locale of ['en','hu','de-AT']) {\n  if (!bridge.commercialFineArtBridge?.artisticAuthorityRoutes?.[locale]?.startsWith('https://www.banhalmi.art/')) failures.push(\`bridge: artistic authority route missing for ${'${locale}'}\`);\n  if (!bridge.commercialFineArtBridge?.routes?.[locale]?.startsWith('https://www.norbertbanhalmi.com/')) failures.push(\`bridge: current commission route must stay professional for ${'${locale}'}\`);\n}\nconst pages = [\n  ['exhibitions/themensdream.html','artistic nude photography'],\n  ['hu/exhibitions/themensdream.html','művészi aktfotózás'],\n  ['de-at/exhibitions/themensdream.html','künstlerische Aktfotografie']\n];\nfor (const [rel, token] of pages) {\n  const html = fs.readFileSync(rel,'utf8');\n  const description = html.match(/<meta name=\"description\" content=\"([^\"]+)\"/i)?.[1] || '';\n  if (!description.toLocaleLowerCase().includes(token.toLocaleLowerCase())) failures.push(\`${'${rel}'}: artistic-nude meta intent missing ${'${token}'}\`);\n  if (!/rel=\"canonical\"/.test(html) || !/hreflang=\"hu-HU\"/.test(html) || !/hreflang=\"de-AT\"/.test(html)) failures.push(\`${'${rel}'}: canonical/hreflang contract missing\`);\n}\nconst redirects = fs.readFileSync('_redirects','utf8');\nif (!redirects.includes('/blog/tags/muveszi-akt-fotozas  https://blog.banhalmi.art/blog/categories/aktfotozas-muveszi-szemmel  301')) failures.push('_redirects: legacy artistic-nude editorial migration drift');\nconst vercel = JSON.parse(fs.readFileSync('vercel.json','utf8'));\nconst redirect = (vercel.redirects || []).find(item => item.source === '/blog/tags/muveszi-akt-fotozas');\nif (redirect?.destination !== 'https://blog.banhalmi.art/blog/categories/aktfotozas-muveszi-szemmel' || redirect?.permanent !== true) failures.push('vercel.json: legacy artistic-nude migration drift');\nconst corpus = files.map(rel => fs.readFileSync(rel,'utf8')).join('\\n');\nif (corpus.includes('G-90C452LJKQ')) failures.push('retired ART GA4 ID reintroduced');\nif (!corpus.includes('G-PKLH4H5YKD')) failures.push('dedicated ART GA4 ID missing');\nif (!corpus.includes('b76d00b18059c1ca1a80c49b73dac73b')) failures.push('Pinterest verification missing');\nif (failures.length) { console.error(failures.join('\\n')); process.exit(1); }\nconsole.log(\`ART 2026-09-15 identity/fine-art regression passed across ${'${files.length}'} runtime files.\`);\n`;
fs.writeFileSync(path.join(root, 'tests/audit-art-identity-fineart-20260915.mjs'), regressionTest, 'utf8');
if (!changed.includes('tests/audit-art-identity-fineart-20260915.mjs')) changed.push('tests/audit-art-identity-fineart-20260915.mjs');

const packagePath = path.join(root, 'package.json');
const packageText = fs.readFileSync(packagePath, 'utf8');
if (!packageText.includes('audit-art-identity-fineart-20260915.mjs')) {
  const needle = 'node tests/audit-fine-art-commercial-bridge.mjs && node tests/audit-knowledge-core-stage35.mjs';
  if (!packageText.includes(needle)) throw new Error('package.json: expected audit insertion point missing');
  writeIfChanged('package.json', packageText.replace(needle, 'node tests/audit-fine-art-commercial-bridge.mjs && node tests/audit-art-identity-fineart-20260915.mjs && node tests/audit-knowledge-core-stage35.mjs'));
}

console.log(`ART remediation prepared ${changed.length} changed file(s).`);
for (const rel of [...new Set(changed)].sort()) console.log(`- ${rel}`);
