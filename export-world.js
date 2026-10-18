/* Exporta mapa + enemigos + tablas de botín del juego a world.json para el servidor.
   Uso: node tools/export-world.js client/index.html server/world.json
   Corre el script del juego en un sandbox (sin navegador) y lee sus propias estructuras: así el servidor usa EXACTAMENTE las mismas reglas. */
const vm=require('vm'),fs=require('fs');
const [,,src='client/index.html',out='server/world.json']=process.argv;
const html=fs.readFileSync(src,'utf8'),code=html.match(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/)[1];
const mk=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>0:k==='length'?0:k==='then'?undefined:mk(),apply:()=>mk(),construct:()=>mk(),set:()=>true});
const ls={getItem:()=>null,setItem(){},removeItem(){}};
const ctx={console,Math,JSON,Date,Promise,Object,Array,Number,String,Boolean,RegExp,Error,Map,Set,WeakMap,Uint8Array,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,Float32Array,Float64Array,ArrayBuffer,DataView,Symbol,parseInt,parseFloat,isNaN,isFinite,encodeURIComponent,decodeURIComponent,
 localStorage:ls,sessionStorage:ls,setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},clearInterval(){},requestAnimationFrame:()=>0,addEventListener(){},removeEventListener(){},
 navigator:{userAgent:'x',vibrate(){},language:'es'},location:{search:'',href:''},innerWidth:900,innerHeight:420,devicePixelRatio:1,performance:{now:()=>0},
 document:mk(),Image:function(){return mk()},Audio:function(){return mk()},AudioContext:function(){return mk()},crypto:{randomUUID:()=>'x'},screen:{},matchMedia:()=>({matches:false,addEventListener(){}}),
 alert(){},confirm:()=>false,prompt:()=>null,fetch:()=>new Promise(()=>{}),atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64'),OffscreenCanvas:function(){return mk()},Path2D:function(){return mk()}};
ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
try{vm.runInContext(code,ctx,{timeout:30000})}catch(e){console.log('aviso:',String(e.message).slice(0,120))}
const q=s=>vm.runInContext(s,ctx);
const data=q(`(()=>{
 const bits=new Uint8Array(Math.ceil(W*H/8));for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(solid(M[y][x])||TREE[y*W+x])bits[(y*W+x)>>3]|=1<<((y*W+x)&7);
 const mobs=[],skip=e=>e.boss||e.guard||e.wild||e.tmp||e.alpha||e.vec;
 E.forEach((e,i)=>{mobs.push(skip(e)?null:[Math.round(e.x),Math.round(e.y),e.ty|0,Math.round(e.mx),Math.round(e.sp),Math.round(e.hx==null?e.x:e.hx),Math.round(e.hy==null?e.y:e.hy),e.rw||1,Math.round(edm(e)*100)/100])});
 const types={};for(let t=0;t<=8;t++){const L=[];for(let k=0;k<200;k++){const o=hcLoot({ty:t,rw:1});L.push([o.gd|0,o.it||0,o.pot|0,o.meat|0])}types[t]={xp:Math.max(1,Math.round((12+t*10)*MOB_XP)),loot:L}}
 return{dmg0:DMG,W,H,T,bits:Array.from(bits),mobs,types,cities:C.map(c=>({n:c.n,tx:c.tx,ty:c.ty}))}})()`);
const b64=Buffer.from(data.bits).toString('base64');
fs.writeFileSync(out,JSON.stringify({dmg0:data.dmg0,W:data.W,H:data.H,T:data.T,bits:b64,mobs:data.mobs,types:data.types,cities:data.cities}));
console.log('world.json:',data.W+'x'+data.H,'enemigos',data.mobs.filter(Boolean).length,'/',data.mobs.length,'tamaño',(fs.statSync(out).size/1e6).toFixed(1)+' MB');
