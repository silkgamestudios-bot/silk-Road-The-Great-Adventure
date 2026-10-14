/* Progresión del personaje AUTORITATIVA: nivel, XP, skills y carpa de entrenamiento viven aquí.
   El cliente solo pide ('ch.*') y recibe el estado completo ({t:'ch',c}). Las fórmulas son las del juego (v14.8). */
const LVMAX=1200,SKM=600,SKHARD=1,LV_IMPORT=+process.env.IMPORT_LV_MAX||30,SK_IMPORT=+process.env.IMPORT_SK_MAX||5;   // = cliente v15 (comprobado con tools/parity.js)
const xpNeed=l=>Math.round((30+90*l+3*l*l)*(1.3+.05*l)),skNeed=s=>Math.round(SKHARD*1000*Math.exp(.01184*(s-1)));
const TRT=[{N:1,mt:0,of:20000,min:1,cap:150},{N:3,mt:3,of:2e6,min:120,cap:330},{N:10,mt:6,of:4e6,min:270,cap:SKM}],TRH=[1,4,8];
const trPph=t=>Math.round(400*t.N*(1+.35*t.mt)),trFee=t=>t.of;
const trEff=(s,t)=>s<t.min||s>=t.cap?0:s>t.cap*.9?Math.max(.1,(t.cap-s)/(t.cap*.1)):1;
const XP={CALL:(l)=>Math.max(5000,2*xpNeed(l)),HOUR:(l)=>Math.max(20000,4*xpNeed(l))};   // tope de XP "declarada por el cliente" (tareas, descubrimientos…)
const int=(x,lo,hi)=>{x=Math.floor(+x);return Number.isFinite(x)?Math.max(lo,Math.min(hi,x)):lo};
function createChars(ctx){            // ctx:{DB, flush(), push(uid,obj), now()}
 const DB=ctx.DB,now=ctx.now||Date.now,store=()=>DB.chars=DB.chars||{};
 const pub=c=>({lv:c.lv,xp:Math.round(c.xp*100)/100,sx:c.sx.slice(),sxp:c.sxp.map(v=>Math.round(v*100)/100),tn:c.tn||null});
 const ensure=u=>store()[u]||(store()[u]={lv:1,xp:0,sx:[1,1,1],sxp:[0,0,0],tn:null,xs:[],init:0,dd:0,ts:now()});
 const send=(u,c,extra)=>ctx.push(u,Object.assign({t:'pc',c:pub(c)},extra||{}));
 const commit=(u,c,extra)=>{c.ts=now();ctx.flush();send(u,c,extra)};
 function sim(c,k,ti,mins){let lv=c.sx[k],xp=c.sxp[k],pts=0;const t=TRT[ti],pm=trPph(t)/60;
  for(let i=0;i<mins&&lv<SKM;i++){const e=trEff(lv,t);if(e<=0)break;const g=pm*e;xp+=g;pts+=g;while(xp>=skNeed(lv)&&lv<SKM){xp-=skNeed(lv);lv++}}if(lv>=SKM)xp=0;return{lv,xp,pts:Math.round(pts)}}
 function addXp(u,n){const c=ensure(u);if(!(n>0)||c.lv>=LVMAX)return 0;c.xp+=n;let up=0;while(c.xp>=xpNeed(c.lv)&&c.lv<LVMAX){c.xp-=xpNeed(c.lv);c.lv++;up++}commit(u,c,up?{up:c.lv}:null);return up}
 function settle(u,c,early){const n=c.tn;if(!n)return null;const e=Math.min(now(),n.end)-n.t0,r=sim(c,n.k,n.t,Math.max(0,Math.floor(e/6e4)));c.sx[n.k]=r.lv;c.sxp[n.k]=r.xp;c.tn=null;return r}
 const API={
  me(u){const c=ensure(u);if(c.tn&&now()>=c.tn.end){settle(u,c,0);ctx.flush()}return{c:pub(c),fresh:!c.init}},
  init(u,m){const c=ensure(u);if(c.init)throw new Error('el personaje ya está registrado en el servidor');
   c.lv=int(m.lv,1,LV_IMPORT);c.xp=Math.max(0,Math.min(xpNeed(c.lv)-1,+m.xp||0));const sx=Array.isArray(m.sx)?m.sx:[],sp=Array.isArray(m.sxp)?m.sxp:[];
   for(let i=0;i<3;i++){c.sx[i]=int(sx[i],1,SK_IMPORT);c.sxp[i]=Math.max(0,Math.min(skNeed(c.sx[i])-1,+sp[i]||0))}c.init=1;commit(u,c);return{c:pub(c)}},
  xp(u,m){const c=ensure(u);if(!c.init)throw new Error('personaje sin registrar');const n=int(m.n,1,1e9),t=now();
   if(n>XP.CALL(c.lv))throw new Error('XP demasiado grande para una sola fuente');c.xs=c.xs.filter(a=>t-a[0]<36e5);const used=c.xs.reduce((a,b)=>a+b[1],0);
   if(used+n>XP.HOUR(c.lv))throw new Error('límite de XP por hora alcanzado');c.xs.push([t,n]);addXp(u,n);return{c:pub(c)}},
  die(u){const c=ensure(u);if(!c.init)return{c:pub(c)};const t=now();if(t-(c.dd||0)<15000)return{c:pub(c)};c.dd=t;const L=Math.round(xpNeed(c.lv)*.4);
   if(c.xp>=L)c.xp-=L;else{let df=L-c.xp;c.xp=0;while(df>0&&c.lv>1){c.lv--;const nd=xpNeed(c.lv);if(df<=nd){c.xp=nd-df;df=0}else df-=nd}}commit(u,c);return{c:pub(c)}},
  camp(u,m){const c=ensure(u);if(!c.init)throw new Error('personaje sin registrar');const op=String(m.op||'');
   if(op==='start'){if(c.tn)throw new Error('ya estás entrenando');const k=int(m.k,0,2),ti=int(m.t,0,2),hi=int(m.h,0,2),T=TRT[ti],s=c.sx[k];
    if(s<T.min)throw new Error('necesitas habilidad '+T.min);if(s>=T.cap)throw new Error('ya superaste este entrenamiento');const h=TRH[hi],tt=now();
    c.tn={k,t:ti,t0:tt,h,end:tt+h*36e5};commit(u,c);return{c:pub(c),fee:trFee(T)*h}}
   if(op==='end'){if(!c.tn)throw new Error('no estás entrenando');if(now()<c.tn.end-2000)throw new Error('aún no termina');const r=settle(u,c);commit(u,c);return{c:pub(c),pts:r.pts}}
   if(op==='retire'){if(!c.tn)throw new Error('no estás entrenando');const r=settle(u,c);commit(u,c);return{c:pub(c),pts:r.pts}}
   throw new Error('operación inválida')}};
 return{API,ensure,pub,addXp,sim,send,get:u=>ensure(u)}}
module.exports={SKHARD,createChars,xpNeed,skNeed,trPph,trFee,trEff,TRT,LVMAX,SKM,LV_IMPORT,SK_IMPORT,XP};
