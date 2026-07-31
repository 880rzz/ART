import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = [
  ['curators.html', 'en'],
  ['hu/curators.html', 'hu'],
  ['de-at/curators.html', 'de']
];

const replacements = {
  hu: [
    [/<a class="btn" href="\/hu\/curators\.html#curatorial-periods">Kurátori összefoglaló<\/a>\s*/gi, ''],
    [/A munkám valahol a radikális puritanizmus és a méltóságteljes dokumentarizmus között áll\.[\s\S]*?nemzetközileg a Saatchi Arton is látható\./i,
      'Az életmű dokumentarista és portréalapú munkákból épül fel. Visszatérő kérdései az identitás, az emlékezet, a test, a gyógyulás és a nyilvános jelenlét. A projektek egymást követő, de összekapcsolódó fejezetekként olvashatók: a katonai és rendezvénydokumentáció fegyelmétől a személyes történeteken, könyveken és kiállításokon át a közösségi és vezetői portrékig.'],
    [/2006-ban megalapítottam a Magyar Honvédség első professzionális fotóstúdióját\./i,
      'A honvédségi dokumentációs tapasztalat után 2006-tól a HIPStudio keretében folytattam a fotográfiai munkát.'],
    [/<h3>New York: a látás iskolája<\/h3><p class="lead">[\s\S]*?<\/p>/i,
      '<h3>New York: személyes történetek és városi tapasztalat</h3><p class="lead">A New Yorkhoz kapcsolódó munkák a városi környezet, a diaszpóra és a személyes emlékezet felé tágították a gyakorlatot. A helyszín nem háttérként, hanem az emberi történeteket alakító közegként jelenik meg.</p>'],
    [/A résztvevőknek a fotózás aktív terápiaként működött\./i,
      'A résztvevők személyes történetei és a fotózás folyamata a felépülésről és az önkép újraépítéséről szóltak.'],
    [/A sorozat bejárta Budapestet, Noszvajt és Veszprémet, és állandó helyén lóg a Csolnoky Ferenc Kórház Onkológiai Centrumában\./i,
      'A sorozat több magyarországi helyszínen szerepelt kiállításon.'],
    [/<li><strong>Az első magyar fotóalapú NFT-kollekció<\/strong>[\s\S]*?<\/li>/i,
      '<li><strong>Digitális és fizikai műtárgyformák</strong> — A The Men\'s Dream projektben a fotográfia digitális kiadási és jótékonysági formákkal is összekapcsolódott.</li>'],
    [/<li><strong>Rege Galéria, Tihany \(2020–\)<\/strong>[\s\S]*?<\/li>/i,
      '<li><strong>Rege Galéria, Tihany</strong> — Kurátori és közösségi munka, amely a fotográfiát digitális bemutatási lehetőségekkel kapcsolta össze.</li>'],
    [/A projekt valódi történettudományi vitát is kiváltott[\s\S]*?rögzítettem, nem ítélkeztem, és pontosan ez a nyers emlékezet kell a valódi traumafeldolgozáshoz\./i,
      'A projekt a személyes tanúságtételt és a történelmi emlékezetet kapcsolta össze. A kurátori alapelv a dokumentálás és a résztvevők saját nézőpontjának megőrzése volt.']
  ],
  en: [
    [/<a class="btn" href="\/curators\.html#curatorial-periods">Read the curatorial overview<\/a>\s*/gi, ''],
    [/My work sits somewhere between radical puritanism and dignified documentary practice\.[\s\S]*?internationally on Saatchi Art\./i,
      'The oeuvre is built from documentary and portrait-based work. Its recurring questions concern identity, memory, the body, recovery and public presence. The projects can be read as successive but connected chapters: from the discipline of military and event documentation through personal histories, books and exhibitions to community and executive portraiture.'],
    [/In 2006, I founded the first professional photography studio of the Hungarian Defence Forces\./i,
      'After working in military documentation, I continued the photographic practice through HIPStudio from 2006.'],
    [/<h3>New York: the school of seeing<\/h3><p class="lead">[\s\S]*?<\/p>/i,
      '<h3>New York: personal histories and urban experience</h3><p class="lead">The New York-related work expanded the practice toward the city, the diaspora and personal memory. Place appears not as a backdrop but as an environment that shapes human stories.</p>'],
    [/For the participants, the photography functioned as active therapy\./i,
      'The participants\' personal accounts and the photographic process addressed recovery and the rebuilding of self-image.'],
    [/The series toured Budapest, Noszvaj and Veszprém and remains permanently installed at the Oncology Centre of Csolnoky Ferenc Hospital\./i,
      'The series was exhibited at several locations in Hungary.'],
    [/<li><strong>The first Hungarian photography-based NFT collection<\/strong>[\s\S]*?<\/li>/i,
      '<li><strong>Digital and physical artwork formats</strong> — The Men\'s Dream connected photography with digital editions and charitable presentation formats.</li>'],
    [/<li><strong>Rege Gallery, Tihany \(2020–\)<\/strong>[\s\S]*?<\/li>/i,
      '<li><strong>Rege Gallery, Tihany</strong> — Curatorial and community work connecting photography with digital presentation possibilities.</li>']
  ],
  de: [
    [/<a class="btn" href="\/de-at\/curators\.html#curatorial-periods">Kuratorische Übersicht lesen<\/a>\s*/gi, ''],
    [/Meine Arbeit bewegt sich irgendwo zwischen radikalem Purismus und würdevoller dokumentarischer Praxis\.[\s\S]*?international auf Saatchi Art zu sehen\./i,
      'Das Œuvre besteht aus dokumentarischen und porträtbasierten Arbeiten. Wiederkehrende Fragen betreffen Identität, Erinnerung, Körper, Genesung und öffentliche Präsenz. Die Projekte lassen sich als aufeinanderfolgende, aber verbundene Kapitel lesen: von der Disziplin militärischer und veranstaltungsbezogener Dokumentation über persönliche Geschichten, Bücher und Ausstellungen bis zu Gemeinschafts- und Executive-Porträts.'],
    [/2006 gründete ich das erste professionelle Fotostudio der Ungarischen Streitkräfte\./i,
      'Nach meiner Tätigkeit in der militärischen Dokumentation führte ich die fotografische Arbeit ab 2006 im Rahmen von HIPStudio fort.'],
    [/<h3>New York: die Schule des Sehens<\/h3><p class="lead">[\s\S]*?<\/p>/i,
      '<h3>New York: persönliche Geschichten und urbane Erfahrung</h3><p class="lead">Die mit New York verbundenen Arbeiten erweiterten die Praxis in Richtung Stadt, Diaspora und persönliches Gedächtnis. Der Ort erscheint nicht als Hintergrund, sondern als Umfeld, das menschliche Geschichten prägt.</p>'],
    [/Für die Teilnehmenden wirkte die Fotografie als aktive Therapie\./i,
      'Die persönlichen Berichte der Teilnehmenden und der fotografische Prozess thematisierten Genesung und den Wiederaufbau des Selbstbildes.'],
    [/Die Serie wurde in Budapest, Noszvaj und Veszprém gezeigt und ist dauerhaft im Onkologischen Zentrum des Csolnoky-Ferenc-Krankenhauses installiert\./i,
      'Die Serie wurde an mehreren Orten in Ungarn ausgestellt.'],
    [/<li><strong>Die erste ungarische fotobasierte NFT-Kollektion<\/strong>[\s\S]*?<\/li>/i,
      '<li><strong>Digitale und physische Werkformate</strong> — The Men\'s Dream verband Fotografie mit digitalen Editionen und gemeinnützigen Präsentationsformen.</li>'],
    [/<li><strong>Rege Galerie, Tihany \(2020–\)<\/strong>[\s\S]*?<\/li>/i,
      '<li><strong>Rege Galerie, Tihany</strong> — Kuratorische und gemeinschaftliche Arbeit, die Fotografie mit digitalen Präsentationsmöglichkeiten verband.</li>']
  ]
};

const changed = [];
for (const [rel, lang] of files) {
  const file = path.join(root, rel);
  const original = await readFile(file, 'utf8');
  let html = original;
  for (const [pattern, replacement] of replacements[lang]) html = html.replace(pattern, replacement);
  if (html !== original) {
    await writeFile(file, html, 'utf8');
    changed.push(rel);
  }
}
console.log(JSON.stringify({ changed, total: changed.length }, null, 2));
