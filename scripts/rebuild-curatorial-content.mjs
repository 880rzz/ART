import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

const dossiers = {
  hu: `<section class="wrap narrow curatorial-dossier">
  <p class="label">Kurátori dosszié</p>
  <h2>Az életmű rövid áttekintése</h2>
  <p class="lead">Bánhalmi Norbert 1999 óta épülő fotográfiai életművében a portré, a dokumentáció és a személyes történetek egymásra épülnek. A katonai és intézményi környezetben megszerzett fegyelem később emberközpontú portrészemléletté alakult. A visszatérő témák az identitás, az emlékezet, a test, a gyógyulás, a közösség és a nyilvános jelenlét.</p>

  <h2>A kezdet: MOL Project</h2>
  <p class="lead">A MOL Project egy korai, saját kezdeményezésű fotográfiai munka volt. Nem a MOL vállalat megrendelésére készült, és nem vállalati kampány volt. A projektben Bánhalmi Norbert először kezdte tudatosan vizsgálni, hogyan változtatja meg a környezet, a munkaszerep és a fényképezőgép jelenléte az ember viselkedését. Az archívumban azért szerepel kiindulópontként, mert innen vezethető le a későbbi portré- és dokumentarista szemlélet.</p>

  <h2>Dokumentáció és portré</h2>
  <p class="lead">A honvédségi és rendezvénydokumentáció gyors helyzetfelismerést, pontosságot és felelősséget követelt. Ezek a tapasztalatok később a portrékban is megmaradtak: a képek nem szerepeket akarnak megerősíteni, hanem azt a pillanatot keresik, amikor a fényképezett ember természetesen és hitelesen van jelen.</p>

  <h2>New York és a személyes történetek</h2>
  <p class="lead">A New Yorkhoz kapcsolódó munkák a városi környezet, a magyar diaszpóra és a személyes emlékezet felé tágították a gyakorlatot. A <a href="exhibitions/fotokiallitas3.html">Magyar nők New Yorkban</a> és a <a href="exhibitions/merfoldkovek1956.html">Mérföldkövek ’56</a> esetében a portré egyszerre személyes dokumentum és történelmi forrás.</p>

  <h2>Test, gyógyulás és önkép</h2>
  <p class="lead">Az <a href="exhibitions/ebredes.html">Ébredés — az Új kezdet</a>, a <a href="exhibitions/szosszenetek.html">Szösszenetek</a> és <a href="exhibitions/anovilaga.html">A Nő világa</a> a betegséggel, a felépüléssel, az intimitással, az öregedéssel és a női életfordulókkal foglalkozik. A fotográfia ezekben a munkákban személyes történeteket őriz meg, nem pedig általános tételeket illusztrál.</p>

  <h2>Könyvek, kiállítások és közösségi munka</h2>
  <p class="lead">A három könyv, a kiállítások, a tihanyi Rege Galériához kapcsolódó kurátori munka, az oktatás és a bécsi közösségi projektek ugyanannak a pályának a részei. A teljes kronológia a <a href="/#exhibitions">kiállítások</a>, a <a href="/#books">könyvek</a>, a <a href="press.html">sajtóarchívum</a> és a <a href="community.html">közösségi dokumentáció</a> oldalain követhető.</p>

  <h2>Források</h2>
  <ul class="linklist">
    <li><a href="https://hu.wikipedia.org/wiki/B%C3%A1nhalmi_Norbert" target="_blank" rel="noopener noreferrer"><strong>Wikipédia</strong></a> — független életrajzi összefoglaló.</li>
    <li><a href="https://www.wikidata.org/wiki/Q56391118" target="_blank" rel="noopener noreferrer"><strong>Wikidata</strong></a> — az életmű központi, géppel olvasható entitásazonosítója.</li>
    <li><a href="https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image&search=Norbert%20Banhalmi" target="_blank" rel="noopener noreferrer"><strong>Wikimedia Commons</strong></a> — hivatkozható vizuális dokumentáció.</li>
    <li><a href="press.html"><strong>Sajtóarchívum</strong></a> — interjúk, riportok, kritikák és mozgóképes dokumentumok rövid magyarázatokkal.</li>
  </ul>
</section>`,
  en: `<section class="wrap narrow curatorial-dossier">
  <p class="label">Curatorial dossier</p><h2>A concise overview of the oeuvre</h2>
  <p class="lead">Norbert Bánhalmi's photographic oeuvre, developed since 1999, connects portraiture, documentation and personal testimony. The discipline acquired in military and institutional environments gradually became a human-centred approach to portraiture. Recurring subjects include identity, memory, the body, recovery, community and public presence.</p>
  <h2>The starting point: MOL Project</h2><p class="lead">MOL Project was an early self-initiated photographic study. It was not commissioned by the MOL company and was not a corporate campaign. The work examined how environment, professional role and the presence of a camera influence human behaviour. It is retained in the archive as an origin point for the later portrait and documentary practice.</p>
  <h2>Documentation and portraiture</h2><p class="lead">Military and event documentation required speed, precision and responsibility. These qualities remained in the later portraits, which look beyond assigned roles for moments of credible, unforced presence.</p>
  <h2>New York and personal histories</h2><p class="lead">The New York-related work expanded the practice toward urban experience, the Hungarian diaspora and personal memory. <a href="exhibitions/fotokiallitas3.html">Hungarian Women in New York</a> and <a href="exhibitions/merfoldkovek1956.html">Milestones ’56</a> function as both personal documents and records of shared history.</p>
  <h2>Body, recovery and self-image</h2><p class="lead"><a href="exhibitions/ebredes.html">Awakening — The New Beginning</a>, <a href="exhibitions/szosszenetek.html">Snippets</a> and <a href="exhibitions/anovilaga.html">The World of Woman</a> address illness, recovery, intimacy, ageing and life transitions through individual accounts rather than generalised claims.</p>
  <h2>Books, exhibitions and community work</h2><p class="lead">The books, exhibitions, curatorial activity connected to Rege Gallery, teaching and Vienna-based community projects form one continuous practice. The chronology can be followed through the <a href="/#exhibitions">exhibitions</a>, <a href="/#books">books</a>, <a href="press.html">press archive</a> and <a href="community.html">community record</a>.</p>
</section>`,
  de: `<section class="wrap narrow curatorial-dossier">
  <p class="label">Kuratorisches Dossier</p><h2>Ein kurzer Überblick über das Œuvre</h2>
  <p class="lead">Das seit 1999 entstehende fotografische Werk von Norbert Bánhalmi verbindet Porträt, Dokumentation und persönliche Zeugnisse. Die in militärischen und institutionellen Zusammenhängen erworbene Disziplin entwickelte sich zu einer menschenbezogenen Porträtauffassung. Wiederkehrende Themen sind Identität, Erinnerung, Körper, Genesung, Gemeinschaft und öffentliche Präsenz.</p>
  <h2>Der Ausgangspunkt: MOL Project</h2><p class="lead">MOL Project war eine frühe, selbst initiierte fotografische Arbeit. Sie entstand nicht im Auftrag des Unternehmens MOL und war keine Firmenkampagne. Untersucht wurde, wie Umgebung, berufliche Rolle und die Anwesenheit einer Kamera menschliches Verhalten verändern. Im Archiv steht das Projekt deshalb am Anfang der späteren Porträt- und Dokumentarpraxis.</p>
  <h2>Dokumentation und Porträt</h2><p class="lead">Militärische und veranstaltungsbezogene Dokumentation verlangten Schnelligkeit, Genauigkeit und Verantwortung. Diese Eigenschaften blieben in den späteren Porträts erhalten, die hinter zugewiesenen Rollen nach glaubwürdiger, ungezwungener Präsenz suchen.</p>
  <h2>New York und persönliche Geschichten</h2><p class="lead">Die mit New York verbundenen Arbeiten erweiterten die Praxis um urbane Erfahrung, die ungarische Diaspora und persönliche Erinnerung. <a href="exhibitions/fotokiallitas3.html">Ungarische Frauen in New York</a> und <a href="exhibitions/merfoldkovek1956.html">Meilensteine ’56</a> sind persönliche Dokumente und Zeugnisse gemeinsamer Geschichte.</p>
  <h2>Körper, Genesung und Selbstbild</h2><p class="lead"><a href="exhibitions/ebredes.html">Awakening — Der neue Anfang</a>, <a href="exhibitions/szosszenetek.html">Snippets</a> und <a href="exhibitions/anovilaga.html">The World of Woman</a> behandeln Krankheit, Genesung, Intimität, Altern und Lebensübergänge anhand individueller Geschichten.</p>
  <h2>Bücher, Ausstellungen und Gemeinschaftsarbeit</h2><p class="lead">Bücher, Ausstellungen, die kuratorische Tätigkeit in Verbindung mit der Rege Galerie, Unterricht und Gemeinschaftsprojekte in Wien bilden eine zusammenhängende Praxis. Die Chronologie ist über die Seiten zu <a href="/#exhibitions">Ausstellungen</a>, <a href="/#books">Büchern</a>, zum <a href="press.html">Pressearchiv</a> und zur <a href="community.html">Gemeinschaftsarbeit</a> nachvollziehbar.</p>
</section>`
};

const pressExplainers = {
  hu: `<section class="press-types" aria-labelledby="press-types-title"><div class="wrap"><p class="eyebrow">Az archívum felépítése</p><h2 id="press-types-title">Milyen dokumentumokat talál ezen az oldalon?</h2><div class="press-type-grid"><article><h3>Interjúk és portrék</h3><p>Beszélgetések Bánhalmi Norbert pályájáról, alkotói döntéseiről és a projektek személyes hátteréről.</p></article><article><h3>Kiállítási beszámolók</h3><p>Cikkek és tudósítások, amelyek egy-egy kiállítás létrejöttét, témáját vagy nyilvános fogadtatását dokumentálják.</p></article><article><h3>Szakmai és intézményi megjelenések</h3><p>Fotográfiai, technológiai, kurátori és közösségi munkához kapcsolódó publikációk.</p></article><article><h3>Televízió és videó</h3><p>Riportok, beszélgetések és kiállítási felvételek, amelyek mozgóképen őrzik meg a projektek kontextusát.</p></article></div></div></section>`,
  en: `<section class="press-types" aria-labelledby="press-types-title"><div class="wrap"><p class="eyebrow">Archive guide</p><h2 id="press-types-title">What is documented on this page?</h2><div class="press-type-grid"><article><h3>Interviews and profiles</h3><p>Conversations about Norbert Bánhalmi's career, artistic decisions and the personal background of individual projects.</p></article><article><h3>Exhibition coverage</h3><p>Reports documenting how exhibitions were created, what they addressed and how they entered public discussion.</p></article><article><h3>Professional and institutional coverage</h3><p>Articles connected to photography, technology, curatorial work, education and community activity.</p></article><article><h3>Television and video</h3><p>Reports, interviews and exhibition recordings that preserve the context of the projects in moving images.</p></article></div></div></section>`,
  de: `<section class="press-types" aria-labelledby="press-types-title"><div class="wrap"><p class="eyebrow">Aufbau des Archivs</p><h2 id="press-types-title">Welche Dokumente finden Sie auf dieser Seite?</h2><div class="press-type-grid"><article><h3>Interviews und Porträts</h3><p>Gespräche über Norbert Bánhalmis Werdegang, künstlerische Entscheidungen und die persönlichen Hintergründe einzelner Projekte.</p></article><article><h3>Ausstellungsberichte</h3><p>Beiträge über Entstehung, Thema und öffentliche Aufnahme der Ausstellungen.</p></article><article><h3>Fachliche und institutionelle Beiträge</h3><p>Publikationen zu Fotografie, Technologie, kuratorischer Arbeit, Bildung und Gemeinschaftsprojekten.</p></article><article><h3>Fernsehen und Video</h3><p>Reportagen, Gespräche und Ausstellungsaufnahmen, die den Kontext der Projekte im Bewegtbild bewahren.</p></article></div></div></section>`
};

function replaceCuratorialBody(html, lang) {
  const start = html.indexOf('<section class="wrap narrow">', html.indexOf('<main'));
  const boundary = html.indexOf('<section class="presence-context"', start);
  if (start < 0 || boundary < 0) return html;
  return html.slice(0, start) + dossiers[lang] + '\n\n' + html.slice(boundary);
}

function removeGeneratedExhibitionBlocks(html) {
  html = html.replace(/<!-- OEUVRE-INTEGRITY:START -->[\s\S]*?<!-- OEUVRE-INTEGRITY:END -->/gi, '');
  html = html.replace(/<section[^>]+id=["']curatorial-periods["'][\s\S]*?<\/section>/gi, '');
  html = html.replace(/<section class=["'][^"']*presence-context[^"']*["'][^>]*>[\s\S]*?(?:Hivatkozási réteg|Reference layer|Referenzebene)[\s\S]*?<\/section>/gi, '');
  return html;
}

function rebuildHungarianBiography(html) {
  const domainNarrative = /<p>Egy súlyos baleset után döntöttem úgy, hogy a saját nevem alatt is felépítem a személyes márkámat\.[\s\S]*?Vagyis mind a négy domain él, de a tartalom ma már két központi felületen fut össze\.<\/p>/i;
  const replacement = `<p>A pályám egyik meghatározó fordulópontja egy súlyos görögországi baleset volt. A kórházban, bizonytalan látással és összetört karral vált világossá számomra, hogy a fotográfiát nem mellékes szakmai irányként akarom továbbvinni. Ettől kezdve tudatosan a saját alkotói hangom, a személyes történetek és az emberi jelenlét felé fordultam.</p>
  <p>A New Yorkhoz kapcsolódó évek és projektek megmutatták, hogy a portré egyszerre lehet személyes találkozás, társadalmi dokumentum és történelmi forrás. A Magyar nők New Yorkban, majd a Mérföldkövek ’56 után egyre fontosabbá vált számomra az emlékezet, az identitás és az, hogy a fényképezett ember saját története ne vesszen el a kép esztétikája mögött.</p>
  <p>Az Ébredés, a Szösszenetek és A Nő világa már a test, a gyógyulás, az intimitás és az életfordulók felől folytatta ezt a munkát. A könyvek, a kiállítások, az irodalmi és orvosi együttműködések azért kerültek egymás mellé, mert egyetlen fénykép sokszor nem tudja elmondani mindazt, amit egy ember átélt.</p>
  <p>Később a kurátori, oktatási és közösségi munka is az életmű részévé vált. A Rege Galéria, a bécsi fotóklub, a gyermekeknek tartott foglalkozások és a jótékonysági projektek ugyanarra az alapelvre épülnek: a fotográfia nemcsak képet készít, hanem kapcsolatot, emlékezetet és közös teret is létrehozhat.</p>`;
  html = html.replace(domainNarrative, replacement);
  html = html.replace(/<div class="t-item">[\s\S]*?(?:banhalminorbert\.hu|norbertbanhalmi\.com|banhalmi\.art|banhalmi\.at)[\s\S]*?<\/div>/gi, '');
  return html;
}

function addPressExplainer(html, lang) {
  if (html.includes('class="press-types"')) return html;
  const marker = '</section><section class="thesis">';
  if (!html.includes(marker)) return html;
  return html.replace(marker, `</section>${pressExplainers[lang]}<section class="thesis">`);
}

async function walk(dir, out = []) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.github'].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) await walk(full, out);
    else if (item.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const changed = [];
for (const [rel, lang] of [['hu/curators.html','hu'], ['curators.html','en'], ['de-at/curators.html','de']]) {
  const file = path.join(root, rel);
  const original = await readFile(file, 'utf8');
  const next = replaceCuratorialBody(original, lang);
  if (next !== original) { await writeFile(file, next, 'utf8'); changed.push(rel); }
}

for (const file of await walk(root)) {
  const rel = path.relative(root, file).replaceAll('\\','/');
  let original = await readFile(file, 'utf8');
  let next = original;
  if (/(^|\/)exhibitions\//.test(rel)) next = removeGeneratedExhibitionBlocks(next);
  if (rel === 'hu/index.html') next = rebuildHungarianBiography(next);
  if (rel === 'hu/press.html') next = addPressExplainer(next, 'hu');
  if (rel === 'press.html') next = addPressExplainer(next, 'en');
  if (rel === 'de-at/press.html') next = addPressExplainer(next, 'de');
  next = next.replace(/A kiindulópont a MOL Project\./g, 'A kiindulópont a MOL Project, egy korai, saját kezdeményezésű fotográfiai tanulmány, amely nem a MOL vállalat megrendelésére készült.');
  if (next !== original) { await writeFile(file, next, 'utf8'); if (!changed.includes(rel)) changed.push(rel); }
}

console.log(JSON.stringify({ changed, total: changed.length }, null, 2));
