import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const [siteArg, archiveArg] = process.argv.slice(2);
if (!siteArg || !archiveArg) throw new Error('Usage: package-pages-artifact.mjs SITE ARCHIVE');
const site = fs.realpathSync(siteArg);
const requestedArchive = path.resolve(archiveArg);
fs.mkdirSync(path.dirname(requestedArchive), { recursive: true });
// Resolve the parent as well: macOS commonly exposes /var as a symlink to
// /private/var, so lexical path comparison alone can miss a recursive target.
const archive = path.join(fs.realpathSync(path.dirname(requestedArchive)), path.basename(requestedArchive));
if (archive === site || archive.startsWith(site + path.sep)) throw new Error('Archive must be outside the site');
const forbidden = new Set(['.git', '.github', 'tests', 'tools', 'scripts', 'docs', 'node_modules']);
for (const entry of fs.readdirSync(site)) {
  if (forbidden.has(entry) || (entry.startsWith('.') && !['.nojekyll', '.well-known'].includes(entry))) {
    throw new Error(`Repository-only or unapproved hidden path: ${entry}`);
  }
}
function checkLinks(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic link in Pages site: ${file}`);
    if (entry.isDirectory()) checkLinks(file);
  }
}
checkLinks(site);
const required = ['.nojekyll', '.well-known/agent.json', 'deployment-sha.txt', 'api/v1/identity.json', 'api/v1/archive.json', 'api/v1/actions.json', 'llms.txt', 'ai.txt'];
for (const file of required) {
  if (!fs.statSync(path.join(site, file)).isFile()) throw new Error(`Required file missing: ${file}`);
}
JSON.parse(fs.readFileSync(path.join(site, '.well-known/agent.json'), 'utf8'));
// `--dereference` is supported by GNU tar and macOS bsdtar. The additional
// GNU-only hard-link flag made the packaging gate fail on the developer's Mac.
const packed = spawnSync('tar', ['--dereference', '--directory', site, '-cf', archive, '.'], { encoding: 'utf8' });
if (packed.status !== 0) throw new Error(`Pages archive failed: ${packed.stderr}`);
const listed = spawnSync('tar', ['-tf', archive], { encoding: 'utf8' });
if (listed.status !== 0) throw new Error(`Pages archive listing failed: ${listed.stderr}`);
const members = new Set(listed.stdout.trim().split('\n').map(p => p.replace(/^\.\//, '')));
for (const file of required) {
  if (!members.has(file)) throw new Error(`Required file excluded from Pages archive: ${file}`);
}
console.log(`Verified Pages archive includes the agent entry point, API files, SHA stamp and .nojekyll: ${archive}`);
