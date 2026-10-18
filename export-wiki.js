/* Exporta datos del wiki (clases, sets, mobs, jefes, mascotas) + enemigos + tablas de botín del juego a world.json para el servidor.
   Uso: node tools/export-world.js client/index.html server/world.json
   Corre el script del juego en un sandbox (sin navegador) y lee sus propias estructuras: así el servidor usa EXACTAMENTE las mismas reglas. */
const vm=require('vm'),fs=require('fs');
const [,,src='client/index.html',out='client/wiki-data.json']=process.argv;
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
const data=q(`(()=>{const strip=o=>JSON.parse(JSON.stringify(o,(k,v)=>typeof v==='function'?undefined:v));
 return strip({cls:CLS.map((c,i)=>({i,n:c.n,ic:c.ic,hp:c.hp,mp:c.mp,dm:c.dm,sp:c.sp,rg:c.rg,sk:c.sk,d:c.d})),
 sets:SETN.map((k,i)=>({cls:CLS[i]?CLS[i].n:i,names:SETN[i],sets:(SETNM[i]||[])})),rar:RN,rm:RM,lvs:LVS,
 mobs:XV,tasks:TD.map(t=>({n:t[0],g:t[2]})),pets:PTY,bosses:GCFG,cities:C.map((c,i)=>({n:c.n,tx:c.tx,ty:c.ty,t:(typeof CTY!=='undefined'?CTY[i]:'')})),
 shops:BLD.map(b=>({n:b.n,ic:b.ic,k:b.k})),caves:CN,events:EVT_.map(e=>({n:e.n,ic:e.ic,a:e.a,b:e.b})),prem:PRM.map(p=>({n:p.n,ic:p.ic,d:p.d})),
 hc:{need:[1,5,10,20,30,50,100].map(l=>[l,xpNeed(l)]),tiers:[0,1,2,3,4,5,6,7,8].map(t=>({t,xp:Math.max(1,Math.round((12+t*10)*MOB_XP)),gc:HC_GC[t],ic:HC_IC[t],pc:HC_PC[t]}))}})})()`);
fs.writeFileSync(out,JSON.stringify(data));console.log('wiki-data:',(fs.statSync(out).size/1e3).toFixed(0)+' KB, clases',data.cls.length,'sets',data.sets.length);
