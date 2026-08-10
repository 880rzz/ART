import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root=process.cwd();
const hash=createHash('sha256');
for(const name of (await readdir(path.join(root,'assets/css'))).filter(f=>f.endsWith('.css')).sort()) hash.update(await readFile(path.join(root,'assets/css',name)));
for(const name of (await readdir(path.join(root,'assets/js'))).filter(f=>f.endsWith('.js')).sort()) hash.update(await readFile(path.join(root,'assets/js',name)));
for(const name of (await readdir(path.join(root,'assets/video'))).filter(f=>f.endsWith('.mp4')).sort()) hash.update(await readFile(path.join(root,'assets/video',name)));
const digest=hash.digest('hex').slice(0,16);
const p=path.join(root,'data/design-release.json');
const data=JSON.parse(await readFile(p,'utf8'));
data.assetDigest=digest;
await writeFile(p,JSON.stringify(data,null,2)+'\n','utf8');
console.log('Stage97 asset digest:',digest);