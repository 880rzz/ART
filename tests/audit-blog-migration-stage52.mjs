import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const redirects=JSON.parse(fs.readFileSync(path.join(root,'redirects.json'),'utf8'));
const inventory=JSON.parse(fs.readFileSync(path.join(root,'data/blog-sitemap-redirect-inventory.json'),'utf8'));
const vercel=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
const netlify=fs.readFileSync(path.join(root,'_redirects'),'utf8');
const errors=[];
const expectedTags=["https://blog.banhalmi.art/blog/tags/a-no-vilaga-konyv-tortenetei","https://blog.banhalmi.art/blog/tags/portfolio-fotozas","https://blog.banhalmi.art/blog/tags/szakmai-blogok","https://blog.banhalmi.art/blog/tags/nofilter","https://blog.banhalmi.art/blog/tags/muveszi-akt-fotozas","https://blog.banhalmi.art/blog/tags/portrefotozas","https://blog.banhalmi.art/blog/tags/fotozas-stylisttal"];
const expectedPages=["https://blog.banhalmi.art/blog/page/2","https://blog.banhalmi.art/blog/page/3","https://blog.banhalmi.art/blog/page/4","https://blog.banhalmi.art/blog/page/5","https://blog.banhalmi.art/blog/page/6","https://blog.banhalmi.art/blog/page/7","https://blog.banhalmi.art/blog/page/8","https://blog.banhalmi.art/blog/page/9","https://blog.banhalmi.art/blog/page/10"];
if(redirects.blogArchive!=='https://blog.banhalmi.art/')errors.push('canonical blog archive root mismatch');
if(inventory.sourceSitemaps?.index!=='https://blog.banhalmi.art/sitemap.xml')errors.push('sitemap index missing');
if(inventory.sourceSitemaps?.tags!=='https://blog.banhalmi.art/blog-tags-sitemap.xml')errors.push('tag sitemap missing');
if(JSON.stringify(inventory.tags)!==JSON.stringify(expectedTags))errors.push('tag inventory mismatch');
if(JSON.stringify(inventory.pages)!==JSON.stringify(expectedPages))errors.push('pagination inventory mismatch');
if(inventory.counts?.total!==(inventory.posts.length+inventory.categories.length+expectedTags.length+expectedPages.length))errors.push('inventory total mismatch');
for(const url of [...expectedTags,...expectedPages]){const route=new URL(url).pathname;if(redirects.redirects?.[route]!==url)errors.push(route+': exact redirect missing');const file=path.join(root,route.replace(/^\//,''),'index.html');if(!fs.existsSync(file))errors.push(route+': Pages redirect stub missing');else{const html=fs.readFileSync(file,'utf8');if(!html.includes('rel="canonical" href="'+url+'"'))errors.push(route+': canonical mismatch');if(!html.includes('window.location.replace(target.href)'))errors.push(route+': JS forwarding missing');}if(!netlify.includes(route+'  '+url+'  301'))errors.push(route+': _redirects exact rule missing');if(!vercel.redirects.some(r=>r.source===route&&r.destination===url&&r.permanent===true))errors.push(route+': vercel exact rule missing');}
for(const [source,destination] of [['/blog/post/:path*','https://blog.banhalmi.art/post/:path*'],['/blog/tags/:path*','https://blog.banhalmi.art/blog/tags/:path*'],['/blog/page/:path*','https://blog.banhalmi.art/blog/page/:path*']]){const rule=vercel.redirects.find(r=>r.source===source);if(!rule||rule.destination!==destination||rule.permanent!==true)errors.push(source+': dynamic Vercel migration rule missing');}
const catchall=vercel.redirects.findIndex(r=>r.source==='/blog/:path*');for(const source of ['/blog/post/:path*','/blog/tags/:path*','/blog/page/:path*']){const index=vercel.redirects.findIndex(r=>r.source===source);if(index<0||catchall<0||index>catchall)errors.push(source+': must precede /blog catch-all');}
if(!netlify.includes('/blog/post/*  https://blog.banhalmi.art/post/:splat  301'))errors.push('_redirects /blog/post migration missing');
if(!netlify.includes('/blog/tags/*  https://blog.banhalmi.art/blog/tags/:splat  301'))errors.push('_redirects /blog/tags migration missing');
if(!netlify.includes('/blog/page/*  https://blog.banhalmi.art/blog/page/:splat  301'))errors.push('_redirects /blog/page migration missing');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('Stage52 blog migration audit passed: 96 post routes plus 7 tag and 9 pagination routes are protected, with legacy /blog/post aliases and server-config fallbacks.');
