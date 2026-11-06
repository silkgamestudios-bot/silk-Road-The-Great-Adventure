/* Silk Road · COBRO AUTOMÁTICO EN USDT (Binance Pay, API de SOLO LECTURA).
   Flujo: el jugador elige un paquete → el servidor crea una orden con un monto ÚNICO (precio base − 0.01…0.49) válida 15 min →
   el jugador paga ese monto exacto al Pay ID → el servidor lee el historial de Binance Pay cada pocos segundos, cruza monto+ventana
   y acredita las gemas UNA sola vez (guarda el ID de transacción de Binance). Lo que no coincide va a la lista de revisión manual.

   Seguridad: la identidad del jugador sale de la sesión (u), jamás de datos del navegador; el paquete y las gemas los fija este archivo.
   Persistencia: DB.gpay vive en db.json (disco persistente de Render, DATA_DIR) junto con las cuentas; mismo guardado atómico y copias.

   Variables de entorno (Render → Environment):
     BINANCE_API_KEY, BINANCE_SECRET   llave de SOLO LECTURA (sin retiros, sin trading)
     BINANCE_PAY_ID                    Pay ID de la cuenta que recibe (ya se usa en el resto del juego)
     PAY_PACKS (opcional)              JSON {"precio_base_USDT":gemas}, por defecto {"1":1,"3":3,"5":5,"10":10,"20":20,"50":50}
     PAY_MAXDISC_PCT (opcional)        descuento máximo en % del precio base (5)
     PAY_TTL_MIN (opcional)            minutos de vida de la orden (15)
     PAY_POLL_MS (opcional)            cada cuánto se consulta Binance con órdenes pendientes (8000)
*/
const crypto=require('crypto');
module.exports=function(S,E,X){
X=X||{};
const log=S.log,DB=S.DB;
const envv=(...ns)=>{/* sin distinguir mayúsculas: Binance_Api_key = BINANCE_API_KEY */const ks=Object.keys(process.env);for(const n of ns){const k=ks.find(x=>x.toUpperCase()===n.toUpperCase());if(k){const v=process.env[k];if(v&&String(v).trim())return String(v).trim().replace(/^["']+|["']+$/g,'')}}return ''};
const KEY=envv('BINANCE_API_KEY','BINANCE_APIKEY','BINANCE_KEY','BINANCE_API'),SEC=envv('BINANCE_SECRET','BINANCE_SECRET_KEY','BINANCE_API_SECRET','BINANCE_SECRETKEY','BINANCE_APISECRET'),PAY_ID=String(envv('BINANCE_PAY_ID','BINANCE_PAYID','BINANCE_PAY')||X.PAY_ID||'').trim();
const ON=!!(KEY&&SEC);
const TTL=Math.max(5,Math.min(60,+process.env.PAY_TTL_MIN||15))*60000;
const POLL=Math.max(4000,+process.env.PAY_POLL_MS||8000),IDLE=60000;
const DISC=Math.max(1,Math.min(49,+process.env.PAY_MAXDISC_PCT||5));   /* % máximo de descuento sobre el precio base */
const FREE_LAG=120000;            /* el monto de una orden vencida queda reservado 2 min más (por si Binance tarda en mostrar el pago) */
const KEEP=7*864e5;               /* órdenes viejas se limpian a los 7 días */
const MAXREV=500;
let PACKS={1:1,3:3,5:5,10:10,20:20,50:50};
try{if(process.env.PAY_PACKS){const j=JSON.parse(process.env.PAY_PACKS),o={};for(const k in j){const b=Math.floor(+k),g=Math.floor(+j[k]);if(b>=1&&b<=1000&&g>=1&&g<=1e6)o[b]=g}if(Object.keys(o).length)PACKS=o}}catch(e){log('[pay] PAY_PACKS inválido, uso el de fábrica')}
const G=()=>{const d=DB.gpay=DB.gpay||{};d.o=d.o||{};d.tx=d.tx||{};d.rv=Array.isArray(d.rv)?d.rv:[];return d};
const err=e=>({e});
const fmt=c=>(c/100).toFixed(2);
const now=()=>Date.now();

/* ---------- órdenes ---------- */
function cents(o){return o.c}
function busy(c,t){/* ¿algún pedido con esa cantidad sigue "vivo"? (pendiente, o vencido hace menos de FREE_LAG) */
 const d=G();for(const id in d.o){const o=d.o[id];if(o.c!==c||o.st==='paid')continue;if(t<o.x+FREE_LAG)return true}return false}
function dmax(base){return Math.max(5,Math.min(49,Math.floor(base*DISC)))}   /* descuento máximo en centavos: DISC % del precio base (5% → 1 USDT: 5 c · 3: 15 c · 5: 25 c · 10 o más: 49 c) */
function pickCents(base,t){const b=base*100,free=[],M=dmax(base);for(let d=1;d<=M;d++)if(!busy(b-d,t))free.push(b-d);if(!free.length)return 0;return free[crypto.randomInt(free.length)]}
function pending(u){const d=G(),t=now();for(const id in d.o){const o=d.o[id];if(o.u===u&&o.st==='p'&&t<o.x)return o}return null}
function view(o){const t=now(),live=o.st==='p'&&t<o.x;return{id:o.id,st:o.st==='paid'?'paid':(live?'p':'exp'),amt:fmt(o.c),usdt:o.c/100,base:o.b,g:o.g,pb:o.pm?o.pm.b:0,left:live?Math.max(0,o.x-t):0,pid:PAY_ID,ttl:TTL}}
function clean(){const d=G(),t=now();for(const id in d.o){const o=d.o[id];if(o.st!=='paid'&&t>o.x+KEEP){delete d.o[id];S.dirty()}}
 const k=Object.keys(d.tx);if(k.length>20000){k.sort((a,b)=>d.tx[a].t-d.tx[b].t).slice(0,k.length-15000).forEach(x=>delete d.tx[x]);S.dirty()}}

/* ---------- promo (Black Friday): misma regla que el juego — DB.cfg.promo manda; si falta, valores de fábrica ---------- */
const PD={id:'bf26',on:1,t0:Date.UTC(2026,10,12,4),t1:Date.UTC(2026,10,26,4),t2:Date.UTC(2026,11,1,4),p1:25,p2:100,cap:20};
function promo(){const o=(DB.cfg&&DB.cfg.promo)||{},n=(k,d,lo,hi)=>{const v=(o[k]==null||o[k]==='')?NaN:+o[k];return Number.isFinite(v)?Math.min(hi,Math.max(lo,v)):d};
 const c={id:String(o.id||PD.id).replace(/[^\w-]/g,'').slice(0,16)||PD.id,on:(o.on===0||o.on===false||o.on==='0')?0:1,t0:n('t0',PD.t0,0,4e12),t1:n('t1',PD.t1,0,4e12),t2:n('t2',PD.t2,0,4e12),p1:Math.round(n('p1',PD.p1,0,300)),p2:Math.round(n('p2',PD.p2,0,300)),cap:Math.round(n('cap',PD.cap,0,5000))};
 if(c.t1<c.t0)c.t1=c.t0;if(c.t2<c.t1)c.t2=c.t1;return c}
function usedPromo(u,c,skip){/* USDT de promo ya usados por la CUENTA: órdenes automáticas pagadas o vivas + solicitudes manuales viejas */
 const P=E.prim(u),d=G(),t=now();let s=0;
 for(const id in d.o){const o=d.o[id];if(id===skip||!o.pm||o.pm.i!==c.id||E.prim(o.u)!==P)continue;if(o.st==='paid'||(o.st==='p'&&t<o.x))s+=o.pm.u}
 const R=DB.gemreq||{};for(const k in R){const r=R[k];if(!r||!r.pm||r.pm.i!==c.id||(r.st!=='a'&&r.st!=='p'))continue;if(String(r.pa||E.prim(String(r.u||'')))===P)s+=Math.max(0,+r.pm.u||0)}return s}
function calc(u,base,t,skip){const c=promo(),g0=PACKS[base];let ph=0;if(c.on&&t>=c.t0&&t<c.t2)ph=t<c.t1?1:2;
 const pc=ph===1?c.p1:ph===2?c.p2:0,pu=pc>0?Math.max(0,Math.min(base,c.cap-usedPromo(u,c,skip))):0,pb=pc>0?Math.round(pu*pc/100):0;return{g:g0+pb,pb,pu,i:c.id,pc}}

const ops={};
ops['pay.new']=(u,m)=>{
 if(!ON)return err('El pago automático aún no está activado');
 if(!PAY_ID)return err('Falta configurar la cuenta de cobro');
 const base=Math.floor(+m.pk);if(!PACKS[base])return err('Paquete no válido');
 const a=E.acct(u),t=now();a.pyN=(a.pyN||[]).filter(x=>t-x<600000);if(a.pyN.length>=6)return err('Demasiadas órdenes seguidas: espera unos minutos');
 const ex=pending(u);if(ex){if(ex.b===base&&ex.x-t>60000)return Object.assign({ok:1},view(ex));ex.st='exp';ex.x=Math.min(ex.x,t)}/* otro paquete: la anterior se cierra (su monto queda reservado un rato por si ya pagaron) */
 const c=pickCents(base,t);if(!c)return err('Hay muchos pedidos ahora mismo: intenta de nuevo en un minuto');
 const cx=calc(u,base,t),g=cx.g;a.pyN.push(t);const id='p'+E.rid(8),o=G().o[id]={id,u,b:base,g,c,t,x:t+TTL,st:'p'};if(cx.pb>0)o.pm={i:cx.i,u:cx.pu,b:cx.pb};S.dirty();
 log('[pay] orden '+id+' de '+(a.nm||u)+': '+fmt(c)+' USDT → '+g+' gemas (paquete '+base+')');return Object.assign({ok:1},view(o))};
ops['pay.status']=(u,m)=>{const o=G().o[String(m.id||'')];if(!o||o.u!==u)return err('Orden no encontrada');const v=view(o);v.chk=lastOk?Math.round((now()-lastOk)/1000):-1;return Object.assign({ok:1},v)};
ops['pay.mine']=(u)=>{const o=pending(u);return o?Object.assign({ok:1},view(o)):{ok:1,none:1}};
ops['pay.packs']=(u)=>{const t=now();return{ok:1,on:ON,pid:PAY_ID,why:S.isMaster(u)?why():'',packs:Object.keys(PACKS).map(b=>{const c=calc(u,+b,t);return{b:+b,g:c.g,pb:c.pb}}).sort((x,y)=>x.b-y.b)}};

/* ---------- lista de revisión manual (solo master) ---------- */
ops['adm.pay.rv']=(u)=>{if(!S.isMaster(u))return err('Solo el master');const d=G();return{ok:1,l:d.rv.filter(x=>!x.done).slice(-100).reverse(),on:ON,last:lastOk||0,errn:lastErr||''}};
ops['adm.pay.rvok']=(u,m)=>{if(!S.isMaster(u))return err('Solo el master');const d=G(),r=d.rv.find(x=>x.tx===String(m.tx||''));if(!r)return err('No encontrado');if(r.done)return err('Ya estaba resuelto');
 if(m.credit){const o=r.oid&&d.o[r.oid];if(!o||o.st==='paid')return err('Esa orden no se puede acreditar');if(r.c!==o.c)return err('El monto no coincide con la orden');credit(o,r.tx,r.ts,'manual');}
 r.done=1;r.by=String((E.acct(u)||{}).nm||u).slice(0,20);r.dt=now();S.dirty();return{ok:1}};

function credit(o,tx,ts,how){if(o.st==='paid')return false;const a=E.acct(o.u);o.st='paid';o.tx=tx;o.pt=now();o.bt=ts;o.how=how||'auto';G().tx[tx]={t:now(),o:o.id,s:'ok'};
 E.grantGems(o.u,o.g,'own','pago USDT '+fmt(o.c)+' (Binance '+tx+')');S.dirty();
 try{S.push(o.u,{t:'note',m:'💎 ¡Pago recibido! Se acreditaron '+o.g+' gemas'})}catch(e){}
 log('[pay] PAGADA '+o.id+' '+(a.nm||o.u)+': '+fmt(o.c)+' USDT → +'+o.g+' gemas · tx '+tx+' ('+(how||'auto')+')');
 try{S.notify('💎 SILK ROAD · Pago automático recibido\nJugador: '+String(a.nm||o.u).slice(0,30)+'\nMonto: '+fmt(o.c)+' USDT → '+o.g+' 💎\nTx Binance: '+tx)}catch(e){}return true}
function toReview(why,tx,ts,c,o){const d=G();if(d.tx[tx])return;d.tx[tx]={t:now(),s:'rv'};d.rv.push({tx,ts,c,why,oid:o?o.id:'',nm:o?String((E.acct(o.u)||{}).nm||o.u).slice(0,24):'',r:now()});while(d.rv.length>MAXREV)d.rv.shift();S.dirty();
 log('[pay] REVISIÓN MANUAL '+why+' · '+fmt(c)+' USDT · tx '+tx);try{S.notify('⚠️ SILK ROAD · Pago por revisar\n'+why+'\nMonto: '+fmt(c)+' USDT · tx '+tx+(o?'\nOrden de '+o.nm:''))}catch(e){}}

/* ---------- consulta a Binance ---------- */
let off=0,lastOk=0,lastErr='',lastErrT=0,busyQ=false,timer=null;
const RELAY=String(envv('BINANCE_RELAY_URL')||'').trim().replace(/\/+$/,''),RTK=String(envv('RELAY_TOKEN')||'').trim(),BASE=RELAY||'https://api.binance.com',RH=RELAY?{'X-Relay-Token':RTK}:{};
const sign=q=>crypto.createHmac('sha256',SEC).update(q).digest('hex');
async function bget(path,params){const q=new URLSearchParams(Object.assign({},params,{timestamp:String(now()+off),recvWindow:'10000'})).toString(),url=BASE+path+'?'+q+'&signature='+sign(q);
 const r=await fetch(url,{headers:Object.assign({'X-MBX-APIKEY':KEY},RH)}),j=await r.json().catch(()=>({}));if(!r.ok||j.success===false||(j.code&&j.code!=='000000'&&j.code!==0&&String(j.code)!=='000000')){const e=new Error('Binance '+r.status+' '+(j.code||'')+' '+String(j.msg||j.message||'').slice(0,120));e.code=j.code;throw e}return j}
async function syncTime(){try{const r=await fetch(BASE+'/api/v3/time',{headers:RH}),j=await r.json();if(j&&j.serverTime)off=j.serverTime-now()}catch(e){}}

async function check(){
 if(!ON||busyQ)return;busyQ=true;const t=now();
 try{
  const d=G();const j=await bget('/sapi/v1/pay/transactions',{startTime:String(t-90*60000),endTime:String(t+60000),limit:'100'});
  const list=Array.isArray(j.data)?j.data:[];lastOk=now();lastErr='';
  list.sort((a,b)=>(+a.transactionTime||0)-(+b.transactionTime||0));
  for(const x of list){
   const tx=String(x.transactionId||'');if(!tx||d.tx[tx])continue;
   if(String(x.currency||'').toUpperCase()!=='USDT')continue;const amt=Number(x.amount);if(!(amt>0))continue;     /* solo entradas en USDT */
   const ot=String(x.orderType||'');if(ot!=='C2C'&&ot!=='PAY'&&ot!=='C2C_HOLDING')continue;
   const ts=+x.transactionTime||t,c=Math.round(amt*100);
   if(Math.abs(amt*100-c)>1e-6){toReview('Monto con más de 2 decimales ('+x.amount+')',tx,ts,c,null);continue}
   /* órdenes con ese monto cuya ventana contiene la hora del pago (aunque ya se haya vencido hace poco o Binance tarde en mostrarlo) */
   const cand=Object.values(d.o).filter(o=>o.c===c&&o.st!=='paid'&&ts>=o.t-5000&&ts<=o.x);
   if(cand.length===1){credit(cand[0],tx,ts,'auto');continue}
   if(cand.length>1){toReview('Dos órdenes con el mismo monto en la misma ventana',tx,ts,c,cand[0]);continue}
   const late=Object.values(d.o).filter(o=>o.c===c&&o.st!=='paid'&&ts>o.x&&ts<=o.x+30*60000).sort((a,b)=>b.x-a.x)[0];
   if(late){toReview('Llegó tarde (la orden ya había vencido)',tx,ts,c,late);continue}
   /* ¿monto cercano a una orden viva? probablemente se equivocó */
   const near=Object.values(d.o).find(o=>o.st==='p'&&t<o.x&&Math.abs(o.c-c)<=100);
   toReview(near?'Monto distinto al de la orden activa de '+String((E.acct(near.u)||{}).nm||near.u).slice(0,20)+' ('+fmt(near.c)+')':'Sin orden que coincida',tx,ts,c,near||null)}
  /* marca como vencidas las órdenes que pasaron su ventana */
  for(const id in d.o){const o=d.o[id];if(o.st==='p'&&t>=o.x){o.st='exp';S.dirty()}}
  clean()}
 catch(e){const m=String(e&&e.message||e);if(/-1021|timestamp/i.test(m))await syncTime();lastErr=m;if(now()-lastErrT>300000){lastErrT=now();log('[pay] error consultando Binance: '+m)}}
 finally{busyQ=false}}

function loop(){let any=false;const d=G(),t=now();for(const id in d.o){const o=d.o[id];if(o.st==='p'&&t<o.x+FREE_LAG){any=true;break}}
 const wait=any?POLL:IDLE;timer=setTimeout(async()=>{await check();loop()},wait)}
function why(){return !KEY&&!SEC?'No llegan BINANCE_API_KEY ni BINANCE_SECRET al servidor':!KEY?'Falta BINANCE_API_KEY':!SEC?'Falta BINANCE_SECRET':!PAY_ID?'Falta BINANCE_PAY_ID':''}
function start(){if(!ON){log('[pay] pagos automáticos APAGADOS: '+why()+' · variables con "BINANCE" que ve el servidor: '+(Object.keys(process.env).filter(k=>/binance/i.test(k)).join(', ')||'ninguna'));return}if(!PAY_ID)log('[pay] ⚠️ falta BINANCE_PAY_ID');syncTime().then(()=>{log('[pay] pagos automáticos ACTIVOS · paquetes '+JSON.stringify(PACKS)+' · orden de '+TTL/60000+' min');check().then(loop)})}
return{ops,start,check,_PACKS:()=>PACKS}};
