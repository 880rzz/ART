/* BANHALMI ART - offline service worker with network-first HTML and verified runtime corrections. */
const V='banhalmi-art-20260808-blue-rhythm-video-v58';
const PRE=["/", "/assets/img/best-of/best-of-01.webp", "/assets/img/best-of/best-of-02.webp", "/assets/img/best-of/best-of-03.webp", "/assets/img/best-of/best-of-04.webp", "/assets/img/best-of/best-of-05.webp", "/assets/img/best-of/best-of-06.webp", "/assets/img/best-of/best-of-07.webp", "/assets/img/best-of/best-of-08.webp", "/assets/img/best-of/best-of-09.webp", "/assets/img/best-of/best-of-10.webp", "/assets/img/best-of/best-of-11.webp", "/assets/img/best-of/best-of-12.webp", "/assets/img/best-of/best-of-13.webp", "/assets/img/best-of/best-of-14.webp", "/assets/img/best-of/best-of-15.webp", "/assets/img/favicon.svg", "/assets/img/hero.webp", "/assets/img/portrait-circle.png", "/index.html", "/de-at/index.html", "/hu/index.html", "/site.webmanifest"];
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