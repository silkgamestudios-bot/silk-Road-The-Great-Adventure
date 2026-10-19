/* Mundo online (cliente): posición, enemigos compartidos y botín vienen del servidor.
   Si el servidor no tiene mundo (falta world.json), el juego sigue en modo local sin cambios. */
(function(){
const N=window.SRNET;if(!N)return;
let WBAD=0,on=0,OT={},WQ=[],lx=0,ly=0,ft=0;
const ready=()=>P&&P.chosen&&P.name;
const SKIP=e=>e.boss||e.guard||e.wild||e.tmp||e.alpha||e.vec;
function freeze(){E.forEach((e,i)=>{if(SKIP(e))return;e.sid=i;e.sync=1;e.stun=1e9})}   // la IA local se apaga: manda el servidor
N.onopen=()=>{on=0;WBAD=0};
N.onmsg=m=>{
 if(m.t=='wi'){let sg=0,n=m.n|0;if(m.sg!=null&&n>0&&E.length>=n){for(let i=0;i<n;i++){const e=E[i];sg=(!e||SKIP(e)||e.dg)?(Math.imul(sg,31)+3)|0:(Math.imul(sg,31)+Math.round(e.hx)*7+Math.round(e.hy)*13+(e.ty|0)*17+1)|0}}
  if(m.sg!=null&&(E.length<n||sg!==(m.sg|0))){on=0;WBAD=1;console.log('mundo: versión distinta',n,E.length,sg,m.sg);toast('⚠️ El servidor tiene una versión vieja del mundo. Sube TODOS los archivos a GitHub y haz Manual Deploy; mientras tanto juegas en modo local.',9000)}
  else{on=1;WBAD=0;freeze();toast('🌐 Mundo online conectado',2200)}}
 else if(m.t=='wx'){on=0}
 else if(m.t=='wp'){P.x=m.x;P.y=m.y}
 else if(m.t=='wd'){if(on&&P.hp>0&&!modal){P.hp-=mountAbs(m.d*(P.sh>0?.3:1)*(P.cls==1?knRes():1));if(P.hp<=0)die()}}
 else if(m.t=='ws')snap(m);
 else if(m.t=='wk')reward(m)};
function snap(m){const seen={};
 for(const a of m.pl){const o=OT[a[0]]||(OT[a[0]]={rx:a[4],ry:a[5]});Object.assign(o,{nm:a[1],c:a[2],lv:a[3],x:a[4],y:a[5],hp:a[6],mhp:a[7],pt:a[8],gt:a[9]||'',bs:a[10]||''});seen[a[0]]=1}
 for(const u in OT)if(!seen[u])delete OT[u];
 for(const b of m.mb){const e=E[b[0]];if(!e||!e.sync)continue;if(b[4]){e.hp=0;e.dead=1e9;continue}
  if(e.dead>0)e.dead=0;e.stun=1e9;const dx=b[1]-e.x,dy=b[2]-e.y;e.mov=Math.abs(dx)+Math.abs(dy)>.5?1:0;
  if(e.mov)e.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');e.x=b[1];e.y=b[2];e.hp=b[3]}}
function reward(m){const t=[],g=Math.round(m.g*goldM()*(1+eqT().gd/100));
 if(g>0){P.gold+=g;t.push('+'+g+' 🪙')}if(m.x>0){gainXp(m.x);t.push('+'+m.x+' XP')}
 if(m.own){try{P.st.all++;P.st.k[m.ty]=(P.st.k[m.ty]||0)+1;pqEvt('kill',m.ty);hzEvt(m.ty)}catch(e){}}
 if(m.pot&&typeof P.pot=='number')P.pot=Math.min(99,P.pot+1);
 if(m.it){const it=cleanIt(m.it);if(P.bag.length<24)P.bag.push(it);else LT.push({x:P.x,y:P.y,gd:0,it,l:300});t.push('🎁 '+it.n)}
 if(t.length&&FT.length<60)FT.push({x:P.x,y:P.y-30,t:1.6,d:0,o:0,k:'dm',s:t.join(' '),c:'#ffd666'});
 try{chk();save()}catch(e){}}
const _h=hitE;hitE=function(e,dm){if(!on||!e.sync)return _h(e,dm);if(e.dead>0)return;dm=Math.max(1,Math.round(dm));WQ.push([e.sid,dm]);e.hp=Math.max(1,e.hp-dm);
 if(FT.length<60)FT.push({x:e.x+Math.random()*14-7,y:e.y-14,t:.9,d:0,o:0,k:'dm',s:String(dm),c:'#ffe9a8'})};
if(typeof drawTemple=='function'){const _t=drawTemple;drawTemple=function(cx,cy,now){_t(cx,cy,now);others(cx,cy,now)}}
function others(cx,cy,now){if(!on)return;const VHn=typeof VH=='number'?VH:900;
 for(const u in OT){const o=OT[u];o.rx+=(o.x-o.rx)*.35;o.ry+=(o.y-o.ry)*.35;const x=o.rx-cx,y=o.ry-cy;if(x<-40||x>VW+40||y<-60||y>VHn+40)continue;
  g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x,y+10,9,3,0,0,7);g.fill();if(!(o.bs&&typeof spBS=='function'&&spBS(o.bs,x,y,2,0,0)))sp('c'+o.c+'-down-1',x,y,2);
  g.font='bold 11px Georgia,serif';g.textAlign='center';const lb=(o.gt?'['+o.gt+'] ':'')+o.nm+' · Nv '+o.lv;g.fillStyle='#000';g.fillText(lb,x+1,y-23);g.fillStyle=o.pt?'#7fffa0':'#fff';g.fillText(lb,x,y-24);
  g.fillStyle='#0008';g.fillRect(x-12,y-19,24,3);g.fillStyle='#4cd964';g.fillRect(x-12,y-19,24*Math.max(0,Math.min(1,o.hp/Math.max(1,o.mhp))),3)}}
setInterval(()=>{if(!ready()||!N.up())return;
 if(!on){if(WBAD)return;if(Date.now()-ft>2000){ft=Date.now();N.send({t:'wj',nm:P.name,c:P.cls|0,lv:P.lv,x:Math.round(P.x),y:Math.round(P.y)})}return}
 const tp=Math.hypot(P.x-lx,P.y-ly)>300;lx=P.x;ly=P.y;
 N.send({t:'wm',x:Math.round(P.x),y:Math.round(P.y),hp:Math.round(P.hp),mhp:Math.round(P.mhp),lv:P.lv,tp:tp?1:0,dg:(typeof DG!=='undefined'&&DG.f)?1:0});
 if(typeof DG!=='undefined'&&DG.f)WQ.length=0;
 if(WQ.length)N.send({t:'wh',h:WQ.splice(0,12)})},100);
window.SRWORLD={on:()=>on,others:()=>OT};
})();
