const V='sr-v83',SHELL=['/','/index.html','/play.html','/wiki.html','/privacidad.html','/terminos.html','/site.css','/site2.css','/shots/town.jpg','/wiki-data.json','/config.js','/claude-shim.js','/world-client.js','/catalog.js','/manifest.webmanifest','/icon-192.png','/icon-512.png','/logo.jpg','/apple-touch-icon.png','/heroes.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.location.origin))return;
 e.respondWith(caches.open(V).then(c=>c.match(r).then(hit=>{const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>hit);return hit||net})))});
