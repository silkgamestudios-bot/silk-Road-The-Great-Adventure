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
 if(m.t=='wi'){let sg=0,n=m.n|0;if(m.sg!=null&&n>0&&E.length>=n){for(let i=0;i<n;i++){const e=E[i];sg=(!e||SKIP(e)||e.dg)?(Math.imul(sg,31)+3)|0:(Math.imul(sg,31)+Math.round(e.hx)*7+Math.round(e.hy)*13+(e.ty|0)*17+1)|0}}
  if(m.sg!=null&&(E.length<n||sg!==(m.sg|0))){on=0;WBAD=1;console.log('mundo: versión distinta',n,E.length,sg,m.sg);/* v268: aviso quitado (se juega en modo local sin molestar) */}
  else{on=1;WBAD=0;freeze(n);toast('🌐 Mundo online conectado',2200)}}
 else if(m.t=='wx'){on=0;dynClr()}
 else if(m.t=='wp'){P.x=m.x;P.y=m.y}
 else if(m.t=='wd'){if(on&&P.hp>0&&!modal){P.hp-=mountAbs(m.d*(P.sh>0?.3:1)*(P.cls==1?knRes():1));if(P.hp<=0)die()}}
 else if(m.t=='ws')snap(m);
 else if(m.t=='wpv'){PV.on=m.on?1:0;if(!PV.on)PV.t=null;if(m.e)toast(m.e,3800);pvSync();pvBtn()}
 else if(m.t=='wpd'){PVHIT=Date.now();if(P.hp>0&&!modal){const d=mountAbs(m.d*(P.sh>0?.3:1)*(P.cls==1?knRes():1));P.hp-=d;if(FT.length<60)FT.push({x:P.x,y:P.y-26,t:.9,d:0,o:0,k:'dm',s:'-'+Math.round(d),c:'#ff6a6a'});if(P.hp<=0)die()}}
 else if(m.t=='wph'){const o=OT[m.u];if(FT.length<60)FT.push({x:o?o.rx:P.x,y:(o?o.ry:P.y)-30,t:.9,d:0,o:0,k:'dm',s:String(m.d),c:'#ffb36a'})}
 else if(m.t=='wpk'){pvKillMsg(m)}
 else if(m.t=='wbt'){try{btyNotify(m.b)}catch(e){}}
 else if(m.t=='wsv'){try{window.SRSV&&SRSV(m)}catch(e){}}
 else if(m.t=='wtp'||m.t=='wts'||m.t=='wtd'){try{window.SRTZ&&SRTZ.msg(m)}catch(e){}}
 else if(m.t=='wubd'){try{window.SRUBD&&SRUBD(m)}catch(e){}}
 else if(m.t=='wk')reward(m)};
/* ===== PvP abierto (v148) ===== */
const PV={on:0,t:null,sent:0},G0={pvg:1,u:'',nm:'',x:0,y:0,hp:1,mx:1,dead:1e9,ty:0,stun:0,rw:0,nv:1,sp:0,mov:0,hx:0,hy:0};PVG.push(G0);
function pvKillMsg(m){PV.t=null;pvSync();if(m.me){toast('☠️ '+m.by+' te venció en PvP. Sin penalización. Ve al 🏹 Gremio de Cazadores y pon una recompensa por su cabeza.',8000);vib([80,40,120]);return}
 const r=m.r||{};let t='⚔️ ¡Venciste a '+m.v+'!';if(r.n)t+=' 🎯 Recompensa cobrada:'+(r.g?' +'+fmt(r.g)+' 🪙':'')+(r.m?' +'+r.m+' 💎':'')+((r.its||[]).length?' 🎁 '+r.its.join(', '):'');toast(t,7000);vib([60,40,60,40,100])}
function pvSync(){const o=PV.t&&OT[PV.t];if(PV.on&&o&&o.pvp&&o.hp>0){G0.u=PV.t;G0.nm=o.nm;G0.x=o.rx;G0.y=o.ry;G0.hx=o.rx;G0.hy=o.ry;G0.hp=o.hp;G0.mx=Math.max(1,o.mhp);G0.dead=0}else{G0.dead=1e9;if(PV.t&&!o)PV.t=null}pvBar()}
function pvStrike(e,dm){if(!PV.on||e.u!==PV.t)return;const n=Date.now();if(n-PV.sent<110)return;PV.sent=n;N.send({t:'wph',u:e.u,w:Math.round(Math.min(4,Math.max(.3,dm/Math.max(1,dmg())))*100)/100})}
function pvBtn(){const c=document.getElementById('rc')||document.getElementById('ctx');if(!c)return;let b=document.getElementById('pvb');if(!b){b=document.createElement('button');b.id='pvb';b.hidden=true;b.setAttribute('aria-label','Activar o desactivar PvP');b.addEventListener('click',()=>{if(!on){toast('El PvP necesita el mundo online conectado',2500);return}N.send({t:'wpv',on:PV.on?0:1})});c.appendChild(b)}
 const show=on&&pa('pv')&&!(typeof DG!=='undefined'&&DG.f)&&!modal;b.hidden=!show;if(show){b.textContent='⚔️ '+(PV.on?'ON':'OFF');b.style.setProperty('border-color',PV.on?'#ff4a3a':'#ffd666','important')}}
function pvBar(){let el=document.getElementById('pvt');if(!el){el=document.createElement('div');el.id='pvt';el.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:46px;z-index:31;font:700 12px Georgia,serif;color:#fff;background:#3a0d0dcc;border:2px solid #ff4a3a;border-radius:12px;padding:4px 10px;display:none;min-width:150px;text-align:center';el.addEventListener('click',()=>{PV.t=null;pvSync()});document.body.appendChild(el)}
 if(PV.on&&PV.t&&G0.dead<=0){el.style.display='block';const p=Math.max(0,Math.min(1,G0.hp/G0.mx));el.innerHTML='🎯 '+(String(G0.nm).replace(/[<>&]/g,''))+' <small>(toca para soltar)</small><div style="height:6px;background:#0008;border-radius:3px;margin-top:3px"><i style="display:block;height:6px;width:'+Math.round(p*100)+'%;background:#ff5a4a;border-radius:3px"></i></div>'}else el.style.display='none'}
setInterval(()=>{if(PV.t&&G0.dead<=0){const o=OT[PV.t];if(o){G0.x=o.rx;G0.y=o.ry}}pvBtn()},120);
window.SRPVP={click:(u,o)=>{if(!PV.on||!o.pvp)return 0;if(PV.t===u){PV.t=null;pvSync();toast('🎯 Objetivo liberado',1500);return 1}PV.t=u;pvSync();toast('🎯 Objetivo fijado: '+o.nm+' · ataca y tus golpes y hechizos van hacia él',3000);return 1},on:()=>PV.on};
function snap(m){const seen={};if(m.ud){try{window.SRUD&&SRUD(m.ud)}catch(e){}}
 for(const a of m.pl){const o=OT[a[0]]||(OT[a[0]]={rx:a[4],ry:a[5]});Object.assign(o,{nm:a[1],c:a[2],lv:a[3],x:a[4],y:a[5],hp:a[6],mhp:a[7],pt:a[8],gt:a[9]||'',bs:a[10]||'',pvp:a[11]|0,wn:a[12]|0});seen[a[0]]=1}
 for(const u in OT)if(!seen[u])delete OT[u];
 if(m.dx)for(const id of m.dx)dynRm(id);if(m.dd&&!(typeof DG!=='undefined'&&DG.f))for(const d of m.dd)dynMk(d);
 LS=Date.now();if(typeof DG!=='undefined'&&DG.f)m.mb=[];for(const b of m.mb){const e=SM[b[0]];if(!e)continue;if(!e.sync){e.sync=1;e.sid=b[0];e.stun=1e9;e.gs=0}e.lt=LS;if(b[4]){e.hp=0;e.dead=1e9;continue}
  if(e.dead>0)e.dead=0;e.stun=1e9;const dx=b[1]-e.x,dy=b[2]-e.y;e.mov=Math.abs(dx)+Math.abs(dy)>.5?1:0;
  if(e.mov)e.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');if(Math.abs(dx)+Math.abs(dy)>220){e.x=b[1];e.y=b[2]}else{e.gx=b[1];e.gy=b[2];e.gs=1}e.hp=b[3]}
 if(m.hv)for(const h of m.hv){if(FT.length>=60)break;FT.push({x:h[3]+Math.random()*14-7,y:h[4]-14,t:.9,d:0,o:0,k:'dm',s:String(h[1]),c:'#8fd8ff'})}
 if(m.at){const n=Date.now();for(const a of m.at)OFX.push({u:a[0],k:a[1],a:a[2],x:a[3],y:a[4],t:n,ty:a[6]||'',r:a[7]|0});if(OFX.length>80)OFX.splice(0,OFX.length-80)}pvSync()}
function reward(m){const t=[],g=Math.round(m.g*goldM()*(1+eqT().gd/100));
 if(g>0){P.gold+=g;t.push('+'+g+' 🪙')}if(m.x>0){gainXp(m.x);t.push('+'+m.x+' XP')}
 if(m.own){try{P.st.all++;P.st.k[m.ty]=(P.st.k[m.ty]||0)+1;pqEvt('kill',m.ty);hzEvt(m.ty)}catch(e){}}
 if(m.pot&&typeof P.pot=='number')P.pot=Math.min(99,P.pot+1);
 if(m.it){const it=cleanIt(m.it);if(P.bag.length<24)P.bag.push(it);else LT.push({x:P.x,y:P.y,gd:0,it,l:300});t.push('🎁 '+it.n)}
 if(t.length&&FT.length<60)FT.push({x:P.x,y:P.y-30,t:1.6,d:0,o:0,k:'dm',s:t.join(' '),c:'#ffd666'});
 try{chk();save()}catch(e){}}
const _h=hitE;hitE=function(e,dm){if(!e.pvg&&(cityAt(P)||cityAt(e)||(typeof uwSafe=='function'&&(uwSafe(P)||uwSafe(e))))){if(!window.__szT||Date.now()-window.__szT>2500){window.__szT=Date.now();toast('🛡️ Zona segura: no se puede atacar dentro del pueblo',2200)}return}if(e.pvg){pvStrike(e,dm);return}if(!on||!e.sync||SM[e.sid]!==e)return _h(e,dm);if(e.dead>0)return;dm=Math.max(1,Math.round(dm));WQ.push([e.sid,dm]);e.hp=Math.max(1,e.hp-dm);
 if(FT.length<60)FT.push({x:e.x+Math.random()*14-7,y:e.y-14,t:.9,d:0,o:0,k:'dm',s:String(dm),c:'#ffe9a8'})};
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
function others(cx,cy,now){if(!on)return;const VHn=typeof VH=='number'?VH:900;drawOFX(cx,cy);
 for(const u in OT){const o=OT[u];const px=o.rx,py=o.ry;o.rx+=(o.x-o.rx)*.35;o.ry+=(o.y-o.ry)*.35;const mx=o.rx-px,my=o.ry-py;if(Math.abs(mx)+Math.abs(my)>.15){o.mv=1;o.dr=Math.abs(mx)>Math.abs(my)?(mx>0?'right':'left'):(my>0?'down':'up')}else o.mv=0;const x=o.rx-cx,y=o.ry-cy;if(typeof PP!='undefined'&&PP.o&&PP.o[u]&&Date.now()-(PP.o[u].t||0)<30000&&!!PP.o[u].dg==!!DG.f)continue; // la party ya se dibuja en ppDraw: evita verlos dos veces
if(x<-40||x>VW+40||y<-60||y>VHn+40)continue;
  g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x,y+10,9,3,0,0,7);g.fill();if(!(o.bs&&typeof spBSA=='function'&&spBSA(o.bs,x,y,2,{fl:o.dr=='left'?1:o.dr=='right'?0:(o.fl|0),mov:o.mv,dir:o.dr||'down',t:performance.now()/1000+(o.ph||(o.ph=Math.random()*9)),run:0,atk:-9,hit:0})))sp('c'+o.c+'-'+(o.dr||'down')+'-'+(o.mv?[1,2,1,3][Math.floor(Date.now()/130)%4]:1),x,y,2);
  g.font='bold 11px Georgia,serif';g.textAlign='center';const lb=(o.gt?'['+o.gt+'] ':'')+o.nm+' · Nv '+o.lv;g.fillStyle='#000';g.fillText(lb,x+1,y-23);g.fillStyle=o.pt?'#7fffa0':'#fff';g.fillText(lb,x,y-24);
  g.fillStyle='#0008';g.fillRect(x-12,y-19,24,3);g.fillStyle=o.pvp?'#ff5a4a':'#4cd964';g.fillRect(x-12,y-19,24*Math.max(0,Math.min(1,o.hp/Math.max(1,o.mhp))),3);
  if(o.pvp){g.font='11px serif';g.fillText('⚔️',x+22,y-24)}if(o.wn){g.font='bold 11px Georgia,serif';g.fillStyle='#000';g.fillText('🎯 SE BUSCA',x+1,y-37);g.fillStyle='#ff6a4a';g.fillText('🎯 SE BUSCA',x,y-38)}
  if(PV.t===u&&PV.on){g.strokeStyle='#ff4a3a';g.lineWidth=2;g.beginPath();g.ellipse(x,y+10,18+2*Math.sin(now/120),7,0,0,7);g.stroke()}}}
setInterval(()=>{if(!ready()||!N.up())return;
 const inUW=typeof UW!=='undefined'&&UW.on;   /* v264: el Submundo (portón de 8 placas y Balor) funciona aunque el mundo compartido esté en modo local */
 if(!on&&(inUW||uwJ)){if(inUW){if(!uwJ){uwJ=1;N.send({t:'wj',nm:P.name,c:P.cls|0,lv:P.lv,x:Math.round(P.x),y:Math.round(P.y)})}
   N.send({t:'wm',x:Math.round(P.x),y:Math.round(P.y),hp:Math.round(P.hp),mhp:Math.round(P.mhp),lv:P.lv,tp:0,dg:1,uw:1,pw:0,fl:0})}
  else{uwJ=0;N.send({t:'wm',x:Math.round(P.x),y:Math.round(P.y),hp:Math.round(P.hp),mhp:Math.round(P.mhp),lv:P.lv,tp:1,dg:0,uw:0,pw:0,fl:0})}return}
 if(!on){if(WBAD)return;if(Date.now()-ft>2000){ft=Date.now();N.send({t:'wj',nm:P.name,c:P.cls|0,lv:P.lv,x:Math.round(P.x),y:Math.round(P.y)})}return}
 const tp=Math.hypot(P.x-lx,P.y-ly)>300;lx=P.x;ly=P.y;
 N.send({t:'wm',x:Math.round(P.x),y:Math.round(P.y),hp:Math.round(P.hp),mhp:Math.round(P.mhp),lv:P.lv,tp:tp?1:0,dg:(typeof DG!=='undefined'&&DG.f)?1:0,uw:(typeof UW!=='undefined'&&UW.on)?1:0,pw:PV.on?Math.round(dmg()):0,fl:(typeof FLY!=='undefined'&&FLY.on&&gmIsM())?1:0});
 if(typeof DG!=='undefined'&&DG.f)WQ.length=0;
 if(WQ.length)N.send({t:'wh',h:WQ.splice(0,12)})},100);
setInterval(()=>{if(!on||!LS)return;const n=Date.now();if(n-LS>1500)return;   // vigilante: si el servidor no reporta un enemigo cercano en 4 s, vuelve a modo local (nunca queda inmortal)
 for(const e of NR){if(!e.sync||n-(e.lt||0)<4000||Math.abs(e.x-P.x)>800||Math.abs(e.y-P.y)>800)continue;if(e.dyn){dynRm(e.sid);continue}e.sync=0;e.stun=0;e.gs=0;e.sid=-1;if(!(e.hp>0))e.hp=Math.max(1,Math.round(e.mx*.05))}},1000);
setInterval(()=>{if(!on)return;for(const e of E){if(!e.gs)continue;const dx=e.gx-e.x,dy=e.gy-e.y;if(Math.abs(dx)+Math.abs(dy)<1.5){e.x=e.gx;e.y=e.gy;e.gs=0}else{e.x+=dx*.4;e.y+=dy*.4}}},33);
const _sk=skill;skill=function(i){const s0=P.sc?+P.sc[i]||0:0;_sk(i);if(on&&P.sc&&(+P.sc[i]||0)>s0+.2){const sp=(SP[P.cls|0]||[])[i]||{};const fd={left:Math.PI,right:0,up:-Math.PI/2,down:Math.PI/2}[P.dir||'down'];let b=null,bd=560;for(const e of E){if(!e.sync||e.dead>0)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;b=e}}N.send({t:'wa',k:P.cls|0,a:b?Math.atan2(b.y-P.y,b.x-P.x):fd,ty:String(sp.t||'hit'),r:Math.round((sp.r||90))})}};
const _atk=atk;atk=function(auto){const c0=P.cd;_atk(auto);if(on&&!(c0>0)&&P.cd>0){let b=null,bd=560;for(const e of E){if(!e.sync||e.dead>0)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;b=e}}const fd={left:Math.PI,right:0,up:-Math.PI/2,down:Math.PI/2}[P.dir||'down'];N.send({t:'wa',k:P.cls|0,a:b?Math.atan2(b.y-P.y,b.x-P.x):fd})}};
window.SRWORLD={on:()=>on,others:()=>OT,ofx:()=>OFX.length,fx:drawOFX};
})();
