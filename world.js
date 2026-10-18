/* Mundo compartido autoritativo: el servidor controla enemigos, daño, muertes y botín. Reglas copiadas del juego (world.json). */
const fs=require('fs');
module.exports=function(DB,log,X){X=X||{};
const FILE=process.env.WORLD_FILE||__dirname+'/world.json';
if(!fs.existsSync(FILE)){log('mundo: falta world.json (node tools/export-world.js) → mundo desactivado');return null}
const J=JSON.parse(fs.readFileSync(FILE,'utf8')),W=J.W,H=J.H,T=J.T,bits=Buffer.from(J.bits,'base64');
const CFG={tick:100,aggro:60,leash:600,view:700,pview:1800,rng:900,rez:30000,hitMax:14,gcap:25000,shareMin:.5,speed:480,dmg0:J.dmg0||40}; // balance: aquí se ajusta todo
const solid=(x,y)=>{const tx=Math.floor(x/T),ty=Math.floor(y/T);if(tx<0||ty<0||tx>=W||ty>=H)return true;const i=ty*W+tx;return(bits[i>>3]>>(i&7)&1)===1};
const inCity=(x,y)=>J.cities.some(c=>Math.abs(x/T-c.tx-.5)<7.6&&Math.abs(y/T-c.ty-.5)<7.6);
const L=[];J.mobs.forEach((a,i)=>{if(a)L.push({id:i,x:a[0],y:a[1],ty:a[2],mx:a[3],hp:a[3],sp:a[4],hx:a[5],hy:a[6],rw:a[7],dm:a[8],dead:0,rt:0,t:0,tg:null,dmg:{}})});
const BY=new Map(L.map(m=>[m.id,m])),CS=512,G=new Map(),key=(a,b)=>a+','+b;
for(const m of L){const k=key(Math.floor(m.hx/CS),Math.floor(m.hy/CS));if(!G.has(k))G.set(k,[]);G.get(k).push(m)}
const near=(x,y,r)=>{const o=[];for(let a=Math.floor((x-r)/CS);a<=Math.floor((x+r)/CS);a++)for(let b=Math.floor((y-r)/CS);b<=Math.floor((y+r)/CS);b++){const g=G.get(key(a,b));if(g)for(const m of g)o.push(m)}return o};
const PL=new Map(),pid=u=>(DB.pmem&&DB.pmem[u]&&DB.pmem[u].pid)||'',sc=p=>p.ct.dm+1.5*p.ct.tk+6*p.ct.ut;
const send=(ws,m)=>{if(ws.readyState===1)ws.send(JSON.stringify(m))},mvM=(m,dx,dy)=>{if(!solid(m.x+dx,m.y))m.x+=dx;if(!solid(m.x,m.y+dy))m.y+=dy};
function step(dt,now){const act=new Set();for(const p of PL.values())for(const m of near(p.x,p.y,CFG.view+CFG.leash))act.add(m);
 for(const m of act){if(m.dead){if(now>=m.rt){m.dead=0;m.hp=m.mx;m.x=m.hx;m.y=m.hy;m.tg=null;m.dmg={}}continue}
  let tg=m.tg&&PL.get(m.tg);if(tg&&(tg.city||tg.hp<=0||Math.hypot(tg.x-m.x,tg.y-m.y)>CFG.view||Math.hypot(m.x-m.hx,m.y-m.hy)>CFG.leash))tg=null;
  if(!tg){let bd=CFG.aggro;for(const p of PL.values()){if(p.city||p.hp<=0)continue;const d=Math.hypot(p.x-m.x,p.y-m.y);if(d<bd){bd=d;tg=p}}}
  m.tg=tg?tg.uid:null;m.t-=dt;
  if(tg){const dx=tg.x-m.x,dy=tg.y-m.y,d=Math.hypot(dx,dy)||1,vg=.55+.45*Math.max(0,m.hp/m.mx);if(d>20){const s=m.sp*vg*dt;mvM(m,dx/d*s,dy/d*s)}
   if(d<24&&m.t<=0){m.t=.8;const dm=m.dm*(.6+.4*Math.max(0,m.hp/m.mx));tg.ct.tk+=dm;send(tg.ws,{t:'wd',d:Math.round(dm*10)/10,mid:m.id})}}
  else{const hx=m.hx-m.x,hy=m.hy-m.y,hd=Math.hypot(hx,hy);if(hd>12){mvM(m,hx/hd*55*dt,hy/hd*55*dt);if(hd<60)m.hp=Math.min(m.mx,m.hp+m.mx*.25*dt)}else if(m.hp<m.mx)m.hp=Math.min(m.mx,m.hp+m.mx*.25*dt)}}
 for(const p of PL.values()){p.ct.dm*=.9985;p.ct.tk*=.9985;p.ct.ut*=.9985}}
function kill(m){m.dead=1;m.hp=0;m.rt=Date.now()+CFG.rez;m.tg=null;let o=null,b=0;for(const u in m.dmg){const p=PL.get(u);if(p&&m.dmg[u]>b){b=m.dmg[u];o=p}}m.dmg={};if(!o)return;
 const TY=J.types[Math.min(8,m.ty)],t=TY.loot[Math.floor(Math.random()*TY.loot.length)],gd=Math.round(t[0]*m.rw),xp0=Math.max(1,Math.round(TY.xp*m.rw)),pd=pid(o.uid),E=[o];
 if(pd)for(const p of PL.values())if(p!==o&&pid(p.uid)===pd&&p.hp>0&&!p.city&&sc(p)>0&&Math.hypot(p.x-m.x,p.y-m.y)<=CFG.rng)E.push(p);
 const R=new Map(E.map(p=>[p.uid,{t:'wk',g:0,x:0,it:null,pot:0,meat:0,mid:m.id,ty:m.ty,own:p===o?1:0}]));
 if(E.length<2){const r=R.get(o.uid);r.g=gd;r.x=xp0;r.it=t[1]||null}
 else{const n=E.length,sum=E.reduce((a,p)=>a+sc(p),0),w=E.map(p=>Math.min(2/n,Math.max(CFG.shareMin/n,.5/n+.5*(sum>0?sc(p)/sum:1/n)))),tw=w.reduce((a,b)=>a+b,0),k=new Set(E.map(p=>p.c)).size,pool=xp0*(1+.03*(k-1)),now=Date.now();let sg=0;
  E.forEach((p,i)=>{const r=R.get(p.uid);r.x=Math.max(1,Math.round(pool*w[i]/tw));if(p===o)return;p.rc=p.rc.filter(a=>now-a[0]<6e4);const left=Math.max(0,CFG.gcap+500*p.lv-p.rc.reduce((a,b)=>a+b[1],0)),g=Math.min(left,Math.floor(gd*w[i]/tw));if(g>0){p.rc.push([now,g]);r.g=g;sg+=g}});
  R.get(o.uid).g=gd-sg;if(t[1]){let r=Math.random()*tw,k2=0;for(;k2<n-1;k2++){if(r<w[k2])break;r-=w[k2]}R.get(E[k2].uid).it=t[1]}}
 const ro=R.get(o.uid);ro.pot=t[2];ro.meat=t[3];for(const p of E)send(p.ws,R.get(p.uid))}
function hits(p,list){const now=Date.now();p.tok=Math.min(CFG.hitMax*2,(p.tok||0)+(now-p.tt)/1000*CFG.hitMax);p.tt=now;
 for(const h of Array.isArray(list)?list.slice(0,12):[]){if(p.tok<1)break;const m=BY.get(h[0]|0);if(!m||m.dead||Math.hypot(p.x-m.x,p.y-m.y)>620)continue;
  const dm=Math.min(CFG.dmg0*75*(1+.12*(p.lv-1)),Math.max(0,+h[1]||0));if(!(dm>0))continue;p.tok--;
  m.hp-=dm;m.dmg[p.uid]=(m.dmg[p.uid]||0)+dm;p.ct.dm+=dm;if(!m.tg&&!p.city)m.tg=p.uid;if(m.hp<=0)kill(m)}}
const num=(v,a,b,d)=>Number.isFinite(+v)?Math.min(b,Math.max(a,+v)):d;
function handle(ws,m){const u=ws.uid,now=Date.now();let p=PL.get(u);
 if(m.t==='wj'){const old=p;p={uid:u,ws,nm:String(m.nm||'').replace(/[^\p{L}\p{N} '-]/gu,'').slice(0,20)||'Viajero',c:num(m.c,0,5,0)|0,lv:num(m.lv,1,9999,1)|0,gt:String(m.gt||'').slice(0,4),bs:String(m.bs||'').slice(0,12),cz:Array.isArray(m.cz)?m.cz:[0,0,0],x:num(m.x,0,W*T,0),y:num(m.y,0,H*T,0),hp:100,mhp:100,mt:now,tok:0,tt:now,rc:[],ct:old?old.ct:{dm:0,tk:0,ut:0}};p.city=inCity(p.x,p.y);PL.set(u,p);send(ws,{t:'wi',tick:CFG.tick});return}
 if(!p||p.ws!==ws)return;
 if(m.t==='wm'){const x=num(m.x,0,W*T,p.x),y=num(m.y,0,H*T,p.y),dt=Math.min(2,Math.max(.05,(now-p.mt)/1000)),d=Math.hypot(x-p.x,y-p.y),tp=m.tp&&inCity(x,y)&&now-(p.tpT||0)>3000;
  if((d>CFG.speed*dt+48&&!tp)||solid(x,y)){send(ws,{t:'wp',x:p.x,y:p.y});return}if(tp)p.tpT=now;
  p.x=x;p.y=y;p.mt=now;p.mhp=num(m.mhp,1,1e7,p.mhp);p.hp=num(m.hp,0,p.mhp,p.hp);p.lv=X.lv&&X.lv(u)?X.lv(u):num(m.lv,1,9999,p.lv)|0;p.city=inCity(x,y);return}
 if(m.t==='wh')hits(p,m.h)}
setInterval(()=>{const now=Date.now();step(CFG.tick/1000,now);
 for(const p of PL.values()){const pl=[];for(const q of PL.values()){if(q===p||Math.hypot(q.x-p.x,q.y-p.y)>CFG.pview)continue;pl.push([q.uid,q.nm,q.c,q.lv,Math.round(q.x),Math.round(q.y),Math.round(q.hp),Math.round(q.mhp),pid(q.uid)?1:0,q.gt||'',q.bs||''])}
  const mb=[];for(const m of near(p.x,p.y,CFG.view+CFG.leash))if(Math.hypot(m.x-p.x,m.y-p.y)<=CFG.view)mb.push([m.id,Math.round(m.x),Math.round(m.y),Math.round(m.hp),m.dead?1:0]);send(p.ws,{t:'ws',pl,mb})}},CFG.tick);
log('mundo cargado: '+L.length+' enemigos, '+W+'x'+H+' casillas');
return{handle,leave:(u,ws)=>{const p=PL.get(u);if(p&&p.ws===ws)PL.delete(u)},credit:(u,k,v)=>{const p=PL.get(u);if(p)p.ct[k]+=v},stats:()=>({players:PL.size,mobs:L.length})}};
