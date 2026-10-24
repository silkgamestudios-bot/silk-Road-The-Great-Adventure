const V='sr-v214',SHELL=['/','/index.html','/play.html','/wiki.html','/privacidad.html','/terminos.html','/site.css','/site2.css','/shots/town.jpg','/wiki-data.json','/config.js','/claude-shim.js','/world-client.js','/catalog.js','/manifest.webmanifest','/icon-192.png','/icon-512.png','/logo.jpg','/apple-touch-icon.png','/heroes.js'],AUD=['/audio/city.mp3','/audio/explore.mp3','/audio/battle.mp3','/audio/dungeon.mp3'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL).then(()=>Promise.all(AUD.map(u=>c.add(u).catch(()=>0))))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.location.origin))return;
 const pn=new URL(r.url).pathname;
 /* v154: HTML y JS = RED PRIMERO (el jugador siempre recibe la versión publicada; la caché solo sirve sin conexión) */
 if(r.mode==='navigate'||pn==='/'||/\.(html|js)$/.test(pn)){e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>caches.open(V).then(c=>c.match(r).then(h=>h||c.match('/play.html')))));return}
 e.respondWith(caches.open(V).then(c=>c.match(r).then(hit=>{const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>hit);return hit||net})))});
