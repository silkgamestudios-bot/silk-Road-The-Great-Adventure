/* v390: JUGABILIDAD · botín igual al programado (ver reward). */
/* Mundo online (cliente): posición, enemigos compartidos y botín vienen del servidor.
   Si el servidor no tiene mundo (falta world.json), el juego sigue en modo local sin cambios. */
(function(){
const N=window.SRNET;if(!N)return;
let uwJ=0,WBAD=0,on=0,OT={},WQ=[],lx=0,ly=0,ft=0,OFX=[],SM=[],LS=0;   // SM: id del servidor → enemigo (solo los 'base'); LS: último snapshot
const ready=()=>P&&P.chosen&&P.name;
const SKIP=e=>e.boss||e.guard||e.wild||e.tmp||e.alpha||e.vec||e.tpl||e.nsp;
/* Solo se congelan los enemigos BASE (índice < n, los que el servidor conoce). Los creados durante la partida
   (cuevas/torre, súbditos, estatua zodiacal, dragón, depredador…) se quedan en modo local: si los congelaba al
   reconectar, el servidor no los conocía y quedaban eternamente al 1% de vida sin poder morir. */
function dynClr(){for(let i=E.length-1;i>=0;i--)if(E[i].dyn)E.splice(i,1);NR=NR.filter(e=>!e.dyn)}
function dynMk(d){if(SM[d[0]])return;const ty=d[3]|0,e={dyn:1,sync:1,sid:d[0],stun:1e9,lt:Date.now(),ty,hx:d[6],hy:d[7],x:d[9]!=null?d[9]:d[6],y:d[10]!=null?d[10]:d[7],t:0,dead:0};e.mx=e.hp=mobHP(ty);e.sp=(66+ty*2.5)*.75;try{applyVar(e,d[1])}catch(x){}
 e.mx=d[4];e.hp=d[8];if(d[2])e.nm=d[2];if(d[5])e.wsc=d[5];if(d[1]=='wwolf'){e.ww=1;e.nv=10}e.srvk=d[11]|0;if(d[12]>0)e.nv=d[12]|0;/* v433: nivel del monstruo según el servidor *//* v390: JUGABILIDAD · clase del monstruo según el servidor: 1 horda del evento, 2 cazador, 3 jefe */SM[d[0]]=e;E.push(e);NR.push(e)}
function dynRm(id){const e=SM[id];if(!e)return;const i=E.indexOf(e);if(i>=0)E.splice(i,1);NR=NR.filter(q=>q!==e);SM[id]=null}
window.SRWON=()=>on;
function freeze(n){const t=Date.now();dynClr();SM=[];E.forEach((e,i)=>{if(i>=n||SKIP(e))return;e.sid=i;e.sync=1;e.stun=1e9;e.lt=t;SM[i]=e})}   // la IA local se apaga: manda el servidor
N.onopen=()=>{uwJ=0;on=0;WBAD=0;PV.on=0;PV.t=null};
N.onmsg=m=>{
 if(m.t=='wnc'){try{window.SREST&&SREST.msg(m)}catch(e){}return}   /* v391: ANTORCHA: lista de antorchas clavadas de mi zona */
 if(m.t=='wnq'){try{window.SREST&&SREST.ans(m)}catch(e){}return}   /* v391: ANTORCHA: respuesta a «clavar» */
 if(m.t=='wsd'){try{sqShout(m)}catch(e){}return}
 if(m.t=='wsx'){try{xRecv(m)}catch(e){}return}
 if(m.t=='wss'){try{xState(m)}catch(e){}return}
 if(m.t=='wsp'){try{xPos(m)}catch(e){}return}
 if(m.t=='wi'){let sg=0,n=m.n|0;if(m.sg!=null&&n>0&&E.length>=n){for(let i=0;i<n;i++){const e=E[i];sg=(!e||SKIP(e)||e.dg)?(Math.imul(sg,31)+3)|0:(Math.imul(sg,31)+Math.round(e.hx)*7+Math.round(e.hy)*13+(e.ty|0)*17+1)|0}}
  if(m.sg!=null&&(E.length<n||sg!==(m.sg|0))){on=0;WBAD=1;console.log('mundo: versión distinta',n,E.length,sg,m.sg);try{if(typeof UPDV!=='undefined')UPDV.wbad()}catch(e){}/* v268: aviso quitado; v438: AVISA y se actualiza solo (un celular con versión vieja no veía los mismos enemigos que sus compañeros) */}
  else{on=1;WBAD=0;freeze(n);toast('🌐 Mundo online conectado',2200)}}
 else if(m.t=='wx'){on=0;dynClr()}
 else if(m.t=='wp'){P.x=m.x;P.y=m.y}
 else if(m.t=='wd'){if(on&&P.hp>0&&!modal){P.hp-=mountAbs(m.d*(P.sh>0?.3:1)*(P.cls==1?knRes():1));if(P.hp<=0)die()}}
 else if(m.t=='ws')snap(m);
 else if(m.t=='wpv'){PV.on=m.on?1:0;if(!PV.on)PV.t=null;if(m.e)toast(m.e,3800);pvSync();pvBtn()}
 else if(m.t=='wpd'){PVHIT=Date.now();try{pvNear(m.by)}catch(e){}if(P.hp>0&&!modal&&!AR.on){const d=mountAbs(m.d*(P.sh>0?.3:1)*(P.cls==1?knRes():1));P.hp-=d;if(FT.length<60)FT.push({x:P.x,y:P.y-26,t:.9,d:0,o:0,k:'dm',s:'-'+Math.round(d),c:'#ff6a6a'});if(P.hp<=0)die()}}
 else if(m.t=='wph'){const o=OT[m.u]||(String(m.u)[0]=='L'&&AR.lm&&AR.lm[String(m.u).slice(1)]);if(FT.length<60)FT.push({x:o?o.rx:P.x,y:(o?o.ry:P.y)-30,t:.9,d:0,o:0,k:'dm',s:String(m.d),c:'#ffb36a'})}
 else if(m.t=='wpk'){pvKillMsg(m)}
 else if(m.t=='wbt'){try{btyNotify(m.b)}catch(e){}}
 else if(m.t=='wsv'){try{window.SRSV&&SRSV(m)}catch(e){}}
 else if(m.t=='wtp'||m.t=='wts'||m.t=='wtd'){try{window.SRTZ&&SRTZ.msg(m)}catch(e){}}
 else if(m.t=='wubd'){try{window.SRUBD&&SRUBD(m)}catch(e){}}
 else if(m.t=='wc'||m.t=='wcs'||m.t=='wcd'||m.t=='wck'||m.t=='wcm'||m.t=='wch'||m.t=='wco'||m.t=='wce')arMsg(m);
 else if(m.t=='wk')reward(m);
 else if(m.t=='wl')try{corpseRes(m)}catch(e){}
 else if(m.t=='wlx'){for(const c of CORPSES)if(c.sid===m.id)c.lt=1}};
/* ===== PvP abierto (v148) ===== */
const PV={on:0,t:null,sent:0},G0={pvg:1,u:'',nm:'',x:0,y:0,hp:1,mx:1,dead:1e9,ty:0,stun:0,rw:0,nv:1,sp:0,mov:0,hx:0,hy:0};PVG.push(G0);
/* v287: si alguien te ataca en PvP, el objetivo pasa al enemigo PvP más cercano (o al atacante si está igual de cerca) */
function pvNear(by){if(!PV.on||AR.on)return;let b=null,bd=1e9,ad=1e9;for(const u in OT){const o=OT[u];if(!o.pvp||!(o.hp>0))continue;const d=Math.hypot(o.rx-P.x,o.ry-P.y);if(u===by)ad=d;if(d<bd){bd=d;b=u}}if(by&&OT[by]&&OT[by].pvp&&ad<=bd*1.35+30)b=by;if(!b||b===PV.t)return;if(Math.hypot(OT[b].rx-P.x,OT[b].ry-P.y)>700)return;PV.t=b;pvSync();toast('🎯 Te atacan: objetivo → '+OT[b].nm,1800)}
function pvKillMsg(m){const _o=PV.t&&OT[PV.t];PV.t=null;pvSync();if(m.me){toast('☠️ '+m.by+' te venció en PvP. Sin penalización. Ve al 🏹 Gremio de Cazadores y pon una recompensa por su cabeza.',8000);vib([80,40,120]);return}
 const r=m.r||{};let t='⚔️ ¡Venciste a '+m.v+'!';if(r.n)t+=' 🎯 Recompensa cobrada:'+(r.g?' +'+fmt(r.g)+' 🪙':'')+(r.m?' +'+r.m+' 💎':'')+((r.its||[]).length?' 🎁 '+r.its.join(', '):'');toast(t,7000);vib([60,40,60,40,100]);try{window.SRCP&&SRCP.hero&&SRCP.hero(_o?_o.rx:P.x,_o?_o.ry:P.y,_o?_o.lv:P.lv,m.v)}catch(e){}}
function pvSync(){const o=PV.t&&OT[PV.t],Ln=PV.t&&PV.t[0]=='L'&&AR.lm&&AR.lm[PV.t.slice(1)];if(PV.on&&Ln&&Ln.hp>0){G0.u=PV.t;G0.nm='🦁 León';G0.x=Ln.rx;G0.y=Ln.ry;G0.hx=Ln.rx;G0.hy=Ln.ry;G0.hp=Ln.hp;G0.mx=Math.max(1,Ln.mhp);G0.dead=0}else if(PV.on&&o&&o.pvp&&o.hp>0){G0.u=PV.t;G0.nm=o.nm;G0.x=o.rx;G0.y=o.ry;G0.hx=o.rx;G0.hy=o.ry;G0.hp=o.hp;G0.mx=Math.max(1,o.mhp);G0.dead=0}else{G0.dead=1e9;if(PV.t&&!o&&!Ln)PV.t=null}pvBar()}
function pvStrike(e,dm){if(!PV.on||e.u!==PV.t)return;const n=Date.now();if(n-PV.sent<110)return;PV.sent=n;N.send({t:'wph',u:e.u,w:Math.round(Math.min(4,Math.max(.3,dm/Math.max(1,dmg())))*100)/100})}
function pvBtn(){const c=document.getElementById('rc')||document.getElementById('ctx');if(!c)return;let b=document.getElementById('pvb');if(!b){b=document.createElement('button');b.id='pvb';b.hidden=true;b.setAttribute('aria-label','Activar o desactivar PvP');b.addEventListener('click',()=>{if(!on){toast('El PvP necesita el mundo online conectado',2500);return}N.send({t:'wpv',on:PV.on?0:1})});const rw=document.querySelector('#rc .rrow'),mb=document.getElementById('mapb');if(rw&&mb)rw.insertBefore(b,mb);else c.appendChild(b)}
 const show=on&&!(typeof DG!=='undefined'&&DG.f)&&!modal;b.hidden=!show;if(show){b.textContent='💀';b.title=PV.on?'PvP activado':'PvP desactivado';b.classList.toggle('on',!!PV.on);const rw=document.querySelector('#rc .rrow'),mb=document.getElementById('mapb');if(rw&&mb&&b.parentNode!==rw)rw.insertBefore(b,mb)}}
function pvBar(){let el=document.getElementById('pvt');if(!el){el=document.createElement('div');el.id='pvt';el.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:46px;z-index:31;font:700 12px Georgia,serif;color:#fff;background:#3a0d0dcc;border:2px solid #ff4a3a;border-radius:12px;padding:4px 10px;display:none;min-width:150px;text-align:center';el.addEventListener('click',()=>{PV.t=null;pvSync()});document.body.appendChild(el)}
 if(PV.on&&PV.t&&G0.dead<=0){el.style.display='block';const p=Math.max(0,Math.min(1,G0.hp/G0.mx));el.innerHTML='🎯 '+(String(G0.nm).replace(/[<>&]/g,''))+' <small>(toca para soltar)</small><div style="height:6px;background:#0008;border-radius:3px;margin-top:3px"><i style="display:block;height:6px;width:'+Math.round(p*100)+'%;background:#ff5a4a;border-radius:3px"></i></div>'}else el.style.display='none'}
setInterval(()=>{if(PV.t&&G0.dead<=0){const o=OT[PV.t]||(PV.t[0]=='L'&&AR.lm&&AR.lm[PV.t.slice(1)]);if(o){G0.x=o.rx;G0.y=o.ry;if(o.mhp)G0.hp=o.hp}}pvBtn()},120);
window.SRBD=u=>(OT[u]&&OT[u].bd)||'';window.SRCH=u=>!!(OT[u]&&OT[u].ch);window.SRCHME=()=>!!(window.__chn&&typeof P!='undefined'&&P.name&&window.__chn===P.name);window.SRLIONS=()=>AR.lm;window.SRLION=(x,y)=>{if(!AR.on||AR.out||AR.spec||!PV.on)return 0;let b=null,bd=40;for(const k in(AR.lm||{})){const o=AR.lm[k],d=Math.hypot(o.rx-x,o.ry-y+24);if(d<bd){bd=d;b=k}}
 if(!b){for(const u in OT){const o=OT[u];if(!o.pvp||!(o.hp>0))continue;if(Math.abs(o.rx-x)<24&&Math.abs(o.ry-y+4)<32){if(PV.t===u){PV.t=null;pvSync();toast('🎯 Objetivo liberado',1500)}else{PV.t=u;AR.lkp=1;pvSync();toast('🎯 Objetivo fijado: '+o.nm,2000)}return 1}}return 0}if(PV.t==='L'+b){PV.t=null;pvSync();toast('🎯 Objetivo liberado',1500);return 1}PV.t='L'+b;pvSync();toast('🦁 ¡León fijado como objetivo! Ataca para abatirlo.',2500);return 1};
window.SRPVP={click:(u,o)=>{if(!PV.on||!o.pvp)return 0;if(PV.t===u){PV.t=null;pvSync();toast('🎯 Objetivo liberado',1500);return 1}PV.t=u;pvSync();toast('🎯 Objetivo fijado: '+o.nm+' · ataca tú: el objetivo se queda fijo',2600);return 1},on:()=>PV.on};
function snap(m){const seen={};if(m.ud){try{window.SRUD&&SRUD(m.ud)}catch(e){}}
 for(const a of m.pl){const o=OT[a[0]]||(OT[a[0]]={rx:a[4],ry:a[5]});Object.assign(o,{nm:a[1],c:a[2],lv:a[3],x:a[4],y:a[5],hp:a[6],mhp:a[7],pt:a[8],gt:a[9]||'',bs:a[10]||'',pvp:a[11]|0,wn:a[12]|0,bd:a[13]||'',ch:a[14]|0,mo:a[15]||''});seen[a[0]]=1}
 for(const u in OT)if(!seen[u])delete OT[u];
 if(m.dx)for(const id of m.dx)dynRm(id);if(m.dd&&!(typeof DG!=='undefined'&&DG.f))for(const d of m.dd)dynMk(d);
 LS=Date.now();if(typeof DG!=='undefined'&&DG.f)m.mb=[];for(const b of m.mb){const e=SM[b[0]];if(!e)continue;if(!e.sync){e.sync=1;e.sid=b[0];e.stun=1e9;e.gs=0}e.lt=LS;if(b[4]){e.hp=0;e.dead=1e9;if(b[4]===2)e._al=0;continue}   /* v433: 2 = retirado del mundo (territorio de mini-jefe): sin cadáver ni 💰 */
  if(e.dead>0)e.dead=0;e.stun=1e9;const dx=b[1]-e.x,dy=b[2]-e.y;e.mov=Math.abs(dx)+Math.abs(dy)>.5?1:0;
  if(e.mov)e.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');if(Math.abs(dx)+Math.abs(dy)>220){e.x=b[1];e.y=b[2]}else{e.gx=b[1];e.gy=b[2];e.gs=1}e.hp=b[3]}
 if(m.hv)for(const h of m.hv){if(FT.length>=60)break;FT.push({x:h[3]+Math.random()*14-7,y:h[4]-14,t:.9,d:0,o:0,k:'dm',s:String(h[1]),c:'#8fd8ff'})}
 if(m.at){const n=Date.now();for(const a of m.at)OFX.push({u:a[0],k:a[1],a:a[2],x:a[3],y:a[4],t:n,ty:a[6]||'',r:a[7]|0});if(OFX.length>80)OFX.splice(0,OFX.length-80)}pvSync()}
function reward(m){const t=[],g=Math.round(m.g*goldM()*(1+eqT().gd/100)),auto=typeof pa==='function'&&pa('lt');
 /* v390: BOTÍN COMO LO PROGRAMADO. El servidor decide qué cae; aquí se genera igual que sin conexión según el monstruo que murió:
    el objeto sale de su nivel (antes: siempre un común nivel 1 que valía 324 🪙 sin importar el monstruo), más poción de MP, carne, calabazas/monedas de evento, materiales (pieles, telas), bolsos, tareas y encargo. */
 const ty=Math.max(0,Math.min(8,m.ty|0)),en=SM[m.mid],pe={x:en?en.x:P.x,y:en?en.y:P.y,ty,rw:en&&en.rw!=null?en.rw:(m.rw||1),v:(en&&en.v)||m.v||null,evt:((en&&en.srvk===1)||m.k==='wave')?1:0},PMX=typeof POTMAX=='number'?POTMAX:800;
 /* El VIP Loot automático es el único que recoge sin pulsar 🎁 Tomar. Sin VIP, oro y equipo común quedan en el suelo. La recogida manual usa grab() y lootAdd(), que manda equipo común a P.lb. */
 let ground=null;
 if(g>0){if(auto&&LF&&LF.gd){P.gold+=g;t.push('+'+g+' 🪙')}else{ground={x:P.x+Math.random()*18-9,y:P.y+Math.random()*18-9,gd:g,it:null,l:120};t.push('🪙 '+g+' en el suelo')}}
 if(m.x>0){gainXp(m.x);t.push('+'+m.x+' XP')}
 if(m.own){try{P.st.all++;P.st.k[m.ty]=(P.st.k[m.ty]||0)+1;pqEvt('kill',m.ty);hzEvt(m.ty);if(pe.v){pqEvt('kv',pe.v);const vk=P.st.vk||(P.st.vk={});vk[pe.v]=(vk[pe.v]|0)+1}try{cazEvt({v:pe.v,ty:m.ty})}catch(e){}}catch(e){}
  try{slKill(pe)}catch(e){}/* v396: colmillo de chacal para Mei también jugando en línea */
  try{TD.forEach((d,i)=>{if(tv(i)==tg(i))toast('📜 ¡Tarea lista: '+d[0]+'!',3000)})}catch(e){}
  try{if(qst&&qst.t=='k'&&qst.got<qst.n){qst.got++;if(qst.got>=qst.n)toast('Encargo listo: vuelve con el Gobernador',3000)}}catch(e){}}
 if(m.pot&&typeof P.pot=='number'&&P.pot<PMX){P.pot++;try{SES.pt++;flAdd('pot',1)}catch(e){}if(FT.length<60)FT.push({x:pe.x,y:pe.y-26,t:1.8,d:.2,o:0,k:'xp',s:'+1 🧪 poción',c:'#ff9ad5'})}
 if(m.mpt&&typeof P.mpot=='number'&&P.mpot<PMX){P.mpot++;try{SES.pt++}catch(e){}if(FT.length<60)FT.push({x:pe.x,y:pe.y-38,t:1.8,d:.2,o:0,k:'xp',s:'+1 💧 poción MP',c:'#7ac8ff'})}
 if(m.meat){try{dropMeat(pe.x,pe.y,1)}catch(e){}}
 if(m.own){for(const f of [evCoin,matDrop,bagDrop])try{f(pe)}catch(e){}}
 if(m.it){let it;try{it=genJunk(Math.min(2,ty>>1),ty)/* v392: PRECIO DEL BOTÍN: el objeto vale 324 🪙 como antes de la v390; el nivel del monstruo decide su calidad y estadísticas */}catch(e){it=cleanIt(m.it);it.junk=1}if(auto&&LF&&LF.it&&P.lb.length<LCAP()){P.lb.push(it);t.push('🧺 '+it.n)}else{if(!ground)ground={x:P.x+Math.random()*18-9,y:P.y+Math.random()*18-9,gd:0,it:null,l:120};ground.it=it;t.push('🎁 '+it.n+' en el suelo')}}
 if(ground)LT.push(ground);
 if(t.length&&FT.length<60)FT.push({x:P.x,y:P.y-30,t:1.6,d:0,o:0,k:'dm',s:t.join(' '),c:'#ffd666'});
 try{chk();save()}catch(e){}}
const _h=hitE;hitE=function(e,dm){if(!e.pvg&&(cityAt(P)||cityAt(e)||(typeof uwSafe=='function'&&(uwSafe(P)||uwSafe(e))))){if(!window.__szT||Date.now()-window.__szT>2500){window.__szT=Date.now();toast('🛡️ Zona segura: no se puede atacar dentro del pueblo',2200)}return}if(e.pvg){pvStrike(e,dm);return}if(!on||!e.sync||SM[e.sid]!==e)return _h(e,dm);if(e.dead>0)return;dm=Math.max(1,Math.round(dm));WQ.push([e.sid,dm]);e.hp=Math.max(1,e.hp-dm);
 if(FT.length<60)FT.push({x:e.x+Math.random()*14-7,y:e.y-14,t:.9,d:0,o:0,k:'dm',s:String(dm),c:'#ffe9a8'})};
/* ===== v299: daño y muertes compartidos en party (cuevas, torre, jefes de área) =====
   Cada celular sigue corriendo su IA local, pero el daño que hace un miembro de la party a un mob con id estable
   se reenvía a los demás miembros que estén en la misma zona; así los mobs mueren/viven igual para todos. */
let XK='',XM=[],XQ=[],XT=0;
function xBuild(){const d=typeof DG!=='undefined'&&DG.f&&DG.id!='co'&&DG.id!='uw';if(!d){XK='';XM=[];return}
 const k=DG.id+':'+DG.f;if(XK.indexOf(k+':')===0&&XM[0]&&XM[0].dg===DG.f&&E.indexOf(XM[0])>=0)return;
 XM=[];let s=0;for(const e of E){if(e.dg!==DG.f||e.tmp)continue;e.xid=XM.length;XM.push(e);s=(Math.imul(s,31)+Math.round(e.hx!=null?e.hx:e.x)*7+Math.round(e.hy!=null?e.hy:e.y)*13)|0}
 XK=XM.length?k+':'+XM.length+':'+(s>>>0).toString(36):''}
function xScope(){try{xBuild()}catch(e){XK='';XM=[]}if(typeof DG!=='undefined'&&DG.f)return XK;return 'w'}
window.SRXSC=()=>{const k=xScope();return k||((typeof UW!=='undefined'&&UW.on)?'uw':'')};/* v393b: el Submundo no tiene zona de mobs ('') pero sí admite antorchas: zona 'uw' */   /* v391: ANTORCHA: zona actual ('w' = mundo abierto, o la cueva) para clavar antorchas */
const xId=e=>e.dg?(e.xid!=null&&XM[e.xid]===e?e.xid:null):e.boss&&e.bi!=null?'b'+e.bi:(e.guard&&!e.horde&&e.li!=null)?'g'+e.li:null;
function xFind(id){if(typeof id=='number')return XM[id]||null;const t=String(id),n=+t.slice(1);for(const e of E){if(t[0]=='b'&&e.boss&&e.bi===n)return e;if(t[0]=='g'&&e.guard&&!e.horde&&e.li===n)return e}return null}
/* ===== v379: cuevas — todos ven los mismos enemigos =====
   1) Daño y muertes: lo que pega un jugador llega a los demás (como antes), pero ahora la MUERTE se impone en todos los celulares
      (aviso de muerte + repetición 3 s en el latido + consulta periódica al servidor), con la misma duración de reaparición (xResp).
   2) Posición y vida: cada enemigo activo lo "maneja" el jugador más cercano a él (empate = uid menor). Ese celular manda
      [id,x,y,vida,marca] cada ~0,2 s; los demás lo siguen (no corren su IA ni lo regeneran) y solo reciben su golpe si los alcanza.
   3) Cada latido trae la posición del emisor (q) → todos saben quién está en la cueva (XU), también sin party. */
const xN=()=>Date.now();
let XU={},XHB=0,XQT=0;
/* al entrar alguien más, las emboscadas personales que ya tenía (nadie más las ve) se disipan, salvo las que me están peleando */
function xAmbClean(){for(let i=E.length-1;i>=0;i--){const e=E[i];if(!e||!e.amb||e.dg!==DG.f||e.dead>0)continue;if(Math.hypot(e.x-P.x,e.y-P.y)<420&&(e.hp<e.mx||e.ch>0))continue;E.splice(i,1)}}
function xShared(){const n=xN();for(const u in XU)if(n-XU[u].t<5000)return true;return false}
window.srXShared=xShared;
function xKill(e,near){
 if(!e||e.dead>0||!(e.hp>0)||e.boss||e.guard||e.pvg||e.ubs||e.drg||e.hzOff)return;
 if(near){window.__xrx=1;try{hitE(e,Math.ceil(e.hp*(typeof egH=='function'?egH(e):1)/(1-Math.min(.9,e.df||0)))+2)}catch(x){}finally{window.__xrx=0}}
 if(e.dead<=0){e.hp=0;e.dead=xResp(e)}}
function xRecv(m){const sc=xScope();if(!sc||sc!==m.k)return;for(const a of (m.h||[])){const e=xFind(a[0]);if(!e||e.pvg||e.dead>0||!(e.hp>0))continue;const dm=Math.max(1,Math.min(1e9,+a[1]|0));
  const d=Math.hypot(e.x-P.x,e.y-P.y);window.__xrx=1;try{if(d<900)hitE(e,dm);else if(e.boss||e.guard)e.hp=Math.max(1,e.hp-dm);else{e.hp-=dm;if(e.hp<=0){e.hp=0;e.dead=xResp(e)}}}catch(x){}finally{window.__xrx=0}
  e.xhT=xN();if(a[2]&&e.dead<=0&&e.hp>0)xKill(e,d<900);
  if((e.hp<=0||e.dead>0)&&XQ.length<24)XQ.push([a[0],1,1])}}
{const _hx=hitE;hitE=function(e,dm){let id=null;try{if(!window.__xrx&&(on||uwJ)&&dm>0&&!e.pvg&&!e.tmp&&(e.dg||(typeof PP!='undefined'&&PP.pid)))id=xId(e)}catch(x){}const r=_hx.apply(this,arguments);try{if(e&&e.dg)e.xhT=xN();if(id!=null&&XQ.length<24)XQ.push([id,Math.round(dm),e.hp<=0?1:0])}catch(x){}return r}}
/* v393b: escudo del Segador: lo que pega CADA jugador se reduce mientras sus ecos vivan, ANTES de avisar a los demás */
{const _h2=hitE;hitE=function(e,dm){try{if(e&&e.csb&&!window.__xrx&&typeof csShield=='function')dm=csShield(dm)}catch(x){}return _h2.apply(this,[e,dm].concat([].slice.call(arguments,2)))}}
/* quien entra después a un piso recibe el estado actual: mobs ya muertos y daño acumulado (se repite cada 15 s por si algún aviso se perdió) */
let XL='',XA=new Set(),XAk='';
function xState(m){const sc=xScope();if(!sc||sc!==m.k)return;if(XAk!==sc){XAk=sc;XA=new Set()}
 for(const a of (m.s||[])){const id=a[0],e=xFind(id);if(!e)continue;const first=!XA.has(id);XA.add(id);if(e.dead>0)continue;
  if(a[2]>=0){const rs=xResp(e)*1000;if(a[2]<rs-3000&&e.hp>0&&!e.hzOff&&!e.boss&&!e.guard){e.hp=0;e.dead=Math.max(4,(rs-a[2])/1000)}}
  else if(first){const dm=+a[1]||0;if(dm>0&&e.hp>1)e.hp=Math.max(1,e.hp-dm)}}}
/* ¿este celular es quien manda al mob e? = el jugador más cercano (con 90 px de tolerancia; el que ya lo manejaba tiene 60 px de ventaja; empate → uid menor) */
function xDrv(e,n){const me=String(UID);let dmin=Math.hypot(e.x-P.x,e.y-P.y)-((e.xd&&n-(e.xdT||0)<900)?60:0);const L=[[me,dmin]];
 for(const u in XU){const o=XU[u];if(n-o.t>2500)continue;const d=Math.hypot(e.x-o.x,e.y-o.y)-((e.xu===u&&n-(e.xut||0)<900)?60:0);L.push([u,d]);if(d<dmin)dmin=d}
 let bu=null;for(const [u,d] of L)if(d<=dmin+90&&(bu===null||u<bu))bu=u;return bu===me}
let XPT=0;
function xPos(m){const sc=xScope();if(!sc||sc!==m.k||typeof UID=='undefined')return;const n=xN(),f=String(m.f),me=String(UID);if(f===me)return;
 if(Array.isArray(m.q)){const was=xShared(),o=XU[f]||(XU[f]={x:0,y:0,t:0});o.x=+m.q[0]||0;o.y=+m.q[1]||0;o.t=n;if(!was){try{xAmbClean()}catch(x){}}}
 for(const a of (m.p||[])){const e=XM[a[0]];if(!e||e.pvg||e.hzOff)continue;
  if((a[4]|0)&1){if(e.dead<=0&&e.hp>0)xKill(e,Math.hypot(e.x-P.x,e.y-P.y)<900);continue}
  if(e.dead>0||!(e.hp>0))continue;
  if(e.xd&&n-(e.xdT||0)<900&&f>me)continue;   // lo manejo yo y mi uid es menor: el otro cede
  e.xfT=n;e.xu=f;e.xut=n;e.xd=0;
  const dd=Math.hypot(a[1]-e.x,a[2]-e.y);if(dd>320){e.x=a[1];e.y=a[2];e.gs=0}else if(dd>3){e.gx=a[1];e.gy=a[2];e.gs=1}
  if(a[3]>0&&n-(e.xhT||0)>600)e.hp=Math.min(e.mx,a[3])}}
function xSendPos(){const n=xN();if(n-XPT<220)return;XPT=n;const k=xScope();if(!k||k==='w'||typeof UID=='undefined')return;const me=String(UID),C=[];
 if(!xShared()){if(n-XHB>700){XHB=n;N.send({t:'wsp',k,p:[]})}return}   // solo en la cueva: solo aviso que estoy (así me descubren), sin enviar enemigos a nadie
 for(const e of XM){if(!e||e.hzOff)continue;
  if(e.dead>0){if(e.xal){e.xal=0;e.xkT=n}if(e.xkT&&n-e.xkT<3000&&e.dead<1e8)C.push([0,e,1]);continue}
  e.xkT=0;e.xal=1;if(!(e.hp>0)||Math.abs(e.x-P.x)>700||Math.abs(e.y-P.y)>700)continue;
  if(!(e.mov||e.hp<e.mx||Math.abs(e.x-e.hx)+Math.abs(e.y-e.hy)>8||e.ch>0||e.stun>0)){e.xd=0;continue}
  if(e.xfT&&n-e.xfT<900&&String(e.xu)<me){e.xd=0;continue}
  if(!xDrv(e,n)){e.xd=0;continue}
  if(e.xfT&&n-e.xfT>400)e.xfT=0;   // el anterior dejó de mandar: retomo su IA ya
  C.push([Math.hypot(e.x-P.x,e.y-P.y),e,0])}
 C.sort((a,b)=>a[0]-b[0]);const L=[];
 for(const [d,e,fl] of C){if(L.length>=40)break;const x=Math.round(e.x),y=Math.round(e.y),hp=Math.round(e.hp);
  if(!fl){const s=e.xs;if(s&&s[0]===x&&s[1]===y&&s[2]===hp&&n-s[3]<600)continue;e.xs=[x,y,hp,n];e.xd=1;e.xdT=n}
  L.push([e.xid,x,y,hp,fl])}
 if(L.length||n-XHB>700){XHB=n;N.send({t:'wsp',k,p:L})}}
function xTick(){try{xSendPos()}catch(e){}const k=xScope(),n=xN();if(k!==XL){XL=k;XU={};XQT=n;if(k&&k!=='w'){setTimeout(()=>{if(xScope()===k)N.send({t:'wsq',k})},700);setTimeout(()=>{if(xScope()===k)N.send({t:'wsq',k})},3500)}}else if(k&&k!=='w'&&n-XQT>15000){XQT=n;N.send({t:'wsq',k})}}
if(typeof drawTemple=='function'){const _t=drawTemple;drawTemple=function(cx,cy,now){_t(cx,cy,now);others(cx,cy,now)}}
const OCOL=['#ffd24a','#9ad0ff','#b07dff','#e8d9a8','#7fffb0','#ffb070','#7fe06a','#ff8a8a'];
function drawOFX(cx,cy){const n=Date.now();OFX=OFX.filter(f=>n-f.t<(f.ty?800:560));for(const f of OFX){const q=OT[f.u],bx=q?q.rx:f.x,by=q?q.ry:f.y,L=f.ty?800:560,k=(n-f.t)/L,x=bx-cx,y=by-cy;if(x<-400||x>VW+400||y<-400||y>VH+400)continue;const c=f.k,ca=Math.cos(f.a),sa=Math.sin(f.a);g.save();g.globalAlpha=1-k*.8;
  if(f.ty){const col=OCOL[c]||'#fff',R=Math.max(40,f.r||90),ty=f.ty;g.strokeStyle=col;g.fillStyle=col;g.lineWidth=5-3*k;
   if(ty=='aoe'||ty=='heal'||ty=='shield'||ty=='guard'||ty=='mp'||ty=='buff'||ty=='bk'){const rr=(ty=='aoe'?R:Math.min(R,70))*Math.min(1,k*2.2+.15);g.beginPath();g.arc(x,y,rr,0,7);g.stroke();g.globalAlpha*=.25;g.beginPath();g.arc(x,y,rr,0,7);g.fill()}
   else{const d=40+R*1.6*Math.min(1,k*1.8);g.beginPath();g.arc(x+ca*d,y+sa*d,10+4*Math.sin(k*18),0,7);g.fill();g.globalAlpha*=.4;g.beginPath();g.arc(x+ca*d*.6,y+sa*d*.6,7,0,7);g.fill();g.lineWidth=3;g.beginPath();g.arc(x+ca*d,y+sa*d,R*.5*Math.min(1,k*2),0,7);g.stroke()}
   g.restore();continue}
  if(c==3){const d=40+420*Math.min(1,k*1.6);g.strokeStyle='#e8d9a8';g.lineWidth=2;g.beginPath();g.moveTo(x+ca*(d-26),y+sa*(d-26));g.lineTo(x+ca*d,y+sa*d);g.stroke()}
  else if(c==2||c==6){const d=30+300*Math.min(1,k*1.5);g.fillStyle=c==2?'#b07dff':'#7fe06a';g.beginPath();g.arc(x+ca*d,y+sa*d,6+3*Math.sin(k*20),0,7);g.fill();g.globalAlpha*=.4;g.beginPath();g.arc(x+ca*(d-14),y+sa*(d-14),4,0,7);g.fill()}
  else if(c==4){g.strokeStyle='#7fffb0';g.lineWidth=3;g.beginPath();g.arc(x,y,12+50*k,0,7);g.stroke();const d=30+250*Math.min(1,k*1.5);g.fillStyle='#bfffd8';g.beginPath();g.arc(x+ca*d,y+sa*d,5,0,7);g.fill()}
  else{g.strokeStyle=c==1?'#ffd9a0':'#fff';g.lineWidth=5-3*k;g.beginPath();g.arc(x,y,34+6*k,f.a-1.1+k*.5,f.a+1.1+k*.5);g.stroke();g.strokeStyle='#ffffff88';g.lineWidth=2;g.beginPath();g.arc(x,y,28,f.a-.9+k*.5,f.a+.9+k*.5);g.stroke()}
  g.restore()}}
function others(cx,cy,now){if(!on&&!AR.on)return;const VHn=typeof VH=='number'?VH:900;drawOFX(cx,cy);try{window.coCrowd&&coCrowd(cx,cy,now)}catch(e){}try{arRing(cx,cy)}catch(e){}try{arLions(cx,cy)}catch(e){}
 for(const u in OT){const o=OT[u];const px=o.rx,py=o.ry;o.rx+=(o.x-o.rx)*.35;o.ry+=(o.y-o.ry)*.35;const mx=o.rx-px,my=o.ry-py;if(Math.abs(mx)+Math.abs(my)>.15){o.mv=1;o.dr=Math.abs(mx)>Math.abs(my)?(mx>0?'right':'left'):(my>0?'down':'up')}else o.mv=0;const x=o.rx-cx,y=o.ry-cy;if(typeof PP!='undefined'&&PP.o&&PP.o[u]&&Date.now()-(PP.o[u].t||0)<30000&&!!PP.o[u].dg==!!DG.f)continue; // la party ya se dibuja en ppDraw: evita verlos dos veces
if(x<-40||x>VW+40||y<-60||y>VHn+40)continue;
  g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x,y+10,o.mo?15:9,o.mo?5:3,0,0,7);g.fill();const ry=o.mo&&typeof mntOth=='function'?mntOth(o.mo,x,y,o.dr,o.mv,o.ph||(o.ph=Math.random()*9)):0;if(!(o.bs&&typeof spBSA=='function'&&spBSA(o.bs,x,y-ry,2,{fl:o.dr=='left'?1:o.dr=='right'?0:(o.fl|0),mov:o.mv,dir:o.dr||'down',t:performance.now()/1000+(o.ph||(o.ph=Math.random()*9)),run:0,atk:-9,hit:0})))sp('c'+o.c+'-'+(o.dr||'down')+'-'+(o.mv?[1,2,1,3][Math.floor(Date.now()/130)%4]:1),x,y-ry,2);
  g.font='bold 11px Georgia,serif';g.textAlign='center';const lb=AR.on?o.nm:(o.bd?o.bd+' ':'')+(o.gt?'['+o.gt+'] ':'')+o.nm+' · Nv '+o.lv;g.fillStyle='#000';g.fillText(lb,x+1,y-23-ry);g.fillStyle=o.pt?'#7fffa0':'#fff';g.fillText(lb,x,y-24-ry);
  g.fillStyle='#0008';g.fillRect(x-12,y-19-ry,24,3);g.fillStyle=o.pvp?'#ff5a4a':'#4cd964';g.fillRect(x-12,y-19-ry,24*Math.max(0,Math.min(1,o.hp/Math.max(1,o.mhp))),3);
  if(o.pvp){g.font='11px serif';g.fillText('⚔️',x+22,y-24)}if(o.wn){g.font='bold 11px Georgia,serif';g.fillStyle='#000';g.fillText('🎯 SE BUSCA',x+1,y-37);g.fillStyle='#ff6a4a';g.fillText('🎯 SE BUSCA',x,y-38)}
  if(PV.t===u&&PV.on){g.strokeStyle='#ff4a3a';g.lineWidth=2;g.beginPath();g.ellipse(x,y+10,18+2*Math.sin(now/120),7,0,0,7);g.stroke()}}}
setInterval(()=>{if(!ready()||!N.up())return;
 const inUW=typeof UW!=='undefined'&&UW.on,inAR=AR.on,inDG=typeof DG!=='undefined'&&!!DG.f&&DG.id!='co'&&DG.id!='in'&&!inUW&&!inAR;   /* v264: el Submundo (portón de 8 placas y Balor) funciona aunque el mundo compartido esté en modo local */
 if(!on&&(inUW||inAR||inDG||uwJ)){if(inUW||inAR||inDG){if(!uwJ){uwJ=1;N.send({t:'wj',nm:P.name,c:P.cls|0,lv:P.lv,x:Math.round(P.x),y:Math.round(P.y)})}
   /* v330: aunque el mundo de superficie esté en modo local (versión distinta), las cuevas/mazmorras/mina siguen sincronizadas entre jugadores */
   N.send({t:'wm',x:Math.round(P.x),y:Math.round(P.y),hp:Math.round(P.hp),mhp:Math.round(P.mhp),lv:P.lv,tp:0,dg:1,uw:inUW?1:0,pw:0,fl:0,sk:inDG?xScope():'',mo:typeof myMo=='function'?myMo():''});
   if(inDG){try{xTick()}catch(e){}if(XQ.length){const k=xScope();if(k&&k!=='w')N.send({t:'wsx',k,h:XQ.splice(0,12)});else XQ.length=0}}}
  else{uwJ=0;N.send({t:'wm',x:Math.round(P.x),y:Math.round(P.y),hp:Math.round(P.hp),mhp:Math.round(P.mhp),lv:P.lv,tp:1,dg:0,uw:0,pw:0,fl:0})}return}
 if(!on){if(WBAD)return;if(Date.now()-ft>2000){ft=Date.now();N.send({t:'wj',nm:P.name,c:P.cls|0,lv:P.lv,x:Math.round(P.x),y:Math.round(P.y)})}return}
 const tp=Math.hypot(P.x-lx,P.y-ly)>300;lx=P.x;ly=P.y;
 N.send({t:'wm',x:Math.round(P.x),y:Math.round(P.y),hp:Math.round(P.hp),mhp:Math.round(P.mhp),lv:P.lv,tp:tp?1:0,dg:(typeof DG!=='undefined'&&DG.f)?1:0,uw:(typeof UW!=='undefined'&&UW.on)?1:0,pw:PV.on?Math.round(dmg()):0,fl:(typeof FLY!=='undefined'&&FLY.on&&gmIsM())?1:0,sk:xScope(),mo:typeof myMo=='function'?myMo():'',mj:window.MJMAN&&MJMAN.scene?MJMAN.scene():''});   /* v435: escena de la Mansión Embrujada ('ban.S' = sótano): el servidor decide con eso quién está dentro de la arena */
 try{xTick()}catch(e){}
 if(XQ.length){const k=xScope();if(k&&(k!=='w'||(typeof PP!='undefined'&&PP.pid)))N.send({t:'wsx',k,h:XQ.splice(0,12)});else XQ.length=0}
 if(typeof DG!=='undefined'&&DG.f)WQ.length=0;
 if(WQ.length)N.send({t:'wh',h:WQ.splice(0,12)})},100);
setInterval(()=>{if(!on||!LS)return;const n=Date.now();if(n-LS>1500)return;   // vigilante: si el servidor no reporta un enemigo cercano en 4 s, vuelve a modo local (nunca queda inmortal)
 for(const e of NR){if(!e.sync||n-(e.lt||0)<4000||Math.abs(e.x-P.x)>800||Math.abs(e.y-P.y)>800)continue;if(e.dyn){dynRm(e.sid);continue}e.sync=0;e.stun=0;e.gs=0;e.sid=-1;if(!(e.hp>0))e.hp=Math.max(1,Math.round(e.mx*.05))}},1000);
setInterval(()=>{const dgOn=typeof DG!=='undefined'&&DG.f&&XM.length>0;if(!on&&!dgOn)return;for(const e of (dgOn?XM:E)){if(!e||!e.gs)continue;const dx=e.gx-e.x,dy=e.gy-e.y;if(Math.abs(dx)+Math.abs(dy)<1.5){e.x=e.gx;e.y=e.gy;e.gs=0;if(dgOn)e.mov=0}else{e.x+=dx*.4;e.y+=dy*.4;if(dgOn){e.mov=1;e.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')}}}},33);
const _sk=skill;skill=function(i){const s0=P.sc?+P.sc[i]||0:0;_sk(i);if(on&&P.sc&&(+P.sc[i]||0)>s0+.2){const sp=(SP[P.cls|0]||[])[i]||{};const fd={left:Math.PI,right:0,up:-Math.PI/2,down:Math.PI/2}[P.dir||'down'];let b=null,bd=560;for(const e of E){if(!e.sync||e.dead>0)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;b=e}}N.send({t:'wa',k:P.cls|0,a:b?Math.atan2(b.y-P.y,b.x-P.x):fd,ty:String(sp.t||'hit'),r:Math.round((sp.r||90)),hs:typeof hWalk=='function'?Math.round(hWalk()):54})}};
const _atk=atk;atk=function(auto){const c0=P.cd;_atk(auto);if(on&&!(c0>0)&&P.cd>0){let b=null,bd=560;for(const e of E){if(!e.sync||e.dead>0)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;b=e}}const fd={left:Math.PI,right:0,up:-Math.PI/2,down:Math.PI/2}[P.dir||'down'];N.send({t:'wa',k:P.cls|0,a:b?Math.atan2(b.y-P.y,b.x-P.x):fd})}};
/* ===== COLISEO (v276): cliente de la arena. El servidor manda: tiempo, zona, vida igualada y premio. ===== */
const AR={gm:0,spec:0,gl:[],pvn:0,on:0,st:'',left:0,r:0,cx:0,cy:0,al:0,tot:0,hp:1000,mhp:1000,out:0,pot:0,at:0,ask:0,ov:null};
const arT=()=>DGL.find(d=>d.id=='co');
function arMod(h){let el=document.getElementById('arm');if(!el){el=document.createElement('div');el.id='arm';el.style.cssText='position:fixed;inset:0;z-index:60;background:#000a;display:flex;align-items:center;justify-content:center;padding:12px';document.body.appendChild(el)}
 el.innerHTML='<div style="max-width:380px;width:100%;background:linear-gradient(#2a1c10,#150d08);border:3px solid #e9c46a;border-radius:14px;padding:14px;color:#f5e6c0;font:14px Georgia,serif;box-shadow:0 8px 40px #000">'+h+'</div>';el.style.display='flex';modal=1}
function arModClose(){const el=document.getElementById('arm');if(el)el.style.display='none';modal=0}
function arPrompt(){if(!N.up()){toast('El Coliseo necesita conexión con el servidor',3000);return}if(!on&&!uwJ){uwJ=1;N.send({t:'wj',nm:P.name,c:P.cls|0,lv:P.lv,x:Math.round(P.x),y:Math.round(P.y)})}AR.ask=1;N.send({t:'wcq'})}
function arPzOpts(){const o=[];try{PVL.forEach(z=>{if(/^(gh|am)\d$/.test(z[0]))o.push([z[0],z[1]+' '+z[2]])});Object.keys(VTK).forEach(k=>o.push([k,'🎟️ '+VTK[k][1]]))}catch(e){}return o}
function arPzEd(m){const o=arPzOpts();if(!o.length)return '';return '<div style="margin-top:8px;padding:7px;border:1px dashed #7fe3ff;border-radius:8px;font-size:12px"><b>🎁 Premio del ganador (GM)</b><br><select id="arPk" style="width:100%;margin:4px 0;padding:6px">'+o.map(x=>'<option value="'+x[0]+'"'+(m.pz&&m.pz.k==x[0]?' selected':'')+'>'+x[1].replace(/[<>&"]/g,'')+'</option>').join('')+'</select><div style="display:flex;gap:6px"><input id="arPq" type="number" min="1" max="100" value="'+(m.pz?m.pz.q:1)+'" style="width:70px;padding:6px"><button id="arPs" style="flex:1;padding:6px">Guardar premio</button><button id="arPx" style="padding:6px">Quitar</button></div></div>'}
function arAskShow(m){AR.gm=m.gm|0;const gold=(typeof P!='undefined'?P.gold:0)|0,can=m.st=='idle'||m.st=='lobby',okG=(gold>=m.fee||m.gm)&&can,okT=(gold>=(m.tfee||m.fee+200)||m.gm)&&can,okS=gold>=(m.sfee||100)||m.gm,fresh=!(m.n>0),md=m.mode=='t'?'t':'c';let est;
 if(m.st=='fight'||m.st=='end')est='⚔️ Hay un combate en curso (máx. '+Math.ceil(m.left/1000)+' s). Puedes comprar boleto de espectador o esperar al siguiente.';else if(m.st=='lobby')est='⏳ Empieza en '+Math.ceil(m.left/1000)+' s · '+m.n+'/'+m.max+' gladiadores · '+(md=='t'?'🦁 Torneo':'⚔️ Combate');else est='🕰️ Esperando gladiadores ('+m.n+'/'+m.min+' mínimo). Cuando haya 2 empieza la cuenta.';
 const bs=(id,col,on,t)=>'<button id="'+id+'" style="flex:1;padding:10px 6px;font-weight:700;border-radius:10px;border:2px solid '+col+';background:'+(on?'#5a2410':'#444')+';color:#fff" '+(on?'':'disabled')+'>'+t+'</button>';
 arMod('<h3 style="margin:0 0 6px;color:#ffd666;text-align:center">🏛️ Coliseo Karavan</h3><div style="font-size:13px;line-height:1.45">• <b>⚔️ Combate</b>: todos contra todos, el último en pie gana el pozo (−5% se quema).<br>• <b>🦁 Torneo</b>: igual, pero hay <b>4 leones encadenados</b> en la arena y de un momento a otro se suelta uno, y luego otro. Toca un león para fijarlo como objetivo.<br>• Nivel, items y daño igualados: todos pegan igual, solo cuenta tu habilidad. No pierdes nada.<br>• <b>🎟️ Espectador</b>: miras el combate desde las gradas.<br>Tienes <b>'+gold.toLocaleString('es')+' 🪙</b></div><p style="margin:8px 0;text-align:center"><b>'+est+'</b></p>'
  +'<div style="font-size:12px;opacity:.85;margin-bottom:3px">Gladiador · tu apuesta al premio (mín. '+m.fee+' 🪙 en combate · '+(m.tfee||m.fee+200)+' 🪙 en torneo)</div><input id="arAmt" type="number" inputmode="numeric" min="'+m.fee+'" value="'+m.fee+'" style="width:100%;box-sizing:border-box;margin-bottom:6px;padding:8px;font:700 16px Georgia,serif;text-align:center;border-radius:10px;border:2px solid #e9c46a;background:#1b110a;color:#ffe9b0"><div style="font-size:11px;opacity:.75;margin:-2px 0 6px;text-align:center">Todo lo apostado va al pozo: el ganador se lleva el 95%.</div><div style="display:flex;gap:8px;margin-bottom:8px">'+((fresh||md=='c')?bs('arY','#ffd666',okG,'⚔️ Combate'):'')+((fresh||md=='t')?bs('arL','#ff9a3a',okT,'🦁 Torneo'):'')+'</div>'
  +(m.pz?'<div style="font-size:13px;margin:0 0 8px;padding:7px;border:2px solid #7fe3ff;border-radius:8px;text-align:center;background:#0b2a38">🎁 <b>Premio extra para el ganador:</b><br>'+m.pz.q+' × '+String(m.pz.lab).replace(/[<>&]/g,'')+'</div>':'')
  +(m.ch||(m.top&&m.top.length)?'<div style="font-size:12px;line-height:1.4;margin:0 0 8px;padding:6px;border:1px solid #e9c46a55;border-radius:8px;text-align:center">'+(m.ch?'🏆 <b>Campeón del Coliseo: '+String(m.ch).replace(/[<>&]/g,'')+'</b><br>':'')+((m.top&&m.top.length)?'<small>Top victorias: '+m.top.map((q,i)=>(i+1)+'. '+String(q[0]).replace(/[<>&]/g,'')+' ('+q[1]+')').join(' · ')+'</small>':'')+'<br><small style="opacity:.8">Si ganas, te quedas el título; si otro gana, lo pierdes.</small></div>':'')+'<div style="font-size:12px;opacity:.85;margin-bottom:3px">Espectador · boleto '+(m.sfee||100)+' 🪙</div><div style="display:flex;gap:8px">'+bs('arV','#7fe3ff',okS,'🎟️ Entrar a mirar')+'<button id="arN" style="flex:1;padding:10px;border-radius:10px;border:2px solid #888;background:#222;color:#fff">Cerrar</button></div>'
  +(m.gm?'<div style="display:flex;gap:8px;margin-top:8px"><button id="arW" style="flex:1;padding:9px;border-radius:10px;border:2px solid #7fe3ff;background:#123;color:#fff">👁️ Ver gratis (GM)</button></div><p style="margin:6px 0 0;text-align:center;font-size:12px;opacity:.85">GM: entras gratis y sin esperar jugadores. PvP activo en el mundo: <b>'+(m.pvn|0)+'</b> jugadores.</p>'+arPzEd(m):'')+((okG||okS)?'':'<p style="color:#ff8a8a;text-align:center;margin:6px 0 0">Te faltan monedas de oro.</p>'));
 const d0=()=>{const d=arT();return d?{cx:Math.round((d.rx+d.w/2)*T+16),cy:Math.round((d.ry+d.h/2)*T+16)}:null};
 const go=(id,f)=>{const b=document.getElementById(id);if(b)b.onclick=()=>{arModClose();const c=d0();if(c)f(c)}};
 document.getElementById('arN').onclick=arModClose;
 {const ps=document.getElementById('arPs'),px=document.getElementById('arPx');if(ps)ps.onclick=()=>{const sel=document.getElementById('arPk'),k=sel.value;N.send({t:'wcp',k,q:+document.getElementById('arPq').value||1,lab:sel.options[sel.selectedIndex].text.replace(/^\S+\s/,'')});AR.ask=1};if(px)px.onclick=()=>{N.send({t:'wcp',k:'',q:0});AR.ask=1}}
 const amt=md2=>{const mn=md2=='t'?(m.tfee||m.fee+200):m.fee,i=document.getElementById('arAmt'),v=Math.floor(+(i&&i.value)||mn);return v};
 const goA=(id,md2)=>{const b=document.getElementById(id);if(b)b.onclick=()=>{const mn=md2=='t'?(m.tfee||m.fee+200):m.fee,v=amt(md2);if(!m.gm&&v<mn){toast('La apuesta mínima es '+mn+' 🪙'+(md2=='t'?' en torneo':''),3500);return}if(!m.gm&&v>gold){toast('No tienes '+v+' 🪙',3000);return}if(v>(m.smax||500000)){toast('Apuesta máxima: '+(m.smax||500000)+' 🪙',3000);return}arModClose();const c=d0();if(c)N.send({t:'wcj',mode:md2,stk:v,cx:c.cx,cy:c.cy})}};
 goA('arY','c');goA('arL','t');go('arV',c=>N.send({t:'wcv',cx:c.cx,cy:c.cy}));
 const wb=document.getElementById('arW');if(wb)wb.onclick=()=>{arModClose();const c=d0();if(c)N.send({t:'wcw',cx:c.cx,cy:c.cy})}}
window.SRSPB=(x,y,r)=>{if(!AR.on||!AR.spec||!M)return 0;for(const [a,b] of [[-r,-r],[r,-r],[-r,r],[r,r]]){const tx=Math.floor((x+a)/T),ty=Math.floor((y+b)/T),row=M[ty];if(row&&row[tx]==8)return 1}return 0};
function arEnter(spec){const d=arT();if(!d||AR.on)return;AR.on=1;AR.out=0;AR.spec=spec?1:0;AR.st='lobby';try{RIDE=0}catch(e){}dgUse(d);dgSet(1,0,1,0);const C=DG.arC;let x=P.x,y=P.y;
 for(let k=0;k<60;k++){const a=Math.random()*6.283,rr=.55+Math.random()*.3,px=C.x+Math.cos(a)*C.A*rr,py=C.y+Math.sin(a)*C.B*rr;const t=M[Math.floor(py/T)]&&M[Math.floor(py/T)][Math.floor(px/T)];if(t==8){x=px;y=py;break}}
 if(spec){x=C.x;y=C.y-C.B-T*1.3}P.x=x;P.y=y;DG.lx=-1;if(!spec){PV.on=1;PV.t=null;pvSync()}arHud();toast(spec?(AR.gm?'👁️ Modo espectador GM: nadie te ve. Puedes caminar por las gradas.':'🎟️ Boleto listo: mira el combate desde las gradas. Nadie te ve.'):'🏛️ ¡Bienvenido, gladiador! Nivel igualado. Esperando que empiece el combate…',4000)}
function arLeaveLocal(){if(!AR.on)return;AR.on=0;AR.spec=0;document.body.classList.remove('strm');PV.on=0;PV.t=null;pvSync();try{dgSet(0,0,0)}catch(e){}try{P.hp=P.mhp;P.mp=P.mmp}catch(e){}const h=document.getElementById('arh');if(h)h.style.display='none';arModClose()}
function arExit(){if(!AR.spec&&AR.st=='fight'&&!AR.out&&!confirm('¿Abandonar el combate? Quedarás eliminado (la entrada no se devuelve).'))return;N.send({t:'wcl'});arLeaveLocal()}
function arHud(){let h=document.getElementById('arh');if(!h){h=document.createElement('div');h.id='arh';h.style.cssText='position:fixed;left:50%;top:6px;transform:translateX(-50%);z-index:33;min-width:230px;text-align:center;font:700 13px Georgia,serif;color:#ffe9b0;background:#2a140acc;border:2px solid #e9c46a;border-radius:12px;padding:5px 10px;pointer-events:auto';document.body.appendChild(h);h.addEventListener('click',e=>{if(e.target.id=='arX')arExit();else if(e.target.id=='arS')N.send({t:'wcg'});else if(e.target.id=='arT')document.body.classList.toggle('strm')})}
 h.style.display='block';const mm=Math.floor(AR.left/60000),ss=String(Math.floor(AR.left/1000)%60).padStart(2,'0'),st=AR.st=='lobby'?'⏳ Empieza en '+Math.ceil(AR.left/1000)+' s · '+AR.tot+'/'+AR.max:AR.st=='fight'?'⚔️ '+mm+':'+ss+' · vivos '+AR.al+'/'+AR.tot:AR.st=='end'?'🏁 Fin del combate':'🏛️ Coliseo',p=Math.max(0,Math.min(1,AR.hp/Math.max(1,AR.mhp)));
 h.innerHTML=st+' <small>· pozo '+(AR.pot|0)+' 🪙</small><div style="height:7px;background:#0008;border-radius:4px;margin-top:3px"><i style="display:block;height:7px;width:'+Math.round(p*100)+'%;background:'+(p>.5?'#5ad06a':p>.25?'#e0b030':'#e04030')+';border-radius:4px"></i></div>'+(AR.spec?'<div style="text-align:left;font-size:11px;margin-top:3px">'+(AR.gl||[]).map(q=>(q[2]?'☠️':'🛡️')+' '+String(q[0]).replace(/[<>&]/g,'')+' · '+q[1]+' hp').join('<br>')+(AR.gm?'<br>⚔️ PvP activo en el mundo: '+(AR.pvn|0):'')+((AR.li||[]).length?'<br>🦁 Leones: '+AR.li.length:'')+'</div>':'')+'<div style="margin-top:4px">'+(AR.gm&&!AR.spec&&AR.st=='lobby'?'<button id="arS" style="font-size:11px;padding:2px 8px;border-radius:8px;border:1px solid #7f7;background:#143;color:#fff;margin-right:4px">▶️ Iniciar ya (GM)</button>':'')+(AR.gm?'<button id="arT" style="font-size:11px;padding:2px 8px;border-radius:8px;border:1px solid #7fe3ff;background:#123;color:#fff;margin-right:4px">📺 Transmisión</button>':'')+'<button id="arX" style="font-size:11px;padding:2px 8px;border-radius:8px;border:1px solid #aaa;background:#400;color:#fff">🚪 Salir</button></div>'}
function arMsg(m){
 if(m.t=='wc'){if(m.e){toast(m.e,3500);return}if(m.note)toast(m.note,3000);if(m.x){if(AR.on&&!AR.ov)arLeaveLocal();return}
  if(m.ok){if(!AR.on)arEnter(m.spec);return}if(m.q){window.__chn=m.ch||'';if(AR.ask){AR.ask=0;arAskShow(m)}}}
 else if(m.t=='wcs'){Object.assign(AR,{st:m.st,left:m.left,r:m.r,cx:m.cx,cy:m.cy,al:m.al,tot:m.tot,hp:m.hp,mhp:m.mhp,out:m.out,pot:m.pot,max:m.max,min:m.min,gl:m.gl||AR.gl,pvn:m.pvn!=null?m.pvn:AR.pvn});if(m.li){AR.li=m.li;const lm=AR.lm=AR.lm||{},seen={};for(const a of m.li){seen[a[0]]=1;const o=lm[a[0]]||(lm[a[0]]={rx:a[1],ry:a[2],f:1});if(a[1]<o.x)o.f=-1;else if(a[1]>o.x)o.f=1;o.x=a[1];o.y=a[2];o.hp=a[3];o.mhp=a[4];o.ch=a[5]|0}for(const k in lm)if(!seen[k])delete lm[k];if(PV.t&&PV.t[0]=='L'&&!lm[PV.t.slice(1)]){PV.t=null;AR.lk=0}pvSync()}if(AR.on){if(!AR.out&&!AR.spec){if(!PV.on){PV.on=1;pvSync()}P.hp=Math.max(1,P.mhp*m.hp/Math.max(1,m.mhp));P.mp=P.mmp}arHud()}}
 else if(m.t=='wcd'){if(AR.on&&FT.length<60)FT.push({x:P.x,y:P.y-26,t:.9,d:0,o:0,k:'dm',s:'-'+m.d,c:'#ff6a6a'});vib([30])}
 else if(m.t=='wck'){toast('⚔️ ¡Derrotaste a '+m.v+'!',3000);vib([60,40,60])}
 else if(m.t=='wcm'){toast(m.m,3500)}else if(m.t=='wch'){window.__chn=m.cn||'';toast(m.m,7000)}
 else if(m.t=='wco'){AR.out=1;toast('☠️ Eliminado'+(m.by?' por '+m.by:'')+' · puesto '+m.pos+'. No perdiste nada.',5000);vib([80,40,120]);P.hp=P.mhp;setTimeout(()=>{if(AR.on&&AR.out&&!AR.ov){N.send({t:'wcl'});arLeaveLocal()}},3500)}
 else if(m.t=='wce'){AR.ov=1;const w=(m.w||[]).join(', ')||'nadie';arMod('<h3 style="margin:0 0 6px;color:#ffd666;text-align:center">🏁 Fin del combate</h3><p style="text-align:center;font-size:15px">'+(m.win?'🏆 <b>¡GANASTE!</b>':'Ganó <b>'+w.replace(/[<>&]/g,'')+'</b>')+'</p><p style="text-align:center">Pozo: '+m.pot+' 🪙 · quemado 5%: '+m.burn+' 🪙'+(m.prize>0?'<br>Premio: <b>'+m.prize+' 🪙</b>'+(m.win?' (en tu bolsa)':''):'')+(m.pz?'<br>🎁 Extra: <b>'+m.pz.q+' × '+String(m.pz.lab).replace(/[<>&]/g,'')+'</b>'+(m.win?' (ya en tu inventario)':''):'')+'</p><p style="text-align:center;opacity:.8">'+(m.why=='time'?'Se acabó el tiempo: gana quien conserve más vida.':'Último en pie.')+'</p>');
  setTimeout(()=>{AR.ov=0;N.send({t:'wcl'});arLeaveLocal()},6500)}}
function arLions(cx,cy){if(!AR.on||!AR.lm)return;for(const k in AR.lm){const o=AR.lm[k];o.rx+=(o.x-o.rx)*.22;o.ry+=(o.y-o.ry)*.22;const x=o.rx-cx,y=o.ry-cy,tm=performance.now()/1000,mv=Math.hypot(o.x-o.rx,o.y-o.ry)>2,w=mv?Math.sin(tm*14)*3:0,t=PV.t==='L'+k;
 g.save();g.translate(x,y);g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(0,6,26,7,0,0,7);g.fill();
 if(t){g.strokeStyle='#ff4a3a';g.lineWidth=2;g.beginPath();g.ellipse(0,6,32+2*Math.sin(tm*8),10,0,0,7);g.stroke()}
if(o.ch){g.strokeStyle='#8a8f98';g.lineWidth=3;g.setLineDash([5,4]);g.beginPath();g.moveTo(-6,-6);g.lineTo(-30,-14);g.stroke();g.beginPath();g.moveTo(6,-6);g.lineTo(30,-14);g.stroke();g.setLineDash([]);g.fillStyle='#555a63';g.fillRect(-36,-20,8,12);g.fillRect(28,-20,8,12);g.strokeStyle='#b9bec7';g.lineWidth=2;g.beginPath();g.ellipse(0,0,18,7,0,0,7);g.stroke()}
 g.scale(o.f||1,1);{const a=A['lion-'+((mv?Math.floor(tm*6)%2:0)+1)]||A['lion-1'];if(a){g.imageSmoothingEnabled=false;g.drawImage(AT,a[0],a[1],a[2],a[3],-36,-62+Math.abs(w)*.3,72,72)}}
 g.restore();const p=Math.max(0,Math.min(1,o.hp/Math.max(1,o.mhp)));g.fillStyle='#0009';g.fillRect(x-22,y-68,44,6);g.fillStyle=p>.5?'#5ad06a':p>.25?'#e0b030':'#e04030';g.fillRect(x-21,y-67,42*p,4);g.font='700 11px Georgia';g.textAlign='center';g.fillStyle='#fff';g.fillText(o.ch?'⛓️🦁 León encadenado':'🦁 León',x,y-72)}}
function arRing(cx,cy){if(!AR.on||!AR.r||AR.st=='lobby'&&!AR.cx)return;const x=AR.cx-cx,y=AR.cy-cy,CC=(typeof DG!='undefined'&&DG.arC)||null;g.save();if(CC){g.beginPath();g.ellipse(CC.x-cx,CC.y-cy,CC.A,CC.B,0,0,7);g.clip()}g.beginPath();g.rect(-60,-60,VW+120,(typeof VH=='number'?VH:900)+120);g.arc(x,y,AR.r,0,7);g.fillStyle=AR.st=='fight'?'rgba(190,30,20,.30)':'rgba(190,30,20,.08)';g.fill('evenodd');g.strokeStyle='rgba(255,110,50,.9)';g.lineWidth=4;g.setLineDash([14,10]);g.lineDashOffset=-(performance.now()/40)%24;g.beginPath();g.arc(x,y,AR.r,0,7);g.stroke();g.restore()}
setInterval(()=>{if(!AR.on||AR.st!='fight'||AR.out)return;if(PV.t&&PV.t[0]=='L'&&AR.lm&&AR.lm[PV.t.slice(1)])return;if(AR.lkp&&PV.t&&OT[PV.t]&&OT[PV.t].pvp&&OT[PV.t].hp>0)return;AR.lkp=0;let b=null,bd=1e9;for(const u in OT){const o=OT[u];if(!o.pvp||!(o.hp>0))continue;const d=Math.hypot(o.rx-P.x,o.ry-P.y);if(d<bd){bd=d;b=u}}
 const cur=PV.t&&OT[PV.t];if(b&&(!cur||!cur.pvp||!(cur.hp>0)||bd<Math.hypot(cur.rx-P.x,cur.ry-P.y)*.7)){PV.t=b;pvSync()}},250);
(()=>{const st=document.createElement('style');st.textContent='body.strm #w>*:not(#c):not(#arh){display:none!important}';document.head.appendChild(st)})();
window.SRAR={prompt:arPrompt,on:()=>AR.on};window.SRARST=()=>AR.st;
window.SRWORLD={on:()=>on,others:()=>OT,ofx:()=>OFX.length,fx:drawOFX};

/* ===== v425: SAQUEO DE CADAVERES. Los cuerpos duran 60 s; con G (o el botón Tomar) cerca de uno se le registra el bolsillo. El servidor decide: 10% poción (HP o MP), 6% equipo común (nivel del mob +5), 0,006% equipo poco común. ===== */
const CPW={};let CPL=0;
/* v441: el botón 🎁 y la tecla G saquean el cadáver más cercano (<75 px). Los cuerpos sincronizados con el servidor los resuelve el servidor; los locales (animales, emboscadas, mazmorras abiertas, héroes caídos en PvP) se resuelven aquí con el MISMO reparto (10 % poción, 6 % equipo común, 0,006 % poco común). Cada cuerpo se saquea una sola vez. */
function corpseLoot(){const b=corpseNear();if(!b)return false;b.lt=1;
 if(b.sid==null){const o={t:'wl',ok:1,mid:'L'+(++CPL),ty:b.ty|0,pot:0,mpt:0,eq:0};if(Math.random()<.30){if(Math.random()<.5)o.pot=1;else o.mpt=1}if(Math.random()<.00006)o.eq=2;else if(Math.random()<.18)o.eq=1;CPW[o.mid]=b;if(FT.length<60)FT.push({x:b.x,y:b.y-24,t:1,d:0,o:0,k:'dm',s:'🔎',c:'#ffe9a8'});corpseRes(o);return true}
 CPW[b.sid]=b;try{N.send({t:'wl',id:b.sid})}catch(e){}if(FT.length<60)FT.push({x:b.x,y:b.y-24,t:1,d:0,o:0,k:'dm',s:'🔎',c:'#ffe9a8'});return true}
/* héroe vencido en PvP: queda su tumba 60 s y se puede registrar (la víctima no pierde nada); máximo una vez cada 10 min por víctima */
const CPH={};
function heroCorpse(x,y,lv,nm){const n=Date.now(),k=String(nm||'?');if(n-(CPH[k]||0)<600000)return;CPH[k]=n;lv=Math.max(1,lv|0);CORPSES.push({x,y,key:null,tn:null,sc:2,rot:0,z:LZ(),d:n+60000,kd:{c:'120,8,8',a:.62},r:1.2,sid:null,hero:1,nv:lv,ty:Math.max(0,Math.min(8,Math.round((lv-1)/3.5)))});if(CORPSES.length>CPN)CORPSES.shift()}
function corpseRes(m){const c=CPW[m.mid];delete CPW[m.mid];const x=c?c.x:P.x,y=c?c.y:P.y,PMX=typeof POTMAX=='number'?POTMAX:800,t=[];
 if(!m.ok){if(m.wait){if(c)c.lt=0;toast('🪦 Reservado unos segundos para quien lo mató',1800)}else toast('🪦 Alguien ya lo saqueó o el cuerpo se deshizo',2200);return}
 if(m.pot&&typeof P.pot=='number'&&P.pot<PMX){P.pot++;t.push('+1 🧪 poción')}
 if(m.mpt&&typeof P.mpot=='number'&&P.mpot<PMX){P.mpot++;t.push('+1 💧 poción MP')}
 if(m.eq){const ty=m.ty|0,nv=(c&&c.nv?c.nv:Math.max(1,ty*35))+5;let it;try{it=genJunk(0,ty,nv);if(m.eq==2){const k=Math.floor(Math.random()*8);it.r=1;it.k=k;delete it.junk;it.n=iname(k,it.sl,it.t,it.li);setSt(it,RM[1]*(1+it.t*.6))}}catch(e){it=null}
  if(it){if(P.lb&&P.lb.length<LCAP())P.lb.push(it);else LT.push({x:P.x+Math.random()*18-9,y:P.y+Math.random()*18-9,gd:0,it,l:120,z:LZ()});t.push((m.eq==2?'✨ ':'🎁 ')+it.n);if(m.eq==2)toast('✨ ¡Buena suerte! Encontraste equipo POCO COMÚN: '+it.n,4500)}}
 if(!t.length)t.push('Bolsillos vacíos');if(FT.length<60)FT.push({x,y:y-26,t:1.8,d:0,o:0,k:'xp',s:t.join(' · '),c:'#ffd666'});try{save()}catch(e){}}
window.SRCP={loot:corpseLoot,res:corpseRes,hero:heroCorpse,near:()=>!!corpseNear()};
{const _gr=grab;grab=function(rad,q){if(rad<9999){let c=false;try{c=corpseLoot()}catch(e){}const r=_gr.apply(this,arguments);return c?(r||1):r}return _gr.apply(this,arguments)}}
})();
/* ═══════════ v433 · MINI-JEFES (cliente) · parte 1: sprites y dibujo ═══════════
   Hojas de sprites propias (192×256 / 228×256 / 448×256) incrustadas en base64. Cuadros de 64×64 (necro 76×64); filas: abajo, izquierda, derecha, arriba.
   Banshee/Necromancer: 3 columnas [paso A · quieto · paso B] · Velociraptor: 7 columnas [quieto + 6 pasos de patas].
   Variantes de color en tiempo de carga: espectro (cian, de la Banshee), guardián (ceniza, del Nigromante) y raptor joven (musgo). */
(function(){
'use strict';
if(!window.SRNET||typeof VAR==='undefined'||typeof sp==='undefined')return;
const SRC={ban:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAAEACAMAAADSnYk1AAABgFBMVEVRa4ADBQoRFBklKDAXGyMcIiovMzouBRAyOENOBBMtGCZKSU9WZ3JpaWtsAhQ5RVAqFRtUVFaNiIeuqKZ2dXZKFyeZlZO5tLPPyMZtFSqkm5mNAhnDurdyCiORCiSvCChJO0lRWmXMFzdQJjFlWVkMDSJTCyHKCCzJwry2FjKMFS2De3qrARuooZ30RWXvZnpIERzX0c7qKU7VJkj2V3FGOTnQNlNpR1IoDSIsLUJtJDSuKEnza4NtW2V1eoSpITrl09NEQD2RKUbSeIrmHEP2NVr/gpQpIR5tNkdnYF2EfYCEgXzNRVjaZno9UVlOTWFccHqTNUmNbXKpnqLMHULOu8AfMkU/VGFEK0ZeYVt6gIeDKDeCQ02bVlurNFO/vsPAKz/TgovGrrLiDzT7N2P4QFzxcHn/e5//gaPgxMfn4dwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC2opBTAAAAgHRSTlMA/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAACVDO1UAACbOSURBVHja7X0Hlx23ke4txA43x8mZw2GSSGXJkiyndVpvDi/n/P9/wEMFdPeQvN3Atc569yxb9sgm5wNQCIXKGI0+fB++D1/PB/yN4F8qXimltVaKGlDZzYAxymprGGnz8YB4rQ3w/8umXgGE4QMhjTEjk4s3HbzKnEigAZiIxx+H4A0gEWEqdD79YQG1Df/CRrLxYfFj/4F2ULnrhwiaQjCWSTgIH3BIA44jF49Tj/0jPhCTu/8A+wcDdAxwLngb6WS8U3wAlQqTD3yMlFHpxwciXlkkJW7jBKgcX4gthMnEIRhaTmXS8CYOAIdAeGtz8G3/OAW4CaymJlUSBYJfbE9O1iCnAFK5UMSrgN9u1/g/6ChAJh77X24ntBNz+sfzh3gd8GdnD7sJ0a0zdiFtvYCfLM/Ozg7GK1hvHx4eXjHemVx8+O9k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',nec:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOQAAAEACAMAAACUKyqfAAABgFBMVEUAAAAEBAcrJy4UFhckGig1NTZEOUcbGCJKR0tUVlI6NkJ1dnGWlo1raWmGhniLiYa2t6qmppccIibGx7JlZlpERTqpqaYWIxVPWmQ5Rk53hW2stpdYZFNreISXpYuMlnklJhy5xKg3RDNlW2VYZ3DN1LWBfHY7LkFhXFhrd1vU18hcdIR1lXEhHRqhnZRIUzqYt45BOjzJycR3gYg7U1RUdVIoNRx5pHebnKEVMxiFfYPAvrXl5dgSDiBac3iQo3u32a3W4s6txJnN4bfm6eYZOiU+ZklrhFydpaZhbYP39/Y5Vj5OTmFFYzpZhGORwYocQxYgDyIhQh5Gcz9VlGFmkF13uHmRt6GayaXP3OHb6uAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADD6yvPAAAAgHRSTlMA////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJl1tRUAADDRSURBVHja7X0Hlxy3se4U0OhGNzpO3DCbE5cUSZGyZFnBus6+6eX8/3/Iq6+A7plZyRz07Pocv3c4vpdhxf22CihUACpMJp8/nz+fP//PfYg/v/BVzZ/xWD/++HJYv0iXPgSLSFmbZE/hyF2cnj+ORKMMWD+jTJ+cnJ66sVg/Mpb6GZurL07OT//yp9txWCpNrbXFEy711+cnV7OrehRllAiWekKY/vqnx+7utKZRWBpYaUrZ7pcfv/jidDa7GEeXLgDGv+ysmf761ycnF7PZ1Rd6zD6mwuSTvST308njxexu9jWNxlJFmqldHoE1m53oX40AKwSMt2Bn/Wn96+uym83uTkcwCboYyzxZMHJfr1n0Z7MvxjAJGGFyly53krPoA+tXowQsde7MqlRtrz/N14sTfXJ1tdajBD91VWXNrsDS13NT0snp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',rap:'data:image/png;base64,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'};
const IM={},FAMS=[
 {s:'ban',rc:'spe',cols:3,fw:64,fh:64,sc:.74,fl:1,gl:'120,220,255'},     /* 0 · Espectro del lamento (territorio de la Banshee) */
 {s:'nec',rc:'gua',cols:3,fw:76,fh:64,sc:.72,fl:0,gl:'170,150,255'},     /* 1 · Guardián maldito (Llanura de los Condenados) */
 {s:'rap',rc:'moss',cols:7,fw:64,fh:64,sc:1.06,fl:0,gl:'150,255,120'},   /* 2 · Raptor joven (Bosque de los Colmillos) */
 {s:'ban',rc:null,cols:3,fw:64,fh:64,sc:.9,fl:1,gl:'255,70,90'},         /* 3 · Banshee (jefe) */
 {s:'nec',rc:null,cols:3,fw:76,fh:64,sc:.9,fl:0,gl:'190,110,255'},       /* 4 · Necromancer (jefe) */
 {s:'rap',rc:null,cols:7,fw:64,fh:64,sc:1.6,fl:0,gl:'255,150,70'}];      /* 5 · Velociraptor (jefe) */
const DIR={down:0,left:1,right:2,up:3},C3={1:1,2:0,3:2};
/* ── recolor por píxel (una sola vez al cargar) ── */
const hsl=(r,g2,b)=>{r/=255;g2/=255;b/=255;const mx=Math.max(r,g2,b),mn=Math.min(r,g2,b),l=(mx+mn)/2,d=mx-mn;let h=0,s=0;if(d){s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx==r?((g2-b)/d+(g2<b?6:0)):mx==g2?(b-r)/d+2:(r-g2)/d+4;h*=60}return[h,s,l]};
const hue=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p};
const rgb=(h,s,l)=>{h=((h%360)+360)%360/360;if(!s)return[l*255,l*255,l*255];const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;return[hue(p,q,h+1/3)*255,hue(p,q,h)*255,hue(p,q,h-1/3)*255]};
const isRed=(h,s,l)=>(h<22||h>335)&&s>.42&&l>.16;
function recolor(img,mode,fh){
 const w=img.naturalWidth,h=img.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;const q=c.getContext('2d');q.drawImage(img,0,0);
 if(!mode)return c;
 const id=q.getImageData(0,0,w,h),d=id.data;
 for(let i=0;i<d.length;i+=4){const a=d[i+3];if(!a)continue;const y=(i>>2)/w|0,fy=y%fh;let[hh,s,l]=hsl(d[i],d[i+1],d[i+2]);
  if(mode=='spe'){                                  /* espectro: núcleo cian brillante, túnica gris-azulada translúcida que se desvanece en el borde inferior */
   if(isRed(hh,s,l)){[d[i],d[i+1],d[i+2]]=rgb(186,Math.min(1,s*1.05),Math.min(.78,l*1.45+.1))}
   else{const m=.34;d[i]=d[i]*(1-m)+150*m;d[i+1]=d[i+1]*(1-m)+196*m;d[i+2]=d[i+2]*(1-m)+228*m;d[i]*=1.2;d[i+1]*=1.2;d[i+2]*=1.22}
   if(fy>50)d[i+3]=Math.round(a*Math.max(.18,1-(fy-50)/17))}
  else if(mode=='gua'){                             /* guardián: piedra y ceniza fría con un resplandor verdoso en los detalles */
   const[r2,g3,b2]=rgb(hh>200&&hh<330?208:hh,Math.min(s,.5)*.4,Math.min(1,l*1.5+.1));d[i]=r2;d[i+1]=g3+6;d[i+2]=b2+14}
  else if(mode=='moss'){                            /* raptor joven: pelaje de musgo y tierra, ojos rojos intactos */
   if(!isRed(hh,s,l)){const[r2,g3,b2]=rgb(88+(hh%30)*.4,Math.min(.62,s*1.15+.14),Math.min(.78,l*1.28+.035));d[i]=r2;d[i+1]=g3;d[i+2]=b2}}
  for(let j=0;j<3;j++)d[i+j]=Math.max(0,Math.min(255,d[i+j]))}
 q.putImageData(id,0,0);return c}
function build(){FAMS.forEach(F=>{if(!F.cv&&IM[F.s])F.cv=recolor(IM[F.s],F.rc,F.fh)})}
for(const k in SRC){const i=new Image();i.onload=()=>{IM[k]=i;build()};i.src=SRC[k]}
/* ── tabla de variantes del juego: así el bucle de dibujo y los cadáveres usan estos sprites ── */
VAR.mjSpe=['mj0',1,null];VAR.mjGua=['mj1',1,null];VAR.mjRap=['mj2',1,null];VAR.mjBan=['mj3',1,null];VAR.mjNec=['mj4',1,null];VAR.mjVel=['mj5',1,null];
const M={cur:null,t:0,FAMS,IM};window.MJC=M;
const frameCol=(F,f)=>F.cols==7?(f<=1?0:Math.min(6,f-3)):(C3[f]!=null?C3[f]:1);
/* sp(): dibuja «mjN-dir-cuadro». Anclaje: los pies a y+13; el espectro/la Banshee flotan. */
M.sp=function(n,x,y,k,o){
 const m=/^mj(\d)-(down|left|right|up)-(\d+)$/.exec(n);if(!m)return 0;const F=FAMS[+m[1]];if(!F||!F.cv)return 0;
 const e=M.cur;M.cur=null;const sc=F.sc*(k/2)*(o&&o.s||1)*(e&&e._mjs||1),w=F.fw*sc,h=F.fh*sc,col=frameCol(F,+m[3]),row=DIR[m[2]];
 let dy=0,al=1;
 if(F.fl){const t=performance.now()/1000;dy=-8-Math.sin(t*2.1+(e?(e.sid|0)*1.7:0))*3;al=F.rc?.9:1
  g.save();g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(x,y+6+dy,2,x,y-h*.35+dy,h*.75);gr.addColorStop(0,'rgba('+F.gl+',.30)');gr.addColorStop(1,'rgba('+F.gl+',0)');g.fillStyle=gr;g.fillRect(x-h,y-h*1.1+dy,h*2,h*1.5);g.restore()}
 else if(F.rc){g.save();g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(x,y+8,2,x,y-h*.2,h*.62);gr.addColorStop(0,'rgba('+F.gl+',.22)');gr.addColorStop(1,'rgba('+F.gl+',0)');g.fillStyle=gr;g.fillRect(x-h,y-h,h*2,h*1.4);g.restore()}
 const sm=g.imageSmoothingEnabled,ga=g.globalAlpha;g.imageSmoothingEnabled=true;try{g.imageSmoothingQuality='high'}catch(x2){}g.globalAlpha=ga*al;
 g.drawImage(F.cv,col*F.fw,row*F.fh,F.fw,F.fh,Math.round(x-w/2),Math.round(y+13-h+dy),w,h);g.globalAlpha=ga;g.imageSmoothingEnabled=sm;return 1};
/* cuadro de animación: el raptor camina con 6 pasos atados a la distancia recorrida (los pies no «patinan»); los demás usan el ciclo normal del juego */
const STRIDE=40;
M.fr=function(e,k,mvg,now){M.cur=e;M.t=now;if(e._mjs==null)e._mjs=.94+((e.sid|0)*2654435761>>>0)%13/100;e._mjm=mvg;
 if(k==='mj2'||k==='mj5'){const dx=e.x-(e._mjx!=null?e._mjx:e.x),dy=e.y-(e._mjy!=null?e._mjy:e.y);e._mjx=e.x;e._mjy=e.y;
  if(!mvg){return 1}e._mjp=((e._mjp||0)+Math.hypot(dx,dy)/(k==='mj5'?58:STRIDE))%1;return 4+Math.min(5,Math.floor(e._mjp*6))}
 return mvg?SQ[Math.floor(now*(k==='mj0'?6:8))%4]:1};
M.bob=function(k,b){const e=M.cur;if((k==='mj2'||k==='mj5')&&e&&e._mjm)return 0;if(k==='mj0'||k==='mj3')return 0;return b};
/* la barra de vida y el «Nv» del juego están pensados para criaturas de 32 px: se suben según la altura del sprite; yo solo añado el nombre */
const fiOf=v=>v==='mjSpe'?0:v==='mjGua'?1:v==='mjRap'?2:v==='mjBan'?3:v==='mjNec'?4:5;
M.off=function(e,k){const F=FAMS[+k[2]];if(!F)return 0;return Math.max(0,Math.round(F.fh*F.sc*(e._mjs||1)+(F.fl?11:0)-25))};
const LC={mj0:'#9fe8ff',mj1:'#d6d0f2',mj2:'#b7e07a',mj3:'#ff9aa8',mj4:'#d9a8ff',mj5:'#ffc27a'};
M.lb=function(e,ex,ey,now){
 const d=Math.hypot(e.x-P.x,e.y-P.y);if(d>460&&e.hp>=e.mx)return;const fi=fiOf(e.v),fa=d<320?1:Math.max(.4,1-(d-320)/180),y=ey-38-M.off(e,'mj'+fi);
 g.save();g.globalAlpha=fa;g.font='bold 10px Georgia,serif';g.textAlign='center';g.lineWidth=3;g.strokeStyle='rgba(0,0,0,.9)';const tt=e.nm||'Criatura';g.strokeText(tt,ex,y);g.fillStyle=LC['mj'+fi];g.fillText(tt,ex,y);g.restore()};
})();
/* ═══════════ v433 · MINI-JEFES (cliente) · parte 2: territorios (decoración, NPC, puntos de recolección, santuario, ambientación) ═══════════ */
(function(){
'use strict';
const M=window.MJC;if(!M)return;
const ST=M.ST={ready:0,fights:0,off:0,b:{},seen:{},loaded:0};
const ID=['ban','nec','rap'],MIC={mm11:'📜',mm12:'💨',mm13:'🧵',mm21:'🪞',mm22:'🌑',mm23:'📖',mm31:'🥚',mm32:'🌿',mm33:'🦴'};
const THEME={ban:{fog:'150,190,225',vig:'6,12,30',vg:.78,tn:'178,196,232',nm:'Pueblo de los Lamentos',ic:'👻'},nec:{fog:'150,90,220',vig:'14,4,30',vg:.8,tn:'196,168,226',nm:'Llanura de los Condenados',ic:'💀'},rap:{fog:'90,170,80',vig:'4,22,8',vg:.7,tn:'168,214,140',nm:'Bosque de los Colmillos',ic:'🦖'}};
M.THEME=THEME;M.MIC=MIC;M.BN={ban:'Banshee',nec:'Necromancer',rap:'Velociraptor'};
const bs=b=>ST.b[b],geo=b=>{const s=bs(b);return s&&s.geo};
/* paso actual de la aventura (el que tiene cur=1) */
M.curStep=function(b){const s=bs(b),q=s&&s.q;if(!q||q.done)return null;for(const m of q.ms)for(const st of m.st)if(st.cur)return Object.assign({mn:m.n,ml:m.lv},st);return null};
M.inRect=function(b,tx,ty,pad){const r=geo(b)&&geo(b).r;pad=pad||0;return!!r&&tx>=r[0]-pad&&tx<r[0]+r[2]+pad&&ty>=r[1]-pad&&ty<r[1]+r[3]+pad};
M.where=function(){return{x:P.x/T,y:P.y/T}};
M.terrAt=function(pad){const w=M.where();for(const b of ID)if(M.inRect(b,w.x,w.y,pad||0))return b;return null};
/* marca sobre el NPC: ! aventura/entrega · ? te falta algo · 🔨 encargo repetible */
M.npcMark=function(b,i){const s=bs(b),q=s&&s.q;if(!q||(P.lv|0)<s.min)return'';const g2=geo(b),n=g2&&g2.npc[i];if(!n)return'';
 if(q.done)return i===(g2.npc.findIndex(x=>x.n===q.craftNpc))&&Object.keys(q.rec).every(k=>(q.have[k]|0)>=q.rec[k])?'🔨':'';
 const st=M.curStep(b);if(!st)return'';
 if(st.t==='talk')return st.npc===n.n?'!':'';
 if(st.t==='deliver')return i===0?(st.m.every(x=>x.h>=x.q)?'!':'?'):'';
 return''};
/* ── generador pseudoaleatorio estable ── */
const rng=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
/* ── decoración procedural (no sólida) ── */
const P2=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h)};
const shad=(x,y,rx)=>{g.fillStyle='rgba(0,0,0,.26)';g.beginPath();g.ellipse(x,y,rx,rx*.36,0,0,7);g.fill()};
const glow=(x,y,r,rgb,a)=>{g.save();g.globalCompositeOperation='lighter';const q=g.createRadialGradient(x,y,1,x,y,r);q.addColorStop(0,'rgba('+rgb+','+a+')');q.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=q;g.fillRect(x-r,y-r,r*2,r*2);g.restore()};
/* v437: posición del héroe en pantalla (la hierba y los helechos del bosque se doblan al pasar) */
let HX=-9e3,HY=-9e3;
const PAINT={
 tomb(x,y,v,now){const k=v%4;shad(x,y,11);const f=k==1?'#7d8493':'#69707e',l='#9aa2b2',d='#4a505c';
  P2(f,x-8,y-20,16,20);P2(l,x-8,y-20,3,20);P2(d,x+5,y-20,3,20);
  if(k==1){P2(f,x-6,y-24,12,4);P2(f,x-4,y-26,8,2);P2(l,x-6,y-24,3,4)}else if(k==2){P2(f,x-8,y-24,8,4);P2(f,x,y-22,8,2);P2(d,x-8,y-24,2,2)}else if(k==3){P2(f,x-2,y-30,4,10);P2(f,x-6,y-27,12,4);P2(l,x-6,y-27,12,1)}else{P2(f,x-8,y-22,16,2)}
  if(k!=3){P2('#3b404a',x-1,y-16,2,9);P2('#3b404a',x-4,y-13,8,2)}
  P2('#4d6b43',x-8,y-3,5,3);P2('#5d7d50',x-6,y-5,3,2);P2('#4b3a2a',x-9,y,18,3);P2('#5b4936',x-7,y+1,14,2)},
 wisp(x,y,v,now){const t=now*1.6+v,yy=y-30+Math.sin(t)*7,xx=x+Math.cos(t*.7)*5;glow(xx,yy,22,'130,210,255',.34+.12*Math.sin(t*3));P2('rgba(220,245,255,.9)',xx-1,yy-2,2,4);P2('rgba(220,245,255,.9)',xx-2,yy,4,2)},
 tree(x,y,v,now){shad(x,y,16);const s=1+(v%3)*.15;g.strokeStyle='#27222c';g.lineCap='round';g.lineWidth=7*s;g.beginPath();g.moveTo(x,y);g.lineTo(x+1,y-34*s);g.stroke();
  g.lineWidth=4*s;for(const[a,b,c2,d2]of[[0,-30,-18,-52],[0,-34,16,-56],[0,-24,22,-38],[0,-38,-6,-66]]){g.beginPath();g.moveTo(x+a,y+b*s);g.quadraticCurveTo(x+a+(c2>0?7:-7),y+(b-8)*s,x+c2*s,y+d2*s);g.stroke()}
  g.lineWidth=2;g.strokeStyle='#3a3340';for(const[c2,d2]of[[-26,-62],[24,-64],[-14,-72],[8,-74]]){g.beginPath();g.moveTo(x+c2*.7*s,y+d2*.8*s);g.lineTo(x+c2*s,y+d2*s);g.stroke()}},
 fence(x,y,v){for(let i=-1;i<=1;i++){P2('#2a2f3a',x+i*10-1,y-16,3,16);P2('#3c4350',x+i*10-1,y-16,1,16);P2('#2a2f3a',x+i*10-2,y-19,5,3)}P2('#2a2f3a',x-12,y-11,24,2);P2('#2a2f3a',x-12,y-5,24,2)},
 pillar(x,y,v){const h=26+(v%3)*12,br=v%2;shad(x,y,13);P2('#4b4658',x-11,y-6,22,6);P2('#6a6479',x-11,y-6,22,2);
  for(let i=0;i<h;i+=8){P2(i%16?'#7d7790':'#716b84',x-8,y-6-i-8,16,8);P2('#9c96b0',x-8,y-6-i-8,3,8);P2('#4b4658',x+5,y-6-i-8,3,8)}
  if(br){P2('#4b4658',x-8,y-6-h-2,6,3);P2('#4b4658',x+1,y-6-h,7,2)}else P2('#8a849e',x-10,y-6-h-4,20,4);
  P2('#5d5770',x+12,y-3,6,3);P2('#5d5770',x-17,y-2,5,2)},
 mirror(x,y,v,now){shad(x,y,13);const t=now*2+v;P2('#2a2236',x-11,y-50,22,50);P2('#4a3d63',x-11,y-50,22,3);P2('#4a3d63',x-11,y-50,3,50);
  const gr=g.createLinearGradient(x-8,y-47,x+8,y-3);gr.addColorStop(0,'#8e7cc8');gr.addColorStop(.5,'#2a2250');gr.addColorStop(1,'#120c28');g.fillStyle=gr;g.fillRect(x-8,y-47,16,44);
  g.fillStyle='rgba(255,255,255,.25)';g.fillRect(x-6+((t*6)%12),y-44,2,38);glow(x,y-28,26,'170,120,255',.2+.1*Math.sin(t))},
 rune(x,y,v,now){const t=now*1.2+v,r=17+Math.sin(t)*1.5;g.save();g.translate(x,y);g.scale(1,.42);g.strokeStyle='rgba(185,130,255,'+(.55+.2*Math.sin(t*2))+')';g.lineWidth=2;g.beginPath();g.arc(0,0,r,0,7);g.stroke();g.beginPath();g.arc(0,0,r*.62,0,7);g.stroke();
  g.rotate(t*.3);for(let i=0;i<6;i++){g.rotate(Math.PI/3);g.beginPath();g.moveTo(r*.62,0);g.lineTo(r,0);g.stroke()}g.restore();glow(x,y,26,'170,110,255',.18)},
 brazier(x,y,v,now){shad(x,y,9);P2('#3a3346',x-2,y-14,4,14);P2('#4d4560',x-8,y-20,16,6);P2('#2a2436',x-9,y-22,18,3);const t=now*9+v;for(let i=0;i<3;i++){const h=10+Math.sin(t+i*2)*4;P2(i==1?'#e1b5ff':'#a56bff',x-5+i*4,y-22-h,3,h)}glow(x,y-30,30,'170,100,255',.26+.08*Math.sin(t))},
 bones(x,y,v){shad(x,y,10);P2('#d8d2c0',x-9,y-3,10,3);P2('#bdb6a2',x-9,y,10,1);P2('#d8d2c0',x+2,y-5,7,3);P2('#e9e4d4',x-4,y-8,6,5);P2('#2a2420',x-3,y-6,2,2);P2('#2a2420',x,y-6,2,2)},
 tuft(x,y,v,now){const n=7,dx=x-HX,dy=(y-HY)*1.3,dd=Math.hypot(dx,dy),ps=dd<46?(dx>=0?1:-1)*(1-dd/46)*(1-dd/46)*16:0,sw=Math.sin(now*1.7+x*.045+y*.03)*3+ps;g.lineCap='round';for(let i=0;i<n;i++){const a=(i/(n-1)-.5)*1.5,hh=22+((v*7+i*5)%14);g.lineWidth=2.2;g.strokeStyle=i%3==0?'#41683a':i%3==1?'#2f5a2c':'#587f43';g.beginPath();g.moveTo(x+(i-3)*2,y);g.quadraticCurveTo(x+(i-3)*2+a*10+sw*.4,y-hh*.55,x+a*24+sw,y-hh);g.stroke()}},
 fern(x,y,v,now){shad(x,y,12);const dx=x-HX,dy=(y-HY)*1.3,dd=Math.hypot(dx,dy),ps=dd<40?(dx>=0?1:-1)*(1-dd/40)*(1-dd/40)*12:0,sw=Math.sin(now*1.3+x*.05)*2+ps;g.lineCap='round';g.lineWidth=3;for(let i=0;i<7;i++){const a=-2.6+i*.45;g.strokeStyle=i%2?'#3f7a35':'#2f6128';g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a)*14,y+Math.sin(a)*14-8,x+Math.cos(a)*24+sw,y+Math.sin(a)*20-4);g.stroke()}},
 rib(x,y,v){shad(x,y,16);P2('#d6cfb8',x-1,y-14,3,14);g.strokeStyle='#d6cfb8';g.lineWidth=2.5;g.lineCap='round';for(let i=0;i<4;i++){g.beginPath();g.arc(x-1,y-4-i*3,9-i,-1.2,1.2);g.stroke()}P2('#bdb6a0',x-3,y-16,7,4)},
 nest(x,y,v,now){shad(x,y,16);g.strokeStyle='#6b4a28';g.lineWidth=3;g.lineCap='round';for(let i=0;i<10;i++){const a=i*.63;g.beginPath();g.arc(x,y-5,14,a,a+.5);g.stroke()}g.fillStyle='#4a3419';g.beginPath();g.ellipse(x,y-4,12,6,0,0,7);g.fill();
  for(let i=0;i<3;i++){const ex=x-7+i*7,ey=y-8+(i%2)*2;g.fillStyle='#e8e0c4';g.beginPath();g.ellipse(ex,ey,4,5,0,0,7);g.fill();g.fillStyle='#b8a878';g.fillRect(ex-1,ey-2,2,2)}},
 track(x,y,v){g.fillStyle='rgba(25,18,10,.5)';for(let i=0;i<4;i++){const ox=x+(i%2?5:-5),oy=y-i*7;g.fillRect(ox-1,oy,2,6);g.fillRect(ox-4,oy+1,2,3);g.fillRect(ox+2,oy+1,2,3)}},
 /* v434 · jardines abandonados de la Mansión Embrujada */
 bush(x,y,v,now){shad(x,y,13);const sw=Math.sin(now*1.2+v)*1.4;g.lineCap='round';
  for(let i=0;i<9;i++){const a=-2.95+i*.37,len=20+((v+i*7)%9);g.strokeStyle=i%3?'#2c2723':'#3b342c';g.lineWidth=2.2;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a)*len*.5,y+Math.sin(a)*len*.5-5,x+Math.cos(a)*len+sw,y+Math.sin(a)*len);g.stroke();
   if(i%2==0)P2(i%4==0?'#4d6b43':'#3a5236',Math.round(x+Math.cos(a)*len*.8+sw),Math.round(y+Math.sin(a)*len*.8),3,2)}
  if(v%3==0){P2('#8a2a40',x-5,y-12,3,3);P2('#c24a68',x-5,y-12,1,1)}},
 statue(x,y,v,now){shad(x,y,15);P2('#4b5266',x-14,y-6,28,6);P2('#69718a',x-14,y-6,28,2);P2('#3a4054',x-11,y-12,22,6);
  P2('#8d95ad',x-6,y-40,12,28);P2('#aab2c8',x-6,y-40,3,28);P2('#6c748c',x+3,y-40,3,28);P2('#8d95ad',x-8,y-18,16,8);
  P2('#9aa2ba',x-5,y-50,10,10);P2('#6c748c',x-5,y-50,10,3);P2('#2a2f40',x-3,y-46,6,5);
  if(v%2){P2('#8d95ad',x-12,y-36,6,3);P2('#8d95ad',x+6,y-36,3,10)}else{P2('#8d95ad',x+6,y-36,6,3);P2('#8d95ad',x-9,y-36,3,10)}
  P2('#4d6b43',x-14,y-4,6,3);P2('#5d7d50',x+8,y-9,4,3);glow(x,y-30,22,'150,200,255',.10+.05*Math.sin(now*1.4+v))},
 lamp(x,y,v,now){shad(x,y,7);P2('#23252f',x-1,y-40,3,40);P2('#23252f',x-5,y-4,11,4);P2('#2f3240',x-4,y-46,9,6);P2('#23252f',x-6,y-50,13,3);
  const f=.75+.25*Math.sin(now*8+v*1.7);P2('rgba(190,230,255,'+f+')',x-2,y-44,5,5);glow(x,y-42,46,'150,205,255',.30*f)},
 cobble(x,y,v){P2('#262a38',x-16,y,32,32);for(let j=0;j<4;j++)for(let i=0;i<4;i++){const c=['#4a5066','#40465a','#555c74','#3a4054'][Math.floor(hs(v*16+j*4+i)*4)],ox=x-16+i*8+((j%2)*3);P2(c,ox,y+j*8,7,7);P2('#6a7290',ox,y+j*8,7,1)}
  if(v%5==0)P2('#4d6b43',x-10+(v%7)*3,y+8+(v%3)*6,5,3)}};
M.PAINT=PAINT;
const MIX={ban:[['tomb',34],['wisp',12],['tree',9],['fence',11],['bones',4]],nec:[['pillar',22],['mirror',8],['rune',9],['brazier',7],['bones',16]],rap:[['tuft',60],['fern',24],['rib',2],['nest',2],['track',5],['bones',3]]};
const CNT={ban:300,nec:300,rap:1500};
function mkDecor(b){const g2=geo(b);if(!g2)return[];const r=g2.r,R=rng(b.charCodeAt(0)*977+b.charCodeAt(1)*31+7),out=[],mix=MIX[b],tot=mix.reduce((a,x)=>a+x[1],0),free=[];
 g2.npc.forEach(n=>free.push([n.x,n.y,3.5]));g2.gp.forEach(p=>free.push([p.x,p.y,2.5]));if(g2.door)free.push([g2.door[0],g2.door[1],5]);
 for(let i=0,n=CNT[b];i<n;i++){const tx=r[0]+2+R()*(r[2]-4),ty=r[1]+2+R()*(r[3]-4);let ok=1;for(const f of free)if(Math.hypot(tx-f[0],ty-f[1])<f[2]){ok=0;break}if(!ok)continue;
  if(g2.lk&&tx>=g2.lk[0]-3&&tx<g2.lk[0]+g2.lk[2]+3&&ty>=g2.lk[1]-3&&ty<g2.lk[1]+g2.lk[3]+8)continue;   /* v435: el lago, la isla y el muelle de la mansión tienen su propia decoración (mjc4.js) */
  if(g2.cs&&g2.mn){const cs=g2.cs,mn=g2.mn,hw=Math.max(cs[0],cs[2]);if(tx>=mn[0]-hw-3&&tx<=mn[0]+hw+4&&ty>=mn[1]-cs[1]-3&&ty<=mn[1]+cs[3]+3)continue}   /* v436: el castillo (huella, explanada y camino) tiene su propia decoración (mjc8.js) */
  if(b==='rap'&&window.MJRAP&&MJRAP.cell&&MJRAP.cell(Math.floor(tx),Math.floor(ty))>=2)continue;   /* v437: el portal del bosque (huella y explanada) tiene su propia decoración (mjc13.js) */
  const px=Math.round(tx*T),py=Math.round(ty*T);if(typeof blk=='function'&&(blk(px,py,9)||blk(px-14,py,6)||blk(px+14,py,6)))continue;
  let w=R()*tot,t=mix[0][0];for(const m of mix){if(w<m[1]){t=m[0];break}w-=m[1]}
  if(b==='rap'&&window.MJRAP&&MJRAP.sub&&(MJRAP.sub(Math.floor(tx),Math.floor(ty))&8)&&t!=='track'&&t!=='bones')continue;   /* v437: en los senderos de tierra solo huellas y huesos */
  out.push({t,x:px,y:py,v:Math.floor(R()*997)})}
 if(b==='ban'&&g2.ar)for(const o of mkGarden(g2))out.push(o);
 out.sort((a,c)=>(c.floor?1:0)-(a.floor?1:0)||a.y-c.y);return out}
/* ── v434 · jardines de la Mansión Embrujada: camino empedrado hasta el santuario, farolas espectrales, estatuas rotas, arbustos secos y dos cementerios cercados ── */
function mkGarden(g2){const a=g2.ar,R=rng(4343),out=[],cx=a[0]+a[2]/2,gy=a[1]+a[3],dy=g2.door?g2.door[1]:gy+11;
 const free=(tx,ty)=>{if(tx>=a[0]-1.5&&tx<a[0]+a[2]+1.5&&ty>=a[1]-2&&ty<gy+2.8)return 0;                     /* mansión y escalones */
  if(Math.abs(tx-cx)<4.4&&ty>=gy&&ty<dy+1.5)return 0;                                                          /* camino */
  if(tx>=cx-6.5&&tx<=cx+6.5&&ty>=gy+2.6&&ty<=gy+7.4)return 0;                                                  /* plaza de salida */
  if(g2.door&&Math.hypot(tx-g2.door[0],ty-g2.door[1])<7)return 0;return 1};
 const add=(t,tx,ty,v)=>{if(!free(tx,ty))return;const px=Math.round(tx*T),py=Math.round(ty*T);if(typeof blk=='function'&&blk(px,py,9))return;out.push({t,x:px,y:py,v:v!=null?v:Math.floor(R()*997)})};
 /* camino empedrado (6 casillas de ancho, centrado en el portón) desde los escalones hasta la puerta del santuario */
 for(let ty=gy+1;ty<=dy+1;ty++)for(let tx=Math.floor(cx)-3;tx<Math.floor(cx)+3;tx++)out.push({t:'cobble',x:tx*T+16,y:ty*T,v:tx*31+ty*17+(R()*50|0),floor:1});
 /* farolas a los lados del camino y estatuas rotas junto a los escalones */
 for(const ty of[gy+3.2,gy+7.4])for(const sx of[-1,1])out.push({t:'lamp',x:Math.round((cx+sx*3.7)*T),y:Math.round(ty*T),v:out.length*7});
 out.push({t:'statue',x:Math.round((cx-6.2)*T),y:Math.round((gy+2.6)*T),v:1});out.push({t:'statue',x:Math.round((cx+6.2)*T),y:Math.round((gy+2.6)*T),v:2});
 /* arbustos secos al pie de la fachada y a los lados del camino */
 for(let i=0;i<30;i++){const sx=R()<.5?-1:1;add('bush',cx+sx*(5+R()*9),gy+.9+R()*5.6)}
 for(let i=0;i<10;i++)add('bush',a[0]-2+R()*(a[2]+4),a[1]-1.2-R()*3.5);
 /* cementerio oeste y este, cada uno con su cerca */
 const cem=(x0,y0,x1,y1,n)=>{for(let i=0;i<n;i++)add('tomb',x0+1+R()*(x1-x0-2),y0+1+R()*(y1-y0-2));
  for(let x=x0;x<=x1;x+=.85){add('fence',x,y0);add('fence',x,y1)}for(let y=y0;y<=y1;y+=.85){add('fence',x0,y);if(Math.abs(y-(y0+y1)/2)>1.6)add('fence',x1,y)}
  for(let i=0;i<3;i++)add('wisp',x0+R()*(x1-x0),y0+R()*(y1-y0));add('bones',x0+2+R()*(x1-x0-4),y0+2+R()*(y1-y0-4))};
 cem(a[0]-17,a[1]+2,a[0]-3,a[1]+a[3]-1,26);cem(a[0]+a[2]+3,a[1]+6,a[0]+a[2]+15,a[1]+a[3]+3,22);
 /* árboles muertos que rodean el claro */
 for(let i=0;i<16;i++){const ang=R()*Math.PI*2,rx=a[2]/2+8+R()*10,ry=a[3]/2+6+R()*8;add('tree',cx+Math.cos(ang)*rx,a[1]+a[3]/2+Math.sin(ang)*ry)}
 for(let i=0;i<8;i++)add('wisp',cx-14+R()*28,a[1]-4+R()*(a[3]+14));
 /* el suelo (camino) va primero para que nada lo tape */
 return out.sort((p,q)=>(q.floor?1:0)-(p.floor?1:0)||p.y-q.y)}
/* ── NPC, puntos de recolección y santuario ── */
function drawNpc(b,i,n,cx,cy,now){
 const x=n.x*T+T/2-cx,y=n.y*T+T/2-cy;if(x<-60||x>VW+60||y<-90||y>VH+60)return;const dx=P.x-(n.x*T+T/2),dy=P.y-(n.y*T+T/2),d=Math.hypot(dx,dy);
 const dir=d<260?(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')):'down';
 const th=THEME[b];g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(x,y+12,12,4.5,0,0,7);g.fill();
 g.save();g.globalAlpha=.35+.1*Math.sin(now*2);g.strokeStyle='rgba('+th.fog+',.9)';g.lineWidth=2;g.beginPath();g.ellipse(x,y+12,17,6,0,0,7);g.stroke();g.restore();
 sp('c'+n.c+'-'+dir+'-1',x,y-2+Math.sin(now*1.5+i)*.8,2);
 const mk=M.npcMark(b,i);
 g.save();g.textAlign='center';g.font='bold 11px Georgia,serif';g.lineWidth=3;g.strokeStyle='rgba(0,0,0,.9)';
 const ty2=y-44;g.strokeText(n.n,x,ty2);g.fillStyle='#ffe08a';g.fillText(n.n,x,ty2);g.font='9px Georgia,serif';g.strokeText(n.role,x,ty2+10);g.fillStyle='#e8d6a8';g.fillText(n.role,x,ty2+10);
 if(mk){const by=y-58+Math.sin(now*4)*3;g.font='bold 26px Georgia,serif';g.lineWidth=5;g.strokeText(mk,x,by);g.fillStyle=mk==='!'?'#ffd23a':mk==='?'?'#bfe3ff':'#ffffff';g.fillText(mk,x,by)}g.restore()}
function drawNode(b,p,cx,cy,now){const x=p.x*T+T/2-cx,y=p.y*T+T/2-cy;if(x<-40||x>VW+40||y<-60||y>VH+40)return;
 const s=bs(b),done=s&&s.q&&s.q.done,t=now*2+p.i,rgb=THEME[b].fog;
 glow(x,y,done?26:18,rgb,(done?.34:.16)+.1*Math.sin(t));g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(x,y+5,9,3,0,0,7);g.fill();
 g.save();g.globalAlpha=done?1:.45;g.font='16px serif';g.textAlign='center';g.fillText(MIC[p.m]||'✨',x,y-4+Math.sin(t)*2.5);
 if(done){g.fillStyle='#fff';for(let k=0;k<3;k++){const a=t*1.3+k*2.1;g.fillRect(x+Math.cos(a)*10,y-10+Math.sin(a)*6,2,2)}}g.restore()}
const DPAL={ban:{s:'#5b6483',l:'#98a4c6',d:'#343a55',m:'#232840',a:'190,235,255',fl:['#f2fdff','#8fdcff','#2f86d0']},
 nec:{s:'#43365f',l:'#7c6aa8',d:'#241b3a',m:'#171027',a:'214,160,255',fl:['#f6e3ff','#b678ff','#6128c0']},
 rap:{s:'#6f5d3d',l:'#b29b69',d:'#41351f',m:'#2a2114',a:'196,255,140',fl:['#f6ffcf','#a6dc5c','#3f8f2a']}};
const hs=i=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v)};
const shade=(h,dv)=>'#'+h.slice(1).replace(/../g,v=>Math.max(0,Math.min(255,parseInt(v,16)+dv)).toString(16).padStart(2,'0'));
const EMB={
 ban:(x,y,t)=>{g.save();g.translate(x,y-117);g.rotate(Math.sin(t*1.2)*.09);
  P2('#7a5a2c',-2,0,4,4);g.fillStyle='#c9a24a';g.beginPath();g.moveTo(-10,19);g.quadraticCurveTo(-10,4,0,4);g.quadraticCurveTo(10,4,10,19);g.closePath();g.fill();
  P2('#ecd07a',-6,7,2,10);P2('#a07c34',4,8,3,10);P2('#8a6a2c',-11,18,22,3);P2('#5a3f18',-1,21,3,4);g.restore()},
 nec:(x,y,t)=>{const gx=x,gy=y-117,e=.62+.38*Math.sin(t*1.7);
  P2('#d6cfe4',gx-9,gy,18,13);P2('#d6cfe4',gx-6,gy+13,12,5);P2('#a39bb8',gx-9,gy+10,18,3);P2('#a39bb8',gx+5,gy+1,4,10);
  P2('#241b3a',gx-6,gy+4,5,5);P2('#241b3a',gx+1,gy+4,5,5);P2('#241b3a',gx-1,gy+10,2,2);
  g.fillStyle='rgba(196,120,255,'+e+')';g.fillRect(gx-5,gy+5,3,3);g.fillRect(gx+2,gy+5,3,3);glow(gx-4,gy+6,14,'196,120,255',.4*e);glow(gx+4,gy+6,14,'196,120,255',.4*e);
  P2('#241b3a',gx-4,gy+14,1,4);P2('#241b3a',gx,gy+14,1,4);P2('#241b3a',gx+3,gy+14,1,4)},
 rap:(x,y,t)=>{const gx=x,gy=y-118;g.fillStyle='#efe6c8';
  g.beginPath();g.moveTo(gx-15,gy);g.lineTo(gx-4,gy);g.quadraticCurveTo(gx-6,gy+14,gx-11,gy+22);g.quadraticCurveTo(gx-16,gy+12,gx-15,gy);g.fill();
  g.beginPath();g.moveTo(gx+15,gy);g.lineTo(gx+4,gy);g.quadraticCurveTo(gx+6,gy+14,gx+11,gy+22);g.quadraticCurveTo(gx+16,gy+12,gx+15,gy);g.fill();
  P2('#fff9e2',gx-12,gy+2,2,10);P2('#fff9e2',gx+10,gy+2,2,10);P2('#b8ac86',gx-6,gy+2,2,9);P2('#b8ac86',gx+4,gy+2,2,9);
  g.fillStyle='rgba(190,255,120,'+(.5+.3*Math.sin(t*1.4))+')';g.fillRect(gx-1,gy+8,2,6);glow(gx,gy+11,16,'170,255,110',.25)}};
function flame(x,y,t,pal,k){const h=15+Math.sin(t*5+k)*3;g.save();g.globalCompositeOperation='lighter';
 [[8,.5,pal[2]],[5.5,.75,pal[1]],[3,.95,pal[0]]].forEach(([w,s,c],i)=>{const hh=h*s+Math.sin(t*7+k*2+i)*1.5;g.fillStyle=c;g.globalAlpha=.55;g.beginPath();g.moveTo(x-w,y);g.quadraticCurveTo(x-w*.7,y-hh*.55,x+Math.sin(t*4+k)*1.6,y-hh);g.quadraticCurveTo(x+w*.7,y-hh*.55,x+w,y);g.closePath();g.fill()});g.restore()}
function brazier(x,y,t,PL,k){P2(PL.d,x-6,y-16,12,16);P2(PL.s,x-5,y-16,10,14);P2(PL.l,x-5,y-16,2,14);P2(PL.m,x-9,y-22,18,7);P2(PL.l,x-9,y-22,18,2);P2(PL.d,x-7,y-4,14,4);
 const f=.8+.2*Math.sin(t*6+k*3);glow(x,y-30,46,PL.a,.2*f);flame(x,y-22,t,PL.fl,k)}
function drawDoor(b,d,cx,cy,now){const x=Math.round(d[0]*T+T/2-cx),y=Math.round(d[1]*T+T/2-cy);if(x<-140||x>VW+140||y<-170||y>VH+80)return;
 const t=now*2,PL=DPAL[b],A=PL.a,rgb=THEME[b].fog,sd=(d[0]*7+d[1]*13)|0,OY=y-66,R=20;
 /* suelo: sombra y resplandor que respira */
 shad(x,y+8,58);glow(x,y-6,100,A,.15+.07*Math.sin(t));
 /* escalones */
 P2(PL.m,x-50,y-2,100,9);P2(PL.d,x-48,y-6,96,6);P2(PL.s,x-46,y-10,92,5);P2(PL.l,x-46,y-10,92,1);P2(PL.d,x-46,y-5,92,1);
 /* losa de piedra con la parte de arriba redondeada, hecha de bloques */
 g.save();g.beginPath();g.moveTo(x-42,y-10);g.lineTo(x-42,y-101);g.quadraticCurveTo(x-42,y-120,x-24,y-120);g.lineTo(x+24,y-120);g.quadraticCurveTo(x+42,y-120,x+42,y-101);g.lineTo(x+42,y-10);g.closePath();g.clip();
 P2(PL.d,x-44,y-122,88,114);
 for(let r=0;r<10;r++){const by=y-120+r*11,off=(r%2)*11;for(let c=-1;c<5;c++){const bx=x-44+off+c*22-(r%2?0:0),h=hs(sd+r*31+c*7),col=shade(PL.s,h<.33?-10:h<.66?0:10);
   P2(col,bx+1,by+1,20,10);P2(PL.l,bx+1,by+1,20,1);P2(PL.d,bx+1,by+10,20,1);if(h>.8)P2(PL.d,bx+4+Math.floor(h*10),by+3,1,5)}}
 /* detalles por criatura: escarcha, grietas oscuras o musgo */
 for(let k=0;k<16;k++){const hx=hs(sd+k*5.1),hy=hs(sd+k*9.7),px=x-40+hx*80,py=y-116+hy*100;
  if(b==='ban'){P2('rgba(235,248,255,.7)',px,py,2,1)}else if(b==='nec'){P2('rgba(10,4,24,.6)',px,py,1,5)}else{P2('rgba(80,140,50,.8)',px,py,3,2);P2('rgba(110,170,60,.7)',px+1,py+2,1,3)}}
 g.restore();
 /* contorno de la losa */
 g.save();g.beginPath();g.moveTo(x-42,y-10);g.lineTo(x-42,y-101);g.quadraticCurveTo(x-42,y-120,x-24,y-120);g.lineTo(x+24,y-120);g.quadraticCurveTo(x+42,y-120,x+42,y-101);g.lineTo(x+42,y-10);g.strokeStyle=PL.m;g.lineWidth=2;g.stroke();
 g.beginPath();g.moveTo(x-40,y-12);g.lineTo(x-40,y-101);g.quadraticCurveTo(x-40,y-118,x-24,y-118);g.lineTo(x+24,y-118);g.quadraticCurveTo(x+40,y-118,x+40,y-101);g.strokeStyle='rgba(255,255,255,.14)';g.lineWidth=1;g.stroke();g.restore();
 /* arco de dovelas alrededor de la abertura */
 g.save();g.beginPath();g.arc(x,OY,R+9,Math.PI,0);g.lineTo(x+R,OY);g.arc(x,OY,R,0,Math.PI,true);g.closePath();g.fillStyle=PL.l;g.fill();
 g.strokeStyle=PL.d;g.lineWidth=1;for(let k=0;k<=8;k++){const a=Math.PI+k*Math.PI/8;g.beginPath();g.moveTo(x+Math.cos(a)*R,OY+Math.sin(a)*R);g.lineTo(x+Math.cos(a)*(R+9),OY+Math.sin(a)*(R+9));g.stroke()}
 g.beginPath();g.arc(x,OY,R+9,Math.PI,0);g.lineWidth=2;g.strokeStyle=PL.m;g.stroke();g.restore();
 P2(PL.l,x-R-9,OY,9,y-10-OY);P2(PL.d,x-R-9,OY,1,y-10-OY);P2(PL.d,x-R-1,OY,1,y-10-OY);P2(PL.l,x+R,OY,9,y-10-OY);P2(PL.d,x+R+8,OY,1,y-10-OY);P2(PL.d,x+R,OY,1,y-10-OY);
 /* la abertura: vacío oscuro + luz de otro mundo */
 g.save();g.beginPath();g.moveTo(x-R,y-10);g.lineTo(x-R,OY);g.arc(x,OY,R,Math.PI,0);g.lineTo(x+R,y-10);g.closePath();g.clip();
 g.fillStyle='rgba(6,8,18,.92)';g.fillRect(x-R,OY-R,R*2,y-OY+R);
 g.globalCompositeOperation='lighter';
 const gr=g.createLinearGradient(0,OY-R,0,y-10);gr.addColorStop(0,'rgba('+rgb+',.10)');gr.addColorStop(.55,'rgba('+rgb+',.38)');gr.addColorStop(1,'rgba('+rgb+',.85)');g.fillStyle=gr;g.fillRect(x-R,OY-R,R*2,y-OY+R);
 for(let k=0;k<6;k++){const yy=y-10-((t*9+k*15)%88),al=.22*(1-(y-10-yy)/88);g.fillStyle='rgba('+A+','+al+')';g.fillRect(x-R,yy,R*2,2+(k%2))}
 if(b==='ban'){for(let k=0;k<3;k++){g.fillStyle='rgba(225,246,255,'+(.10+.05*Math.sin(t+k))+')';g.beginPath();g.ellipse(x+Math.sin(t*.8+k*2.1)*9,y-26-k*17+Math.sin(t*1.1+k)*4,13,5,0,0,7);g.fill()}}
 else if(b==='nec'){const sw=((t*14)%110)-30;g.save();g.translate(x,OY);g.rotate(-.55);g.fillStyle='rgba(230,200,255,.20)';g.fillRect(sw-40,-60,9,150);g.fillStyle='rgba(230,200,255,.10)';g.fillRect(sw-26,-60,4,150);g.restore();
  g.strokeStyle='rgba(214,160,255,.35)';g.lineWidth=1;g.strokeRect(x-R+3,OY-R+6,R*2-6,y-OY+R-18)}
 else{for(let k=0;k<4;k++){g.fillStyle='rgba(20,60,10,.35)';g.beginPath();g.ellipse(x+Math.sin(t*.6+k*1.9)*10,y-24-k*15,7,3,.6,0,7);g.fill()}
  for(let k=0;k<5;k++){const a=.5+.5*Math.sin(t*1.7+k*2.3);g.fillStyle='rgba(235,255,140,'+a+')';g.fillRect(Math.round(x-14+((k*9+t*3)%28)),Math.round(y-18-k*13+Math.sin(t+k)*3),2,2)}}
 for(let k=0;k<9;k++){const pr=((t*.22+k*.113)%1),yy=y-12-pr*86,xx=x+Math.sin(t*1.3+k*2.4)*(R-5)*(.5+.5*Math.sin(k*3.1));g.fillStyle='rgba(255,255,255,'+(.8*Math.sin(pr*3.14))+')';g.fillRect(Math.round(xx),Math.round(yy),2,2)}
 g.restore();
 /* sombra interior del marco (da profundidad) */
 g.save();g.beginPath();g.moveTo(x-R,y-10);g.lineTo(x-R,OY);g.arc(x,OY,R,Math.PI,0);g.lineTo(x+R,y-10);g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=3;g.stroke();g.restore();
 /* runas laterales que brillan por turnos */
 for(let s=-1;s<=1;s+=2)for(let k=0;k<3;k++){const rx=x+s*(R+19),ry=y-66+k*18-18,a=.35+.55*Math.max(0,Math.sin(t*1.2+k*1.3+s));
  P2('rgba('+A+','+a+')',rx-1,ry-5,2,10);P2('rgba('+A+','+a+')',rx-4,ry-1,8,2);if(k===1)P2('rgba('+A+','+a+')',rx-3,ry-4,6,2);glow(rx,ry,13,A,.22*a)}
 /* emblema sobre el arco y braseros */
 EMB[b](x,y,t);glow(x,y-106,28,A,.14+.06*Math.sin(t*1.5));
 brazier(x-62,y+2,t,PL,1);brazier(x+62,y+2,t,PL,2);
 g.save();g.textAlign='center';g.font='bold 12px Georgia,serif';g.lineWidth=3.5;g.strokeStyle='rgba(0,0,0,.92)';const nm='✦ Santuario · '+(M.BN&&M.BN[b]||'')+' ✦';g.strokeText(nm,x,y-134);g.fillStyle='#ffe9a0';g.fillText(nm,x,y-134);g.restore()}
/* gancho del bucle de dibujo (antes de las criaturas) */
M.ground=function(cx,cy,now){
 if(!ST.ready||(typeof LZ=='function'&&LZ()))return;const w=M.where();
 HX=P.x-cx;HY=P.y-cy;
 for(const b of ID){const g2=geo(b);if(!g2||!M.inRect(b,w.x,w.y,34))continue;
  if(b==='rap'&&window.MJRAP&&MJRAP.ready&&!MJRAP.ready())continue;   /* v437: el bosque (árboles y senderos) se coloca antes que la decoración */
  const dc=g2.dc||(g2.dc=mkDecor(b));
  for(const o of dc){const x=o.x-cx,y=o.y-cy;if(x<-40||x>VW+40||y<(o.floor?-36:-20)||y>VH+90)continue;PAINT[o.t](x,y,o.v,now)}
  g2.gp.forEach(p=>drawNode(b,p,cx,cy,now));if(g2.door&&!g2.va)drawDoor(b,g2.door,cx,cy,now);g2.npc.forEach((n,i)=>drawNpc(b,i,n,cx,cy,now))}};
/* mapa del mundo: contorno de los territorios (desde 10 niveles antes del acceso) y santuarios ya descubiertos */
M.map=function(m,X,Y,ins,sc){if(!ST.ready)return;const z=(typeof MV!='undefined'&&MV.z)||1;
 for(const b of ID){const s=bs(b),g2=s&&s.geo;if(!g2||(P.lv|0)<s.min-10)continue;const r=g2.r,th=THEME[b];
  m.save();m.lineWidth=2;m.setLineDash([6,4]);m.strokeStyle='rgba('+th.fog+',.9)';m.fillStyle='rgba('+th.fog+',.10)';m.fillRect(X(r[0]),Y(r[1]),r[2]*sc,r[3]*sc);m.strokeRect(X(r[0]),Y(r[1]),r[2]*sc,r[3]*sc);m.setLineDash([]);
  if(z>=1.6){m.font='bold 11px Georgia,serif';m.textAlign='center';const tx=X(r[0]+r[2]/2),ty=Y(r[1])+14,t=th.ic+' '+s.terr+' · Nv '+s.min+'+';m.fillStyle='#000';m.fillText(t,tx+1,ty+1);m.fillStyle='#fff';m.fillText(t,tx,ty)}
  if(g2.door&&ins(g2.door[0],g2.door[1])){const x=X(g2.door[0]),y=Y(g2.door[1]);m.fillStyle='#ffd666';m.beginPath();m.arc(x,y,6,0,7);m.fill();m.strokeStyle='#000';m.lineWidth=1.5;m.stroke();m.font='13px serif';m.textAlign='center';m.fillStyle='#fff';m.fillText('🕯️',x,y-9);
   if(z>=2){m.font='bold 10px Georgia,serif';m.fillStyle='#000';m.fillText('Santuario de '+s.n,x+1,y+19);m.fillStyle='#ffe9a8';m.fillText('Santuario de '+s.n,x,y+18)}}
  m.restore()}};
/* ── ambientación: neblina y viñeta al acercarse, y cartel al entrar ── */
const css=document.createElement('style');
css.textContent='#mjvg,#mjtn,#mjfg{position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity .9s;z-index:0}'
+'#mjvg{background:radial-gradient(ellipse 72% 66% at 50% 52%,transparent 30%,rgba(var(--vg),var(--va)) 100%)}#mjtn{background:rgb(var(--tn));mix-blend-mode:multiply}'
+'#mjfg{background:radial-gradient(60% 38% at 18% 72%,rgba(var(--fc),.3),transparent 70%),radial-gradient(52% 34% at 80% 38%,rgba(var(--fc),.24),transparent 70%),radial-gradient(45% 30% at 50% 90%,rgba(var(--fc),.2),transparent 70%);background-size:140% 140%;animation:mjfog 26s ease-in-out infinite alternate;mix-blend-mode:screen}'
+'@keyframes mjfog{0%{background-position:0% 0%}100%{background-position:100% 60%}}'
+'#mjban{position:fixed;left:50%;top:14%;transform:translate(-50%,-14px);z-index:99990;pointer-events:none;text-align:center;opacity:0;padding:16px 46px;background:radial-gradient(ellipse at center,rgba(0,0,0,.62) 0%,rgba(0,0,0,.4) 55%,rgba(0,0,0,0) 78%);font-family:Cinzel,Georgia,serif;color:#f6e7c1;text-shadow:0 2px 6px #000,0 0 18px rgba(0,0,0,.9);transition:opacity .7s,transform .7s;max-width:92vw}'
+'#mjban.on{opacity:1;transform:translate(-50%,0)}#mjban b{display:block;font-size:clamp(18px,4.2vw,30px);letter-spacing:.06em}#mjban span{display:block;font-size:clamp(12px,2.6vw,15px);color:#ffd9a0;margin-top:4px}#mjban small{display:block;font-size:12px;color:#cdbf9a;margin-top:3px}';
document.head.appendChild(css);
const mkL=id=>{const d=document.createElement('div');d.id=id;return d},tn=mkL('mjtn'),vg=mkL('mjvg'),fg=mkL('mjfg'),cv=document.getElementById('c'),par=cv&&cv.parentNode?cv.parentNode:document.body,nx=cv?cv.nextSibling:null;
par.insertBefore(fg,nx);par.insertBefore(vg,fg);par.insertBefore(tn,vg);   /* debajo de los botones y paneles del juego; encima del lienzo */
const bn=document.createElement('div');bn.id='mjban';document.body.appendChild(bn);
let last=null,bt=0;
M.amb=function(){if(!ST.ready||typeof P=='undefined'||!P.chosen)return;
 if(typeof modal!='undefined'&&modal)bn.classList.remove('on');   /* el aviso de entrada no se pinta sobre paneles ni diálogos */
 const w=M.where(),inDg=(typeof LZ=='function'&&LZ());let best=null,bi=0;
 for(const b of ID){const r=geo(b)&&geo(b).r;if(!r)continue;const dx=Math.max(r[0]-w.x,0,w.x-(r[0]+r[2])),dy=Math.max(r[1]-w.y,0,w.y-(r[1]+r[3])),d=Math.hypot(dx,dy),it=Math.max(0,Math.min(1,1-d/16));if(it>bi){bi=it;best=b}}
 if(inDg)bi=0;
 if(best&&bi>0){const th=THEME[best],rs=document.documentElement.style;rs.setProperty('--fc',th.fog);rs.setProperty('--vg',th.vig);rs.setProperty('--va',th.vg);rs.setProperty('--tn',th.tn);vg.style.opacity=bi.toFixed(2);fg.style.opacity=(bi*.9).toFixed(2);tn.style.opacity=(bi*.8).toFixed(2)}else{vg.style.opacity=0;fg.style.opacity=0;tn.style.opacity=0}
 const inn=!inDg&&best&&bi>=1?best:null;
 if(inn!==last){if(inn){const s=bs(inn);
   bn.innerHTML='<b>'+THEME[inn].ic+' '+s.terr+'</b><span>⚠️ Territorio de '+s.n+' · acceso desde Nv '+s.min+'</span><small>'+((P.lv|0)<s.min?'Tu nivel aún es bajo: las criaturas de aquí son peligrosas.':'Pulsa 📖 para ver tu diario de aventuras.')+'</small>';bn.classList.add('on');clearTimeout(bt);bt=setTimeout(()=>bn.classList.remove('on'),5200);M.entered&&M.entered(inn)}
  else bn.classList.remove('on');last=inn}};
setInterval(()=>{try{M.amb()}catch(e){}},250);
})();
/* ═══════════ v433 · MINI-JEFES (cliente) · parte 3: estado, mensajes, botones, diálogo con NPC, Diario de aventuras y santuario ═══════════ */
(function(){
'use strict';
const M=window.MJC;if(!M||!M.ST)return;
const ST=M.ST,ID=['ban','nec','rap'],$=id=>document.getElementById(id),BS={ban:'Banshee',nec:'Necromancer',rap:'Velociraptor'};
const H=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bs=b=>ST.b[b],geo=b=>bs(b)&&bs(b).geo,ico={talk:'💬',find:'🔍',kill:'⚔️',deliver:'📦'};
const online=()=>typeof ONL=='function'&&ONL();
async function call(op,o,loud){try{return await SRNET.rpc(Object.assign({t:'x',op},o||{}))}catch(e){if(loud!==0)toast(String(e.message||e),4200);return null}}
/* ── estado: se pide al servidor al entrar y de vez en cuando; todo lo importante lo decide el servidor ── */
let busy=0,lt=0;
async function load(force){if(busy||!online()||typeof P=='undefined'||!P.chosen||!P.name)return;busy=1;
 try{const r=await call('mb.me',{},0);if(r&&r.bosses){ST.fights=r.fights|0;ST.off=(r.now||Date.now())-Date.now();ST.t=Date.now();r.bosses.forEach(x=>{const o=ST.b[x.id];if(o&&o.geo&&x.geo&&o.geo.dc&&!!o.geo.door===!!x.geo.door)x.geo.dc=o.geo.dc;ST.b[x.id]=x});ST.ready=1;lt=Date.now();redraw();hint();try{window.MJA&&MJA.sync&&MJA.sync()}catch(e){}}}catch(e){}busy=0}
M.load=load;
setInterval(()=>{if(!ST.ready){load();return}const near=M.terrAt(45),age=Date.now()-lt;if(open$()?age>15000:near?age>30000:age>300000)load()},2000);
const cdLeft=s=>Math.max(0,(s.cd|0)-(Date.now()-(ST.t||Date.now())));
const hm=ms=>{const m=Math.ceil(ms/6e4);return m>=60?Math.floor(m/60)+' h '+(m%60)+' min':m+' min'};
/* aviso de aventura nueva (una vez por sesión y jefe) */
function hint(){for(const b of ID){const s=bs(b);if(!s||ST.seen[b])continue;if((P.lv|0)>=s.min&&s.q&&s.q.s===0){ST.seen[b]=1;setTimeout(()=>{try{toast('📖 Nueva aventura disponible: '+s.terr+' · Pulsa 📖 para ver tu diario',5200)}catch(e){}},1500);break}}mjb()}
/* ── mensajes del servidor: mbq2 (misiones), mbq (cola/combate), mbr (resultado) ── */
M.msg=function(m){try{
 if(m.t==='mbq2'&&bs(m.b)){const s=bs(m.b),o=s.q;s.q=m.q;if(o&&m.q){if(m.q.s>o.s){const c=M.curStep(m.b);toast('✅ Objetivo cumplido'+(c?' · Ahora: '+c.n:' · ¡Aventura completa!'),4200);if(!m.q.done&&(P.lv|0)>=0)load()}else if(m.q.s===o.s){const c=M.curStep(m.b);if(c&&c.k&&c.t!=='deliver')toast('📌 '+c.n+': '+c.p+'/'+c.k,2200)}}
  if(m.q&&m.q.done&&(!o||!o.done))load();redraw();return}
 if(m.t==='mbq'||m.t==='mbh'||m.t==='mbr'||m.t==='mbm'||m.t==='mbf'){if(window.MJA&&MJA.msg){MJA.msg(m);return}}   /* v434: cola, turno, pelea y resultado los lleva mjc5.js */
 if(m.t==='mbq'){if(m.why)toast('⚔️ '+m.why,4500);else if(m.st==='start')toast('⚔️ ¡Comienza el combate!',3000);return}
 if(m.t==='mbr'){toast(m.lost?'💀 El combate terminó sin victoria':'🏆 '+(m.txt||'Combate terminado'),5000);load()}}catch(e){}};
window.SRMJ={msg:M.msg};
/* ── estilos ── */
const css=document.createElement('style');
css.textContent='#mjd,#mjdl{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;background:rgba(5,3,10,.8);font-family:Georgia,serif;color:#f4e6c4}'
+'#mjd .c,#mjdl .c{width:min(800px,100vw);height:min(680px,100dvh);background:#1b120d;border:2px solid #9b7137;border-radius:14px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px #000}#mjdl .c{width:min(560px,100vw);height:auto;max-height:min(640px,100dvh)}'
+'#mjd .h,#mjdl .h{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#2a1a10;border-bottom:2px solid #9b7137}#mjd h3,#mjdl h3{margin:0;font-size:15px;white-space:nowrap}'
+'#mjd .tb{flex:1;display:flex;gap:5px;overflow-x:auto}#mjd button,#mjdl button{font:700 12px Georgia,serif;color:#fff1c8;background:#4a2f1a;border:1px solid #c9a35a;border-radius:8px;padding:8px 11px;cursor:pointer;white-space:nowrap;min-height:34px}'
+'#mjd button.on{background:#9b6a1f}#mjd button.go,#mjdl button.go{background:#2e7d32;border-color:#7bd27f}#mjd button:disabled,#mjdl button:disabled{opacity:.45}'
+'#mjd .b,#mjdl .b{flex:1;overflow-y:auto;padding:12px;font-size:13px;line-height:1.5}#mjd .hero{display:flex;gap:12px;align-items:center;background:#24160e;border:1px solid #6b4a2a;border-radius:12px;padding:10px;margin-bottom:10px}'
+'#mjd .hero canvas{position:relative;inset:auto;width:104px;height:104px;border-radius:10px;background:#0c0710;border:1px solid #5d4126;flex:none}#mjd .hero h2{margin:0 0 3px;font-size:18px;color:#ffe08a}#mjd small{color:#cdbf9a}'
+'#mjd .sec{margin:14px 0 6px;font-size:13px;font-weight:700;color:#ffd666;letter-spacing:.04em}#mjd .ms{background:#24160e;border:1px solid #5d4126;border-radius:10px;padding:10px;margin-bottom:9px}#mjd .ms.cur{border-color:#e0b04a;box-shadow:0 0 14px rgba(224,176,74,.22)}#mjd .ms.lock{opacity:.55}'
+'#mjd .mh{display:flex;justify-content:space-between;gap:8px;align-items:baseline}#mjd .bd{font-size:11px;padding:2px 8px;border-radius:9px;background:#3a2a18;border:1px solid #6b4a2a;white-space:nowrap}#mjd .bd.ok{background:#173a1d;border-color:#3f9a4d;color:#9be5a4}#mjd .bd.cu{background:#4a3410;border-color:#e0b04a;color:#ffe08a}'
+'#mjd .sp{display:flex;gap:8px;margin-top:7px;align-items:flex-start;font-size:12px}#mjd .sp.dn{opacity:.82}#mjd .sp b{display:block;color:#f4e6c4}#mjd .sp.dn b{color:#9be5a4}#mjd .bar{height:6px;background:#0d0805;border-radius:3px;overflow:hidden;margin-top:4px}#mjd .bar i{display:block;height:100%;background:linear-gradient(90deg,#c58a2b,#ffd66a)}'
+'#mjd .chip{display:inline-flex;gap:4px;align-items:center;font-size:11px;background:#1c120b;border:1px solid #5d4126;border-radius:8px;padding:2px 7px;margin:3px 4px 0 0}#mjd .chip.ok{border-color:#3f9a4d;color:#9be5a4}'
+'#mjd .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:7px}#mjd .kv{background:#24160e;border:1px solid #5d4126;border-radius:8px;padding:7px 9px;font-size:12px}#mjd .kv small{display:block}'
+'#mjd .st{display:inline-block;padding:1px 8px;border-radius:9px;font-size:11px;background:#173a1d;border:1px solid #3f9a4d;color:#9be5a4}#mjd .st.r{background:#4a3410;border-color:#e0b04a;color:#ffe08a}#mjd .st.a{background:#4a1a18;border-color:#d98a80;color:#ffb0a8}'
+'#mjd .note{background:#2a1d10;border:1px dashed #8d6a36;border-radius:8px;padding:8px 10px;font-size:12px;margin-top:8px;color:#e8d6a8}'
+'#mjdl .npc{display:flex;gap:12px;align-items:flex-start}#mjdl .npc img{width:72px;height:72px;image-rendering:pixelated;background:#0c0710;border:1px solid #5d4126;border-radius:10px;flex:none;padding:4px;object-fit:contain}'
+'#mjdl .say{font-style:italic;color:#f1e2bd;background:#24160e;border:1px solid #5d4126;border-radius:10px;padding:10px 12px;flex:1}#mjdl .acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}#mjdl .res{margin-top:10px;background:#173a1d;border:1px solid #3f9a4d;border-radius:8px;padding:8px 10px;color:#baf0c0}'
+'#mjdl .chip{display:inline-flex;gap:4px;font-size:11px;background:#1c120b;border:1px solid #5d4126;border-radius:8px;padding:2px 7px;margin:3px 4px 0 0}#mjdl .chip.ok{border-color:#3f9a4d;color:#9be5a4}'
+'#mjtr{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 8px);transform:translateX(-50%);z-index:9000;max-width:min(380px,46vw);background:linear-gradient(180deg,rgba(24,16,10,.82),rgba(14,9,6,.8));border:1px solid rgba(255,214,102,.5);border-radius:12px;padding:6px 11px;font:12px Georgia,serif;color:#f4e6c4;text-align:center;pointer-events:none;display:none;line-height:1.35;box-shadow:0 2px 12px rgba(0,0,0,.5)}#mjtr b{display:block;color:#ffd666;font-size:11px;letter-spacing:.04em}#mjtr i{display:block;height:4px;background:rgba(0,0,0,.6);border-radius:2px;margin-top:4px;overflow:hidden}#mjtr i u{display:block;height:100%;background:linear-gradient(90deg,#c58a2b,#ffd66a)}'
+'@media (max-height:520px),(max-width:900px){#mjtr{left:8px;top:calc(env(safe-area-inset-top,0px) + 94px);transform:none;max-width:min(300px,37vw);text-align:left}}'
+'#mjth{position:fixed;left:50%;top:22%;transform:translate(-50%,-8px);z-index:99995;pointer-events:none;opacity:0;transition:opacity .35s,transform .35s;text-align:center;font-family:Georgia,serif;color:#fff;text-shadow:0 2px 8px #000;background:rgba(14,9,6,.78);border:2px solid #ffd666;border-radius:16px;padding:10px 18px;min-width:230px;max-width:90vw}#mjth.on{opacity:1;transform:translate(-50%,0)}#mjth .ic{font-size:44px;line-height:1.1}#mjth .tx{font-size:14px;margin-top:2px}'
+'#mjth .mt{display:flex;gap:4px;justify-content:center;margin-top:8px}#mjth .mt u{width:34px;height:8px;border-radius:4px;background:#3a2c20;opacity:.7;text-decoration:none}#mjth .mt u.a{opacity:1;box-shadow:0 0 8px currentColor}'
+'html:not(.hud2off) body #rc .rrow>#mjb{width:calc(var(--k,1)*30px)!important;height:calc(var(--k,1)*30px)!important;font-size:calc(var(--k,1)*14px)!important;order:23;border-radius:13px!important;background:linear-gradient(180deg,rgba(84,56,30,.92),rgba(40,26,14,.94))!important;border:1px solid rgba(255,214,102,.55)!important;color:#fff!important;padding:0!important}'
+'.mjq{margin:10px 0 14px;display:grid;gap:6px;text-align:left}.mjq>b{font:700 12px Georgia,serif;color:#ffd666;letter-spacing:.04em}.mjqb{display:flex;gap:10px;align-items:center;width:100%;text-align:left;font:12px Georgia,serif;color:#f4e6c4;background:linear-gradient(180deg,#2a1a10,#1b120d);border:1px solid #9b7137!important;box-shadow:none!important;border-radius:10px;padding:7px 10px;cursor:pointer;min-height:40px}.mjqb .i{font-size:20px}.mjqb b{display:block;color:#ffe08a;font-size:13px}.mjqb small{display:block;color:#cdbf9a;font-size:11px}.mjqb:active{filter:brightness(1.25)}'
+'#mjb{display:none}#mjb.on{display:inline-block}#mjb.new{animation:mjpl 1.4s ease-in-out infinite}@keyframes mjpl{50%{box-shadow:0 0 14px 3px rgba(255,214,102,.85)}}';
document.head.appendChild(css);
/* ── botones ── */
const rowEl=document.querySelector('#rc .rrow'),mbtn=document.createElement('button');mbtn.id='mjb';mbtn.title='Diario de aventuras';mbtn.setAttribute('aria-label','Diario de aventuras');mbtn.textContent='📖';if(rowEl)rowEl.insertBefore(mbtn,$('menu')||null);
mbtn.onclick=()=>{if(typeof modal!='undefined'&&modal&&!open$())return;openDiary()};
const cx=$('ctx'),mk=(id,fn)=>{const b=document.createElement('button');b.id=id;b.hidden=true;b.onclick=fn;if(cx)cx.appendChild(b);return b};
const bTalk=mk('mjtalk',()=>{const t=bTalk._t;if(t)openDlg(t[0],t[1])}),bFind=mk('mjfind',()=>doFind()),bGat=mk('mjgat',()=>{const t=bGat._t;if(t)doGather(t[0],t[1])}),bShr=mk('mjshr',()=>{const t=bShr._t;if(t)openDiary(t,1)});
function mjb(){const on=ST.ready&&ID.some(b=>bs(b)&&(P.lv|0)>=bs(b).min-5);mbtn.classList.toggle('on',!!on);mbtn.classList.toggle('new',!!ID.some(b=>{const s=bs(b);return s&&(P.lv|0)>=s.min&&s.q&&s.q.s===0&&!ST['o'+b]}))}
const dist=(x,y)=>{const w=M.where();return Math.hypot(w.x-x,w.y-y)};
function ctxTick(){try{
 const hide=!ST.ready||(typeof modal!='undefined'&&modal)||(typeof LZ=='function'&&LZ())||(typeof P!='undefined'&&P.dead>0);
 let t=null,f=null,gp=null,sh=null;
 if(!hide)for(const b of ID){const s=bs(b),g2=s&&s.geo;if(!g2)continue;
  g2.npc.forEach((n,i)=>{if(!t&&dist(n.x,n.y)<=5.5)t=[b,i,n]});
  const c=M.curStep(b);if(!f&&c&&c.t==='find'&&(P.lv|0)>=s.min&&M.inRect(b,M.where().x,M.where().y,0))f=b;
  if(!gp&&s.q&&s.q.done)g2.gp.forEach(p=>{if(!gp&&dist(p.x,p.y)<=3.4)gp=[b,p.i,p]});
  if(!sh&&g2.door&&dist(g2.door[0],g2.door[1])<=5)sh=b}
 bTalk.hidden=!t;if(t){bTalk._t=t;const mkk=M.npcMark(t[0],t[1]);bTalk.textContent=(mkk==='!'?'❗ ':mkk==='?'?'❔ ':mkk?mkk+' ':'💬 ')+'Hablar con '+t[2].n}
 bFind.hidden=!f;if(f){bFind.textContent='🔍 Investigar';bFind._b=f}
 bGat.hidden=!gp;if(gp){bGat._t=gp;const m=(bs(gp[0]).q.mats||[]).find(x=>x.k===gp[2].m);bGat.textContent='✨ Recoger '+(m?m.n:'material')}
 bShr.hidden=!sh;if(sh){bShr._t=sh;bShr.textContent='🕯️ Santuario de '+BS[sh]}
 tracker(hide)}catch(e){}}
setInterval(ctxTick,180);
/* ── seguimiento del objetivo (arriba, en el centro) ── */
const tr=document.createElement('div');tr.id='mjtr';document.body.appendChild(tr);
function tracker(hide){let show=0;if(!hide){const b=M.terrAt(30);if(b){const s=bs(b),c=M.curStep(b);if(c&&(P.lv|0)>=s.min){show=1;let ex='';
  if(c.t==='talk'){const n=s.geo.npc.find(x=>x.n===c.npc);if(n){const w=M.where(),d=Math.round(Math.hypot(n.x-w.x,n.y-w.y)),a=Math.atan2(n.y-w.y,n.x-w.x),ar='→↘↓↙←↖↑↗'[(Math.round(a/(Math.PI/4))+8)%8];ex=' · '+ar+' '+d+' casillas'}}
  const pr=c.k?'<i><u style="width:'+Math.round(100*(c.p|0)/c.k)+'%"></u></i>':'';
  tr.innerHTML='<b>📖 '+H(c.mn)+'</b>'+H(c.n)+(c.k&&c.t!=='deliver'?' ('+(c.p|0)+'/'+c.k+')':'')+H(ex)+pr}}}
 tr.style.display=show?'block':'none'}
/* ── termómetro «caliente / frío» ── */
const th=document.createElement('div');th.id='mjth';document.body.appendChild(th);let tht=0;
const HC=['#ff4a2a','#ff9a3a','#ffd23a','#7fc4ff','#a9d8ff'];
function thermo(r){clearTimeout(tht);const i=r.hot|0;th.innerHTML='<div class="ic">'+H(r.ic)+'</div><div class="tx">'+H(r.txt)+'</div><div class="mt">'+[0,1,2,3,4].map(k=>'<u class="'+(k===i?'a':'')+'" style="background:'+HC[k]+';color:'+HC[k]+'"></u>').join('')+'</div>';th.classList.add('on');tht=setTimeout(()=>th.classList.remove('on'),3800)}
let fb=0;
async function doFind(){const b=bFind._b||M.terrAt(0);if(!b||fb)return;fb=1;bFind.disabled=true;
 try{const r=await call('mb.find',{b});if(r){if(r.found){toast(r.done?'🔎 ¡Hallazgo! Objetivo cumplido':'🔎 ¡Hallazgo!',3000);th.classList.remove('on');M.sparkle&&M.sparkle()}else if(r.wait)toast(r.txt,1800);else if(r.ic)thermo(r)}}finally{setTimeout(()=>{fb=0;bFind.disabled=false},900)}}
async function doGather(b,i){const r=await mop('mb.gather',{b,i});if(r){if(r.wait)toast('✨ '+r.txt+' (vuelve en '+Math.ceil((r.ms||0)/1000)+' s)',3000);else toast('✨ '+r.txt,2600);load()}}
/* ── diálogo con el NPC ── */
const LN={
 ban:{t0:'Las campanas del pueblo suenan solas cada noche… y no hay nadie en el campanario. Los vecinos huyeron; yo me quedé a cuidar lo que queda. Revisa las tres casas abandonadas: si hay cartas de la viuda, sus fragmentos nos dirán por qué sigue llorando.',
  f:'Busca fragmentos de cartas en las casas abandonadas. Pulsa 🔍 Investigar y fíjate en el termómetro: cuanto más caliente, más cerca estás.',
  k:'Los espectros del lamento rondan las casas. Derrótalos para que dejen de vigilar el secreto de la viuda.',
  d:'Con recuerdos, polvo espectral e hilo de plata podré hacer que la viuda cante por última vez. Los espectros del pueblo los llevan consigo.',
  te:'Aquí están todos sus recuerdos… Con esto, la viuda cantará por última vez. Toma este Medallón: es la ofrenda que ella reconoce. Con él podrás cruzar el umbral de la Mansión Embrujada.',
  rp:'¿Más recuerdos? Mi trabajo no termina: cada medallón es un adiós. Tráeme lo necesario y haré otro.',low:'La viuda es demasiado fuerte para ti todavía. Vuelve cuando seas nivel 35.'},
 nec:{t0:'Estudio estas ruinas desde hace años. Aquí se escribió un libro que no debió existir y sus páginas se esparcieron por la llanura. Encuéntralas antes de que los guardianes las vuelvan ceniza.',
  f:'Las páginas del libro ritual están entre las ruinas. Usa 🔍 Investigar: 🔥 caliente, ❄️ frío.',
  k:'Los guardianes malditos custodian el camino al Castillo. Abátelos: de lo que dejan sale lo que Ashar necesita.',
  d:'Ashar, el Herrero, repara las cruces rituales. Necesita fragmentos de espejo, polvo oscuro y páginas del ritual.',
  te:'Aquí tienes la Cruz del Ritual Prohibido, reparada. Los cuatro espejos del Salón te esperan en el Castillo Maldito. No mires demasiado tiempo a ninguno.',
  rp:'¿Otra cruz? Entonces tráeme fragmentos, polvo y páginas, y vuelvo a fundir el metal.',low:'La llanura devora a los imprudentes. Vuelve con nivel 65.'},
 rap:{t0:'Mi expedición entró en el Bosque de los Colmillos y no volvió. Algo grande se mueve entre la maleza alta: huellas enormes y ni una rama rota. Investiga las zonas de huellas; la maleza te esconderá… y a él también.',
  f:'Sigue las huellas. Pulsa 🔍 Investigar en las zonas de maleza: 🔥 caliente, ❄️ frío.',
  k:'Los raptores jóvenes patrullan el bosque. Redúcelos o nunca llegarás a los nidos.',
  d:'Necesito material del nido: huevos de señuelo, material natural y garras de raptor. Con eso prepararé el huevo que atraerá al alfa.',
  te:'Esto servirá. El Huevo del Depredador Ancestral: lo huelen desde muy lejos. Llévalo al Claro del Depredador… y no vayas solo si puedes evitarlo.',
  rp:'¿Otro huevo? El ciclo no se detiene. Tráeme lo necesario y lo prepararé.',low:'Eso que acecha no perdona a los novatos. Vuelve con nivel 100.'}};
const dl=document.createElement('div');dl.id='mjdl';dl.addEventListener('click',e=>{if(e.target===dl)closeDlg()});document.body.appendChild(dl);
function setModal(v){window.MJO=v?1:0;if(v)modal=1;else try{unm()}catch(e){modal=0}}
const hv=(k,h)=>Math.max(h|0,(P.fd&&P.fd[k])|0);   /* lo que llevas de verdad (inventario local) o lo que ya vio el servidor: el mayor */
const chips=(a)=>a.map(x=>'<span class="chip'+(hv(x.k,x.h)>=x.q?' ok':'')+'">'+H(M.MIC[x.k]||'')+' '+H(x.n)+' '+Math.min(x.q,hv(x.k,x.h))+'/'+x.q+'</span>').join('');
let dlg=null,dlres='';
function openDlg(b,i,res){dlg=[b,i];if(res!==undefined)dlres=res;else dlres='';setModal(1);dl.style.display='flex';drawDlg();
 (async()=>{try{save();if(SRNET.flush)await SRNET.flush();await load();if(dlg&&dlg[0]===b&&dlg[1]===i)drawDlg()}catch(e){}})()}
function closeDlg(){dl.style.display='none';dlg=null;setModal(0)}
function drawDlg(){if(!dlg)return;const[b,i]=dlg,s=bs(b),g2=s.geo,n=g2.npc[i],q=s.q,L=LN[b],c=M.curStep(b);let say='',body='',acts='';
 const near=dist(n.x,n.y)<=6.3;
 if((P.lv|0)<s.min)say=L.low+' <small>(Nivel mínimo: '+s.min+')</small>';
 else if(q.done){say=(g2.npc.findIndex(x=>x.n===q.craftNpc)===i?L.rp:'Ya hiciste lo que tenías que hacer aquí. Habla con '+q.craftNpc+' si necesitas otro encargo.');
  if(g2.npc.findIndex(x=>x.n===q.craftNpc)===i){const ok=Object.keys(q.rec).every(k=>hv(k,q.have[k])>=q.rec[k]);body='<div style="margin-top:8px"><b>🔨 '+H(q.ec)+'</b><br><small>'+H(q.ecd)+'</small><br>'+q.mats.map(m=>'<span class="chip'+(hv(m.k,q.have[m.k])>=q.rec[m.k]?' ok':'')+'">'+m.ic+' '+H(m.n)+' '+hv(m.k,q.have[m.k])+'/'+q.rec[m.k]+'</span>').join('')+'</div>';
   acts='<button class="go" data-a="craft"'+(ok&&near?'':' disabled')+'>🔨 Fabricar '+H(s.ofn)+'</button>'}}
 else if(!c)say='…';
 else if(c.t==='talk'){if(c.npc===n.n){say=c.end?L.te:L.t0;body='<small>'+H(c.d)+'</small>';acts='<button class="go" data-a="talk"'+(near?'':' disabled')+'>'+(c.end?'🗝️ Recibir la ofrenda':'💬 Aceptar')+'</button>'}else say='Lo que buscas lo tiene '+c.npc+'. Ve con '+(c.npc.indexOf(',')>0?c.npc.split(',')[0]:c.npc)+'.'}
 else if(c.t==='deliver'){say=L.d;body='<div>'+chips(c.m)+'</div>';const ok=c.m.every(x=>hv(x.k,x.h)>=x.q);acts='<button class="go" data-a="deliver"'+(ok&&near?'':' disabled')+'>📦 Entregar materiales</button>'}
 else if(c.t==='find'){say=L.f;body='<small>'+H(c.n)+': '+(c.p|0)+'/'+c.k+'</small>'}
 else if(c.t==='kill'){say=L.k;body='<small>'+H(c.n)+': '+(c.p|0)+'/'+c.k+'</small>'}
 dl.innerHTML='<div class="c"><div class="h"><h3>💬 '+H(n.n)+'</h3><span style="flex:1"></span><button data-a="x">✕</button></div><div class="b"><div class="npc"><img alt="" src="'+(function(){try{return icon('c'+n.c+'-down-1')}catch(e){return''}})()+'"><div class="say">'+say+'</div></div>'+body+(dlres?'<div class="res">'+H(dlres)+'</div>':'')+'<div class="acts">'+acts+'<button data-a="diary">📖 Diario</button></div>'+(near?'':'<div class="note" style="margin-top:8px">Acércate más a '+H(n.n)+' para hablar o entregar.</div>')+'</div></div>'}
dl.addEventListener('click',async e=>{const a=e.target.closest&&e.target.closest('button');if(!a||!dlg)return;const k=a.dataset.a,[b,i]=dlg;
 if(k==='x'){closeDlg();return}if(k==='diary'){closeDlg();openDiary(b);return}
 a.disabled=true;
 /* si el jugador cerró el diálogo mientras el servidor respondía, no se vuelve a abrir: solo se avisa con un aviso */
 const alive=()=>dlg&&dlg[0]===b&&dlg[1]===i,fin=(txt,quiet)=>{if(alive())openDlg(b,i,txt);else if(!quiet&&txt)toast(txt,3200)};
 if(k==='talk'){const r=await mop('mb.talk',{b});if(r){await load();if(r.end){toast('🗝️ '+r.txt,6000);fin(r.txt,1)}else fin('✔ '+(M.curStep(b)?'Siguiente: '+M.curStep(b).n:'¡Listo!'))}else if(alive())drawDlg()}
 else if(k==='deliver'){const r=await mop('mb.deliver',{b});if(r){await load();fin('✔ Materiales entregados')}else if(alive())drawDlg()}
 else if(k==='craft'){const r=await mop('mb.craft',{b});if(r){await load();toast('🔨 '+r.txt,3500);fin('🗝️ '+r.txt,1)}else if(alive())drawDlg()}});
/* ── Diario de aventuras + santuario ── */
const dd=document.createElement('div');dd.id='mjd';dd.addEventListener('click',e=>{if(e.target===dd)closeDiary()});document.body.appendChild(dd);
let cur='ban',pf=0,raf=0;
function open$(){return dd.style.display==='flex'}
function openDiary(b,toShrine){if(typeof b==='string')cur=b;else{const t=M.terrAt(40);if(t)cur=t;else{const best=ID.filter(x=>bs(x)&&(P.lv|0)>=bs(x).min-10).pop();if(best)cur=best}}
 ST['o'+cur]=1;setModal(1);dd.style.display='flex';dd.dataset.sh=toShrine?1:'';redraw();load(1);startPortrait();if(toShrine)setTimeout(()=>{const e=$('mjsh');if(e)e.scrollIntoView({block:'start'})},60)}
function closeDiary(){dd.style.display='none';cancelAnimationFrame(raf);raf=0;setModal(0);mjb()}
function stepHtml(s,live){const q=s.k?Math.round(100*(s.p|0)/s.k):0;
 return '<div class="sp'+(s.done?' dn':'')+'"><span>'+(s.done?'✅':s.cur?'▶️':ico[s.t]||'•')+'</span><div style="flex:1"><b>'+H(s.n)+(s.k&&s.t!=='deliver'?' <small>('+(s.p|0)+'/'+s.k+')</small>':'')+'</b><small>'+H(s.d)+'</small>'+(s.m&&!s.done?'<div>'+chips(s.m)+'</div>':'')+(s.k&&s.t!=='deliver'&&!s.done?'<div class="bar"><i style="width:'+q+'%"></i></div>':'')+'</div></div>'}
function misHtml(b,m,i){const bd=m.state==='done'?'<span class="bd ok">✔ Completada</span>':m.state==='cur'?'<span class="bd cu">▶ En curso</span>':'<span class="bd">🔒 Bloqueada</span>';
 return '<div class="ms '+m.state+'"><div class="mh"><b>Misión '+(i+1)+': '+H(m.n)+' <small>· Nv '+m.lv+'</small></b>'+bd+'</div><small>'+H(m.d)+'</small>'+(m.state==='lock'?'':m.st.map(stepHtml).join(''))+(i===2?'<div class="note">🎁 Recompensa: tu <b>primera ofrenda</b> y el descubrimiento del santuario. Las misiones son una sola vez por personaje.</div>':'')+'</div>'}
const AS={AVAILABLE:['Disponible',''],RESERVED:['Reservada','r'],ACTIVE:['En combate','a'],CLEANUP:['En limpieza','r']};
const atAltar=b=>{try{return!!(window.MJMAN&&MJMAN.nearAltar&&MJMAN.nearAltar(b))}catch(e){return false}};   /* v436: cada jefe tiene su altar (Banshee: sótano de la mansión · Necromancer: Salón de los Espejos) */
const LOC={ban:' · en una isla del lago · la ofrenda se deposita en el altar del SÓTANO',nec:' · en la llanura, a la vista desde lejos · la ofrenda se deposita en el altar del Salón de los Espejos, en el nivel más hondo del castillo',rap:' · en un bosque de colmillos gigantes · la ofrenda se deposita en el nido-altar del Claro del Depredador, la zona más honda del bosque'},ENT={ban:'entrada de la mansión',nec:'entrada del castillo',rap:'portal del bosque (arco de colmillos)'},ALT={ban:'🕯️ Acércate al altar del sótano (🕯️ Altar de la ofrenda): ahí se pide el turno y se deposita la ofrenda.',nec:'🕯️ Acércate al altar del Salón de los Espejos, en el último piso del castillo (🕯️ Altar de la ofrenda): ahí se pide el turno y se deposita la ofrenda.',rap:'🕯️ Acércate al nido-altar del Claro del Depredador, al fondo del bosque (🕯️ Nido-altar de la ofrenda): ahí se pide el turno y se deposita el Huevo.'};
function shrineHtml(b,s){let h='<div class="sec" id="mjsh">🕯️ Santuario de '+H(s.n)+'</div>';
 if(!s.disc)return h+'<div class="note">🔒 Santuario sin descubrir. Completa la aventura de descubrimiento de este territorio para conocer su ubicación y obtener tu primera ofrenda.</div>';
 const cd=cdLeft(s),ar=AS[s.st]||['—',''],ok=!s.err&&!cd;
 h+='<div class="grid"><div class="kv"><b>📍 Ubicación</b><small>'+H(s.arena)+(s.geo.va?(LOC[b]||''):'')+' · '+(ENT[b]||'entrada')+': X '+((s.geo.door||[])[0]||'?')+' · Y '+((s.geo.door||[])[1]||'?')+'</small></div>'
 +'<div class="kv"><b>📈 Niveles</b><small>Mínimo: Nv '+s.min+' · Jefe: Nv '+s.lv+'</small></div>'
 +'<div class="kv"><b>🗝️ Ofrenda</b><small>'+H(s.ofn)+' · tienes '+(s.of|0)+' (necesitas 1; la pone el líder)</small></div>'
 +'<div class="kv"><b>💎 Token</b><small>'+H(s.tkn)+' · tienes '+(s.tk|0)+'</small></div>'
 +'<div class="kv"><b>⚔️ Equipo exclusivo</b><small>'+H(s.eq)+'</small></div>'
 +'<div class="kv"><b>🏟️ Arena</b><small><span class="st '+ar[1]+'">'+ar[0]+'</span> · cola: '+(s.qn|0)+(s.pos?' · tu posición: '+s.pos:'')+'</small></div>'
 +'<div class="kv"><b>⏳ Tu recarga</b><small>'+(cd?'<span class="st r">'+hm(cd)+'</span> (12 h por jefe)':'<span class="st">Disponible</span>')+'</small></div>'
 +'<div class="kv"><b>👥 Party</b><small>'+(s.party&&s.party.length?H(s.party.join(', '))+' · líder: '+H(s.lead):'En solitario')+'</small></div></div>'
 +(s.err&&!cd?'<div class="note">ℹ️ '+H(s.err)+'</div>':'')
 +'<div class="note">⚖️ Una ofrenda por combate (la pone el líder y se gasta al empezar). Recompensa: una sola tirada por encuentro, para <b>un</b> participante al azar.</div>'
 +'<div style="margin-top:10px">'+(s.fight?'<button disabled>⚔️ En combate</button>':(s.pos>0||s.turn)?'<button id="mjleave">✕ Salir de la cola</button> <small>'+(s.turn?'¡Es tu turno! Confirma en el aviso de arriba.':'Posición '+s.pos+' de la cola.')+'</small>':'<button class="go" id="mjjoin" '+(s.open&&ok&&(!s.geo.va||atAltar(b))?'':'disabled')+'>⚔️ Pedir turno</button> <small>'+(!s.open?'El combate contra '+H(s.n)+' se abre en una próxima actualización.':cd?'Tu recarga sigue activa: podrás volver en '+hm(cd)+'.':s.geo.va&&!atAltar(b)?(ALT[b]||ALT.ban):'Necesitas nivel, ofrenda y estar en el territorio. En Party, solo el líder pide turno.')+'</small>')+'</div>';return h}
function craftHtml(b,s){const q=s.q;let h='<div class="sec">🔨 Encargo repetible · '+H(q.ec)+'</div>';
 if(!q.done)return h+'<div class="note">🔒 Se abre al terminar la aventura. Después podrás fabricar nuevas ofrendas con materiales del territorio.</div>';
 const ok=Object.keys(q.rec).every(k=>hv(k,q.have[k])>=q.rec[k]);
 return h+'<div class="ms"><small>'+H(q.ecd)+'</small><div>'+q.mats.map(m=>'<span class="chip'+(hv(m.k,q.have[m.k])>=q.rec[m.k]?' ok':'')+'">'+m.ic+' '+H(m.n)+' '+hv(m.k,q.have[m.k])+'/'+q.rec[m.k]+'</span>').join('')+'</div><div class="note">Los materiales caen de las criaturas del territorio y de los puntos ✨ de recolección. Entrégalos a <b>'+H(q.craftNpc)+'</b>'+(ok?' · ¡Ya tienes todo!':'')+'.</div></div>'}
function redraw(){if(!open$())return;const s=bs(cur);
 const tabs=ID.map(b=>bs(b)?'<button data-b="'+b+'" class="'+(b===cur?'on':'')+'">'+H(bs(b).ic)+' '+H(bs(b).n)+'</button>':'').join('');
 let body='<div class="note">Cargando…</div>';
 if(s){const lock=(P.lv|0)<s.min;
  body='<div class="hero"><canvas id="mjpc" width="104" height="104"></canvas><div><h2>'+H(s.ic)+' '+H(s.n)+'</h2><small>'+H(s.terr)+'</small><div style="margin-top:4px;font-size:12px">Acceso: <b>Nv '+s.min+'</b> · Jefe: <b>Nv '+s.lv+'</b> · Criaturas: Nv '+s.geo.mob.lv[0]+'–'+s.geo.mob.lv[1]+'</div><div style="margin-top:5px;font-size:12px;color:#e8d6a8">'+H(s.desc)+'</div></div></div>'
   +(lock?'<div class="note">🔒 Disponible desde el nivel '+s.min+'. Puedes visitar el territorio, pero sus criaturas son peligrosas para tu nivel.</div>':'')
   +'<div class="sec">📜 Aventura de descubrimiento <small>(una sola vez por personaje)</small></div>'+s.q.ms.map((m,i)=>misHtml(cur,m,i)).join('')+craftHtml(cur,s)+shrineHtml(cur,s)}
 dd.innerHTML='<div class="c"><div class="h"><h3>📖 Diario de aventuras</h3><div class="tb">'+tabs+'</div><button data-a="x">✕</button></div><div class="b">'+body+'</div></div>';
 if(dd.dataset.sh==='1'){dd.dataset.sh=''}
 const bb=dd.querySelector('.b');if(bb&&pf){bb.scrollTop=pf}}
dd.addEventListener('scroll',e=>{if(e.target.classList&&e.target.classList.contains('b'))pf=e.target.scrollTop},true);
dd.addEventListener('click',async e=>{const a=e.target.closest&&e.target.closest('button');if(!a)return;if(a.dataset.b){cur=a.dataset.b;pf=0;ST['o'+cur]=1;redraw();return}if(a.dataset.a==='x'){closeDiary();return}
 if(a.id==='mjjoin'){a.disabled=true;const r=await mop('mb.join',{b:cur});await load(1);if(r){const sk=r.skip&&r.skip.length?r.skip.map(x=>x.n+': '+x.why).join(' · '):'';closeDiary();toast('⚔️ Estás en la cola del santuario'+(sk?' · Sin turno: '+sk:''),sk?7000:3500)}else a.disabled=false;return}
 if(a.id==='mjleave'){a.disabled=true;await mop('mb.leave');await load(1);redraw()}});
/* retrato animado del jefe en la ficha */
function startPortrait(){cancelAnimationFrame(raf);const f=()=>{raf=requestAnimationFrame(f);const c=$('mjpc');if(!c||!M.FAMS)return;const x=c.getContext('2d'),fi={ban:3,nec:4,rap:5}[cur],F=M.FAMS[fi];if(!F||!F.cv)return;
  x.clearRect(0,0,104,104);const gr=x.createRadialGradient(52,60,6,52,60,70);gr.addColorStop(0,'rgba('+F.gl+',.30)');gr.addColorStop(1,'rgba(10,6,16,1)');x.fillStyle=gr;x.fillRect(0,0,104,104);
  const t=performance.now()/1000,col=F.cols==7?(Math.floor(t*6)%7):1,fl=F.fl?Math.sin(t*2)*3:0,sc=fi==5?1.0:1.2,w=F.fw*sc,h=F.fh*sc;x.imageSmoothingEnabled=false;x.drawImage(F.cv,col*F.fw,0,F.fw,F.fh,52-w/2,(fi==5?102-h:104-h)+fl-2,w,h)};f()}
/* tarjeta para la ventana «Misiones y tareas» del juego (la usa play.html con MJC.qhtml) */
M.qhtml=function(){if(!ST.ready)return'';let h='<div class="mjq"><b>📖 Aventuras de mini-jefes</b>';
 ID.forEach(b=>{const s=bs(b);if(!s)return;const lock=(P.lv|0)<s.min,c=M.curStep(b),q=s.q||{};
  const t=lock?'🔒 Desde el nivel '+s.min:q.done?(s.disc?'🕯️ Santuario descubierto':'✔ Aventura completa'):c?'▶ '+H(c.n)+(c.k&&c.t!=='deliver'?' ('+(c.p|0)+'/'+c.k+')':''):'…';
  h+='<button type="button" class="mjqb" onclick="MJC.openDiary(\''+b+'\')"><span class="i">'+H(s.ic)+'</span><span><b>'+H(s.n)+'</b><small>'+t+'</small></span></button>'});
 return h+'</div>'};
window.MJC.openDiary=openDiary;M.entered=b=>{if(ST.ready&&!ST['o'+b])mjb()};
M.sparkle=function(){};
})();
/* ═══════════ v435 · MINI-JEFES (cliente) · parte 6: EL ARTE DE LA MANSIÓN EMBRUJADA ═══════════
   Todo se hornea UNA VEZ en el navegador a partir de los dibujos que el juego ya trae (no se agrega ningún archivo al paquete):
   · los 4 pisos salen de la Mansión del Visir de Karez (kz_man.png) pasada por un «mapa de degradado» frío + telarañas, grietas, manchas, sombras de pared y luces de luna,
   · el SÓTANO de la Banshee es una sala nueva (muros de sillería, 6 columnas de mármol, arcos con luna, celdas de hierro, estatuas y altar de calaveras) armada con la hoja de la Red Subterránea,
   · la FACHADA sale del dibujo de la Iglesia (VBX.ig): piedra helada, tejados de pizarra, ventanas de luz espectral, hiedra seca, grietas, telarañas y farolas de llama azul. */
(function(){
'use strict';
const MJH=window.MJH={};
const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const rngf=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const cl=(v,a,b)=>v<a?a:v>b?b:v;
const hexa=(c,a)=>{const n=parseInt(c.slice(1),16);return'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+a+')'};
/* ── mapa de degradado: oscuro azulado → verde-gris frío → blanco hueso ── */
function lut(stops){const o=new Uint8Array(768);for(let i=0;i<256;i++){const t=i/255;let k=0;while(k<stops.length-2&&t>stops[k+1][0])k++;const a=stops[k],b=stops[k+1],u=cl((t-a[0])/(b[0]-a[0]),0,1);for(let c=0;c<3;c++)o[i*3+c]=Math.round(a[1][c]+(b[1][c]-a[1][c])*u)}return o}
const L_INT=lut([[0,[6,7,14]],[.22,[22,30,42]],[.48,[64,84,98]],[.74,[128,156,160]],[1,[212,230,226]]]);
const L_ROOF=lut([[0,[8,8,16]],[.4,[34,38,58]],[.75,[72,80,108]],[1,[120,130,156]]]);
const L_WALL=lut([[0,[8,10,18]],[.3,[30,38,54]],[.6,[78,94,114]],[.85,[132,150,166]],[1,[198,214,224]]]);
/* ── pasada de color por píxel (conserva el fuego y algo del tono de alfombras y maderas) ── */
function gradeInt(ctx,x,y,w,h,L,o){o=o||{};const id=ctx.getImageData(x,y,w,h),d=id.data,kp=o.keep!=null?o.keep:.5,fire=o.fire!=null?o.fire:1,gm=o.gamma||1.3,GL=new Uint8Array(256);for(let i=0;i<256;i++)GL[i]=Math.min(255,Math.round(Math.pow(i/255,gm)*255*.94));
 for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;const r=d[i],g=d[i+1],b=d[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx?(mx-mn)/mx:0,l=GL[(r*.299+g*.587+b*.114)|0];
  if(fire&&r>=g&&g>=b&&sat>.5&&mx>180){d[i]=r*.97;d[i+1]=g*.9;d[i+2]=b*.82;continue}
  const R=L[l*3],G=L[l*3+1],B=L[l*3+2],k=cl((sat-.2)*1.25,0,kp)*(l<150?1:.45);
  d[i]=R+(r*.74-R)*k;d[i+1]=G+(g*.72-G)*k;d[i+2]=B+(b*.78-B)*k}
 ctx.putImageData(id,x,y)}
/* ── tinte multiplicativo para sprites sueltos ── */
function tintSpr(ctx,x,y,w,h,m,add){const id=ctx.getImageData(x,y,w,h),d=id.data;for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;d[i]=cl(d[i]*m[0]+(add?add[0]:0),0,255);d[i+1]=cl(d[i+1]*m[1]+(add?add[1]:0),0,255);d[i+2]=cl(d[i+2]*m[2]+(add?add[2]:0),0,255)}ctx.putImageData(id,x,y)}
/* ═════════ decoración sobre el fondo de un piso (en píxeles del atlas: 16 por casilla) ═════════ */
const isW=(g,x,y)=>!g[y]||g[y][x]==null||g[y][x]=='#'||g[y][x]=='w';
function web(ctx,x,y,sx,sy,sz,R){/* telaraña en una esquina (x,y) que se abre hacia (sx,sy) */
 ctx.save();ctx.translate(x,y);ctx.scale(sx,sy);ctx.lineWidth=1;ctx.lineCap='round';const n=5;
 ctx.strokeStyle='rgba(214,228,238,.34)';for(let i=0;i<=n;i++){const a=i/n*Math.PI/2,len=sz*(.8+R()*.25);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*len,Math.sin(a)*len);ctx.stroke()}
 ctx.strokeStyle='rgba(214,228,238,.26)';for(let r=.28;r<=1;r+=.24){ctx.beginPath();for(let i=0;i<=n;i++){const a=i/n*Math.PI/2,len=sz*r*(.86+R()*.2),px=Math.cos(a)*len,py=Math.sin(a)*len;if(i==0)ctx.moveTo(px,py);else ctx.quadraticCurveTo(Math.cos(a-.15)*len*.8,Math.sin(a-.15)*len*.8,px,py)}ctx.stroke()}
 ctx.restore()}
function crack(ctx,x,y,R,len){let px=x,py=y,a=R()*6.28;ctx.beginPath();ctx.moveTo(px,py);for(let i=0;i<len;i++){a+=(R()-.5)*1.3;px+=Math.cos(a)*(2+R()*3);py+=Math.sin(a)*(2+R()*3);ctx.lineTo(px,py)}
 ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=1;ctx.stroke();ctx.translate(1,1);ctx.strokeStyle='rgba(180,200,220,.08)';ctx.stroke();ctx.translate(-1,-1)}
function blot(ctx,x,y,r,rgb,a){const q=ctx.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,'rgba('+rgb+','+a+')');q.addColorStop(1,'rgba('+rgb+',0)');ctx.fillStyle=q;ctx.fillRect(x-r,y-r,r*2,r*2)}
function dress(ctx,lv,seed,o){o=o||{};const R=rngf(seed),g=lv.g,ax=lv.ax,ay=lv.ay;
 ctx.save();ctx.beginPath();ctx.rect(ax,ay,lv.w*16,lv.h*16);ctx.clip();
 for(let y=0;y<lv.h;y++)for(let x=0;x<lv.w;x++){if(g[y][x]=='#'||g[y][x]=='w')continue;const px=ax+x*16,py=ay+y*16,N=isW(g,x,y-1),S=isW(g,x,y+1),W=isW(g,x-1,y),E=isW(g,x+1,y);
  /* sombra de oclusión junto a los muros */
  if(N){const q=ctx.createLinearGradient(0,py,0,py+9);q.addColorStop(0,'rgba(2,4,10,.48)');q.addColorStop(1,'rgba(2,4,10,0)');ctx.fillStyle=q;ctx.fillRect(px,py,16,9)}
  if(W){const q=ctx.createLinearGradient(px,0,px+7,0);q.addColorStop(0,'rgba(2,4,10,.36)');q.addColorStop(1,'rgba(2,4,10,0)');ctx.fillStyle=q;ctx.fillRect(px,py,7,16)}
  if(E){const q=ctx.createLinearGradient(px+16,0,px+9,0);q.addColorStop(0,'rgba(2,4,10,.36)');q.addColorStop(1,'rgba(2,4,10,0)');ctx.fillStyle=q;ctx.fillRect(px+9,py,7,16)}
  if(S){const q=ctx.createLinearGradient(0,py+16,0,py+9);q.addColorStop(0,'rgba(2,4,10,.3)');q.addColorStop(1,'rgba(2,4,10,0)');ctx.fillStyle=q;ctx.fillRect(px,py+9,16,7)}
  /* telarañas en las esquinas interiores */
  if(N&&W&&R()<(o.web!=null?o.web:.75))web(ctx,px,py,1,1,10+R()*8,R);
  if(N&&E&&R()<(o.web!=null?o.web:.75))web(ctx,px+16,py,-1,1,10+R()*8,R);
  if(S&&W&&R()<.28)web(ctx,px,py+16,1,-1,7+R()*5,R);
  if(S&&E&&R()<.28)web(ctx,px+16,py+16,-1,-1,7+R()*5,R);
  /* grietas y manchas en el suelo abierto */
  if(!N&&!S&&!W&&!E){const q=R();if(q<.06)crack(ctx,px+R()*16,py+R()*16,R,3+(R()*4|0));else if(q<.1)blot(ctx,px+8,py+8,9+R()*8,'8,38,34',.2+R()*.12);else if(q<.125)blot(ctx,px+8,py+8,6+R()*6,'70,8,12',.26)}}
 ctx.restore()}
/* ═════════ pisos (G, 1, 2): se parten del dibujo original (ya copiado en el atlas) ═════════ */
function bakeFloor(ctx,lv0,seed){const w=lv0.w*16,h=lv0.h*16;
 for(const yy of[lv0.ay,lv0.fy])gradeInt(ctx,lv0.ax,yy,w,h,L_INT,{keep:.34});
 dress(ctx,lv0,seed,{})}
/* ═════════ el SÓTANO de la Banshee (sala nueva, 29×19 casillas) ═════════ */
const SW=29,SH=19,FYo=704;      /* casillas · desplazamiento de la banda de primer plano */
const ARCH=k=>[k*49,0,48,63];
const UG={col:[[57,121],[76,121],[95,121],[114,121],[152,121],[171,121]],colw:18,colh:47,guard:[446,169,22,40],pries:[469,170,22,39],
 alt:[185,261,40,28],gate:[[613,220,32,34],[679,220,48,34]]};
/* pilares del salón: base (centro) en píxeles del atlas, relativos al nivel */
MJH.COLS=[[88,140],[360,140],[88,248],[360,248],[160,194],[288,194]];
/* el marco de la pelea (26×17 casillas) arranca en la casilla (FX,FY) de la escena */
MJH.FX=1;MJH.FY=1;MJH.SW=SW;MJH.SH=SH;
MJH.ALTAR=[224,66];                      /* píxeles del atlas: donde se ofrenda */
MJH.RING=[224,184];                      /* centro del círculo ritual (atlas px) */
function brick(ctx,x,y,w,h,R,o){o=o||{};const cols=o.cols||['#2a3040','#313849','#38405a','#262c3b','#343c52','#2d3445'],bh=o.bh||8;
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.fillStyle='#10131c';ctx.fillRect(x,y,w,h);
 for(let r=0,yy=y;yy<y+h;r++,yy+=bh){let xx=x-((r%2)?7:0)-(R()*3|0);while(xx<x+w){const bw=13+(R()*7|0),c=cols[(R()*cols.length)|0];ctx.fillStyle=c;ctx.fillRect(xx+1,yy+1,bw-1,bh-1);
   ctx.fillStyle='rgba(255,255,255,.07)';ctx.fillRect(xx+1,yy+1,bw-1,1);ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(xx+1,yy+bh-1,bw-1,1);
   for(let k=0;k<4;k++){ctx.fillStyle=R()<.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.14)';ctx.fillRect(xx+1+(R()*(bw-2)|0),yy+1+(R()*(bh-2)|0),1+(R()*2|0),1)}xx+=bw}}
 if(o.moss)for(let i=0;i<o.moss;i++){blot(ctx,x+R()*w,y+h-R()*Math.min(h,14),5+R()*8,'44,70,52',.4)}
 ctx.restore()}
/* recorte de la hoja (opcionalmente teñido) como lienzo suelto */
function cut(ug,r,m,add){const c=mk(r[2],r[3]),q=c.getContext('2d');q.drawImage(ug,r[0],r[1],r[2],r[3],0,0,r[2],r[3]);if(m)tintSpr(q,0,0,r[2],r[3],m,add);return c}
function put(at,cv,dx,dy,fg){at.drawImage(cv,dx,dy);if(fg)at.drawImage(cv,dx,dy+FYo)}
/* casillas de suelo limpias del sótano original (sin muebles ni sombras): se buscan por color */
function cleanTiles(raw){const q=raw.getContext('2d'),id=q.getImageData(0,0,544,352).data,out=[];const mean=(tx,ty)=>{let r=0,g=0,b=0,n=0,sq=0;for(let y=0;y<16;y++)for(let x=0;x<16;x++){const i=((ty*16+y)*544+tx*16+x)*4;r+=id[i];g+=id[i+1];b+=id[i+2];n++;sq+=id[i]*id[i]}return[r/n,g/n,b/n,Math.sqrt(Math.max(0,sq/n-(r/n)*(r/n)))]};
 for(let ty=3;ty<=20;ty++)for(let tx=1;tx<=29;tx++){const m=mean(tx,ty);if(Math.abs(m[0]-96)<9&&Math.abs(m[1]-99)<9&&Math.abs(m[2]-116)<10&&m[3]<14)out.push([tx,ty])}
 return out}
function bakeSotano(at,ug,gr,raw){
 const R=rngf(4350),W=SW*16,H=SH*16;
 at.clearRect(0,0,544,352);at.clearRect(0,FYo,544,352);at.fillStyle='#07080e';at.fillRect(0,0,W,H);
 /* suelo: casillas limpias del suelo original (ya teñido) elegidas al azar */
 let CL=cleanTiles(raw);if(CL.length<6)CL=[[3,3],[4,3],[5,3],[6,3]];
 for(let y=4;y<=16;y++)for(let x=2;x<=25;x++){const c=CL[(R()*CL.length)|0];at.drawImage(gr,c[0]*16,c[1]*16,16,16,x*16,y*16,16,16)}
 /* muros: norte alto (4 casillas), laterales y sur */
 brick(at,0,0,W,64,R,{moss:6});brick(at,0,64,16,H-64,R);brick(at,W-16*3,64,16*3,H-64,R);brick(at,16,17*16,W-48,32,R,{moss:5});brick(at,16,64,16,13*16+16,R);brick(at,26*16,64,16,5*16,R);brick(at,26*16,13*16,16,4*16+16,R);
 /* cornisa y zócalo del muro norte, pilastras */
 for(let x=0;x<W;x++){at.fillStyle=(x&3)==0?'#171b27':'#1d2230';at.fillRect(x,0,1,5)}at.fillStyle='rgba(180,200,230,.09)';at.fillRect(0,5,W,1);
 at.fillStyle='#161a26';at.fillRect(16,58,W-48,6);at.fillStyle='rgba(190,210,240,.1)';at.fillRect(16,58,W-48,1);at.fillStyle='rgba(0,0,0,.35)';at.fillRect(16,63,W-48,1);
 for(const px of[28,132,316,420]){at.fillStyle='#232938';at.fillRect(px-4,5,8,53);at.fillStyle='rgba(190,210,240,.12)';at.fillRect(px-4,5,1,53);at.fillStyle='rgba(0,0,0,.3)';at.fillRect(px+3,5,1,53);at.fillStyle='#2a3144';at.fillRect(px-5,5,10,3);at.fillRect(px-5,55,10,3)}
 /* arcos con luna (hoja de la Red Subterránea): el interior beige pasa a luz de luna azulada */
 for(const[cx,k]of[[72,6],[224,3],[376,6]]){const a=ARCH(k),cv=cut(ug,a),q=cv.getContext('2d'),id=q.getImageData(0,0,a[2],a[3]),d=id.data;
  for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;const r=d[i],g=d[i+1],b=d[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=r*.3+g*.59+b*.11;
   if(mx-mn<80&&l>140&&b<=r+10){const t=l/255;d[i]=58+t*118;d[i+1]=88+t*128;d[i+2]=132+t*112}else{d[i]=r*.6;d[i+1]=g*.68;d[i+2]=b*.86}}q.putImageData(id,0,0);put(at,cv,cx-24,1,0)}
 /* rejas de celda a los lados del altar */
 for(const cx of[128,320]){const r=UG.gate[1];put(at,cut(ug,r,[.62,.7,.88]),cx-(r[2]>>1),64-r[3]-2,1)}
 /* estatuas de mármol (guardián y sacerdotisa) junto al altar */
 put(at,cut(ug,UG.guard,[.8,.88,1.05]),170-11,64-UG.guard[3]+2,1);put(at,cut(ug,UG.pries,[.8,.88,1.05]),278-11,64-UG.pries[3]+2,1);
 /* círculo ritual */
 const rc=MJH.RING;at.save();at.translate(rc[0],rc[1]);at.scale(1,.62);for(let k=0;k<3;k++){const r=[50,40,26][k];at.beginPath();at.arc(0,0,r,0,7);at.strokeStyle=k==0?'rgba(130,190,230,.55)':'rgba(130,190,230,.34)';at.lineWidth=k==0?2:1;at.stroke()}
 at.strokeStyle='rgba(150,205,240,.4)';at.lineWidth=1;for(let i=0;i<6;i++){const a=i/6*6.2832+.3;at.beginPath();at.moveTo(Math.cos(a)*50,Math.sin(a)*50);at.lineTo(Math.cos(a+2.0944)*50,Math.sin(a+2.0944)*50);at.stroke()}
 for(let i=0;i<12;i++){const a=i/12*6.2832;at.fillStyle='rgba(170,215,245,.55)';at.fillRect(Math.round(Math.cos(a)*45)-1,Math.round(Math.sin(a)*45)-1,3,3)}at.restore();blot(at,rc[0],rc[1],60,'60,110,160',.16);
 /* escalera original (ya teñida) en el muro este: casillas 31–33 filas 10–12 del dibujo viejo → 26–28 filas 9–11 */
 at.drawImage(gr,31*16,10*16,48,48,26*16,9*16,48,48);
 /* altar de calaveras */
 const alt=UG.alt,ax0=224-(alt[2]>>1),ay0=66-alt[3]+2;put(at,cut(ug,alt,[.86,.9,1.04]),ax0,ay0,1);
 /* oclusión del suelo contra los muros */
 const sh=(x0,y0,x1,y1,x2,y2,w,h,a)=>{const q=at.createLinearGradient(x0,y0,x1,y1);q.addColorStop(0,'rgba(2,4,10,'+a+')');q.addColorStop(1,'rgba(2,4,10,0)');at.fillStyle=q;at.fillRect(x2,y2,w,h)};
 sh(0,64,0,84,32,64,W-96,22,.55);sh(32,0,50,0,32,64,18,13*16,.45);sh(26*16,0,26*16-18,0,26*16-18,64,18,13*16,.45);sh(0,17*16,0,17*16-16,32,17*16-16,W-96,16,.42);
 /* manchas, grietas y telarañas */
 for(let i=0;i<46;i++){const x=40+R()*340,y=76+R()*180,q=R();if(q<.35)crack(at,x,y,R,3+(R()*5|0));else if(q<.62)blot(at,x,y,7+R()*9,'8,40,36',.2);else if(q<.72)blot(at,x,y,6+R()*6,'74,8,14',.3);else blot(at,x,y,8+R()*8,'2,3,8',.35)}
 for(const[x,y,sx,sy]of[[33,65,1,1],[409,65,-1,1],[33,270,1,-1],[409,270,-1,-1],[200,64,1,1],[248,64,-1,1]])web(at,x,y,sx,sy,12+R()*8,R);
 /* columnas de mármol: fondo y primer plano (se dibujan por encima de quien pasa por detrás) */
 const pr=[];MJH.COLS.forEach((c,i)=>{const r=UG.col[i%UG.col.length],dx=c[0]-9,dy=c[1]-UG.colh;
   at.fillStyle='rgba(0,0,0,.4)';at.beginPath();at.ellipse(c[0],c[1]-1,13,4,0,0,7);at.fill();
   put(at,cut(ug,[r[0],r[1],UG.colw,UG.colh],[.84,.92,1.06]),dx,dy,1);pr.push([dx,dy,UG.colw,UG.colh,Math.floor((c[1]-1)/16)])});
 pr.push([ax0,ay0,alt[2],alt[3],3]);pr.push([170-11,64-UG.guard[3]+2,UG.guard[2],UG.guard[3],3]);pr.push([278-11,64-UG.pries[3]+2,UG.pries[2],UG.pries[3],3]);
 return pr}
/* ═════════ niveles: se derivan de los de la Mansión del Visir ═════════ */
function lvlFrom(o,id,amb){const S=JSON.parse(JSON.stringify(o));S.id=id;S.hid='ban';S.np=[];S.ch=[];delete S.lb;S.amb=amb;return S}
const COLD=['150,190,240','120,170,235','170,210,245','110,150,215'];
function lights(S,seed){const R=rngf(seed);S.lt=S.lt.map((l,i)=>{if(i%2==0)return[l[0],l[1],l[2],COLD[(R()*COLD.length)|0],Math.min(.5,l[4]*.9),l[5]];return[l[0],l[1],l[2],l[3],l[4]*.55,l[5]]});return S}
MJH.levels=function(KZDlv){
 const o={};
 o.G=lights(lvlFrom(KZDlv['man.G'],'ban.G',[44,52,82]),11);
 o['1']=lights(lvlFrom(KZDlv['man.1'],'ban.1',[40,48,78]),12);
 o['2']=lights(lvlFrom(KZDlv['man.2'],'ban.2',[36,44,74]),13);
 const g=[];for(let y=0;y<SH;y++){let r='';for(let x=0;x<SW;x++){let c='#';if(y>=4&&y<=16&&x>=2&&x<=25)c='.';if(x>=26&&x<=27&&y>=9&&y<=11)c='U';r+=c}g.push(r)}
 const setc=(x,y,c)=>{g[y]=g[y].slice(0,x)+c+g[y].slice(x+1)};
 MJH.COLS.forEach(c=>setc(Math.floor(c[0]/16),Math.floor((c[1]-2)/16),'#'));
 for(const x of[10,11,12,13,14,17,18])setc(x,4,'#');          /* altar y estatuas pegados al muro */
 const S={id:'ban.S',hid:'ban',lv:'S',nm:'Sótano',w:SW,h:SH,g,pr:[],lt:[],fx:[],np:[],ch:[],ar:{R:[24,10]},ax:0,ay:0,fy:704,amb:[44,54,88]};
 S.lt=[[224,34,100,'160,205,255',.62,0],[224,150,92,'110,170,230',.34,0],[72,34,60,'140,190,250',.3,0],[376,34,60,'140,190,250',.3,0],[104,142,50,'120,170,235',.2,0],[344,142,50,'120,170,235',.2,0],[88,250,46,'255,190,120',.34,1],[360,250,46,'255,190,120',.34,1],[216,66,34,'255,176,100',.4,1],[240,66,34,'255,176,100',.4,1],[432,160,46,'255,200,130',.34,1]];
 S.fx=[['candle',206,62,1],['candle',242,62,1],['candle',216,58,1],['candle',232,58,1],['candle',110,252,1],['candle',338,252,1]];
 o.S=S;return o};
/* ═════════ construcción completa ═════════ */
MJH.build=function(src){/* src: {man:Image, ug:Image, ig:Image, lv: KZD.lv} → {atlas, levels, facade} */
 const A=mk(1152,1432),c=A.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(src.man,0,0);
 const lvs=MJH.levels(src.lv);
 const raw=mk(544,352);raw.getContext('2d').drawImage(src.man,0,0,544,352,0,0,544,352);
 const gr=mk(544,352),gc=gr.getContext('2d');gc.drawImage(src.man,0,0,544,352,0,0,544,352);gradeInt(gc,0,0,544,352,L_INT,{keep:.34});
 for(const[k,seed]of[['man.G',21],['man.1',22],['man.2',23]])bakeFloor(c,src.lv[k],seed);
 lvs.S.pr=bakeSotano(c,src.ug,gr,raw);
 A.complete=true;A.naturalWidth=1152;A.naturalHeight=1432;
 return{atlas:A,levels:lvs,facade:MJH.facade(src.ig)}};
/* ═════════ fachada (Iglesia) ═════════ */
const GLOW=[[183,370,1],[496,370,1],[183,503,.9],[497,503,.9],[56,424,.8],[622,424,.8],[271,545,.7],[407,545,.7],[183,152,.5],[495,152,.5]];   /* [x,y,fuerza] de las luces que parpadean */
MJH.GLOWS=GLOW;
MJH.facade=function(ig){
 const W=ig.naturalWidth||ig.width,H=ig.naturalHeight||ig.height,A=mk(W,H),c=A.getContext('2d');c.drawImage(ig,0,0);
 const id=c.getImageData(0,0,W,H),d=id.data,R=rngf(777);
 for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;const r=d[i],g=d[i+1],b=d[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx?(mx-mn)/mx:0,v=mx/255,l=(r*.299+g*.587+b*.114)|0,px=i>>2,x=px%W,y=(px/W)|0;
  const hh=sat<.02?0:mx==r?((g-b)/(mx-mn)+(g<b?6:0))*60:mx==g?((b-r)/(mx-mn)+2)*60:((r-g)/(mx-mn)+4)*60;
  let o,gl=0;
  if(sat>.5&&v>.62&&hh>26&&hh<64){/* ventanas y farolas: luz espectral */const t=v;o=[70+t*120,170+t*85,170+t*70];gl=1}
  else if(sat>.38&&(hh<24||hh>340)&&v>.4){/* tejas rojas → pizarra azul oscura con un rastro de óxido */const k=l*3;o=[L_ROOF[k]+10,L_ROOF[k+1],L_ROOF[k+2]]}
  else if(hh>70&&hh<170&&sat>.25){/* vegetación viva → seca y apagada */const k=l*3;o=[L_WALL[k]*.9+20,L_WALL[k+1]*.9+18,L_WALL[k+2]*.8]}
  else if(sat>.3&&hh>=24&&hh<48){/* madera y detalles anaranjados → oscuros */const k=l*3;o=[L_WALL[k]*.7+8,L_WALL[k+1]*.62+4,L_WALL[k+2]*.6+8]}
  else{const k=Math.min(255,(l*.92)|0)*3;o=[L_WALL[k],L_WALL[k+1],L_WALL[k+2]]}
  if(!gl){o=[Math.min(255,o[0]*1.26+5),Math.min(255,o[1]*1.26+6),Math.min(255,o[2]*1.22+10)]}   /* en el juego la noche lo oscurece: se levanta un poco para que la fachada se lea */
  d[i]=o[0];d[i+1]=o[1];d[i+2]=o[2]}
 c.putImageData(id,0,0);
 /* grietas, hiedra seca, musgo y telarañas */
 c.save();c.globalCompositeOperation='source-atop';
 for(let i=0;i<22;i++){const x=70+R()*540,y=170+R()*420;c.save();crack(c,x,y,R,5+(R()*8|0));c.restore()}
 for(let i=0;i<46;i++){const x=R()<.5?40+R()*70:530+R()*110,y=300+R()*340;blot(c,x,y,10+R()*20,'30,52,44',.32)}
 /* hiedra: tallos que suben por las esquinas */
 c.lineCap='round';for(let k=0;k<14;k++){let x=(k%2?70:610)+(R()-.5)*60,y=640-R()*30;c.beginPath();c.moveTo(x,y);const n=10+(R()*14|0);for(let j=0;j<n;j++){x+=(R()-.5)*14;y-=10+R()*14;c.lineTo(x,y)}c.strokeStyle='rgba(30,44,36,.78)';c.lineWidth=2;c.stroke();
  for(let j=0;j<n*.8;j++){const t=R(),lx=x+(R()-.5)*16,ly=y+(R())*140;c.fillStyle=R()<.5?'rgba(52,84,64,.7)':'rgba(34,60,48,.74)';c.fillRect(lx|0,ly|0,3,2)}}
 c.restore();
 /* sombra de abajo hacia arriba y viñeta */
 const q=c.createLinearGradient(0,H,0,H*.55);q.addColorStop(0,'rgba(4,8,18,.5)');q.addColorStop(1,'rgba(4,8,18,0)');c.globalCompositeOperation='source-atop';c.fillStyle=q;c.fillRect(0,0,W,H);
 const q2=c.createLinearGradient(0,0,0,H*.35);q2.addColorStop(0,'rgba(8,14,34,.42)');q2.addColorStop(1,'rgba(8,14,34,0)');c.fillStyle=q2;c.fillRect(0,0,W,H);
 c.globalCompositeOperation='source-over';return A};
/* v436: las herramientas de dibujo se comparten con el castillo del Necromancer (mjc7.js) */
MJH.K={mk,rngf,cl,hexa,lut,gradeInt,tintSpr,web,crack,blot,dress,brick,cut,put,cleanTiles,lvlFrom,isW};
})();
/* ═══════════ v436 · MINI-JEFES (cliente) · parte 7: EL ARTE DEL CASTILLO MALDITO ═══════════
   Igual que la mansión: todo se hornea UNA VEZ en el navegador con dibujos que el juego ya trae (no se agrega ningún archivo al paquete):
   · la FACHADA parte de la Iglesia (VBX.ig) teñida de piedra violeta con ventanas de fuego verde, y a su alrededor se levantan cuatro torres con tejados de pizarra,
     murallas rotas con almenas, torres traseras, estandartes rasgados, grietas, hiedra seca y escombros (todo dibujado aquí, con la misma paleta),
   · los 3 pisos de arriba salen de la Casa del Relojero de Karez (kz_rel.png) pasada por un «mapa de degradado» violeta + telarañas, grietas y círculos rituales,
   · el SALÓN DE LOS ESPEJOS es una sala nueva de 33×21 casillas: suelo de mármol negro-violeta, alfombra, trono oscuro, altar de calaveras, círculo ritual, 6 columnas y los 4 espejos. */
(function(){
'use strict';
const H=window.MJH;if(!H||!H.K)return;
const K=H.K,mk=K.mk,rngf=K.rngf,cl=K.cl,blot=K.blot,crack=K.crack,web=K.web,brick=K.brick,cut=K.cut,put=K.put;
const N=window.MJN={};
const FYo=704,SW=33,SH=21;
/* ── geometría del salón (píxeles del atlas: 16 por casilla; el mundo los dibuja al doble) ── */
N.SW=SW;N.SH=SH;N.FX=1;N.FY=1;N.FW=31;N.FH=19;                 /* marco de la pelea: casillas [1..31]×[1..19] de la escena */
N.MIR=[[88,152],[440,152],[88,268],[440,268]];                  /* base (centro) de cada espejo */
N.COLS=[[200,96],[328,96],[170,208],[358,208],[212,282],[316,282]];
N.RING=[264,198];N.ALTAR=[264,106];N.THRONE=[264,70];
N.MW=52;N.MH=88;                                                /* marco del espejo (px del atlas) */
/* contorno del cristal: arco ojival. (x,y) = centro de la base del espejo, s = escala (1 atlas · 2 mundo) */
N.glass=function(c,x,y,s){const hw=18*s,b=y-11*s,sp=y-58*s,ap=y-82*s;c.beginPath();c.moveTo(x-hw,b);c.lineTo(x-hw,sp);c.quadraticCurveTo(x-hw,sp-12*s,x,ap);c.quadraticCurveTo(x+hw,sp-12*s,x+hw,sp);c.lineTo(x+hw,b);c.closePath()};
/* ── mapas de degradado ── */
const L_NI=K.lut([[0,[6,4,14]],[.22,[26,16,46]],[.48,[72,52,104]],[.74,[134,112,158]],[1,[216,202,232]]]);        /* interiores */
const L_NW=K.lut([[0,[9,6,18]],[.28,[32,25,52]],[.58,[72,62,100]],[.84,[124,112,150]],[1,[196,186,220]]]);        /* fachada: piedra */
const L_NR=K.lut([[0,[6,4,12]],[.4,[28,21,48]],[.75,[60,46,90]],[1,[100,84,132]]]);                                /* tejados */
const STONE=['#2f2a45','#37314f','#3f395c','#2a2540','#343049','#2c2742'],MORT='#0f0b1a';
const hexa=K.hexa;
/* ═════════ pisos (G, 1, 2): se parten de la Casa del Relojero ═════════ */
const GRN=['90,235,150','120,255,170','70,215,135'],VIO=['170,110,255','200,140,255','150,92,232'];
function lightsN(S,seed){const R=rngf(seed);S.lt=S.lt.map((l,i)=>{const c=(i%2?VIO:GRN)[(R()*3)|0];return[l[0],l[1],l[2],c,Math.min(.56,l[4]*(i%2?.72:.98)),l[5]]});return S}
/* círculos rituales tenues en el suelo abierto (solo en el fondo) */
function ritual(c,lv,seed){const R=rngf(seed),g=lv.g,ax=lv.ax,ay=lv.ay;let n=0;
 for(let t=0;t<260&&n<5;t++){const x=3+(R()*(lv.w-6)|0),y=3+(R()*(lv.h-6)|0);let ok=true;
  for(let dy=-2;dy<=2&&ok;dy++)for(let dx=-2;dx<=2;dx++){const ch=(g[y+dy]||'')[x+dx];if(ch!=='.'){ok=false;break}}
  if(!ok)continue;n++;const px=ax+x*16+8,py=ay+y*16+8;c.save();c.translate(px,py);c.scale(1,.7);
  c.lineWidth=1;c.strokeStyle='rgba(120,255,170,.26)';for(const r of[28,21])for(let k=0;k<2;k++){c.beginPath();c.arc(0,0,r,0,7);c.stroke()}
  c.strokeStyle='rgba(180,120,255,.3)';for(let i=0;i<5;i++){const a=i/5*6.2832-1.57,b=(i+2)/5*6.2832-1.57;c.beginPath();c.moveTo(Math.cos(a)*21,Math.sin(a)*21);c.lineTo(Math.cos(b)*21,Math.sin(b)*21);c.stroke()}
  for(let i=0;i<10;i++){const a=i/10*6.2832;c.fillStyle='rgba(150,255,190,.4)';c.fillRect(Math.round(Math.cos(a)*25)-1,Math.round(Math.sin(a)*25)-1,2,2)}
  c.restore();blot(c,px,py,26,'60,200,120',.08)}}
/* ═════════ el SALÓN DE LOS ESPEJOS ═════════ */
const ARCH=k=>[k*49,0,48,63];
const UGp={col:[[57,121],[76,121],[95,121],[114,121],[152,121],[171,121]],colw:18,colh:47,guard:[446,169,22,40],pries:[469,170,22,39],alt:[185,261,40,28]};
function tile(c,x,y,R,odd){const base=odd?'#1c1631':'#241b3b';c.fillStyle=base;c.fillRect(x,y,16,16);
 c.fillStyle='rgba(205,185,255,.075)';c.fillRect(x,y,16,1);c.fillRect(x,y,1,16);c.fillStyle='rgba(0,0,0,.38)';c.fillRect(x,y+15,16,1);c.fillRect(x+15,y,1,16);
 const gl=c.createLinearGradient(x,y,x+16,y+16);gl.addColorStop(0,'rgba(190,160,255,.10)');gl.addColorStop(.45,'rgba(190,160,255,0)');c.fillStyle=gl;c.fillRect(x+1,y+1,14,14);
 for(let i=0;i<3;i++){c.fillStyle=R()<.5?'rgba(210,190,255,.07)':'rgba(0,0,0,.18)';c.fillRect(x+1+(R()*13|0),y+1+(R()*13|0),1+(R()*3|0),1)}}
function floorHall(c,R){for(let ty=4;ty<=18;ty++)for(let tx=3;tx<=29;tx++)tile(c,tx*16,ty*16,R,(tx+ty)&1);
 /* alfombra negra y violeta desde el trono: bordes dorados, hilo verde y rombos */
 const cx=N.THRONE[0],x0=cx-24,x1=cx+24,y0=76;
 const g1=c.createLinearGradient(x0,0,x1,0);g1.addColorStop(0,'#1a0a26');g1.addColorStop(.5,'#2c1240');g1.addColorStop(1,'#1a0a26');c.fillStyle=g1;c.fillRect(x0,y0,48,SH*16-y0-32);
 c.fillStyle='#a8873a';c.fillRect(x0,y0,2,SH*16-y0-32);c.fillRect(x1-2,y0,2,SH*16-y0-32);c.fillStyle='#2a9c66';c.fillRect(x0+4,y0,1,SH*16-y0-32);c.fillRect(x1-5,y0,1,SH*16-y0-32);
 c.fillStyle='rgba(255,220,130,.25)';for(let y=y0+8;y<SH*16-40;y+=24){c.beginPath();c.moveTo(cx,y-6);c.lineTo(cx+7,y);c.lineTo(cx,y+6);c.lineTo(cx-7,y);c.closePath();c.fill()}
 c.fillStyle='rgba(0,0,0,.25)';for(let y=y0;y<SH*16-32;y+=3)c.fillRect(x0+2,y,44,1)}
/* el círculo ritual del centro (el que brilla cuando hay combate) */
function circleHall(c){const rc=N.RING;c.save();c.translate(rc[0],rc[1]);c.scale(1,.62);
 for(let k=0;k<4;k++){const r=[84,70,50,30][k];c.beginPath();c.arc(0,0,r,0,7);c.strokeStyle=k==0?'rgba(120,255,175,.6)':k==3?'rgba(190,130,255,.5)':'rgba(150,110,230,.42)';c.lineWidth=k==0?2:1;c.stroke()}
 c.strokeStyle='rgba(120,255,175,.42)';c.lineWidth=1;for(let i=0;i<7;i++){const a=i/7*6.2832-1.57,b=(i+3)/7*6.2832-1.57;c.beginPath();c.moveTo(Math.cos(a)*70,Math.sin(a)*70);c.lineTo(Math.cos(b)*70,Math.sin(b)*70);c.stroke()}
 for(let i=0;i<28;i++){const a=i/28*6.2832;c.fillStyle=i%2?'rgba(190,140,255,.6)':'rgba(130,255,180,.6)';c.fillRect(Math.round(Math.cos(a)*77)-1,Math.round(Math.sin(a)*77)-1,3,3)}
 c.restore();blot(c,rc[0],rc[1],90,'80,40,160',.16);blot(c,rc[0],rc[1],60,'40,200,120',.1)}
/* trono oscuro: obsidiana con filo violeta, púas, calavera y gema verde */
function throne(c){const x=N.THRONE[0],b=N.THRONE[1],P=(col,a,y,w,h)=>{c.fillStyle=col;c.fillRect(Math.round(a),Math.round(y),w,h)};
 c.fillStyle='rgba(0,0,0,.45)';c.beginPath();c.ellipse(x,b+4,36,7,0,0,7);c.fill();
 P('#120c20',x-32,b-8,64,10);P('#1c1432',x-28,b-14,56,7);P('#2a1f48',x-28,b-14,56,1);                    /* dos peldaños */
 const g=c.createLinearGradient(x-17,0,x+17,0);g.addColorStop(0,'#0e0919');g.addColorStop(.5,'#2b2049');g.addColorStop(1,'#0e0919');
 c.fillStyle=g;c.beginPath();c.moveTo(x-17,b-14);c.lineTo(x-17,b-48);c.lineTo(x-10,b-56);c.lineTo(x-6,b-47);c.lineTo(x,b-62);c.lineTo(x+6,b-47);c.lineTo(x+10,b-56);c.lineTo(x+17,b-48);c.lineTo(x+17,b-14);c.closePath();c.fill();
 c.strokeStyle='rgba(190,150,255,.5)';c.lineWidth=1;c.stroke();
 P('#1a1230',x-26,b-34,10,24);P('#1a1230',x+16,b-34,10,24);P('#2f2352',x-26,b-34,10,2);P('#2f2352',x+16,b-34,10,2);                  /* brazos */
 P('#0b0716',x-15,b-26,30,14);P('#241a3e',x-15,b-26,30,2);P('#3a2c66',x-13,b-24,26,1);                       /* asiento */
 for(const[dx,h]of[[-24,9],[24,9],[-30,6],[30,6]])P('#cfc6e8',x+dx-1,b-34-h,2,h);                           /* púas */
 c.fillStyle='#e6e0f4';c.beginPath();c.ellipse(x,b-44,6,6.5,0,0,7);c.fill();P('#0b0716',x-4,b-46,3,3);P('#0b0716',x+1,b-46,3,3);P('#0b0716',x-1,b-42,2,3);P('#0b0716',x-3,b-39,6,1);   /* calavera */
 c.fillStyle='rgba(90,255,160,.9)';c.beginPath();c.arc(x,b-33,2.6,0,7);c.fill();blot(c,x,b-33,12,'90,255,160',.4);
 c.fillStyle='rgba(120,255,175,.75)';for(const sx of[-1,1]){c.beginPath();c.arc(x+sx*13,b-52+(sx>0?0:0),1.8,0,7);c.fill()}}
/* nicho en el muro norte detrás del trono: arco ojival oscuro con halo verde */
function alcove(c){const x=N.THRONE[0];c.save();c.beginPath();c.moveTo(x-50,66);c.lineTo(x-50,28);c.quadraticCurveTo(x-50,6,x,2);c.quadraticCurveTo(x+50,6,x+50,28);c.lineTo(x+50,66);c.closePath();c.clip();
 const g=c.createRadialGradient(x,50,4,x,50,64);g.addColorStop(0,'#1f1038');g.addColorStop(.6,'#0c0618');g.addColorStop(1,'#04020a');c.fillStyle=g;c.fillRect(x-52,0,104,68);
 for(let i=0;i<8;i++){c.fillStyle='rgba(120,255,175,'+(.05+.018*i)+')';c.beginPath();c.arc(x,52,52-i*6,Math.PI,0);c.fill()}
 c.restore();c.strokeStyle='#4a3f78';c.lineWidth=2;c.beginPath();c.moveTo(x-51,66);c.lineTo(x-51,28);c.quadraticCurveTo(x-51,5,x,0);c.quadraticCurveTo(x+51,5,x+51,28);c.lineTo(x+51,66);c.stroke();
 c.strokeStyle='rgba(200,170,255,.22)';c.lineWidth=1;c.beginPath();c.moveTo(x-53,66);c.lineTo(x-53,28);c.quadraticCurveTo(x-53,3,x,-2);c.stroke()}
/* ventana ojival con tormenta (muro norte) */
function windowN(c,x,y){c.save();c.beginPath();c.moveTo(x-9,y+40);c.lineTo(x-9,y+14);c.quadraticCurveTo(x-9,y+3,x,y);c.quadraticCurveTo(x+9,y+3,x+9,y+14);c.lineTo(x+9,y+40);c.closePath();c.clip();
 const g=c.createLinearGradient(0,y,0,y+40);g.addColorStop(0,'#52387f');g.addColorStop(.55,'#2a1c55');g.addColorStop(1,'#120b2a');c.fillStyle=g;c.fillRect(x-10,y,20,41);
 c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x,y+40);c.moveTo(x-10,y+17);c.lineTo(x+10,y+17);c.stroke();
 c.fillStyle='rgba(200,170,255,.18)';c.fillRect(x-7,y+4,2,32);c.restore();
 c.strokeStyle='#5b4f8a';c.lineWidth=2;c.beginPath();c.moveTo(x-10,y+41);c.lineTo(x-10,y+14);c.quadraticCurveTo(x-10,y+2,x,y-1);c.quadraticCurveTo(x+10,y+2,x+10,y+14);c.lineTo(x+10,y+41);c.stroke();
 c.fillStyle='#4a3f78';c.fillRect(x-12,y+40,24,3)}
/* antorcha de fuego verde (soporte; la llama la anima el motor con la luz) */
function sconce(c,x,y){c.fillStyle='#14101f';c.fillRect(x-2,y,4,16);c.fillStyle='#2c2442';c.fillRect(x-6,y-3,12,4);c.fillRect(x-5,y-8,10,6);c.fillStyle='#0b0814';c.fillRect(x-4,y-7,8,4);
 c.fillStyle='rgba(110,255,170,.95)';c.beginPath();c.moveTo(x-3,y-7);c.quadraticCurveTo(x-4,y-14,x,y-21);c.quadraticCurveTo(x+4,y-14,x+3,y-7);c.closePath();c.fill();c.fillStyle='rgba(230,255,240,.9)';c.fillRect(x-1,y-13,2,5);blot(c,x,y-12,18,'90,255,160',.35)}
/* espejo de pie: marco ojival de hierro y obsidiana con calavera y runas; el cristal oscuro lo anima el motor */
function mirror(c,cx,by){const s=1,P=(col,a,y,w,h)=>{c.fillStyle=col;c.fillRect(Math.round(a),Math.round(y),w,h)};
 c.fillStyle='rgba(0,0,0,.5)';c.beginPath();c.ellipse(cx,by-1,34,7,0,0,7);c.fill();
 const frame=()=>{c.beginPath();c.moveTo(cx-26,by-5);c.lineTo(cx-26,by-58);c.quadraticCurveTo(cx-26,by-72,cx,by-88);c.quadraticCurveTo(cx+26,by-72,cx+26,by-58);c.lineTo(cx+26,by-5);c.closePath()};
 const g=c.createLinearGradient(cx-26,0,cx+26,0);g.addColorStop(0,'#150f26');g.addColorStop(.3,'#3a2d63');g.addColorStop(.5,'#2a2048');g.addColorStop(1,'#0f0a1e');
 frame();c.fillStyle=g;c.fill();c.strokeStyle='#0a0614';c.lineWidth=2;c.stroke();
 /* cristal */
 c.save();N.glass(c,cx,by,1);const q=c.createLinearGradient(0,by-82,0,by-11);q.addColorStop(0,'#22134a');q.addColorStop(.5,'#12092b');q.addColorStop(1,'#070413');c.fillStyle=q;c.fill();
 c.clip();c.fillStyle='rgba(190,160,255,.13)';for(const o of[-12,-2,10]){c.beginPath();c.moveTo(cx+o,by-86);c.lineTo(cx+o+7,by-86);c.lineTo(cx+o-14,by-11);c.lineTo(cx+o-21,by-11);c.closePath();c.fill()}
 const gg=c.createRadialGradient(cx,by-46,2,cx,by-46,34);gg.addColorStop(0,'rgba(110,70,210,.28)');gg.addColorStop(1,'rgba(110,70,210,0)');c.fillStyle=gg;c.fillRect(cx-20,by-90,40,80);c.restore();
 N.glass(c,cx,by,1);c.strokeStyle='#07040f';c.lineWidth=2;c.stroke();c.strokeStyle='rgba(190,160,255,.5)';c.lineWidth=1;N.glass(c,cx,by-.5,1);c.stroke();
 /* filo claro del marco, remaches, runas verdes y calavera de la cima */
 frame();c.strokeStyle='rgba(170,150,230,.45)';c.lineWidth=1;c.stroke();
 for(const[x,y]of[[-22,-14],[22,-14],[-22,-40],[22,-40],[-22,-62],[22,-62]]){c.fillStyle='#8a7bc4';c.fillRect(cx+x-1,by+y,2,2)}
 c.fillStyle='rgba(120,255,175,.85)';for(let i=0;i<5;i++){c.fillRect(cx-23,by-20-i*9,1,4);c.fillRect(cx+22,by-24-i*9,1,4)}
 c.fillStyle='#e6e0f4';c.beginPath();c.ellipse(cx,by-84,5,5.5,0,0,7);c.fill();P('#0b0716',cx-3,by-86,2,2);P('#0b0716',cx+1,by-86,2,2);P('#0b0716',cx-1,by-82,2,2);
 c.fillStyle='#1a1230';c.fillRect(cx-3,by-92,6,5);
 /* peana */
 P('#0f0a1e',cx-32,by-8,64,8);P('#2a2048',cx-32,by-8,64,1);P('#3d3068',cx-28,by-7,56,1);P('#07040f',cx-32,by-1,64,1);
 for(const sx of[-1,1]){c.fillStyle='#8a7bc4';c.fillRect(cx+sx*27-1,by-8,2,2)}}
/* hoja de cada columna/estatua: recorte teñido de la hoja de la Red Subterránea (el mismo recurso de la mansión) */
function bakeHall(at,ug,gr){
 const R=rngf(4360),W=SW*16,Ht=SH*16;
 at.clearRect(0,0,544,352);at.clearRect(0,FYo,544,352);at.fillStyle='#06040c';at.fillRect(0,0,W,Ht);
 floorHall(at,R);
 /* muros: norte alto (4 casillas), laterales de 3 y sur de 2 */
 const BO={cols:STONE,bh:9};
 brick(at,0,0,W,64,R,Object.assign({moss:4},BO));brick(at,0,64,48,Ht-64,R,BO);brick(at,W-48,64,48,Ht-64,R,BO);brick(at,0,Ht-32,W,32,R,Object.assign({moss:4},BO));
 /* nicho del trono, cornisa, zócalo y pilastras */
 alcove(at);
 for(let x=0;x<W;x++){at.fillStyle=(x&3)==0?'#17112a':'#1e1736';at.fillRect(x,0,1,4)}at.fillStyle='rgba(190,170,255,.1)';at.fillRect(0,4,W,1);
 at.fillStyle='#16102a';at.fillRect(48,58,W-96,6);at.fillStyle='rgba(190,170,255,.12)';at.fillRect(48,58,W-96,1);at.fillStyle='rgba(0,0,0,.4)';at.fillRect(48,63,W-96,1);
 for(const px of[48,112,152,376,416,480]){at.fillStyle='#262040';at.fillRect(px-4,4,8,54);at.fillStyle='rgba(190,170,255,.14)';at.fillRect(px-4,4,1,54);at.fillStyle='rgba(0,0,0,.34)';at.fillRect(px+3,4,1,54);at.fillStyle='#322a52';at.fillRect(px-5,4,10,3);at.fillRect(px-5,55,10,3)}
 for(const wx of[200,328,76,452])windowN(at,wx,12);
 sconce(at,132,34);sconce(at,396,34);
 /* sombra de oclusión del suelo contra los muros */
 const sh=(x0,y0,x1,y1,x2,y2,w,h,a)=>{const q=at.createLinearGradient(x0,y0,x1,y1);q.addColorStop(0,'rgba(2,1,8,'+a+')');q.addColorStop(1,'rgba(2,1,8,0)');at.fillStyle=q;at.fillRect(x2,y2,w,h)};
 sh(0,64,0,86,48,64,W-96,22,.6);sh(48,0,66,0,48,64,18,15*16,.5);sh(W-48,0,W-66,0,W-66,64,18,15*16,.5);sh(0,Ht-32,0,Ht-48,48,Ht-48,W-96,16,.5);
 /* manchas, grietas, telarañas y escarcha verde */
 for(let i=0;i<56;i++){const x=56+R()*(W-112),y=72+R()*210,q=R();if(q<.3)crack(at,x,y,R,3+(R()*5|0));else if(q<.58)blot(at,x,y,7+R()*10,'20,70,60',.2);else if(q<.7)blot(at,x,y,6+R()*6,'80,10,40',.26);else blot(at,x,y,8+R()*8,'2,1,6',.4)}
 for(const[x,y,sx,sy]of[[49,65,1,1],[W-49,65,-1,1],[49,Ht-33,1,-1],[W-49,Ht-33,-1,-1],[212,64,1,1],[316,64,-1,1]])web(at,x,y,sx,sy,12+R()*9,R);
 circleHall(at);
 /* trono + altar de calaveras + estatuas de condenados junto al trono */
 throne(at);
 const alt=UGp.alt,ax0=N.ALTAR[0]-(alt[2]>>1),ay0=N.ALTAR[1]-alt[3]+2;put(at,cut(ug,alt,[.82,.78,1.1]),ax0,ay0,1);
 put(at,cut(ug,UGp.guard,[.78,.74,1.12]),N.THRONE[0]-62,92-UGp.guard[3],1);put(at,cut(ug,UGp.pries,[.78,.74,1.12]),N.THRONE[0]+40,92-UGp.pries[3],1);
 /* escalera original (ya teñida) en el muro este */
 at.drawImage(gr,400,160,48,48,30*16,12*16,48,48);
 /* columnas: fondo y primer plano */
 const pr=[];N.COLS.forEach((c,i)=>{const r=UGp.col[i%UGp.col.length],dx=c[0]-9,dy=c[1]-UGp.colh;
  at.fillStyle='rgba(0,0,0,.42)';at.beginPath();at.ellipse(c[0],c[1]-1,13,4,0,0,7);at.fill();
  put(at,cut(ug,[r[0],r[1],UGp.colw,UGp.colh],[.78,.74,1.12]),dx,dy,1);pr.push([dx,dy,UGp.colw,UGp.colh,Math.floor((c[1]-1)/16)])});
 pr.push([ax0,ay0,alt[2],alt[3],Math.floor((N.ALTAR[1]-1)/16)]);
 /* espejos: el marco va en fondo y primer plano; el cristal (transparente en el primer plano) se anima en el suelo */
 N.MIR.forEach((m,i)=>{const bx=m[0]-N.MW/2-6,by0=m[1]-N.MH-8,w=N.MW+12,h=N.MH+10;
  mirror(at,m[0],m[1]);
  const cv=mk(w,h),q=cv.getContext('2d');q.drawImage(at.canvas,bx,by0,w,h,0,0,w,h);
  q.globalCompositeOperation='destination-out';N.glass(q,m[0]-bx,m[1]-by0,1);q.fill();q.globalCompositeOperation='source-over';
  at.drawImage(cv,bx,by0+FYo);pr.push([bx,by0,w,h,Math.floor((m[1]-1)/16)])});
 return pr}
/* ═════════ niveles ═════════ */
N.levels=function(L){const o={},cp=(k,id,amb,seed,nm)=>{const S=K.lvlFrom(L[k],id,amb);S.hid='nec';S.nm=nm;return lightsN(S,seed)};
 o.G=cp('rel.G','nec.G',[44,34,70],31,'Gran Vestíbulo');o['1']=cp('rel.1','nec.1',[42,32,68],32,'Biblioteca Prohibida');o['2']=cp('rel.2','nec.2',[40,30,66],33,'Torre del Hechicero');
 const w=SW,h=SH,g=[];for(let y=0;y<h;y++){let r='';for(let x=0;x<w;x++){let c='#';if(y>=4&&y<=18&&x>=3&&x<=29)c='.';if(x>=30&&x<=31&&y>=12&&y<=14)c='U';r+=c}g.push(r)}
 const setc=(x,y,c)=>{g[y]=g[y].slice(0,x)+c+g[y].slice(x+1)};
 N.COLS.forEach(c=>setc(Math.floor(c[0]/16),Math.floor((c[1]-2)/16),'#'));
 N.MIR.forEach(m=>{const tx=Math.floor(m[0]/16),ty=Math.floor((m[1]-2)/16);for(let dx=-1;dx<=1;dx++)setc(tx+dx,ty,'#')});
 for(let x=11;x<=21;x++)setc(x,4,'#');for(let x=12;x<=20;x++)setc(x,5,'#');                  /* trono y escalones pegados al muro norte */
 for(let x=15;x<=18;x++)setc(x,6,'#');                                                       /* altar */
 const S={id:'nec.S',hid:'nec',lv:'S',nm:'Salón de los Espejos',w,h,g,pr:[],lt:[],fx:[],np:[],ch:[],ar:{R:[28,13]},ax:0,ay:0,fy:FYo,amb:[30,26,64]};
 S.lt=[[264,36,110,'90,235,150',.5,1],[264,106,70,'120,255,170',.34,1],[264,198,120,'170,110,255',.36,0],[132,34,46,'90,235,150',.46,1],[396,34,46,'90,235,150',.46,1],[76,40,46,'130,120,255',.26,0],[452,40,46,'130,120,255',.26,0],[200,40,42,'130,120,255',.26,0],[328,40,42,'130,120,255',.26,0],
  [88,108,64,'160,110,255',.36,0],[440,108,64,'160,110,255',.36,0],[88,224,64,'160,110,255',.36,0],[440,224,64,'160,110,255',.36,0],[200,200,40,'110,255,170',.14,0],[358,200,40,'110,255,170',.14,0]];
 S.fx=[['candle',250,102,1],['candle',280,102,1],['candle',258,96,1],['candle',272,96,1]];
 o.S=S;return o};
/* ═════════ construcción del atlas ═════════ */
N.build=function(src){/* src: {rel:Image, ug:Image, ig:Image, lv: KZD.lv} → {atlas, levels, facade, glows} */
 const A=mk(1024,1432),c=A.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(src.rel,0,0);
 const lvs=N.levels(src.lv);
 const gr=mk(448,352),gc=gr.getContext('2d');gc.drawImage(src.rel,0,0,448,352,0,0,448,352);K.gradeInt(gc,0,0,448,352,L_NI,{keep:.38});
 for(const[k,seed]of[['rel.G',41],['rel.1',42],['rel.2',43]]){const l0=src.lv[k];for(const yy of[l0.ay,l0.fy])K.gradeInt(c,l0.ax,yy,l0.w*16,l0.h*16,L_NI,{keep:.38});K.dress(c,l0,seed,{web:.8});ritual(c,l0,seed+10)}
 lvs.S.pr=bakeHall(c,src.ug,gr);
 A.complete=true;A.naturalWidth=1024;A.naturalHeight=1432;
 const F=N.facade(src.ig);
 return{atlas:A,levels:lvs,facade:F.cv,glows:F.glows,beacon:F.beacon}};
/* ═════════ FACHADA: el torreón de la Iglesia teñido + torres, murallas y espiras dibujadas ═════════ */
const FW=1040,FH=640;
N.FW=FW;N.FH=FH;
const ci=(c,p)=>{c.beginPath();c.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)c.lineTo(p[i][0],p[i][1]);c.closePath()};
/* ladrillos de piedra con el mismo mortero oscuro */
function stone(c,x,y,w,h,R,o){brick(c,x,y,w,h,R,Object.assign({cols:STONE,bh:9,moss:o&&o.moss||0},o||{}))}
/* sombreado cilíndrico: oscurece los bordes y aclara un poco el lado de la luz, solo sobre lo ya dibujado */
function cyl(c,x,y,w,h,k){c.save();c.globalCompositeOperation='source-atop';const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'rgba(4,2,12,'+(.6*(k||1))+')');g.addColorStop(.28,'rgba(200,180,255,'+(.1*(k||1))+')');g.addColorStop(.6,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(4,2,12,'+(.68*(k||1))+')');c.fillStyle=g;c.fillRect(x,y,w,h);c.restore()}
/* ventana ojival encendida; devuelve la luz para el motor */
function lancet(c,x,y,w,h,gl,hue){const R=hue?['150,100,255','90,40,200']:['120,255,170','30,150,90'];c.save();
 c.beginPath();c.moveTo(x-w/2,y+h);c.lineTo(x-w/2,y+w*.9);c.quadraticCurveTo(x-w/2,y+w*.2,x,y);c.quadraticCurveTo(x+w/2,y+w*.2,x+w/2,y+w*.9);c.lineTo(x+w/2,y+h);c.closePath();
 const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'rgba('+R[0]+',1)');g.addColorStop(1,'rgba('+R[1]+',1)');c.fillStyle=g;c.fill();c.clip();
 c.fillStyle='rgba(8,4,18,.7)';c.fillRect(x-.5,y,1,h);c.fillRect(x-w/2,y+h*.45,w,1);c.restore();
 c.strokeStyle='#6b5f9c';c.lineWidth=2;c.beginPath();c.moveTo(x-w/2-1,y+h+1);c.lineTo(x-w/2-1,y+w*.9);c.quadraticCurveTo(x-w/2-1,y+w*.15,x,y-2);c.quadraticCurveTo(x+w/2+1,y+w*.15,x+w/2+1,y+w*.9);c.lineTo(x+w/2+1,y+h+1);c.stroke();
 c.fillStyle='#4a3f78';c.fillRect(x-w/2-3,y+h,w+6,3);gl.push([x,y+h*.5,w>14?1:.7,hue?1:0])}
function slit(c,x,y,h){c.fillStyle='#06040c';c.fillRect(x-1,y,3,h);c.fillStyle='rgba(120,255,170,.5)';c.fillRect(x,y+2,1,h-4)}
/* almenas: merlones con filo claro arriba */
function crenel(c,x,y,w,R,o){const mw=(o&&o.mw)||12,gp=(o&&o.gp)||9,mh=(o&&o.mh)||12;for(let xx=x;xx<x+w-mw+1;xx+=mw+gp){if(R()<.14)continue;const hh=mh-(R()<.18?(R()*5|0):0);stone(c,xx,y-hh,mw,hh,R);c.fillStyle='rgba(205,190,255,.22)';c.fillRect(xx,y-hh,mw,1);c.fillStyle='rgba(0,0,0,.4)';c.fillRect(xx,y-hh,1,hh)}}
/* tejado cónico de pizarra con hileras y remate */
function cone(c,cx,by,hw,h,R,o){const ap=by-h;c.save();ci(c,[[cx-hw,by],[cx,ap],[cx+hw,by]]);c.clip();
 const g=c.createLinearGradient(cx-hw,0,cx+hw,0);g.addColorStop(0,'#150f26');g.addColorStop(.35,'#3a2d63');g.addColorStop(.55,'#2a2048');g.addColorStop(1,'#0c0818');c.fillStyle=g;c.fillRect(cx-hw,ap,hw*2,h);
 for(let y=ap+6,k=0;y<by;y+=7,k++){c.fillStyle='rgba(0,0,0,.45)';c.fillRect(cx-hw,y,hw*2,1);const sw=Math.max(6,(y-ap)/h*hw*2/Math.max(3,Math.round((y-ap)/9)));for(let x=cx-hw+((k%2)?sw/2:0);x<cx+hw;x+=sw){c.fillStyle='rgba(0,0,0,.3)';c.fillRect(Math.round(x),y,1,7);if(R()<.07){c.fillStyle='rgba(210,190,255,.25)';c.fillRect(Math.round(x)+1,y+1,3,1)}}}
 c.fillStyle='rgba(200,180,255,.2)';c.beginPath();c.moveTo(cx-hw,by);c.lineTo(cx,ap);c.lineTo(cx-hw*.7,by);c.fill();c.restore();
 c.strokeStyle='#07040f';c.lineWidth=2;ci(c,[[cx-hw,by],[cx,ap],[cx+hw,by]]);c.stroke();
 c.fillStyle='#0c0818';c.fillRect(cx-1,ap-16,3,18);c.fillStyle='rgba(120,255,170,.9)';c.beginPath();c.arc(cx,ap-17,3,0,7);c.fill();
 c.fillStyle='#2a2048';c.fillRect(cx-hw-5,by-3,hw*2+10,5);c.fillStyle='rgba(200,180,255,.25)';c.fillRect(cx-hw-5,by-3,hw*2+10,1)}
/* torre redonda: cuerpo de ladrillo, sombreado, almenas, ventanas y tejado; devuelve la altura del cuerpo */
function tower(c,cx,by,w,h,R,glows,o){o=o||{};const x=cx-w/2,ty=by-h;
 stone(c,x,ty,w,h,R,{moss:3});cyl(c,x,ty,w,h);
 /* hiladas curvas para dar volumen */
 c.fillStyle='rgba(0,0,0,.18)';for(let y=ty+18;y<by;y+=27)c.fillRect(x,y,w,1);
 /* cornisa y almenas voladas */
 stone(c,x-6,ty-12,w+12,12,R);c.fillStyle='rgba(205,190,255,.25)';c.fillRect(x-6,ty-12,w+12,1);cyl(c,x-6,ty-12,w+12,12,.8);
 for(let k=0;k<5;k++){c.fillStyle='#0f0a1d';c.fillRect(x-4+k*((w+8)/5),ty-1,5,5)}
 if(!o.noCrown)crenel(c,x-6,ty-12,w+12,R,{mw:10,gp:8,mh:11});
 const nw=Math.max(2,o.win||2);for(let i=0;i<nw;i++){const wy=ty+36+i*70;if(wy+46>by-30)break;lancet(c,cx,wy,Math.min(16,w*.28),44,glows,(i+(o.hue||0))%2)}
 for(let y=ty+70;y<by-50;y+=70){slit(c,cx-w*.3,y,16);slit(c,cx+w*.3,y,16)}
 if(o.roof)cone(c,cx,ty-12,w/2+9,o.roof,R)}
/* torre trasera, fina y muy alta, con atmósfera (más oscura y azulada) */
function spire(c,cx,by,w,h,R,glows,roof){c.save();tower(c,cx,by,w,h,R,glows,{win:3,roof,noCrown:1,hue:1});
 c.globalCompositeOperation='source-atop';const g=c.createLinearGradient(0,by-h-roof,0,by);g.addColorStop(0,'rgba(30,18,70,.34)');g.addColorStop(1,'rgba(30,18,70,.04)');c.fillStyle=g;c.fillRect(cx-w,by-h-roof-20,w*2,h+roof+40);c.restore()}
/* muralla: lienzo de piedra con almenas, contrafuertes, saeteras, agujeros y estandartes */
function curtain(c,x0,x1,by,h,R,glows){const w=x1-x0,ty=by-h;stone(c,x0,ty,w,h,R,{moss:5});c.fillStyle='rgba(0,0,0,.22)';for(let y=ty+22;y<by;y+=32)c.fillRect(x0,y,w,1);
 const g=c.createLinearGradient(0,ty,0,by);g.addColorStop(0,'rgba(190,170,255,.08)');g.addColorStop(.25,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(2,1,8,.5)');c.fillStyle=g;c.fillRect(x0,ty,w,h);
 stone(c,x0,ty-10,w,10,R);c.fillStyle='rgba(205,190,255,.24)';c.fillRect(x0,ty-10,w,1);crenel(c,x0,ty-10,w,R,{mw:13,gp:10,mh:13});
 for(let x=x0+26;x<x1-14;x+=58){stone(c,x,ty+4,9,h-4,R);c.fillStyle='rgba(205,190,255,.14)';c.fillRect(x,ty+4,1,h-4);c.fillStyle='rgba(0,0,0,.4)';c.fillRect(x+8,ty+4,1,h-4)}
 for(let x=x0+40;x<x1-30;x+=58)slit(c,x,ty+30,20);
 return{ty}}
/* brecha: se «muerde» un trozo de pared con un polígono irregular y se deja escombro al pie */
function breach(c,x,y,w,h,R){c.save();c.globalCompositeOperation='destination-out';c.beginPath();c.moveTo(x,y-4);let px=x;const n=5+(R()*4|0);for(let i=1;i<=n;i++){px=x+w*i/n;c.lineTo(px,y+(R()*h*.7|0))}c.lineTo(x+w,y-4);c.closePath();c.fill();c.restore();
 for(let i=0;i<9;i++){const rx=x+R()*w,ry=y+h*.7+R()*14,rs=3+R()*7;c.fillStyle=STONE[(R()*6)|0];c.beginPath();c.moveTo(rx,ry);c.lineTo(rx+rs,ry+rs*.2);c.lineTo(rx+rs*.7,ry+rs*.8);c.lineTo(rx-rs*.2,ry+rs*.6);c.closePath();c.fill();c.fillStyle='rgba(205,190,255,.2)';c.fillRect(Math.round(rx),Math.round(ry),Math.round(rs*.7),1)}}
/* estandarte rasgado con calavera */
function banner(c,x,y,w,h,R){c.fillStyle='#07040f';c.fillRect(x-1,y-4,w+2,4);c.fillStyle='#8a7bc4';c.fillRect(x-2,y-6,w+4,2);
 const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#1d0f3a');g.addColorStop(.5,'#3a1a68');g.addColorStop(1,'#1d0f3a');c.fillStyle=g;c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y);c.lineTo(x+w,y+h);for(let i=0;i<4;i++)c.lineTo(x+w-(i+.5)*w/4,y+h-(R()*10|0)-(i%2?9:0));c.lineTo(x,y+h);c.closePath();c.fill();
 c.fillStyle='rgba(160,255,200,.85)';c.beginPath();c.ellipse(x+w/2,y+h*.36,5,5.5,0,0,7);c.fill();c.fillStyle='#1d0f3a';c.fillRect(x+w/2-3,y+h*.36-2,2,2);c.fillRect(x+w/2+1,y+h*.36-2,2,2);c.fillRect(x+w/2-1,y+h*.36+2,2,2)}
/* el torreón central: la Iglesia (VBX.ig) pasada por mapas de degradado violetas, ventanas de fuego verde y puerta ennegrecida */
function keep(ig,s,glows,ox,oy){const W=ig.naturalWidth||ig.width,Hh=ig.naturalHeight||ig.height,w=Math.round(W*s),h=Math.round(Hh*s),A=mk(w,h),c=A.getContext('2d');
 c.imageSmoothingEnabled=true;try{c.imageSmoothingQuality='high'}catch(e){}c.drawImage(ig,0,0,w,h);
 const id=c.getImageData(0,0,w,h),d=id.data,R=rngf(913);
 for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;const r=d[i],g=d[i+1],b=d[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx?(mx-mn)/mx:0,v=mx/255,l=(r*.299+g*.587+b*.114)|0;
  const hh=sat<.02?0:mx==r?((g-b)/(mx-mn)+(g<b?6:0))*60:mx==g?((b-r)/(mx-mn)+2)*60:((r-g)/(mx-mn)+4)*60;let o,gl=0;
  if(sat>.5&&v>.62&&hh>26&&hh<64){const t=v;o=[40+t*70,170+t*85,110+t*70];gl=1}
  else if(sat>.38&&(hh<24||hh>340)&&v>.4){const k=l*3;o=[L_NR[k]+4,L_NR[k+1],L_NR[k+2]+6]}
  else if(hh>70&&hh<170&&sat>.25){const k=l*3;o=[L_NW[k]*.8+10,L_NW[k+1]*.8+12,L_NW[k+2]*.9]}
  else if(sat>.3&&hh>=24&&hh<48){const k=l*3;o=[L_NW[k]*.55+6,L_NW[k+1]*.46+4,L_NW[k+2]*.6+12]}
  else{const k=Math.min(255,(l*.95)|0)*3;o=[L_NW[k],L_NW[k+1],L_NW[k+2]]}
  if(!gl)o=[Math.min(255,o[0]*1.3+6),Math.min(255,o[1]*1.26+5),Math.min(255,o[2]*1.24+12)];
  d[i]=o[0];d[i+1]=o[1];d[i+2]=o[2]}
 c.putImageData(id,0,0);
 c.save();c.globalCompositeOperation='source-atop';
 for(let i=0;i<20;i++){c.save();crack(c,70*s+R()*540*s,170*s+R()*420*s,R,5+(R()*8|0));c.restore()}
 for(let i=0;i<34;i++)blot(c,(R()<.5?40+R()*70:530+R()*110)*s,(300+R()*340)*s,(10+R()*20)*s,'20,50,60',.3);
 c.lineCap='round';for(let k=0;k<12;k++){let x=((k%2?70:610)+(R()-.5)*60)*s,y=(640-R()*30)*s;c.beginPath();c.moveTo(x,y);const n=10+(R()*14|0);for(let j=0;j<n;j++){x+=(R()-.5)*12*s;y-=(10+R()*14)*s;c.lineTo(x,y)}c.strokeStyle='rgba(18,10,30,.8)';c.lineWidth=2;c.stroke()}
 const q=c.createLinearGradient(0,h,0,h*.5);q.addColorStop(0,'rgba(4,2,12,.55)');q.addColorStop(1,'rgba(4,2,12,0)');c.fillStyle=q;c.fillRect(0,0,w,h);
 c.restore();
 /* luces del torreón: ventanas, farolas y la puerta */
 for(const[x,y,st,hu]of[[183,370,1,0],[496,370,1,0],[183,503,.9,1],[497,503,.9,1],[56,424,.8,0],[622,424,.8,0],[271,545,.7,1],[407,545,.7,1],[183,152,.5,0],[495,152,.5,0],[340,250,.9,0]])glows.push([ox+x*s,oy+y*s,st,hu]);
 return A}
/* tope derrumbado: se «muerde» la parte alta de la torre con un corte oblicuo e irregular, con el borde de la piedra rota y escombro cayendo al pie */
function ruinTop(c,cx,y,w,R){const x0=cx-w/2,pts=[];const n=9;for(let i=0;i<=n;i++){const u=i/n;pts.push([x0+w*u,y+62-u*46+(R()-.5)*18+(i%2?5:-3)])}
 c.save();c.globalCompositeOperation='destination-out';c.beginPath();c.moveTo(x0-4,y-30);for(const p of pts)c.lineTo(p[0],p[1]);c.lineTo(x0+w+4,y-30);c.closePath();c.fill();c.restore();
 c.save();c.globalCompositeOperation='source-atop';c.strokeStyle='rgba(4,2,10,.85)';c.lineWidth=4;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]+2):c.moveTo(p[0],p[1]+2));c.stroke();c.strokeStyle='rgba(215,200,255,.5)';c.lineWidth=1;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]+4):c.moveTo(p[0],p[1]+4));c.stroke();c.restore();
 for(let i=0;i<14;i++){const rx=cx-w*.55+R()*w*1.1,ry=y+330+10+R()*14,rs=4+R()*10;c.fillStyle=STONE[(R()*6)|0];c.beginPath();c.moveTo(rx,ry);c.lineTo(rx+rs,ry+rs*.25);c.lineTo(rx+rs*.7,ry+rs*.8);c.lineTo(rx-rs*.2,ry+rs*.6);c.closePath();c.fill();c.fillStyle='rgba(205,190,255,.25)';c.fillRect(Math.round(rx),Math.round(ry),Math.round(rs*.7),1)}}
/* acabado: luz de borde lila en el contorno (separa la silueta del risco) y filo oscuro por abajo y a la derecha, más contraste y brillo (el territorio se ve a través de una neblina oscura) */
function polish(A,gain){const w=A.width,h=A.height,c=A.getContext('2d'),id=c.getImageData(0,0,w,h),d=id.data,o=new Uint8ClampedArray(d.length);o.set(d);
 for(let y=1;y<h-1;y++){for(let x=1;x<w-1;x++){const i=(y*w+x)*4;if(d[i+3]<8)continue;
  const up=d[i-w*4+3]<60,lf=d[i-4+3]<60,dn=d[i+w*4+3]<60,rt=d[i+4+3]<60;let r=d[i],g=d[i+1],b=d[i+2];
  r=((r-52)*1.2+52)*gain;g=((g-46)*1.2+46)*gain;b=((b-70)*1.16+70)*gain;
  const t=1-y/h;r+=t*14;g+=t*8;b+=t*26;                                   /* la luz de la tormenta viene de arriba */
  if(up||lf){r=r*.45+205*.55;g=g*.45+185*.55;b=b*.45+255*.55}
  else if(dn||rt){r*=.55;g*=.55;b*=.68}
  o[i]=r<0?0:r>255?255:r;o[i+1]=g<0?0:g>255?255:g;o[i+2]=b<0?0:b>255?255:b}}
 c.putImageData(new ImageData(o,w,h),0,0)}
N.facade=function(ig){const A=mk(FW,FH),c=A.getContext('2d'),R=rngf(4361),glows=[];c.imageSmoothingEnabled=false;
 const base=FH-2;
 /* 1· siluetas lejanas (muy oscuras): dan profundidad y altura */
 c.save();c.globalAlpha=.9;for(const[x,h,w]of[[520,560,38],[395,470,30],[645,470,30],[300,380,26],[740,380,26]]){const t=mk(FW,FH),q=t.getContext('2d');spire(q,x,base,w,h-90,R,[],64);c.drawImage(t,0,0)}c.restore();
 /* 2· torres traseras finas (a los lados del torreón) */
 spire(c,168,base,56,330,R,glows,70);spire(c,872,base,56,330,R,glows,70);
 /* 3· murallas a ambos lados */
 const cw=curtain(c,40,262,base,190,R,glows);curtain(c,778,1000,base,190,R,glows);
 breach(c,176,base-196,60,60,R);breach(c,786,base-186,44,52,R);
 for(const[x,y]of[[96,base-178],[868,base-178],[210,base-170],[808,base-170]])banner(c,x,y,22,64,R);
 /* 4· torres de esquina, grandes, con tejado cónico */
 tower(c,92,base,132,330,R,glows,{win:3,roof:130,hue:0});tower(c,948,base,132,330,R,glows,{win:3,roof:0,hue:1});ruinTop(c,948,base-330-14,150,R);
 /* 5· el torreón central (la Iglesia teñida) */
 const s=.9,kw=Math.round(681*s),kh=Math.round(666*s),kx=Math.round(FW/2-kw/2),ky=FH-kh;
 /* sombra proyectada de los costados del torreón sobre las murallas */
 c.drawImage(keep(ig,s,glows,kx,ky),kx,ky);
 /* 6· base: terraza oscura, grietas largas, hiedra seca y escombro a pie de muro */
 c.save();c.globalCompositeOperation='source-atop';
 for(let i=0;i<28;i++){c.save();crack(c,40+R()*960,base-300+R()*280,R,6+(R()*10|0));c.restore()}
 for(let i=0;i<60;i++)blot(c,40+R()*960,base-R()*160,12+R()*26,'12,30,44',.26);
 const q=c.createLinearGradient(0,FH,0,FH-200);q.addColorStop(0,'rgba(3,1,10,.55)');q.addColorStop(1,'rgba(3,1,10,0)');c.fillStyle=q;c.fillRect(0,0,FW,FH);
 const q2=c.createLinearGradient(0,0,0,FH*.4);q2.addColorStop(0,'rgba(14,6,36,.55)');q2.addColorStop(1,'rgba(14,6,36,0)');c.fillStyle=q2;c.fillRect(0,0,FW,FH);c.restore();
 c.fillStyle='#0a0614';c.fillRect(30,FH-5,980,5);
 for(let i=0;i<30;i++){const x=40+R()*960,y=FH-8+R()*5,rs=3+R()*8;c.fillStyle=STONE[(R()*6)|0];c.beginPath();c.moveTo(x,y);c.lineTo(x+rs,y+rs*.2);c.lineTo(x+rs*.6,y-rs*.7);c.closePath();c.fill()}
 polish(A,1.28);
 return{cv:A,glows,beacon:[FW/2,ky+6]}};
})();
/* ═══════════ v435 · MINI-JEFES (cliente) · parte 4: LA MANSIÓN EMBRUJADA DEL LAGO ═══════════
   Por fuera: un lago oscuro con una isla, un muelle de tablas y la fachada de la Iglesia teñida (mjc6.js) · por dentro: 4 pisos explorables
   (Sótano · Planta baja · Primer piso · Altillo) con el motor de interiores de Karez, que ocupa TODA la pantalla, con criaturas del entorno de la Banshee.
   La Banshee duerme en el sótano, junto al altar donde se hace la ofrenda; la pelea ocurre en esa misma sala (mjc5.js).
   Lo que decide el servidor (presencia, turno, vida del jefe, premio) no cambia: aquí solo se ven y se pisan los lugares. */
(function(){
'use strict';
const MJ=window.MJC,H=window.MJH;if(!MJ||!MJ.ST||!H)return;
const ST=MJ.ST,$=id=>document.getElementById(id);
const MAN=window.MJMAN={};
const geo=()=>{const s=ST.b&&ST.b.ban;return s&&s.geo};
const LK0=[316,38,73,41],MN0=[352,60],PI0=[351,69,3,10];
const lk=()=>{const g=geo();return(g&&g.lk)||LK0},mn=()=>{const g=geo();return(g&&g.mn)||MN0},pi=()=>{const g=geo();return(g&&g.pi)||PI0};
const rng=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const inInt=()=>typeof KZ!=='undefined'&&KZ.on&&KZ.sc&&KZ.sc.hid==='ban';
MAN.inside=()=>{try{return inInt()}catch(e){return false}};
MAN.scene=()=>{try{return inInt()?'ban.'+KZ.sc.lv:''}catch(e){return''}};                   /* lo que se manda al servidor */
MAN.scope=()=>{try{return inInt()?'ban'+KZ.sc.lv+':':''}catch(e){return''}};                /* prefijo de la zona de criaturas compartidas */
/* ═════════ el lago ═════════ */
// geometría del lago: ES LA MISMA que usa el servidor (minijefes.js, entre las marcas GEO y FINGEO): el build y las pruebas comprueban que el texto sea idéntico
/*GEO*/
const lkWater=(L,x,y)=>{const cx=L[0]+L[2]/2,cy=L[1]+L[3]/2-.5,dx=(x+.5-cx)/(L[2]/2),dy=(y+.5-cy)/(L[3]/2-1),a=Math.atan2(dy,dx),n=1+.075*Math.sin(a*3+1.3)+.05*Math.sin(a*5+.4)+.035*Math.sin(a*9+2.2);return dx*dx+dy*dy<n*n};
const lkCell=(L,m,p,x,y)=>{const cx=m[0]+.5;
 if(x>=p[0]&&x<p[0]+p[2]&&y>=p[1]&&y<p[1]+p[3]+3)return 2;
 if(x>=p[0]-1&&x<=p[0]+p[2]&&y>=p[1]+p[3]&&y<p[1]+p[3]+3)return 2;
 if(Math.abs(x+.5-cx)<=7.4&&y>=m[1]-4&&y<=m[1])return 3;
 const dx=(x+.5-cx)/14.5,dy=(y+.5-(m[1]+4.6))/5;if(dx*dx+dy*dy<1)return 2;
 return lkWater(L,x,y)?1:0};
/*FINGEO*/
/* 0 = como estaba · 1 = agua (sólida) · 2 = tierra firme (isla, muelle y desembarco) · 3 = huella del edificio (sólida, tapada por la fachada) */
const cellAt=(x,y)=>lkCell(lk(),mn(),pi(),x,y);
const isWater=(x,y)=>cellAt(x,y)===1,isLand=(x,y)=>cellAt(x,y)===2;
const shape=()=>{const L=lk();return{cx:L[0]+L[2]/2,cy:L[1]+L[3]/2-.5,rx:L[2]/2,ry:L[3]/2-1}};
/* el cliente y el servidor solo se entienden si el terreno visible es el pisable: el lago se «estampa» en el mapa del cliente (agua y huella = sólidas; isla y muelle = suelo) */
let stamped='';
function stamp(){if(typeof M==='undefined'||typeof TREE==='undefined')return;const L=lk(),key=L.join(',')+mn().join(',')+pi().join(',');if(key===stamped)return;if(!M[L[1]]||!M[L[1]+L[3]+2])return;stamped=key;
 for(let y=L[1];y<L[1]+L[3]+3;y++)for(let x=L[0]-1;x<L[0]+L[2]+1;x++){const c=cellAt(x,y);if(!c)continue;
  if(c===1){M[y][x]=3;TREE[y*W+x]=0}else if(c===3){M[y][x]=2;TREE[y*W+x]=0}else{if(M[y][x]===2||M[y][x]===3)M[y][x]=1;TREE[y*W+x]=0}}
 try{if(typeof LCX!=='undefined')LCX=-1}catch(e){}}
MAN.isWater=isWater;
setInterval(()=>{try{stamp()}catch(e){}},700);MAN.stamp=stamp;
/* ═════════ arte: se hornea la primera vez que hace falta ═════════ */
let ART=null,ARTBUSY=0,ARTW=[];
const loadImg=(src,cb)=>{const i=new Image();i.onload=()=>cb(i);i.onerror=()=>cb(null);i.src=src};
function install(){if(!ART)return;const a=ART;for(const k of['S','G','1','2'])KZD.lv['ban.'+k]=a.levels[k];KZD.hn.ban={nm:'Mansión Embrujada',th:0,fl:'mansion'};KZ.img.ban={s:2,im:a.atlas,cb:[],t:performance.now()+1e12}}
function ensureArt(cb){if(ART){install();cb(ART);return}if(ARTBUSY){ARTW.push(cb);return}ARTBUSY=1;ARTW=[cb];let man,ug,ig,n=3;
 const fin=()=>{if(--n)return;const w=ARTW;ARTW=[];ARTBUSY=0;if(!man||!ug||!ig){w.forEach(f=>f(null));return}
  try{ART=H.build({man,ug,ig,lv:KZD.lv});ART.fac=scaleFacade(ART.facade);install()}catch(e){try{console.error('mjh',e)}catch(x){}ART=null}w.forEach(f=>f(ART))};
 loadImg('kz_man.png?v=397',i=>{man=i;fin()});loadImg(UGATL,i=>{ug=i;fin()});
 /* la Iglesia (VBX.ig): el juego ya la decodificó en VBX.ig.i y borró el base64 original */
 const I=VBX&&VBX.ig&&VBX.ig.i;if(!I){ig=null;fin()}else if(I.complete&&I.naturalWidth){ig=I;fin()}else{I.addEventListener('load',()=>{ig=I;fin()},{once:true});I.addEventListener('error',()=>{ig=null;fin()},{once:true})}}
MAN.ensureArt=ensureArt;
const FSC=.8;
function scaleFacade(f){const w=Math.round(f.width*FSC),h=Math.round(f.height*FSC),c=document.createElement('canvas');c.width=w;c.height=h;const q=c.getContext('2d');q.imageSmoothingEnabled=true;try{q.imageSmoothingQuality='high'}catch(e){}q.drawImage(f,0,0,w,h);return c}
/* ═════════ decoración de la isla y el muelle (fija, no sólida) ═════════ */
/* camino de losas gastadas: piedras irregulares con juntas oscuras, musgo y grietas; los bordes salen mellados (los 2 bits bajos de v marcan el borde: 1 izq, 2 der) */
const hs2=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
if(MJ.PAINT)MJ.PAINT.flag=function(x,y,v){const ed=v&3,s=v>>2,P2=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(Math.round(a),Math.round(b),w,h)},PAL=['#5a6379','#505870','#626b84','#464d63','#69728c'];
 P2('#1a1d27',x-16,y,32,32);let yy=0;
 for(let r=0;r<3;r++){const h=r===1?12:10;let xx=0,k=0;
  while(xx<32){const w=Math.min(32-xx,7+Math.floor(hs2(s*9+r*5+k)*10)),rx=xx;xx+=w;k++;
   if((ed===1&&rx<8&&hs2(s*3+r*7+k)<.55)||(ed===2&&rx+w>24&&hs2(s*5+r*3+k)<.55))continue;
   const c=PAL[Math.floor(hs2(s*13+r*17+k*3)*5)];P2(c,x-16+rx+1,y+yy+1,w-1,h-1);P2('rgba(185,198,230,.34)',x-16+rx+1,y+yy+1,w-1,1);P2('rgba(0,0,0,.30)',x-16+rx+1,y+yy+h-1,w-1,1);
   if(hs2(s*7+r*11+k)<.14)P2('#415f3c',x-16+rx+2,y+yy+2,Math.max(2,w-4),3)}
  yy+=h}
 if(hs2(s*31)<.24){P2('#0e1017',x-8+(s%5)*3,y+6,1,9);P2('#0e1017',x-7+(s%5)*3,y+14,1,6)}};
let DEC=null;
function mkDec(){const R=rng(43435),out=[],m=mn(),cx=m[0]+.5,P_=MJ.PAINT||{},add=(t,tx,ty,v,fl)=>{if(!P_[t])return;out.push({t,x:Math.round(tx*T),y:Math.round(ty*T),v:v!=null?v:(R()*997|0),floor:fl?1:0})};
 /* camino empedrado de los escalones al muelle */
 for(let ty=m[1]+2;ty<=pi()[1]+1;ty++){const wd=ty<m[1]+7?2:1;for(let dx=-wd;dx<=wd;dx++){const tx=Math.floor(cx)+dx,ed=dx===-wd?1:dx===wd?2:0;add('flag',tx+.5,ty,((tx*31+ty*17+(R()*50|0))<<2)|ed,1)}}   /* 5 losas de ancho junto a los escalones, 3 hacia el muelle */
 /* farolas a los lados del camino y estatuas junto a los escalones */
 for(const ty of[m[1]+2.6,m[1]+5.2])for(const sx of[-1,1])add('lamp',cx+sx*3.1,ty);
 add('statue',cx-7.4,m[1]+2.5,1);add('statue',cx+7.4,m[1]+2.5,2);
 /* arbustos secos, árboles muertos y dos cementerios cercados en los lados de la isla */
 for(let i=0;i<26;i++){const sx=R()<.5?-1:1,tx=cx+sx*(4+R()*10),ty=m[1]+1.2+R()*7;if(isLand(Math.floor(tx),Math.floor(ty)))add('bush',tx,ty)}
 for(const sx of[-1,1])for(let i=0;i<3;i++){const tx=cx+sx*(10.6+R()*2.4),ty=m[1]+2.5+R()*5;if(isLand(Math.floor(tx),Math.floor(ty)))add('tree',tx,ty)}
 const cem=(x0,y0,x1,y1,n)=>{for(let i=0;i<n;i++)add('tomb',x0+1+R()*(x1-x0-2),y0+1+R()*(y1-y0-2));for(let x=x0;x<=x1;x+=.85){add('fence',x,y0);add('fence',x,y1)}for(let y=y0;y<=y1;y+=.85){add('fence',x0,y);add('fence',x1,y)}add('wisp',(x0+x1)/2,(y0+y1)/2);add('bones',x0+2+R()*(x1-x0-4),y0+2+R()*(y1-y0-4))};
 cem(cx-12,m[1]+3.2,cx-6.6,m[1]+6.4,8);cem(cx+6.6,m[1]+3.2,cx+12,m[1]+6.4,8);
 /* muelle: farolas cada tres tablas y espectros que vagan sobre el agua */
 const p=pi();for(let y=p[1]+1.2;y<p[1]+p[3]-.5;y+=3){add('lamp',p[0]-.15,y);add('lamp',p[0]+p[2]+.15,y)}
 for(let i=0;i<14;i++){const L=lk();for(let t=0;t<30;t++){const tx=L[0]+3+R()*(L[2]-6),ty=L[1]+3+R()*(L[3]-6);if(isWater(Math.floor(tx),Math.floor(ty))){add('wisp',tx,ty);break}}}
 return out.sort((a,b)=>(b.floor?1:0)-(a.floor?1:0)||a.y-b.y)}
/* ═════════ fachada, muelle, portón, niebla y luces (se dibujan antes de las criaturas) ═════════ */
const nearMan=pad=>{const m=mn(),L=lk(),px=P.x/T,py=P.y/T;return px>=L[0]-pad&&px<L[0]+L[2]+pad&&py>=L[1]-pad&&py<L[1]+L[3]+pad+6};
function drawPier(cx,cy,now){const p=pi(),x0=p[0]*T-cx,y0=p[1]*T-cy,w=p[2]*T,h=p[3]*T;if(x0>VW+40||x0+w<-40||y0>VH+40||y0+h<-40)return;
 g.fillStyle='rgba(0,0,0,.34)';g.fillRect(x0-6,y0+5,w+12,h);                                     /* sombra sobre el agua */
 for(let r=0;r<p[3]*2;r++){const yy=y0+r*16;for(let c=0;c<p[2];c++){const hh=((c*7+r*13)%5);g.fillStyle=['#3a3330','#413a35','#35302d','#463e38','#3d3633'][hh];g.fillRect(x0+c*T+1,yy+1,T-2,14);g.fillStyle='rgba(255,255,255,.06)';g.fillRect(x0+c*T+1,yy+1,T-2,1);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x0+c*T+1,yy+14,T-2,1)}}
 g.fillStyle='#262120';g.fillRect(x0-4,y0,5,h);g.fillRect(x0+w-1,y0,5,h);                       /* barandas */
 g.fillStyle='rgba(180,200,230,.12)';g.fillRect(x0-4,y0,1,h);g.fillRect(x0+w-1,y0,1,h)}
function drawGate(cx,cy,now){const p=pi(),x=Math.round((p[0]+p[2]/2)*T-cx),y=Math.round((p[1]+p[3]-.1)*T-cy);if(x<-120||x>VW+120||y<-150||y>VH+60)return;
 const P2=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(Math.round(a),Math.round(b),w,h)};
 g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x,y+4,62,9,0,0,7);g.fill();
 for(const s of[-1,1]){const px=x+s*52;P2('#3a4054',px-9,y-82,18,84);P2('#566078',px-9,y-82,4,84);P2('#262b3a',px+5,y-82,4,84);P2('#4a5268',px-12,y-88,24,8);P2('#69718a',px-12,y-88,24,2);P2('#262b3a',px-12,y-2,24,6);
  for(let k=0;k<7;k++)P2(k%2?'#2f3548':'#434b62',px-8,y-78+k*11,16,1)}
 g.strokeStyle='#14161e';g.lineWidth=4;g.beginPath();g.moveTo(x-52,y-78);g.quadraticCurveTo(x,y-124,x+52,y-78);g.stroke();g.strokeStyle='#323a50';g.lineWidth=2;g.stroke();
 g.lineWidth=2;for(let k=-3;k<=3;k++){g.beginPath();g.moveTo(x+k*14,y-90+Math.abs(k)*4.8);g.lineTo(x+k*14,y-78+Math.abs(k)*4.8);g.stroke()}
 const f=.74+.26*Math.sin(now*7.3);for(const s of[-1,1]){const lx=x+s*52,ly=y-98;P2('#1a1e2a',lx-2,ly-8,4,10);g.save();g.globalCompositeOperation='lighter';const q=g.createRadialGradient(lx,ly,1,lx,ly,44);q.addColorStop(0,'rgba(150,215,255,'+(.46*f)+')');q.addColorStop(1,'rgba(150,215,255,0)');g.fillStyle=q;g.fillRect(lx-44,ly-44,88,88);g.restore();P2('rgba(220,246,255,'+f+')',lx-2,ly-4,4,7)}
 g.save();g.textAlign='center';g.font='bold 11px Georgia,serif';g.lineWidth=3.5;g.strokeStyle='rgba(0,0,0,.92)';const t1='🏚️ Mansión Embrujada';g.strokeText(t1,x,y-126);g.fillStyle='#cfe8ff';g.fillText(t1,x,y-126);g.restore()}
let BATS=null;
function drawFacade(cx,cy,now){if(!ART||!ART.fac)return;const F=ART.fac,m=mn(),bx=(m[0]+.5)*T,by=(m[1]+1)*T,x=Math.round(bx-F.width/2-cx),y=Math.round(by-F.height-cy);if(x>VW+60||x+F.width<-60||y>VH+60||y+F.height<-60)return;
 g.imageSmoothingEnabled=true;g.drawImage(F,x,y);g.imageSmoothingEnabled=false;
 /* ventanas y farolas: luz espectral que respira (aditiva) */
 g.save();g.globalCompositeOperation='lighter';
 for(let i=0;i<H.GLOWS.length;i++){const q=H.GLOWS[i],gx=x+q[0]*FSC,gy=y+q[1]*FSC,fl=.78+.22*Math.sin(now*(1.7+i*.31)+i*2.1)+.06*Math.sin(now*11+i),r=(q[2]>=.8?40:26)*FSC*1.5;
  const gr=g.createRadialGradient(gx,gy,1,gx,gy,r);gr.addColorStop(0,'rgba(140,235,235,'+(.42*fl*q[2])+')');gr.addColorStop(1,'rgba(140,235,235,0)');g.fillStyle=gr;g.fillRect(gx-r,gy-r,r*2,r*2)}
 /* charco de luz fría delante de la puerta */
 const dx=x+F.width/2,dy=y+F.height-4,gr2=g.createRadialGradient(dx,dy,4,dx,dy,150);gr2.addColorStop(0,'rgba(120,200,230,'+(.2+.05*Math.sin(now*1.3))+')');gr2.addColorStop(1,'rgba(120,200,230,0)');g.save();g.translate(dx,dy);g.scale(1,.42);g.translate(-dx,-dy);g.fillStyle=gr2;g.fillRect(dx-150,dy-150,300,300);g.restore();
 g.restore();
 /* niebla pegada al suelo: tres bandas que se deslizan */
 g.save();for(let k=0;k<3;k++){const fx=x+F.width*(.2+.3*k)+Math.sin(now*.22+k*2)*34,fy=y+F.height-10+Math.sin(now*.31+k)*5,r=120+k*18,gr3=g.createRadialGradient(fx,fy,2,fx,fy,r);gr3.addColorStop(0,'rgba(190,215,235,.17)');gr3.addColorStop(1,'rgba(190,215,235,0)');g.save();g.translate(fx,fy);g.scale(1,.3);g.translate(-fx,-fy);g.fillStyle=gr3;g.fillRect(fx-r,fy-r,r*2,r*2);g.restore()}g.restore();
 /* murciélagos que rodean las torres */
 if(!BATS){const R=rng(77);BATS=[];for(let i=0;i<6;i++)BATS.push({a:R()*6.28,r:60+R()*50,s:.4+R()*.5,y:.22+R()*.2,w:R()*6})}
 g.fillStyle='#0a0c14';for(const b of BATS){const a=now*b.s+b.a,bx2=x+F.width/2+Math.cos(a)*(F.width*.5+b.r*.4),by2=y+F.height*b.y+Math.sin(a*1.7)*40+Math.sin(a*.9)*16,fl=Math.sin(now*14+b.w)*4;g.fillRect(Math.round(bx2-1),Math.round(by2),3,2);g.fillRect(Math.round(bx2-6),Math.round(by2-fl*.5),5,1);g.fillRect(Math.round(bx2+3),Math.round(by2-fl*.5),5,1)}}
function drawLake(cx,cy,now){const L=lk(),x0=L[0]*T-cx,y0=L[1]*T-cy;if(x0>VW+80||x0+L[2]*T<-80||y0>VH+80||y0+L[3]*T<-80)return;
 /* bancos de niebla que se arrastran sobre el agua */
 g.save();for(let k=0;k<7;k++){const s=shape(),a=now*.05+k*.9,fx=(s.cx+Math.cos(a+k)*s.rx*.7)*T-cx,fy=(s.cy+Math.sin(a*1.3+k)*s.ry*.7)*T-cy,r=190+k*20;if(fx<-r||fx>VW+r||fy<-r||fy>VH+r)continue;
  const gr=g.createRadialGradient(fx,fy,4,fx,fy,r);gr.addColorStop(0,'rgba(165,195,225,.15)');gr.addColorStop(1,'rgba(165,195,225,0)');g.save();g.translate(fx,fy);g.scale(1,.55);g.translate(-fx,-fy);g.fillStyle=gr;g.fillRect(fx-r,fy-r,r*2,r*2);g.restore()}g.restore();
 /* fuegos fatuos */
 if(!MAN._w){const R=rng(9091);MAN._w=[];for(let i=0;i<16;i++)MAN._w.push({a:R()*6.28,b:R()*6.28,s:.12+R()*.2,ph:R()*6.28})}
 g.save();g.globalCompositeOperation='lighter';const s=shape();for(const w of MAN._w){const t=now*w.s+w.a,wx=(s.cx+Math.cos(t)*s.rx*(.35+.55*Math.abs(Math.sin(w.b+now*.04))))*T-cx,wy=(s.cy+Math.sin(t*1.2+w.b)*s.ry*.78)*T-cy-18+Math.sin(now*1.6+w.ph)*6;if(wx<-30||wx>VW+30||wy<-30||wy>VH+30)continue;
  const f=.55+.45*Math.sin(now*3+w.ph),gr=g.createRadialGradient(wx,wy,0,wx,wy,24);gr.addColorStop(0,'rgba(170,240,255,'+(.5*f)+')');gr.addColorStop(1,'rgba(170,240,255,0)');g.fillStyle=gr;g.fillRect(wx-24,wy-24,48,48);g.fillStyle='rgba(235,252,255,'+f+')';g.fillRect(Math.round(wx)-1,Math.round(wy)-1,2,2)}g.restore()}
/* ═════════ gancho del dibujo del suelo ═════════ */
let ARTREQ=0;
const g0=MJ.ground;
MJ.ground=function(cx,cy,now){
 try{window.MJA&&MJA.step&&MJA.step(now)}catch(e){}
 if(typeof KZ!=='undefined'&&KZ.on){try{if(inInt())drawInt(cx,cy,now)}catch(e){}try{window.MJA&&MJA.ground&&MJA.ground(cx,cy,now)}catch(e){}return}
 if(typeof LZ=='function'&&LZ())return;
 try{if(ST.ready&&nearMan(70)){
   if(!ART&&performance.now()-ARTREQ>8000){ARTREQ=performance.now();ensureArt(()=>{})}
   if(!DEC)DEC=mkDec();
   drawLake(cx,cy,now);drawPier(cx,cy,now);drawFacade(cx,cy,now);
   for(const o of DEC){const x=o.x-cx,y=o.y-cy;if(x<-40||x>VW+40||y<(o.floor?-36:-20)||y>VH+90)continue;MJ.PAINT[o.t](x,y,o.v,now)}
   drawGate(cx,cy,now)}}catch(e){if(!MAN.err){MAN.err=1;try{console.error('MJMAN',e)}catch(x){}}}
 try{g0&&g0(cx,cy,now)}catch(e){}};
/* ═════════ entrar y salir ═════════ */
const doorPos=()=>{const m=mn();return[(m[0]+.5)*T,(m[1]+.4)*T]};
function nearDoor(){if(typeof KZ==='undefined'||KZ.on||typeof INT==='undefined'||INT.on||(typeof DG!=='undefined'&&DG.f))return false;const d=doorPos();return Math.hypot(P.x-d[0],P.y-d[1])<=150&&P.y>d[1]}
MAN.enter=function(){if(!KZ.ok||KZ.lock||modal||INT.on||DG.f){if(!KZ.ok)toast('⚠️ La mansión no está disponible ahora',3000);return}
 if(!nearDoor()){toast('🚶 Acércate a la puerta',1800);return}
 toast('⏳ La puerta cede con un quejido…',2200);KZ.lock=1;setTimeout(()=>{KZ.lock=0},1500);
 ensureArt(a=>{if(!a){toast('⚠️ No se pudo abrir la puerta: revisa tu conexión',3500);return}
  const ret={x:P.x,y:Math.max(P.y,(mn()[1]+1.6)*T)};
  if(kzBegin(ret,'ban.G','street')){if(!P.mjv){P.mjv=1;toast('🏚️ La Mansión Embrujada · cuatro pisos y un sótano. Aquí rondan los espectros del lamento… y abajo duerme la Banshee.',7000)}}})};
MAN.leave=function(){if(!KZ.on||modal)return;INT.keep=0;intExit()};
/* ═════════ botones de contexto ═════════ */
const cxel=$('ctx'),mkb=(id,fn)=>{const b=document.createElement('button');b.id=id;b.hidden=true;b.onclick=fn;if(cxel)cxel.appendChild(b);return b};
const bEnt=mkb('mjent',()=>MAN.enter()),bAlt=mkb('mjalt',()=>{if(MJ.openDiary)MJ.openDiary('ban',1)});
const altarPos=()=>{const a=H.ALTAR;return[INT.ox+a[0]*2,INT.oy+a[1]*2]};
MAN.nearAltar=function(){if(!inInt()||KZ.sc.lv!=='S')return false;const a=altarPos();return Math.hypot(P.x-a[0],(P.y-a[1])*.9)<150};
function ctxTick(){try{const hide=typeof modal!=='undefined'&&modal;let e=!hide&&ST.ready&&nearDoor(),a=!hide&&MAN.nearAltar('ban')&&!(window.MJA&&MJA.on);   /* v436: «ban» = solo el altar de la mansión (el del castillo tiene su propio botón) */
 bEnt.hidden=!e;if(e)bEnt.textContent='🚪 Entrar a la Mansión Embrujada';bAlt.hidden=!a;if(a)bAlt.textContent='🕯️ Altar de la ofrenda'}catch(x){}}
setInterval(ctxTick,180);
/* ═════════ pisos: criaturas y reglas ═════════ */
const MOBS={G:{ti:10,n:11,p:[['mjSpe',5],['ghost',3],['skel',3]]},'1':{ti:11,n:12,p:[['mjSpe',3],['ghostR',3],['zombP',3],['skelB',3]]},'2':{ti:12,n:9,p:[['batV',3],['spiderB',3],['reapB',1],['mjSpe',2]]}};
function clearMobs(){for(let i=E.length-1;i>=0;i--)if(E[i].mjm)E.splice(i,1)}
function spawn(lv){clearMobs();const S=KZ.sc,cfg=MOBS[lv];if(!cfg||!S)return;const R=rng(S.id.charCodeAt(4)*131+7),fl=[];
 for(let y=1;y<S.h-1;y++)for(let x=1;x<S.w-1;x++)if(S.g[y][x]=='.'&&S.g[y][x-1]=='.'&&S.g[y][x+1]=='.'&&S.g[y-1][x]=='.'&&S.g[y+1][x]=='.')fl.push([x,y]);
 const keep=[],near=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),avoid=[];for(const k in S.ar)avoid.push(S.ar[k]);
 for(const q of kzStairs(S))avoid.push([(q.x0+q.x1)/2,(q.y0+q.y1)/2]);const ex=kzExitCells(S);if(ex)avoid.push([(ex.x0+ex.x1)/2,(ex.y0+ex.y1)/2]);
 const list=[];for(const[k,c]of cfg.p)for(let i=0;i<c;i++)list.push(k);
 for(const k of list){let c=null;for(let t=0;t<80;t++){const q=fl[(R()*fl.length)|0];if(!q)break;if(avoid.some(a=>near(a,q)<7))continue;if(keep.some(a=>near(a,q)<4))continue;c=q;break}if(!c)continue;keep.push(c);
  const tx=INT.ox/T+c[0],ty=INT.oy/T+c[1],e={dg:DG.f,chase:420,lz:620,mjm:1};placeE(e,tx,ty,cfg.ti);try{applyVar(e,k)}catch(x){}if(k==='mjSpe'&&!e.nm)e.nm='Espectro del lamento';e.hx=tx*T+16;e.hy=ty*T+16;e.x=e.hx;e.y=e.hy;e.sp*=.9;if(e.nv==null)e.nv=Math.round(cfg.ti*3.5)+1;E.push(e)}
 try{EAn=-1}catch(x){}}
MAN.onScene=function(sid){try{if(!/^ban\./.test(sid)){clearMobs();return}const lv=sid.slice(4);clearMobs();if(lv!=='S')spawn(lv);else{MAN.hallSet&&MAN.hallSet()}}catch(e){try{console.error('MJMAN.scene',e)}catch(x){}}};
MAN.after=function(){clearMobs()};
/* bajar al sótano: si hay una pelea en marcha y no eres parte, la puerta del sótano está cerrada */
MAN.busy=function(){const s=ST.b&&ST.b.ban;return!!(s&&s.st&&s.st!=='AVAILABLE')&&!(window.MJA&&MJA.on)};
MAN.canGo=function(sid,from){
 /* durante la pelea la escalera del sótano está sellada: no se sube hasta que acabe (o hasta salir con 🚪) */
 if(from==='S'&&window.MJA&&MJA.on&&!MJA.done&&!MJA.quit&&!MJA.fell){toast('⛓️ La escalera está sellada por el lamento de la Banshee…',3200);return false}
 /* el sótano NO se cierra con la arena ocupada: el altar es donde se pide turno, y quien llega tarde debe poder ponerse en la cola. La pelea es virtual (cada peleador la ve en su pantalla; el servidor oculta a los que no son de su Party), así que quien espera abajo no ve ni estorba a nadie */
 if(sid==='ban.S'){const warn=()=>{try{if(KZ.on&&KZ.sc&&KZ.sc.id==='ban.S'&&MAN.busy()&&!(ST.b.ban.turn||ST.b.ban.fight))toast('🕯️ La Banshee está peleando con otro grupo. Pide turno en el altar y espera tu lugar en la cola.',4600)}catch(e){}};
  try{Promise.resolve(MJ.load&&MJ.load(1)).then(()=>setTimeout(warn,700))}catch(e){}}   /* el estado puede estar viejo (se refresca cada 5 min lejos del territorio): se pide fresco antes de avisar */
 return true};
/* el zoom de la mansión: cubre toda la pantalla (cuartos de punto para que los píxeles queden parejos) */
MAN.zoom=function(D,ds){ds=(ds>0)?ds:1;const x=Math.max(VW/(D.w*T),VH/(D.h*T));return Math.max(1,Math.min(3,Math.ceil(x*2*ds-1e-6)/(2*ds)))};
/* la cámara: durante la pelea mezcla héroe y jefa (la define mjc5.js) */
MAN.cam=function(def){return(window.MJA&&MJA.camI)?MJA.camI(def):def};
/* ═════════ el sótano: altar, círculo ritual, la Banshee dormida y el sello de la escalera ═════════ */
let SPRING=0;
function drawInt(cx,cy,now){const S=KZ.sc;if(!S||S.lv!=='S')return;const ox=INT.ox-cx,oy=INT.oy-cy,rc=H.RING,fight=!!(window.MJA&&MJA.on);
 /* círculo ritual: brilla, y más cuando hay combate */
 g.save();g.globalCompositeOperation='lighter';const f=.6+.4*Math.sin(now*1.4),a=fight?.55:.26,x=ox+rc[0]*2,y=oy+rc[1]*2,r=102;
 g.save();g.translate(x,y);g.scale(1,.62);const gr=g.createRadialGradient(0,0,6,0,0,r);gr.addColorStop(0,'rgba(120,200,255,'+(a*.5*f)+')');gr.addColorStop(.7,'rgba(120,200,255,'+(a*.25)+')');gr.addColorStop(1,'rgba(120,200,255,0)');g.fillStyle=gr;g.beginPath();g.arc(0,0,r,0,7);g.fill();
 g.rotate(now*.25);g.strokeStyle='rgba(170,225,255,'+(a*1.4*f)+')';g.lineWidth=2;for(let i=0;i<6;i++){g.beginPath();g.arc(0,0,r*.86,i*1.047+.1,i*1.047+.62);g.stroke()}g.restore();g.restore();
 /* velas del altar + la Banshee dormida flotando sobre él (no hay pelea) */
 if(!fight){const a2=H.ALTAR,ax=ox+a2[0]*2,ay=oy+a2[1]*2;g.save();g.globalCompositeOperation='lighter';const q=g.createRadialGradient(ax,ay-40,2,ax,ay-40,120);q.addColorStop(0,'rgba(140,200,255,'+(.22+.05*Math.sin(now*1.2))+')');q.addColorStop(1,'rgba(140,200,255,0)');g.fillStyle=q;g.fillRect(ax-120,ay-160,240,240);g.restore();
  const F=MJ.FAMS&&MJ.FAMS[3];if(F&&F.cv){const sc=1.28,w=F.fw*sc,h=F.fh*sc,bob=Math.sin(now*1.3)*5;g.save();g.globalAlpha=.55+.12*Math.sin(now*.9);g.imageSmoothingEnabled=true;g.drawImage(F.cv,F.fw,0,F.fw,F.fh,Math.round(ax-w/2),Math.round(ay-h-52+bob),w,h);g.restore()}}
 /* durante el combate la escalera queda sellada con cadenas espectrales */
 if(fight){const st=kzStairs(S)[0];if(st){const sx=ox+st.x0*32-8,sy=oy+st.y0*32,w=(st.x1-st.x0+1)*32+16,h=(st.y1-st.y0+1)*32;g.save();g.fillStyle='rgba(8,12,24,.62)';g.fillRect(sx,sy,w,h);g.strokeStyle='rgba(150,215,255,'+(.5+.3*Math.sin(now*4))+')';g.lineWidth=3;g.beginPath();g.moveTo(sx,sy+6);g.lineTo(sx+w,sy+h-6);g.moveTo(sx+w,sy+6);g.lineTo(sx,sy+h-6);g.stroke();g.restore()}}}
/* ═════════ presencia y sala del combate (la usa mjc5.js) ═════════ */
MAN.hall=()=>{if(!inInt()||KZ.sc.lv!=='S')return null;return[INT.ox/T+H.FX,INT.oy/T+H.FY,26,17]};          /* [x,y,ancho,alto] en casillas del mundo */
MAN.cols=H.COLS.map(c=>[c[0]*2-H.FX*32,c[1]*2-H.FY*32]);                                                    /* pilares en px locales del marco de la pelea */
MAN.spawns=[[12,15],[14,15],[16,15],[10,15],[18,15],[12,14],[16,14],[14,14]];                                /* casillas de aparición (nivel) */
/* llevar al jugador a la sala (al empezar el combate o al reanudarlo) */
MAN.toHall=function(i,cb){ensureArt(a=>{if(!a){if(cb)cb(false);return}
  const go=()=>{const sp=MAN.spawns[(i|0)%MAN.spawns.length];P.x=INT.ox+(sp[0]+.5)*T;P.y=INT.oy+(sp[1]+.5)*T;P.dir='up';try{MD.x=P.x;MD.y=P.y+20;PD.x=P.x;PD.y=P.y+20}catch(e){}try{LCX=-1;NT=0}catch(e){}if(cb)cb(true)};
  if(inInt()){if(KZ.sc.lv==='S'){go();return}kzScene('ban.S','R');go();return}
  if(KZ.on||INT.on||DG.f){if(cb)cb(false);return}
  const ret={x:P.x,y:Math.max(P.y,(mn()[1]+1.6)*T)};if(kzBegin(ret,'ban.S','R'))go();else if(cb)cb(false)})};
/* tras el combate: de vuelta a la planta baja, junto a la escalera */
MAN.afterFight=function(){try{if(inInt()&&KZ.sc.lv==='S')kzScene('ban.G','R')}catch(e){}};
MAN.hallSet=function(){};
/* ═════════ v436: enrutador de mansiones y castillos ═════════
   Cada jefe con un lugar propio (Banshee: la Mansión Embrujada · Necromancer: el Castillo Maldito, mjc8.js) registra su manejador en MAN.reg[<id del jefe>].
   Lo que arriba eran métodos de MAN se vuelve despachador: usa el manejador del interior en el que estás (KZ.sc.hid). El de la Banshee queda tal cual estaba. */
const BAN={};for(const k of['inside','scene','scope','isWater','stamp','ensureArt','enter','leave','nearAltar','onScene','after','busy','canGo','hall','cols','spawns','toHall','afterFight','hallSet'])BAN[k]=MAN[k];
MAN.reg={ban:BAN};
MAN.mine=()=>{try{const h=typeof KZ!=='undefined'&&KZ.on&&KZ.sc&&KZ.sc.hid;return h&&MAN.reg[h]?h:''}catch(e){return''}};   /* 'ban' | 'nec' | '' (id del jefe cuyo interior pisas) */
const cur=()=>MAN.reg[MAN.mine()]||null,any=(f,a,b)=>{for(const k in MAN.reg){try{const o=MAN.reg[k];o&&o[f]&&o[f](a,b)}catch(e){try{console.error('MJMAN.'+f,e)}catch(x){}}}};
MAN.inside=()=>!!MAN.mine();
MAN.scene=()=>{try{const h=MAN.mine();return h?h+'.'+KZ.sc.lv:''}catch(e){return''}};
MAN.scope=()=>{try{const h=MAN.mine();return h?h+KZ.sc.lv+':':''}catch(e){return''}};
MAN.stamp=()=>any('stamp');
MAN.ensureArt=(cb,b)=>{const a=MAN.reg[b||MAN.mine()||'ban'];if(a)a.ensureArt(cb);else cb(null)};
MAN.leave=()=>{const a=cur();if(a)a.leave()};
MAN.nearAltar=b=>{const h=MAN.mine();if(!h||(b&&b!==h))return false;const a=MAN.reg[h];return a&&a.nearAltar?a.nearAltar():false};
MAN.onScene=sid=>any('onScene',sid);
MAN.after=()=>any('after');
MAN.busy=()=>{const a=cur();return a&&a.busy?a.busy():false};
MAN.canGo=(sid,from)=>{const a=cur();return a&&a.canGo?a.canGo(sid,from):true};
MAN.hall=()=>{const a=cur();return a&&a.hall?a.hall():null};
MAN.colsOf=b=>{const a=MAN.reg[b||MAN.mine()||'ban'];return(a&&a.cols)||[]};
MAN.toHall=(i,cb,b)=>{const a=MAN.reg[b||'ban'];if(a)a.toHall(i,cb);else if(cb)cb(false)};
MAN.afterFight=b=>{const a=MAN.reg[b||MAN.mine()||'ban'];if(a&&a.afterFight)a.afterFight()};
/* v437: capa delantera (copas de árboles sobre quien camina detrás, matojos de delante), rótulo de los cruces entre zonas y nombre del lugar en el HUD */
MAN.front=(cx,cy,now)=>{const a=cur();if(a&&a.front)a.front(cx,cy,now)};
MAN.stairTxt=(S,s,t)=>{const a=MAN.reg[S&&S.hid];return a&&a.stairTxt?a.stairTxt(S,s,t):''};
MAN.place=()=>{const h=MAN.mine();if(!h)return'';const a=MAN.reg[h];if(a&&a.place)return a.place();const t=MJ.THEME&&MJ.THEME[h];return t?t.nm:''};
})();
/* ═══════════ v436 · MINI-JEFES (cliente) · parte 8: EL CASTILLO MALDITO (Necromancer) ═══════════
   Por fuera: un castillo enorme y oscuro en mitad de la Llanura de los Condenados (fachada de mjc7.js), terreno seco y quemado, camino de piedra con braseros de fuego verde,
   obeliscos, espejos rotos y círculos rituales, cielo de tormenta con relámpagos y un resplandor que se ve desde lejos · por dentro: 4 pisos explorables con el motor de interiores
   de Karez a pantalla completa (Gran Vestíbulo · Biblioteca Prohibida · Torre del Hechicero · Salón de los Espejos), con las criaturas del entorno del Necromancer.
   El Necromancer duerme en su trono, junto al altar donde se hace la ofrenda; la pelea ocurre en esa misma sala (mjc9.js).
   Lo que decide el servidor (presencia, turno, vida del jefe, espejos rotos, premio) no cambia: aquí solo se ven y se pisan los lugares. */
(function(){
'use strict';
const MJ=window.MJC,N=window.MJN,MAN=window.MJMAN;if(!MJ||!MJ.ST||!N||!MAN||!MAN.reg)return;
const ST=MJ.ST,$=id=>document.getElementById(id);
const geo=()=>{const s=ST.b&&ST.b.nec;return s&&s.geo};
const MN0=[950,121],CS0=[14.4,22,11,13];
const mn=()=>{const g=geo();return(g&&g.mn)||MN0},cs=()=>{const g=geo();return(g&&g.cs)||CS0};
const rng=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const cl=(v,a,b)=>v<a?a:v>b?b:v;
const inInt=()=>typeof KZ!=='undefined'&&KZ.on&&KZ.sc&&KZ.sc.hid==='nec';
const NEC=window.MJNEC={};
/* ═════════ el castillo: la huella ═════════ */
// geometría de la huella: ES LA MISMA que usa el servidor (minijefes.js, entre las marcas GEO2 y FINGEO2): el build y las pruebas comprueban que el texto sea idéntico
/*GEO2*/
const csCell=(c,m,x,y)=>{const dx=Math.abs(x+.5-(m[0]+.5));
 if(dx<=c[0]&&y>m[1]-c[1]&&y<=m[1])return 3;
 if(dx<=c[2]&&y>m[1]&&y<=m[1]+c[3])return 2;
 return 0};
/*FINGEO2*/
/* 0 = como estaba · 3 = huella sólida del castillo (la tapa la fachada) · 2 = explanada y camino despejados (sin rocas, agua ni árboles) */
NEC.cell=(x,y)=>csCell(cs(),mn(),x,y);
let stamped='';
function stamp(){if(typeof M==='undefined'||typeof TREE==='undefined')return;const m=mn(),c=cs(),key=m.join(',')+c.join(',');if(key===stamped)return;if(!M[m[1]-c[1]-2]||!M[m[1]+c[3]+2])return;stamped=key;
 const hw=Math.max(c[0],c[2])+2;
 for(let y=m[1]-c[1]-1;y<=m[1]+c[3]+1;y++)for(let x=Math.floor(m[0]-hw);x<=Math.ceil(m[0]+hw);x++){const k=csCell(c,m,x,y);if(!k)continue;
  if(k===3){M[y][x]=2;TREE[y*W+x]=0}else{if(M[y][x]===2||M[y][x]===3)M[y][x]=1;TREE[y*W+x]=0}}
 try{if(typeof LCX!=='undefined')LCX=-1}catch(e){}}
setInterval(()=>{try{stamp()}catch(e){}},700);NEC.stamp=stamp;
/* ═════════ arte: se hornea la primera vez que hace falta ═════════ */
let ART=null,ARTBUSY=0,ARTW=[];
const loadImg=(src,cb)=>{const i=new Image();i.onload=()=>cb(i);i.onerror=()=>cb(null);i.src=src};
function install(){if(!ART)return;const a=ART;for(const k of['S','G','1','2'])KZD.lv['nec.'+k]=a.levels[k];KZD.hn.nec={nm:'Castillo Maldito',th:0,fl:'castle'};KZ.img.nec={s:2,im:a.atlas,cb:[],t:performance.now()+1e12}}
function ensureArt(cb){if(ART){install();cb(ART);return}if(ARTBUSY){ARTW.push(cb);return}ARTBUSY=1;ARTW=[cb];let rel,ug,ig,n=3;
 const fin=()=>{if(--n)return;const w=ARTW;ARTW=[];ARTBUSY=0;if(!rel||!ug||!ig){w.forEach(f=>f(null));return}
  try{ART=N.build({rel,ug,ig,lv:KZD.lv});install()}catch(e){try{console.error('mjn',e)}catch(x){}ART=null}w.forEach(f=>f(ART))};
 loadImg('kz_rel.png?v=397',i=>{rel=i;fin()});loadImg(UGATL,i=>{ug=i;fin()});
 const I=VBX&&VBX.ig&&VBX.ig.i;if(!I){ig=null;fin()}else if(I.complete&&I.naturalWidth){ig=I;fin()}else{I.addEventListener('load',()=>{ig=I;fin()},{once:true});I.addEventListener('error',()=>{ig=null;fin()},{once:true})}}
NEC.ensureArt=ensureArt;
/* ═════════ decoradores propios del castillo (se suman a MJC.PAINT) ═════════ */
const P2=(c,a,b,w,h)=>{g.fillStyle=c;g.fillRect(Math.round(a),Math.round(b),w,h)};
if(MJ.PAINT){
 /* brasero de hierro con fuego verde que baila y alumbra */
 MJ.PAINT.gbraz=function(x,y,v,now){g.fillStyle='rgba(0,0,0,.32)';g.beginPath();g.ellipse(x,y+1,10,3,0,0,7);g.fill();
  P2('#1a1426',x-1,y-24,3,24);P2('#2c2442',x-9,y-4,18,4);P2('#463b70',x-9,y-4,18,1);P2('#2c2442',x-6,y-9,12,5);
  P2('#0f0a1d',x-10,y-30,20,8);P2('#2c2442',x-11,y-33,22,3);P2('#5a4d90',x-11,y-33,22,1);P2('#05030a',x-8,y-31,16,2);
  const t=now*8+v;g.save();g.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){const h=13+Math.sin(t+i*2.1)*5,wx=x-5+i*5;g.fillStyle='rgba('+(i==1?'210,255,228':'90,255,160')+','+(.55+.15*Math.sin(t*1.3+i)).toFixed(2)+')';g.beginPath();g.moveTo(wx-3,y-31);g.quadraticCurveTo(wx-4,y-31-h*.6,wx+Math.sin(t+i)*2,y-31-h);g.quadraticCurveTo(wx+4,y-31-h*.6,wx+3,y-31);g.fill()}
  const q=g.createRadialGradient(x,y-36,2,x,y-36,52);q.addColorStop(0,'rgba(90,255,160,'+(.3+.08*Math.sin(t)).toFixed(2)+')');q.addColorStop(1,'rgba(90,255,160,0)');g.fillStyle=q;g.fillRect(x-52,y-88,104,104);g.restore()};
 /* obelisco oscuro con glifos que laten */
 MJ.PAINT.obel=function(x,y,v,now){g.fillStyle='rgba(0,0,0,.36)';g.beginPath();g.ellipse(x,y+1,16,5,0,0,7);g.fill();
  P2('#15101f',x-14,y-8,28,8);P2('#2a2144',x-14,y-8,28,2);P2('#1c1530',x-11,y-14,22,6);
  const q=g.createLinearGradient(x-9,0,x+9,0);q.addColorStop(0,'#120d22');q.addColorStop(.45,'#3b2f60');q.addColorStop(1,'#0d0818');g.fillStyle=q;g.beginPath();g.moveTo(x-9,y-14);g.lineTo(x-6,y-66);g.lineTo(x,y-76);g.lineTo(x+6,y-66);g.lineTo(x+9,y-14);g.closePath();g.fill();
  g.strokeStyle='rgba(200,170,255,.35)';g.lineWidth=1;g.beginPath();g.moveTo(x-9,y-14);g.lineTo(x-6,y-66);g.lineTo(x,y-76);g.stroke();
  const t=now*1.6+v;g.save();g.globalCompositeOperation='lighter';for(let i=0;i<4;i++){const a=.45+.4*Math.sin(t+i*1.3),yy=y-24-i*12;g.fillStyle='rgba(110,255,175,'+a.toFixed(2)+')';g.fillRect(Math.round(x-3),Math.round(yy),6,2);g.fillRect(Math.round(x-1),Math.round(yy-4),2,5)}
  const gq=g.createRadialGradient(x,y-44,2,x,y-44,40);gq.addColorStop(0,'rgba(110,255,175,.16)');gq.addColorStop(1,'rgba(110,255,175,0)');g.fillStyle=gq;g.fillRect(x-40,y-84,80,80);g.restore()}}
/* ═════════ suelo seco y quemado alrededor del castillo (se pinta una vez, a media resolución) ═════════ */
const SCW=84,SCH=64;                                            /* casillas del lienzo */
let SC=null;
function scorchBuild(){const m=mn(),c=cs(),R=rng(43602),W2=SCW*T/2,H2=SCH*T/2,cv=document.createElement('canvas');cv.width=W2;cv.height=H2;const q=cv.getContext('2d');
 const ox=m[0]+.5-SCW/2,oy=m[1]-c[1]-18,cx0=(m[0]+.5-ox)*T/2,cy0=(m[1]-3-oy)*T/2;       /* origen (casillas) y centro del castillo en el lienzo */
 const near=(px,py)=>{const d=Math.hypot((px-cx0)/(34*T/2),(py-cy0)/(26*T/2));return Math.max(0,1-d)};
 /* manchas de tierra quemada, más densas y oscuras cerca del castillo */
 for(let i=0;i<520;i++){const px=R()*W2,py=R()*H2,k=near(px,py);if(R()>k*1.4+.04)continue;const r=(30+R()*80)*(.5+k)/1.0,a=(.16+.34*k)*(.55+R()*.6);
  const gr=q.createRadialGradient(px,py,0,px,py,r);const col=R()<.7?'30,20,34':'44,30,26';gr.addColorStop(0,'rgba('+col+','+a.toFixed(3)+')');gr.addColorStop(1,'rgba('+col+',0)');q.fillStyle=gr;q.fillRect(px-r,py-r,r*2,r*2)}
 /* tierra reseca: grietas, tallos secos y marcas de quemadura */
 q.lineCap='round';for(let i=0;i<340;i++){const px=R()*W2,py=R()*H2,k=near(px,py);if(R()>k*1.3)continue;let x=px,y=py,a=R()*6.28;q.beginPath();q.moveTo(x,y);const n=3+(R()*5|0);for(let j=0;j<n;j++){a+=(R()-.5)*1.4;x+=Math.cos(a)*(5+R()*9);y+=Math.sin(a)*(4+R()*7);q.lineTo(x,y)}q.strokeStyle='rgba(8,4,12,'+(.38+.3*k).toFixed(2)+')';q.lineWidth=1.4;q.stroke()}
 for(let i=0;i<1100;i++){const px=R()*W2,py=R()*H2,k=near(px,py);if(R()>k*1.1+.02)continue;q.strokeStyle=R()<.5?'rgba(120,104,66,.75)':'rgba(84,70,48,.8)';q.lineWidth=1.2;q.beginPath();q.moveTo(px,py);q.lineTo(px+(R()-.5)*5,py-3-R()*5);q.stroke()}
 for(let i=0;i<46;i++){const px=R()*W2,py=R()*H2,k=near(px,py);if(R()>k*1.2)continue;const r=14+R()*30;q.save();q.translate(px,py);q.scale(1,.55);q.strokeStyle='rgba(6,3,10,'+(.3+.3*k).toFixed(2)+')';q.lineWidth=3;q.beginPath();q.arc(0,0,r,0,7);q.stroke();q.restore()}
 SC={cv,ox,oy}}
function drawScorch(cx,cy){if(!SC)scorchBuild();const x=SC.ox*T-cx,y=SC.oy*T-cy,w=SCW*T,h=SCH*T;if(x>VW||x+w<0||y>VH||y+h<0)return;g.imageSmoothingEnabled=true;g.drawImage(SC.cv,Math.round(x),Math.round(y),w,h);g.imageSmoothingEnabled=false}
/* ═════════ el risco: el castillo está tallado en una montaña oscura (no se puede rodear por detrás) ═════════
   La huella sólida llega hasta el tope de la fachada; aquí se pinta encima de las rocas del mapa un farallón de roca violeta con grietas, estratos, rocas sueltas y árboles muertos en la cresta. Se pinta una vez, a media resolución. */
let CR=null;
function cragBuild(){const m=mn(),c=cs(),R=rng(43611),X0=m[0]-Math.ceil(c[0])-4,X1=m[0]+Math.ceil(c[0])+5,Y0=m[1]-c[1]-5,Y1=m[1]+2,S=T/2,w=(X1-X0)*S,h=(Y1-Y0)*S,cv=document.createElement('canvas');cv.width=w;cv.height=h;const q=cv.getContext('2d');
 const cx0=(m[0]+.5-X0)*S,hwp=c[0]*S;                                  /* centro y semiancho (px del lienzo) de la huella sólida */
 /* silueta superior: cordillera de picos irregulares, siempre por encima del borde de la huella */
 const top=new Float32Array(w),ph=[R()*6,R()*6,R()*6,R()*6];
 for(let x=0;x<w;x++){const u=x/w,e=Math.min(1,Math.min(x,w-x)/(3.2*S));
  let t=S*(1.6+1.1*Math.sin(u*7+ph[0])+.7*Math.sin(u*15+ph[1])+.45*Math.sin(u*31+ph[2]))+S*.28*Math.abs(Math.sin(u*63+ph[3]))*(R()<.12?2.2:1);
  top[x]=Math.max(.2*S,t)+(1-e)*S*8}                                    /* los bordes bajan (estribaciones) */
 /* borde izquierdo y derecho: desiguales, pero nunca dentro de la huella (que debe quedar cubierta del todo) */
 const edge=(y,side)=>{const k=.9+1.9*(.5+.5*Math.sin(y*.045+side*2.1+ph[side?0:1]))+(R()-.5)*.35;return k*S};
 for(let y=0;y<h;y++){const l=cx0-hwp-edge(y,0),r=cx0+hwp+edge(y,1);
  for(let x=Math.max(0,Math.floor(l));x<Math.min(w,Math.ceil(r));x++){const ty=top[x];if(y<ty)continue;
   const d=(y-ty)/S,sh=Math.min(1,d/18);                                /* 0 en la cresta → 1 en la falda */
   const n=((x*73856093^y*19349663)>>>0)%97/97;                         /* grano fijo */
   const L=Math.max(0,.36-.30*sh+(n-.5)*.07+(((x>>3)+(y>>3))%2?.012:0));
   q.fillStyle='rgb('+Math.round(36*L/.36+6)+','+Math.round(26*L/.36+4)+','+Math.round(58*L/.36+10)+')';q.fillRect(x,y,1,1)}}
 /* facetas iluminadas por la tormenta: triángulos claros hacia un lado y oscuros hacia el otro */
 for(let i=0;i<160;i++){const x=R()*w,y=(R()*R()*.92)*h;if(y<top[Math.floor(Math.min(w-1,x))])continue;const s=(8+R()*26)*(S/16),a=R()*6.28;q.fillStyle='rgba('+(R()<.5?'96,78,150':'8,4,16')+','+(.10+R()*.14).toFixed(3)+')';q.beginPath();q.moveTo(x,y);q.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s*1.5);q.lineTo(x+Math.cos(a+1.9)*s*.8,y+Math.sin(a+1.9)*s);q.closePath();q.fill()}
 /* estratos y grietas */
 q.lineCap='round';for(let i=0;i<150;i++){let x=R()*w,y=R()*h,xx=Math.floor(Math.min(w-1,Math.max(0,x)));if(y<top[xx]+2)continue;q.strokeStyle='rgba(5,2,12,'+(.28+R()*.3).toFixed(2)+')';q.lineWidth=1+R()*1.3;q.beginPath();q.moveTo(x,y);const v=R()<.6;for(let j=0;j<4;j++){x+=(v?(R()-.5)*7:6+R()*14);y+=(v?7+R()*14:(R()-.5)*5);q.lineTo(x,y)}q.stroke()}
 /* cresta: reborde claro violeta-verdoso que recorta la silueta */
 q.strokeStyle='rgba(120,100,190,.5)';q.lineWidth=1.4;q.beginPath();for(let x=0;x<w;x++){x?q.lineTo(x,top[x]+.5):q.moveTo(x,top[x]+.5)}q.stroke();
 q.strokeStyle='rgba(90,235,170,.18)';q.lineWidth=3;q.beginPath();for(let x=0;x<w;x+=2){x?q.lineTo(x,top[x]+2):q.moveTo(x,top[x]+2)}q.stroke();
 /* árboles muertos en la cresta */
 for(let i=0;i<26;i++){const x=Math.floor(R()*w),y=top[x]+2,hh=(14+R()*22)*(S/16);if(x<S*3||x>w-S*3)continue;q.strokeStyle='rgba(8,4,16,.95)';q.lineWidth=2;q.beginPath();q.moveTo(x,y+4);q.lineTo(x+(R()-.5)*4,y-hh);q.stroke();q.lineWidth=1;for(let b=0;b<3;b++){const by=y-hh*(.35+b*.2),sd=R()<.5?-1:1;q.beginPath();q.moveTo(x,by);q.lineTo(x+sd*(5+R()*7),by-3-R()*6);q.stroke()}}
 /* rocas sueltas al pie y bruma */
 for(let i=0;i<46;i++){const x=R()*w,y=h-S*(.2+R()*2.4),r=(5+R()*13)*(S/16);q.fillStyle='rgb('+(26+R()*16|0)+','+(20+R()*12|0)+','+(40+R()*20|0)+')';q.beginPath();q.ellipse(x,y,r,r*.62,0,0,7);q.fill();q.fillStyle='rgba(120,104,180,.18)';q.fillRect(x-r*.6,y-r*.52,r*.8,1.4)}
 const gr=q.createLinearGradient(0,h-S*5,0,h);gr.addColorStop(0,'rgba(60,40,100,0)');gr.addColorStop(1,'rgba(40,24,70,.55)');q.fillStyle=gr;q.fillRect(0,h-S*5,w,S*5);
 CR={cv,x:X0,y:Y0,w:(X1-X0),h:(Y1-Y0)}}
function drawCrag(cx,cy){if(!CR)cragBuild();const x=CR.x*T-cx,y=CR.y*T-cy,w=CR.w*T,h=CR.h*T;if(x>VW+40||x+w<-40||y>VH+40||y+h<-40)return;g.imageSmoothingEnabled=true;g.drawImage(CR.cv,Math.round(x),Math.round(y),w,h);g.imageSmoothingEnabled=false}
/* ═════════ decoración de la explanada (fija, no sólida) ═════════ */
let DEC=null;
function mkDec(){const R=rng(43603),out=[],m=mn(),c=cs(),cx=m[0]+.5,P_=MJ.PAINT||{},gy=m[1]+1,add=(t,tx,ty,v,fl)=>{if(!P_[t])return;out.push({t,x:Math.round(tx*T),y:Math.round(ty*T),v:v!=null?v:(R()*997|0),floor:fl?1:0})};
 const free=(tx,ty)=>{if(csCell(c,m,Math.floor(tx),Math.floor(ty))===3)return 0;return 1};
 /* camino de losas gastadas: 5 de ancho junto a las puertas y 3 hacia el sur, hasta el final de la explanada */
 for(let ty=gy;ty<=m[1]+c[3];ty++){const wd=ty<gy+6?2:1;for(let dx=-wd;dx<=wd;dx++){const tx=Math.floor(cx)+dx,ed=dx===-wd?1:dx===wd?2:0;add('flag',tx+.5,ty,((tx*31+ty*17+(R()*50|0))<<2)|ed,1)}}
 /* braseros de fuego verde a ambos lados del camino y junto a los escalones */
 for(const ty of[gy+1.6,gy+4.6,gy+7.6,gy+10.6])for(const sx of[-1,1])add('gbraz',cx+sx*(ty<gy+6?3.6:2.8),ty);
 for(const sx of[-1,1])add('gbraz',cx+sx*6.2,gy+1.1);
 /* obeliscos, pilares rotos y espejos agrietados (restos de antiguos rituales) */
 for(const[dx,dy]of[[-8.6,2.4],[8.6,2.4],[-11.4,6],[11.4,6.6],[-7.5,12],[7.5,12.4]])add('obel',cx+dx,gy+dy);
 for(const[dx,dy]of[[-10.6,9.4],[10.4,10.6],[-6.4,4.4],[6.6,8.4]])add('pillar',cx+dx,gy+dy);
 for(const[dx,dy]of[[-9.2,4.4],[9.8,5.2],[-5.6,9.6],[6.2,11.6]])add('mirror',cx+dx,gy+dy);
 /* círculos rituales en el suelo y huesos */
 for(const[dx,dy]of[[-7,6],[7.2,8.6],[0,12],[-9.6,12.2]])add('rune',cx+dx,gy+dy,null,1);
 for(let i=0;i<22;i++){const tx=cx+(R()-.5)*22,ty=gy+1+R()*12;if(Math.abs(tx-cx)>3.4&&free(tx,ty))add('bones',tx,ty)}
 /* cerca de hierro rota a los lados de la explanada */
 for(const sx of[-1,1])for(let y=gy+.6;y<m[1]+c[3]-1;y+=.9)if(R()>.3)add('fence',cx+sx*11.3,y);
 /* árboles muertos que rodean la llanura, y fuegos fatuos */
 for(let i=0;i<46;i++){const ang=R()*6.283,rx=15+R()*14,ry=8+R()*14,tx=cx+Math.cos(ang)*rx,ty=m[1]-c[1]*.4+8+Math.sin(ang)*ry;if(free(tx,ty)&&!(Math.abs(tx-cx)<12.6&&ty>m[1]-2&&ty<m[1]+c[3]+1))add('tree',tx,ty)}
 for(let i=0;i<16;i++){const tx=cx+(R()-.5)*44,ty=m[1]-3+R()*22;if(free(tx,ty))add('wisp',tx,ty)}
 for(let i=0;i<10;i++){const tx=cx+(R()<.5?-1:1)*(15.8+R()*7),ty=m[1]-6+R()*14;add('tomb',tx,ty)}
 return out.sort((a,b)=>(b.floor?1:0)-(a.floor?1:0)||a.y-b.y)}
/* ═════════ fachada, resplandor, cielo de tormenta (se dibujan antes de las criaturas) ═════════ */
const FW0=1040,FH0=640;
const nearCastle=pad=>{const m=mn(),c=cs(),px=P.x/T,py=P.y/T;return px>=m[0]-c[0]-pad&&px<=m[0]+c[0]+pad&&py>=m[1]-c[1]-36-pad&&py<=m[1]+c[3]+pad};
let BATS=null,DEBRIS=null;
function drawFacade(cx,cy,now){if(!ART||!ART.facade)return;const F=ART.facade,m=mn(),bx=(m[0]+.5)*T,by=(m[1]+1)*T,x=Math.round(bx-F.width/2-cx),y=Math.round(by-F.height-cy);if(x>VW+60||x+F.width<-60||y>VH+60||y+F.height<-60)return;
 const fl0=ST_.fl||0;
 /* resplandor trasero: el castillo está iluminado desde atrás por la tormenta mágica (separa las siluetas del risco) */
 g.save();g.globalCompositeOperation='lighter';{const dx=x+F.width/2,dy=y+F.height*.46,gr=g.createRadialGradient(dx,dy,30,dx,dy,600);gr.addColorStop(0,'rgba(150,110,255,'+(.26+.05*Math.sin(now*1.1)+.2*fl0).toFixed(3)+')');gr.addColorStop(.55,'rgba(80,210,150,.07)');gr.addColorStop(1,'rgba(80,210,150,0)');g.save();g.translate(dx,dy);g.scale(1.25,.9);g.translate(-dx,-dy);g.fillStyle=gr;g.fillRect(dx-600,dy-600,1200,1200);g.restore()}
 /* base de energía: charco violeta-verde que respira bajo todo el castillo */
 {const dx=x+F.width/2,dy=y+F.height-6,gr=g.createRadialGradient(dx,dy,10,dx,dy,520);gr.addColorStop(0,'rgba(130,90,230,'+(.2+.05*Math.sin(now*1.1)).toFixed(3)+')');gr.addColorStop(.5,'rgba(70,200,140,.07)');gr.addColorStop(1,'rgba(70,200,140,0)');g.save();g.translate(dx,dy);g.scale(1,.34);g.translate(-dx,-dy);g.fillStyle=gr;g.fillRect(dx-520,dy-520,1040,1040);g.restore()}g.restore();
 g.drawImage(F,x,y);
 /* ventanas, farolas y puerta: luz que respira (verde o violeta) */
 g.save();g.globalCompositeOperation='lighter';
 for(let i=0;i<ART.glows.length;i++){const q=ART.glows[i],gx=x+q[0],gy=y+q[1],fl=.78+.22*Math.sin(now*(1.7+i*.31)+i*2.1)+.06*Math.sin(now*11+i)+.5*fl0,r=(q[2]>=.8?46:30)*1.4,col=q[3]?'170,120,255':'110,255,170',gr=g.createRadialGradient(gx,gy,1,gx,gy,r);gr.addColorStop(0,'rgba('+col+','+Math.min(.8,.42*fl*q[2]).toFixed(3)+')');gr.addColorStop(1,'rgba('+col+',0)');g.fillStyle=gr;g.fillRect(gx-r,gy-r,r*2,r*2)}
 /* runas del umbral: un círculo ritual en los escalones */
 {const dx=x+F.width/2,dy=y+F.height-14,t=now*.6,a=.5+.25*Math.sin(now*2);g.save();g.translate(dx,dy);g.scale(1,.34);g.lineWidth=3;g.strokeStyle='rgba(120,255,175,'+(a*.8).toFixed(2)+')';g.beginPath();g.arc(0,0,70,0,7);g.stroke();g.strokeStyle='rgba(190,130,255,'+a.toFixed(2)+')';g.rotate(t);for(let i=0;i<7;i++){g.beginPath();g.arc(0,0,58,i*.897,i*.897+.5);g.stroke()}g.restore()}
 /* aura del torreón: un halo verde-violeta en lo alto y chispas que suben */
 {const bxx=x+ART.beacon[0],byy=y+ART.beacon[1],gr=g.createRadialGradient(bxx,byy,2,bxx,byy,150);gr.addColorStop(0,'rgba(150,255,205,'+(.32+.08*Math.sin(now*1.7)+.4*fl0).toFixed(3)+')');gr.addColorStop(.5,'rgba(150,110,255,.12)');gr.addColorStop(1,'rgba(150,110,255,0)');g.fillStyle=gr;g.fillRect(bxx-150,byy-150,300,300);
  for(let k=0;k<14;k++){const f=((now*.16+k*.071)%1),sx=bxx+Math.sin(now*.9+k*2.7)*(10+f*34),sy=byy+8-f*260;g.fillStyle='rgba(190,255,225,'+(.7*Math.sin(f*3.14)).toFixed(3)+')';g.fillRect(Math.round(sx),Math.round(sy),2,2)}}
 /* escombros que flotan sobre la torre derrumbada (energía mágica que los sostiene) */
 if(!DEBRIS){const R=rng(2207);DEBRIS=[];for(let i=0;i<9;i++)DEBRIS.push({a:R()*6.28,r:18+R()*44,s:.25+R()*.4,h:12+R()*60,z:2+R()*4,p:R()*6})}
 {const tx=x+948,ty=y+FH0-330-14+34;for(const d of DEBRIS){const a=now*d.s+d.a,dx=tx+Math.cos(a)*d.r,dy=ty-d.h+Math.sin(a*1.6+d.p)*8-Math.abs(Math.sin(a))*10;g.fillStyle='rgba(130,255,190,'+(.2+.1*Math.sin(now*3+d.p)).toFixed(3)+')';g.fillRect(Math.round(dx-d.z-1),Math.round(dy+d.z),d.z*2+2,2);g.fillStyle='#241a3e';g.fillRect(Math.round(dx-d.z),Math.round(dy-d.z*.6),d.z*2,d.z*1.2+1);g.fillStyle='rgba(205,190,255,.5)';g.fillRect(Math.round(dx-d.z),Math.round(dy-d.z*.6),d.z*2,1)}}
 g.restore();
 /* niebla verde pegada al suelo: bandas que se deslizan */
 g.save();for(let k=0;k<4;k++){const fx=x+F.width*(.12+.25*k)+Math.sin(now*.2+k*2)*40,fy=y+F.height-8+Math.sin(now*.3+k)*5,r=150+k*18,gr3=g.createRadialGradient(fx,fy,2,fx,fy,r);gr3.addColorStop(0,'rgba(150,235,200,.18)');gr3.addColorStop(1,'rgba(150,235,200,0)');g.save();g.translate(fx,fy);g.scale(1,.28);g.translate(-fx,-fy);g.fillStyle=gr3;g.fillRect(fx-r,fy-r,r*2,r*2);g.restore()}g.restore();
 /* murciélagos que rodean las torres */
 if(!BATS){const R=rng(779);BATS=[];for(let i=0;i<9;i++)BATS.push({a:R()*6.28,r:60+R()*70,s:.3+R()*.5,y:.12+R()*.3,w:R()*6})}
 g.fillStyle='#07040f';for(const b of BATS){const a=now*b.s+b.a,bx2=x+F.width/2+Math.cos(a)*(F.width*.46+b.r*.4),by2=y+F.height*b.y+Math.sin(a*1.7)*44+Math.sin(a*.9)*18,fl=Math.sin(now*14+b.w)*4;g.fillRect(Math.round(bx2-1),Math.round(by2),3,2);g.fillRect(Math.round(bx2-6),Math.round(by2-fl*.5),5,1);g.fillRect(Math.round(bx2+3),Math.round(by2-fl*.5),5,1)}}
/* truenos: un rumor grave y largo (respeta el interruptor de sonido del juego) */
function thunder(vol){try{const c=typeof sfxC=='function'?sfxC():null;if(!c)return;const t=c.currentTime,out=(typeof AU!='undefined'&&AU.sg)||c.destination,n=c.sampleRate*3,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
 const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(420,t);f.frequency.exponentialRampToValueAtTime(90,t+2.4);const gg=c.createGain();gg.gain.setValueAtTime(.0001,t);gg.gain.exponentialRampToValueAtTime(.5*vol,t+.12);gg.gain.exponentialRampToValueAtTime(.18*vol,t+.6);gg.gain.exponentialRampToValueAtTime(.0001,t+2.8);s.connect(f);f.connect(gg);gg.connect(out);s.start(t);s.stop(t+3)}catch(e){}}
/* tormenta y resplandor a distancia: sombras de nubes que pasan, relámpagos y un halo violeta-verde en el borde de la pantalla que apunta al castillo */
const LG={next:0,t:0,bolt:null,th:0},ST_={};
/* estado de la tormenta de este cuadro: distancia al castillo, cuánto se acerca el cielo (k) y la intensidad del relámpago (fl) */
function stormState(now){const m=mn(),tx=(m[0]+.5)*T,ty=(m[1]-3)*T,d=Math.hypot(P.x-tx,P.y-ty)/T,pn=performance.now();ST_.d=d;ST_.tx=tx;ST_.ty=ty;ST_.k=cl(1-d/62,0,1);ST_.pn=pn;ST_.fl=0;if(d>78)return ST_;
 if(!LG.next)LG.next=pn+2500+Math.random()*5000;
 if(pn>LG.next){LG.t=pn;LG.next=pn+(d<34?5000:9000)+Math.random()*9000;const bx=tx+(Math.random()-.5)*360,pts=[[bx,ty-520]];let px=bx,py=ty-520;for(let i=0;i<9;i++){px+=(Math.random()-.5)*60;py+=50+Math.random()*34;pts.push([px,py])}LG.bolt=pts;LG.th=pn+400+Math.random()*500}
 const lt=pn-LG.t;if(LG.t&&lt<520)ST_.fl=lt<70?lt/70:lt<130?1-(lt-70)/120:lt<200?.15+(lt-130)/70*.7:Math.max(0,.85*(1-(lt-200)/320));
 if(LG.th&&pn>LG.th&&d<44){LG.th=0;thunder(cl(1-d/48,.12,1))}
 return ST_}
/* antes de la fachada: el cielo se cierra sobre el TERRENO (velo violeta oscuro y sombras de nubes); el castillo, que brilla, queda por encima */
function stormBack(cx,cy,now){const s=stormState(now);if(s.d>78)return;const k=s.k;
 g.fillStyle='rgba(10,4,24,'+(.04+.16*k*k).toFixed(3)+')';g.fillRect(0,0,VW,VH);
 if(k>.05){g.save();g.fillStyle='rgba(6,2,16,'+(.12*k).toFixed(3)+')';for(let i=0;i<7;i++){const a=now*.012+i*.9,rr=(8+(i%4)*6)*T,wx=s.tx+Math.cos(a+i)*rr,wy=s.ty+Math.sin(a*1.3+i)*rr*.7+8*T,sx=wx-cx,sy=wy-cy,r=200+i*34;if(sx<-r||sx>VW+r||sy<-r*.6||sy>VH+r*.6)continue;g.save();g.translate(sx,sy);g.scale(1,.6);g.beginPath();g.arc(0,0,r,0,7);g.fill();g.restore()}g.restore()}}
/* después de la fachada: el relámpago ilumina todo, un rayo cae sobre el castillo y, si aún no se ve, un resplandor en el borde de la pantalla señala dónde está */
function stormFront(cx,cy,now){const s=ST_;if(s.d>78||s.d==null)return;const d=s.d,fl=s.fl,k=s.k;
 if(fl>.01){g.fillStyle='rgba(205,190,255,'+(.3*fl*Math.max(.35,k)).toFixed(3)+')';g.fillRect(0,0,VW,VH);
  if(LG.bolt&&d<38){g.save();g.globalCompositeOperation='lighter';g.lineJoin='round';for(const[w,a,c]of[[9,.2,'150,110,255'],[3,.9,'240,235,255']]){g.lineWidth=w;g.strokeStyle='rgba('+c+','+(a*fl).toFixed(3)+')';g.beginPath();LG.bolt.forEach((p,i)=>{const X=p[0]-cx,Y=p[1]-cy;i?g.lineTo(X,Y):g.moveTo(X,Y)});g.stroke()}g.restore()}}
 /* halo en el borde de la pantalla: señala la dirección del castillo cuando aún no se ve */
 if(d>9){const sx=s.tx-cx,sy=s.ty-cy,ang=Math.atan2(sy-VH/2,sx-VW/2),ex=VW/2+Math.cos(ang)*Math.max(VW,VH),ey=VH/2+Math.sin(ang)*Math.max(VW,VH),bx=cl(ex,0,VW),by=cl(ey,0,VH),a=Math.pow(cl((78-d)/64,0,1),.7)*(.68+.22*Math.sin(now*1.3))+fl*.5;
  if(sx<-60||sx>VW+60||sy<-400||sy>VH+60){g.save();g.globalCompositeOperation='lighter';const r=Math.min(VW,VH)*.78,gr=g.createRadialGradient(bx,by,4,bx,by,r);gr.addColorStop(0,'rgba(150,255,205,'+Math.min(.85,a*.95).toFixed(3)+')');gr.addColorStop(.4,'rgba(150,110,255,'+Math.min(.7,a*.62).toFixed(3)+')');gr.addColorStop(1,'rgba(150,110,255,0)');g.fillStyle=gr;g.fillRect(0,0,VW,VH);
   /* haces de luz que salen del horizonte del castillo, junto al borde */
   const hor=Math.abs(ey-by)<2;for(let q=-1;q<=1;q++){const ax=bx+(hor?q*VW*.12:0),ay=by+(hor?0:q*VH*.12),w2=cl(Math.min(VW,VH)*.05,10,38);g.fillStyle='rgba(150,255,205,'+(a*.16*(.6+.4*Math.sin(now*2.3+q*1.7))).toFixed(3)+')';g.beginPath();g.ellipse(ax,ay,w2,Math.min(VW,VH)*.46,hor?0:Math.PI/2,0,7);g.fill()}g.restore()}}}
/* ═════════ gancho del dibujo del suelo ═════════ */
let ARTREQ=0;const g0=MJ.ground;
MJ.ground=function(cx,cy,now){
 if(typeof KZ!=='undefined'&&KZ.on){try{if(inInt())drawInt(cx,cy,now)}catch(e){}try{g0&&g0(cx,cy,now)}catch(e){}return}
 try{if(ST.ready&&typeof LZ=='function'&&!LZ()){const m=mn();
   if(nearCastle(90)){
    if(!ART&&performance.now()-ARTREQ>8000){ARTREQ=performance.now();ensureArt(()=>{})}
    if(!DEC)DEC=mkDec();
    drawScorch(cx,cy);stormBack(cx,cy,now);
    for(const o of DEC){if(!o.floor)break;const x=o.x-cx,y=o.y-cy;if(x<-40||x>VW+40||y<-36||y>VH+90)continue;MJ.PAINT[o.t](x,y,o.v,now)}
    drawCrag(cx,cy);drawFacade(cx,cy,now);
    for(const o of DEC){if(o.floor)continue;const x=o.x-cx,y=o.y-cy;if(x<-60||x>VW+60||y<-90||y>VH+110)continue;MJ.PAINT[o.t](x,y,o.v,now)}}
   else stormState(now);
   stormFront(cx,cy,now)}}catch(e){if(!NEC.err){NEC.err=1;try{console.error('MJNEC',e)}catch(x){}}}
 try{g0&&g0(cx,cy,now)}catch(e){}};
/* ═════════ entrar y salir ═════════ */
const doorPos=()=>{const m=mn();return[(m[0]+.5)*T,(m[1]+.4)*T]};
function nearDoor(){if(typeof KZ==='undefined'||KZ.on||typeof INT==='undefined'||INT.on||(typeof DG!=='undefined'&&DG.f))return false;const d=doorPos();return Math.hypot(P.x-d[0],P.y-d[1])<=170&&P.y>d[1]}
NEC.enter=function(){if(!KZ.ok||KZ.lock||modal||INT.on||DG.f){if(!KZ.ok)toast('⚠️ El castillo no está disponible ahora',3000);return}
 if(!nearDoor()){toast('🚶 Acércate a las puertas del castillo',1800);return}
 toast('⏳ Las puertas del castillo se abren con un crujido…',2200);KZ.lock=1;setTimeout(()=>{KZ.lock=0},1500);
 ensureArt(a=>{if(!a){toast('⚠️ No se pudo abrir la puerta: revisa tu conexión',3500);return}
  const ret={x:P.x,y:Math.max(P.y,(mn()[1]+1.6)*T)};
  if(kzBegin(ret,'nec.G','street')){if(!P.mjvn){P.mjvn=1;toast('🏰 El Castillo Maldito · cuatro pisos. Aquí rondan los condenados… y en lo más hondo, el Señor de los Espejos.',7000)}}})};
NEC.leave=function(){if(!KZ.on||modal)return;INT.keep=0;intExit()};
/* ═════════ botones de contexto ═════════ */
const cxel=$('ctx'),mkb=(id,fn)=>{const b=document.createElement('button');b.id=id;b.hidden=true;b.onclick=fn;if(cxel)cxel.appendChild(b);return b};
const bEnt=mkb('mjentn',()=>NEC.enter()),bAlt=mkb('mjaltn',()=>{if(MJ.openDiary)MJ.openDiary('nec',1)});
const altarPos=()=>{const a=N.ALTAR;return[INT.ox+a[0]*2,INT.oy+a[1]*2]};
NEC.nearAltar=function(){if(!inInt()||KZ.sc.lv!=='S')return false;const a=altarPos();return Math.hypot(P.x-a[0],(P.y-a[1])*.9)<170};
function ctxTick(){try{const hide=typeof modal!=='undefined'&&modal;let e=!hide&&ST.ready&&nearDoor(),a=!hide&&NEC.nearAltar()&&!(window.MJA&&MJA.on);
 bEnt.hidden=!e;if(e)bEnt.textContent='🏰 Entrar al Castillo Maldito';bAlt.hidden=!a;if(a)bAlt.textContent='🕯️ Altar de la ofrenda'}catch(x){}}
setInterval(ctxTick,180);
/* ═════════ pisos: criaturas y reglas ═════════ */
const MOBS={G:{ti:18,n:12,lv:[60,64],p:[['mjGua',5],['skelB',3],['zombP',3],['cwarden',2]]},'1':{ti:19,n:12,lv:[63,67],p:[['mjGua',3],['ghostR',3],['reapB',2],['vampL',2],['skelK',2],['cwardenR',1]]},'2':{ti:20,n:11,lv:[66,70],p:[['vampH',3],['reapB',2],['batV',3],['skelR',3],['mjGua',2],['devil',1]]}};   /* lv: nivel que se muestra (los monstruos del territorio son de 60 a 70; el jefe, 75) */
function clearMobs(){for(let i=E.length-1;i>=0;i--)if(E[i].mjn)E.splice(i,1)}
function spawn(lv){clearMobs();const S=KZ.sc,cfg=MOBS[lv];if(!cfg||!S)return;const R=rng(S.id.charCodeAt(4)*173+11),fl=[];
 for(let y=1;y<S.h-1;y++)for(let x=1;x<S.w-1;x++)if(S.g[y][x]=='.'&&S.g[y][x-1]=='.'&&S.g[y][x+1]=='.'&&S.g[y-1][x]=='.'&&S.g[y+1][x]=='.')fl.push([x,y]);
 const keep=[],near=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),avoid=[];for(const k in S.ar)avoid.push(S.ar[k]);
 for(const q of kzStairs(S))avoid.push([(q.x0+q.x1)/2,(q.y0+q.y1)/2]);const ex=kzExitCells(S);if(ex)avoid.push([(ex.x0+ex.x1)/2,(ex.y0+ex.y1)/2]);
 const list=[];for(const[k,c]of cfg.p)for(let i=0;i<c;i++)list.push(k);
 let nvi=0;for(const k of list){let c=null;for(let t=0;t<80;t++){const q=fl[(R()*fl.length)|0];if(!q)break;if(avoid.some(a=>near(a,q)<7))continue;if(keep.some(a=>near(a,q)<4))continue;c=q;break}if(!c)continue;keep.push(c);
  const tx=INT.ox/T+c[0],ty=INT.oy/T+c[1],e={dg:DG.f,chase:420,lz:620,mjn:1};placeE(e,tx,ty,cfg.ti);try{applyVar(e,k)}catch(x){}if(k==='mjGua'&&!e.nm)e.nm='Guardián maldito';e.hx=tx*T+16;e.hy=ty*T+16;e.x=e.hx;e.y=e.hy;e.sp*=.9;{const a=cfg.lv[0],b=cfg.lv[1];e.nv=a+((nvi++*3)%(b-a+1))}E.push(e)}
 try{EAn=-1}catch(x){}}
NEC.onScene=function(sid){try{if(!/^nec\./.test(sid)){clearMobs();return}const lv=sid.slice(4);clearMobs();if(lv!=='S')spawn(lv)}catch(e){try{console.error('MJNEC.scene',e)}catch(x){}}};
NEC.after=function(){clearMobs()};
NEC.busy=function(){const s=ST.b&&ST.b.nec;return!!(s&&s.st&&s.st!=='AVAILABLE')&&!(window.MJA&&MJA.on)};
NEC.canGo=function(sid,from){
 /* durante la pelea la escalera del Salón está sellada: no se sube hasta que acabe (o hasta salir con 🚪) */
 if(from==='S'&&window.MJA&&MJA.on&&!MJA.done&&!MJA.quit&&!MJA.fell){toast('⛓️ La escalera está sellada por una barrera de sombras…',3200);return false}
 /* el Salón NO se cierra con la arena ocupada: ahí se pide turno y quien llega tarde debe poder ponerse en la cola (la pelea es virtual: cada peleador la ve en su pantalla) */
 if(sid==='nec.S'){const warn=()=>{try{if(KZ.on&&KZ.sc&&KZ.sc.id==='nec.S'&&NEC.busy()&&!(ST.b.nec.turn||ST.b.nec.fight))toast('🕯️ El Necromancer está peleando con otro grupo. Pide turno en el altar y espera tu lugar en la cola.',4600)}catch(e){}};
  try{Promise.resolve(MJ.load&&MJ.load(1)).then(()=>setTimeout(warn,700))}catch(e){}}
 return true};
/* ═════════ el Salón de los Espejos: círculo, trono, el Necromancer dormido y los espejos ═════════ */
const GL=(gx,gy)=>({x:INT.ox+gx*2,y:INT.oy+gy*2});
/* un espejo: el cristal (en el suelo, bajo las criaturas). st = {m:modo, p:progreso, ...}; modos: idle · sig (se va a usar) · out (de él sale el jefe) · cool (recuperación) · brk (se rompe) · dead */
NEC.mirror=function(k,cx,cy,now,st){const mm=N.MIR[k],o=GL(mm[0],mm[1]),x=Math.round(o.x-cx),y=Math.round(o.y-cy);if(x<-120||x>VW+120||y<-60||y>VH+280)return;
 const m=(st&&st.m)||'idle',p=(st&&st.p)||0,t=now+k*1.7;
 g.save();N.glass(g,x,y,2);g.clip();
 if(m==='dead'){g.fillStyle='#04020a';g.fillRect(x-40,y-180,80,180);g.strokeStyle='rgba(190,160,255,.3)';g.lineWidth=2;g.beginPath();for(let i=0;i<9;i++){const a=i/9*6.283,ry=y-92+Math.sin(a*2)*6;g.moveTo(x+Math.cos(a)*30,ry+Math.sin(a)*60);g.lineTo(x+Math.cos(a+.2)*(8+((k+i)%3)*8),ry+Math.sin(a+.2)*(14+((k+i)%2)*16))}g.stroke();
  g.fillStyle='rgba(215,200,255,.5)';for(let i=0;i<7;i++){const a=i*.9+k;g.beginPath();g.moveTo(x+Math.cos(a)*(18),y-40-i*14);g.lineTo(x+Math.cos(a)*(18)+9,y-40-i*14+3);g.lineTo(x+Math.cos(a)*(18)+3,y-40-i*14+13);g.closePath();g.fill()}}
 else{
  /* remolino base: reflejos que se deslizan */
  g.globalCompositeOperation='lighter';const sw=(now*18+k*40)%120-30;g.fillStyle='rgba(190,160,255,.10)';g.beginPath();g.moveTo(x+sw-60,y-170);g.lineTo(x+sw-40,y-170);g.lineTo(x+sw-80,y-20);g.lineTo(x+sw-100,y-20);g.closePath();g.fill();
  const base=m==='cool'?.05:m==='dorm'?.02:m==='idle'?.12:m==='wake'?.34:.3,col=m==='sig'||m==='brk'?(m==='brk'?'255,90,110':'110,255,175'):m==='out'?'200,150,255':m==='wake'?'225,205,255':'150,110,255';
  const gr=g.createRadialGradient(x,y-92,4,x,y-92,70);const a=base+(m==='sig'?.28*(.5+.5*Math.sin(now*14)):m==='out'?.45*(1-p):m==='brk'?.35*(.5+.5*Math.sin(now*22)):m==='wake'?.45*Math.sin(Math.min(1,p)*3.14):.04*Math.sin(t*1.5));gr.addColorStop(0,'rgba('+col+','+Math.max(0,a).toFixed(3)+')');gr.addColorStop(1,'rgba('+col+',0)');g.fillStyle=gr;g.fillRect(x-40,y-180,80,180);
  if(m!=='cool'&&m!=='dorm'){g.strokeStyle='rgba('+col+','+(m==='idle'?.25:.7).toFixed(2)+')';g.lineWidth=2;for(let i=0;i<3;i++){const ph=(now*(m==='idle'?.5:1.6)+i/3)%1;g.beginPath();g.ellipse(x,y-92,10+ph*34,16+ph*60,0,0,7);g.globalAlpha=1-ph;g.stroke();g.globalAlpha=1}}
  if(m==='brk'){g.strokeStyle='rgba(255,120,140,.8)';g.lineWidth=2;const q=.4+.6*p;for(let i=0;i<7;i++){const a2=i*.9+k;g.beginPath();g.moveTo(x,y-92);g.lineTo(x+Math.cos(a2)*36*q,y-92+Math.sin(a2)*70*q);g.stroke()}}}
 g.restore();
 /* aro de aviso en el suelo (delante del espejo) */
 if(m==='sig'||m==='out'||m==='brk'||m==='cool'||m==='wake'){const fx=x,fy=y+34,col=m==='brk'?'255,90,110':m==='sig'?'110,255,175':m==='out'?'200,150,255':m==='wake'?'225,205,255':'120,150,200';g.save();g.translate(fx,fy);g.scale(1,.4);
  if(m==='cool'){g.strokeStyle='rgba('+col+',.55)';g.lineWidth=5;g.beginPath();g.arc(0,0,44,-1.57,-1.57+6.283*(1-p));g.stroke()}
  else{g.globalCompositeOperation='lighter';g.strokeStyle='rgba('+col+','+(.5+.4*Math.sin(now*10)).toFixed(2)+')';g.lineWidth=4;g.beginPath();g.arc(0,0,46+(m==='out'?p*30:0),0,7);g.stroke();g.fillStyle='rgba('+col+','+(.1+.12*Math.sin(now*10)).toFixed(2)+')';g.fill()}
  g.restore()}};
function drawInt(cx,cy,now){const S=KZ.sc;if(!S||S.lv!=='S')return;const fight=!!(window.MJA&&MJA.on),oy=INT.oy-cy,ox=INT.ox-cx;
 /* círculo ritual central: brilla, y más cuando hay combate */
 g.save();g.globalCompositeOperation='lighter';{const f=.6+.4*Math.sin(now*1.4),a=fight?.55:.26,rc=N.RING,x=ox+rc[0]*2,y=oy+rc[1]*2,r=150;g.save();g.translate(x,y);g.scale(1,.62);
  const gr=g.createRadialGradient(0,0,6,0,0,r);gr.addColorStop(0,'rgba(150,100,255,'+(a*.5*f).toFixed(3)+')');gr.addColorStop(.7,'rgba(90,255,170,'+(a*.22).toFixed(3)+')');gr.addColorStop(1,'rgba(90,255,170,0)');g.fillStyle=gr;g.beginPath();g.arc(0,0,r,0,7);g.fill();
  g.rotate(now*.22);g.strokeStyle='rgba(150,255,200,'+(a*1.4*f).toFixed(3)+')';g.lineWidth=2.4;for(let i=0;i<7;i++){g.beginPath();g.arc(0,0,r*.84,i*.8976+.1,i*.8976+.55);g.stroke()}
  g.rotate(-now*.5);g.strokeStyle='rgba(190,140,255,'+(a*1.2*f).toFixed(3)+')';for(let i=0;i<5;i++){g.beginPath();g.arc(0,0,r*.58,i*1.2566,i*1.2566+.7);g.stroke()}g.restore()}g.restore();
 /* tormenta en los ventanales del muro norte: de vez en cuando se encienden con un relámpago */
 {const pn=performance.now(),lt=pn-LG.t,fl=LG.t&&lt<520?(lt<70?lt/70:lt<130?1-(lt-70)/120:lt<200?.15+(lt-130)/70*.7:Math.max(0,.85*(1-(lt-200)/320))):0;if(fl>.02){g.save();g.globalCompositeOperation='lighter';for(const wx of[76,200,328,452]){const x=ox+wx*2,y=oy+(12+2)*2;const gr=g.createRadialGradient(x,y+36,2,x,y+36,60);gr.addColorStop(0,'rgba(200,180,255,'+(.55*fl).toFixed(3)+')');gr.addColorStop(1,'rgba(200,180,255,0)');g.fillStyle=gr;g.fillRect(x-60,y-30,120,140)}g.restore()}}
 /* el trono: halo verde, y el Necromancer dormido sobre él mientras no hay pelea */
 {const t=N.THRONE,tx=ox+t[0]*2,ty=oy+t[1]*2;g.save();g.globalCompositeOperation='lighter';const q=g.createRadialGradient(tx,ty-70,3,tx,ty-70,130);q.addColorStop(0,'rgba(100,255,170,'+(.2+.05*Math.sin(now*1.2)).toFixed(3)+')');q.addColorStop(1,'rgba(100,255,170,0)');g.fillStyle=q;g.fillRect(tx-130,ty-200,260,230);g.restore();
  if(!fight){const F=MJ.FAMS&&MJ.FAMS[4];if(F&&F.cv){const sc=1.15,w=F.fw*sc,h=F.fh*sc,bob=Math.sin(now*1.2)*3;g.save();g.globalAlpha=.9;g.imageSmoothingEnabled=true;g.drawImage(F.cv,F.fw,0,F.fw,F.fh,Math.round(tx-w/2),Math.round(ty-h-14+bob),w,h);g.restore()}}}
 /* espejos (en pelea, mjc9.js les da su estado) */
 const stf=window.MJNF&&MJNF.mstate;for(let k=0;k<4;k++)NEC.mirror(k,cx,cy,now,stf?stf(k):null);
 /* durante el combate la escalera queda sellada con una barrera de sombras */
 if(fight){const st=kzStairs(S)[0];if(st){const sx=ox+st.x0*32-8,sy=oy+st.y0*32,w=(st.x1-st.x0+1)*32+16,h=(st.y1-st.y0+1)*32;g.save();g.fillStyle='rgba(10,4,24,.64)';g.fillRect(sx,sy,w,h);g.strokeStyle='rgba(150,255,205,'+(.5+.3*Math.sin(now*4)).toFixed(2)+')';g.lineWidth=3;g.beginPath();g.moveTo(sx,sy+6);g.lineTo(sx+w,sy+h-6);g.moveTo(sx+w,sy+6);g.lineTo(sx,sy+h-6);g.stroke();g.restore()}}}
/* ═════════ presencia y sala del combate (la usa mjc5.js) ═════════ */
NEC.hall=()=>{if(!inInt()||KZ.sc.lv!=='S')return null;return[INT.ox/T+N.FX,INT.oy/T+N.FY,N.FW,N.FH]};         /* [x,y,ancho,alto] en casillas del mundo */
NEC.cols=N.COLS.map(c=>[c[0]*2-N.FX*32,c[1]*2-N.FY*32]);                                                      /* pilares en px locales del marco de la pelea */
NEC.mir=N.MIR.map(c=>[c[0]*2-N.FX*32,c[1]*2-N.FY*32]);                                                         /* base de cada espejo en px locales del marco */
NEC.spawns=[[16,17],[17,17],[15,17],[18,17],[14,17],[19,17],[16,16],[17,16]];                                  /* casillas de aparición (nivel) */
NEC.toHall=function(i,cb){ensureArt(a=>{if(!a){if(cb)cb(false);return}
  const go=()=>{const sp=NEC.spawns[(i|0)%NEC.spawns.length];P.x=INT.ox+(sp[0]+.5)*T;P.y=INT.oy+(sp[1]+.5)*T;P.dir='up';try{MD.x=P.x;MD.y=P.y+20;PD.x=P.x;PD.y=P.y+20}catch(e){}try{LCX=-1;NT=0}catch(e){}if(cb)cb(true)};
  if(inInt()){if(KZ.sc.lv==='S'){go();return}kzScene('nec.S','R');go();return}
  if(KZ.on||INT.on||DG.f){if(cb)cb(false);return}
  const ret={x:P.x,y:Math.max(P.y,(mn()[1]+1.6)*T)};if(kzBegin(ret,'nec.S','R'))go();else if(cb)cb(false)})};
NEC.afterFight=function(){try{if(inInt()&&KZ.sc.lv==='S')kzScene('nec.G','R')}catch(e){}};
NEC.hallSet=function(){};
NEC.inside=()=>{try{return inInt()}catch(e){return false}};
MAN.reg.nec=NEC;
})();
/* ═══════════ v434/v435 · MINI-JEFES (cliente) · parte 5: LA PELEA CONTRA LA BANSHEE ═══════════
   El SERVIDOR decide quién entra, la vida del jefe (compartida), la fase 2, quién cae, la victoria y el premio. Este archivo es lo que se ve y se juega:
   · el reloj del servidor (todos cuentan los turnos desde el mismo t0) y el guion de la Banshee, calculado con la semilla del encuentro → todos ven lo mismo,
   · sus 5 habilidades (Chillido del Lamento, Ecos Fantasmales, Paso entre Sombras, Danza del Vendaval, Último Lamento) con avisos en el suelo.
     v435: el «grito en cono» desaparece. Ahora la Banshee CHILLA (un sonido molesto que sube y se desgarra) y suelta una ONDA DE CHOQUE circular: los pilares de mármol
     del sótano la frenan y detrás de cada uno queda una sombra segura, que el aviso dibuja en azul antes de soltarla,
   · la sala de la pelea es el SÓTANO de la mansión (un interior a pantalla completa: mjc4.js la entrega con MJMAN.hall()),
   · el daño que recibes tú (se calcula aquí, como el de cualquier jefe del juego) y el que haces (se manda al servidor en lotes),
   · barra del jefe, cola y turno, caídos, resultado y salida. */
(function(){
'use strict';
const MJ=window.MJC,MAN=window.MJMAN;if(!MJ||!MJ.ST||!MAN||typeof E==='undefined')return;
const ST=MJ.ST,$=id=>document.getElementById(id),hx=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* ── tiempos y reparto (el servidor usa los mismos st1 y p2) ── */
const ST1=5200,ST2=3600,BOSSES=['ban','nec','rap'];
const FX0=96,FX1=736,FY0=150,FY1=470;                                /* por dónde flota la Banshee (px locales del salón) */
const STN=[[416,196],[246,214],[586,214],[190,318],[642,318],[416,306],[330,432],[502,432],[416,422]];
/* ── estado ── */
const A=window.MJA={b:'ban',mir:[],fol:[],on:0,done:0,fell:0,quit:0,id:null,tok:null,seed:0,t0:0,skew:0,sk:[],hp:1,mhp:1,p2:0,ph2:0,mem:[],fl:[],al:1,boss:null,ill:[],hz:[],acc:0,ls:0,tr:null,res:null,exitAt:0,iv:0,lv:45,inv:0,dying:0,lastHud:'',Q:null};
/* v436: el motor es «por jefe». Cada jefe aporta un perfil (PFS.ban aquí, PFS.nec en mjc9.js): textos, tiempos, guion de cada turno, sonidos, peligros propios y dibujo. A.b = jefe del combate actual. */
const PFS={},PF=()=>PFS[A.b]||PFS.ban,PFof=b=>PFS[b]||PFS.ban;A.PF=PFS;
const sn=()=>Date.now()+A.skew;
function noteTs(ts){if(!(ts>0))return;A.sk.push(ts-Date.now());if(A.sk.length>10)A.sk.shift();A.skew=Math.max.apply(null,A.sk)}
/* hash determinista [0,1) */
const hh=(a,b,c)=>{let x=(a|0)^Math.imul(b|0,0x9E3779B1)^Math.imul((c|0)+0x7F4A7C15,0x85EBCA6B);x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return(x>>>0)/4294967296};
const ez=x=>x<=0?0:x>=1?1:x*x*(3-2*x),cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const arena=()=>{try{return MAN.hall()}catch(e){return null}};                  /* v435: [x,y,ancho,alto] en casillas del mundo, solo mientras estás dentro del sótano */
const AXY=()=>{const a=arena();return a?[a[0]*T,a[1]*T]:[0,0]};
const inAr=(x,y)=>{const a=arena();return!!a&&x>=a[0]*T&&x<(a[0]+a[2])*T&&y>=a[1]*T&&y<(a[1]+a[3])*T};
/* ── sonidos (sintetizados; respetan el interruptor de sonido del juego) ── */
let NB=null;
const noise=c=>{if(NB&&NB.sampleRate===c.sampleRate)return NB;const n=c.sampleRate,b=c.createBuffer(1,n,n),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return NB=b};
function snd(k,vol,dur,pan){try{const c=typeof sfxC=='function'?sfxC():null;if(!c)return;const t=c.currentTime,out=(typeof AU!='undefined'&&AU.sg)||c.destination,v=vol==null?1:vol;{const X=PF().snd;if(X&&X(c,t,out,k,v,dur,pan))return}if(k==='scream')k='screech';
 const env=(g,a,pk,dec)=>{g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,pk*v),t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec)};
 if(k==='screech'){
  /* CHILLIDO (v435): a propósito molesto. Cuatro voces desafinadas (segunda menor y tritono, que chocan entre sí), un vibrato que se acelera, un barrido que sube y se desgarra,
     distorsión dura, dos formantes de «garganta» y aire áspero. Sube de volumen hasta soltar la onda: lo oyes venir. */
  const D=dur||1.5,g=c.createGain(),ws=c.createWaveShaper(),f1=c.createBiquadFilter(),f2=c.createBiquadFilter(),sum=c.createGain(),a=D*.72,dc=D*.42;
  const cv=new Float32Array(512);for(let i=0;i<512;i++){const x=i/256-1;cv[i]=Math.tanh(3.8*x)+.16*Math.sin(11*x)}ws.curve=cv;
  f1.type='bandpass';f1.frequency.value=950;f1.Q.value=2.1;f2.type='bandpass';f2.frequency.value=3000;f2.Q.value=3.2;
  env(g,a,.2,dc);const end=t+a+dc+.05;
  for(const[m,det,ty,vg]of[[1,0,'sawtooth',1],[1.0595,7,'sawtooth',.8],[1.4142,-9,'square',.45],[2.01,13,'sawtooth',.3]]){
   const o=c.createOscillator();o.type=ty;o.detune.value=det;o.frequency.setValueAtTime(560*m,t);o.frequency.exponentialRampToValueAtTime(2350*m*.92,t+a);o.frequency.exponentialRampToValueAtTime(1350*m,end);
   const l=c.createOscillator(),lg=c.createGain();l.frequency.setValueAtTime(5.4,t);l.frequency.linearRampToValueAtTime(12.5,t+a);lg.gain.value=64*m;l.connect(lg);lg.connect(o.frequency);l.start(t);l.stop(end);
   const q=c.createGain();q.gain.value=vg;o.connect(q);q.connect(sum);o.start(t);o.stop(end)}
  sum.connect(ws);ws.connect(f1);ws.connect(f2);f1.connect(g);f2.connect(g);g.connect(out);
  const n=c.createBufferSource();n.buffer=noise(c);n.loop=true;const nf=c.createBiquadFilter();nf.type='highpass';nf.frequency.value=3100;const ng=c.createGain();ng.gain.setValueAtTime(.0001,t);ng.gain.exponentialRampToValueAtTime(.15*v,t+a);ng.gain.exponentialRampToValueAtTime(.0001,end);n.connect(nf);nf.connect(ng);ng.connect(out);n.start(t);n.stop(end+.05)}
 else if(k==='blast'){
  /* IMPACTO de la onda: golpe grave, chasquido de aire que se apaga y un zumbido agudo de oídos que tarda en irse (niveles medidos con la cadena maestra del juego: pico < 1, sin saturar) */
  const th=c.createOscillator(),tg=c.createGain();th.type='sine';th.frequency.setValueAtTime(135,t);th.frequency.exponentialRampToValueAtTime(30,t+.8);env(tg,.01,.8,.8);th.connect(tg);tg.connect(out);th.start(t);th.stop(t+.95);
  const n=c.createBufferSource();n.buffer=noise(c);const nf=c.createBiquadFilter();nf.type='lowpass';nf.frequency.setValueAtTime(7200,t);nf.frequency.exponentialRampToValueAtTime(240,t+.55);const ng=c.createGain();ng.gain.setValueAtTime(.0001,t);ng.gain.exponentialRampToValueAtTime(.44*v,t+.012);ng.gain.exponentialRampToValueAtTime(.0001,t+.62);n.connect(nf);nf.connect(ng);ng.connect(out);n.start(t);n.stop(t+.7);
  const ti=c.createOscillator(),tgi=c.createGain();ti.type='sine';ti.frequency.value=3300;tgi.gain.setValueAtTime(.0001,t);tgi.gain.setValueAtTime(.0001,t+.08);tgi.gain.exponentialRampToValueAtTime(.05*v,t+.3);tgi.gain.exponentialRampToValueAtTime(.0001,t+1.7);ti.connect(tgi);tgi.connect(out);ti.start(t);ti.stop(t+1.8)}
 else if(k==='bell'){for(const[f,m]of[[392,1],[588,.5],[1176,.3],[1568,.16]]){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f;env(g,.01,.22*m,2.2);o.connect(g);g.connect(out);o.start(t);o.stop(t+2.4)}}
 else if(k==='whoosh'||k==='wind'){const n=c.createBufferSource();n.buffer=noise(c);n.loop=true;const f=c.createBiquadFilter();f.type='bandpass';f.Q.value=k==='wind'?1.2:3;const g=c.createGain(),d=k==='wind'?3.4:.7;
   f.frequency.setValueAtTime(k==='wind'?420:260,t);f.frequency.exponentialRampToValueAtTime(k==='wind'?900:2600,t+d*.5);f.frequency.exponentialRampToValueAtTime(k==='wind'?500:380,t+d);
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime((k==='wind'?.2:.3)*v,t+d*.3);g.gain.exponentialRampToValueAtTime(.0001,t+d);n.connect(f);f.connect(g);g.connect(out);n.start(t);n.stop(t+d+.1)}
 else if(k==='orb'){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(900,t);o.frequency.exponentialRampToValueAtTime(260,t+.35);env(g,.01,.22,.4);o.connect(g);g.connect(out);o.start(t);o.stop(t+.5)}
 else if(k==='pulse'){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(34,t+.9);env(g,.01,.7,.9);o.connect(g);g.connect(out);o.start(t);o.stop(t+1)}
 else if(k==='pop'){const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(1400,t);o.frequency.exponentialRampToValueAtTime(300,t+.2);env(g,.005,.2,.22);o.connect(g);g.connect(out);o.start(t);o.stop(t+.3)}
 }catch(e){}}
/* ── partículas espectrales (mundo) ── */
const PT=[];
function pt(x,y,vx,vy,l,c,s){if(PT.length<260)PT.push({x,y,vx,vy,l,t:l,c,s:s||2})}
function ptStep(dt,cx,cy){g.save();g.globalCompositeOperation='lighter';
 for(let i=PT.length-1;i>=0;i--){const q=PT[i];q.t-=dt;if(q.t<=0){PT.splice(i,1);continue}q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.985;q.vy*=.985;const a=Math.min(1,q.t/q.l*1.6);
  const sx=q.x-cx,sy=q.y-cy;if(sx<-10||sx>VW+10||sy<-10||sy>VH+10)continue;g.fillStyle='rgba('+q.c+','+(a*.85).toFixed(2)+')';g.fillRect(Math.round(sx),Math.round(sy),q.s,q.s)}g.restore()}
/* ═════════ entidades: la Banshee y sus imágenes viven en la lista de criaturas del juego ═════════ */
let sidn=7000;
function mkEnt(o){const p=PF();return Object.assign({ubs:1,mjb:1,x:-99999,y:-99999,hx:0,hy:0,ty:8,mx:1,hp:1,sp:0,dm:1,df:0,rw:0,nv:A.lv||45,nm:p.nm,dead:0,stun:0,t:0,chase:0,v:p.v,dir:'down',sid:++sidn,_mjs:p.sc,hide:1,al:0},o)}
function addEnts(){if(A.boss&&!E.includes(A.boss)){E.push(A.boss);NR.push(A.boss)}for(const i of A.ill.concat(A.fol))if(!E.includes(i)){E.push(i);NR.push(i)}}
function delEnts(){for(const e of[A.boss].concat(A.ill,A.fol)){if(!e)continue;let i=E.indexOf(e);if(i>=0)E.splice(i,1);i=NR.indexOf(e);if(i>=0)NR.splice(i,1)}A.boss=null;A.ill=[];A.fol=[]}
/* posición (px locales del salón → mundo) */
const W2=(p)=>{const o=AXY();return[o[0]+p[0],o[1]+p[1]]};
function setPos(e,p,al){if(!p){e.x=e.y=-99999;e.hide=1;e.al=0;return}const w=W2(p);e.x=w[0];e.y=w[1];e.al=al==null?1:al;e.hide=e.al<.25?1:0}
/* estación n de la Banshee (aleatoria con la semilla; nunca repite la anterior) */
const SC=[];
function stn(n){if(n<0)n=0;if(SC.length>n&&SC.length&&SC.seed===A.seed)return STN[SC[n]];if(SC.seed!==A.seed){SC.length=0;SC.seed=A.seed}
 while(SC.length<=n){const k=SC.length,prev=k?SC[k-1]:-1;SC.push(k===0?0:(prev+1+Math.floor(hh(A.seed,k,11)*(STN.length-1)))%STN.length)}return STN[SC[n]]}
/* quién es el objetivo de cada ataque: elegido con la semilla entre los que siguen en pie, igual en todos los clientes */
function posOf(nm){if(nm===P.name)return[P.x,P.y];try{const O=window.SRWORLD&&SRWORLD.others&&SRWORLD.others();if(O)for(const id in O){const o=O[id];if(o&&o.nm===nm)return[o.rx!=null?o.rx:o.x,o.ry!=null?o.ry:o.y]}}catch(e){}return null}   /* los demás jugadores: lista oficial del módulo del mundo */
function pickT(n,salt){const L=A.mem.filter(x=>A.fl.indexOf(x)<0),Z=L.length?L:A.mem;if(!Z.length)return P.name;return Z[Math.floor(hh(A.seed,n,salt)*Z.length)%Z.length]}
function tgtLocal(nm){const p=posOf(nm),o=AXY();if(!p)return[416,400];return[cl(p[0]-o[0],40,792),cl(p[1]-o[1],110,500)]}
const cp=p=>[cl(p[0],FX0,FX1),cl(p[1],FY0,FY1)];
function glide(a,b,x,amp){x=cl(x,0,1);const e=ez(x),dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,w=(amp||0)*Math.sin(Math.PI*x)*Math.sin(x*Math.PI*2.4);return cp([a[0]+dx*e-dy/d*w,a[1]+dy*e+dx/d*w])}
const sway=(p,t,k)=>[p[0]+Math.sin(t/520+(k||0))*7,p[1]+Math.sin(t/390+(k||0)*1.7)*5];
/* ═════════ el guion: qué hace la Banshee en cada turno ═════════ */
const NM={grito:'📢 Chillido del Lamento · ¡tras un pilar!',ecos:'👥 Ecos Fantasmales',paso:'🌫️ Paso entre Sombras',vendaval:'🌪️ Danza del Vendaval',ult:'💀 Último Lamento',cA:'💀 Último Lamento · ilusiones que chillan',cB:'💀 Último Lamento · sombra y chillido',cC:'💀 Último Lamento · vendaval y orbes',cD:'💀 Último Lamento · triple chillido',intro:'👻 La Banshee despierta'};
const BAG1=['grito','ecos','paso','vendaval'],BAG2=['cA','cB','cC','cD'];
const bagMemo={};
function bag(list,c,salt){const key=salt+':'+c+':'+A.seed;if(bagMemo[key])return bagMemo[key];
 const o=list.slice();for(let i=o.length-1;i>0;i--){const j=Math.floor(hh(A.seed,c*7+i,salt)*(i+1));const t=o[i];o[i]=o[j];o[j]=t}
 if(c>0){const pv=bag(list,c-1,salt);if(pv[pv.length-1]===o[0]){const t=o[0];o[0]=o[1];o[1]=t}}return bagMemo[key]=o}
function turnAt(t){const p=PF(),s1=p.st1||ST1,s2=p.st2||ST2;
 if(!A.p2||t<A.p2){const n=Math.max(0,Math.floor((t-A.t0)/s1));return{n,ph:1,j:n,s0:A.t0+n*s1,len:s1,mv:p.pick(n,1,n)}}
 const K=Math.round((A.p2-A.t0)/s1),j=Math.max(0,Math.floor((t-A.p2)/s2));
 return{n:K+j,ph:2,j,s0:A.p2+j*s2,len:s2,mv:p.pick(K+j,2,j)}}
/* ── peligros: ondas de choque, círculos, zonas de viento y orbes. Todos con hora absoluta del servidor; el daño se calcula en el cliente de cada jugador sobre SU héroe ── */
const HZ=o=>{const t=sn();o.done=0;if(o.tf&&o.tf<t-200)o.done=1;A.hz.push(o);return o};
const real=()=>A.boss;
/* ONDA DE CHOQUE (v435). Telegrafía (t0→tf): la Banshee carga, un círculo rojo marca hasta dónde llega y, en AZUL, las sombras seguras que dejan los pilares.
   Al soltarla (tf) un anillo sale de ella a v px/s hasta R; golpea una sola vez a quien toca (con un margen de th/2 + 12 px) salvo que un pilar quede entre los dos. */
const PR=21;                                                           /* radio con el que un pilar frena la onda (px) */
const pillars=()=>{const o=AXY();return(MAN.colsOf?MAN.colsOf(A.b):MAN.cols).map(c=>[o[0]+c[0],o[1]+c[1]-6])};
function shadow(x0,y0,p){const dx=p[0]-x0,dy=p[1]-y0,dp=Math.hypot(dx,dy);if(dp<PR+10)return null;return{th:Math.atan2(dy,dx),al:Math.asin(Math.min(.97,(PR+10)/dp)),dp,l1:Math.sqrt(dp*dp-PR*PR)}}
function covered(x0,y0,x,y){const dx=x-x0,dy=y-y0,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
 for(const p of pillars()){const q=shadow(x0,y0,p);if(!q||d<=q.l1)continue;let da=Math.abs(a-q.th);if(da>Math.PI)da=2*Math.PI-da;if(da<=q.al)return true}return false}
function openArcs(x0,y0,r){const TP=Math.PI*2,bl=[];
 for(const p of pillars()){const q=shadow(x0,y0,p);if(!q||r<=q.l1)continue;let a0=q.th-q.al;a0=((a0%TP)+TP)%TP;const a1=a0+2*q.al;if(a1>TP){bl.push([a0,TP]);bl.push([0,a1-TP])}else bl.push([a0,a1])}
 bl.sort((a,b)=>a[0]-b[0]);const out=[];let cur=0;for(const b of bl){if(b[0]>cur)out.push([cur,b[0]]);cur=Math.max(cur,b[1])}if(cur<TP)out.push([cur,TP]);return out}
const waveAt=(e,tf,o)=>HZ(Object.assign({k:'wave',e,t0:tf-1400,tf,te:tf+1900,v:430,R:600,th:30,dmg:24,lock:0,rp:0},o||{}));
function beginTurnB(tr){const n=tr.n,p0=stn(n),p1=stn(n+1),ti=pickT(n,1),tp=tgtLocal(ti),B0=real(),s=tr.s0,P2=tr.ph===2;
 tr.p0=p0;tr.p1=p1;tr.ti=ti;tr.imgs=null;tr.inv=null;A.hz=A.hz.filter(h=>h.te>sn()-300);
 const ring=(x,y,R,t0,t1,c)=>HZ({k:'ring',x,y,R,t0,te:t1,tf:0,c});
 const real0=Math.floor(hh(A.seed,n,3)*3),a0=hh(A.seed,n,4)*6.283,ce=[416+(hh(A.seed,n,6)-.5)*80,300+(hh(A.seed,n,8)-.5)*50],RR=P2?140:150;
 const spot=k=>cp([ce[0]+Math.cos(a0+k*2.0944)*RR,ce[1]+Math.sin(a0+k*2.0944)*RR*.72]);
 tr.spot=spot;tr.real0=real0;
 switch(tr.mv){
 case'intro':{tr.pose=u=>({p:sway(p0,u,0),al:cl(u/900,0,1)});
  HZ({k:'ring',x:p0[0],y:p0[1]+24,R:300,t0:s+300,te:s+1500,tf:0,c:'255,120,150'});tr.snd=[[300,'bell'],[500,'screech',1,.9]];break}
 case'grito':{const c0=cp([416+(hh(A.seed,n,6)-.5)*70,296+(hh(A.seed,n,8)-.5)*30]);tr.c0=c0;
  tr.pose=u=>u<900?{p:glide(p0,c0,u/900,50)}:u<2750?{p:sway(c0,u,1),ch:u>=1000?1:0}:u<4550?{p:glide(c0,p1,(u-2750)/1800,60)}:{p:sway(p1,u,2)};
  waveAt(B0,s+2500,{t0:s+1000,big:1,dmg:26});tr.snd=[[1000,'screech',1,1.5],[2500,'blast']];tr.shake=[[2500,9]];break}
 case'ecos':{
  tr.pose=u=>{const pr=spot(real0);return u<500?{p:glide(p0,pr,u/500,30)}:u<3300?{p:sway(pr,u,3)}:u<4500?{p:glide(pr,p1,(u-3300)/1200,50)}:{p:sway(p1,u,2)}};
  tr.imgs=(u,i)=>{const k=(real0+1+i)%3,pr=spot(k);return u<300?null:u<900?{p:glide(p0,pr,(u-300)/600,0),al:(u-300)/600*.85}:u<3300?{p:sway(pr,u,4+i),al:.85}:u<3600?{p:pr,al:.85*(1-(u-3300)/300)}:null};
  [0,1,2].forEach(k=>{const sp=spot(k),isR=k===real0,t2=pickT(n,20+k);
   HZ({k:'orbc',x:sp[0],y:sp[1],t0:s+1600,te:s+2400,tf:s+2400,real:isR});
   HZ({k:'orb',sp,real:isR,t0:s+2400,tf:s+2400,te:s+4100,ti:t2,dmg:20,v:300,r:17,vx:0,vy:0,ox:0,oy:0,arm:0})});
  ring(p0[0],p0[1]+24,150,s+80,s+620,'200,230,255');tr.snd=[[250,'whoosh'],[2400,'orb']];break}
 case'paso':{
  tr.pose=u=>u<700?{p:sway(p0,u,0),al:1-u/700,inv:u>450}:u<1700?{p:null,inv:1}:{p:sway(p1,u,2),al:cl((u-1700)/260,0,1)};
  HZ({k:'vort',x:p1[0],y:p1[1]+24,R:70,t0:s+150,te:s+1750});
  HZ({k:'circ',x:p1[0],y:p1[1]+24,R:125,t0:s+1500,tf:s+1700,te:s+2300,dmg:14,fix:1});
  tr.snd=[[100,'whoosh'],[1700,'pulse']];tr.burst=[[0,p0],[1700,p1]];break}
 case'vendaval':{const pw=cp([p0[0]+(416-p0[0])*.45,p0[1]+(300-p0[1])*.45]);tr.pw=pw;
  tr.pose=u=>u<700?{p:glide(p0,pw,u/700,40)}:u<4300?{p:glide(pw,p1,(u-700)/3600,45)}:{p:sway(p1,u,2)};
  HZ({k:'zone',e:B0,t0:s+500,ta:s+1000,te:s+4200,R:110,dmg:6,tick:450,next:s+1000,wd:1});tr.snd=[[500,'wind']];break}
 case'ult':{const c0=[416,290];
  tr.pose=u=>u<900?{p:glide(p0,c0,u/900,40)}:{p:sway(c0,u,5),ch:u<2300?2:0};
  ring(c0[0],c0[1]+24,330,s+250,s+1100,'255,60,90');
  HZ({k:'circ',x:c0[0],y:c0[1]+24,R:215,t0:s+1100,tf:s+2200,te:s+2900,dmg:12,fix:1,big:1});tr.snd=[[250,'bell'],[1100,'screech',1,1.1],[2200,'pulse']];tr.shake=[[1100,6],[2200,10]];break}
 case'cA':{
  tr.pose=u=>{const pr=spot(real0);return u<500?{p:glide(p0,pr,u/500,30)}:u<2900?{p:sway(pr,u,3),ch:u>=1000&&u<2700?1:0}:u<3400?{p:glide(pr,p1,(u-2900)/500,0)}:{p:sway(p1,u,2)}};
  tr.imgs=(u,i)=>{const k=(real0+1+i)%3,pr=spot(k);return u<200?null:u<700?{p:glide(p0,pr,(u-200)/500,0),al:(u-200)/500*.85}:u<2900?{p:sway(pr,u,4+i),al:.85}:u<3200?{p:pr,al:.85*(1-(u-2900)/300)}:null};
  [0,1,2].forEach(k=>{const sp=spot(k);HZ({k:'wave',x:sp[0],y:sp[1]+24,t0:s+700+k*450,tf:s+1700+k*450,te:s+3500+k*450,v:400,R:360,th:26,dmg:11,lock:0,rp:0})});
  ring(p0[0],p0[1]+24,150,s+60,s+520,'200,230,255');tr.snd=[[200,'whoosh'],[700,'screech',.9,1.0],[1700,'blast',.8],[2150,'blast',.8],[2600,'blast',.8]];tr.shake=[[1700,5],[2150,5],[2600,5]];break}
 case'cB':{
  tr.pose=u=>u<500?{p:sway(p0,u,0),al:1-u/500,inv:u>350}:u<1100?{p:null,inv:1}:{p:sway(p1,u,2),al:cl((u-1100)/220,0,1),ch:u>=1300&&u<2150?1:0};
  HZ({k:'vort',x:p1[0],y:p1[1]+24,R:70,t0:s+100,te:s+1150});
  HZ({k:'circ',x:p1[0],y:p1[1]+24,R:120,t0:s+950,tf:s+1100,te:s+1700,dmg:12,fix:1});
  waveAt(B0,s+2150,{t0:s+1250,dmg:17,R:560});tr.snd=[[60,'whoosh'],[1100,'pulse'],[1250,'screech',.9,.9],[2150,'blast']];tr.shake=[[2150,8]];tr.burst=[[0,p0],[1100,p1]];break}
 case'cC':{const pw=cp([p0[0]+(416-p0[0])*.4,p0[1]+(300-p0[1])*.4]);
  tr.pose=u=>u<600?{p:glide(p0,pw,u/600,30)}:u<3000?{p:glide(pw,p1,(u-600)/2400,40)}:{p:sway(p1,u,2)};
  HZ({k:'zone',e:B0,t0:s+250,ta:s+600,te:s+3000,R:130,dmg:7,tick:380,next:s+600,wd:1});
  [1200,2100].forEach((dt,i)=>{HZ({k:'orbc',e:B0,t0:s+dt-500,te:s+dt,tf:s+dt,real:1});HZ({k:'orb',e:B0,real:1,t0:s+dt,tf:s+dt,te:s+dt+1700,ti:pickT(n,40+i),dmg:14,v:340,r:17,vx:0,vy:0,ox:0,oy:0,arm:0})});
  tr.snd=[[250,'wind'],[1200,'orb'],[2100,'orb']];break}
 case'cD':{const A3=spot(0),B3=spot(1),C3_=spot(2);
  tr.pose=u=>u<450?{p:glide(p0,A3,u/450,40)}:u<1350?{p:sway(A3,u,1),ch:u>=700?1:0}:u<1700?{p:glide(A3,B3,(u-1350)/350,30)}:u<2050?{p:sway(B3,u,2),ch:u>=1750?1:0}:u<2400?{p:glide(B3,C3_,(u-2050)/350,30)}:u<2750?{p:sway(C3_,u,3),ch:u>=2450?1:0}:{p:glide(C3_,p1,(u-2750)/850,30)};
  [1300,2000,2700].forEach((tf,i)=>waveAt(B0,s+tf,{t0:s+tf-620,R:440,dmg:12,th:26,v:420}));
  tr.snd=[[700,'screech',.8,.62],[1300,'blast',.85],[1400,'screech',.8,.62],[2000,'blast',.85],[2100,'screech',.8,.62],[2700,'blast',.85]];tr.shake=[[1300,5],[2000,5],[2700,6]];break}
 default:tr.pose=u=>({p:sway(p0,u,0)})}
 tr.sdone=0;tr.bdone=0;tr.shd=0;return tr}
function beginTurn(tr){const f=PF().begin;return f?f(tr):beginTurnB(tr)}
/* perfil de la Banshee (el comportamiento de v435, sin cambios) */
PFS.ban={id:'ban',nm:'Banshee',v:'mjBan',sc:1.22,spr:'mj3',st1:ST1,st2:ST2,NM,ills:1,
 pick:(n,ph,j)=>ph===1?(n===0?'intro':bag(BAG1,Math.floor((n-1)/4),5)[(n-1)%4]):(j===0?'ult':bag(BAG2,Math.floor((j-1)/4),9)[(j-1)%4]),
 hudNm:'👻 Banshee',ph2:'FASE 2 · ÚLTIMO LAMENTO',dead:'Derrotada',won:'🏆 ¡Banshee derrotada!',lost:'💀 La Banshee ha ganado',exitBtn:'🚪 Salir de la mansión',
 wake:'⚔️ ¡La Banshee despierta!',back:'⚔️ Vuelves a la pelea contra la Banshee',p2txt:'💀 ¡ÚLTIMO LAMENTO! La Banshee se enfurece',
 turn:'🕯️ ¡Es tu turno! Confirma para bajar al sótano de la Mansión Embrujada',vs:'la Banshee',wait:'La Banshee te espera en el sótano de la Mansión Embrujada.',
 noHall:'⚠️ No se pudo preparar el sótano. Abre la mansión y baja por las escaleras de la derecha.',
 hint:(tr,u)=>{if(!A.hint&&tr.mv==='grito'&&u>1100&&u<2400){A.hint=1;try{toast('💡 Escóndete detrás de un pilar: la onda no lo atraviesa. Las sombras seguras se ven en azul.',5200)}catch(e){}}},
 R:{wonH:'🏆 ¡Banshee derrotada!',wonP:'Su lamento por fin se apaga entre las paredes de la mansión.',none:'La Banshee no dejó ningún botín esta vez.',lostH:'💀 La Banshee ha ganado',out:'Saldrás de la mansión en'}};
/* ═════════ motor: reloj, poses, peligros y daño ═════════ */
const canHurt=()=>!!(A.on&&!A.done&&!A.fell&&!A.quit&&P.hp>0&&inAr(P.x,P.y));
function hurt(pct,tick,why){if(!canHurt())return;const t=performance.now();if(t<A.iv)return;A.iv=t+(tick?160:300);
 let dm=P.mhp*pct/100;try{dm*=skDefM({boss:1})}catch(e){}
 const rd=Math.round(dm);
 try{P.hp-=mountAbs(dm*(P.sh>0?.3:1)*(P.cls==1?knRes():1))}catch(e){P.hp-=dm}
 P.hit=.25;try{vib([40,20,40])}catch(e){}try{wear(1);if(Math.random()<.5)wear(2)}catch(e){}
 try{SHK=Math.max(SHK,tick?3:7);sfx(tick?'hurt':'heavy');vf({k:'nova',el:'ice',x:P.x,y:P.y,R:tick?44:62,L:.5,pal:VP[PF().hpal]||VP.ghost,add:0})}catch(e){}
 try{if(FT.length<100)FT.push({x:P.x+Math.random()*10-5,y:P.y-26,t:1,d:0,o:0,k:'dm',s:'-'+rd,c:'#ff6a82'})}catch(e){}
 if(P.hp<=0)die()}
function hzEval(t){
 for(const h of A.hz){
  if(h.k==='wave'){
   if(!h.lock&&!h.done&&t>=h.tf){if(h.e&&h.e.x<-9000){h.done=1;continue}const w=h.e?[h.e.x,h.e.y+24]:W2([h.x,h.y]);h.wx=w[0];h.wy=w[1];h.lock=1;h.rp=0;SHK=Math.max(SHK,h.big?10:6);A.flash=performance.now();try{A.deafAt=performance.now()}catch(e){}}
   if(h.lock&&!h.done){const r=Math.max(0,(t-h.tf)/1000*h.v);if(r>=h.R+h.th){h.done=1;continue}
    if(!h.hit&&canHurt()){const d=Math.hypot(P.x-h.wx,P.y-h.wy),lo=Math.min(h.rp,r)-h.th/2-12,hi=Math.max(h.rp,r)+h.th/2+12;
     if(d>=lo&&d<=hi){if(covered(h.wx,h.wy,P.x,P.y)){h.hit=2;try{if(FT.length<60)FT.push({x:P.x,y:P.y-30,t:.8,d:0,o:0,k:'dm',s:'🛡️ ¡Cubierto!',c:'#bfe0ff'})}catch(x){}}else{h.hit=1;hurt(h.dmg,0);A.deaf=performance.now()+1500}}}
    h.rp=r}}
  else if(h.k==='circ'){if(!h.done&&t>=h.tf){h.done=1;const w=W2([h.x,h.y]);h.wx=w[0];h.wy=w[1];if(h.big){SHK=Math.max(SHK,10)}else SHK=Math.max(SHK,5);if(canHurt()&&Math.hypot(P.x-w[0],P.y-w[1])<=h.R+12)hurt(h.dmg,0)}}
  else if(h.k==='zone'){
   if(t>=h.ta&&t<h.te&&h.e){if(h.next<t-h.tick)h.next=t;while(h.next<=t&&h.next<h.te){h.next+=h.tick;if(canHurt()&&Math.hypot(P.x-h.e.x,P.y-(h.e.y+24))<=h.R+10)hurt(h.dmg,1)}}}
  else if(h.k==='orb'){
   if(!h.arm&&!h.done&&t>=h.tf){const w=h.e?[h.e.x,h.e.y]:W2(h.sp),tp=posOf(h.ti)||[P.x,P.y],dx=tp[0]-w[0],dy=tp[1]-w[1],L=Math.hypot(dx,dy)||1;h.ox=w[0];h.oy=w[1];h.vx=dx/L*h.v;h.vy=dy/L*h.v;h.arm=1;h.hx=w[0];h.hy=w[1]}
   if(h.arm&&!h.done){const el=Math.max(0,(t-h.tf)/1000);h.x=h.ox+h.vx*el;h.y=h.oy+h.vy*el;
    if(t>=h.te||!inAr(h.x,h.y)){h.done=1;h.pop=t}
    else if(!h.gone&&Math.hypot(P.x-h.x,P.y-h.y)<h.r+10){h.done=1;h.pop=t;if(h.real)hurt(h.dmg,0);else try{sfx('hit')}catch(e){}}}}else{const f=PF().eval;if(f)f(h,t)}}
 for(let i=A.hz.length-1;i>=0;i--)if(A.hz[i].te<t-600)A.hz.splice(i,1)}
/* ── un paso del combate (se llama una vez por cuadro desde el dibujo del suelo) ── */
let lastT=0,entChk=0,lastV=0;
A.step=function(now){try{
 if(!A.on)return;const pn=performance.now(),dt=Math.min(.1,Math.max(.001,(pn-(lastT||pn))/1000));lastT=pn;
 const ar=arena();if(!ar){A.outCheck(pn);return}
 if(pn-entChk>800){entChk=pn;if(A.boss)addEnts()}
 const t=sn(),B0=A.boss;if(!B0)return;
 /* fase 2 */
 const ph2=!!(A.p2&&t>=A.p2);if(ph2&&!A.ph2){A.ph2=1;A.onP2()}
 if(A.done){A.afterStep(pn,dt);return}
 const tr0=turnAt(t);if(!A.tr||A.tr.n!==tr0.n||A.tr.ph!==tr0.ph){A.tr=tr0;beginTurn(A.tr);A.mvName=PF().NM[tr0.mv]||'';A.mvAt=pn;try{A.hud(1)}catch(e){}}
 const tr=A.tr,u=t-tr.s0;
 {const f=PF().hint;if(f)f(tr,u)}
 /* sonidos, temblores y estallidos de partículas programados */
 if(tr.snd)for(let i=0;i<tr.snd.length;i++){const s=tr.snd[i];if(s&&u>=s[0]){tr.snd[i]=null;if(u-s[0]<600){snd(s[1],s[2],s[3],s[4]);if(tr.mv==='ult'&&s[1]==='screech')A.flash=pn}}}
 if(tr.shake)for(let i=0;i<tr.shake.length;i++){const s=tr.shake[i];if(s&&u>=s[0]){tr.shake[i]=null;if(u-s[0]<500)SHK=Math.max(SHK,s[1])}}
 if(tr.burst)for(let i=0;i<tr.burst.length;i++){const s=tr.burst[i];if(s&&u>=s[0]){tr.burst[i]=null;if(u-s[0]<500){const w=W2(s[1]);for(let k=0;k<46;k++){const a=Math.random()*6.283,v=30+Math.random()*120;pt(w[0]+Math.cos(a)*10,w[1]+Math.sin(a)*14,Math.cos(a)*v,Math.sin(a)*v-20,.7+Math.random()*.7,Math.random()<.5?(PF().bc||['210,236,255','255,140,170'])[0]:(PF().bc||['210,236,255','255,140,170'])[1],2+(Math.random()*2|0))}}}}
 /* poses */
 const ps=tr.pose(Math.max(0,u))||{};const px0=B0.x,py0=B0.y;
 setPos(B0,ps.p,ps.al==null?1:ps.al);A.invul=!!ps.inv;B0.ch=ps.ch||0;
 for(let i=0;i<2;i++){const q=tr.imgs?tr.imgs(Math.max(0,u),i):null,e=A.ill[i];if(!e)continue;if(q&&!e.pop)setPos(e,q.p,q.al);else{setPos(e,null);if(!q)e.pop=0}}
 for(const e of[B0].concat(A.ill)){if(e.x<-9000){e._vx=e._vy=0;e._px=null;continue}const a=e._px==null?e.x:e._px,b=e._py==null?e.y:e._py;e._vx=(e._vx||0)*.7+(e.x-a)/dt*.3;e._vy=(e._vy||0)*.7+(e.y-b)/dt*.3;e._px=e.x;e._py=e.y;
  const tp=posOf(tr.ti)||[P.x,P.y],ddx=tp[0]-e.x,ddy=tp[1]-e.y;e.dir=Math.abs(ddx)>Math.abs(ddy)*1.15?(ddx>0?'right':'left'):(ddy>0?'down':'up')}
 B0.hp=Math.max(1,A.hp-A.acc-A.snt);B0.mx=A.mhp;
 hzEval(t);{const f=PF().frame;if(f)f(t,dt,pn,tr,u)}
 /* partículas del cuerpo */
 for(const e of PF().nobp?[]:[B0].concat(A.ill)){if(e.x<-9000||e.al<.2)continue;if(Math.random()<dt*(e.ill?14:26)){pt(e.x+(Math.random()-.5)*34,e.y+10+Math.random()*22,(Math.random()-.5)*14,-14-Math.random()*26,.9+Math.random()*.7,e.ill?'170,215,255':(Math.random()<.5?'235,246,255':'255,150,185'),2)}
  const sp=Math.hypot(e._vx||0,e._vy||0);if(sp>150&&Math.random()<dt*40)pt(e.x+(Math.random()-.5)*20,e.y+8+Math.random()*26,-(e._vx||0)*.12,-(e._vy||0)*.12,.5+Math.random()*.4,'210,236,255',2)}
 /* envío del daño al servidor, en lotes */
 A.flush(0);
 if(pn-lastV>110){lastV=pn;try{A.hud(0)}catch(e){}}
 A.exitCheck()}catch(e){if(!A.errAt||performance.now()-A.errAt>5000){A.errAt=performance.now();try{console.error('MJA.step',e)}catch(x){}}}};
/* tras terminar el encuentro: animación de despedida y espera de la salida */
A.afterStep=function(pn,dt){const B0=A.boss;
 if(B0&&A.dying){const p=cl((pn-A.dying)/2600,0,1);B0.al=Math.max(0,1-p);B0.hide=p>.7?1:0;B0.y-=dt*26*(1-p*.6);if(Math.random()<dt*70){const w=[B0.x+(Math.random()-.5)*40,B0.y+Math.random()*30];pt(w[0],w[1],(Math.random()-.5)*40,-30-Math.random()*50,1+Math.random(),Math.random()<.5?'255,255,255':'200,230,255',3)}
  if(p>=1&&!A.gone){A.gone=1;for(const e of A.ill)setPos(e,null);setPos(B0,null)}}
 else if(B0&&A.res&&A.res.lost){B0.y+=Math.sin(pn/260)*.3}
 for(const e of A.ill)setPos(e,null);
 try{A.hud(0)}catch(e){}A.exitCheck()};
A.exitCheck=function(){if(!A.on||!(A.done||A.quit))return;const n=Date.now();if(A.done&&A.exitAt&&n>A.exitAt+2500)A.leave('tiempo');else if(A.quit&&n-(A.doneAt||0)>1500)A.leave('salida')};
/* el combate sigue pero tu héroe no está en el sótano (recargaste la página, saliste por error): vuelve solo (arena virtual: el servidor no puede moverte, lo haces tú) */
A.outCheck=function(pn){if(!A.on)return;if(A.done||A.quit){A.exitCheck();return}if(A.fell||pn-(A.t00||0)<2500||pn-(A.bk||0)<5000)return;A.bk=pn;try{MAN.toHall(A.sp|0,()=>{},A.b)}catch(e){}};
/* ── cámara de la pelea (la llama intCam() del motor de interiores): sigue a tu héroe como siempre; si el sótano no cabe en la pantalla (celular, y a veces la PC)
      se desplaza hacia la Banshee sin que tu héroe se acerque al borde. El zoom «cubre» la pantalla (MJMAN.zoom), así que nunca hay franjas vacías. ── */
let camS=null,camT=0,camB=null;
A.camI=function(def){
 const D=INT.d;if(!A.on||!D||!arena()){camS=null;return def}
 const pn=performance.now(),dt=Math.min(.1,Math.max(.001,(pn-(camT||pn))/1000));camT=pn;
 const vw=INT.vw,vh=INT.vh,rw=D.w*T,rh=D.h*T,b=A.boss;
 if(b&&b.x>-9000&&!b.hide)camB=[b.x,b.y];else if(!camB)camB=[INT.ox+rw/2,INT.oy+rh*.45];
 const one=(p,bp,V,lo,hi)=>{const span=hi-lo;if(V>=span)return lo+span/2-V/2;                 /* cabe: fija y centrada */
  let o=(p*.55+bp*.45)-V/2;const m=Math.min(80,V*.3);o=Math.max(p-V+m,Math.min(p-m,o));        /* tu héroe siempre a ≥ m px del borde */
  return Math.max(lo,Math.min(hi-V,o))};
 const tx=one(P.x,camB[0],vw,INT.ox,INT.ox+rw),ty=one(P.y,camB[1],vh,INT.oy,INT.oy+rh);
 if(!camS)camS=[tx,ty];else{const k=1-Math.exp(-dt*7);camS[0]+=(tx-camS[0])*k;camS[1]+=(ty-camS[1])*k}
 return[Math.round(camS[0]),Math.round(camS[1])]};
/* ═════════ daño que haces al jefe ═════════ */
A.flush=function(force){if(A.acc<1)return;const t=Date.now();if(!force&&t-A.ls<250)return;const d=Math.floor(A.acc);A.acc-=d;A.snt+=d;A.ls=t;try{SRNET.send({t:'wmh',id:A.id,tok:A.tok,d})}catch(e){}};
A.snt=0;
function popIll(e){if(e.pop||e.al<.3)return;e.pop=1;const x=e.x,y=e.y;for(let k=0;k<22;k++){const a=Math.random()*6.283,v=40+Math.random()*100;pt(x,y,Math.cos(a)*v,Math.sin(a)*v-10,.5+Math.random()*.5,'190,225,255',2+(Math.random()*2|0))}snd('pop',.9);e.al=0;e.hide=1;e.x=e.y=-99999;try{FT.push({x:x,y:y-30,t:.9,d:0,o:0,k:'dm',s:'¡Era un eco!',c:'#9fd8ff'})}catch(x2){}}
const _hit=hitE;
hitE=function(e,dm){
 if(e&&e.mjb){
  if(!A.on||A.done||A.fell||A.quit||e.hide||e.al<.3)return;
  if(e.ill){popIll(e);return}if(e.fol){const f=PF().hitFol;if(f)f(e,dm);return}
  if(A.invul){try{if(FT.length<60)FT.push({x:e.x,y:e.y-30,t:.7,d:0,o:0,k:'dm',s:'🛡️',c:'#bfe0ff'})}catch(x){}return}
  try{const cr=critDm(e,dm);dm=cr.dm;critFx(e,dm,cr)}catch(x){}
  if(!(dm>0))return;A.acc+=dm;e._hf=performance.now();A.flush(0);return}
 return _hit.apply(this,arguments)};
/* los jugadores no mueren aquí: «caen» (sin pérdida de experiencia ni objetos) y miran la pelea desde dentro */
const _die=die;
die=function(){if(A.on&&inAr(P.x,P.y)){if(A.done||A.fell||A.quit){P.hp=Math.max(P.hp,1);return}A.fall();return}return _die.apply(this,arguments)};
A.fall=function(){if(!A.on||A.done||A.fell)return;A.fell=1;P.hp=1;P.hit=0;
 try{toast('💀 Has caído. Tu grupo sigue luchando… o puedes salir.',4200);SHK=Math.max(SHK,6)}catch(e){}
 try{SRNET.rpc({t:'x',op:'mb.fall',id:A.id,tok:A.tok})}catch(e){}try{A.hud(1)}catch(e){}};
A.doQuit=async function(){if(!A.on||A.quit)return;try{const r=await SRNET.rpc({t:'x',op:'mb.fall',id:A.id,tok:A.tok,quit:1});if(r&&r.ok){A.fell=1;A.quit=1;A.doneAt=Date.now();setTimeout(()=>{if(A.on&&A.quit)A.leave('salida')},1600)}}catch(e){try{toast(String(e.message||e),3500)}catch(x){}}};
/* ═════════ comienzo, reanudación, mensajes y fin ═════════ */
function reset(){camS=null;camB=null;delEnts();A.hz=[];A.acc=0;A.snt=0;A.ls=0;A.tr=null;A.res=null;A.fell=0;A.quit=0;A.done=0;A.dying=0;A.gone=0;A.ph2=0;A.invul=false;A.fl=[];A.al=1;A.mvName='';A.exitAt=0;A.doneAt=0;A.iv=0;PT.length=0;SC.length=0;for(const k in bagMemo)delete bagMemo[k];lastT=0;lastV=0;A.deaf=0;A.sp=0;A.hint=0;A.mir=[];A.fol=[];{const f=PF().reset;if(f)f()}}
A.begin=function(m,resumed){const nb=PFS[m.b]?m.b:'ban';if(A.b!==nb){delEnts();A.b=nb}reset();const p=PF();
 A.on=1;A.t00=performance.now();A.bk=0;A.sp=m.sp|0;A.id=m.id;A.tok=m.tok;A.seed=m.seed|0;A.t0=m.t0;A.sk=[];A.skew=0;noteTs(m.ts);A.hp=m.hp;A.mhp=m.mhp||m.hp;A.p2=m.p2||0;A.mem=(m.mem||[]).slice();A.lv=m.lv||45;
 A.boss=mkEnt({mx:A.mhp,hp:A.hp});A.ill=p.ills?[mkEnt({ill:1,nm:'Eco'}),mkEnt({ill:1,nm:'Eco'})]:[];if(p.init)try{p.init(m)}catch(e){try{console.error('MJA.init',e)}catch(x){}}addEnts();
 try{LCX=-1;NT=0;for(const q in K)K[q]=0}catch(e){}
 A.Q=null;try{A.q(1)}catch(e){}A.hud(1);
 /* arena virtual: el servidor te dice que empieza y TÚ bajas al sótano (si ya estás en él, te coloca junto al círculo ritual) */
 try{MAN.toHall(A.sp,ok=>{if(!ok)try{toast(p.noHall,5200)}catch(e){}},A.b)}catch(e){}
 if(!resumed){try{toast(p.wake,3200)}catch(e){}}};
A.resume=function(x,b){if(!x||!x.fight||!x.fx||A.on)return;const f=x.fx;
 A.begin({b:b||x.b,id:x.fight,tok:x.tok,seed:f.seed,t0:f.t0,ts:f.ts,hp:f.hp,mhp:f.mhp,mem:f.mem,p2:f.p2,lv:f.lv,mir:f.mir,burn:f.burn},1);   /* v437: al recargar en plena pelea también vuelven los manchones quemados (Velociraptor) */
 if(f.fell){A.fell=1;P.hp=Math.max(1,P.hp)}
 try{toast(PF().back,3000)}catch(e){}};
A.onP2=function(){try{SHK=Math.max(SHK,9);snd('scream');A.flash=performance.now();toast(PF().p2txt,4200)}catch(e){}{const f=PF().p2;if(f)try{f()}catch(e){}}A.hud(1)};
A.over=function(m){if(!A.on||m.id!==A.id||A.done)return;A.done=1;A.res=m;A.hz.length=0;A.doneAt=Date.now();A.exitAt=Date.now()+(m.ex||8000);A.flush(1);A.invul=false;
 if(!m.lost){A.dying=performance.now();snd('bell');setTimeout(()=>snd('scream',.6),300);try{SHK=Math.max(SHK,10)}catch(e){}}else{snd('scream',.8)}
 try{A.result(m)}catch(e){}A.hud(1);try{MJ.load&&setTimeout(()=>MJ.load(1),1200)}catch(e){}};
A.leave=function(why){if(!A.on)return;A.on=0;delEnts();A.hz=[];PT.length=0;try{MAN.afterFight(A.b)}catch(e){}{const f=PF().leave;if(f)try{f()}catch(e){}}
 try{P.hp=Math.max(P.hp,Math.round(P.mhp*.6));P.hit=0}catch(e){}
 try{LCX=-1;NT=0}catch(e){}A.hud(1);A.q(1);try{MJ.load&&MJ.load(1)}catch(e){}};
/* ═════════ dibujo: avisos en el suelo, peligros, partículas y la propia Banshee ═════════ */
const sector=(x,y,R,a0,a1)=>{g.beginPath();g.moveTo(x,y);g.arc(x,y,R,a0,a1);g.closePath()};
let lastG=0;
const wedgePath=(x,y,q,R)=>{const l1=q.l1,a0=q.th-q.al,a1=q.th+q.al;g.moveTo(x+Math.cos(a0)*l1,y+Math.sin(a0)*l1);g.lineTo(x+Math.cos(a0)*R,y+Math.sin(a0)*R);g.arc(x,y,R,a0,a1);g.lineTo(x+Math.cos(a1)*l1,y+Math.sin(a1)*l1);g.closePath()};
function drawHz(h,t,cx,cy,now,pn,dt){{const X=PF().draw;if(X&&X(h,t,cx,cy,now,pn,dt))return}
 if(h.k==='wave'){
  const tele=t<h.tf;let wx,wy;
  if(tele){if(t<h.t0)return;if(h.e){if(h.e.x<-9000)return;wx=h.e.x;wy=h.e.y+24}else{const w=W2([h.x,h.y]);wx=w[0];wy=w[1]}}
  else{if(!h.lock)return;wx=h.wx;wy=h.wy}
  const x=wx-cx,y=wy-cy;if(x<-760||x>VW+760||y<-760||y>VH+760)return;
  if(tele){
   /* aviso: la zona de peligro (rojo) con las sombras seguras de los pilares recortadas (azul), y la carga que se aprieta sobre la Banshee */
   const p=cl((t-h.t0)/(h.tf-h.t0),0,1),R=h.R,sh=[];for(const pl of pillars()){const q=shadow(wx,wy,pl);if(q&&q.l1<R)sh.push(q)}
   g.save();g.beginPath();g.arc(x,y,R,0,7);for(const q of sh)wedgePath(x,y,q,R);g.clip('evenodd');
   const gr=g.createRadialGradient(x,y,6,x,y,R);gr.addColorStop(0,'rgba(255,60,95,'+(.12+.2*p)+')');gr.addColorStop(1,'rgba(255,60,95,'+(.04+.1*p)+')');g.fillStyle=gr;g.fillRect(x-R,y-R,R*2,R*2);g.restore();
   g.save();g.setLineDash([10,8]);g.lineWidth=2;g.strokeStyle='rgba(255,140,160,'+(.45+.4*p)+')';g.beginPath();g.arc(x,y,R,0,7);g.stroke();g.restore();
   for(const q of sh){g.save();g.beginPath();wedgePath(x,y,q,R);g.fillStyle='rgba(90,170,255,'+(.11+.1*p)+')';g.fill();g.setLineDash([7,6]);g.lineWidth=2;g.strokeStyle='rgba(165,218,255,'+(.55+.35*p)+')';g.stroke();g.restore();
    const gx=x+Math.cos(q.th)*(q.dp+46),gy=y+Math.sin(q.th)*(q.dp+46);g.save();g.globalAlpha=.55+.4*p;g.font='15px serif';g.textAlign='center';g.fillText('🛡️',gx,gy+5);g.restore()}
   /* anillos que se aprietan hacia la Banshee (cada vez más rápido) y su núcleo de energía */
   g.save();g.globalCompositeOperation='lighter';
   for(let k=0;k<3;k++){const f=(p*2.2+k*.34)%1,rr=R*(1-f*.9)*(.35+.65*(1-p*.6)),al=(.5*f)*(.4+.6*p);g.lineWidth=2+3*f;g.strokeStyle='rgba(255,150,190,'+al+')';g.beginPath();g.arc(x,y,Math.max(8,rr),0,7);g.stroke()}
   const cr=16+70*p*p+4*Math.sin(pn/45),cg=g.createRadialGradient(x,y,2,x,y,cr);cg.addColorStop(0,'rgba(255,235,245,'+(.5+.4*p)+')');cg.addColorStop(.4,'rgba(255,90,140,'+(.35+.3*p)+')');cg.addColorStop(1,'rgba(255,40,100,0)');g.fillStyle=cg;g.fillRect(x-cr,y-cr,cr*2,cr*2);g.restore();
   if(Math.random()<dt*(20+60*p)){const a=Math.random()*6.283,d0=R*(.25+.35*Math.random());pt(wx+Math.cos(a)*d0,wy+Math.sin(a)*d0,-Math.cos(a)*(120+200*p),-Math.sin(a)*(120+200*p),.35+.2*Math.random(),'255,170,200',2)}}
  else{
   /* la onda: un frente brillante que avanza, se corta detrás de cada pilar y deja una estela */
   const r=Math.max(0,(t-h.tf)/1000*h.v),pg=cl(r/(h.R+h.th),0,1),fd=1-pg*pg*.9;if(r<=0||r>h.R+h.th+40)return;
   const arcs=openArcs(wx,wy,r);
   g.save();g.globalCompositeOperation='lighter';g.lineCap='butt';
   const lay=[[h.th*1.9,'255,70,110',.1],[h.th*1.0,'255,150,185',.26],[h.th*.42,'255,225,238',.9]];
   for(const[w,c,a]of lay){g.lineWidth=w;g.strokeStyle='rgba('+c+','+(a*fd)+')';for(const[a0,a1]of arcs){g.beginPath();g.arc(x,y,r,a0,a1);g.stroke()}}
   for(let k=1;k<=3;k++){const rr=r-k*20;if(rr<8)continue;g.lineWidth=h.th*(.5-.1*k);g.strokeStyle='rgba(255,170,205,'+(.34*fd/k)+')';for(const[a0,a1]of openArcs(wx,wy,rr)){g.beginPath();g.arc(x,y,rr,a0,a1);g.stroke()}}
   g.restore();
   if(Math.random()<dt*70){for(let q=0;q<2;q++){const arc=arcs[(Math.random()*arcs.length)|0];if(!arc)break;const a=arc[0]+(arc[1]-arc[0])*Math.random();pt(wx+Math.cos(a)*r,wy+Math.sin(a)*r,Math.cos(a)*60,Math.sin(a)*60,.35+.3*Math.random(),Math.random()<.5?'255,215,230':'190,225,255',2+(Math.random()*2|0))}}}
  return}
 if(h.k==='circ'){if(t<h.t0||t>h.te)return;const w=h.wx!=null?[h.wx,h.wy]:W2([h.x,h.y]),x=w[0]-cx,y=w[1]-cy;if(x<-400||x>VW+400||y<-400||y>VH+400)return;
  if(t<h.tf){const p=cl((t-h.t0)/(h.tf-h.t0),0,1);g.beginPath();g.arc(x,y,h.R,0,7);g.fillStyle='rgba(255,50,85,'+(.06+.14*p)+')';g.fill();
   g.beginPath();g.arc(x,y,h.R*p,0,7);g.fillStyle='rgba(255,50,85,'+(.12+.2*p+(p>.85?.12*Math.sin(pn/40):0))+')';g.fill();
   g.save();g.setLineDash([10,8]);g.lineWidth=2;g.strokeStyle='rgba(255,140,160,'+(.6+.3*p)+')';g.beginPath();g.arc(x,y,h.R,0,7);g.stroke();g.restore()}
  else{const q=cl((t-h.tf)/(h.te-h.tf),0,1);g.beginPath();g.arc(x,y,h.R,0,7);g.fillStyle='rgba(255,215,230,'+(.4*(1-q)*(1-q))+')';g.fill();
   g.save();g.lineWidth=4;g.strokeStyle='rgba(255,235,242,'+(.85*(1-q))+')';g.beginPath();g.arc(x,y,h.R*(1+.3*q),0,7);g.stroke();g.beginPath();g.arc(x,y,h.R*(.55+.45*q),0,7);g.globalAlpha=.5*(1-q);g.stroke();g.restore()}}
 else if(h.k==='zone'){if(t<h.t0||t>h.te||!h.e||h.e.x<-9000)return;const x=h.e.x-cx,y=h.e.y+24-cy;if(x<-300||x>VW+300||y<-300||y>VH+300)return;
  const k=Math.min(cl((t-h.t0)/350,0,1),cl((h.te-t)/300,0,1)),R=h.R*k;g.save();g.beginPath();g.arc(x,y,R,0,7);g.fillStyle='rgba(150,215,255,'+(.13+.06*Math.sin(pn/180))+')';g.fill();
  g.lineWidth=3;g.strokeStyle='rgba(205,238,255,.75)';g.stroke();g.lineCap='round';
  for(let i=0;i<5;i++){g.beginPath();for(let s=0;s<=1.001;s+=.07){const th=now*3.4+i*1.2566+s*2.6,r=R*(.12+.88*s);const px=x+Math.cos(th)*r,py=y+Math.sin(th)*r;s?g.lineTo(px,py):g.moveTo(px,py)}g.strokeStyle='rgba(235,248,255,'+(.42+.22*(i%2))+')';g.lineWidth=3;g.stroke()}
  g.restore();if(Math.random()<dt*46){const th=Math.random()*6.283,r=R*(.5+Math.random()*.5);pt(h.e.x+Math.cos(th)*r,h.e.y+24+Math.sin(th)*r,-Math.sin(th)*150,Math.cos(th)*150,.5+Math.random()*.4,'225,245,255',2)}}
 else if(h.k==='vort'){if(t<h.t0||t>h.te)return;const w=W2([h.x,h.y]),x=w[0]-cx,y=w[1]-cy;if(x<-200||x>VW+200||y<-200||y>VH+200)return;
  const p=cl((t-h.t0)/(h.te-h.t0),0,1),R=h.R*(.45+.55*Math.min(1,p*1.6)),al=Math.min(1,p*3)*(p>.9?(1-p)*10:1);g.save();g.translate(x,y);g.scale(1,.8);
  g.fillStyle='rgba(40,10,70,'+(.5*al)+')';g.beginPath();g.arc(0,0,R,0,7);g.fill();g.lineWidth=2;g.strokeStyle='rgba(215,170,255,'+(.8*al)+')';g.beginPath();g.arc(0,0,R,0,7);g.stroke();
  for(let i=0;i<4;i++){g.beginPath();for(let s=0;s<=1.001;s+=.08){const th=-now*5+i*1.5708+s*3,r=R*(.1+.9*s);const px=Math.cos(th)*r,py=Math.sin(th)*r;s?g.lineTo(px,py):g.moveTo(px,py)}g.strokeStyle='rgba(240,225,255,'+(.55*al)+')';g.stroke()}
  g.restore()}
 else if(h.k==='ring'){if(t<h.t0||t>h.te)return;const w=W2([h.x,h.y]),x=w[0]-cx,y=w[1]-cy;if(x<-400||x>VW+400||y<-400||y>VH+400)return;const p=cl((t-h.t0)/(h.te-h.t0),0,1);
  g.save();g.lineWidth=3+3*(1-p);g.strokeStyle='rgba('+(h.c||'255,255,255')+','+(.75*(1-p))+')';g.beginPath();g.arc(x,y,h.R*p,0,7);g.stroke();g.restore()}
 else if(h.k==='orbc'){if(t<h.t0||t>h.te)return;const w=h.e?[h.e.x,h.e.y]:W2([h.x,h.y]);if(h.e&&h.e.x<-9000)return;const x=w[0]-cx,y=w[1]-cy,p=cl((t-h.t0)/(h.te-h.t0),0,1);
  g.save();g.globalCompositeOperation='lighter';const r=8+24*p,gr=g.createRadialGradient(x,y,1,x,y,r);gr.addColorStop(0,'rgba(255,200,215,'+(h.real?.9:.78)+')');gr.addColorStop(1,'rgba(255,60,100,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);g.restore()}
 else if(h.k==='orb'){
  if(h.arm&&!h.done){const x=h.x-cx,y=h.y-cy;if(x<-80||x>VW+80||y<-80||y>VH+80)return;const fl=h.real?1:.78+.12*Math.sin(pn/55+h.tf);
   g.save();g.globalCompositeOperation='lighter';for(let j=6;j>=1;j--){const tx=x-h.vx*.03*j,ty=y-h.vy*.03*j,r=15-j*1.6;const gr=g.createRadialGradient(tx,ty,1,tx,ty,r);gr.addColorStop(0,'rgba(255,110,150,'+(.34*fl*(1-j/7))+')');gr.addColorStop(1,'rgba(255,60,100,0)');g.fillStyle=gr;g.fillRect(tx-r,ty-r,r*2,r*2)}
   const gr=g.createRadialGradient(x,y,1,x,y,30);gr.addColorStop(0,'rgba(255,225,235,'+fl+')');gr.addColorStop(.35,'rgba(255,90,135,'+(.75*fl)+')');gr.addColorStop(1,'rgba(255,40,90,0)');g.fillStyle=gr;g.fillRect(x-30,y-30,60,60);g.restore()}
  else if(h.done&&h.pop&&t-h.pop<320){const x=h.x-cx,y=h.y-cy,q=(t-h.pop)/320;g.save();g.lineWidth=3;g.strokeStyle='rgba(255,190,210,'+(1-q)+')';g.beginPath();g.arc(x,y,10+30*q,0,7);g.stroke();g.restore()}}}
A.ground=function(cx,cy,now){try{
 if(!A.on)return;const ar=arena();if(!ar)return;const pn=performance.now(),dt=Math.min(.1,Math.max(.001,(pn-(lastG||pn))/1000));lastG=pn;const t=sn();
 g.save();for(const h of A.hz)drawHz(h,t,cx,cy,now,pn,dt);g.restore();
 /* caído: aro y fantasma sobre tu héroe */
 if(A.fell){const x=P.x-cx,y=P.y-cy;g.save();g.globalAlpha=.55+.2*Math.sin(pn/260);g.strokeStyle='rgba(190,225,255,.9)';g.lineWidth=2;g.beginPath();g.ellipse(x,y+14,22,8,0,0,7);g.stroke();g.globalAlpha=1;g.font='22px serif';g.textAlign='center';g.fillText('👻',x,y-38+Math.sin(pn/300)*3);g.restore()}
 /* los compañeros caídos también se ven (aro y fantasma sobre su héroe) */
 for(const nm of A.fl){if(nm===P.name)continue;const q=posOf(nm);if(!q)continue;const x=q[0]-cx,y=q[1]-cy;if(x<-40||x>VW+40||y<-70||y>VH+40)continue;g.save();g.globalAlpha=.5+.2*Math.sin(pn/260+x);g.strokeStyle='rgba(190,225,255,.9)';g.lineWidth=2;g.beginPath();g.ellipse(x,y+14,22,8,0,0,7);g.stroke();g.globalAlpha=1;g.font='20px serif';g.textAlign='center';g.fillText('👻',x,y-38+Math.sin(pn/300+x)*3);g.restore()}
 {const f=PF().ground;if(f)f(cx,cy,now,pn,dt,t)}
 ptStep(dt,cx,cy)}catch(e){}};
/* la Banshee y sus imágenes (las llama el bucle de dibujo del juego en lugar del dibujo normal) */
function drawEnt(e,cx,cy,now){{const X=PF().draw1;if(X&&X(e,cx,cy,now))return}
 if(e.x<-9000||e.al<=.02)return;const x=e.x-cx,y=e.y-cy;if(x<-170||x>VW+170||y<-190||y>VH+140)return;const pn=performance.now(),ill=!!e.ill;
 let al=e.al;if(ill)al*=.86+.1*Math.sin(pn/70+e.sid)+(Math.sin(pn/330+e.sid*1.3)>.965?-.38:0);
 if(!ill){g.fillStyle='rgba(0,0,0,'+(.3*e.al).toFixed(2)+')';g.beginPath();g.ellipse(x,y+42,27,8,0,0,7);g.fill()}
 if(!ill&&e.ch){const k=e.ch===2?1:.6+.4*Math.sin(pn/60);g.save();g.globalCompositeOperation='lighter';const r=92+10*Math.sin(pn/90),gr=g.createRadialGradient(x,y,6,x,y,r);gr.addColorStop(0,'rgba(255,60,90,'+(.45*k)+')');gr.addColorStop(1,'rgba(255,40,80,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);g.restore()}
 const vx=e._vx||0,vy=e._vy||0,spd=Math.hypot(vx,vy),shear=cl(-vx*.0009,-.3,.3),dirn=e.dir||'down',fr=spd>60?(Math.floor(pn/140)%2?2:3):1,nm='mj3-'+dirn+'-'+fr;
 /* estela: copias tenues del cuadro cuando se mueve rápido */
 if(spd>170){const k=Math.min(4,Math.floor(spd/110));for(let j=k;j>=1;j--){g.save();g.globalAlpha=al*.16*(1-j/(k+1));MJ.cur=e;MJ.sp(nm,x-vx*.028*j,y+30-vy*.028*j,2);g.restore()}}
 g.save();g.globalAlpha=al;g.translate(x,y-30);g.transform(1,0,shear,1,0,0);g.translate(-x,-(y-30));MJ.cur=e;MJ.sp(nm,x,y+30,2);g.restore();
 if(e._hf&&pn-e._hf<110){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=al*.55*(1-(pn-e._hf)/110);MJ.cur=e;MJ.sp(nm,x,y+30,2);g.restore()}
 if(ill){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=al*.18;MJ.cur=e;MJ.sp(nm,x+Math.sin(pn/90+e.sid)*1.5,y+30,2);g.restore()}}
window.MJB={draw:function(e,cx,cy,now){try{drawEnt(e,cx,cy,now)}catch(x){}}};
/* ═════════ pantalla: barra del jefe, caídos, resultado, cola y turno ═════════ */
const css=document.createElement('style');
css.textContent='#mjab,#mjfl,#mjrs,#mjqc,#mjtm{position:fixed;font-family:Georgia,serif;color:#f6e7c1;text-shadow:0 1px 3px #000;display:none;box-sizing:border-box}'
+'#mjab{left:50%;top:calc(env(safe-area-inset-top,0px) + 58px);transform:translateX(-50%);width:min(520px,58vw);z-index:9100;pointer-events:none}'
+'#mjab .t{display:flex;align-items:baseline;gap:8px;justify-content:center;font-size:15px;font-weight:700;letter-spacing:.04em}#mjab .t i{font-style:normal;font-size:11px;color:#ffb3c0}'
+'#mjab .t em{font-style:normal;font-size:10px;padding:1px 8px;border-radius:9px;background:rgba(80,10,25,.85);border:1px solid #d96a80;color:#ffd5dc}#mjab .t em.p2{background:rgba(150,10,35,.92);border-color:#ff8aa0;animation:mjap 1s ease-in-out infinite}'
+'@keyframes mjap{50%{box-shadow:0 0 12px 2px rgba(255,70,110,.8)}}#mjab .t button{pointer-events:auto;align-self:center;margin-left:4px;font:700 11px Georgia,serif;color:#fff1c8;background:rgba(60,38,20,.88);border:1px solid #c9a35a;border-radius:8px;padding:1px 8px;min-height:24px;cursor:pointer;text-shadow:none}#mjab .t button:disabled{opacity:.5}'
+'#mjab .bar{position:relative;height:15px;background:rgba(10,4,12,.86);border:2px solid #7d3347;border-radius:9px;overflow:hidden;margin-top:3px;box-shadow:0 0 14px rgba(255,70,110,.3)}'
+'#mjab .bar u{position:absolute;left:0;top:0;bottom:0;width:100%;background:linear-gradient(180deg,#ff7b97,#c2203f 55%,#7d1128);transition:width .2s}#mjab .bar s{position:absolute;left:25%;top:-1px;bottom:-1px;width:2px;background:#ffe9a0;opacity:.85}'
+'#mjab .bar b{position:absolute;inset:0;text-align:center;font:700 10px/15px Georgia,serif;color:#fff}'
+'#mjab .mv{margin-top:5px;text-align:center;font-size:13px;color:#ffd9a0;min-height:18px}#mjab .mv.f{animation:mjmv .9s ease-out}@keyframes mjmv{0%{transform:scale(1.35);opacity:0}30%{opacity:1}100%{transform:scale(1)}}'
+'#mjab .pt{margin-top:3px;display:flex;gap:5px;justify-content:center;flex-wrap:wrap;font-size:10px}#mjab .pt span{padding:0 7px;border-radius:8px;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.22)}#mjab .pt span.d{opacity:.5;text-decoration:line-through}#mjab .pt span.me{border-color:#ffd666}'
+'#mjfl{left:50%;top:calc(env(safe-area-inset-top,0px) + 148px);transform:translateX(-50%);z-index:9101;background:rgba(14,9,22,.86);border:1px solid #8aa6d8;border-radius:12px;padding:8px 12px;text-align:center;font-size:12px;max-width:min(360px,92vw)}'
+'#mjfl button,#mjtm button,#mjqc button,#mjrs button{font:700 12px Georgia,serif;color:#fff1c8;background:#4a2f1a;border:1px solid #c9a35a;border-radius:8px;padding:8px 13px;cursor:pointer;min-height:36px;margin:6px 4px 0}#mjfl button:disabled,#mjtm button:disabled{opacity:.5}'
+'#mjtm button.go,#mjrs button.go{background:#2e7d32;border-color:#7bd27f}'
+'#mjrs{left:50%;top:20%;transform:translateX(-50%);z-index:9200;width:min(420px,92vw);background:linear-gradient(180deg,rgba(28,18,30,.96),rgba(14,9,18,.96));border:2px solid #c9a35a;border-radius:14px;padding:14px 16px;text-align:center;box-shadow:0 8px 40px #000}'
+'#mjrs h3{margin:0 0 6px;font-size:19px;color:#ffe08a}#mjrs p{margin:5px 0;font-size:13px;line-height:1.45}#mjrs .rw{background:rgba(255,255,255,.07);border:1px solid rgba(255,224,138,.5);border-radius:10px;padding:7px 9px;margin:8px 0}#mjrs small{color:#cdbf9a;display:block;margin-top:6px}'
+'#mjqc{left:8px;top:calc(env(safe-area-inset-top,0px) + 112px);z-index:9050;background:rgba(24,16,10,.88);border:1px solid rgba(255,214,102,.55);border-radius:12px;padding:6px 10px;font-size:12px;max-width:min(280px,60vw)}#mjqc button{min-height:30px;padding:4px 10px;margin:4px 0 0}'
+'#mjtm{left:50%;top:calc(env(safe-area-inset-top,0px) + 10px);transform:translateX(-50%);z-index:99991;width:min(400px,94vw);background:linear-gradient(180deg,rgba(40,26,12,.97),rgba(18,11,6,.97));border:2px solid #ffd666;border-radius:14px;padding:12px 14px;text-align:center;box-shadow:0 0 24px rgba(255,214,102,.45);animation:mjtp 1.3s ease-in-out infinite}'
+'@keyframes mjtp{50%{box-shadow:0 0 34px rgba(255,214,102,.8)}}#mjtm b{font-size:16px;color:#ffe08a}#mjtm .tb{height:6px;background:#0d0805;border-radius:3px;overflow:hidden;margin:8px 0 2px}#mjtm .tb i{display:block;height:100%;background:linear-gradient(90deg,#ffd666,#ff9a3a);width:100%}'
+'#mjdf{position:fixed;inset:0;pointer-events:none;opacity:0;z-index:0;transition:opacity .12s;background:radial-gradient(ellipse at center,rgba(255,255,255,0) 18%,rgba(240,245,255,.6) 100%)}'
+'#mjrv,#mjrf{position:fixed;inset:0;pointer-events:none;opacity:0;z-index:0;transition:opacity .8s}#mjrv{background:radial-gradient(ellipse 75% 70% at 50% 52%,transparent 40%,rgba(150,0,30,.5) 100%);mix-blend-mode:multiply}'
+'#mjrf{background:radial-gradient(ellipse at center,rgba(255,225,235,.55),rgba(255,70,110,.25) 60%,transparent 100%);transition:opacity .25s}'
+'body.mja #mjtr,body.mja #mjth,body.mja #evn,body.mja #mjban{display:none!important}@media (max-height:520px),(max-width:900px){#mjab .t em .x{display:none}#mjab{width:min(440px,50vw)}#mjab .t{font-size:13px}#mjab .mv{font-size:11px;min-height:14px}#mjfl{top:calc(env(safe-area-inset-top,0px) + 78px)}#mjrs{top:8%}#mjqc{top:calc(env(safe-area-inset-top,0px) + 100px)}}';
document.head.appendChild(css);
const mkD=(id,html)=>{const d=document.createElement('div');d.id=id;if(html)d.innerHTML=html;return d};
const cvEl=document.getElementById('c'),parEl=cvEl&&cvEl.parentNode?cvEl.parentNode:document.body,nxEl=cvEl?cvEl.nextSibling:null;
const dRv=mkD('mjrv'),dRf=mkD('mjrf'),dDf=mkD('mjdf');parEl.insertBefore(dRf,nxEl);parEl.insertBefore(dRv,dRf);parEl.insertBefore(dDf,dRv);
const dAb=mkD('mjab','<div class="t"><b id="mjnm">👻 Banshee</b><i id="mjlv"></i><em id="mjph"></em><button id="mjqt" data-a="leave" title="Salir de la pelea">🚪</button></div><div class="bar"><u id="mjhp"></u><s></s><b id="mjht"></b></div><div class="mv" id="mjmv"></div><div class="pt" id="mjpt"></div>'),
 dFl=mkD('mjfl','<div>👻 <b>Has caído</b> · tu grupo sigue luchando.<br><small>No pierdes experiencia ni objetos.</small></div><button id="mjqb" data-a="quit">🚪 Salir de la mansión</button>'),
 dRs=mkD('mjrs'),dQc=mkD('mjqc'),dTm=mkD('mjtm');
[dAb,dFl,dRs,dQc,dTm].forEach(d=>document.body.appendChild(d));
let hk='',pk='',mvk='';
A.hud=function(force){const on=!!(A.on&&arena());document.body.classList.toggle('mja',on);
 dAb.style.display=on?'block':'none';dFl.style.display=on&&A.fell&&!A.quit&&!A.done?'block':'none';{const q=$('mjqt');if(q)q.style.display=(A.fell||A.quit||A.done)?'none':''}dRv.style.opacity=on&&A.ph2&&!A.done?'1':'0';
 if(on&&dAb._b!==A.b){const p=PF();dAb._b=A.b;$('mjnm').textContent=p.hudNm;dAb.className=p.cls||'';$('mjqb').textContent=p.exitBtn}
 if(!on){dRs.style.display='none';return}
 const pn=performance.now(),disp=cl((A.hp-A.acc-A.snt)/(A.mhp||1),A.done&&!A.res.lost?0:.0005,1);
 const w=(disp*100).toFixed(1)+'%',txt=A.done&&A.res&&!A.res.lost?PF().dead:Math.max(1,Math.ceil(disp*100))+' %';
 if(force||w!==hk){hk=w;$('mjhp').style.width=w;$('mjht').textContent=txt}
 const lv='Nv '+(A.lv||45),ph=A.ph2?PF().ph2:'Fase 1';if(force||$('mjph').textContent!==ph){{const i=ph.indexOf(' · ');$('mjph').innerHTML=i>0?ph.slice(0,i)+'<span class="x">'+ph.slice(i)+'</span>':ph}$('mjph').className=A.ph2?'p2':'';$('mjlv').textContent=lv}
 const key=A.mem.map(n=>n+(A.fl.indexOf(n)>=0||(n===P.name&&A.fell)?'x':'')).join('|');if(force||key!==pk){pk=key;$('mjpt').innerHTML=A.mem.length>1?A.mem.map(n=>'<span class="'+((A.fl.indexOf(n)>=0||(n===P.name&&A.fell))?'d':'')+(n===P.name?' me':'')+'">'+((A.fl.indexOf(n)>=0||(n===P.name&&A.fell))?'💀 ':'❤️ ')+hx(n)+'</span>').join(''):''}
 const mv=A.done?(A.res&&A.res.lost?PF().lost:PF().won):(A.invul?'🛡️ '+(A.mvName||'')+' · invulnerable':A.mvName||'');
 if(force||mv!==mvk){mvk=mv;const e=$('mjmv');e.textContent=mv;e.classList.remove('f');void e.offsetWidth;e.classList.add('f')}
 dRf.style.opacity=A.flash&&pn-A.flash<260?'1':'0';
 dDf.style.opacity=A.deaf&&pn<A.deaf?String(Math.min(.75,(A.deaf-pn)/1500*.75)):'0';
 if(A.done&&A.res)updRs()};
/* resultado del combate */
function updRs(){const m=A.res;if(!m||dRs.style.display==='none')return;const s=Math.max(0,Math.ceil((A.exitAt-Date.now())/1000)),e=$('mjrx');if(e)e.textContent=s}
A.result=function(m){let h='';const R=PF().R;
 if(!m.lost){const mine=m.mine?'<b>¡Te tocó a ti!</b>':(m.selNm?'Le tocó a <b>'+hx(m.selNm)+'</b>':'');
  h='<h3>'+R.wonH+'</h3><p>'+R.wonP+'</p>'
  +(m.cat==='none'||!m.txt?'<div class="rw">'+R.none+'<br><small>(Una sola tirada por combate: no depende de quién pegó más.)</small></div>':'<div class="rw">🎁 '+mine+'<br>'+hx(m.txt)+'</div>')
  +(m.dmg?'<p><small>Tu daño total: '+m.dmg.toLocaleString('es')+'</small></p>':'')+'<p>⏳ Recarga individual: <b>12 h</b> para volver a enfrentarla.</p>'}
 else h='<h3>'+R.lostH+'</h3><p>'+hx(m.why||'Todos cayeron')+'.</p><p>La ofrenda ya se gastó, pero <b>no tienes recarga</b>: puedes intentarlo de nuevo con otra ofrenda.</p>';
 dRs.innerHTML=h+'<small>🚪 '+R.out+' <b id="mjrx">'+Math.max(0,Math.ceil((m.ex||8000)/1000))+'</b> s</small><button data-a="x">Cerrar</button>';dRs.style.display='block'};
/* cola y turno: el estado oficial viene de mb.me; los mensajes lo mantienen al día */
const hm=ms=>{const m=Math.ceil(ms/6e4);return m>=60?Math.floor(m/60)+' h '+(m%60)+' min':m+' min'};
A.q=function(force){try{let s=null,pb='ban';if(!A.on)for(const k of BOSSES){const x=ST.b&&ST.b[k];if(x&&(x.fight||x.turn||x.pos>0)){s=x;pb=k;break}}
 if(!s||A.on||s.fight){dQc.style.display='none';dTm.style.display='none';return}
 const pf=PFof(pb),nowS=Date.now()+(ST.off||0);
 if(s.turn){const left=Math.max(0,(s.dl||0)-nowS),Q=A.Q||{},k='t'+Math.round(left/1000)+':'+(Q.rdy|0)+(Q.me?'y':'n');
  if(force||k!==dTm._k){dTm._k=k;dTm.innerHTML='<b>🕯️ ¡Es tu turno!</b><div style="font-size:12px;margin-top:3px">'+pf.wait+(s.party&&s.party.length>1?'<br>Party: '+Q.rdy+'/'+s.party.length+' listos · líder: '+hx(s.lead):'')+'</div><div class="tb"><i style="width:'+Math.round(100*left/60000)+'%"></i></div><small>Quedan '+Math.ceil(left/1000)+' s'+(Q.me?' · esperando a los demás':'')+'</small><div><button class="go" data-a="ok" '+(Q.me||!left?'disabled':'')+'>⚔️ '+(Q.me?'Listo':'Entrar')+'</button><button data-a="lv">✕ Salir</button></div>'}
  dTm.style.display='block';dQc.style.display='none';return}
 dTm.style.display='none';
 if(s.pos>0){const k='q'+s.pos+':'+s.qn;if(force||k!==dQc._k){dQc._k=k;dQc.innerHTML='⏳ <b>Cola · '+hx(s.n)+'</b><br>Posición <b>'+s.pos+'</b> de '+Math.max(s.qn+1,s.pos)+(s.party&&s.party.length>1?' · Party de '+s.party.length:'')+'<br><button data-a="lv">✕ Salir de la cola</button>'}dQc.style.display='block';return}
 dQc.style.display='none'}catch(e){}};
setInterval(()=>A.q(0),500);
document.addEventListener('click',async e=>{const b=e.target.closest&&e.target.closest('#mjab button,#mjfl button,#mjrs button,#mjqc button,#mjtm button');if(!b)return;const a=b.dataset.a;
 if(a==='x'){dRs.style.display='none';return}
 if(a==='quit'){b.disabled=true;await A.doQuit();b.disabled=false;return}
 if(a==='leave'){const n=Date.now();if(!b._c||n-b._c>3500){b._c=n;b.textContent='¿Seguro?';try{toast('Toca 🚪 otra vez para abandonar la pelea',2600)}catch(e){}clearTimeout(b._t);b._t=setTimeout(()=>{b._c=0;b.textContent='🚪'},3500);return}
  b._c=0;clearTimeout(b._t);b.disabled=true;await A.doQuit();b.disabled=false;b.textContent='🚪';return}
 if(a==='ok'){b.disabled=true;const r=await mop('mb.ok');if(r&&r.ok){A.Q=Object.assign(A.Q||{},{me:1})}else b.disabled=false;A.q(1);return}
 if(a==='lv'){b.disabled=true;const r=await mop('mb.leave');A.Q=null;MJ.load&&await MJ.load(1);A.q(1);b.disabled=false}},true);
/* mensajes del servidor */
A.msg=function(m){try{
 if(m.t==='mbm'||m.t==='mbf'){const f=PF().msg;if(A.on&&m.id===A.id&&f)f(m);return}      /* v436 espejo roto (mbm) · v437 hierba quemada (mbf): cada jefe lo interpreta en su perfil */
 if(m.t==='mbh'){if(!A.on||m.id!==A.id)return;noteTs(m.ts);A.hp=m.hp;A.mhp=m.mhp||A.mhp;A.snt=0;A.fl=m.fl||[];A.al=m.al;if(m.p2&&!A.p2)A.p2=m.p2;
  if(A.fl.indexOf(P.name)>=0&&!A.fell&&!A.done){A.fell=1;P.hp=Math.max(1,P.hp)}A.hud(0);return}
 if(m.t==='mbr'){if(A.on&&m.id===A.id)A.over(m);else{try{toast(m.lost?'💀 El combate terminó sin victoria':'🏆 '+(m.txt||'Combate terminado'),5000)}catch(e){}MJ.load&&MJ.load(1)}return}
 if(m.t!=='mbq')return;
 if(m.st==='exit'){if(A.on)A.leave('exit');return}
 if(m.st==='start'){A.Q=null;A.begin(m);return}
 if(m.st==='turn'||m.st==='pos'||m.st==='inv'){try{MAN.ensureArt(()=>{},m.b)}catch(e){}}
 if(m.st==='turn'){A.Q={st:'turn',dl:m.dl,lead:m.lead,rdy:0,me:0};try{toast(PFof(m.b).turn,5200);snd('bell',.5)}catch(e){}MJ.load&&MJ.load(1).then(()=>A.q(1));return}
 if(m.st==='pos'){A.Q=Object.assign(A.Q||{},{st:'queue',pos:m.pos});MJ.load&&MJ.load(1);return}
 if(m.st==='rdy'){A.Q=Object.assign(A.Q||{},{rdy:m.n,of:m.of});A.q(1);return}
 if(m.st==='inv'){try{toast('👥 '+(m.lead||'Tu líder')+' pidió turno para tu Party contra '+PFof(m.b).vs,4800)}catch(e){}A.Q={st:'inv',lead:m.lead};MJ.load&&MJ.load(1);return}
 if(m.st==='out'||m.st==='denied'){A.Q=null;try{if(m.why)toast((m.st==='denied'?'⛔ ':'⚠️ ')+m.why,5600)}catch(e){}MJ.load&&MJ.load(1).then(()=>A.q(1));return}
 if(m.st==='fell'){if(A.on&&!A.done){A.fell=1;P.hp=Math.max(1,P.hp);try{toast('💀 Has caído'+(m.why==='off'?' (sin conexión)':m.why==='out'?' (saliste de la arena)':''),4200)}catch(e){}A.hud(1)}return}
 }catch(e){try{console.error('MJA.msg',e)}catch(x){}}};
A.sync=function(){try{if(!A.on)for(const b of BOSSES){const s=ST.b&&ST.b[b];if(s&&s.fight&&s.fx){A.resume(s,b);break}}A.q(1)}catch(e){}};
MJ.A=A;
/* pruebas: el servidor real nunca manda esto; sirve para ensayar la pelea completa en el navegador sin tocar el servidor */
A.K={noise,pt,hh,ez,cl,posOf,pickT,tgtLocal,W2,AXY,setPos,HZ,hurt,canHurt,inAr,arena,sn,mkEnt,addEnts,snd,stn,sway,glide,bag,PR,pillars,covered,shadow,sector};
A.dbg={PFS,sn,turnAt,stn,beginTurn,hz:()=>A.hz,hurt,hzEval,canHurt,covered,pillars,openArcs,shadow,snd};
})();
/* ═══════════ v436 · MINI-JEFES (cliente) · parte 9: LA PELEA CONTRA EL NECROMANCER ═══════════
   Usa el motor de pelea de mjc5.js (reloj del servidor, turnos con semilla, peligros, daño) y le añade el perfil del Necromancer (PFS.nec).
   El SERVIDOR decide quién entra, la vida compartida, la fase 2, quién cae, el premio y qué espejos se rompen (mb.mirror); aquí se ve y se juega:
   · Salón de los Espejos: el jefe nunca camina; SALE de un espejo, ataca y se disuelve en él. El espejo que se va a usar brilla en VERDE un momento antes (y suena, con paneo),
   · 5 habilidades: Proyectil de la Muerte (esfera oscura que persigue con giro limitado y se rompe contra los pilares), Legión Condenada (hasta 2 condenados que te persiguen),
     Salto Dimensional (cruza dos espejos; el aviso en el suelo marca dónde aparece), Círculo de Condena (runas en el suelo con aviso) y,
     al 25 % de vida, el Pacto de las Sombras (despiertan los espejos dormidos, más saltos, combos de proyectil y área),
   · el jugador puede ROMPER hasta 2 espejos (botón junto a ellos): el jefe tiene menos salidas, pero el espejo descarga energía al romperse,
   · sonidos propios sintetizados (vidrio, coro grave, huesos, campana fúnebre) y efectos de luz/partículas propios. */
(function(){
'use strict';
const A=window.MJA,MJ=window.MJC,MAN=window.MJMAN,NEC=window.MJNEC;
if(!A||!A.K||!A.PF||!MJ||!MAN||!NEC||typeof E==='undefined')return;
const X=A.K,PFS=A.PF,hh=X.hh,ez=X.ez,cl=X.cl,pt=X.pt,posOf=X.posOf,pickT=X.pickT,W2=X.W2,HZ=X.HZ,hurt=X.hurt,canHurt=X.canHurt,inAr=X.inAr,sn=X.sn,snd=X.snd,pillars=X.pillars;
const $=id=>document.getElementById(id);
const ST1=5200,ST2=3600,EM=420,DS=340,TAU=Math.PI*2;
/* ── geometría del salón (px locales del marco de la pelea; mjc8.js entrega la base de cada espejo y de cada pilar) ── */
const CTR=[496,300],THR=[496,60];
const stand=k=>{const m=NEC.mir[k];return[m[0],m[1]+4]};              /* centro del jefe cuando está fuera del espejo k */
const inside=k=>{const m=NEC.mir[k];return[m[0],m[1]-56]};            /* dentro del cristal */
const ringL=k=>{const m=NEC.mir[k];return[m[0],m[1]+34]};             /* aro del suelo delante del espejo */
const panOf=k=>cl((NEC.mir[k][0]-496)/496*.85,-1,1);
const sway=(u,s)=>[Math.sin(u/520+s)*5,Math.sin(u/390+s*1.7)*3];
/* ═════════ sonidos ═════════ */
const noise=c=>X.noise(c);
const GA=(c,o,t,a,pk,dec)=>{const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,pk),t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec);g.connect(o);return g};
const OSC=(c,ty,f0,f1,t,d,dst,det)=>{const o=c.createOscillator();o.type=ty;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+d);if(det)o.detune.value=det;o.connect(dst);o.start(t);o.stop(t+d+.06);return o};
const NZ=(c,ty,f0,f1,t,d,dst,q)=>{const s=c.createBufferSource();s.buffer=noise(c);s.loop=true;const f=c.createBiquadFilter();f.type=ty;f.Q.value=q||1;f.frequency.setValueAtTime(f0,t);if(f1)f.frequency.exponentialRampToValueAtTime(f1,t+d);s.connect(f);f.connect(dst);s.start(t);s.stop(t+d+.06);return f};
const LP=(c,f,dst)=>{const b=c.createBiquadFilter();b.type='lowpass';b.frequency.value=f;b.connect(dst);return b};
const VIB=(c,o,t,d,hz,cents)=>{const lf=c.createOscillator(),lg=c.createGain();lf.frequency.value=hz;lg.gain.value=cents;lf.connect(lg);lg.connect(o.detune);lf.start(t);lf.stop(t+d+.1)};
const PART=(c,g,f0,list,t,d)=>{for(const[m,a]of list){const q=c.createGain();q.gain.value=a;q.connect(g);OSC(c,'sine',f0*m,0,t,d,q)}};
const SND={
 /* el jefe sale del espejo: campanas de vidrio, un soplo que sube y un golpe grave */
 nemerge:(c,t,o,v)=>{const g=GA(c,o,t,.012,.21*v,1.5);PART(c,g,330,[[1,1],[2.76,.55],[5.4,.3],[8.93,.16]],t,1.7);
  const w=GA(c,o,t,.4,.2*v,.22);NZ(c,'bandpass',260,3400,t,.7,w,2.4);const s=GA(c,o,t+.28,.02,.32*v,.5);OSC(c,'sine',118,50,t+.28,.55,s)},
 /* aviso: el espejo que se va a usar «tintinea» (con paneo hacia ese lado) */
 nsig:(c,t,o,v)=>{const g=GA(c,o,t,.004,.27*v,.42);PART(c,g,1320,[[1,1],[1.5,.5],[2.01,.35]],t,.5)},
 /* carga del proyectil: zumbido grave que sube y susurro */
 nproj:(c,t,o,v,D)=>{D=D||1;const g=GA(c,o,t,D*.85,.3*v,.14),lp=LP(c,380,g);lp.frequency.setValueAtTime(380,t);lp.frequency.exponentialRampToValueAtTime(1300,t+D);
  OSC(c,'sawtooth',58,98,t,D,lp);OSC(c,'sawtooth',58.8,99,t,D,lp,9);const w=GA(c,o,t,D*.9,.13*v,.1);NZ(c,'bandpass',2200,3600,t,D,w,3)},
 nshot:(c,t,o,v)=>{const g=GA(c,o,t,.006,.45*v,.4);OSC(c,'sine',260,52,t,.42,g);const n=GA(c,o,t,.004,.3*v,.3);NZ(c,'lowpass',3200,260,t,.32,n,.8);const r=GA(c,o,t,.006,.1*v,.3);OSC(c,'triangle',740,0,t,.3,r)},
 nimp:(c,t,o,v)=>{const g=GA(c,o,t,.005,.55*v,.5);OSC(c,'sine',96,30,t,.52,g);const n=GA(c,o,t,.003,.4*v,.4);NZ(c,'lowpass',2400,120,t,.45,n,.7);const b=GA(c,o,t,.004,.1*v,.5);for(const f of[520,785,1210])OSC(c,'sine',f,0,t,.5,b)},
 /* círculo de condena: coro grave en menor que crece */
 ncirc:(c,t,o,v,D)=>{D=D||1.3;const g=GA(c,o,t,D*.9,.4*v,.12);
  for(const[f,fm]of[[110,700],[130.8,1250],[164.8,900],[220,1400]]){const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=fm;bp.Q.value=3;bp.connect(g);const s=OSC(c,'sawtooth',f,f*1.03,t,D,bp);VIB(c,s,t,D,5.5,9)}
  const u=GA(c,o,t,D*.95,.2*v,.1);OSC(c,'sine',40,92,t,D,u)},
 nboom:(c,t,o,v)=>{const g=GA(c,o,t,.006,.6*v,.95);OSC(c,'sine',74,26,t,.95,g);const n=GA(c,o,t,.004,.45*v,.5);NZ(c,'lowpass',5200,150,t,.55,n,.7);const r=GA(c,o,t+.05,.05,.18*v,1.2);NZ(c,'lowpass',200,60,t+.05,1.2,r,.5)},
 nleap:(c,t,o,v)=>{const g=GA(c,o,t,.01,.42*v,.55),o1=OSC(c,'sine',2200,70,t,.55,g);const fm=c.createOscillator(),fg=c.createGain();fm.frequency.value=150;fg.gain.value=520;fm.connect(fg);fg.connect(o1.frequency);fm.start(t);fm.stop(t+.6);
  const n=GA(c,o,t,.2,.2*v,.35);NZ(c,'bandpass',5200,280,t,.5,n,2)},
 narr:(c,t,o,v)=>{const n=GA(c,o,t,.22,.26*v,.06);NZ(c,'bandpass',200,4200,t,.28,n,2.4);const g=GA(c,o,t+.24,.006,.55*v,.7);OSC(c,'sine',140,34,t+.24,.72,g);const k=GA(c,o,t+.24,.004,.16*v,.3);OSC(c,'triangle',1760,600,t+.24,.3,k)},
 /* la legión se levanta: huesos que chasquean y un gruñido */
 nlegion:(c,t,o,v)=>{for(let i=0;i<10;i++){const tt=t+i*.085+Math.random()*.045,n=GA(c,o,tt,.002,.32*v,.05);NZ(c,'highpass',1800+Math.random()*1500,0,tt,.05,n,1);const b=GA(c,o,tt,.002,.13*v,.08);OSC(c,'triangle',380+Math.random()*520,0,tt,.08,b)}
  const g=GA(c,o,t,.25,.26*v,.75),lp=LP(c,260,g),s=OSC(c,'sawtooth',58,40,t,1,lp);VIB(c,s,t,1,11,14);const k=GA(c,o,t,.01,.3*v,.35);NZ(c,'lowpass',800,120,t,.35,k,.8)},
 /* pacto de las sombras: campana fúnebre, pad disonante que sube */
 npact:(c,t,o,v)=>{const g=GA(c,o,t,.01,.28*v,3.2);PART(c,g,92,[[1,1],[2,.5],[2.76,.45],[4.2,.25],[5.4,.15]],t,3.3);
  const p=GA(c,o,t,1.5,.2*v,1),lp=LP(c,160,p);lp.frequency.setValueAtTime(160,t);lp.frequency.exponentialRampToValueAtTime(1500,t+1.7);for(const f of[55,58.3,82.4,87.3])OSC(c,'sawtooth',f,0,t,2.6,lp)},
 /* espejo que estalla: lluvia de cristales */
 nbreak:(c,t,o,v)=>{for(let i=0;i<22;i++){const tt=t+Math.random()*.4,n=GA(c,o,tt,.002,.13*v,.07);NZ(c,'highpass',2500+Math.random()*5000,0,tt,.07,n,1);if(i%3===0){const b=GA(c,o,tt,.002,.05*v,.1);OSC(c,'sine',1800+Math.random()*4700,0,tt,.1,b)}}
  const g=GA(c,o,t,.004,.5*v,.4);OSC(c,'sine',84,38,t,.4,g);const k=GA(c,o,t,.001,.3*v,.04);NZ(c,'highpass',900,0,t,.05,k,.8)},
 nbell:(c,t,o,v)=>{const g=GA(c,o,t,.008,.22*v,2.6);PART(c,g,196,[[1,1],[2,.5],[2.4,.4],[3,.3],[4.2,.2]],t,2.7)},
 nwail:(c,t,o,v)=>{const g=GA(c,o,t,.5,.3*v,1),lp=LP(c,900,g);for(const[f,d]of[[130,0],[131,12]]){const s=OSC(c,'sawtooth',f,52,t,1.5,lp,d);VIB(c,s,t,1.5,6,26)}const n=GA(c,o,t,.6,.13*v,.8);NZ(c,'bandpass',900,240,t,1.4,n,2)},
 nbone:(c,t,o,v)=>{const n=GA(c,o,t,.002,.3*v,.08);NZ(c,'highpass',1500,0,t,.09,n,1);const b=GA(c,o,t,.002,.15*v,.12);OSC(c,'triangle',520,180,t,.14,b)},
 nwake:(c,t,o,v)=>{const g=GA(c,o,t,.5,.13*v,.9);for(const m of[1,1.5,2,3])OSC(c,'sine',440*m,0,t,1.5,g);const n=GA(c,o,t,.5,.06*v,.8);NZ(c,'highpass',3500,0,t,1.3,n,1)}
};
const ALIAS={bell:'nbell',scream:'nwail',pop:'nbone',pulse:'narr'};
function nsnd(c,t,out,k,v,dur,pan){k=ALIAS[k]||k;const F=SND[k];if(!F)return false;let dst=out;
 try{if(pan&&c.createStereoPanner){const sp=c.createStereoPanner();sp.pan.value=cl(pan,-1,1);sp.connect(out);dst=sp}}catch(e){}
 F(c,t,dst,v,dur);return true}
/* ═════════ el guion: qué hace el Necromancer en cada turno ═════════
   Todo sale de la semilla del encuentro + los espejos rotos que avisa el servidor, así que todos los clientes ven lo mismo. */
const NM={intro:'🪞 El Necromancer despierta',proy:'💀 Proyectil de la Muerte',legion:'🦴 Legión Condenada',salto:'🌀 Salto Dimensional',circulo:'⭕ Círculo de Condena',
 pacto:'🕯️ Pacto de las Sombras · ¡a las esquinas!',cA:'🕯️ Pacto · proyectiles y condena',cB:'🕯️ Pacto · doble salto',cC:'🕯️ Pacto · legión y condena',cD:'🕯️ Pacto · tormenta de espejos'};
const SEQ1=['proy','legion','salto','circulo'],PAIRS=[[0,1],[2,3],[0,2],[1,3]],seq1=[];
function mvOf(n,ph,j){
 if(ph===2){if(j===0)return'pacto';const i=j-1;return X.bag(['cA','cB','cC','cD'],Math.floor(i/4),13)[i%4]}
 if(n===0)return'intro';const i=n-1;if(seq1.seed!==A.seed){seq1.length=0;seq1.seed=A.seed}
 while(seq1.length<=i){const q=seq1.length;let m;
  if(q===0)m='proy';                                                    /* la primera es la más sencilla: así se aprende qué es el espejo que brilla */
  else{const c=SEQ1.filter(x=>x!==seq1[q-1]&&!(x==='legion'&&seq1[q-2]==='legion'));m=c[Math.floor(hh(A.seed,q,41)*c.length)]}   /* la legión, como mucho cada 3 turnos */
  seq1.push(m)}
 return seq1[i]}
/* qué espejos están activos: en fase 1 solo un par (el que elige la semilla); en fase 2, todos los que sigan enteros. Si romper espejos deja menos de 2, despiertan los dormidos */
const ORD=()=>{const o=[0,1,2,3];for(let i=3;i>0;i--){const j=Math.floor(hh(A.seed,i,52)*(i+1)),t=o[i];o[i]=o[j];o[j]=t}return o};
const deadAt=t=>{const d=[0,0,0,0];for(const e of A.mir)if(e.at<=t)d[e.k]=1;return d};
function actAt(s0,p2){const d=deadAt(s0);let L;
 if(p2)L=[0,1,2,3].filter(k=>!d[k]);
 else{L=PAIRS[Math.floor(hh(A.seed,0,51)*4)].filter(k=>!d[k]);if(L.length<2)for(const k of ORD()){if(L.length>=2)break;if(!d[k]&&L.indexOf(k)<0)L.push(k)}}
 return L}
const kP2=()=>A.p2?Math.round((A.p2-A.t0)/ST1):1e9;
const s0Of=n=>{const K=kP2();return n<K?A.t0+n*ST1:A.p2+(n-K)*ST2};
const PL={};let plKey='';
/* el plan de un turno: movimiento, espejo por el que sale (M), espejos de los saltos (m2, m3) y espejo en el que termina (E). Nunca repite el espejo donde terminó el turno anterior (si hay otro) */
function plan(n){const key=A.seed+':'+(A.mirV|0)+':'+(A.p2||0);if(key!==plKey){for(const q in PL)delete PL[q];plKey=key}
 if(PL[n])return PL[n];const K=kP2(),p2=n>=K,s0=s0Of(n),mv=mvOf(n,p2?2:1,p2?n-K:n),pl={n,s0,p2,mv,M:-1,m2:-1,m3:-1,E:-1};
 if(mv!=='intro'&&mv!=='pacto'){const prev=n>0?plan(n-1).E:-1,act=actAt(s0,p2),pk=(L,salt)=>L[Math.floor(hh(A.seed,n,salt)*L.length)];
  let c=act.filter(k=>k!==prev);if(!c.length)c=act;pl.M=pk(c,31);
  let o2=act.filter(k=>k!==pl.M);if(!o2.length)o2=act;pl.m2=pk(o2,32);
  let o3=act.filter(k=>k!==pl.M&&k!==pl.m2);if(!o3.length)o3=act.filter(k=>k!==pl.m2);if(!o3.length)o3=act;pl.m3=pk(o3,33);
  pl.E=mv==='salto'?pl.m3:(mv==='cB'||mv==='cD')?pl.m2:pl.M}
 return PL[n]=pl}
/* cuándo está el jefe fuera de cada espejo dentro del turno (ms desde el inicio del turno) y cuánto antes avisa el espejo */
function staysOf(pl){const L=pl.p2?800:1200,M=pl.M,m2=pl.m2,m3=pl.m3;
 switch(pl.mv){
  case'proy':case'legion':case'circulo':return[{k:M,a:0,b:4300,lead:L}];
  case'salto':return[{k:M,a:0,b:1500,lead:L},{k:m2,a:1700,b:3000,lead:620},{k:m3,a:3200,b:4300,lead:620}];
  case'cA':case'cC':return[{k:M,a:0,b:3000,lead:L}];
  case'cB':return[{k:M,a:0,b:1100,lead:L},{k:m2,a:1250,b:3000,lead:600}];
  case'cD':return[{k:M,a:0,b:1500,lead:L},{k:m2,a:1650,b:3050,lead:600}];
  default:return[]}}
const srcL=k=>{const m=NEC.mir[k];return[m[0],m[1]-14]};                /* de dónde sale el proyectil que lanza el espejo k */
const legSpots=k=>{const m=NEC.mir[k];return[[m[0]-42,m[1]+56],[m[0]+42,m[1]+56]]};
function begin(tr){const n=tr.n,s=tr.s0,pl=plan(n),mv=pl.mv;
 tr.pl=pl;tr.ti=pickT(n,1);tr.stays=staysOf(pl);tr.imgs=null;tr.snd=[];tr.shake=[];tr.burst=null;tr.sdone=0;tr.bdone=0;tr.shd=0;
 A.hz=A.hz.filter(h=>h.te>sn()-300);
 const T1=tr.ti,T2=pickT(n,2),T3=pickT(n,3),S=tr.stays,M=pl.M,m2=pl.m2,m3=pl.m3;
 const snds=(u,k,v,d,pan)=>tr.snd.push([u,k,v,d,pan]);
 const sph=(ti,t0,k,dmg)=>HZ({k:'nsph',ti,from:k,t0:s+t0,tf:s+t0+3300,te:s+t0+3300,dmg:dmg||20,v:215,hom:1,r:15});
 const aim=(k,ti,a,b)=>HZ({k:'naim',mk:k,ti,t0:s+a,te:s+b,tf:0});
 const circ=(ti,tl,tf,R,dmg,i)=>{const ang=hh(A.seed,n,60+(i|0))*TAU,dd=i?55+hh(A.seed,n,70+i)*35:0;return HZ({k:'ncirc',ti,t0:s+tl-500,tl:s+tl,tf:s+tf,te:s+tf+800,R,dmg,ox:Math.cos(ang)*dd,oy:Math.sin(ang)*dd})};
 const vor=i=>HZ({k:'nvor',mk:S[i].k,t0:s+S[i].b-DS-120,te:s+S[i].b+520,tf:0});
 const pul=i=>HZ({k:'npuls',mk:S[i].k,t0:s+S[i].a-S[i].lead,tf:s+S[i].a+EM,te:s+S[i].a+EM+850,R:112,dmg:12});
 /* la pose: el jefe sale del cristal (EM ms), se queda y se disuelve en él (DS ms) */
 const PS=extra=>u=>{for(const st of S){if(u>=st.a-4&&u<st.b){const fi=cl((u-st.a)/EM,0,1),fo=1-cl((u-(st.b-DS))/DS,0,1),al=Math.min(ez(fi),ez(fo)),k=fi<1?ez(fi):fo<1?1-ez(fo):1,a=stand(st.k),b=inside(st.k),w=sway(u,st.k),
    r={p:[b[0]+(a[0]-b[0])*k+w[0]*k,b[1]+(a[1]-b[1])*k+w[1]*k],al,inv:al<.85};if(extra){const q=extra(u,st);if(q)Object.assign(r,q)}return r}}return{p:null,inv:1}};
 switch(mv){
 case'intro':{tr.pose=u=>{const k=ez(cl(u/1700,0,1)),al=ez(cl(u/1000,0,1))*(1-cl((u-3700)/500,0,1)),w=sway(u,0);
   return{p:[THR[0]+(CTR[0]-THR[0])*k+w[0],THR[1]+(CTR[1]-THR[1])*k+w[1]],al,inv:u<1300||u>3650,ch:u>1500&&u<3500?2:0}};
  HZ({k:'ring',x:CTR[0],y:CTR[1]+44,R:250,t0:s+300,te:s+1500,tf:0,c:'150,255,200'});
  snds(100,'nbell',.8);snds(300,'nemerge',.8);snds(1500,'nwake',.9);tr.shake=[[1500,5]];break}
 case'proy':{tr.pose=PS(u=>({ch:(u>=500&&u<1500)||(u>=1560&&u<2500)?1:0}));
  sph(T1,1500,M);sph(T2,2500,M);aim(M,T1,700,1500);aim(M,T2,1700,2500);
  snds(500,'nproj',1,1,panOf(M));snds(1500,'nshot',1,0,panOf(M));snds(1560,'nproj',.8,.9,panOf(M));snds(2500,'nshot',1,0,panOf(M));break}
 case'legion':{tr.pose=PS(u=>({ch:u>=450&&u<1900?2:0}));
  HZ({k:'nleg',mk:M,t0:s+650,tf:s+1100,te:s+1800});snds(500,'nlegion',1,0,panOf(M));tr.shake=[[1100,4]];break}
 case'salto':{tr.pose=PS(u=>({ch:(u>=480&&u<1150)||(u>=1980&&u<2650)?1:0}));
  vor(0);vor(1);pul(1);pul(2);tr.shake=[[S[1].a+EM,5],[S[2].a+EM,5]];break}
 case'circulo':{tr.pose=PS(u=>({ch:u>=400&&u<2200?2:0}));
  circ(T1,1100,2400,92,16,0);circ(T2,1600,2900,92,16,1);circ(T3,2100,3400,92,16,2);
  snds(900,'ncirc',.9,1.45,panOf(M));break}
 case'pacto':{tr.pose=u=>{const al=ez(cl(u/600,0,1))*(1-cl((u-2950)/380,0,1)),w=sway(u,2);return{p:[CTR[0]+w[0],CTR[1]+w[1]],al,inv:al<.85,ch:u>400&&u<2200?2:0}};
  actAt(s,true).forEach((k,i)=>HZ({k:'nbolt',mk:k,t0:s+700+i*170,te:s+1500+i*170,tf:0}));
  HZ({k:'ncirc',fix:CTR.slice(),t0:s+400,tl:s+400,tf:s+2100,te:s+2900,R:235,dmg:14,big:1,ox:0,oy:0});
  snds(60,'npact',1);snds(2100,'nboom',1);tr.shake=[[2100,10]];break}
 case'cA':{tr.pose=PS(u=>({ch:(u>=450&&u<950)||(u>=1250&&u<1750)?1:0}));
  sph(T1,950,M);sph(T2,1750,M);aim(M,T1,500,950);aim(M,T2,1300,1750);circ(T3,800,1900,90,16,0);
  snds(450,'nproj',.8,.5,panOf(M));snds(950,'nshot',1,0,panOf(M));snds(1250,'nproj',.8,.5,panOf(M));snds(1750,'nshot',1,0,panOf(M));snds(700,'ncirc',.7,1.2,panOf(M));break}
 case'cB':{tr.pose=PS(u=>({ch:u>=1700&&u<2100?1:0}));
  vor(0);pul(1);sph(T1,2100,m2);aim(m2,T1,1700,2100);circ(T2,1700,2700,90,16,0);tr.shake=[[S[1].a+EM,5]];
  snds(1700,'nproj',.8,.4,panOf(m2));snds(2100,'nshot',1,0,panOf(m2));snds(1700,'ncirc',.7,1.0,panOf(m2));break}
 case'cC':{tr.pose=PS(u=>({ch:u>=450&&u<1500?2:0}));
  HZ({k:'nleg',mk:M,t0:s+450,tf:s+850,te:s+1500});circ(T1,900,1800,90,16,0);circ(T2,1400,2300,90,16,1);
  snds(450,'nlegion',.9,0,panOf(M));snds(800,'ncirc',.7,1.0,panOf(M));break}
 case'cD':{tr.pose=PS(u=>({ch:(u>=500&&u<900)||(u>=1900&&u<2300)?1:0}));
  vor(0);sph(T1,900,M);aim(M,T1,500,900);HZ({k:'nsigm',mk:m3,t0:s+1450,te:s+1900,tf:0});sph(T3,1900,m3);sph(T2,2300,m2);aim(m2,T2,1900,2300);
  snds(500,'nproj',.8,.4,panOf(M));snds(900,'nshot',1,0,panOf(M));snds(1450,'nsig',.9,0,panOf(m3));snds(1900,'nshot',.9,0,panOf(m3));snds(1900,'nproj',.8,.4,panOf(m2));snds(2300,'nshot',1,0,panOf(m2));break}
 default:tr.pose=u=>({p:null,inv:1})}
 /* sonidos comunes: salida del espejo, llegada tras un salto y disolución */
 for(let i=0;i<S.length;i++){snds(S[i].a+40,i?'narr':'nemerge',i?.8:.9,0,panOf(S[i].k));snds(S[i].b-DS,'nleap',i<S.length-1?.8:.4,0,panOf(S[i].k))}
 return tr}
/* ═════════ peligros propios: esfera, círculo, pulso de llegada, descarga del espejo roto y legión ═════════ */
const shk=v=>{try{SHK=Math.max(SHK,v)}catch(e){}};
const clampW=(x,y)=>{const a=X.arena();return a?[cl(x,a[0]*T+40,(a[0]+a[2])*T-40),cl(y,a[1]*T+80,(a[1]+a[3])*T-60)]:[x,y]};
function popSph(h){const n=h.why==='fin'?10:26,v=cl(1-Math.hypot(P.x-h.x,P.y-h.y)/720,.2,1);
 for(let i=0;i<n;i++){const a=Math.random()*TAU,sp=40+Math.random()*130;pt(h.x,h.y,Math.cos(a)*sp,Math.sin(a)*sp,.45+Math.random()*.5,Math.random()<.5?'160,100,255':'110,255,180',2+(Math.random()*2|0))}
 if(h.why!=='fin')snd('nimp',(h.why==='golpe'?1:.7)*v);if(h.why==='golpe')shk(7)}
function spawnLegion(spots){const need=2-A.fol.filter(e=>!e.dead).length;if(need<=0)return 0;let n=0;
 for(let i=0;i<spots.length&&n<need;i++,n++){const w=W2(spots[i]),c=clampW(w[0],w[1]);
  const e=X.mkEnt({fol:1,nm:'Condenado',v:'mjGua',_mjs:1.06,nv:Math.max(1,(A.lv||75)-8),mx:6,hp:6,fhp:6,x:c[0],y:c[1],al:0,hide:1,born:performance.now(),cd:0,dir:'down'});
  A.fol.push(e);for(let k=0;k<16;k++){const a=Math.random()*TAU;pt(c[0]+Math.cos(a)*18,c[1]+22+Math.sin(a)*8,Math.cos(a)*30,-20-Math.random()*40,.6+Math.random()*.5,Math.random()<.5?'110,255,180':'180,120,255',2)}}
 X.addEnts();return n}
function killFol(e,quiet){if(e.dead)return;e.dead=1;
 if(!quiet){for(let k=0;k<24;k++){const a=Math.random()*TAU,v=40+Math.random()*100;pt(e.x,e.y+10,Math.cos(a)*v,Math.sin(a)*v-20,.5+Math.random()*.5,Math.random()<.5?'235,235,215':'110,255,180',2+(Math.random()*2|0))}snd('pop',.9)}
 let i=E.indexOf(e);if(i>=0)E.splice(i,1);i=NR.indexOf(e);if(i>=0)NR.splice(i,1);i=A.fol.indexOf(e);if(i>=0)A.fol.splice(i,1)}
function hitFol(e,dm){if(e.dead||e.al<.6)return;e.fhp-=1;e._hf=performance.now();
 try{if(FT.length<60)FT.push({x:e.x,y:e.y-30,t:.6,d:0,o:0,k:'dm',s:e.fhp>0?'💀':'☠️',c:'#9dffc7'})}catch(x){}
 if(e.fhp<=0)killFol(e,0)}
/* los condenados: tardan en levantarse, te persiguen despacio, rodean los pilares, duran 11 s y caen con 6 golpes. Cada cliente simula los suyos (el daño es de cada héroe) */
function folStep(dt,pn){const L=A.fol;if(!L.length)return;const off=A.fell||A.done||A.quit;
 for(let i=L.length-1;i>=0;i--){const e=L[i];if(e.dead)continue;const age=(pn-e.born)/1000,life=11;let al=cl(age/.8,0,1);
  if(age>life-.7)al=Math.min(al,cl((life-age)/.7,0,1));
  if(off){if(!e.offT)e.offT=pn;al=Math.min(al,cl(1-(pn-e.offT)/600,0,1))}
  if(age>=life||(off&&al<=0)){killFol(e,1);continue}
  e.al=al;e.hide=al<.6?1:0;
  if(age>.8){const dx=P.x-e.x,dy=P.y-(e.y+6),d=Math.hypot(dx,dy)||1,sp=d>26&&!off?82:0;let nx=e.x+dx/d*sp*dt,ny=e.y+dy/d*sp*dt;
   for(const p of pillars()){const px=nx-p[0],py=ny+6-p[1],dd=Math.hypot(px,py)||1;if(dd<X.PR+12){nx=p[0]+px/dd*(X.PR+12);ny=p[1]+py/dd*(X.PR+12)-6}}
   const c=clampW(nx,ny);nx=c[0];ny=c[1];e._vx=(nx-e.x)/dt;e._vy=(ny-e.y)/dt;e.x=nx;e.y=ny;
   e.dir=Math.abs(dx)>Math.abs(dy)*1.15?(dx>0?'right':'left'):(dy>0?'down':'up');
   if(!off&&canHurt()&&al>=.99&&d<30&&pn>e.cd){e.cd=pn+1200;hurt(8,0)}}
  e.hp=Math.max(1,e.fhp);e.mx=6;
  if(Math.random()<dt*10)pt(e.x+(Math.random()-.5)*20,e.y+14+Math.random()*20,0,-18-Math.random()*20,.7,'110,255,180',2)}}
function evalHz(h,t){const k=h.k;
 if(k==='nsph'){
  if(!h.arm&&!h.done&&t>=h.t0){if(t>h.te){h.done=1;return}const w=W2(srcL(h.from)),tp=posOf(h.ti)||[P.x,P.y];h.x=w[0];h.y=w[1];h.a=Math.atan2(tp[1]-h.y,tp[0]-h.x);h.lt=h.t0;h.arm=1;h.tr=[];h.n=0}
  if(h.arm&&!h.done){let guard=0;
   while(h.lt<t&&!h.done&&guard++<300){const d=Math.min(16,t-h.lt)/1000;h.lt+=d*1000;
    const tp=posOf(h.ti)||[P.x,P.y];let da=Math.atan2(tp[1]-h.y,tp[0]-h.x)-h.a;da=Math.atan2(Math.sin(da),Math.cos(da));h.a+=cl(da,-h.hom*d,h.hom*d);
    h.x+=Math.cos(h.a)*h.v*d;h.y+=Math.sin(h.a)*h.v*d;if((h.n++&1)===0){h.tr.push([h.x,h.y]);if(h.tr.length>12)h.tr.shift()}
    if(h.lt>=h.te||!inAr(h.x,h.y)){h.done=1;h.pop=t;h.why='fin';break}
    let blk=false;for(const p of pillars()){if(Math.hypot(h.x-p[0],h.y-p[1])<X.PR+h.r-3){blk=true;break}}
    if(blk){h.done=1;h.pop=t;h.why='pilar';break}
    if(canHurt()&&Math.hypot(P.x-h.x,P.y-h.y)<h.r+11){h.done=1;h.pop=t;h.why='golpe';hurt(h.dmg,0);break}
    if(h.ti!==P.name&&Math.hypot(tp[0]-h.x,tp[1]-h.y)<h.r+11){h.done=1;h.pop=t;h.why='otro';break}}
   if(h.done&&h.pop)popSph(h)}
  return}
 if(k==='ncirc'){
  if(!h.pos&&t>=h.tl){if(t>h.tf+300){h.done=1;return}
   if(h.fix){const w=W2(h.fix);h.px=w[0];h.py=w[1]}else{const tp=posOf(h.ti)||[P.x,P.y],c=clampW(tp[0]+h.ox,tp[1]+h.oy);h.px=c[0];h.py=c[1]}h.pos=1}
  if(h.pos&&!h.done&&t>=h.tf){h.done=1;if(t-h.tf<500){if(canHurt()&&Math.hypot(P.x-h.px,P.y-h.py)<=h.R+10)hurt(h.dmg,0);shk(h.big?10:6);snd('nboom',h.big?1:.8*cl(1-Math.hypot(P.x-h.px,P.y-h.py)/800,.3,1));A.flash=performance.now()}}
  return}
 if(k==='npuls'){if(!h.done&&t>=h.tf){h.done=1;const w=W2(ringL(h.mk));h.wx=w[0];h.wy=w[1];if(t-h.tf<500){if(canHurt()&&Math.hypot(P.x-w[0],P.y-w[1])<=h.R+10)hurt(h.dmg,0);shk(5)}}return}
 if(k==='nmbk'){if(!h.done&&t>=h.tf){h.done=1;const w=W2(ringL(h.mk));h.wx=w[0];h.wy=w[1];
   if(t-h.tf<700){snd('nbreak',1);shk(9);A.flash=performance.now();const g0=W2([NEC.mir[h.mk][0],NEC.mir[h.mk][1]-92]);
    for(let i=0;i<46;i++){const a=Math.random()*TAU,sp=60+Math.random()*220;pt(g0[0]+(Math.random()-.5)*40,g0[1]+(Math.random()-.5)*90,Math.cos(a)*sp,Math.sin(a)*sp*.7-30,.5+Math.random()*.7,Math.random()<.5?'235,225,255':(Math.random()<.5?'160,110,255':'120,255,190'),2+(Math.random()*2|0))}
    if(canHurt()&&Math.hypot(P.x-w[0],P.y-w[1])<=h.R+10)hurt(h.dmg,0)}}return}
 if(k==='nleg'){if(!h.done&&t>=h.tf){h.done=1;if(t-h.tf<700)spawnLegion(legSpots(h.mk))}return}}
/* ═════════ dibujo de los peligros ═════════ */
function drawN(h,t,cx,cy,now,pn,dt){const k=h.k;
 if(k==='nsph'){
  if(!h.arm||h.done){if(h.done&&h.pop&&t-h.pop<380){const x=h.x-cx,y=h.y-cy,q=(t-h.pop)/380;g.save();g.globalCompositeOperation='lighter';g.lineWidth=3;g.strokeStyle='rgba(190,150,255,'+(1-q)+')';g.beginPath();g.arc(x,y,10+36*q,0,TAU);g.stroke();g.strokeStyle='rgba(120,255,190,'+(.8*(1-q))+')';g.beginPath();g.arc(x,y,6+20*q,0,TAU);g.stroke();g.restore()}return true}
  const x=h.x-cx,y=h.y-cy;if(x<-90||x>VW+90||y<-90||y>VH+90)return true;
  g.save();g.globalCompositeOperation='lighter';const tr=h.tr||[];
  for(let i=0;i<tr.length;i++){const q=tr[i],f=(i+1)/tr.length,r=h.r*(.4+.6*f),qx=q[0]-cx,qy=q[1]-cy,gr=g.createRadialGradient(qx,qy,1,qx,qy,r*1.8);gr.addColorStop(0,'rgba('+(i%2?'110,255,180':'150,90,255')+','+(.26*f).toFixed(3)+')');gr.addColorStop(1,'rgba(90,40,200,0)');g.fillStyle=gr;g.fillRect(qx-r*2,qy-r*2,r*4,r*4)}
  const pu=1+.1*Math.sin(pn/70+(h.t0%7)),R=h.r*pu*3,hg=g.createRadialGradient(x,y,2,x,y,R);hg.addColorStop(0,'rgba(150,90,255,.5)');hg.addColorStop(.5,'rgba(90,255,170,.16)');hg.addColorStop(1,'rgba(60,20,160,0)');g.fillStyle=hg;g.fillRect(x-R,y-R,R*2,R*2);g.restore();
  g.save();g.fillStyle='#06020e';g.beginPath();g.arc(x,y,h.r*pu,0,TAU);g.fill();g.strokeStyle='rgba(150,255,205,.95)';g.lineWidth=2;g.beginPath();g.arc(x,y,h.r*pu,0,TAU);g.stroke();
  g.strokeStyle='rgba(190,130,255,.8)';for(let i=0;i<3;i++){g.beginPath();g.arc(x,y,h.r*.7,pn/160+i*2.094,pn/160+i*2.094+1.2);g.stroke()}
  g.fillStyle='rgba(150,255,205,.95)';g.fillRect(Math.round(x-5),Math.round(y-3),3,4);g.fillRect(Math.round(x+2),Math.round(y-3),3,4);g.restore();
  if(Math.random()<dt*50)pt(h.x+(Math.random()-.5)*10,h.y+(Math.random()-.5)*10,(Math.random()-.5)*20,(Math.random()-.5)*20,.5,Math.random()<.5?'150,90,255':'90,255,170',2);
  return true}
 if(k==='ncirc'){if(t<h.t0||t>h.te)return true;let wx,wy;
  if(h.pos){wx=h.px;wy=h.py}else if(h.fix){const w=W2(h.fix);wx=w[0];wy=w[1]}else{const tp=posOf(h.ti);if(!tp)return true;const c=clampW(tp[0]+h.ox,tp[1]+h.oy);wx=c[0];wy=c[1]}
  const x=wx-cx,y=wy-cy,R=h.R;if(x<-R-120||x>VW+R+120||y<-R-300||y>VH+R+120)return true;
  if(t<h.tl){const p=cl((t-h.t0)/(h.tl-h.t0),0,1);g.save();g.strokeStyle='rgba(190,130,255,'+(.2+.25*p)+')';g.lineWidth=2;g.setLineDash([6,8]);g.lineDashOffset=-pn/60;g.beginPath();g.arc(x,y,R*(1.25-.25*p),0,TAU);g.stroke();g.restore();return true}
  if(t<h.tf){const p=cl((t-h.tl)/(h.tf-h.tl),0,1),rot=now*.8;g.save();g.translate(x,y);
   g.fillStyle='rgba(70,20,120,'+(.1+.18*p)+')';g.beginPath();g.arc(0,0,R,0,TAU);g.fill();g.globalCompositeOperation='lighter';
   g.fillStyle='rgba(90,255,170,'+(.05+.14*p+(p>.8?.1*Math.sin(pn/35):0))+')';g.beginPath();g.arc(0,0,R*p,0,TAU);g.fill();
   g.setLineDash([12,8]);g.lineDashOffset=-pn/40;g.lineWidth=3;g.strokeStyle='rgba(205,150,255,'+(.6+.3*p)+')';g.beginPath();g.arc(0,0,R,0,TAU);g.stroke();g.setLineDash([]);
   g.lineWidth=2;g.strokeStyle='rgba(150,255,205,'+(.55+.3*p)+')';g.beginPath();g.arc(0,0,R*.8,0,TAU);g.stroke();
   for(let i=0;i<8;i++){const a=rot+i*TAU/8;g.beginPath();g.moveTo(Math.cos(a)*R*.74,Math.sin(a)*R*.74);g.lineTo(Math.cos(a)*R*.88,Math.sin(a)*R*.88);g.moveTo(Math.cos(a+.12)*R*.8,Math.sin(a+.12)*R*.8);g.lineTo(Math.cos(a-.12)*R*.86,Math.sin(a-.12)*R*.86);g.stroke()}
   g.strokeStyle='rgba(190,130,255,'+(.5+.35*p)+')';g.beginPath();for(let i=0;i<=5;i++){const a=-rot*.6+i*TAU*2/5,px=Math.cos(a)*R*.62,py=Math.sin(a)*R*.62;i?g.lineTo(px,py):g.moveTo(px,py)}g.stroke();
   g.lineWidth=5;g.strokeStyle='rgba(120,255,190,'+(.7+(p>.8?.3*Math.sin(pn/50):0))+')';g.beginPath();g.arc(0,0,R+7,-1.5708,-1.5708+TAU*p);g.stroke();g.restore();
   if(Math.random()<dt*(20+50*p)){const a=Math.random()*TAU,d=R*Math.sqrt(Math.random());pt(wx+Math.cos(a)*d,wy+Math.sin(a)*d,0,-40-60*p,.6,Math.random()<.5?'150,255,200':'190,130,255',2)}
   return true}
  const q=cl((t-h.tf)/(h.te-h.tf),0,1);g.save();g.translate(x,y);g.globalCompositeOperation='lighter';
  const bh=250*(1-q*q),gr=g.createLinearGradient(0,-bh,0,0);gr.addColorStop(0,'rgba(150,90,255,0)');gr.addColorStop(.6,'rgba(150,255,205,'+(.5*(1-q))+')');gr.addColorStop(1,'rgba(235,255,245,'+(.8*(1-q))+')');g.fillStyle=gr;g.fillRect(-R*.55*(1-q*.5),-bh,R*1.1*(1-q*.5),bh);
  g.fillStyle='rgba(215,200,255,'+(.4*(1-q)*(1-q))+')';g.beginPath();g.arc(0,0,R,0,TAU);g.fill();g.lineWidth=4;g.strokeStyle='rgba(235,255,245,'+(.85*(1-q))+')';g.beginPath();g.arc(0,0,R*(1+.4*q),0,TAU);g.stroke();g.restore();return true}
 if(k==='npuls'){if(t<h.t0||t>h.te)return true;const w=h.wx!=null?[h.wx,h.wy]:W2(ringL(h.mk)),x=w[0]-cx,y=w[1]-cy;if(x<-200||x>VW+200||y<-200||y>VH+200)return true;
  g.save();g.translate(x,y);
  if(t<h.tf){const p=cl((t-h.t0)/(h.tf-h.t0),0,1);g.fillStyle='rgba(110,70,220,'+(.06+.14*p)+')';g.beginPath();g.arc(0,0,h.R,0,TAU);g.fill();g.globalCompositeOperation='lighter';
   g.strokeStyle='rgba(150,255,210,'+(.5+.4*p)+')';g.lineWidth=3;g.setLineDash([9,7]);g.lineDashOffset=-pn/45;g.beginPath();g.arc(0,0,h.R,0,TAU);g.stroke();g.setLineDash([]);g.strokeStyle='rgba(190,130,255,'+(.4+.4*p)+')';g.beginPath();g.arc(0,0,h.R*p,0,TAU);g.stroke()}
  else{const q=cl((t-h.tf)/(h.te-h.tf),0,1);g.globalCompositeOperation='lighter';g.fillStyle='rgba(205,190,255,'+(.4*(1-q)*(1-q))+')';g.beginPath();g.arc(0,0,h.R,0,TAU);g.fill();g.lineWidth=5;g.strokeStyle='rgba(235,225,255,'+(.9*(1-q))+')';g.beginPath();g.arc(0,0,h.R*(.6+.7*q),0,TAU);g.stroke()}
  g.restore();return true}
 if(k==='nmbk'){if(t<h.t0||t>h.te)return true;const w=W2(ringL(h.mk)),x=w[0]-cx,y=w[1]-cy;if(x<-240||x>VW+240||y<-340||y>VH+240)return true;
  g.save();g.translate(x,y);
  if(t<h.tf){const p=cl((t-h.t0)/Math.max(1,h.tf-h.t0),0,1);g.fillStyle='rgba(255,60,100,'+(.05+.12*p)+')';g.beginPath();g.arc(0,0,h.R,0,TAU);g.fill();g.globalCompositeOperation='lighter';
   g.lineWidth=3;g.strokeStyle='rgba(255,110,140,'+(.5+.3*Math.sin(pn/40)+.3*p)+')';g.setLineDash([10,6]);g.lineDashOffset=pn/35;g.beginPath();g.arc(0,0,h.R,0,TAU);g.stroke();g.setLineDash([]);
   g.strokeStyle='rgba(235,200,255,'+(.4+.4*p)+')';g.lineWidth=2;for(let i=0;i<3;i++){g.beginPath();let px=0,py=-126;g.moveTo(px,py);for(let j=0;j<6;j++){px+=(Math.random()-.5)*34;py+=22+Math.random()*12;g.lineTo(px,py)}g.stroke()}}
  else{const q=cl((t-h.tf)/(h.te-h.tf),0,1);g.globalCompositeOperation='lighter';g.fillStyle='rgba(225,205,255,'+(.5*(1-q)*(1-q))+')';g.beginPath();g.arc(0,0,h.R,0,TAU);g.fill();g.lineWidth=6;g.strokeStyle='rgba(245,235,255,'+(.9*(1-q))+')';g.beginPath();g.arc(0,0,h.R*(.5+.8*q),0,TAU);g.stroke();
   g.lineWidth=3;g.strokeStyle='rgba(120,255,190,'+(.7*(1-q))+')';g.beginPath();g.arc(0,0,h.R*(.3+.6*q),0,TAU);g.stroke()}
  g.restore();return true}
 if(k==='nleg'){if(t<h.t0||t>h.te)return true;const p=cl((t-h.t0)/(h.tf-h.t0),0,1),q=t>=h.tf?cl((t-h.tf)/(h.te-h.tf),0,1):0;
  for(const s of legSpots(h.mk)){const w=W2(s),x=w[0]-cx,y=w[1]-cy;if(x<-60||x>VW+60||y<-60||y>VH+60)continue;g.save();g.translate(x,y+20);g.scale(1,.6);g.globalCompositeOperation='lighter';
   g.strokeStyle='rgba(120,255,185,'+(.65*(1-q))+')';g.lineWidth=3;g.beginPath();g.arc(0,0,22+10*p,0,TAU);g.stroke();g.rotate(pn/300);g.strokeStyle='rgba(190,130,255,'+(.7*(1-q))+')';
   for(let i=0;i<6;i++){g.beginPath();g.moveTo(Math.cos(i*1.047)*14,Math.sin(i*1.047)*14);g.lineTo(Math.cos(i*1.047)*24,Math.sin(i*1.047)*24);g.stroke()}g.restore()}
  return true}
 if(k==='naim'){if(t<h.t0||t>h.te)return true;const o=W2(srcL(h.mk)),tp=posOf(h.ti);if(!tp)return true;const p=cl((t-h.t0)/(h.te-h.t0),0,1);
  g.save();g.globalCompositeOperation='lighter';g.setLineDash([5,9]);g.lineDashOffset=-pn/30;g.strokeStyle='rgba(170,120,255,'+(.18+.3*p)+')';g.lineWidth=2;g.beginPath();g.moveTo(o[0]-cx,o[1]-cy);g.lineTo(tp[0]-cx,tp[1]-cy);g.stroke();g.setLineDash([]);
  g.strokeStyle='rgba(150,255,205,'+(.3+.4*p)+')';g.beginPath();g.arc(tp[0]-cx,tp[1]-cy,18-6*p,0,TAU);g.stroke();g.restore();return true}
 if(k==='nvor'){if(t<h.t0||t>h.te)return true;const w=W2(ringL(h.mk)),x=w[0]-cx,y=w[1]-cy;if(x<-120||x>VW+120||y<-120||y>VH+120)return true;
  const p=cl((t-h.t0)/(h.te-h.t0),0,1),R=62*(.45+.55*Math.min(1,p*1.6)),al=Math.min(1,p*3)*(p>.85?(1-p)*6.6:1);g.save();g.translate(x,y);g.scale(1,.55);
  g.fillStyle='rgba(20,5,45,'+(.55*al)+')';g.beginPath();g.arc(0,0,R,0,TAU);g.fill();g.lineWidth=2;g.strokeStyle='rgba(190,140,255,'+(.8*al)+')';g.beginPath();g.arc(0,0,R,0,TAU);g.stroke();
  for(let i=0;i<4;i++){g.beginPath();for(let s=0;s<=1.001;s+=.08){const th=-now*5+i*1.5708+s*3,r=R*(.1+.9*s),px=Math.cos(th)*r,py=Math.sin(th)*r;s?g.lineTo(px,py):g.moveTo(px,py)}g.strokeStyle='rgba(130,255,190,'+(.55*al)+')';g.stroke()}
  g.restore();return true}
 if(k==='nbolt'){if(t<h.t0||t>h.te)return true;const m=NEC.mir[h.mk],a=W2([m[0],m[1]-92]),B0=A.boss;if(!B0||B0.x<-9000)return true;const p=cl((t-h.t0)/(h.te-h.t0),0,1),fa=Math.sin(p*Math.PI);
  g.save();g.globalCompositeOperation='lighter';
  for(let pass=0;pass<2;pass++){g.strokeStyle=pass?'rgba(235,255,245,'+(.8*fa)+')':'rgba(110,255,185,'+(.55*fa)+')';g.lineWidth=pass?1.5:4;g.beginPath();const N=9;
   for(let i=0;i<=N;i++){const f=i/N,jx=i&&i<N?(Math.random()-.5)*26:0,jy=i&&i<N?(Math.random()-.5)*26:0,px=a[0]+(B0.x-a[0])*f+jx-cx,py=a[1]+(B0.y-a[1])*f+jy-cy;i?g.lineTo(px,py):g.moveTo(px,py)}g.stroke()}
  g.restore();return true}
 if(k==='nsigm')return true;
 return false}
/* ═════════ el jefe y los condenados ═════════ */
const C3={1:1,2:0,3:2},DIRS={down:0,left:1,right:2,up:3};
function spr(F,dir,fr,x,y,sc,gl){const w=F.fw*sc,h=F.fh*sc,col=C3[fr]!=null?C3[fr]:1,row=DIRS[dir]||0,x0=Math.round(x-w/2),y0=Math.round(y+13-h);
 const sm=g.imageSmoothingEnabled;g.imageSmoothingEnabled=true;
 if(!gl)g.drawImage(F.cv,col*F.fw,row*F.fh,F.fw,F.fh,x0,y0,w,h);
 else{const n=12,sh=F.fh/n,pn=performance.now();for(let i=0;i<n;i++){const off=Math.sin(i*1.7+pn/55)*gl*(1+(i%3)*.5);g.drawImage(F.cv,col*F.fw,row*F.fh+i*sh,F.fw,sh,Math.round(x0+off),Math.round(y0+i*h/n),w,Math.ceil(h/n)+1)}}
 g.imageSmoothingEnabled=sm}
function drawFol(e,cx,cy){if(e.x<-9000||e.al<=.02)return;const x=e.x-cx,y=e.y-cy;if(x<-90||x>VW+90||y<-110||y>VH+90)return;
 const pn=performance.now(),rise=cl((pn-e.born)/800,0,1),spd=Math.hypot(e._vx||0,e._vy||0),dir=e.dir||'down',fr=spd>20?(Math.floor(pn/170)%2?2:3):1,nm='mj1-'+dir+'-'+fr,yy=y+30+(1-ez(rise))*22;
 g.fillStyle='rgba(0,0,0,'+(.3*e.al).toFixed(2)+')';g.beginPath();g.ellipse(x,y+40,18,6,0,0,TAU);g.fill();
 g.save();g.globalAlpha=e.al*(.55+.45*rise);MJ.cur=e;MJ.sp(nm,x,yy,2);g.restore();
 g.save();g.globalCompositeOperation='lighter';g.globalAlpha=e.al*.22;MJ.cur=e;MJ.sp(nm,x,yy,2);g.restore();
 if(e._hf&&pn-e._hf<110){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=e.al*.6*(1-(pn-e._hf)/110);MJ.cur=e;MJ.sp(nm,x,yy,2);g.restore()}
 if(e.al>.6){const w=26,f=cl(e.fhp/6,0,1);g.fillStyle='rgba(0,0,0,.6)';g.fillRect(x-w/2-1,y-14,w+2,5);g.fillStyle=f>.4?'#7dffb8':'#ff6a82';g.fillRect(x-w/2,y-13,w*f,3)}}
function draw1(e,cx,cy,now){
 if(e.fol){drawFol(e,cx,cy);return true}
 if(e.ill)return true;
 if(e.x<-9000||e.al<=.02)return true;const x=e.x-cx,y=e.y-cy;if(x<-190||x>VW+190||y<-210||y>VH+150)return true;
 const pn=performance.now(),F=MJ.FAMS[4];if(!F||!F.cv)return true;const al=e.al,hov=Math.sin(pn/430)*3-6,sc=F.sc*(e._mjs||1);
 g.fillStyle='rgba(0,0,0,'+(.34*al).toFixed(2)+')';g.beginPath();g.ellipse(x,y+42,24+hov*.3,7,0,0,TAU);g.fill();
 {g.save();g.globalCompositeOperation='lighter';const r=84,yy=y+6+hov,gr=g.createRadialGradient(x,yy,6,x,yy,r);gr.addColorStop(0,'rgba(170,130,255,'+(.26*al).toFixed(3)+')');gr.addColorStop(.55,'rgba(90,255,170,'+(.08*al).toFixed(3)+')');gr.addColorStop(1,'rgba(60,20,160,0)');g.fillStyle=gr;g.fillRect(x-r,yy-r,r*2,r*2);g.restore()}
 if(e.ch){g.save();g.globalCompositeOperation='lighter';const k=.6+.4*Math.sin(pn/60);
  if(e.ch===2){g.save();g.translate(x,y+40);g.scale(1,.45);g.strokeStyle='rgba(130,255,190,'+(.7*k)+')';g.lineWidth=3;g.beginPath();g.arc(0,0,58,0,TAU);g.stroke();g.rotate(pn/400);g.strokeStyle='rgba(190,130,255,.7)';for(let i=0;i<6;i++){g.beginPath();g.arc(0,0,40,i*1.047,i*1.047+.6);g.stroke()}g.restore();
   const r=95,gr=g.createRadialGradient(x,y,6,x,y,r);gr.addColorStop(0,'rgba(120,255,190,'+(.3*k)+')');gr.addColorStop(1,'rgba(90,60,200,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}
  else{const r=14+6*k,sx=x,sy=y-6,gr=g.createRadialGradient(sx,sy,2,sx,sy,r*2.4);gr.addColorStop(0,'rgba(200,160,255,'+(.55*k)+')');gr.addColorStop(1,'rgba(90,40,200,0)');g.fillStyle=gr;g.fillRect(sx-r*2.4,sy-r*2.4,r*4.8,r*4.8);g.globalCompositeOperation='source-over';g.fillStyle='rgba(5,0,12,.85)';g.beginPath();g.arc(sx,sy,r*.7,0,TAU);g.fill()}
  g.restore()}
 const dir=e.dir||'down',fr=e.ch?(Math.floor(pn/220)%2?2:3):1,gl=al<.95?(1-al)*9:0;
 if(al<.95&&al>.05){g.save();g.globalAlpha=al*.3;spr(F,dir,fr,x-6,y+30+hov,sc,gl*1.4);spr(F,dir,fr,x+6,y+30+hov,sc,gl*1.4);g.restore()}
 g.save();g.globalAlpha=al;spr(F,dir,fr,x,y+30+hov,sc,gl);g.restore();
 g.save();g.globalCompositeOperation='lighter';g.globalAlpha=al*.15;spr(F,dir,fr,x,y+30+hov,sc,gl);g.restore();
 if(e._hf&&pn-e._hf<110){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=al*.55*(1-(pn-e._hf)/110);spr(F,dir,fr,x,y+30+hov,sc,0);g.restore()}
 return true}
/* flechas en el borde de la pantalla: hacia el espejo que va a usarse (verde) y hacia el jefe, cuando quedan fuera de cuadro */
function arrow(x,y,col,pn,s){const ex=cl(x,40,VW-40),ey=cl(y,76,VH-110);if(ex===x&&ey===y)return;const a=Math.atan2(y-ey,x-ex),k=.65+.35*Math.sin(pn/90);
 g.save();g.translate(ex,ey);g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(0,0,2,0,0,46*s);gr.addColorStop(0,'rgba('+col+','+(.38*k)+')');gr.addColorStop(1,'rgba('+col+',0)');g.fillStyle=gr;g.fillRect(-46*s,-46*s,92*s,92*s);
 g.rotate(a);g.fillStyle='rgba('+col+','+(.85*k)+')';g.beginPath();g.moveTo(17*s,0);g.lineTo(-8*s,-11*s);g.lineTo(-3*s,0);g.lineTo(-8*s,11*s);g.closePath();g.fill();g.restore()}
function edges(cx,cy,pn){if(!A.tr||!A.tr.pl||A.done)return;
 for(let k=0;k<4;k++){const s=mstate(k);if(!s||s.m!=='sig')continue;const w=W2(ringL(k));arrow(w[0]-cx,w[1]-cy-70,'110,255,175',pn,1)}
 const B0=A.boss;if(B0&&B0.x>-9000&&B0.al>.5)arrow(B0.x-cx,B0.y-cy,'190,140,255',pn,.8)}
/* ═════════ estado de cada espejo (lo dibuja mjc8.js) ═════════ */
function mstate(k){
 if(!(A.on&&A.b==='nec'))return null;const t=sn();
 if(A.done&&A.res&&!A.res.lost){const ev0=A.mir.find(x=>x.k===k);if(ev0&&t>=ev0.at)return{m:'dead',p:1};const el=Date.now()-(A.doneAt||Date.now())-k*320;return el<0?{m:'brk',p:.6}:el<500?{m:'brk',p:.6+el/500*.4}:{m:'dead',p:1}}
 const ev=A.mir.find(x=>x.k===k);if(ev)return t>=ev.at?{m:'dead',p:1}:{m:'brk',p:cl((t-ev.ts)/Math.max(1,ev.at-ev.ts),0,1)};
 const tr=A.tr;if(!tr||!tr.pl)return{m:'idle',p:0};const pl=tr.pl,s0=tr.s0;
 for(const h of A.hz)if(h.k==='nsigm'&&h.mk===k&&t>=h.t0&&t<h.te)return{m:'sig',p:0};
 let cool=null;
 for(const st of tr.stays){if(st.k!==k)continue;const a=s0+st.a,b=s0+st.b;
  if(t>=a&&t<b)return{m:'out',p:cl((t-a)/(b-a),0,1)};
  if(t>=a-st.lead&&t<a)return{m:'sig',p:0};
  if(t>=b&&t<b+1300)cool={m:'cool',p:1-(t-b)/1300}}
 if(cool)return cool;
 {const nx=plan(tr.n+1),st=staysOf(nx)[0];if(st&&st.k===k){const a=nx.s0+st.a;if(t>=a-st.lead&&t<a)return{m:'sig',p:0}}}
 if(tr.n>0){const pp=plan(tr.n-1);for(const st of staysOf(pp)){if(st.k===k){const b=pp.s0+st.b;if(t>=b&&t<b+1300)return{m:'cool',p:1-(t-b)/1300}}}}
 if(pl.mv==='pacto'||pl.mv==='intro'){const w0=s0+(pl.mv==='pacto'?300:1500)+k*160;if(t>=w0&&t<w0+1400)return{m:'wake',p:(t-w0)/1400}}
 if(!pl.p2&&actAt(s0,false).indexOf(k)<0)return{m:'dorm',p:0};
 return{m:'idle',p:0}}
/* ═════════ espejos rotos, consejos y el botón «Romper espejo» ═════════ */
const HT={};
function addMir(k,at,ts,by){if(A.mir.some(x=>x.k===k))return;ts=ts>0?ts:at-2000;A.mir.push({k,at,ts});A.mirV=(A.mirV|0)+1;
 if(at>sn()-200)HZ({k:'nmbk',mk:k,t0:ts,tf:at,te:at+1100,R:128,dmg:18});
 if(by){try{toast(by===P.name?'💥 Espejo roto: va a estallar, ¡aléjate!':'🪞 '+by+' rompe un espejo… ¡aléjate de él!',3800)}catch(e){}}
 try{A.hud(1)}catch(e){}}
function hints(tr,u){const mv=tr.pl.mv,say=(k,s,ms)=>{if(!HT[k]){HT[k]=1;try{toast(s,ms||6000)}catch(e){}}};
 if(mv==='proy'&&tr.n===1){if(u>250)say('sig','💡 El espejo que brilla en VERDE es por donde sale el Necromancer. Solo puedes dañarlo cuando está fuera del cristal.',7000);if(u>1900)say('sph','💡 La esfera te persigue pero gira despacio: rodea un pilar y se rompe.',6000)}
 if(mv==='circulo'&&u>1500)say('circ','💡 Sal del círculo antes de que se llene: el estallido sube como una columna de luz.',6000);
 if(mv==='legion'&&u>1500)say('leg','💡 Los condenados caen con 6 golpes, duran poco y no invocan más.',5500);
 if(mv==='salto'&&u>500)say('jmp','💡 El aro del suelo marca dónde aparecerá tras el salto: no te quedes ahí.',5500);
 if(mv==='pacto'&&u>200)say('pac','💡 ¡Corre a las esquinas, fuera del círculo grande!',5500)}
function frame(t,dt,pn,tr,u){
 folStep(dt,pn);if(!tr||!tr.pl)return;
 {const nx=plan(tr.n+1),st=staysOf(nx)[0];if(st){const a=nx.s0+st.a-st.lead,key=nx.n+':'+st.k;if(t>=a&&t<a+400&&tr.ping!==key){tr.ping=key;snd('nsig',1,0,panOf(st.k))}}}
 const B0=A.boss;if(B0&&B0.x>-9000&&B0.al>.2&&Math.random()<dt*24)pt(B0.x+(Math.random()-.5)*30,B0.y+8+Math.random()*30,(Math.random()-.5)*14,-14-Math.random()*26,.9+Math.random()*.7,Math.random()<.5?'150,255,200':'180,120,255',2);
 hints(tr,u)}
const cxel=$('ctx');let bMir=null;
function nearMir(){if(!(A.on&&A.b==='nec')||A.fell||A.done||A.quit||A.mir.length>=2||sn()-A.t0<3000)return-1;let best=-1,bd=1e9;
 for(let k=0;k<4;k++){if(A.mir.some(x=>x.k===k))continue;const w=W2(ringL(k)),d=Math.hypot(P.x-w[0],P.y-w[1]);if(d<118&&d<bd){bd=d;best=k}}return best}
async function breakMirror(){const k=nearMir();if(k<0||!bMir)return;bMir.disabled=true;try{const r=await mop('mb.mirror',{k,id:A.id,tok:A.tok});if(r&&r.ok&&r.at)addMir(k,r.at,sn(),P.name)}catch(e){}bMir.disabled=false}
setInterval(()=>{try{if(!bMir&&cxel){bMir=document.createElement('button');bMir.id='mjmirn';bMir.hidden=true;bMir.onclick=breakMirror;cxel.appendChild(bMir)}
 if(!bMir)return;const k=nearMir(),hide=typeof modal!=='undefined'&&modal;bMir.hidden=hide||k<0;
 if(!bMir.hidden){bMir.textContent='💥 Romper espejo ('+A.mir.length+'/2)';if(!HT.brk){HT.brk=1;toast('💡 Puedes romper hasta 2 espejos: el Necromancer tendrá menos salidas, pero el espejo estalla en energía: aléjate en cuanto lo rompas.',7000)}}}catch(e){}},180);
/* ═════════ perfil del Necromancer ═════════ */
const css=document.createElement('style');
css.textContent='#mjab.nec .bar{border-color:#5b3d9a;box-shadow:0 0 14px rgba(150,100,255,.35)}#mjab.nec .bar u{background:linear-gradient(180deg,#c9a4ff,#6c3fc4 55%,#2f1a6e)}#mjab.nec .t i{color:#cdb6ff}'
+'#mjab.nec .t em{background:rgba(40,20,90,.88);border-color:#a384e8;color:#e3d6ff}#mjab.nec .t em.p2{background:rgba(70,20,140,.94);border-color:#c9a4ff;animation:mjnp 1s ease-in-out infinite}@keyframes mjnp{50%{box-shadow:0 0 12px 2px rgba(150,100,255,.85)}}'
+'body.mjnec #mjrv{background:radial-gradient(ellipse 75% 70% at 50% 52%,transparent 40%,rgba(50,0,100,.55) 100%)}body.mjnec #mjrf{background:radial-gradient(ellipse at center,rgba(220,235,255,.5),rgba(150,100,255,.25) 60%,transparent 100%)}'
+'#mjmirn{background:linear-gradient(180deg,#3a1f6a,#1d0f3d)!important;border-color:#a384e8!important}';
document.head.appendChild(css);
const cls=on=>{try{document.body.classList.toggle('mjnec',!!on)}catch(e){}};
PFS.nec={id:'nec',nm:'Necromancer',v:'mjNec',sc:1.18,spr:'mj4',st1:ST1,st2:ST2,NM,ills:0,nobp:1,cls:'nec',bc:['150,255,200','190,130,255'],hpal:'arc',
 pick:mvOf,begin,snd:nsnd,eval:evalHz,draw:drawN,draw1,frame,hitFol,ground:(cx,cy,now,pn)=>edges(cx,cy,pn),
 msg:m=>addMir(m.k,m.at,m.ts,m.by),
 init:m=>{cls(1);for(const x of(m.mir||[]))addMir(x[0],x[1],0,null)},
 reset:()=>{A.mirV=0;seq1.length=0;for(const q in PL)delete PL[q];plKey='';for(const q in HT)delete HT[q];cls(0)},
 leave:()=>{cls(0)},
 hudNm:'🪞 Necromancer',ph2:'FASE 2 · PACTO DE LAS SOMBRAS',dead:'Derrotado',won:'🏆 ¡Necromancer derrotado!',lost:'💀 El Necromancer ha ganado',exitBtn:'🚪 Salir del castillo',
 wake:'⚔️ ¡El Necromancer despierta!',back:'⚔️ Vuelves a la pelea contra el Necromancer',p2txt:'🕯️ ¡PACTO DE LAS SOMBRAS! Los espejos despiertan',
 turn:'🕯️ ¡Es tu turno! Confirma para bajar al Salón de los Espejos',vs:'el Necromancer',wait:'El Necromancer te espera en el Salón de los Espejos, en el nivel más hondo del Castillo Maldito.',
 noHall:'⚠️ No se pudo preparar el Salón. Entra al Castillo Maldito y baja hasta el último nivel.',
 R:{wonH:'🏆 ¡Necromancer derrotado!',wonP:'Los espejos del Salón se apagan uno a uno y el castillo vuelve a quedar en silencio.',none:'El Necromancer no dejó ningún botín esta vez.',lostH:'💀 El Necromancer ha ganado',out:'Saldrás del castillo en'}};
window.MJNF={mstate,plan,staysOf,actAt,mvOf,addMir,spawnLegion,SND,nsnd,legSpots,stand,inside,ringL,hitFol,folStep,dbg:{PL,seq1,HT}};
})();
/* ═══════════ v437 · MINI-JEFES (cliente) · parte 10: EL ARTE DEL BOSQUE DE LOS COLMILLOS (Velociraptor) ═══════════
   Igual que la mansión y el castillo: todo se hornea UNA VEZ en el navegador (no se agrega ningún archivo al paquete). Aquí no hay edificio: el interior es un BOSQUE VIVO de cuatro zonas
   (Senda de los Colmillos · Cañada de los Nidos · Colina de las Huellas · Claro del Depredador) hechas con el motor de interiores de Karez, a pantalla completa.
   · el suelo se pinta píxel a píxel (tierra, musgo, hojarasca, raíces, senderos de tierra pisada con huellas gigantes) con la paleta del Bosque de Jade del juego,
   · los árboles gigantes salen de los dibujos que el juego ya trae (roble, esbelto, arbustos, helechos, flores) teñidos de verde profundo; cada árbol sabe dónde está su tronco (sólido)
     y guarda su copa aparte para dibujarla ENCIMA de quien pase por detrás (y volverla translúcida cuando alguien está debajo),
   · troncos caídos, rocas con musgo, nidos con huevos, huesos, setas luminosas, marcas de garras y el nido-altar del Claro se dibujan aquí con la misma paleta.
   Lo que decide el servidor (presencia, turno, vida del jefe, premio) no cambia: aquí solo se ven y se pisan los lugares. */
(function(){
'use strict';
const H=window.MJH;if(!H||!H.K)return;
const K=H.K,mk=K.mk,rngf=K.rngf,cl=K.cl,tintSpr=K.tintSpr;
const RA=window.MJRA={};
/* ═════════ geometría compartida con el gestor (mjc12.js) y la pelea (mjc13.js) ═════════ */
const SZ={G:[46,30],'1':[46,30],'2':[46,30],S:[54,38]};            /* tamaño de cada escena (casillas) */
const POS={S:[0,0],G:[864,0],'1':[0,608],'2':[736,608]};             /* dónde vive cada escena dentro del atlas (px) */
RA.SZ=SZ;RA.POS=POS;RA.ATW=1600;RA.ATH=1088;
/* el Claro del Depredador: marco de la pelea [x,y,ancho,alto] en casillas de la escena (incluye el óvalo y el pasillo de la escalera) */
RA.FX=7;RA.FY=4;RA.FW=46;RA.FH=28;
RA.OV=[27,18,19.5,13.5];                                              /* óvalo del claro: centro y radios (casillas) */
RA.NEST=[27,18];RA.NESTR=[2.7,1.95];                                  /* nido-altar: centro y radios (casillas) · es sólido */
/* manchas de hierba alta [cx,cy,radio] (casillas, escena S): seis, repartidas en anillo alrededor del nido */
RA.PATCH=[[38.3,21,2.7],[29.1,26.4,2.7],[17.8,23.5,2.7],[15.7,15.2,2.7],[24.9,9.8,2.7],[36.2,12.6,2.7]];
/* obstáculos sólidos del claro [x,y,ancho,alto] (casillas): rocas, troncos y tocones que frenan la carga */
RA.OBS=[[35,25,3,2],[19,27,4,2],[11,19,3,2],[16,8,2,4],[31,7,3,2],[41,14,2,2],[23,12,2,2],[31,23,2,2]];
RA.ARR={street:[22,26],L:[4,14],R:[42,14]};                          /* llegadas (escena G) */
RA.FANGS=[[9,17,0,86],[17,6,1,74],[37,6,0,80],[44,25,1,72],[26,31,0,82],[9,25,0,68]];   /* colmillos gigantes clavados [casilla x, fila de la base, espejo, alto px] (sólidos) */
RA.SPAWNS=[[16,18],[17,18],[15,18],[18,18],[14,18],[19,18],[16,17],[17,17]];   /* casillas donde aparecen los peleadores (escena S) */
const rn=(R,a,b)=>a+R()*(b-a),ri=(R,a,b)=>Math.floor(a+R()*(b-a+1)),pick=(R,a)=>a[Math.floor(R()*a.length)%a.length];
const sstep=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)};
/* ═════════ ruido de valores (suelo con grano natural) ═════════ */
function mkNoise(seed){const p=new Float32Array(4096),R=rngf(seed);for(let i=0;i<4096;i++)p[i]=R();
 return(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),at=(a,b)=>p[(a&63)+((b&63)<<6)],a=at(xi,yi),b=at(xi+1,yi),c=at(xi,yi+1),d=at(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}}
const hash2=(x,y,s)=>{let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1274126177))|0;h=Math.imul(h^(h>>>13),1103515245);h^=h>>>16;return(h>>>0)/4294967296};
/* ═════════ rejilla de la escena: se talla un bosque macizo con claros y senderos ═════════ */
const grid=(w,h)=>{const a=[];for(let y=0;y<h;y++)a.push(new Array(w).fill('#'));return a};
const ell=(a,cx,cy,rx,ry,ch)=>{for(let y=0;y<a.length;y++)for(let x=0;x<a[0].length;x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry;if(dx*dx+dy*dy<=1)a[y][x]=ch||'.'}};
const rect=(a,x0,y0,x1,y1,ch)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(a[y]&&a[y][x]!=null)a[y][x]=ch||'.'};
const segD=(x,y,ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=l?cl(((x-ax)*dx+(y-ay)*dy)/l,0,1):0;return Math.hypot(x-ax-t*dx,y-ay-t*dy)};
const trailCarve=(a,t)=>{const p=t.pts;for(let y=0;y<a.length;y++)for(let x=0;x<a[0].length;x++){for(let i=0;i<p.length-1;i++)if(segD(x+.5,y+.5,p[i][0],p[i][1],p[i+1][0],p[i+1][1])<=t.hw){a[y][x]='.';break}}};
/* ═════════ definición de cada zona: claros, senderos, escaleras, obstáculos ═════════ */
/* cl: claros [cx,cy,rx,ry] · tr: senderos {pts,hw} · st: casillas de escalera [x0,y0,x1,y1,char] · ex: casillas de salida */
const DEF={
 G:{nm:'Senda de los Colmillos',amb:[104,124,108],
  cl:[[23,14.5,10.5,6.6],[6,14.5,4.2,3.4],[40,14.5,4.2,3.4],[9,6.2,4.6,3.2],[37,6.2,4.6,3.2],[8,23.2,4.6,3.4],[38,23.2,4.6,3.4],[23,25,3.2,3]],
  tr:[{pts:[[23,29],[23,22]],hw:2.4},{pts:[[12.5,14.5],[5,14.5]],hw:1.9},{pts:[[34,14.5],[42,14.5]],hw:1.9},{pts:[[16,9.5],[11,7]],hw:1.6},{pts:[[30,9.5],[35,7]],hw:1.6},{pts:[[16,19],[11,22]],hw:1.6},{pts:[[30,19],[35,22]],hw:1.6}],
  st:[[1,13,2,16,'U'],[43,13,44,16,'D']],ex:[21,28,25,28],rooms:[[41,12,44,17],[1,12,4,17]],
  trails:[{pts:[[23,29],[23,22]],hw:2},{pts:[[12.5,14.5],[5,14.5]],hw:1.6},{pts:[[34,14.5],[42,14.5]],hw:1.6},{pts:[[16,9.5],[11,7]],hw:1.2},{pts:[[30,9.5],[35,7]],hw:1.2},{pts:[[16,19],[11,22]],hw:1.2},{pts:[[30,19],[35,22]],hw:1.2},{pts:[[17,14.5],[29,14.5]],hw:2.2}],
  ob:[['totem',23,14,1,1],['pit',19,17,2,1],['rock',27,17,3,2],['trunk',29,9,2,2],['trunk',15,10,2,2],['rock',9,25,2,2],['stump',37,8,1,1],['rock',33,23,2,2],['log',8,5,1,3],['rock',40,4,2,2],['nest',20,25,2,2]]},
 '1':{nm:'Cañada de los Nidos',amb:[108,120,100],
  cl:[[5,23.5,4.2,3.6],[24,23,6.2,4.4],[20,9.5,7,4.6],[38.5,7,5.6,4],[36,22.5,5,3.8],[9.5,12.5,4.2,3.2]],
  tr:[{pts:[[8,23.5],[19,23.5]],hw:2.2},{pts:[[24,19],[22,13]],hw:2.2},{pts:[[27,9.5],[36,7.5]],hw:2.2},{pts:[[30,23],[32,22.5]],hw:2},{pts:[[14,10],[12,11.5]],hw:1.8}],
  st:[[1,22,2,25,'D'],[43,5,44,8,'U']],ex:null,rooms:[[1,21,4,26],[40,4,44,9]],
  trails:[{pts:[[8,23.5],[19,23.5]],hw:1.8},{pts:[[24,19],[22,13]],hw:1.8},{pts:[[27,9.5],[36,7.5]],hw:1.8},{pts:[[30,23],[32,22.5]],hw:1.6},{pts:[[14,10],[12,11.5]],hw:1.4}],
  ob:[['nest',21,22,2,2],['nest',26,24,2,2],['nest',17,8,2,2],['nest',22,11,2,2],['nest',38,5,2,2],['nest',35,21,2,2],['nest',8,11,2,2],['rock',28,21,2,2],['log',12,24,3,1],['rock',14,6,2,2],['rock',31,5,2,2],['rock',40,24,2,2],['trunk',24,7,2,2],['ribs',22,26,4,1],['ribs',31,9,4,1]]},
 '2':{nm:'Colina de las Huellas',amb:[108,120,106],
  cl:[[40.5,23.5,4.6,3.4],[26,22,4.2,3.2],[14.5,17,4.6,3.4],[10.5,7.5,7,4.6],[36,9.5,5,3.8]],
  tr:[{pts:[[36,23.5],[26,22]],hw:2},{pts:[[26,22],[18,19]],hw:2},{pts:[[18,19],[12,13]],hw:2},{pts:[[12,13],[10.5,8]],hw:2.2},{pts:[[30,20],[34.5,12]],hw:1.9}],
  st:[[43,22,44,25,'D']],ex:null,rooms:[[40,21,44,26]],
  trails:[{pts:[[36,23.5],[26,22]],hw:1.6},{pts:[[26,22],[18,19]],hw:1.6},{pts:[[18,19],[12,13]],hw:1.6},{pts:[[12,13],[10.5,8]],hw:1.8},{pts:[[30,20],[34.5,12]],hw:1.5}],
  ob:[['rock',24,20,3,2],['rock',15,15,2,2],['rock',34,8,3,2],['rock',38,11,2,2],['rock',8,5,3,2],['rock',13,9,2,2],['log',22,24,3,1],['trunk',31,23,2,2],['rock',38,21,2,2],['stump',16,20,1,1],['skull',14,9,3,2]]},
 S:{nm:'Claro del Depredador',amb:[112,126,106]}};
RA.DEF=DEF;
/* ═════════ pintores básicos (todo en píxeles del atlas: 16 por casilla) ═════════ */
const P=(c,col,x,y,w,h)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)};
const rr=(c,x,y,w,h,r)=>{r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath()};
const rgb=(r,g,b,a)=>a==null?'rgb('+(r|0)+','+(g|0)+','+(b|0)+')':'rgba('+(r|0)+','+(g|0)+','+(b|0)+','+a+')';
const shade=(c,x,y,rx,ry,a)=>{c.fillStyle='rgba(4,10,6,'+a+')';c.beginPath();c.ellipse(Math.round(x),Math.round(y),rx,ry,0,0,7);c.fill()};
/* copia con tinte (y escala entera/fraccionaria sin suavizar) de un dibujo del juego */
function prep(img,m,add,sc,flip){const w=Math.max(1,Math.round(img.width*(sc||1))),h=Math.max(1,Math.round(img.height*(sc||1))),c=mk(w,h),q=c.getContext('2d');q.imageSmoothingEnabled=false;if(flip){q.translate(w,0);q.scale(-1,1)}q.drawImage(img,0,0,w,h);if(m)tintSpr(q,0,0,w,h,m,add);return c}
/* ═════════ el suelo: tierra, musgo, hojarasca; los senderos son tierra pisada; lo macizo es sotobosque oscuro ═════════ */
const FL={open:[[30,52,28],[40,68,34],[52,84,40],[66,100,46],[82,116,52]],shut:[[12,24,16],[18,34,22],[24,44,28],[30,54,32]],dirt:[[78,60,38],[96,76,48],[114,92,58],[132,108,70],[66,50,32]],
 moss:[[60,98,44],[78,120,52]],leaf:[[150,96,34],[176,122,42],[120,70,26],[196,150,60]]};
function paintFloor(c,W,Hh,g,R,trails,o){o=o||{};const tw=W>>4,th=Hh>>4,id=c.createImageData(W,Hh),d=id.data,nA=mkNoise(R()*1e6|0),nB=mkNoise(R()*1e6|0),nC=mkNoise(R()*1e6|0),nD=mkNoise(R()*1e6|0);
 const open=new Float32Array(tw*th);for(let y=0;y<th;y++)for(let x=0;x<tw;x++)open[y*tw+x]=g[y][x]==='#'?0:1;
 const ox=(x,y)=>{const fx=x/16-.5,fy=y/16-.5,x0=Math.floor(fx),y0=Math.floor(fy),u=fx-x0,v=fy-y0,at=(a,b)=>open[cl(b,0,th-1)*tw+cl(a,0,tw-1)];return(at(x0,y0)*(1-u)+at(x0+1,y0)*u)*(1-v)+(at(x0,y0+1)*(1-u)+at(x0+1,y0+1)*u)*v};
 /* distancia a los senderos (en un tablero de 4 px, interpolada) */
 const segs=[];for(const t of trails)for(let i=0;i<t.pts.length-1;i++)segs.push([t.pts[i][0]*16,t.pts[i][1]*16,t.pts[i+1][0]*16,t.pts[i+1][1]*16,t.hw*16]);
 const gw=(W>>2)+2,gh=(Hh>>2)+2,pd=new Float32Array(gw*gh);for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){let b=1e9;for(const s of segs){const d0=segD(i*4,j*4,s[0],s[1],s[2],s[3])-s[4];if(d0<b)b=d0}pd[j*gw+i]=b}
 const pdAt=(x,y)=>{const fx=x/4,fy=y/4,x0=fx|0,y0=fy|0,u=fx-x0,v=fy-y0,a=pd[y0*gw+x0],b=pd[y0*gw+x0+1],c2=pd[(y0+1)*gw+x0],e=pd[(y0+1)*gw+x0+1];return(a*(1-u)+b*u)*(1-v)+(c2*(1-u)+e*u)*v};
 const pal=(L,t)=>{const k=cl(t,0,.9999)*(L.length-1),i=k|0,u=k-i,a=L[i],b=L[i+1];return[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u]};
 for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){
  const n=nA(x/23,y/23)*.55+nA(x/9+7,y/9+3)*.3+nA(x/3.7+1,y/3.7+9)*.15,m=nB(x/17+3,y/17+5)*.65+nB(x/6,y/6)*.35,dap=nC(x/38,y/30),gr=hash2(x,y,5)-.5;
  const op=sstep(.34,.66,ox(x,y)+(n-.5)*.5);
  let col=pal(FL.shut,n*.9+gr*.18),co=pal(FL.open,n*.78+gr*.14);
  /* musgo claro y claros de luz (manchas amarillentas donde entra el sol) */
  if(m>.58){const k=sstep(.58,.78,m)*.55,mm=FL.moss[n>.5?1:0];co=[co[0]+(mm[0]-co[0])*k,co[1]+(mm[1]-co[1])*k,co[2]+(mm[2]-co[2])*k]}
  const dl=sstep(.58,.8,dap)*(o.sun==null?.5:o.sun);co=[co[0]+36*dl,co[1]+34*dl,co[2]+6*dl];
  col=[col[0]+(co[0]-col[0])*op,col[1]+(co[1]-col[1])*op,col[2]+(co[2]-col[2])*op];
  /* sendero de tierra pisada */
  const pe=pdAt(x,y)+(nD(x/5,y/5)-.5)*5+(nD(x/13+4,y/13)-.5)*7;
  if(pe<2.5){const dt=pal(FL.dirt,nD(x/7+9,y/7)*.7+gr*.28+(pe<-6?.08:0)),k=sstep(2.5,-1.5,pe);col=[col[0]+(dt[0]-col[0])*k,col[1]+(dt[1]-col[1])*k,col[2]+(dt[2]-col[2])*k]}
  const i=(y*W+x)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255}
 c.putImageData(id,0,0);
 return{pdAt,open:ox}}
/* ═════════ pequeños detalles de suelo (mismos trazos que el resto del juego: pocos píxeles, mucha intención) ═════════ */
function tuft(c,x,y,R,col,hh){c.strokeStyle=col;c.lineWidth=1;c.beginPath();for(let i=-1;i<=1;i++){c.moveTo(x+i*1.6,y);c.lineTo(x+i*2.4+(R()-.5)*2,y-hh*(i?.72:1))}c.stroke()}
function leaves(c,x0,y0,w,h,n,R){for(let i=0;i<n;i++){const k=FL.leaf[ri(R,0,3)];P(c,rgb(k[0],k[1],k[2]),x0+R()*w,y0+R()*h,2,1)}}
function pebbles(c,x,y,n,R){for(let i=0;i<n;i++){const px=x+(R()-.5)*14,py=y+(R()-.5)*8,s=ri(R,2,3);P(c,'#3c443e',px,py+1,s+1,s);P(c,'#7a8478',px,py,s,s-1);P(c,'#a8b0a0',px,py,1,1)}}
function mush(c,x,y,R,glow){const s=ri(R,2,4),cap=glow?['#58d6c8','#8af0e0']:R()<.5?['#b84a3a','#e07a5a']:['#c8b090','#e8d8b8'];P(c,'#d8d0b0',x,y-s,1,s);c.fillStyle=cap[0];c.beginPath();c.ellipse(x+.5,y-s,s*.9+1,s*.55+.5,0,Math.PI,0);c.fill();P(c,cap[1],x-s*.4,y-s-1,1,1);if(!glow&&R()<.6)P(c,'#fff4e0',x+1,y-s-1,1,1)}
function fernP(c,x,y,R,col,len){c.strokeStyle=col;c.lineWidth=1;for(let i=-3;i<=3;i++){const a=-Math.PI/2+i*.4+(R()-.5)*.2,l=len*(1-Math.abs(i)*.1);c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.cos(a)*l*.6,y+Math.sin(a)*l*.7-2,x+Math.cos(a)*l,y+Math.sin(a)*l+Math.abs(i)*.6);c.stroke()}}
/* huella gigante de tres dedos (la del Velociraptor: 20 px de largo en el atlas): dedos, garras y borde levantado */
function print(c,x,y,a,s,R){c.save();c.translate(x,y);c.rotate(a);c.scale(s,s);
 const toe=(dx,l,w)=>{c.fillStyle='rgba(28,18,10,.62)';c.beginPath();c.ellipse(dx,-l/2,w,l/2,dx*.04,0,7);c.fill();c.fillStyle='rgba(176,148,100,.22)';c.beginPath();c.ellipse(dx-.8,-l/2-.6,w*.7,l/2*.86,dx*.04,0,7);c.fill();c.fillStyle='rgba(20,12,6,.8)';c.beginPath();c.moveTo(dx-w*.6,-l);c.lineTo(dx,-l-4);c.lineTo(dx+w*.6,-l);c.closePath();c.fill()};
 toe(-5.5,9,2.1);toe(0,12,2.4);toe(5.5,9,2.1);c.fillStyle='rgba(28,18,10,.55)';c.beginPath();c.ellipse(0,1.5,4.2,3.2,0,0,7);c.fill();c.fillStyle='rgba(176,148,100,.18)';c.beginPath();c.ellipse(-.6,1,3,2.2,0,0,7);c.fill();c.restore()}
/* huesos sueltos */
function bones(c,x,y,R,k){c.save();c.translate(x,y);c.rotate((R()-.5)*1.2);
 if(k===0){c.strokeStyle='#d8d0b8';c.lineWidth=2;c.beginPath();c.moveTo(-6,0);c.lineTo(6,0);c.stroke();P(c,'#d8d0b8',-8,-2,3,2);P(c,'#d8d0b8',-8,1,3,2);P(c,'#d8d0b8',5,-2,3,2);P(c,'#d8d0b8',5,1,3,2);P(c,'#9a9078',-5,1,10,1)}
 else if(k===1){c.strokeStyle='#d8d0b8';c.lineWidth=1.5;for(let i=0;i<4;i++){c.beginPath();c.arc(0,4,5+i*1.6,Math.PI*1.1,Math.PI*1.9);c.stroke()}P(c,'#d8d0b8',-1,-4,2,8)}
 else{c.fillStyle='#e0d8c0';c.beginPath();c.ellipse(0,0,6,4.5,0,0,7);c.fill();c.beginPath();c.moveTo(4,-1.5);c.lineTo(13,0);c.lineTo(4,2.5);c.closePath();c.fill();P(c,'#1a1612',-3,-2,3,3);P(c,'#1a1612',1,-2,2,3);for(let i=0;i<4;i++)P(c,'#fff4e0',7+i*1.4,1.5,1,2);P(c,'#a89f84',-5,2,8,1)}
 c.restore()}
/* marcas de garras (tres tajos) */
function claws(c,x,y,a,s,col){c.save();c.translate(x,y);c.rotate(a);c.strokeStyle=col||'rgba(18,10,6,.8)';c.lineWidth=1.4*s;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(i*4*s,-9*s);c.quadraticCurveTo(i*4*s+1.6*s,0,i*4*s-.6*s,9*s);c.stroke()}c.strokeStyle='rgba(220,190,120,.28)';c.lineWidth=.8*s;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(i*4*s+1.4*s,-8*s);c.quadraticCurveTo(i*4*s+3*s,0,i*4*s+.8*s,8*s);c.stroke()}c.restore()}
/* roca con musgo: facetas con luz arriba-izquierda, sombra, grietas y una capa de musgo y líquenes */
function rock(c,x,y,w,h,R,o){o=o||{};const px=[],n=9;for(let i=0;i<n;i++){const a=i/n*6.283,k=.86+R()*.18;px.push([x+Math.cos(a)*w/2*k,y-h/2+Math.sin(a)*h/2*k*(Math.sin(a)>0?.82:1)])}
 shade(c,x,y+1,w*.52,h*.2,.38);
 const path=()=>{c.beginPath();c.moveTo(px[0][0],px[0][1]);for(let i=1;i<n;i++)c.lineTo(px[i][0],px[i][1]);c.closePath()};
 const gr=c.createLinearGradient(x-w/2,y-h,x+w/2,y);gr.addColorStop(0,o.hi||'#8a948a');gr.addColorStop(.5,o.mid||'#5c665e');gr.addColorStop(1,o.lo||'#2c332e');c.fillStyle=gr;path();c.fill();
 c.save();path();c.clip();
 for(let i=0;i<9;i++){const fx=x+(R()-.5)*w*.9,fy=y-h*(.15+R()*.75),s=3+R()*w*.24,a=R()*6.28;c.fillStyle='rgba('+(R()<.5?'200,214,200':'10,14,10')+','+(.08+R()*.14).toFixed(2)+')';c.beginPath();c.moveTo(fx,fy);c.lineTo(fx+Math.cos(a)*s,fy+Math.sin(a)*s*.9);c.lineTo(fx+Math.cos(a+2)*s*.8,fy+Math.sin(a+2)*s*.7);c.closePath();c.fill()}
 c.strokeStyle='rgba(8,12,8,.55)';c.lineWidth=1;for(let i=0;i<3;i++){let cx=x+(R()-.5)*w*.6,cy=y-h*(.3+R()*.5);c.beginPath();c.moveTo(cx,cy);for(let j=0;j<3;j++){cx+=(R()-.5)*6;cy+=2+R()*4;c.lineTo(cx,cy)}c.stroke()}
 /* musgo en la parte alta y líquenes claros */
 const mg=c.createLinearGradient(0,y-h,0,y-h*.35);mg.addColorStop(0,'rgba(92,140,60,.85)');mg.addColorStop(1,'rgba(70,110,48,0)');c.fillStyle=mg;c.fillRect(x-w/2-2,y-h-2,w+4,h*.7);
 for(let i=0;i<8;i++)P(c,R()<.5?'#7aa850':'#9cc268',x+(R()-.5)*w*.8,y-h*(.5+R()*.45),2,1);
 c.restore();c.strokeStyle='rgba(8,10,8,.7)';c.lineWidth=1;path();c.stroke();P(c,'rgba(230,240,225,.35)',x-w*.28,y-h*.86,Math.max(2,w*.22),1)}
/* tronco caído (horizontal u vertical) con corteza, anillos en el extremo, musgo y ramas rotas */
function log(c,x,y,len,vert,R){const th=11;c.save();c.translate(x,y);if(vert)c.rotate(Math.PI/2);
 shade(c,0,th*.5,len*.52,th*.32,.36);
 const g2=c.createLinearGradient(0,-th/2,0,th/2);g2.addColorStop(0,'#7c5c3a');g2.addColorStop(.35,'#5e432a');g2.addColorStop(1,'#2a1c10');c.fillStyle=g2;rr(c,-len/2,-th/2,len,th,4);c.fill();
 c.strokeStyle='rgba(20,12,6,.55)';c.lineWidth=1;for(let i=0;i<len/3;i++){const xx=-len/2+3+i*3+(R()-.5);c.beginPath();c.moveTo(xx,-th/2+1);c.lineTo(xx+(R()-.5)*2,th/2-1);c.stroke()}
 c.fillStyle='rgba(120,166,80,.8)';rr(c,-len/2+4,-th/2-1,len*.6,4,2);c.fill();P(c,'#a8d070',-len/2+8,-th/2,5,1);
 c.fillStyle='#c8a470';c.beginPath();c.ellipse(len/2-1,0,4.4,th/2,0,0,7);c.fill();c.strokeStyle='#7c5c3a';c.lineWidth=1;for(let i=1;i<4;i++){c.beginPath();c.ellipse(len/2-1,0,4.4-i*1.1,th/2-i*1.3,0,0,7);c.stroke()}
 c.strokeStyle='#4a3420';c.lineWidth=2;c.beginPath();c.moveTo(-len*.2,-th/2);c.lineTo(-len*.26,-th/2-6);c.moveTo(len*.12,-th/2);c.lineTo(len*.16,-th/2-5);c.stroke();
 c.restore()}
/* nido: aro de ramas, hoyo oscuro, huevos moteados, cáscaras y huesos */
function nest(c,x,y,rx,ry,R,o){o=o||{};shade(c,x,y+ry*.6,rx*1.15,ry*.5,.4);
 c.fillStyle='#2a1c10';c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();
 for(let i=0;i<Math.round(rx*ry*.5);i++){const a=R()*6.283,rr=(.55+R()*.5),sx=x+Math.cos(a)*rx*rr,sy=y+Math.sin(a)*ry*rr,l=4+R()*7,b=a+Math.PI/2+(R()-.5)*1.1;c.strokeStyle=pick(R,['#5a3e22','#7a5a34','#4a3018','#8c6a3e','#6a4a28']);c.lineWidth=1+(R()<.3?1:0);c.beginPath();c.moveTo(sx,sy);c.lineTo(sx+Math.cos(b)*l,sy+Math.sin(b)*l*.6);c.stroke()}
 c.fillStyle='#1c1208';c.beginPath();c.ellipse(x,y+ry*.1,rx*.72,ry*.66,0,0,7);c.fill();
 for(let i=0;i<14;i++){const a=R()*6.283,rr=R()*.6;c.strokeStyle=pick(R,['#3a2814','#4a3418','#5c4220']);c.lineWidth=1;const sx=x+Math.cos(a)*rx*rr,sy=y+Math.sin(a)*ry*rr;c.beginPath();c.moveTo(sx,sy);c.lineTo(sx+(R()-.5)*8,sy+(R()-.5)*4);c.stroke()}
 const ne=o.eggs==null?3:o.eggs;for(let i=0;i<ne;i++){const ex=x+(i-(ne-1)/2)*(rx*.52)+(R()-.5)*3,ey=y+(i%2?1:-1)*ry*.16-1;egg(c,ex,ey,o.es||4.6,R)}
 /* ramas del borde (delante) */
 for(let i=0;i<Math.round(rx*1.4);i++){const a=Math.PI*(.05+R()*.9),sx=x+Math.cos(a)*rx*(.94+R()*.1),sy=y+Math.sin(a)*ry*(.94+R()*.1);c.strokeStyle=pick(R,['#6a4a28','#8c6a3e','#4a3018']);c.lineWidth=1.5;c.beginPath();c.moveTo(sx-3,sy);c.lineTo(sx+3+R()*3,sy-(R()*2));c.stroke()}}
function egg(c,x,y,r,R){c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(x+1,y+r*.8,r*.95,r*.42,0,0,7);c.fill();const gr=c.createRadialGradient(x-r*.35,y-r*.45,.5,x,y,r*1.2);gr.addColorStop(0,'#f0ead0');gr.addColorStop(.55,'#c4bc96');gr.addColorStop(1,'#7e7656');c.fillStyle=gr;c.beginPath();c.ellipse(x,y,r*.82,r,0,0,7);c.fill();
 c.fillStyle='rgba(90,76,44,.7)';for(let i=0;i<4;i++)c.fillRect(Math.round(x+(R()-.5)*r*1.1),Math.round(y+(R()-.5)*r*1.4),1,1)}
RA._u={rr,P,rgb,shade,prep,paintFloor,tuft,leaves,pebbles,mush,fernP,print,bones,claws,rock,log,nest,egg,mkNoise,hash2,grid,ell,rect,trailCarve,rn,ri,pick,sstep,segD};
})();
/* ═══════════ v437 · MINI-JEFES (cliente) · parte 11: LAS CUATRO ZONAS DEL BOSQUE (se hornean aquí) ═══════════
   Senda de los Colmillos (entrada y cruce) · Cañada de los Nidos · Colina de las Huellas · Claro del Depredador (la arena, la más ancha de los tres jefes).
   Cada zona sale de una rejilla de casillas (sólido/libre/escaleras) tallada con claros y senderos; el arte se pinta encima con los pintores de mjc10.js y se guarda en UN atlas. */
(function(){
'use strict';
const RA=window.MJRA;if(!RA||!RA._u)return;
const K=window.MJH.K,mk=K.mk,rngf=K.rngf,cl=K.cl;
const U=RA._u,P=U.P,shade=U.shade,prep=U.prep,paintFloor=U.paintFloor,tuft=U.tuft,leaves=U.leaves,pebbles=U.pebbles,mush=U.mush,fernP=U.fernP,print=U.print,bones=U.bones,claws=U.claws,rock=U.rock,log=U.log,nest=U.nest,egg=U.egg,rn=U.rn,ri=U.ri,pick=U.pick,rr=U.rr;
const SZ=RA.SZ,POS=RA.POS,DEF=RA.DEF;
/* ═════════ dibujos del juego teñidos de verde profundo (cada uno en 3 tonos y 3 tamaños) ═════════ */
function sprites(npd){const o={},TN=[[[.72,.93,.78],[-8,-3,2]],[[.84,.95,.66],[-6,-2,-4]],[[.58,.8,.76],[-10,-2,4]]];
 for(const k of['oak','slim','bush','bush2','fern','plant','flower','stump2']){const im=npd[k];if(!im)continue;o[k]=[];for(const[m,a]of TN)o[k].push(prep(im,m,a,1));o[k+'_b']=[prep(im,TN[0][0],TN[0][1],1.25),prep(im,TN[1][0],TN[1][1],1.25,1)];o[k+'_g']=[prep(im,TN[0][0],TN[0][1],1.5),prep(im,TN[2][0],TN[2][1],1.5,1)]}
 return o}
/* ═════════ rejilla: se talla el bosque ═════════ */
function carve(k){const[w,h]=SZ[k],a=U.grid(w,h),d=DEF[k];
 if(k==='S'){const o=RA.OV;U.ell(a,o[0],o[1],o[2],o[3]);U.rect(a,44,16,52,19);U.rect(a,51,16,52,19,'D')}
 else{for(const c of d.cl)U.ell(a,c[0],c[1],c[2],c[3]);for(const t of d.tr)U.trailCarve(a,t);for(const r of d.rooms||[])U.rect(a,r[0],r[1],r[2],r[3]);for(const s of d.st)U.rect(a,s[0],s[1],s[2],s[3],s[4]);if(d.ex)U.rect(a,d.ex[0],d.ex[1],d.ex[2],d.ex[3],'E')}
 for(let x=0;x<w;x++){a[0][x]='#';a[h-1][x]='#'}for(let y=0;y<h;y++){a[y][0]='#';a[y][w-1]='#'}
 return a}
/* obstáculos: la zona los marca como sólidos antes de pintar el arte */
function obstacles(k,g){const list=k==='S'?RA.OBS.map((o,i)=>[['rock','log','rock','log','rock','rock','stump','rock'][i],o[0],o[1],o[2],o[3]]):DEF[k].ob;
 for(const o of list)U.rect(g,o[1],o[2],o[1]+o[3]-1,o[2]+o[4]-1,'#');
 if(k==='S'){const n=RA.NEST,r=RA.NESTR;U.ell(g,n[0],n[1],r[0],r[1],'#');for(const f of RA.FANGS)U.rect(g,f[0],f[1]-1,f[0],f[1],'#')}
 return list}
const walk=(g,x,y)=>!!(g[y]&&g[y][x]!=null&&g[y][x]!=='#');
/* ═════════ objetos altos: guardan su copa aparte (se dibuja encima de quien pasa por detrás) ═════════ */
function tall(ctx,cv,bx,by,hw,g,R,o){o=o||{};const x0=Math.round(bx-cv.width/2),y0=Math.round(by-cv.height),baseRow=Math.floor((by-1)/16),cut=(baseRow-1)*16;
 shade(ctx.sc,bx,by-2,Math.max(10,cv.width*.34),o.sh||6,.4);ctx.sc.drawImage(cv,x0,y0);
 if(!ctx.ov)return baseRow;const w=cv.width,hh=cut-y0;if(hh<4)return baseRow;
 const c0=Math.floor((x0+w*.22)/16),c1=Math.floor((x0+w*.78)/16),r0=Math.max(0,Math.floor(y0/16)),r1=Math.floor((cut-1)/16);let any=false;
 for(let y=r0;y<=r1&&!any;y++)for(let x=c0;x<=c1;x++)if(walk(g,x,y)){any=true;break}
 if(any){ctx.ov.drawImage(cv,0,0,w,hh,x0,y0,w,hh);ctx.reg.push({x:x0,y:y0,w,h:hh,row:baseRow,bx:bx})}
 return baseRow}
/* pinta bosque en todo lo macizo: cada árbol deja su tronco sólido y su copa (si cae sobre terreno libre) como capa delantera */
function forest(ctx,g,w,h,R,SP,limit,res){const items=[],used=new Set(),cov=new Uint8Array(w*h);
 const hasRes=(x0,y0,x1,y1)=>{for(let y=Math.max(0,y0);y<=Math.min(h-1,y1);y++)for(let x=Math.max(0,x0);x<=Math.min(w-1,x1);x++)if(res.has(y*w+x))return true;return false};
 const cnt=(x0,y0,x1,y1)=>{let n=0;for(let y=Math.max(0,y0);y<=Math.min(h-1,y1);y++)for(let x=Math.max(0,x0);x<=Math.min(w-1,x1);x++)if(walk(g,x,y))n++;return n};
 for(let gy=0;gy<h+5;gy+=2)for(let gx=-2;gx<w+2;gx+=3){const x=gx+ri(R,0,2),y=gy+ri(R,0,1);if(y<1||y>h-1)continue;
  const big=R()<.62,sz=R(),key=big?'oak':'slim',lst=sz<.14?SP[key+'_g']:sz<.42?SP[key+'_b']:SP[key],cv=lst[ri(R,0,lst.length-1)%lst.length],tc=big?2:1,hw=big?9:5;
  /* el tronco debe caer en terreno macizo */
  let ok=true;for(let dy=-1;dy<=0&&ok;dy++)for(let dx=0;dx<tc;dx++){const cx=x+dx,cy=y+dy;if(cx>=0&&cx<w&&cy>=0&&cy<h&&(g[cy][cx]!=='#'||used.has(cy*w+cx))){ok=false;break}}
  if(!ok)continue;
  const bx=(x+tc/2)*16,by=(y+1)*16-3,cw=cv.width,ch=cv.height,tx0=Math.floor((bx-cw*.4)/16),tx1=Math.floor((bx+cw*.4)/16),ty0=Math.floor((by-ch*.9)/16),ty1=y-2;
  if(cnt(tx0,ty0,tx1,ty1)>limit||hasRes(tx0,ty0,tx1,y))continue;
  for(let dy=-1;dy<=0;dy++)for(let dx=0;dx<tc;dx++)if(x+dx>=0&&x+dx<w)used.add((y+dy)*w+x+dx);
  for(let yy=Math.max(0,ty0);yy<=Math.min(h-1,y);yy++)for(let xx=Math.max(0,tx0);xx<=Math.min(w-1,tx1);xx++)cov[yy*w+xx]=1;
  items.push({cv,bx,by,hw,y})}
 items.sort((a,b)=>a.y-b.y||a.bx-b.bx);
 for(const it of items)tall(ctx,it.cv,it.bx,it.by,it.hw,g,R);
 /* huecos junto al terreno libre: arbustos, helechos y rocas bajas (nunca tapan el paso) */
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(g[y][x]!=='#'||cov[y*w+x]||res.has(y*w+x))continue;let near=false;for(let dy=-2;dy<=2&&!near;dy++)for(let dx=-2;dx<=2;dx++)if(walk(g,x+dx,y+dy)){near=true;break}if(!near||R()<.28)continue;
  const q=R(),bx=(x+.5)*16+(R()-.5)*8,by=(y+1)*16-2;
  if(q<.42&&SP.bush2){const cv=pick(R,SP.bush2);shade(ctx.sc,bx,by-1,10,4,.35);ctx.sc.drawImage(cv,Math.round(bx-cv.width/2),Math.round(by-cv.height))}
  else if(q<.62&&SP.bush){const cv=pick(R,SP.bush);shade(ctx.sc,bx,by-1,9,4,.35);ctx.sc.drawImage(cv,Math.round(bx-cv.width/2),Math.round(by-cv.height))}
  else if(q<.8&&SP.fern){const cv=pick(R,SP.fern);ctx.sc.drawImage(cv,Math.round(bx-cv.width/2),Math.round(by-cv.height))}
  else rock(ctx.sc,bx,by,12+R()*8,9+R()*5,R)}
 return items.length}
/* ═════════ decoración del suelo (sobre terreno libre) ═════════ */
function groundDecor(ctx,g,w,h,R,FL,SP,o){o=o||{};const c=ctx.sc;
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){if(!walk(g,x,y))continue;const px=x*16,py=y*16,pdv=FL.pdAt(px+8,py+8),onP=pdv<-2.5;
  const nb=!(walk(g,x-1,y)&&walk(g,x+1,y)&&walk(g,x,y-1)&&walk(g,x,y+1));
  if(!onP||R()<.18){const n=onP?1:ri(R,1,3);for(let i=0;i<n;i++){const col=pick(R,['#4c7a38','#5f9444','#3a6230','#6ea84c']);tuft(c,px+R()*16,py+4+R()*12,R,col,3+R()*3)}}
  if(!onP&&R()<.22)leaves(c,px,py,16,16,ri(R,1,4),R);
  if(onP&&R()<.3)pebbles(c,px+8,py+8,ri(R,1,2),R);else if(!onP&&R()<.05)pebbles(c,px+8,py+8,ri(R,1,3),R);
  if(!onP&&R()<(o.fl==null?.022:o.fl)){const sp=pick(R,[SP.flower,SP.plant,SP.fern]);if(sp){const cv=pick(R,sp),s=cv.width>26?.7:.9;c.drawImage(cv,Math.round(px+8-cv.width*s/2),Math.round(py+14-cv.height*s),Math.round(cv.width*s),Math.round(cv.height*s))}}
  if(nb&&R()<.16)mush(c,px+R()*14+1,py+8+R()*7,R,R()<(o.glow==null?.35:o.glow));
  if(!onP&&R()<.012)bones(c,px+8,py+9,R,ri(R,0,1));
  if(nb&&R()<.22)fernP(c,px+4+R()*8,py+13,R,pick(R,['#3f7a3a','#4e8e44','#2f6030']),6+R()*5)}
 /* raíces que serpentean por el suelo */
 for(let i=0;i<Math.round(w*h/60);i++){let x=R()*w*16,y=R()*h*16,a=R()*6.28;const gx=(x/16)|0,gy=(y/16)|0;if(!walk(g,gx,gy))continue;c.strokeStyle=pick(R,['rgba(54,36,20,.7)','rgba(70,48,26,.6)']);c.lineWidth=1+(R()<.4?1:0);c.beginPath();c.moveTo(x,y);for(let j=0;j<5;j++){a+=(R()-.5)*1.1;x+=Math.cos(a)*(3+R()*4);y+=Math.sin(a)*(2+R()*3);c.lineTo(x,y)}c.stroke()}}
/* ═════════ pintores de piezas del escenario ═════════ */
function fang(c,x,y,h,flip,R,o){o=o||{};const s=flip?-1:1,w=o.w||8;c.save();c.translate(x,y);c.scale(s,1);shade(c,0,-1,w+3,3.5,.4);
 const gr=c.createLinearGradient(-w,0,w,0);gr.addColorStop(0,'#8c846c');gr.addColorStop(.35,'#f2ecd2');gr.addColorStop(.7,'#d4cba6');gr.addColorStop(1,'#7a7258');
 c.fillStyle=gr;c.beginPath();c.moveTo(-w,0);c.bezierCurveTo(-w*.9,-h*.5,-w*.2,-h*.84,w*1.7,-h);c.bezierCurveTo(w*.3,-h*.7,w*.65,-h*.4,w,0);c.closePath();c.fill();
 c.strokeStyle='rgba(60,52,36,.55)';c.lineWidth=1;c.stroke();
 c.strokeStyle='rgba(90,80,56,.55)';for(let i=0;i<5;i++){const t=.14+i*.16;c.beginPath();c.moveTo(-w*.6+i*.4,-h*t);c.quadraticCurveTo(-w*.1,-h*(t+.05),w*.6-i*.3,-h*(t-.01));c.stroke()}
 c.fillStyle='rgba(255,255,240,.55)';c.beginPath();c.moveTo(-w*.35,-4);c.quadraticCurveTo(-w*.25,-h*.45,w*.5,-h*.9);c.lineTo(w*.1,-h*.88);c.quadraticCurveTo(-w*.1,-h*.5,-w*.15,-4);c.closePath();c.fill();
 c.fillStyle='rgba(88,140,64,.85)';c.beginPath();c.ellipse(0,-1,w*1.1,3,0,Math.PI,0);c.fill();for(let i=0;i<6;i++)P(c,R()<.5?'#6a9a48':'#8ab860',-w+R()*w*2,-4-R()*3,2,1);
 c.restore()}
function signpost(c,x,y,dir,R){shade(c,x,y,7,2.5,.4);P(c,'#3c2814',x-1,y-24,3,24);P(c,'#6a4a28',x-1,y-24,1,24);c.save();c.translate(x,y-19);c.scale(dir,1);c.fillStyle='#7a5a34';c.beginPath();c.moveTo(-8,-4);c.lineTo(10,-4);c.lineTo(15,0);c.lineTo(10,4);c.lineTo(-8,4);c.closePath();c.fill();c.strokeStyle='#2e1e0e';c.lineWidth=1;c.stroke();P(c,'#a07a48',-7,-3,16,1);claws(c,0,0,1.2,.5,'rgba(24,12,6,.9)');c.restore();
 P(c,'#d8d0b8',x-4,y-8,2,2);P(c,'#d8d0b8',x+3,y-12,2,2)}
function totem(c,x,y,R){shade(c,x,y,10,3.5,.42);const wd=c.createLinearGradient(x-5,0,x+5,0);wd.addColorStop(0,'#2e1e0e');wd.addColorStop(.4,'#7a5a34');wd.addColorStop(1,'#241608');c.fillStyle=wd;c.fillRect(x-5,y-46,10,46);
 c.strokeStyle='rgba(20,12,6,.6)';c.lineWidth=1;for(let i=0;i<9;i++){c.beginPath();c.moveTo(x-4+((i*7)%9),y-44+i*5);c.lineTo(x-2+((i*5)%7),y-41+i*5);c.stroke()}
 for(let i=0;i<4;i++){claws(c,x,y-12-i*9,.2*(i%2?1:-1),.55,'rgba(150,40,24,.85)')}
 fang(c,x-9,y-34,24,true,R,{w:3.4});fang(c,x+9,y-34,24,false,R,{w:3.4});
 c.save();c.translate(x,y-50);c.scale(1.05,1.05);bones(c,0,0,()=>.5,2);c.restore();
 for(let i=0;i<4;i++){P(c,'#d8d0b8',x-5+i*3,y-30+i%2*2,2,3)}}
function firepit(c,x,y,R){shade(c,x,y+2,16,5,.35);c.fillStyle='#161210';c.beginPath();c.ellipse(x,y,12,5,0,0,7);c.fill();for(let i=0;i<9;i++){const a=i/9*6.283;rock(c,x+Math.cos(a)*13,y+Math.sin(a)*5+3,8,6,R,{hi:'#7c786c',mid:'#524e44',lo:'#26241e'})}
 c.strokeStyle='#241a12';c.lineWidth=2;c.beginPath();c.moveTo(x-8,y-1);c.lineTo(x+7,y+2);c.moveTo(x-5,y+2);c.lineTo(x+9,y-2);c.stroke();P(c,'#3a3632',x-3,y-1,6,2)}
function ribcage(c,x,y,R,flip){c.save();c.translate(x,y);c.scale(flip?-1:1,1);shade(c,0,0,38,6,.34);
 c.strokeStyle='#d8d0b8';c.lineWidth=2;c.lineCap='round';for(let i=0;i<7;i++){const xx=-28+i*9;c.beginPath();c.moveTo(xx,0);c.bezierCurveTo(xx-2,-30-Math.sin(i/6*3.14)*12,xx+9,-34-Math.sin(i/6*3.14)*10,xx+10,-8-i%2*2);c.stroke()}
 c.strokeStyle='#a8a088';c.lineWidth=1;for(let i=0;i<7;i++){const xx=-28+i*9;c.beginPath();c.moveTo(xx+1,-2);c.bezierCurveTo(xx,-28-Math.sin(i/6*3.14)*12,xx+8,-32-Math.sin(i/6*3.14)*10,xx+9,-9);c.stroke()}
 c.strokeStyle='#e8e0c8';c.lineWidth=3;c.beginPath();c.moveTo(-30,-1);c.lineTo(36,-3);c.stroke();for(let i=0;i<8;i++)P(c,'#f0e8d0',-32+i*9,-5,3,3);
 c.save();c.translate(46,-2);c.scale(1.6,1.6);bones(c,0,0,()=>.5,2);c.restore();c.restore()}
const chev=(c,x,y,dir)=>{c.save();c.translate(x,y);c.rotate(dir);c.strokeStyle='rgba(235,210,140,.55)';c.lineWidth=2;for(let i=0;i<2;i++){c.beginPath();c.moveTo(-5,-5+i*6);c.lineTo(0,-1+i*6);c.lineTo(5,-5+i*6);c.stroke()}c.restore()};
/* nido-altar del Claro: aro de ramas gigante, losa central con garras y runas, huevos grandes, huesos y cráneos */
function altar(c,x,y,R){const rx=RA.NESTR[0]*16,ry=RA.NESTR[1]*16;shade(c,x,y+ry*.7,rx*1.12,ry*.55,.5);
 c.fillStyle='#241608';c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();
 for(let i=0;i<190;i++){const a=R()*6.283,rr=.42+R()*.62,sx=x+Math.cos(a)*rx*rr,sy=y+Math.sin(a)*ry*rr,l=7+R()*12,b=a+Math.PI/2+(R()-.5)*1.2;c.strokeStyle=pick(R,['#5a3e22','#7a5a34','#4a3018','#8c6a3e','#6a4a28','#3a2814']);c.lineWidth=1+(R()<.35?1:0);c.beginPath();c.moveTo(sx,sy);c.lineTo(sx+Math.cos(b)*l,sy+Math.sin(b)*l*.62);c.stroke()}
 c.fillStyle='#160e06';c.beginPath();c.ellipse(x,y+2,rx*.66,ry*.6,0,0,7);c.fill();
 /* losa de piedra con runas */
 const lg=c.createLinearGradient(x-22,y-12,x+22,y+12);lg.addColorStop(0,'#8e988c');lg.addColorStop(.5,'#5e685f');lg.addColorStop(1,'#2e352f');c.fillStyle=lg;c.beginPath();c.ellipse(x,y,rx*.4,ry*.44,0,0,7);c.fill();c.strokeStyle='rgba(8,12,8,.7)';c.lineWidth=1;c.stroke();
 c.fillStyle='rgba(120,170,100,.5)';c.beginPath();c.ellipse(x-4,y-5,rx*.24,ry*.18,0,0,7);c.fill();
 claws(c,x-9,y,.5,.9,'rgba(20,12,6,.8)');claws(c,x+8,y+1,-.4,.8,'rgba(20,12,6,.8)');
 c.strokeStyle='rgba(255,176,70,.8)';c.lineWidth=1;c.beginPath();c.ellipse(x,y,rx*.28,ry*.3,0,0,7);c.stroke();for(let i=0;i<6;i++){const a=i/6*6.283;c.beginPath();c.moveTo(x+Math.cos(a)*rx*.28,y+Math.sin(a)*ry*.3);c.lineTo(x+Math.cos(a)*rx*.34,y+Math.sin(a)*ry*.38);c.stroke()}
 for(const[dx,dy]of[[-.62,.12],[.58,.22],[-.3,-.5],[.36,-.46],[0,.62]])egg(c,x+dx*rx,y+dy*ry,6.4+R()*1.6,R);
 for(const[dx,dy,k]of[[-.8,.5,0],[.74,.42,1],[-.7,-.3,2],[.82,-.2,0],[.1,-.74,1]]){c.save();c.translate(x+dx*rx,y+dy*ry);c.scale(1.2,1.2);bones(c,0,0,R,k);c.restore()}
 for(let i=0;i<46;i++){const a=R()*6.283,rr=.8+R()*.28,sx=x+Math.cos(a)*rx*rr,sy=y+Math.sin(a)*ry*rr+1;c.strokeStyle=pick(R,['#6a4a28','#8c6a3e','#4a3018']);c.lineWidth=1.6;c.beginPath();c.moveTo(sx-4,sy);c.lineTo(sx+4+R()*4,sy-(R()*3));c.stroke()}}
/* ═════════ construcción de una zona ═════════ */
function scene(k,SP,seed){const[w,h]=SZ[k],R=rngf(seed),d=DEF[k],g=carve(k),ob=obstacles(k,g),W=w*16,Hh=h*16,res=new Set();
 for(const o of ob)for(let y=o[2];y<o[2]+o[4];y++)for(let x=o[1];x<o[1]+o[3];x++)res.add(y*w+x);
 if(k==='S'){const n=RA.NEST,r=RA.NESTR;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(Math.pow((x+.5-n[0])/r[0],2)+Math.pow((y+.5-n[1])/r[1],2)<=1)res.add(y*w+x);for(const f of RA.FANGS){res.add(f[1]*w+f[0]);res.add((f[1]-1)*w+f[0])}}
 const sc=mk(W,Hh),c=sc.getContext('2d'),ov=mk(W,Hh),ctx={sc:c,ov:ov.getContext('2d'),reg:[]};c.imageSmoothingEnabled=false;ctx.ov.imageSmoothingEnabled=false;
 /* senderos de tierra */
 let trails=d.trails||[];
 if(k==='S'){const ring=[];for(let i=0;i<=26;i++){const a=i/26*6.283;ring.push([27+Math.cos(a)*7.6,18+Math.sin(a)*5.4])}trails=[{pts:[[53,17.6],[45,17.7],[37,18]],hw:1.9},{pts:ring,hw:1.0},{pts:[[22,18],[32,18]],hw:5.2},{pts:[[27,13],[27,23]],hw:3.6}]}
 const FL=paintFloor(c,W,Hh,g,R,trails,{sun:k==='S'?.62:.5});
 groundDecor(ctx,g,w,h,R,FL,SP,{fl:k==='S'?.014:.026,glow:k==='1'?.55:.3});
 const lt=[],fx=[];
 /* ── piezas propias de cada zona ── */
 const T16=v=>v*16;
 if(k==='G'){
  /* huellas gigantes: aparecen sobre todo hacia el este (el rastro del depredador) */
  for(let i=0;i<20;i++){const t=i/19,x=T16(22+t*20),y=T16(14.2+(i%2?.8:-.5)+Math.sin(t*4)*.4);print(c,x,y,-1.4+(i%2?.18:-.12),.9+t*.25,R)}
  for(let i=0;i<7;i++)print(c,T16(23)+(i%2?9:-9),T16(28-i*1.3),0+(R()-.5)*.2,.9,R);
  signpost(c,T16(29.4),T16(12.9),1,R);signpost(c,T16(16.4),T16(12.9),-1,R);
    chev(c,T16(23),T16(27),Math.PI);chev(c,T16(23),T16(26.6),Math.PI);
  chev(c,T16(1.4),T16(14.5),-Math.PI/2);chev(c,T16(44.6),T16(14.5),Math.PI/2);
  lt.push([368,232,150,'255,226,150',.34,0],[110,230,90,'255,226,150',.26,0],[640,230,90,'255,226,150',.26,0],[368,458,110,'255,240,200',.42,0],[160,100,70,'255,226,150',.2,0],[600,100,70,'255,226,150',.2,0],[130,380,70,'255,226,150',.2,0],[610,380,70,'255,226,150',.2,0],[320,290,48,'255,160,70',.22,1]);
 }
 if(k==='1'){
  for(let i=0;i<14;i++){const t=i/13;print(c,T16(8+t*14),T16(23.5+(i%2?.7:-.6)),-1.57+(i%2?.12:-.1),.85,R)}
  for(let i=0;i<22;i++){const cx=pick(R,[[24,23],[20,9.5],[36,22.5],[38.5,7]]);egg(c,T16(cx[0])+(R()-.5)*92,T16(cx[1])+(R()-.5)*52,2.6,R)}
  for(let i=0;i<26;i++){const cx=pick(R,[[24,23],[20,9.5],[36,22.5],[38.5,7],[9.5,12.5]]);bones(c,T16(cx[0])+(R()-.5)*100,T16(cx[1])+(R()-.5)*60,R,ri(R,0,2))}
  chev(c,T16(1.4),T16(23.5),-Math.PI/2);chev(c,T16(44.6),T16(6.5),Math.PI/2);
  for(const[x,y]of[[24,23],[20,9.5],[36,22.5],[38.5,7],[9.5,12.5]])lt.push([T16(x),T16(y),86,'255,214,140',.3,0]);
  for(const[x,y]of[[21,22],[26,24],[17,8],[22,11],[38,5],[35,21],[8,11]])lt.push([T16(x+1),T16(y+1),38,'255,170,80',.22,1]);
  lt.push([T16(9),T16(12.4),60,'90,230,210',.18,1],[T16(33),T16(8.6),60,'90,230,210',.16,1],[T16(5),T16(23.5),80,'255,230,170',.3,0]);
 }
 if(k==='2'){
  for(let i=0;i<26;i++){const p=[[36,23.5],[26,22],[18,19],[12,13],[10.5,8]],t=i/25*(p.length-1),s0=Math.min(p.length-2,t|0),u=t-s0,x=p[s0][0]+(p[s0+1][0]-p[s0][0])*u,y=p[s0][1]+(p[s0+1][1]-p[s0][1])*u,a=Math.atan2(p[s0+1][1]-p[s0][1],p[s0+1][0]-p[s0][0])+Math.PI/2;print(c,T16(x)+(i%2?5:-5),T16(y)+(i%2?-3:3),a,1.2+(i%3)*.1,R)}
  /* cumbre: losa con huellas grabadas y cráneo fósil enorme */
  const lg=c.createLinearGradient(T16(7),T16(5),T16(14),T16(10));lg.addColorStop(0,'#98a094');lg.addColorStop(1,'#4a544c');c.fillStyle=lg;c.beginPath();c.ellipse(T16(10.5),T16(7.6),T16(3.6),T16(2.4),0,0,7);c.fill();c.strokeStyle='rgba(8,12,8,.65)';c.stroke();
  for(let i=0;i<3;i++)print(c,T16(8.6)+i*T16(1.7),T16(7.6)+(i%2?-3:3),-1.2,1.1,R);
  for(const[x,y,a]of[[24.6,19.4,.5],[15.5,14.6,-.4],[34.8,7.8,.2],[38.4,10.6,.7],[8.6,4.2,-.6]])claws(c,T16(x),T16(y),a,1.5,'rgba(18,10,6,.85)');
  chev(c,T16(44.6),T16(23.5),Math.PI/2);
  lt.push([T16(10.5),T16(7.6),130,'255,236,180',.42,0],[T16(26),T16(22),90,'255,226,150',.26,0],[T16(14.5),T16(17),90,'255,226,150',.24,0],[T16(36),T16(9.5),90,'255,226,150',.24,0],[T16(40.5),T16(23.5),80,'255,230,170',.28,0],[T16(14.6),T16(9.6),44,'90,230,210',.16,1]);
 }
 if(k==='S'){
  /* hierba alta: suelo más rico y oscuro bajo cada mancha (las hojas se dibujan en vivo, ver mjc12.js) */
  for(const p of RA.PATCH){const gr=c.createRadialGradient(T16(p[0]),T16(p[1]),4,T16(p[0]),T16(p[1]),T16(p[2])*1.15);gr.addColorStop(0,'rgba(20,54,24,.62)');gr.addColorStop(.7,'rgba(26,66,30,.4)');gr.addColorStop(1,'rgba(26,66,30,0)');c.fillStyle=gr;c.fillRect(T16(p[0]-p[2]*1.2),T16(p[1]-p[2]*1.2),T16(p[2]*2.4),T16(p[2]*2.4))}
  for(let i=0;i<46;i++){const a=R()*6.283,rr=Math.sqrt(R())*.92,x=27+Math.cos(a)*19.5*rr,y=18+Math.sin(a)*13.5*rr;if(Math.hypot((x-27)/2.9,(y-18)/2.1)<1.2)continue;print(c,T16(x),T16(y),R()*6.28,.95+R()*.25,R)}
  for(let i=0;i<34;i++){const a=R()*6.283,rr=Math.sqrt(R())*.9,x=27+Math.cos(a)*19*rr,y=18+Math.sin(a)*13*rr;claws(c,T16(x),T16(y),R()*3,.9+R()*.5,'rgba(18,10,6,.6)')}
  for(let i=0;i<20;i++){const a=R()*6.283,rr=.18+R()*.8,x=27+Math.cos(a)*19*rr,y=18+Math.sin(a)*13*rr;if(Math.hypot((x-27)/2.9,(y-18)/2.1)<1.2)continue;bones(c,T16(x),T16(y),R,ri(R,0,2))}
  chev(c,T16(49),T16(17.6),Math.PI/2);chev(c,T16(49.6),T16(17.6),Math.PI/2);
 }
 /* ── obstáculos: se pintan ordenados por la fila de su base ── */
 const lst=ob.slice().sort((a,b)=>(a[2]+a[4])-(b[2]+b[4]));
 for(const o of lst){const[t,x,y,ww,hh]=o,cx=T16(x+ww/2),by=T16(y+hh)-2;
  if(t==='rock')rock(c,cx,by,T16(ww)*.98,T16(hh)*1.12,R);
  else if(t==='log')(ww>=hh?log(c,cx,T16(y+hh/2)+3,T16(ww)-2,false,R):log(c,T16(x+ww/2),T16(y+hh/2),T16(hh)-2,true,R));
  else if(t==='stump'){const s=SP.stump2?pick(R,SP.stump2):null;if(s){shade(c,cx,by-2,10*ww,5,.4);const sc2=ww>=2?2:1.4,cv=prep(s,null,null,sc2);c.drawImage(cv,Math.round(cx-cv.width/2),Math.round(by-cv.height))}else rock(c,cx,by,T16(ww),T16(hh),R)}
  else if(t==='trunk'){const cv=SP.oak_b?SP.oak_b[0]:null;if(cv)tall(ctx,cv,cx,by-1+3,9,g,R)}
  else if(t==='nest'){nest(c,cx,T16(y+hh/2)+2,T16(ww)*.62,T16(hh)*.46,R,{eggs:3})}
  else if(t==='pit')firepit(c,cx,T16(y+hh/2)+2,R);
  else if(t==='totem')totem(c,cx,by+2,R);
  else if(t==='ribs')ribcage(c,cx-8,by+1,R,x>20);
  else if(t==='skull'){c.save();c.translate(cx,by-6);c.scale(3.3,3.3);bones(c,0,0,()=>.5,2);c.restore()}}
 if(k==='S'){
  /* colmillos gigantes clavados en el borde del claro (marcas del macho alfa) */
  for(const[x,y,fl,hh]of RA.FANGS){const cv=mk(60,hh+10),q=cv.getContext('2d');q.imageSmoothingEnabled=false;fang(q,22,hh+7,hh,!!fl,R,{w:8.4});tall(ctx,cv,(x+.5)*16,(y+1)*16+1,5,g,R,{sh:4})}
  altar(c,T16(27),T16(18)+4,R);
  lt.push([432,296,130,'255,170,70',.5,1],[432,290,220,'255,210,140',.34,0],[130,230,130,'200,235,170',.2,0],[760,300,130,'255,226,150',.2,0],[420,480,130,'255,226,150',.22,0],[800,280,70,'255,236,190',.34,0]);
  for(const p of RA.PATCH)lt.push([T16(p[0]),T16(p[1]),T16(p[2])*1.5,'110,220,120',.1,0]);
 }
 /* ── el bosque que cierra cada zona ── */
 const nt=forest(ctx,g,w,h,R,SP,k==='S'?0:7,res);
 /* ── guardado: la zona lista para el motor de interiores ── */
 const S={id:'rap.'+k,hid:'rap',lv:k,nm:d.nm,w,h,g:g.map(r=>r.join('')),pr:[],lt,fx,np:[],ch:[],ar:RA.ARR&&k==='G'?RA.ARR:k==='1'?{L:[4,23],R:[41,6]}:k==='2'?{R:[41,23]}:{R:[49,17]},ax:POS[k][0],ay:POS[k][1],fy:POS[k][1],amb:d.amb};
 return{S,sc,ov,reg:ctx.reg.sort((a,b)=>a.row-b.row||a.x-b.x),trees:nt}}
/* ═════════ el atlas ═════════ */
RA._sprites=sprites;RA._fang=fang;RA._signpost=signpost;RA._totem=totem;RA._firepit=firepit;RA._ribcage=ribcage;
RA.build=function(src){const A=mk(RA.ATW,RA.ATH),c=A.getContext('2d');c.imageSmoothingEnabled=false;
 const SP=sprites(src.npd||{}),levels={},ovl={};let i=0;
 for(const k of['S','G','1','2']){const r=scene(k,SP,4371+(i++)*17);c.drawImage(r.sc,POS[k][0],POS[k][1]);levels[k]=r.S;ovl[k]={cv:r.ov,list:r.reg}}
 A.complete=true;A.naturalWidth=RA.ATW;A.naturalHeight=RA.ATH;
 return{atlas:A,levels,ovl}};
})();
/* ═══════════ v437 · MINI-JEFES (cliente) · parte 12: LA FACHADA DEL PORTAL DE LOS COLMILLOS ═══════════
   Un muro de roca viva cubierto de musgo y raíces, con un arco hecho de DOS COLMILLOS GIGANTES que se cruzan arriba (las fauces del depredador), una hilera de dientes colgando,
   un cráneo de raptor como clave del arco, la boca oscura del bosque con un resplandor ámbar al fondo, árboles enormes a los lados, un nido con huevos en la cornisa,
   faroles de cráneo, lianas, helechos y rocas al pie. Se dibuja una vez en un lienzo de 400×240 (píxeles del juego a mitad de escala; el mundo lo muestra al doble). */
(function(){
'use strict';
const RA=window.MJRA;if(!RA||!RA._sprites)return;
const K=window.MJH.K,mk=K.mk,rngf=K.rngf,cl=K.cl,U=RA._u,P=U.P,shade=U.shade,prep=U.prep,rock=U.rock,nest=U.nest,bones=U.bones,egg=U.egg,pick=U.pick,ri=U.ri,mkNoise=U.mkNoise;
const FWD=400,FHT=240;RA.FW=FWD;RA.FH=FHT;
const TOP=x=>150+11*Math.sin(x/31+1)+6*Math.sin(x/11)+4*Math.sin(x/5.3)-Math.max(0,28-Math.abs(x-200)*.22)+Math.max(0,(36-(x-24))*1.1)+Math.max(0,(36-(376-x))*1.1);
/* curva cúbica de un colmillo: izquierda (lado=-1) o derecha (lado=1) */
const bez=(p,t)=>{const u=1-t;return[u*u*u*p[0][0]+3*u*u*t*p[1][0]+3*u*t*t*p[2][0]+t*t*t*p[3][0],u*u*u*p[0][1]+3*u*u*t*p[1][1]+3*u*t*t*p[2][1]+t*t*t*p[3][1]]};
const bezd=(p,t)=>{const u=1-t;return[3*u*u*(p[1][0]-p[0][0])+6*u*t*(p[2][0]-p[1][0])+3*t*t*(p[3][0]-p[2][0]),3*u*u*(p[1][1]-p[0][1])+6*u*t*(p[2][1]-p[1][1])+3*t*t*(p[3][1]-p[2][1])]};
function tusk(c,p,side,R){const pts=[];for(let t=0;t<=1.0001;t+=.006){const b=bez(p,t),d=bezd(p,t),l=Math.hypot(d[0],d[1])||1,n=[-d[1]/l,d[0]/l],w=36*(1-Math.pow(t,.8))+9*Math.pow(t,.8);pts.push({b,n,w,t})}
 /* sombra proyectada sobre el muro */
 c.fillStyle='rgba(4,10,8,.38)';for(const q of pts){c.beginPath();c.arc(q.b[0]+4,q.b[1]+3,q.w*.56,0,7);c.fill()}
 for(const q of pts){c.fillStyle='#7a725a';c.beginPath();c.arc(q.b[0],q.b[1],q.w/2,0,7);c.fill()}
 for(const q of pts){const sh=q.n[0]*side*-1;c.fillStyle='#cdc4a0';c.beginPath();c.arc(q.b[0]-q.n[0]*q.w*.1*side,q.b[1]-q.n[1]*q.w*.1*side,q.w*.38,0,7);c.fill()}
 for(const q of pts){c.fillStyle='#f4eed6';c.beginPath();c.arc(q.b[0]-q.n[0]*q.w*.2*side,q.b[1]-q.n[1]*q.w*.2*side,q.w*.17,0,7);c.fill()}
 /* anillos de crecimiento (como un cuerno) */
 for(let i=1;i<26;i++){const q=pts[Math.floor(i/26*(pts.length-1))],a=[q.b[0]-q.n[0]*q.w*.5,q.b[1]-q.n[1]*q.w*.5],b2=[q.b[0]+q.n[0]*q.w*.5,q.b[1]+q.n[1]*q.w*.5];c.strokeStyle='rgba(80,70,50,.34)';c.lineWidth=1;c.beginPath();c.moveTo(a[0],a[1]);c.quadraticCurveTo(q.b[0]+(q.n[1]*3),q.b[1]-(q.n[0]*3),b2[0],b2[1]);c.stroke()}
 /* surcos longitudinales y grietas */
 c.lineWidth=1;for(const off of[-.28,.12,.3]){c.strokeStyle='rgba(70,62,44,.5)';c.beginPath();pts.forEach((q,i)=>{if(q.t<.05||q.t>.93)return;const x=q.b[0]+q.n[0]*q.w*off,y=q.b[1]+q.n[1]*q.w*off;i&&pts[i-1].t>=.05?c.lineTo(x,y):c.moveTo(x,y)});c.stroke()}
 for(let i=0;i<9;i++){const q=pts[ri(R,10,pts.length-12)];c.strokeStyle='rgba(40,34,24,.6)';c.beginPath();c.moveTo(q.b[0]+q.n[0]*q.w*.3,q.b[1]+q.n[1]*q.w*.3);c.lineTo(q.b[0]+q.n[0]*q.w*.1+(R()-.5)*4,q.b[1]+q.n[1]*q.w*.1+3+R()*4);c.stroke()}
 c.strokeStyle='#2c2618';c.lineWidth=1;c.beginPath();pts.forEach((q,i)=>{const x=q.b[0]+q.n[0]*q.w*.5,y=q.b[1]+q.n[1]*q.w*.5;i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke();c.beginPath();pts.forEach((q,i)=>{const x=q.b[0]-q.n[0]*q.w*.5,y=q.b[1]-q.n[1]*q.w*.5;i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke();
 /* musgo y hiedra al pie */
 for(const q of pts){if(q.t>.3)break;for(let i=0;i<3;i++){c.fillStyle=pick(R,['#4a7a38','#5f9444','#3a6230']);c.fillRect(Math.round(q.b[0]+(R()-.5)*q.w),Math.round(q.b[1]+(R()-.5)*3),2,2)}}}
/* cráneo de raptor visto de frente: cráneo ancho, dos cuencas con brillo, hocico con fosas y hilera de dientes */
function frontSkull(c,x,y,sc){c.save();c.translate(x,y);c.scale(sc,sc);
 shade(c,0,24,20,3.5,.35);
 const gr=c.createLinearGradient(-16,0,16,0);gr.addColorStop(0,'#9a9274');gr.addColorStop(.4,'#f2ecd0');gr.addColorStop(1,'#8a8266');c.fillStyle=gr;
 c.beginPath();c.moveTo(-15,-3);c.quadraticCurveTo(-16,-16,0,-17);c.quadraticCurveTo(16,-16,15,-3);c.quadraticCurveTo(14,4,10,8);c.lineTo(8,22);c.lineTo(-8,22);c.lineTo(-10,8);c.quadraticCurveTo(-14,4,-15,-3);c.closePath();c.fill();c.strokeStyle='#2c2618';c.lineWidth=1;c.stroke();
 c.fillStyle='rgba(60,50,34,.5)';c.beginPath();c.moveTo(0,-17);c.lineTo(3,-8);c.lineTo(2,16);c.lineTo(0,18);c.closePath();c.fill();c.strokeStyle='rgba(60,50,34,.6)';c.beginPath();c.moveTo(-2,-16);c.lineTo(-4,-9);c.lineTo(-2,-4);c.stroke();
 for(const sx of[-1,1]){c.fillStyle='#120c08';c.beginPath();c.ellipse(sx*8,-4,4.8,5.6,sx*.25,0,7);c.fill();c.strokeStyle='rgba(60,50,34,.7)';c.lineWidth=1.4;c.beginPath();c.moveTo(sx*13,-9);c.quadraticCurveTo(sx*8,-12,sx*3,-8);c.stroke();c.fillStyle='#ffb04a';c.beginPath();c.ellipse(sx*8,-3.6,2.2,2.8,0,0,7);c.fill();c.fillStyle='#fff0b0';c.fillRect(sx*8-1,-5,1.4,1.6);c.fillStyle='#120c08';c.beginPath();c.ellipse(sx*3.2,15,1.5,2.2,0,0,7);c.fill()}
 c.fillStyle='#120c08';c.fillRect(-7,19,14,3);for(let i=-3;i<=3;i++){c.fillStyle='#f6f0d6';c.beginPath();c.moveTo(i*2.3-1.4,19);c.lineTo(i*2.3+1.4,19);c.lineTo(i*2.3,25-Math.abs(i)*.5);c.closePath();c.fill()}
 c.restore()}
function vine(c,x,y,len,R,sw){c.strokeStyle='#2c5a2c';c.lineWidth=1.4;c.beginPath();c.moveTo(x,y);let px=x,py=y;const pts=[[x,y]];for(let i=1;i<=len/5;i++){px=x+Math.sin(i*.9+sw)*3+(R()-.5)*1.2;py=y+i*5;pts.push([px,py]);c.lineTo(px,py)}c.stroke();
 for(let i=1;i<pts.length;i++){if(R()<.7){const q=pts[i],s=R()<.5?-1:1;c.fillStyle=pick(R,['#4a8a3c','#5f9e48','#3c7434']);c.beginPath();c.ellipse(q[0]+s*2.4,q[1],3,1.6,s*.5,0,7);c.fill()}}}
function skullLantern(c,x,y,R){shade(c,x,y,6,2,.4);P(c,'#3c2814',x-1,y-30,2,30);P(c,'#6a4a28',x-1,y-30,1,30);P(c,'#3c2814',x-5,y-31,10,2);c.save();c.translate(x,y-37);c.scale(1.05,1.05);bones(c,0,0,()=>.5,2);c.restore();P(c,'#ffb04a',x-3,y-39,2,2);P(c,'#ffd88a',x-3,y-39,1,1)}
RA.facade=function(npd,SPin){const SP=SPin||RA._sprites(npd),R=rngf(4381),cv=mk(FWD,FHT),c=cv.getContext('2d');c.imageSmoothingEnabled=false;const nA=mkNoise(4382),glows=[];
 const bigT=(k,x,y,s,fl)=>{const a=SP[k+(s>1.4?'_g':s>1.1?'_b':'')];if(!a)return;const t=a[fl?1:0]||a[0];c.drawImage(t,Math.round(x-t.width/2),Math.round(y-t.height))};
 /* 1) el telón de árboles detrás: copas enormes que enmarcan los colmillos */
 for(const[x,y,k,s,f]of[[40,170,'oak',1.5,0],[360,170,'oak',1.5,1],[78,150,'oak',1,0],[322,150,'oak',1,1],[118,128,'oak',1,1],[282,128,'oak',1,0],[160,112,'slim',1,0],[240,112,'slim',1,1],[200,104,'oak',1,0],[96,96,'slim',1,1],[304,96,'slim',1,0]])bigT(k,x,y,s,f);
 /* 2) el muro de roca viva (estratos, facetas, musgo arriba, oscuridad abajo) */
 {const x0=20,x1=380,y0=100,ww=x1-x0,hh=FHT-y0,id=c.getImageData(x0,y0,ww,hh),d=id.data;
  for(let yy=0;yy<hh;yy++)for(let xx=0;xx<ww;xx++){const X=x0+xx,Y=y0+yy,tp=TOP(X);if(Y<tp||X<24||X>376)continue;const dp=Y-tp,v=nA(X/7,Y/5)*.6+nA(X/3,Y/2.5)*.4,st=Math.abs(Math.sin((Y+nA(X/25,Y/25)*18)/4.6)),fac=nA(X/16+5,Y/11+2);
   let b=58+v*44-dp*.14+(st>.94?-16:0)+(fac>.62?10:fac<.3?-9:0);const h2=(Math.imul(X*31+Y,2246822519)>>>0)/4294967296;b+=(h2-.5)*7;
   let r=b*.86,g=b*1.0,bb=b*.9;const mt=9+nA(X/6,Y/4)*10;if(dp<mt){const k=cl(1-dp/mt,0,1)*.9;r=r+(60-r)*k;g=g+(112-g)*k;bb=bb+(46-bb)*k}
   const fdk=cl((Y-170)/70,0,1);r*=1-fdk*.35;g*=1-fdk*.28;bb*=1-fdk*.3;
   const i=(yy*ww+xx)*4;d[i]=r;d[i+1]=g;d[i+2]=bb;d[i+3]=255}
  c.putImageData(id,x0,y0)}
 c.strokeStyle='rgba(180,214,150,.5)';c.lineWidth=1;c.beginPath();for(let x=24;x<=376;x++){const y=TOP(x)+.5;x===24?c.moveTo(x,y):c.lineTo(x,y)}c.stroke();
 for(let i=0;i<20;i++){const x=30+R()*340,y=TOP(x);c.strokeStyle=pick(R,['#4a3018','#5c4020','#3a2410']);c.lineWidth=1.6;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+(R()-.5)*14,y+10,x+(R()-.5)*18,y+22,x+(R()-.5)*10,y+34+R()*22);c.stroke()}
 for(let i=0;i<9;i++){const x=34+R()*332,y=178+R()*50;if(x>112&&x<288)continue;rock(c,x,y,22+R()*22,16+R()*12,R,{hi:'#7a867a',mid:'#4e5a52',lo:'#222a24'})}
 /* 3) la boca del bosque: arco ojival oscuro entre los colmillos */
 const arch=(x0,x1,yb,yt)=>{c.beginPath();c.moveTo(x0,yb);c.lineTo(x0-4,yb-96);c.quadraticCurveTo(x0+2,yt+14,(x0+x1)/2,yt);c.quadraticCurveTo(x1-2,yt+14,x1+4,yb-96);c.lineTo(x1,yb);c.closePath()};
 c.save();arch(150,250,FHT,66);c.clip();
 {const g1=c.createLinearGradient(0,70,0,FHT);g1.addColorStop(0,'#04090a');g1.addColorStop(.5,'#09170f');g1.addColorStop(1,'#16261a');c.fillStyle=g1;c.fillRect(140,60,120,190);
  for(const[x,h,w]of[[160,84,5],[172,110,7],[184,132,7],[196,70,4],[208,114,6],[221,84,5],[233,122,7],[243,70,4]]){c.fillStyle='rgba(14,34,24,.9)';c.fillRect(x,FHT-h-24,w,h);c.fillStyle='rgba(60,110,80,.14)';c.fillRect(x,FHT-h-24,1,h)}
  const fg=c.createRadialGradient(200,FHT-6,4,200,FHT-6,84);fg.addColorStop(0,'rgba(255,180,80,.6)');fg.addColorStop(.5,'rgba(255,150,60,.18)');fg.addColorStop(1,'rgba(255,150,60,0)');c.fillStyle=fg;c.fillRect(140,140,120,110);
  c.fillStyle='rgba(96,72,44,.9)';c.beginPath();c.moveTo(152,FHT);c.lineTo(248,FHT);c.lineTo(216,FHT-44);c.lineTo(184,FHT-44);c.closePath();c.fill();c.fillStyle='rgba(150,118,70,.35)';c.beginPath();c.moveTo(184,FHT);c.lineTo(200,FHT);c.lineTo(198,FHT-36);c.lineTo(194,FHT-36);c.closePath();c.fill();
  for(let i=0;i<6;i++){c.fillStyle='rgba(120,180,150,'+(.05+i*.012)+')';c.beginPath();c.ellipse(200+(i-2)*7,FHT-22-i*9,32,4,0,0,7);c.fill()}}
 c.restore();
 /* 4) los dos colmillos gigantes: nacen a los lados, se abren y se cruzan arriba */
 const PL=[[150,244],[84,196],[88,80],[214,44]],PR=PL.map(p=>[400-p[0],p[1]]);tusk(c,PL,1,R);tusk(c,PR,-1,R);
 /* 5) dientes que cuelgan de la unión y colmillos pequeños que nacen del suelo (la boca entera) */
 for(let i=-4;i<=4;i++){const x=200+i*9,top0=62+Math.abs(i)*4.4,len=18-Math.abs(i)*1.4;c.fillStyle='#e8e0c0';c.beginPath();c.moveTo(x-3.8,top0);c.lineTo(x+3.8,top0);c.lineTo(x+(i%2?.5:-.5),top0+len);c.closePath();c.fill();c.fillStyle='rgba(60,50,34,.55)';c.beginPath();c.moveTo(x+.4,top0);c.lineTo(x+3.8,top0);c.lineTo(x+(i%2?.5:-.5),top0+len);c.closePath();c.fill();c.strokeStyle='#2c2618';c.lineWidth=.8;c.beginPath();c.moveTo(x-3.8,top0);c.lineTo(x+(i%2?.5:-.5),top0+len);c.lineTo(x+3.8,top0);c.stroke()}
 for(const sx of[-1,1])for(let i=0;i<3;i++){const x=200+sx*(38+i*7),h=14-i*3;c.fillStyle='#ece4c4';c.beginPath();c.moveTo(x-3.2,FHT-1);c.lineTo(x+3.2,FHT-1);c.lineTo(x+sx*-1.2,FHT-1-h);c.closePath();c.fill();c.strokeStyle='#2c2618';c.lineWidth=.8;c.stroke()}
 /* 6) cráneo de raptor: clave del arco, con los ojos encendidos */
 frontSkull(c,200,28,1.25);glows.push([192,24,16,'255,170,60',.9,1],[208,24,16,'255,170,60',.9,2]);
 /* 7) árboles de los lados, delante del muro (no tapan los colmillos) */
 bigT('oak',34,244,1.25,0);bigT('oak',366,244,1.25,1);bigT('oak',70,238,1,1);bigT('oak',330,238,1,0);
 /* 8) nido en la cornisa de la izquierda y huesos */
 {const nx=100,ny=TOP(100)-1;nest(c,nx,ny,19,7,R,{eggs:3,es:5});for(const[dx,k]of[[-26,0],[27,1],[40,2]]){c.save();c.translate(nx+dx,ny+1);c.scale(1.1,1.1);bones(c,0,0,R,k);c.restore()}}
 /* 9) lianas */
 for(let i=0;i<16;i++){const x=30+R()*340;if(x>90&&x<310)continue;vine(c,x,TOP(x)+1,18+R()*46,R,R()*6)}
 for(const x of[176,184,216,224])vine(c,x,82,26+R()*34,R,R()*6);
 /* 10) faroles de cráneo y luces */
 skullLantern(c,134,238,R);skullLantern(c,266,238,R);glows.push([134,200,30,'255,176,70',.8,3],[266,200,30,'255,176,70',.8,4]);
 glows.push([200,228,60,'255,170,70',.8,5],[200,160,52,'255,150,50',.3,6]);
 /* 11) al pie: arbustos, helechos, setas y piedras */
 for(const x of[18,56,108,142,258,292,344,382]){const b=pick(R,SP.bush2||SP.bush||[mk(1,1)]);c.drawImage(b,Math.round(x-b.width/2),Math.round(FHT-b.height+2))}
 for(const x of[40,84,112,150,250,310,356]){const f=pick(R,SP.fern||[mk(1,1)]);c.drawImage(f,Math.round(x-f.width/2),Math.round(FHT-f.height+1))}
 for(let i=0;i<14;i++)U.mush(c,24+R()*352,FHT-3-R()*8,R,R()<.4);
 for(let i=0;i<9;i++)rock(c,30+R()*340,FHT-1,12+R()*12,8+R()*6,R);
 return{cv,glows,eyes:[[188,208],[212,208]],door:[200,FHT],arch:[160,240,72],skull:[200,28]}};
})();
/* ═══════════ v437 · MINI-JEFES (cliente) · parte 13: EL BOSQUE DE LOS COLMILLOS (Velociraptor) · gestor ═══════════
   Por fuera: un bosque vivo (árboles, claros y senderos de tierra pisada que salen de la misma geometría que usa el servidor), suelo de bosque de jade, y el PORTAL DE LOS COLMILLOS (fachada de mjc12.js:
   dos colmillos gigantes que se cruzan sobre una boca oscura, cráneo con ojos ámbar, faroles de cráneo, nido en la cornisa) sobre un telón de bosque, con explanada, huellas, totems y fogata.
   Por dentro: cuatro zonas a pantalla completa con el motor de interiores de Karez (Senda de los Colmillos · Cañada de los Nidos · Colina de las Huellas · Claro del Depredador, mjc10/11.js),
   con las criaturas del bosque, copas de árboles que pasan POR ENCIMA de quien camina detrás (y se vuelven translúcidas), hierba alta que reacciona a quien pasa, luciérnagas y el nido-altar del Claro.
   Lo que decide el servidor (presencia, turno, vida del jefe, hierba quemada, premio) no cambia: aquí solo se ven y se pisan los lugares. La pelea es de mjc14.js. */
(function(){
'use strict';
const MJ=window.MJC,RA=window.MJRA,MAN=window.MJMAN;if(!MJ||!MJ.ST||!RA||!RA.build||!RA.facade||!MAN||!MAN.reg)return;
const ST=MJ.ST,$=id=>document.getElementById(id),K=window.MJH.K,mk=K.mk,rngf=K.rngf;
const geo=()=>{const s=ST.b&&ST.b.rap;return s&&s.geo};
const fo=()=>{const g=geo();return g&&g.fo};
const MN0=[1340,846];
const mn=()=>{const g=geo();return(g&&g.mn)||MN0};
const cl=(v,a,b)=>v<a?a:v>b?b:v;
const inInt=()=>typeof KZ!=='undefined'&&KZ.on&&KZ.sc&&KZ.sc.hid==='rap';
const RAP=window.MJRAP={};
/* ═════════ el bosque: la huella del portal y los árboles ═════════ */
// geometría del bosque: ES LA MISMA que usa el servidor (minijefes.js, entre las marcas GEO3 y FINGEO3): el build y las pruebas comprueban que el texto sea idéntico
/*GEO3*/
 const foH=(x,y,s)=>{let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1274126177))|0;h=Math.imul(h^(h>>>13),1103515245);h^=h>>>16;return(h>>>0)/4294967296};
 const foN=(x,y,s)=>{const k=7,gx=Math.floor(x/k),gy=Math.floor(y/k),fx=x/k-gx,fy=y/k-gy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=foH(gx,gy,s),b=foH(gx+1,gy,s),c=foH(gx,gy+1,s),e=foH(gx+1,gy+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+e)*u*v};
 const foSeg=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/l)):0;return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)};
 const foCell=(F,x,y)=>{const r=F.r;if(x<r[0]||y<r[1]||x>=r[0]+r[2]||y>=r[1]+r[3])return 0;const px=x+.5,py=y+.5,g=F.g;
  if(Math.abs(px-g[0]-.5)<=F.gw&&py>g[1]-F.gd&&py<=g[1]+1)return 3;
  if(Math.abs(px-g[0]-.5)<=F.ge&&py>g[1]+1&&py<=g[1]+1+F.gx)return 2;
  for(const q of F.x)if(px>=q[0]&&px<q[0]+q[2]&&py>=q[1]&&py<q[1]+q[3])return 0;
  for(const c of F.c)if((px-c[0])*(px-c[0])+(py-c[1])*(py-c[1])<c[2]*c[2])return 0;
  for(const t of F.t)for(let i=0;i<t.length-1;i++)if(foSeg(px,py,t[i],t[i+1])<=F.tw)return 0;
  const e=Math.min(px-r[0],py-r[1],r[0]+r[2]-px,r[1]+r[3]-py),n=foN(px,py,F.s);
  return foH(x,y,F.s+7)<F.d*(.35+1.3*n)*Math.min(1,e/F.fe)?4:0};
 /*FINGEO3*/
/* 0 = como estaba · 3 = huella sólida del portal (la tapa la fachada) · 2 = explanada despejada · 4 = árbol (sólido) */
RAP.cell=(x,y)=>{const F=fo();return F?foCell(F,x,y):0};
/* ── lo que foCell deja en 0, solo para el cliente: 1 = zona sin árboles (la cueva: no se toca) · 2 = claro · 3 = sendero de tierra ── */
const bbOf=F=>F._bb||(F._bb=F.t.map(t=>{let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const p of t){if(p[0]<a)a=p[0];if(p[1]<b)b=p[1];if(p[0]>c)c=p[0];if(p[1]>d)d=p[1]}return[a-F.tw,b-F.tw,c+F.tw,d+F.tw]}));
function foSub(F,x,y){const px=x+.5,py=y+.5;for(const q of F.x)if(px>=q[0]&&px<q[0]+q[2]&&py>=q[1]&&py<q[1]+q[3])return 1;
 for(const c of F.c)if((px-c[0])*(px-c[0])+(py-c[1])*(py-c[1])<c[2]*c[2])return 2;
 const bb=bbOf(F);for(let j=0;j<F.t.length;j++){const b=bb[j];if(px<b[0]||py<b[1]||px>b[2]||py>b[3])continue;const t=F.t[j];for(let i=0;i<t.length-1;i++)if(foSeg(px,py,t[i],t[i+1])<=F.tw)return 3}return 0}
/* códigos guardados por casilla del territorio: bajos 3 bits = foCell · 8 sendero · 16 claro · 32 sin árboles */
let KC=null,KR=null,stDone=false,rgvOk=false,stKey='',stRow=0,stBusy=false;
const keyOf=F=>JSON.stringify([F.r,F.g,F.gw,F.gd,F.ge,F.gx,F.s,F.d,F.fe,F.tw]);
RAP.ready=()=>stDone;
RAP.sub=(x,y)=>{if(!KC||!KR)return 0;const i=x-KR[0],j=y-KR[1];if(i<0||j<0||i>=KR[2]||j>=KR[3])return 0;return KC[j*KR[2]+i]};   /* códigos de la casilla: bajos 3 bits = foCell · 8 sendero · 16 claro · 32 sin árboles */
function stampSlice(F){const r=F.r,w=r[2],h=r[3],gx=F.g[0];let n=0;
 while(stRow<h&&n<7){const y=r[1]+stRow;
  for(let i=0;i<w;i++){const x=r[0]+i,k=foCell(F,x,y),o=y*W+x;let f=k;
   if(k===3){M[y][x]=2;TREE[o]=0}                                                   /* huella del portal: roca maciza bajo la fachada (no se puede talar) */
   else if(k===2){TREE[o]=0;M[y][x]=(Math.abs(x+.5-gx-.5)<=2.5||(y<=F.g[1]+4&&Math.abs(x+.5-gx-.5)<=6.5))?4:0}   /* explanada: camino de tierra de 5 casillas y plaza ante la boca */
   else if(k===4){if(M[y][x]===1)M[y][x]=0;if(M[y][x]<2||M[y][x]===4)TREE[o]=1}      /* árbol sólido (se dibuja en el bucle de casillas del mundo) */
   else{const s=foSub(F,x,y);f=s===3?8:s===2?16:s===1?32:0;
    if(s===3){M[y][x]=4;TREE[o]=0}                                                   /* senderos: tierra pisada (casilla de camino del mundo) */
    else if(s===2){if(M[y][x]===2||M[y][x]===3)M[y][x]=0;TREE[o]=0}}                /* claros: sin rocas ni agua ni árboles */
   KC[stRow*w+i]=f|(k&7)}
  stRow++;n++}
 return stRow>=h}
function stampTick(){try{if(typeof M==='undefined'||typeof TREE==='undefined'||typeof W==='undefined')return;const F=fo();if(!F)return;const key=keyOf(F),r=F.r;
  if(key!==stKey){if(!M[r[1]]||!M[r[1]+r[3]-1])return;stKey=key;stDone=false;rgvOk=false;stRow=0;KR=r.slice();KC=new Uint8Array(r[2]*r[3])}
  if(!stDone&&!stBusy){stBusy=true;const go=()=>{try{if(stampSlice(F)){stDone=true;stBusy=false;try{LCX=-1}catch(e){}return}}catch(e){stBusy=false;try{console.error('MJRAP.stamp',e)}catch(x){}return}setTimeout(go,24)};go()}
  if(stDone&&!rgvOk&&window.RGV)applyRGV(F)}catch(e){}}
/* suelo de bosque de jade en TODO el territorio (solo lo que se ve: el servidor, el clima y los niveles siguen con la región real). El borde es irregular, no un rectángulo. */
function applyRGV(F){const V=window.RGV,r=KR,w=r[2],h=r[3];if(!V||!KC)return;
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const x=r[0]+i,y=r[1]+j,c=KC[j*w+i],e=Math.min(i+.5,j+.5,w-i-.5,h-j-.5);
  if((c&7)>=2||e>3+8*foN(x,y,F.s+31))V[y*W+x]=1}
 rgvOk=true;try{LCX=-1}catch(e){}}
setInterval(stampTick,500);RAP.stamp=stampTick;
/* ¿en qué nombre de zona estoy? (el HUD lo usa) */
RAP.zn=function(Pp){const F=fo();if(!F||!Pp)return null;const r=F.r,x=Pp.x/32,y=Pp.y/32;if(x<r[0]||y<r[1]||x>=r[0]+r[2]||y>=r[1]+r[3])return null;return{n:'Bosque de los Colmillos',l:'Territorio del Velociraptor · Nv 95–110'}};
MJ.zn=Pp=>{try{return RAP.zn(Pp)}catch(e){return null}};
/* ═════════ arte: se hornea la primera vez que hace falta ═════════ */
let ART=null,ARTBUSY=0,ARTW=[];
const NPK=['oak','slim','bush','bush2','fern','plant','flower','stump2'];
function loadNpd(cb){const npd={};let n=NPK.length;const done=()=>{if(--n===0)cb(npd)};
 for(const k of NPK){const d=typeof NPD!=='undefined'&&NPD[k];if(!d||!d[2]){done();continue}const i=new Image();i.onload=()=>{npd[k]=i;done()};i.onerror=done;i.src=d[2]}}
function install(){if(!ART)return;for(const k of['S','G','1','2'])KZD.lv['rap.'+k]=ART.levels[k];KZD.hn.rap={nm:'Bosque de los Colmillos',th:0,fl:'forest'};KZ.img.rap={s:2,im:ART.atlas,cb:[],t:performance.now()+1e12}}
/* telón de bosque oscuro bajo la fachada (con margen): copas de los mismos árboles del juego, muy oscurecidas */
const BM=44;
/* máscara de bordes suaves (l,r,t,b = ancho del degradado en px de lienzo; 0 = borde duro): evita que se vean rectángulos de cartón */
function fadeMask(q,W,H,l,r,t,b){q.save();q.globalCompositeOperation='destination-in';
 if(l||r){const gr=q.createLinearGradient(0,0,W,0);gr.addColorStop(0,l?'rgba(0,0,0,0)':'rgba(0,0,0,1)');if(l)gr.addColorStop(Math.min(.49,l/W),'rgba(0,0,0,1)');if(r)gr.addColorStop(Math.max(.51,1-r/W),'rgba(0,0,0,1)');gr.addColorStop(1,r?'rgba(0,0,0,0)':'rgba(0,0,0,1)');q.fillStyle=gr;q.fillRect(0,0,W,H)}
 if(t||b){const gr=q.createLinearGradient(0,0,0,H);gr.addColorStop(0,t?'rgba(0,0,0,0)':'rgba(0,0,0,1)');if(t)gr.addColorStop(Math.min(.49,t/H),'rgba(0,0,0,1)');if(b)gr.addColorStop(Math.max(.51,1-b/H),'rgba(0,0,0,1)');gr.addColorStop(1,b?'rgba(0,0,0,0)':'rgba(0,0,0,1)');q.fillStyle=gr;q.fillRect(0,0,W,H)}
 q.restore()}
function mkBack(SP){const BW=RA.FW+2*BM,BH=RA.FH+BM,c=mk(BW,BH),q=c.getContext('2d'),R=rngf(4391);q.imageSmoothingEnabled=false;
 q.fillStyle='#0a170e';q.fillRect(0,BM*.7,BW,BH);
 const trees=[];for(let row=0;row<11;row++){const y=BM*.9+row*21;for(let x=-24;x<BW+30;x+=24+(row%2)*7){trees.push([x+(R()-.5)*14,y+(R()-.5)*9,R()<.62?'oak':'slim',R()])}}
 for(const[x,y,k,u]of trees){const lst=SP[k]||SP.oak;if(!lst)continue;const cv=lst[(u*lst.length)|0];q.drawImage(cv,Math.round(x-cv.width/2),Math.round(y-cv.height))}
 q.fillStyle='rgba(2,10,6,.42)';q.fillRect(0,0,BW,BH);
 fadeMask(q,BW,BH,BM+14,BM+14,34,14);
 return c}
/* falda de maleza: tapa la unión recta de la fachada con la explanada (arbustos, helechos y una sombra suave; deja libre la boca) */
const SKH=40,SKS=26;
function mkSkirt(SP){const BW=RA.FW+2*BM,c=mk(BW,SKH),q=c.getContext('2d'),R=rngf(4397);q.imageSmoothingEnabled=false;
 const sg=q.createLinearGradient(0,SKS-5,0,SKS+13);sg.addColorStop(0,'rgba(3,9,5,.5)');sg.addColorStop(1,'rgba(3,9,5,0)');q.fillStyle=sg;q.fillRect(0,SKS-5,BW,18);
 const mid=BM+RA.FW/2,mouth=58,kinds=['bush2','fern','bush','plant','fern','bush2'];
 for(let x=-4;x<BW+6;x+=9+R()*13){if(Math.abs(x-mid)<mouth)continue;const lst=SP[kinds[(R()*kinds.length)|0]]||SP.bush||SP.fern;if(!lst||!lst.length)continue;const s=lst[(R()*lst.length)|0];q.drawImage(s,Math.round(x-s.width/2),Math.round(SKS+1+R()*8-s.height))}
 fadeMask(q,BW,SKH,BM+8,BM+8,0,0);
 return c}
/* explanada del portal: huellas gigantes que van hacia la boca, huesos, marcas de garras, tótems, carteles y una fogata (se pinta una vez) */
const PZW=24,PZH=15;
function mkPlaza(SP){const c=mk(PZW*16,PZH*16),q=c.getContext('2d'),R=rngf(4393),U=RA._u;q.imageSmoothingEnabled=false;
 for(let i=0;i<7;i++)U.print(q,192+(i%2?7:-7),PZH*16-26-i*27,(R()-.5)*.14,1.05,R);
 for(let i=0;i<30;i++){const x=40+R()*304,y=24+R()*190;if(Math.abs(x-192)<24&&R()<.8)continue;if(R()<.5)U.bones(q,x,y,R,U.ri(R,0,2));else U.claws(q,x,y,R()*3,.9+R()*.5,'rgba(18,10,6,.6)')}
 for(let i=0;i<4;i++)U.print(q,60+R()*260,40+R()*160,R()*6.28,.95+R()*.2,R);
 RA._ribcage(q,52,196,R,false);RA._ribcage(q,334,206,R,true);
 RA._totem(q,192-112,64,R);RA._totem(q,192+112,64,R);RA._signpost(q,192-60,176,-1,R);RA._signpost(q,192+60,176,1,R);RA._firepit(q,192-98,112,R);
 for(let i=0;i<6;i++)U.egg(q,60+R()*260,170+R()*50,2.4+R(),R);
 return c}
function ensureArt(cb){if(ART){install();cb(ART);return}if(ARTBUSY){ARTW.push(cb);return}ARTBUSY=1;ARTW=[cb];
 loadNpd(npd=>{try{const SP=RA._sprites(npd),r=RA.build({npd});ART={atlas:r.atlas,levels:r.levels,ovl:r.ovl,fac:RA.facade(npd,SP),back:mkBack(SP),skirt:mkSkirt(SP),plaza:mkPlaza(SP)};install()}catch(e){try{console.error('mjrap',e)}catch(x){}ART=null}
  const w=ARTW;ARTW=[];ARTBUSY=0;w.forEach(f=>f(ART))})}
RAP.ensureArt=ensureArt;RAP.art=()=>ART;
/* ═════════ sprites de luz y partículas ═════════ */
let GLW=null;
function glowSpr(){if(GLW)return GLW;const c=mk(48,48),q=c.getContext('2d'),gr=q.createRadialGradient(24,24,0,24,24,24);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.18,'rgba(255,255,255,.7)');gr.addColorStop(.5,'rgba(255,255,255,.16)');gr.addColorStop(1,'rgba(255,255,255,0)');q.fillStyle=gr;q.fillRect(0,0,48,48);GLW=c;return c}
const TINT={};
function tintGlow(col){if(TINT[col])return TINT[col];const c=mk(48,48),q=c.getContext('2d'),gr=q.createRadialGradient(24,24,0,24,24,24),p=col.split(',');
 gr.addColorStop(0,'rgba(255,255,230,1)');gr.addColorStop(.2,'rgba('+col+',.85)');gr.addColorStop(.55,'rgba('+col+',.2)');gr.addColorStop(1,'rgba('+col+',0)');q.fillStyle=gr;q.fillRect(0,0,48,48);return TINT[col]=c}
/* luciérnagas: n puntos que deambulan alrededor de anclas fijas (px de pantalla = ancla − cámara) */
function fireflies(cx,cy,now,anch,n,seed,col,sz){const spr=tintGlow(col||'210,255,120'),R=rngf(seed);g.save();g.globalCompositeOperation='lighter';
 for(let i=0;i<n;i++){const a=anch[(R()*anch.length)|0],ph=R()*6.28,sp=.25+R()*.4,rx=14+R()*30,ry=8+R()*20,bl=1.1+R()*1.4,sk=.7+.5*R(),t=now*sp+ph;
  const x=a[0]+Math.sin(t)*rx+Math.sin(t*2.3+i)*5-cx,y=a[1]+Math.cos(t*.8)*ry-Math.abs(Math.sin(t*.5))*10-cy;if(x<-30||x>VW+30||y<-30||y>VH+30)continue;
  const al=.35+.65*Math.max(0,Math.sin(now*bl+i*1.9));g.globalAlpha=al*.9;const s=(sz||14)*sk;g.drawImage(spr,Math.round(x-s/2),Math.round(y-s/2),s,s)}
 g.globalAlpha=1;g.restore()}
/* ═════════ gancho del dibujo del suelo (antes de las criaturas) ═════════ */
const nearPortal=pad=>{const F=fo();if(!F)return false;const px=P.x/T,py=P.y/T,q=F.g;return px>=q[0]-F.gw-pad&&px<=q[0]+F.gw+pad&&py>=q[1]-F.gd-pad&&py<=q[1]+F.gx+pad};
let ARTREQ=0,ANCH=null,EYE=null;
function drawPortal(cx,cy,now){if(!ART)return;const m=mn(),F=ART.fac,bx=(m[0]+.5)*T,by=(m[1]+1)*T,x0=Math.round(bx-RA.FW-cx),y0=Math.round(by-RA.FH*2-cy);
 if(x0>VW+120||x0+RA.FW*2<-120||y0>VH+120||y0+RA.FH*2<-120)return;
 g.imageSmoothingEnabled=false;
 /* explanada: dibujos del suelo (3 casillas a cada lado de la fachada) */
 g.drawImage(ART.plaza,Math.round(bx-PZW*16-cx),Math.round(by-cy),PZW*32,PZH*32);
 /* telón de bosque oscuro bajo la fachada */
 g.drawImage(ART.back,Math.round(x0-BM*2),Math.round(y0-BM*2),(RA.FW+2*BM)*2,(RA.FH+BM)*2);
 /* luz de fondo: el portal respira un resplandor verdoso-ámbar */
 g.save();g.globalCompositeOperation='lighter';{const dx=x0+RA.FW,dy=y0+RA.FH*1.7,gr=g.createRadialGradient(dx,dy,20,dx,dy,520);gr.addColorStop(0,'rgba(255,170,70,'+(.2+.05*Math.sin(now*1.3)).toFixed(3)+')');gr.addColorStop(.5,'rgba(120,200,110,.06)');gr.addColorStop(1,'rgba(120,200,110,0)');g.save();g.translate(dx,dy);g.scale(1.3,.8);g.translate(-dx,-dy);g.fillStyle=gr;g.fillRect(dx-520,dy-520,1040,1040);g.restore()}g.restore();
 g.drawImage(F.cv,x0,y0,RA.FW*2,RA.FH*2);
 /* falda de maleza sobre la unión con la explanada */
 g.drawImage(ART.skirt,Math.round(x0-BM*2),Math.round(y0+RA.FH*2-SKS*2),(RA.FW+2*BM)*2,SKH*2);
 /* luces: ventanas de la boca, faroles de cráneo y ojos del cráneo */
 g.save();g.globalCompositeOperation='lighter';
 for(let i=0;i<F.glows.length;i++){const q=F.glows[i],gx=x0+q[0]*2,gy=y0+q[1]*2,fl=.78+.22*Math.sin(now*(1.9+i*.37)+i*2.1)+.07*Math.sin(now*12+i),r=Math.max(18,q[2])*2.6,sp=tintGlow(q[3]);g.globalAlpha=Math.min(.95,q[4]*fl*.9);g.drawImage(sp,Math.round(gx-r),Math.round(gy-r),r*2,r*2)}
 g.globalAlpha=1;
 /* ojos ámbar dentro de la boca: parpadean y miran hacia donde está el héroe */
 {const t=now%9,bl=t>8.55&&t<8.75?0:1,look=cl((P.x-(bx))/260,-1,1)*2.2;for(const e of F.eyes){const ex=x0+e[0]*2+look,ey=y0+e[1]*2;g.globalAlpha=(.55+.4*Math.sin(now*.9+e[0]))*bl;const s=44;g.drawImage(tintGlow('255,170,50'),Math.round(ex-s/2),Math.round(ey-s/2),s,s);g.globalAlpha=bl;g.fillStyle='#ffe9a0';g.fillRect(Math.round(ex-2),Math.round(ey-3),4,5)}g.globalAlpha=1}
 g.restore();
 /* brasas que suben de la boca y de los faroles, y niebla baja en la explanada */
 g.save();g.globalCompositeOperation='lighter';for(let k=0;k<16;k++){const f=((now*.17+k*.0625)%1),ex=(k%2?-1:1)*(10+((k*37)%60))+Math.sin(now*.8+k*1.9)*8,sx=x0+RA.FW+ex,sy=y0+RA.FH*2-30-f*(130+(k%4)*20);g.fillStyle='rgba(255,'+(150+(k*9)%80)+',60,'+(.8*Math.sin(f*3.14)).toFixed(3)+')';g.fillRect(Math.round(sx),Math.round(sy),2,2)}g.restore();
 g.save();for(let k=0;k<4;k++){const fx=bx-cx+(k-1.5)*180+Math.sin(now*.2+k*2)*40,fy=by-cy+30+k*18+Math.sin(now*.3+k)*5,r=170,gr=g.createRadialGradient(fx,fy,2,fx,fy,r);gr.addColorStop(0,'rgba(150,215,170,.16)');gr.addColorStop(1,'rgba(150,215,170,0)');g.save();g.translate(fx,fy);g.scale(1,.26);g.translate(-fx,-fy);g.fillStyle=gr;g.fillRect(fx-r,fy-r,r*2,r*2);g.restore()}g.restore();
 /* fogata de la explanada: llamas y luz que bailan */
 {const fx=Math.round(bx-PZW*16-cx+(192-98)*2),fy=Math.round(by-cy+110*2);if(fx>-80&&fx<VW+80&&fy>-80&&fy<VH+80){g.save();g.globalCompositeOperation='lighter';const f=.8+.2*Math.sin(now*9)+.08*Math.sin(now*23);
  for(const[w,s,c]of[[9,.55,'rgba(255,90,20,.75)'],[6,.8,'rgba(255,170,50,.8)'],[3.2,1,'rgba(255,240,170,.9)']]){const hh=(20+Math.sin(now*7+w)*4)*s*f;g.fillStyle=c;g.beginPath();g.moveTo(fx-w,fy);g.quadraticCurveTo(fx-w*.6,fy-hh*.55,fx+Math.sin(now*5+w)*2,fy-hh);g.quadraticCurveTo(fx+w*.6,fy-hh*.55,fx+w,fy);g.closePath();g.fill()}
  const r=130*f;g.globalAlpha=.55;g.drawImage(tintGlow('255,150,60'),fx-r,fy-r*.8,r*2,r*1.6);g.restore()}}}
/* hierba alta del exterior: en la mancha de casillas libres cerca del héroe, hojas que se doblan al pasar (se suman a los matojos fijos de mjc2.js) */
function drawFlies(cx,cy,now){const F=fo();if(!F||!KC)return;const px=P.x/T,py=P.y/T,r=F.r;if(px<r[0]-4||py<r[1]-4||px>r[0]+r[2]+4||py>r[1]+r[3]+4)return;
 const bx=Math.floor(P.x/96)*96,by=Math.floor(P.y/96)*96;if(!ANCH||ANCH.k!==bx+','+by){const R=rngf(((bx/96)*73856093^(by/96)*19349663)>>>0),a=[];for(let i=0;i<12;i++)a.push([bx-96+R()*288,by-96+R()*288]);a.k=bx+','+by;ANCH=a}
 fireflies(cx,cy,now,ANCH,16,77,'200,255,110',15)}
let ZT=0,HOUR=0;
let g0=MJ.ground;
MJ.ground=function(cx,cy,now){
 if(typeof KZ!=='undefined'&&KZ.on){try{if(inInt())drawInt(cx,cy,now)}catch(e){if(!RAP.err){RAP.err=1;try{console.error('MJRAP.int',e)}catch(x){}}}try{g0&&g0(cx,cy,now)}catch(e){}return}
 try{if(ST.ready&&typeof LZ=='function'&&!LZ()&&fo()){
   if(nearPortal(40)){if(!ART&&performance.now()-ARTREQ>8000){ARTREQ=performance.now();ensureArt(()=>{})}drawPortal(cx,cy,now)}
   drawFlies(cx,cy,now);
   {const F=fo(),r=F.r,x=P.x/T,y=P.y/T;if(x>=r[0]&&y>=r[1]&&x<r[0]+r[2]&&y<r[1]+r[3]){const e=Math.min(x-r[0],y-r[1],r[0]+r[2]-x,r[1]+r[3]-y),k=cl(e/14,0,1);
     g.fillStyle='rgba(6,26,12,'+(.08*k).toFixed(3)+')';g.fillRect(0,0,VW,VH);
     if(!ZT&&e>3){ZT=1;try{toast('🌲 Bosque de los Colmillos · territorio del Velociraptor · criaturas de Nv 95 a 110',4500)}catch(e2){}}}}}}catch(e){if(!RAP.err){RAP.err=1;try{console.error('MJRAP',e)}catch(x){}}}
 try{g0&&g0(cx,cy,now)}catch(e){}};
/* ═════════ entrar y salir ═════════ */
const doorPos=()=>{const m=mn();return[(m[0]+.5)*T,(m[1]+.4)*T]};
function nearDoor(){if(typeof KZ==='undefined'||KZ.on||typeof INT==='undefined'||INT.on||(typeof DG!=='undefined'&&DG.f))return false;const d=doorPos();return Math.hypot(P.x-d[0],P.y-d[1])<=170&&P.y>d[1]}
RAP.enter=function(){if(!KZ.ok||KZ.lock||modal||INT.on||DG.f){if(!KZ.ok)toast('⚠️ El bosque no está disponible ahora',3000);return}
 if(!nearDoor()){toast('🚶 Acércate a la boca del portal de colmillos',1800);return}
 toast('⏳ Entras bajo los colmillos… el bosque se cierra a tu espalda',2200);KZ.lock=1;setTimeout(()=>{KZ.lock=0},1500);
 ensureArt(a=>{if(!a){toast('⚠️ No se pudo abrir el portal: revisa tu conexión',3500);return}
  const ret={x:P.x,y:Math.max(P.y,(mn()[1]+1.6)*T)};
  if(kzBegin(ret,'rap.G','street')){if(!P.mjvr){P.mjvr=1;toast('🌲 El Bosque de los Colmillos · cuatro zonas. Aquí cazan los raptores… y en el Claro más hondo, el Depredador.',7000)}}})};
RAP.leave=function(){if(!KZ.on||modal)return;INT.keep=0;intExit()};
/* ═════════ botones de contexto ═════════ */
const cxel=$('ctx'),mkb=(id,fn)=>{const b=document.createElement('button');b.id=id;b.hidden=true;b.onclick=fn;if(cxel)cxel.appendChild(b);return b};
const bEnt=mkb('mjentr',()=>RAP.enter()),bAlt=mkb('mjaltr',()=>{if(MJ.openDiary)MJ.openDiary('rap',1)});
const altarPos=()=>[INT.ox+RA.NEST[0]*T,INT.oy+RA.NEST[1]*T];
RAP.nearAltar=function(){if(!inInt()||KZ.sc.lv!=='S')return false;const a=altarPos();return Math.hypot(P.x-a[0],(P.y-a[1])*.9)<190};
function ctxTick(){try{const hide=typeof modal!=='undefined'&&modal;let e=!hide&&ST.ready&&nearDoor(),a=!hide&&RAP.nearAltar()&&!(window.MJA&&MJA.on);
 bEnt.hidden=!e;if(e)bEnt.textContent='🌲 Entrar al Bosque de los Colmillos';bAlt.hidden=!a;if(a)bAlt.textContent='🕯️ Nido-altar de la ofrenda'}catch(x){}}
setInterval(ctxTick,180);
/* ═════════ zonas: criaturas y reglas ═════════ */
const MOBS={G:{ti:27,n:12,lv:[95,98],p:[['mjRap',5],['wolfN',3],['snakeV',2],['spiderW',2]]},'1':{ti:29,n:13,lv:[98,104],p:[['mjRap',6],['snakeK',2],['spiderC',2],['wolfA',2],['snakeP',1]]},'2':{ti:31,n:12,lv:[104,110],p:[['mjRap',5],['lionD',2],['spiderB',2],['snakeR',2],['wolfA',1]]}};   /* lv: nivel que se muestra (los de este territorio son de 95 a 110; el jefe, 120) */
function clearMobs(){for(let i=E.length-1;i>=0;i--)if(E[i].mjr)E.splice(i,1)}   /* v437: bandera propia del bosque (mjr): el castillo (mjn) y la mansión (mjm) conservan las suyas aunque este manejador corra después del suyo */
function spawn(lv){clearMobs();const S=KZ.sc,cfg=MOBS[lv];if(!cfg||!S)return;const R=rngf(S.id.charCodeAt(4)*173+37),fl=[];
 for(let y=1;y<S.h-1;y++)for(let x=1;x<S.w-1;x++)if(S.g[y][x]=='.'&&S.g[y][x-1]=='.'&&S.g[y][x+1]=='.'&&S.g[y-1][x]=='.'&&S.g[y+1][x]=='.')fl.push([x,y]);
 const keep=[],near=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),avoid=[];for(const k in S.ar)avoid.push([S.ar[k][0],S.ar[k][1],k==='street'?11:8]);   /* entrada desde la calle: margen amplio para que nadie caiga encima de una manada */
 for(const q of kzStairs(S))avoid.push([(q.x0+q.x1)/2,(q.y0+q.y1)/2,8]);const ex=kzExitCells(S);if(ex)avoid.push([(ex.x0+ex.x1)/2,(ex.y0+ex.y1)/2,8]);
 const list=[];for(const[k,c]of cfg.p)for(let i=0;i<c;i++)list.push(k);
 let nvi=0;for(const k of list){let c=null;for(let t=0;t<90;t++){const q=fl[(R()*fl.length)|0];if(!q)break;if(avoid.some(a=>near(a,q)<a[2]))continue;if(keep.some(a=>near(a,q)<4.5))continue;c=q;break}if(!c)continue;keep.push(c);
  const tx=INT.ox/T+c[0],ty=INT.oy/T+c[1],e={dg:DG.f,chase:440,lz:640,mjn:1,mjr:1};placeE(e,tx,ty,cfg.ti);try{applyVar(e,k)}catch(x){}if(k==='mjRap'){e.nm='Raptor joven';e.sp*=1.35}e.hx=tx*T+16;e.hy=ty*T+16;e.x=e.hx;e.y=e.hy;{const a=cfg.lv[0],b=cfg.lv[1];e.nv=a+((nvi++*3)%(b-a+1))}E.push(e)}
 try{EAn=-1}catch(x){}}
RAP.onScene=function(sid){try{if(!/^rap\./.test(sid)){clearMobs();return}const lv=sid.slice(4);clearMobs();CLU=CLU||mkClumps();if(lv!=='S')spawn(lv)}catch(e){try{console.error('MJRAP.scene',e)}catch(x){}}};
RAP.after=function(){clearMobs()};
RAP.busy=function(){const s=ST.b&&ST.b.rap;return!!(s&&s.st&&s.st!=='AVAILABLE')&&!(window.MJA&&MJA.on)};
RAP.canGo=function(sid,from){
 /* durante la pelea la senda del Claro está cerrada por zarzas: no se sale hasta que acabe (o hasta salir con 🚪) */
 if(from==='S'&&window.MJA&&MJA.on&&!MJA.done&&!MJA.quit&&!MJA.fell){toast('🌿 Una muralla de zarzas espinosas cierra la senda…',3200);return false}
 /* el Claro NO se cierra con la arena ocupada: ahí se pide turno y quien llega tarde debe poder ponerse en la cola (la pelea es virtual: cada peleador la ve en su pantalla) */
 if(sid==='rap.S'){const warn=()=>{try{if(KZ.on&&KZ.sc&&KZ.sc.id==='rap.S'&&RAP.busy()&&!(ST.b.rap.turn||ST.b.rap.fight))toast('🦖 El Velociraptor está cazando a otro grupo. Pide turno en el nido-altar y espera tu lugar en la cola.',4600)}catch(e){}};
  try{Promise.resolve(MJ.load&&MJ.load(1)).then(()=>setTimeout(warn,700))}catch(e){}}
 return true};
/* texto de los cruces entre zonas (en un bosque no hay «escaleras») */
const STX={'G:L':'⬅ Senda a la Cañada de los Nidos','G:R':'➡ Senda al Claro del Depredador','1:L':'⬅ Volver a la Senda de los Colmillos','1:R':'➡ Subir a la Colina de las Huellas','2:R':'⬅ Bajar a la Cañada de los Nidos','S:R':'↩ Volver a la Senda de los Colmillos'};
RAP.stairTxt=function(S,s,t){return STX[S.lv+':'+s.side]||''};
RAP.place=()=>'Bosque de los Colmillos';
/* ═════════ el dibujo vivo de cada zona ═════════ */
/* manchas de hierba alta: matojos fijos (deterministas) de la escena S */
let CLU=null;
function mkClumps(){return RA.PATCH.map((p,k)=>{const R=rngf(8101+k*37),cs=[],rad=p[2]*T,st=11;for(let oy=-rad;oy<=rad;oy+=st)for(let ox=-rad;ox<=rad;ox+=st){const x=ox+(R()-.5)*st*.9,y=oy+(R()-.5)*st*.9;if(Math.hypot(x/rad,y/rad)>1)continue;cs.push({x,y,h:27+R()*19,ph:R()*6.28,c:(R()*3)|0,n:3+((R()*3)|0),s:(R()-.5)*8,d:Math.hypot(x,y)/rad})}cs.sort((a,b)=>a.y-b.y);return{cs,cx:p[0]*T,cy:p[1]*T,r:rad}})}
const GC=['#3f7a34','#4f9440','#6ab04f'],GT='#9bd870';
/* estado de una mancha según la pelea (mjc14.js): {m:'ok'|'burn'|'ash', p:progreso del fuego 0..1, g:rebrote 0..1, cue:aviso de emboscada 0..1} */
const gstat=k=>{try{return(window.MJRF&&MJRF.gs&&MJRF.gs(k))||null}catch(e){return null}};
function actorsPx(cx,cy){const a=[{x:P.x-cx,y:P.y+8-cy,s:15,r:40,w:22}];try{const b=window.MJRF&&MJRF.boss&&MJRF.boss();if(b)a.push({x:b.x-cx,y:b.y+8-cy,s:26,r:58,w:34,boss:1,hid:b.hid})}catch(e){}return a}
function grass(cx,cy,now,pass){if(!CLU)CLU=mkClumps();const S=KZ.sc;if(!S||S.lv!=='S')return;const AC=actorsPx(cx,cy);
 for(let k=0;k<CLU.length;k++){const pt=CLU[k],X=INT.ox+pt.cx-cx,Y=INT.oy+pt.cy-cy;if(X<-pt.r-60||X>VW+pt.r+60||Y<-pt.r-80||Y>VH+pt.r+60)continue;
  const st=gstat(k)||{m:'ok',p:0,g:1,cue:0},m=st.m,gr=st.g==null?1:st.g;
  if(pass===0&&(m==='burn'||m==='ash')){g.save();g.translate(X,Y);g.scale(1,.72);const q=g.createRadialGradient(0,0,6,0,0,pt.r*1.05);q.addColorStop(0,'rgba(10,6,4,'+(m==='ash'?.62:.4*Math.min(1,st.p*3)).toFixed(3)+')');q.addColorStop(.75,'rgba(24,16,10,'+(m==='ash'?.4:.24*Math.min(1,st.p*3)).toFixed(3)+')');q.addColorStop(1,'rgba(24,16,10,0)');g.fillStyle=q;g.beginPath();g.arc(0,0,pt.r*1.05,0,7);g.fill();g.restore()}
  const lists=[[],[],[]],flames=[],stubs=[],embers=[];
  for(const c of pt.cs){const bx=X+c.x,by=Y+c.y;
   if(pass===1){let fr=false;for(const a of AC)if(by>a.y+1&&by-a.y<46&&Math.abs(bx-a.x)<a.w){fr=true;break}if(!fr)continue}
   if(m==='ash'){stubs.push([bx,by,c]);continue}
   if(m==='burn'){const bd=st.p*1.3-c.d;if(bd>.42){stubs.push([bx,by,c]);continue}if(bd>0){flames.push([bx,by,c,bd]);continue}}
   let bend=Math.sin(now*1.6+c.ph+bx*.02)*3+c.s*.3+(st.cue?Math.sin(now*9+c.ph*3)*st.cue*8:0);
   for(const a of AC){const dx=bx-a.x,dy=(by-a.y)*1.25,d=Math.hypot(dx,dy);if(d<a.r){const q=1-d/a.r;bend+=(dx>=0?1:-1)*q*q*a.s*(a.boss?1.15:1)}}
   lists[c.c].push([bx,by,c.h*(gr<1?.14+.86*gr:1),c.n,c,bend])}
  g.lineCap='round';
  for(let ci=0;ci<3;ci++){const L=lists[ci];if(!L.length)continue;g.strokeStyle=GC[ci];g.lineWidth=2.6;g.beginPath();
   for(const[bx,by,h0,n,c,bend]of L){const hh0=h0;for(let i=0;i<n;i++){const ox=(i-(n-1)/2)*2.8,hh=hh0*(.82+.18*Math.sin(i*2.1+c.ph)),lean=bend*(1+i*.12)+(i-(n-1)/2)*1.6,tip=Math.max(0,1-Math.min(.45,Math.abs(bend)*.018));g.moveTo(bx+ox,by);g.quadraticCurveTo(bx+ox+lean*.35,by-hh*.58,bx+ox+lean,by-hh*tip)}}
   g.stroke();g.strokeStyle=GT;g.lineWidth=1;g.beginPath();let j=0;
   for(const[bx,by,h0,n,c,bend]of L){if((j++%3))continue;const hh=h0*.9,lean=bend*1.1;g.moveTo(bx+lean*.3,by-hh*.55);g.quadraticCurveTo(bx+lean*.7,by-hh*.8,bx+lean,by-hh*.97)}g.stroke()}
  if(stubs.length){g.strokeStyle='#2a2018';g.lineWidth=2.4;g.beginPath();for(const[bx,by,c]of stubs){g.moveTo(bx-2,by);g.lineTo(bx-2+(c.s*.2),by-4-c.h*.12);g.moveTo(bx+2,by);g.lineTo(bx+2-(c.s*.1),by-3-c.h*.09)}g.stroke();
   if(m==='ash'||m==='burn'){g.save();g.globalCompositeOperation='lighter';for(let q=0;q<stubs.length;q+=5){const[bx,by,c]=stubs[q],al=.35+.5*Math.max(0,Math.sin(now*3+c.ph*2));g.fillStyle='rgba(255,'+(90+(c.ph*20|0))+',30,'+(al*(m==='ash'?.55:.9)).toFixed(2)+')';g.fillRect(Math.round(bx-1),Math.round(by-3),2,2)}g.restore()}}
  if(flames.length){g.save();g.globalCompositeOperation='lighter';
   for(const[bx,by,c,bd]of flames){const f=Math.min(1,bd/.2),hh=(c.h*.95)*f*(1-Math.max(0,bd-.28)*3),fl=Math.sin(now*11+c.ph*5)*3;
    for(const[w,s,col]of[[7,1,'rgba(255,80,20,.62)'],[4.5,.8,'rgba(255,160,40,.78)'],[2.2,.55,'rgba(255,236,150,.9)']]){const h=hh*s;g.fillStyle=col;g.beginPath();g.moveTo(bx-w,by);g.quadraticCurveTo(bx-w*.6+fl*.3,by-h*.55,bx+fl,by-h);g.quadraticCurveTo(bx+w*.6+fl*.3,by-h*.55,bx+w,by);g.closePath();g.fill()}
    if(((c.ph*10)|0)%5===0){const sp=tintGlow('255,140,40'),r=34*f;g.globalAlpha=.4;g.drawImage(sp,Math.round(bx-r),Math.round(by-hh*.6-r),r*2,r*2);g.globalAlpha=1}}
   g.restore();
   g.fillStyle='rgba(60,54,48,.28)';for(let q=0;q<flames.length;q+=6){const[bx,by,c,bd]=flames[q],yy=((now*.5+c.ph)%1);g.beginPath();g.ellipse(bx+Math.sin(now+c.ph)*6,by-24-yy*52,4+yy*8,3+yy*5,0,0,7);g.globalAlpha=.34*(1-yy);g.fill();g.globalAlpha=1}}
  /* aviso de emboscada: polvo que se levanta y surcos en la hierba */
  if(pass===0&&st.cue>.05&&m==='ok'){g.save();g.fillStyle='rgba(190,170,120,'+(.32*st.cue).toFixed(3)+')';for(let q=0;q<7;q++){const a=now*2+q*1.9,r=(.2+.7*((now*.9+q*.31)%1))*pt.r*.8;g.beginPath();g.ellipse(X+Math.cos(a)*r,Y+Math.sin(a)*r*.7,5,2.5,0,0,7);g.fill()}g.restore()}}}
/* ═════════ dibujo bajo las criaturas ═════════ */
let FFA={};
function ffAnch(S){if(FFA[S.id])return FFA[S.id];const R=rngf(S.id.charCodeAt(4)*911+3),a=[];for(let i=0;i<400&&a.length<20;i++){const x=1+R()*(S.w-2)|0,y=1+R()*(S.h-2)|0;if(S.g[y][x]!=='#'&&S.g[y][x]!=='w')a.push([INT.ox+(x+.5)*T,INT.oy+(y+.5)*T])}return FFA[S.id]=a}
function drawInt(cx,cy,now){const S=KZ.sc;if(!S)return;const lv=S.lv,fight=!!(window.MJA&&MJA.on);
 const an=ffAnch(S);if(an.length)fireflies(cx,cy,now,an,lv==='S'?16:lv==='1'?26:22,5+lv.charCodeAt(0),lv==='1'?'150,240,190':'210,255,120',lv==='1'?16:14);
 if(lv!=='S')return;
 /* nido-altar: aro de luz ámbar con garras que gira, y chispas que suben */
 {const ax=INT.ox+RA.NEST[0]*T-cx,ay=INT.oy+RA.NEST[1]*T-cy;if(ax>-260&&ax<VW+260&&ay>-200&&ay<VH+200){g.save();g.globalCompositeOperation='lighter';const f=.62+.38*Math.sin(now*1.5),a=fight?.7:.32;
   const r=210,q=g.createRadialGradient(ax,ay,10,ax,ay,r);q.addColorStop(0,'rgba(255,170,70,'+(a*.5*f).toFixed(3)+')');q.addColorStop(.6,'rgba(255,200,110,'+(a*.18).toFixed(3)+')');q.addColorStop(1,'rgba(255,170,70,0)');g.save();g.translate(ax,ay);g.scale(1,.7);g.translate(-ax,-ay);g.fillStyle=q;g.beginPath();g.arc(ax,ay,r,0,7);g.fill();g.restore();
   g.save();g.translate(ax,ay);g.scale(1,.62);g.lineWidth=2.4;g.rotate(now*.2);g.strokeStyle='rgba(255,196,110,'+(a*1.5*f).toFixed(3)+')';for(let i=0;i<6;i++){g.beginPath();g.arc(0,0,106,i*1.0472+.1,i*1.0472+.62);g.stroke()}g.rotate(-now*.45);g.strokeStyle='rgba(255,230,160,'+(a*1.1*f).toFixed(3)+')';for(let i=0;i<4;i++){g.beginPath();g.arc(0,0,72,i*1.5708,i*1.5708+.8);g.stroke()}g.restore();
   for(let k=0;k<12;k++){const fr=((now*.13+k*.083)%1),sx=ax+Math.cos(k*2.4+now*.5)*(60+fr*30),sy=ay-fr*190+Math.sin(k)*8;g.fillStyle='rgba(255,'+(170+(k*11)%70)+',80,'+(.8*Math.sin(fr*3.14)*(fight?1:.6)).toFixed(3)+')';g.fillRect(Math.round(sx),Math.round(sy),2,2)}
   g.restore()}}
 grass(cx,cy,now,0);
 /* durante el combate la senda de salida queda cerrada por una muralla de zarzas */
 if(fight){const st=kzStairs(S)[0];if(st){const sx=INT.ox+st.x0*T-6-cx,sy=INT.oy+st.y0*T-cy,w=(st.x1-st.x0+1)*T+12,h=(st.y1-st.y0+1)*T;if(sx<VW&&sx+w>0&&sy<VH&&sy+h>0){g.save();g.fillStyle='rgba(14,30,12,.78)';g.fillRect(sx,sy,w,h);g.lineCap='round';
   for(let i=0;i<14;i++){const y=sy+8+i*(h-16)/13,x0=sx+(i%2)*6;g.strokeStyle=i%3?'#274a22':'#3a2a18';g.lineWidth=3;g.beginPath();g.moveTo(x0,y);g.bezierCurveTo(x0+w*.3,y-14+(i%3)*8,x0+w*.6,y+14-(i%4)*6,x0+w-(i%2)*8,y+(i%5-2)*4);g.stroke();
    g.strokeStyle='#c8b890';g.lineWidth=1;g.beginPath();for(let j=0;j<5;j++){const tx=x0+8+j*(w-16)/4,ty=y+(Math.sin(j*2+i)*5);g.moveTo(tx,ty);g.lineTo(tx+3,ty-6)}g.stroke()}
   g.restore()}}}}
/* ═════════ dibujo sobre las criaturas: copas de los árboles y matojos de delante ═════════ */
const ACT=()=>{const a=[{x:(P.x-INT.ox)/2,y:(P.y+8-INT.oy)/2}];try{const b=window.MJRF&&MJRF.boss&&MJRF.boss();if(b)a.push({x:(b.x-INT.ox)/2,y:(b.y+8-INT.oy)/2})}catch(e){}for(const e of E)if(e.mjn&&!(e.dead>0)&&(e.hp==null||e.hp>0))a.push({x:(e.x-INT.ox)/2,y:(e.y+8-INT.oy)/2});return a};
let FT=0;
RAP.front=function(cx,cy,now){if(!inInt()||!ART)return;const S=KZ.sc,A=ART.ovl[S.lv];if(!A)return;const dt=Math.min(.1,Math.max(.001,now-FT));FT=now;
 if(S.lv==='S')grass(cx,cy,now,1);
 const ac=ACT();g.imageSmoothingEnabled=false;
 for(const it of A.list){const sx=Math.round(INT.ox+it.x*2-cx),sy=Math.round(INT.oy+it.y*2-cy),sw=it.w*2,sh=it.h*2;if(sx>VW||sy>VH||sx+sw<0||sy+sh<0){it.a=1;continue}
  const baseY=it.row*16,cut=it.y+it.h;let under=false;
  for(const a of ac){if(a.x>it.x+it.w*.1&&a.x<it.x+it.w*.9&&a.y<baseY&&a.y-28<cut&&a.y>it.y+4){under=true;break}}
  const tg=under?.38:1,a0=it.a==null?1:it.a;it.a=a0+(tg-a0)*Math.min(1,dt*9);
  g.globalAlpha=it.a;g.drawImage(A.cv,it.x,it.y,it.w,it.h,sx,sy,sw,sh)}
 g.globalAlpha=1};
/* ═════════ presencia y sala del combate (la usa mjc5.js) ═════════ */
RAP.hall=()=>{if(!inInt()||KZ.sc.lv!=='S')return null;return[INT.ox/T+RA.FX,INT.oy/T+RA.FY,RA.FW,RA.FH]};       /* [x,y,ancho,alto] en casillas del mundo */
RAP.cols=[];                                                                                                     /* sin pilares: los obstáculos del Claro son casillas sólidas de la escena */
RAP.spawns=RA.SPAWNS;                                                                                            /* casillas de aparición (escena S) */
RAP.toHall=function(i,cb){ensureArt(a=>{if(!a){if(cb)cb(false);return}
  const go=()=>{const sp=RAP.spawns[(i|0)%RAP.spawns.length];P.x=INT.ox+(sp[0]+.5)*T;P.y=INT.oy+(sp[1]+.5)*T;P.dir='up';try{MD.x=P.x;MD.y=P.y+20;PD.x=P.x;PD.y=P.y+20}catch(e){}try{LCX=-1;NT=0}catch(e){}if(cb)cb(true)};
  if(inInt()){if(KZ.sc.lv==='S'){go();return}kzScene('rap.S','R');go();return}
  if(KZ.on||INT.on||DG.f){if(cb)cb(false);return}
  const ret={x:P.x,y:Math.max(P.y,(mn()[1]+1.6)*T)};if(kzBegin(ret,'rap.S','R'))go();else if(cb)cb(false)})};
RAP.afterFight=function(){try{if(inInt()&&KZ.sc.lv==='S')kzScene('rap.G','R')}catch(e){}};
RAP.hallSet=function(){};
RAP.inside=()=>{try{return inInt()}catch(e){return false}};
MAN.reg.rap=RAP;
})();
/* ═══════════ v437 · MINI-JEFES (cliente) · parte 14: LA PELEA CONTRA EL VELOCIRAPTOR ═══════════
   Usa el motor de pelea de mjc5.js (reloj del servidor, turnos con semilla, peligros, daño) y le añade el perfil del Velociraptor (PFS.rap).
   El SERVIDOR decide quién entra, la vida compartida, la fase 2, quién cae, el premio y qué manchones de hierba arden (mb.burn); aquí se ve y se juega:
   · el Claro del Depredador: un jefe de ~2 veces la altura del héroe que CORRE por el claro (no hay pilares ni espejos: hay rocas, troncos, el nido y hierba alta),
   · 5 habilidades: Carga del Depredador (carril rojo; si choca con una roca o un tronco queda aturdido), Emboscada de la Maleza (se esconde en la hierba alta y salta sobre el
     héroe que eligió: la hierba se mueve, aparecen huellas, polvo y ruidos), Barrido de Cola (anillo), Combo de Garras (tres zarpazos en abanico) y,
     al 25 % de vida, el Instinto Alfa (más rápido, más emboscadas, combina carga + cola, recupera antes),
   · detectar la emboscada: TODAS las clases ven los avisos y pueden pulsar «🐾 Rastrear» (más tiempo para Druida y Arquero); solo el MAGO puede quemar un manchón («🔥 Quemar hierba»):
     el fuego es local (un manchón), temporal (rebrota) y limitado (2 a la vez) y obliga al Velociraptor a salir de su escondite o a no poder emboscar,
   · animaciones propias sobre la hoja del raptor (carrera, giro rápido, cola, acecho, olfateo, salto, zarpazo, recuperación) y sonidos sintetizados propios. */
(function(){
'use strict';
const A=window.MJA,MJ=window.MJC,MAN=window.MJMAN,RAP=window.MJRAP,RA=window.MJRA;
if(!A||!A.K||!A.PF||!MJ||!MAN||!RAP||!RA||typeof E==='undefined')return;
const X=A.K,PFS=A.PF,hh=X.hh,ez=X.ez,cl=X.cl,pt=X.pt,posOf=X.posOf,pickT=X.pickT,W2=X.W2,AXY=X.AXY,HZ=X.HZ,hurt=X.hurt,canHurt=X.canHurt,inAr=X.inAr,sn=X.sn,snd=X.snd;
const $=id=>document.getElementById(id);
const ST1=5200,ST2=3600,TAU=Math.PI*2,BMS=16000;            /* BMS: lo que dura un manchón quemado (igual que el servidor) */
/* ── geometría del claro (px locales del marco de la pelea) ── */
const FX=RA.FX,FY=RA.FY,HW=RA.FW*T,HH=RA.FH*T;
const loc=(tx,ty)=>[(tx-FX)*T,(ty-FY)*T];
const NESTL=loc(RA.NEST[0],RA.NEST[1]);
const PATCH=RA.PATCH.map(p=>({x:(p[0]-FX)*T,y:(p[1]-FY)*T,r:p[2]*T}));
const dst=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const panOf=x=>cl((x-HW/2)/(HW/2)*.85,-1,1);
/* ═════════ sonidos (sintetizados) ═════════ */
const noise=c=>X.noise(c);
const GA=(c,o,t,a,pk,dec)=>{const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,pk),t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec);g.connect(o);return g};
const OSC=(c,ty,f0,f1,t,d,dst2,det)=>{const o=c.createOscillator();o.type=ty;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+d);if(det)o.detune.value=det;o.connect(dst2);o.start(t);o.stop(t+d+.06);return o};
const NZ=(c,ty,f0,f1,t,d,dst2,q)=>{const s=c.createBufferSource();s.buffer=noise(c);s.loop=true;const f=c.createBiquadFilter();f.type=ty;f.Q.value=q||1;f.frequency.setValueAtTime(f0,t);if(f1)f.frequency.exponentialRampToValueAtTime(f1,t+d);s.connect(f);f.connect(dst2);s.start(t);s.stop(t+d+.06);return f};
const LP=(c,f,dst2)=>{const b=c.createBiquadFilter();b.type='lowpass';b.frequency.value=f;b.connect(dst2);return b};
const VIB=(c,o,t,d,hz,cents)=>{const lf=c.createOscillator(),lg=c.createGain();lf.frequency.value=hz;lg.gain.value=cents;lf.connect(lg);lg.connect(o.detune);lf.start(t);lf.stop(t+d+.1)};
const PART=(c,g,f0,list,t,d)=>{for(const[m,a]of list){const q=c.createGain();q.gain.value=a;q.connect(g);OSC(c,'sine',f0*m,0,t,d,q)}};
const SND={
 /* rugido: garganta grave que se desgarra, con vibrato rápido, aire y un golpe de pecho */
 rroar:(c,t,o,v,D)=>{D=D||1.5;const g=GA(c,o,t,.12,.4*v,D*.9),lp=LP(c,900,g);lp.frequency.setValueAtTime(380,t);lp.frequency.exponentialRampToValueAtTime(1700,t+D*.35);lp.frequency.exponentialRampToValueAtTime(420,t+D);
  for(const[f,det]of[[78,0],[79.3,14],[117,-9],[156,6]]){const s=OSC(c,'sawtooth',f*.8,f*1.15,t,D*.4,lp,det);s.frequency.exponentialRampToValueAtTime(f*.62,t+D);VIB(c,s,t,D,7.5,28)}
  const n=GA(c,o,t,.2,.2*v,D*.8);NZ(c,'bandpass',900,300,t,D,n,1.6);const u=GA(c,o,t,.05,.5*v,D*.8);OSC(c,'sine',54,28,t,D,u)},
 /* chillido de caza: agudo, cortante, con vibrato nervioso */
 rscreech:(c,t,o,v)=>{const g=GA(c,o,t,.02,.26*v,.5),s=OSC(c,'sawtooth',1500,2900,t,.18,g);s.frequency.exponentialRampToValueAtTime(1700,t+.48);VIB(c,s,t,.5,38,120);
  const s2=OSC(c,'square',1010,1950,t,.18,g,9);s2.frequency.exponentialRampToValueAtTime(1180,t+.48);const n=GA(c,o,t,.02,.12*v,.4);NZ(c,'bandpass',3600,5200,t,.4,n,3)},
 /* gruñido grave y pulsante */
 rgrowl:(c,t,o,v,D)=>{D=D||1;const g=GA(c,o,t,D*.3,.3*v,D*.7),lp=LP(c,360,g),s=OSC(c,'sawtooth',62,48,t,D,lp);VIB(c,s,t,D,19,45);OSC(c,'sawtooth',63,47,t,D,lp,12);const n=GA(c,o,t,D*.3,.07*v,D*.6);NZ(c,'bandpass',500,260,t,D,n,2)},
 /* olfateo: tres resoplidos cortos */
 rsniff:(c,t,o,v)=>{for(let i=0;i<3;i++){const tt=t+i*.15,n=GA(c,o,tt,.012,.24*v,.09);NZ(c,'bandpass',2400+i*450,4300,tt,.1,n,2.2)}},
 /* carrera: pisadas pesadas que se aceleran */
 rrun:(c,t,o,v,D)=>{D=D||.8;let tt=t,gap=.16;for(let i=0;tt<t+D;i++){const g=GA(c,o,tt,.004,(.2+.02*i)*v,.12);OSC(c,'sine',92-i*2,38,tt,.13,g);const n=GA(c,o,tt,.003,.11*v,.1);NZ(c,'lowpass',900,180,tt,.1,n,.8);tt+=gap;gap=Math.max(.085,gap*.92)}},
 /* carga: gruñido que sube + rumor + patadas al suelo */
 rcharge:(c,t,o,v,D)=>{D=D||1.1;const g=GA(c,o,t,D*.9,.34*v,.14),lp=LP(c,260,g);lp.frequency.setValueAtTime(260,t);lp.frequency.exponentialRampToValueAtTime(1200,t+D);
  OSC(c,'sawtooth',50,96,t,D,lp);OSC(c,'sawtooth',51,98,t,D,lp,10);const w=GA(c,o,t,D*.9,.1*v,.1);NZ(c,'bandpass',2000,3600,t,D,w,3);
  for(let i=0;i<3;i++){const tt=t+D*.15+i*D*.26,k=GA(c,o,tt,.004,.28*v,.16);OSC(c,'sine',78,34,tt,.16,k);const n=GA(c,o,tt,.003,.14*v,.12);NZ(c,'lowpass',1400,200,tt,.12,n,.8)}},
 /* embestida: silbido de aire y zancadas enormes */
 rdash:(c,t,o,v)=>{const n=GA(c,o,t,.18,.26*v,.5);NZ(c,'bandpass',300,1900,t,.55,n,1.8);const n2=GA(c,o,t+.3,.2,.2*v,.4);NZ(c,'bandpass',1900,350,t+.3,.4,n2,1.8);
  for(let i=0;i<5;i++){const tt=t+.03+i*.115,k=GA(c,o,tt,.004,.36*v,.14);OSC(c,'sine',104-i*5,34,tt,.15,k)}},
 /* choque contra una roca: golpe seco, astillas y un chirrido de aturdimiento */
 rcrash:(c,t,o,v)=>{const g=GA(c,o,t,.003,.62*v,.6);OSC(c,'sine',112,28,t,.6,g);const n=GA(c,o,t,.002,.46*v,.36);NZ(c,'lowpass',3800,160,t,.4,n,.8);
  for(let i=0;i<9;i++){const tt=t+.03+Math.random()*.3,s=GA(c,o,tt,.002,.1*v,.06);NZ(c,'highpass',2000+Math.random()*3000,0,tt,.06,s,1)}
  const ch=GA(c,o,t+.28,.02,.14*v,.5);const s2=OSC(c,'triangle',1100,500,t+.28,.5,ch);VIB(c,s2,t+.28,.5,9,140)},
 /* zarpazo: tres arañazos de aire */
 rslash:(c,t,o,v)=>{const n=GA(c,o,t,.008,.34*v,.16);NZ(c,'bandpass',1300,6400,t,.16,n,2.6);const k=GA(c,o,t,.004,.16*v,.12);OSC(c,'triangle',2300,520,t,.12,k);const b=GA(c,o,t+.04,.004,.2*v,.2);OSC(c,'sine',120,52,t+.04,.2,b)},
 /* barrido de cola: zumbido que sube (aviso) y latigazo */
 rtailw:(c,t,o,v,D)=>{D=D||.9;const n=GA(c,o,t,D*.9,.24*v,.08);NZ(c,'bandpass',220,2000,t,D,n,2.2);const g=GA(c,o,t,D*.9,.12*v,.08);OSC(c,'sawtooth',70,160,t,D,LP(c,500,g))},
 rtailh:(c,t,o,v)=>{const n=GA(c,o,t,.002,.55*v,.14);NZ(c,'highpass',1800,0,t,.14,n,.9);const g=GA(c,o,t,.003,.42*v,.34);OSC(c,'sine',190,38,t,.34,g);const w=GA(c,o,t,.02,.2*v,.3);NZ(c,'bandpass',2600,600,t,.3,w,1.6)},
 /* hierba que se agita (con paneo hacia el manchón) */
 rrustle:(c,t,o,v,D)=>{D=D||.9;for(let i=0;i<9;i++){const tt=t+i*(D/9)+Math.random()*.04,n=GA(c,o,tt,.02,(.1+Math.random()*.06)*v,.1);NZ(c,'bandpass',2200+Math.random()*1800,0,tt,.11,n,1.6)}},
 /* salto: impulso que sube y aterrizaje pesado con hojas */
 rleap:(c,t,o,v)=>{const g=GA(c,o,t,.01,.34*v,.4),s=OSC(c,'sine',240,980,t,.3,g);s.frequency.exponentialRampToValueAtTime(380,t+.5);const n=GA(c,o,t,.12,.2*v,.3);NZ(c,'bandpass',1200,4200,t,.4,n,1.4)},
 rland:(c,t,o,v)=>{const g=GA(c,o,t,.004,.6*v,.55);OSC(c,'sine',104,27,t,.55,g);const n=GA(c,o,t,.003,.4*v,.4);NZ(c,'lowpass',3000,150,t,.45,n,.8);
  for(let i=0;i<10;i++){const tt=t+.02+Math.random()*.35,s=GA(c,o,tt,.003,.07*v,.07);NZ(c,'bandpass',2800+Math.random()*2500,0,tt,.08,s,1.2)}},
 /* fuego del Mago: crepitar y un soplido */
 rburn:(c,t,o,v)=>{const w=GA(c,o,t,.08,.26*v,.7);NZ(c,'bandpass',420,1000,t,.8,w,1.2);for(let i=0;i<22;i++){const tt=t+.05+Math.random()*1.1,s=GA(c,o,tt,.002,(.06+Math.random()*.1)*v,.05);NZ(c,'highpass',1800+Math.random()*3200,0,tt,.05,s,1)}},
 /* rastreo: ping con eco */
 rtrack:(c,t,o,v)=>{for(let i=0;i<2;i++){const g=GA(c,o,t+i*.2,.006,(.22-i*.09)*v,.5);PART(c,g,880,[[1,1],[2,.4],[3,.2]],t+i*.2,.55)}const d=GA(c,o,t,.01,.12*v,.4);OSC(c,'sine',1320,660,t,.4,d)},
 rwake:(c,t,o,v)=>{const g=GA(c,o,t,.5,.12*v,.9);for(const m of[1,1.5,2,3])OSC(c,'sine',220*m,0,t,1.4,g);const n=GA(c,o,t,.5,.07*v,.8);NZ(c,'highpass',3200,0,t,1.2,n,1)}
};
const ALIAS={bell:'rwake',scream:'rroar',pop:'rland',pulse:'rland'};
const TRIM={rroar:.37,rcharge:.9,rwake:.72,rrustle:2.4,rsniff:1.6};   /* medido con la cadena maestra del juego (aud3.py): sin esto el rugido llegaba a 1,4 de pico y saturaba */
function rsnd(c,t,out,k,v,dur,pan){k=ALIAS[k]||k;const F=SND[k];if(!F)return false;let d2=out;v=(v==null?1:v)*(TRIM[k]||1);
 try{if(pan&&c.createStereoPanner){const sp=c.createStereoPanner();sp.pan.value=cl(pan,-1,1);sp.connect(out);d2=sp}}catch(e){}
 F(c,t,d2,v,dur);return true}
/* ═════════ navegación del claro: máscara de casillas macizas y puntos libres ═════════ */
const MS=16;let MASK=null,MWc=0,MHc=0,NODES=null;
function mask(){const S=typeof KZ!=='undefined'&&KZ.sc;if(!S||S.id!=='rap.S')return MASK;if(MASK&&MASK.sid===S)return MASK;
 MWc=HW/MS;MHc=HH/MS;const m=new Uint8Array(MWc*MHc);for(let y=0;y<MHc;y++)for(let x=0;x<MWc;x++){const tx=Math.floor(x*MS/T)+FX,ty=Math.floor(y*MS/T)+FY,c=S.g[ty]&&S.g[ty][tx];m[y*MWc+x]=(!c||c==='#'||c==='w')?1:0}
 m.sid=S;MASK=m;NODES=null;return m}
const solid=(x,y)=>{const m=mask();if(!m)return false;const i=Math.floor(x/MS),j=Math.floor(y/MS);if(i<0||j<0||i>=MWc||j>=MHc)return true;return!!m[j*MWc+i]};
const freeDisc=(x,y,r)=>{if(solid(x,y))return false;for(let a=0;a<8;a++)if(solid(x+Math.cos(a*TAU/8)*r,y+Math.sin(a*TAU/8)*r))return false;return true};
/* rayo desde a hasta b con un cuerpo de radio r: hasta dónde llega libre */
function ray(x0,y0,x1,y1,r){const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy)||1,n=Math.max(1,Math.ceil(L/8));let lx=x0,ly=y0;
 for(let i=1;i<=n;i++){const x=x0+dx*i/n,y=y0+dy*i/n;if(!freeDisc(x,y,r))return{x:lx,y:ly,d:L*(i-1)/n,hit:1};lx=x;ly=y}return{x:x1,y:y1,d:L,hit:0}}
function nodes(){const m=mask();if(!m)return[];if(NODES&&NODES.sid===m)return NODES;const L=[];for(let y=48;y<HH-40;y+=48)for(let x=48;x<HW-40;x+=48)if(freeDisc(x,y,34))L.push([x,y]);L.sid=m;NODES=L;return L}
const BODY=26;
/* el punto libre más cercano a p */
function nearFree(p,r){const L=nodes();let b=null,bd=1e9;for(const q of L){const d=dst(q,p);if(d<bd){bd=d;b=q}}return b||p}
/* ruta de a a b esquivando obstáculos: directa o con un punto intermedio con vista a ambos */
function route(a,b){if(!ray(a[0],a[1],b[0],b[1],BODY-4).hit)return[a,b];let best=null,bd=1e9;
 for(const q of nodes()){const d=dst(q,a)+dst(q,b);if(d<bd&&!ray(a[0],a[1],q[0],q[1],BODY-4).hit&&!ray(q[0],q[1],b[0],b[1],BODY-4).hit){bd=d;best=q}}
 return best?[a,best,b]:[a,b]}
function along(pts,k){let L=0;const ls=[];for(let i=0;i<pts.length-1;i++){const d=dst(pts[i],pts[i+1]);ls.push(d);L+=d}let s=cl(k,0,1)*L;
 for(let i=0;i<ls.length;i++){if(s<=ls[i]||i===ls.length-1){const f=ls[i]?cl(s/ls[i],0,1):1;return[pts[i][0]+(pts[i+1][0]-pts[i][0])*f,pts[i][1]+(pts[i+1][1]-pts[i][1])*f]}s-=ls[i]}return pts[pts.length-1]}
const plen=pts=>{let L=0;for(let i=0;i<pts.length-1;i++)L+=dst(pts[i],pts[i+1]);return L};
const segD=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=l?cl(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l,0,1):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)};
/* mi héroe en px locales */
const meL=()=>{const o=AXY();return[P.x-o[0],P.y-o[1]]};
/* ═════════ estado de la hierba: fuego del Mago (mb.burn) ═════════ */
function addBurn(k,at,ts,by){if(!(k>=0&&k<6)||!(at>0))return;A.burn=A.burn||[];if(A.burn.some(x=>x.k===k&&x.at===at))return;ts=ts>0?ts:at-2000;A.burn.push({k,at,ts});A.burnV=(A.burnV|0)+1;
 if(ts>sn()-1500){try{snd('rburn',.9,0,panOf(PATCH[k].x))}catch(e){}}
 if(by){try{toast(by===P.name?'🔥 Hierba en llamas: el Velociraptor ya no podrá esconderse ahí':'🔥 '+by+' prende la hierba: el Velociraptor pierde un escondite',3800)}catch(e){}}
 try{flushHide(k)}catch(e){}try{A.hud(1)}catch(e){}}
const burnOf=(k,t)=>{let r=null;for(const b of A.burn||[])if(b.k===k&&(!r||b.ts>r.ts))r=b;return r};
/* estado de un manchón en el instante t */
function patchSt(k,t){const b=burnOf(k,t);if(!b||t<b.ts)return{m:'ok',p:0,g:1};
 if(t<b.at)return{m:'burn',p:cl((t-b.ts)/Math.max(800,b.at-b.ts),0,1)*1.18,g:1};
 if(t<b.at+BMS)return{m:'ash',p:1.2,g:0};
 return{m:'ok',p:0,g:cl((t-b.at-BMS)/5000,0,1)}}
/* ¿puede esconderse el jefe ahí en el turno que empieza en s0? No si el fuego prendió ≥ 400 ms antes (todos los clientes decidimos igual con la hora del servidor) */
function availP(s0){const L=[];for(let k=0;k<6;k++){let ok=true;for(const b of A.burn||[])if(b.k===k&&b.ts+400<=s0&&s0<b.at+BMS){ok=false;break}if(ok)L.push(k)}return L}
/* ═════════ utilidades del guion ═════════ */
const shk=v=>{try{SHK=Math.max(SHK,v)}catch(e){}};
const ft=(x,y,s,c)=>{try{if(FT.length<70)FT.push({x,y,t:.9,d:0,o:0,k:'dm',s,c:c||'#ffd9a0'})}catch(e){}};
const L2=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];
const angTo=(a,b)=>Math.atan2(b[1]-a[1],b[0]-a[0]);
const unit=(a,b)=>{const d=dst(a,b)||1;return[(b[0]-a[0])/d,(b[1]-a[1])/d]};
const PC=PATCH.map(p=>[p.x,p.y]);
const TPOS=nm=>{const p=posOf(nm),o=AXY();return p?[cl(p[0]-o[0],70,HW-70),cl(p[1]-o[1],70,HH-70)]:[HW*.6,HH*.5]};
const fixP=q=>freeDisc(q[0],q[1],BODY)?q:nearFree(q);
const bnd=(a,d)=>{const c=Math.cos(d),s=Math.sin(d);let t=1e9;if(c>1e-3)t=Math.min(t,(HW-80-a[0])/c);else if(c<-1e-3)t=Math.min(t,(80-a[0])/c);if(s>1e-3)t=Math.min(t,(HH-80-a[1])/s);else if(s<-1e-3)t=Math.min(t,(80-a[1])/s);return Math.max(220,t)};
const bossW=()=>{const B0=A.boss;return B0&&B0.x>-9000?[B0.x,B0.y]:null};   /* punto lógico del jefe = el de la pose; el héroe usa [P.x,P.y]; los avisos se pintan GYO px más abajo, igual para ambos */
/* ═════════ el guion: qué hace el Velociraptor en cada turno ═════════
   Todo sale de la semilla del encuentro + los manchones quemados que avisa el servidor, así que todos los clientes ven lo mismo.
   Cada turno es una cadena de tramos de duración fija; lo que depende de dónde estés tú (a quién embiste, dónde aterriza) se «fija» en un instante exacto
   del turno (el aviso se congela) y desde ahí el jefe va a ese sitio. */
const NM={intro:'🦖 El Velociraptor despierta',carga:'💨 Carga del Depredador · ¡sal del carril!',embos:'🌿 Emboscada de la Maleza · ¡mira la hierba!',cola:'🌀 Barrido de Cola · ¡lejos de él!',garras:'🩸 Combo de Garras · ¡sal del abanico!',alfa:'🐺 Instinto Alfa · ¡sal del rugido!',cA:'🐺 Alfa · carga y barrido',cB:'🐺 Alfa · emboscada y barrido',cC:'🐺 Alfa · garras y carga',cD:'🐺 Alfa · doble carga'};
const SEQ1=['carga','embos','cola','garras'],seq1=[];
const kP2=()=>A.p2?Math.round((A.p2-A.t0)/ST1):1e9;
const s0Of=n=>{const K=kP2();return n<K?A.t0+n*ST1:A.p2+(n-K)*ST2};
function mvOf(n,ph,j){const s0=s0Of(n);
 if(ph===2){if(j===0)return'alfa';const i=j-1,m=X.bag(['cA','cB','cC','cD'],Math.floor(i/4),13)[i%4];return m==='cB'&&!availP(s0).length?'cC':m}
 if(n===0)return'intro';const i=n-1;if(seq1.seed!==A.seed){seq1.length=0;seq1.seed=A.seed}
 while(seq1.length<=i){const q=seq1.length;let m;if(q===0)m='carga';else{const c=SEQ1.filter(x=>x!==seq1[q-1]);m=c[Math.floor(hh(A.seed,q,41)*c.length)]}seq1.push(m)}
 const m=seq1[i];return m==='embos'&&!availP(s0).length?'carga':m}
const PL={};let plKey='';
/* plan de un turno: movimiento y, para las emboscadas, el manchón donde se esconde (el mismo en todos los clientes) */
function plan(n){const key=A.seed+':'+(A.burnV|0)+':'+(A.p2||0);if(key!==plKey){for(const q in PL)delete PL[q];plKey=key}
 if(PL[n])return PL[n];const K=kP2(),p2=n>=K,s0=s0Of(n),mv=mvOf(n,p2?2:1,p2?n-K:n),pl={n,s0,p2,mv,pk:-1};
 if(mv==='embos'||mv==='cB'){const L=availP(s0);if(L.length)pl.pk=L[Math.floor(hh(A.seed,n,61)*L.length)]}
 return PL[n]=pl}
/* puestos de descanso: puntos libres alrededor del nido, lejos de la hierba (solo para cuando no se sabe dónde acabó el turno anterior) */
let ANC=null;
function ancList(){const m=mask();if(!m)return[];if(ANC&&ANC.sid===m)return ANC;const L=[];for(const q of nodes()){const d=dst(q,NESTL);if(d<260||d>650)continue;let bad=false;for(const p of PATCH)if(dst(q,[p.x,p.y])<p.r+46){bad=true;break}if(!bad)L.push(q)}L.sid=m;ANC=L;return L}
function anc(n){const L=ancList();if(n<=0||!L.length)return NESTL.slice();return L[Math.floor(hh(A.seed,n,71)*L.length)]}
/* dónde está ahora el jefe (px locales): cada turno empieza donde acabó el anterior */
function startPos(n){const B0=A.boss,o=AXY();if(n>0&&B0&&B0.x>-9000&&B0.al>.02&&!B0.hide)return[B0.x-o[0],B0.y-o[1]];return anc(n)}
/* ── cadena de tramos ── */
function chain(P0){const S=[];let T0=0;
 const C={S,add(d,o){o.a=T0;o.b=T0+d;o.d=d;o.i=S.length;S.push(o);T0+=d;return C},
  P(i){return i?C.E(i-1):P0},
  E(i){const s=S[i];if(!s.e)s.e=s.end?s.end(C.P(i),s):C.P(i);return s.e},
  ev(u){let i=0;while(i<S.length-1&&u>=S[i].b)i++;const s=S[i],k=cl((u-s.a)/Math.max(1,s.d),0,1);return s.at(k,C.P(i),C.E(i),u-s.a,s)}};
 return C}
const go=(dest,st)=>({end:a=>dest(a),at:(k,a,b)=>{const m=dst(a,b);return{p:L2(a,b,k*.7+ez(k)*.3),an:m>8?angTo(a,b):undefined,st:st||'move'}}});
const walk=(v,dest)=>({end:(a,s)=>{const b=dest(a),D=dst(a,b),m=Math.min(D,v*s.d/1000);return D>1?L2(a,b,m/D):a},at:(k,a,b)=>({p:L2(a,b,k),an:dst(a,b)>8?angTo(a,b):undefined,st:'move'})});
const hold=(st,face,ex)=>({at:(k,a,b,u)=>{const r={p:a,st,k,u};const f=face&&face(a);if(f!=null)r.an=f;if(ex)Object.assign(r,ex(k,u,a));return r}});
/* carriles de embestida: se calculan «en vivo» hasta el instante de fijarlos y luego quedan congelados */
function calcLane(tr,l){const a=tr.C.P(l.seg),tp=TPOS(l.ti),dir=angTo(a,tp),dd=dst(a,tp);
 let L0=Math.max(l.min,dd+l.over);L0=Math.min(L0,1050,bnd(a,dir));
 const r=ray(a[0],a[1],a[0]+Math.cos(dir)*L0,a[1]+Math.sin(dir)*L0,BODY-6),crash=!!r.hit&&r.d<L0-6,len=crash?Math.max(60,r.d):L0;
 return{a,an:dir,crash,len,ex:a[0]+Math.cos(dir)*len,ey:a[1]+Math.sin(dir)*len,tx:tp[0],ty:tp[1]}}
function lane(tr,li){const l=tr.lanes[li];if(!l)return null;if(!l.ok){Object.assign(l,calcLane(tr,l));l.ok=1}return l}
/* aterrizaje de la emboscada: dónde cae, desde dónde salta y cuándo sale de la hierba */
function landOf(tr){const q=tr.lk;if(q.land)return q.land;const P=tr.pz,pc=P.pc,c=fixP(TPOS(tr.ti)),D=dst(pc,c),dir=angTo(pc,c);let pre=pc,path=[pc];
 if(D>270){pre=fixP([c[0]-Math.cos(dir)*190,c[1]-Math.sin(dir)*190]);path=route(pc,pre)}
 const rn=D>270?cl(plen(path)/1.15,300,720):0,em=P.tf-P.LEAP-rn;q.land={c,pre,path,rn,em,dir,D};tr.hid.b=em+60;return q.land}
function flushU(tr){const P=tr.pz,f=tr.fl;if(!P||!f||f.k!==P.pk)return -1;const d=f.at-tr.s0,L=tr.lk&&tr.lk.land,lim=L?Math.max(P.tl+200,L.em-40):P.tl+200;return d<lim?Math.max(d,P.Rn-120):-1}   /* el fuego expulsa al jefe mientras siga dentro del manchón (hasta que sale a saltar) */
/* la emboscada: corre al manchón, se esconde, fija a su presa, sale, corre y salta. Si el Mago quema el manchón mientras está escondido, sale chamuscado y furioso y no salta */
function mkPounce(tr,P0,pk,Rn,Hh,WARN,tailMs,wa){const pc=PC[pk],RT=route(P0,pc),LEAP=250,tl=Rn+Hh-50,tf=tl+WARN,aRT=angTo(RT[RT.length-2],pc);
 tr.hid={k:pk,a:Rn-300,b:tl+400};const P=tr.pz={pk,Rn,tl,tf,LEAP,pc,tailMs:tailMs|0};
 return u=>{const tp=TPOS(tr.ti),uf=flushU(tr);
  if(uf>=0&&u>=uf){const fe=P.fe||(P.fe=fixP([pc[0]-unit(pc,tp)[0]*(PATCH[pk].r+70),pc[1]-unit(pc,tp)[1]*(PATCH[pk].r+70)])),fu=u-uf;
   if(fu<450)return{p:L2(pc,fe,ez(fu/450)),an:angTo(pc,fe),st:'move',al:cl(fu/120,0,1),flee:1};
   if(fu<1300)return{p:fe,an:angTo(fe,tp),st:'roar',k:(fu-450)/850,ch:2,flee:1};
   return{p:fe,an:angTo(fe,tp),st:'recover',u:fu-1300,flee:1}}
  if(u<Rn){const k=u/Rn,al=k<.78?1:cl((1-k)/.22,0,1),p=along(RT,k*.7+ez(k)*.3);return{p,an:aRT,st:'move',al,inv:al<.5}}
  if(u<tl)return{p:pc,al:0,inv:1,st:'hid',an:angTo(pc,tp),hk:pk};
  const L=landOf(tr);
  if(u<L.em)return{p:pc,al:0,inv:1,st:'hid',an:L.dir,hk:pk};
  if(u<tf-LEAP&&L.rn>0){const k=(u-L.em)/L.rn;return{p:along(L.path,k*.6+ez(k)*.4),an:L.dir,st:'move',al:cl((u-L.em)/90,0,1)}}
  if(u<tf){const k=(u-(tf-LEAP))/LEAP;return{p:L2(L.pre,L.c,k),an:L.dir,st:'leap',k,z:Math.sin(k*Math.PI)*60,al:L.rn>0?1:cl((u-(tf-LEAP))/70,0,1)}}
  const v=u-tf;if(v<tailMs)return{p:L.c,an:L.dir,st:'tail',k:v/Math.max(1,tailMs),u:v};
  if(wa>0&&v>tailMs+wa){const an=anc(tr.n+1),D=dst(L.c,an),m=Math.min(D,200*(v-tailMs-wa)/1000);return{p:D>1?L2(L.c,an,m/D):L.c,an:D>8?angTo(L.c,an):L.dir,st:'move'}}
  return{p:L.c,an:L.dir,st:'recover',k:v/Math.max(1,tailMs),u:v-tailMs}}}
/* ═════════ construcción de un turno ═════════ */
const SW=150,CLR=176,CLH=.52;                                          /* radio del barrido de cola · alcance y semiángulo de cada zarpazo */
function begin(tr){const n=tr.n,s=tr.s0,pl=plan(n),mv=pl.mv,P2=tr.ph===2,P0=startPos(n),ti=pickT(n,1);
 tr.pl=pl;tr.ti=ti;tr.snd=[];tr.shake=[];tr.burst=null;tr.sdone=0;tr.bdone=0;tr.shd=0;tr.lanes=[];tr.lk={};tr.fl=null;tr.hid=null;tr.pz=null;tr.ps=null;tr.imgs=null;tr.cr=-1;
 A.hz=A.hz.filter(h=>h.te>sn()-300);
 const tp=()=>TPOS(ti),snds=(u,k,v,d,pan)=>tr.snd.push([u,k,v,d,pan]),face=a=>angTo(a,tp());
 tr.an=angTo(P0,tp());
 const LANE=(seg,over,min,tii)=>{tr.lanes.push({seg,over,min,ti:tii||ti,ok:0});return tr.lanes.length-1};
 const LN=li=>lane(tr,li);
 /* tramos */
 const dash=li=>({end:()=>{const l=LN(li);return[l.ex,l.ey]},at:(k,a,b)=>{const l=LN(li),f=Math.pow(k,l.crash?1.5:1.12);return{p:L2(a,b,f),an:l.an,st:'dash',k,ch:1}}});
 const crashP=(li,crT,a,ss,u)=>{const l=LN(li);return{p:a,st:'crash',an:l.an,k:cl((ss.a+u-crT)/1500,0,1),u:ss.a+u-crT}};
 const aft=(li,slide,crT)=>({end:a=>{const l=LN(li);if(l.crash||!slide)return a;const q=ray(a[0],a[1],a[0]+Math.cos(l.an)*slide,a[1]+Math.sin(l.an)*slide,BODY-6);return[q.x,q.y]},
  at:(k,a,b,u,ss)=>{const l=LN(li);if(l.crash)return crashP(li,crT,a,ss,u);const SK=330;return u<SK?{p:L2(a,b,ez(u/SK)),st:'skid',an:l.an,k}:{p:b,st:'recover',an:l.an,k,u:u-SK}}});
 const cz=(li,crT,seg)=>({end:seg.end,at:(k,a,b,u,ss)=>LN(li).crash?crashP(li,crT,a,ss,u):seg.at(k,a,b,u,ss)});
 const csPos=dist=>a=>{const t=tp();let dx=a[0]-t[0],dy=a[1]-t[1],d=Math.hypot(dx,dy);if(d<20){const g=hh(A.seed,n,81)*TAU;dx=Math.cos(g);dy=Math.sin(g);d=1}
  return fixP([cl(t[0]+dx/d*dist,70,HW-70),cl(t[1]+dy/d*dist,70,HH-70)])};
 const nearT=gap=>a=>{const t=tp(),u=unit(a,t);return fixP([t[0]-u[0]*gap,t[1]-u[1]*gap])};
 const away=v=>walk(v,()=>anc(n+1));
 /* peligros */
 const hLane=(li,t0,tl,ts,Dd,dmg,o)=>HZ(Object.assign({k:'rlane',tr,li,t0:s+t0,tl:s+tl,ts:s+ts,te:s+ts+Dd,tf:s+ts+Dd,dmg,rad:50},o||{}));
 const hSw=(t0,tl,tf,dmg,o)=>HZ(Object.assign({k:'rsw',tr,R:SW,t0:s+t0,tl:s+tl,tf:s+tf,te:s+tf+800,dmg},o||{}));
 const hCl=(t0,tl,tfs,dmg,offs)=>HZ({k:'rcl',tr,t0:s+t0,tl:s+tl,tfs:tfs.map(x=>s+x),tf:s+tfs[tfs.length-1],te:s+tfs[tfs.length-1]+700,R:CLR,hw:CLH,dmg,offs,fi:[0,0,0]});
 const hPz=(t0,tf,dmg,can)=>HZ({k:'rpz',tr,t0:s+t0,tl:s+t0,tf:s+tf,te:s+tf+900,R:76,dmg,can});
 const hRr=(x,y,R,t0,tf,dmg,o)=>HZ(Object.assign({k:'rrr',tr,x,y,R,t0:s+t0,tf:s+tf,te:s+tf+1300,dmg},o||{}));
 const OFFS=()=>{const o=[-.82,0,.82];if(hh(A.seed,n,83)<.5)o.reverse();return o};
 let C=null;
 switch(mv){
 case'intro':{
  C=chain(P0).add(1100,hold('rise',()=>Math.PI/2,k=>({al:ez(k),inv:k<.8})))
   .add(1700,hold('roar',face,k=>({ch:2,k})))
   .add(900,hold('sniff',face))
   .add(1500,go(()=>anc(1),'move'));
  hRr(P0[0],P0[1],560,1250,1450,0,{vis:1});
  snds(100,'rwake',.9,0);snds(1250,'rroar',1,1.6);tr.shake=[[1450,6]];break}
 case'carga':{
  const li=LANE(2,150,300),Dd=680;
  C=chain(P0).add(700,go(csPos(520))).add(1200,hold('crouch',face,()=>({ch:1})));C.add(Dd,dash(li));
  C.add(1770,aft(li,150,1900+Dd)).add(850,cz(li,1900+Dd,away(190)));
  hLane(li,700,1750,1900,Dd,30);
  snds(40,'rrun',.8,.7);snds(720,'rgrowl',.9,1.0);snds(1000,'rcharge',1,.95);snds(1900,'rdash',1);break}
 case'embos':{
  const pk=pl.pk;if(pk<0){C=chain(P0).add(5200,hold('recover',face));break}
  const pz=mkPounce(tr,P0,pk,1150,1200,1000,0,700),P=tr.pz,pcx=PC[pk][0],pan=panOf(pcx);
  C={ev:pz,P:()=>P0,E:()=>P0};
  hPz(P.tl,P.tf,34,()=>flushU(tr)>=0);preBurn(tr,pk);
  snds(60,'rrun',.8,.9);snds(1000,'rrustle',.7,.8,pan);snds(1550,'rrustle',.9,1.0,pan);snds(2000,'rgrowl',.5,.8,pan);snds(P.tl+80,'rrustle',1,.7,pan);snds(P.tf-P.LEAP,'rleap',1);snds(P.tf,'rland',1);tr.shake=[[P.tf,8]];break}
 case'cola':{
  C=chain(P0).add(900,go(nearT(70))).add(1050,hold('windup',face)).add(450,hold('tail',face,k=>({k}))).add(1100,hold('recover',face)).add(1700,away(200));
  hSw(900,900,2200,24);
  snds(40,'rrun',.8,.8);snds(950,'rgrowl',.8,1.0);snds(1500,'rtailw',1,.7);snds(2200,'rtailh',1);tr.shake=[[2200,8]];break}
 case'garras':{
  C=chain(P0).add(850,go(nearT(95))).add(600,hold('windup',face)).add(1250,hold('claw',face,(k,u)=>({ci:Math.min(2,Math.floor(u/400)),ck:(u%400)/400}))).add(1000,hold('recover',face)).add(1500,away(200));
  const T3=[1600,2000,2400];hCl(850,1300,T3,11,OFFS());
  snds(40,'rrun',.8,.7);snds(900,'rgrowl',.8,.9);T3.forEach(t=>snds(t-60,'rslash',1));tr.shake=[[1600,3],[2000,3],[2400,5]];break}
 case'alfa':{
  C=chain(P0).add(400,hold('crouch',face,()=>({ch:1}))).add(1300,hold('roar',face,k=>({ch:2,k}))).add(700,hold('sniff',face)).add(1200,away(240));
  hRr(P0[0],P0[1],340,300,1500,14,{big:1});
  snds(120,'rgrowl',.9,.8);snds(600,'rroar',1,1.7);snds(1500,'rscreech',.9);tr.shake=[[1500,10]];break}
 case'cA':{
  const li=LANE(2,0,300),Dd=650;
  C=chain(P0).add(450,go(csPos(430))).add(600,hold('crouch',face,()=>({ch:1}))).add(Dd,dash(li))
   .add(450,cz(li,1700,hold('tail',null,k=>({k})))).add(850,cz(li,1700,hold('recover',null))).add(600,cz(li,1700,away(220)));
  hLane(li,450,950,1050,Dd,28,{sw:1});
  hSw(450,1700,1950,20,{can:()=>!!(tr.lanes[li]&&tr.lanes[li].ok&&tr.lanes[li].crash),pc:()=>{const l=tr.lanes[li],q=l.ok?l:calcLane(tr,l);return[q.ex,q.ey]},R:SW});
  snds(40,'rrun',.8,.5);snds(470,'rgrowl',.8,.7);snds(700,'rcharge',1,.65);snds(1050,'rdash',1);snds(1700,'rtailw',1,.5);snds(1950,'rtailh',1);tr.shake=[[1950,8]];break}
 case'cB':{
  const pk=pl.pk;if(pk<0){C=chain(P0).add(3600,hold('recover',face));break}
  const pz=mkPounce(tr,P0,pk,800,700,800,450,0),P=tr.pz,pan=panOf(PC[pk][0]);
  C={ev:pz,P:()=>P0,E:()=>P0};
  hPz(P.tl,P.tf,30,()=>flushU(tr)>=0);preBurn(tr,pk);
  hSw(P.tl,P.tf,P.tf+250,16,{can:()=>flushU(tr)>=0,pc:()=>landOf(tr).c,R:136});
  snds(40,'rrun',.8,.7);snds(700,'rrustle',.9,.8,pan);snds(P.tl+40,'rrustle',1,.6,pan);snds(P.tf-P.LEAP,'rleap',1);snds(P.tf,'rland',1);snds(P.tf+150,'rtailw',.9,.35);snds(P.tf+250,'rtailh',1);tr.shake=[[P.tf,6],[P.tf+250,6]];break}
 case'cC':{
  const li=LANE(5,0,300),Dd=560;
  C=chain(P0).add(500,go(nearT(95))).add(400,hold('windup',face)).add(850,hold('claw',face,(k,u)=>({ci:Math.min(2,Math.floor(u/280)),ck:(u%280)/280})))
   .add(550,go(csPos(400))).add(250,hold('crouch',face,()=>({ch:1}))).add(Dd,dash(li)).add(490,aft(li,120,2550+Dd));
  const T3=[1050,1330,1610];hCl(500,850,T3,10,OFFS());hLane(li,1750,2400,2550,Dd,26);
  snds(40,'rrun',.8,.5);snds(550,'rgrowl',.8,.7);T3.forEach(t=>snds(t-50,'rslash',1));snds(1800,'rrun',.8,.5);snds(2050,'rcharge',1,.5);snds(2550,'rdash',1);tr.shake=[[1050,3],[1330,3],[1610,5]];break}
 case'cD':{
  const l0=LANE(2,120,300),l1=LANE(4,120,300),D0=550;
  C=chain(P0).add(400,go(csPos(480))).add(600,hold('crouch',face,()=>({ch:1}))).add(D0,dash(l0))
   .add(450,cz(l0,1550,hold('crouch',face,()=>({ch:1})))).add(D0,cz(l0,1550,dash(l1))).add(1050,cz(l0,1550,aft(l1,140,2550)));
  /* si la primera se estrella, la segunda no sale (el jefe queda aturdido) */
  hLane(l0,400,900,1000,D0,24);hLane(l1,1550,1900,2000,D0,26,{can:()=>!!(tr.lanes[l0].ok&&tr.lanes[l0].crash)});
  snds(40,'rrun',.8,.5);snds(420,'rgrowl',.8,.6);snds(650,'rcharge',1,.55);snds(1000,'rdash',1);snds(1560,'rcharge',1,.4);snds(2000,'rdash',1);break}
 default:C=chain(P0).add(3000,hold('recover',face))}
 tr.C=C;tr.L=li=>lane(tr,li);
 tr.pose=u=>{const r=C.ev(u)||{p:P0};if(r.an==null)r.an=tr.an;else tr.an=r.an;tr.ps=r;return r};
 return tr}
/* ═════════ peligros propios: carril, barrido de cola, zarpazos, salto, rugido ═════════ */
const segD2=(p,a,b)=>segD(p,a,b);
const inWedge=(x,y,wx,wy,ang,R,hw)=>{const dx=x-wx,dy=y-wy,d=Math.hypot(dx,dy);if(d>R+10)return false;if(d<14)return true;let da=Math.atan2(dy,dx)-ang;da=Math.atan2(Math.sin(da),Math.cos(da));return Math.abs(da)<=hw+Math.min(.5,16/Math.max(20,d))};
function evalR(h,t){const k=h.k;
 if(k==='rlane'){if(h.done)return;const tr=h.tr;if(!tr||A.tr!==tr){if(t>h.te+700)h.done=1;return}
  if(!h.lk&&t>=h.tl){h.lk=1;lane(tr,h.li)}
  const off=h.can&&h.can();
  if(!off&&t>=h.ts&&t<h.te+40){const b=bossW();if(b){const px=h.px==null?b[0]:h.px,py=h.py==null?b[1]:h.py;h.px=b[0];h.py=b[1];
    if(!h.hit&&canHurt()&&segD2([P.x,P.y],[px,py],b)<h.rad){h.hit=1;hurt(h.dmg,0);shk(8);try{A.flash=performance.now()}catch(e){}}}}
  if(!off&&t>=h.te&&!h.fin){h.fin=1;const l=lane(tr,h.li);if(l&&l.crash&&t-h.te<500){tr.cr=tr.cr<0?h.te-tr.s0:tr.cr;shk(10);try{A.flash=performance.now()}catch(e){}
    const w=W2([l.ex,l.ey]);snd('rcrash',cl(1-dst([P.x,P.y],w)/900,.35,1),0,panOf(l.ex));
    for(let i=0;i<30;i++){const a=Math.random()*TAU,sp=40+Math.random()*190;pt(w[0]+Math.cos(a)*12,w[1]+Math.sin(a)*12+16,Math.cos(a)*sp,Math.sin(a)*sp*.7-40,.5+Math.random()*.7,Math.random()<.5?'150,120,80':'200,190,160',2+(Math.random()*3|0))}
    ft(w[0],w[1]-70,'💥 ¡Aturdido!','#ffe08a');
    if(!HT.crash){HT.crash=1;try{toast('💡 ¡Se ha estrellado! Aprovecha: queda quieto un buen rato.',5200)}catch(e){}}}}
  if(t>h.te+900)h.done=1;return}
 if(k==='rsw'){if(h.done)return;const tr=h.tr;if(!tr||A.tr!==tr){if(t>h.te)h.done=1;return}
  if(!h.lk&&t>=h.tl){h.lk=1;const c=h.pc?W2(h.pc()):bossW();if(c){h.wx=c[0];h.wy=c[1]}else{h.lk=0}}
  if(!h.fin&&t>=h.tf){h.fin=1;if(!h.lk)h.done=1;else if(!(h.can&&h.can())&&t-h.tf<500){shk(8);snd('rtailh',cl(1-dst([P.x,P.y],[h.wx,h.wy])/900,.35,1),0,panOf(h.wx-AXY()[0]));
    const d=Math.hypot(P.x-h.wx,P.y-h.wy);if(canHurt()&&d<=h.R+10)hurt(h.dmg,0)}}
  if(t>h.te)h.done=1;return}
 if(k==='rcl'){if(h.done)return;const tr=h.tr;if(!tr||A.tr!==tr){if(t>h.te)h.done=1;return}
  if(!h.lk&&t>=h.tl){const b=bossW();if(b){h.lk=1;h.wx=b[0];h.wy=b[1];const tp=posOf(tr.ti)||[P.x,P.y];h.a0=Math.atan2(tp[1]-b[1],tp[0]-b[0])}}
  for(let i=0;i<h.tfs.length;i++){if(!h.fi[i]&&t>=h.tfs[i]){h.fi[i]=t;if(h.lk&&t-h.tfs[i]<400){shk(4);if(canHurt()&&inWedge(P.x,P.y,h.wx,h.wy,h.a0+h.offs[i],h.R,h.hw))hurt(h.dmg,0)}}}
  if(t>h.te)h.done=1;return}
 if(k==='rpz'){if(h.done)return;const tr=h.tr;if(!tr||A.tr!==tr){if(t>h.te)h.done=1;return}
  if(!h.lk&&t>=h.tl){h.lk=1;const L=landOf(tr),w=W2(L.c);h.wx=w[0];h.wy=w[1]}
  if(!h.fin&&t>=h.tf){h.fin=1;if(!h.lk){const L=landOf(tr),w=W2(L.c);h.wx=w[0];h.wy=w[1];h.lk=1}
   if(!(h.can&&h.can())&&t-h.tf<500){shk(8);try{A.flash=performance.now()}catch(e){}
    for(let i=0;i<26;i++){const a=Math.random()*TAU,sp=50+Math.random()*170;pt(h.wx+Math.cos(a)*14,h.wy+16+Math.sin(a)*8,Math.cos(a)*sp,Math.sin(a)*sp*.5-30,.5+Math.random()*.6,Math.random()<.5?'110,170,70':'200,185,140',2+(Math.random()*2|0))}
    if(canHurt()&&Math.hypot(P.x-h.wx,P.y-h.wy)<=h.R+10)hurt(h.dmg,0)}}
  if(t>h.te)h.done=1;return}
 if(k==='rrr'){if(h.done)return;const tr=h.tr;if(!tr||A.tr!==tr){if(t>h.te)h.done=1;return}
  if(!h.lk&&t>=h.t0){h.lk=1;const b=bossW(),w=b||W2([h.x,h.y]);h.wx=w[0];h.wy=w[1]}
  if(!h.fin&&t>=h.tf){h.fin=1;if(t-h.tf<500){shk(h.big?10:6);try{A.flash=performance.now()}catch(e){}if(h.dmg>0&&h.lk&&canHurt()&&Math.hypot(P.x-h.wx,P.y-h.wy)<=h.R+10)hurt(h.dmg,0)}}
  if(t>h.te)h.done=1;return}}
/* ═════════ el fuego del Mago (mbf): el jefe escondido en ese manchón sale chamuscado ═════════ */
/* si el manchón ya ardía cuando empezó el turno (el aviso llegó antes que el turno), sale igual chamuscado */
function preBurn(tr,pk){const b=burnOf(pk);if(b&&!tr.fl&&b.ts+650-tr.s0<tr.pz.tl+200&&tr.s0<b.at+BMS)tr.fl={k:pk,at:Math.max(b.ts+650,tr.s0+tr.pz.Rn-120)}}
function flushHide(k){const tr=A.tr;if(!tr||!tr.hid||!tr.pz||tr.pz.pk!==k||tr.fl)return;const b=burnOf(k);if(!b)return;const at=b.ts+650;if(at-tr.s0>=tr.pz.tl+2600)return;tr.fl={k,at}}
/* ═════════ consejos y estado de la hierba (lo lee mjc13.js) ═════════ */
const HT={};
function hints(tr,u){const mv=tr.pl.mv,say=(k,s,ms)=>{if(!HT[k]){HT[k]=1;try{toast(s,ms||6000)}catch(e){}}};
 if(mv==='carga'&&u>800)say('lane','💡 El carril rojo marca por dónde embiste. Si hay una roca o un tronco en medio, ¡se estrella y queda aturdido!',7500);
 if(mv==='embos'&&u>300)say('amb','💡 Si la hierba se agita y se oyen pasos, el Velociraptor se esconde ahí y salta sobre su presa. «🐾 Rastrear» lo delata; el Mago puede quemar un manchón.',9000);
 if(mv==='cola'&&u>900)say('tail','💡 El barrido de cola golpea a su alrededor: aléjate del círculo antes de que se llene.',6000);
 if(mv==='garras'&&u>800)say('claw','💡 Tres zarpazos en abanico: sal por detrás de él o fuera de su alcance.',6000);
 if(mv==='alfa'&&u>300)say('alf','💡 ¡Instinto Alfa! Más rápido, más agresivo y con ataques combinados.',6000)}
/* ═════════ dibujo de los peligros ═════════ */
const GYO=8;                                                            /* los avisos del suelo se pintan 8 px bajo el centro lógico (a la altura de los pies) */
const sec=(x,y,R,a0,a1)=>{g.beginPath();g.moveTo(x,y);g.arc(x,y,R,a0,a1);g.closePath()};
const offS=(x,y,m)=>x<-m||x>VW+m||y<-m||y>VH+m;
function dLane(h,t,cx,cy,pn,dt){const tr=h.tr;if(h.done||!tr||A.tr!==tr||t<h.t0||t>h.te+500)return true;if(h.can&&h.can())return true;
 const l=tr.lanes[h.li];if(!l)return true;const q=l.ok?l:calcLane(tr,l),a=W2(q.a),b=W2([q.ex,q.ey]);
 const ax=a[0]-cx,ay=a[1]-cy+GYO,bx=b[0]-cx,by=b[1]-cy+GYO;if(Math.max(ax,bx)<-140||Math.min(ax,bx)>VW+140||Math.max(ay,by)<-140||Math.min(ay,by)>VH+140)return true;
 const dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,nx=-uy,ny=ux,W=44,pre=t<h.ts,p=pre?cl((t-h.t0)/Math.max(1,h.tl-h.t0),0,1):1,fa=t<h.te?1:cl(1-(t-h.te)/450,0,1),lk=t>=h.tl;
 g.save();g.globalAlpha=fa;
 g.beginPath();g.moveTo(ax+nx*W,ay+ny*W);g.lineTo(bx+nx*W,by+ny*W);g.lineTo(bx-nx*W,by-ny*W);g.lineTo(ax-nx*W,ay-ny*W);g.closePath();
 const gr=g.createLinearGradient(ax,ay,bx,by);gr.addColorStop(0,'rgba(255,60,40,'+(.05+.1*p)+')');gr.addColorStop(1,'rgba(255,60,40,'+(.12+.2*p+(lk&&t-h.tl<200?.2*(1-(t-h.tl)/200):0))+')');g.fillStyle=gr;g.fill();
 g.setLineDash([12,9]);g.lineWidth=2;g.strokeStyle='rgba(255,140,120,'+(.4+.45*p)+')';g.stroke();g.setLineDash([]);
 g.strokeStyle='rgba(255,210,190,'+(.3+.4*p)+')';g.lineWidth=3;g.lineJoin='round';
 for(let s=(pn*.26)%86;s<L-14;s+=86){const px=ax+ux*s,py=ay+uy*s;g.beginPath();g.moveTo(px-ux*10+nx*22,py-uy*10+ny*22);g.lineTo(px+ux*12,py+uy*12);g.lineTo(px-ux*10-nx*22,py-uy*10-ny*22);g.stroke()}
 if(q.crash){g.save();g.translate(bx,by);g.globalCompositeOperation='lighter';const k=.7+.3*Math.sin(pn/80);g.strokeStyle='rgba(255,220,120,'+(.6*k)+')';g.lineWidth=3;
  for(let i=0;i<8;i++){const a2=i*.7854+pn/900;g.beginPath();g.moveTo(Math.cos(a2)*14,Math.sin(a2)*14);g.lineTo(Math.cos(a2)*(30+8*k),Math.sin(a2)*(30+8*k));g.stroke()}g.restore();
  g.font='22px serif';g.textAlign='center';g.fillStyle='#fff';g.fillText('💥',bx,by-30-3*Math.sin(pn/120))}
 else{g.save();g.translate(bx,by);g.rotate(Math.atan2(uy,ux));g.fillStyle='rgba(255,70,50,'+(.4+.4*p)+')';g.beginPath();g.moveTo(18,0);g.lineTo(-6,-16);g.lineTo(-2,0);g.lineTo(-6,16);g.closePath();g.fill();g.restore()}
 g.restore();return true}
function dSw(h,t,cx,cy,pn,dt){const tr=h.tr;if(h.done||!tr||A.tr!==tr||t<h.t0||t>h.te)return true;if(h.can&&h.can())return true;
 let w;if(h.lk&&h.wx!=null)w=[h.wx,h.wy];else if(h.pc){w=W2(h.pc())}else{w=bossW();if(!w)return true}
 const x=w[0]-cx,y=w[1]-cy+GYO,R=h.R;if(offS(x,y,R+60))return true;
 if(t<h.tf){const p=cl((t-h.t0)/Math.max(1,h.tf-h.t0),0,1),q=cl((t-h.tl)/Math.max(1,h.tf-h.tl),0,1);
  g.beginPath();g.arc(x,y,R,0,TAU);g.fillStyle='rgba(255,60,40,'+(.05+.1*p)+')';g.fill();
  g.beginPath();g.arc(x,y,R*(.15+.85*q),0,TAU);g.fillStyle='rgba(255,60,40,'+(.1+.2*q+(q>.85?.1*Math.sin(pn/40):0))+')';g.fill();
  g.save();g.setLineDash([11,8]);g.lineWidth=2;g.strokeStyle='rgba(255,150,130,'+(.5+.35*p)+')';g.beginPath();g.arc(x,y,R,0,TAU);g.stroke();g.setLineDash([]);
  g.globalCompositeOperation='lighter';g.lineWidth=4;g.lineCap='round';const a0=pn/(300-170*q);g.strokeStyle='rgba(255,200,150,'+(.25+.4*q)+')';g.beginPath();g.arc(x,y,R*.86,a0,a0+1.1);g.stroke();g.beginPath();g.arc(x,y,R*.86,a0+Math.PI,a0+Math.PI+1.1);g.stroke();g.restore()}
 else{const q=cl((t-h.tf)/380,0,1),q2=cl((t-h.tf)/600,0,1);g.save();g.globalCompositeOperation='lighter';g.lineCap='round';
  g.strokeStyle='rgba(255,235,205,'+(.9*(1-q2))+')';g.lineWidth=18*(1-q*.5);g.beginPath();g.arc(x,y,R*.84,-1.2+q*TAU,-1.2+q*TAU+Math.min(2.4,q*7));g.stroke();
  g.strokeStyle='rgba(255,150,90,'+(.5*(1-q2))+')';g.lineWidth=8;g.beginPath();g.arc(x,y,R*.84,-1.2+q*TAU,-1.2+q*TAU+Math.min(2.4,q*7));g.stroke();
  g.strokeStyle='rgba(255,220,190,'+(.7*(1-q2))+')';g.lineWidth=3+4*(1-q2);g.beginPath();g.arc(x,y,R*(.6+.5*q2),0,TAU);g.stroke();g.restore()}
 return true}
function dCl(h,t,cx,cy,pn,dt){const tr=h.tr;if(h.done||!tr||A.tr!==tr||t<h.t0||t>h.te)return true;
 let w,a0;if(h.lk){w=[h.wx,h.wy];a0=h.a0}else{w=bossW();if(!w)return true;const tp=posOf(tr.ti)||[P.x,P.y];a0=Math.atan2(tp[1]-w[1],tp[0]-w[0])}
 const x=w[0]-cx,y=w[1]-cy+GYO;if(offS(x,y,h.R+60))return true;let nxt=-1;for(let i=0;i<h.tfs.length;i++)if(t<h.tfs[i]){nxt=i;break}
 for(let i=0;i<h.tfs.length;i++){const an=a0+h.offs[i],tf=h.tfs[i];
  if(t<tf){const act=i===nxt,p=cl(1-(tf-t)/(act?420:1500),0,1);sec(x,y,h.R,an-h.hw,an+h.hw);g.fillStyle='rgba(255,60,40,'+((act?.12+.22*p:.07)+(act&&p>.8?.1*Math.sin(pn/35):0))+')';g.fill();
   g.save();g.setLineDash([9,7]);g.lineWidth=2;g.strokeStyle='rgba(255,150,130,'+(act?.6+.3*p:.35)+')';g.stroke();g.restore()}
  else if(t-tf<300){const q=(t-tf)/300;g.save();g.globalCompositeOperation='lighter';g.lineCap='round';
   for(let j=0;j<3;j++){const rr=h.R*(.5+.2*j),s0=an-h.hw+(.12*j),s1=s0+Math.min(2*h.hw-.2,q*2*h.hw*1.4);g.strokeStyle='rgba(255,240,215,'+(.85*(1-q))+')';g.lineWidth=5-j;g.beginPath();g.arc(x,y,rr,s0,s1);g.stroke()}
   g.restore();sec(x,y,h.R,an-h.hw,an+h.hw);g.fillStyle='rgba(255,215,190,'+(.3*(1-q))+')';g.fill()}}
 return true}
function dPz(h,t,cx,cy,pn,dt){const tr=h.tr;if(h.done||!tr||A.tr!==tr||t<h.tl||t>h.te)return true;if(h.can&&h.can())return true;
 let w;if(h.lk&&h.wx!=null)w=[h.wx,h.wy];else return true;const x=w[0]-cx,y=w[1]-cy+GYO,R=h.R;if(offS(x,y,R+80))return true;
 if(t<h.tf){const p=cl((t-h.tl)/Math.max(1,h.tf-h.tl),0,1);
  g.beginPath();g.ellipse(x,y,R*p*.92,R*p*.92*.55,0,0,TAU);g.fillStyle='rgba(0,0,0,'+(.22*p)+')';g.fill();
  g.beginPath();g.arc(x,y,R,0,TAU);g.fillStyle='rgba(255,60,40,'+(.06+.1*p)+')';g.fill();
  g.beginPath();g.arc(x,y,R*p,0,TAU);g.fillStyle='rgba(255,60,40,'+(.1+.22*p+(p>.88?.12*Math.sin(pn/38):0))+')';g.fill();
  g.save();g.setLineDash([10,8]);g.lineWidth=2;g.strokeStyle='rgba(255,150,130,'+(.55+.35*p)+')';g.beginPath();g.arc(x,y,R,0,TAU);g.stroke();g.setLineDash([]);
  g.globalCompositeOperation='lighter';g.lineWidth=3;g.strokeStyle='rgba(255,215,170,'+(.3+.4*p)+')';for(let i=0;i<4;i++){const a=i*1.5708+pn/500;g.beginPath();g.moveTo(x+Math.cos(a)*R*.35,y+Math.sin(a)*R*.35);g.lineTo(x+Math.cos(a)*R*.8,y+Math.sin(a)*R*.8);g.stroke()}g.restore()}
 else{const q=cl((t-h.tf)/450,0,1);g.save();g.globalCompositeOperation='lighter';g.beginPath();g.arc(x,y,R*(.9+.35*q),0,TAU);g.lineWidth=5*(1-q)+1;g.strokeStyle='rgba(255,230,190,'+(.8*(1-q))+')';g.stroke();g.beginPath();g.arc(x,y,R,0,TAU);g.fillStyle='rgba(255,200,150,'+(.3*(1-q)*(1-q))+')';g.fill();g.restore()}
 return true}
function dRr(h,t,cx,cy,pn,dt){const tr=h.tr;if(h.done||!tr||A.tr!==tr||t<h.t0||t>h.te)return true;
 const w=h.lk&&h.wx!=null?[h.wx,h.wy]:bossW();if(!w)return true;const x=w[0]-cx,y=w[1]-cy+GYO,R=h.R;if(offS(x,y,Math.min(R,900)+60))return true;
 if(h.vis){const q=cl((t-h.t0)/1500,0,1);g.save();g.globalCompositeOperation='lighter';for(let i=0;i<3;i++){const f=cl(q*1.3-i*.16,0,1);if(f<=0||f>=1)continue;g.lineWidth=7*(1-f)+1;g.strokeStyle='rgba(255,200,130,'+(.6*(1-f))+')';g.beginPath();g.arc(x,y,R*f,0,TAU);g.stroke()}g.restore();return true}
 if(t<h.tf){const p=cl((t-h.t0)/Math.max(1,h.tf-h.t0),0,1);
  g.save();const gr=g.createRadialGradient(x,y,10,x,y,R);gr.addColorStop(0,'rgba(255,60,40,'+(.1+.18*p)+')');gr.addColorStop(1,'rgba(255,60,40,'+(.04+.1*p)+')');g.fillStyle=gr;g.beginPath();g.arc(x,y,R,0,TAU);g.fill();
  g.setLineDash([12,9]);g.lineWidth=3;g.strokeStyle='rgba(255,150,130,'+(.5+.4*p)+')';g.stroke();g.setLineDash([]);
  g.globalCompositeOperation='lighter';g.lineWidth=2+3*p;for(let i=0;i<3;i++){const f=(p*2.2+i*.34)%1;g.strokeStyle='rgba(255,170,120,'+(.45*f*(.4+.6*p))+')';g.beginPath();g.arc(x,y,Math.max(10,R*(1-f*.9)),0,TAU);g.stroke()}g.restore()}
 else{const q=cl((t-h.tf)/900,0,1);g.save();g.globalCompositeOperation='lighter';g.lineWidth=14*(1-q)+2;g.strokeStyle='rgba(255,225,170,'+(.85*(1-q))+')';g.beginPath();g.arc(x,y,R*(.2+.85*ez(q)),0,TAU);g.stroke();g.lineWidth=5;g.strokeStyle='rgba(255,120,60,'+(.5*(1-q))+')';g.beginPath();g.arc(x,y,R*(.12+.7*ez(q)),0,TAU);g.stroke();g.restore()}
 return true}
function drawR(h,t,cx,cy,now,pn,dt){switch(h.k){case'rlane':return dLane(h,t,cx,cy,pn,dt);case'rsw':return dSw(h,t,cx,cy,pn,dt);case'rcl':return dCl(h,t,cx,cy,pn,dt);case'rpz':return dPz(h,t,cx,cy,pn,dt);case'rrr':return dRr(h,t,cx,cy,pn,dt)}return false}
/* ═════════ el Velociraptor ═════════ */
const DIRIDX={down:0,left:1,right:2,up:3},CW=['right','down','left','up'];
const EYES={down:[[27,12],[37,12]],left:[[15,11]],right:[[48,12]],up:[]};
const rowSg=r=>r==='right'?1:r==='left'?-1:0;
function pickRow(e,an){const c=Math.cos(an),s=Math.sin(an),pr=e._row;let r;
 if(pr==='left'||pr==='right')r=Math.abs(c)>=Math.abs(s)*.8?(c>0?'right':'left'):(s>0?'down':'up');
 else if(pr==='up'||pr==='down')r=Math.abs(s)>=Math.abs(c)*.8?(s>0?'down':'up'):(c>0?'right':'left');
 else r=Math.abs(c)>Math.abs(s)?(c>0?'right':'left'):(s>0?'down':'up');
 if(r!==pr){e._row=r;e._rowT=performance.now()}return r}
/* peso de cada franja vertical del sprite al mover la cola (0 = cabeza, 1 = punta de la cola) */
const tw8=(row,i,n)=>{const f=i/(n-1);return row==='left'?f*f:row==='right'?(1-f)*(1-f):row==='down'?.25+.75*f*f:.5*Math.sin(f*3.14)+.15};
function blit(e,x,y,sc,row,col,o){const F=MJ.FAMS[5],fw=F.fw,fh=F.fh,w=fw*sc,h=fh*sc,ri=DIRIDX[row];
 const sm=g.imageSmoothingEnabled;g.imageSmoothingEnabled=true;try{g.imageSmoothingQuality='high'}catch(x2){}
 g.save();g.translate(Math.round(x+(o.dx||0)),Math.round(y+(o.dy||0)));if(o.rot)g.rotate(o.rot);g.scale(o.sx||1,o.sy||1);
 if(o.tw>.05){const n=12,sw=fw/n,dw=w/n;for(let i=0;i<n;i++){const dy=Math.sin((o.tp||0)+i*.6)*o.tw*tw8(row,i,n)*sc/1.9;g.drawImage(F.cv,col*fw+i*sw,ri*fh,sw,fh,-w/2+i*dw,-h+dy,dw+.6,h)}}
 else g.drawImage(F.cv,col*fw,ri*fh,fw,fh,-w/2,-h,w,h);
 if(o.eye){g.globalCompositeOperation='lighter';for(const q of EYES[row]){const ex=(q[0]-32)*sc,ey=(q[1]-64)*sc,r=(5+4*o.eye)*sc/1.9,gr=g.createRadialGradient(ex,ey,0,ex,ey,r);gr.addColorStop(0,'rgba(255,120,90,'+(.85*Math.min(1,o.eye))+')');gr.addColorStop(1,'rgba(255,40,30,0)');g.fillStyle=gr;g.fillRect(ex-r,ey-r,r*2,r*2)}}
 g.restore();g.imageSmoothingEnabled=sm}
function draw1(e,cx,cy,now){
 if(e.x<-9000)return true;const F=MJ.FAMS[5];if(!F||!F.cv)return true;
 const tr=A.tr,ps=(tr&&tr.ps)||{st:'move'},pn=performance.now(),dying=!!(A.dying&&A.done&&A.res&&!A.res.lost);
 let x=e.x-cx,y=e.y-cy+16;if(dying){const p=cl((pn-A.dying)/2600,0,1);y+=67.6*(p-.3*p*p)}
 if(x<-320||x>VW+320||y<-280||y>VH+260)return true;
 const st=dying?'dead':(ps.st||'move'),sc=F.sc*(e._mjs||1),an=ps.an!=null?ps.an:(e._an||0),dtg=Math.min(.1,Math.max(0,(pn-(e._gt||pn))/1000));e._gt=pn;
 const sp=Math.hypot(e._vx||0,e._vy||0);e._gp=((e._gp||0)+Math.min(9,sp/66)*dtg)%1000;
 let row=pickRow(e,an);const sg0=()=>rowSg(row);
 const ph2=!!A.ph2&&!A.done;
 /* oculto en la hierba: solo se ven sus ojos si estás cerca (y la silueta si rastreas) */
 if(st==='hid'){const d=Math.hypot(e.x-P.x,e.y-P.y),ea=cl(1-d/620,0,1)*(.55+.4*Math.sin(pn/230+(e.sid||0)))*(Math.sin(pn/1300)>.93?0:1);
  if(ea>.03){g.save();g.globalCompositeOperation='lighter';for(const dx of[-7,7]){const gr=g.createRadialGradient(x+dx,y-38,0,x+dx,y-38,9);gr.addColorStop(0,'rgba(255,110,80,'+ea+')');gr.addColorStop(1,'rgba(255,40,30,0)');g.fillStyle=gr;g.fillRect(x+dx-9,y-47,18,18)}g.restore()}
  if(RS.on()){g.save();g.globalAlpha=.5;blit(e,x,y,sc,row,0,{sy:1,eye:1});g.globalAlpha=1;g.strokeStyle='rgba(150,255,170,.85)';g.setLineDash([6,5]);g.lineWidth=2;g.beginPath();g.ellipse(x,y,46,16,0,0,TAU);g.stroke();g.restore()}
  return true}
 const al=Math.max(0,Math.min(1,e.al));if(al<=.02)return true;
 let o={rot:0,sx:1,sy:1,dx:0,dy:0,tw:2.5,tp:pn/230,eye:ph2?1:.55},col=sp>14?1+Math.floor((e._gp%1)*6):0,shR=1,lift=0;
 const sg=sg0(),u=ps.u||0,k=ps.k||0;
 /* giro rápido: al cambiar de dirección se encoge y levanta un poco de polvo */
 {const tq=e._rowT?cl(1-(pn-e._rowT)/140,0,1):0;if(tq>0&&st!=='tail'&&sp>60){o.sx*=1-.16*tq;o.rot+=((e._rowT%2)?1:-1)*.07*tq;if(e._rowT!==e._rowD){e._rowD=e._rowT;for(let i=0;i<5;i++)pt(e.x+(Math.random()-.5)*30,e.y+30,(Math.random()-.5)*60,-10-Math.random()*20,.4+Math.random()*.3,'188,166,116',2)}}}
 switch(st){
  case'move':{if(sp>14){const run=cl(sp/520,0,1);o.rot+=sg*(.03+.13*run);o.sx*=1+.07*run;o.dy=-Math.abs(Math.sin((e._gp||0)*Math.PI*2))*(1.5+4.5*run);o.tw=3+7*run;o.tp=pn/(110-60*run);if(sp>150&&sp<=420)o.dx=0}else{o.sy*=1+.014*Math.sin(pn/210)}break}
  case'dash':{o.rot+=sg*.2;o.sx*=1.1;o.sy*=.97;o.dy=-Math.abs(Math.sin((e._gp||0)*Math.PI*2))*5;o.tw=9;o.tp=pn/55;o.eye=1;
   if(sp>300){const kk=Math.min(4,Math.floor(sp/260));for(let j=kk;j>=1;j--){g.save();g.globalAlpha=al*.16*(1-j/(kk+1));blit(e,x-(e._vx||0)*.03*j,y-(e._vy||0)*.03*j,sc,row,col,Object.assign({},o,{eye:0}));g.restore()}}break}
  case'crouch':case'windup':{const kk=cl((u||0)/800,0,1);o.sy*=.9-.03*kk;o.sx*=1.05+.03*kk;o.dx=(Math.random()-.5)*(.6+2.4*kk)*(st==='crouch'?1:.5);o.dy=(Math.random()-.5)*.9*kk;o.tw=st==='crouch'?11:6;o.tp=pn/58;o.eye=1;o.rot+=sg*.06*kk;col=0;break}
  case'sniff':{o.rot+=Math.sin(pn/95)*.035;o.dy=-Math.abs(Math.sin(pn/190))*2.5;o.tw=2;col=0;if(Math.random()<.05)pt(e.x+sg*30,e.y+4,sg*10,-8,.5,'220,225,230',2);break}
  case'rise':{const kk=ez(cl(k,0,1));o.sy*=.25+.75*kk;o.dy=(1-kk)*30;o.eye=kk;col=0;break}
  case'roar':{const kk=cl(k,0,1),pk=Math.sin(Math.min(1,kk*4)*Math.PI/2);o.rot+=-sg*.1*pk;o.sy*=1+.07*pk;o.sx*=1+.04*pk;o.dx=(Math.random()-.5)*2.4;o.dy=-2-Math.random()*1.5;o.tw=7;o.tp=pn/50;o.eye=1;col=0;break}
  case'leap':{const z=ps.z||0;lift=z;o.dy=-z;o.sx*=1.14;o.sy*=.96;o.rot+=sg*(-.14+.34*k);o.tw=5;o.tp=pn/60;o.eye=1;col=3;shR=1-z/110;break}
  case'claw':{const ck=ps.ck||0,lung=ck>.25&&ck<.6?Math.sin((ck-.25)/.35*Math.PI):0;o.dx=Math.cos(an)*20*lung;o.dy=Math.sin(an)*8*lung;o.rot+=sg*.2*lung;o.sy*=.95;o.sx*=1+.06*lung;o.tw=7;o.tp=pn/60;o.eye=1;col=0;break}
  case'tail':{const i0=Math.max(0,CW.indexOf(row0(e,an))),step=Math.floor((u||0)/72);row=CW[(i0+step)%4];o.sx*=1.05;o.sy*=.96;o.tw=14;o.tp=pn/38;o.eye=1;col=0;
   if(Math.random()<.5)pt(e.x+(Math.random()-.5)*110,e.y+34,(Math.random()-.5)*90,-6-Math.random()*20,.4+Math.random()*.3,'188,166,116',2);break}
  case'crash':{const uu=u||0,kn=ez(cl(uu/220,0,1))*(1-.45*ez(cl((uu-350)/450,0,1))),dc=1-cl(uu/1500,0,1);o.dx=-Math.cos(an)*26*kn;o.dy=-Math.sin(an)*8*kn;o.rot+=sg*(.12+.1*Math.sin(pn/55))*dc;o.sy*=.93;o.dx+=(Math.random()-.5)*2*dc;o.eye=.3;o.tw=1;col=0;break}
  case'dead':{const p=cl((pn-A.dying)/700,0,1),f=ez(p);o.rot+=(sg||1)*1.45*f;o.sy*=1-.15*f;o.eye=0;o.tw=0;col=0;break}
  case'recover':default:{const uu=u||0,sq=cl(1-uu/260,0,1);o.sy*=1+.025*Math.sin(pn/150)-.1*sq;o.sx*=1+.04*sq;o.dx=0;o.tw=3;o.eye=ph2?.9:.5;col=0;if(Math.random()<.04)pt(e.x+sg*34,e.y+2,sg*14,-10,.7,'220,225,230',2)}}
 /* sombra */
 {const rx=(row==='left'||row==='right'?44:32)*sc/1.92*shR,ry=rx*.27;g.fillStyle='rgba(0,0,0,'+(.34*al*(shR*.5+.5)).toFixed(3)+')';g.beginPath();g.ellipse(x+(o.dx||0)*.6,y,rx,ry,0,0,TAU);g.fill()}
 /* aura de carga / rugido */
 if(ps.ch){g.save();g.globalCompositeOperation='lighter';const kq=ps.ch===2?1:.55+.45*Math.sin(pn/60),r=ps.ch===2?150:96,gr=g.createRadialGradient(x,y-40,6,x,y-40,r);gr.addColorStop(0,'rgba(255,90,50,'+(.34*kq*al)+')');gr.addColorStop(1,'rgba(255,60,30,0)');g.fillStyle=gr;g.fillRect(x-r,y-40-r,r*2,r*2);g.restore()}
 /* cuerpo */
 g.save();g.globalAlpha=al;blit(e,x,y,sc,row,col,o);g.restore();
 if(ph2){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=al*.14;blit(e,x,y,sc,row,col,Object.assign({},o,{eye:0}));g.restore()}
 if(e._hf&&pn-e._hf<110){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=al*.55*(1-(pn-e._hf)/110);blit(e,x,y,sc,row,col,Object.assign({},o,{eye:0}));g.restore()}
 /* ondas del rugido, estrellas del aturdimiento, siluetas del rastreo */
 if(st==='roar'){const eyq=EYES[row===undefined?'down':row],hx=x+(eyq&&eyq[0]?(eyq[0][0]-32)*sc:0),hy=y+(eyq&&eyq[0]?(eyq[0][1]-64)*sc+10:-80),a0=Math.atan2(Math.sin(an),Math.cos(an));g.save();g.globalCompositeOperation='lighter';g.lineWidth=3;g.lineCap='round';
  for(let i=0;i<3;i++){const f=((pn/520)+i/3)%1;g.strokeStyle='rgba(255,210,150,'+(.55*(1-f))+')';g.beginPath();g.arc(hx,hy,24+f*110,a0-.55,a0+.55);g.stroke()}g.restore()}
 if(st==='crash'&&(u||0)<1700){const f=cl(1-(u||0)/1700,0,1);g.save();g.font='15px serif';g.textAlign='center';g.globalAlpha=f;for(let i=0;i<3;i++){const a=pn/260+i*2.094;g.fillStyle='#ffe27a';g.fillText('★',x+Math.cos(a)*30,y-sc*50*.9+Math.sin(a)*9)}g.restore()}
 if(RS.on()&&st!=='dead'){g.save();g.strokeStyle='rgba(150,255,170,'+(.55+.3*Math.sin(pn/140))+')';g.setLineDash([6,5]);g.lineWidth=2;g.beginPath();g.ellipse(x,y,50,17,0,0,TAU);g.stroke();g.restore()}
 return true}
const row0=(e,an)=>e._row||'right';
/* ═════════ suelo: huellas, rastreo y flechas ═════════ */
const FP=[];let FPD=0,FPX=null,FPY=null,FPS=1;
const RS={until:0,cd:0,bcd:0,on:()=>performance.now()<RS.until};
function arrow(x,y,col,pn,s){const ex=cl(x,40,VW-40),ey=cl(y,76,VH-110);if(ex===x&&ey===y)return;const a=Math.atan2(y-ey,x-ex),k=.65+.35*Math.sin(pn/90);
 g.save();g.translate(ex,ey);g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(0,0,2,0,0,46*s);gr.addColorStop(0,'rgba('+col+','+(.38*k)+')');gr.addColorStop(1,'rgba('+col+',0)');g.fillStyle=gr;g.fillRect(-46*s,-46*s,92*s,92*s);
 g.rotate(a);g.fillStyle='rgba('+col+','+(.85*k)+')';g.beginPath();g.moveTo(17*s,0);g.lineTo(-8*s,-11*s);g.lineTo(-3*s,0);g.lineTo(-8*s,11*s);g.closePath();g.fill();g.restore()}
function ground(cx,cy,now,pn,dt,t){
 if(!(A.on&&A.b==='rap'))return;const tr=A.tr,B0=A.boss,trk=RS.on();
 /* huellas (se ven mejor con el rastreo) */
 for(let i=FP.length-1;i>=0;i--){const f=FP[i],age=(pn-f.t)/1000;if(age>(trk?9:5.5)){FP.splice(i,1);continue}const al=cl(1-age/(trk?9:5.5),0,1)*(trk?1:.8),x=f.x-cx,y=f.y-cy;if(offS(x,y,30))continue;
  g.save();g.translate(x,y);g.rotate(f.a);g.fillStyle='rgba(28,20,12,'+(.5*al)+')';g.beginPath();g.ellipse(0,0,6,4.2,0,0,TAU);g.fill();g.strokeStyle='rgba(28,20,12,'+(.55*al)+')';g.lineWidth=2;g.lineCap='round';
  for(const q of[-.5,0,.5]){g.beginPath();g.moveTo(5,Math.sin(q)*3);g.lineTo(11,Math.sin(q)*6);g.stroke()}
  if(trk){g.globalCompositeOperation='lighter';g.fillStyle='rgba(120,255,160,'+(.25*al)+')';g.beginPath();g.ellipse(0,0,9,6.5,0,0,TAU);g.fill()}g.restore()}
 /* rastreo: dónde se esconde, a quién ha elegido y dónde caería el salto */
 if(trk&&tr&&tr.ps){const ps=tr.ps,fadeIn=cl(1-(RS.until-pn)/9000,0,1);
  if(tr.pz&&(ps.st==='hid'||(ps.st==='move'&&tr.pl&&(tr.pl.mv==='embos'||tr.pl.mv==='cB')&&t-tr.s0<tr.pz.Rn+200))&&!ps.flee){
   const pk=tr.pz.pk,c=W2(PC[pk]),x=c[0]-cx,y=c[1]-cy+GYO,r=PATCH[pk].r,tp=posOf(tr.ti)||[P.x,P.y],tx=tp[0]-cx,ty=tp[1]-cy+GYO,k=.6+.4*Math.sin(pn/120);
   g.save();g.lineWidth=3;g.setLineDash([9,7]);g.strokeStyle='rgba(150,255,170,'+(.7*k)+')';g.beginPath();g.ellipse(x,y,r*1.08,r*.8,0,0,TAU);g.stroke();
   g.globalCompositeOperation='lighter';for(let i=0;i<2;i++){const f=((pn/900)+i/2)%1;g.lineWidth=3*(1-f)+1;g.strokeStyle='rgba(150,255,170,'+(.6*(1-f))+')';g.setLineDash([]);g.beginPath();g.ellipse(x,y,r*(.3+.85*f),r*(.3+.85*f)*.74,0,0,TAU);g.stroke()}
   g.setLineDash([8,8]);g.lineWidth=2;g.strokeStyle='rgba(255,170,120,.7)';g.beginPath();g.moveTo(x,y);g.lineTo(tx,ty);g.stroke();
   g.setLineDash([5,5]);g.strokeStyle='rgba(255,120,90,'+(.45+.3*k)+')';g.beginPath();g.arc(tx,ty,76,0,TAU);g.stroke();
   g.setLineDash([]);g.font='bold 11px Georgia,serif';g.textAlign='center';g.lineWidth=3;g.strokeStyle='rgba(0,0,0,.85)';const nm='🎯 '+tr.ti;g.strokeText(nm,tx,ty-86);g.fillStyle='#ffd9a0';g.fillText(nm,tx,ty-86);
   g.font='18px serif';g.fillText('🐾',x,y-r*.8-6);g.restore();arrow(c[0]-cx,c[1]-cy,'150,255,170',pn,.8)}}
 /* flecha hacia el jefe cuando queda fuera de pantalla */
 if(B0&&B0.x>-9000&&B0.al>.3&&!A.done)arrow(B0.x-cx,B0.y-cy,'255,150,90',pn,.8)}
/* ═════════ botones: «🐾 Rastrear» (todas las clases) y «🔥 Quemar hierba» (solo el Mago, junto a un manchón) ═════════ */
const cxel=$('ctx');let bTr=null,bBn=null,burnBusy=false;
const liveBurns=()=>{const t=sn();return(A.burn||[]).filter(b=>t<b.at+BMS).length};
function nearPatch(){if(!(A.on&&A.b==='rap')||A.fell||A.done||A.quit||P.cls!==2||sn()-A.t0<3000||liveBurns()>=2||performance.now()<RS.bcd)return-1;const t=sn();let best=-1,bd=1e9;
 for(let k=0;k<6;k++){const s=patchSt(k,t);if(s.m!=='ok'||s.g<1)continue;const w=W2(PC[k]),d=Math.hypot(P.x-w[0],P.y-w[1]);if(d<PATCH[k].r+60&&d<bd){bd=d;best=k}}return best}
const setBtn=(el,ico,lab)=>{const k=ico+'|'+lab;if(el._k===k)return;el._k=k;el.innerHTML='<b style="font-size:16px;line-height:1;font-weight:400">'+ico+'</b><i style="font-size:8px;font-style:normal;line-height:1;margin-top:1px;white-space:nowrap">'+lab+'</i>'};
const trackDur=()=>P.cls===3||P.cls===6?9000:5000;
function doTrack(){const n=performance.now();if(!(A.on&&A.b==='rap')||n<RS.cd)return;RS.until=n+trackDur();RS.cd=n+14000;try{snd('rtrack',1,0,0);toast(P.cls===3||P.cls===6?'🐾 Rastreo experto: ves su escondite, a su presa y dónde saltaría (9 s)':'🐾 Rastreas: ves su escondite, a su presa y dónde saltaría (5 s)',3200)}catch(e){}}
/* v437: el fuego va DIRECTO al servidor. mop() (play.html) sube primero la partida entera (save + flush) y recién después manda la orden: en un celular con partida grande eso añade
   fracciones de segundo (o más si coincide con un autoguardado) justo en la ventana en que el Mago puede expulsar al jefe antes del salto, y el servidor no necesita nada de la partida para quemar */
async function burnRpc(k){if(typeof ONL==='function'&&!ONL()){try{toast('Necesitas conexión con el servidor',3000)}catch(e){}return null}
 try{return await SRNET.rpc({t:'x',op:'mb.burn',k,id:A.id,tok:A.tok})}catch(e){try{toast(String((e&&e.message)||'No se pudo completar'),4500)}catch(x){}return null}}
async function doBurn(){const k=nearPatch();if(k<0||!bBn)return;burnBusy=true;bBn.disabled=true;try{const r=await burnRpc(k);if(r&&r.ok&&r.at){RS.bcd=performance.now()+9000;addBurn(k,r.at,sn(),P.name)}}catch(e){}burnBusy=false}
setInterval(()=>{try{if(!cxel)return;
 if(!bTr||!bTr.isConnected){bTr=document.createElement('button');bTr.id='mjrstr';bTr.hidden=true;bTr.onclick=doTrack;cxel.appendChild(bTr)}
 if(!bBn||!bBn.isConnected){bBn=document.createElement('button');bBn.id='mjquem';bBn.hidden=true;bBn.onclick=doBurn;cxel.appendChild(bBn)}
 const hide=typeof modal!=='undefined'&&modal,on=!!(A.on&&A.b==='rap'&&!A.fell&&!A.done&&!A.quit)&&!hide,n=performance.now();
 bTr.hidden=!on;if(on){const left=Math.ceil((RS.until-n)/1000),cd=Math.ceil((RS.cd-n)/1000);setBtn(bTr,'🐾',n<RS.until?left+' s':n<RS.cd?cd+' s':'Rastrear');bTr.title='Rastrear: ves su escondite, a su presa y dónde saltaría';bTr.disabled=n<RS.cd}
 const k=on?nearPatch():-1;bBn.hidden=k<0;if(k>=0){setBtn(bBn,'🔥','Quemar');bBn.title='Quemar hierba ('+liveBurns()+'/2)';bBn.disabled=burnBusy;if(!HT.burn){HT.burn=1;try{toast('💡 Mago: puedes quemar un manchón de hierba alta. El fuego es local y temporal: el Velociraptor pierde ese escondite (y sale chamuscado si estaba dentro).',7500)}catch(e){}}}}catch(e){}},180);
/* ═════════ perfil del Velociraptor ═════════ */
const css=document.createElement('style');
css.textContent='#mjab.rap .bar{border-color:#6f8f2e;box-shadow:0 0 14px rgba(150,200,60,.35)}#mjab.rap .bar u{background:linear-gradient(180deg,#e0ee6a,#7da72b 55%,#3b5a12)}#mjab.rap .t i{color:#d7ea9c}'
+'#mjab.rap .t em{background:rgba(40,60,12,.88);border-color:#a6c75a;color:#eaf5c4}#mjab.rap .t em.p2{background:rgba(110,50,10,.94);border-color:#ffb060;color:#ffe6c2;animation:mjrp 1s ease-in-out infinite}@keyframes mjrp{50%{box-shadow:0 0 12px 2px rgba(255,150,60,.85)}}'
+'body.mjrap #mjrv{background:radial-gradient(ellipse 75% 70% at 50% 52%,transparent 40%,rgba(130,60,0,.5) 100%)}body.mjrap #mjrf{background:radial-gradient(ellipse at center,rgba(255,235,200,.5),rgba(255,150,60,.25) 60%,transparent 100%)}'
+'#mjrstr,#mjquem{flex-direction:column!important;gap:0!important;padding:0!important}#mjrstr{background:linear-gradient(180deg,#2f6a3a,#173d20)!important;border-color:#8ad07a!important}#mjquem{background:linear-gradient(180deg,#b23c1a,#5e1808)!important;border-color:#ffb066!important}';
document.head.appendChild(css);
const cls=on=>{try{document.body.classList.toggle('mjrap',!!on)}catch(e){}};
function reset0(){A.burn=[];A.burnV=0;seq1.length=0;for(const q in PL)delete PL[q];plKey='';for(const q in HT)delete HT[q];FP.length=0;FPD=0;FPX=FPY=null;RS.until=RS.cd=RS.bcd=0;cls(0)}
function frame(t,dt,pn,tr,u){const B0=A.boss;if(!tr||!tr.pl||!B0)return;const ps=tr.ps;
 if(ps&&B0.x>-9000){B0._an=ps.an;
  const mov=(ps.st==='move'||ps.st==='dash')&&B0.al>.5,d=FPX==null?0:Math.hypot(B0.x-FPX,B0.y-FPY);FPX=B0.x;FPY=B0.y;
  if(mov){FPD+=d;if(FPD>50){FPD=0;FPS=-FPS;const a=ps.an||0;FP.push({x:B0.x+Math.cos(a+1.5708)*FPS*10,y:B0.y+22+Math.sin(a+1.5708)*FPS*6,a,t:pn});if(FP.length>80)FP.shift()}}
  const sp=Math.hypot(B0._vx||0,B0._vy||0);
  if(mov&&sp>380&&Math.random()<dt*40){const a=ps.an||0;pt(B0.x-Math.cos(a)*34+(Math.random()-.5)*22,B0.y+30,-Math.cos(a)*40*Math.random(),-12-Math.random()*22,.5+Math.random()*.5,'188,166,116',2+(Math.random()*2|0))}
  if(ps.st==='hid'&&ps.hk!=null&&Math.random()<dt*30){const k=ps.hk,c=W2(PC[k]),lf=Math.random()<.6;pt(c[0]+(Math.random()-.5)*PATCH[k].r*1.2,c[1]+(Math.random()-.5)*PATCH[k].r*.9,(Math.random()-.5)*26,-22-Math.random()*34,1.1,lf?'130,190,70':'176,156,108',lf?2+(Math.random()*2|0):3)}}}
/* estado de un manchón para mjc13.js: fuego, ceniza, rebrote y aviso de emboscada */
function gs(k){const t=sn(),s=patchSt(k,t);let cue=0;
 if(A.on&&A.b==='rap'&&!A.done){const tr=A.tr,h=tr&&tr.hid;if(h&&h.k===k){const u=t-tr.s0,fl=flushU(tr);if(u>=h.a&&u<h.b&&!(fl>=0&&u>=fl))cue=cl((u-h.a)/800,0,1)*(.85+.15*Math.sin(performance.now()/90))}}
 s.cue=cue;return s}
function bossInfo(){const B0=A.boss;if(!(A.on&&A.b==='rap'&&B0&&B0.x>-9000))return null;const ps=A.tr&&A.tr.ps;return{x:B0.x,y:B0.y,hid:!!(ps&&ps.st==='hid')}}
PFS.rap={id:'rap',nm:'Velociraptor',v:'mjVel',sc:1.2,spr:'mj5',st1:ST1,st2:ST2,NM,ills:0,nobp:1,cls:'rap',bc:['188,166,116','120,180,70'],hpal:'blood',
 pick:mvOf,begin,snd:rsnd,eval:evalR,draw:drawR,draw1,frame,hint:hints,ground,
 msg:m=>addBurn(m.k,m.at,m.ts,m.by),
 init:m=>{cls(1);for(const x of(m.burn||[]))addBurn(x[0],x[1],x[1]-2000,null)},
 reset:reset0,leave:()=>cls(0),
 hudNm:'🦖 Velociraptor',ph2:'FASE 2 · INSTINTO ALFA',dead:'Derrotado',won:'🏆 ¡Velociraptor derrotado!',lost:'💀 El Velociraptor ha ganado',exitBtn:'🚪 Salir del bosque',
 wake:'⚔️ ¡El Velociraptor despierta!',back:'⚔️ Vuelves a la pelea contra el Velociraptor',p2txt:'🐺 ¡INSTINTO ALFA! El Velociraptor se enfurece',
 turn:'🌿 ¡Es tu turno! Confirma para entrar al Claro del Depredador',vs:'el Velociraptor',wait:'El Velociraptor te espera en el Claro del Depredador, en el corazón del Bosque de los Colmillos.',
 noHall:'⚠️ No se pudo preparar el Claro. Entra al Bosque de los Colmillos y sigue la senda hasta el Claro.',
 R:{wonH:'🏆 ¡Velociraptor derrotado!',wonP:'El bosque vuelve a respirar: el eco de sus pasos se apaga entre la hierba.',none:'El Velociraptor no dejó ningún botín esta vez.',lostH:'💀 El Velociraptor ha ganado',out:'Saldrás del bosque en'}};
window.MJRF={gs,boss:bossInfo,plan,mvOf,anc,addBurn,patchSt,availP,lane,landOf,calcLane,TPOS,FP,RS,SND,rsnd,dbg:{PL,seq1,HT}};
})();
