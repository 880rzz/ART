import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
const root=process.cwd();
const failures=[];
const banned=['This exhibition is presented as one chapter in the investigation of presence.','This book is presented as a document within the wider investigation of presence.','organised around the investigation of presence through photography','geordnet als Erforschung der Präsenz in Fotografie'];
function visible(h){return h.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ')}
const files=[];function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['.git','node_modules','hu'].includes(e.name))continue;const f=path.join(d,e.name);if(e.isDirectory())walk(f);else if(e.name.endsWith('.html'))files.push(f)}}walk(root);
for(const file of files){const rel=path.relative(root,file).replaceAll('\\','/');const text=visible(fs.readFileSync(file,'utf8'));for(const phrase of banned)if(text.includes(phrase))failures.push(`${rel}: institutional phrase remains`)}
for(const [rel,phrase] of [['index.html','The official archive of Norbert Bánhalmi’s work since 1999'],['de-at/index.html','Das offizielle Archiv von Norbert Bánhalmis Arbeit seit 1999']])if(!fs.readFileSync(path.join(root,rel),'utf8').includes(phrase))failures.push(`${rel}: homepage human copy missing`);
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`English/German human-voice audit passed across ${files.length} HTML files.`);
