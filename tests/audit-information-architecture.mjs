import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const skip = new Set(['.git','node_modules','.github','data','reports']);
const files=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(skip.has(e.name))continue;const f=path.join(dir,e.name);if(e.isDirectory())await walk(f);else if(e.name.endsWith('.html'))files.push(f)}}
await walk(root);
const errors=[];
for(const file of files){const rel=path.relative(root,file).replaceAll('\\','/');const html=await readFile(file,'utf8');if(!/class=["'][^"']*apple-archive/i.test(html)||!/id=["']menu["']/i.test(html)||/http-equiv=["']refresh["']/i.test(html))continue;for(const [role,fragment] of [['gallery','#works'],['about','#about'],['oeuvre','#journey']]){const re=new RegExp('data-nav-role=["\']'+role+'["\'][^>]*href=["\'][^"\']*'+fragment+'["\']','i');if(!re.test(html))errors.push(rel+': missing '+role+' menu destination '+fragment)}}
for(const [rel,anchors] of Object.entries({'index.html':['works','about','journey'],'hu/index.html':['works','about','journey'],'de-at/index.html':['works','about','journey']})){const html=await readFile(path.join(root,rel),'utf8');for(const id of anchors)if(!new RegExp('id=["\']'+id+'["\']').test(html))errors.push(rel+': missing anchor #'+id)}
const redirects=await readFile(path.join(root,'_redirects'),'utf8');if(!/^\/norbert-banhalmi\s+\/#about\s+301$/m.test(redirects))errors.push('_redirects: canonical Person route must resolve to /#about');if(/\/about\.html/.test(redirects))errors.push('_redirects: dead about.html target remains');
const css=await readFile(path.join(root,'assets/css/museum-editorial.css'),'utf8');if(!css.includes('15. Canonical chronology component'))errors.push('museum-editorial.css: canonical chronology component missing');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log('Information architecture audit passed: Gallery, About, Oeuvre and Person routing are explicit in all languages.');
