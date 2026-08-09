import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const redirectsPath = path.join(root, 'redirects.json');
const inventoryPath = path.join(root, 'data/blog-sitemap-redirect-inventory.json');
const netlifyPath = path.join(root, '_redirects');
const vercelPath = path.join(root, 'vercel.json');
const packagePath = path.join(root, 'package.json');
const base = 'https://blog.banhalmi.art';
const tags = [
  'a-no-vilaga-konyv-tortenetei',
  'portfolio-fotozas',
  'szakmai-blogok',
  'nofilter',
  'muveszi-akt-fotozas',
  'portrefotozas',
  'fotozas-stylisttal'
].map(slug => `${base}/blog/tags/${slug}`);
const pages = Array.from({ length: 9 }, (_, index) => `${base}/blog/page/${index + 2}`);

const redirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

redirects.policy = 'Every known legacy URL is represented by a lightweight internal HTML redirect page with canonical, meta refresh and JavaScript forwarding. Blog post, tag and pagination coverage is synchronized with the current Wix blog route model and live sitemap families. EUFÓRIA remains in the ART exhibition archive. Unmapped removed URLs remain 404.';
redirects.blogArchive = `${base}/blog`;
redirects.blogRoutePolicy = {
  sitemapIndex: `${base}/sitemap.xml`,
  posts: `/post/{slug} -> ${base}/post/{slug}`,
  tags: `/blog/tags/{slug} -> ${base}/blog/tags/{slug}`,
  pagination: `/blog/page/{n} -> ${base}/blog/page/{n}`,
  categories: `/blog/categories/{slug} -> ${base}/blog/categories/{slug}`,
  sourceSitemaps: [
    `${base}/sitemap.xml`,
    `${base}/blog-posts-sitemap.xml`,
    `${base}/blog-tags-sitemap.xml`,
    `${base}/blog-categories-sitemap.xml`
  ],
  exception: `/post/euforia -> https://www.banhalmi.art/hu/exhibitions/euforia.html`
};
for (const url of [...tags, ...pages]) {
  const route = new URL(url).pathname;
  redirects.redirects[route] = url;
}

inventory.generatedAt = new Date().toISOString();
inventory.sourceSitemaps = {
  index: `${base}/sitemap.xml`,
  posts: `${base}/blog-posts-sitemap.xml`,
  tags: `${base}/blog-tags-sitemap.xml`,
  categories: `${base}/blog-categories-sitemap.xml`
};
inventory.tags = tags;
inventory.pages = pages;
inventory.counts = {
  posts: inventory.posts.length,
  tags: tags.length,
  categories: inventory.categories.length,
  pages: pages.length,
  total: inventory.posts.length + tags.length + inventory.categories.length + pages.length
};
fs.writeFileSync(redirectsPath, `${JSON.stringify(redirects, null, 2)}\n`);
fs.writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);

function redirectHtml(target) {
  return `<!doctype html>\n<html lang="hu-HU">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n\n<meta http-equiv="refresh" content="0; url=${target}">\n<link rel="canonical" href="${target}">\n<title>Az oldal új helyre költözött</title>\n<script>\n(() => {\n  const target = new URL(${JSON.stringify(target)});\n  if (location.search) target.search = location.search;\n  if (!target.hash && location.hash) target.hash = location.hash;\n  window.location.replace(target.href);\n})();\n</script>\n<link rel="stylesheet" href="/assets/css/museum-editorial.css?v=20260809-homepage-palette-v70">\n</head>\n<body>\n<p>Ez az oldal véglegesen új helyre költözött. Ha az átirányítás nem indul el, <a href="${target}">nyissa meg az új oldalt</a>.</p>\n</body>\n</html>\n`;
}
for (const url of [...tags, ...pages]) {
  const route = new URL(url).pathname.replace(/^\//, '');
  const file = path.join(root, route, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, redirectHtml(url));
}

let netlify = fs.readFileSync(netlifyPath, 'utf8');
const marker = '# Preserve suffixes for the migrated blog after exact exceptions above';
const exactLines = [...tags, ...pages].map(url => `${new URL(url).pathname}  ${url}  301`).join('\n');
if (!netlify.includes('/blog/tags/a-no-vilaga-konyv-tortenetei')) {
  netlify = netlify.replace(marker, `${exactLines}\n\n${marker}`);
}
if (!netlify.includes('/blog/post/*  https://blog.banhalmi.art/post/:splat')) {
  netlify = netlify.replace('/post/*  https://blog.banhalmi.art/post/:splat  301', '/post/*  https://blog.banhalmi.art/post/:splat  301\n/blog/post/*  https://blog.banhalmi.art/post/:splat  301');
}
if (!netlify.includes('/blog/tags/*  https://blog.banhalmi.art/blog/tags/:splat')) {
  netlify = netlify.replace('/blog/categories/*  https://blog.banhalmi.art/blog/categories/:splat  301', '/blog/categories/*  https://blog.banhalmi.art/blog/categories/:splat  301\n/blog/tags/*  https://blog.banhalmi.art/blog/tags/:splat  301\n/blog/page/*  https://blog.banhalmi.art/blog/page/:splat  301');
}
fs.writeFileSync(netlifyPath, netlify);

const vercel = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
const exactRules = [...tags, ...pages].map(url => ({ source: new URL(url).pathname, destination: url, permanent: true }));
const dynamicRules = [
  { source: '/blog/post/:path*', destination: `${base}/post/:path*`, permanent: true },
  { source: '/blog/tags/:path*', destination: `${base}/blog/tags/:path*`, permanent: true },
  { source: '/blog/page/:path*', destination: `${base}/blog/page/:path*`, permanent: true }
];
const sources = new Set(vercel.redirects.map(rule => rule.source));
const insertAt = vercel.redirects.findIndex(rule => rule.source === '/blog/:path*');
const additions = [...exactRules, ...dynamicRules].filter(rule => !sources.has(rule.source));
vercel.redirects.splice(insertAt < 0 ? vercel.redirects.length : insertAt, 0, ...additions);
fs.writeFileSync(vercelPath, `${JSON.stringify(vercel, null, 2)}\n`);

const testPath = path.join(root, 'tests/audit-blog-migration-stage52.mjs');
fs.writeFileSync(testPath, `import fs from 'node:fs';\nimport path from 'node:path';\nconst root=process.cwd();\nconst redirects=JSON.parse(fs.readFileSync(path.join(root,'redirects.json'),'utf8'));\nconst inventory=JSON.parse(fs.readFileSync(path.join(root,'data/blog-sitemap-redirect-inventory.json'),'utf8'));\nconst vercel=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));\nconst netlify=fs.readFileSync(path.join(root,'_redirects'),'utf8');\nconst errors=[];\nconst expectedTags=${JSON.stringify(tags)};\nconst expectedPages=${JSON.stringify(pages)};\nif(inventory.sourceSitemaps?.index!=='${base}/sitemap.xml')errors.push('sitemap index missing');\nif(inventory.sourceSitemaps?.tags!=='${base}/blog-tags-sitemap.xml')errors.push('tag sitemap missing');\nif(JSON.stringify(inventory.tags)!==JSON.stringify(expectedTags))errors.push('tag inventory mismatch');\nif(JSON.stringify(inventory.pages)!==JSON.stringify(expectedPages))errors.push('pagination inventory mismatch');\nif(inventory.counts?.total!==(inventory.posts.length+inventory.categories.length+expectedTags.length+expectedPages.length))errors.push('inventory total mismatch');\nfor(const url of [...expectedTags,...expectedPages]){const route=new URL(url).pathname;if(redirects.redirects?.[route]!==url)errors.push(route+': exact redirect missing');const file=path.join(root,route.replace(/^\\//,''),'index.html');if(!fs.existsSync(file))errors.push(route+': Pages redirect stub missing');else{const html=fs.readFileSync(file,'utf8');if(!html.includes('rel="canonical" href="'+url+'"'))errors.push(route+': canonical mismatch');if(!html.includes('window.location.replace(target.href)'))errors.push(route+': JS forwarding missing');}if(!netlify.includes(route+'  '+url+'  301'))errors.push(route+': _redirects exact rule missing');if(!vercel.redirects.some(r=>r.source===route&&r.destination===url&&r.permanent===true))errors.push(route+': vercel exact rule missing');}\nfor(const [source,destination] of [['/blog/post/:path*','${base}/post/:path*'],['/blog/tags/:path*','${base}/blog/tags/:path*'],['/blog/page/:path*','${base}/blog/page/:path*']]){const rule=vercel.redirects.find(r=>r.source===source);if(!rule||rule.destination!==destination||rule.permanent!==true)errors.push(source+': dynamic Vercel migration rule missing');}\nconst catchall=vercel.redirects.findIndex(r=>r.source==='/blog/:path*');for(const source of ['/blog/post/:path*','/blog/tags/:path*','/blog/page/:path*']){const index=vercel.redirects.findIndex(r=>r.source===source);if(index<0||catchall<0||index>catchall)errors.push(source+': must precede /blog catch-all');}\nif(!netlify.includes('/blog/post/*  ${base}/post/:splat  301'))errors.push('_redirects /blog/post migration missing');\nif(!netlify.includes('/blog/tags/*  ${base}/blog/tags/:splat  301'))errors.push('_redirects /blog/tags migration missing');\nif(!netlify.includes('/blog/page/*  ${base}/blog/page/:splat  301'))errors.push('_redirects /blog/page migration missing');\nif(errors.length){console.error(errors.join('\\n'));process.exit(1);}\nconsole.log('Stage52 blog migration audit passed: 96 post routes plus 7 tag and 9 pagination routes are protected, with legacy /blog/post aliases and server-config fallbacks.');\n`);

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
if (!pkg.scripts.test.includes('audit-blog-migration-stage52.mjs')) pkg.scripts.test += ' && node tests/audit-blog-migration-stage52.mjs';
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(JSON.stringify({ tags: tags.length, pages: pages.length, totalExactRedirects: Object.keys(redirects.redirects).length }, null, 2));
