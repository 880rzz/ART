/* BANHALMI ART - lean offline service worker with network-first HTML. */
const V='banhalmi-art-20260809-lean-shell-v73';
/* Keep installation deliberately tiny. The previous worker re-downloaded the
   first fifteen full-resolution gallery images, the hero, portrait and three
   homepages during install. That was roughly two megabytes of avoidable
   background traffic precisely while a first-time visitor was trying to load
   the page. Browser HTTP caching already handles those visual assets well. */
const PRE=["/assets/img/favicon.svg","/site.webmanifest"];
function repairHtml(html){
  html=html.replace(/\bfor\s+since\s+1999\b/gi,'since 1999');
  html=html.replace(/alt="Best of — the reference gallery — Works from the exhibition"/g,function(match,offset,source){
    const before=source.slice(Math.max(0,offset-220),offset);
    const found=before.match(/best-of-(\d+)\.webp[^>]*$/i);
    const number=found?String(Number(found[1])).padStart(2,'0'):'archive';
    return 'alt="BANHALMI archive photograph '+number+' — work by Norbert Bánhalmi"';
  });
  return html;
}
async function repairedResponse(response){
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  const text=repairHtml(await response.text());
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  return new Response(text,{status:response.status,statusText:response.statusText,headers});
}
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(V);await Promise.allSettled(PRE.map(u=>c.add(new Request(u,{cache:'reload'}))));self.skipWaiting();})());});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const ks=await caches.keys();await Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const url=new URL(r.url);if(url.origin!==location.origin)return;
  if(r.mode==='navigate'){
    e.respondWith((async()=>{try{const n=await repairedResponse(await fetch(r,{cache:'no-store'}));const c=await caches.open(V);c.put(r,n.clone());return n;}catch(err){const c=await caches.open(V);const hit=(await c.match(r))||(await c.match('/'));return hit?repairedResponse(hit):Response.error();}})());return;
  }
  /* Gallery photography is intentionally left to the browser cache. A service
     worker cache adds another lookup and used to grow into a second copy of a
     very large image archive. Responsive/lazy image selection can now proceed
     without competing with SW install or cache writes. */
  const isGalleryImage=/^\/assets\/img\/best-of\//i.test(url.pathname);
  if(isGalleryImage)return;
  const isDesignAsset=/\.(?:css|js)$/i.test(url.pathname);
  e.respondWith((async()=>{
    const c=await caches.open(V);
    if(!isDesignAsset){const hit=await c.match(r);if(hit)return hit;}
    try{
      const request=isDesignAsset?new Request(r,{cache:'reload'}):r;
      const n=await fetch(request);
      if(n&&n.status===200&&n.type==='basic')c.put(r,n.clone());
      return n;
    }catch(err){
      const hit=await c.match(r);
      return hit||Response.error();
    }
  })());
});