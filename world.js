/* Mundo compartido autoritativo: el servidor controla enemigos, daño, muertes y botín. Reglas copiadas del juego (world.json). */
const fs=require('fs');
module.exports=function(DB,log,X){X=X||{};
const FILE=process.env.WORLD_FILE||__dirname+'/world.json';
if(!fs.existsSync(FILE)){log('mundo: falta world.json (node tools/export-world.js) → mundo desactivado');return null}
const J=JSON.parse(fs.readFileSync(FILE,'utf8')),W=J.W,H=J.H,T=J.T,bits=Buffer.from(J.bits,'base64');
const CFG={tick:100,aggro:60,leash:600,view:700,pview:1800,rng:900,sview:1300,rez:30000,hitMax:14,gcap:25000,shareMin:.5,prng:600,phMax:6,pct:.035,pvMin:+process.env.PVP_MIN_LV||1,speed:480,dmg0:J.dmg0||40}; // balance: aquí se ajusta todo
const solid0=(x,y)=>{const tx=Math.floor(x/T),ty=Math.floor(y/T);if(tx<0||ty<0||tx>=W||ty>=H)return true;const i=ty*W+tx;return(bits[i>>3]>>(i&7)&1)===1};
/* v155: piezas de territorios de gremio (muros, torres…): bloquean a monstruos y jugadores; las puertas dejan pasar a los miembros del gremio dueño */
const STRS=new Map();
const solid=(x,y)=>{if(solid0(x,y))return true;return STRS.size?STRS.has(Math.floor(y/T)*W+Math.floor(x/T)):false};
const psolid=(x,y,u)=>{if(solid0(x,y))return true;if(!STRS.size)return false;const s=STRS.get(Math.floor(y/T)*W+Math.floor(x/T));if(!s)return false;return!(s.pass&&X.gid&&X.gid(u)===s.g)};
const inCity=(x,y)=>J.cities.some(c=>{const e=c.ex||[0,0,0,0],dx=x/T-c.tx-.5,dy=y/T-c.ty-.5;return dx>-24.6-e[0]&&dx<24.6+e[1]&&dy>-18.6-e[2]&&dy<15.6+e[3]});
const L=[];J.mobs.forEach((a,i)=>{if(a&&!inCity(a[5],a[6]))L.push({id:i,x:a[0],y:a[1],ty:a[2],mx:a[3],hp:a[3],sp:a[4],hx:a[5],hy:a[6],rw:a[7],dm:a[8],dead:0,rt:0,t:0,tg:null,dmg:{}})});
let WSIG=0;for(const a of J.mobs)WSIG=a?(Math.imul(WSIG,31)+(a[5]|0)*7+(a[6]|0)*13+(a[2]|0)*17+1)|0:(Math.imul(WSIG,31)+3)|0;
const BY=new Map(L.map(m=>[m.id,m])),CS=512,G=new Map(),key=(a,b)=>a+','+b;
for(const m of L){const k=key(Math.floor(m.hx/CS),Math.floor(m.hy/CS));if(!G.has(k))G.set(k,[]);G.get(k).push(m)}
const near=(x,y,r)=>{const o=[];for(let a=Math.floor((x-r)/CS);a<=Math.floor((x+r)/CS);a++)for(let b=Math.floor((y-r)/CS);b<=Math.floor((y+r)/CS);b++){const g=G.get(key(a,b));if(g)for(const m of g)o.push(m)}return o};
let EV=[],AT=[];const PL=new Map(),pid=u=>{const r=DB.pres&&DB.pres[u];if(r&&r.p&&Date.now()-(+r.t||0)<30000)return String(r.p);return(DB.pmem&&DB.pmem[u]&&DB.pmem[u].pid)||''},sc=p=>p.ct.dm+1.5*p.ct.tk+6*p.ct.ut;
const send=(ws,m)=>{if(ws.readyState===1)ws.send(JSON.stringify(m))},mvM=(m,dx,dy)=>{if(!solid(m.x+dx,m.y))m.x+=dx;if(!solid(m.x,m.y+dy))m.y+=dy};
function step(dt,now){const act=new Set();for(const p of PL.values())for(const m of near(p.x,p.y,CFG.view+CFG.leash))act.add(m);for(const m of DYL)act.add(m);
 /* rendimiento: los jugadores atacables se agrupan por celdas; cada enemigo solo mira a los cercanos (antes revisaba a TODOS los conectados) */
 const PG=new Map();for(const p of PL.values()){if(p.city||p.dg||p.hp<=0)continue;const k=key(Math.floor(p.x/CS),Math.floor(p.y/CS));let a=PG.get(k);if(!a)PG.set(k,a=[]);a.push(p)}
 const nearP=(m,r)=>{let tg=null,bd=r;if(!PG.size)return null;for(let a=Math.floor((m.x-r)/CS),a1=Math.floor((m.x+r)/CS);a<=a1;a++)for(let b=Math.floor((m.y-r)/CS),b1=Math.floor((m.y+r)/CS);b<=b1;b++){const g=PG.get(key(a,b));if(g)for(const p of g){const d=Math.hypot(p.x-m.x,p.y-m.y);if(d<bd){bd=d;tg=p}}}return tg};
 for(const m of act){if(m.dead){if(now>=m.rt){if(m.dyn&&!m.rz){dyDel(m);continue}m.dead=0;m.hp=m.mx;m.x=m.hx;m.y=m.hy;m.tg=null;m.dmg={}}continue}
  let tg=m.tg&&PL.get(m.tg);if(tg&&(tg.city||tg.dg||tg.hp<=0||Math.hypot(tg.x-m.x,tg.y-m.y)>(m.vw||CFG.view)||Math.hypot(m.x-m.hx,m.y-m.hy)>(m.ls||CFG.leash)))tg=null;
  if(!tg)tg=nearP(m,m.ag||CFG.aggro);
  m.tg=tg?tg.uid:null;m.t-=dt;
  if(tg){const dx=tg.x-m.x,dy=tg.y-m.y,d=Math.hypot(dx,dy)||1,vg=.55+.45*Math.max(0,m.hp/m.mx);if(d>(m.rg?m.rg*.6:20)){const s=m.sp*vg*dt;mvM(m,dx/d*s,dy/d*s)}
   if(d<(m.rg||24)&&m.t<=0){m.t=.8;const dm=m.dm*(m.sf?sD(tg.lv,m):1)*(.6+.4*Math.max(0,m.hp/m.mx));tg.ct.tk+=dm;send(tg.ws,{t:'wd',d:Math.round(dm*10)/10,mid:m.id})}}
  else{if(m.k==='hunt')continue;const hx=m.hx-m.x,hy=m.hy-m.y,hd=Math.hypot(hx,hy);if(hd>12){mvM(m,hx/hd*55*dt,hy/hd*55*dt);if(hd<60)m.hp=Math.min(m.mx,m.hp+m.mx*.25*dt)}else if(m.hp<m.mx)m.hp=Math.min(m.mx,m.hp+m.mx*.25*dt)}}
 for(const p of PL.values()){if(p.pvp&&(p.city||p.dg)){p.pvp=0;p.lp=null;send(p.ws,{t:'wpv',on:0,e:'PvP apagado: zona segura'})}p.ct.dm*=.9985;p.ct.tk*=.9985;p.ct.ut*=.9985}}
function kill(m){m.dead=1;m.hp=0;m.rt=Date.now()+(m.dyn?(m.rz||15000):CFG.rez);m.tg=null;let o=null,b=0;for(const u in m.dmg){const p=PL.get(u);if(p&&m.dmg[u]>b){b=m.dmg[u];o=p}}m.dmg={};if(!o)return;
 const TY=J.types[Math.min(8,m.ty)],t=TY.loot[Math.floor(Math.random()*TY.loot.length)],gd=m.gx?Math.round(m.gx*(.7+Math.random()*.6)):Math.round(t[0]*m.rw),xp0=Math.max(1,Math.round(TY.xp*m.rw)),pd=pid(o.uid),E=[o];
 if(pd)for(const p of PL.values())if(p!==o&&pid(p.uid)===pd&&p.hp>0&&!p.city&&!p.dg&&sc(p)>0&&Math.hypot(p.x-m.x,p.y-m.y)<=CFG.rng)E.push(p);
 const R=new Map(E.map(p=>[p.uid,{t:'wk',g:0,x:0,it:null,pot:0,meat:0,mid:m.id,ty:m.ty,own:p===o?1:0}]));
 if(E.length<2){const r=R.get(o.uid);r.g=gd;r.x=xp0;r.it=t[1]||null}
 else{const n=E.length,sum=E.reduce((a,p)=>a+sc(p),0),w=E.map(p=>Math.min(2/n,Math.max(CFG.shareMin/n,.5/n+.5*(sum>0?sc(p)/sum:1/n)))),tw=w.reduce((a,b)=>a+b,0),k=new Set(E.map(p=>p.c)).size,pool=xp0*(1+.03*(k-1)),now=Date.now();let sg=0;
  E.forEach((p,i)=>{const r=R.get(p.uid);r.x=Math.max(1,Math.round(pool*w[i]/tw));if(p===o)return;p.rc=p.rc.filter(a=>now-a[0]<6e4);const left=Math.max(0,CFG.gcap+500*p.lv-p.rc.reduce((a,b)=>a+b[1],0)),g=Math.min(left,Math.floor(gd*w[i]/tw));if(g>0){p.rc.push([now,g]);r.g=g;sg+=g}});
  R.get(o.uid).g=gd-sg;if(t[1]){let r=Math.random()*tw,k2=0;for(;k2<n-1;k2++){if(r<w[k2])break;r-=w[k2]}R.get(E[k2].uid).it=t[1]}}
 const ro=R.get(o.uid);ro.pot=t[2];ro.meat=t[3];for(const p of E)send(p.ws,R.get(p.uid))}
function hits(p,list){if(p.city||inCity(p.x,p.y))return;const now=Date.now();p.tok=Math.min(CFG.hitMax*2,(p.tok||0)+(now-p.tt)/1000*CFG.hitMax);p.tt=now;
 for(const h of Array.isArray(list)?list.slice(0,12):[]){if(p.tok<1)break;const m=BY.get(h[0]|0);if(!m||m.dead||Math.hypot(p.x-m.x,p.y-m.y)>620||inCity(m.x,m.y))continue;
  const dm=Math.min(CFG.dmg0*75*(1+.12*(p.lv-1)),Math.max(0,+h[1]||0));if(!(dm>0))continue;p.tok--;EV.push([m.id,Math.round(dm),p.uid,Math.round(m.x),Math.round(m.y)]);
  m.hp-=dm;m.dmg[p.uid]=(m.dmg[p.uid]||0)+dm;p.ct.dm+=dm;if(!m.tg&&!p.city)m.tg=p.uid;if(m.hp<=0)kill(m)}}
const num=(v,a,b,d)=>Number.isFinite(+v)?Math.min(b,Math.max(a,+v)):d;
/* ===== PvP abierto (v148): solo con el Premium Cazador PvP, fuera de ciudades y mazmorras. Daño = % de la vida del rival, ajustado por poder. ===== */
function pvSet(p,m){const now=Date.now();
 if(m.on){
  if(p.lv<CFG.pvMin)return send(p.ws,{t:'wpv',on:0,e:'El PvP se abre en el nivel '+CFG.pvMin});
  if(p.city||p.dg)return send(p.ws,{t:'wpv',on:0,e:'No puedes activar el PvP en ciudades ni mazmorras'});
  p.pvp=1;return send(p.ws,{t:'wpv',on:1})}
 if(now-(p.pvc||0)<15000)return send(p.ws,{t:'wpv',on:1,e:'En combate: espera 15 s sin pelear para apagar el PvP'});
 p.pvp=0;p.lp=null;send(p.ws,{t:'wpv',on:0})}
function pvHit(p,m){const now=Date.now();if(!p.pvp||p.hp<=0||p.city||p.dg)return;const q=PL.get(String(m.u||''));
 if(!q||q===p||!q.pvp||q.hp<=0||q.city||q.dg)return;if(Math.hypot(p.x-q.x,p.y-q.y)>CFG.prng)return;
 p.ptok=Math.min(CFG.phMax*2,(p.ptok||CFG.phMax)+(now-(p.ptt||now))/1000*CFG.phMax);p.ptt=now;if(p.ptok<1)return;p.ptok--;
 const w=num(m.w,.3,4,1),k=Math.min(2,Math.max(.5,Math.sqrt(Math.max(1,p.pw||1)/Math.max(1,q.pw||1)))),dm=Math.max(1,Math.round(q.mhp*CFG.pct*w*k));
 q.hp-=dm;p.pvc=q.pvc=now;q.lp={by:p.uid,t:now};send(q.ws,{t:'wpd',d:dm,by:p.uid,nm:p.nm});send(p.ws,{t:'wph',u:q.uid,d:dm})}
const PVPAIR=new Map();
function pvDie(p){const now=Date.now(),lp=p.lp;if(!lp||now-lp.t>20000||now-(p.pvdT||0)<5000)return;p.pvdT=now;p.lp=null;
 const kp=PL.get(lp.by),pk=lp.by+'>'+p.uid,fresh=now-(PVPAIR.get(pk)||0)>600000;PVPAIR.set(pk,now);let r=null;
 if(X.kill)try{r=X.kill(lp.by,p.uid,fresh,kp?kp.nm:'')}catch(e){log('pvp kill error '+e.message)}
 if(kp)send(kp.ws,{t:'wpk',v:p.nm,r});send(p.ws,{t:'wpk',by:kp?kp.nm:'un cazador',me:1})}
/* ===== COLISEO (v276): arena abierta, todos contra todos, vida igualada, zona que se cierra ===== */
const ARC={fee:1000,min:2,max:16,lobby:40000,fight:360000,end:7000,hp:1000,burn:.05,safe:50000,rmax:470,rmin:90,zone:.06};
const AR={st:'idle',ids:new Set(),pot:0,lobEnd:0,t0:0,cx:0,cy:0,endT:0,res:null,seq:0};
function arP(u){const p=PL.get(u);return p&&p.ar?p:null}
function arAlive(){let n=0;for(const u of AR.ids){const p=PL.get(u);if(p&&p.ar&&!p.aout)n++}return n}
function arSend(p,m){send(p.ws,m)}
function arBc(m){for(const u of AR.ids){const p=PL.get(u);if(p&&p.ar)send(p.ws,m)}}
function arRad(now){if(AR.st!=='fight')return ARC.rmax;const t=now-AR.t0;if(t<=ARC.safe)return ARC.rmax;const k=Math.min(1,(t-ARC.safe)/(ARC.fight*.82-ARC.safe));return Math.round(ARC.rmax+(ARC.rmin-ARC.rmax)*k)}
function arStatus(p){return{t:'wc',q:1,st:AR.st,n:AR.ids.size,max:ARC.max,min:ARC.min,left:AR.st==='lobby'?Math.max(0,AR.lobEnd-Date.now()):AR.st==='fight'?Math.max(0,AR.t0+ARC.fight-Date.now()):0,fee:ARC.fee,me:p&&p.ar?1:0}}
function arClear(p){p.ar=0;p.aout=0;p.ahp=0;p.lp=null;if(p.pvp){p.pvp=0}p.hp=100;p.mhp=100}
function arLeave(u,why){const p=PL.get(u);if(!AR.ids.has(u)){if(p)arClear(p);return}
 if(AR.st==='lobby'||AR.st==='idle'){AR.ids.delete(u);AR.pot=Math.max(0,AR.pot-ARC.fee);if(p&&!p.aout&&X.pay)try{X.pay(u,ARC.fee,'🏛️ Reembolso de la entrada al Coliseo (+'+ARC.fee+' 🪙)')}catch(e){}
  if(p){arClear(p);send(p.ws,{t:'wc',x:1})}
  if(AR.ids.size<ARC.min&&AR.st==='lobby'){AR.st='idle'}return}
 if(AR.st==='fight'&&p&&!p.aout){arOut(p,null,'abandonó')}
 AR.ids.delete(u);if(p){arClear(p);send(p.ws,{t:'wc',x:1})}if(AR.st==='fight')arCheck()}
function arOut(q,by,why){if(q.aout)return;q.aout=1;q.pvp=0;q.ahp=0;q.hp=0;const kp=by&&PL.get(by);q.aplace=arAlive()+1;
 send(q.ws,{t:'wco',by:kp?kp.nm:'',why:why||'',pos:q.aplace});if(kp)send(kp.ws,{t:'wck',v:q.nm});
 arBc({t:'wcm',m:'☠️ '+q.nm+(kp?' cayó ante '+kp.nm:' fue eliminado')+' · quedan '+arAlive()})}
function arCheck(){if(AR.st!=='fight')return;if(arAlive()<=1)arEnd('last')}
function arStart(now){AR.st='fight';AR.t0=now;for(const u of AR.ids){const p=PL.get(u);if(!p||!p.ar){AR.ids.delete(u);continue}p.ahp=ARC.hp;p.aout=0;p.pvp=1;p.hp=ARC.hp;p.mhp=ARC.hp;p.lp=null}
 arBc({t:'wcm',m:'⚔️ ¡COMIENZA EL COMBATE! '+AR.ids.size+' gladiadores · '+Math.round(ARC.fight/60000)+' min'})}
function arEnd(why){if(AR.st!=='fight')return;const now=Date.now();let best=[],bh=-1;for(const u of AR.ids){const p=PL.get(u);if(!p||!p.ar||p.aout)continue;if(p.ahp>bh+.5){bh=p.ahp;best=[p]}else if(Math.abs(p.ahp-bh)<=.5)best.push(p)}
 const pot=AR.pot,prize=Math.floor(pot*(1-ARC.burn)),each=best.length?Math.floor(prize/best.length):0;
 for(const w of best){if(each>0&&X.pay)try{X.pay(w.uid,each,'🏛️ ¡Ganaste el Coliseo! (+'+each+' 🪙)')}catch(e){}}
 const names=best.map(p=>p.nm);AR.res={w:names,prize:each,pot,why};AR.st='end';AR.endT=now+ARC.end;
 for(const u of AR.ids){const p=PL.get(u);if(p&&p.ar)send(p.ws,{t:'wce',w:names,prize:each,pot,why,win:best.includes(p)?1:0,burn:Math.round(pot*ARC.burn)});if(p)p.pvp=0}}
function arTick(){const now=Date.now();
 if(AR.st==='idle'){if(AR.ids.size>=ARC.min){AR.st='lobby';AR.lobEnd=now+ARC.lobby}}
 else if(AR.st==='lobby'){for(const u of [...AR.ids]){const p=PL.get(u);if(!p||!p.ar){AR.ids.delete(u);AR.pot=Math.max(0,AR.pot-ARC.fee)}}
  if(AR.ids.size<ARC.min){AR.st='idle'}else if(AR.ids.size>=ARC.max||now>=AR.lobEnd)arStart(now)}
 else if(AR.st==='fight'){const R=arRad(now),dt=.5;
  for(const u of [...AR.ids]){const p=PL.get(u);if(!p||!p.ar){if(AR.ids.has(u)){AR.ids.delete(u)}continue}if(p.aout)continue;
   if(AR.cx&&Math.hypot(p.x-AR.cx,p.y-AR.cy)>R){p.ahp-=ARC.hp*ARC.zone*dt;p.lp=p.lp&&now-p.lp.t<20000?p.lp:null;if(p.ahp<=0){arOut(p,p.lp&&p.lp.by,'zona')}}
   p.hp=Math.max(0,p.ahp);p.mhp=ARC.hp;p.pvp=p.aout?0:1}
  if(arAlive()<=1)arEnd('last');else if(now>=AR.t0+ARC.fight)arEnd('time')}
 else if(AR.st==='end'){if(now>=AR.endT){for(const u of AR.ids){const p=PL.get(u);if(p){arClear(p);send(p.ws,{t:'wc',x:1})}}AR.ids.clear();AR.pot=0;AR.st='idle';AR.res=null}}
 const left=AR.st==='fight'?Math.max(0,AR.t0+ARC.fight-now):AR.st==='lobby'?Math.max(0,AR.lobEnd-now):0,R=arRad(now),al=arAlive();
 for(const u of AR.ids){const p=PL.get(u);if(!p||!p.ar)continue;send(p.ws,{t:'wcs',st:AR.st,left,r:R,cx:AR.cx,cy:AR.cy,al,tot:AR.ids.size,hp:Math.round(Math.max(0,p.ahp||ARC.hp)),mhp:ARC.hp,out:p.aout?1:0,pot:AR.pot,max:ARC.max,min:ARC.min})}}
setInterval(()=>{try{arTick()}catch(e){log('arena error '+e.message)}},500);
function arHit(p,m){const now=Date.now();if(AR.st!=='fight'||!p.ar||p.aout)return;const q=PL.get(String(m.u||''));if(!q||q===p||!q.ar||q.aout||!(q.ahp>0))return;if(Math.hypot(p.x-q.x,p.y-q.y)>CFG.prng)return;
 p.ptok=Math.min(CFG.phMax*2,(p.ptok||CFG.phMax)+(now-(p.ptt||now))/1000*CFG.phMax);p.ptt=now;if(p.ptok<1)return;p.ptok--;
 const w=num(m.w,.3,4,1),dm=Math.max(1,Math.round(ARC.hp*CFG.pct*w));q.ahp-=dm;q.hp=Math.max(0,q.ahp);q.lp={by:p.uid,t:now};send(p.ws,{t:'wph',u:q.uid,d:dm});send(q.ws,{t:'wcd',d:dm,by:p.nm,hp:Math.round(Math.max(0,q.ahp))});if(q.ahp<=0){arOut(q,p.uid,'golpe');arCheck()}}
function arMsg(p,m){const u=p.uid;
 if(m.t==='wcq')return send(p.ws,arStatus(p));
 if(m.t==='wcl')return arLeave(u,'sale');
 if(m.t==='wcj'){if(p.ar)return send(p.ws,Object.assign(arStatus(p),{ok:1}));
  if(AR.st==='fight'||AR.st==='end')return send(p.ws,{t:'wc',e:'Hay un combate en curso. Entra al siguiente'+(AR.st==='fight'?' (faltan '+Math.ceil(Math.max(0,AR.t0+ARC.fight-Date.now())/1000)+' s máx.)':'')});
  if(AR.ids.size>=ARC.max)return send(p.ws,{t:'wc',e:'La arena está llena'});if(p.dg)return send(p.ws,{t:'wc',e:'Sal de la mazmorra primero'});
  if(!(X.fee&&X.fee(u,ARC.fee)))return send(p.ws,{t:'wc',e:'Necesitas '+ARC.fee+' 🪙 para la entrada'});
  p.ar=1;p.aout=0;p.ahp=ARC.hp;p.hp=ARC.hp;p.mhp=ARC.hp;p.pvp=0;AR.ids.add(u);AR.pot+=ARC.fee;if(!AR.cx&&m.cx&&m.cy){AR.cx=num(m.cx,0,W*T,0);AR.cy=num(m.cy,0,H*T,0)}
  send(p.ws,Object.assign(arStatus(p),{ok:1}))}}
function handle(ws,m){const u=ws.uid,now=Date.now();let p=PL.get(u);
 if(m.t==='wj'){const old=p;p={uid:u,ws,nm:String(m.nm||'').replace(/[^\p{L}\p{N} '-]/gu,'').slice(0,20)||'Viajero',c:num(m.c,0,7,0)|0,lv:num(m.lv,1,9999,1)|0,gt:String(m.gt||'').slice(0,4),bs:String(m.bs||'').slice(0,12),cz:Array.isArray(m.cz)?m.cz:[0,0,0],x:num(m.x,0,W*T,0),y:num(m.y,0,H*T,0),hp:100,mhp:100,mt:now,tok:0,tt:now,rc:[],dk:new Set(),ct:old?old.ct:{dm:0,tk:0,ut:0}};if(old&&old.ar&&AR.ids.has(u)){p.ar=old.ar;p.aout=old.aout;p.ahp=old.ahp;p.hp=old.hp;p.mhp=old.mhp;p.pvp=old.pvp;p.dg=old.dg;p.lp=old.lp}p.city=inCity(p.x,p.y);PL.set(u,p);send(ws,{t:'wi',tick:CFG.tick,n:J.mobs.length,sg:WSIG});try{X.tjoin&&X.tjoin(u)}catch(e){}return}
 if(!p||p.ws!==ws)return;
 if(m.t==='wcq'||m.t==='wcj'||m.t==='wcl')return arMsg(p,m);
 if(m.t==='wm'){const x=num(m.x,0,W*T,p.x),y=num(m.y,0,H*T,p.y),dt=Math.min(2,Math.max(.05,(now-p.mt)/1000)),d=Math.hypot(x-p.x,y-p.y),tp=m.tp&&(inCity(x,y)||(J.tpd||[]).some(t=>Math.hypot(x-t.x,y-t.y)<300))&&now-(p.tpT||0)>3000;
  if(m.dg){p.dg=1;p.uw=m.uw?1:0;p.x=x;p.y=y;p.mt=now;if(!p.ar){p.mhp=num(m.mhp,1,1e7,p.mhp);p.hp=num(m.hp,0,p.mhp,p.hp)}return}const wasDg=p.dg;p.dg=0;p.uw=0;p.pl=-1;
  if(wasDg&&!psolid(x,y,u)){p.x=x;p.y=y;p.mt=now;return}
  const fly=!!(m.fl&&X.gm&&X.gm(u));if(!fly&&((d>CFG.speed*dt+48&&!tp)||psolid(x,y,u))){send(ws,{t:'wp',x:p.x,y:p.y});return}if(tp)p.tpT=now;
  p.x=x;p.y=y;p.mt=now;p.mhp=num(m.mhp,1,1e7,p.mhp);p.hp=num(m.hp,0,p.mhp,p.hp);p.lv=X.lv&&X.lv(u)?X.lv(u):num(m.lv,1,9999,p.lv)|0;p.city=inCity(x,y);p.pw=num(m.pw,1,1e13,p.pw||1);if(p.hp<=0&&p.lp)pvDie(p);return}
 if(m.t==='wh'){if(!p.dg)hits(p,m.h)}
 if(m.t==='wup'){if(p.uw){p.pl=num(m.p,-1,7,-1)|0;p.plT=now}return}
 if(m.t==='wub')return ubHit(p,m);
 if(m.t==='wpv')return pvSet(p,m);
 if(m.t==='wph')return p.ar?arHit(p,m):pvHit(p,m);
 if(m.t==='wdie')return pvDie(p);
 if(m.t==='wa'){if(now-(p.atT||0)<80)return;p.atT=now;AT.push([u,num(m.k,0,7,0)|0,Math.round(num(m.a,-7,7,0)*100)/100,Math.round(p.x),Math.round(p.y),p.dg?1:0,String(m.ty||'').replace(/[^a-z]/g,'').slice(0,8),num(m.r,0,400,0)|0,p.ar?1:0])}}   /* v145: también habilidades y también dentro de mazmorras (solo para tu party) */

/* ===== v153: MOBS DINÁMICOS COMPARTIDOS (cazadores de la noche, hordas de evento, Hombres Lobo). Los crea y mueve el servidor: todos ven lo mismo. ===== */
const DYL=[],HPT=[30,100,220,420,750,1600,2800,4600,7500],REC=t=>Math.round(t*3.5)+1;
const DYV={ /* variante: [mult. vida, mult. velocidad, mult. daño, recompensa, nivel extra, nombre] (copiado de las tablas del cliente) */
 wolfN:[2.4,1.55,2,2.5,2,'Lobo nocturno'],wolfA:[6,1.6,2.8,4,4,'Lobo alfa'],vampH:[4,1.25,3,4,4,'Vampiro cazador'],vampL:[8,1.35,4,6,6,'Vampiro ancestral'],assN:[2,1.5,3.4,3,3,'Asesino de la noche'],batN:[1,1.7,1.8,1.5,1,'Murciélago de sangre'],
 ghostR:[1.8,1.25,2,2.5,2,'Espectro sangriento'],zombP:[3.5,.8,1.6,2,1,'Zombi pútrido'],skelB:[2.2,1.1,1.8,2,1,'Esqueleto gélido'],jackM:[3,1.5,2.1,3,2,'Calabaza asesina'],jackG:[7,.85,3,5,4,'Calabaza gigante'],jackS:[4.5,1.3,2.8,4,3,'Calabaza espectral'],
 batV:[1.2,1.15,1.5,1.5,0,'Murciélago vampiro'],devil:[4.5,1.4,3.2,4,4,'Diablillo infernal'],reapB:[3,1.15,2.4,3,3,'Segador abisal'],cwardenR:[5,.95,2.2,3,3,'Guardián carmesí'],wwolf:[1,1.25,3.6,30,9,'Hombre Lobo'],
 reap:[2.5,1.1,2,1,0,''],jack:[1.3,1,1.2,1,0,''],ghost:[.7,1.1,1,1,0,''],zomb:[1.4,.8,1.1,1,0,''],skel:[1,1,1.2,1,0,''],snow:[1,1.05,1,1,0,''],elf:[.7,1.2,.9,1,0,''],reno:[1.2,1.3,1.1,1,0,''],lion:[1.5,1.1,1.4,1,0,''],cupid:[.6,1.3,1,1,0,''],silk:[.5,.8,.7,1,0,''],thief:[.8,1.15,.9,1,0,''],bandit:[1,1,1,1,0,''],assassin:[.6,1.25,1.7,1,0,'']};
const HWD=[['zombP',.3],['skelB',.24],['ghostR',.18],['jackM',.2],['jackS',.08],['batV',.08]],HWN=[['vampH',.14],['devil',.16],['reapB',.09],['vampL',.05],['cwardenR',.04],['zombP',.15],['jackM',.15],['jackG',.06],['ghostR',.12],['wolfN',.1]];
const EVV={nv:[['snow',.4],['elf',.35],['reno',.25]],lu:[['lion',.6],['assassin',.4]],am:[['cupid',.7],['thief',.3]],nz:[['silk',.85],['bandit',.15]]};
const LNY={2026:[2,17],2027:[2,6],2028:[1,26],2029:[2,13],2030:[2,3],2031:[1,23],2032:[2,11]};
const pick=l=>{let r=Math.random();for(const[v,q]of l){if(r<q)return v;r-=q}return l[0][0]};
const dr=()=>new Date(Date.now()-4*36e5),drH=()=>{const d=dr();return d.getUTCHours()+d.getUTCMinutes()/60};
const nightF=h=>(h>=19.5||h<5.5)?1:h>=17.5?Math.pow((h-17.5)/2,1.3):h<7?Math.pow((7-h)/1.5,1.3):0;
function evNow(){const d=dr(),y=d.getUTCFullYear(),t=d.getTime(),M=(m,dd,h)=>Date.UTC(y,m-1,dd,h||0),inr=(a,b)=>a[0]>b[0]?(t>=M(a[0],a[1])||t<=M(b[0],b[1],23)):(t>=M(a[0],a[1])&&t<=M(b[0],b[1],23));
 if(process.env.DY_EV)return process.env.DY_EV==='off'?'':process.env.DY_EV;if(inr([10,16],[11,2]))return'hl';if(inr([12,15],[1,6]))return'nv';if(inr([2,10],[2,15]))return'am';if(inr([3,18],[3,25]))return'nz';const l=LNY[y];if(l){const c=M(l[0],l[1]);if(t>=c-2*864e5&&t<c+15*864e5)return'lu'}return''}
const hlFull=()=>{const d=dr(),m=d.getUTCMonth()+1,dd=d.getUTCDate();return process.env.DY_NIGHT?1:((m===10&&dd>=30)||(m===11&&dd<=2))};
const egCap=L=>L<=8?L+1:L<=24?L+1+Math.floor((L-8)*.75):1e9;
const sD=(lv,m)=>{lv=lv|0||1;const nb=m.nv||REC(Math.min(8,m.ty|0)),c=egCap(lv);return(.45+.55*Math.max(0,Math.min(1,(lv-1)/19)))*(c>=nb?1:Math.pow(c/nb,.6))};
let dyN=0;const dyId=()=>{for(let k=0;k<6000;k++){dyN=(dyN+1)%6000;const id=J.mobs.length+dyN;if(!BY.has(id))return id}return-1};
function dyDel(m){const i=DYL.indexOf(m);if(i>=0)DYL.splice(i,1);BY.delete(m.id)}
function dyAdd(v,ty,x,y,o){o=o||{};if(DYL.length>=260)return null;const id=dyId();if(id<0)return null;const q=DYV[v]||[1,1,1,1,0,''];ty=Math.max(0,Math.min(8,ty|0));
 const m={id,x,y,ty,mx:o.hp||Math.max(1,Math.round(HPT[ty]*q[0])),sp:(66+ty*2.5)*.75*q[1]*(o.spm||1),hx:x,hy:y,rw:o.rw||q[3],dm:o.dm!=null?o.dm:(5+3*ty)*q[2],dead:0,rt:0,t:0,tg:null,dmg:{},dyn:1,v,nm:o.nm!=null?o.nm:q[5],sc:o.sc||0,nv:REC(ty)+q[4],k:o.k||'wave',sf:o.sf?1:0,ag:o.ag,vw:o.vw,ls:o.ls,rg:o.rg,rz:o.rz||0,gx:o.gx||0,exp:o.exp||0};m.hp=m.mx;DYL.push(m);BY.set(id,m);return m}
const tierNear=(x,y)=>{let b=1e9,t=0;for(const m of near(x,y,500)){const d=Math.hypot(m.x-x,m.y-y);if(d<b){b=d;t=m.ty}}return t};
function ringPos(p,r){for(let k=0;k<24;k++){const a=Math.random()*6.283,rr=r*(.7+Math.random()*.5),x=p.x+Math.cos(a)*rr,y=p.y+Math.sin(a)*rr;if(!solid(x,y)&&!inCity(x,y)&&!solid(x+14,y)&&!solid(x-14,y))return[x,y]}return null}
const wwPos=(()=>{let o=null;return()=>{if(o)return o;o=[];let s=(31101981+new Date().getFullYear()*7919)>>>0;const rn=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
 for(let k=0;k<60000&&o.length<30;k++){const m=L[Math.floor(rn()*L.length)];if(!m||m.ty<2||inCity(m.hx,m.hy)||solid(m.hx,m.hy))continue;if(o.some(q=>Math.hypot(q.x-m.hx,q.y-m.hy)<(k<30000?34:18)*T))continue;o.push({x:m.hx,y:m.hy,ty:m.ty})}return o}})();
const wwOn=()=>{if(process.env.WW_FORCE)return true;if(evNow()!=='hl')return false;const h=drH();return h>=20||h<2};
function wwSync(){const on=wwOn(),cur=DYL.filter(m=>m.k==='ww');if(!on){for(const m of cur)dyDel(m);return}if(cur.length)return;
 for(const q of wwPos())dyAdd('wwolf',q.ty,q.x,q.y,{k:'ww',hp:20000,sc:10,rz:900000,gx:900+q.ty*350+350,ag:380,vw:900,ls:800,rg:70})}
function hunters(p,now){if(p.dg||p.city||p.hp<=0||p.lv<1)return;const f=Math.max(0,Math.min(1,((p.lv|0)-5)/32));
 if(now<(p.nht||0))return;p.nht=now+((60-34*f)+Math.random()*(30-8*f))*1000;
 let al=0;for(const m of DYL)if(m.k==='hunt'&&!m.dead&&Math.hypot(m.x-p.x,m.y-p.y)<1800)al++;if(al>=(f<.25?4:14))return;
 const ti=Math.min(8,tierNear(p.x,p.y)+1,Math.max(1,Math.round(((p.lv|0)-1)/3.5)+1)),kind=ti>=4&&Math.random()<.5?'v':Math.random()<.3?'a':'w',HM=2.4+ti*.25,HD=1.5+ti*.08;
 let list=kind==='w'?['wolfA','wolfA','wolfN','wolfN','wolfN','wolfN']:kind==='v'?['vampH','vampH','vampH','batN','batN','batN']:['assN','assN','assN','ghostR','ghostR','batN'];list=list.slice(0,f<.25?3:f<.6?4:6);
 const pos=ringPos(p,1020);if(!pos)return;let n=0;
 list.forEach((v,i)=>{const q=DYV[v],ty=Math.min(8,ti),bh=HPT[ty]*q[0],fh=Math.round(bh*HM*(i===0?1.8:1)),wh=Math.round(HPT[0]*(i===0?2.2:1.3)),hp=Math.round(wh+(fh-wh)*f),fdm=q[2]*HD*(i===0?1.3:1),wd=.25*(i===0?1.2:1),dm=(5+3*ty)*(wd+(fdm-wd)*f);
  const m=dyAdd(v,ty,pos[0]+(i%2)*60-30,pos[1]+((i>>1)*60)-30,{k:'hunt',hp,dm,spm:1.04+.08*f,ag:1100,vw:1500,ls:3000,exp:now+25*60*1000});if(m)n++});
 if(f>=.35&&Math.random()<.2){const v=kind==='v'?'vampH':'wolfA',q=DYV[v],ty=Math.min(8,ti);dyAdd(v,ty,pos[0],pos[1]-30,{k:'hunt',hp:Math.round(HPT[ty]*q[0]*HM*3.2),dm:(5+3*ty)*q[2]*HD*.9,spm:1.3,nm:'Alfa de la noche',ag:1100,vw:1500,ls:3000,exp:now+25*60*1000})}
 if(n)send(p.ws,{t:'note',m:'🐺 Se oye un aullido cerca...'})}
function waves(p,ev,now){if(p.dg||p.city||p.hp<=0)return;const hl=ev==='hl',gap=(hl?30:70)*1000;if(now<(p.nwv||0))return;p.nwv=now+gap;
 const cap=hl?4:5,night=hl&&nightF(drH())*(hlFull()?1:.35)>.3;let al=0;for(const m of DYL)if(m.k==='wave'&&!m.dead&&Math.hypot(m.x-p.x,m.y-p.y)<1600)al++;if(al>=cap)return;
 const tier=tierNear(p.x,p.y),n=hl?Math.max(1,Math.min(2+(night&&Math.random()<.4?1:0),cap-al)):Math.min(3,cap-al);if(n<1)return;let c=0;
 for(let i=0;i<n;i++){const pos=ringPos(p,460);if(!pos)continue;const ty=Math.min(8,tier+(Math.random()<.25?1:0)),v=hl?pick(night?HWN:HWD):pick(EVV[ev]||[['bandit',1]]);if(dyAdd(v,ty,pos[0],pos[1],{k:'wave',sf:1,ag:520,vw:900,ls:1400,exp:now+12*60*1000}))c++}}
let dyT=0;
function dyTick(){const now=Date.now();if(now<dyT)return;dyT=now+1000;if(!PL.size){for(const m of DYL.filter(m=>m.k!=='ww'))dyDel(m);wwSync();return}
 const ev=evNow(),night=!!process.env.DY_NIGHT||nightF(drH())>=.5;
 for(const m of DYL.slice()){if(m.k==='ww')continue;if((m.exp&&now>m.exp)||(m.k==='hunt'&&!(night&&hlFull()))||(m.k==='wave'&&!ev)){dyDel(m);continue}
  let near_=false;for(const p of PL.values())if(!p.dg&&Math.hypot(m.x-p.x,m.y-p.y)<2600){near_=true;break}if(!near_&&!m.dead){m.far=(m.far||now);if(now-m.far>60000)dyDel(m)}else m.far=0}
 wwSync();
 for(const p of PL.values()){if(night&&hlFull()&&ev==='hl')hunters(p,now);if(ev)waves(p,ev,now)}}
setInterval(()=>{try{dyTick()}catch(e){log('dyn error '+e.message)}},500);
/* ===== v264: Portón de Fuego del Submundo (8 placas) y Balor (20M PV compartidos) ===== */
const UBN=Math.max(1,Math.min(8,+process.env.UB_PLATES||8)),popc=m=>{let n=0;for(;m;m&=m-1)n++;return n},UBM=20e6,UBCD=20*60*1000,UBS={open:0,hold:0,hp:UBM,dead:0,cd:0,closeAt:0,tOpen:0,mask:0,empty:0,dmg:new Map()};
function ubHit(p,m){const now=Date.now();if(!p.uw||!UBS.open||UBS.dead||p.hp<=0)return;const d=num(m.d,0,UBM*.03,0);if(!(d>0))return;if(now-(p.ubT||0)<50)return;p.ubT=now;
 if(now-(p.ubW||0)>1000){p.ubW=now;p.ubS=0}p.ubS=(p.ubS||0)+d;if(p.ubS>3e6)return;
 UBS.hp-=d;UBS.dmg.set(p.uid,(UBS.dmg.get(p.uid)||0)+d);if(UBS.hp<=0){UBS.hp=0;ubKill(now)}}
function ubKill(now){UBS.dead=1;UBS.open=1;UBS.cd=now+UBCD;UBS.closeAt=now+90000;
 for(const [u,d] of UBS.dmg){const p=PL.get(u);if(p&&p.uw&&d>=UBM*.003)send(p.ws,{t:'wubd',s:Math.round(d/UBM*1000)/10})}
 log('mundo: Balor derrotado ('+UBS.dmg.size+' participantes)');UBS.dmg=new Map()}
function ubReset(){UBS.open=0;UBS.hold=0;UBS.hp=UBM;UBS.dmg=new Map()}
function ubStep(now,dt){const ups=[];for(const p of PL.values())if(p.uw&&p.hp>0)ups.push(p);
 let mask=0;for(const p of ups)if(p.pl>=0&&p.pl<8&&now-(p.plT||0)<1500)mask|=1<<p.pl;UBS.mask=mask;
 if(!ups.length){if(!UBS.empty)UBS.empty=now;if(UBS.open&&!UBS.dead&&now-UBS.empty>120000)ubReset();if(UBS.hold)UBS.hold=0}else UBS.empty=0;
 if(UBS.dead&&now>UBS.closeAt&&UBS.open){UBS.open=0;UBS.hold=0}
 if(UBS.dead&&now>UBS.cd){UBS.dead=0;ubReset()}
 if(!UBS.open&&!UBS.dead){if(popc(mask)>=UBN){UBS.hold+=dt;if(UBS.hold>=3){UBS.open=1;UBS.hold=0;UBS.hp=UBM;UBS.dmg=new Map();UBS.tOpen=now;log('mundo: el Portón de Fuego se abrió')}}else UBS.hold=Math.max(0,UBS.hold-dt*2)}
 if(UBS.open&&!UBS.dead&&now-UBS.tOpen>40*60*1000)ubReset()}
const UBUD=now=>[UBS.mask,Math.round(UBS.hold*10),UBS.open?1:0,Math.round(UBS.hp),UBM,UBS.dead?1:0,UBS.dead?Math.max(0,Math.ceil((UBS.cd-now)/1000)):0];
setInterval(()=>{const now=Date.now();step(CFG.tick/1000,now);try{ubStep(now,CFG.tick/1000)}catch(e){log('ub error '+e.message)}
 for(const p of PL.values()){const pl=[];for(const q of PL.values()){if(q===p)continue;const aa=p.ar&&q.ar;if(!aa&&Math.hypot(q.x-p.x,q.y-p.y)>CFG.pview)continue;if(!aa&&(!!q.dg!==!!p.dg||(q.dg&&!(p.uw&&q.uw)&&!(pid(q.uid)&&pid(q.uid)===pid(p.uid)))))continue;pl.push([q.uid,q.nm,q.c,q.lv,Math.round(q.x),Math.round(q.y),Math.round(q.hp),Math.round(q.mhp),pid(q.uid)?1:0,q.gt||'',q.bs||'',q.pvp?1:0,q.wn?1:0])}
  const mb=[];let dd=null,dx=null;if(!p.dg){for(const m of near(p.x,p.y,CFG.sview+CFG.leash))if(Math.hypot(m.x-p.x,m.y-p.y)<=CFG.sview)mb.push([m.id,Math.round(m.x),Math.round(m.y),Math.round(m.hp),m.dead?1:0]);
   for(const m of DYL)if(Math.hypot(m.x-p.x,m.y-p.y)<=CFG.sview){mb.push([m.id,Math.round(m.x),Math.round(m.y),Math.round(m.hp),m.dead?1:0]);if(!p.dk.has(m.id)){p.dk.add(m.id);(dd=dd||[]).push([m.id,m.v,m.nm||'',m.ty,m.mx,m.sc||0,Math.round(m.hx),Math.round(m.hy),Math.round(m.hp),Math.round(m.x),Math.round(m.y)])}}
   for(const id of p.dk){const m=BY.get(id);if(!m||!m.dyn||Math.hypot(m.x-p.x,m.y-p.y)>CFG.sview*1.15){p.dk.delete(id);(dx=dx||[]).push(id)}}}
  else if(p.dk.size){dx=[...p.dk];p.dk.clear()}
  const hv=EV.filter(e=>e[2]!==p.uid&&Math.hypot(e[3]-p.x,e[4]-p.y)<=CFG.sview).slice(0,30),at=AT.filter(a=>a[0]!==p.uid&&(a[5]?((p.dg&&pid(a[0])&&pid(a[0])===pid(p.uid))||(p.ar&&a[8])):!p.dg)&&Math.hypot(a[3]-p.x,a[4]-p.y)<=(p.ar&&a[8]?4000:CFG.pview)).slice(0,40);
  const o={t:'ws',pl,mb};if(p.uw)o.ud=UBUD(now);if(dd)o.dd=dd;if(dx)o.dx=dx;if(hv.length)o.hv=hv;if(at.length)o.at=at;send(p.ws,o)}EV=[];AT=[]},CFG.tick);
log('mundo cargado: '+L.length+' enemigos, '+W+'x'+H+' casillas');
setInterval(()=>{for(const p of PL.values()){try{p.wn=X.wanted&&X.wanted(p.uid)?1:0;}catch(e){}}},5000);
return{strSet:(i,k,g,pass)=>{STRS.set(i,{k,g,pass})},strDel:i=>{STRS.delete(i)},strClear:()=>STRS.clear(),bcast:m=>{for(const p of PL.values())send(p.ws,m)},tsolid:(x,y)=>solid0(x*T+1,y*T+1),
 mobsOff:rects=>{for(const m of L)if(rects.some(r=>m.hx/T>=r[0]&&m.hx/T<r[2]&&m.hy/T>=r[1]&&m.hy/T<r[3])){m.dead=1;m.hp=0;m.rt=Infinity;m.tg=null;m.dmg={}}},dyn:()=>DYL,where:u=>{const p=PL.get(u);return p?{x:Math.round(p.x),y:Math.round(p.y),city:p.city?1:0,dg:p.dg?1:0,pvp:p.pvp?1:0}:null},handle,leave:(u,ws)=>{const p=PL.get(u);if(p&&p.ws===ws){try{if(AR.ids.has(u)){if(AR.st==='fight'&&!p.aout){arOut(p,null,'desconectó');AR.ids.delete(u);arCheck()}else if(AR.st==='lobby'||AR.st==='idle'){arLeave(u)}else AR.ids.delete(u)}}catch(e){}PL.delete(u)}},credit:(u,k,v)=>{const p=PL.get(u);if(p)p.ct[k]+=v},stats:()=>({players:PL.size,mobs:L.length})}};
