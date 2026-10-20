/* Tienda del servidor: apariencias, servicios (buffs), gemas, nombres y entitlements. Precios y reglas SOLO viven aquí. */
module.exports=function(S,E){
const cat=S.cat,SK=Object.assign({},cat.SKINS,cat.TRAJES||{}),EVK=E.EVK;
const GEMP={lt:3,ap:2,bl:4,es:3,cmb:6,lic:10,vipm:15,vipj:7,vip:11},GMON=['cmb','es','lic','vipm','vipj'],GEMSKIN=12,LIC_LV=15,GCMB=['lt','ap'],PRMK=['lt','ap','bl','es'],DAY=864e5;
const price=(k,d)=>{const b=GEMP[k]||0;if(GMON.includes(k)){if(k==='es'||d>=30)return b;return Math.min(b-1,Math.max(1,Math.round(b*d/30*1.3)))}if(d<=10)return b;return Math.max(1,Math.round(b*(d/10)*.8))};
const blGold=lv=>Math.round(2000*Math.pow(1.28,Math.min(29,Math.max(0,lv-1))));
const NAME_GOLD=2000,TAXP=c=>Math.ceil(Math.round(c)*.03),err=e=>({e});/* impuesto 3% sobre todo lo que se paga con oro */const ops={};
ops['me.get']=(u)=>({ok:1,ent:E.ent(u)});
ops['name.claim']=(u,m)=>{const r=E.claimName(u,m.name);if(r.e)return r;E.pushEnt(u);return{ok:1,nm:r.nm}};
/* ---- Ranking: los 100 mejores por nivel o por habilidad, global o por clase. Lo calcula el servidor con datos ya validados ---- */
const RKC={},RKTTL=+process.env.RK_TTL||8e3;/* ranking: se recalcula cada 8 s (antes 45 s: un héroe nuevo o que subía de nivel tardaba casi un minuto en aparecer) */
function rkList(cc,k){const key=cc+'|'+k,h=RKC[key],t=Date.now();if(h&&t-h.t<RKTTL)return h.l;
 const l=[];for(const u in S.ECO.acc){const a=S.ECO.acc[u];if(!a||!(a.nm||a.pn)||!(a.cls>=0)||(cc>=0&&a.cls!==cc)||(a.strikes|0)>=8)continue;let mst=false;try{mst=S.isMaster(u)}catch(e){}if(mst)continue;
  const sx=Array.isArray(a.sx)?a.sx:[1,1,1];l.push({u,n:a.nm||a.pn,c:a.cls|0,l:a.lv|0,x:a.xp||0,s:[sx[0]|0||1,sx[1]|0||1,sx[2]|0||1],g:(S.tagOf&&S.tagOf(u))||''})}
 const v=k==='lv'?(x=>0):k==='st'?(x=>x.s[0]+x.s[1]+x.s[2]):(x=>x.s[+k[1]]);
 l.sort((p,q)=>k==='lv'?(q.l-p.l||q.x-p.x):(v(q)-v(p)||q.l-p.l||q.x-p.x));RKC[key]={t,l};return l}
ops['rank.get']=(u,m)=>{const c=Math.floor(+m.c),cc=c>=0&&c<=7?c:-1,k=['lv','s0','s1','s2','st'].includes(m.k)?m.k:'lv',l=rkList(cc,k);
 const i=l.findIndex(x=>x.u===u);return{ok:1,n:l.length,me:i>=0?i+1:0,l:l.slice(0,100).map(x=>({n:x.n,c:x.c,l:x.l,s:x.s,g:x.g,me:x.u===u?1:0}))}};
ops['name.change']=(u,m)=>{const a=E.acct(u),first=(a.nch|0)===0,n=String(m.name||'').trim().replace(/\s+/g,' ');
 if(!/^[\p{L}\p{N} _-]{3,14}$/u.test(n))return err('Usa de 3 a 14 letras, números, espacios, - o _');
 if(a.nm&&a.nm===n)return err('Ese ya es tu nombre');const o=E.uidByName(n);if(o&&o!==u)return err('Ese nombre ya está en uso');
 if(first){const nt=NAME_GOLD+TAXP(NAME_GOLD);if(E.avail(a,'gold')<nt)return err('Te faltan '+(nt-E.avail(a,'gold'))+' 🪙 (con 3% de impuesto)')}else if(E.gTot(a)<1)return err('Necesitas 1 💎');
 if(first)E.deliver(u,{gold:-(NAME_GOLD+TAXP(NAME_GOLD)),note:'✏️ Cambio de nombre (+3% impuesto)'});else if(!E.spendGems(a,1,false,'Cambio de nombre'))return err('Saldo insuficiente');
 const r=E.claimName(u,n,1);if(r.e)return r;a.nch=(a.nch|0)+1;S.dirty();E.pushEnt(u);S.log('[nombre] '+u+' → '+n);return{ok:1,nm:r.nm,ent:E.ent(u)}};
ops['skin.buy']=(u,m)=>{const q=SK[String(m.id||'')],a=E.acct(u);if(!q)return err('Apariencia desconocida');if(a.sk.includes(q.id))return err('Ya la tienes');
 if(E.gTot(a)<q.g)return err('Te faltan '+(q.g-E.gTot(a))+' 💎');if(!E.spendGems(a,q.g,false,'Apariencia '+q.id))return err('Saldo insuficiente');a.sk.push(q.id);S.dirty();E.pushEnt(u);S.log('[tienda] '+(a.nm||u)+' compró '+q.id);return{ok:1,ent:E.ent(u)}};

/* ---- Herramientas del master: renombrar jugadores e insignias de staff ---- */
const BADGES=['adm','mod','gm','tst','inf'];
ops['adm.find']=(u,m)=>{if(!S.isMaster(u))return err('Solo el master');const q=String(m.q||'').trim().toLowerCase().slice(0,24),L=[];for(const id in S.ECO.acc){const x=S.ECO.acc[id];if(!x||!x.nm)continue;if(q&&!x.nm.toLowerCase().includes(q))continue;L.push({nm:x.nm,lv:x.lv|0,c:x.cls|0,t:x.created||0,g:x.gem?(x.gem.own|0)+(x.gem.tr|0):0,on:S.online(id)?1:0})}L.sort((a,b)=>q?a.nm.length-b.nm.length:b.t-a.t);return{ok:1,l:L.slice(0,20).map(x=>({nm:x.nm,lv:x.lv,c:x.c,g:x.g,on:x.on}))}};
/* ================= ZONA GM (solo master): gemas, oro, staff, pagos automáticos y registro ================= */
const GMX=()=>{const e=S.ECO;e.gm=e.gm||{};e.gm.pay=e.gm.pay||{};e.gm.log=e.gm.log||[];return e.gm};
const gmLogAdd=(by,k,to,q,m)=>{const g=GMX();g.log.unshift({t:Date.now(),by:String(by||'').slice(0,18),k,to:String(to||'').slice(0,18),q:q|0,m:String(m||'').slice(0,80)});if(g.log.length>200)g.log.length=200;S.dirty()};
const nmOf=u=>((S.ECO.acc[u]||{}).nm)||u;
const GM_MAXG=1e6,GM_MAXO=1e9,H=36e5;
function gmTarget(u,name){const nm=String(name||'').trim();let o=u;if(nm){o=E.uidByName(nm);if(!o&&Object.prototype.hasOwnProperty.call(S.ECO.acc,nm))o=nm}
 if(!o||!Object.prototype.hasOwnProperty.call(S.ECO.acc,o))return null;return o}
function gmGiveGems(o,q,by,why){E.grantGems(o,q,'own','acreditadas por '+by);if(why!=='pago')S.push(o,{t:'note',m:'💎 Recibiste '+q+' gemas del equipo de Silk Road'})}
function gmGiveGold(o,q,note){E.deliver(o,{gold:q,note:note||('🪙 Recibiste '+q+' de oro del equipo de Silk Road')})}
ops['adm.gems']=(u,m)=>{if(!S.isMaster(u))return err('Solo el master');const q=Math.floor(+m.q);if(!(q>=1&&q<=GM_MAXG))return err('Cantidad inválida (1 a 1.000.000)');
 const o=gmTarget(u,m.name);if(!o)return err('No hay ningún jugador con ese nombre');const by=nmOf(u);
 gmGiveGems(o,q,'el master '+by,o===u?'pago':'');const a=E.acct(o);gmLogAdd(by,'gem',a.nm||o,q,'');
 S.log('[master] '+by+' acreditó '+q+' gemas a '+(a.nm||o)+' (total '+E.gTot(a)+')');return{ok:1,nm:a.nm||o,q,tot:E.gTot(a)}};
ops['adm.gold']=(u,m)=>{if(!S.isMaster(u))return err('Solo el master');const q=Math.floor(+m.q);if(!(q>=1&&q<=GM_MAXO))return err('Cantidad inválida (1 a 1.000.000.000)');
 const o=gmTarget(u,m.name);if(!o)return err('No hay ningún jugador con ese nombre');const by=nmOf(u),a=E.acct(o);
 gmGiveGold(o,q);gmLogAdd(by,'gold',a.nm||o,q,'');S.log('[master] '+by+' envió '+q+' de oro a '+(a.nm||o));return{ok:1,nm:a.nm||o,q}};
/* lista de staff: quien tiene insignia o pago automático */
ops['adm.staff']=(u)=>{if(!S.isMaster(u))return err('Solo el master');const bd=((S.DB.cfg||{}).badges)||{},pay=GMX().pay,ids=new Set([...Object.keys(bd),...Object.keys(pay)]),L=[];
 for(const id of ids){const a=S.ECO.acc[id];if(!a||!a.nm)continue;const p=pay[id];L.push({nm:a.nm,b:bd[id]||'',on:S.online(id)?1:0,lv:a.lv|0,p:p?{g:p.g||0,o:p.o||0,h:p.h||0,nx:+p.nx||0,a:p.a?1:0,tg:+p.tg||0,to:+p.to||0,ls:+p.ls||0}:null})}
 L.sort((x,y)=>(y.on-x.on)||x.nm.localeCompare(y.nm));return{ok:1,l:L.slice(0,100)}};
/* pagos automáticos */
ops['adm.pay.set']=(u,m)=>{if(!S.isMaster(u))return err('Solo el master');const o=gmTarget(null,m.name);if(!o||!String(m.name||'').trim())return err('No hay ningún jugador con ese nombre');
 const g=Math.floor(+m.g||0),go=Math.floor(+m.o||0),h=Math.floor(+m.h);if(!(g>=0&&g<=GM_MAXG))return err('Gemas inválidas (0 a 1.000.000)');if(!(go>=0&&go<=GM_MAXO))return err('Oro inválido (0 a 1.000.000.000)');
 if(g+go<1)return err('Pon gemas, oro o los dos');if(!(h>=1&&h<=2160))return err('El intervalo va de 1 hora a 90 días');
 const P=GMX().pay,old=P[o],now=Date.now();P[o]={g,o:go,h,nx:now+h*H,a:1,tg:old?+old.tg||0:0,to:old?+old.to||0:0,ls:old?+old.ls||0:0};
 if(m.now){gmPayOne(o,P[o],1,'pago inicial')}
 S.dirty();gmLogAdd(nmOf(u),'paycfg',nmOf(o),g,(g?g+'💎 ':'')+(go?go+'🪙 ':'')+'cada '+h+' h');return{ok:1,nm:nmOf(o)}};
ops['adm.pay.on']=(u,m)=>{if(!S.isMaster(u))return err('Solo el master');const o=gmTarget(null,m.name),p=o&&GMX().pay[o];if(!p)return err('Ese jugador no tiene pago automático');
 p.a=m.on?1:0;if(p.a&&p.nx<Date.now())p.nx=Date.now()+p.h*H;S.dirty();gmLogAdd(nmOf(u),'payon',nmOf(o),0,p.a?'reanudado':'pausado');return{ok:1,a:p.a}};
ops['adm.pay.del']=(u,m)=>{if(!S.isMaster(u))return err('Solo el master');const o=gmTarget(null,m.name),P=GMX().pay;if(!o||!P[o])return err('Ese jugador no tiene pago automático');delete P[o];S.dirty();gmLogAdd(nmOf(u),'paydel',nmOf(o),0,'quitado');return{ok:1}};
ops['adm.pay.now']=(u,m)=>{if(!S.isMaster(u))return err('Solo el master');const o=gmTarget(null,m.name),p=o&&GMX().pay[o];if(!p)return err('Ese jugador no tiene pago automático');gmPayOne(o,p,1,'pago manual');S.dirty();return{ok:1,nm:nmOf(o)}};
function gmPayOne(o,p,n,why){if(p.g>0){E.grantGems(o,p.g*n,'own','pago automático');p.tg=(+p.tg||0)+p.g*n}if(p.o>0){gmGiveGold(o,p.o*n,'💰 Pago del staff: +'+p.o*n+' 🪙');p.to=(+p.to||0)+p.o*n}
 p.ls=Date.now();if(p.g>0)S.push(o,{t:'note',m:'💎 Pago del staff: +'+p.g*n+' gemas'});gmLogAdd('sistema','pay',nmOf(o),p.g*n,(p.g?p.g*n+'💎 ':'')+(p.o?p.o*n+'🪙 ':'')+'· '+why)}
function gmPayTick(){try{const P=GMX().pay,now=Date.now();for(const o in P){const p=P[o];if(!p||!p.a||p.nx>now)continue;if(!S.ECO.acc[o]){delete P[o];continue}
  const ms=p.h*H,n=Math.min(24,Math.floor((now-p.nx)/ms)+1);gmPayOne(o,p,n,n>1?n+' periodos atrasados':'pago programado');p.nx=n>=24?now+ms:p.nx+n*ms;S.dirty()}}catch(e){S.log('pagos staff error '+e.message)}}
setInterval(gmPayTick,30000).unref();
ops['adm.log']=(u)=>{if(!S.isMaster(u))return err('Solo el master');return{ok:1,l:GMX().log.slice(0,60)}};
ops['adm.rename']=(u,m)=>{if(!S.isMaster(u))return err('Solo el master');const o=E.uidByName(m.from);if(!o)return err('No hay ningún jugador con ese nombre');const old=(E.acct(o)||{}).nm;const r=E.claimName(o,m.to,1);if(r.e)return r;S.dirty();E.pushEnt(o);S.log('[master] '+u+' renombró a '+old+' → '+r.nm);gmLogAdd(nmOf(u),'rename',r.nm,0,'antes: '+old);return{ok:1,nm:r.nm}};
ops['adm.badge']=(u,m)=>{if(!S.isMaster(u))return err('Solo el master');const o=E.uidByName(m.name);if(!o)return err('No hay ningún jugador con ese nombre');const code=String(m.code||'');if(code&&!BADGES.includes(code))return err('Insignia desconocida');
 const cfg=S.DB.cfg=S.DB.cfg||{},old=cfg.badges||{},nw=Object.assign({},old);if(code)nw[o]=code;else delete nw[o];cfg.badges=nw;S.dirty();S.bc('cfg','badges',old,nw);S.log('[master] insignia '+(code||'ninguna')+' → '+m.name);gmLogAdd(nmOf(u),'badge',nmOf(o),0,code?('insignia '+code):'sin insignia');return{ok:1}};
ops['evskin.gem']=(u,m)=>{const k=String(m.k||''),a=E.acct(u);if(!EVK.includes(k))return err('Evento desconocido');if(a.ev.includes(k))return err('Ya lo tienes');
 if(!E.spendGems(a,GEMSKIN,false,'Atuendo de evento '+k))return err('Te faltan '+(GEMSKIN-E.gTot(a))+' 💎');a.ev.push(k);S.dirty();E.pushEnt(u);return{ok:1,ent:E.ent(u)}};
ops['evskin.coin']=(u,m)=>{const k=String(m.k||''),a=E.acct(u);if(!EVK.includes(k))return err('Evento desconocido');if(a.ev.includes(k))return err('Ya lo tienes');
 if(E.avail(a,'ec',k)<300)return err('Te faltan monedas de evento (sincroniza e inténtalo de nuevo)');E.deliver(u,{ec:{k,q:-300},note:'🎭 Atuendo de evento comprado'});a.ev.push(k);S.dirty();E.pushEnt(u);return{ok:1,ent:E.ent(u)}};
ops['buff.buy']=(u,m)=>{const a=E.acct(u),now=Date.now();let k=String(m.k||''),d=+m.d||null;if(!GEMP[k]||k==='vip')return err('Servicio desconocido');
 if(d==null)d=GMON.includes(k)?30:10;if(![10,20,30].includes(d))d=GMON.includes(k)?30:10;if(k==='es')d=30;
 const vm=k==='vipm',vj=k==='vipj',vip=vm||vj,cmb=k==='cmb',lc=k==='lic',ks=vm?['lt','ap','bl','es']:vj?['lt','ap','bl']:cmb?GCMB:lc?[]:[k],cost=price(k,d);
 if(!cost||!ks.every(z=>PRMK.includes(z)))return err('Servicio no válido');
 if((vm||lc)&&(a.cls!==0||a.lv<LIC_LV))return err(a.cls!==0?'Solo disponible para la clase Mercader':'Necesitas nivel '+LIC_LV);
 if(ks.some(z=>Math.max(now,a.px[z]||0)-now+d*DAY>90*DAY)||((vm||lc)&&Math.max(now,a.lic||0)-now+d*DAY>90*DAY)||(vip&&Math.max(now,a.vip||0)-now+d*DAY>90*DAY))return err('Máximo 90 días acumulados');
 if(!E.spendGems(a,cost,true,'Servicio '+k+' '+d+' d'))return err('Te faltan '+(cost-a.gem.own)+' 💎 propias (las transferidas solo valen para apariencias)');
 ks.forEach(z=>{a.px[z]=Math.max(now,a.px[z]||0)+d*DAY});if(vm||lc)a.lic=Math.max(now,a.lic||0)+d*DAY;if(vip)a.vip=Math.max(now,a.vip||0)+d*DAY;
 S.dirty();E.pushEnt(u);S.log('[tienda] '+(a.nm||u)+' compró '+k+' '+d+'d');return{ok:1,ent:E.ent(u),cost}};
ops['bonus.buy']=(u,m)=>{const a=E.acct(u),L=a.bxl,i=Math.floor(+m.i),BX=E.BX;if(!(i>=0&&i<4))return err('Bonus desconocido');
 if(L.x[i]+Math.max(0,L.t[i]-L.a[i])+BX.ms>BX.max+2*36e5)return err('Máximo 20 h acumuladas');
 if(!E.spendGems(a,BX.cost,true,'Bonus '+['XP','oro','defensa','vida'][i]+' +4 h'))return err('Te faltan '+(BX.cost-a.gem.own)+' 💎 propias (las transferidas solo valen para apariencias)');
 L.t[i]+=BX.ms;S.dirty();E.pushEnt(u);S.log('[tienda] '+(a.nm||u)+' compró bonus '+i);return{ok:1,ent:E.ent(u),cost:BX.cost}};
/* Halloween: el oro y las gemas de los cofres del tesoro los entrega el servidor (cuotas de la tabla: 3 cofres de 1.000.000, 24 de 2 💎, 30 de oro). Si el cliente se los sumara, el antitrampas los borraría. */
const HALQ={G1:3,M:24,g:30},halOn=()=>{const d=new Date(Date.now()-4*36e5),mo=d.getUTCMonth()+1,dy=d.getUTCDate();return(mo===10&&dy>=15)||(mo===11&&dy<=3)};
ops['hal.find']=(u,m)=>{const a=E.acct(u),j=Math.floor(+m.j),p=String(m.p||''),v=Math.floor(+m.v)||0;
 if(!halOn())return err('El evento de Halloween no está activo');
 if(!(j>=0&&j<100)||!HALQ[p])return err('Tesoro no válido');
 const H=a.hl||(a.hl={f:{},n:{},ts:0});if(H.f[j])return{ok:1,dup:1};
 if((H.n[p]|0)>=HALQ[p])return err('Ya abriste todos los cofres de ese tipo');
 const now=Date.now();if(now-(H.ts||0)<2000)return err('Cavando demasiado rápido: espera un momento');
 let gold=0,gem=0;if(p==='G1')gold=1e6;else if(p==='M')gem=2;else{if(!(v>=5e4&&v<=3e5&&v%5000===0))return err('Premio no válido');gold=v}
 H.f[j]=gold||gem;H.n[p]=(H.n[p]|0)+1;H.ts=now;S.dirty();
 if(gold)E.deliver(u,{gold,note:'🎃 Tesoro de Halloween: +'+gold.toLocaleString('es')+' 🪙'});
 if(gem)E.grantGems(u,gem,'own','tesoro de Halloween');
 S.log('[halloween] '+(a.nm||u)+' abrió el tesoro #'+j+' ('+p+')');return{ok:1,g:gold,m:gem}};
ops['gem.log']=(u)=>{const a=E.acct(u);return{ok:1,own:a.gem.own,tr:a.gem.tr,l:(a.gl||[]).slice(-25).reverse()}};
ops['buff.gold']=(u,m)=>{const a=E.acct(u),now=Date.now(),c0=blGold(a.lv),c=c0+TAXP(c0);if(m.k!=='bl')return err('Servicio no válido');
 if(Math.max(now,a.px.bl||0)-now+10*DAY>90*DAY)return err('Máximo 90 días acumulados');if(E.avail(a,'gold')<c)return err('Te faltan '+(c-E.avail(a,'gold'))+' 🪙');
 E.deliver(u,{gold:-c,note:'🙏 Bendición +10 días (+3% impuesto)'});a.px.bl=Math.max(now,a.px.bl||0)+10*DAY;S.dirty();E.pushEnt(u);return{ok:1,ent:E.ent(u),cost:c}};
ops['gem.tx']=(u,m)=>{const a=E.acct(u),q=Math.floor(+m.q);if(!(q>=1&&q<=1e6))return err('Cantidad inválida');let to=String(m.to||'').trim();
 const t=Object.prototype.hasOwnProperty.call(S.ECO.acc,to)?to:E.uidByName(to);if(!t||t===u)return err('Jugador no encontrado (usa su nombre exacto o su código)');
 if(E.gTot(a)<q)return err('Saldo insuficiente');E.spendGems(a,q,false,'Envío a '+((E.acct(t)||{}).nm||t));const b=E.acct(t);b.gem.tr+=q;E.glAdd(b,q,'(transferidas) de '+(a.nm||u));S.dirty();E.pushEnt(u);E.pushEnt(t);
 S.push(t,{t:'note',m:'💎 '+(a.nm||'Un jugador')+' te envió '+q+' gemas (solo para apariencias)'});S.log('[gemas] '+(a.nm||u)+' → '+(b.nm||t)+' '+q);return{ok:1,ent:E.ent(u)}};
/* ---------- 💎 MERCADO DE GEMAS (jugador a jugador, v145) ----------
   Se vende por ORO (por gema). El servidor retiene las gemas del vendedor (custodia) y las entrega al comprador al instante.
   Regla: las gemas que se compran aquí llegan como TRANSFERIDAS (solo atuendos, nunca Premium/VIP). Comisión 3% (compra +3%, venta −3%). */
const GK=()=>{const d=S.DB.gmk=S.DB.gmk||{};return d},GKH=()=>{const e=S.ECO;e.gmkh=e.gmkh||[];return e.gmkh};
ops['gmk.list']=(u)=>{const L=Object.entries(GK()).map(([id,o])=>({id,nm:o.nm,q:o.q|0,p:o.p|0,mine:o.u===u?1:0,ts:o.ts|0})).sort((a,b)=>a.p-b.p||a.ts-b.ts).slice(0,250);
 return{ok:1,l:L,h:GKH().slice(-8).reverse(),own:E.acct(u).gem.own|0,tr:E.acct(u).gem.tr|0}};
ops['gmk.sell']=(u,m)=>{const a=E.acct(u),q=Math.floor(+m.q),p=Math.floor(+m.p);if(!(q>=1&&q<=1e6))return err('Cantidad inválida (1 a 1.000.000)');if(!(p>=1&&p<=1e9))return err('Precio por gema inválido (1 a 1.000.000.000 🪙)');
 if(Object.values(GK()).filter(o=>o.u===u).length>=10)return err('Máximo 10 anuncios activos');if(E.gTot(a)<q)return err('No tienes tantas gemas');
 const tr=Math.min(a.gem.tr,q),ow=q-tr;if(!E.spendGems(a,q,false,'Puestas en el Mercado de Gemas'))return err('Saldo insuficiente');
 const id='g'+E.rid(6);GK()[id]={u,nm:a.nm||'Jugador',q,ow,tr,p,ts:Date.now()};S.dirty();E.pushEnt(u);S.log('[mercado-gemas] '+(a.nm||u)+' ofrece '+q+' a '+p+' 🪙 c/u');return{ok:1,id,ent:E.ent(u)}};
ops['gmk.cancel']=(u,m)=>{const id=String(m.id||''),o=GK()[id];if(!o||o.u!==u)return err('No es tu anuncio');const a=E.acct(u);delete GK()[id];a.gem.own+=o.ow|0;a.gem.tr+=o.tr|0;E.glAdd(a,o.q|0,'Anuncio del Mercado de Gemas retirado');S.dirty();E.pushEnt(u);return{ok:1,ent:E.ent(u)}};
ops['gmk.buy']=(u,m)=>{const id=String(m.id||''),o=GK()[id];if(!o)return err('El anuncio ya no existe');if(o.u===u)return err('Es tu propio anuncio');const n=Math.floor(+m.n);if(!(n>=1&&n<=o.q))return err('Cantidad no disponible (quedan '+o.q+')');
 const b=E.acct(u),cost=n*o.p,pay=Math.round(cost*1.03),get=Math.round(cost*.97);if(E.avail(b,'gold')<pay)return err('Te faltan '+(pay-E.avail(b,'gold'))+' 🪙');
 const t=Math.min(o.tr|0,n);o.tr=(o.tr|0)-t;o.ow=(o.ow|0)-(n-t);o.q-=n;if(o.q<=0)delete GK()[id];
 E.deliver(u,{gold:-pay,note:'💎 Compraste '+n+' gemas en el Mercado de Gemas (−'+pay+' 🪙, +3% impuesto)'});E.deliver(o.u,{gold:get,note:'💎 Vendiste '+n+' gemas a '+(b.nm||'un jugador')+' (+'+get+' 🪙)',tr:1});
 b.gem.tr+=n;E.glAdd(b,n,'(transferidas) Mercado de Gemas a '+o.p+' 🪙');const h=GKH();h.push([Date.now(),o.p,n]);if(h.length>30)h.shift();S.dirty();E.pushEnt(u);E.pushEnt(o.u);
 if(S.online(o.u))S.push(o.u,{t:'note',m:'💎 Vendiste '+n+' gemas a '+(b.nm||'un jugador')+': +'+get+' 🪙'});S.log('[mercado-gemas] '+(b.nm||u)+' compró '+n+' a '+(o.nm||o.u)+' por '+cost);return{ok:1,ent:E.ent(u)}};
/* ---------- 🏷️ Revendedores con descuento (los elige el master a mano) ---------- */
ops['adm.reseller']=(u,m)=>{if(!S.isMaster(u))return err('Solo el master');const o=E.uidByName(m.name);if(!o)return err('No hay ningún jugador con ese nombre');const d=Math.floor(+m.d);if(!(d>=0&&d<=50))return err('El descuento va de 0 a 50 %');
 const cfg=S.DB.cfg=S.DB.cfg||{},old=cfg.res||{},nw=Object.assign({},old);if(d>0)nw[o]=d;else delete nw[o];cfg.res=nw;S.dirty();S.bc('cfg','res',old,nw);S.log('[master] revendedor '+(d||'quitado')+'% → '+m.name);gmLogAdd(nmOf(u),'reseller',nmOf(o),d,d?('descuento '+d+'%'):'sin descuento');return{ok:1,nm:nmOf(o),d}};
ops['adm.reslist']=(u)=>{if(!S.isMaster(u))return err('Solo el master');const r=((S.DB.cfg||{}).res)||{};return{ok:1,l:Object.keys(r).map(id=>({nm:nmOf(id),d:r[id]|0,on:S.online(id)?1:0}))}};
return{ops,price,GEMP}};
