/* Tienda del servidor: apariencias, servicios (buffs), gemas, nombres y entitlements. Precios y reglas SOLO viven aquí. */
module.exports=function(S,E){
const cat=S.cat,SK=Object.assign({},cat.SKINS,cat.TRAJES||{}),EVK=E.EVK;
const GEMP={vpf:7,vph:4,vmf:12,vmh:7,tr:3,lt:3,ap:2,bl:4,es:3,cmb:6,lic:10,vipm:15,vipj:7,vip:11,pv:7,bh:5},GMON=['cmb','es','lic','vipm','vipj','pv','bh','tr','vpf','vph','vmf','vmh'],GEMSKIN=12,LIC_LV=1,GCMB=['lt','ap'],PRMK=['lt','ap','bl','es','pv','bh','tr'],DAY=864e5;
const price=(k,d)=>{const b=GEMP[k]||0;if(GMON.includes(k)){if(k==='es'||k==='pv'||k==='bh'||k==='vpf'||k==='vph'||k==='vmf'||k==='vmh'||d>=30)return b;return Math.min(b-1,Math.max(1,Math.round(b*d/30*1.3)))}if(d<=10)return b;return Math.max(1,Math.round(b*(d/10)*.8))};
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
ops['adm.bag']=(u,m)=>{if(!S.isMaster(u))return err('Solo el master');const sz=Math.floor(+m.sz);if(!E.BAGT.includes(sz)||sz<40)return err('Tamaño de mochila no válido');
 const o=gmTarget(u,m.name);if(!o)return err('No hay ningún jugador con ese nombre');const by=nmOf(u),a=E.acct(o);
 E.grantBag(o,sz,'el master '+by);gmLogAdd(by,'bag',a.nm||o,sz,'');S.log('[master] '+by+' entregó mochila de '+sz+' a '+(a.nm||o));return{ok:1,nm:a.nm||o,sz,bn:E.BAGN[sz]}};
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
 if(E.avail(a,'ec',k)<3000)return err('Te faltan monedas de evento (sincroniza e inténtalo de nuevo)');E.deliver(u,{ec:{k,q:-3000},note:'🎭 Atuendo de evento comprado'});a.ev.push(k);S.dirty();E.pushEnt(u);return{ok:1,ent:E.ent(u)}};
ops['buff.buy']=(u,m)=>{const a=E.acct(u),now=Date.now();let k=String(m.k||''),d=+m.d||null;if(!GEMP[k]||k==='vip')return err('Servicio desconocido');if(!['vpf','vph','vmf','vmh'].includes(k))return err('Ese servicio ya no se vende suelto: elige un plan');if(k==='bl')return err('La Bendición solo se compra en la ⛪ Iglesia, con oro');
 if(d==null)d=GMON.includes(k)?30:10;if(![10,20,30].includes(d))d=GMON.includes(k)?30:10;if(k==='es'||k==='pv'||k==='bh'||k==='vpf'||k==='vmf')d=30;if(k==='vph'||k==='vmh')d=15;
 const vm=k==='vipm',vj=k==='vipj',vf=k==='vpf'||k==='vph'||k==='vmf'||k==='vmh',mf=k==='vmf'||k==='vmh',vip=vm||vj||vf,cmb=k==='cmb',lc=k==='lic',ks=vf?['lt','ap','tr','pv','bh'].concat(mf?['es']:[]):vm?['lt','ap','es','tr']:vj?['lt','ap','tr']:cmb?GCMB:lc?[]:[k],cost=price(k,d);
 if(!cost||!ks.every(z=>PRMK.includes(z)))return err('Servicio no válido');
 if((vm||lc||mf)&&(a.cls!==0||a.lv<LIC_LV))return err(a.cls!==0?'Solo disponible para la clase Mercader':'Necesitas nivel '+LIC_LV);
 if(ks.some(z=>Math.max(now,a.px[z]||0)-now+d*DAY>90*DAY)||((vm||lc)&&Math.max(now,a.lic||0)-now+d*DAY>90*DAY)||(vip&&Math.max(now,a.vip||0)-now+d*DAY>90*DAY))return err('Máximo 90 días acumulados');
 if(!E.spendGems(a,cost,true,'Servicio '+k+' '+d+' d'))return err('Te faltan '+(cost-a.gem.own)+' 💎 propias (las transferidas solo valen para apariencias)');
 ks.forEach(z=>{a.px[z]=Math.max(now,a.px[z]||0)+d*DAY});if(vm||lc||mf)a.lic=Math.max(now,a.lic||0)+d*DAY;if(vip)a.vip=Math.max(now,a.vip||0)+d*DAY;
 S.dirty();E.pushEnt(u);S.log('[tienda] '+(a.nm||u)+' compró '+k+' '+d+'d');return{ok:1,ent:E.ent(u),cost}};
/* ---------- 🎟️ BOLETOS VIP (v154): el mismo servicio, pero como objeto que se puede enviar o intercambiar ---------- */
const TKN={vpf:'👑 Plan Jugador · 30 días',vph:'👑 Plan Jugador · 15 días',vmf:'🛒 Plan Mercader · 30 días',vmh:'🛒 Plan Mercader · 15 días',cmb:'🎯 Combo Cazador',es:'🐗 Escolta de caravana',lic:'📜 Licencia de Mercader',vipm:'👑 VIP Mercader',vipj:'👑 VIP Jugador',pv:'⚔️ Cazador PvP',bh:'🎯 Licencia de Cazador',vpw:'👑 Plan Jugador · 7 días (Influencer)',bx0:'⭐ Bonus de Experiencia · 2 h',bx1:'🪙 Bonus de Oro · 2 h',bx2:'🛡️ Bonus de Defensa · 2 h',bx3:'❤️ Bonus de Vida · 2 h'};
const tkOf=a=>(a.tk&&typeof a.tk==='object')?a.tk:(a.tk={});
const tkRes=u=>{const r=((S.DB.cfg||{}).res||{})[u];return +r>0};
/* v221: Gremio de Cazadores vende lazos (domar monturas). Oro con 3% de impuesto, tope diario para que no se regalen. */
const LZ_PRICE=3000,LZ_DAY=40,LZ_MAX=20;
ops['hunt.buy']=(u,m)=>{return err('Los lazos ya no se venden: se fabrican en el Gremio de Cazadores');const a=E.acct(u),q=Math.floor(+m.q);if(!(q>=1&&q<=LZ_MAX))return err('Cantidad de 1 a '+LZ_MAX);
 const d=Math.floor(Date.now()/DAY),L=a.lz&&a.lz.d===d?a.lz:(a.lz={d,n:0});
 if(L.n+q>LZ_DAY)return err('Límite diario: '+LZ_DAY+' lazos por día (te quedan '+Math.max(0,LZ_DAY-L.n)+')');
 const base=LZ_PRICE*q,c=base+TAXP(base),av=E.avail(a,'gold');if(av<c)return err('⚠️ Oro insuficiente: te faltan '+(c-av)+' 🪙');
 E.deliver(u,{gold:-c,note:'🪢 Compraste '+q+' lazo'+(q>1?'s':'')+' en el Gremio de Cazadores (−'+c+' 🪙, +3% impuesto)'});E.deliver(u,{prov:{pk:'lazo',q}});L.n+=q;S.dirty();return{ok:1,c,left:LZ_DAY-L.n}};
/* v224: fabricar lazos (200 telas de araña + 300 pieles de lobo + 4000 oro c/u). Lo valida el servidor. */
ops['hunt.craft']=(u,m)=>{const a=E.acct(u),q=Math.floor(+m.q);if(!(q>=1&&q<=20))return err('Cantidad de 1 a 20');
 const fee=4000*q,tl=200*q,cu=300*q;if(E.avail(a,'prov','tel')<tl)return err('Te faltan 🕸️ telas de araña: necesitas '+tl);if(E.avail(a,'prov','cur')<cu)return err('Te faltan 🟫 pieles de lobo: necesitas '+cu);if(E.avail(a,'gold')<fee)return err('⚠️ Oro insuficiente: te faltan '+(fee-E.avail(a,'gold'))+' 🪙');
 E.deliver(u,{gold:-fee,note:'🪢 Fabricaste '+q+' lazo'+(q>1?'s':'')+' (−'+tl+' telas, −'+cu+' pieles, −'+fee+' 🪙)'});E.deliver(u,{prov:{pk:'tel',q:-tl}});E.deliver(u,{prov:{pk:'cur',q:-cu}});E.deliver(u,{prov:{pk:'lazo',q}});S.dirty();return{ok:1}};
ops['tk.buy']=(u,m)=>{const a=E.acct(u),k=String(m.k||''),q=Math.floor(+m.q)||1;if(!TKN[k])return err('Boleto desconocido');if(!['vpf','vph','vmf','vmh'].includes(k))return err('Ese boleto ya no se vende: elige un plan');if(q<1||q>50)return err('Cantidad de 1 a 50');
 if(!(S.isMaster(u)||a.cls===0||tkRes(u)))return err('Los boletos los compran los Mercaderes y Revendedores');
 const cost=GEMP[k]*q;if(!E.spendGems(a,cost,true,'Boleto '+k+' ×'+q))return err('Te faltan '+(cost-a.gem.own)+' 💎 propias');
 const t=tkOf(a);t[k]=(t[k]|0)+q;S.dirty();E.pushEnt(u);S.log('[boletos] '+(a.nm||u)+' compró '+q+' '+k);return{ok:1,ent:E.ent(u),cost}};
ops['tk.send']=(u,m)=>{const a=E.acct(u),k=String(m.k||''),q=Math.floor(+m.q)||1;if(!TKN[k])return err('Boleto desconocido');if(q<1||q>50)return err('Cantidad de 1 a 50');let to=String(m.to||'').trim();
 const id=Object.prototype.hasOwnProperty.call(S.ECO.acc,to)?to:E.uidByName(to);if(!id||id===u)return err('Jugador no encontrado (usa su nombre exacto)');
 const t=tkOf(a);if((t[k]|0)<q)return err('No tienes tantos boletos');const b=E.acct(id);t[k]-=q;const tb=tkOf(b);tb[k]=(tb[k]|0)+q;S.dirty();E.pushEnt(u);E.pushEnt(id);
 const msg='🎟️ '+(a.nm||'Un jugador')+' te envía '+(q>1?q+' boletos':'un boleto')+' '+TKN[k];if(S.online(id))S.push(id,{t:'note',m:msg,tk:1});else E.deliver(id,{note:msg});
 S.log('[boletos] '+(a.nm||u)+' → '+(b.nm||id)+' '+q+' '+k);return{ok:1,ent:E.ent(u)}};
ops['tk.use']=(u,m)=>{const a=E.acct(u),k=String(m.k||''),now=Date.now(),d=(k==='vph'||k==='vmh')?15:k==='vpw'?7:30;if(!TKN[k])return err('Boleto desconocido');const t=tkOf(a);if((t[k]|0)<1)return err('No tienes ese boleto');
 if(/^bx[0-3]$/.test(k)){const i=+k[2],L=a.bxl,H2=2*36e5;if(L.x[i]+Math.max(0,L.t[i]-L.a[i])+H2>E.BX.max+2*36e5)return err('Máximo 20 h acumuladas: canjéalo más tarde');t[k]--;L.t[i]+=H2;S.dirty();E.pushEnt(u);S.log('[boletos] '+(a.nm||u)+' canjeó '+k);return{ok:1,ent:E.ent(u)}}
 const vm=k==='vipm',vj=k==='vipj',vf=k==='vpf'||k==='vph'||k==='vmf'||k==='vmh'||k==='vpw',mf=k==='vmf'||k==='vmh',vip=vm||vj||vf,cmb=k==='cmb',lc=k==='lic',ks=vf?['lt','ap','tr','pv','bh'].concat(mf?['es']:[]):vm?['lt','ap','es','tr']:vj?['lt','ap','tr']:cmb?GCMB:lc?[]:[k];
 if((vm||lc||mf)&&(a.cls!==0||a.lv<LIC_LV))return err(a.cls!==0?'Ese boleto solo lo canjea un Mercader (puedes enviarlo o intercambiarlo)':'Necesitas nivel '+LIC_LV);
 if(ks.some(z=>Math.max(now,a.px[z]||0)-now+d*DAY>90*DAY)||((vm||lc)&&Math.max(now,a.lic||0)-now+d*DAY>90*DAY)||(vip&&Math.max(now,a.vip||0)-now+d*DAY>90*DAY))return err('Máximo 90 días acumulados: canjéalo más tarde');
 t[k]--;ks.forEach(z=>{a.px[z]=Math.max(now,a.px[z]||0)+d*DAY});if(vm||lc||mf)a.lic=Math.max(now,a.lic||0)+d*DAY;if(vip)a.vip=Math.max(now,a.vip||0)+d*DAY;
 S.dirty();E.pushEnt(u);S.log('[boletos] '+(a.nm||u)+' canjeó '+k);return{ok:1,ent:E.ent(u)}};
ops['bonus.buy']=(u,m)=>{const a=E.acct(u),L=a.bxl,i=Math.floor(+m.i),BX=E.BX;if(!(i>=0&&i<4))return err('Bonus desconocido');
 if(L.x[i]+Math.max(0,L.t[i]-L.a[i])+BX.ms>BX.max+2*36e5)return err('Máximo 20 h acumuladas');
 if(E.gTot(a)<BX.cost)return err('⚠️ Gemas insuficientes: te faltan '+(BX.cost-E.gTot(a))+' 💎');if(!E.spendGems(a,BX.cost,false,'Bonus '+['XP','oro','defensa','vida'][i]+' +4 h'))return err('Gemas insuficientes');
 L.t[i]+=BX.ms;S.dirty();E.pushEnt(u);S.log('[tienda] '+(a.nm||u)+' compró bonus '+i);return{ok:1,ent:E.ent(u),cost:BX.cost}};
/* Halloween: el oro y las gemas de los cofres del tesoro los entrega el servidor (cuotas de la tabla: 3 cofres de 250.000, 12 de 2 💎, 20 de oro). Si el cliente se los sumara, el antitrampas los borraría. */
const halOn=()=>{const d=new Date(Date.now()-4*36e5),mo=d.getUTCMonth()+1,dy=d.getUTCDate();return(mo===10&&dy>=15)||(mo===11&&dy<=3)};
/* v325: los 100 tesoros son ÚNICOS y compartidos por todo el servidor. El plan (qué premio hay en cada tesoro) lo calcula el servidor con la misma semilla del cliente; el primero que lo abre lo reclama para siempre. */
const HAL_SEED=1013031;
function halRng(s){let a=s>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let HALP=null;function halPlan(){if(HALP)return HALP;const r=halRng(HAL_SEED),pz=[];for(let i=0;i<3;i++)pz.push('S');for(let i=0;i<3;i++)pz.push('G1');for(let i=0;i<12;i++)pz.push('M');for(let i=0;i<20;i++)pz.push('g');for(let i=0;i<10;i++)pz.push('I');for(let i=0;i<52;i++)pz.push('C');
 for(let i=pz.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[pz[i],pz[j]]=[pz[j],pz[i]]}
 let sk=0;return HALP=pz.map((p,j)=>{const rv=halRng(HAL_SEED*7+j*131+5);let k='';if(p==='S'){sk++;k='tk'+sk}return{p,k,v:p==='g'?20000+5000*Math.floor(rv()*17):p==='C'?150+10*Math.floor(rv()*26):0}})}
const halDB=()=>S.DB.hal||(S.DB.hal={c:{}});
ops['hal.state']=(u,m)=>({ok:1,c:Object.keys(halDB().c).map(Number)});
ops['hal.find']=(u,m)=>{const a=E.acct(u),j=Math.floor(+m.j),p=String(m.p||'');
 if(!halOn())return err('El evento de Halloween no está activo');
 if(!(j>=0&&j<100))return err('Tesoro no válido');
 const pl=halPlan()[j];if(pl.p!==p)return err('Tesoro no válido');
 const D=halDB(),cl=D.c[j];if(cl){if(cl.u===u)return{ok:1,dup:1};return err('Otro jugador ya reclamó este tesoro (cada cofre es único)')}
 const H=a.hl||(a.hl={f:{},n:{},ts:0}),now=Date.now();if(now-(H.ts||0)<2000)return err('Cavando demasiado rápido: espera un momento');
 D.c[j]={u,n:String(a.nm||'').slice(0,20),t:now,p};H.f[j]=1;H.n[p]=(H.n[p]|0)+1;H.ts=now;S.dirty();
 if(p==='C'){E.deliver(u,{ec:{k:'hl',q:pl.v},note:'🎃 Tesoro de Halloween: +'+pl.v+' calabazas'});S.log('[halloween] '+(a.nm||u)+' abrió el tesoro #'+j+' (C)');return{ok:1,c:pl.v}}
 if(p==='S'){a.tks=Array.isArray(a.tks)?a.tks:[];if(!a.tks.includes(pl.k))a.tks.push(pl.k);E.pushEnt(u);S.log('[halloween] '+(a.nm||u)+' atuendo '+pl.k);return{ok:1,ent:E.ent(u)}}
 if(p==='I'){S.log('[halloween] '+(a.nm||u)+' abrió el tesoro #'+j+' (objeto)');return{ok:1}}
 const gold=p==='G1'?25e4:p==='g'?pl.v:0,gem=p==='M'?2:0;
 if(gold)E.deliver(u,{gold,note:'🎃 Tesoro de Halloween: +'+gold.toLocaleString('es')+' 🪙'});
 if(gem)E.grantGems(u,gem,'own','tesoro de Halloween');
 S.log('[halloween] '+(a.nm||u)+' abrió el tesoro #'+j+' ('+p+')');return{ok:1,g:gold,m:gem}};
ops['gem.log']=(u)=>{const a=E.acct(u);return{ok:1,own:a.gem.own,tr:a.gem.tr,l:(a.gl||[]).slice(-25).reverse()}};
ops['buff.gold']=(u,m)=>{const a=E.acct(u),now=Date.now(),c0=blGold(a.lv),c=c0+TAXP(c0);if(m.k!=='bl')return err('Servicio no válido');
 if((a.px.bl||0)>now)return err('Ya tienes una Bendición activa');if(E.avail(a,'gold')<c)return err('⚠️ Oro insuficiente: te faltan '+(c-E.avail(a,'gold'))+' 🪙');
 E.deliver(u,{gold:-c,note:'🙏 Bendición (30 días o hasta tu próxima muerte, +3% impuesto)'});a.px.bl=now+30*DAY;S.dirty();E.pushEnt(u);return{ok:1,ent:E.ent(u),cost:c}};
ops['bl.lose']=(u)=>{const a=E.acct(u);if((a.px.bl||0)>Date.now()){a.px.bl=0;S.dirty();E.pushEnt(u)}return{ok:1,ent:E.ent(u)}};
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
/* ===== v319: Influencers. Código de referido -> boletos de VIP/Exp de 7 días por jugadores válidos (nivel 20) ===== */
const INF_LV=15,INF_AGE=6*36e5,INF_IPMAX=3,INF_DAY=30,INF_VIP_N=10,INF_EXP_N=5;/* cada 10: 1 VIP 7 d + Bonus Vida 2 h + Bonus Defensa 2 h; cada 5: Bonus Exp 2 h */
const infDB=()=>{S.DB.inf=S.DB.inf||{};return S.DB.inf};
const infCode=c=>String(c||'').toUpperCase().replace(/[^A-Z0-9_]/g,'').slice(0,16);
S.refSeen=(u,a)=>{try{const ac=S.ACC&&S.ACC[u],c=ac&&ac.rf;if(!c||a.rfd||(a.lv|0)<INF_LV||S.isMaster(u))return;const d=infDB(),i=d[c];
  /* antifraude: la cuenta debe tener 6 h de vida, sin sospechas del anticheat, máx. 3 por conexión y 30 por día por influencer */
  if(Date.now()-(+ac.ts||+a.created||0)<INF_AGE)return;a.rfd=1;if((a.strikes|0)>=3||!i||!i.u||i.u===u){S.dirty();return}
  const ri=ac.ri||'',dy=Math.floor(Date.now()/864e5);i.ips=i.ips||{};if(ri&&(i.ips[ri]|0)>=INF_IPMAX){S.log('[influencer] '+c+': demasiadas cuentas desde la misma conexión');S.dirty();return}
  if(i.dy!==dy){i.dy=dy;i.dn=0}if((i.dn|0)>=INF_DAY){S.log('[influencer] '+c+': tope diario');S.dirty();return}i.dn=(i.dn|0)+1;if(ri)i.ips[ri]=(i.ips[ri]|0)+1;
  i.ok=(i.ok|0)+1;const w=Math.floor(i.ok/INF_VIP_N)-(i.gv|0),x=Math.floor(i.ok/INF_EXP_N)-(i.ga|0),b=E.acct(i.u);if(!b)return;const t=tkOf(b);
  if(w>0){t.vpw=(t.vpw|0)+w;t.bx2=(t.bx2|0)+w;t.bx3=(t.bx3|0)+w;i.gv=(i.gv|0)+w}if(x>0){t.bx0=(t.bx0|0)+x;i.ga=(i.ga|0)+x}
  S.dirty();E.pushEnt(i.u);const msg='⭐ Un jugador nuevo llegó a nivel '+INF_LV+' con tu código '+c+' ('+i.ok+' en total)'+(w>0?' · +'+w+' 🎟️ VIP 7 días, +'+w+' Bonus Defensa 2 h y +'+w+' Bonus Vida 2 h':'')+(x>0?' · +'+x+' 🎟️ Bonus Exp 2 h':'');
  if(S.online(i.u))S.push(i.u,{t:'note',m:msg,tk:1});else E.deliver(i.u,{note:msg});S.log('[influencer] '+c+' → '+i.ok+' válidos')}catch(e){S.log('[influencer] error '+e.message)}};
ops['inf.new']=(u,m)=>{if(!S.isMaster(u))return err('Solo el master');const c=infCode(m.code),o=E.uidByName(m.name);if(c.length<3)return err('Código de 3 a 16 letras o números');if(!o)return err('No hay ningún jugador con ese nombre');const d=infDB();if(d[c]&&d[c].u!==o)return err('Ese código ya es de otro influencer');
 d[c]=d[c]||{ok:0,gv:0,ga:0,ts:Date.now()};d[c].u=o;d[c].n=E.acct(o).nm||m.name;const bd=(S.DB.cfg.badges=S.DB.cfg.badges||{});if(!bd[o])bd[o]='inf';S.dirty();S.log('[influencer] código '+c+' → '+d[c].n);return{ok:1}};
ops['inf.del']=(u,m)=>{if(!S.isMaster(u))return err('Solo el master');const c=infCode(m.code),d=infDB();if(!d[c])return err('Ese código no existe');delete d[c];S.dirty();return{ok:1}};
ops['inf.list']=(u)=>{if(!S.isMaster(u))return err('Solo el master');const d=infDB();return{ok:1,lv:INF_LV,vn:INF_VIP_N,en:INF_EXP_N,l:Object.keys(d).map(c=>({c,n:d[c].n,ok:d[c].ok|0,gv:d[c].gv|0,ga:d[c].ga|0}))}};
ops['inf.me']=(u)=>{const d=infDB(),l=Object.keys(d).filter(c=>d[c].u===u).map(c=>({c,ok:d[c].ok|0,gv:d[c].gv|0,ga:d[c].ga|0}));return{ok:1,lv:INF_LV,vn:INF_VIP_N,en:INF_EXP_N,l}};

/* ===== v325: Mina de la Gran Montaña. Las vetas son compartidas por todo el servidor: quien extrae una la deja vacía 90 días para TODOS ===== */
const MN_DAYS=90,MN_NODES=60,MN_FL=12,MN_HOUR=60,MN_DAY=200,MN_GAP=1800;
const mnDB=()=>{S.DB.mn=S.DB.mn||{};return S.DB.mn};
const mnClean=()=>{const d=mnDB(),n=Date.now(),L=MN_DAYS*864e5;for(const k of Object.keys(d))if(n-d[k]>L)delete d[k]};
ops['mine.get']=(u,m)=>{const f=Math.floor(+m.f);if(!(f>=1&&f<=MN_FL))return err('Piso inválido');mnClean();const d=mnDB(),l=[];for(const k of Object.keys(d)){const i=k.indexOf(':');if(+k.slice(0,i)===f)l.push(+k.slice(i+1))}return{ok:1,l,days:MN_DAYS}};
ops['mine.take']=(u,m)=>{const f=Math.floor(+m.f),i=Math.floor(+m.i);if(!(f>=1&&f<=MN_FL&&i>=0&&i<MN_NODES*4))return err('Veta inválida');const a=E.acct(u),n=Date.now(),h=Math.floor(n/36e5),dy=Math.floor(n/864e5);
 /* antiabuso: nadie puede vaciar la mina sin picar de verdad (ritmo máximo por hora y por día) */
 if(n-(a.mnT||0)<MN_GAP)return err('Pica con calma: espera un instante');a.mnT=n;
 if(!a.mnh||a.mnh[0]!==h)a.mnh=[h,0];if(!a.mnd||a.mnd[0]!==dy)a.mnd=[dy,0];if(a.mnh[1]>=MN_HOUR)return err('Tus brazos están cansados: descansa un poco antes de seguir minando');if(a.mnd[1]>=MN_DAY)return err('Ya extrajiste muchísimo hoy: vuelve mañana');
 mnClean();const d=mnDB(),k=f+':'+i;if(d[k])return{ok:0,gone:1};d[k]=n;a.mnh[1]++;a.mnd[1]++;S.dirty();S.log('[mina] '+(a.nm||a.pn||u)+' extrajo la veta '+k);return{ok:1}};

return{ops,price,GEMP}};
