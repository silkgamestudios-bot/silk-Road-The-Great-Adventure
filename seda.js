/* 🏛️ MERCADO DE LA SEDA y MERCADO DE GEMAS (v161) — libro de ofertas autoritativo en el servidor.
   Tres mercados con las mismas reglas:  i = objetos · g = gemas · t = boletos de servicio.
   · Publicar (vender o poner una orden de compra) exige tener activo el 🎯 Combo Cazador (o VIP, que ya lo incluye). Comprar lo ya publicado: libre.
   · Comisión 3% al que publica (maker: se cobra al publicar y NO se devuelve) y 3% al que acepta la oferta (taker).
   · Las ofertas duran 8 días; al vencer o al retirarlas, lo publicado vuelve a su dueño (la comisión de publicar no).
   · v380: las gemas que se compran aquí son gemas normales: valen para TODO (apariencias, VIP, boletos, Bonus, gremios…). */
module.exports=function(S,E){
const DB=S.DB,ops={},err=e=>({e}),now=()=>Date.now(),DAY=864e5,EXP_MS=+process.env.SEDA_EXP_MS||8*DAY,MAXO=20;
const int=(v,a,b,d)=>{v=Math.floor(+v);return Number.isFinite(v)?Math.min(b,Math.max(a,v)):d};
const SM=()=>(DB.sm=DB.sm||{}),SH=()=>{const e=S.ECO;e.smh=e.smh||[];return e.smh};
const TKN={cmb:'🎯 Combo Cazador',es:'🐗 Escolta de caravana',lic:'📜 Licencia de Mercader',vipm:'👑 VIP Mercader',vipj:'👑 VIP Jugador',pv:'⚔️ Cazador PvP',bh:'🎯 Licencia de Cazador'};
const tkOf=a=>(a.tk&&typeof a.tk==='object')?a.tk:(a.tk={});
const mkF=c=>Math.max(1,Math.ceil(c*.03)),tkF=c=>Math.max(1,Math.round(c*.03));
const canPub=u=>{if(S.isMaster(u))return true;const a=E.acct(u),t=now();return (+a.px.lt||0)>t&&(+a.px.ap||0)>t};
const nmOf=u=>(E.acct(u)||{}).nm||'Jugador';
const ck=it=>it.sl+'|'+it.n;
function holdReg(id,o,esc){S.ECO.reg[id]={o,k:'i',t:now(),esc:esc?1:0};S.dirty()}
function claimItem(u,raw){const it=E.cleanItem(raw);if(!it||!it.id)return{e:'Objeto no válido'};const r=S.ECO.reg[it.id];if(!r||r.o!==u)return{e:'Ese objeto no es tuyo (o aún no está sincronizado: espera unos segundos)'};return{it}}
const sl=(ms)=>ms?Math.max(0,Math.ceil((ms-now())/36e5)):0;
function hist(o){const h=SH();h.push(o);while(h.length>300)h.shift()}
const note=(u,m)=>{E.deliver(u,{note:m})};
/* ---------- devolver lo publicado (retirar o vencer) ---------- */
function giveBack(o,why){const a=E.acct(o.u);
 if(o.mk==='i'&&o.sd==='s'){holdReg(o.it.id,o.u,0);E.deliver(o.u,{item:o.it,note:'↩️ '+why+': te devolvemos '+o.it.n})}
 else if(o.mk==='i'||o.mk==='g'&&o.sd==='b'){const g=(o.q|0)*(o.p|0);if(g>0)E.deliver(o.u,{gold:g,note:'↩️ '+why+': te devolvemos '+g+' 🪙 de tu orden de compra'})}
 else if(o.mk==='g'){a.gem.own+=(o.ow|0)+(o.tr|0);E.glAdd(a,o.q|0,'Mercado de Gemas: '+why);S.dirty();E.pushEnt(o.u);note(o.u,'↩️ '+why+': te devolvemos '+o.q+' 💎')}
 else if(o.mk==='t'){const t=tkOf(a);t[o.tk]=(t[o.tk]|0)+(o.q|0);S.dirty();E.pushEnt(o.u);note(o.u,'↩️ '+why+': te devolvemos '+o.q+' × '+(TKN[o.tk]||o.tk))}}
function sweep(){try{const t=now(),M=SM();let n=0;for(const id of Object.keys(M)){const o=M[id];if(o.exp<=t){delete M[id];giveBack(o,'Tu oferta venció (8 días)');n++}}if(n){S.dirty();S.log('[mercado] vencieron '+n+' ofertas')}}catch(e){S.log('mercado sweep: '+e.message)}}
/* ---------- migración del mercado de gemas anterior (gmk) ---------- */
function migrate(){const G=DB.gmk;if(!G)return;let n=0;for(const id of Object.keys(G)){const o=G[id];if(!o||!(o.q>0))continue;SM()['g'+E.rid(6)]={mk:'g',sd:'s',u:o.u,nm:o.nm||nmOf(o.u),q:o.q|0,ow:o.ow|0,tr:o.tr|0,p:o.p|0,ts:o.ts||now(),exp:now()+EXP_MS};n++}DB.gmk={};if(n){S.dirty();S.log('[mercado] migradas '+n+' ofertas de gemas al libro nuevo')}}
/* ---------- publicar ---------- */
ops['sm.new']=(u,m)=>{const a=E.acct(u),mk=String(m.mk||''),sd=String(m.sd||'');if(!['i','g','t'].includes(mk)||!['s','b'].includes(sd))return err('Oferta no válida');
 if(!canPub(u))return err('Para publicar en los mercados necesitas el servicio 🎯 Combo Cazador (o VIP). Comprar sí es libre.');
 if(Object.values(SM()).filter(o=>o.u===u).length>=MAXO)return err('Máximo '+MAXO+' ofertas activas');
 const p=int(m.p,1,mk==='g'?1e9:1e12,0);if(!p)return err('Precio inválido');
 const id=(mk==='i'?'i':mk==='g'?'g':'t')+E.rid(6),base={mk,sd,u,nm:a.nm||'Jugador',p,ts:now(),exp:now()+EXP_MS},gold=()=>E.avail(a,'gold');
 if(mk==='i'&&sd==='s'){const c=claimItem(u,m.item);if(c.e)return c;const fee=mkF(p);if(gold()<fee)return err('Necesitas '+fee+' 🪙 para la comisión de publicar (3%)');
  holdReg(c.it.id,'M:'+id,1);E.deliver(u,{gold:-fee,note:'🧾 Comisión de publicar: −'+fee+' 🪙 (no se devuelve)'});SM()[id]=Object.assign(base,{it:c.it,ck:ck(c.it),q:1});S.dirty();return{ok:1,id,ent:E.ent(u)}}
 if(mk==='i'&&sd==='b'){const sp=String(m.ck||'').split('|'),s0=int(sp[0],0,6,-1),n=String(sp.slice(1).join('|')).replace(/[^\p{L}\p{N} '.-]/gu,'').slice(0,34);if(s0<0||!n)return err('Elige qué objeto quieres comprar');
  const q=int(m.q,1,10,1),rmin=int(m.rmin,0,3,0),cost=q*p,fee=mkF(cost);if(gold()<cost+fee)return err('Necesitas '+(cost+fee)+' 🪙 ('+cost+' en depósito + '+fee+' de comisión)');
  const best=Object.values(SM()).filter(o=>o.mk==='i'&&o.sd==='s'&&o.ck===s0+'|'+n&&o.it.r>=rmin).sort((x,y)=>x.p-y.p)[0];if(best&&best.p<=p)return err('Ya hay uno en venta a '+best.p+' 🪙: cómpralo directo');
  E.deliver(u,{gold:-(cost+fee),note:'🧾 Orden de compra: '+cost+' 🪙 en depósito + '+fee+' de comisión (no se devuelve)'});SM()[id]=Object.assign(base,{ck:s0+'|'+n,sl:s0,n,rmin,q});S.dirty();return{ok:1,id,ent:E.ent(u)}}
 if(mk==='g'&&sd==='s'){const q=int(m.q,1,1e6,0);if(!q)return err('Cantidad inválida');if(E.gTot(a)<q)return err('No tienes tantas gemas');const fee=mkF(q*p);if(gold()<fee)return err('Necesitas '+fee+' 🪙 para la comisión de publicar (3%)');
  const tr=0,ow=q;if(!E.spendGems(a,q,false,'Mercado de Gemas: puestas en venta'))return err('Saldo insuficiente');
  const best=Object.values(SM()).filter(o=>o.mk==='g'&&o.sd==='b').sort((x,y)=>y.p-x.p)[0];
  E.deliver(u,{gold:-fee,note:'🧾 Comisión de publicar: −'+fee+' 🪙 (no se devuelve)'});SM()[id]=Object.assign(base,{q,ow,tr});S.dirty();E.pushEnt(u);return{ok:1,id,ent:E.ent(u),cross:best&&best.p>=p?best.p:0}}
 if(mk==='g'&&sd==='b'){const q=int(m.q,1,1e6,0);if(!q)return err('Cantidad inválida');const cost=q*p,fee=mkF(cost);if(gold()<cost+fee)return err('Necesitas '+(cost+fee)+' 🪙 ('+cost+' en depósito + '+fee+' de comisión)');
  E.deliver(u,{gold:-(cost+fee),note:'🧾 Orden de compra de gemas: '+cost+' 🪙 en depósito + '+fee+' de comisión (no se devuelve)'});SM()[id]=Object.assign(base,{q});S.dirty();return{ok:1,id,ent:E.ent(u)}}
 if(mk==='t'&&sd==='s'){const k=String(m.tk||''),q=int(m.q,1,50,0),cur=m.cur==='m'?'m':'g';if(!TKN[k])return err('Boleto desconocido');if(!q)return err('Cantidad inválida');const t=tkOf(a);if((t[k]|0)<q)return err('No tienes tantos boletos');
  if(p>(cur==='m'?1e6:1e12))return err('Precio inválido');const fee=mkF(q*p);
  if(cur==='g'){if(gold()<fee)return err('Necesitas '+fee+' 🪙 para la comisión de publicar (3%)');E.deliver(u,{gold:-fee,note:'🧾 Comisión de publicar: −'+fee+' 🪙 (no se devuelve)'})}
  else if(!E.spendGems(a,fee,false,'Comisión de publicar boleto'))return err('Necesitas '+fee+' 💎 para la comisión de publicar (3%)');
  t[k]-=q;SM()[id]=Object.assign(base,{tk:k,q,cur});S.dirty();E.pushEnt(u);return{ok:1,id,ent:E.ent(u)}}
 return err('Esa combinación no existe (los boletos solo se venden)')};
ops['sm.cancel']=(u,m)=>{const id=String(m.id||''),o=SM()[id];if(!o||o.u!==u)return err('No es tu oferta');delete SM()[id];giveBack(o,'Oferta retirada');S.dirty();return{ok:1,ent:E.ent(u)}};
/* ---------- aceptar una oferta (taker) ---------- */
function buyFrom(u,id,n){const o=SM()[id];if(!o||o.sd!=='s')return err('La oferta ya no existe');if(o.u===u)return err('Es tu propia oferta');const b=E.acct(u);
 n=o.mk==='i'?1:int(n,1,o.q,0);if(!n)return err('Cantidad no disponible (quedan '+o.q+')');const cost=n*o.p,fee=tkF(cost);
 if(o.mk==='t'&&o.cur==='m'){if(E.gTot(b)<cost+fee)return err('Te faltan '+(cost+fee-E.gTot(b))+' 💎')}
 else if(E.avail(b,'gold')<cost+fee)return err('Oro insuficiente: te faltan '+(cost+fee-E.avail(b,'gold'))+' 🪙');
 const so=E.acct(o.u);let what='';
 if(o.mk==='i'){what=o.it.n;delete SM()[id];holdReg(o.it.id,u,0);E.deliver(u,{gold:-(cost+fee),item:o.it,note:'🛒 Compraste '+o.it.n+' (−'+(cost+fee)+' 🪙, incluye 3% de comisión)'});E.deliver(o.u,{gold:cost,note:'💰 Vendiste '+o.it.n+' a '+(b.nm||'un jugador')+': +'+cost+' 🪙'})}
 else if(o.mk==='g'){what=n+' gemas';const t=Math.min(o.tr|0,n);o.tr=(o.tr|0)-t;o.ow=(o.ow|0)-(n-t);o.q-=n;if(o.q<=0)delete SM()[id];
  E.deliver(u,{gold:-(cost+fee),note:'💎 Compraste '+n+' gemas (−'+(cost+fee)+' 🪙, incluye 3% de comisión) · valen para todo'});E.deliver(o.u,{gold:cost,note:'💰 Vendiste '+n+' gemas a '+(b.nm||'un jugador')+': +'+cost+' 🪙'});
  b.gem.own+=n;E.glAdd(b,n,'Mercado de Gemas a '+o.p+' 🪙');E.pushEnt(u)}
 else{what=n+' × '+(TKN[o.tk]||o.tk);o.q-=n;if(o.q<=0)delete SM()[id];
  if(o.cur==='m'){E.spendGems(b,cost+fee,false,'Compra de boleto '+o.tk);so.gem.own+=cost;E.glAdd(so,cost,'venta de boleto '+o.tk);E.deliver(o.u,{note:'💰 Vendiste '+what+' a '+(b.nm||'un jugador')+': +'+cost+' 💎'});E.pushEnt(o.u)}
  else{E.deliver(u,{gold:-(cost+fee),note:'🎟️ Compraste '+what+' (−'+(cost+fee)+' 🪙, incluye 3% de comisión)'});E.deliver(o.u,{gold:cost,note:'💰 Vendiste '+what+' a '+(b.nm||'un jugador')+': +'+cost+' 🪙'})}
  const t=tkOf(b);t[o.tk]=(t[o.tk]|0)+n;E.pushEnt(u);if(o.cur==='m')S.push&&0}
 hist({ts:now(),mk:o.mk,s:o.u,b:u,n,p:o.p,cur:o.cur||'g',w:what,sn:so.nm||'',bn:b.nm||''});S.dirty();S.log('[mercado] '+(b.nm||u)+' compró '+what+' a '+(so.nm||o.u)+' por '+cost);return{ok:1,paid:cost+fee,ent:E.ent(u)}}
ops['sm.buy']=(u,m)=>buyFrom(u,String(m.id||''),m.n);
function sellInto(u,id,n,raw){const o=SM()[id];if(!o||o.sd!=='b')return err('La orden ya no existe');if(o.u===u)return err('Es tu propia orden');const a=E.acct(u),bo=E.acct(o.u);
 if(o.mk==='i'){const c=claimItem(u,raw);if(c.e)return c;const it=c.it;if(it.sl!==o.sl||it.n!==o.n)return err('Ese no es el objeto que piden');if(it.r<o.rmin)return err('Piden rareza mínima '+o.rmin);
  const cost=o.p,fee=tkF(cost);o.q-=1;if(o.q<=0)delete SM()[id];holdReg(it.id,o.u,0);E.deliver(o.u,{item:it,note:'🛒 Se cumplió tu orden: recibiste '+it.n});E.deliver(u,{gold:cost-fee,note:'💰 Vendiste '+it.n+' a '+(bo.nm||'un jugador')+': +'+(cost-fee)+' 🪙 (−3% de comisión)'});
  hist({ts:now(),mk:'i',s:u,b:o.u,n:1,p:cost,cur:'g',w:it.n,sn:a.nm||'',bn:bo.nm||''});S.dirty();return{ok:1,got:cost-fee,ent:E.ent(u)}}
 if(o.mk==='g'){n=int(n,1,o.q,0);if(!n)return err('Cantidad no disponible (piden '+o.q+')');if(E.gTot(a)<n)return err('No tienes tantas gemas');const cost=n*o.p,fee=tkF(cost);
  if(!E.spendGems(a,n,false,'Vendidas en el Mercado de Gemas'))return err('Saldo insuficiente');o.q-=n;if(o.q<=0)delete SM()[id];
  bo.gem.own+=n;E.glAdd(bo,n,'Mercado de Gemas a '+o.p+' 🪙');E.pushEnt(o.u);E.deliver(o.u,{note:'💎 Se cumplió tu orden: recibiste '+n+' gemas'});E.deliver(u,{gold:cost-fee,note:'💰 Vendiste '+n+' gemas a '+(bo.nm||'un jugador')+': +'+(cost-fee)+' 🪙 (−3% de comisión)'});
  hist({ts:now(),mk:'g',s:u,b:o.u,n,p:o.p,cur:'g',w:n+' gemas',sn:a.nm||'',bn:bo.nm||''});S.dirty();E.pushEnt(u);return{ok:1,got:cost-fee,ent:E.ent(u)}}
 return err('Esa orden no se puede llenar')}
ops['sm.sell']=(u,m)=>sellInto(u,String(m.id||''),m.n,m.item);
/* llenar un nivel de precio de gemas (varias ofertas al mismo precio, la más antigua primero) */
ops['sm.take']=(u,m)=>{const take=m.take==='s'?'s':'b',p=int(m.p,1,1e9,0);let n=int(m.n,1,1e6,0);if(!p||!n)return err('Datos inválidos');
 const L=Object.entries(SM()).filter(([id,o])=>o.mk==='g'&&o.sd===take&&o.p===p&&o.u!==u).sort((x,y)=>x[1].ts-y[1].ts);const tot=L.reduce((s,[,o])=>s+o.q,0);if(!L.length)return err('Esa oferta ya no existe');if(n>tot)return err('Solo quedan '+tot+' a ese precio');
 let done=0,last=null;for(const [id,o] of L){if(n<=0)break;const k=Math.min(n,o.q),r=take==='s'?buyFrom(u,id,k):sellInto(u,id,k);if(r.e){if(!done)return r;break}n-=k;done+=k;last=r}
 return Object.assign({},last||{},{ok:1,n:done,ent:E.ent(u)})};
/* ---------- listados ---------- */
function brief(o,u){return{id:o.id,nm:o.nm,p:o.p,q:o.q|0,mine:o.u===u?1:0,exp:o.exp,ts:o.ts|0}}
ops['sm.list']=(u,m)=>{const mk=['i','g','t'].includes(m.mk)?m.mk:'i',M=Object.entries(SM()).map(([id,o])=>Object.assign({id},o)),out={ok:1,mk,pub:canPub(u)?1:0,mine:M.filter(o=>o.u===u).map(o=>Object.assign(brief(o,u),{mk:o.mk,sd:o.sd,cur:o.cur||'g',tk:o.tk||'',n:o.it?o.it.n:(o.n||''),it:o.it||undefined,rmin:o.rmin|0,left:sl(o.exp)})).sort((a,b)=>a.exp-b.exp)};
 const H=SH().filter(h=>h.s===u||h.b===u).slice(-40).reverse().map(h=>({ts:h.ts,mk:h.mk,w:h.w,n:h.n,p:h.p,cur:h.cur,dir:h.s===u?'v':'c',who:h.s===u?h.bn:h.sn}));out.hist=H;
 if(mk==='i'){const cat={};for(const o of M)if(o.mk==='i'){const c=cat[o.ck]=cat[o.ck]||[0,0,0];if(o.sd==='s'){c[0]++;c[2]=c[2]?Math.min(c[2],o.p):o.p}else c[1]++}out.cat=cat;
  const k=String(m.ck||'');if(k){out.sells=M.filter(o=>o.mk==='i'&&o.sd==='s'&&o.ck===k).sort((a,b)=>a.p-b.p||a.ts-b.ts).slice(0,60).map(o=>Object.assign(brief(o,u),{it:o.it}));
   out.buys=M.filter(o=>o.mk==='i'&&o.sd==='b'&&o.ck===k).sort((a,b)=>b.p-a.p||a.ts-b.ts).slice(0,60).map(o=>Object.assign(brief(o,u),{rmin:o.rmin|0}));
   const last=SH().filter(h=>h.mk==='i'&&h.w&&k.endsWith('|'+(h.w||''))).slice(-5);out.avg=last.length?Math.round(last.reduce((s,h)=>s+h.p,0)/last.length):0}}
 else if(mk==='g'){const lv=(sd)=>{const r={};for(const o of M)if(o.mk==='g'&&o.sd===sd)r[o.p]=(r[o.p]|0)+o.q;return Object.entries(r).map(([p,q])=>({p:+p,q}))};
  out.sells=lv('s').sort((a,b)=>a.p-b.p).slice(0,40);out.buys=lv('b').sort((a,b)=>b.p-a.p).slice(0,40);const gh=SH().filter(h=>h.mk==='g').slice(-8).reverse();out.last=gh.map(h=>[h.ts,h.p,h.n]);out.avg=gh.length?Math.round(gh.reduce((s,h)=>s+h.p,0)/gh.length):0;
  out.mineLv={s:M.filter(o=>o.mk==='g'&&o.sd==='s'&&o.u===u).reduce((s,o)=>s+o.q,0),b:M.filter(o=>o.mk==='g'&&o.sd==='b'&&o.u===u).reduce((s,o)=>s+o.q,0)}}
 else{out.tickets=M.filter(o=>o.mk==='t').sort((a,b)=>a.p-b.p||a.ts-b.ts).slice(0,80).map(o=>Object.assign(brief(o,u),{tk:o.tk,cur:o.cur}));out.have=Object.assign({},E.acct(u).tk||{})}
 out.own=E.acct(u).gem.own|0;out.tr=E.acct(u).gem.tr|0;return out};
migrate();sweep();setInterval(sweep,+process.env.SEDA_SWEEP_MS||60000);
return{ops,sweep,canPub}};
