import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

const journeys = {
  'index.html': `
<section id="journey" class="tone-a"><div class="wrap">
  <span id="presence-periods" class="archive-anchor" aria-hidden="true"></span>
  <div class="intro">
    <p class="label">Career arc</p>
    <h2>How it took shape</h2>
    <p class="lead">There was no single turning point. Photography became a task while I worked in information technology for the Hungarian Defence Forces; clubs turned it into portrait practice; after the New York exhibition it became an independent body of work.</p>
  </div>
  <div class="timeline" data-chronology="account">
    <div class="t-item"><span class="yr">1979–1998</span><h3>Family and visual background</h3><p>I was born in Budapest. Painting, design, handcraft and photography were present across several generations on my mother’s side. It did not prescribe an artistic career, but made making things feel natural.</p></div>
    <div class="t-item"><span class="yr">1999–2006</span><h3>Documentation, systems and the beginning of HIPStudio</h3><p>At the Communications and Information Technology Command of the Hungarian Defence Forces I worked in IT and telecommunications while documenting internal events. I learned that a photograph is simultaneously a moment, a piece of information and a retrievable document.</p></div>
    <div class="t-item"><span class="yr">2006–2013</span><h3>Among people — the portrait approach develops</h3><p>HIPStudio continued independently. We documented clubs, radio stations, automotive events and programmes at the Hungaroring. After tens of thousands of portraits I understood that a good portrait begins not with the face, but with trust.</p></div>
    <div class="t-item"><span class="yr">2014–2016</span><h3>An authorial voice and international opening</h3><p>Alongside commissioned photography, personal and social subjects became increasingly important. The True Women, Hungarian Women in New York, I Became a Father and Milestones ’56 projects connected portraiture, memory and human testimony as independent artistic statements.</p></div>
    <div class="t-item"><span class="yr">2017–2018</span><h3>Books, the body and transformation</h3><p>Fragments, Awakening and The World of Women focused on personal experience, recovery, the body and identity. The photographic series continued their lives as both books and exhibitions.</p></div>
    <div class="t-item"><span class="yr">2018–2022</span><h3>Ambassadorial, curatorial and institutional work</h3><p>As an OM SYSTEM Ambassador and through exhibitions and community projects, education, curatorial thinking and institutional presentation became increasingly connected to image-making.</p></div>
    <div class="t-item"><span class="yr">2023–2026</span><h3>Vienna and Budapest — two bases, one practice</h3><p>The two-city practice brought executive portraiture, visual strategy, fine art and community initiatives into one system. Touch, Femme Fatale, Different Image / Other and the widely published Péter Magyar portrait show different sides of this period.</p></div>
    <div class="t-item"><span class="yr">Present</span><h3>Organising the oeuvre</h3><p>The professional and artistic practices now have distinct platforms but share the same creative foundation. BANHALMI ART preserves projects, books, exhibitions, press records and verified sources as a durable, searchable archive.</p></div>
    <div class="t-item"><span class="yr">In development</span><h3>EUFÓRIA</h3><p>The next major artistic project is in progress. EUFÓRIA is being created between March 2026 and September 2027, with its first presentation planned for November 2027.</p></div>
  </div>
</div></section>
`,
  'de-at/index.html': `
<section id="journey" class="tone-a"><div class="wrap">
  <span id="presence-periods" class="archive-anchor" aria-hidden="true"></span>
  <div class="intro">
    <p class="label">Laufbahn</p>
    <h2>Wie sie sich aufgebaut hat</h2>
    <p class="lead">Es gab keinen einzelnen Wendepunkt. Während meiner Arbeit in der Informationstechnik der ungarischen Streitkräfte wurde Fotografie zur Aufgabe; in Clubs wurde daraus Porträtpraxis; nach der New Yorker Ausstellung entstand daraus eine eigenständige künstlerische Arbeit.</p>
  </div>
  <div class="timeline" data-chronology="account">
    <div class="t-item"><span class="yr">1979–1998</span><h3>Familiärer und visueller Hintergrund</h3><p>Ich wurde in Budapest geboren. Auf der mütterlichen Seite waren Malerei, Gestaltung, Handwerk und Fotografie über mehrere Generationen präsent. Das gab keinen vorgezeichneten Kunstweg vor, aber eine selbstverständliche Nähe zum Gestalten.</p></div>
    <div class="t-item"><span class="yr">1999–2006</span><h3>Dokumentation, Systeme und der Beginn von HIPStudio</h3><p>Beim Kommando für Nachrichtenwesen und Informationstechnik der ungarischen Streitkräfte arbeitete ich in IT und Telekommunikation und dokumentierte zugleich interne Veranstaltungen. Dort lernte ich, dass ein Bild zugleich Moment, Information und später wieder auffindbares Dokument ist.</p></div>
    <div class="t-item"><span class="yr">2006–2013</span><h3>Unter Menschen — die Porträthaltung entsteht</h3><p>HIPStudio wurde selbstständig weitergeführt. Wir dokumentierten Clubs, Radiosender, Autoevents und Veranstaltungen am Hungaroring. Nach Zehntausenden Porträts verstand ich, dass ein gutes Porträt nicht mit dem Gesicht, sondern mit Vertrauen beginnt.</p></div>
    <div class="t-item"><span class="yr">2014–2016</span><h3>Eigene Autorensprache und internationale Öffnung</h3><p>Neben der Auftragsfotografie wurden persönliche und gesellschaftliche Themen wichtiger. Wahre Frauen, Ungarische Frauen in New York, Ich wurde Vater und Meilensteine ’56 verbanden Porträt, Erinnerung und menschliche Zeugnisse zu eigenständigen künstlerischen Aussagen.</p></div>
    <div class="t-item"><span class="yr">2017–2018</span><h3>Bücher, Körper und Veränderung</h3><p>Fragmente, Erwachen und Die Welt der Frau stellten persönliche Erfahrung, Heilung, Körper und Identität in den Mittelpunkt. Die Serien lebten als Bücher und Ausstellungen weiter.</p></div>
    <div class="t-item"><span class="yr">2018–2022</span><h3>Botschafter-, kuratorische und institutionelle Arbeit</h3><p>Als OM SYSTEM Ambassador sowie durch Ausstellungen und Gemeinschaftsprojekte verbanden sich Bildproduktion, Lehre, kuratorisches Denken und institutionelle Präsentation immer stärker.</p></div>
    <div class="t-item"><span class="yr">2023–2026</span><h3>Wien und Budapest — zwei Standorte, eine Praxis</h3><p>Die Arbeit an beiden Standorten verband Executive-Porträt, visuelle Strategie, Fine Art und Gemeinschaftsinitiativen. Touch, Femme Fatale, Anderes Bild / Anders und das international publizierte Péter-Magyar-Porträt zeigen unterschiedliche Seiten dieser Phase.</p></div>
    <div class="t-item"><span class="yr">Gegenwart</span><h3>Die Ordnung des Werks</h3><p>Professionelle und künstlerische Praxis haben heute getrennte Plattformen, beruhen aber auf derselben gestalterischen Grundlage. BANHALMI ART bewahrt Projekte, Bücher, Ausstellungen, Pressebelege und geprüfte Quellen dauerhaft und recherchierbar.</p></div>
    <div class="t-item"><span class="yr">In Entwicklung</span><h3>EUFÓRIA</h3><p>Das nächste große Kunstprojekt entsteht zwischen März 2026 und September 2027; die erste Präsentation ist für November 2027 vorgesehen.</p></div>
  </div>
</div></section>
`,
};

const homeTargets = {
  'index.html': { gallery: '/#works', about: '/#about', oeuvre: '/#journey' },
  'hu/index.html': { gallery: '/hu/#works', about: '/hu/#about', oeuvre: '/hu/#journey' },
  'de-at/index.html': { gallery: '/de-at/#works', about: '/de-at/#about', oeuvre: '/de-at/#journey' },
};

for (const [rel, targets] of Object.entries(homeTargets)) {
  const file = path.join(root, rel);
  let html = await readFile(file, 'utf8');
  if (!/\sid=["']journey["']/.test(html)) {
    const section = journeys[rel];
    if (!section) throw new Error(`${rel}: missing translated journey source`);
    if (!/<section id="books"/.test(html)) throw new Error(`${rel}: books insertion point missing`);
    html = html.replace('<section id="books"', `${section}\n<section id="books"`);
  }
  await writeFile(file, html, 'utf8');
}

const skip = new Set(['.git', 'node_modules', '.github', 'data', 'reports']);
async function walk(dir, out = []) {
  for (const entry of await (await import('node:fs/promises')).readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}
function lang(rel){return rel.startsWith('hu/')?'hu':rel.startsWith('de-at/')?'de':'en'}
const targetsByLang = {
  en: { gallery: '/#works', about: '/#about', oeuvre: '/#journey' },
  hu: { gallery: '/hu/#works', about: '/hu/#about', oeuvre: '/hu/#journey' },
  de: { gallery: '/de-at/#works', about: '/de-at/#about', oeuvre: '/de-at/#journey' },
};
for (const file of await walk(root)) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  let html = await readFile(file, 'utf8');
  if (!/data-nav-role=/.test(html)) continue;
  const t = targetsByLang[lang(rel)];
  html = html.replace(/(data-nav-role="gallery" href=")[^"]+/, `$1${t.gallery}`)
    .replace(/(data-nav-role="about" href=")[^"]+/, `$1${t.about}`)
    .replace(/(data-nav-role="oeuvre" href=")[^"]+/, `$1${t.oeuvre}`);
  await writeFile(file, html, 'utf8');
}

console.log('Multilingual journey sections and absolute language-safe menu destinations applied.');
