/* Mundo compartido AUTORITATIVO (fase 3): los 23.149 enemigos normales viven aquí.
   El servidor decide posición, vida, muerte, respawn, ataques a jugadores y las recompensas (con la "rebaja dura").
   El cliente solo dibuja lo que le llega y envía: su posición (w.pos) y sus golpes (w.hit). */
const fs=require('fs'),zlib=require('zlib');
const SOLID=new Set([2,3,6,9]),VRT={wolf:300,jackal:260,bat:210,spider:170,rdog:240,assassin:280,bandit:260,thief:230,scorp:140,scorpb:150,raider:320};
/* ---- REBAJA DURA (igual que el cliente v14.8; ajusta aquí) ---- */
const HC={XP:.1,GOLD:.06,GC:[.15,.15,.55,.5,.4,.4,.45,.5,.55],IC:[0,0,.04,.05,.05,.06,.06,.07,.08],PC:[0,0,.03,.05,.03,.03,.04,.06,.07],MC:[.6,.5,0,0,0,0,0,0,0]};
const LIM={AOI:760,WAKE:1100,REACH:620,HIT_MAX:2500,DPS_MAX:7000,BUCKET:60,REFILL:40,SPEED:650,TP_EVERY:20000,MIN_SHARE:.1,
 FATIGUE:[[300,1],[600,.6],[1000,.3],[1e9,.1]],RESPAWN:30};
const edm=e=>(5+3*(e.ty||0))*(e.dm||1);
const csum=rows=>{let s=0;for(const r of rows)s=(s+((r[1]*31+r[2]*17+r[3]*7+r[4]*3+r[0])%1000000007))%1000000007;return s};
class World{
 constructor(o){const j=JSON.parse(fs.readFileSync(o.file,'utf8'));this.W=j.W;this.H=j.H;this.T=j.T;this.map=zlib.gunzipSync(Buffer.from(j.map,'base64'));this.trees=zlib.gunzipSync(Buffer.from(j.trees,'base64'));
  this.cities=j.cities;this.rows=j.mobs;this.tot=j.mobs.length+j.bosses.length+j.guards.length;this.sum=csum(j.mobs);this.hash=j.hash;this.send=o.send||(()=>{});this.onXp=o.onXp||null;this.sxOf=o.sxOf||null;this.rand=o.rand||Math.random;this.now=o.now||Date.now;
  this.S=new Map();this.ACT=new Set();this.PL=new Map();this.PK=new Map();this.G=new Map();this.CS=256;
  for(const r of this.rows){const k=((r[2]/this.CS)|0)*10000+((r[1]/this.CS)|0);let a=this.G.get(k);if(!a)this.G.set(k,a=[]);a.push(r[0])}
  this.byI=new Map(this.rows.map(r=>[r[0],r]))}
 /* ---------- helpers ---------- */
 solid(x,y){const tx=Math.floor(x/this.T),ty=Math.floor(y/this.T);return tx<0||ty<0||tx>=this.W||ty>=this.H||SOLID.has(this.map[ty*this.W+tx])||this.trees[ty*this.W+tx]}
 blk(x,y,r){return this.solid(x-r,y-r)||this.solid(x+r,y-r)||this.solid(x-r,y+r)||this.solid(x+r,y+r)}
 city(x,y){const T=this.T;for(const c of this.cities)if(Math.abs(x/T-c[0]-.5)<7.6&&Math.abs(y/T-c[1]-.5)<7.6)return 1;return 0}
 mv(e,dx,dy){if(!this.blk(e.x+dx,e.y,9))e.x+=dx;if(!this.blk(e.x,e.y+dy,9))e.y+=dy}
 mob(i){let e=this.S.get(i);if(e)return e;const r=this.byI.get(i);if(!r)return null;const x=r[8]||{};
  e={i,hx:r[1],hy:r[2],x:r[1],y:r[2],ty:r[3],mx:r[4],hp:r[4],sp:r[5],pid:r[6],big:r[7],v:x.v,dm:x.dm,df:x.df,rw:x.rw||1,thief:x.thief,
   vr:VRT[x.v]||200+r[3]*8,lsh:380+r[3]*25,pr:70+this.rand()*70,pz:this.rand()*2,pt:0,pw:null,ch:0,ex:0,cd:0,t:0,dead:0,dir:(this.rand()*4)|0,mov:0,dmgBy:new Map(),lh:0};
  if(x.v&&x.v.startsWith&&false)e.vr=640;this.S.set(i,e);return e}
 pack(e){if(!e.pid)return null;let p=this.PK.get(e.pid);if(!p)this.PK.set(e.pid,p={al:0});return p}
 dirOf(dx,dy){return Math.abs(dx)>Math.abs(dy)?(dx>0?0:2):(dy>0?1:3)}
 /* ---------- jugadores ---------- */
 hello(uid){return{t:'w.hello',n:this.rows.length,tot:this.tot,sum:this.sum,hash:this.hash}}
 join(uid){this.PL.set(uid,{x:0,y:0,ok:0,safe:0,tp:0,pt:this.now(),bk:LIM.BUCKET,bt:this.now(),dps:0,dw:this.now(),last:new Map(),kills:[]});this.send(uid,this.hello(uid))}
 leave(uid){this.PL.delete(uid)}
 pos(uid,m){const p=this.PL.get(uid);if(!p)return;const x=+m.x,y=+m.y,n=this.now();if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>this.W*this.T||y>this.H*this.T)return;
  if(p.ok){const dt=Math.max(.05,(n-p.pt)/1e3),d=Math.hypot(x-p.x,y-p.y);
   if(d>LIM.SPEED*dt+200){if(m.tp&&n-p.tp>LIM.TP_EVERY){p.tp=n}else{this.send(uid,{t:'w.fix',x:p.x,y:p.y});return}}}
  p.x=x;p.y=y;p.pt=n;p.ok=1;p.safe=this.city(x,y);if(m.xm!=null){const q=+m.xm;p.xm=Number.isFinite(q)?Math.max(1,Math.min(4,q)):1}}
 /* ---------- combate ---------- */
 hit(uid,m){const p=this.PL.get(uid);if(!p||!p.ok)return 0;const n=this.now();
  p.bk=Math.min(LIM.BUCKET,p.bk+(n-p.bt)/1e3*LIM.REFILL);p.bt=n;if(p.bk<1)return 0;p.bk--;
  const e=this.mob(m.i|0);if(!e||e.dead>0)return 0;let d=+m.d;if(!(d>0))return 0;const mh=this.maxHit(uid);d=Math.min(d,mh);
  if(Math.hypot(e.x-p.x,e.y-p.y)>LIM.REACH)return 0;
  if(n-p.dw>1000){p.dw=n;p.dps=0}if(p.dps+d>Math.min(LIM.DPS_MAX,mh*5))return 0;p.dps+=d;
  if(e.df)d=Math.max(1,Math.round(d*(1-e.df)));d=Math.min(d,e.hp);e.hp-=d;e.dmgBy.set(uid,(e.dmgBy.get(uid)||0)+d);e.lh=n;e.ch=Math.max(e.ch,7);e.tgt=uid;e.cd=0;
  const pk=this.pack(e);if(pk)pk.al=n+(e.big?9000:4000);this.ACT.add(e.i);
  if(e.hp<=0)this.kill(e);return 1}
 maxHit(uid){if(!this.sxOf)return LIM.HIT_MAX;const sx=this.sxOf(uid)||1,elv=1+(sx-1)*29/599;return Math.max(120,Math.round(15*1.5*(1+.12*(elv-1))*3.6*1.6*4*1.25))}
 fatigue(p,n){p.kills=p.kills.filter(t=>n-t<36e5);const c=p.kills.length;for(const [lim,mu] of LIM.FATIGUE)if(c<lim)return mu;return .1}
 kill(e){const n=this.now(),tot=[...e.dmgBy.values()].reduce((a,b)=>a+b,0)||1,list=[...e.dmgBy.entries()].filter(([u,d])=>d/tot>=LIM.MIN_SHARE&&this.PL.has(u)).sort((a,b)=>b[1]-a[1]);
  const t=Math.max(0,Math.min(8,e.ty|0)),xp0=Math.max(1,Math.round((12+t*10)*HC.XP*e.rw));
  list.forEach(([u,d],k)=>{const p=this.PL.get(u),fa=this.fatigue(p,n);p.kills.push(n);const o={t:'w.kill',i:e.i,ty:e.ty,x:Math.round(e.x),y:Math.round(e.y),top:k==0?1:0,xp:Math.max(0,Math.round(xp0*(d/tot)*fa*100)/100),gd:0,it:-1,pot:0,meat:0,fa};
   if(k==0){const R=this.rand;if(R()<HC.GC[t]*fa)o.gd=Math.max(1,Math.round((10+Math.floor(R()*16))*20*(1+.5*t)*HC.GOLD*e.rw));if(R()<HC.IC[t]*(e.rw>1?1.8:1)*fa)o.it=Math.min(2,t>>1);if(R()<HC.PC[t]*fa)o.pot=1;if(R()<HC.MC[t]*fa)o.meat=1}
   if(this.onXp&&o.xp>0)this.onXp(u,Math.round(o.xp*(p.xm||1)*100)/100);this.send(u,o)});
  let near=0;for(const q of this.PL.values())if(Math.hypot(q.x-e.hx,q.y-e.hy)<700)near++;
  e.dead=LIM.RESPAWN*(1+.25*Math.min(4,Math.max(0,near-1)));e.dmgBy.clear();e.ch=0;e.mov=0;this.ACT.add(e.i)}
 respawn(e){e.x=e.hx;e.y=e.hy;e.hp=e.mx;e.dead=0;e.ch=0;e.cd=0;e.ex=0;e.pw=null;e.dmgBy.clear()}
 /* ---------- IA (portada de AIx del cliente) ---------- */
 ai(e,dt,P,d,safe,n){
  if(e.ex>0)e.ex-=dt;if(e.cd>0)e.cd-=dt;const dx=P?P.x-e.x:0,dy=P?P.y-e.y:0,hd=Math.hypot(e.x-e.hx,e.y-e.hy),pk=this.pack(e);e.mov=0;
  if(P&&!safe){
   if(pk&&pk.al>n&&d<(e.big?750:460)&&d>20){this.chase(e,dt,dx,dy,d);return}
   if(!e.ch&&e.cd<=0){let see=0;if(d<60)see=1;else if(d<e.vr){const f=[0,1.571,3.1416,-1.571][e.dir];let a=Math.abs(Math.atan2(dy,dx)-f);if(a>3.1416)a=6.283-a;
     if(a<1.2){see=1;for(let s=1;s<5;s++)if(this.blk(e.x+dx*s/5,e.y+dy*s/5,2)){see=0;break}}}
    if(see){e.ch=7;e.ex=.9;if(pk)pk.al=n+(e.big?9000:4000)}}
   if(e.ch>0){e.ch-=dt;if(d>e.vr*1.8||hd>e.lsh){e.ch=0;e.cd=4}
    else{if(e.ex>.55)return;if(d<130)e.ch=Math.max(e.ch,4);if(d>20)this.chase(e,dt,dx,dy,d);
     e.t-=dt;if(d<24&&e.t<=0){e.t=.8;this.send(P.uid,{t:'w.mobhit',i:e.i,dm:Math.round(edm(e)*(.6+.4*Math.max(0,e.hp/e.mx))*10)/10,th:e.thief?1:0})}return}}}
  else if(safe){e.ch=0}
  if(hd>12&&(hd>e.pr+40||e.ch<=0)){const hx=e.hx-e.x,hy=e.hy-e.y;this.mv(e,hx/hd*55*dt,hy/hd*55*dt);e.mov=1;e.dir=this.dirOf(hx,hy);if(hd<60)e.hp=Math.min(e.mx,e.hp+e.mx*.25*dt);if(hd>e.pr+40)return}
  if(e.hp<e.mx)e.hp=Math.min(e.mx,e.hp+e.mx*.25*dt);
  if(e.pz>0){e.pz-=dt;return}
  if(!e.pw||(e.pt-=dt)<=0){const a=this.rand()*6.283,r=this.rand()*e.pr,wx=e.hx+Math.cos(a)*r,wy=e.hy+Math.sin(a)*r;e.pt=4;if(this.blk(wx,wy,9)){e.pz=.5;return}e.pw={x:wx,y:wy}}
  const wx=e.pw.x-e.x,wy=e.pw.y-e.y,wd=Math.hypot(wx,wy);if(wd<10){e.pw=null;e.pz=1+this.rand()*3;return}
  this.mv(e,wx/wd*e.sp*.45*dt,wy/wd*e.sp*.45*dt);e.mov=1;e.dir=this.dirOf(wx,wy)}
 chase(e,dt,dx,dy,d){const vg=.55+.45*Math.max(0,e.hp/e.mx),ux=dx,uy=dy,ud=Math.hypot(ux,uy)||1;this.mv(e,ux/ud*e.sp*vg*dt,uy/ud*e.sp*vg*dt);e.mov=1;e.dir=this.dirOf(dx,dy)}
 cells(x,y,r){const out=[],c0=Math.floor((x-r)/this.CS),c1=Math.floor((x+r)/this.CS),r0=Math.floor((y-r)/this.CS),r1=Math.floor((y+r)/this.CS);
  for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){const a=this.G.get(cy*10000+cx);if(a)out.push(...a)}return out}
 /* ---------- bucle (10 Hz) ---------- */
 tick(dt){const n=this.now(),awake=new Set(this.ACT);
  for(const [u,p] of this.PL){p.uid=u;if(p.ok)for(const i of this.cells(p.x,p.y,LIM.WAKE)){const r=this.byI.get(i);if(Math.abs(r[1]-p.x)<=LIM.WAKE&&Math.abs(r[2]-p.y)<=LIM.WAKE)awake.add(i)}}
  for(const i of awake){const e=this.mob(i);if(!e)continue;
   if(e.dead>0){e.dead-=dt;if(e.dead<=0){this.respawn(e)}continue}
   let P=null,d=1e9,safeAny=0;for(const p of this.PL.values()){if(!p.ok)continue;const dd=Math.hypot(p.x-e.x,p.y-e.y);if(dd<d){d=dd;P=p}}
   if(P&&d>LIM.WAKE){P=null}
   if(e.lh&&n-e.lh>15000){e.dmgBy.clear();e.lh=0}
   this.ai(e,dt,P,P?d:1e9,P?P.safe:0,n);
   if(!(e.hp<e.mx||e.dead>0||e.ch>0||Math.hypot(e.x-e.hx,e.y-e.hy)>14))this.ACT.delete(i);else this.ACT.add(i)}
 }
 snaps(){for(const [u,p] of this.PL){if(!p.ok)continue;const out=[],seen=new Set();
   for(const i of this.cells(p.x,p.y,LIM.AOI+60)){const e=this.S.get(i),r0=this.byI.get(i);const x=e?e.x:r0[1],y=e?e.y:r0[2];if(Math.hypot(x-p.x,y-p.y)>LIM.AOI)continue;seen.add(i);
    const row=e?[i,Math.round(e.x),Math.round(e.y),Math.ceil(e.hp),e.dir,e.mov,e.dead>0?Math.ceil(e.dead):0]:[i,r0[1],r0[2],r0[4],0,0,0],k=row.slice(1).join(',');
    if(p.last.get(i)!==k){p.last.set(i,k);out.push(row)}}
   for(const i of p.last.keys())if(!seen.has(i))p.last.delete(i);
   if(out.length)this.send(u,{t:'w.s',s:out})}}
}
module.exports={World,HC,LIM,csum};
