import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const dir = path.resolve(import.meta.dirname, '../.github/workflows');
const errors = [];
const workflows = new Map();

for (const name of await readdir(dir)) {
  if (!/\.ya?ml$/.test(name) || name.startsWith('_')) continue;
  const text = await readFile(path.join(dir, name), 'utf8');
  workflows.set(name, text);
  if (/contents:\s*write/i.test(text)) errors.push(`${name}: contents write permission is forbidden`);
  if (/git\s+push/i.test(text)) errors.push(`${name}: permanent workflow must not push`);
  if (/git\s+commit/i.test(text)) errors.push(`${name}: permanent workflow must not commit`);
  for (const forbidden of [/npm\s+run\s+fix:/i, /npm\s+run\s+sync:/i, /sync-sitemap-lastmod\.mjs/i, /\s--write(?:\s|$)/i]) {
    if (forbidden.test(text)) errors.push(`${name}: permanent workflow invokes a source-mutating command: ${forbidden}`);
  }
}

const packageText = await readFile(path.resolve(import.meta.dirname, '../package.json'), 'utf8');
if (!packageText.includes('git diff --exit-code')) errors.push('package.json test contract must prove tracked source remains identical to committed HEAD after audits');

const pages = workflows.get('pages.yml') || '';
const sourceAuditPos = pages.indexOf('- name: Run complete archive audit');
const artifactPos = pages.indexOf('- name: Prepare immutable Pages artifact');
const browserPos = pages.indexOf('- name: Run exact artifact browser and visual release gate');
const lighthouseMobilePos = pages.indexOf('- name: Run mobile Lighthouse strict 100 gate');
const lighthouseDesktopPos = pages.indexOf('- name: Run desktop Lighthouse strict 100 gate');
const uploadPos = pages.indexOf('- name: Upload verified Pages artifact');
if ([sourceAuditPos, artifactPos, browserPos, lighthouseMobilePos, lighthouseDesktopPos, uploadPos].some((p) => p < 0) ||
    !(sourceAuditPos < artifactPos && artifactPos < browserPos && browserPos < lighthouseMobilePos && lighthouseMobilePos < lighthouseDesktopPos && lighthouseDesktopPos < uploadPos)) {
  errors.push('pages.yml must audit source first, prepare artifact, run exact browser QA, run both Lighthouse 100 gates, then upload the deployable artifact');
}
if (!/git ls-files -z \| rsync -a --from0 --files-from=- \.\/ _site\//.test(pages)) {
  errors.push('pages.yml must copy only tracked committed paths into the production artifact');
}
if (!/printf '%s\\n' \"\$GITHUB_SHA\" > _site\/deployment-sha\.txt/.test(pages)) {
  errors.push('pages.yml must stamp the exact source SHA into the artifact');
}
if (!/Verify exact archive commit is live/i.test(pages)) errors.push('pages.yml must verify exact deployed SHA on the custom domain');

const restore = await readFile(path.resolve(import.meta.dirname, '../scripts/restore-production-design-authority.mjs'), 'utf8');
if (!restore.includes('hardenMachineLayer(siteRoot)')) errors.push('production restore must invoke the artifact-only machine hardener');
if (!restore.includes('hardenProductionArtifact(siteRoot)')) errors.push('production restore must invoke the artifact-only accessibility hardener');
const machineHardener = await readFile(path.resolve(import.meta.dirname, '../scripts/harden-machine-layer.mjs'), 'utf8');
if (!machineHardener.includes('refuses to mutate the source repository')) errors.push('machine hardener must contain an explicit source-repository mutation guard');
const optimizer = await readFile(path.resolve(import.meta.dirname, '../scripts/optimize-pages-artifact.mjs'), 'utf8');
if (optimizer.includes("[{}:;,>]")) errors.push('production CSS optimizer must preserve descendant whitespace before pseudo-classes');
const runtime = await readFile(path.resolve(import.meta.dirname, '../assets/js/hero-hover-video.js'), 'utf8');
if (/google\.com\/maps[\s\S]{0,1200}setAttribute\(['"]aria-label/i.test(runtime)) errors.push('runtime must not replace visible Google Maps link text with a mismatched accessible name');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('ART workflow safety audit passed: permanent workflows are read-only, tracked source is proven unchanged after audits, artifact construction uses tracked HEAD content, machine hardening is artifact-only, and exact-live SHA verification gates production.');
