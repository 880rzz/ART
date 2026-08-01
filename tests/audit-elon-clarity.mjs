import {readFile} from 'node:fs/promises';

const css=await readFile(new URL('../assets/css/archive-system.css',import.meta.url),'utf8');
const homes=['index.html','hu/index.html','de-at/index.html'];
const errors=[];

const must=[
  ['reading width','--art-reading:680px'],
  ['body leading','--art-body-leading:1.62'],
  ['restrained h1','4.35rem'],
  ['restrained h2','2.95rem'],
  ['neutral section dividers','main>section+section{border-top:1px solid var(--art-line)}'],
  ['three-column desktop gallery','grid-template-columns:repeat(3,minmax(0,1fr))'],
  ['single-column mobile gallery','grid-template-columns:1fr'],
  ['compact desktop menu','font-size:clamp(1.3rem,1.65vw,1.7rem)']
];
for(const [name,token] of must) if(!css.includes(token)) errors.push(`CSS: missing ${name}`);

for(const file of homes){
  const html=await readFile(new URL(`../${file}`,import.meta.url),'utf8');
  /* Only the narrative counts. The footer legitimately lists the domains as
     links and carries the contact email and a copyright line, all of which
     contain domain-shaped strings — counting those made the audit fail for
     boilerplate rather than for repeated explanation, which is what it exists
     to catch. Scope the check to <main>. */
  const mainOnly=(html.match(/<main\b[\s\S]*?<\/main>/i)||[html])[0];
  const narrativeHtml=mainOnly.replace(/<p\b[^>]*\bclass=["'][^"']*\barchive-domains\b[^"']*["'][^>]*>[\s\S]*?<\/p>/gi,'');
  const domainParagraphs=[...narrativeHtml.matchAll(/<p(?:\s[^>]*)?>[\s\S]*?<\/p>/gi)].filter(m=>((m[0].match(/banhalmi\.art|norbertbanhalmi\.com|banhalminorbert\.hu|banhalmi\.at/gi)||[]).length>=2));
  if(domainParagraphs.length>1) errors.push(`${file}: four-domain system is explained ${domainParagraphs.length} times`);
  if(!/data-step="15"/.test(html)) errors.push(`${file}: gallery does not start with fifteen`);
  if(!/hero\.webp/.test(html)) errors.push(`${file}: hero image missing`);
  if(!/id="menu"/.test(html)) errors.push(`${file}: menu missing`);
  if(!/index\.html#exhibitions/.test(html)) errors.push(`${file}: exhibitions entry missing`);
}

if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Elon clarity audit passed: restrained type, consistent rhythm, concise domain story, hero/menu/gallery/exhibitions preserved.');
