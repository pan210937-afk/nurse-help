const CACHE_NAME="ndss-cache-v1";
const ASSETS=["./","./index.html","./styles.css","./app.js","./data.json","./manifest.json","./sw.js","./pricing.html","./icon-192.png","./icon-512.png"];
self.addEventListener("install",(e)=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener("activate",(e)=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",(e)=>{e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));return resp;}).catch(()=>cached)));});
