import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const dir=path.resolve(import.meta.dirname,'../.github/workflows');
const errors=[];
const workflows=new Map();

for(const name of await readdir(dir)){
  if(!/\.ya?ml$/.test(name)||name.startsWith('_')) continue;
  const text=await readFile(path.join(dir,name),'utf8');
  workflows.set(name,text);
  if(/contents:\s*write/i.test(text)) errors.push(name+': contents write permission is forbidden');
  if(/git\s+push/i.test(text)) errors.push(name+': audit workflow must not push');
  if(/git\s+commit/i.test(text)) errors.push(name+': audit workflow must not commit');

  for(const forbidden of [
    /sync:image-metadata:write/i,
    /bump:release/i,
    /sync:sitemap-lastmod/i,
    /sync-image-metadata-to-html\.mjs\s+--write/i,
    /\s--write(?:\s|$)/i
  ]){
    if(forbidden.test(text)) errors.push(name+': permanent workflow invokes source-mutating maintenance: '+forbidden);
  }
}

const pages=workflows.get('pages.yml')||'';
if(!/run:\s*npm test/.test(pages)) errors.push('pages.yml must run the complete repository audit before artifact preparation');
if(!/git ls-files -z \| rsync/.test(pages)) errors.push('pages.yml must construct the artifact from tracked files only');
if(!/printf '%s\\n' \"\$GITHUB_SHA\" > _site\/deployment-sha\.txt/.test(pages)) errors.push('pages.yml must stamp the exact source SHA');
if(!/Verify exact archive commit is live/.test(pages)) errors.push('pages.yml must verify the exact deployed archive SHA');

if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Workflow safety audit passed: permanent workflows are read-only, mutating maintenance is isolated, and production remains SHA-bound.');
