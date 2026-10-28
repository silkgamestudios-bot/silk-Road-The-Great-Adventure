const V='sr-v350';
/* v238: este archivo YA NO guarda nada ni instala app. Solo sirve para que los aparatos con la versión vieja (atajo anclado / app instalada)
   se limpien solos: borra las cachés, se desregistra y recarga la página. El servidor lee V para avisar de versiones nuevas. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>{e.waitUntil((async()=>{try{for(const k of await caches.keys())await caches.delete(k)}catch(x){}
 try{await self.registration.unregister()}catch(x){}
 try{const cs=await self.clients.matchAll({type:'window'});cs.forEach(c=>{try{c.navigate(c.url)}catch(x){}})}catch(x){}})())});
