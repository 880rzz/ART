import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const errors=[];
const runtime=fs.readFileSync('assets/js/responsive-header-system.js','utf8');
const base=fs.readFileSync('assets/css/page-base.css','utf8');
const optimizer=fs.readFileSync('scripts/optimize-pages-artifact.mjs','utf8');

const executable=runtime
  .replace(/\/\*[\s\S]*?\*\//g,'')
  .replace(/(^|\s)\/\/.*$/gm,'$1');
if(executable.includes('getBoundingClientRect')) errors.push('responsive-header-system.js: forced-layout fragment measurement returned');
if(executable.includes('settleCurrentFragment')) errors.push('responsive-header-system.js: repeated fragment settling returned');
if(!executable.includes("target.scrollIntoView({ block: 'start', behavior: 'auto' })")) errors.push('responsive-header-system.js: canonical native fragment alignment missing');

for(const forbidden of [
  '.tone-b{background:#29303F}',
  '.tone-c{background:#2D3444}',
  'border-radius:16px;cursor:zoom-in',
  'filter:saturate(.94)',
  'filter:saturate(1.02)',
  'filter:saturate(.96)',
  '.gal-actions{text-align:center;margin-top:2.2rem}',
  '#lb img{max-height:82vh;max-width:92vw;width:auto;height:auto;border-radius:10px'
]){
  if(base.includes(forbidden)) errors.push(`page-base.css: retired CSS returned: ${forbidden}`);
}
for(const required of [
  '.tone-a{background:var(--c-ground)}',
  '.tone-b{background:var(--c-raised)}',
  '.tone-c{background:var(--c-panel)}',
  '.collage img{width:100%;height:auto;display:block;transition:transform .7s var(--ease-standard);filter:none}',
  '.gal-actions{display:flex;justify-content:center;text-align:center;margin-top:2.2rem}'
]){
  if(!base.includes(required)) errors.push(`page-base.css: canonical CSS contract missing: ${required}`);
}

if(optimizer.includes('parts.push(`\\n/* Production performance hardening */')) errors.push('optimizer: artifact-only corrective CSS patch returned');
if(optimizer.includes('async function optimizeResponsiveHeaderRuntime')) errors.push('optimizer: deployment-time runtime rewrite returned');
if(optimizer.includes('await writeFile(runtimePath, source')) errors.push('optimizer: deployment still rewrites responsive-header source copy');
if(!optimizer.includes('async function validateResponsiveHeaderRuntime')) errors.push('optimizer: source runtime validation missing');

try{
  execFileSync('git',['diff','--exit-code'],{stdio:'pipe'});
  execFileSync('git',['diff','--cached','--exit-code'],{stdio:'pipe'});
}catch{
  errors.push('audit execution mutated tracked source; self-healing checks must fail closed instead of silently rewriting the repository');
}

if(errors.length){console.error('SELF-HEALING / CSS DRIFT STAGE 47 FAILED');errors.forEach(e=>console.error('-',e));process.exit(1);}
console.log('Stage 47 self-healing/CSS drift audit passed: corrective behavior lives in canonical source, retired gallery/palette rules cannot return, deploy optimization validates instead of masking source drift, and audits leave tracked files untouched.');
