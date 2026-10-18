/* Silk Road · servidor en tiempo real (WebSocket). El SERVIDOR MANDA en: cuentas, gemas, apariencias, oro/objetos verificados, mercado,
   gremios y mundo compartido. El cliente solo muestra y pide; cada petición se valida aquí. */
const http=require('http'),fs=require('fs'),crypto=require('crypto'),{WebSocketServer}=require('ws');
const cat=require('./catalog');
const PORT=process.env.PORT||8080,FILE=(process.env.DATA_DIR||'.')+'/db.json';
const ORI=(process.env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
const sha=s=>crypto.createHash('sha256').update(String(s)).digest('hex');
const MASTER=process.env.MASTER_UID||'';
/* ---- Cuentas con Google, master por Gmail, pagos y notificaciones ---- */
const GCID=process.env.GOOGLE_CLIENT_ID||'',MASTER_EMAIL=(process.env.MASTER_EMAIL||'').trim().toLowerCase();
const TOKINFO=process.env.GOOGLE_TOKENINFO_URL||'https://oauth2.googleapis.com/tokeninfo?id_token=';
const PAY_ID=process.env.BINANCE_PAY_ID||'748095851',WA_NUMBER=(process.env.MASTER_WHATSAPP||'18093965707').replace(/\D/g,'');
const CALLMEBOT_KEY=process.env.CALLMEBOT_KEY||'',CALLMEBOT_URL=process.env.CALLMEBOT_URL||'https://api.callmebot.com/whatsapp.php',WA_TOKEN=process.env.WA_TOKEN||'',WA_PHONE_ID=process.env.WA_PHONE_ID||'';
const SAVEDIR=(process.env.DATA_DIR||'.')+'/saves';try{fs.mkdirSync(SAVEDIR,{recursive:true})}catch(e){}
let DB={},TOK={},SES={},ACC={},ECO={},dirty=0;
try{const j=JSON.parse(fs.readFileSync(FILE,'utf8'));DB=j.db||{};TOK=j.tok||{};SES=j.ses||{};ACC=j.acc||{};ECO=j.eco||{}}catch(e){}
for(const k in SES)if(SES[k].x<Date.now())delete SES[k];
DB.cfg=DB.cfg||{};if(PAY_ID&&!(DB.cfg.pay&&DB.cfg.pay.id===PAY_ID))DB.cfg.pay={id:PAY_ID,ts:Date.now()};
const isMaster=u=>(MASTER&&u===MASTER)||(!!MASTER_EMAIL&&!!ACC[u]&&ACC[u].e===MASTER_EMAIL)||(!MASTER&&!MASTER_EMAIL&&!!(DB.cfg&&DB.cfg.master&&DB.cfg.master.u===u));
const log=s=>console.log(s);
const EPH=new Set(['pmem','wagons','pmsg','hits','pres','pinv','pkill']);              // efímeras: no se guardan en disco
const save=sync=>{dirty=0;const db={};for(const c in DB)if(!EPH.has(c))db[c]=DB[c];const j=JSON.stringify({db,tok:TOK,ses:SES,acc:ACC,eco:ECO});if(sync){fs.writeFileSync(FILE+'.tmp',j);fs.renameSync(FILE+'.tmp',FILE)}else fs.writeFile(FILE+'.tmp',j,e=>{if(!e)fs.rename(FILE+'.tmp',FILE,()=>{})})};
setInterval(()=>{if(dirty)save()},5000);
/* copias de seguridad cada 6 h (se guardan 14) en DATA_DIR/backups */
const BKDIR=(process.env.DATA_DIR||'.')+'/backups';try{fs.mkdirSync(BKDIR,{recursive:true})}catch(e){}
setInterval(()=>{try{if(!fs.existsSync(FILE))return;const n=new Date().toISOString().slice(0,13).replace(/[-T:]/g,'');fs.copyFileSync(FILE,BKDIR+'/db-'+n+'.json');const l=fs.readdirSync(BKDIR).filter(x=>x.startsWith('db-')).sort();while(l.length>14)fs.unlinkSync(BKDIR+'/'+l.shift())}catch(e){}},6*36e5);
for(const sg of['SIGTERM','SIGINT'])process.on(sg,()=>{try{save(1)}catch(e){}process.exit(0)});
async function notify(text){try{
 if(CALLMEBOT_KEY){await fetch(CALLMEBOT_URL+'?phone='+WA_NUMBER+'&text='+encodeURIComponent(text)+'&apikey='+encodeURIComponent(CALLMEBOT_KEY))}
 else if(WA_TOKEN&&WA_PHONE_ID){await fetch('https://graph.facebook.com/v20.0/'+WA_PHONE_ID+'/messages',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+WA_TOKEN},body:JSON.stringify({messaging_product:'whatsapp',to:WA_NUMBER,type:'text',text:{body:text}})})}
 else log('[notificación sin proveedor WhatsApp configurado] '+text.replace(/\n/g,' | '))}catch(e){log('notify error '+e.message)}}
let lastN=0;const notifyRL=t=>{const n=Date.now();if(n-lastN<3000){setTimeout(()=>notify(t),3000);lastN=n+3000}else{lastN=n;notify(t)}};
async function gverify(cred){const r=await fetch(TOKINFO+encodeURIComponent(cred));if(!r.ok)throw new Error('token');const j=await r.json();
 if(j.aud!==GCID||!/accounts\.google\.com$/.test(String(j.iss||''))||String(j.email_verified)!=='true'||(+j.exp)*1000<Date.now()||!j.sub)throw new Error('token inválido');return{sub:String(j.sub),email:String(j.email||'').toLowerCase(),name:String(j.name||'').slice(0,40)}}
const newSes=u=>{const t=crypto.randomBytes(24).toString('hex');SES[sha(t)]={u,x:Date.now()+90*864e5};dirty=1;return t};
const savePath=u=>SAVEDIR+'/'+String(u).replace(/[^\w-]/g,'')+'.json';
const ONL=new Map();   // uid -> ws (una sola sesión por cuenta: evita duplicar objetos con dos pestañas)
const S={ECO,cat,log,DB,isMaster,notify:notifyRL,dirty:()=>{dirty=1},
 push:(u,m)=>{const w=ONL.get(u);if(w&&w.readyState===1)w.send(JSON.stringify(m))},online:u=>{const w=ONL.get(u);return !!w&&w.readyState===1},bc:(c,id,o,n)=>bc(c,id,o,n)};
const E=require('./economy')(S),MK=require('./market')(S,E),GD=require('./guild')(S,E),ST=require('./store')(S,E),SO=require('./social')(S,E);S.tagOf=u=>GD.tagOf(u);
S.onDeliver=u=>{try{if(DB.shops&&DB.shops[u])MK.shopView(u)}catch(e){}};
const OPS=Object.assign({},ST.ops,MK.ops,GD.ops,SO.ops);
setInterval(()=>{for(const u in ECO.acc){const a=ECO.acc[u];if(a.dl&&a.dl.length)E.forceExpired(a)}},30000);
/* REGLAS de las colecciones libres: quién puede crear/editar (u = jugador autenticado, id, d = doc nuevo, o = doc anterior) */
const SRV_ONLY=new Set(['offers','shops','orders','wallets','loot','gemtx']);   // solo el servidor escribe; el cliente las lee y pide operaciones
const small=(d,n)=>JSON.stringify(d).length<=n;
const RULES={
 pmem:(u,id,d)=>id===u&&small(d,2500), wagons:(u,id,d)=>id===u&&small(d,800), pmsg:(u,id,d)=>d.from===u&&small(d,1200), hits:(u,id,d)=>d.a===u&&Number.isFinite(+d.d)&&+d.d>=0&&+d.d<=600,
 cfg:(u,id,d,o)=>(MASTER||MASTER_EMAIL)?isMaster(u):(!o||o.u===u),
 gemgrant:(u,id,d,o)=>!o&&isMaster(u)&&d.by===u&&Number.isInteger(d.q)&&d.q>0&&d.q<=1e6&&typeof d.to==='string',
 gemreq:(u,id,d,o)=>o?(isMaster(u)&&d.u===o.u&&o.st==='p'&&d.st!=='p'):(d.u===u&&d.st==='p'&&Number.isFinite(+d.usdt)&&+d.usdt>=1&&+d.usdt<=5000&&small(d,260000)),
 pres:(u,id,d)=>id===u&&small(d,1200), pinv:(u,id,d,o)=>(o?(o.to===u||o.from===u):d.from===u)&&small(d,800), pkill:(u,id,d,o)=>(o?o.from===u:d.from===u)&&small(d,800),
 offers:()=>false,shops:()=>false,orders:()=>false,wallets:()=>false,loot:()=>false,gemtx:()=>false,dragon:(u,id,d)=>small(d,2000)};
const INBOX={pinv:['to'],pmsg:['to'],hits:['w']};   // solo puedes escuchar tu propio buzón
const canDel=(c,u,id,o)=>{if(SRV_ONLY.has(c))return false;return !o||id===u||[o.u,o.to,o.w,o.from,o.a].includes(u)};
const match=(d,w)=>!!d&&w.every(x=>x[1]==='=='&&d[x[0]]===x[2]);
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/plain','cache-control':'no-store'});r.end('Silk Road server OK'+(world?' '+JSON.stringify(world.stats()):''))});
const wss=new WebSocketServer({server:srv,maxPayload:450000});
const world=require('./world')(DB,log,{
 lv:u=>E.acct(u).lv,tag:u=>GD.tagOf(u),
 look:u=>{const a=E.acct(u);return{lv:a.lv,gt:GD.tagOf(u),sk:a.sk}},
 mint:(u,it)=>{const c=E.cleanItem(Object.assign({},it,{id:'s'+E.rid(8)}));if(!c)return it;S.ECO.reg[c.id]={o:u,k:'i',t:Date.now()};dirty=1;return c}});
function bc(c,id,o,n){for(const ws of wss.clients){if(!ws.uid)continue;for(const s in ws.subs){const b=ws.subs[s];if(b.c!==c)continue;const mo=match(o,b.w),mn=match(n,b.w);if(mo||mn)ws.send(JSON.stringify({t:'ch',sid:+s,id,d:mn?n:null}))}}}
const IPN=new Map();
wss.on('connection',(ws,req)=>{const og=req.headers.origin;if(ORI.length&&og&&!ORI.includes(og)){ws.close(1008);return}
 const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();const n0=(IPN.get(ip)||0)+1;if(n0>12){ws.close(1013);return}IPN.set(ip,n0);ws.on('close',()=>{const k=(IPN.get(ip)||1)-1;if(k<=0)IPN.delete(ip);else IPN.set(ip,k)});
 ws.subs={};ws.uid=null;ws.n=0;ws.t=Date.now();ws.isAlive=true;ws.on('pong',()=>ws.isAlive=true);ws.xn=0;ws.xt=Date.now();
 ws.on('message',raw=>{const now=Date.now();if(now-ws.t>1000){ws.t=now;ws.n=0}if(++ws.n>80)return;let m;try{m=JSON.parse(raw)}catch(e){return}if(!m||typeof m!=='object')return;
  const rep=(o)=>{if(ws.readyState===1)ws.send(JSON.stringify(o))},err=e=>m.rid&&rep({t:'r',rid:m.rid,ok:0,e});
  if(m.t==='hi'){const done=(u,extra)=>{const old=ONL.get(u);if(old&&old!==ws){try{old.send(JSON.stringify({t:'kick',e:'Tu cuenta se abrió en otro dispositivo'}));old.close(4001)}catch(e){}}
     ws.uid=u;ONL.set(u,ws);try{SO.presence(u,1)}catch(e){}const a=E.acct(u);rep(Object.assign({t:'ok',uid:u,ent:E.ent(u)},extra||{}));
     if(isMaster(u)){const o=(DB.cfg||{}).master;if(!o||o.u!==u){DB.cfg=DB.cfg||{};DB.cfg.master={u,ts:Date.now()};dirty=1;bc('cfg','master',o||null,DB.cfg.master)}}
     setTimeout(()=>E.flushDl(u),400)};
   if(m.g){if(!GCID){rep({t:'bad',e:'Google no configurado'});ws.close();return}
    gverify(String(m.g)).then(v=>{const u='g'+sha('g:'+v.sub).slice(0,20);ACC[u]={e:v.email,n:v.name,ts:Date.now()};dirty=1;done(u,{ses:newSes(u),email:v.email,name:v.name,master:isMaster(u)})}).catch(()=>{rep({t:'auth',e:'Google rechazó el inicio de sesión'})});return}
   if(m.ses){const a=SES[sha(m.ses)];if(!a||a.x<Date.now()){rep({t:'auth'});return}done(a.u,{email:(ACC[a.u]||{}).e,name:(ACC[a.u]||{}).n,master:isMaster(a.u)});return}
   if(GCID){rep({t:'auth'});return}   /* con Google configurado ya no se aceptan invitados */
   const u=String(m.uid||''),k=sha(m.tok);if(!/^[\w-]{3,40}$/.test(u)||!m.tok){ws.close();return}
   if(TOK[u]&&TOK[u]!==k){rep({t:'bad'});ws.close();return}if(!TOK[u]){TOK[u]=k;dirty=1}done(u);return}
  if(!ws.uid)return;const u=ws.uid;
  if(m.t==='sv'){if(typeof m.d!=='string'||m.d.length>400000||now-(ws.sv||0)<1500){err('guardado rechazado');return}ws.sv=now;
   let r;try{r=E.audit(u,m.d,m.ack)}catch(e){log('audit error '+e.stack);err('error de validación');return}
   if(r.rej){E.flag(u,'guardado rechazado: '+r.rej);err(r.rej);return}
   try{fs.writeFileSync(savePath(u),JSON.stringify({d:r.out,ts:Date.now()}))}catch(e){err('no se pudo guardar');return}
   try{const v=JSON.parse(r.out);S.guildSeen&&S.guildSeen(u,v.lv|0,v.cl|0);if(DB.shops&&DB.shops[u])MK.shopView(u)}catch(e){}
   rep({t:'r',rid:m.rid,ok:1,ts:Date.now(),fix:r.fix,acked:r.acked,ent:E.ent(u)});E.flushDl(u);return}
  if(m.t==='ld'){let o=null;try{o=JSON.parse(fs.readFileSync(savePath(u),'utf8'))}catch(e){}rep({t:'r',rid:m.rid,ok:1,d:o?o.d:null,ts:o?o.ts:0,ent:E.ent(u)});setTimeout(()=>E.flushDl(u),300);return}
  if(m.t==='x'){if(now-ws.xt>1000){ws.xt=now;ws.xn=0}if(++ws.xn>12){err('demasiadas peticiones');return}
   const f=OPS[String(m.op||'')];if(!f){err('operación desconocida');return}
   let r;try{r=f(u,m)||{e:'sin respuesta'}}catch(e){log('op '+m.op+' error '+e.stack);r={e:'error del servidor'}}
   if(r.e)rep({t:'r',rid:m.rid,ok:0,e:r.e});else rep(Object.assign({t:'r',rid:m.rid,ok:1},r));return}
  if(m.t&&m.t[0]==='w'){if(world){/* el nivel y la apariencia los pone el servidor, no el cliente */const a=E.acct(u);if(m.t==='wj'||m.t==='wm'){m.lv=a.lv;m.gt=GD.tagOf(u);m.bs=(typeof m.bs==='string'&&a.sk.includes(m.bs))?m.bs:'';m.cz=Array.isArray(m.cz)?m.cz.slice(0,3).map(x=>Math.max(0,Math.min(9,x|0))):[0,0,0]}world.handle(ws,m)}else rep({t:'wx'});return}
  const c=String(m.col||''),id=String(m.id||''),w=Array.isArray(m.w)?m.w.slice(0,4):[];
  if(m.t==='unsub'){delete ws.subs[m.sid];return}
  if(!RULES[c]&&!(DB[c]&&SRV_ONLY.has(c))&&!SRV_ONLY.has(c)){err('colección no permitida');return}
  if(m.t==='sub'||m.t==='q'){const need=INBOX[c];if(need&&!w.some(x=>x[1]==='=='&&need.includes(x[0])&&x[2]===u)){err('buzón privado');return}
   if(c==='wallets'||c==='orders'||c==='loot'||c==='gemtx'){if(m.t==='sub')ws.subs[m.sid]={c,w};rep(m.t==='sub'?{t:'snap',sid:m.sid,docs:{}}:{t:'r',rid:m.rid,ok:1,docs:{}});return}
   const docs={};for(const k in DB[c]||{})if(match(DB[c][k],w))docs[k]=DB[c][k];
   if(m.t==='sub'){if(Object.keys(ws.subs).length>20){err('demasiadas suscripciones');return}ws.subs[m.sid]={c,w};rep({t:'snap',sid:m.sid,docs})}else rep({t:'r',rid:m.rid,ok:1,docs});return}
  if(m.t==='get'){rep({t:'r',rid:m.rid,ok:1,d:(DB[c]||{})[id]||null});return}
  if(!id||id.length>80){err('id inválido');return}const old=(DB[c]||{})[id]||null;
  if(m.t==='del'){if(!canDel(c,u,id,old)){err('prohibido');return}if(old){delete DB[c][id];dirty=1;bc(c,id,old,null)}rep({t:'r',rid:m.rid,ok:1});return}
  if(m.t==='set'||m.t==='upd'){if(!RULES[c]){err('prohibido por las reglas');return}let d=m.d;if(!d||typeof d!=='object'||JSON.stringify(d).length>260000){err('doc inválido');return}
   if(m.t==='upd'&&old)d=Object.assign({},old,d);if(!RULES[c](u,id,d,old)){err('prohibido por las reglas');return}
   if(c==='gemgrant'&&!old){E.grantGems(d.to,d.q,'own','concedidas por master '+u)}
   if(c==='pmsg'&&d.k==='bf'&&world)world.credit(u,'ut',12);
   (DB[c]=DB[c]||{})[id]=d;dirty=1;bc(c,id,old,d);rep({t:'r',rid:m.rid,ok:1});
   if(c==='gemreq'&&!old&&d.st==='p')notifyRL('💎 SILK ROAD · Pago de gemas por revisar\nJugador: '+String(d.nm||'?').slice(0,30)+' ('+((ACC[d.u]||{}).e||d.u)+')\nMonto: '+d.usdt+' USDT → '+d.gems+' 💎\nOrden Binance Pay: '+String(d.ref||'').slice(0,60)+'\nTu Pay ID: '+PAY_ID+'\nAprueba en el juego (menú → Gemas).');
   return}});
 ws.on('close',()=>{ws.subs={};if(ws.uid&&ONL.get(ws.uid)===ws){ONL.delete(ws.uid);try{SO.presence(ws.uid,0)}catch(e){}}if(world&&ws.uid)world.leave(ws.uid,ws)})});
setInterval(()=>{for(const ws of wss.clients){if(!ws.isAlive){ws.terminate();continue}ws.isAlive=false;ws.ping()}},30000);
srv.listen(PORT,()=>console.log('Silk Road server en puerto',PORT));
