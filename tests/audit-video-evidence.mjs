import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(process.env.AUDIT_SITE_DIR||'.');
const evidence=JSON.parse(fs.readFileSync(path.join(root,'data/video-evidence.json'),'utf8'));
const byId=new Map(evidence.videos.map(v=>[v.id,v]));
let pages=0,videos=0,books=0,canonicalPages=0;
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>['.git','node_modules','_site'].includes(e.name)?[]:e.isDirectory()?walk(path.join(d,e.name)):e.name.endsWith('.html')?[path.join(d,e.name)]:[])}
function visit(x,out=[]){if(Array.isArray(x))x.forEach(v=>visit(v,out));else if(x&&typeof x==='object'){if(x['@type'])out.push(x);Object.values(x).forEach(v=>visit(v,out))}return out}
for(const file of walk(root)){
 const h=fs.readFileSync(file,'utf8'),rel=path.relative(root,file),main=h.match(/<main\b[\s\S]*?<\/main>/i)?.[0];if(!main)continue;
 const nodes=[...h.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap(m=>visit(JSON.parse(m[1])));
 if(!/noindex|http-equiv=["']refresh/i.test(h)){
  const canonical=h.match(/rel=["']canonical["']\s+href=["']([^"']+)/)?.[1];
  if(canonical){canonicalPages++;const pageNodes=nodes.filter(n=>(Array.isArray(n['@type'])?n['@type']:[n['@type']]).some(t=>['WebPage','CollectionPage','ProfilePage'].includes(t))&&n['@id']===canonical+'#webpage');assert.equal(pageNodes.length,1,`${rel}: one canonical page entity`);assert.ok(pageNodes[0].mainEntity,`${rel}: page main entity`)}
 }
 for(const n of nodes){
  const types=Array.isArray(n['@type'])?n['@type']:[n['@type']];
  if(types.some(t=>['WebSite','CollectionPage','CreativeWork','ExhibitionEvent','Blog'].includes(t)))assert.ok(!n.isRelatedTo,`${rel}: Product/Service-only relation`);
  if(types.includes('ImageGallery')&&n.numberOfItems)assert.ok(types.includes('ItemList'),`${rel}: gallery count needs ItemList type`);
  assert.notEqual(n.eventStatus,'https://schema.org/EventCompleted',`${rel}: nonexistent event status`);
  if(n['@type']==='ImageObject')assert.ok(!n.creditedTo,`${rel}: music-only creditedTo property`);
  if(types.some(t=>['Book','ExhibitionEvent','ProfilePage','ImageGallery'].includes(t)))assert.ok(n['@id'],`${rel}: stable primary entity ID`);
  if(n['@type']==='Book'){
   books++;const expected=rel.includes('book-anovilaga')?'9786150018294':rel.includes('book-ebredes')?'9789631286632':rel.includes('book-szosszenetek')?'9786150000534':null;
   if(expected)assert.equal(n.isbn.replaceAll('-',''),expected,`${rel}: Book ISBN`);
   if(n.contributor)assert.ok(Array.isArray(n.contributor)&&n.contributor.every(c=>typeof c==='object'&&(c['@id']||c.name)),`${rel}: typed contributors`);
  }
 }
 const ids=new Set([...main.matchAll(/href=["'](?:https:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]{11})/g)].map(m=>m[1]));if(!ids.size)continue;
 pages++;const canonical=h.match(/rel=["']canonical["']\s+href=["']([^"']+)/)?.[1];assert.ok(canonical,rel);
 const vn=nodes.filter(n=>n['@type']==='VideoObject');assert.equal(vn.length,ids.size,`${rel}: unique video schema count`);
 for(const id of ids){const v=vn.find(n=>n.identifier===id),r=byId.get(id);assert.ok(v&&r,`${rel}: ${id} missing`);assert.equal(r.playabilityStatus,'OK');assert.equal(v.name,r.oembed.title);assert.equal(v.thumbnailUrl,r.oembed.thumbnail_url);assert.equal(v.uploadDate,r.uploadDate);assert.equal(v.url,r.watchSource);assert.equal(v.embedUrl,`https://www.youtube-nocookie.com/embed/${id}`);assert.match(v.duration,/^PT(?:\d+H)?\d+M\d+S$/);assert.equal(v['@id'],canonical+'#video-'+id);assert.ok(nodes.some(n=>n['@id']===v.isPartOf?.['@id']),`${rel}: video page relation`);assert.ok(!v.creator&&!v.license&&!v.copyrightHolder,`${rel}: unproven film copyright`);videos++}
}
assert.equal(canonicalPages,84);assert.equal(byId.size,31);assert.equal(pages,51);assert.equal(videos,123);assert.equal(books,9);
for(const [id,route] of [['XI5WavAwFOY','exhibitions/ebredes.html'],['npJ6YeYxQ64','exhibitions/ebredes.html'],['cuPzuMSXxMc','exhibitions/anovilaga.html'],['Q9vXitVpo7Y','exhibitions/merfoldkovek1956.html'],['xmZXqdL82-U','exhibitions/theframe.html'],['dDfbT7JlDi4','exhibitions/fotokiallitas5.html'],['AfK29ELPWBY','exhibitions/fotokiallitas4.html'],['cCylPUNJbzU','exhibitions/teislehetsz.html'],['ZzZj0ompifI','books/book-anovilaga.html']])for(const prefix of ['','hu/','de-at/'])assert.ok(fs.readFileSync(path.join(root,prefix+route),'utf8').includes(`"identifier":"${id}"`),prefix+route);
// The visitor-facing poster is the film's actual local cover, not an
// external pre-consent thumbnail or an extra image before the video.
const poster=fs.readFileSync(path.join(root,'assets/img/video/npJ6YeYxQ64.jpg'));
assert.ok(poster.length>10000,'Ébredés original film cover must not be a placeholder');
assert.equal(poster[0],0xff,'Ébredés poster must be JPEG');
assert.equal(poster[1],0xd8,'Ébredés poster must be JPEG');
const playerSource=fs.readFileSync(path.join(root,'assets/js/responsive-header-system.js'),'utf8');
assert.ok(playerSource.includes("if(id==='npJ6YeYxQ64')"),'poster must be scoped to requested video');
assert.ok(playerSource.includes('/assets/img/video/npJ6YeYxQ64.jpg'),'poster must be first-party');
for(const prefix of ['','hu/','de-at/']){
 const html=fs.readFileSync(path.join(root,prefix+'exhibitions/ebredes.html'),'utf8');
 assert.ok(html.includes('responsive-header-system.js?v=20261010-ebredes-cover-v1'),prefix+'Ébredés script cache token');
 assert.ok(html.includes('https://youtu.be/npJ6YeYxQ64'),prefix+'Ébredés video source link');
}
console.log(`Video evidence audit passed: ${pages} pages, ${videos} VideoObject records, ${byId.size} verified YouTube sources and ${books} bibliographic records.`);
