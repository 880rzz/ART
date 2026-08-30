import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function commitDateFor(rel) {
  const attempts = [
    ['log', '-1', '--format=%cI', '--', rel],
    ['show', '-s', '--format=%cI', process.env.GITHUB_SHA || 'HEAD']
  ];
  for (const args of attempts) {
    try {
      const value = execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (value) return value;
    } catch {}
  }
  throw new Error(`Cannot resolve deterministic commit date for ${rel}.`);
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function typesOf(node) {
  const raw = node?.['@type'];
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
}

function transformJsonLdScripts(html, { maxAssociatedMedia, dateModified }) {
  let galleries = 0;
  let removedMedia = 0;
  let datedNodes = 0;
  const scriptRe = /<script\b([^>]*\btype=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi;
  const out = html.replace(scriptRe, (full, attrs, jsonText) => {
    let data;
    try { data = JSON.parse(jsonText); } catch { return full; }
    let changed = false;
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { for (const item of node) visit(item); return; }
      const types = typesOf(node);
      if (types.includes('ImageGallery') && Array.isArray(node.associatedMedia) && node.associatedMedia.length > maxAssociatedMedia) {
        removedMedia += node.associatedMedia.length - maxAssociatedMedia;
        node.associatedMedia = node.associatedMedia.slice(0, maxAssociatedMedia);
        galleries += 1;
        changed = true;
      }
      if (types.some((type) => ['CreativeWork', 'WebPage', 'ProfilePage', 'Article', 'ImageGallery', 'CollectionPage'].includes(type))) {
        if (node.dateModified !== dateModified) {
          node.dateModified = dateModified;
          datedNodes += 1;
          changed = true;
        }
      }
      for (const value of Object.values(node)) visit(value);
    };
    visit(data);
    if (!changed) return full;
    return `<script${attrs}>${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
  });
  return { html: out, galleries, removedMedia, datedNodes };
}

function stampMachineDocument(root, rel) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) return false;
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return false; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  data.dateModified = commitDateFor(rel);
  writeJson(file, data);
  return true;
}

export function hardenMachineLayer(siteRoot = '_site') {
  const root = path.resolve(siteRoot);
  const repoRoot = path.resolve('.');
  if (root === repoRoot) throw new Error('ART machine hardener refuses to mutate the source repository. Pass an artifact directory such as _site.');

  const sourceRel = 'data/machine-core.json';
  const sourcePath = path.join(root, sourceRel);
  if (!fs.existsSync(sourcePath)) throw new Error(`ART canonical machine core missing: ${sourceRel}`);
  const core = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const dateModified = commitDateFor(sourceRel);
  const generatedFrom = core.canonicalId;
  const limit = Number(core.schemaPolicy?.homepageImageGalleryRepresentativeLimit || 12);
  if (!Number.isInteger(limit) || limit < 6 || limit > 12) throw new Error(`ART representative ImageGallery limit must remain between 6 and 12, received ${limit}.`);
  const artisticSpecialisms = core.archive?.artisticSpecialisms || [];
  if (!artisticSpecialisms.includes('Fine art photography')) throw new Error('ART canonical core lost Fine art photography specialism.');
  if (!artisticSpecialisms.includes('Artistic nude photography')) throw new Error('ART canonical core lost Artistic nude photography specialism.');

  const identity = {
    schemaVersion: core.schemaVersion,
    generatedFrom,
    dateModified,
    entityType: core.archive.entityType,
    name: core.archive.name,
    canonicalUrl: core.canonicalUrl,
    about: core.person,
    role: 'artistic-authority',
    artisticSpecialisms,
    primaryProfessionalIdentity: core.person.primaryProfessionalIdentity,
    professionalAuthority: core.professionalMirror.canonicalMachineCore,
    volunteerBoundary: core.professionalMirror.volunteerBoundary,
    languages: core.archive.languages
  };
  writeJson(path.join(root, 'api/v1/identity.json'), identity);

  const evidenceLines = Object.entries(core.evidence).map(([key, url]) => `- ${key}: ${url}`);
  const routeLines = Object.entries(core.archiveRoutes).map(([key, url]) => `- ${key}: ${url}`);
  const newYorkContract = 'New York is not a studio, office, headquarters or operational base.';
  const specialismLines = artisticSpecialisms.map((item) => `- ${item}`);
  const llms = `# BANHALMI ART\n\n> ${core.archive.role}\n> Generated from ${generatedFrom}. Date modified: ${dateModified}.\n\n## Identity\n- ${core.person.name} — ${core.person.wikidata}\n- Primary professional identity: ${core.person.primaryProfessionalIdentity}.\n- ${core.archive.name}: official artistic archive of the same canonical Person.\n- Current professional authority: ${core.professionalMirror.canonicalMachineCore}\n- ${newYorkContract}\n\n## Artistic specialisms\n${specialismLines.join('\n')}\n\n## Domain roles\n- Artistic archive: ${core.domainRoles.artArchive}\n- Professional services: ${core.domainRoles.professional}\n- Editorial essays: ${core.domainRoles.editorial}\n\n## Institutional role boundary\n- ${core.professionalMirror.volunteerBoundary}\n- Independent role evidence: ${core.professionalMirror.independentRoleEvidence}\n\n## Geography mirror\n- Current operational context: ${core.geographyMirror.operationalContext.join(' and ')}.\n- ${core.geographyMirror.rule}\n- Detailed current location facts: ${core.professionalMirror.canonicalLocations}\n\n## Evidence\n${evidenceLines.join('\n')}\n- [AI reference](https://www.banhalmi.art/ai.txt): detailed archive interpretation and disambiguation contract.\n\n## Archive routes\n${routeLines.join('\n')}\n\n## Machine-data policy\n- Homepage ImageGallery schema is limited to ${limit} representative images; full image evidence remains in ${core.evidence.imageKnowledgeGraph}.\n- Professional prices, staff contacts and detailed studio/office facts are not duplicated here; use ${core.professionalMirror.canonicalMachineCore}.\n\n## Disambiguation\n${core.disambiguationRules.map((rule) => `- ${rule}`).join('\n')}\n`;
  fs.writeFileSync(path.join(root, 'llms.txt'), llms, 'utf8');

  const ai = `# BANHALMI ART AI reference\n\nGenerated from: ${generatedFrom}\nDate modified: ${dateModified}\n\n## Canonical identity and archive answer contract\n- Artistic archive: https://www.banhalmi.art/\n- Professional authority: https://www.norbertbanhalmi.com/\n- Editorial knowledge: https://blog.banhalmi.art/\n- Primary professional identity: ${core.person.primaryProfessionalIdentity}.\n- Artistic specialisms: ${artisticSpecialisms.join('; ')}.\n- ${core.professionalMirror.volunteerBoundary}\n- ${newYorkContract}\n- ${core.archive.role}\n\n## Canonical professional mirror\n- Machine core: ${core.professionalMirror.canonicalMachineCore}\n- Identity: ${core.professionalMirror.canonicalIdentity}\n- Locations: ${core.professionalMirror.canonicalLocations}\n- Services: ${core.professionalMirror.canonicalServices}\n- ${core.professionalMirror.rule}\n\n## Evidence anchors\n${evidenceLines.join('\n')}\n\n## Interpretation rules\n${core.disambiguationRules.map((rule) => `- ${rule}`).join('\n')}\n- ${core.dataMinimisation.staffContactRule}\n`;
  fs.writeFileSync(path.join(root, 'ai.txt'), ai, 'utf8');

  const manifest = {
    schemaVersion: core.schemaVersion,
    canonicalSource: generatedFrom,
    canonicalProfessionalSource: core.professionalMirror.canonicalMachineCore,
    dateModified,
    generatedOutputs: core.derivedOutputs,
    homepageImageGalleryRepresentativeLimit: limit,
    artisticSpecialisms,
    policy: 'ART machine entry points are generated only in the immutable production artifact. Source audits are read-only and ART does not duplicate current professional contact/pricing data.'
  };
  writeJson(path.join(root, 'machine-manifest.json'), manifest);

  let homepageFiles = 0;
  let galleriesTrimmed = 0;
  let mediaRemoved = 0;
  let datedSchemaNodes = 0;
  for (const rel of ['index.html', 'hu/index.html', 'de-at/index.html']) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) throw new Error(`ART homepage missing from artifact: ${rel}`);
    const before = fs.readFileSync(file, 'utf8');
    const transformed = transformJsonLdScripts(before, { maxAssociatedMedia: limit, dateModified: commitDateFor(rel) });
    fs.writeFileSync(file, transformed.html, 'utf8');
    homepageFiles += 1;
    galleriesTrimmed += transformed.galleries;
    mediaRemoved += transformed.removedMedia;
    datedSchemaNodes += transformed.datedNodes;
  }

  let stampedDocuments = 0;
  for (const rel of [
    'knowledge-core.json',
    'archive-record-registry.json',
    'master-source-database.json',
    'press-source-registry.json',
    'artistic-presence-context.json',
    'authority-bridge.json',
    'data/life-journey.json',
    'data/image-knowledge-graph.jsonld'
  ]) if (stampMachineDocument(root, rel)) stampedDocuments += 1;

  const forbiddenContact = 'viko@banhalmi.at';
  for (const rel of ['llms.txt', 'ai.txt']) {
    const text = fs.readFileSync(path.join(root, rel), 'utf8');
    if (text.includes(forbiddenContact)) throw new Error(`${rel} leaked unnecessary collaborator email ${forbiddenContact}.`);
    if (!text.includes('Artistic nude photography')) throw new Error(`${rel} lost Artistic nude photography specialism.`);
    if (!text.includes('voluntary social/community work')) throw new Error(`${rel} lost volunteer social-work boundary.`);
  }

  for (const rel of ['index.html', 'hu/index.html', 'de-at/index.html']) {
    const html = fs.readFileSync(path.join(root, rel), 'utf8');
    const scriptMatches = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    for (const match of scriptMatches) {
      let data;
      try { data = JSON.parse(match[1]); } catch { continue; }
      const visit = (node) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) { for (const item of node) visit(item); return; }
        if (typesOf(node).includes('ImageGallery') && Array.isArray(node.associatedMedia) && node.associatedMedia.length > limit) {
          throw new Error(`${rel} still contains ImageGallery with ${node.associatedMedia.length} associatedMedia entries; limit is ${limit}.`);
        }
        for (const value of Object.values(node)) visit(value);
      };
      visit(data);
    }
  }

  console.log(`ART machine layer hardened: ${homepageFiles} homepages, ${galleriesTrimmed} ImageGallery projection(s) trimmed, ${mediaRemoved} duplicated media nodes removed, ${datedSchemaNodes} inline schema nodes dated, ${stampedDocuments} machine documents stamped, representative limit ${limit}.`);
}

if (import.meta.url === `file://${process.argv[1]}`) hardenMachineLayer(process.argv[2] || '_site');
