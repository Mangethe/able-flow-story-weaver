'use strict';
// Bump VERSION whenever any precached file changes. Keep updates atomic.
const VERSION='v4';
const PREFIX=`able-flow:${encodeURIComponent(self.registration.scope)}:`;
const CACHE=PREFIX+VERSION;
const ROOT=new URL(self.registration.scope);
const SHELL=new URL('index.html',ROOT).href;
const ASSETS=['index.html','manifest.json','icons/icon-192.png','icons/icon-512.png'].map(path=>new URL(path,ROOT).href);
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(ASSETS);})());
  // No skipWaiting here: an existing session owns its current version.
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);await self.clients.claim();})());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='ACTIVATE_UPDATE')event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==ROOT.origin)return;
  const canonical=url.origin+url.pathname;
  const navigation=request.mode==='navigate'&&(url.pathname===ROOT.pathname||canonical===SHELL);
  if(!navigation&&!ASSETS.includes(canonical))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(navigation?SHELL:canonical);
    if(cached)return cached;
    try{return await fetch(request);}catch(error){return new Response('Offline copy unavailable. Open the app once while online, then try again.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
  })());
});
