/* Mercado autoritativo: ofertas, subastas y tiendas de Mercaderes. Todo trato es INSTANTÁNEO y atómico en el servidor:
   el servidor comprueba oro/mercancía/objeto, mueve la propiedad y entrega a cada parte (idempotente). El cliente no decide nada. */
module.exports=function(S,E){
const {DB}=S;const RM=E.RM;
const PVL=['carne','cocida','pasto','hierba','pocion','lazo','pie','cob','hie','pla','aur','mit','rub','esm','zaf','dia','car2','car3','car4','car5','coc2','coc3','coc4','coc5','fi1','fi2','fi3','fi4','fc1','fc2','fc3','fc4','hil','mad','tel','cur','ar0','ar1','ar2','ar3','ar4','ar5','ar6','ar7','ph2','ph3','ph4','ph5','pm2','pm3','pm4','pm5','ph6','ph7','pm6','pm7','gh1','gh2','gh3','gh4','gh5','gh6','gh7','am1','am2','am3','am4','am5','am6','am7','des','dco','cbl','obs','cua','tur','mgm','jad','ama','amb','top','esa','cri','opf','lte','kl1','cf1','kl2','cf2','kl3','cf3','kl4','cf4','kl5','cf5','kl6','cf6','ec_hl','ec_nv','ec_lu','ec_am','ec_nz','mpocion'];
const TKA=['vpf','vph','vmf','vmh','cmb','es','lic','vipm','vipj','pv','bh'],tkAdd=(u,k,q)=>{const a=E.acct(u);a.tk=(a.tk&&typeof a.tk==='object')?a.tk:{};a.tk[k]=(a.tk[k]|0)+q;S.dirty();E.pushEnt(u)};
const int=(v,a,b,d)=>{v=Math.floor(+v);return Number.isFinite(v)?Math.min(b,Math.max(a,v)):d};
const iv=it=>Math.round(720*RM[it.r]*(1+it.t*.6)*(it.dv?.05:1));
const tax=(p)=>({pay:Math.round(p*1.03),get:Math.round(p*.97)});
const col=c=>(DB[c]=DB[c]||{});
const setDoc=(c,id,d)=>{const o=col(c)[id]||null;col(c)[id]=d;S.dirty();S.bc(c,id,o,d)};
const delDoc=(c,id)=>{const o=col(c)[id]||null;if(o){delete col(c)[id];S.dirty();S.bc(c,id,o,null)}};
const now=()=>Date.now();
const oid=()=>'o'+E.rid(6);
const aucMin=o=>o.bid>0?Math.max(o.p|0,Math.ceil(o.bid*1.05)):(o.p|0);
function provRes(pk){if(pk==='pocion')return['pot',null];if(pk==='mpocion')return['mpot',null];if(pk.startsWith('ec_'))return['ec',pk.slice(3)];return['prov',pk]}
const provDl=(pk,q)=>{const [k,s]=provRes(pk);return k==='pot'?{pot:q}:k==='mpot'?{mpot:q}:k==='ec'?{ec:{k:s,q}}:{prov:{pk:s,q}}};
const provAv=(a,pk)=>{const [k,s]=provRes(pk);return E.avail(a,k,s)};
const isMerc=a=>a.cls===0&&a.lic>now();
function claimItem(u,raw,newOwner){const a=E.acct(u),it=E.cleanItem(raw);if(!it||!it.id)return{e:'Objeto no válido'};const r=S.ECO.reg[it.id];
 if(!r||r.o!==u)return{e:'Ese objeto no es tuyo (o no está sincronizado todavía: espera unos segundos)'};return{it}}
function holdReg(id,o,esc,k){S.ECO.reg[id]={o,k:k||'i',t:now(),esc:esc?1:0};S.dirty()}
/* ---------- OFERTAS ---------- */
const ops={};
/* ===== Almacén general autoritativo del servidor =====
   Cada operación acepta un token tx para que reintentar tras perder la respuesta no duplique objetos. */
const wh=(a)=>{if(!Array.isArray(a.wh))a.wh=[];if(!a.whTx||typeof a.whTx!=='object')a.whTx={};return a.wh};
function whOnce(a,tx,fn){wh(a);tx=String(tx||'').slice(0,64);if(!/^[\w-]{8,64}$/.test(tx))return{e:'Identificador de operación inválido'};if(a.whTx[tx])return a.whTx[tx];const r=fn();if(r&&r.ok){a.whTx[tx]=r;const ks=Object.keys(a.whTx);if(ks.length>200)for(const k of ks.slice(0,ks.length-150))delete a.whTx[k];S.dirty()}return r}
function whProv(k){if(k==='pot')return['pot',null];if(k==='mpot')return['mpot',null];if(k==='ec_hl'||k==='ec_nv'||k==='ec_lu'||k==='ec_am'||k==='ec_nz')return['ec',k.slice(3)];if(PVL.includes(k))return['prov',k];return null}
function whDelta(u,k,q){const p=whProv(k);if(!p)return null;return p[0]==='pot'?{pot:q}:p[0]==='mpot'?{mpot:q}:p[0]==='ec'?{ec:{k:p[1],q}}:{prov:{pk:p[1],q}}}
ops['wh.list']=(u)=>{const a=E.acct(u);return{ok:1,l:wh(a).map(x=>JSON.parse(JSON.stringify(x)))} };
ops['wh.deposit']=(u,m)=>{const a=E.acct(u),q=int(m.q,1,1e6,0),k=String(m.k||'');return whOnce(a,m.tx,()=>{const W=wh(a);if(m.kind==='it'){const it=E.cleanItem(m.item),r=it&&S.ECO.reg[it.id];if(!it||!it.id||!r||r.o!==u)return{e:'Objeto no válido o aún no sincronizado'};if(W.some(x=>x.type==='item'&&x.item&&x.item.id===it.id))return{e:'Ese objeto ya está en el almacén'};holdReg(it.id,'W:'+u,1);W.push({k:it.id,n:it.n,q:1,type:'item',item:it});S.dirty();return{ok:1,l:W}}const d=whDelta(u,k,-q);if(!d)return{e:'Recurso no permitido'};const [rk,sub]=whProv(k);if(E.avail(a,rk,sub)<q)return{e:'No tienes esa cantidad sincronizada con el servidor'};E.deliver(u,Object.assign({note:'📥 Depositado en almacén'},d));const old=W.find(x=>x.type!=='item'&&x.k===k);if(old)old.q+=q;else W.push({k,n:k,q,type:'res'});S.dirty();return{ok:1,l:W}})};
ops['wh.withdraw']=(u,m)=>{const a=E.acct(u),i=int(m.i,0,1e6,-1);return whOnce(a,m.tx,()=>{const W=wh(a),x=W[i];if(!x)return{e:'Ese objeto ya no está en el almacén'};if(m.k!=null&&String(m.k)!==String(x.k))return{e:'El almacén cambió; actualiza e inténtalo otra vez'};if(m.itemId!=null&&(!x.item||String(m.itemId)!==String(x.item.id)))return{e:'El objeto cambió; actualiza e inténtalo otra vez'};if(x.type==='item'){const it=E.cleanItem(x.item),r=it&&S.ECO.reg[it.id];if(!it||!r||r.o!=='W:'+u)return{e:'La propiedad del objeto no coincide'};holdReg(it.id,u,0);E.deliver(u,{item:it,note:'↩️ Retirado del almacén'});W.splice(i,1)}else{const q=int(m.q,1,x.q|0,0);if(!q)return{e:'Cantidad inválida'};const d=whDelta(u,x.k,q);if(!d)return{e:'Recurso no permitido'};x.q-=q;if(x.q<=0)W.splice(i,1);E.deliver(u,Object.assign({note:'↩️ Retirado del almacén'},d))}S.dirty();return{ok:1,l:W}})};
ops['offer.new']=(u,m)=>{const a=E.acct(u),p=int(m.p,1,1e12,0);if(!p)return{e:'Precio inválido'};if(m.kind==='whit'||m.kind==='whpv'){const tx=String(m.tx||'');if(!/^[\w-]{8,64}$/.test(tx))return{e:'Identificador de publicación inválido'};if(a.whTx&&a.whTx[tx])return a.whTx[tx]}
 const id=oid(),base={u,nm:a.nm||'Jugador',p,ts:now()};if(a.wa)base.wa=a.wa;
 if(m.kind==='it'){const c=claimItem(u,m.item);if(c.e)return c;holdReg(c.it.id,'M:'+id,1);setDoc('offers',id,Object.assign(base,{it:c.it}));return{ok:1,id}}
 if(m.kind==='whit'){const W=wh(a),i=int(m.i,0,1e6,-1),x=W[i],it=x&&x.type==='item'&&E.cleanItem(x.item),r=it&&S.ECO.reg[it.id];if(!it||!r||r.o!=='W:'+u|| (m.itemId!=null&&String(m.itemId)!==String(it.id)) || (m.k!=null&&String(m.k)!==String(x.k)))return{e:'Objeto no disponible en el almacén; actualiza e inténtalo otra vez'};holdReg(it.id,'M:'+id,1);W.splice(i,1);setDoc('offers',id,Object.assign(base,{it,wh:1}));const out={ok:1,id};a.whTx=a.whTx||{};a.whTx[String(m.tx)]=out;const txKeys=Object.keys(a.whTx);if(txKeys.length>200)for(const tk of txKeys.slice(0,txKeys.length-150))delete a.whTx[tk];S.dirty();return out}
 if(m.kind==='whpv'){const W=wh(a),i=int(m.i,0,1e6,-1),x=W[i],q=int(m.q,1,x&&x.q||0,0);if(!x||x.type==='item'||!q||!PVL.includes(String(m.pk||'')))return{e:'Recurso no válido'};if(m.k!=null&&String(m.k)!==String(x.k))return{e:'El almacén cambió; actualiza e inténtalo otra vez'};const pk=String(m.pk),expected=pk==='pocion'?'pot':pk==='mpocion'?'mpot':pk;if(x.k!==expected)return{e:'El recurso del almacén no coincide con el producto'};if(x.q<q)return{e:'Cantidad insuficiente en el almacén'};x.q-=q;if(x.q<=0)W.splice(i,1);setDoc('offers',id,Object.assign(base,{pv:pk,q,wh:1}));const out={ok:1,id};a.whTx=a.whTx||{};a.whTx[String(m.tx)]=out;const txKeys=Object.keys(a.whTx);if(txKeys.length>200)for(const tk of txKeys.slice(0,txKeys.length-150))delete a.whTx[tk];S.dirty();return out}
 if(m.kind==='tk'){const k=String(m.tk||''),q=int(m.q,1,50,0);if(!TKA.includes(k)||!q)return{e:'Boleto no válido'};const t=(a.tk&&typeof a.tk==='object')?a.tk:{};if((t[k]|0)<q)return{e:'No tienes tantos boletos (sincroniza e inténtalo de nuevo)'};t[k]-=q;S.dirty();E.pushEnt(u);setDoc('offers',id,Object.assign(base,{tk:k,q}));return{ok:1,id}}
 if(m.kind==='pet'){const pt=E.cleanPetS(m.pet);if(!pt||!pt.id)return{e:'Mascota no válida'};const r=S.ECO.reg[pt.id];if(!r||r.o!==u)return{e:'Esa mascota no es tuya'};holdReg(pt.id,'M:'+id,1,'p');setDoc('offers',id,Object.assign(base,{pet:pt}));return{ok:1,id}}
 if(m.kind==='ec'){const k=String(m.ec||''),q=int(m.q,1,1e6,0);if(!E.EVK.includes(k)||!q)return{e:'Monedas inválidas'};if(E.avail(a,'ec',k)<q)return{e:'No tienes tantas monedas (sincroniza e inténtalo de nuevo)'};
  E.deliver(u,{ec:{k,q:-q},note:'🪙 Monedas puestas en oferta'});setDoc('offers',id,Object.assign(base,{ec:k,q}));return{ok:1,id}}
 if(m.kind==='pv'){const pk=String(m.pk||''),q=int(m.q,1,1e6,0);if(!PVL.includes(pk)||!q)return{e:'Producto no válido'};if(provAv(a,pk)<q)return{e:'No tienes tantas (sincroniza e inténtalo de nuevo)'};
  E.deliver(u,Object.assign({note:'📢 Puesto en oferta: '+q+' de '+pk},provDl(pk,-q)));setDoc('offers',id,Object.assign(base,{pv:pk,q}));return{ok:1,id}}
 return{e:'Tipo de oferta no válido'}};
ops['offer.cancel']=(u,m)=>{const id=String(m.id||''),o=col('offers')[id];if(!o||o.u!==u)return{e:'No es tu oferta'};if(o.auc&&o.bid>0)return{e:'Tiene pujas: espera al cierre'};
 giveBack(o);delDoc('offers',id);return{ok:1}};
function giveBack(o){if(o.wh&&o.it){const a=E.acct(o.u),W=wh(a);holdReg(o.it.id,'W:'+o.u,1);W.push({k:o.it.id,n:o.it.n,q:1,type:'item',item:o.it});S.dirty()}else if(o.it){holdReg(o.it.id,o.u,0);E.deliver(o.u,{item:o.it,note:'↩️ Oferta retirada'})}
 else if(o.pet){holdReg(o.pet.id,o.u,0,'p');E.deliver(o.u,{pet:o.pet,note:'↩️ Mascota devuelta'})}
 else if(o.pv&&o.wh){const a=E.acct(o.u),W=wh(a),k=o.pv==='pocion'?'pot':o.pv==='mpocion'?'mpot':o.pv,q=o.q|0,old=W.find(x=>x.type!=='item'&&x.k===k);if(old)old.q+=q;else W.push({k,n:k,q,type:'res'});S.dirty()}else if(o.pv)E.deliver(o.u,Object.assign({note:'↩️ Oferta retirada'},provDl(o.pv,o.q|0)))
 else if(o.ec)E.deliver(o.u,{ec:{k:o.ec,q:o.q|0},note:'↩️ Monedas devueltas'})
 else if(o.tk)tkAdd(o.u,o.tk,o.q|0)}
ops['offer.buy']=(u,m)=>{const id=String(m.id||''),o=col('offers')[id];if(!o||o.auc)return{e:'La oferta ya no existe'};if(o.u===u)return{e:'Es tu propia oferta'};
 const b=E.acct(u),t=tax(o.p);if(E.avail(b,'gold')<t.pay)return{e:'Oro insuficiente: te faltan '+(t.pay-E.avail(b,'gold'))};
 delDoc('offers',id);
 const bd={gold:-t.pay,note:'🛒 Compraste'};if(o.it){bd.item=o.it;bd.note+=' '+o.it.n;holdReg(o.it.id,u,0)}else if(o.pet){bd.pet=o.pet;bd.note+=' una mascota';holdReg(o.pet.id,u,0,'p')}else if(o.pv){Object.assign(bd,provDl(o.pv,o.q|0));bd.note+=' '+o.q+' de '+o.pv}else if(o.ec){bd.ec={k:o.ec,q:o.q|0};bd.note+=' '+o.q+' monedas'}else if(o.tk){tkAdd(u,o.tk,o.q|0);bd.note+=' '+(o.q|0)+' boleto(s) de plan'}
 E.deliver(u,bd);E.deliver(o.u,{gold:t.get,note:'💰 Vendiste a '+(b.nm||'un jugador')+' (+'+t.get+' 🪙)',tr:1});shopTr(o.u);return{ok:1}};
/* ---------- SUBASTAS (mascotas) ---------- */
ops['auc.new']=(u,m)=>{const a=E.acct(u),pt=E.cleanPetS(m.pet),p=int(m.p,1,1e12,0),h=int(m.h,1,48,6);if(!pt||!pt.id||!p)return{e:'Datos inválidos'};const r=S.ECO.reg[pt.id];if(!r||r.o!==u)return{e:'Esa mascota no es tuya'};
 /* Sin límite artificial de publicaciones: cada mascota queda en custodia del servidor. */
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
/* v307: Forja de Lete. Todo lo decide el servidor: materiales, oro (+3% de impuesto), probabilidad y el objeto que sale */
const fgStat=(it,mm)=>{const sl=it.sl,K=it.k;if(sl==0)it.dm=Math.round(5*mm);else if(sl==1)it.hp=Math.round(8*mm);else if(sl==2){it.hp=Math.round(4*mm);it.dm=Math.round(1*mm)}else if(sl==3){it.dm=Math.round(2*mm);it.hp=Math.round(2*mm)}else if(sl==4)it.hp=Math.round(5*mm);else if(sl==5)it.sp=Math.round(2*mm);else{if(K==2||K==4||K==6)it.mp=Math.round(8*mm);else{it.hp=Math.round(3*mm);if(K==0)it.gd=Math.round(4*mm)}}};
function fgPay(u,a,c,why){const cg=c.g+Math.ceil(c.g*.03);if(E.avail(a,'gold')<cg)return{e:'Oro insuficiente (precio + 3% de impuesto)'};for(const k in c.m)if(E.avail(a,'prov',k)<c.m[k])return{e:'Te faltan materiales del Submundo'};
 E.deliver(u,{gold:-cg,note:why+': −'+cg+' 🪙 (con 3% de impuesto)'});for(const k in c.m)E.deliver(u,{prov:{pk:k,q:-c.m[k]}});return null}
ops['forge.make']=(u,m)=>{const a=E.acct(u),e=Math.floor(+m.e),q=Math.floor(+m.q),sl=Math.floor(+m.sl);if(!(e>=1&&e<=8)||!(q>=1&&q<=3)||!(sl>=0&&sl<=6))return{e:'Receta no válida'};
 const c=E.FGQ[q],k=(a.cls>=0&&a.cls<=7)?a.cls:0,cs=E.forgeCost(e,q),er=fgPay(u,a,cs,'🔮 Forja de Lete');if(er)return er;
 const it={sl,t:c.t,r:c.r,li:c.li,k,du:100,en:e,el:c.el,id:'f'+E.rid(7)};fgStat(it,E.RM[c.r]*(1+c.t*.6)*1.1);
 E.reg()[it.id]={o:u,k:'i',t:Date.now(),en:e,el:c.el};S.dirty();E.deliver(u,{item:it,note:'🔮 ¡Forjaste un equipo encantado de '+E.ENCN[e]+' (Nv '+c.el+')! Está en tu mochila'});return{ok:1}};
ops['forge.en']=(u,m)=>{const id=String(m.id||''),r=E.reg()[id],a=E.acct(u),e=Math.floor(+m.e);if(!r||r.o!==u)return{e:'Sincroniza primero (el objeto aún no está registrado). Inténtalo de nuevo en unos segundos.'};
 if(!(e>=1&&e<=8))return{e:'Hechizo no válido'};const cur=r.en|0;if(cur&&cur!==e)return{e:'Ese objeto ya tiene el hechizo '+E.ENCN[cur]};const L=(cur?(r.el|0):0)+1;if(L>5)return{e:'Ya está al máximo (Nv 5)'};
 const cs=E.encCost(e,L),er=fgPay(u,a,cs,'🔮 Encantamiento '+E.ENCN[e]+' Nv '+L);if(er)return er;const win=Math.random()<cs.p;if(win){r.en=e;r.el=L;S.dirty()}return{ok:1,en:r.en|0,el:r.el|0,won:win?1:0}};
ops['item.up']=(u,m)=>{const id=String(m.id||''),r=E.reg()[id],a=E.acct(u);if(!r||r.o!==u)return{e:'Sincroniza primero (el objeto aún no está registrado). Inténtalo de nuevo en unos segundos.'};const L=(r.up|0)+1;if(L>12)return{e:'Ya está al máximo (+12)'};const c=E.UPC[L];
 const cg=c.g+Math.ceil(c.g*.03);if(E.avail(a,'gold')<cg)return{e:'Oro insuficiente (precio + 3% de impuesto)'};for(const k in c.m)if(E.avail(a,'prov',k)<c.m[k])return{e:'Faltan minerales'};
 E.deliver(u,{gold:-cg,note:'⚒️ Potenciación a +'+L+': −'+cg+' 🪙 (con 3% de impuesto)'});for(const k in c.m)E.deliver(u,{prov:{pk:k,q:-c.m[k]}});
 const win=Math.random()<c.p;if(win){r.up=L;S.dirty()}return{ok:1,up:r.up|0,won:win?1:0}};

const ARC=[null,{pat:6,tel:3,p:1},{pat:12,tel:6,p:1},{pat:20,tel:10,p:.85},{pat:32,tel:16,p:.7},{pat:50,tel:25,p:.55}];
ops['item.ar']=(u,m)=>{const id=String(m.id||''),r=E.reg()[id],a=E.acct(u);if(!r||r.o!==u)return{e:'Sincroniza primero (el objeto aún no está registrado). Inténtalo de nuevo en unos segundos.'};const L=(r.ar|0)+1;if(L>5)return{e:'Ya tiene el Refuerzo Arácnido al máximo (5)'};const c=ARC[L];
 if(E.avail(a,'prov','pat')<c.pat||E.avail(a,'prov','tel')<c.tel)return{e:'Faltan patas o telas de araña'};
 E.deliver(u,{prov:{pk:'pat',q:-c.pat},note:'🕷️ Refuerzo Arácnido nivel '+L+': −'+c.pat+' patas, −'+c.tel+' telas'});E.deliver(u,{prov:{pk:'tel',q:-c.tel}});
 const win=Math.random()<c.p;if(win){r.ar=L;S.dirty()}return{ok:1,ar:r.ar|0,won:win?1:0}};

/* ===== misiones diarias y cofres (el servidor tira los dados) ===== */
const KNMS=['común','poco común','rara','épica','legendaria','mítica'],DQKS=[0,.03,.08,.18],DQRS=[[100],[80,20],[55,30,15],[35,30,20,10,4,1]];
const dayKey=()=>new Date(Date.now()-4*36e5).toISOString().slice(0,10);
ops['dq.claim']=(u,m)=>{const a=E.acct(u),d=int(m.d,0,3,0),day=dayKey();const q=(a.dq&&a.dq.day===day)?a.dq:(a.dq={day,n:0});if(q.n>=4)return{e:'Ya cobraste las 4 misiones de hoy'};q.n++;S.dirty();
 let key=-1;if(Math.random()<DQKS[d]){const rl=DQRS[d];let pk=Math.random()*100,k=0;for(let j=0;j<rl.length;j++){if(pk<rl[j]){k=j;break}pk-=rl[j]}key=k;E.deliver(u,{prov:{pk:'kl'+(k+1),q:1},note:'🗝️ Llave '+KNMS[k]+' recibida'})}
 return{ok:1,key}};
const RMS=[1,1.6,2.4,3.5],CFS=[{t:0,li:[0,1],w:[.85,.14,.01,0]},{t:1,li:[2,3],w:[.6,.3,.09,.01]},{t:2,li:[4,5],w:[.35,.4,.2,.05]},{t:3,li:[6,6,7],w:[.1,.4,.4,.1]},{t:3,li:[7,8],w:[0,.2,.5,.3]},{t:4,li:[9],w:[0,0,.4,.6]}],EQLS=[50,75,100,150,200,300,500,700,1000,1200];
function setStS(it,m){const sl=it.sl,K=it.k;if(sl==0)it.dm=Math.round(5*m);else if(sl==1)it.hp=Math.round(8*m);else if(sl==2){it.hp=Math.round(4*m);it.dm=Math.round(1*m)}else if(sl==3){it.dm=Math.round(2*m);it.hp=Math.round(2*m)}else if(sl==4)it.hp=Math.round(5*m);else if(sl==5)it.sp=Math.round(2*m);else{if(K==2||K==4||K==6)it.mp=Math.round(8*m);else{it.hp=Math.round(3*m);if(K==0)it.gd=Math.round(4*m)}}}
ops['chest.open']=(u,m)=>{const c=int(m.c,0,5,0),a=E.acct(u);if(E.avail(a,'prov','cf'+(c+1))<1)return{e:'No tienes ese cofre'};if(E.avail(a,'prov','kl'+(c+1))<1)return{e:'Necesitas la llave '+KNMS[c]};
 const d=CFS[c],ck=int(m.k,0,7,-1),sl=Math.floor(Math.random()*7),k=(ck>=0&&Math.random()<.6)?ck:Math.floor(Math.random()*8),li=d.li[Math.floor(Math.random()*d.li.length)];let x=Math.random(),r=0;for(let i=0;i<4;i++){r=i;if(x<d.w[i])break;x-=d.w[i]}
 const it={sl,t:d.t,li,r,k,du:100,rl:EQLS[li],id:E.rid(6)};setStS(it,RMS[r]*(1+d.t*.6));holdReg(it.id,u,0);
 E.deliver(u,{prov:{pk:'kl'+(c+1),q:-1}});E.deliver(u,{prov:{pk:'cf'+(c+1),q:-1}});E.deliver(u,{item:it,note:'📦 Cofre '+KNMS[c]+' abierto'});return{ok:1,r}};
ops['tw.boss']=(u,m)=>{const a=E.acct(u),f=int(m.f,50,600,0);if(!f||f%10)return{e:'Piso inválido'};const t=Date.now(),day=dayKey();const q=(a.tw&&a.tw.day===day)?a.tw:(a.tw={day,n:0,t:a.tw?a.tw.t:0});if(t-(q.t||0)<45000)return{e:'Demasiado rápido',c:-1};if(q.n>=80)return{e:'Límite diario de la Torre',c:-1};q.t=t;q.n++;S.dirty();
 const c=Math.min(5,Math.floor((f-1)/100));if(Math.random()<[.02,.015,.01,.006,.003,.001][c]){E.deliver(u,{prov:{pk:'cf'+(c+1),q:1},note:'📦 Cofre '+KNMS[c]+' de la Torre'});return{ok:1,c}}return{ok:1,c:-1}};

/* ---------- TRATO DIRECTO entre jugadores ----------
   Reglas: ambos Nv 5+, conectados, un solo trato a la vez. Hasta 6 objetos (de la mochila), oro y provisiones.
   Los objetos se retienen (custodia) al ofrecerlos; el oro y las provisiones se comprueban al cerrar.
   Cualquier cambio anula los dos "Acepto". Comisión 3% sobre el ORO enviado (el receptor cobra el 97%). El servidor ejecuta todo de forma atómica. */
const TFEE=.03,TMAXI=6,TMAXP=4,TLV=+process.env.TRADE_MIN_LV||5,TLOCK=1500;
const TR=()=>S.ECO.trd||(S.ECO.trd={});
const trOf=u=>{const T=TR();for(const id in T){const t=T[id];if(t.a===u||t.b===u)return t}return null};
const nmOf=u=>(E.acct(u).nm)||'Jugador';
const mkSide=()=>({items:[],pets:[],gold:0,prov:{},tk:{},ok:0});const TKK=['vpf','vph','vmf','vmh','cmb','es','lic','vipm','vipj','pv','bh'],tkG=(a,k)=>((a.tk&&a.tk[k])|0);
const TMAXPET=3,FFEE=1500,FSLOTS=2,FPROV=10,VIPMSG='[VIP] Ya usaste tu trato gratis de hoy. Para comerciar sin límite: 🤝 Comercio y Party (3 💎) o 👑 Plan Jugador (7 💎).';
const isFree=u=>!S.isMaster(u)&&!((E.acct(u).px&&E.acct(u).px.tr||0)>Date.now());
const usedFree=u=>E.acct(u).ftd===dayKey();
const trFr=t=>!!(t.fr&&(t.fr.a||t.fr.b));
const slotsOf=sd=>sd.items.length+Object.keys(sd.prov||{}).length;
function trView(t,u,why){const me=t.a===u?'a':'b',th=me==='a'?'b':'a',o=x=>({items:x.items,pets:x.pets||[],gold:x.gold|0,prov:x.prov,tk:x.tk||{},ok:x.ok?1:0});
 return{id:t.id,st:why?'end':t.st,why:why||'',v:t.v,me:o(t['s'+me]),th:Object.assign(o(t['s'+th]),{u:t[th],nm:nmOf(t[th])}),ini:t.a===u?1:0,fee:TFEE,fr:trFr(t)?1:0,ff:FFEE,fs:FSLOTS,exp:t.exp}}
function trPush(t,why){for(const u of [t.a,t.b])if(S.online(u))S.push(u,{t:'dm',tr:1,v:trView(t,u,why)})}
function trEnd(t,why){for(const [u,sd] of [[t.a,t.sa],[t.b,t.sb]])for(const it of sd.items){holdReg(it.id,u,0);E.deliver(u,{item:it,note:'↩️ Trato cancelado: objeto devuelto'})}
 for(const [u,sd] of [[t.a,t.sa],[t.b,t.sb]])for(const pt of (sd.pets||[])){holdReg(pt.id,u,0,'p');E.deliver(u,{pet:pt,note:'↩️ Trato cancelado: mascota devuelta'})}
 delete TR()[t.id];S.dirty();trPush(t,why||'cancel')}
const trChanged=t=>{t.v++;t.sa.ok=0;t.sb.ok=0;t.ts=now();t.exp=now()+10*60e3;S.dirty();trPush(t)};
const trGet=(u,m)=>{const t=TR()[String(m.id||'')];if(!t||(t.a!==u&&t.b!==u))return null;return t};
setInterval(()=>{const T=TR(),n=now();for(const id in T)if(T[id].exp<n)trEnd(T[id],'expiró')},15e3).unref();
ops['trade.me']=(u)=>{const t=trOf(u);return{ok:1,v:t?trView(t,u):null}};
ops['trade.req']=(u,m)=>{const to=String(m.to||''),a=E.acct(u),b=Object.prototype.hasOwnProperty.call(S.ECO.acc,to)?S.ECO.acc[to]:null;if(!b||to===u)return{e:'Jugador no válido'};const fa=isFree(u),fb=isFree(to);if(fa&&usedFree(u))return{e:VIPMSG};if(fb&&usedFree(to))return{e:'Ese jugador ya usó su trato gratis de hoy (sin servicio 🤝 solo tiene 1 al día).'};
 if(fa&&E.avail(a,'gold')<FFEE)return{e:'El trato gratis cuesta '+FFEE+' 🪙 de comisión: te falta oro'};if(fb&&E.avail(b,'gold')<FFEE)return{e:'Ese jugador no tiene los '+FFEE+' 🪙 de comisión para un trato gratis'};
 var FR={a:fa,b:fb};
 if(!S.online(to))return{e:'Ese jugador no está conectado'};
 if((a.lv|0)<TLV||(b.lv|0)<TLV)return{e:'Para comerciar los dos necesitan Nv '+TLV+' o más'};if(trOf(u))return{e:'Ya tienes un trato abierto'};if(trOf(to))return{e:'Ese jugador está en otro trato'};
 const sc=S.ECO.soc&&S.ECO.soc[to];if(sc&&sc.bl&&sc.bl.includes(u))return{e:'Ese jugador no acepta tratos tuyos'};
 const t={id:'t'+E.rid(5),a:u,b:to,fr:FR,st:'req',v:0,sa:mkSide(),sb:mkSide(),ts:now(),exp:now()+60e3};TR()[t.id]=t;S.dirty();trPush(t);return{ok:1,v:trView(t,u)}};
ops['trade.acc']=(u,m)=>{const t=trGet(u,m);if(!t||t.st!=='req'||t.b!==u)return{e:'La solicitud ya no existe'};t.st='open';t.exp=now()+10*60e3;S.dirty();trPush(t);return{ok:1,v:trView(t,u)}};
ops['trade.cancel']=(u,m)=>{const t=trGet(u,m);if(!t)return{ok:1};trEnd(t,t.st==='req'&&t.b===u?'rechazó':'cancel');return{ok:1}};
const trSide=(t,u)=>t.a===u?t.sa:t.sb;
ops['trade.item']=(u,m)=>{const t=trGet(u,m);if(!t||t.st!=='open')return{e:'El trato no está abierto'};const sd=trSide(t,u);if(sd.items.length>=TMAXI)return{e:'Máximo '+TMAXI+' objetos por trato'};if(trFr(t)&&slotsOf(sd)>=FSLOTS)return{e:'Trato gratis: máximo '+FSLOTS+' espacios por lado'};
 const c=claimItem(u,m.item);if(c.e)return c;if(sd.items.some(x=>x.id===c.it.id))return{e:'Ya está en el trato'};holdReg(c.it.id,'T:'+t.id,1);sd.items.push(c.it);trChanged(t);return{ok:1,v:trView(t,u)}};
ops['trade.unitem']=(u,m)=>{const t=trGet(u,m);if(!t||t.st!=='open')return{e:'El trato no está abierto'};const sd=trSide(t,u),i=sd.items.findIndex(x=>x.id===String(m.iid||''));if(i<0)return{e:'Ese objeto no está en el trato'};
 const it=sd.items.splice(i,1)[0];holdReg(it.id,u,0);E.deliver(u,{item:it,note:'↩️ Objeto retirado del trato'});trChanged(t);return{ok:1,v:trView(t,u)}};
ops['trade.pet']=(u,m)=>{const t=trGet(u,m);if(!t||t.st!=='open')return{e:'El trato no está abierto'};if(trFr(t))return{e:'Trato gratis: solo objetos y provisiones (oro, mascotas y boletos requieren 🤝 Comercio)'};const sd=trSide(t,u);sd.pets=sd.pets||[];if(sd.pets.length>=TMAXPET)return{e:'Máximo '+TMAXPET+' mascotas/monturas por trato'};
 const pt=E.cleanPetS(m.pet);if(!pt||!pt.id)return{e:'Mascota no válida'};const r=S.ECO.reg[pt.id];if(!r||r.o!==u)return{e:'Esa mascota no es tuya (o aún no está sincronizada)'};if(sd.pets.some(x=>x.id===pt.id))return{e:'Ya está en el trato'};
 holdReg(pt.id,'T:'+t.id,1,'p');sd.pets.push(pt);trChanged(t);return{ok:1,v:trView(t,u)}};
ops['trade.unpet']=(u,m)=>{const t=trGet(u,m);if(!t||t.st!=='open')return{e:'El trato no está abierto'};const sd=trSide(t,u),i=(sd.pets||[]).findIndex(x=>x.id===String(m.pid||''));if(i<0)return{e:'Esa mascota no está en el trato'};
 const pt=sd.pets.splice(i,1)[0];holdReg(pt.id,u,0,'p');E.deliver(u,{pet:pt,note:'↩️ Mascota retirada del trato'});trChanged(t);return{ok:1,v:trView(t,u)}};
ops['trade.gold']=(u,m)=>{const t=trGet(u,m);if(!t||t.st!=='open')return{e:'El trato no está abierto'};if(trFr(t))return{e:'Trato gratis: solo objetos y provisiones (oro, mascotas y boletos requieren 🤝 Comercio)'};const a=E.acct(u),g=int(m.g,0,1e12,0);if(g>E.avail(a,'gold'))return{e:'No tienes tanto oro (sincroniza e inténtalo de nuevo)'};trSide(t,u).gold=g;trChanged(t);return{ok:1,v:trView(t,u)}};
ops['trade.tk']=(u,m)=>{const t=trGet(u,m);if(!t||t.st!=='open')return{e:'El trato no está abierto'};if(trFr(t))return{e:'Trato gratis: solo objetos y provisiones (oro, mascotas y boletos requieren 🤝 Comercio)'};const k=String(m.k||''),a=E.acct(u),q=int(m.q,0,50,0);if(!TKK.includes(k))return{e:'Boleto no válido'};
 const sd=trSide(t,u);sd.tk=sd.tk||{};if(q>tkG(a,k))return{e:'No tienes tantos boletos'};if(q)sd.tk[k]=q;else delete sd.tk[k];trChanged(t);return{ok:1,v:trView(t,u)}};
ops['trade.prov']=(u,m)=>{const t=trGet(u,m);if(!t||t.st!=='open')return{e:'El trato no está abierto'};const pk=String(m.pk||''),a=E.acct(u),q=int(m.q,0,1e6,0);if(!PVL.includes(pk))return{e:'Producto no válido'};
 if(KEYK_BLOCK.has(pk))return{e:'Eso no se puede'};const sd=trSide(t,u);if(trFr(t)&&q){if(q>FPROV)return{e:'Trato gratis: máximo '+FPROV+' por provisión'};if(!sd.prov[pk]&&slotsOf(sd)>=FSLOTS)return{e:'Trato gratis: máximo '+FSLOTS+' espacios por lado'}}if(q&&!sd.prov[pk]&&Object.keys(sd.prov).length>=TMAXP)return{e:'Máximo '+TMAXP+' tipos de provisión'};if(q>provAv(a,pk))return{e:'No tienes tantas'};
 if(q)sd.prov[pk]=q;else delete sd.prov[pk];trChanged(t);return{ok:1,v:trView(t,u)}};
const KEYK_BLOCK=new Set();
ops['trade.ok']=(u,m)=>{const t=trGet(u,m);if(!t||t.st!=='open')return{e:'El trato no está abierto'};if(+m.v!==t.v)return{e:'La oferta cambió: revísala'};if(now()-t.ts<TLOCK)return{e:'Espera un instante: la oferta acaba de cambiar'};
 const sd=trSide(t,u);sd.ok=1;if(!(t.sa.ok&&t.sb.ok)){S.dirty();trPush(t);return{ok:1,v:trView(t,u)}}
 /* cierre atómico */
 const A=E.acct(t.a),B=E.acct(t.b);
 if(trFr(t))for(const [uu,aa,f] of [[t.a,A,t.fr.a],[t.b,B,t.fr.b]]){if(!f)continue;if(aa.ftd===dayKey()){t.sa.ok=0;t.sb.ok=0;trPush(t);return{e:(aa.nm||'Un jugador')+' ya usó su trato gratis de hoy'}}if(E.avail(aa,'gold')<FFEE+(0)){t.sa.ok=0;t.sb.ok=0;trPush(t);return{e:(aa.nm||'Un jugador')+' no tiene los '+FFEE+' 🪙 de comisión'}}}
 for(const [a,sd2] of [[A,t.sa],[B,t.sb]]){if(E.avail(a,'gold')<sd2.gold){t.sa.ok=0;t.sb.ok=0;trPush(t);return{e:(a.nm||'Un jugador')+' ya no tiene el oro ofrecido'}}
  for(const k in (sd2.tk||{}))if(tkG(a,k)<sd2.tk[k]){t.sa.ok=0;t.sb.ok=0;trPush(t);return{e:(a.nm||'Un jugador')+' ya no tiene los boletos ofrecidos'}}
  for(const pk in sd2.prov)if(provAv(a,pk)<sd2.prov[pk]){t.sa.ok=0;t.sb.ok=0;trPush(t);return{e:(a.nm||'Un jugador')+' ya no tiene las provisiones ofrecidas'}}}
 delete TR()[t.id];S.dirty();
 if(trFr(t))for(const [uu,aa,f] of [[t.a,A,t.fr.a],[t.b,B,t.fr.b]])if(f){aa.ftd=dayKey();E.deliver(uu,{gold:-FFEE,note:'🤝 Trato gratis: comisión '+FFEE+' 🪙'})}
 for(const [from,to,fa,sd2] of [[t.a,t.b,A,t.sa],[t.b,t.a,B,t.sb]]){const get=Math.round(sd2.gold*(1-TFEE));
  if(sd2.gold)E.deliver(from,{gold:-sd2.gold,note:'🤝 Trato: enviaste '+sd2.gold+' 🪙 (comisión 3%)'});
  if(get)E.deliver(to,{gold:get,note:'🤝 Trato con '+nmOf(from)+': +'+get+' 🪙'});
  for(const pk in sd2.prov){E.deliver(from,Object.assign({note:'🤝 Trato: entregaste '+sd2.prov[pk]+' de '+pk},provDl(pk,-sd2.prov[pk])));E.deliver(to,Object.assign({note:'🤝 Trato con '+nmOf(from)+': +'+sd2.prov[pk]+' de '+pk},provDl(pk,sd2.prov[pk])))}
  {const ta=E.acct(to);fa.tk=fa.tk||{};ta.tk=ta.tk||{};for(const k in (sd2.tk||{})){fa.tk[k]=Math.max(0,tkG(fa,k)-sd2.tk[k]);ta.tk[k]=tkG(ta,k)+sd2.tk[k]}if(Object.keys(sd2.tk||{}).length){E.pushEnt(from);E.pushEnt(to);if(S.online(to))S.push(to,{t:'note',m:'🎟️ Trato con '+nmOf(from)+': recibiste boletos VIP',tk:1})}}
  for(const it of sd2.items){holdReg(it.id,to,0);E.deliver(to,{item:it,note:'🤝 Trato con '+nmOf(from)+': recibiste '+it.n})}
  for(const pt of (sd2.pets||[])){holdReg(pt.id,to,0,'p');E.deliver(to,{pet:pt,note:'🤝 Trato con '+nmOf(from)+': recibiste una mascota'})}}
 for(const [from,to,sd2] of [[t.a,t.b,t.sa],[t.b,t.a,t.sb]]){const rc={f:nmOf(from),it:sd2.items.map(x=>x.n),pets:(sd2.pets||[]).map(x=>x.nm||'Mascota'),g:Math.round(sd2.gold*(1-TFEE)),pv:sd2.prov,tk:sd2.tk||{}};
  if((rc.it.length||rc.pets.length||rc.g||Object.keys(rc.pv).length||Object.keys(rc.tk).length)&&S.online(to))S.push(to,{t:'note',m:'📬 Recibiste de '+rc.f,rc})}
 trPush(t,'done');return{ok:1,done:1}};

/* ---------- ZODÍACO: recompensa por participar en la derrota de un centinela (verifica calendario y daños compartidos) ---------- */
const h32=n=>{n=Math.imul(n^61,0x9e3779b1)^(n>>>15);n=Math.imul(n^(n>>>13),0x85ebca6b);return(n^(n>>>16))>>>0};
const drh=st=>{let n=0;for(let i=0;i<st.length;i++)n=Math.imul(n^st.charCodeAt(i),16777619)>>>0;return h32(n)};
const ZZW=4*3600e3,ZZHP=i=>1e8+5e6*i;
ops['zz.claim']=(u,m)=>{const key=String(m.k||''),mt=/^Z(\d+)-(\d{4})-(\d{1,2})$/.exec(key);if(!mt)return{e:'Evento no válido'};const i=+mt[1],y=+mt[2],mo=+mt[3]-1;if(![1,4,8].includes(i)||mo<0||mo>11||int(m.i,0,11,-1)!==i)return{e:'Evento no válido'};
 const day=1+i*2+drh('zd'+key)%2,hr=13+drh('zh'+key)%10,mi=drh('zm'+key)%60,start=Date.UTC(y,mo,day,hr,mi,0),t=now();if(t<start||t>start+ZZW+15*60e3)return{e:'Ese evento ya no está activo'};
 const a=E.acct(u);a.zzc=a.zzc||{};if(a.zzc[key])return{e:'Ya reclamaste este evento'};const hp=ZZHP(i);let tot=0,mine=0;const seen=new Set();
 for(const id in col('dragon')){const d=col('dragon')[id];if(!d||d.ev!==key||typeof d.u!=='string'||id!==key+'_'+d.u||seen.has(d.u)||!Object.prototype.hasOwnProperty.call(S.ECO.acc,d.u)||!S.ECO.acc[d.u].nm)continue;seen.add(d.u);const v=Math.min(hp,Math.max(0,+d.d||0));tot+=v;if(d.u===u)mine=v}
 if(tot<hp)return{e:'El centinela aún no ha caído'};if(mine<hp*.0005)return{e:'Tu daño fue muy bajo para recibir recompensa'};
 a.zzc[key]=1;S.dirty();const sh=mine/hp,p5=Math.min(.3,.01+sh*12),p4=Math.min(.5,.1+sh*30),x=Math.random(),c=x<p5?5:x<p5+p4?4:3;   // quien más aporta, más probabilidad de un cofre mejor (siempre con azar)
 E.deliver(u,{prov:{pk:'cf'+(c+1),q:1},note:'📦 Cofre '+KNMS[c]+' del Zodiaco'});return{ok:1,c}};
ops['shop.close']=(u)=>{delDoc('shops',u);return{ok:1}};
function shopOf(m,u){const sid=String(m.s||''),s=col('shops')[sid];if(!s)return{e:'La tienda ya no existe'};if(sid===u)return{e:'Es tu tienda'};const sa=E.acct(sid);if(!isMerc(sa))return{e:'Esa tienda está inactiva'};return{s,sid,sa}}
ops['shop.buy']=(u,m)=>{const r=shopOf(m,u);if(r.e)return r;const {s,sid,sa}=r,b=E.acct(u),q=int(m.q,1,1000000,0);if(!q)return{e:'Cantidad inválida'};
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

/* ---------- 🎯 RECOMPENSAS POR JUGADORES (PvP, v148) ----------
   Quien muere en PvP puede poner recompensa por la cabeza de su verdugo (oro, 💎 propias y/u objeto). El servidor retiene todo en custodia;
   la cobra quien mate al buscado con la Licencia de Cazador activa. Si nadie la cobra en 72 h se devuelve (oro −10%). Poner el cartel cuesta 10% de oro extra. */
const BTY_MIN=10000,BTY_FEE=.10,BTY_H=72,BTY_POSTED=3,BTY_ACC=5;
const hOk=a=>(+a.px.bh||0)>now(),btyAll=()=>col('bty');
function btyBack(b,pct){const g=Math.round((b.g|0)*pct);if(g>0)E.deliver(b.u,{gold:g,note:'↩️ Recompensa por '+b.tn+' devuelta (+'+g+' 🪙)'});if(b.m>0)E.grantGems(b.u,b.m,'own','Recompensa devuelta');
 if(b.it){holdReg(b.it.id,b.u,0);E.deliver(b.u,{item:b.it,note:'↩️ Objeto de la recompensa devuelto'})}}
function btyClean(){const t=now();for(const id in btyAll()){const b=btyAll()[id];if(b.ex<=t){btyBack(b,.9);delDoc('bty',id)}}}
function btyView(b,u){return{id:b.id,t:b.t,tn:b.tn,tc:b.tc|0,tl:b.tl|0,tb:b.tb||'',un:b.un,g:b.g|0,m:b.m|0,it:b.it?{n:b.it.n,r:b.it.r|0,t:b.it.t|0}:null,ts:b.ts,ex:b.ex,na:b.ac.length,acc:b.ac.includes(u)?1:0,mine:b.u===u?1:0,tgt:b.t===u?1:0}}
const btyHas=t=>{for(const id in btyAll())if(btyAll()[id].t===t)return true;return false};
ops['bty.list']=(u)=>{btyClean();const a=E.acct(u),l=Object.values(btyAll()).map(b=>btyView(b,u)).sort((x,y)=>(y.g+y.m*20000)-(x.g+x.m*20000)).slice(0,60);
 const t=now(),kb=(a.kb||[]).filter(k=>t-k.ts<48*36e5).map(k=>({u:k.u,n:k.n,ts:k.ts,has:Object.values(btyAll()).some(b=>b.t===k.u&&b.u===u)?1:0}));
 return{ok:1,l,kb,hunter:hOk(a)?1:0,pv:(+a.px.pv||0)>t?1:0,stats:{k:a.pvk|0,d:a.pvd|0},min:BTY_MIN,fee:BTY_FEE,h:BTY_H}};
ops['bty.post']=(u,m)=>{btyClean();const a=E.acct(u),t=now(),tu=String(m.tu||''),kb=(a.kb||[]).find(k=>k.u===tu&&t-k.ts<48*36e5),gm=S.isMaster&&S.isMaster(u);
 if(!kb&&!gm)return{e:'Solo puedes poner recompensa por quien te mató en PvP en las últimas 48 h'};
 const b0=Object.values(btyAll());if(b0.some(b=>b.t===tu&&b.u===u))return{e:'Ya tienes un cartel de ese jugador: espera a que se cobre o cancélalo'};
 if(b0.filter(b=>b.u===u).length>=BTY_POSTED)return{e:'Máximo '+BTY_POSTED+' carteles tuyos a la vez'};
 const ta=S.ECO.acc[tu];if(!ta)return{e:'Jugador no encontrado'};
 const g=int(m.g,0,1e11,0),gems=int(m.m,0,100000,0),hasIt=m.item&&typeof m.item==='object';
 if(g<1&&gems<1&&!hasIt)return{e:'Pon una recompensa: oro, 💎 u objeto'};if(g>0&&g<BTY_MIN)return{e:'El oro mínimo es '+BTY_MIN.toLocaleString('es')+' 🪙'};
 const fee=Math.round(g*BTY_FEE);if(g>0&&E.avail(a,'gold')<g+fee)return{e:'⚠️ Oro insuficiente: necesitas '+(g+fee).toLocaleString('es')+' 🪙 (recompensa + 10% del cartel)'};
 if(gems>0&&(a.gem.own|0)<gems)return{e:'Te faltan '+(gems-(a.gem.own|0))+' 💎 propias (las transferidas no valen aquí)'};
 let it=null;if(hasIt){const c=claimItem(u,m.item);if(c.e)return c;it=c.it}
 const id='b'+E.rid(6);if(g>0)E.deliver(u,{gold:-(g+fee),note:'🎯 Cartel de recompensa por '+(ta.nm||'?')+' (−'+g+' y 10% de cartel)'});if(gems>0)E.spendGems(a,gems,true,'Recompensa por '+(ta.nm||'?'));
 if(it)holdReg(it.id,'B:'+id,1);
 const b={id,t:tu,tn:ta.nm||(kb&&kb.n)||'Jugador',tc:ta.cls|0,tl:ta.lv|0,tb:ta.lbs||'',u,un:a.nm||'Jugador',g,m:gems,it,ts:t,ex:t+BTY_H*36e5,ac:[]};setDoc('bty',id,b);E.pushEnt(u);
 const v=btyView(b,'');for(const hu in S.ECO.acc){if(hu===u||hu===tu)continue;const ha=S.ECO.acc[hu];if(hOk(ha)&&S.online(hu))S.push(hu,{t:'wbt',b:btyView(b,hu)})}
 if(S.online(tu))S.push(tu,{t:'note',m:'🎯 ¡Han puesto recompensa por tu cabeza! Los cazadores te buscan.'});
 return{ok:1,id}};
ops['bty.accept']=(u,m)=>{btyClean();const a=E.acct(u),b=btyAll()[String(m.id||'')];if(!b)return{e:'Esa recompensa ya no existe'};if(!hOk(a))return{e:'Necesitas la Licencia de Cazador activa (Boutique › VIP y planes)'};
 if(b.t===u)return{e:'No puedes cazarte a ti mismo'};if(b.u===u)return{e:'No puedes cobrar tu propio cartel'};if(b.ac.includes(u))return{ok:1};
 if(Object.values(btyAll()).filter(x=>x.ac.includes(u)).length>=BTY_ACC)return{e:'Máximo '+BTY_ACC+' cacerías a la vez'};
 b.ac.push(u);S.dirty();return{ok:1}};
ops['bty.drop']=(u,m)=>{const b=btyAll()[String(m.id||'')];if(b){b.ac=b.ac.filter(x=>x!==u);S.dirty()}return{ok:1}};
ops['bty.cancel']=(u,m)=>{const id=String(m.id||''),b=btyAll()[id];if(!b||b.u!==u)return{e:'No es tu cartel'};btyBack(b,.8);delDoc('bty',id);return{ok:1}};
const posT={};
ops['bty.pos']=(u)=>{const a=E.acct(u),t=now();if(t-(posT[u]||0)<6000)return{ok:1,l:[],wait:1};posT[u]=t;btyClean();if(!hOk(a))return{ok:1,l:[]};
 const l=[];for(const b of Object.values(btyAll())){if(!b.ac.includes(u))continue;const w=S.world&&S.world.where(b.t);
  if(!w)l.push({id:b.id,st:'off'});else if(w.city)l.push({id:b.id,st:'city'});else if(w.dg)l.push({id:b.id,st:'dg'});else l.push({id:b.id,st:w.pvp?'pvp':'safe',x:w.x,y:w.y})}
 return{ok:1,l}};
/* muerte en PvP (la llama el mundo): estadísticas, registro de verdugos y cobro de recompensas */
function pvKill(ku,vu,fresh,kn){const ka=E.acct(ku),va=E.acct(vu),t=now();ka.pvk=(ka.pvk|0)+1;va.pvd=(va.pvd|0)+1;
 va.kb=(va.kb||[]).filter(k=>t-k.ts<48*36e5&&k.u!==ku);va.kb.push({u:ku,n:ka.nm||kn||'Jugador',ts:t});if(va.kb.length>10)va.kb.shift();S.dirty();
 btyClean();const r={g:0,m:0,n:0,its:[]};if(!fresh||!hOk(ka))return r;
 for(const id in btyAll()){const b=btyAll()[id];if(b.t!==vu||b.u===ku)continue;
  if(b.g>0){E.deliver(ku,{gold:b.g,note:'🎯 Recompensa por '+b.tn+' (+'+b.g+' 🪙)'});r.g+=b.g}
  if(b.m>0){E.grantGems(ku,b.m,'tr','Recompensa por '+b.tn);r.m+=b.m}
  if(b.it){holdReg(b.it.id,ku,0);E.deliver(ku,{item:b.it,note:'🎯 Recompensa: '+b.it.n});r.its.push(b.it.n)}
  r.n++;delDoc('bty',id);if(S.online(b.u))S.push(b.u,{t:'note',m:'🎯 '+(ka.nm||'Un cazador')+' cobró tu recompensa por '+b.tn+'.'})}
 if(r.n)E.pushEnt(ku);return r}

function shopTr(sid){const s=col('shops')[sid];if(s){s.tr=(s.tr|0)+1;S.dirty()}}
const prizeOk=k=>TKA.includes(k)||(PVL.includes(k)&&!KEYK_BLOCK.has(k));
const grant=(u,k,q,note)=>{q=Math.max(1,Math.min(1000,q|0));if(!prizeOk(k))return false;if(TKA.includes(k)){tkAdd(u,k,q);if(S.online(u))S.push(u,{t:'note',m:note||'🎁 Premio recibido'})}else E.deliver(u,Object.assign({note:note||'🎁 Premio recibido'},provDl(k,q)));return true};
return{ops,shopView,iv,PVL,pvKill,btyHas,prizeOk,grant}};
