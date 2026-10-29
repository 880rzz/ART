import fs from 'node:fs';

const pages = [
 'exhibitions/euforia.html',
 'hu/exhibitions/euforia.html',
 'de-at/exhibitions/euforia.html'
];
const works = [
 {key:'fellegi', person:'Fellegi Ádám', qid:'Q568185', wiki:'https://hu.wikipedia.org/wiki/Fellegi_%C3%81d%C3%A1m',
  commons:'Music%20and%20Words%20presents-', created:'2026-09-24'},
 {key:'bence', person:'Péter Bence', qid:'Q20747349', wiki:'https://hu.wikipedia.org/wiki/P%C3%A9ter_Bence',
  commons:'P%C3%A9ter%20Bence', created:'2026-10-10'}
];
const errors = [];
const parseEmbedded=(s,path)=>{
 const start=s.indexOf('<script type="application/ld+json">');
 const end=s.indexOf('</script>',start);
 if(start<0||end<0){errors.push(path+': missing JSON-LD');return null;}
 try{return JSON.parse(s.slice(start+'<script type="application/ld+json">'.length,end))['@graph'];}
 catch(e){errors.push(path+': invalid JSON-LD: '+e);return null;}
};
for(const path of pages){
 const html=fs.readFileSync(path,'utf8');
 const graph=parseEmbedded(html,path);
 if(!graph)continue;
 const project=graph.find(x=>x['@type']==='CreativeWork'&&x['@id']?.endsWith('euforia.html#project'));
 if(!project){errors.push(path+': project schema absent');continue;}
 const displayedWorks=(html.match(/id="euforia-work-/g)||[]).length;
 if(displayedWorks<4||project.hasPart?.length!==displayedWorks)errors.push(path+': each displayed work must have exactly one project photograph record');
 for(const w of works){
  const start=html.indexOf('id="euforia-work-'+w.key+'"');
  const end=html.indexOf('</section>',start);
  if(start<0||end<0){errors.push(path+': missing artwork section '+w.key);continue;}
  const section=html.slice(start,end);
  if(!section.includes('href="#euforia-work-'+w.key+'"')&&!html.includes('href="#euforia-work-'+w.key+'"'))errors.push(path+': map link absent '+w.key);
  if(!section.includes('href="'+w.wiki+'"'))errors.push(path+': Wikipedia link absent '+w.key);
  const heading=section.match(/<h[34]><a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a><\/h[34]>/);
  if(!heading||heading[1]!==w.wiki||!heading[2].includes('↗'))errors.push(path+': name must be a directly linked Wikipedia heading '+w.key);
  const biography=section.match(/<h[34]><a[^>]*>[^<]*<\/a><\/h[34]><p>([\s\S]*?)<\/p>/)?.[1]||'';
  const count=biography.replace(/<[^>]+>/g,'').replaceAll('&amp;','&').trim().split(/\s+/).length;
  if(count<65||count>170)errors.push(path+': missing substantial bounded person introduction '+w.key+' ('+count+' words)');
  if(!section.includes(w.qid)||!section.includes(w.commons))errors.push(path+': evidence missing '+w.key);
  const photo=project.hasPart.find(x=>x['@id']?.endsWith('#work-'+w.key));
  const person=photo?.about;
  if(graph.some(x=>x['@type']==='Person'&&x['@id']==='https://www.wikidata.org/entity/'+w.qid))errors.push(path+': subject person must not be duplicated at graph root '+w.key);
  if(!photo||photo['@type']!=='Photograph'||photo.dateCreated!==w.created||photo.about?.['@id']!==person?.['@id'])errors.push(path+': image-to-person graph relation broken '+w.key);
  if(!person||person['@type']!=='Person'||person['@id']!=='https://www.wikidata.org/entity/'+w.qid||!person.sameAs?.includes(w.wiki)||!person.sameAs?.includes('https://www.wikidata.org/wiki/'+w.qid)||person.image?.['@id']!==photo?.['@id'])errors.push(path+': Wikidata Person node/image identity broken '+w.key);
  if(!photo?.sameAs?.some(u=>u.includes('commons.wikimedia.org/wiki/File:'))||!photo?.contentUrl?.startsWith('https://upload.wikimedia.org/'))errors.push(path+': canonical image media link missing '+w.key);
  if(photo?.width!==3456||photo?.height!==5184)errors.push(path+': intrinsic photograph dimensions missing '+w.key);
  if(!photo.isPartOf?.['@id']||photo.isPartOf['@id']!==project['@id'])errors.push(path+': project ownership missing '+w.key);
  for(const key of ['creator','copyrightHolder','copyrightNotice','creditText','license','acquireLicensePage','contentUrl']){
   if(!photo?.[key])errors.push(path+': Google/image-rights field missing '+key+' on '+w.key);
  }
  if(photo?.creator?.['@id']!=='https://www.banhalmiphotography.com/about/'||photo?.copyrightHolder?.['@id']!=='https://www.banhalmiphotography.com/about/')errors.push(path+': non-canonical creator/copyrightHolder on '+w.key);
  if(photo?.license!=='https://creativecommons.org/licenses/by-sa/4.0/')errors.push(path+': expected Commons CC BY-SA 4.0 license on '+w.key);
  if(!String(photo?.acquireLicensePage||'').includes('commons.wikimedia.org/wiki/File:'))errors.push(path+': acquireLicensePage must point at Commons file page for '+w.key);
 }
 for(const stale of ['photograph not yet created','a kép még nem készült el','Fotografie noch nicht entstanden','visuelle Prüfung ausstehend']){
  if(html.includes(stale))errors.push(path+': outdated work status '+stale);
 }
 if(!html.includes('https://www.flickr.com/photos/vipach/albums/72177720332618686'))errors.push(path+': project album reference missing');
}
const imgGraph=JSON.parse(fs.readFileSync('data/image-knowledge-graph.jsonld','utf8'))['@graph'];
for(const w of works){
 const person=imgGraph.find(x=>x['@type']==='Person'&&x['@id']==='https://www.wikidata.org/entity/'+w.qid);
 const photo=imgGraph.find(x=>Array.isArray(x['@type'])&&x['@type'].includes('Photograph')&&x['@id']?.endsWith('#work-'+w.key));
 if(!person||!photo||photo.about?.['@id']!==person['@id']||person.image?.['@id']!==photo['@id']||!person.sameAs?.includes(w.wiki))errors.push('data/image-knowledge-graph.jsonld: Wikidata/photo connection absent for '+w.key);
 for(const key of ['creator','copyrightHolder','copyrightNotice','creditText','license','acquireLicensePage','contentUrl']){
  if(!photo?.[key])errors.push('data/image-knowledge-graph.jsonld: image-rights field missing '+key+' on '+w.key);
 }
 if(photo?.license!=='https://creativecommons.org/licenses/by-sa/4.0/')errors.push('data/image-knowledge-graph.jsonld: expected CC BY-SA 4.0 on '+w.key);
 if(!String(photo?.acquireLicensePage||'').includes('commons.wikimedia.org/wiki/File:'))errors.push('data/image-knowledge-graph.jsonld: Commons acquireLicensePage missing on '+w.key);
}
for(const file of ['ai.txt','llms.txt'])for(const w of works)if(!fs.readFileSync(file,'utf8').includes(w.qid))errors.push(file+': Wikidata identity absent '+w.key);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('EUFÓRIA: contextual person biographies, Wikipedia name links and linked Wikidata/photo entities verified in EN/HU/DE and machine graph.');
