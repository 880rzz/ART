import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const hash = createHash('sha256');

for (const file of (await readdir(path.join(root, 'assets/css'))).filter((name) => name.endsWith('.css')).sort()) {
  hash.update(await readFile(path.join(root, 'assets/css', file)));
}
for (const file of (await readdir(path.join(root, 'assets/js'))).filter((name) => name.endsWith('.js')).sort()) {
  hash.update(await readFile(path.join(root, 'assets/js', file)));
}
for (const file of (await readdir(path.join(root, 'assets/video'))).filter((name) => name.endsWith('.mp4')).sort()) {
  hash.update(await readFile(path.join(root, 'assets/video', file)));
}

const digest = hash.digest('hex').slice(0, 16);
const configPath = path.join(root, 'data/design-release.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
config.assetDigest = digest;
await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
console.log(`design-release assetDigest=${digest}`);
