/* REIC Desktop PWA cache. Versioned URLs prefer exact matches; basename fallback is offline-only. */
const CACHE='vmdesktopreic-shell-20261107-v4';
const CORE=['./','./index.html','./desktop.reic','./desktop.reic?v=20261107-five-menu-unity-2','./desktop.css','./desktop.js','./desktop-runtime.js','./desktop-experience.css','./desktop-experience.js','./desktop-unified.css','./desktop-unified.js','./unity-studio.css','./unity-studio.css?v=20261107-unity-studio-2','./unity-studio.js','./unity-studio.js?v=20261107-unity-studio-2','./apps-250.json','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('vmdesktopreic-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(new URL('./',self.registration.scope).pathname))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response;}).catch(()=>caches.match(request,{ignoreSearch:true}).then(cached=>cached||caches.match('./index.html'))));
  return;
 }
 event.respondWith(caches.match(request).then(cached=>{
  const network=fetch(request).then(response=>{if(response.ok&&response.type==='basic'){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}return response;});
  return cached||network.catch(()=>caches.match(request,{ignoreSearch:true}).then(fallback=>fallback||new Response('Resource tidak tersedia offline.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})));
 }));
});
