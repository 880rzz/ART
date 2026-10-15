import fs from 'node:fs';
const pages=[
 ['exhibitions/euforia.html','en-GB'],
 ['hu/exhibitions/euforia.html','hu-HU'],
 ['de-at/exhibitions/euforia.html','de-AT']
];
const errors=[];
const requiredSources=[
 'https://www.wikidata.org/wiki/Q568185',
 'https://www.wikidata.org/wiki/Q20747349',
 'https://hu.wikipedia.org/wiki/Fellegi_%C3%81d%C3%A1m',
 'https://hu.wikipedia.org/wiki/P%C3%A9ter_Bence',
 'https://www.flickr.com/photos/vipach/55554179930/',
 'https://www.flickr.com/photos/vipach/55591329229/'
];
for(const [path,language] of pages){
 const html=fs.readFileSync(path,'utf8');
 for(const id of ['fellegi','bence']){
  if((html.match(new RegExp('id="euforia-work-'+id+'"','g'))||[]).length!==1) errors.push(path+': missing/duplicate '+id+' chapter');
  if(!html.includes('href="#euforia-work-'+id+'"'))errors.push(path+': map link missing for '+id);
 }
 for(const url of requiredSources)if(!html.includes(url))errors.push(path+': source missing '+url);
 for(const stale of ['photograph not yet created','a kép még nem készült el','Fotografie noch nicht entstanden','visuelle Prüfung ausstehend','vizuális ellenőrzésre vár'])if(html.includes(stale))errors.push(path+': stale state: '+stale);
 const script=html.match(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/);
 if(!script){errors.push(path+': JSON-LD missing');continue;}
 let graph;try{graph=JSON.parse(script[1])['@graph'];}catch(e){errors.push(path+': JSON-LD invalid: '+e);continue;}
 const project=graph.find(x=>x['@type']==='CreativeWork'&&x['@id']?.endsWith('euforia.html#project'));
 if(!project){errors.push(path+': CreativeWork entity missing');continue;}
 if(project.hasPart?.length!==4)errors.push(path+': expected four documented work entities');
 const works=project.hasPart||[];
 for(const [id,qid,date] of [['fellegi','Q568185','2026-09-24'],['bence','Q20747349','2026-10-10']]){
  const w=works.find(x=>x['@id']?.endsWith('#work-'+id));
  if(!w){errors.push(path+': schema work missing '+id);continue;}
  if(w['@type']!=='Photograph'||w.dateCreated!==date||w.isPartOf?.['@id']!==project['@id']||!w.about?.sameAs?.some(x=>x.endsWith(qid)))errors.push(path+': Photograph semantics invalid '+id);
 }
 if(!html.includes('href="https://www.flickr.com/photos/vipach/albums/72177720332618686"'))errors.push(path+': project gallery evidence missing');
 if(!html.includes('<link rel="alternate" hreflang="hu-HU"'))errors.push(path+': hreflang missing');
 if(/"@type":"(?:ExhibitionEvent|Event)"/.test(script[1]))errors.push(path+': invented exhibition event');
}
const ai=fs.readFileSync('ai.txt','utf8');const llms=fs.readFileSync('llms.txt','utf8');
for(const [doc,txt] of [['ai.txt',ai],['llms.txt',llms]])for(const q of ['Q568185','Q20747349'])if(!txt.includes(q))errors.push(doc+': '+q+' missing');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('EUFÓRIA works 03 and 04: three-language chapters, anchors, structured data and provenance passed.');
