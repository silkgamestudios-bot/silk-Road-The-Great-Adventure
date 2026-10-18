/* Tienda del servidor: apariencias, servicios (buffs), gemas, nombres y entitlements. Precios y reglas SOLO viven aquí. */
module.exports=function(S,E){
const cat=S.cat,SK=cat.SKINS,EVK=E.EVK;
const GEMP={lt:3,ap:2,bl:4,es:3,cmb:5,lic:10,vipm:15,vipj:6,vip:11},GMON=['cmb','es','lic','vipm','vipj'],GEMSKIN=12,LIC_LV=15,GCMB=['lt','ap'],PRMK=['lt','ap','bl','es'],DAY=864e5;
const price=(k,d)=>{const b=GEMP[k]||0;if(GMON.includes(k)){if(k==='es'||d>=30)return b;return Math.min(b-1,Math.max(1,Math.round(b*d/30*1.3)))}if(d<=10)return b;return Math.max(1,Math.round(b*(d/10)*.8))};
const blGold=lv=>Math.round(2000*Math.pow(1.28,Math.min(29,Math.max(0,lv-1))));
const NAME_GOLD=2000,err=e=>({e});const ops={};
ops['me.get']=(u)=>({ok:1,ent:E.ent(u)});
ops['name.claim']=(u,m)=>{const r=E.claimName(u,m.name);if(r.e)return r;E.pushEnt(u);return{ok:1,nm:r.nm}};
/* ---- Ranking: los 100 mejores por nivel o por habilidad, global o por clase. Lo calcula el servidor con datos ya validados ---- */
const RKC={};
function rkList(cc,k){const key=cc+'|'+k,h=RKC[key],t=Date.now();if(h&&t-h.t<45e3)return h.l;
 const l=[];for(const u in S.ECO.acc){const a=S.ECO.acc[u];if(!a||!a.nm||!(a.cls>=0)||(cc>=0&&a.cls!==cc)||(a.strikes|0)>=3)continue;let mst=false;try{mst=S.isMaster(u)}catch(e){}if(mst)continue;
  const sx=Array.isArray(a.sx)?a.sx:[1,1,1];l.push({u,n:a.nm,c:a.cls|0,l:a.lv|0,x:a.xp||0,s:[sx[0]|0||1,sx[1]|0||1,sx[2]|0||1],g:(S.tagOf&&S.tagOf(u))||''})}
 const v=k==='lv'?(x=>0):k==='st'?(x=>x.s[0]+x.s[1]+x.s[2]):(x=>x.s[+k[1]]);
 l.sort((p,q)=>k==='lv'?(q.l-p.l||q.x-p.x):(v(q)-v(p)||q.l-p.l||q.x-p.x));RKC[key]={t,l};return l}
ops['rank.get']=(u,m)=>{const c=Math.floor(+m.c),cc=c>=0&&c<=7?c:-1,k=['lv','s0','s1','s2','st'].includes(m.k)?m.k:'lv',l=rkList(cc,k);
 const i=l.findIndex(x=>x.u===u);return{ok:1,n:l.length,me:i>=0?i+1:0,l:l.slice(0,100).map(x=>({n:x.n,c:x.c,l:x.l,s:x.s,g:x.g,me:x.u===u?1:0}))}};
ops['name.change']=(u,m)=>{const a=E.acct(u),first=(a.nch|0)===0,n=String(m.name||'').trim().replace(/\s+/g,' ');
 if(!/^[\p{L}\p{N} _-]{3,14}$/u.test(n))return err('Usa de 3 a 14 letras, números, espacios, - o _');
 if(a.nm&&a.nm===n)return err('Ese ya es tu nombre');const o=E.uidByName(n);if(o&&o!==u)return err('Ese nombre ya está en uso');
 if(first){if(E.avail(a,'gold')<NAME_GOLD)return err('Te faltan '+(NAME_GOLD-E.avail(a,'gold'))+' 🪙')}else if(E.gTot(a)<1)return err('Necesitas 1 💎');
 if(first)E.deliver(u,{gold:-NAME_GOLD,note:'✏️ Cambio de nombre'});else if(!E.spendGems(a,1,false))return err('Saldo insuficiente');
 const r=E.claimName(u,n,1);if(r.e)return r;a.nch=(a.nch|0)+1;S.dirty();E.pushEnt(u);S.log('[nombre] '+u+' → '+n);return{ok:1,nm:r.nm,ent:E.ent(u)}};
ops['skin.buy']=(u,m)=>{const q=SK[String(m.id||'')],a=E.acct(u);if(!q)return err('Apariencia desconocida');if(a.sk.includes(q.id))return err('Ya la tienes');
 if(E.gTot(a)<q.g)return err('Te faltan '+(q.g-E.gTot(a))+' 💎');if(!E.spendGems(a,q.g,false))return err('Saldo insuficiente');a.sk.push(q.id);S.dirty();E.pushEnt(u);S.log('[tienda] '+(a.nm||u)+' compró '+q.id);return{ok:1,ent:E.ent(u)}};
ops['evskin.gem']=(u,m)=>{const k=String(m.k||''),a=E.acct(u);if(!EVK.includes(k))return err('Evento desconocido');if(a.ev.includes(k))return err('Ya lo tienes');
 if(!E.spendGems(a,GEMSKIN,false))return err('Te faltan '+(GEMSKIN-E.gTot(a))+' 💎');a.ev.push(k);S.dirty();E.pushEnt(u);return{ok:1,ent:E.ent(u)}};
ops['evskin.coin']=(u,m)=>{const k=String(m.k||''),a=E.acct(u);if(!EVK.includes(k))return err('Evento desconocido');if(a.ev.includes(k))return err('Ya lo tienes');
 if(E.avail(a,'ec',k)<300)return err('Te faltan monedas de evento (sincroniza e inténtalo de nuevo)');E.deliver(u,{ec:{k,q:-300},note:'🎭 Atuendo de evento comprado'});a.ev.push(k);S.dirty();E.pushEnt(u);return{ok:1,ent:E.ent(u)}};
ops['buff.buy']=(u,m)=>{const a=E.acct(u),now=Date.now();let k=String(m.k||''),d=+m.d||null;if(!GEMP[k]||k==='vip')return err('Servicio desconocido');
 if(d==null)d=GMON.includes(k)?30:10;if(![10,20,30].includes(d))d=GMON.includes(k)?30:10;if(k==='es')d=30;
 const vm=k==='vipm',vj=k==='vipj',vip=vm||vj,cmb=k==='cmb',lc=k==='lic',ks=vm?['lt','ap','bl','es']:vj?['lt','ap','bl']:cmb?GCMB:lc?[]:[k],cost=price(k,d);
 if(!cost||!ks.every(z=>PRMK.includes(z)))return err('Servicio no válido');
 if((vm||lc)&&(a.cls!==0||a.lv<LIC_LV))return err(a.cls!==0?'Solo disponible para la clase Mercader':'Necesitas nivel '+LIC_LV);
 if(ks.some(z=>Math.max(now,a.px[z]||0)-now+d*DAY>90*DAY)||((vm||lc)&&Math.max(now,a.lic||0)-now+d*DAY>90*DAY)||(vip&&Math.max(now,a.vip||0)-now+d*DAY>90*DAY))return err('Máximo 90 días acumulados');
 if(!E.spendGems(a,cost,true))return err('Te faltan '+(cost-a.gem.own)+' 💎 propias (las transferidas solo valen para apariencias)');
 ks.forEach(z=>{a.px[z]=Math.max(now,a.px[z]||0)+d*DAY});if(vm||lc)a.lic=Math.max(now,a.lic||0)+d*DAY;if(vip)a.vip=Math.max(now,a.vip||0)+d*DAY;
 S.dirty();E.pushEnt(u);S.log('[tienda] '+(a.nm||u)+' compró '+k+' '+d+'d');return{ok:1,ent:E.ent(u),cost}};
ops['buff.gold']=(u,m)=>{const a=E.acct(u),now=Date.now(),c=blGold(a.lv);if(m.k!=='bl')return err('Servicio no válido');
 if(Math.max(now,a.px.bl||0)-now+10*DAY>90*DAY)return err('Máximo 90 días acumulados');if(E.avail(a,'gold')<c)return err('Te faltan '+(c-E.avail(a,'gold'))+' 🪙');
 E.deliver(u,{gold:-c,note:'🙏 Bendición +10 días'});a.px.bl=Math.max(now,a.px.bl||0)+10*DAY;S.dirty();E.pushEnt(u);return{ok:1,ent:E.ent(u),cost:c}};
ops['gem.tx']=(u,m)=>{const a=E.acct(u),q=Math.floor(+m.q);if(!(q>=1&&q<=1e6))return err('Cantidad inválida');let to=String(m.to||'').trim();
 const t=S.ECO.acc[to]?to:E.uidByName(to);if(!t||t===u)return err('Jugador no encontrado (usa su nombre exacto o su código)');
 if(E.gTot(a)<q)return err('Saldo insuficiente');E.spendGems(a,q,false);const b=E.acct(t);b.gem.tr+=q;S.dirty();E.pushEnt(u);E.pushEnt(t);
 S.push(t,{t:'note',m:'💎 '+(a.nm||'Un jugador')+' te envió '+q+' gemas (solo para apariencias)'});S.log('[gemas] '+(a.nm||u)+' → '+(b.nm||t)+' '+q);return{ok:1,ent:E.ent(u)}};
return{ops,price,GEMP}};
