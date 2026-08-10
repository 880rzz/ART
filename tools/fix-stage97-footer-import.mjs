import { readFile, writeFile } from 'node:fs/promises';
const p='assets/css/footer-elegant.css';
let s=await readFile(p,'utf8');
s=s.replace(/palette-blue-final\.css\?v=[^)']+/,'palette-blue-final.css?v=20260810-footer-alignment-v97');
await writeFile(p,s,'utf8');
console.log('Footer palette import synchronized to Stage97.');