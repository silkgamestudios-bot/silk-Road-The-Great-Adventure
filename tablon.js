'use strict';
/* v398 · TABLÓN DE LA RUTA — misiones globales «gana el primero».
   · 600 misiones al día (se renuevan a medianoche, hora de RD), ordenadas por esfuerzo estimado: cada una es más difícil que la anterior.
   · Las genera el servidor con una semilla del día: todos ven lo mismo. La primera persona que cumple una se la lleva y desaparece para los demás.
   · Tipos: 0 = bajas (monstruos derrotados hoy; los cuenta el servidor), 1 = entrega de materiales (se descuentan de la cuenta),
           2 = búsqueda (pista con coordenadas aproximadas; el servidor sabe dónde está la persona y responde frío/caliente).
   · Premio: un Cofre del Tablón del nivel de la misión + una Llave del Tablón (siempre en búsqueda, ~45 % en las demás).
     Cofres y llaves viven en la cuenta (a.tb), en el servidor: no son objetos, no se pueden vender ni cambiar. Dentro del cofre: oro (máx. 200.000),
     bolas de buff (tiempo de Bonus), equipo Raro INTRANSFERIBLE y, muy rara vez, VIP de 15 o 30 días. */
module.exports=function(S,E,X){
 X=X||{};
 const ops={},err=e=>({e}),now=()=>Date.now();
 const int=(v,a,b,d)=>{v=Math.floor(+v);return Number.isFinite(v)?Math.min(b,Math.max(a,v)):d};
 const NM=600,MAXC=40,DAY=864e5,GOLDMAX=200000,R_FIND=3.2;
 const dayKey=()=>new Date(Date.now()-4*36e5).toISOString().slice(0,10);
 const dayEnd=()=>{const d=new Date(Date.now()-4*36e5);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+1)+4*36e5};
 const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
 const rng=s=>{let a=s>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
 const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
 const TN=['común','poco común','rara','épica'];
 const TYN=['Rata','Serpiente','Bandido','Goblin','Momia','Orco','Orco berserker','Vampiro','Faraón maldito'];
 /* minutos de caza por baja, según el tipo de monstruo (0 Rata … 8 Faraón) */
 const KP=[.15,.2,.3,.45,.7,1,1.4,1.9,2.6];
 /* materiales que se pueden entregar y minutos aproximados por unidad (clave de provisión, minutos) */
 const EN=[['mad',.25],['pasto',.2],['hierba',.3],['tel',.35],['pat',.4],['carne',.4],['cur',.5],['fi1',.5],['pie',.3],['cob',.6],['fi2',.8],['hie',1],['fi3',1.4],['pla',2],['fi4',3],['cbl',3],['obs',3],['aur',3.5],['cua',3.5],['rub',5],['esm',5],['zaf',5],['mit',6],['tur',7],['mgm',8],['jad',8],['dia',12],['ama',16],['amb',18],['top',20],['esa',45],['cri',55]];
 const tierOf=i=>i<230?0:i<430?1:i<560?2:3;
 /* ───────── generador determinista del día ───────── */
 let REACH=null;
 function reach(){
  if(REACH)return REACH;const W=S.world;if(!W||!W.dim||!W.cities||!W.tsolid)return null;
  const d=W.dim(),w=d.w,h=d.h,m=new Uint8Array(w*h),q=new Int32Array(w*h);let qh=0,qt=0;
  for(const c of W.cities()){let sx=-1,sy=-1;
   for(let r=0;r<12&&sx<0;r++)for(let dy=-r;dy<=r&&sx<0;dy++)for(let dx=-r;dx<=r&&sx<0;dx++){const x=c.tx+dx,y=c.ty+dy;if(x<1||y<1||x>=w-1||y>=h-1)continue;if(!W.tsolid(x,y)){sx=x;sy=y}}
   if(sx>=0&&!m[sy*w+sx]){m[sy*w+sx]=1;q[qt++]=sy*w+sx}}
  while(qh<qt){const v=q[qh++],x=v%w,y=(v/w)|0;
   if(x>0&&!m[v-1]&&!W.tsolid(x-1,y)){m[v-1]=1;q[qt++]=v-1}
   if(x<w-1&&!m[v+1]&&!W.tsolid(x+1,y)){m[v+1]=1;q[qt++]=v+1}
   if(y>0&&!m[v-w]&&!W.tsolid(x,y-1)){m[v-w]=1;q[qt++]=v-w}
   if(y<h-1&&!m[v+w]&&!W.tsolid(x,y+1)){m[v+w]=1;q[qt++]=v+w}}
  return REACH={m,w,h,n:qt}}
 const cityBox=(c,tx,ty,m)=>{const e=c.ex||[0,0,0,0],dx=tx-c.tx-.5,dy=ty-c.ty-.5;return dx>-24.6-e[0]-m&&dx<24.6+e[1]+m&&dy>-18.6-e[2]-m&&dy<15.6+e[3]+m};
 function pickSpot(R,i){
  const f=i/(NM-1),target=24+500*Math.pow(f,1.15),W=S.world,rc=reach();
  if(!rc||!W.cities){return[100+Math.floor(R()*1200),60+Math.floor(R()*760)]}
  const cs=W.cities();let best=null,bd=1e9;
  for(let k=0;k<9000;k++){
   const tx=4+Math.floor(R()*(rc.w-8)),ty=4+Math.floor(R()*(rc.h-8));if(!rc.m[ty*rc.w+tx])continue;
   let dn=1e9;for(const c of cs){const dd=Math.hypot(c.tx-tx,c.ty-ty);if(dd<dn)dn=dd}
   if(dn<32||cs.some(c=>cityBox(c,tx,ty,8)))continue;                 // fuera de toda ciudad (mismo rectángulo que usa el mundo) y con margen
   const gap=Math.abs(dn-target);
   if(gap<bd){bd=gap;best=[tx,ty]}
   if(gap<=Math.max(8,target*.15))return[tx,ty]}
  return best||[Math.floor(rc.w/2),Math.floor(rc.h/2)]}
 let G=null;
 function gen(day){
  if(G&&G.day===day)return G;
  const R=rng(hash('tablon|'+day)),pub=[],sp={};
  for(let i=0;i<NM;i++){
   const f=i/(NM-1),e=2*Math.pow(90,f),ti=tierOf(i),r=R(),ty=r<.42?0:r<.75?1:2,kf=ty===2?1:(hash(day+'|k|'+i)%100<45?1:0);
   if(ty===0){
    const c=Math.floor(i/70),lo=Math.max(0,c-2),hi=Math.min(8,c+1),T=lo+Math.floor(R()*(hi-lo+1)),N=Math.max(3,Math.min(300,Math.round(e/KP[T])));
    pub.push([0,T,N,0,ti,kf,Math.max(1,Math.round(e))])}
   else if(ty===1){
    const cand=[];let tw=0;
    EN.forEach((x,j)=>{const n=e/x[1];if(n<2||n>250)return;const w=1/(1+Math.abs(Math.log(n/16)));cand.push([j,w,n]);tw+=w});
    let rr=R()*tw,pk=cand[0];for(const c of cand){if(rr<c[1]){pk=c;break}rr-=c[1]}
    pub.push([1,pk[0],Math.max(2,Math.round(pk[2])),0,ti,kf,Math.max(1,Math.round(e))])}
   else{
    const s=pickSpot(R,i),HR=14+6*ti,ang=R()*Math.PI*2,rad=HR*(.3+.7*R());
    sp[i]=s;
    const hx=Math.max(2,Math.round(s[0]+Math.cos(ang)*rad)),hy=Math.max(2,Math.round(s[1]+Math.sin(ang)*rad));
    pub.push([2,hx,hy,HR,ti,1,Math.max(1,Math.round(e))])}}
  return G={day,pub,sp}}
 /* ───────── estado persistente ───────── */
 const D=()=>S.DB.tb||(S.DB.tb={day:'',c:{},lg:[],p:{},h:[]});
 function pushAll(msg,except){for(const id of Object.keys(S.ECO.acc)){if(id!==except&&S.online(id))S.push(id,msg)}}
 function roll(){
  const d=D(),dk=dayKey();if(d.day===dk)return d;
  const first=!d.day;
  if(!first){d.h=(d.h||[]);d.h.unshift({day:d.day,n:Object.keys(d.c).length});if(d.h.length>7)d.h.length=7}
  d.day=dk;d.c={};d.lg=[];d.p={};S.dirty();G=null;
  if(!first){try{X.SO&&X.SO.sys('📜 ¡El Tablón de la Ruta se renovó! 600 misiones nuevas, cada una más difícil que la anterior. Abre el Diario → 📜 Tablón.')}catch(e){}pushAll({t:'tbn',day:dk})}
  return d}
 function PS(u){const d=roll();let p=d.p[u];if(!p)p=d.p[u]={k:[0,0,0,0,0,0,0,0,0],cl:0,sT:0,kt:0,kn:0};return p}
 function TA(a){const t=a.tb&&typeof a.tb==='object'?a.tb:(a.tb={});if(!Array.isArray(t.ch))t.ch=[0,0,0,0];if(!Array.isArray(t.ky))t.ky=[0,0,0,0];t.n=t.n|0;t.o=t.o|0;return t}
 const meView=(a,p)=>{const t=TA(a);return{k:p.k.slice(),ch:t.ch.slice(),ky:t.ky.slice(),cl:p.cl,mx:MAXC,n:t.n,o:t.o}};
 /* ───────── recompensas ───────── */
 const RMS=[1,1.6,2.4,3.5],EQLS=[50,75,100,150,200,300,500,700,1000,1200];
 function setStS(it,m){const sl=it.sl,K=it.k;if(sl==0)it.dm=Math.round(5*m);else if(sl==1)it.hp=Math.round(8*m);else if(sl==2){it.hp=Math.round(4*m);it.dm=Math.round(1*m)}else if(sl==3){it.dm=Math.round(2*m);it.hp=Math.round(2*m)}else if(sl==4)it.hp=Math.round(5*m);else if(sl==5)it.sp=Math.round(2*m);else{if(K==2||K==4||K==6)it.mp=Math.round(8*m);else{it.hp=Math.round(3*m);if(K==0)it.gd=Math.round(4*m)}}}
 const IT=[{t:[0,1],li:[0,1,2]},{t:[1,2],li:[2,3,4]},{t:[2,3],li:[4,5,6]},{t:[3,4],li:[6,7,8,9]}];
 function mkItem(u,a,t){
  const d=IT[t],pick=l=>l[Math.floor(Math.random()*l.length)],cls=a.cls>=0&&a.cls<=7?a.cls:-1;
  const sl=Math.floor(Math.random()*7),k=(cls>=0&&Math.random()<.7)?cls:Math.floor(Math.random()*8),tt=pick(d.t),li=pick(d.li);
  const r=t===0?(Math.random()<.65?0:1):1;                       // «poco común» = rareza Raro (la 2.ª de las 4 del juego); nunca más
  const it={sl,t:tt,li,r,k,du:100,rl:EQLS[li],id:E.rid(6),nt:1};setStS(it,RMS[r]*(1+tt*.6));
  S.ECO.reg[it.id]={o:u,k:'i',t:now(),esc:0,nt:1};S.dirty();return it}
 const ORB=[[30,60],[60,120],[120,240],[240,360]],ORBN=['⭐ Experiencia','🪙 Oro','🛡️ Defensa','❤️ Vida'];
 function grantOrb(u,a,bank,min){
  const L=a.bxl,BX=E.BX;if(!L)return 0;const cur=L.x[bank]+Math.max(0,L.t[bank]-L.a[bank]),room=BX.max+2*36e5-cur,add=Math.min(min*6e4,room);
  if(add<6e4)return 0;L.t[bank]+=add;S.dirty();E.pushEnt(u);return Math.round(add/6e4)}
 function grantVip(u,a,d){
  const t=now(),ks=['lt','ap','tr','pv','bh'];
  if(ks.some(z=>Math.max(t,a.px[z]||0)-t+d*DAY>90*DAY)||Math.max(t,a.vip||0)-t+d*DAY>90*DAY)return 0;
  ks.forEach(z=>{a.px[z]=Math.max(t,a.px[z]||0)+d*DAY});a.vip=Math.max(t,a.vip||0)+d*DAY;S.dirty();E.pushEnt(u);return 1}
 const JP=[[400,1500],[1500,6000],[6000,40000],[30000,200000]],GB=[[120,420],[600,2000],[3000,9000],[12000,40000]],VF=[0,0,60000,120000],VIPP=[0,0,.005,.045];
 function openLoot(u,a,t){
  const out=[];let gold=ri(GB[t][0],GB[t][1]);
  const r=Math.random();
  if(r<VIPP[t]){
   const days=Math.random()<.27?30:15;
   if(grantVip(u,a,days))out.push({k:'v',t:'👑 ¡VIP · Plan Jugador de '+days+' días!'});
   else{gold+=VF[t];out.push({k:'g',t:'👑 VIP: ya tienes 90 días acumulados (máximo). Te compensamos con +'+VF[t].toLocaleString('es')+' 🪙'})}}
  else{
   const w=[['o',[38,34,30,26][t]],['i',[20,24,26,26][t]],['k',[10,8,6,5][t]],['j',[32,34,38,43][t]]];
   let x=Math.random()*w.reduce((s,q)=>s+q[1],0),kind='j';for(const q of w){if(x<q[1]){kind=q[0];break}x-=q[1]}
   if(kind==='o'){const bank=ri(0,3),mn=Math.random()<.7?ORB[t][0]:ORB[t][1],g=grantOrb(u,a,bank,mn);
    if(g)out.push({k:'o',t:'🔮 Bola de buff de '+ORBN[bank]+': +'+(g>=60?(g/60).toFixed(g%60?1:0)+' h':g+' min')});
    else{const e=ri(JP[t][0],JP[t][1]);gold+=e;out.push({k:'g',t:'🔮 Tus Bonus están llenos (máx. 22 h): la bola se convirtió en +'+e.toLocaleString('es')+' 🪙'})}}
   else if(kind==='i'){const it=mkItem(u,a,t);E.deliver(u,{item:it,note:'🎁 Cofre del Tablón: equipo Raro intransferible'});out.push({k:'i',t:'🎁 Equipo Raro (intransferible) — míralo en tu mochila 🎒'})}
   else if(kind==='k'){TA(a).ky[t]++;out.push({k:'k',t:'🗝️ ¡Una Llave del Tablón '+TN[t]+' dentro del cofre!'})}
   else{const g=Math.round(JP[t][0]+(JP[t][1]-JP[t][0])*Math.pow(Math.random(),t===3?2.6:2));gold+=g;out.push({k:'g',t:'💰 Bolsa de monedas: +'+g.toLocaleString('es')+' 🪙'})}}
  gold=Math.min(GOLDMAX,gold);
  if(gold>0){E.deliver(u,{gold,note:'📦 Cofre del Tablón ('+TN[t]+'): +'+gold.toLocaleString('es')+' 🪙'});out.unshift({k:'g',t:'🪙 Oro: +'+gold.toLocaleString('es')})}
  return out}
 /* ───────── hooks del mundo ───────── */
 function onKill(u,ty,kind,dyn){
  try{ty=ty|0;if(ty<0||ty>8)return;const a=S.ECO.acc[u];if(!a)return;const p=PS(u),t=now();
   if(t-p.kt>=6e4){p.kt=t;p.kn=0}if(++p.kn>150)return;                 // tope por minuto contra hits fantasma (antes 45: frenaba a quien mata en grupo)
   if(p.k[ty]<9999)p.k[ty]++;S.dirty();
   if(t-(p.kp||0)>1500){p.kp=t;try{S.push(u,{t:'tbk',k:p.k.slice()})}catch(e){}}}catch(e){S.log&&S.log('[tablon] onKill '+e.message)}}
 /* ───────── operaciones ───────── */
 const taken=c=>({e:'¡Te la ganaron! La cumplió '+c.n+' antes que tú.',gone:1,by:c.n});
 function done(u,a,p,d,i,s){
  const T=TA(a),ti=s[4],nm=String(a.nm||'Viajero').slice(0,20);
  d.c[i]={n:nm,t:now(),u};p.cl++;T.ch[ti]++;T.n++;const key=s[5]?1:0;if(key)T.ky[ti]++;
  d.lg.unshift([now(),i,nm,ti]);if(d.lg.length>40)d.lg.length=40;S.dirty();
  pushAll({t:'tbc',i,n:nm,ti,day:d.day},u);
  if(ti>=2){try{X.SO&&X.SO.sys('📜 '+nm+' cumplió la misión #'+(i+1)+' del Tablón y se llevó un Cofre '+TN[ti]+'.')}catch(e){}}
  S.log&&S.log('[tablon] '+nm+' cumplió #'+(i+1)+' (cofre '+TN[ti]+(key?' + llave':'')+')');
  return{ok:1,done:1,i,ti,key,me:meView(a,p)}}
 ops['tb.get']=(u,m)=>{
  const d=roll(),a=E.acct(u),p=PS(u),g=gen(d.day),c={};
  for(const i in d.c)c[i]=[d.c[i].n,d.c[i].t];
  const out={ok:1,day:d.day,end:dayEnd(),n:NM,c,me:meView(a,p),lg:d.lg.slice(0,25),h:(d.h||[]).slice(0,3)};
  if(m&&(m.full||m.day!==d.day)){out.l=g.pub;out.en=EN.map(x=>x[0])}
  return out};
 ops['tb.claim']=(u,m)=>{
  const d=roll(),i=int(m.i,0,NM-1,-1);if(i<0)return err('Misión no válida');
  const g=gen(d.day),s=g.pub[i];if(s[0]===2)return err('Esa se cumple en el mundo abierto: usa 🔎 Buscar aquí cuando estés cerca.');
  if(d.c[i])return taken(d.c[i]);
  const a=E.acct(u),p=PS(u);if(!a.nm)return err('Elige primero el nombre de tu personaje');
  if(p.cl>=MAXC)return err('Hoy ya cumpliste '+MAXC+' misiones del Tablón: vuelve mañana.');
  if(s[0]===0){
   if(p.k[s[1]]<s[2])return err('Te faltan '+(s[2]-p.k[s[1]])+' bajas de «'+TYN[s[1]]+'» hoy (cuentan las que ya hiciste hoy).');
   p.k[s[1]]-=s[2]}
  else{
   const pk=EN[s[1]][0],av=E.avail(a,'prov',pk);
   if(av<s[2])return err('Te faltan '+(s[2]-av)+' de «'+pk+'». Si ya los tienes, espera unos segundos a que se sincronicen e inténtalo otra vez.');
   E.deliver(u,{prov:{pk,q:-s[2]},note:'📜 Entregaste '+s[2]+' al Tablón'})}
  return done(u,a,p,d,i,s)};
 /* posición para frío/caliente: la que manda el cliente si coincide con la del servidor (±14 casillas); si no, la del servidor */
 const ppos=(w,m,T)=>{const sx=w.x/T,sy=w.y/T,cx=+m.x,cy=+m.y;return(Number.isFinite(cx)&&Number.isFinite(cy)&&Math.hypot(cx-sx,cy-sy)<=14)?[cx,cy]:[sx,sy]};
 const TEMP=[[7,'🔥','¡Muy caliente! Está a pocos pasos.'],[16,'🌡️','Caliente: vas bien encaminado.'],[32,'☀️','Tibio: sigues en la zona, pero aún queda.'],[64,'🌥️','Frío: te alejas o estás lejos.'],[1e9,'❄️','Helado: este no es el sitio.']];
 ops['tb.search']=(u,m)=>{
  const d=roll(),i=int(m.i,0,NM-1,-1);if(i<0)return err('Misión no válida');
  const g=gen(d.day),s=g.pub[i];if(s[0]!==2)return err('Esa misión no es de búsqueda');
  if(d.c[i])return taken(d.c[i]);
  const a=E.acct(u),p=PS(u),t=now();if(!a.nm)return err('Elige primero el nombre de tu personaje');
  if(p.cl>=MAXC)return err('Hoy ya cumpliste '+MAXC+' misiones del Tablón: vuelve mañana.');
  if(t-(p.sT||0)<3000)return{ok:1,wait:1,txt:'Despacio: el terreno no se revisa tan rápido.'};
  const w=S.world&&S.world.where&&S.world.where(u);
  if(!w)return err('Entra al mundo abierto para buscar.');
  if(w.city||w.dg)return err('Aquí no: sal al mundo abierto (fuera de la ciudad y de cuevas).');
  p.sT=t;const sp=g.sp[i],T=S.world.dim?S.world.dim().t:32,pos=ppos(w,m,T),dist=Math.hypot(pos[0]-(sp[0]+.5),pos[1]-(sp[1]+.5));
  if(dist<=R_FIND){
   if(d.c[i])return taken(d.c[i]);
   const r=done(u,a,p,d,i,s);r.found=1;return r}
  const b=TEMP.find(x=>dist<=x[0]);return{ok:1,hot:TEMP.indexOf(b),ic:b[1],txt:b[2]}};
 /* v410: termómetro continuo (sin coordenadas): banda de temperatura + si te acercas o te alejas */
 ops['tb.temp']=(u,m)=>{
  const d=roll(),i=int(m.i,0,NM-1,-1);if(i<0)return err('Misión no válida');
  const g=gen(d.day),s=g.pub[i];if(s[0]!==2)return err('Esa misión no es de búsqueda');
  if(d.c[i])return taken(d.c[i]);
  const p=PS(u),t=now();if(t-(p.tT||0)<1200)return{ok:1,wait:1};
  const w=S.world&&S.world.where&&S.world.where(u);if(!w||w.city||w.dg)return{ok:1,off:1};
  p.tT=t;const sp=g.sp[i],T=S.world.dim?S.world.dim().t:32,pos=ppos(w,m,T),dist=Math.hypot(pos[0]-(sp[0]+.5),pos[1]-(sp[1]+.5));
  let tr=0;if(p.tI===i&&t-(p.tS||0)<15000&&p.tD!=null){if(dist<p.tD-.6)tr=1;else if(dist>p.tD+.6)tr=-1}
  p.tI=i;p.tD=dist;p.tS=t;
  const b=TEMP.findIndex(x=>dist<=x[0]);return{ok:1,hot:b,ic:TEMP[b][1],txt:TEMP[b][2],tr,near:dist<=R_FIND?1:0}};
 ops['tb.open']=(u,m)=>{
  const a=E.acct(u),t=int(m.ct,0,3,-1),T=TA(a);if(t<0)return err('Cofre no válido');
  if(T.ch[t]<1)return err('No tienes ese cofre.');
  if(T.ky[t]<1)return err('Necesitas una Llave del Tablón '+TN[t]+'. Se consiguen cumpliendo misiones del Tablón (las de búsqueda 🔎 siempre dan una).');
  T.ch[t]--;T.ky[t]--;T.o++;S.dirty();
  const r=openLoot(u,a,t);return{ok:1,ct:t,r,me:meView(a,PS(u))}};   /* ojo: la respuesta no puede llevar un campo «t» (pisaría el tipo de mensaje) */
 try{const iv=setInterval(()=>{try{roll()}catch(e){}},30000);if(iv.unref)iv.unref()}catch(e){}
 try{const to=setTimeout(()=>{try{reach()}catch(e){}},8000);if(to.unref)to.unref()}catch(e){}
 return{ops,onKill,gen,roll,reach,openLoot,meView,TA,PS,EN,KP,NM,MAXC,TN,dayKey,_G:()=>G}};
