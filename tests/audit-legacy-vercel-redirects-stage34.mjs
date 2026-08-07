import fs from 'node:fs';

const vercel = JSON.parse(fs.readFileSync('vercel.json','utf8'));
const redirects = vercel.redirects || [];
const map = new Map(redirects.filter(r => !r.has).map(r => [r.source, r]));

const required = {
  '/kapcsolat': 'https://www.norbertbanhalmi.com/hu/kapcsolat/',
  '/ajanlatkeres': 'https://www.norbertbanhalmi.com/hu/ajanlatkeres/',
  '/gyakori-kerdesek': 'https://www.norbertbanhalmi.com/hu/gyik/',
  '/service-page/portrait': 'https://www.norbertbanhalmi.com/hu/portre/',
  '/service-page/event-photography': 'https://www.norbertbanhalmi.com/hu/rendezvenyfotozas/',
  '/curators': '/hu/curators.html',
  '/fotokiallitasok/ebredes': '/hu/exhibitions/ebredes.html',
  '/fotokiallitasok/balerina-project-new-york': '/hu/exhibitions/balerina-project-new-york.html',
  '/post/euforia': '/hu/exhibitions/euforia.html',
  '/blog': 'https://blog.banhalmi.art/blog',
  '/blog/categories': 'https://blog.banhalmi.art/blog/categories',
  '/post/60-perc': 'https://blog.banhalmi.art/post/60-perc',
  '/post/a-fonix-jegpancelban': 'https://blog.banhalmi.art/post/a-fonix-jegpancelban',
  '/post/:path*': 'https://blog.banhalmi.art/post/:path*',
  '/blog/:path*': 'https://blog.banhalmi.art/blog/:path*'
};

for (const [source,destination] of Object.entries(required)) {
  const rule = map.get(source);
  if (!rule) throw new Error(`Missing Vercel legacy redirect: ${source}`);
  if (rule.destination !== destination) throw new Error(`${source}: expected ${destination}, got ${rule.destination}`);
  if (rule.permanent !== true) throw new Error(`${source}: legacy redirect must be permanent`);
}

const bannedDestinations = redirects.filter(r => /regegaleria|vipach/i.test(r.destination || ''));
if (bannedDestinations.length) throw new Error('REGE/VIPACH must remain separate from BANHALMI legacy redirect routing');

const blogLegacy = redirects.filter(r => r.source === '/blog' || r.source.startsWith('/post/') || r.source.startsWith('/blog/'));
for (const r of blogLegacy) {
  if (r.source === '/post/euforia') continue;
  if (!String(r.destination).startsWith('https://blog.banhalmi.art/')) {
    throw new Error(`${r.source}: blog legacy route must resolve inside blog.banhalmi.art`);
  }
}

const professionalLegacy = ['/kapcsolat','/ajanlatkeres','/arak','/fotozas-arak','/gyakori-kerdesek','/service-page/portrait','/service-page/event-photography','/service-page/fine-art','/service-page/lifestyle-family'];
for (const source of professionalLegacy) {
  const r = map.get(source);
  if (!r || !String(r.destination).startsWith('https://www.norbertbanhalmi.com/')) {
    throw new Error(`${source}: professional legacy route must resolve inside norbertbanhalmi.com`);
  }
}

const signatures = redirects.map(r => JSON.stringify({source:r.source,has:r.has || null}));
if (new Set(signatures).size !== signatures.length) throw new Error('Duplicate Vercel redirect source with identical conditions detected');

const conditionedRoot = redirects.filter(r => r.source === '/' && Array.isArray(r.has));
if (conditionedRoot.length !== 2) throw new Error('Expected exactly two conditioned root language redirects (HU and DE)');

console.log(`Stage 34 legacy redirect audit passed: ${redirects.length} Vercel rules preserve ART / professional / blog ecosystem roles.`);
