/* Mundo online (cliente): posición, enemigos compartidos y botín vienen del servidor.
   Si el servidor no tiene mundo (falta world.json), el juego sigue en modo local sin cambios. */
(function(){
const N=window.SRNET;if(!N)return;
let WBAD=0,on=0,OT={},WQ=[],lx=0,ly=0,ft=0,OFX=[],SM=[],LS=0;   // SM: id del servidor → enemigo (solo los 'base'); LS: último snapshot
const ready=()=>P&&P.chosen&&P.name;
const SKIP=e=>e.boss||e.guard||e.wild||e.tmp||e.alpha||e.vec;
/* Solo se congelan los enemigos BASE (índice < n, los que el servidor conoce). Los creados durante la partida
   (cuevas/torre, súbditos, estatua zodiacal, dragón, depredador…) se quedan en modo local: si los congelaba al
   reconectar, el servidor no los conocía y quedaban eternamente al 1% de vida sin poder morir. */
function freeze(n){const t=Date.now();SM=[];E.forEach((e,i)=>{if(i>=n||SKIP(e))return;e.sid=i;e.sync=1;e.stun=1e9;e.lt=t;SM[i]=e})}   // la IA local se apaga: manda el servidor
N.onopen=()=>{on=0;WBAD=0};
N.onmsg=m=>{
 if(m.t=='wi'){let sg=0,n=m.n|0;if(m.sg!=null&&n>0&&E.length>=n){for(let i=0;i<n;i++){const e=E[i];sg=(!e||SKIP(e)||e.dg)?(Math.imul(sg,31)+3)|0:(Math.imul(sg,31)+Math.round(e.hx)*7+Math.round(e.hy)*13+(e.ty|0)*17+1)|0}}
  if(m.sg!=null&&(E.length<n||sg!==(m.sg|0))){on=0;WBAD=1;console.log('mundo: versión distinta',n,E.length,sg,m.sg);toast('⚠️ El servidor tiene una versión vieja del mundo. Sube TODOS los archivos a GitHub y haz Manual Deploy; mientras tanto juegas en modo local.',9000)}
  else{on=1;WBAD=0;freeze(n);toast('🌐 Mundo online conectado',2200)}}
 else if(m.t=='wx'){on=0}
 else if(m.t=='wp'){P.x=m.x;P.y=m.y}
 else if(m.t=='wd'){if(on&&P.hp>0&&!modal){P.hp-=mountAbs(m.d*(P.sh>0?.3:1)*(P.cls==1?knRes():1));if(P.hp<=0)die()}}
 else if(m.t=='ws')snap(m);
 else if(m.t=='wk')reward(m)};
function snap(m){const seen={};
 for(const a of m.pl){const o=OT[a[0]]||(OT[a[0]]={rx:a[4],ry:a[5]});Object.assign(o,{nm:a[1],c:a[2],lv:a[3],x:a[4],y:a[5],hp:a[6],mhp:a[7],pt:a[8],gt:a[9]||'',bs:a[10]||''});seen[a[0]]=1}
 for(const u in OT)if(!seen[u])delete OT[u];
 LS=Date.now();for(const b of m.mb){const e=SM[b[0]];if(!e||!e.sync)continue;e.lt=LS;if(b[4]){e.hp=0;e.dead=1e9;continue}
  if(e.dead>0)e.dead=0;e.stun=1e9;const dx=b[1]-e.x,dy=b[2]-e.y;e.mov=Math.abs(dx)+Math.abs(dy)>.5?1:0;
  if(e.mov)e.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');if(Math.abs(dx)+Math.abs(dy)>220){e.x=b[1];e.y=b[2]}else{e.gx=b[1];e.gy=b[2];e.gs=1}e.hp=b[3]}
 if(m.hv)for(const h of m.hv){if(FT.length>=60)break;FT.push({x:h[3]+Math.random()*14-7,y:h[4]-14,t:.9,d:0,o:0,k:'dm',s:String(h[1]),c:'#8fd8ff'})}
 if(m.at){const n=Date.now();for(const a of m.at)OFX.push({u:a[0],k:a[1],a:a[2],x:a[3],y:a[4],t:n});if(OFX.length>60)OFX.splice(0,OFX.length-60)}}
function reward(m){const t=[],g=Math.round(m.g*goldM()*(1+eqT().gd/100));
 if(g>0){P.gold+=g;t.push('+'+g+' 🪙')}if(m.x>0){gainXp(m.x);t.push('+'+m.x+' XP')}
 if(m.own){try{P.st.all++;P.st.k[m.ty]=(P.st.k[m.ty]||0)+1;pqEvt('kill',m.ty);hzEvt(m.ty)}catch(e){}}
 if(m.pot&&typeof P.pot=='number')P.pot=Math.min(99,P.pot+1);
 if(m.it){const it=cleanIt(m.it);if(P.bag.length<24)P.bag.push(it);else LT.push({x:P.x,y:P.y,gd:0,it,l:300});t.push('🎁 '+it.n)}
 if(t.length&&FT.length<60)FT.push({x:P.x,y:P.y-30,t:1.6,d:0,o:0,k:'dm',s:t.join(' '),c:'#ffd666'});
 try{chk();save()}catch(e){}}
const _h=hitE;hitE=function(e,dm){if(!on||!e.sync||SM[e.sid]!==e)return _h(e,dm);if(e.dead>0)return;dm=Math.max(1,Math.round(dm));WQ.push([e.sid,dm]);e.hp=Math.max(1,e.hp-dm);
 if(FT.length<60)FT.push({x:e.x+Math.random()*14-7,y:e.y-14,t:.9,d:0,o:0,k:'dm',s:String(dm),c:'#ffe9a8'})};
if(typeof drawTemple=='function'){const _t=drawTemple;drawTemple=function(cx,cy,now){_t(cx,cy,now);others(cx,cy,now)}}
function drawOFX(cx,cy){const n=Date.now();OFX=OFX.filter(f=>n-f.t<520);for(const f of OFX){const q=OT[f.u],bx=q?q.rx:f.x,by=q?q.ry:f.y,k=(n-f.t)/520,x=bx-cx,y=by-cy;if(x<-300||x>VW+300||y<-300||y>VH+300)continue;const c=f.k,ca=Math.cos(f.a),sa=Math.sin(f.a);g.save();g.globalAlpha=1-k*.8;
  if(c==3){const d=40+420*Math.min(1,k*1.6);g.strokeStyle='#e8d9a8';g.lineWidth=2;g.beginPath();g.moveTo(x+ca*(d-26),y+sa*(d-26));g.lineTo(x+ca*d,y+sa*d);g.stroke()}
  else if(c==2||c==6){const d=30+300*Math.min(1,k*1.5);g.fillStyle=c==2?'#b07dff':'#7fe06a';g.beginPath();g.arc(x+ca*d,y+sa*d,6+3*Math.sin(k*20),0,7);g.fill();g.globalAlpha*=.4;g.beginPath();g.arc(x+ca*(d-14),y+sa*(d-14),4,0,7);g.fill()}
  else if(c==4){g.strokeStyle='#7fffb0';g.lineWidth=3;g.beginPath();g.arc(x,y,12+50*k,0,7);g.stroke();const d=30+250*Math.min(1,k*1.5);g.fillStyle='#bfffd8';g.beginPath();g.arc(x+ca*d,y+sa*d,5,0,7);g.fill()}
  else{g.strokeStyle=c==1?'#ffd9a0':'#fff';g.lineWidth=5-3*k;g.beginPath();g.arc(x,y,34+6*k,f.a-1.1+k*.5,f.a+1.1+k*.5);g.stroke();g.strokeStyle='#ffffff88';g.lineWidth=2;g.beginPath();g.arc(x,y,28,f.a-.9+k*.5,f.a+.9+k*.5);g.stroke()}
  g.restore()}}
function others(cx,cy,now){if(!on)return;const VHn=typeof VH=='number'?VH:900;drawOFX(cx,cy);
 for(const u in OT){const o=OT[u];const px=o.rx,py=o.ry;o.rx+=(o.x-o.rx)*.35;o.ry+=(o.y-o.ry)*.35;const mx=o.rx-px,my=o.ry-py;if(Math.abs(mx)+Math.abs(my)>.15){o.mv=1;o.dr=Math.abs(mx)>Math.abs(my)?(mx>0?'right':'left'):(my>0?'down':'up')}else o.mv=0;const x=o.rx-cx,y=o.ry-cy;if(typeof PP!='undefined'&&PP.o&&PP.o[u]&&Date.now()-(PP.o[u].t||0)<30000&&!!PP.o[u].dg==!!DG.f)continue; // la party ya se dibuja en ppDraw: evita verlos dos veces
if(x<-40||x>VW+40||y<-60||y>VHn+40)continue;
  g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x,y+10,9,3,0,0,7);g.fill();if(!(o.bs&&typeof spBS=='function'&&spBS(o.bs,x,y,2,0,0)))sp('c'+o.c+'-'+(o.dr||'down')+'-'+(o.mv?[1,2,1,3][Math.floor(Date.now()/130)%4]:1),x,y,2);
  g.font='bold 11px Georgia,serif';g.textAlign='center';const lb=(o.gt?'['+o.gt+'] ':'')+o.nm+' · Nv '+o.lv;g.fillStyle='#000';g.fillText(lb,x+1,y-23);g.fillStyle=o.pt?'#7fffa0':'#fff';g.fillText(lb,x,y-24);
  g.fillStyle='#0008';g.fillRect(x-12,y-19,24,3);g.fillStyle='#4cd964';g.fillRect(x-12,y-19,24*Math.max(0,Math.min(1,o.hp/Math.max(1,o.mhp))),3)}}
setInterval(()=>{if(!ready()||!N.up())return;
 if(!on){if(WBAD)return;if(Date.now()-ft>2000){ft=Date.now();N.send({t:'wj',nm:P.name,c:P.cls|0,lv:P.lv,x:Math.round(P.x),y:Math.round(P.y)})}return}
 const tp=Math.hypot(P.x-lx,P.y-ly)>300;lx=P.x;ly=P.y;
 N.send({t:'wm',x:Math.round(P.x),y:Math.round(P.y),hp:Math.round(P.hp),mhp:Math.round(P.mhp),lv:P.lv,tp:tp?1:0,dg:(typeof DG!=='undefined'&&DG.f)?1:0});
 if(typeof DG!=='undefined'&&DG.f)WQ.length=0;
 if(WQ.length)N.send({t:'wh',h:WQ.splice(0,12)})},100);
setInterval(()=>{if(!on||!LS)return;const n=Date.now();if(n-LS>1500)return;   // vigilante: si el servidor no reporta un enemigo cercano en 4 s, vuelve a modo local (nunca queda inmortal)
 for(const e of NR){if(!e.sync||n-(e.lt||0)<4000||Math.abs(e.x-P.x)>800||Math.abs(e.y-P.y)>800)continue;e.sync=0;e.stun=0;e.gs=0;e.sid=-1;if(!(e.hp>0))e.hp=Math.max(1,Math.round(e.mx*.05))}},1000);
setInterval(()=>{if(!on)return;for(const e of E){if(!e.gs)continue;const dx=e.gx-e.x,dy=e.gy-e.y;if(Math.abs(dx)+Math.abs(dy)<1.5){e.x=e.gx;e.y=e.gy;e.gs=0}else{e.x+=dx*.4;e.y+=dy*.4}}},33);
const _atk=atk;atk=function(auto){const c0=P.cd;_atk(auto);if(on&&!(c0>0)&&P.cd>0){let b=null,bd=560;for(const e of E){if(!e.sync||e.dead>0)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;b=e}}const fd={left:Math.PI,right:0,up:-Math.PI/2,down:Math.PI/2}[P.dir||'down'];N.send({t:'wa',k:P.cls|0,a:b?Math.atan2(b.y-P.y,b.x-P.x):fd})}};
window.SRWORLD={on:()=>on,others:()=>OT,ofx:()=>OFX.length};
})();
