import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const html = [];
const skip = new Set(['.git','node_modules','.github']);

async function walk(dir){
  for(const e of await readdir(dir,{withFileTypes:true})){
    if(skip.has(e.name)) continue;
    const f=path.join(dir,e.name);
    if(e.isDirectory()) await walk(f);
    else if(e.name.endsWith('.html')) html.push(f);
  }
}
await walk(root);

const changed=[];
for(const file of html){
  const original=await readFile(file,'utf8');
  let content=original;

  content=content.replace(/<link rel="stylesheet" href="\/assets\/css\/archive-system\.css\?v=[^"]+">/i,'<link rel="stylesheet" href="/assets/css/archive-system.css?v=20260727-v2">');
  if(!/archive-system\.css/i.test(content)) content=content.replace(/<\/head>/i,'<link rel="stylesheet" href="/assets/css/archive-system.css?v=20260727-v2">\n</head>');

  content=content.replace(/<body\b([^>]*)>/i,(m,a)=>{
    if(/class=["'][^"']*\bapple-archive\b/i.test(a)) return m;
    if(/class=["']([^"']*)["']/i.test(a)) return `<body${a.replace(/class=["']([^"']*)["']/i,(x,c)=>`class="${c} apple-archive"`)}>`;
    return `<body${a} class="apple-archive">`;
  });

  /* Every visual collection uses the same curatorial-wall language. */
  content=content.replace(/<(div|section|ul)\b([^>]*class=["'][^"']*(?:collage|masonry|strip|gallery|works|images)[^"']*["'][^>]*)>/giu,(m,t,a)=>/data-gallery=/i.test(a)?m:`<${t}${a} data-gallery="curatorial-wall">`);

  /* Add stable hooks to long archival lists so years and titles never collide. */
  content=content.replace(/<(div|section|ul)\b([^>]*class=["'][^"']*(?:timeline|chronology|archive-list|record-list)[^"']*["'][^>]*)>/giu,(m,t,a)=>m);
  content=content.replace(/<(div|section|ul)\b([^>]*class=["'][^"']*(?:exhibition-list|press-list|article-list|membership-list)[^"']*["'][^>]*)>/giu,(m,t,a)=>{
    if(/\barchive-list\b/i.test(a)) return m;
    return `<${t}${a.replace(/class=["']([^"']*)["']/i,(x,c)=>`class="${c} archive-list"`)}>`;
  });

  /* Accessible, predictable menu controls. */
  content=content.replace(/(<button\b[^>]*class=["'][^"']*(?:menu|nav-toggle|burger)[^"']*["'][^>]*)(>)/giu,(m,o,c)=>{
    let t=o;
    if(!/aria-label=/i.test(t)) t+=' aria-label="Menu"';
    if(!/aria-expanded=/i.test(t)) t+=' aria-expanded="false"';
    return `${t}${c}`;
  });

  /* Mark the homepage as the narrative gateway without changing URLs. */
  const rel=path.relative(root,file).replaceAll('\\','/');
  if(['index.html','hu/index.html','de-at/index.html'].includes(rel)){
    content=content.replace(/<main\b([^>]*)>/i,(m,a)=>/data-narrative=/i.test(a)?m:`<main${a} data-narrative="life-journey">`);
  }

  if(content!==original){
    await writeFile(file,content,'utf8');
    changed.push(rel);
  }
}
console.log(JSON.stringify({changed,total:changed.length},null,2));
