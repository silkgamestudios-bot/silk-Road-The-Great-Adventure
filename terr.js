/* 🏰 TERRITORIOS DE GREMIO (v155)
   20 tierras lejanas de 60×60 casillas. Un gremio reclama UNA y elige tamaño (pequeño/mediano/grande según sus miembros).
   Planos = gemas del líder/oficial. Territorio y tributo = oro del tesoro del gremio. Construcción manual (barra de progreso, más gente = más rápido).
   Cualquier gremio rival puede destruir piezas; si cae la Bandera, el territorio queda libre y el atacante tiene 60 min de prioridad para reclamarlo.
   Todo (colisión, vida de las piezas, costos) lo decide el servidor. */
module.exports=function(S,E){
const {ECO}=S,DAY=864e5,now=()=>Date.now();
ECO.terr=ECO.terr||{t:{},r:{}};const TT=ECO.terr.t,RS=ECO.terr.r;
const TW=1400,PS=60,WEEK=+process.env.TERR_WEEK_MS||7*DAY,HPK=+process.env.TERR_HPK||1;
const PLOTS=[[150,660],[380,715],[755,700],[960,490],[580,590],[1170,360],[350,330],[625,395],[1080,620],[720,290],[315,25],[855,120],[870,315],[460,130],[840,510],[470,325],[440,10],[1320,725],[790,815],[385,510]];
/* tamaños: lado, miembros mínimos, 💎 del plano de territorio, oro de reclamo (del tesoro), tributo MENSUAL = % del tesoro (con mínimo), vida de la Bandera, puntos de poder */
const SZ={p:{n:'Pequeño',s:24,min:5,gems:15,gold:100000,pct:3,mn:20000,core:30000,pts:100},
 m:{n:'Mediano',s:40,min:50,gems:40,gold:400000,pct:5,mn:80000,core:60000,pts:300},
 g:{n:'Grande',s:60,min:150,gems:90,gold:1200000,pct:8,mn:250000,core:120000,pts:600}};
if(process.env.TERR_GOLDK!=null)for(const k in SZ)SZ[k].gold=Math.round(SZ[k].gold*+process.env.TERR_GOLDK);
if(process.env.TERR_MIN!=null)for(const k in SZ)SZ[k].min=+process.env.TERR_MIN;/* (variable de prueba) */
/* piezas: vida, materiales (provisiones del mercado: mad=madera, pie=piedra, hie=hierro), segundos de construcción, pass=los miembros del gremio pasan */
const PC={W:{n:'Muro',hp:9000,m:{mad:2,pie:2},t:5},G:{n:'Puerta',hp:12000,m:{mad:4,hie:2},t:8,pass:1},T:{n:'Torre',hp:20000,m:{mad:8,pie:8,hie:4},t:12},
 h:{n:'Pared de casa',hp:6000,m:{mad:3,pie:1},t:4},d:{n:'Puerta de casa',hp:5000,m:{mad:3},t:4,pass:1},F:{n:'Bandera',hp:0,m:{},t:0}};
/* planos (se compran una vez por gremio con 💎) */
const BP={muroH:{n:'Muralla horizontal (5)',plan:'muro',w:5,h:1,f:(x,y)=>'W'},muroV:{n:'Muralla vertical (5)',plan:'muro',w:1,h:5,f:()=>'W'},
 puerta:{n:'Puerta',plan:'puerta',w:1,h:1,f:()=>'G'},torre:{n:'Torre',plan:'torre',w:1,h:1,f:()=>'T'},
 casa:{n:'Casa (5×4)',plan:'casa',w:5,h:4,f:(x,y)=>(x===0||y===0||x===4||y===3)?((x===2&&y===3)?'d':'h'):null}};
const PLAN={muro:{n:'Muralla',gems:8},puerta:{n:'Puerta',gems:5},torre:{n:'Torre',gems:12},casa:{n:'Casa',gems:18}};
const HITDMG=lv=>12+Math.floor(lv/2),HITGAP=800,LOOT=.10,LOOTMAX=500000,RESMIN=60,AL_GAP=20000;
const err=e=>({e});const W=()=>S.world;
const G=()=>ECO.guilds||{};
const gidOf=u=>{const a=E.acct(u);return a.gld&&G()[a.gld]?a.gld:''};
const gOf=gid=>gid&&Object.prototype.hasOwnProperty.call(G(),gid)?G()[gid]:null;
const rankOf=(g,u)=>g&&g.mem[u]?g.mem[u].r:-1;
const nMem=g=>Object.keys(g.mem).length;
const glog=(g,t)=>{g.log=g.log||[];g.log.unshift([now(),t]);if(g.log.length>60)g.log.length=60};
const gpush=(g,m)=>{for(const id of Object.keys(g.mem))if(S.online(id))S.push(id,m)};
const key=(x,y)=>x+','+y,idx=(x,y)=>y*TW+x;
const plotOf=id=>PLOTS[id];
/* área construible: cuadrado centrado en la tierra */
const area=(id,sz)=>{const [px,py]=PLOTS[id],s=SZ[sz].s,o=(PS-s)/2;return{x0:px+o,y0:py+o,x1:px+o+s-1,y1:py+o+s-1}};
const power=g=>{let p=g.pwb|0;for(const id in TT)if(TT[id].g===g.id){p+=SZ[TT[id].sz].pts+2*Object.keys(TT[id].pcs).length}return Math.max(0,p)};
const terrOfG=gid=>{for(const id in TT)if(TT[id].g===gid)return id;return null};
/* ---------- cola de difusión a todos los jugadores del mundo ---------- */
const PEND={};
const pend=id=>PEND[id]||(PEND[id]={a:[],d:[],u:[],ga:[],gd:[]});
function flush(){for(const id in PEND){const p=PEND[id];delete PEND[id];if(W())W().bcast({t:'wtd',id:+id,a:p.a,d:p.d,u:p.u,ga:p.ga,gd:p.gd})}}
setInterval(flush,300).unref();
const hpP=(p)=>Math.max(1,Math.min(100,Math.ceil(100*p[1]/(p[4]||1))));/* [k,hp,por,ts,mx] */
const wsetS=(x,y,k,gid)=>{if(W())W().strSet(idx(x,y),k,gid,PC[k]&&PC[k].pass?1:0)};
const wdelS=(x,y)=>{if(W())W().strDel(idx(x,y))};
function metaAll(){const o=[];for(let i=0;i<PLOTS.length;i++){const t=TT[i],r=RS[i];const g=t?gOf(t.g):null;o.push([i,PLOTS[i][0],PLOTS[i][1],t?t.g:'',g?g.tag:'',g?g.name:'',t?t.sz:'',t?(t.warn?2:1):(r&&r.until>now()?3:0),r&&r.until>now()?((gOf(r.g)||{}).tag||''):'',r&&r.until>now()?r.until:0])}return o}
function pushMeta(){if(W())W().bcast({t:'wtp',p:metaAll()})}
function fullPlot(i){const t=TT[i];if(!t)return null;const s=[],gh=[];for(const k in t.pcs){const [x,y]=k.split(',').map(Number),p=t.pcs[k];s.push([x,y,p[0],p[0]==='F'?Math.max(1,Math.ceil(100*p[1]/(p[4]||1))):hpP(p)])}for(const k in t.gh){const [x,y]=k.split(',').map(Number);gh.push([x,y,t.gh[k]])}return{t:'wts',id:+i,s,gh}}
function join(u){if(!W())return;S.push(u,{t:'wtp',p:metaAll()});for(const i in TT){const m=fullPlot(i);if(m)S.push(u,m)}}
/* ---------- alta y baja de piezas ---------- */
function putPiece(i,t,x,y,k,by){const mx=Math.max(1,Math.round((k==='F'?SZ[t.sz].core:PC[k].hp)*HPK));t.pcs[key(x,y)]=[k,mx,by||'',now(),mx];wsetS(x,y,k,t.g);const p=pend(i);p.a.push([x,y,k,100])}
function delPiece(i,t,x,y){delete t.pcs[key(x,y)];wdelS(x,y);pend(i).d.push([x,y])}
function fall(i,byG,why){const t=TT[i];if(!t)return;const g=gOf(t.g),by=gOf(byG);
 for(const k in t.pcs){const [x,y]=k.split(',').map(Number);wdelS(x,y)}
 for(const k in t.gh){}
 delete TT[i];const p=PEND[i];if(p)delete PEND[i];
 if(W())W().bcast({t:'wtd',id:+i,reset:1,a:[],d:[],u:[],ga:[],gd:[]});
 let loot=0;
 if(g){g.pwb=Math.max(0,(g.pwb|0)-30);glog(g,'🏰 Perdieron el territorio Tierra '+(+i+1)+(by?' ante ['+by.tag+']':' ('+(why||'abandono')+')'));
  if(by){loot=Math.min(LOOTMAX,Math.floor((g.bank||0)*LOOT));g.bank=(g.bank||0)-loot}
  gpush(g,{t:'note',m:'🏰 ¡Tu gremio perdió el territorio Tierra '+(+i+1)+(by?' ante ['+by.tag+']'+(loot?' (botín: '+loot+' 🪙)':''):'')+'!'})}
 if(by){by.bank=(by.bank||0)+loot;by.pwb=(by.pwb|0)+50;RS[i]={g:by.id,until:now()+RESMIN*60e3};glog(by,'⚔️ Destruyeron la Bandera de Tierra '+(+i+1)+(g?' de ['+g.tag+']':'')+(loot?' · botín '+loot+' 🪙':'')+' · tienen '+RESMIN+' min para reclamarla');
  gpush(by,{t:'note',m:'⚔️ ¡Victoria! Tierra '+(+i+1)+' cayó. Tu gremio tiene '+RESMIN+' min para reclamarla'+(loot?' · botín '+loot+' 🪙':'')})}
 S.dirty();pushMeta()}
/* ---------- consulta para el panel ---------- */
function view(u){const gid=gidOf(u),g=gOf(gid),a=E.acct(u),r=rankOf(g,u),id=g?terrOfG(gid):null,t=id!=null?TT[id]:null;
 const o={ok:1,plots:metaAll(),sz:SZ,plan:PLAN,bpl:Object.fromEntries(Object.entries(BP).map(([k,b])=>[k,{n:b.n,plan:b.plan,w:b.w,h:b.h}])),pcd:Object.fromEntries(Object.entries(PC).map(([k,p])=>[k,{n:p.n,hp:p.hp,m:p.m,t:p.t}])),
  me:{r,gid,leader:g&&g.leader===u?1:0,n:g?nMem(g):0,bank:g?g.bank|0:0,plans:g?(g.plans||{}):{},gem:E.gTot(a)},
  top:Object.values(G()).map(x=>({tag:x.tag,name:x.name,pw:power(x)})).filter(x=>x.pw>0).sort((p,q)=>q.pw-p.pw).slice(0,10)};
 if(t){const s=SZ[t.sz],week=weekly(t,g),ar=area(+id,t.sz),f=Object.entries(t.pcs).find(([,p])=>p[0]==='F');
  const ghl=Object.entries(t.gh).map(([k,kk])=>{const [x,y]=k.split(',').map(Number);return[x,y,kk]});
  const need={};for(const [,,kk] of ghl)for(const m in PC[kk].m)need[m]=(need[m]|0)+PC[kk].m[m];
  o.mine={id:+id,sz:t.sz,pcs:Object.keys(t.pcs).length,gh:ghl.length,need,area:ar,core:f?[f[1][1],f[1][4]]:null,next:t.next,week,debt:t.debt|0,warn:t.warn|0,min:s.min,pw:power(g)}}
 return o}
const weekly=(t,g)=>{const s=SZ[t.sz];return Math.max(Math.round(s.mn/4),Math.round((g.bank||0)*s.pct/100/4))};
const ops={};
ops['tr.me']=u=>view(u);
ops['tr.claim']=(u,m)=>{const gid=gidOf(u),g=gOf(gid),i=Math.floor(+m.plot),sz=String(m.sz||'');if(!g||g.leader!==u)return err('Solo el líder del gremio reclama territorios');
 if(!(i>=0&&i<PLOTS.length)||!SZ[sz])return err('Tierra o tamaño no válido');if(terrOfG(gid)!=null)return err('Tu gremio ya tiene un territorio');if(TT[i])return err('Esa tierra ya tiene dueño');
 const r=RS[i];if(r&&r.until>now()&&r.g!==gid)return err('Reservada unos minutos para el gremio que destruyó su Bandera');
 const s=SZ[sz];if(nMem(g)<s.min)return err('Para el tamaño '+s.n+' necesitas '+s.min+' miembros (tienes '+nMem(g)+')');
 if((g.bank|0)<s.gold)return err('El tesoro necesita '+s.gold+' 🪙 (tiene '+(g.bank|0)+')');const a=E.acct(u);
 if(!E.spendGems(a,s.gems,false,'Plano de territorio '+s.n))return err('Te faltan '+(s.gems-E.gTot(a))+' 💎 para el plano');
 g.bank-=s.gold;delete RS[i];const t=TT[i]={g:gid,sz,ts:now(),pcs:{},gh:{},next:now()+WEEK,debt:0,warn:0};
 const ar=area(i,sz);let cx=Math.floor((ar.x0+ar.x1)/2),cy=Math.floor((ar.y0+ar.y1)/2),best=null;
 for(let d=0;d<12&&!best;d++)for(let yy=cy-d;yy<=cy+d&&!best;yy++)for(let xx=cx-d;xx<=cx+d;xx++){if(Math.max(Math.abs(xx-cx),Math.abs(yy-cy))!==d)continue;if(!W().tsolid(xx,yy)){best=[xx,yy];break}}
 const c=best||[cx,cy];putPiece(i,t,c[0],c[1],'F',a.nm);glog(g,'🏰 '+(a.nm||'El líder')+' reclamó Tierra '+(i+1)+' ('+s.n+') por '+s.gold+' 🪙');
 S.dirty();E.pushEnt(u);pushMeta();flush();S.log('[territorio] '+g.tag+' reclama '+i+' '+sz);return view(u)};
ops['tr.buybp']=(u,m)=>{const gid=gidOf(u),g=gOf(gid),k=String(m.plan||'');if(!g||rankOf(g,u)<1)return err('Solo líder u oficiales compran planos');if(!PLAN[k])return err('Plano desconocido');
 g.plans=g.plans||{};if(g.plans[k])return err('Tu gremio ya tiene ese plano');const a=E.acct(u);if(!E.spendGems(a,PLAN[k].gems,false,'Plano '+PLAN[k].n))return err('Te faltan '+(PLAN[k].gems-E.gTot(a))+' 💎');
 g.plans[k]=1;glog(g,'📐 '+(a.nm||'Un oficial')+' compró el plano de '+PLAN[k].n);S.dirty();E.pushEnt(u);return view(u)};
const ptile=(u)=>{const w=W().where(u);if(!w||w.dg||w.city)return null;return{x:w.x/32,y:w.y/32}};
ops['tr.plan']=(u,m)=>{const gid=gidOf(u),g=gOf(gid),i=terrOfG(gid),b=BP[String(m.bp||'')];if(!g||i==null)return err('Tu gremio no tiene territorio');if(rankOf(g,u)<1)return err('Solo líder u oficiales colocan planos');if(!b)return err('Plano desconocido');
 if(!(g.plans||{})[b.plan])return err('Tu gremio no tiene el plano de '+PLAN[b.plan].n);const t=TT[i],ar=area(+i,t.sz),x0=Math.floor(+m.x),y0=Math.floor(+m.y);if(!Number.isFinite(x0)||!Number.isFinite(y0))return err('Posición inválida');
 const cells=[];for(let yy=0;yy<b.h;yy++)for(let xx=0;xx<b.w;xx++){const k=b.f(xx,yy);if(k)cells.push([x0+xx,y0+yy,k])}
 if(Object.keys(t.gh).length+cells.length>400)return err('Demasiados planos pendientes: construye primero lo ya marcado');
 for(const [x,y] of cells){if(x<ar.x0||x>ar.x1||y<ar.y0||y>ar.y1)return err('Fuera del área de tu territorio');if(t.pcs[key(x,y)]||t.gh[key(x,y)])return err('Hay algo construido o marcado ahí');if(W().tsolid(x,y))return err('Ese terreno no se puede construir')}
 for(const [x,y,k] of cells){t.gh[key(x,y)]=k;pend(+i).ga.push([x,y,k])}S.dirty();flush();return view(u)};
ops['tr.unplan']=(u,m)=>{const gid=gidOf(u),g=gOf(gid),i=terrOfG(gid);if(!g||i==null)return err('Sin territorio');if(rankOf(g,u)<1)return err('Solo líder u oficiales');const t=TT[i];
 if(m.all){for(const k in t.gh){const [x,y]=k.split(',').map(Number);pend(+i).gd.push([x,y])}t.gh={}}else{const x=Math.floor(+m.x),y=Math.floor(+m.y);if(t.gh[key(x,y)]){delete t.gh[key(x,y)];pend(+i).gd.push([x,y])}}S.dirty();flush();return view(u)};
/* ---------- construir (trabajo con barra de progreso) ---------- */
const JOBS={};
const matsOk=(a,m,q)=>{for(const p in m)if(E.avail(a,'prov',p)<m[p]*(q||1))return p;return null};
const takeMats=(u,m,q,why)=>{for(const p in m)E.deliver(u,{prov:{pk:p,q:-m[p]*(q||1)},note:'🏗️ '+why+': −'+m[p]*(q||1)+' '+p})};
const MN={mad:'madera',pie:'piedra',hie:'hierro'};
ops['tr.build']=(u,m)=>{const gid=gidOf(u),g=gOf(gid),i=terrOfG(gid);if(!g||i==null)return err('Tu gremio no tiene territorio');const t=TT[i],x=Math.floor(+m.x),y=Math.floor(+m.y),k=t.gh[key(x,y)];if(!k)return err('Ahí no hay un plano pendiente');
 const w=ptile(u);if(!w)return err('No estás en el mundo abierto');if(Math.hypot(w.x-x-.5,w.y-y-.5)>3.2)return err('Acércate a la casilla para construir');
 const mm=PC[k].m,miss=matsOk(E.acct(u),mm);if(miss)return err('Te falta '+MN[miss]+' (necesitas '+mm[miss]+')');
 let others=0;for(const o in JOBS){if(o!==u&&JOBS[o].i===i&&now()-JOBS[o].t0<JOBS[o].dur*1000+20000)others++}
 const dur=Math.max(1.5,PC[k].t/(1+.35*Math.min(6,others)));JOBS[u]={i,x,y,k,t0:now(),dur};return{ok:1,dur,k}};
ops['tr.done']=(u,m)=>{const j=JOBS[u],gid=gidOf(u),g=gOf(gid);if(!j||!g)return err('No hay trabajo en curso');if(now()-j.t0<j.dur*1000*.85)return err('Aún no terminas');delete JOBS[u];const t=TT[j.i];if(!t||t.g!==gid)return err('El territorio cambió');if(t.gh[key(j.x,j.y)]!==j.k)return err('Ya lo construyó otro');
 const w=ptile(u);if(!w||Math.hypot(w.x-j.x-.5,w.y-j.y-.5)>3.6)return err('Te alejaste de la obra');const mm=PC[j.k].m,miss=matsOk(E.acct(u),mm);if(miss)return err('Te falta '+MN[miss]);
 takeMats(u,mm,1,PC[j.k].n);delete t.gh[key(j.x,j.y)];const a=E.acct(u);putPiece(j.i,t,j.x,j.y,j.k,a.nm);a.tbn=(a.tbn|0)+1;S.dirty();flush();return{ok:1,n:a.tbn}};
ops['tr.cancel']=u=>{delete JOBS[u];return{ok:1}};
/* ---------- reparar ---------- */
ops['tr.repair']=(u,m)=>{const gid=gidOf(u),g=gOf(gid),i=terrOfG(gid);if(!g||i==null)return err('Sin territorio');const t=TT[i],x=Math.floor(+m.x),y=Math.floor(+m.y),p=t.pcs[key(x,y)];if(!p)return err('No hay nada ahí');
 const w=ptile(u);if(!w||Math.hypot(w.x-x-.5,w.y-y-.5)>3.2)return err('Acércate para reparar');if(p[1]>=p[4])return err('Ya está entera');const a=E.acct(u);if(now()-(a.trp||0)<1500)return err('Más despacio');
 const base=PC[p[0]]?PC[p[0]].m:{mad:6,pie:6,hie:2},mm={};for(const q in base)mm[q]=Math.max(1,Math.ceil(base[q]/2));if(p[0]==='F'){mm.mad=20;mm.pie=20;mm.hie=8}
 const miss=matsOk(a,mm);if(miss)return err('Te falta '+MN[miss]+' (necesitas '+mm[miss]+')');takeMats(u,mm,1,'Reparación');a.trp=now();p[1]=p[4];pend(+i).u.push([x,y,100]);S.dirty();flush();return{ok:1}};
/* ---------- atacar ---------- */
const HITT={};
ops['tr.hit']=(u,m)=>{const gid=gidOf(u),g=gOf(gid);if(!g)return err('Solo los gremios pueden atacar territorios');const x=Math.floor(+m.x),y=Math.floor(+m.y);let id=null,p=null;
 for(const i in TT){const q=TT[i].pcs[key(x,y)];if(q){id=i;p=q;break}}if(!p)return err('Ahí no hay nada');const t=TT[id];if(t.g===gid)return err('Es de tu gremio');
 const w=ptile(u);if(!w||Math.hypot(w.x-x-.5,w.y-y-.5)>2.9)return err('Acércate más');const nw=now();if(nw-(HITT[u]||0)<HITGAP-100)return{ok:1,hp:p[1],wait:1};HITT[u]=nw;
 const dmg=HITDMG(E.acct(u).lv|0);p[1]=Math.max(0,p[1]-dmg);const dg=gOf(t.g);
 if(dg&&(!t.al||nw-t.al>AL_GAP)){t.al=nw;gpush(dg,{t:'note',m:'🚨 ¡Atacan tu territorio (Tierra '+(+id+1)+')! '+PC[p[0]].n+' al '+Math.ceil(100*p[1]/p[4])+'% · atacante: ['+g.tag+']'})}
 if(p[1]<=0){if(p[0]==='F'){fall(id,gid);return{ok:1,hp:0,fell:1}}delPiece(+id,t,x,y);S.dirty();flush();return{ok:1,hp:0,gone:1}}
 pend(+id).u.push([x,y,Math.max(1,Math.ceil(100*p[1]/p[4]))]);S.dirty();return{ok:1,hp:p[1]}};
ops['tr.abandon']=(u)=>{const gid=gidOf(u),g=gOf(gid),i=terrOfG(gid);if(!g||g.leader!==u)return err('Solo el líder');if(i==null)return err('Sin territorio');fall(i,null,'abandono voluntario');return view(u)};
/* ---------- tributo semanal, avisos y bajas (cada minuto) ---------- */
function tick(){const n=now();let ch=0;
 for(const i of Object.keys(TT)){const t=TT[i],g=gOf(t.g);if(!g){fall(i,null,'gremio disuelto');ch=1;continue}const s=SZ[t.sz];
  if(n>=t.next){const wk=weekly(t,g),owe=wk+(t.debt|0);t.next+=WEEK;if(t.next<n)t.next=n+WEEK;
   if((g.bank|0)>=owe){g.bank-=owe;t.debt=0;glog(g,'🏰 Tributo semanal pagado: '+owe+' 🪙 (Tierra '+(+i+1)+')');gpush(g,{t:'note',m:'🏰 Tributo semanal del territorio: −'+owe+' 🪙 del tesoro'})}
   else{t.debt=owe;glog(g,'⚠️ No hay oro para el tributo ('+owe+' 🪙). Depositen en el tesoro o pierden el territorio en 7 días');gpush(g,{t:'note',m:'⚠️ ¡Tributo sin pagar! Faltan '+owe+' 🪙 en el tesoro. Tienen 7 días'})}ch=1}
  if((t.debt|0)>0&&(g.bank|0)>=t.debt){g.bank-=t.debt;glog(g,'🏰 Deuda de tributo pagada: '+t.debt+' 🪙');t.debt=0;ch=1}
  const ok=!(t.debt>0)&&nMem(g)>=s.min;
  if(!ok&&!t.warn){t.warn=n;glog(g,'⚠️ Territorio en aviso ('+(t.debt>0?'tributo pendiente':'faltan miembros: mínimo '+s.min)+')');gpush(g,{t:'note',m:'⚠️ Tu territorio está en aviso: '+(t.debt>0?'depositen oro para el tributo':'se necesitan '+s.min+' miembros')+'. Tienen 7 días'});ch=1}
  else if(ok&&t.warn){t.warn=0;glog(g,'✅ El territorio salió del aviso');ch=1}
  else if(t.warn&&n-t.warn>WEEK){fall(i,null,t.debt>0?'tributo sin pagar':'miembros insuficientes');ch=1}}
 for(const i of Object.keys(RS))if(RS[i].until<=n){delete RS[i];ch=1}
 for(const u in JOBS)if(n-JOBS[u].t0>90e3)delete JOBS[u];
 if(ch){S.dirty();pushMeta()}}
setInterval(()=>{try{tick()}catch(e){S.log('terr tick '+e.stack)}},+process.env.TERR_TICK_MS||60e3).unref();
/* ---------- arranque: pasa el mapa de piezas al mundo y despeja los monstruos de las 20 tierras ---------- */
function init(){const w=W();if(!w)return;w.strClear();for(const i in TT){const t=TT[i];for(const k in t.pcs){const [x,y]=k.split(',').map(Number);wsetS(x,y,t.pcs[k][0],t.g)}}
 w.mobsOff(PLOTS.map(([x,y])=>[x,y,x+PS,y+PS]))}
return{ops,init,join,tick,SZ,PLOTS,BP,PC,power,_TT:TT,_RS:RS}};
