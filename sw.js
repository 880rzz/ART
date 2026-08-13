/* BANHALMI ART — minimal service worker.
   Performance contract: navigations, HTML, CSS, JS, gallery photography and
   other page resources stay on the browser/network path. The worker must never
   buffer HTML, rewrite responses, bypass the HTTP cache or duplicate the image
   archive. It only keeps two tiny shell metadata assets available offline.

   v84 deliberately rotates the Cache Storage namespace after the v140/v141
   release-token repairs. Activation deletes every older BANHALMI/Wix-era cache
   before claiming open tabs, so a returning browser cannot keep serving an
   obsolete cached shell from a previous worker generation. */
const V='banhalmi-art-20260814-live-refresh-v84';
const PRE=["/assets/img/favicon.svg","/site.webmanifest"];
const PRESET=new Set(PRE);

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(V);
    await Promise.allSettled(PRE.map(url=>cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==V).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==location.origin)return;

  /* Critical rule: never intercept document navigations. This preserves native
     streaming HTML parsing, preload discovery and the browser HTTP cache. */
  if(request.mode==='navigate')return;

  /* CSS/JS/images/fonts and every other real page resource also remain on the
     native browser cache path. Only the two tiny install-shell resources below
     are served from Cache Storage. */
  if(!PRESET.has(url.pathname))return;

  event.respondWith((async()=>{
    const cache=await caches.open(V);
    const cached=await cache.match(request,{ignoreSearch:true});
    if(cached)return cached;
    const response=await fetch(request);
    if(response&&response.ok)cache.put(request,response.clone());
    return response;
  })());
});
