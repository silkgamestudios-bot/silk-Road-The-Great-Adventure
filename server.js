/* Silk Road · servidor en tiempo real (WebSocket). Almacén de documentos con REGLAS aplicadas en el servidor
   + billetera de gemas autoritativa (gems.js). Mismo API que usa el juego (collection/doc/where/onSnapshot). */
const http=require('http'),fs=require('fs'),crypto=require('crypto'),{WebSocketServer}=require('ws'),{createGems}=require('./gems'),{World}=require('./world'),{createChars}=require('./char');
const PORT=process.env.PORT||8080,DIR=process.env.DATA_DIR||'.',FILE=DIR+'/db.json';
const ORI=(process.env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
const sha=s=>crypto.createHash('sha256').update(String(s)).digest('hex');
let DB={},TOK={},dirty=0;try{const j=JSON.parse(fs.readFileSync(FILE,'utf8'));DB=j.db||{};TOK=j.tok||{}}catch(e){}
const EPH=new Set(['pmem','wagons','pmsg','hits']);              // efímeras: no se guardan en disco
function flush(){dirty=0;const db={};for(const c in DB)if(!EPH.has(c))db[c]=DB[c];try{fs.writeFileSync(FILE+'.tmp',JSON.stringify({db,tok:TOK}));fs.renameSync(FILE+'.tmp',FILE)}catch(e){console.error('flush',e.message)}}
setInterval(()=>{if(dirty)flush()},5000);
const isMaster=u=>!!(DB.cfg&&DB.cfg.master&&DB.cfg.master.u===u);
const str=x=>typeof x==='string'&&x.length>0&&x.length<=80;
/* REGLAS de escritura: (u = jugador autenticado, id, d = doc nuevo, o = doc anterior o null) */
const RULES={
 pmem:(u,id)=>id===u, wagons:(u,id)=>id===u, shops:(u,id)=>id===u,
 wallets:()=>false, gemreq:()=>false, gemgrant:()=>false, gemtx:()=>false,          // dinero: SOLO por RPC del servidor (gem.*)
 cfg:(u,id,d)=>id==='pay'&&isMaster(u)&&typeof d.id==='string'&&d.id.length<=60,    // 'master' solo lo escribe el servidor
 pmsg:(u,id,d,o)=>!o&&d.from===u&&str(d.to), hits:(u,id,d,o)=>!o&&d.a===u&&str(d.w)&&!(+d.d>600),
 loot:(u,id,d,o)=>!o&&str(d.to)&&d.to!==u,
 orders:(u,id,d,o)=>o?((o.from===u||o.to===u)&&d.from===o.from&&d.to===o.to):(d.from===u&&str(d.to)&&d.to!==u),
 offers:(u,id,d,o)=>o?(o.u===u&&d.u===u):d.u===u};                                   // subastas/ofertas: solo su dueño las crea/modifica
const INBOX={pmsg:['to','from'],loot:['to'],hits:['w'],orders:['to','from'],wallets:['u'],gemreq:['u']};   // solo escuchas tu propio buzón
const canRead=(u,c,d)=>{if(!d)return true;switch(c){case'wallets':return d.u===u;case'gemreq':return d.u===u||isMaster(u);case'orders':return d.from===u||d.to===u;
 case'pmsg':return d.to===u||d.from===u;case'loot':return d.to===u;case'hits':return d.w===u;default:return true}};
const canDel=(c,u,id,o)=>{if(!o)return true;if(c==='wallets'||c==='gemreq'||c==='cfg')return false;if(c==='offers')return o.u===u;return id===u||[o.u,o.to,o.w,o.from,o.a].includes(u)};
const match=(d,w)=>!!d&&w.every(x=>x[1]==='=='&&d[x[0]]===x[2]);
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/plain'});r.end('Silk Road server OK')});
const wss=new WebSocketServer({server:srv,maxPayload:200000});
function bc(c,id,o,n){for(const ws of wss.clients){if(!ws.uid)continue;for(const s in ws.subs){const b=ws.subs[s];if(b.c!==c)continue;
 const mo=match(o,b.w)&&canRead(ws.uid,c,o),mn=match(n,b.w)&&canRead(ws.uid,c,n);if(mo||mn)ws.send(JSON.stringify({t:'ch',sid:+s,id,d:mn?n:null}))}}}
const BYU=new Map();
function push(u,obj){const a=BYU.get(u);if(!a)return;const s=JSON.stringify(obj);for(const ws of a)if(ws.readyState===1)ws.send(s)}
const G=createGems({DB,flush,push,bc,masterKey:process.env.MASTER_KEY});
const CH=createChars({DB,flush,push});
let WORLD=null;try{if(process.env.WORLD!=='0')WORLD=new World({file:__dirname+'/world.json',send:push,onXp:(u,n)=>CH.addXp(u,n),sxOf:u=>CH.get(u).sx[0]});console.log('Mundo compartido:',WORLD.rows.length,'enemigos')}catch(e){console.log('Mundo compartido DESACTIVADO:',e.message)}
setInterval(()=>{if(WORLD)try{WORLD.tick(.1);WORLD.snaps()}catch(e){console.error('world',e)}},100);
wss.on('connection',(ws,req)=>{const og=req.headers.origin;if(ORI.length&&og&&!ORI.includes(og)){ws.close(1008);return}
 ws.subs={};ws.uid=null;ws.n=0;ws.t=Date.now();ws.isAlive=true;ws.on('pong',()=>ws.isAlive=true);
 ws.on('message',raw=>{const now=Date.now();if(now-ws.t>1000){ws.t=now;ws.n=0}if(++ws.n>80)return;let m;try{m=JSON.parse(raw)}catch(e){return}if(!m||typeof m!=='object')return;
  const rep=o=>ws.send(JSON.stringify(o)),err=e=>m.rid&&rep({t:'r',rid:m.rid,ok:0,e});
  if(m.t==='hi'){const u=String(m.uid||''),k=sha(m.tok);if(!/^[\w-]{3,40}$/.test(u)||!m.tok){ws.close();return}
   if(TOK[u]&&TOK[u]!==k){rep({t:'bad'});ws.close();return}if(!TOK[u]){TOK[u]=k;dirty=1}ws.uid=u;(BYU.get(u)||BYU.set(u,new Set()).get(u)).add(ws);const w=G.ensure(u);dirty=1;rep({t:'ok'});rep({t:'wal',w:G.pub(w)});{const c=CH.get(u);if(c.tn&&Date.now()>=c.tn.end)CH.API.me(u);rep({t:'pc',c:CH.pub(c),fresh:!c.init})}if(WORLD&&!WORLD.PL.has(u))WORLD.join(u);else if(WORLD)WORLD.send(u,WORLD.hello(u));return}
  if(!ws.uid)return;const u=ws.uid;
  if(m.t==='w.pos'){if(WORLD)WORLD.pos(u,m);return}if(m.t==='w.hit'){if(WORLD)WORLD.hit(u,m);return}
  if(typeof m.t==='string'&&m.t.startsWith('ch.')){const k=m.t.slice(3);if(!Object.prototype.hasOwnProperty.call(CH.API,k)){err('operación desconocida');return}
   try{rep(Object.assign({t:'r',rid:m.rid,ok:1},CH.API[k](u,m)||{}))}catch(e){err(e.message)}return}
  if(typeof m.t==='string'&&m.t.startsWith('gem.')){const f=G.API[m.t.slice(4)];if(!f||!Object.prototype.hasOwnProperty.call(G.API,m.t.slice(4))){err('operación desconocida');return}
   try{rep(Object.assign({t:'r',rid:m.rid,ok:1},f(u,m)||{}))}catch(e){err(e.message)}return}
  const c=String(m.col||''),id=String(m.id||''),w=Array.isArray(m.w)?m.w.slice(0,4):[];
  if(m.t==='unsub'){delete ws.subs[m.sid];return}
  if(!Object.prototype.hasOwnProperty.call(RULES,c)){err('colección no permitida');return}
  if(m.t==='sub'||m.t==='q'){const need=INBOX[c];
   if(need&&!(c==='gemreq'&&isMaster(u))&&!w.some(x=>x[1]==='=='&&need.includes(x[0])&&x[2]===u)){err('buzón privado');return}
   const docs={};for(const k in DB[c]||{})if(match(DB[c][k],w)&&canRead(u,c,DB[c][k]))docs[k]=DB[c][k];
   if(m.t==='sub'){ws.subs[m.sid]={c,w};rep({t:'snap',sid:m.sid,docs})}else rep({t:'r',rid:m.rid,ok:1,docs});return}
  if(m.t==='get'){const d=(DB[c]||{})[id]||null;rep({t:'r',rid:m.rid,ok:1,d:canRead(u,c,d)?d:null});return}
  if(!id||id.length>80){err('id inválido');return}const old=(DB[c]||{})[id]||null;
  if(m.t==='del'){if(!canDel(c,u,id,old)){err('prohibido');return}if(old){delete DB[c][id];dirty=1;bc(c,id,old,null)}rep({t:'r',rid:m.rid,ok:1});return}
  if(m.t==='set'||m.t==='upd'){let d=m.d;if(!d||typeof d!=='object'||Array.isArray(d)||JSON.stringify(d).length>8000){err('doc inválido');return}
   if(m.t==='upd'&&old)d=Object.assign({},old,d);if(!RULES[c](u,id,d,old)){err('prohibido por las reglas');return}
   (DB[c]=DB[c]||{})[id]=d;dirty=1;bc(c,id,old,d);rep({t:'r',rid:m.rid,ok:1});return}});
 ws.on('close',()=>{ws.subs={};if(ws.uid){const a=BYU.get(ws.uid);if(a){a.delete(ws);if(!a.size){BYU.delete(ws.uid);if(WORLD)WORLD.leave(ws.uid)}}}})});
setInterval(()=>{for(const ws of wss.clients){if(!ws.isAlive){ws.terminate();continue}ws.isAlive=false;ws.ping()}},30000);
if(require.main===module)srv.listen(PORT,()=>console.log('Silk Road server en puerto',PORT));
module.exports={srv,DB,flush,CH,get WORLD(){return WORLD}};
