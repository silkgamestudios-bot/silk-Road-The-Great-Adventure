/* Mundo online (cliente): posición, enemigos compartidos y botín vienen del servidor.
   Si el servidor no tiene mundo (falta world.json), el juego sigue en modo local sin cambios. */
(function(){
const N=window.SRNET;if(!N)return;
let uwJ=0,WBAD=0,on=0,OT={},WQ=[],lx=0,ly=0,ft=0,OFX=[],SM=[],LS=0;   // SM: id del servidor → enemigo (solo los 'base'); LS: último snapshot
const ready=()=>P&&P.chosen&&P.name;
const SKIP=e=>e.boss||e.guard||e.wild||e.tmp||e.alpha||e.vec;
/* Solo se congelan los enemigos BASE (índice < n, los que el servidor conoce). Los creados durante la partida
   (cuevas/torre, súbditos, estatua zodiacal, dragón, depredador…) se quedan en modo local: si los congelaba al
   reconectar, el servidor no los conocía y quedaban eternamente al 1% de vida sin poder morir. */
function dynClr(){for(let i=E.length-1;i>=0;i--)if(E[i].dyn)E.splice(i,1);NR=NR.filter(e=>!e.dyn)}
function dynMk(d){if(SM[d[0]])return;const ty=d[3]|0,e={dyn:1,sync:1,sid:d[0],stun:1e9,lt:Date.now(),ty,hx:d[6],hy:d[7],x:d[9]!=null?d[9]:d[6],y:d[10]!=null?d[10]:d[7],t:0,dead:0};e.mx=e.hp=mobHP(ty);e.sp=(66+ty*2.5)*.75;try{applyVar(e,d[1])}catch(x){}
 e.mx=d[4];e.hp=d[8];if(d[2])e.nm=d[2];if(d[5])e.wsc=d[5];if(d[1]=='wwolf')e.ww=1;SM[d[0]]=e;E.push(e);NR.push(e)}
function dynRm(id){const e=SM[id];if(!e)return;const i=E.indexOf(e);if(i>=0)E.splice(i,1);NR=NR.filter(q=>q!==e);SM[id]=null}
window.SRWON=()=>on;
function freeze(n){const t=Date.now();dynClr();SM=[];E.forEach((e,i)=>{if(i>=n||SKIP(e))return;e.sid=i;e.sync=1;e.stun=1e9;e.lt=t;SM[i]=e})}   // la IA local se apaga: manda el servidor
N.onopen=()=>{uwJ=0;on=0;WBAD=0;PV.on=0;PV.t=null};
N.onmsg=m=>{
 if(m.t=='wsx'){try{xRecv(m)}catch(e){}return}
 if(m.t=='wss'){try{xState(m)}catch(e){}return}
 if(m.t=='wsp'){try{xPos(m)}catch(e){}return}
 if(m.t=='wi'){let sg=0,n=m.n|0;if(m.sg!=null&&n>0&&E.length>=n){for(let i=0;i<n;i++){const e=E[i];sg=(!e||SKIP(e)||e.dg)?(Math.imul(sg,31)+3)|0:(Math.imul(sg,31)+Math.round(e.hx)*7+Math.round(e.hy)*13+(e.ty|0)*17+1)|0}}
  if(m.sg!=null&&(E.length<n||sg!==(m.sg|0))){on=0;WBAD=1;console.log('mundo: versión distinta',n,E.length,sg,m.sg);/* v268: aviso quitado (se juega en modo local sin molestar) */}
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
 else if(m.t=='wk')reward(m)};
/* ===== PvP abierto (v148) ===== */
const PV={on:0,t:null,sent:0},G0={pvg:1,u:'',nm:'',x:0,y:0,hp:1,mx:1,dead:1e9,ty:0,stun:0,rw:0,nv:1,sp:0,mov:0,hx:0,hy:0};PVG.push(G0);
/* v287: si alguien te ataca en PvP, el objetivo pasa al enemigo PvP más cercano (o al atacante si está igual de cerca) */
function pvNear(by){if(!PV.on||AR.on)return;let b=null,bd=1e9,ad=1e9;for(const u in OT){const o=OT[u];if(!o.pvp||!(o.hp>0))continue;const d=Math.hypot(o.rx-P.x,o.ry-P.y);if(u===by)ad=d;if(d<bd){bd=d;b=u}}if(by&&OT[by]&&OT[by].pvp&&ad<=bd*1.35+30)b=by;if(!b||b===PV.t)return;if(Math.hypot(OT[b].rx-P.x,OT[b].ry-P.y)>700)return;PV.t=b;pvSync();toast('🎯 Te atacan: objetivo → '+OT[b].nm,1800)}
function pvKillMsg(m){PV.t=null;pvSync();if(m.me){toast('☠️ '+m.by+' te venció en PvP. Sin penalización. Ve al 🏹 Gremio de Cazadores y pon una recompensa por su cabeza.',8000);vib([80,40,120]);return}
 const r=m.r||{};let t='⚔️ ¡Venciste a '+m.v+'!';if(r.n)t+=' 🎯 Recompensa cobrada:'+(r.g?' +'+fmt(r.g)+' 🪙':'')+(r.m?' +'+r.m+' 💎':'')+((r.its||[]).length?' 🎁 '+r.its.join(', '):'');toast(t,7000);vib([60,40,60,40,100])}
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
 LS=Date.now();if(typeof DG!=='undefined'&&DG.f)m.mb=[];for(const b of m.mb){const e=SM[b[0]];if(!e)continue;if(!e.sync){e.sync=1;e.sid=b[0];e.stun=1e9;e.gs=0}e.lt=LS;if(b[4]){e.hp=0;e.dead=1e9;continue}
  if(e.dead>0)e.dead=0;e.stun=1e9;const dx=b[1]-e.x,dy=b[2]-e.y;e.mov=Math.abs(dx)+Math.abs(dy)>.5?1:0;
  if(e.mov)e.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');if(Math.abs(dx)+Math.abs(dy)>220){e.x=b[1];e.y=b[2]}else{e.gx=b[1];e.gy=b[2];e.gs=1}e.hp=b[3]}
 if(m.hv)for(const h of m.hv){if(FT.length>=60)break;FT.push({x:h[3]+Math.random()*14-7,y:h[4]-14,t:.9,d:0,o:0,k:'dm',s:String(h[1]),c:'#8fd8ff'})}
 if(m.at){const n=Date.now();for(const a of m.at)OFX.push({u:a[0],k:a[1],a:a[2],x:a[3],y:a[4],t:n,ty:a[6]||'',r:a[7]|0});if(OFX.length>80)OFX.splice(0,OFX.length-80)}pvSync()}
function reward(m){const t=[],g=Math.round(m.g*goldM()*(1+eqT().gd/100)),auto=typeof pa==='function'&&pa('lt');
 /* El VIP Loot automático es el único que recoge sin pulsar 🎁 Tomar. Sin VIP, oro y equipo común quedan en el suelo. La recogida manual usa grab() y lootAdd(), que manda equipo común a P.lb. */
 let ground=null;
 if(g>0){if(auto&&LF&&LF.gd){P.gold+=g;t.push('+'+g+' 🪙')}else{ground={x:P.x+Math.random()*18-9,y:P.y+Math.random()*18-9,gd:g,it:null,l:120};t.push('🪙 '+g+' en el suelo')}}
 if(m.x>0){gainXp(m.x);t.push('+'+m.x+' XP')}
 if(m.own){try{P.st.all++;P.st.k[m.ty]=(P.st.k[m.ty]||0)+1;pqEvt('kill',m.ty);hzEvt(m.ty)}catch(e){}}
 if(m.pot&&typeof P.pot=='number')P.pot=Math.min(800,P.pot+1);
 if(m.it){const it=cleanIt(m.it);it.junk=1;if(auto&&LF&&LF.it&&P.lb.length<LCAP()){P.lb.push(it);t.push('🧺 '+it.n)}else{if(!ground)ground={x:P.x+Math.random()*18-9,y:P.y+Math.random()*18-9,gd:0,it:null,l:120};ground.it=it;t.push('🎁 '+it.n+' en el suelo')}}
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
const xId=e=>e.dg?(e.xid!=null&&XM[e.xid]===e?e.xid:null):e.boss&&e.bi!=null?'b'+e.bi:(e.guard&&!e.horde&&e.li!=null)?'g'+e.li:null;
function xFind(id){if(typeof id=='number')return XM[id]||null;const t=String(id),n=+t.slice(1);for(const e of E){if(t[0]=='b'&&e.boss&&e.bi===n)return e;if(t[0]=='g'&&e.guard&&!e.horde&&e.li===n)return e}return null}
function xRecv(m){const sc=xScope();if(!sc||sc!==m.k)return;for(const a of (m.h||[])){const e=xFind(a[0]);let dm=Math.max(1,Math.min(1e9,+a[1]|0));if(!e||e.dead>0||!(e.hp>0)||e.pvg)continue;
  const d=Math.hypot(e.x-P.x,e.y-P.y);window.__xrx=1;try{if(d<900)hitE(e,dm);else if(e.boss||e.guard)e.hp=Math.max(1,e.hp-dm);else{e.hp-=dm;if(e.hp<=0){e.hp=0;e.dead=e.dg?(DG.id=='to'?20:80):20}}}finally{window.__xrx=0}if((e.hp<=0||e.dead>0)&&XQ.length<24)XQ.push([a[0],1,1])}}
{const _hx=hitE;hitE=function(e,dm){let id=null;try{if(!window.__xrx&&(on||uwJ)&&dm>0&&!e.pvg&&!e.tmp&&(e.dg||(typeof PP!='undefined'&&PP.pid)))id=xId(e)}catch(x){}const r=_hx.apply(this,arguments);try{if(id!=null&&XQ.length<24)XQ.push([id,Math.round(dm),e.hp<=0?1:0])}catch(x){}return r}}
/* quien entra después a un piso recibe el estado actual: mobs ya muertos y daño acumulado */
let XL='',XA=new Set(),XAk='';
function xState(m){const sc=xScope();if(!sc||sc!==m.k)return;if(XAk!==sc){XAk=sc;XA=new Set()}
 for(const a of (m.s||[])){const id=a[0];if(XA.has(id))continue;XA.add(id);const e=xFind(id);if(!e||e.dead>0)continue;
  if(a[2]>=0){e.hp=0;e.dead=Math.max(4,(DG.id=='to'?20:80)-a[2]/1000)}else{const dm=+a[1]||0;if(dm>0&&e.hp>1)e.hp=Math.max(1,e.hp-dm)}}}
/* posiciones: cada jugador manda dónde están los mobs cercanos a él; los demás con uid mayor los copian (así todos ven al mismo mob en el mismo sitio) */
let XPT=0;
function xPos(m){const sc=xScope();if(!sc||sc!==m.k||typeof UID=='undefined'||!(String(m.f)<String(UID)))return;
 for(const a of (m.p||[])){const e=XM[a[0]];if(!e||e.dead>0||!(e.hp>0)||e.pvg)continue;if(Math.hypot(e.x-P.x,e.y-P.y)<110)continue;
  if(Math.hypot(a[1]-e.x,a[2]-e.y)>320){e.x=a[1];e.y=a[2];e.gs=0}else if(Math.hypot(a[1]-e.x,a[2]-e.y)>14){e.gx=a[1];e.gy=a[2];e.gs=1}}}
function xSendPos(){const n=Date.now();if(n-XPT<220)return;XPT=n;const k=xScope();if(!k||k==='w')return;const L=[];for(const e of XM){if(!e||e.dead>0||!(e.hp>0))continue;if(Math.abs(e.x-P.x)>600||Math.abs(e.y-P.y)>600)continue;L.push([e.xid,Math.round(e.x),Math.round(e.y)]);if(L.length>=40)break}if(L.length)N.send({t:'wsp',k,p:L})}
function xTick(){try{xSendPos()}catch(e){}const k=xScope();if(k!==XL){XL=k;if(k&&k!=='w'){setTimeout(()=>{if(xScope()===k)N.send({t:'wsq',k})},700);setTimeout(()=>{if(xScope()===k)N.send({t:'wsq',k})},3500)}}}
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
 const inUW=typeof UW!=='undefined'&&UW.on,inAR=AR.on,inDG=typeof DG!=='undefined'&&!!DG.f&&DG.id!='co'&&!inUW&&!inAR;   /* v264: el Submundo (portón de 8 placas y Balor) funciona aunque el mundo compartido esté en modo local */
 if(!on&&(inUW||inAR||inDG||uwJ)){if(inUW||inAR||inDG){if(!uwJ){uwJ=1;N.send({t:'wj',nm:P.name,c:P.cls|0,lv:P.lv,x:Math.round(P.x),y:Math.round(P.y)})}
   /* v330: aunque el mundo de superficie esté en modo local (versión distinta), las cuevas/mazmorras/mina siguen sincronizadas entre jugadores */
   N.send({t:'wm',x:Math.round(P.x),y:Math.round(P.y),hp:Math.round(P.hp),mhp:Math.round(P.mhp),lv:P.lv,tp:0,dg:1,uw:inUW?1:0,pw:0,fl:0,sk:inDG?xScope():'',mo:typeof myMo=='function'?myMo():''});
   if(inDG){try{xTick()}catch(e){}if(XQ.length){const k=xScope();if(k&&k!=='w')N.send({t:'wsx',k,h:XQ.splice(0,12)});else XQ.length=0}}}
  else{uwJ=0;N.send({t:'wm',x:Math.round(P.x),y:Math.round(P.y),hp:Math.round(P.hp),mhp:Math.round(P.mhp),lv:P.lv,tp:1,dg:0,uw:0,pw:0,fl:0})}return}
 if(!on){if(WBAD)return;if(Date.now()-ft>2000){ft=Date.now();N.send({t:'wj',nm:P.name,c:P.cls|0,lv:P.lv,x:Math.round(P.x),y:Math.round(P.y)})}return}
 const tp=Math.hypot(P.x-lx,P.y-ly)>300;lx=P.x;ly=P.y;
 N.send({t:'wm',x:Math.round(P.x),y:Math.round(P.y),hp:Math.round(P.hp),mhp:Math.round(P.mhp),lv:P.lv,tp:tp?1:0,dg:(typeof DG!=='undefined'&&DG.f)?1:0,uw:(typeof UW!=='undefined'&&UW.on)?1:0,pw:PV.on?Math.round(dmg()):0,fl:(typeof FLY!=='undefined'&&FLY.on&&gmIsM())?1:0,sk:xScope(),mo:typeof myMo=='function'?myMo():''});
 try{xTick()}catch(e){}
 if(XQ.length){const k=xScope();if(k&&(k!=='w'||(typeof PP!='undefined'&&PP.pid)))N.send({t:'wsx',k,h:XQ.splice(0,12)});else XQ.length=0}
 if(typeof DG!=='undefined'&&DG.f)WQ.length=0;
 if(WQ.length)N.send({t:'wh',h:WQ.splice(0,12)})},100);
setInterval(()=>{if(!on||!LS)return;const n=Date.now();if(n-LS>1500)return;   // vigilante: si el servidor no reporta un enemigo cercano en 4 s, vuelve a modo local (nunca queda inmortal)
 for(const e of NR){if(!e.sync||n-(e.lt||0)<4000||Math.abs(e.x-P.x)>800||Math.abs(e.y-P.y)>800)continue;if(e.dyn){dynRm(e.sid);continue}e.sync=0;e.stun=0;e.gs=0;e.sid=-1;if(!(e.hp>0))e.hp=Math.max(1,Math.round(e.mx*.05))}},1000);
setInterval(()=>{if(!on)return;for(const e of E){if(!e.gs)continue;const dx=e.gx-e.x,dy=e.gy-e.y;if(Math.abs(dx)+Math.abs(dy)<1.5){e.x=e.gx;e.y=e.gy;e.gs=0}else{e.x+=dx*.4;e.y+=dy*.4}}},33);
const _sk=skill;skill=function(i){const s0=P.sc?+P.sc[i]||0:0;_sk(i);if(on&&P.sc&&(+P.sc[i]||0)>s0+.2){const sp=(SP[P.cls|0]||[])[i]||{};const fd={left:Math.PI,right:0,up:-Math.PI/2,down:Math.PI/2}[P.dir||'down'];let b=null,bd=560;for(const e of E){if(!e.sync||e.dead>0)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;b=e}}N.send({t:'wa',k:P.cls|0,a:b?Math.atan2(b.y-P.y,b.x-P.x):fd,ty:String(sp.t||'hit'),r:Math.round((sp.r||90))})}};
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
 arMod('<h3 style="margin:0 0 6px;color:#ffd666;text-align:center">🏛️ Coliseo Silk Road</h3><div style="font-size:13px;line-height:1.45">• <b>⚔️ Combate</b>: todos contra todos, el último en pie gana el pozo (−5% se quema).<br>• <b>🦁 Torneo</b>: igual, pero hay <b>4 leones encadenados</b> en la arena y de un momento a otro se suelta uno, y luego otro. Toca un león para fijarlo como objetivo.<br>• Nivel, items y daño igualados: todos pegan igual, solo cuenta tu habilidad. No pierdes nada.<br>• <b>🎟️ Espectador</b>: miras el combate desde las gradas.<br>Tienes <b>'+gold.toLocaleString('es')+' 🪙</b></div><p style="margin:8px 0;text-align:center"><b>'+est+'</b></p>'
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
})();
