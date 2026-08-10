import { readFile, writeFile } from 'node:fs/promises';
const release='20260810-footer-alignment-v97';
const p='assets/js/responsive-header-system.js';
let s=await readFile(p,'utf8');
s=s.replace(/(\/assets\/css\/[A-Za-z0-9._-]+\.css)\?v=[A-Za-z0-9._-]+/g,`$1?v=${release}`);
await writeFile(p,s,'utf8');
console.log('Runtime stylesheet cache tokens synchronized to',release);