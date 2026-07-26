import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const html = [];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(['.git','node_modules','.github'].includes(e.name))continue;const f=path.join(dir,e.name);if(e.isDirectory())await walk(f);else if(e.name.endsWith('.html'))html.push(f);}}
await walk(root);
const changed=[];
for(const file of html){const original=await readFile(file,'utf8');let content=original;
content=content.replace(/<link rel="stylesheet" href="\/assets\/css\/archive-system\.css\?v=[^"]+">/i,'<link rel="stylesheet" href="/assets/css/archive-system.css?v=20260727-apple-system">');
if(!/archive-system\.css/i.test(content)) content=content.replace(/<\/head>/i,'<link rel="stylesheet" href="/assets/css/archive-system.css?v=20260727-apple-system">\n</head>');
content=content.replace(/<body\b([^>]*)>/i,(m,a)=>{if(/class=["'][^"']*\bapple-archive\b/i.test(a))return m;if(/class=["']([^"']*)["']/i.test(a))return `<body${a.replace(/class=["']([^"']*)["']/i,(x,c)=>`class="${c} apple-archive"`)}>`;return `<body${a} class="apple-archive">`;});
content=content.replace(/<(div|section)\b([^>]*class=["'][^"']*(?:collage|masonry|strip|gallery)[^"']*["'][^>]*)>/giu,(m,t,a)=>/data-gallery=/i.test(a)?m:`<${t}${a} data-gallery="reference">`);
content=content.replace(/(<button\b[^>]*class=["'][^"']*(?:menu|nav-toggle|burger)[^"']*["'][^>]*)(>)/giu,(m,o,c)=>{let t=o;if(!/aria-label=/i.test(t))t+=' aria-label="Menu"';if(!/aria-expanded=/i.test(t))t+=' aria-expanded="false"';return `${t}${c}`;});
if(content!==original){await writeFile(file,content,'utf8');changed.push(path.relative(root,file));}}
console.log(JSON.stringify({changed,total:changed.length},null,2));