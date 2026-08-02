import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const dir=path.resolve(import.meta.dirname,'../.github/workflows');
const errors=[];
for(const name of await readdir(dir)){if(!/\.ya?ml$/.test(name)||name.startsWith('_'))continue;const text=await readFile(path.join(dir,name),'utf8');if(/contents:\s*write/i.test(text))errors.push(name+': contents write permission is forbidden');if(/git\s+push/i.test(text))errors.push(name+': audit workflow must not push');if(/git\s+commit/i.test(text))errors.push(name+': audit workflow must not commit')}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log('Workflow safety audit passed: permanent workflows are read-only.');
