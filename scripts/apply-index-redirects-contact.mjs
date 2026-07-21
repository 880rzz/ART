import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MAPS_BUDAPEST = 'https://www.google.com/maps/search/?api=1&query=L%C3%A1gym%C3%A1nyosi%20u.%2015%2C%201111%20Budapest%2C%20Hungary';
const MAPS_VIENNA = 'https://www.google.com/maps/search/?api=1&query=Schwedenplatz%202%2C%201010%20Vienna%2C%20Austria';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.git' || entry.name === 'node_modules') return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function languageFor(rel) {
  if (rel.startsWith('hu/')) return 'hu';
  if (rel.startsWith('de-at/')) return 'de';
  return 'en';
}

function contactHref(rel) {
  const lang = languageFor(rel);
  const home = lang === 'hu' ? 'hu/index.html' : lang === 'de' ? 'de-at/index.html' : 'index.html';
  let target = path.relative(path.dirname(rel), home).replaceAll('\\', '/');
  if (!target || target === '') target = 'index.html';
  return `${target}#contact`;
}

const menuCopy = {
  en: ['Contact', 'Vienna and Budapest studio addresses, telephone numbers and directions.'],
  de: ['Kontakt', 'Studioadressen, Telefonnummern und Anfahrt in Wien und Budapest.'],
  hu: ['Kapcsolat', 'A budapesti és a bécsi stúdió címe, telefonszáma és megközelítése.']
};

for (const file of walk(ROOT).filter((f) => f.endsWith('.html'))) {
  const rel = path.relative(ROOT, file).replaceAll('\\', '/');
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('class="m-foot"') || /class="m-main"[^>]+href="[^"]*#contact"/.test(html)) continue;
  const lang = languageFor(rel);
  const [title, desc] = menuCopy[lang];
  const item = `    <a class="m-main" href="${contactHref(rel)}">${title}</a>\n    <p class="m-desc">${desc}</p>\n`;
  html = html.replace(/(\s*<div class="m-foot">)/, `\n${item}$1`);
  fs.writeFileSync(file, html);
}

const contactSections = {
  'index.html': `<section id="contact" class="tone-a"><div class="wrap">
  <div class="intro">
    <p class="label">Contact</p><h2>Get in touch</h2>
    <p class="lead">Studio enquiries, exhibitions &amp; print sales</p>
    <p style="margin-top:1.2rem"><a class="btn" href="mailto:hello@norbertbanhalmi.com">hello@norbertbanhalmi.com</a></p>
  </div>
  <div class="cards">
    <article class="card"><span class="yr">Budapest studio</span><h3><a href="${MAPS_BUDAPEST}" target="_blank" rel="noopener">Lágymányosi u. 15.</a></h3><p>1111 Budapest, Hungary · Doorbell 8</p><p style="margin-top:.8rem"><a href="tel:+36704698397">+36 70 469 83 97</a></p><p><a href="${MAPS_BUDAPEST}" target="_blank" rel="noopener">Open in Google Maps →</a></p></article>
    <article class="card"><span class="yr">Vienna studio</span><h3><a href="${MAPS_VIENNA}" target="_blank" rel="noopener">Schwedenplatz 2.</a></h3><p>1010 Vienna, Austria · Doorbell 9</p><p style="margin-top:.8rem"><a href="tel:+4367761655592">+43 677 616 55592</a> · WhatsApp</p><p><a href="${MAPS_VIENNA}" target="_blank" rel="noopener">Open in Google Maps →</a></p></article>
  </div>
  <div class="note" style="margin-top:2.5rem"><p class="label" style="margin-bottom:.5rem">The professional side</p><p>Commissions, executive portraits, brand and event photography live on my professional site. <a href="https://www.norbertbanhalmi.com/" target="_blank" rel="noopener">norbertbanhalmi.com →</a></p></div>
</div></section>`,
  'de-at/index.html': `<section id="contact" class="tone-a"><div class="wrap">
  <div class="intro"><p class="label">Kontakt</p><h2>Kontakt aufnehmen</h2><p class="lead">Studioanfragen, Ausstellungen &amp; Printverkauf</p><p style="margin-top:1.2rem"><a class="btn" href="mailto:hello@norbertbanhalmi.com">hello@norbertbanhalmi.com</a></p></div>
  <div class="cards">
    <article class="card"><span class="yr">Studio Budapest</span><h3><a href="${MAPS_BUDAPEST}" target="_blank" rel="noopener">Lágymányosi u. 15.</a></h3><p>1111 Budapest, Ungarn · Türklingel 8</p><p style="margin-top:.8rem"><a href="tel:+36704698397">+36 70 469 83 97</a></p><p><a href="${MAPS_BUDAPEST}" target="_blank" rel="noopener">In Google Maps öffnen →</a></p></article>
    <article class="card"><span class="yr">Studio Wien</span><h3><a href="${MAPS_VIENNA}" target="_blank" rel="noopener">Schwedenplatz 2.</a></h3><p>1010 Wien, Österreich · Türklingel 9</p><p style="margin-top:.8rem"><a href="tel:+4367761655592">+43 677 616 55592</a> · WhatsApp</p><p><a href="${MAPS_VIENNA}" target="_blank" rel="noopener">In Google Maps öffnen →</a></p></article>
  </div>
  <div class="note" style="margin-top:2.5rem"><p class="label" style="margin-bottom:.5rem">Die professionelle Seite</p><p>Auftragsarbeiten, Executive-Porträts, Brand- und Eventfotografie finden Sie auf meiner professionellen Website. <a href="https://www.norbertbanhalmi.com/de-at/" target="_blank" rel="noopener">norbertbanhalmi.com →</a></p></div>
</div></section>`,
  'hu/index.html': `<section id="contact" class="tone-a"><div class="wrap">
  <div class="intro"><p class="label">Kapcsolat</p><h2>Lépj kapcsolatba velem</h2><p class="lead">Stúdiómegkeresések, kiállítások és printvásárlás</p><p style="margin-top:1.2rem"><a class="btn" href="mailto:hello@norbertbanhalmi.com">hello@norbertbanhalmi.com</a></p></div>
  <div class="cards">
    <article class="card"><span class="yr">Budapesti stúdió</span><h3><a href="${MAPS_BUDAPEST}" target="_blank" rel="noopener">Lágymányosi u. 15.</a></h3><p>1111 Budapest, Magyarország · 8-as kapucsengő</p><p style="margin-top:.8rem"><a href="tel:+36704698397">+36 70 469 83 97</a></p><p><a href="${MAPS_BUDAPEST}" target="_blank" rel="noopener">Megnyitás a Google Térképen →</a></p></article>
    <article class="card"><span class="yr">Bécsi stúdió</span><h3><a href="${MAPS_VIENNA}" target="_blank" rel="noopener">Schwedenplatz 2.</a></h3><p>1010 Wien, Ausztria · 9-es kapucsengő</p><p style="margin-top:.8rem"><a href="tel:+4367761655592">+43 677 616 55592</a> · WhatsApp</p><p><a href="${MAPS_VIENNA}" target="_blank" rel="noopener">Megnyitás a Google Térképen →</a></p></article>
  </div>
  <div class="note" style="margin-top:2.5rem"><p class="label" style="margin-bottom:.5rem">A professzionális oldal</p><p>Megbízások, executive portrék, brand- és rendezvényfotózás a professzionális weboldalon. <a href="https://www.norbertbanhalmi.com/hu/" target="_blank" rel="noopener">norbertbanhalmi.com →</a></p></div>
</div></section>`
};

for (const [rel, replacement] of Object.entries(contactSections)) {
  const file = path.join(ROOT, rel);
  let html = fs.readFileSync(file, 'utf8');
  const re = /<section id="contact"[\s\S]*?<\/section>/;
  if (!re.test(html)) throw new Error(`Contact section not found: ${rel}`);
  html = html.replace(re, replacement);
  fs.writeFileSync(file, html);
}

const redirects = `# Old indexed Wix URLs: exact Hungarian equivalent when available; otherwise archive root
/norbert-banhalmi  https://www.norbertbanhalmi.com/hu/eletmu/  301
/kapcsolat  https://www.norbertbanhalmi.com/hu/kapcsolat/  301
/fotozas-arak  https://www.norbertbanhalmi.com/hu/ajanlatkeres/  301
/arak  https://www.norbertbanhalmi.com/hu/ajanlatkeres/  301
/gyakori-kerdesek  https://www.norbertbanhalmi.com/hu/gyik/  301
/service-page/lifestyle-family  https://www.norbertbanhalmi.com/hu/brand/  301
/service-page/portrait  https://www.norbertbanhalmi.com/hu/portre/  301
/service-page/event-photography  https://www.norbertbanhalmi.com/hu/rendezvenyfotozas/  301
/service-page/fine-art  https://www.norbertbanhalmi.com/hu/muveszi-fotografia/  301
/konyveim  https://www.banhalmi.art/  301
/mediamegjelenesek  https://www.banhalmi.art/  301
/curators  https://www.banhalmi.art/  301
/fotokiallitasok  https://www.banhalmi.art/  301
/fotokiallitasok/*  https://www.banhalmi.art/  301
/post/*  https://www.banhalmi.art/  301
/blog  https://www.banhalmi.art/  301
/blog/*  https://www.banhalmi.art/  301
/20ev  https://www.banhalmi.art/  301
/*  /404.html  404
`;
fs.writeFileSync(path.join(ROOT, '_redirects'), redirects);

// Remove this one-time migration machinery from the resulting commit.
for (const rel of ['scripts/apply-index-redirects-contact.mjs', '.github/workflows/apply-index-redirects-contact.yml']) {
  const file = path.join(ROOT, rel);
  if (fs.existsSync(file)) fs.rmSync(file);
}
