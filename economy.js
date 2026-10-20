/* Silk Road · EL SERVIDOR MANDA: cuentas, gemas, apariencias, validación de guardados (antitrampas), entregas y nombres.
   Principio: el cliente NUNCA aumenta oro/objetos/gemas por sí mismo; el servidor acepta un guardado solo si es plausible
   (límites de ritmo por nivel/tiempo, objetos con estadísticas legales y sin duplicados) y recorta lo que no lo es. */
const crypto=require('crypto');
module.exports=function(S){
const {ECO,cat,log}=S;
ECO.acc=ECO.acc||{};ECO.reg=ECO.reg||{};ECO.names=ECO.names||{};
const num=(v,a,b,d)=>Number.isFinite(+v)?Math.min(b,Math.max(a,+v)):d;
const int=(v,a,b,d)=>Math.floor(num(v,a,b,d));
const CFG={slack:+(process.env.AUDIT_SLACK||1.5),mode:process.env.AUDIT_MODE||'enforce',masterExempt:process.env.MASTER_EXEMPT!=='0',
 lvMax:1200,goldRate:400,goldPerLv:6,xpRate:12,xpBurst:6000,dtMax:7200,bossLv:[20,22,24,26,28,29,30,30],bossGold:i=>150000*(i+1),bossUp:.35,
 impGold:+(process.env.IMPORT_GOLD_PER_LV||150000),impOff:process.env.FIRST_IMPORT==='0',goodsCap:30000,goodsBase:[60,40,80,30,25],provCap:9999,provRate:2,ecRate:.5,ecBurst:150,dlTtl:90e3};
const RM=[1,1.6,2.4,3.5],EVK=['hl','nv','lu','am','nz'],PRK=['au','ap','lt','bl','es'];
const xpNeed=l=>Math.round((30+90*l+3*l*l)*(1.3+.05*l)*1.6);
const xpTot=(lv,xp)=>{let t=xp;for(let l=1;l<lv;l++)t+=xpNeed(l);return t};
const xpInv=t=>{let l=1;while(l<CFG.lvMax&&t>=xpNeed(l)){t-=xpNeed(l);l++}return[l,Math.floor(t)]};
const rid=n=>crypto.randomBytes(n||8).toString('hex');
/* ---------- minerales (se comercian como provisiones) y potenciación ---------- */
const COOK={carne:'cocida',car2:'coc2',car3:'coc3',car4:'coc4',car5:'coc5',fi1:'fc1',fi2:'fc2',fi3:'fc3',fi4:'fc4'};/* crudo → cocido */
/* fletchería (v139): lote de 20 flechas = 1 punta de mineral + madera; las básicas ar0 solo se compran con oro (5 c/u) */
const ARQ={ar1:['pie',1,1],ar2:['cob',1,1],ar3:['hie',1,2],ar4:['pla',1,2],ar5:['aur',1,3],ar6:['mit',1,3],ar7:['dia',1,4]};
const KEYK=new Set(['kl1','kl2','kl3','kl4','kl5','kl6','cf1','cf2','cf3','cf4','cf5','cf6']);
const MNK=['pie','cob','hie','pla','aur','mit','rub','esm','zaf','dia','car2','car3','car4','car5','coc2','coc3','coc4','coc5','fi1','fi2','fi3','fi4','fc1','fc2','fc3','fc4','hil','mad','ar0','ar1','ar2','ar3','ar4','ar5','ar6','ar7','ph2','ph3','ph4','ph5','pm2','pm3','pm4','pm5','ph6','ph7','pm6','pm7','gh1','gh2','gh3','gh4','gh5','gh6','gh7','am1','am2','am3','am4','am5','am6','am7','des','dco','kl1','cf1','kl2','cf2','kl3','cf3','kl4','cf4','kl5','cf5','kl6','cf6'];
const UPC=[null,{g:1500,m:{pie:8,cob:4},p:1},{g:6000,m:{pie:16,cob:8},p:1},{g:13500,m:{cob:12,hie:6},p:1},{g:24000,m:{hie:12,pla:4},p:.9},{g:37500,m:{hie:16,pla:8},p:.8},{g:54000,m:{pla:14,aur:4},p:.66},{g:73500,m:{pla:18,aur:8,rub:1},p:.52},{g:96000,m:{aur:12,mit:4,esm:2},p:.4},{g:121500,m:{aur:14,mit:8,dia:1},p:.28},{g:150000,m:{mit:14,dia:3,zaf:2},p:.18},{g:220000,m:{mit:20,dia:4,des:6},p:.1},{g:320000,m:{dia:8,des:12,dco:1},p:.05}];
/* ---------- cuentas ---------- */
function acct(u){let a=ECO.acc[u];if(!a){a=ECO.acc[u]={gem:{own:0,tr:0},sk:[],ev:[],px:{au:0,ap:0,lt:0,bl:0,es:0},vip:0,lic:0,
  res:{gold:0,g:[0,0,0,0,0],fd:Object.assign({carne:0,cocida:0,pasto:0,hierba:0,lazo:0},Object.fromEntries(MNK.map(k=>[k,0]))),ec:{hl:0,nv:0,lu:0,am:0,nz:0},pot:0,mpot:0},
  ts:0,lv:1,xp:0,sx:[1,1,1],cls:-1,nm:'',first:1,dl:[],mint:{},gb:{v:0,t:0},strikes:0,flags:[],gld:'',nmts:0,created:Date.now()};S.dirty()}for(const k of MNK)if(a.res&&a.res.fd&&a.res.fd[k]==null)a.res.fd[k]=0;if(!a.bxl)a.bxl={t:[0,0,0,0],a:[0,0,0,0],x:[0,0,0,0],m:0};if(!Array.isArray(a.gl))a.gl=[];if(!a.hl)a.hl={f:{},n:{},ts:0};return a}
const ent=u=>{const a=acct(u),L=a.bxl;return{sk:a.sk,ev:a.ev,gem:a.gem.own,gemT:a.gem.tr,px:a.px,vip:a.vip,lic:a.lic,nm:a.nm,gld:a.gld,nch:a.nch|0,bx:L.x.map((x,i)=>x+Math.max(0,L.t[i]-L.a[i])),bxt:L.t.slice()}};
const pushEnt=u=>S.push(u,{t:'ent',ent:ent(u)});
function flag(u,why,w){const a=acct(u);a.strikes+=w==null?1:w;a.flags.push([Date.now(),String(why).slice(0,120)]);if(a.flags.length>30)a.flags.shift();S.dirty();
 log('[antitrampas] '+u+' ('+(a.nm||'?')+'): '+why+' · strikes '+a.strikes);
 if(a.strikes>=3&&!a.notified){a.notified=Date.now();S.notify('⚠️ SILK ROAD · Posible trampa\nJugador: '+(a.nm||u)+'\nMotivo: '+why+'\nStrikes: '+a.strikes)}}
/* ---------- gemas ---------- */
const gTot=a=>a.gem.own+a.gem.tr;
const glAdd=(a,d,why)=>{if(!Array.isArray(a.gl))a.gl=[];a.gl.push([Date.now(),d,String(why||'').slice(0,48),a.gem.own,a.gem.tr]);if(a.gl.length>40)a.gl.shift()};
function spendGems(a,n,ownOnly,why){n=Math.floor(n);if(!(n>0))return 0;if(ownOnly){if(a.gem.own<n)return 0;a.gem.own-=n}else{if(gTot(a)<n)return 0;const t=Math.min(a.gem.tr,n);a.gem.tr-=t;a.gem.own-=n-t}glAdd(a,-n,why);S.dirty();return 1}
function grantGems(u,q,ownTr,why){const a=acct(u);if(ownTr==='tr')a.gem.tr+=q;else a.gem.own+=q;glAdd(a,q,(ownTr==='tr'?'(transferidas) ':'')+(why||'recarga'));S.dirty();pushEnt(u);log('[gemas] +'+q+' a '+u+' '+(why||''))}
/* Bonus premium (⭐🪙🛡️❤️): lo COMPRADO lo decide el servidor; el cliente solo gasta el tiempo mientras juega */
const BX={ms:4*36e5,max:20*36e5,cost:2};
/* ---------- entregas (idempotentes) ---------- */
function deliver(u,d){const a=acct(u);d.id=d.id||'d'+rid(6);d.ts=Date.now();d.sent=0;a.dl.push(d);if(a.dl.length>200)a.dl.shift();S.dirty();if(S.onDeliver)S.onDeliver(u);flushDl(u);return d}
function flushDl(u){const a=acct(u);if(!a.dl.length||!S.online(u))return;const now=Date.now();a.dl.forEach(d=>{if(!d.sent)d.sent=now});S.push(u,{t:'dl',list:a.dl.slice(0,40)})}
/* Modelo: R (a.res) = estado YA aplicado por el cliente. Una entrega con delta negativo reserva el recurso (no se puede gastar dos veces);
   si el cliente no la confirma en dlTtl tras recibirla, el servidor la aplica a la fuerza (así nadie se queda con el objeto y el oro). */
const dKeys=d=>{const o=[];if(d.gold)o.push(['gold',null,d.gold]);if(d.goods)o.push(['g',d.goods.g,d.goods.q]);if(d.prov)o.push(['prov',d.prov.pk,d.prov.q]);if(d.ec)o.push(['ec',d.ec.k,d.ec.q]);if(d.pot)o.push(['pot',null,d.pot]);return o};
function reserved(a,key,sub){let t=0;for(const d of a.dl){if(d.forced)continue;for(const [k,s2,q] of dKeys(d))if(k===key&&q<0&&(sub==null||s2===sub))t-=q}return t}
function resVal(a,key,sub){const R=a.res;return key==='gold'?R.gold:key==='g'?R.g[sub]:key==='prov'?R.fd[sub]:key==='ec'?R.ec[sub]:key==='pot'?R.pot:0}
const avail=(a,key,sub)=>Math.max(0,resVal(a,key,sub)-reserved(a,key,sub));
function applyRes(a,key,sub,q){const R=a.res;if(key==='gold')R.gold=Math.max(0,R.gold+q);else if(key==='g')R.g[sub]=Math.max(0,R.g[sub]+q);else if(key==='prov')R.fd[sub]=Math.max(0,R.fd[sub]+q);else if(key==='ec')R.ec[sub]=Math.max(0,R.ec[sub]+q);else if(key==='pot')R.pot=Math.max(0,Math.min(99,R.pot+q))}
function forceExpired(a){const now=Date.now();let n=0;for(const d of a.dl){if(d.forced||!d.sent||now-d.sent<=CFG.dlTtl)continue;let neg=0;for(const [k,s2,q] of dKeys(d))if(q<0){applyRes(a,k,s2,q);neg=1}if(neg){d.forced=1;n++}}if(n)S.dirty();return n}
/* ---------- validación de objetos y mascotas ---------- */
const BASE={0:{dm:5},1:{hp:8},2:{hp:4,dm:1},3:{dm:2,hp:2},4:{hp:5},5:{sp:2}};
function itemMax(it,k){const m=RM[it.r]*(1+it.t*.6)*2.6;let b;if(it.sl<6)b=BASE[it.sl];else b=(it.k===2||it.k===4||it.k===6)?{mp:8}:{hp:3,gd:4};return Math.ceil((b[k]||0)*m)+1}
function cleanItem(x){if(!x||typeof x!=='object')return null;const sl=int(x.sl,0,6,-1),t=int(x.t,0,4,-1),r=int(x.r,0,3,-1);if(sl<0||t<0||r<0)return null;
 const o={sl,t,r,li:int(x.li,0,9,0),du:int(x.du,0,100,100)};if(x.k!=null){const k=int(x.k,0,7,-1);if(k<0)return null;o.k=k}
 o.n=String(x.n||'Objeto').replace(/[^\p{L}\p{N} '.-]/gu,'').slice(0,34)||'Objeto';if(x.u)o.u=1;if(x.junk)o.junk=1;if(x.dv)o.dv=1;if(x.rl!=null)o.rl=int(x.rl,0,1200,0);
 if(x.id!=null){const id=String(x.id);if(!/^[\w-]{6,24}$/.test(id))return null;o.id=id}
 if(x.up!=null){const up=int(x.up,0,12,0);if(up)o.up=up}
 for(const k of['dm','hp','sp','gd','mp']){if(x[k]==null||+x[k]===0)continue;const mx=itemMax(o,k);if(!mx||mx<=1&&k!=='hp')return null;const v=int(x[k],0,1e7,0);if(v>mx*(x.u?1:1))return null;if(v)o[k]=v}
 return o}
function cleanPetS(x){if(!x||typeof x!=='object')return null;const t=String(x.t||'');if(!/^[a-z]{2,12}$/.test(t))return null;
 const o={t,nm:String(x.nm||'').replace(/[^\p{L}\p{N} '-]/gu,'').slice(0,18)||t,lv:int(x.lv,1,30,1),xp:int(x.xp,0,1e8,0),q:int(x.q,0,3,0),fd:int(x.fd,0,100,80),ill:0,hp:num(x.hp,1,4e8,1),en:num(x.en,0,2e5,0)};
 if(x.id!=null){const id=String(x.id);if(!/^[\w-]{6,24}$/.test(id))return null;o.id=id}return o}
const MINT={i:[[60,5e3],[25,40e3],[8,300e3],[3,1800e3]],p:[[8,300e3]]};
function mintOk(a,kind,idx,now){const cfg=(MINT[kind]||MINT.i)[idx],b=a.mint[kind+idx]||(a.mint[kind+idx]={v:cfg[0],t:now});b.v=Math.min(cfg[0],b.v+(now-b.t)/cfg[1]);b.t=now;if(b.v>=1){b.v-=1;return 1}return 0}
/* ---------- nombres ---------- */
function claimName(u,raw,force){const n=String(raw||'').trim().replace(/\s+/g,' ');if(!/^[\p{L}\p{N} _-]{3,14}$/u.test(n))return{e:'Usa de 3 a 14 letras, números, espacios, - o _'};
 const k=n.toLowerCase(),a=acct(u);if(k in Object.prototype)return{e:'Ese nombre no está disponible'};if(ECO.names[k]&&ECO.names[k]!==u)return{e:'Ese nombre ya está en uso'};
 if(a.nm&&a.nm.toLowerCase()!==k&&!force)return{e:'Cambiar el nombre cuesta 2.000 🪙 la primera vez y 1 💎 las siguientes (menú ⚙️ Sistema)'};
 if(a.nm&&ECO.names[a.nm.toLowerCase()]===u)delete ECO.names[a.nm.toLowerCase()];
 ECO.names[k]=u;a.nm=n;a.nmts=Date.now();S.dirty();if(a.gld&&S.guildName)S.guildName(u,n);return{nm:n}}
const uidByName=n=>{const k=String(n||'').trim().toLowerCase();return Object.prototype.hasOwnProperty.call(ECO.names,k)?(ECO.names[k]||null):null};
/* ---------- AUDITORÍA DEL GUARDADO ---------- */
function bossBudget(lv){let s=0;CFG.bossLv.forEach((l,i)=>{if(lv>=l)s+=CFG.bossGold(i)});return s}
function audit(u,raw,ack){const a=acct(u),now=Date.now();let v;
 try{v=JSON.parse(raw)}catch(e){return{rej:'JSON inválido'}}
 if(!v||typeof v!=='object'||Array.isArray(v))return{rej:'estructura inválida'};
 const master=CFG.masterExempt&&S.isMaster(u),fix={},notes=[];
 /* entregas confirmadas: el cliente dice que ya las aplicó */
 const acked=[];if(Array.isArray(ack))for(const id of ack.slice(0,60)){const i=a.dl.findIndex(d=>d.id===String(id));if(i>=0){acked.push(a.dl[i]);a.dl.splice(i,1)}}
 const dt=a.ts?Math.min(CFG.dtMax,Math.max(1,(now-a.ts)/1000)):CFG.dtMax;const first=a.first;
 /* tras un reinicio (o cuenta nueva) no se importa progreso viejo del navegador: se parte desde cero */
 const preBad=[];if(first&&!master&&process.env.FIRST_IMPORT!=='1'){const cnt=(Array.isArray(v.bag)?v.bag.length:0)+(v.eq&&typeof v.eq==='object'?Object.keys(v.eq).length:0)+(Array.isArray(v.pets)?v.pets.length:0);
  if((+v.lv||1)>5||(+v.g||0)>2000||cnt>6){const ids=[];const add=x=>{if(x&&x.id)ids.push(String(x.id))};if(v.eq&&typeof v.eq==='object')for(const k in v.eq)add(v.eq[k]);(Array.isArray(v.bag)?v.bag:[]).forEach(add);(Array.isArray(v.lb)?v.lb:[]).forEach(add);(Array.isArray(v.pets)?v.pets:[]).forEach(add);
   Object.assign(v,{g:0,i:[0,0,0,0,0],cb:[0,0,0,0,0],lv:1,xp:0,eq:{},bag:[],lb:[],dep:[],bk:0,bu:[],pets:[],sx:[1,1,1],fd:{},bgc:25,lgc:25});fix.rz=1;fix.g=0;fix.lv=1;fix.xp=0;fix.i=[0,0,0,0,0];fix.fd={};preBad.push(...ids);notes.push('reinicio: progreso viejo descartado')}}
 v.bgc=(+v.bgc)>=40?40:25;v.lgc=(+v.lgc)>=40?40:25;v.bu=(Array.isArray(v.bu)?v.bu.filter(x=>+x===40).map(()=>40):[]).slice(0,Math.max(0,2-(v.bgc>=40?1:0)-(v.lgc>=40?1:0)));
 /* clase y nombre */
 let cl=int(v.cl,0,7,0);if(a.cls>=0&&v.ch&&a.cls!==cl){flag(u,'cambio de clase '+a.cls+'→'+cl);cl=a.cls;v.cl=cl;fix.cl=cl}
 if(v.ch&&a.cls<0)a.cls=cl;
 if(a.nm){if(v.nm!==a.nm){v.nm=a.nm}}else v.nm=String(v.nm||'').replace(/[^\p{L}\p{N} _-]/gu,'').slice(0,14);
 /* nivel y XP */
 const lv0=a.lv,xp0=a.xp;let lv=int(v.lv,1,CFG.lvMax,1),xp=int(v.xp,0,1e12,0);
 if(!master){const prev=xpTot(lv0,xp0),cur=xpTot(lv,xp),allow=(CFG.xpRate*dt+CFG.xpBurst*(1+Math.floor(dt/600)))*CFG.slack;
  if(first&&!master){const cap=CFG.impOff?0:CFG.xpBurst*40;if(cur>cap){const r=xpInv(cap);lv=r[0];xp=r[1];notes.push('nivel importado recortado');fix.lv=lv;fix.xp=xp}}
  else if(cur>prev+allow){const r=xpInv(prev+allow);flag(u,'XP/nivel imposible: '+lv0+'→'+lv+' en '+Math.round(dt)+' s');lv=r[0];xp=r[1];fix.lv=lv;fix.xp=xp}}
 v.lv=lv;v.xp=xp;
 /* habilidades */
 if(Array.isArray(v.sx)){v.sx=[0,1,2].map(i=>int(v.sx[i],1,600,1));if(!master&&!first)v.sx=v.sx.map((x,i)=>{const mx=a.sx[i]+Math.ceil(dt/12)+6;if(x>mx){flag(u,'habilidad '+i+' '+a.sx[i]+'→'+x);fix.sx=1;return mx}return x});v.sx=v.sx.map(x=>Math.max(1,x))}
 /* ---- oro, mercancías, provisiones y monedas ---- */
 forceExpired(a);
 const R=a.res,dAck=(key,sub)=>{let cr=0,db=0;for(const d of acked)for(const [k,s2,q] of dKeys(d))if(k===key&&(sub==null||s2===sub)){if(q>0)cr+=q;else if(!d.forced)db+=q}return cr+db};
 const bk0=int(v.bk,0,1e14,0);let g=num(v.g,0,1e14,0)+bk0;const rate=(CFG.goldRate+CFG.goldPerLv*lv)*dt*CFG.slack,baseG=Math.max(0,R.gold+dAck('gold'))+(R.bk|0);let saleAllow=0;
 const gi=Array.isArray(v.i)?[0,1,2,3,4].map(i=>int(v.i[i],0,CFG.goodsCap,0)):R.g.slice();
 if(!master){for(let i=0;i<5;i++){const b=Math.max(0,R.g[i]+dAck('g',i));if(gi[i]<b)saleAllow+=(b-gi[i])*CFG.goodsBase[i]*2.2}
  const gb=a.gb,cap=bossBudget(lv)*CFG.bossUp*CFG.slack+400000;gb.v=Math.min(cap,(gb.v||0)+(bossBudget(lv)/900+300)*(a.ts?dt:60)*CFG.slack);
  let allowTot=baseG+rate+saleAllow;if(first)allowTot=master?Math.max(allowTot,1e7*Math.max(1,lv)):Math.max(allowTot,CFG.impOff?100:CFG.impGold*Math.max(1,lv));
  if(g>allowTot){const need=g-allowTot;if(need<=gb.v)gb.v-=need;else{const ok=Math.floor(allowTot+gb.v);flag(u,'oro imposible: '+Math.round(baseG)+'→'+Math.round(g)+' en '+Math.round(dt)+' s (permitido '+ok+')');gb.v=0;g=ok;fix.g=g}}
  /* comprar mercancía cuesta oro: lo que sube sin entrega debe estar pagado (mín. 50% del precio base) */
  const spent=Math.max(0,baseG-g)+rate;
  for(let i=0;i<5;i++){const b=Math.max(0,R.g[i]+dAck('g',i));if(gi[i]>b&&!first){const can=Math.floor(Math.max(0,spent)/(CFG.goodsBase[i]*.5));if(gi[i]-b>can){flag(u,'mercancía '+i+' sin pagar: '+b+'→'+gi[i]);gi[i]=b+can;fix.i=1}}}}
 v.bk=Math.min(bk0,Math.floor(g));v.g=Math.floor(g)-v.bk;v.i=gi;if(Array.isArray(v.cb))v.cb=gi.map((_,i)=>num(v.cb[i],0,1e15,0));
 let gsp=Math.max(0,baseG-g);
 if(v.fd&&typeof v.fd==='object'){const o={},qv={},cv={},ra=Math.ceil(CFG.provRate*dt*CFG.slack)+20;for(const k of Object.keys(R.fd))qv[k]=int(v.fd[k],0,CFG.provCap,0);
  /* cocinar: lo crudo que baja en este guardado se convierte en cocido (hasta +25% con la licencia del mercader); antes el cocido se recortaba y la carne desaparecía */
  if(!master&&!first)for(const rk in COOK){const ck=COOK[rk];if(!(ck in R.fd)||!(rk in R.fd))continue;const drop=Math.max(0,Math.max(0,R.fd[rk]+dAck('prov',rk))-qv[rk]);if(drop>0)cv[ck]=Math.ceil((drop+Math.min(drop,ra))*1.25)}
  if(!master&&!first){for(const ak in ARQ){const [mk,mc,wc]=ARQ[ak];if(!(ak in R.fd)||!(mk in R.fd)||!('mad' in R.fd))continue;const dm=Math.max(0,Math.max(0,R.fd[mk]+dAck('prov',mk))-qv[mk]),dw=Math.max(0,Math.max(0,R.fd.mad+dAck('prov','mad'))-qv.mad),bt=Math.min(Math.floor(dm/mc),Math.floor(dw/wc));if(bt>0)cv[ak]=bt*20}
   if('ar0' in R.fd){const inc=qv.ar0-Math.max(0,R.fd.ar0+dAck('prov','ar0'));if(inc>ra){const nb=Math.min(inc-ra,Math.floor(gsp*.6));if(nb>0){cv.ar0=nb;gsp-=Math.ceil(nb/.6)}}}}
  for(const k of Object.keys(R.fd)){let q=qv[k];if(!master&&!first){const mx=Math.max(0,R.fd[k]+dAck('prov',k))+(KEYK.has(k)?0:ra)+(cv[k]||0);if(q>mx){flag(u,'provisión '+k+' '+R.fd[k]+'→'+q);q=mx;fix.fd=1}}o[k]=q}v.fd=o}
 if(v.ec&&typeof v.ec==='object'){const o={};for(const k of EVK){let q=int(v.ec[k],0,1e6,0);if(!master&&!first){const mx=Math.max(0,R.ec[k]+dAck('ec',k))+Math.ceil(CFG.ecRate*dt*CFG.slack+CFG.ecBurst);if(q>mx){flag(u,'monedas '+k+' '+R.ec[k]+'→'+q);q=mx;fix.ec=1}}o[k]=q}v.ec=o}
 v.p=int(v.p,0,99,0);if(v.mpp!=null)v.mpp=int(v.mpp,0,99,0);
 /* pociones básicas: solo suben si se pagaron con oro (la más barata cuesta unos 39 🪙 en la feria) o por el goteo de botines; ya no se rellenan gratis editando el guardado */
 if(!master&&!first){const pb=a.pb&&typeof a.pb==='object'?a.pb:(a.pb={v:30,t:now});pb.v=Math.min(30,(+pb.v||0)+Math.max(0,now-(+pb.t||now))/6000);pb.t=now;
  let cr=Math.floor(gsp/34);
  const lim=(cur,base)=>{const inc=cur-base;if(inc<=0)return cur;const a1=Math.min(inc,cr);cr-=a1;let rest=inc-a1;const a2=Math.min(rest,Math.floor(pb.v));pb.v-=a2;rest-=a2;return rest>0?cur-rest:cur};
  const np=lim(v.p,Math.max(0,R.pot+dAck('pot')));if(np!==v.p){v.p=np;fix.pp=np}
  if(v.mpp!=null){if(a.mpok){const nm=lim(v.mpp,Math.max(0,R.mpot|0));if(nm!==v.mpp){v.mpp=nm;fix.pm=nm}}}}
 /* mochila de loot: cuántas unidades de cada provisión están en la bolsa de loot (solo es una etiqueta, nunca da recursos) */
 if(v.fl&&typeof v.fl==='object'&&!Array.isArray(v.fl)){const o={};let n=0;for(const k of Object.keys(v.fl)){if(!/^[a-z0-9]{2,5}$/.test(k)||++n>80)continue;const q=int(v.fl[k],0,1e6,0);if(q)o[k]=q}v.fl=o}else if('fl' in v)delete v.fl;
 /* ---- objetos ---- */
 const seen=new Set(),idSet=new Set();let dropped=0;
 const bad=preBad.slice();const chk=(it,slot)=>{const r=chk0(it,slot);if(!r&&it&&it.id)bad.push(String(it.id));return r};const chk0=(it,slot)=>{const c=cleanItem(it);if(!c){dropped++;flag(u,'objeto inválido '+JSON.stringify(it).slice(0,90));return null}
  if(c.id){if(seen.has(c.id)){dropped++;flag(u,'objeto duplicado en la misma cuenta');return null}seen.add(c.id);const r=ECO.reg[c.id];
   if(r&&r.o!==u&&!master){dropped++;if(now-(r.t||0)>3e4)flag(u,'objeto de otro jugador/duplicado '+c.id,2);return null}
   if(!r){if(!first&&!master&&!mintOk(a,'i',c.r,now)){dropped++;flag(u,'demasiados objetos nuevos de rareza '+c.r);return null}ECO.reg[c.id]={o:u,k:'i',t:now};S.dirty()}else if(r.o!==u&&master){ECO.reg[c.id]={o:u,k:'i',t:now}}}
  if(c.up){const rr=c.id&&ECO.reg[c.id],mx=(rr&&rr.up)|0;if(c.up>mx&&!master){flag(u,'potenciación falsa +'+c.up+' (permitido +'+mx+')');c.up=mx}if(!c.up)delete c.up}
  return c};
 if(v.eq&&typeof v.eq==='object'){const e={};for(const k of Object.keys(v.eq).slice(0,7)){const c=chk(v.eq[k]);if(c)e[k]=c}v.eq=e}
 if(Array.isArray(v.bag))v.bag=v.bag.slice(0,v.bgc).map(x=>chk(x)).filter(Boolean);
 if(Array.isArray(v.lb))v.lb=v.lb.slice(0,v.lgc).map(x=>chk(x)).filter(Boolean);else v.lb=[];
 if(Array.isArray(v.dep))v.dep=v.dep.slice(0,60).map(x=>chk(x)).filter(Boolean);else v.dep=[];
 if(Array.isArray(v.pets)){const ids=[];v.pets=v.pets.slice(0,12).map(p=>{const c=cleanPetS(p);if(!c){dropped++;return null}if(c.id){if(seen.has(c.id)){dropped++;return null}seen.add(c.id);const r=ECO.reg[c.id];if(r&&r.o!==u&&!master){dropped++;if(now-(r.t||0)>3e4)flag(u,'mascota de otro jugador '+c.id,2);return null}if(!r){if(!first&&!master&&!mintOk(a,'p',0,now)){dropped++;flag(u,'demasiadas mascotas nuevas');return null}ECO.reg[c.id]={o:u,k:'p',t:now};S.dirty()}}return c}).filter(Boolean)}
 if(dropped)fix.items=dropped;
 /* limpieza del registro: lo que ya no está en el guardado ni en el mercado deja de ser tuyo */
 const pendIds=new Set();for(const d of a.dl){if(d.item&&d.item.id)pendIds.add(d.item.id);if(d.pet&&d.pet.id)pendIds.add(d.pet.id)}
 for(const id in ECO.reg){const r=ECO.reg[id];if(r.o===u&&!seen.has(id)&&!pendIds.has(id)&&now-(r.t||0)>6e4){delete ECO.reg[id]}}
 /* ---- lo que paga el jugador con dinero real: SIEMPRE manda el servidor ---- */
 v.gm=a.gem.own;v.gx=a.gem.tr;
 {const L=a.bxl,hasK=Array.isArray(v.bxt),rp=Array.isArray(v.bx)?v.bx:[0,0,0,0],ck=hasK?v.bxt:[0,0,0,0],o4=[0,0,0,0],first=!L.m;
  if(!hasK){/* cliente nuevo/sin sincronizar (o versión vieja): su tiempo de Bonus no vale; manda el servidor hasta que sincronice */v.bx=L.x.map((x,i)=>x+Math.max(0,L.t[i]-L.a[i]));v.bxt=L.t.slice()}else{
  for(let i=0;i<4;i++){const rb=int(rp[i],0,BX.max,0),cl=Math.min(int(ck[i],0,1e13,0),L.t[i]);let ok=rb;
   if(!master){const cap=L.x[i]+Math.max(0,cl-L.a[i]);if(rb>cap+2000){if(!first)flag(u,'bonus '+i+' imposible: '+Math.round(L.x[i]/6e4)+'→'+Math.round(rb/6e4)+' min',2);ok=cap;fix.bx=1}}
   o4[i]=ok;L.x[i]=ok;L.a[i]=Math.max(L.a[i],cl)}
  L.m=1;v.bx=o4;v.bxt=L.t.slice()}}v.vp=a.vip;v.pr=Object.assign({},v.pr&&typeof v.pr==='object'?v.pr:{},a.px);v.lic=a.lic;v.bo=a.sk.slice();v.sk=a.ev.slice();
 if(v.bsk&&!a.sk.includes(v.bsk))v.bsk='';
 v.ml=0;/* el master lo decide el servidor */
 /* ---- aceptar ---- */
 a.res.gold=v.g;a.res.bk=v.bk;a.res.g=v.i.slice();if(v.fd)a.res.fd=Object.assign({},v.fd);if(v.ec)a.res.ec=Object.assign({},v.ec);a.res.pot=v.p;if(v.mpp!=null){a.res.mpot=v.mpp;a.mpok=1}
 a.lv=lv;a.xp=xp;if(typeof v.nm==='string'&&v.nm)a.pn=v.nm.replace(/[^\p{L}\p{N} '_-]/gu,'').slice(0,18);if(Array.isArray(v.sx))a.sx=v.sx.slice();a.ts=now;a.first=0;S.dirty();
 /* lo que sigue sin aplicar (entregas pendientes) se descuenta del esperado para que no se aplique dos veces */
 return{out:JSON.stringify(v),fix:Object.keys(fix).length?{g:v.g,bk:v.bk,i:v.i,lv:v.lv,xp:v.xp,fd:v.fd,ec:v.ec,sx:v.sx,items:dropped||0,bad,cl:fix.cl,p:fix.pp,mp:fix.pm,bx:fix.bx?v.bx:undefined}:null,acked:acked.map(d=>d.id)}}
/* migración única: quita los strikes falsos que el antitrampas daba por cocinar carne/pescado (ya no ocurre) */
try{if(!ECO.fixCook){ECO.fixCook=1;let n=0;for(const id in ECO.acc){const a=ECO.acc[id];if(!a||!Array.isArray(a.flags)||!a.flags.length)continue;const bad=a.flags.filter(f=>/^provisi.n (cocida|coc\d|fc\d) /.test(String(f&&f[1])));if(!bad.length)continue;a.flags=a.flags.filter(f=>!bad.includes(f));a.strikes=Math.max(0,(a.strikes|0)-bad.length);if(a.strikes<3)a.notified=0;n++}if(n){S.dirty();log('[antitrampas] migración: '+n+' cuenta(s) sin strikes falsos por cocinar')}}}catch(e){log('migración cocinar: '+e.message)}
return{reg:()=>ECO.reg,UPC,MNK,acct,ent,pushEnt,audit,deliver,flushDl,avail,reserved,forceExpired,applyRes,resVal,spendGems,grantGems,glAdd,gTot,claimName,uidByName,flag,cleanItem,cleanPetS,CFG,xpNeed,rid,EVK,PRK,RM,BX}};
