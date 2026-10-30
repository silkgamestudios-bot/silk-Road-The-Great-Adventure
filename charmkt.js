'use strict';
/* v383 · MERCADO DE PERSONAJES.
   Un jugador publica CUALQUIERA de sus personajes (el 1.º, el 2.º o el 3.º; el orden no importa) con un precio en gemas 💎 y/o USDT 💵 (el oro no se acepta: no tiene un valor fijo con el que cobrar la comisión).
   - Requisito: la cuenta tiene que conservar al menos un personaje (que no esté en venta). Si es el único, primero hay que crear otro.
   - COMISIÓN SIEMPRE EN GEMAS: CHM_FEE % (por defecto 5, mínimo 1 💎) del precio expresado en gemas (1 USDT = 1 💎, CHM_GEM_USDT). Se RETIENE al publicar (por eso todo anuncio necesita gemas), se consume cuando se vende y se devuelve si se cancela
     (CHM_FEE_REFUND=0 → no se devuelve). El vendedor recibe el precio COMPLETO (en gemas o en USDT).
   - Al publicarlo queda EN GARANTÍA: nadie puede jugarlo ni borrarlo (a.sale) hasta que se venda o se cancele.
   - Gemas: compra instantánea y atómica en el servidor (el personaje cambia de cuenta y se paga a la vez).
   - USDT (dinero real): el personaje se RESERVA para el comprador (45 min), el comprador paga por Binance Pay al Pay ID del master y envía su número de orden;
     el master lo verifica en su Binance y aprueba: el personaje pasa al comprador y el master le paga al vendedor el precio completo y lo marca como pagado.
   - Reserva USDT: CHM_RESV_MIN minutos (por defecto 45).
   - Lo que se traspasa: el personaje completo (partida, nivel, oro, objetos, mascotas, nombre). NO se traspasa: gemas, VIP, apariencias ni boletos (son de la cuenta).
     Si se vende el 1.º personaje, su contenido pasa a un uid nuevo (el uid del 1.º es el de la cuenta y no se mueve) y su lugar queda vacío para crear otro.
   - Al traspasarse se borran sus amigos, solicitudes, bloqueos y mensajes (el comprador empieza limpio).
   - Listados de la v382 (comisión descontada del pago, precio en oro): se adaptan solos al arrancar (el oro se quita; sin comisión retenida se sigue descontando como antes). */
const fs=require('fs');
module.exports=function(S,E,X){
const {ECO,ACC}=S,err=e=>({e}),now=()=>Date.now();
const num=(v,d)=>{const n=parseFloat(v);return isNaN(n)?d:n};
const FEE=Math.max(0,Math.min(30,num(process.env.CHM_FEE,5)));
const RESV_MS=Math.max(1000,num(process.env.CHM_RESV_MIN,45)*60000);
const GEMUSD=Math.max(0.01,num(process.env.CHM_GEM_USDT,1));          /* cuántos USDT vale 1 💎 en la tienda */
const REFUND=process.env.CHM_FEE_REFUND!=='0';
const C=()=>{const c=ECO.chm=ECO.chm||{};c.L=(c.L&&typeof c.L==='object')?c.L:{};c.H=Array.isArray(c.H)?c.H:[];c.P=Array.isArray(c.P)?c.P:[];return c};
const nmOf=u=>{const a=ECO.acc[u];return a?String(a.nm||a.pn||'Personaje').slice(0,24):'Personaje'};
const emailOf=p=>String((ACC[p]&&ACC[p].e)||'').slice(0,80);
const canPub=u=>{if(S.isMaster(u))return true;const a=E.acct(u),t=now();return(+a.px.lt||0)>t&&(+a.px.ap||0)>t};
const prV=pr=>({m:pr.m||0,u:pr.u?pr.u/100:0});
const note=(p,m)=>{try{const c=E.chCur(p);if(S.online(c))S.push(c,{t:'note',m});else if(S.online(p))S.push(p,{t:'note',m})}catch(e){}};
const entTo=p=>{try{const c=E.chCur(p);E.pushEnt(S.online(c)?c:p)}catch(e){}};
E.onSale(id=>{const L=C().L[id];return L?{id,st:L.st,pr:prV(L.pr),hold:L.hold|0}:{id}});
/* comisión en gemas de un anuncio: % del precio (el más alto de los dos, expresado en 💎), mínimo 1 */
const feeOf=pr=>{if(!(FEE>0))return 0;const base=Math.max(pr.m||0,pr.u?Math.ceil(pr.u/100/GEMUSD-1e-9):0);return Math.max(1,Math.ceil(base*FEE/100-1e-9))};

/* lo que impide vender un personaje: cosas suyas que seguirían funcionando a nombre del dueño anterior */
function busy(t){const DB=S.DB,has=(c,f)=>Object.values(DB[c]||{}).some(f);
 if(has('offers',o=>o&&(o.u===t||o.bu===t)))return'Tiene ofertas o subastas en el Mercado: ciérralas primero';
 if(DB.shops&&DB.shops[t])return'Tiene una tienda abierta («Mi carruaje»): ciérrala primero';
 if(has('gmk',o=>o&&o.u===t))return'Tiene anuncios en el Mercado de Gemas: retíralos primero';
 if(has('sm',o=>o&&o.u===t))return'Tiene ofertas en el Mercado de la Seda: retíralas primero';
 if(has('bty',b=>b&&(b.u===t||(Array.isArray(b.ac)&&b.ac.includes(t)))))return'Tiene carteles de recompensa activos: cancélalos primero';
 if(has('gemreq',o=>o&&o.u===t&&o.st==='p'))return'Tiene un pago de gemas por revisar: espera a que se confirme';
 const a=ECO.acc[t];if(a&&Array.isArray(a.dl)&&a.dl.some(d=>d&&(d.gold||d.prov||d.pet||d.item)))return'Tiene entregas pendientes (oro u objetos): entra con él un momento para recibirlas y vuelve a intentarlo';
 return''}

/* ficha del personaje (lo que ve el comprador): sale del servidor, nunca del cliente del vendedor */
function snapOf(t){const a=E.acct(t);let v={};try{const o=JSON.parse(fs.readFileSync(X.savePath(t),'utf8'));v=JSON.parse(o.d)||{}}catch(e){}
 const cl=s=>String(s==null?'':s).replace(/[<>&"']/g,'').slice(0,34);
 const it=x=>x&&typeof x==='object'?{n:cl(x.n||'Objeto'),r:x.r|0,t:x.t|0,sl:x.sl|0,up:x.up|0,ar:x.ar|0,en:x.en|0}:null;
 const eq=(v.eq&&typeof v.eq==='object'?Object.values(v.eq):[]).map(it).filter(Boolean).slice(0,14);
 const pets=(Array.isArray(v.pets)?v.pets:[]).slice(0,12).map(x=>x&&typeof x==='object'?{n:cl(x.nm||x.t||'Mascota').slice(0,18),t:cl(x.t).slice(0,12),lv:x.lv|0,q:x.q|0}:null).filter(Boolean);
 const R=a.res||{};
 return{nm:nmOf(t),cl:a.cls>=0?a.cls:-1,lv:Math.max(1,a.lv|0),xp:a.xp|0,sx:Array.isArray(a.sx)?a.sx.slice(0,3).map(x=>x|0):[],g:Math.floor(+R.gold||0),bk:Math.floor(+R.bk||0),eq,pets,bag:Array.isArray(v.bag)?v.bag.length:0,ts:+a.ts||0}}
const view=(L,u)=>{const p=E.prim(u),s=L.snap||{};return{id:L.id,nm:s.nm,cl:s.cl,lv:s.lv,g:(s.g|0)+(s.bk|0),eq:(s.eq||[]).length,pt:(s.pets||[]).length,pr:prV(L.pr),sn:L.sn,ts:L.ts,st:L.st,mine:L.p===p?1:0,me:L.b===p?1:0,until:L.st==='resv'?L.rts+RESV_MS:0,hold:L.p===p?(L.hold|0):0}};

/* la comisión retenida vuelve al vendedor (si se cancela o el anuncio desaparece); si se vendió, ya se cobró */
function giveBack(L,why){const h=L.hold|0;if(h>0&&ACC[L.p]){const a=E.acct(L.p);a.gem.own+=h;E.glAdd(a,h,why);S.dirty();entTo(L.p)}L.hold=0}
const unlist=(L,why,force)=>{const a=ECO.acc[L.t];if(a&&a.sale===L.id)delete a.sale;if(force||REFUND)giveBack(L,why||'Comisión de venta devuelta');delete C().L[L.id];S.dirty()};
const reopen=L=>{L.xb='';L.st='open';L.b=L.bu=L.bn='';L.ref='';L.pts=0;S.dirty()};

/* limpia ventas sin personaje, quita el oro de los anuncios viejos y libera reservas vencidas */
function sweep(){const c=C(),t=now();let ch=0;
 for(const id of Object.keys(c.L)){const L=c.L[id],a=L&&ECO.acc[L.t];
  if(!L||!a||!E.chSlots(L.p).includes(L.t)){if(L)giveBack(L,'Comisión de venta devuelta (el anuncio ya no existe)');if(a&&a.sale===id)delete a.sale;delete c.L[id];ch=1;continue}
  if(L.pr&&L.pr.g){delete L.pr.g;ch=1;if(!L.pr.m&&!L.pr.u&&L.st==='open'){unlist(L,'Comisión de venta devuelta (ya no se vende por oro)',true);continue}}
  if(L.st==='resv'&&t-L.rts>RESV_MS){L.xb=L.b;L.st='open';L.b=L.bu=L.bn='';ch=1}}
 for(const k in ECO.acc){const a=ECO.acc[k];if(a&&a.sale&&!c.L[a.sale]){delete a.sale;ch=1}}
 if(ch)S.dirty()}
sweep();setInterval(sweep,30000).unref();

function parsePrices(m){const pr={},blank=v=>v===undefined||v===null||v===''||v===0||v==='0';
 if(!blank(m.pg))return err('El oro ya no se acepta en este mercado: vende por 💎 gemas o USDT');
 if(!blank(m.pm)){const g=Math.floor(+m.pm);if(!(g>=1&&g<=1e6))return err('Precio en gemas: de 1 a 1.000.000');pr.m=g}
 let pay='';
 if(!blank(m.pu)){const s=String(m.pu).trim().replace(',','.');if(!/^\d{1,5}(\.\d{1,2})?$/.test(s))return err('Precio en USDT: de 0.50 a 5000.00 (máximo 2 decimales)');const c=Math.round(parseFloat(s)*100);if(!(c>=50&&c<=500000))return err('Precio en USDT: de 0.50 a 5000.00');pr.u=c;
  pay=String(m.pay||'').trim();if(!/^[\w@.+:\-]{4,64}$/.test(pay))return err('Escribe tu ID de Binance Pay (o tu correo/cartera) para que te paguemos los USDT')}
 if(!Object.keys(pr).length)return err('Pon al menos un precio: gemas 💎 o USDT 💵');
 return{pr,pay}}

/* el 1.º personaje: su contenido pasa a un uid nuevo (el 1.º es el de la cuenta). La partida guardada se copia ANTES; si no se puede, no se toca nada. */
function splitFirst(t){let x;do{x='u'+E.rid(10)}while(ECO.acc[x]||ACC[x]||E.prim(x)!==x);
 const src=X.savePath(t),dst=X.savePath(x);let had=0;
 try{fs.copyFileSync(src,dst);had=1}catch(e){if(!e||e.code!=='ENOENT')return err('No se pudo mover la partida guardada: inténtalo de nuevo')}
 const r=E.chSplit(t,x);if(r.e){if(had){try{fs.unlinkSync(dst)}catch(e){}}return r}
 if(had){try{fs.unlinkSync(src)}catch(e){}}
 return{ok:1,x}}
/* el traspaso en sí: el personaje cambia de cuenta (con su partida, oro, objetos y mascotas) y deja de estar en garantía */
function finishSale(L,bp){const old=L.t;let t=old;
 const why=busy(t);if(why)return err('Este personaje cambió y no puede venderse ahora: '+why);
 const rm=E.chRoom(bp);if(rm.e)return rm;if(S.online(t))return err('El personaje está conectado');
 let split=0;if(t===E.prim(t)){const s=splitFirst(t);if(s.e)return s;t=s.x;split=1}
 const r=E.chXfer(t,bp);
 if(r.e){if(split){L.t=t;const a=ECO.acc[t];if(a)a.sale=L.id;S.dirty()}return r}
 if(r.drop){try{fs.unlinkSync(X.savePath(r.drop))}catch(e){}}
 const a=ECO.acc[t];if(a){delete a.sale;a.dl=[]}
 try{X.SO.wipe(old)}catch(e){}
 delete C().L[L.id];S.dirty();return{ok:1,x:t}}
const hist=(L,c,v)=>{const H=C().H,s=L.snap||{};H.push({ts:now(),nm:s.nm,cl:s.cl,lv:s.lv,c,v});if(H.length>30)H.shift()};
const fmt=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.');

const ops={};
ops['chm.list']=(u)=>{sweep();const c=C(),p=E.prim(u),all=Object.values(c.L).sort((a,b)=>b.ts-a.ts);
 const l=all.filter(x=>x.p!==p&&(x.st==='open'||x.st==='resv')).slice(0,150).map(x=>view(x,u));
 const mine=all.filter(x=>x.p===p).map(x=>view(x,u));
 const buying=all.filter(x=>x.b===p&&(x.st==='resv'||x.st==='paid')).map(x=>Object.assign(view(x,u),{ref:x.ref||'',pid:X.PAY_ID,usdt:(x.pr.u||0)/100,paid:x.st==='paid'?1:0}));
 const pay=c.P.filter(x=>x.p===p).slice(-8).reverse().map(x=>({id:x.id,nm:x.nm,net:x.net/100,fg:x.fg|0,st:x.st,ts:x.ts}));
 const rm=E.chRoom(p);
 return{ok:1,l,mine,buying,pay,h:c.H.slice(-8).reverse(),can:canPub(u)?1:0,fee:FEE,gu:GEMUSD,refund:REFUND?1:0,gem:E.gTot(E.acct(u)),room:rm.e?0:1,max:E.CH_MAX,adm:S.isMaster(u)?all.filter(x=>x.st==='paid').length:undefined}};
ops['chm.view']=(u,m)=>{sweep();const L=C().L[String(m.id||'')];if(!L)return err('Ese personaje ya no está en venta');L.snap=snapOf(L.t);return{ok:1,v:Object.assign(view(L,u),{s:L.snap})}};
ops['chm.sell']=(u,m)=>{sweep();const p=E.prim(u);if(!ACC[p])return err('Necesitas una cuenta con usuario y contraseña para vender personajes');
 const t=String(m.u||'');if(!E.chSlots(p).includes(t))return err('Ese personaje no es de tu cuenta');
 if(S.isMaster(p))return err('Los personajes del master no se venden');
 const a=E.acct(t);if(E.chBlank(a))return err('Ese personaje aún no tiene clase ni nombre');
 if(a.sale)return err('Ese personaje ya está en venta');
 /* la cuenta tiene que conservar al menos un personaje jugable: si este es el único (o el otro ya está en venta), primero hay que crear otro */
 const keep=E.chSlots(p).filter(c=>c!==t&&!E.chBlank(ECO.acc[c])&&!(ECO.acc[c]&&ECO.acc[c].sale));
 if(!keep.length)return err('Es tu único personaje: crea otro primero (con su clase y nombre). Tu cuenta tiene que conservar al menos un personaje para poder vender este');
 if(t===u||t===E.chCur(p))return err('Estás jugando con este personaje: entra con otro de tu cuenta para venderlo');
 if(!canPub(u))return err('Para publicar en los mercados necesitas el servicio 🎯 Combo Cazador (o VIP). Comprar sí es libre.');
 if(a.gld)return err('Está en un gremio: sácalo del gremio antes de venderlo');
 const why=busy(t);if(why)return err(why);
 if(S.online(t))return err('Ese personaje está conectado en otro aparato');
 const q=parsePrices(m);if(q.e)return q;
 const fee=feeOf(q.pr),b=E.acct(u),have=E.gTot(b);
 if(have<fee)return err('La comisión de publicar es '+fee+' 💎 (se devuelve si cancelas) y tienes '+have+' 💎: consigue gemas para poder publicar');
 const id='c'+E.rid(6),snap=snapOf(t);
 if(fee>0&&!E.spendGems(b,fee,false,'Comisión de venta de '+snap.nm+' (retenida)'))return err('No se pudo cobrar la comisión');
 C().L[id]={id,t,p,sc:u,sn:nmOf(u),pr:q.pr,pay:q.pay,ts:now(),st:'open',snap,hold:fee};a.sale=id;
 {const A=ACC[p];if(A)A.cc=u}/* el personaje actual de la cuenta es el que está jugando, nunca el que queda en garantía */
 S.dirty();E.pushEnt(u);
 S.log('[personajes] '+nmOf(u)+' pone en venta a '+snap.nm+' (Nv '+snap.lv+')'+(t===p?' [1.º]':'')+' '+JSON.stringify(prV(q.pr))+' · comisión retenida '+fee+' 💎');
 return Object.assign({ok:1,id,fee,gem:E.gTot(E.acct(u))},E.chList(u))};
ops['chm.cancel']=(u,m)=>{sweep();const L=C().L[String(m.id||'')];if(!L)return err('Esa venta ya no existe');const p=E.prim(u),gm=S.isMaster(u);
 if(L.p!==p&&!gm)return err('Ese personaje no es tuyo');
 if(L.st!=='open'&&!gm)return err(L.st==='paid'?'Ya hay un pago en revisión: espera la respuesta del master':'Alguien está pagando este personaje: espera unos minutos (si no paga, se libera solo)');
 if(L.b)note(L.b,'❌ La venta de '+(L.snap||{}).nm+' fue cancelada.');
 const h=L.hold|0,back=REFUND||gm;unlist(L,'Comisión de venta devuelta (cancelaste)',gm);S.log('[personajes] venta cancelada: '+(L.snap||{}).nm+' por '+nmOf(u));
 E.pushEnt(u);return Object.assign({ok:1,back:back?h:0,gem:E.gTot(E.acct(u))},E.chList(u))};
ops['chm.buy']=(u,m)=>{sweep();const L=C().L[String(m.id||'')],c=String(m.c||'');if(!L)return err('Ese personaje ya no está en venta');
 const bp=E.prim(u);if(!ACC[bp])return err('Necesitas una cuenta con usuario y contraseña para comprar personajes');if(bp===L.p)return err('Es un personaje de tu cuenta');
 if(!['m','u'].includes(c)||!L.pr[c])return err('Ese tipo de pago no está disponible para este personaje');
 const nm=(L.snap||{}).nm,fullMsg='Tu cuenta ya tiene el máximo de personajes ('+E.CH_MAX+'): borra uno para poder comprar';
 if(c==='u'){
  if(L.st==='resv'&&L.b===bp)return{ok:1,rsv:1,id:L.id,usdt:L.pr.u/100,pid:X.PAY_ID,until:L.rts+RESV_MS};
  if(L.st==='paid'&&L.b===bp)return err('Ya enviaste el comprobante: espera la aprobación del master');
  if(L.st!=='open')return err('Alguien está pagando este personaje: espera unos minutos');
  if(Object.values(C().L).some(x=>x.b===bp&&(x.st==='resv'||x.st==='paid')))return err('Ya tienes otro pago de USDT en curso: termínalo o cancélalo primero');
  if(E.chRoom(bp).e)return err(fullMsg);
  L.st='resv';L.b=bp;L.bu=u;L.bn=nmOf(u);L.rts=now();L.xb='';S.dirty();
  note(L.p,'🏷️ Alguien está comprando tu personaje '+nm+' por USDT');
  return{ok:1,rsv:1,id:L.id,usdt:L.pr.u/100,pid:X.PAY_ID,until:L.rts+RESV_MS}}
 if(L.st!=='open')return err('Alguien está pagando este personaje con USDT: espera unos minutos');
 const price=L.pr.m,leg=L.hold===undefined,fee=leg?Math.floor(price*FEE/100):0,get=price-fee,b=E.acct(u),hold=L.hold|0;
 const tt=E.gTot(b);if(tt<price)return err('Te faltan '+fmt(price-tt)+' 💎');
 if(E.chRoom(bp).e)return err(fullMsg);
 const seller=L.p,r=finishSale(L,bp);if(r.e)return err(r.e);
 const snap=L.snap||{};
 E.spendGems(b,price,false,'Compra del personaje '+nm);const s=E.acct(seller);s.gem.own+=get;E.glAdd(s,get,'Venta del personaje '+nm);S.dirty();E.pushEnt(u);entTo(seller);
 hist({snap},'m',price);note(seller,'💰 Vendiste al personaje '+nm+' por '+fmt(get)+' 💎'+(leg?' (comisión '+FEE+'%)':' (la comisión de '+hold+' 💎 ya estaba retenida)'));
 S.log('[personajes] '+nmOf(u)+' compró a '+nm+' (Nv '+snap.lv+') por '+price+' 💎 (comisión '+(leg?fee:hold)+' 💎)');
 return Object.assign({ok:1,done:1,nm,ent:E.ent(u)},E.chList(u))};
ops['chm.abort']=(u,m)=>{sweep();const L=C().L[String(m.id||'')],bp=E.prim(u);if(!L||L.b!==bp||L.st!=='resv')return err('No hay una reserva tuya que cancelar (si ya enviaste el comprobante, espera al master)');reopen(L);return{ok:1}};
ops['chm.paid']=(u,m)=>{sweep();const L=C().L[String(m.id||'')],bp=E.prim(u);if(!L)return err('Esa orden ya no existe');
 const ref=String(m.ref||'').trim();if(!/^[\w\- .#:]{4,60}$/.test(ref))return err('Escribe el número de orden de Binance Pay (de 4 a 60 caracteres)');
 /* la reserva venció pero este comprador sí pagó: se le vuelve a reservar si nadie más lo tomó */
 if(L.st==='open'&&L.xb===bp&&!Object.values(C().L).some(x=>x.b===bp&&(x.st==='resv'||x.st==='paid'))){L.st='resv';L.b=bp;L.bu=u;L.bn=nmOf(u);L.rts=now();L.xb=''}
 if(L.b!==bp||(L.st!=='resv'&&L.st!=='paid'))return err('Esa orden no es tuya o ya no está activa');
 L.ref=ref;L.pts=now();L.st='paid';S.dirty();const s=L.snap||{},leg=L.hold===undefined;
 S.notify('💵 SILK ROAD · Venta de personaje por USDT por aprobar\nPersonaje: '+s.nm+' (Nv '+s.lv+')\nPrecio: '+(L.pr.u/100).toFixed(2)+' USDT\nComprador: '+L.bn+' ('+emailOf(L.b)+')\nVendedor: '+L.sn+' ('+emailOf(L.p)+')\nCobro del vendedor: '+(leg?((L.pr.u-Math.floor(L.pr.u*FEE/100))/100).toFixed(2)+' USDT (precio − comisión)':(L.pr.u/100).toFixed(2)+' USDT completos (su comisión de '+(L.hold|0)+' 💎 ya está retenida)')+' al ID '+(L.pay||'?')+'\nOrden Binance Pay: '+ref.slice(0,60)+'\nTu Pay ID: '+X.PAY_ID+'\nAprueba en el juego (Elige tu personaje → Mercado de personajes → 🛡️ Master).');
 return{ok:1}};
/* ---- master ---- */
const gm=u=>S.isMaster(u)?null:err('operación desconocida');
const pv=x=>({id:x.id,nm:x.nm,net:x.net/100,gross:x.cents/100,fee:x.fee/100,fg:x.fg|0,sn:x.sn,se:x.se,pay:x.pay,bn:x.bn,be:x.be,st:x.st,ts:x.ts,pts:x.pts||0});
ops['chm.adm']=(u)=>{const x=gm(u);if(x)return x;sweep();const c=C();
 const o=Object.values(c.L).filter(L=>L.st==='resv'||L.st==='paid').sort((a,b)=>(b.pts||b.rts)-(a.pts||a.rts)).map(L=>({id:L.id,nm:(L.snap||{}).nm,cl:(L.snap||{}).cl,lv:(L.snap||{}).lv,usdt:(L.pr.u||0)/100,fg:L.hold|0,st:L.st,bn:L.bn,be:emailOf(L.b),sn:L.sn,se:emailOf(L.p),ref:L.ref||'',rts:L.rts,pts:L.pts||0}));
 return{ok:1,o,pay:c.P.filter(x=>x.st==='topay').map(pv),done:c.P.filter(x=>x.st==='paid').slice(-6).reverse().map(pv)}};
ops['chm.approve']=(u,m)=>{const x=gm(u);if(x)return x;sweep();const L=C().L[String(m.id||'')];
 if(!L||!(L.st==='resv'||L.st==='paid')||!L.b)return err('Esa orden ya no está pendiente');if(!L.pr.u)return err('Esta venta no es por USDT');
 const cents=L.pr.u,leg=L.hold===undefined,fee=leg?Math.floor(cents*FEE/100):0,net=cents-fee,fg=L.hold|0,bp=L.b,bn=L.bn,snap=L.snap||{},seller=L.p,sn=L.sn,pay=L.pay,id=L.id,ref=L.ref;
 const r=finishSale(L,bp);if(r.e)return err(r.e);
 const c=C();c.P.push({id,ts:now(),nm:snap.nm,cents,fee,net,fg,p:seller,sn,se:emailOf(seller),pay,bn,be:emailOf(bp),st:'topay'});if(c.P.length>300){const i=c.P.findIndex(y=>y.st==='paid');if(i>=0)c.P.splice(i,1)}
 hist({snap},'u',cents/100);S.dirty();
 note(bp,'✅ ¡Tu compra fue aprobada! '+snap.nm+' ya está en tu cuenta: ábrelo desde «Elige tu personaje».');
 note(seller,'✅ Vendiste a '+snap.nm+' por '+(cents/100).toFixed(2)+' USDT. Te pagaremos '+(net/100).toFixed(2)+' USDT'+(leg?' (comisión '+FEE+'%)':' completos (la comisión ya la pagaste en 💎)')+' a tu ID '+pay+'.');
 S.log('[personajes] '+nmOf(u)+' aprobó la venta USDT de '+snap.nm+' ('+(cents/100).toFixed(2)+' USDT, orden '+ref+'): pagar '+(net/100).toFixed(2)+' a '+pay+' · comisión '+(leg?fee/100+' USDT':fg+' 💎'));
 return{ok:1,pay:pv(c.P[c.P.length-1])}};
ops['chm.reject']=(u,m)=>{const x=gm(u);if(x)return x;sweep();const L=C().L[String(m.id||'')];if(!L||!(L.st==='resv'||L.st==='paid'))return err('Esa orden ya no está pendiente');
 const why=String(m.why||'').replace(/[<>]/g,'').trim().slice(0,120)||'no se pudo verificar el pago',bp=L.b;
 reopen(L);note(bp,'❌ Tu pago de '+(L.snap||{}).nm+' no fue aprobado: '+why+'. Escríbele al master si ya pagaste.');
 S.log('[personajes] '+nmOf(u)+' rechazó el pago USDT de '+(L.snap||{}).nm+': '+why);return{ok:1}};
ops['chm.paidout']=(u,m)=>{const x=gm(u);if(x)return x;const e=C().P.find(y=>y.id===String(m.id||'')&&y.st==='topay');if(!e)return err('Ese pago ya está marcado o no existe');
 e.st='paid';e.pts=now();S.dirty();note(e.p,'💵 Te pagamos '+(e.net/100).toFixed(2)+' USDT por la venta de '+e.nm+'. ¡Gracias!');S.log('[personajes] pagado al vendedor '+e.sn+': '+(e.net/100).toFixed(2)+' USDT');return{ok:1}};
return{ops,sweep,snapOf}};
