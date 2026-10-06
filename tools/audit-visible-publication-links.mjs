import fs from 'node:fs';
import assert from 'node:assert/strict';
const sourceTexts=['data/wikipedia-source-inventory.json','deep-search-evidence.json'].map(p=>fs.readFileSync(p,'utf8')).join('\n');
const expected=[
  {
    "key": "rgb",
    "title": "RGB fotózás – az új trend",
    "url": "https://www.tripont.hu/rgb-fotozas-az-uj-trend--b1051.html"
  },
  {
    "key": "dance-partner",
    "title": "Amikor csak egy táncpartnered van egész estére",
    "url": "https://www.milcclub.com/post/amikor-csak-egy-t%C3%A1ncpartnered-van-eg%C3%A9sz-est%C3%A9re"
  },
  {
    "key": "lume-cube",
    "title": "Amikor kéznél van pár Lume Cube",
    "url": "https://www.tripont.hu/amikor-keznel-van-par-lume-cube-b602.html"
  },
  {
    "key": "new-york",
    "title": "Egy kezdő fotós New Yorkban",
    "url": "https://web.archive.org/web/20180621233214/http://www.tripont.hu/problog/3032/egy_kezdo_fotos_new_yorkban"
  },
  {
    "key": "bathroom",
    "title": "Aktfotózás otthon, a fürdőszobában",
    "url": "https://web.archive.org/web/20180217103411/http://www.tripont.hu/problog/2950/aktfozoas_otthon_a_furdoszobaban"
  },
  {
    "key": "smallest",
    "title": "A legkisebbel a nagyok között",
    "url": "https://web.archive.org/web/20181107032149/http://www.tripont.hu/problog/3182/a_legkisebbel_a_nagyok_kozott"
  }
];
for(const file of ['writing.html','hu/writing.html','de-at/writing.html']){
 const html=fs.readFileSync(file,'utf8');
 for(const row of expected){
  const marker='<li data-publication-source="'+row.key+'">';
  assert.equal(html.split(marker).length-1,1,file+': missing/duplicate source '+row.key);
  const segment=html.split(marker)[1].split('</li>')[0];
  assert(segment.includes('href="'+row.url+'"'),file+': missing/wrong visible destination '+row.key);
  assert(segment.includes(row.title),file+': original title lost '+row.key);
  assert(segment.includes('data-external="true"'),file+': external-link affordance missing '+row.key);
  assert(segment.includes('noopener noreferrer'),file+': unsafe external link '+row.key);
  assert(sourceTexts.includes(row.url),file+': destination detached from registered sources '+row.key);
  if(file!=='hu/writing.html')assert(segment.includes('lang="hu"'),file+': original-language marker missing '+row.key);
 }
}
const de=fs.readFileSync('de-at/writing.html','utf8').split('<main')[1].split('</main>')[0];
assert(!de.includes('honorary member'),'Untranslated honorary membership');
assert(!de.includes('official brand ambassador, Hungary'),'Untranslated ambassador role');
console.log('Visible publication source audit passed: 18 real links, six source identities, original titles, localization and source-registry coverage.');

const publicationCss=fs.readFileSync("assets/css/site.css","utf8");
assert(publicationCss.includes("max-width:var(--art-writing-record-max,none)!important"),"Canonical writing records must support a bounded publication measure");
assert(publicationCss.includes("--art-writing-record-max:min(68ch,860px)"),"Publication text must retain the editorial reading cap");
assert(publicationCss.includes(".linklist li[data-publication-source]>span{display:block;"),"Publication metadata must occupy its own readable line");
