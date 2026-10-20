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
let DB={},TOK={},SES={},ACC={},ECO={},USR={},AC=null,dirty=0;const REQ=process.env.REQUIRE_ACCOUNTS==='1';
try{const j=JSON.parse(fs.readFileSync(FILE,'utf8'));DB=j.db||{};TOK=j.tok||{};SES=j.ses||{};ACC=j.acc||{};ECO=j.eco||{};USR=j.usr||{}}catch(e){}
for(const k in SES)if(SES[k].x<Date.now())delete SES[k];
DB.cfg=DB.cfg||{};if(PAY_ID&&!(DB.cfg.pay&&DB.cfg.pay.id===PAY_ID))DB.cfg.pay={id:PAY_ID,ts:Date.now()};
const isMaster=u=>(MASTER&&u===MASTER)||(!!AC&&!!AC.masterUid&&u===AC.masterUid)||(!!MASTER_EMAIL&&!!ACC[u]&&ACC[u].e===MASTER_EMAIL)||(!MASTER&&!MASTER_EMAIL&&!!(DB.cfg&&DB.cfg.master&&DB.cfg.master.u===u));
const log=s=>console.log(s);
const EPH=new Set(['pmem','wagons','pmsg','hits','pres','pinv','pkill']);              // efímeras: no se guardan en disco
const save=sync=>{dirty=0;const db={};for(const c in DB)if(!EPH.has(c))db[c]=DB[c];const j=JSON.stringify({db,tok:TOK,ses:SES,acc:ACC,eco:ECO,usr:USR});if(sync){fs.writeFileSync(FILE+'.tmp',j);fs.renameSync(FILE+'.tmp',FILE)}else fs.writeFile(FILE+'.tmp',j,e=>{if(!e)fs.rename(FILE+'.tmp',FILE,()=>{})})};
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
/* ===== REINICIO ÚNICO: personajes, oro y objetos desde cero (se conservan cuentas, gemas pagadas, apariencias compradas y pedidos de pago) ===== */
const WIPE_ID=process.env.WIPE_ID||'reset-2026-10-18';let KEEP=null;
if((DB.cfg.wipe||'')!==WIPE_ID){try{
 const bk=(process.env.DATA_DIR||'.')+'/backups/pre-'+WIPE_ID+'-'+Date.now();fs.mkdirSync(bk,{recursive:true});
 try{fs.copyFileSync(FILE,bk+'/data.json')}catch(e){}
 let n=0;try{for(const f of fs.readdirSync(SAVEDIR)){try{fs.copyFileSync(SAVEDIR+'/'+f,bk+'/'+f);fs.unlinkSync(SAVEDIR+'/'+f);n++}catch(e){}}}catch(e){}
 KEEP={};for(const u in (ECO.acc||{})){const a=ECO.acc[u];KEEP[u]={gem:a.gem,sk:a.sk,px:a.px,vip:a.vip,lic:a.lic}}
 for(const k of Object.keys(ECO))delete ECO[k];
 const cfg=DB.cfg,pay=DB.gemreq;for(const c of Object.keys(DB))delete DB[c];DB.cfg=cfg;if(pay)DB.gemreq=pay;
 DB.cfg.wipe=WIPE_ID;dirty=1;
 log('[REINICIO] '+WIPE_ID+': '+n+' personajes borrados (copia en '+bk+')');
}catch(e){log('[REINICIO] error '+e.stack)}}
const E=require('./economy')(S),MK=require('./market')(S,E),GD=require('./guild')(S,E),ST=require('./store')(S,E),SO=require('./social')(S,E);S.tagOf=u=>GD.tagOf(u);
if(KEEP){for(const u in KEEP){try{Object.assign(E.acct(u),KEEP[u])}catch(e){}}dirty=1;save(1)}
S.onDeliver=u=>{try{if(DB.shops&&DB.shops[u])MK.shopView(u)}catch(e){}};
AC=require('./accounts')({USR,ACC,SES,sha,log,WA:WA_NUMBER,dirty:()=>{dirty=1},isMaster});
const TR=require('./terr')(S,E);
const OPS=Object.assign({},ST.ops,MK.ops,GD.ops,SO.ops,TR.ops,AC.ops);
setInterval(()=>{for(const u in ECO.acc){const a=ECO.acc[u];if(a.dl&&a.dl.length)E.forceExpired(a)}},30000);
/* REGLAS de las colecciones libres: quién puede crear/editar (u = jugador autenticado, id, d = doc nuevo, o = doc anterior) */
/* Blindaje contra claves peligrosas (__proto__, constructor, toString…): ningún id/colección/operación del cliente puede tocar el prototipo ni funciones nativas */
const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const PKSKIP=new Set(['text','note','msg','nm','name','q','t','m','body','d']);
function protoBad(o,dep,k){if(dep>6)return true;if(o==null)return false;
 if(typeof o==='string')return !PKSKIP.has(k)&&o.length<40&&(o in Object.prototype);
 if(typeof o!=='object')return false;
 if(Array.isArray(o)){for(let i=0;i<o.length&&i<400;i++)if(protoBad(o[i],dep+1,k))return true;return false}
 let n=0;for(const x in o){if(x==='__proto__'||++n>400)return true;if(protoBad(o[x],dep+1,x))return true}return false}
const SRV_ONLY=new Set(['offers','shops','orders','wallets','loot','gemtx']);   // solo el servidor escribe; el cliente las lee y pide operaciones
const small=(d,n)=>JSON.stringify(d).length<=n;
/* Daño a dragones/centinelas: cada jugador solo escribe SU documento, el daño solo sube y no puede crecer más rápido que un máximo creíble */
const DRW={};
function dragonRule(u,id,d,o){if(!d||typeof d!=='object'||!small(d,2000))return false;
 if(d.u!==u||typeof d.ev!=='string'||d.ev.length>40||id!==d.ev+'_'+u)return false;
 let v=+d.d;if(!Number.isFinite(v)||v<0)return false;
 const mz=/^Z(\d+)-/.exec(d.ev),cap=mz?1e8+5e6*(+mz[1]):1e8;   // nadie puede aportar más que la vida total del celestial
 const t=Date.now(),prev=o?Math.max(0,+o.d||0):0;
 const last=DRW[id]||t-5000,gap=Math.min(Math.max(0,t-last),15*60e3)/1000;
 d.d=Math.round(Math.max(prev,Math.min(v,cap,prev+gap*1200+5e4)));   // el daño solo sube, con un ritmo máximo creíble; lo que sobra se recorta
 DRW[id]=t;return true}
const RULES={
 pmem:(u,id,d)=>id===u&&small(d,2500), wagons:(u,id,d)=>id===u&&small(d,800), pmsg:(u,id,d)=>d.from===u&&small(d,1200), hits:(u,id,d)=>d.a===u&&Number.isFinite(+d.d)&&+d.d>=0&&+d.d<=600,
 cfg:(u,id,d,o)=>(MASTER||MASTER_EMAIL)?isMaster(u):(!o||o.u===u),
 gemgrant:(u,id,d,o)=>!o&&isMaster(u)&&d.by===u&&Number.isInteger(d.q)&&d.q>0&&d.q<=1e6&&typeof d.to==='string',
 gemreq:(u,id,d,o)=>o?(isMaster(u)&&d.u===o.u&&o.st==='p'&&d.st!=='p'):(d.u===u&&d.st==='p'&&Number.isFinite(+d.usdt)&&+d.usdt>=.5&&+d.usdt<=5000&&small(d,260000)),
 pres:(u,id,d)=>id===u&&small(d,1200), pinv:(u,id,d,o)=>(o?(o.to===u||o.from===u):d.from===u)&&small(d,800), pkill:(u,id,d,o)=>(o?o.from===u:d.from===u)&&small(d,800),
 offers:()=>false,shops:()=>false,orders:()=>false,wallets:()=>false,loot:()=>false,gemtx:()=>false,dragon:dragonRule};
const INBOX={pinv:['to'],pmsg:['to'],hits:['w']};   // solo puedes escuchar tu propio buzón
const canDel=(c,u,id,o)=>{if(SRV_ONLY.has(c))return false;return !o||id===u||[o.u,o.to,o.w,o.from,o.a].includes(u)};
const match=(d,w)=>!!d&&w.every(x=>x[1]==='=='&&d[x[0]]===x[2]);
/* ===== El servidor también entrega el juego (carpeta public/): sirve de respaldo si Netlify no está disponible ===== */
const path=require('path'),zlib=require('zlib'),PUB=path.join(__dirname,'public'),FC={};
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.webp':'image/webp','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const RAIZ=new Set(['index.html','play.html','privacidad.html','terminos.html','wiki.html','wiki-data.json','sw.js','config.js','claude-shim.js','heroes.js','world-client.js','catalog.js','site.css','site2.css','manifest.webmanifest']);
const TXT=new Set(['.html','.js','.css','.json','.webmanifest','.svg','.txt']);
function statusText(){return 'Silk Road server OK'+(world?' '+JSON.stringify(world.stats()):'')+' · cuentas:'+(AC?'si':'no')+(REQ?' · solo con cuenta':'')+(AC&&AC.mailOn()?' · correo:si':' · correo:no')}
function serveStatic(q,r){let p;try{p=decodeURIComponent(String(q.url||'/').split('?')[0])}catch(e){return false}
 if(p==='/status'||p==='/health'||(q.method!=='GET'&&q.method!=='HEAD'))return false;if(p.endsWith('/'))p+='index.html';
 let f=path.normalize(path.join(PUB,p));if(f.indexOf(PUB+path.sep)!==0)return false;
 if(!FC[f]&&!fs.existsSync(f)){const b=p.slice(1);if(RAIZ.has(b)||/^[\w.-]+\.(png|jpg|jpeg)$/i.test(b))f=path.join(__dirname,b);else return false}   /* respaldo: si no hay carpeta public/, sirve el cliente suelto en la raíz (solo archivos del juego, nunca los del servidor) */
 let c=FC[f];if(!c){let st;try{st=fs.statSync(f)}catch(e){return false}if(!st.isFile())return false;const buf=fs.readFileSync(f),ext=path.extname(f).toLowerCase();
  c=FC[f]={buf,gz:TXT.has(ext)&&buf.length>1400?zlib.gzipSync(buf,{level:9}):null,type:MIME[ext]||'application/octet-stream',etag:'"'+crypto.createHash('md5').update(buf).digest('hex').slice(0,16)+'"',ext}}
 const h={'content-type':c.type,etag:c.etag,'cache-control':(TXT.has(c.ext)||p==='/sw.js')?'no-cache':'public, max-age=86400','x-content-type-options':'nosniff'};
 if(q.headers['if-none-match']===c.etag){r.writeHead(304,h);r.end();return true}
 const gz=c.gz&&/\bgzip\b/.test(q.headers['accept-encoding']||'');if(gz){h['content-encoding']='gzip';h.vary='Accept-Encoding'}
 const b=gz?c.gz:c.buf;h['content-length']=b.length;r.writeHead(200,h);r.end(q.method==='HEAD'?undefined:b);return true}
const srv=http.createServer((q,r)=>{if(serveStatic(q,r))return;r.writeHead(200,{'content-type':'text/plain','cache-control':'no-store'});r.end(statusText())});
const wss=new WebSocketServer({server:srv,maxPayload:450000});
const world=require('./world')(DB,log,{
 lv:u=>E.acct(u).lv,tag:u=>GD.tagOf(u),pv:u=>(+E.acct(u).px.pv||0)>Date.now(),kill:(k,v,f,kn)=>MK.pvKill(k,v,f,kn),wanted:u=>MK.btyHas(u),gm:u=>isMaster(u),gid:u=>E.acct(u).gld||'',tjoin:u=>{try{TR.join(u)}catch(e){log('terr join '+e.message)}},
 look:u=>{const a=E.acct(u);return{lv:a.lv,gt:GD.tagOf(u),sk:a.sk}},
 mint:(u,it)=>{const c=E.cleanItem(Object.assign({},it,{id:'s'+E.rid(8)}));if(!c)return it;S.ECO.reg[c.id]={o:u,k:'i',t:Date.now()};dirty=1;return c}});
S.world=world;try{TR.init()}catch(e){log('terr init '+e.stack)}
function bc(c,id,o,n){for(const ws of wss.clients){if(!ws.uid)continue;for(const s in ws.subs){const b=ws.subs[s];if(b.c!==c)continue;const mo=match(o,b.w),mn=match(n,b.w);if(mo||mn)ws.send(JSON.stringify({t:'ch',sid:+s,id,d:mn?n:null}))}}}
const IPN=new Map();
wss.on('connection',(ws,req)=>{const og=req.headers.origin;if(ORI.length&&og&&!ORI.includes(og)&&og!=='https://'+req.headers.host&&og!=='http://'+req.headers.host){ws.close(1008);return}
 const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();const n0=(IPN.get(ip)||0)+1;if(n0>12){ws.close(1013);return}IPN.set(ip,n0);ws.on('close',()=>{const k=(IPN.get(ip)||1)-1;if(k<=0)IPN.delete(ip);else IPN.set(ip,k)});
 ws.subs={};ws.uid=null;ws.n=0;ws.t=Date.now();ws.isAlive=true;ws.on('pong',()=>ws.isAlive=true);ws.xn=0;ws.xt=Date.now();
 ws.on('message',raw=>{const now=Date.now();if(now-ws.t>1000){ws.t=now;ws.n=0}if(++ws.n>80)return;let m;try{m=JSON.parse(raw)}catch(e){return}if(!m||typeof m!=='object')return;
  const rep=(o)=>{if(ws.readyState===1)ws.send(JSON.stringify(o))},err=e=>m.rid&&rep({t:'r',rid:m.rid,ok:0,e});
  if(m.t==='hi'){const done=(u,extra)=>{const old=ONL.get(u);if(old&&old!==ws){try{old.send(JSON.stringify({t:'kick',e:'Tu cuenta se abrió en otro dispositivo'}));old.close(4001)}catch(e){}}
     ws.uid=u;ONL.set(u,ws);try{SO.presence(u,1)}catch(e){}const a=E.acct(u);rep(Object.assign({t:'ok',uid:u,ent:E.ent(u)},extra||{}));
     if(isMaster(u)){const o=(DB.cfg||{}).master;if(!o||o.u!==u){DB.cfg=DB.cfg||{};DB.cfg.master={u,ts:Date.now()};dirty=1;bc('cfg','master',o||null,DB.cfg.master)}}
     setTimeout(()=>E.flushDl(u),400);setTimeout(()=>{try{rep(wsvMsg())}catch(e){}},1200)};
   if(AC&&!ws.uid&&AC.pre(m,ip,rep,done,{isMaster}))return;
   if(m.g){if(!GCID){rep({t:'bad',e:'Google no configurado'});ws.close();return}
    gverify(String(m.g)).then(v=>{const u='g'+sha('g:'+v.sub).slice(0,20);ACC[u]={e:v.email,n:v.name,ts:Date.now()};dirty=1;done(u,{ses:newSes(u),email:v.email,name:v.name,master:isMaster(u)})}).catch(()=>{rep({t:'auth',e:'Google rechazó el inicio de sesión'})});return}
   if(m.ses){const a=SES[sha(m.ses)];if(!a||a.x<Date.now()){rep({t:'auth'});return}done(a.u,{email:(ACC[a.u]||{}).e,name:(ACC[a.u]||{}).n,uname:AC.unameOf(a.u)||undefined,master:isMaster(a.u)});return}
   if(GCID||REQ){rep({t:'auth'});return}   /* con Google configurado ya no se aceptan invitados */
   const u=String(m.uid||''),k=sha(m.tok);if(!/^[\w-]{3,40}$/.test(u)||!m.tok){ws.close();return}
   if(TOK[u]&&TOK[u]!==k){rep({t:'bad'});ws.close();return}if(!TOK[u]){TOK[u]=k;dirty=1}done(u);return}
  if(!ws.uid)return;const u=ws.uid;
  if(m.t!=='sv'&&protoBad(m,0,'')){err('datos no válidos');return}
  if(m.t==='sv'){if(typeof m.d!=='string'||m.d.length>400000||now-(ws.sv||0)<1500){err('guardado rechazado');return}ws.sv=now;
   let r;try{r=E.audit(u,m.d,m.ack)}catch(e){log('audit error '+e.stack);err('error de validación');return}
   if(r.rej){E.flag(u,'guardado rechazado: '+r.rej);err(r.rej);return}
   try{fs.writeFileSync(savePath(u),JSON.stringify({d:r.out,ts:Date.now()}))}catch(e){err('no se pudo guardar');return}
   try{const v=JSON.parse(r.out);S.guildSeen&&S.guildSeen(u,v.lv|0,v.cl|0);if(DB.shops&&DB.shops[u])MK.shopView(u)}catch(e){}
   rep({t:'r',rid:m.rid,ok:1,ts:Date.now(),fix:r.fix,acked:r.acked,ent:E.ent(u)});E.flushDl(u);return}
  if(m.t==='ld'){let o=null;try{o=JSON.parse(fs.readFileSync(savePath(u),'utf8'))}catch(e){}rep({t:'r',rid:m.rid,ok:1,wp:WIPE_ID,d:o?o.d:null,ts:o?o.ts:0,ent:E.ent(u)});setTimeout(()=>E.flushDl(u),300);return}
  if(m.t==='x'){if(now-ws.xt>1000){ws.xt=now;ws.xn=0}if(++ws.xn>12){err('demasiadas peticiones');return}
   const opn=String(m.op||''),f=hasOwn(OPS,opn)?OPS[opn]:null;if(typeof f!=='function'){err('operación desconocida');return}
   let r;try{r=f(u,m)}catch(e){log('op '+m.op+' error '+e.stack);r={e:'error del servidor'}}
   const fin=r=>{r=r||{e:'sin respuesta'};if(r.e)rep({t:'r',rid:m.rid,ok:0,e:r.e});else rep(Object.assign({t:'r',rid:m.rid,ok:1},r))};
   if(r&&typeof r.then==='function')r.then(fin,e=>{log('op '+m.op+' error '+(e&&e.stack));fin({e:'error del servidor'})});else fin(r);return}
  if(m.t&&m.t[0]==='w'){if(world){/* el nivel y la apariencia los pone el servidor, no el cliente */const a=E.acct(u);if(m.t==='wj'||m.t==='wm'){m.lv=a.lv;m.gt=GD.tagOf(u);m.bs=(typeof m.bs==='string'&&a.sk.includes(m.bs))?m.bs:'';a.lbs=m.bs;m.cz=Array.isArray(m.cz)?m.cz.slice(0,3).map(x=>Math.max(0,Math.min(9,x|0))):[0,0,0]}world.handle(ws,m)}else rep({t:'wx'});return}
  const c=String(m.col||''),id=String(m.id||''),w=Array.isArray(m.w)?m.w.slice(0,4):[];
  if(m.t==='unsub'){delete ws.subs[m.sid];return}
  if(!hasOwn(RULES,c)&&!SRV_ONLY.has(c)){err('colección no permitida');return}
  if(m.t==='sub'||m.t==='q'){const need=INBOX[c];if(need&&!w.some(x=>x[1]==='=='&&need.includes(x[0])&&x[2]===u)){err('buzón privado');return}
   if(c==='wallets'||c==='orders'||c==='loot'||c==='gemtx'){if(m.t==='sub')ws.subs[m.sid]={c,w};rep(m.t==='sub'?{t:'snap',sid:m.sid,docs:{}}:{t:'r',rid:m.rid,ok:1,docs:{}});return}
   const docs={};for(const k in DB[c]||{})if(match(DB[c][k],w))docs[k]=DB[c][k];
   if(m.t==='sub'){if(Object.keys(ws.subs).length>20){err('demasiadas suscripciones');return}ws.subs[m.sid]={c,w};rep({t:'snap',sid:m.sid,docs})}else rep({t:'r',rid:m.rid,ok:1,docs});return}
  if(m.t==='get'){rep({t:'r',rid:m.rid,ok:1,d:(DB[c]||{})[id]||null});return}
  if(!id||id.length>80){err('id inválido');return}const old=(DB[c]||{})[id]||null;
  if(m.t==='del'){if(!canDel(c,u,id,old)){err('prohibido');return}if(old){delete DB[c][id];dirty=1;bc(c,id,old,null)}rep({t:'r',rid:m.rid,ok:1});return}
  if(m.t==='set'||m.t==='upd'){if(!hasOwn(RULES,c)||typeof RULES[c]!=='function'){err('prohibido por las reglas');return}let d=m.d;if(!d||typeof d!=='object'||JSON.stringify(d).length>260000){err('doc inválido');return}
   if(m.t==='upd'&&old)d=Object.assign({},old,d);if(!RULES[c](u,id,d,old)){err('prohibido por las reglas');return}
   if(c==='gemgrant'&&!old){E.grantGems(d.to,d.q,'own','concedidas por master '+u)}
   if(c==='pmsg'&&d.k==='bf'&&world)world.credit(u,'ut',12);
   (DB[c]=DB[c]||{})[id]=d;dirty=1;bc(c,id,old,d);rep({t:'r',rid:m.rid,ok:1});
   if(c==='gemreq'&&!old&&d.st==='p')notifyRL('💎 SILK ROAD · Pago de gemas por revisar\nJugador: '+String(d.nm||'?').slice(0,30)+' ('+((ACC[d.u]||{}).e||d.u)+')\nMonto: '+d.usdt+' USDT → '+d.gems+' 💎\nOrden Binance Pay: '+String(d.ref||'').slice(0,60)+'\nTu Pay ID: '+PAY_ID+'\nAprueba en el juego (menú → Gemas).');
   return}});
 ws.on('close',()=>{ws.subs={};if(ws.uid&&ONL.get(ws.uid)===ws){ONL.delete(ws.uid);try{SO.presence(ws.uid,0)}catch(e){}}if(world&&ws.uid)world.leave(ws.uid,ws)})});

/* ---------- v154: versión publicada, jugadores conectados y reinicio diario programado ----------
   Cada 30 s todos reciben {t:'wsv'}: versión del servidor (el cliente se actualiza solo si es distinta), nº de conectados y hora del próximo reinicio.
   Reinicio diario: RESTART_HOUR (hora de RD, UTC-4; por defecto 5 = 5:00 a. m.; 'off' lo desactiva). Avisa a 10/5/2/1 min, guarda todo y sale; Render lo vuelve a levantar solo. */
const BUILD=(()=>{try{return /const V='([^']+)'/.exec(fs.readFileSync(path.join(__dirname,'sw.js'),'utf8'))[1]}catch(e){return ''}})();
const RS_H=process.env.RESTART_HOUR==null?5:(String(process.env.RESTART_HOUR).toLowerCase()==='off'?-1:+process.env.RESTART_HOUR),T0=Date.now();let RS_AT=0;
function rsNext(){if(process.env.RESTART_IN_S)return T0+(+process.env.RESTART_IN_S)*1000;if(!(RS_H>=0&&RS_H<24))return 0;const d=new Date(Date.now()-4*36e5);d.setUTCHours(RS_H,0,0,0);let t=d.getTime()+4*36e5;while(t<=Date.now()+6e4||t-T0<30*60e3)t+=864e5;return t}
RS_AT=rsNext();const RS_SENT=new Set();
const wsvMsg=()=>({t:'wsv',v:BUILD,n:ONL.size,rs:RS_AT||0});
function wsvAll(){const s=JSON.stringify(wsvMsg());for(const [u,w] of ONL)if(w.readyState===1)try{w.send(s)}catch(e){}}
setInterval(wsvAll,30000).unref();
setInterval(()=>{if(!RS_AT)return;const rm=RS_AT-Date.now();
 for(const mn of [10,5,2,1]){if(rm<=mn*60e3&&rm>(mn-1)*60e3-1e4&&!RS_SENT.has(mn)){RS_SENT.add(mn);try{SO.sys('🔄 Reinicio programado del servidor en '+mn+' min. Tu progreso se guarda solo; al volver, la partida sigue donde la dejaste.')}catch(e){}wsvAll()}}
 if(rm<=0){log('[reinicio] reinicio diario programado: guardando y saliendo');try{SO.sys('🔄 Reiniciando el servidor… vuelve en 1 minuto.')}catch(e){}try{save(1)}catch(e){}setTimeout(()=>process.exit(0),1500)}},5000).unref();
setInterval(()=>{for(const ws of wss.clients){if(!ws.isAlive){ws.terminate();continue}ws.isAlive=false;ws.ping()}},30000);
srv.listen(PORT,()=>console.log('Silk Road server en puerto',PORT));
