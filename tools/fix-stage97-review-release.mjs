import { readFile, writeFile } from 'node:fs/promises';
const release='20260810-footer-alignment-v97';
const p='data/page-simplification-review.json';
const data=JSON.parse(await readFile(p,'utf8'));
data.release=release;
await writeFile(p,JSON.stringify(data,null,2)+'\n','utf8');
console.log('Page simplification review synchronized to',release);