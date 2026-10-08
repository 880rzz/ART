import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'art-pages-packaging-'));
const site = path.join(scratch, 'site');
const archive = path.join(scratch, 'artifact.tar');
const script = path.resolve(import.meta.dirname, '../scripts/package-pages-artifact.mjs');
const agent = JSON.stringify({ name: 'BANHALMI ART agent entry', canonical: 'https://www.banhalmi.art/' });
const files = { '.nojekyll': '', '.well-known/agent.json': agent, 'deployment-sha.txt': 'test-sha\n', 'api/v1/identity.json': '{}', 'api/v1/archive.json': '{}', 'api/v1/actions.json': '{}', 'llms.txt': 'ART', 'ai.txt': 'ART', 'index.html': '<h1>ART</h1>' };
try {
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(site, file)), { recursive: true });
    fs.writeFileSync(path.join(site, file), content);
  }
  const run = target => spawnSync(process.execPath, [script, site, target || archive], { encoding: 'utf8' });
  assert.equal(run().status, 0);
  const extracted = spawnSync('tar', ['-xOf', archive, './.well-known/agent.json'], { encoding: 'utf8' });
  assert.equal(extracted.status, 0);
  assert.equal(extracted.stdout, agent, 'Agent entry must survive the uploaded tar byte-for-byte');
  assert.notEqual(run(path.join(site, 'artifact.tar')).status, 0, 'Refuse recursive archive destination');
  fs.writeFileSync(path.join(site, '.env'), 'test-only');
  assert.notEqual(run().status, 0, 'Refuse unapproved hidden paths');
  fs.unlinkSync(path.join(site, '.env'));
  fs.symlinkSync(path.join(site, 'index.html'), path.join(site, 'linked.html'));
  assert.notEqual(run().status, 0, 'Refuse symbolic links');
  fs.unlinkSync(path.join(site, 'linked.html'));
  fs.unlinkSync(path.join(site, '.well-known/agent.json'));
  assert.notEqual(run().status, 0, 'Refuse missing agent entry point');
  console.log('Pages archive regression passed: hidden agent entry retained byte-for-byte; missing entry, unexpected hidden paths, symlinks and recursive destinations rejected.');
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
