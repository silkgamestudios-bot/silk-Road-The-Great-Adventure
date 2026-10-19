/* Mercado autoritativo: ofertas, subastas y tiendas de Mercaderes. Todo trato es INSTANTÁNEO y atómico en el servidor:
   el servidor comprueba oro/mercancía/objeto, mueve la propiedad y entrega a cada parte (idempotente). El cliente no decide nada. */
module.exports=function(S,E){
const {DB}=S;const RM=E.RM;
const PVL=['carne','cocida','pasto','hierba','pocion','lazo','pie','cob','hie','pla','aur','mit','rub','esm','zaf','dia','ec_hl','ec_nv','ec_lu','ec_am','ec_nz'];
const int=(v,a,b,d)=>{v=Math.floor(+v);return Number.isFinite(v)?Math.min(b,Math.max(a,v)):d};
const iv=it=>Math.round(720*RM[it.r]*(1+it.t*.6)*(it.dv?.05:1));
const tax=(p)=>({pay:Math.round(p*1.03),get:Math.round(p*.97)});
const col=c=>(DB[c]=DB[c]||{});
const setDoc=(c,id,d)=>{const o=col(c)[id]||null;col(c)[id]=d;S.dirty();S.bc(c,id,o,d)};
const delDoc=(c,id)=>{const o=col(c)[id]||null;if(o){delete col(c)[id];S.dirty();S.bc(c,id,o,null)}};
const now=()=>Date.now();
const oid=()=>'o'+E.rid(6);
const aucMin=o=>o.bid>0?Math.max(o.p|0,Math.ceil(o.bid*1.05)):(o.p|0);
function provRes(pk){if(pk==='pocion')return['pot',null];if(pk.startsWith('ec_'))return['ec',pk.slice(3)];return['prov',pk]}
const provDl=(pk,q)=>{const [k,s]=provRes(pk);return k==='pot'?{pot:q}:k==='ec'?{ec:{k:s,q}}:{prov:{pk:s,q}}};
const provAv=(a,pk)=>{const [k,s]=provRes(pk);return E.avail(a,k,s)};
const isMerc=a=>a.cls===0&&a.lic>now();
function claimItem(u,raw,newOwner){const a=E.acct(u),it=E.cleanItem(raw);if(!it||!it.id)return{e:'Objeto no válido'};const r=S.ECO.reg[it.id];
 if(!r||r.o!==u)return{e:'Ese objeto no es tuyo (o no está sincronizado todavía: espera unos segundos)'};return{it}}
function holdReg(id,o,esc,k){S.ECO.reg[id]={o,k:k||'i',t:now(),esc:esc?1:0};S.dirty()}
/* ---------- OFERTAS ---------- */
const ops={};
ops['offer.new']=(u,m)=>{const a=E.acct(u),p=int(m.p,1,1e12,0);if(!p)return{e:'Precio inválido'};
 if(Object.values(col('offers')).filter(o=>o.u===u).length>=20)return{e:'Máximo 20 ofertas activas'};
 const id=oid(),base={u,nm:a.nm||'Jugador',p,ts:now()};
 if(m.kind==='it'){const c=claimItem(u,m.item);if(c.e)return c;holdReg(c.it.id,'M:'+id,1);setDoc('offers',id,Object.assign(base,{it:c.it}));return{ok:1,id}}
 if(m.kind==='pet'){const pt=E.cleanPetS(m.pet);if(!pt||!pt.id)return{e:'Mascota no válida'};const r=S.ECO.reg[pt.id];if(!r||r.o!==u)return{e:'Esa mascota no es tuya'};holdReg(pt.id,'M:'+id,1,'p');setDoc('offers',id,Object.assign(base,{pet:pt}));return{ok:1,id}}
 if(m.kind==='ec'){const k=String(m.ec||''),q=int(m.q,1,1e6,0);if(!E.EVK.includes(k)||!q)return{e:'Monedas inválidas'};if(E.avail(a,'ec',k)<q)return{e:'No tienes tantas monedas (sincroniza e inténtalo de nuevo)'};
  E.deliver(u,{ec:{k,q:-q},note:'🪙 Monedas puestas en oferta'});setDoc('offers',id,Object.assign(base,{ec:k,q}));return{ok:1,id}}
 return{e:'Tipo de oferta no válido'}};
ops['offer.cancel']=(u,m)=>{const id=String(m.id||''),o=col('offers')[id];if(!o||o.u!==u)return{e:'No es tu oferta'};if(o.auc&&o.bid>0)return{e:'Tiene pujas: espera al cierre'};
 giveBack(o);delDoc('offers',id);return{ok:1}};
function giveBack(o){if(o.it){holdReg(o.it.id,o.u,0);E.deliver(o.u,{item:o.it,note:'↩️ Oferta retirada'})}
 else if(o.pet){holdReg(o.pet.id,o.u,0,'p');E.deliver(o.u,{pet:o.pet,note:'↩️ Mascota devuelta'})}
 else if(o.ec)E.deliver(o.u,{ec:{k:o.ec,q:o.q|0},note:'↩️ Monedas devueltas'})}
ops['offer.buy']=(u,m)=>{const id=String(m.id||''),o=col('offers')[id];if(!o||o.auc)return{e:'La oferta ya no existe'};if(o.u===u)return{e:'Es tu propia oferta'};
 const b=E.acct(u),t=tax(o.p);if(E.avail(b,'gold')<t.pay)return{e:'Oro insuficiente: te faltan '+(t.pay-E.avail(b,'gold'))};
 delDoc('offers',id);
 const bd={gold:-t.pay,note:'🛒 Compraste'};if(o.it){bd.item=o.it;bd.note+=' '+o.it.n;holdReg(o.it.id,u,0)}else if(o.pet){bd.pet=o.pet;bd.note+=' una mascota';holdReg(o.pet.id,u,0,'p')}else if(o.ec){bd.ec={k:o.ec,q:o.q|0};bd.note+=' '+o.q+' monedas'}
 E.deliver(u,bd);E.deliver(o.u,{gold:t.get,note:'💰 Vendiste a '+(b.nm||'un jugador')+' (+'+t.get+' 🪙)',tr:1});return{ok:1}};
/* ---------- SUBASTAS (mascotas) ---------- */
ops['auc.new']=(u,m)=>{const a=E.acct(u),pt=E.cleanPetS(m.pet),p=int(m.p,1,1e12,0),h=int(m.h,1,48,6);if(!pt||!pt.id||!p)return{e:'Datos inválidos'};const r=S.ECO.reg[pt.id];if(!r||r.o!==u)return{e:'Esa mascota no es tuya'};
 if(Object.values(col('offers')).filter(o=>o.u===u).length>=20)return{e:'Máximo 20 ofertas activas'};
 const id=oid();holdReg(pt.id,'M:'+id,1,'p');setDoc('offers',id,{u,nm:a.nm||'Jugador',pet:pt,p,auc:1,end:now()+h*36e5,bid:0,bu:'',bn:'',bt:0,ts:now()});return{ok:1,id}};
ops['auc.bid']=(u,m)=>{const id=String(m.id||''),o=col('offers')[id];if(!o||!o.auc||o.end<=now())return{e:'La subasta ya cerró'};if(o.u===u)return{e:'Es tu subasta'};if(o.bu===u)return{e:'Ya vas ganando'};
 const b=E.acct(u),amt=aucMin(o),t=tax(amt);if(E.avail(b,'gold')<t.pay)return{e:'Oro insuficiente: te faltan '+(t.pay-E.avail(b,'gold'))};
 E.deliver(u,{gold:-t.pay,note:'🔨 Puja de '+amt+' (depósito '+t.pay+')'});
 if(o.bu&&o.bt)E.deliver(o.bu,{gold:o.bt,note:'↩️ Superaron tu puja: oro reintegrado'});
 const n=Object.assign({},o,{bid:amt,bu:u,bn:(b.nm||'').slice(0,24),bt:t.pay});setDoc('offers',id,n);return{ok:1,bid:amt}};
function aucClose(id,o){delDoc('offers',id);
 if(o.bid>0&&o.bu){const t=tax(o.bid);holdReg(o.pet.id,o.bu,0,'p');E.deliver(o.bu,{pet:o.pet,note:'🔨 ¡Ganaste la subasta!'});E.deliver(o.u,{gold:t.get,note:'🔨 Subasta cerrada: vendiste por '+o.bid+' (+'+t.get+' 🪙)',tr:1})}
 else giveBack(o)}
setInterval(()=>{try{const t=now();for(const id in col('offers')){const o=col('offers')[id];if(o.auc&&o.end<=t)aucClose(id,o)}}catch(e){S.log('auc error '+e.message)}},15000);
/* ---------- TIENDAS DE MERCADERES ---------- */
function shopView(u){const a=E.acct(u),s=col('shops')[u];if(!s)return;const R=a.res;
 const n=Object.assign({},s,{nm:a.nm||s.nm,st:R.g.map((_,i)=>E.avail(a,'g',i)),bud:Math.floor(E.avail(a,'gold')),
  pst:(()=>{const o={};for(const k of PVL){const [t,s]=provRes(k);o[k]=t==='pot'?E.avail(a,'pot'):t==='ec'?E.avail(a,'ec',s):E.avail(a,'prov',s)}return o})(),ts:now()});
 col('shops')[u]=n;S.dirty();S.bc('shops',u,s,n)}
ops['shop.set']=(u,m)=>{const a=E.acct(u);if(!isMerc(a))return{e:'Necesitas ser Mercader con la Licencia activa'};
 const ar=(x)=>Array.isArray(x)?[0,1,2,3,4].map(i=>int(x[i],0,1e12,0)):[0,0,0,0,0],mp=(x)=>{const o={};if(x&&typeof x==='object')for(const k of PVL){const v=int(x[k],0,1e12,0);if(v)o[k]=v}return o};
 const old=col('shops')[u]||{};const s={u,nm:a.nm||'Jugador',sh:String(m.sh||'').replace(/[^\p{L}\p{N} '._-]/gu,'').slice(0,24)||(a.nm+' Shop'),buy:ar(m.buy),sell:ar(m.sell),pb:mp(m.pb),ps:mp(m.ps),ib:int(m.ib,0,1000,0),tr:old.tr|0,st:[0,0,0,0,0],pst:{},bud:0,ts:now()};
 col('shops')[u]=s;shopView(u);return{ok:1}};
ops['item.up']=(u,m)=>{const id=String(m.id||''),r=E.reg()[id],a=E.acct(u);if(!r||r.o!==u)return{e:'Sincroniza primero (el objeto aún no está registrado). Inténtalo de nuevo en unos segundos.'};const L=(r.up|0)+1;if(L>10)return{e:'Ya está al máximo (+10)'};const c=E.UPC[L];
 if(E.avail(a,'gold')<c.g)return{e:'Oro insuficiente'};for(const k in c.m)if(E.avail(a,'prov',k)<c.m[k])return{e:'Faltan minerales'};
 E.deliver(u,{gold:-c.g,note:'⚒️ Potenciación a +'+L+': −'+c.g+' 🪙'});for(const k in c.m)E.deliver(u,{prov:{pk:k,q:-c.m[k]}});
 const win=Math.random()<c.p;if(win){r.up=L;S.dirty()}return{ok:1,up:r.up|0,won:win?1:0}};
ops['shop.close']=(u)=>{delDoc('shops',u);return{ok:1}};
function shopOf(m,u){const sid=String(m.s||''),s=col('shops')[sid];if(!s)return{e:'La tienda ya no existe'};if(sid===u)return{e:'Es tu tienda'};const sa=E.acct(sid);if(!isMerc(sa))return{e:'Esa tienda está inactiva'};return{s,sid,sa}}
ops['shop.buy']=(u,m)=>{const r=shopOf(m,u);if(r.e)return r;const {s,sid,sa}=r,b=E.acct(u),q=int(m.q,1,1000,0);if(!q)return{e:'Cantidad inválida'};
 if(m.k==='g'){const i=int(m.i,0,4,-1);if(i<0)return{e:'Mercancía inválida'};const unit=s.sell[i]|0;if(!unit)return{e:'Ya no vende eso'};if(E.avail(sa,'g',i)<q)return{e:'Sin stock'};
  const t=tax(unit*q);if(E.avail(b,'gold')<t.pay)return{e:'Oro insuficiente'};
  E.deliver(u,{gold:-t.pay,goods:{g:i,q,cost:t.pay},note:'📦 Compraste '+q+' de mercancía'});E.deliver(sid,{gold:t.get,goods:{g:i,q:-q},note:'💰 Vendiste '+q+' a '+(b.nm||'un jugador')+' (+'+t.get+' 🪙)',tr:1});shopTr(sid);return{ok:1}}
 if(m.k==='p'){const pk=String(m.pk||'');if(!PVL.includes(pk))return{e:'Producto inválido'};const unit=(s.ps&&s.ps[pk])|0;if(!unit)return{e:'Ya no vende eso'};if(provAv(sa,pk)<q)return{e:'Sin stock'};
  const t=tax(unit*q);if(E.avail(b,'gold')<t.pay)return{e:'Oro insuficiente'};
  E.deliver(u,Object.assign({gold:-t.pay,note:'📦 Compraste '+q+' de '+pk},provDl(pk,q)));E.deliver(sid,Object.assign({gold:t.get,note:'💰 Vendiste '+q+' de '+pk+' (+'+t.get+' 🪙)',tr:1},provDl(pk,-q)));shopTr(sid);return{ok:1}}
 return{e:'Operación inválida'}};
ops['shop.sell']=(u,m)=>{const r=shopOf(m,u);if(r.e)return r;const {s,sid,sa}=r,a=E.acct(u),q=int(m.q,1,1000,0);if(!q)return{e:'Cantidad inválida'};
 if(m.k==='g'){const i=int(m.i,0,4,-1);if(i<0)return{e:'Mercancía inválida'};const unit=s.buy[i]|0;if(!unit)return{e:'Ya no compra eso'};if(E.avail(a,'g',i)<q)return{e:'No tienes tanta (sincroniza e inténtalo)'};
  const t=tax(unit*q);if(E.avail(sa,'gold')<t.pay)return{e:'El comprador no tiene oro suficiente'};
  E.deliver(u,{gold:t.get,goods:{g:i,q:-q},note:'💰 Vendiste '+q+' (+'+t.get+' 🪙)'});E.deliver(sid,{gold:-t.pay,goods:{g:i,q,cost:t.pay},note:'📦 Compraste '+q+' a '+(a.nm||'un jugador'),tr:1});shopTr(sid);return{ok:1}}
 if(m.k==='p'){const pk=String(m.pk||'');if(!PVL.includes(pk))return{e:'Producto inválido'};const unit=(s.pb&&s.pb[pk])|0;if(!unit)return{e:'Ya no compra eso'};if(provAv(a,pk)<q)return{e:'No tienes tanto'};
  const t=tax(unit*q);if(E.avail(sa,'gold')<t.pay)return{e:'El comprador no tiene oro suficiente'};
  E.deliver(u,Object.assign({gold:t.get,note:'💰 Vendiste '+q+' de '+pk+' (+'+t.get+' 🪙)'},provDl(pk,-q)));E.deliver(sid,Object.assign({gold:-t.pay,note:'📦 Compraste '+q+' de '+pk,tr:1},provDl(pk,q)));shopTr(sid);return{ok:1}}
 return{e:'Operación inválida'}};
ops['shop.item']=(u,m)=>{const r=shopOf(m,u);if(r.e)return r;const {s,sid,sa}=r,a=E.acct(u);if(!(s.ib>0))return{e:'Esta tienda no compra objetos'};
 const c=claimItem(u,m.item);if(c.e)return c;const want=Math.round(iv(c.it)*s.ib/100),t=tax(want);if(!want)return{e:'Sin valor'};if(E.avail(sa,'gold')<t.pay)return{e:'El comprador no tiene oro suficiente'};
 holdReg(c.it.id,sid,0);E.deliver(u,{gold:t.get,note:'💰 Vendiste '+c.it.n+' (+'+t.get+' 🪙)'});E.deliver(sid,{gold:-t.pay,item:c.it,note:'🎁 Compraste '+c.it.n,tr:1});shopTr(sid);return{ok:1}};
function shopTr(sid){const s=col('shops')[sid];if(s){s.tr=(s.tr|0)+1;S.dirty()}}
return{ops,shopView,iv,PVL}};
