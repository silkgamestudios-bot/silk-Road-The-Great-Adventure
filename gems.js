/* Billetera de gemas AUTORITATIVA en el servidor. El cliente nunca escribe saldos: solo pide operaciones (RPC). */
const crypto=require('crypto');
const GPK=[{g:1,b:0},{g:3,b:0},{g:5,b:0},{g:10,b:0}],GMIN=1,GMAX=5000,MAXQ=1e6;   // = tabla del juego (1 USDT = 1 💎)
const calc=u=>{u=Math.max(0,Math.floor(+u||0));let p=0;for(const k of GPK)if(u>=k.g)p=k.b;return Math.floor(u*(100+p)/100)};
const num=(x,max)=>{x=Math.floor(+x);return Number.isFinite(x)&&x>=1&&x<=max?x:0};
const eq=(a,b)=>{const x=crypto.createHash('sha256').update(String(a)).digest(),y=crypto.createHash('sha256').update(String(b)).digest();return crypto.timingSafeEqual(x,y)};
function createGems(ctx){            // ctx: {DB, flush(), push(uid,obj), bc(col,id,old,new), masterKey}
 const DB=ctx.DB,sends=new Map(),fails=new Map();
 const W=u=>(DB.wallets||{})[u]||null,pub=w=>({gem:w.gem,gemT:w.gemT,vip:w.vip||0});
 const ensure=u=>{const t=DB.wallets=DB.wallets||{};return t[u]||(t[u]={u,nm:'',gem:0,gemT:0,vip:0,ts:Date.now()})};
 const log=e=>{const L=DB.gemlog=DB.gemlog||[];L.push(Object.assign({ts:Date.now()},e));if(L.length>5000)L.splice(0,L.length-5000)};
 const commit=(u,w)=>{w.ts=Date.now();ctx.flush();ctx.push(u,{t:'wal',w:pub(w)})};
 const isMaster=u=>!!(DB.cfg&&DB.cfg.master&&DB.cfg.master.u===u);
 const need=u=>{if(!isMaster(u))throw new Error('solo el master')};
 const hit=(map,u,max,ms)=>{const n=Date.now(),a=(map.get(u)||[]).filter(t=>n-t<ms);if(a.length>=max)return 0;a.push(n);map.set(u,a);return 1};
 const API={
  me(u){return{w:pub(ensure(u))}},
  sync(u,m){const w=ensure(u);if(typeof m.nm==='string')w.nm=m.nm.slice(0,24);if(m.vip!=null){const v=Math.floor(+m.vip);if(Number.isFinite(v)&&v>=0&&v<9e15)w.vip=v}ctx.flush();return{w:pub(w)}},
  who(u,m){const b=W(String(m.to||''));if(!b)throw new Error('ese jugador no existe');return{nm:b.nm||'jugador'}},
  spend(u,m){const n=num(m.n,MAXQ);if(!n)throw new Error('cantidad inválida');const w=ensure(u);
   if(m.own){if(w.gem<n)throw new Error('saldo insuficiente');w.gem-=n}
   else{if(w.gem+w.gemT<n)throw new Error('saldo insuficiente');const t=Math.min(w.gemT,n);w.gemT-=t;w.gem-=n-t}
   log({k:'spend',u,n,own:m.own?1:0,why:String(m.why||'').slice(0,40)});commit(u,w);return{w:pub(w)}},
  send(u,m){const to=String(m.to||''),q=num(m.q,MAXQ);if(!q||to===u)throw new Error('datos inválidos');
   const a=ensure(u),b=W(to);if(!b)throw new Error('ese jugador no existe');if(!hit(sends,u,10,36e5))throw new Error('demasiadas transferencias (máx. 10 por hora)');
   if(a.gem+a.gemT<q)throw new Error('saldo insuficiente');const t=Math.min(a.gemT,q);a.gemT-=t;a.gem-=q-t;b.gemT+=q;   // las recibidas son 'transferidas' (solo atuendos)
   log({k:'send',u,to,n:q});commit(u,a);commit(to,b);ctx.push(to,{t:'note',k:'gemrx',q,fn:a.nm||'un jugador'});return{w:pub(a),nm:b.nm||'jugador'}},
  req(u,m){const w=ensure(u),usdt=num(m.usdt,GMAX);if(!usdt||usdt<GMIN)throw new Error('monto fuera de rango');
   const ref=String(m.ref||'').trim().slice(0,80);if(ref.length<8)throw new Error('referencia demasiado corta');
   let img=typeof m.img==='string'?m.img:'';if(img&&(img.length>150000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(img)))img='';
   const R=DB.gemreq=DB.gemreq||{};if(Object.values(R).filter(r=>r.u===u&&r.st==='p').length>=3)throw new Error('ya tienes 3 solicitudes pendientes');
   const id='r'+crypto.randomBytes(8).toString('hex'),d={u,nm:w.nm||String(m.nm||'').slice(0,24),usdt,gems:calc(usdt),ref,img,st:'p',ts:Date.now()};
   R[id]=d;log({k:'req',u,usdt,rid:id});ctx.bc('gemreq',id,null,d);ctx.flush();return{id}},
  approve(u,m){need(u);const id=String(m.id||''),r=(DB.gemreq||{})[id];if(!r)throw new Error('no existe');if(r.st!=='p')throw new Error('ya fue procesada');
   const old=Object.assign({},r);
   if(m.ok){const g=Math.min(MAXQ,calc(r.usdt)),w=W(r.u);if(!w)throw new Error('el jugador no tiene billetera');w.gem+=g;r.st='a';log({k:'grant',u:r.u,n:g,by:u,rid:id});commit(r.u,w);ctx.push(r.u,{t:'note',k:'gemgrant',q:g})}
   else r.st='r';
   r.by=u;r.ts2=Date.now();r.img='';ctx.bc('gemreq',id,old,r);ctx.flush();return{}},
  credit(u,m){need(u);const q=num(m.q,MAXQ);if(!q)throw new Error('cantidad inválida');const to=m.to?String(m.to):u,w=W(to);if(!w)throw new Error('ese jugador no existe');
   w.gem+=q;log({k:'credit',u:to,n:q,by:u});commit(to,w);if(to!==u)ctx.push(to,{t:'note',k:'gemgrant',q});return{w:pub(ensure(u))}},
  claim(u,m){if(!ctx.masterKey||String(ctx.masterKey).length<12)throw new Error('master deshabilitado (falta MASTER_KEY en el servidor)');
   if(!hit(fails,u,5,6e5))throw new Error('demasiados intentos');if(!eq(m.key||'',ctx.masterKey))throw new Error('clave incorrecta');
   const C=DB.cfg=DB.cfg||{},old=C.master||null;C.master={u,ts:Date.now()};log({k:'master',u});ctx.bc('cfg','master',old,C.master);ctx.flush();return{}}};
 return{API,ensure,isMaster,calc,pub};
}
module.exports={createGems,calc,GPK,GMIN,GMAX};
