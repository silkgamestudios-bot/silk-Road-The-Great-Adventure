
/* v238: SIN app instalable. Se limpia cualquier service worker / caché de versiones anteriores; el juego es solo web. Pantalla completa al primer toque */
try{if('serviceWorker' in navigator&&navigator.serviceWorker.getRegistrations)navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{})}catch(e){}
try{if(window.caches&&caches.keys)caches.keys().then(ks=>ks.forEach(k=>caches.delete(k))).catch(()=>{})}catch(e){}
(function(){const fs=()=>{const d=document.documentElement,f=d.requestFullscreen||d.webkitRequestFullscreen;if(f&&!document.fullscreenElement&&!navigator.standalone){try{const p=f.call(d,{navigationUI:'hide'});p&&p.catch&&p.catch(()=>{})}catch(e){}}
 try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})}catch(e){}};
 /* v268: pantalla completa SIEMPRE: se pide en cada toque hasta lograrla (y de nuevo si se sale sin usar el botón ⛶) */const h=()=>{if(window.SR_FSOFF||document.fullscreenElement||document.webkitFullscreenElement)return;fs()};addEventListener('pointerdown',h,true);addEventListener('touchend',h,true);addEventListener('click',h,true);
 window.SR_FS=fs})();
