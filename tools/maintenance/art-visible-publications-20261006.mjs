import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

// One-off, explicitly scoped maintenance. Never invoked by permanent CI.
const root=process.cwd();
const base='5703c535881d893eb566edefd34e91b3bede0182';
const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Vienna',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const load=p=>fs.readFileSync(path.join(root,p),'utf8');
const digest=t=>createHash('sha256').update(t).digest('hex');
const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const sourceFiles=['data/wikipedia-source-inventory.json','deep-search-evidence.json'];
const registered=new Set();
function visit(x){if(typeof x==='string'&&/^https?:\/\//.test(x))registered.add(x);else if(Array.isArray(x))x.forEach(visit);else if(x&&typeof x==='object')Object.values(x).forEach(visit);}
sourceFiles.forEach(p=>visit(JSON.parse(load(p))));
const plan=[
 {key:'rgb',title:'RGB fotózás – az új trend',url:'https://www.tripont.hu/rgb-fotozas-az-uj-trend--b1051.html',publisher:'Tripont Problog',en:'RGB photography — a new trend?',de:'RGB-Fotografie — ein neuer Trend?',kind:'publisher'},
 {key:'dance-partner',title:'Amikor csak egy táncpartnered van egész estére',url:'https://www.milcclub.com/post/amikor-csak-egy-t%C3%A1ncpartnered-van-eg%C3%A9sz-est%C3%A9re',publisher:'MILC Club',en:'Only one “dance partner” for the whole evening — working with the M.Zuiko 17mm PRO',de:'Nur ein „Tanzpartner“ für den ganzen Abend — Arbeiten mit dem M.Zuiko 17mm PRO',kind:'publisher'},
 {key:'lume-cube',title:'Amikor kéznél van pár Lume Cube',url:'https://www.tripont.hu/amikor-keznel-van-par-lume-cube-b602.html',publisher:'Tripont',en:'When a few Lume Cubes are at hand',de:'Wenn ein paar Lume Cubes zur Hand sind',kind:'publisher'},
 {key:'new-york',title:'Egy kezdő fotós New Yorkban',url:'https://web.archive.org/web/20180621233214/http://www.tripont.hu/problog/3032/egy_kezdo_fotos_new_yorkban',publisher:'Tripont Problog',en:'A beginner photographer in New York',de:'Ein Fotografie-Anfänger in New York',kind:'archive'},
 {key:'bathroom',title:'Aktfotózás otthon, a fürdőszobában',url:'https://web.archive.org/web/20180217103411/http://www.tripont.hu/problog/2950/aktfozoas_otthon_a_furdoszobaban',publisher:'Tripont Problog',en:'Nude photography at home, in the bathroom',de:'Aktfotografie zu Hause, im Badezimmer',kind:'archive'},
 {key:'smallest',title:'A legkisebbel a nagyok között',url:'https://web.archive.org/web/20181107032149/http://www.tripont.hu/problog/3182/a_legkisebbel_a_nagyok_kozott',publisher:'Tripont Problog',en:'Among the big names with the smallest',de:'Mit der Kleinsten unter den Großen',kind:'archive'}
];
for(const item of plan)assert(registered.has(item.url),`Unregistered source: ${item.url}`);
const locales=[{file:'writing.html',lang:'en',original:'Original Hungarian title',language:'Hungarian',archive:'Archived source',publisher:'Publisher source',note:'The links below lead to the publisher or to a previously recorded archived copy. The source texts are in Hungarian; an English explanation is provided for each title. Some older sources may be temporarily unavailable.'},{file:'hu/writing.html',lang:'hu',original:'Eredeti magyar cím',language:'Magyar nyelvű forrás',archive:'Archivált forrás',publisher:'Kiadói forrás',note:'A címekre kattintva a kiadói oldalhoz vagy a korábban rögzített archivált példányhoz jut. A szövegek magyar nyelvűek. Egyes régi források elérhetősége időszakosan korlátozott lehet.'},{file:'de-at/writing.html',lang:'de',original:'Ungarischer Originaltitel',language:'Ungarisch',archive:'Archivierte Quelle',publisher:'Verlagsquelle',note:'Die Links führen zur ursprünglichen Veröffentlichung oder zu einer bereits verzeichneten Archivkopie. Die Texte sind auf Ungarisch; jeder Titel wird auf Deutsch erläutert. Ältere Quellen können zeitweise nicht erreichbar sein.'}];
const report={base,createdAt:new Date().toISOString(),scope:'Publication-source restoration, three writing pages only',status:'JAVÍTOTT — source only; CI and production verification are separate',sourceFiles,sourceAvailabilityPolicy:'Existing archive URLs are restored, not represented as newly verified captures. No publication dates, claims or author quotations are invented.',changedPages:[],remaining:['Full page-by-page editorial review of the remaining canonical routes','Community and exhibition source reconciliation','Press corpus recovery and period-based organization','Mindennap source-status reconciliation','Wayback comparison of the old ART website','Main branch protection and unique required-check names','Final artifact, CI and exact-live verification']};
for(const locale of locales){
 const before=load(locale.file);
 assert(!before.includes('data-publication-source='),`${locale.file}: maintenance already applied; reconcile instead of duplicating`);
 let after=before;
 for(const item of plan){
  const pattern=new RegExp('<li>'+item.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' <span[^>]*>— [^<]+<\\/span><\\/li>','g');
  const matches=[...after.matchAll(pattern)];
  assert.equal(matches.length,1,`${locale.file}: expected one original row for ${item.key}`);
  const title=locale.lang==='hu'?item.title:item[locale.lang];
  const original=locale.lang==='hu'?'':`<span lang="hu">${esc(item.title)}</span> · `;
  const sourceLabel=item.kind==='archive'?locale.archive:locale.publisher;
  const replacement=`<li data-publication-source="${item.key}"><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" data-external="true">${esc(title)}</a><span>${original}${esc(item.publisher)} · ${esc(locale.language)} · ${esc(sourceLabel)}</span></li>`;
  after=after.replace(pattern,replacement);
 }
 const first='<ul class="linklist"><li data-publication-source="rgb">';
 assert.equal(after.split(first).length-1,1,'Expected publication list opening');
 after=after.replace(first,`<p class="note">${esc(locale.note)}</p>\n  ${first}`);
 if(locale.lang==='de'){
  after=after.replace('OM SYSTEM (Olympus) — official brand ambassador, Hungary','OM SYSTEM (Olympus) — offizieller Markenbotschafter in Ungarn');
  after=after.replace('Pannon Fényképészkör Egyesület — honorary member','Pannon Fényképészkör Egyesület — Ehrenmitglied');
 }
 // Preserve all entity data, images, templates and legal behavior.
 const canonical=before.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
 assert(canonical,'Missing canonical');
 after=after.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(all,text)=>{
  let data;try{data=JSON.parse(text);}catch{throw new Error(`${locale.file}: invalid existing JSON-LD`);}
  let modified=false;
  function update(node){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(update);return;}
   const types=[node['@type']].flat();
   if(types.some(t=>['WebPage','AboutPage','CollectionPage'].includes(t))&&node.url===canonical&&'dateModified'in node){node.dateModified=today;modified=true;}
   Object.values(node).forEach(update);
  }
  update(data);return modified?`<script type="application/ld+json">${JSON.stringify(data)}</script>`:all;
 });
 assert.equal((after.match(/data-publication-source=/g)||[]).length,6,'Expected six restored rows');
 fs.writeFileSync(locale.file,after);
 report.changedPages.push({file:locale.file,canonical,language:locale.lang,restoredPublicationLinks:6,beforeSha256:digest(before),afterSha256:digest(after),reviewScope:'Publication rows, source labels, language clarification and German role labels; not a claim of full-site editorial closure'});
}
const sitemapBefore=load('sitemap.xml');
const changedUrls=new Set(report.changedPages.map(p=>p.canonical));
let touched=0;
const sitemapAfter=sitemapBefore.replace(/<url>([\s\S]*?)<\/url>/g,(all,body)=>{const loc=body.match(/<loc>([^<]+)<\/loc>/)?.[1];if(!changedUrls.has(loc))return all;touched++;assert(/<lastmod>[^<]+<\/lastmod>/.test(body));return `<url>${body.replace(/<lastmod>[^<]+<\/lastmod>/,`<lastmod>${today}</lastmod>`)}</url>`;});
assert.equal(touched,3,'Sitemap must include all three writing pages');
fs.writeFileSync('sitemap.xml',sitemapAfter);
const corpus=[...sitemapBefore.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
report.canonicalRouteInventory=corpus.map(url=>{const pathname=new URL(url).pathname;const file=decodeURIComponent(pathname.slice(1))+(pathname.endsWith('/')?'index.html':'');const html=load(file);const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||'';return {url,file,sourceSha256:digest(html),htmlLinks:(main.match(/<a\b[^>]*href=/g)||[]).length,listedItemsWithoutAnchor:[...main.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].filter(m=>!/<a\b/i.test(m[1])).length,editorialStatus:changedUrls.has(url)?'publication-block-reviewed':'NOT-YET-REVIEWED',note:'Automated inventory is not a complete semantic or missing-link judgment'};});
const tests=`import fs from 'node:fs';\nimport assert from 'node:assert/strict';\nconst sourceTexts=['data/wikipedia-source-inventory.json','deep-search-evidence.json'].map(p=>fs.readFileSync(p,'utf8')).join('\\n');\nconst expected=${JSON.stringify(plan.map(({key,title,url})=>({key,title,url})),null,2)};\nfor(const file of ['writing.html','hu/writing.html','de-at/writing.html']){\n const html=fs.readFileSync(file,'utf8');\n for(const row of expected){\n  const marker='<li data-publication-source="'+row.key+'">';\n  assert.equal(html.split(marker).length-1,1,file+': missing/duplicate source '+row.key);\n  const segment=html.split(marker)[1].split('</li>')[0];\n  assert(segment.includes('href="'+row.url+'"'),file+': missing/wrong visible destination '+row.key);\n  assert(segment.includes(row.title),file+': original title lost '+row.key);\n  assert(segment.includes('data-external="true"'),file+': external-link affordance missing '+row.key);\n  assert(segment.includes('noopener noreferrer'),file+': unsafe external link '+row.key);\n  assert(sourceTexts.includes(row.url),file+': destination detached from registered sources '+row.key);\n  if(file!=='hu/writing.html')assert(segment.includes('lang="hu"'),file+': original-language marker missing '+row.key);\n }\n}\nconst de=fs.readFileSync('de-at/writing.html','utf8').split('<main')[1].split('</main>')[0];\nassert(!de.includes('honorary member'),'Untranslated honorary membership');\nassert(!de.includes('official brand ambassador, Hungary'),'Untranslated ambassador role');\nconsole.log('Visible publication source audit passed: 18 real links, six source identities, original titles, localization and source-registry coverage.');\n`;
fs.writeFileSync('tools/audit-visible-publication-links.mjs',tests);
const pkg=JSON.parse(load('package.json'));
assert(!pkg.scripts.test.includes('audit-visible-publication-links.mjs'),'Audit already wired');
pkg.scripts.test='node tools/audit-visible-publication-links.mjs && '+pkg.scripts.test;
fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');
fs.mkdirSync('docs',{recursive:true});
fs.writeFileSync('docs/visible-publications-restoration-20261006.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({changedPages:report.changedPages,canonicalRoutes:corpus.length,remaining:report.remaining},null,2));
