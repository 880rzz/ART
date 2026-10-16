import fs from 'node:fs';

const failures=[];
const pages=['exhibitions/euforia.html','hu/exhibitions/euforia.html','de-at/exhibitions/euforia.html'];
const wiki='https://hu.wikipedia.org/wiki/Magyar_P%C3%A9ter_(politikus)';
const wikidata='https://www.wikidata.org/wiki/Q124488292';
const commons='https://commons.wikimedia.org/wiki/File:Peter-Magyar-portrait-2026.jpg';
const facebook='https://www.facebook.com/photo.php?fbid=27056088127332279';
const graph=JSON.parse(fs.readFileSync('data/image-knowledge-graph.jsonld','utf8'))['@graph'];
const inventory=JSON.parse(fs.readFileSync('data/euforia-peter-magyar-provenance.json','utf8'));

for(const file of pages){
 const html=fs.readFileSync(file,'utf8');
 const start=html.indexOf('id="euforia-work-peter"');
 const end=html.indexOf('</section>',start);
 if(start<0||end<0){failures.push(file+': first-work chapter missing');continue}
 const block=html.slice(start,end);
 if(!/<h[34]><a href="https:\/\/hu\.wikipedia\.org\/wiki\/Magyar_P%C3%A9ter_\(politikus\)"[^>]*>[^<]+<\/a><\/h[34]>/.test(block))failures.push(file+': direct Wikipedia heading link missing');
 const name=block.match(/<h[34]><a[^>]+>[^<]+<\/a><\/h[34]>\s*<p>([^<]+)<\/p>/)?.[1]||'';
 if(name.split(/\s+/).length<75)failures.push(file+': expected substantial neutral biography');
 for(const token of [wikidata,facebook,'Quality Image','euforia-peter-study','https://www.europarl.europa.eu/meps/hu/256868/PETER_MAGYAR/history/10','https://kormany.hu/hirek/magyar-peter-magyarorszag-miniszterelnoke']){
  if(!html.includes(token))failures.push(file+': missing evidence '+token);
 }
 const m=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
 if(!m){failures.push(file+': JSON-LD missing');continue}
 let nodes;try{nodes=JSON.parse(m[1])['@graph']}catch(e){failures.push(file+': JSON-LD invalid '+e);continue}
 const project=nodes.find(x=>x['@type']==='CreativeWork'&&x['@id']?.endsWith('euforia.html#project'));
 const photo=project?.hasPart?.find(x=>x['@id']?.endsWith('#work-peter'));
 if(!photo||photo.isPartOf?.['@id']!==project['@id']){failures.push(file+': photograph/project missing');continue}
 const subject=photo.about;
 if(subject?.['@type']!=='Person'||subject['@id']!=='https://www.wikidata.org/entity/Q124488292'||!subject.sameAs?.includes(wiki)||!subject.sameAs?.includes(wikidata)||subject.image?.['@id']!==photo['@id'])failures.push(file+': Wikidata subject identity broken');
 if(subject.sameAs?.some(x=>x.includes('kormany.hu/hirek')))failures.push(file+': supporting government article incorrectly used as sameAs');
 if(!photo.sameAs?.includes(commons)&&photo.sameAs!==commons)failures.push(file+': exact Commons file missing');
 if(photo.contentUrl!=='https://upload.wikimedia.org/wikipedia/commons/4/4b/Peter-Magyar-portrait-2026.jpg')failures.push(file+': unverified Commons contentUrl');
 if(!photo.subjectOf?.some(x=>x.url?.includes('kiskegyed.hu'))||!photo.subjectOf?.some(x=>x.url?.includes('rolunk.at')))failures.push(file+': firsthand photo coverage not linked in schema');
 const displayedWorks=(html.match(/id="euforia-work-/g)||[]).length;
 if(displayedWorks<4||project.hasPart.length!==displayedWorks)failures.push(file+': project photograph count must match all displayed works');
 for(const src of inventory.editorialPublicationInventory){if(!html.includes(src.url))failures.push(file+': press source absent '+src.url)}
}
const core=graph.find(x=>x['@id']==='https://www.banhalmi.art/exhibitions/euforia.html#work-peter');
const subject=graph.find(x=>x['@id']==='https://www.wikidata.org/entity/Q124488292');
if(!core||!subject||core.about?.['@id']!==subject['@id']||subject.image?.['@id']!==core['@id'])failures.push('image knowledge graph lacks Person-Photograph relation');
if(!Array.isArray(inventory.editorialPublicationInventory)||inventory.editorialPublicationInventory.length!==10)failures.push('expected 10 catalogued press/publication links');
const expectedPhotoIds=['29101409859466752','27215976191343471','27056088127332279'];
if(inventory.documentedSubjectReuse?.length!==3)failures.push('expected three separately catalogued Facebook source links');
if(new Set(inventory.documentedSubjectReuse?.map(x=>x.photoId)).size!==3)failures.push('Facebook photo IDs are not distinct');
const canonicalUrl=id=>'https://www.facebook.com/photo.php?fbid='+id+'&set=pb.100000733720126.-2207520000&type=3';
const htmlEncode=u=>u.replaceAll('&','&amp;');
for(const id of expectedPhotoIds){
 const url=canonicalUrl(id),record=inventory.documentedSubjectReuse?.find(x=>x.photoId===id);
 if(!record||record.url!==url||record.directContentVerified!==false||!record.evidenceLevel.startsWith('creator_supplied'))failures.push('Facebook source or evidence classification invalid '+id);
 for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  if(!html.includes('href="'+htmlEncode(url)+'"'))failures.push(file+': visible source URL missing '+id);
  const tag='<script type="application/ld+json">';
  const schemaStart=html.indexOf(tag),schemaEnd=html.indexOf('</script>',schemaStart);
  if(schemaStart<0||schemaEnd<0){failures.push(file+': JSON-LD missing for Facebook evidence check');continue;}
  const data=JSON.parse(html.slice(schemaStart+tag.length,schemaEnd))['@graph'];
  const project=data.find(x=>x['@type']==='CreativeWork'&&x['@id']?.endsWith('euforia.html#project'));
  const photo=project.hasPart.find(x=>x['@id']?.endsWith('#work-peter'));
  if(!photo.additionalProperty?.some(x=>x.propertyID==='reportedSocialReusePhotoURL'&&x.value===url))failures.push(file+': photo evidence property missing '+id);
 }
 if(!core.additionalProperty?.some(x=>x.propertyID==='reportedSocialReusePhotoURL'&&x.value===url))failures.push('image knowledge graph social source missing '+id);
}
if(inventory.documentedSubjectReuse.find(x=>x.photoId==='27056088127332279')?.claimedDate!=='2026-04-12')failures.push('April 12 provenance date lost');
if(inventory.documentedSubjectReuse.some(x=>x.photoId!=='27056088127332279'&&x.claimedDate))failures.push('unsupported additional Facebook dates introduced');

// A first-party retrospective does not substitute for an exact independently checked X status URL.
const xOrigin=inventory.xOrigin;
const xBear='https://x.com/thebearpundit/status/2040270456692129902';
const xCleese='https://x.com/JohnCleese/status/2040542879660011613';
if(xOrigin?.claimedFirstAccount!=='@thebearpundit'||xOrigin?.source!=='https://blog.banhalmi.art/post/euforia'||xOrigin?.sourceDirectPostUrl!==xBear||xOrigin?.cleeseDirectPostUrl!==xCleese||xOrigin?.verifiedSourceUrl!==false)failures.push('X chronology direct links, artist account and content verification boundary are inconsistent');
if(xOrigin?.sourcePostTimestampUtc!=='2026-04-04T03:29:17.924Z'||xOrigin?.cleesePostTimestampUtc!=='2026-04-04T21:31:48.621Z')failures.push('X status timestamps not consistent with Snowflake IDs');
for(const [url,prop] of [[xBear,'xOriginStatusURL'],[xCleese,'xCleeseStatusURL']]){
 if(!core.subjectOf?.some(v=>v.url===url)||!core.additionalProperty?.some(v=>v.propertyID===prop&&v.value===url))failures.push('image graph missing direct X evidence '+url);
 for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  const history=html.slice(html.indexOf('id="euforia-public-history"'),html.indexOf('</section>',html.indexOf('id="euforia-public-history"')));
  if(!history.includes('href="'+url+'"'))failures.push(file+': X source missing from editorial chronology: '+url);
  const tag='<script type="application/ld+json">',a=html.indexOf(tag),b=html.indexOf('</script>',a),g=JSON.parse(html.slice(a+tag.length,b))['@graph'];
  const project=g.find(v=>v['@type']==='CreativeWork'&&v['@id']?.endsWith('euforia.html#project'));
  const photo=project?.hasPart?.find(v=>v['@id']?.endsWith('#work-peter'));
  if(!photo?.subjectOf?.some(v=>v.url===url)||!photo.additionalProperty?.some(v=>v.propertyID===prop&&v.value===url))failures.push(file+': Photograph does not cite direct X source '+url);
 }
}

if(inventory.additionalInternationalCoverage?.length!==2)failures.push('two additional professional archive sources expected, kept separate from verified uses');
for(const record of inventory.additionalInternationalCoverage||[])if(record.imageReuseIndependentlyVerified!==false)failures.push('unverified press candidate cannot be counted as verified photo reuse: '+record.url);
for(const url of ['https://spectrejournal.com/the-hungarian-spring/','https://about.politicsuk.com/news/a-new-dawn-for-hungary-the-election-that-ended-the-16-year-orban-era/']){
  const x=inventory.editorialPublicationInventory.find(n=>n.url===url);
  if(!x||x.imageReuseIndependentlyVerified!==true||!x.verificationNote)failures.push('verified credited photo source missing: '+url);
  if(!core.subjectOf?.some(v=>v.url===url))failures.push('canonical Photograph missing credited publication link '+url);
}
for(const file of pages){
 const html=fs.readFileSync(file,'utf8');
 const chapter=html.slice(html.indexOf('id="euforia-public-history"'),html.indexOf('</section>',html.indexOf('id="euforia-public-history"')));
 if(!chapter.includes('https://blog.banhalmi.art/post/euforia')||!chapter.includes('@thebearpundit'))failures.push(file+': first-party X chronology source missing');
 for(const article of inventory.additionalInternationalCoverage||[])if(!html.includes(article.url))failures.push(file+': professional international source missing '+article.url);
 const z=html.indexOf('<script type="application/ld+json">'),t=html.indexOf('</script>',z),g=JSON.parse(html.slice(z+'<script type="application/ld+json">'.length,t))['@graph'];
 const project=g.find(n=>n['@type']==='CreativeWork'&&n['@id']?.endsWith('euforia.html#project'));
 const photo=project?.hasPart.find(n=>n['@id']?.endsWith('#work-peter'));
 if(!photo?.additionalProperty?.some(v=>v.propertyID==='xOriginDirectPermalinkVerified'&&v.value==='false'))failures.push(file+': missing machine-encoded X provenance caution');
 for(const url of ['https://spectrejournal.com/the-hungarian-spring/','https://about.politicsuk.com/news/a-new-dawn-for-hungary-the-election-that-ended-the-16-year-orban-era/'])
  if(!photo?.subjectOf?.some(v=>v.url===url))failures.push(file+': verified press credit not in Photograph subjectOf: '+url);
}
for(const file of ['ai.txt','llms.txt']){
 const doc=fs.readFileSync(file,'utf8');
 if(!doc.includes(wikidata)||!doc.includes('euforia-peter-magyar-provenance.json'))failures.push(file+': foundational machine context absent');
}
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('EUFÓRIA founding work: 3-language independent contextual chapter, verified Commons identity, Wikipedia/Wikidata person and evidence-status provenance passed.');
