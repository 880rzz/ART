import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const allowedExt = new Set(['.html','.json','.jsonld','.txt','.md','.mjs','.js','.cjs','.yml','.yaml','.xml']);
const skipDirs = new Set(['.git','node_modules']);
const selfRel = 'tools/migrate-canonical-legal-brand.mjs';
const canonicalLegal = 'Banhalmi Norbert e.U.';
const oldLegal = ['Norbert','Banhalmi','e.U.'].join(' ');
const oldLegalAccented = ['Bánhalmi','Norbert','e.U.'].join(' ');
const primaryBrand = 'BANHALMI';
const secondaryBrand = 'BANHALMI Photography';

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && allowedExt.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

let changedFiles = 0;
for (const file of walk(root)) {
  const rel = path.relative(root, file).replaceAll('\\','/');
  if (rel === selfRel) continue;
  let text = fs.readFileSync(file, 'utf8');
  const before = text;
  text = text.replaceAll(oldLegal, canonicalLegal).replaceAll(oldLegalAccented, canonicalLegal);
  if (text !== before) {
    fs.writeFileSync(file, text, 'utf8');
    changedFiles += 1;
  }
}

function updateJson(rel, updater) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) return;
  const obj = JSON.parse(fs.readFileSync(file, 'utf8'));
  updater(obj);
  fs.writeFileSync(file, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
}

updateJson('entity-identity-contract.json', contract => {
  if (contract.canonicalOrganization) {
    contract.canonicalOrganization.name = canonicalLegal;
    contract.canonicalOrganization.legalName = canonicalLegal;
    delete contract.canonicalOrganization.alternateName;
  }
  if (contract.canonicalBrand) {
    contract.canonicalBrand.name = primaryBrand;
    contract.canonicalBrand.alternateName = [secondaryBrand];
    contract.canonicalBrand.namingPriority = { primary: primaryBrand, secondary: secondaryBrand };
  }
  contract.version = '2026-09-10-v5';
  contract.dateModified = '2026-09-10T07:00:00+02:00';
});

updateJson('ecosystem-bridge.json', bridge => {
  if (bridge.canonicalOrganization) {
    bridge.canonicalOrganization.name = canonicalLegal;
    bridge.canonicalOrganization.legalName = canonicalLegal;
  }
  if (bridge.canonicalBrand) {
    bridge.canonicalBrand.name = primaryBrand;
    bridge.canonicalBrand.alternateName = [secondaryBrand];
  }
});

updateJson('data/machine-core.json', core => {
  if (core.organization) {
    core.organization.name = canonicalLegal;
    core.organization.legalName = canonicalLegal;
  }
  if (core.brand) {
    core.brand.name = primaryBrand;
    core.brand.alternateName = [secondaryBrand];
  }
});

console.log(`ART canonical identity migration complete: ${changedFiles} text files normalized.`);
