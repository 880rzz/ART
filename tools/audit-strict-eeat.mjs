import fs from 'node:fs';
import path from 'node:path';

const errors = [];
const requireTrue = (condition, message) => { if (!condition) errors.push(message); };
const read = (rel) => fs.readFileSync(rel, 'utf8');
const readJson = (rel) => JSON.parse(read(rel));

const core = readJson('data/machine-core.json');
const canonicalPerson = 'https://www.norbertbanhalmi.com/about/';
const canonicalOrg = 'https://www.norbertbanhalmi.com/#organization';
const canonicalBrand = 'https://www.norbertbanhalmi.com/#brand';

// Experience: first-party, dated, oeuvre-level evidence must exist independently of marketing copy.
for (const rel of ['data/life-journey.json','archive-record-registry.json','master-source-database.json','artistic-presence-context.json']) {
  requireTrue(fs.existsSync(rel), `Experience evidence missing: ${rel}`);
  if (fs.existsSync(rel)) requireTrue(read(rel).length > 500, `Experience evidence unexpectedly shallow: ${rel}`);
}
requireTrue(core.archive?.role?.includes('oeuvre since 1999'), 'Experience baseline must preserve the documented oeuvre-since-1999 role');

// Expertise: canonical Person, specialisms and authored/curatorial context.
requireTrue(core.person?.id === canonicalPerson, 'Expertise must resolve to the canonical Person');
requireTrue(core.person?.wikidata === 'https://www.wikidata.org/wiki/Q56391118', 'Canonical Person Wikidata drift');
requireTrue((core.archive?.artisticSpecialisms || []).includes('Fine art photography'), 'Fine art photography expertise missing');
requireTrue((core.archive?.artisticSpecialisms || []).includes('Artistic nude photography'), 'Artistic nude photography expertise missing');
requireTrue(fs.existsSync('curators.html'), 'Curatorial dossier missing');

// Authoritativeness: evidence and source registries, not self-asserted authority alone.
for (const rel of ['press-source-registry.json','authority-bridge.json','data/image-knowledge-graph.jsonld','wikidata-entity-registry.json']) {
  requireTrue(fs.existsSync(rel), `Authority evidence missing: ${rel}`);
}
const press = fs.existsSync('press-source-registry.json') ? read('press-source-registry.json') : '';
requireTrue(/https?:\/\//.test(press), 'Press registry has no resolvable source URLs');
requireTrue(core.evidence?.wikipedia?.includes('wikipedia.org'), 'Wikipedia authority anchor missing');
requireTrue(core.evidence?.wikidata === 'https://www.wikidata.org/wiki/Q56391118', 'Wikidata authority anchor drift');

// Trust: exact entity semantics and relationship boundaries.
const mirror = core.professionalIdentityMirror;
requireTrue(mirror?.organization?.id === canonicalOrg, 'Professional Organization @id drift');
requireTrue(mirror?.organization?.name === 'Banhalmi Norbert e.U.', 'Professional Organization name drift');
requireTrue(mirror?.organization?.legalName === 'Banhalmi Norbert e.U.', 'Professional Organization legalName drift');
requireTrue(mirror?.brand?.id === canonicalBrand, 'BANHALMI Brand @id drift');
requireTrue(mirror?.brand?.name === 'BANHALMI', 'Primary Brand drift');
requireTrue(mirror?.brand?.alternateName === 'BANHALMI Photography', 'Secondary brand name drift');
requireTrue(mirror?.brand?.positioning === 'Photography Team', 'Photography Team descriptor drift');
requireTrue(core.professionalMirror?.volunteerBoundary?.includes('not employment'), 'Volunteer/employment boundary missing');

for (const token of [
  'photo credit or reuse is not a client relationship',
  'membership is not endorsement',
  'historical founder status is not current ownership',
  'volunteer work is not employment'
]) requireTrue(core.eeatPolicy?.trust?.toLowerCase().includes(token), `Trust relationship boundary missing: ${token}`);

// Layer balance: ART is artistic authority; professional and editorial layers keep their own authority.
requireTrue(core.domainRoles?.artArchive === 'https://www.banhalmi.art/', 'ART authority URL drift');
requireTrue(core.domainRoles?.professional === 'https://www.norbertbanhalmi.com/', 'Professional authority URL drift');
requireTrue(core.domainRoles?.editorial === 'https://blog.banhalmi.art/', 'Editorial authority URL drift');
requireTrue(core.eeatPolicy?.crossLayerBalance?.includes('BANHALMI ART owns artistic oeuvre evidence'), 'Cross-layer authority boundary missing');

// Machine-readable anti-rollback on files that can directly influence LLM/entity interpretation.
const protectedFiles = [
  'data/machine-core.json',
  'ecosystem-bridge.json',
  'knowledge-core.json',
  'api/v1/identity.json',
  'entity-identity-contract.json'
].filter(fs.existsSync);
for (const rel of protectedFiles) {
  const text = read(rel);
  if (rel === 'data/machine-core.json') requireTrue(!text.includes('"positioning": "Professional Photography Team"'), `${rel}: retired positioning reintroduced`);
  requireTrue(!text.includes('"legalName": "Norbert Banhalmi e.U."'), `${rel}: retired legalName reintroduced`);
}

// ProfilePage date hygiene: optional dates are allowed, invalid dates are not.
function walk(value, source) {
  if (Array.isArray(value)) return value.forEach((v) => walk(v, source));
  if (!value || typeof value !== 'object') return;
  const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']].filter(Boolean);
  if (types.includes('ProfilePage')) {
    for (const key of ['dateCreated','dateModified']) {
      if (value[key] == null) continue;
      const raw = String(value[key]);
      const validIso = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(raw) && !Number.isNaN(Date.parse(raw));
      requireTrue(validIso, `${source}: invalid ProfilePage ${key}: ${raw}`);
    }
  }
  for (const child of Object.values(value)) walk(child, source);
}

function scanHtml(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git','node_modules','_site','dist','coverage','.netlify'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) scanHtml(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      const html = read(full);
      const re = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      while ((match = re.exec(html))) {
        try { walk(JSON.parse(match[1]), full); } catch { /* JSON-LD syntax is audited elsewhere */ }
      }
    }
  }
}
scanHtml('.');

if (errors.length) {
  console.error(`STRICT E-E-A-T AUDIT FAILED (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Strict E-E-A-T audit passed: Experience, Expertise, Authoritativeness, Trust, cross-layer balance, identity semantics and ProfilePage date hygiene are protected.');
