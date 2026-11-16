/* 🦖 v428 — TIENDA DE MASCOTAS · TEMPLO DE HABILIDADES · EQUIPO DE MASCOTA (Herrero) · MERCADO DE MASCOTAS EN 💎
   v431 — LA TIENDA SOLO VENDE LAS PREMIUM (hoy: el T-Rex). Perro, lobo, halcón, búho, caballo, camello, corcel oscuro y escorpión NO se venden por gemas:
   se consiguen jugando (guaridas, encargos del Maestro de animales, doma con lazo) y se venden entre jugadores (mercado de gemas, oro, USDT, subasta, trato).
   Todo lo que cuesta gemas u oro lo decide y cobra el SERVIDOR.
   · pet.shop   → catálogo con precios, tus alquileres y las tablas de costos del Templo y del Herrero.
   · pet.buy    → comprar (10 💎). Si ya la alquilas, la convierte en tuya.
   · pet.rent   → alquilar 7 días (3 💎); volver a alquilarla suma 7 días (máx. 30 días acumulados).
   · pet.skill  → Templo: sube una de las 4 habilidades de la mascota (oro). No se puede en mascotas alquiladas.
   · pet.forge  → Herrero: fabrica una pieza de equipo de mascota (oro + materiales). Es la ÚNICA forma de conseguirlas.
   · pet.eq / pet.un → poner o quitar una pieza en la mascota. La pieza queda con la mascota si la vendes.
   · pm.*       → Mercado de mascotas en 💎 (publicar, comprar, retirar). El mercado de oro y el de USDT ya existían (market.js, usdtmkt.js).
   Las habilidades y el equipo viven en el REGISTRO de la mascota (ECO.reg[id].psk / .gr): así viajan con ella en cualquier venta
   y el cliente no puede inventarlas (cleanPetS las reescribe siempre desde el registro). */
module.exports=function(S,E){
const DB=S.DB,ops={},err=e=>({e}),now=()=>Date.now(),DAY=864e5;
const log=m=>{try{(S.log||console.log)(m)}catch(e){}};
const int=(v,a,b,d)=>{v=Math.floor(+v);return Number.isFinite(v)?Math.min(b,Math.max(a,v)):d};
const sint=(v,a,b,d)=>{v=Math.floor(+v);return Number.isFinite(v)&&v>=a&&v<=b?v:d};   /* estricto: lo que viene del cliente fuera de rango se RECHAZA, no se recorta */
const REG=()=>E.reg();
const nmOf=u=>(E.acct(u)||{}).nm||'Jugador';
/* ---------- catálogo ---------- */
const BUY=int(process.env.PET_BUY_GEMS,1,1e6,10),RENT=int(process.env.PET_RENT_GEMS,1,1e6,3),RDAYS=int(process.env.PET_RENT_DAYS,1,60,7),MAXR=30*DAY,MAXPETS=8;   /* el juego solo deja tener 8 mascotas a la vez (petFull) */
const OFF=new Set(String(process.env.PETSHOP_OFF||'').split(',').map(x=>x.trim()).filter(Boolean));
/* ═══ CATÁLOGO DE LA TIENDA = SOLO LAS PREMIUM (se pagan con gemas) ═══
   Para sumar otra mascota o montura «solo por gemas» (como el T-Rex): UNA línea aquí con prem:1.
   Opcionales: buy / rent / days propios (si no, valen PET_BUY_GEMS, PET_RENT_GEMS y PET_RENT_DAYS) y tm = multiplicador del costo de sus habilidades en el Templo.
   Su tipo entra solo a economy.PREMP: ningún guardado del cliente puede inventarla ni convertir otra en ella (solo la tienda o el master la crean).
   Además hay que añadir su arte y su fila en la tabla PTY de play.html (eso no se puede hacer desde aquí).
   Los animales que NO están en esta lista (perro, lobo, halcón, búho, caballo, camello, corcel oscuro, escorpión…) los consiguen y los venden los jugadores. */
const CAT0=[
 {k:'trex',n:'T-Rex',ic:'🦖',prem:1,tm:2}];
for(const c of CAT0)if(c.prem)E.PREMP.add(c.k);   /* aunque se retire de la tienda con PETSHOP_OFF, sigue protegida */
const cat=()=>CAT0.filter(c=>!OFF.has(c.k)).map(c=>Object.assign({buy:BUY,rent:RENT,days:RDAYS},c));
const catOf=k=>cat().find(c=>c.k===k);
const nosale=()=>{const l=cat().map(c=>c.ic+' '+c.n);return 'Esa mascota no se vende por gemas'+(l.length?': la tienda solo tiene las premium ('+l.join(', ')+')':'')+'. Las demás se consiguen jugando o con otros jugadores'};
/* ---------- Templo: costo en oro de cada nivel de habilidad ---------- */
const SKC=[60e3,180e3,540e3,1600e3,4800e3],SKM=[1,1.5,2,3],UNL=[1,4,8,12],TM=Object.fromEntries(CAT0.filter(c=>c.tm>0).map(c=>[c.k,c.tm]));   /* nivel mínimo de mascota: UNL[i] + 4 por cada nivel ya aprendido */
const skCost=(i,L,ty)=>{const b=Math.round(SKC[L]*SKM[i]*(TM[ty]||1)/1000)*1000;return b+Math.ceil(b*.03)};
/* ---------- Herrero: equipo de mascota ---------- */
const PGG=[0,80e3,300e3,1100e3,4e6,14e6],PGMUL=[0,1,1.5,1.2,.9],PGLV=[0,1,6,12,18,24];
const PGMAT=[null,{hie:24,cur:30},{hie:50,pla:14,cur:60},{pla:30,aur:12,mit:6,cur:100},{mit:24,dia:4,des:6},{dia:10,des:18,dco:2}];
function pgCost(pg,pt){const g=Math.round(PGG[pt]*PGMUL[pg]/1000)*1000,m={};for(const k in PGMAT[pt])m[k]=Math.max(1,Math.round(PGMAT[pt][k]*PGMUL[pg]));return{g,gt:g+Math.ceil(g*.03),m}}
const MATN={hie:'hierro',cur:'pieles de lobo',pla:'plata',aur:'oro',mit:'mitril',dia:'diamante',des:'escamas de dragón',dco:'corazones de dragón'};
/* ---------- registro: marcas que viajan con la mascota ---------- */
const KEEPF=['nt','up','ar','en','el','psk','gr','rent','ty','lv'];
function holdReg(id,o,esc,k){const R=REG(),old=R[id]||{},n={o,k:k||'p',t:now(),esc:esc?1:0};for(const f of KEEPF)if(old[f]!=null&&old[f]!==0&&old[f]!==false)n[f]=old[f];R[id]=n;S.dirty()}
function rentalOf(u,k){const R=REG();for(const id in R){const r=R[id];if(r&&r.o===u&&r.k==='p'&&r.rent&&r.ty===k)return id}return null}
function myReg(u){const R=REG(),o={};for(const id in R){const r=R[id];if(r&&r.o===u&&r.k==='p')o[id]=r.rent||0}return o}   /* id → vencimiento del alquiler (0 = comprada): el cliente la usa para reconciliar sus alquileres */
function myRentals(u){const R=REG(),o=[];for(const id in R){const r=R[id];if(r&&r.o===u&&r.k==='p'&&r.rent)o.push({id,k:r.ty||'',rt:r.rent})}return o}
const myPet=(u,id)=>{const r=REG()[String(id||'')];return r&&r.k==='p'&&r.o===u?r:null};
const newPet=(c,extra)=>Object.assign({id:'pt'+E.rid(9),t:c.k,nm:c.n,lv:1,xp:0,q:0,fd:80,hp:99999,en:99999,ill:0},extra||{});   /* hp/en altos: el juego los recorta al máximo real */
/* ---------- consulta ---------- */
ops['pet.shop']=(u)=>{const a=E.acct(u);return{ok:1,cat:cat(),rent:myRentals(u),reg:myReg(u),max:MAXR/DAY,
 skc:Object.assign({'*':SKC.map((c,L)=>SKM.map((m,i)=>skCost(i,L,'')))},Object.fromEntries(Object.keys(TM).map(ty=>[ty,SKC.map((c,L)=>SKM.map((m,i)=>skCost(i,L,ty)))]))),unl:UNL,
 pg:{g:[1,2,3,4,5].map(pt=>[1,2,3,4].map(pg=>pgCost(pg,pt).gt)),m:[1,2,3,4,5].map(pt=>[1,2,3,4].map(pg=>pgCost(pg,pt).m)),lv:PGLV},ent:E.ent(u),n:E.petCount(u),mx:MAXPETS}};
/* ---------- comprar / alquilar ---------- */
ops['pet.buy']=(u,m)=>{const k=String(m.k||''),c=catOf(k);if(!c)return err(nosale());const a=E.acct(u),ex=rentalOf(u,k);
 if(!ex&&E.petCount(u)>=MAXPETS)return err('Tu establo está lleno ('+MAXPETS+' mascotas): vende o libera una primero');
 if(E.gTot(a)<c.buy)return err('Te faltan '+(c.buy-E.gTot(a))+' 💎');
 if(!E.spendGems(a,c.buy,false,'Mascota '+c.n+' (compra)'))return err('Saldo insuficiente');
 if(ex){const r=REG()[ex];delete r.rent;S.dirty();E.pushEnt(u);log('[mascotas] '+nmOf(u)+' compró (convirtió su alquiler) '+k);return{ok:1,conv:1,id:ex,ent:E.ent(u)}}
 const p=newPet(c);REG()[p.id]={o:u,k:'p',t:now(),ty:c.k};S.dirty();
 E.deliver(u,{pet:p,note:c.ic+' ¡'+c.n+' es tuyo para siempre! Ya está en tu establo (🐾 Mascotas)'});E.pushEnt(u);log('[mascotas] '+nmOf(u)+' compró '+k+' por '+c.buy+' 💎');return{ok:1,id:p.id,ent:E.ent(u)}};
ops['pet.rent']=(u,m)=>{const k=String(m.k||''),c=catOf(k);if(!c)return err(nosale());const a=E.acct(u),ex=rentalOf(u,k),R=REG();
 if(ex&&!(R[ex].rent>now()))return err('Ese alquiler ya terminó: sincroniza y vuelve a intentarlo');
 if(!ex&&R&&E.petCount(u)>=MAXPETS)return err('Tu establo está lleno ('+MAXPETS+' mascotas): vende o libera una primero');
 if(ex){const left=R[ex].rent-now();if(left+c.days*DAY>MAXR)return err('Ya tienes '+Math.ceil(left/DAY)+' días de alquiler: renueva cuando te queden '+Math.max(1,Math.floor((MAXR-c.days*DAY)/DAY))+' o menos')}
 if(E.gTot(a)<c.rent)return err('Te faltan '+(c.rent-E.gTot(a))+' 💎');
 if(!E.spendGems(a,c.rent,false,'Alquiler '+c.n))return err('Saldo insuficiente');
 if(ex){R[ex].rent+=c.days*DAY;S.dirty();E.pushEnt(u);log('[mascotas] '+nmOf(u)+' renovó '+k);return{ok:1,renew:1,id:ex,rt:R[ex].rent,ent:E.ent(u)}}
 const rt=now()+c.days*DAY,p=newPet(c,{rt});R[p.id]={o:u,k:'p',t:now(),ty:c.k,rent:rt};S.dirty();
 E.deliver(u,{pet:p,note:c.ic+' Alquilaste a '+c.n+' por '+c.days+' días (🐾 Mascotas). Al terminar se va solo; las alquiladas no se venden'});E.pushEnt(u);log('[mascotas] '+nmOf(u)+' alquiló '+k+' '+c.days+' d por '+c.rent+' 💎');return{ok:1,id:p.id,rt,ent:E.ent(u)}};
/* ---------- Templo de habilidades ---------- */
ops['pet.skill']=(u,m)=>{const i=sint(m.i,0,3,-1),r=myPet(u,m.id),a=E.acct(u);if(i<0)return err('Habilidad no válida');
 if(!r)return err('Esa mascota no es tuya (o aún no está sincronizada: espera unos segundos)');
 if(r.rent>now())return err('🔒 Las mascotas alquiladas no aprenden habilidades: cómprala para entrenarla');
 const sk=Array.isArray(r.psk)?r.psk.slice(0,4):[];while(sk.length<4)sk.push(0);const L=sk[i]|0;if(L>=5)return err('Esa habilidad ya está al máximo (Nv 5)');
 const lv=(r.lv|0)||1,need=UNL[i]+4*L;if(lv<need)return err('Para este nivel tu mascota necesita nivel '+need+' (tiene '+lv+')');
 const cg=skCost(i,L,r.ty);if(E.avail(a,'gold')<cg)return err('Oro insuficiente: te faltan '+(cg-E.avail(a,'gold'))+' 🪙 (precio + 3% de impuesto)');
 E.deliver(u,{gold:-cg,note:'🛕 Templo de las Bestias: habilidad subida a Nv '+(L+1)+' (−'+cg+' 🪙)'});sk[i]=L+1;r.psk=sk;S.dirty();return{ok:1,sk,paid:cg}};
/* ---------- Herrero: fabricar / poner / quitar equipo de mascota ---------- */
ops['pet.forge']=(u,m)=>{const pg=sint(m.pg,1,4,0),pt=sint(m.pt,1,5,0);if(!pg||!pt)return err('Receta no válida');const a=E.acct(u),c=pgCost(pg,pt);
 if(E.avail(a,'gold')<c.gt)return err('Oro insuficiente: te faltan '+(c.gt-E.avail(a,'gold'))+' 🪙 (precio + 3% de impuesto)');
 const lack=[];for(const k in c.m)if(!(E.avail(a,'prov',k)>=c.m[k]))lack.push(c.m[k]+' '+(MATN[k]||k));if(lack.length)return err('Te faltan materiales: '+lack.join(', '));
 const it=E.cleanPG({pg,pgt:pt,id:'pg'+E.rid(8)});if(!it)return err('Receta no válida');
 E.deliver(u,{gold:-c.gt,note:'⚒️ El Herrero cobra '+c.gt+' 🪙 (con 3% de impuesto)'});for(const k in c.m)E.deliver(u,{prov:{pk:k,q:-c.m[k]}});
 REG()[it.id]={o:u,k:'i',t:now()};S.dirty();E.deliver(u,{item:it,note:'⚒️ ¡El Herrero forjó '+it.n+'! Está en tu mochila (ponla desde 🛕 Templo)'});log('[mascotas] '+nmOf(u)+' forjó '+it.n);return{ok:1,it}};
ops['pet.eq']=(u,m)=>{const r=myPet(u,m.id),c=E.cleanItem(m.item);if(!r)return err('Esa mascota no es tuya (o aún no está sincronizada)');
 if(r.rent>now())return err('🔒 Las mascotas alquiladas no usan equipo: cómprala primero');
 if(!c||!c.pg||!c.id)return err('Esa pieza no es equipo de mascota');const R=REG(),ir=R[c.id];
 if(!ir||ir.o!==u||ir.k!=='i')return err('Esa pieza no es tuya (o aún no está sincronizada)');if(ir.nt)return err('🔒 Esa pieza es intransferible');
 const lv=(r.lv|0)||1;if(lv<PGLV[c.pgt])return err('Esta pieza pide una mascota de nivel '+PGLV[c.pgt]+' (la tuya tiene '+lv+')');
 const gr=Array.isArray(r.gr)?r.gr.slice(0,4):[];while(gr.length<4)gr.push(null);const old=gr[c.pg-1];
 if(old&&old.id){R[old.id]={o:u,k:'i',t:now()};E.deliver(u,{item:old,note:'🔧 Tu '+old.n+' vuelve a la mochila'})}
 R[c.id]={o:'E:'+String(m.id),k:'i',t:now()};gr[c.pg-1]=c;r.gr=gr;S.dirty();return{ok:1,gr}};
ops['pet.un']=(u,m)=>{const r=myPet(u,m.id),pg=sint(m.pg,1,4,0);if(!r||!pg)return err('Esa mascota no es tuya (o aún no está sincronizada)');
 const gr=Array.isArray(r.gr)?r.gr.slice(0,4):[];while(gr.length<4)gr.push(null);const x=gr[pg-1];if(!x||!x.id)return err('Esa casilla está vacía');
 REG()[x.id]={o:u,k:'i',t:now()};E.deliver(u,{item:x,note:'🔧 Quitaste '+x.n+': vuelve a tu mochila'});gr[pg-1]=null;r.gr=gr;S.dirty();return{ok:1,gr}};
/* v438: DESTRUIR una mascota propia (botón 🗑️ del menú 🐾). Se borra para siempre del registro y NO se recupera.
   Solo mascotas TUYAS (no las publicadas en el mercado/subasta/trato: esas tienen otro dueño mientras tanto) y no las alquiladas (se devuelven solas).
   El equipo de mascota que lleve puesto vuelve a tu mochila: no se pierde. */
ops['pet.destroy']=(u,m)=>{const id=String(m.id||''),r=myPet(u,id);
 if(!r)return err('Esa mascota no es tuya (o está publicada, en un trato, o aún no está sincronizada: espera unos segundos)');
 if(r.rent>now())return err('🔒 Las mascotas alquiladas se devuelven solas al terminar el alquiler: no se pueden destruir');
 const R=REG(),gr=Array.isArray(r.gr)?r.gr.slice(0,4):[];let back=0;
 for(const x of gr)if(x&&x.id){R[x.id]={o:u,k:'i',t:now()};E.deliver(u,{item:x,note:'🔧 Tu '+x.n+' vuelve a la mochila'});back++}
 const ty=r.ty||'',lv=(r.lv|0)||1;delete R[id];S.dirty();log('[mascotas] '+nmOf(u)+' destruyó una mascota ('+ty+' Nv '+lv+')');
 return{ok:1,id,back}};
/* ---------- Mercado de mascotas en 💎 ---------- */
const PM=()=>(DB.pm=DB.pm||{}),PMEXP=8*DAY,PMMAX=12,pmFee=p=>Math.max(1,Math.ceil(p*.03));
function pmBack(o,why){holdReg(o.pet.id,o.u,0,'p');E.deliver(o.u,{pet:o.pet,note:'↩️ '+why+': tu mascota vuelve al establo'})}
function pmSweep(){try{const t=now(),M=PM();let n=0;for(const id of Object.keys(M)){const o=M[id];if(o.exp<=t){delete M[id];pmBack(o,'Tu anuncio venció (8 días)');n++}}if(n){S.dirty();log('[mercado-mascotas] vencieron '+n+' anuncios')}}catch(e){log('pm sweep: '+e.message)}}
const pmTimer=setInterval(pmSweep,36e5);if(pmTimer.unref)pmTimer.unref();
const pmView=(o,u)=>({id:o.id,s:o.nm,p:o.p,ts:o.ts,exp:o.exp,pet:o.pet,mine:o.u===u||E.prim(o.u)===E.prim(u)?1:0});
ops['pm.list']=(u)=>{pmSweep();return{ok:1,l:Object.values(PM()).sort((a,b)=>b.ts-a.ts).slice(0,100).map(o=>pmView(o,u)),fee:3,exp:PMEXP/DAY}};
ops['pm.sell']=(u,m)=>{pmSweep();const a=E.acct(u),pt=E.cleanPetS(m.pet),p=sint(m.p,1,1e6,0);if(!pt||!pt.id||!p)return err('Datos inválidos: pon un precio en 💎 (1 a 1.000.000)');
 const r=REG()[pt.id];if(!r||r.k!=='p'||r.o!==u)return err('Esa mascota no es tuya (o aún no está sincronizada)');const lk=E.petLock(pt.id);if(lk)return err(lk);
 if(Object.values(PM()).filter(o=>E.prim(o.u)===E.prim(u)).length>=PMMAX)return err('Máximo '+PMMAX+' anuncios activos');
 const fee=pmFee(p);if(E.gTot(a)<fee)return err('Necesitas '+fee+' 💎 para la comisión de publicar (3%, no se devuelve)');
 if(!E.spendGems(a,fee,false,'Comisión del Mercado de mascotas'))return err('Saldo insuficiente');
 const id='pm'+E.rid(7);holdReg(pt.id,'P:'+id,1,'p');PM()[id]={id,u,nm:a.nm||'Jugador',p,ts:now(),exp:now()+PMEXP,pet:pt};S.dirty();E.pushEnt(u);log('[mercado-mascotas] '+nmOf(u)+' publica '+(pt.nm||pt.t)+' por '+p+' 💎');return{ok:1,id,ent:E.ent(u)}};
ops['pm.cancel']=(u,m)=>{const id=String(m.id||''),o=PM()[id];if(!o||E.prim(o.u)!==E.prim(u))return err('No es tu anuncio');delete PM()[id];pmBack(o,'Anuncio retirado');S.dirty();return{ok:1,ent:E.ent(u)}};
ops['pm.buy']=(u,m)=>{pmSweep();const id=String(m.id||''),o=PM()[id];if(!o)return err('El anuncio ya no existe');if(E.prim(o.u)===E.prim(u))return err('Es tu propio anuncio');
 const b=E.acct(u),fee=pmFee(o.p),cost=o.p+fee;if(E.petCount(u)>=MAXPETS)return err('Tu establo está lleno ('+MAXPETS+' mascotas)');
 if(E.gTot(b)<cost)return err('Te faltan '+(cost-E.gTot(b))+' 💎 ('+o.p+' + 3% de comisión)');
 if(!E.spendGems(b,cost,false,'Compra en el Mercado de mascotas'))return err('Saldo insuficiente');
 delete PM()[id];holdReg(o.pet.id,u,0,'p');E.deliver(u,{pet:o.pet,note:'🐾 Compraste a '+(o.pet.nm||'una mascota')+' por '+o.p+' 💎 (+'+fee+' de comisión)'});
 const so=E.acct(o.u);so.gem.own+=o.p;E.glAdd(so,o.p,'Mercado de mascotas: venta');S.dirty();E.pushEnt(o.u);E.deliver(o.u,{note:'💰 Vendiste a '+(o.pet.nm||'tu mascota')+' a '+(b.nm||'un jugador')+': +'+o.p+' 💎'});E.pushEnt(u);
 log('[mercado-mascotas] '+nmOf(u)+' compró '+(o.pet.nm||o.pet.t)+' a '+nmOf(o.u)+' por '+o.p+' 💎');return{ok:1,paid:cost,ent:E.ent(u)}};
return{ops,cat,pgCost,skCost,CAT0}};
