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
const NTFY=(process.env.NTFY_TOPIC||'').replace(/[^\w-]/g,'');const CALLMEBOT_KEY=process.env.CALLMEBOT_KEY||'',CALLMEBOT_URL=process.env.CALLMEBOT_URL||'https://api.callmebot.com/whatsapp.php',WA_TOKEN=process.env.WA_TOKEN||'',WA_PHONE_ID=process.env.WA_PHONE_ID||'';
const SAVEDIR=(process.env.DATA_DIR||'.')+'/saves';try{fs.mkdirSync(SAVEDIR,{recursive:true})}catch(e){}
/* v237: contador de arranques guardado EN la carpeta de datos. Si el disco no es permanente, vuelve a 1 en cada reinicio (se ve en la página /status). */
const BOOTF=(process.env.DATA_DIR||'.')+'/.arranques.json';let BOOT={first:Date.now(),n:0,last:0};try{const j=JSON.parse(fs.readFileSync(BOOTF,'utf8'));if(j&&j.first)BOOT=j}catch(e){}
BOOT.n=(BOOT.n|0)+1;BOOT.prev=BOOT.last||0;BOOT.last=Date.now();try{fs.writeFileSync(BOOTF,JSON.stringify(BOOT))}catch(e){}
let DB={},TOK={},SES={},ACC={},ECO={},USR={},AC=null,dirty=0;const REQ=process.env.REQUIRE_ACCOUNTS!=='0';   /* v220: por defecto SOLO con cuenta (un usuario = una partida en PC y celular). Pon REQUIRE_ACCOUNTS=0 solo para pruebas con invitados */
try{const j=JSON.parse(fs.readFileSync(FILE,'utf8'));DB=j.db||{};TOK=j.tok||{};SES=j.ses||{};ACC=j.acc||{};ECO=j.eco||{};USR=j.usr||{}}catch(e){}
for(const k in SES)if(SES[k].x<Date.now())delete SES[k];
DB.cfg=DB.cfg||{};if(PAY_ID&&!(DB.cfg.pay&&DB.cfg.pay.id===PAY_ID))DB.cfg.pay={id:PAY_ID,ts:Date.now()};
/* Apertura del reino: antes de esta hora solo entra el master. Cambia LAUNCH_AT en Render (ISO, ej. 2026-10-23T20:00:00-04:00) o pon LAUNCH_AT=off para desactivarlo. */
const LAUNCH_RAW=process.env.LAUNCH_AT===undefined?'2026-10-23T20:00:00-04:00':String(process.env.LAUNCH_AT).trim(),LAUNCH_AT=/^(off|0|no|)$/i.test(LAUNCH_RAW)?0:(Date.parse(LAUNCH_RAW)||0);
/* Acceso anticipado discreto (moderadores/creadores): hasta 3 cuentas, ademas del master. Se definen con la variable EARLY (separadas por coma: correo, usuario o uid) o desde el juego (master: Opciones > Pruebas > Acceso anticipado). */
const EARLY_ENV=(process.env.EARLY||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
const earlyList=()=>[...new Set(EARLY_ENV.concat(((DB.cfg||{}).early||[]).map(x=>String(x).toLowerCase())))];
const earlyIds=u=>{const o=[String(u).toLowerCase()],a=ACC[u];if(a&&a.e&&!a.pw)o.push(String(a.e).toLowerCase());try{const n=AC&&AC.unameOf&&AC.unameOf(u);if(n)o.push(String(n).toLowerCase())}catch(e){}return o};
const isEarly=u=>{const L=earlyList().slice(0,3);return earlyIds(u).some(x=>L.includes(x))};
const launched=()=>!LAUNCH_AT||Date.now()>=LAUNCH_AT;
const isMaster=u=>(MASTER&&u===MASTER)||(!!AC&&!!AC.masterUid&&u===AC.masterUid)||(!!MASTER_EMAIL&&!!ACC[u]&&!ACC[u].pw&&ACC[u].e===MASTER_EMAIL)||(!MASTER&&!MASTER_EMAIL&&!!(DB.cfg&&DB.cfg.master&&DB.cfg.master.u===u));
const log=s=>console.log(s);
const EPH=new Set(['pmem','wagons','pmsg','hits','pres','pinv','pkill']);              // efímeras: no se guardan en disco
const save=sync=>{dirty=0;const db={};for(const c in DB)if(!EPH.has(c))db[c]=DB[c];const j=JSON.stringify({db,tok:TOK,ses:SES,acc:ACC,eco:ECO,usr:USR});if(sync){fs.writeFileSync(FILE+'.tmp',j);fs.renameSync(FILE+'.tmp',FILE)}else fs.writeFile(FILE+'.tmp',j,e=>{if(!e)fs.rename(FILE+'.tmp',FILE,()=>{})})};
let SV_NEXT=0;setInterval(()=>{if(!dirty)return;const t0=Date.now();if(t0<SV_NEXT)return;save();SV_NEXT=Date.now()+Math.max(0,(Date.now()-t0)*40-5000)},5000);   /* si guardar tarda (base de datos grande), se espacia para no frenar el juego; al apagar siempre se guarda */
/* copias de seguridad cada 6 h (se guardan 14) en DATA_DIR/backups */
const BKDIR=(process.env.DATA_DIR||'.')+'/backups';try{fs.mkdirSync(BKDIR,{recursive:true})}catch(e){}
setInterval(()=>{try{if(!fs.existsSync(FILE))return;const n=new Date().toISOString().slice(0,13).replace(/[-T:]/g,'');fs.copyFileSync(FILE,BKDIR+'/db-'+n+'.json');const l=fs.readdirSync(BKDIR).filter(x=>x.startsWith('db-')).sort();while(l.length>14)fs.unlinkSync(BKDIR+'/'+l.shift())}catch(e){}},6*36e5);
for(const sg of['SIGTERM','SIGINT'])process.on(sg,()=>{try{save(1)}catch(e){}process.exit(0)});
async function notify(text){try{
 if(CALLMEBOT_KEY){await fetch(CALLMEBOT_URL+'?phone='+WA_NUMBER+'&text='+encodeURIComponent(text)+'&apikey='+encodeURIComponent(CALLMEBOT_KEY))}
 else if(WA_TOKEN&&WA_PHONE_ID){await fetch('https://graph.facebook.com/v20.0/'+WA_PHONE_ID+'/messages',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+WA_TOKEN},body:JSON.stringify({messaging_product:'whatsapp',to:WA_NUMBER,type:'text',text:{body:text}})})}
 else log('[notificación sin proveedor WhatsApp configurado] '+text.replace(/\n/g,' | '))}catch(e){log('notify error '+e.message)}
 if(NTFY){try{await fetch('https://ntfy.sh/'+encodeURIComponent(NTFY),{method:'POST',headers:{Title:'Silk Road',Priority:'high',Tags:'gem'},body:text})}catch(e){log('ntfy error '+e.message)}}}
let lastN=0;const notifyRL=t=>{const n=Date.now();if(n-lastN<3000){setTimeout(()=>notify(t),3000);lastN=n+3000}else{lastN=n;notify(t)}};
async function gverify(cred){const r=await fetch(TOKINFO+encodeURIComponent(cred));if(!r.ok)throw new Error('token');const j=await r.json();
 if(j.aud!==GCID||!/accounts\.google\.com$/.test(String(j.iss||''))||String(j.email_verified)!=='true'||(+j.exp)*1000<Date.now()||!j.sub)throw new Error('token inválido');return{sub:String(j.sub),email:String(j.email||'').toLowerCase(),name:String(j.name||'').slice(0,40)}}
const newSes=u=>{const t=crypto.randomBytes(24).toString('hex');SES[sha(t)]={u,x:Date.now()+90*864e5};dirty=1;return t};
const savePath=u=>SAVEDIR+'/'+String(u).replace(/[^\w-]/g,'')+'.json';
const ONL=new Map();   // uid -> ws (una sola sesión por cuenta: evita duplicar objetos con dos pestañas)
const S={ECO,cat,log,DB,ACC,isMaster,notify:notifyRL,dirty:()=>{dirty=1},
 push:(u,m)=>{const w=ONL.get(u);if(w&&w.readyState===1)w.send(JSON.stringify(m))},online:u=>{const w=ONL.get(u);return !!w&&w.readyState===1},bc:(c,id,o,n)=>bc(c,id,o,n)};
/* ===== REINICIO ÚNICO: personajes, oro y objetos desde cero (se conservan cuentas, gemas pagadas, apariencias compradas y pedidos de pago) ===== */
/* WIPE_AT_LAUNCH=1: 3 min antes de la apertura el servidor se reinicia solo y borra los PERSONAJES de pruebas (mods/master); las cuentas (usuario/contrasena) se conservan. */
const LWLEAD=180000,LW=process.env.WIPE_AT_LAUNCH==='1'&&!!LAUNCH_AT&&Date.now()>=LAUNCH_AT-LWLEAD;
/* DAILY_RESTART=H (0-23, hora de Republica Dominicana, ej. 5 = 5:00 AM): reinicio diario para liberar memoria y limpiar el servidor. Guarda todo antes de cerrar; Render lo vuelve a levantar solo. No borra datos. */
const DRH=process.env.DAILY_RESTART===undefined||process.env.DAILY_RESTART===''?-1:parseInt(process.env.DAILY_RESTART,10);
const nextDaily=(h,now)=>{const u=(h+4)%24,d=new Date(now);let t=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),u,0,0);while(t<=now+10*60000)t+=864e5;return t-now};
if(DRH>=0&&DRH<=23){const ms=nextDaily(DRH,Date.now());setTimeout(()=>{log('[REINICIO] reinicio diario programado ('+DRH+':00 hora RD): guardando y reiniciando');try{save(1)}catch(e){}process.exit(0)},ms);log('reinicio diario en '+Math.round(ms/60000)+' min')}
const WIPE_ID=LW?('launch-'+LAUNCH_AT):(process.env.WIPE_ID||'reset-2026-10-18');let KEEP=null;
if(process.env.WIPE_AT_LAUNCH==='1'&&LAUNCH_AT&&!LW){const ms=LAUNCH_AT-LWLEAD-Date.now()+1500;if(ms<2147e6)setTimeout(()=>{log('[REINICIO] reinicio programado previo a la apertura');try{save(1)}catch(e){}process.exit(0)},ms)}
if((DB.cfg.wipe||'')!==WIPE_ID){try{
 const bk=(process.env.DATA_DIR||'.')+'/backups/pre-'+WIPE_ID+'-'+Date.now();fs.mkdirSync(bk,{recursive:true});
 try{fs.copyFileSync(FILE,bk+'/data.json')}catch(e){}
 let n=0;try{for(const f of fs.readdirSync(SAVEDIR)){try{fs.copyFileSync(SAVEDIR+'/'+f,bk+'/'+f);fs.unlinkSync(SAVEDIR+'/'+f);n++}catch(e){}}}catch(e){}
 KEEP={};if(process.env.WIPE_KEEP!=='0'&&!LW)for(const u in (ECO.acc||{})){const a=ECO.acc[u];KEEP[u]={gem:a.gem,sk:a.sk,px:a.px,vip:a.vip,lic:a.lic}}   /* WIPE_KEEP=0: tampoco se conservan gemas/apariencias/premium (todos desde cero) */
 for(const k of Object.keys(ECO))delete ECO[k];
 if(process.env.WIPE_ACCOUNTS==='1'&&!LW){for(const o of [USR,ACC,SES,TOK])for(const k of Object.keys(o))delete o[k];KEEP={};log('[REINICIO] cuentas, usuarios y sesiones borrados (copia en '+bk+')')}   /* WIPE_ACCOUNTS=1: tambien se borran usuarios/contrasenas/sesiones */
 const cfg=DB.cfg,pay=DB.gemreq,inf=DB.inf;for(const c of Object.keys(DB))delete DB[c];DB.cfg=cfg;if(pay)DB.gemreq=pay;if(inf)DB.inf=inf;
 DB.cfg.wipe=WIPE_ID;dirty=1;
 log('[REINICIO] '+WIPE_ID+': '+n+' personajes borrados (copia en '+bk+')');
}catch(e){log('[REINICIO] error '+e.stack)}}
const E=require('./economy')(S),MK=require('./market')(S,E),GD=require('./guild')(S,E),ST=require('./store')(S,E),SO=require('./social')(S,E);S.tagOf=u=>GD.tagOf(u);
if(KEEP){for(const u in KEEP){try{Object.assign(E.acct(u),KEEP[u])}catch(e){}}dirty=1;save(1)}
/* RECORTE (TRIM_ID): conserva cuentas, nivel y habilidades; quita objetos, mascotas, monturas y materiales (y oro si TRIM_GOLD=0) y regala TRIM_GEMS gemas. Se aplica UNA vez por cada valor nuevo de TRIM_ID. */
if(process.env.TRIM_ID&&DB.cfg.trim!==process.env.TRIM_ID){try{
 const TID=process.env.TRIM_ID,GEM=Math.max(0,Math.min(100000,parseInt(process.env.TRIM_GEMS||'0',10)||0)),bk=(process.env.DATA_DIR||'.')+'/backups/trim-'+TID+'-'+Date.now();fs.mkdirSync(bk,{recursive:true});let n=0;
 try{fs.copyFileSync(FILE,bk+'/data.json')}catch(e){}
 for(const f of fs.readdirSync(SAVEDIR)){try{if(!/\.json$/.test(f))continue;const u=f.slice(0,-5);fs.copyFileSync(SAVEDIR+'/'+f,bk+'/'+f);if(isMaster(u))continue;
  const o=JSON.parse(fs.readFileSync(SAVEDIR+'/'+f,'utf8')),v=JSON.parse(o.d);
  Object.assign(v,{eq:{},bag:[],lb:[],dep:[],storage:[],pets:[],bu:[],i:[0,0,0,0,0],cb:[0,0,0,0,0],fd:{},tl:{},mat:{},rc:[],tch:{n:0},up:v.up&&typeof v.up==='object'?{}:v.up});
  if(process.env.TRIM_GOLD==='0'){v.g=0;v.bk=0}
  o.d=JSON.stringify(v);fs.writeFileSync(SAVEDIR+'/'+f,JSON.stringify(o));
  if(GEM>0)E.grantGems(u,GEM,'own','compensación de reinicio');n++}catch(e){log('[RECORTE] '+f+': '+e.message)}}
 DB.cfg.trim=TID;dirty=1;save(1);log('[RECORTE] '+TID+': '+n+' personajes recortados, '+GEM+' gemas c/u (copia en '+bk+')');
}catch(e){log('[RECORTE] error '+e.stack)}}
S.onDeliver=u=>{try{if(DB.shops&&DB.shops[u])MK.shopView(u)}catch(e){}};
AC=require('./accounts')({USR,ACC,SES,sha,log,WA:WA_NUMBER,dirty:()=>{dirty=1},isMaster,refOk:c=>!!((DB.inf||{})[c])});
const TR=require('./terr')(S,E);
const SD=require('./seda')(S,E);
const OPS=Object.assign({},ST.ops,MK.ops,GD.ops,SO.ops,TR.ops,SD.ops,AC.ops);
/* Acceso anticipado: solo el master. */
OPS['adm.lv']=(u,m)=>{if(!isMaster(u))return{e:'operación desconocida'};const n=String(m.who||'').trim().toLowerCase().slice(0,40),lv=Math.floor(+m.lv);if(!n)return{e:'Escribe el nombre del jugador'};if(!(lv>=1&&lv<=E.CFG.lvMax))return{e:'Nivel entre 1 y '+E.CFG.lvMax};
 let id=E.uidByName(n);if(!id)for(const k in (ECO.acc||{})){const q=ECO.acc[k];if(q&&[q.nm,q.pn].some(x=>x&&String(x).toLowerCase()===n)){id=k;break}}
 if(!id&&USR[n]&&USR[n].u)id=USR[n].u;if(!id&&ECO.acc&&ECO.acc[m.who])id=String(m.who);if(!id)return{e:'No encontré a "'+m.who+'"'};
 const a=E.acct(id),old=a.lv|0;let ok=0;try{const f=savePath(id),o=JSON.parse(fs.readFileSync(f,'utf8')),v=JSON.parse(o.d);v.lv=lv;v.xp=0;o.d=JSON.stringify(v);fs.writeFileSync(f,JSON.stringify(o));ok=1}catch(e){}
 a.lv=lv;a.xp=0;dirty=1;log('[GM] '+u+' puso a '+id+' ('+(a.nm||a.pn||'?')+') en nivel '+lv+' (antes '+old+')');
 const w=ONL.get(id);if(w){try{w.send(JSON.stringify({t:'bad',e:'Un GM ajustó tu nivel a '+lv+'. Vuelve a entrar al juego.'}));setTimeout(()=>{try{w.close()}catch(e){}},500)}catch(e){}}
 return{ok:1,id,nm:a.nm||a.pn||id,old,lv,online:!!w,saved:ok}};
OPS['char.del']=(u,m)=>{const a=E.acct(u),n=Date.now();if(n-(a.cdt||0)<60000)return{e:'Espera un minuto antes de borrar otra vez'};if(isMaster(u))return{e:'El personaje del master no se borra desde aquí'};
 try{fs.unlinkSync(savePath(u))}catch(e){}
 if(a.nm&&ECO.names[a.nm.toLowerCase()]===u)delete ECO.names[a.nm.toLowerCase()];
 for(const id in ECO.reg)if(ECO.reg[id]&&ECO.reg[id].o===u)delete ECO.reg[id];
 const z=ECO.acc[u];Object.assign(z,{lv:1,xp:0,sx:[1,1,1],cls:-1,nm:'',first:1,ts:0,dl:[],mint:{},gb:{v:0,t:0},cdt:n,wdt:n});
 z.res={gold:0,g:[0,0,0,0,0],fd:Object.assign({carne:0,cocida:0,pasto:0,hierba:0,lazo:0},Object.fromEntries((E.MNK||[]).map(k=>[k,0]))),ec:{hl:0,nv:0,lu:0,am:0,nz:0},pot:0,mpot:0};
 dirty=1;log('[personaje] '+u+' borró su personaje');try{E.acct(u);E.pushEnt(u)}catch(e){}return{ok:1}};
OPS['wa.set']=(u,m)=>{const a=E.acct(u),d=String(m.wa||'').replace(/\D/g,'');if(!d){delete a.wa;dirty=1;return{ok:1,wa:''}}if(d.length<8||d.length>15)return{e:'Escribe tu número con código de país, solo números (ej. 18091234567)'};a.wa=d;dirty=1;return{ok:1,wa:d}};
const BDG=['🇩🇴','🇲🇽','🇨🇴','🇻🇪','🇦🇷','🇨🇱','🇵🇪','🇪🇨','🇺🇾','🇵🇾','🇧🇴','🇨🇺','🇵🇷','🇵🇦','🇨🇷','🇬🇹','🇭🇳','🇸🇻','🇳🇮','🇪🇸','🇺🇸','🇧🇷','🇨🇦','🇫🇷','🇮🇹','🇩🇪','🇬🇧','🇵🇹','🇯🇵','🇰🇷','🇨🇳','🇮🇳','🇹🇷','🇷🇺','🇺🇦','🇵🇱','🇳🇬','🇪🇬','🇲🇦','🇿🇦','👑','🔥','⭐','💎','🐉','🦁','🦅','🐺','⚔️','🛡️','🏹','🔮','🌙','☀️','⚡','❄️','🍀','🌸','💀','🎯','🏆','🦊'];
const bdgOf=u=>{try{const a=E.acct(u);return((a.vip>Date.now()||isMaster(u))&&a.bdg)||''}catch(e){return ''}};
OPS['bdg.get']=u=>{const a=E.acct(u);return{ok:1,b:a.bdg||'',on:(a.vip>Date.now()||isMaster(u))?1:0,l:BDG}};
OPS['bdg.set']=(u,m)=>{const a=E.acct(u);if(!(a.vip>Date.now()||isMaster(u)))return{e:'El distintivo necesita un Plan Jugador o Mercader activo'};const b=String(m.b||'');if(b===''){delete a.bdg}else if(BDG.includes(b)){a.bdg=b}else return{e:'Distintivo no válido'};dirty=1;return{ok:1,b:a.bdg||''}};
OPS['wa.get']=u=>({ok:1,wa:(E.acct(u).wa)||''});
/* historial de jugadores conectados: pico por dia (hora RD) y pico total; se muestra en Zona GM > Moderadores */
const pkDay=()=>new Date(Date.now()-4*36e5).toISOString().slice(0,10);
setInterval(()=>{try{const n=ONL.size;DB.cfg=DB.cfg||{};const P=DB.cfg.pk=DB.cfg.pk||{d:{},all:{n:0,t:0}},k=pkDay(),c=P.d[k]||(P.d[k]={n:0,t:0});if(n>c.n){c.n=n;c.t=Date.now();dirty=1;if(n>P.all.n){P.all={n,t:Date.now()};log('[online] nuevo pico de jugadores conectados: '+n)}}const ks=Object.keys(P.d).sort();if(ks.length>90)for(const q of ks.slice(0,ks.length-90))delete P.d[q]}catch(e){}},30000);
OPS['adm.peak']=u=>{if(!isMaster(u))return{e:'operación desconocida'};const P=(DB.cfg||{}).pk||{d:{},all:{n:0,t:0}};return{ok:1,now:ONL.size,max:MAXP,all:P.all,days:Object.keys(P.d).sort().reverse().slice(0,14).map(k=>({d:k,n:P.d[k].n,t:P.d[k].t}))}};
/* v357: entrega GM de equipo validada por servidor, disponible también para jugadores desconectados. */
OPS['adm.item']=(u,m)=>{
 if(!isMaster(u))return{e:'operación desconocida'};
 const name=String(m.name||'').trim().slice(0,80);if(!name)return{e:'Selecciona el personaje'};
 const id=E.uidByName(name);if(!id)return{e:'No encontré al personaje "'+name+'"'};
 const sl=Math.floor(Number(m.sl)),r=Math.floor(Number(m.r)),t=Math.floor(Number(m.t)),li=Math.floor(Number(m.li)),du=Math.floor(Number(m.du)),q=Math.floor(Number(m.q));
 if(!Number.isInteger(sl)||sl<0||sl>9)return{e:'Ranura no válida'};
 if(!Number.isInteger(r)||r<0||r>3)return{e:'Rareza no válida'};
 if(!Number.isInteger(t)||t<0||t>4)return{e:'Nivel del objeto no válido'};
 if(!Number.isInteger(li)||li<0||li>9)return{e:'Mejora no válida'};
 if(!Number.isInteger(du)||du<1||du>100)return{e:'Durabilidad no válida'};
 if(!Number.isInteger(q)||q<1||q>20)return{e:'Cantidad entre 1 y 20'};
 const k=m.k==null?null:Math.floor(Number(m.k));if(k!==null&&(!Number.isInteger(k)||k<0||k>7))return{e:'Clase de arma no válida'};
 let saveObj;try{saveObj=JSON.parse(fs.readFileSync(savePath(id),'utf8'))}catch(e){return{e:'El personaje todavía no tiene una partida guardada en el servidor'}}
 let v;try{v=JSON.parse(saveObj.d)}catch(e){return{e:'La partida guardada está dañada; no se modificó'}};
 if(!v||typeof v!=='object')return{e:'Partida no válida'};
 v.bag=Array.isArray(v.bag)?v.bag:[];
 if(v.bag.length+q>500)return{e:'La mochila no tiene espacio suficiente para ese premio'};
 const items=[];for(let i=0;i<q;i++){
  const it={id:crypto.randomBytes(8).toString('hex'),sl,t,li,r,du,up:li,n:'Recompensa del Master'};
  if(k!==null&&sl===0)it.k=k;
  v.bag.push(it);items.push(it.id);
 }
 saveObj.d=JSON.stringify(v);saveObj.ts=Date.now();
 try{fs.writeFileSync(savePath(id)+'.tmp',JSON.stringify(saveObj));fs.renameSync(savePath(id)+'.tmp',savePath(id))}catch(e){try{fs.unlinkSync(savePath(id)+'.tmp')}catch(_){}return{e:'No se pudo guardar el premio; inténtalo de nuevo'}}
 const audit={at:Date.now(),by:u,to:id,nm:String(E.acct(id).nm||name).slice(0,40),q,sl,r,t,li,du,k:k===null?null:k};
 DB.cfg=DB.cfg||{};DB.cfg.gmItemLog=Array.isArray(DB.cfg.gmItemLog)?DB.cfg.gmItemLog:[];DB.cfg.gmItemLog.push(audit);if(DB.cfg.gmItemLog.length>500)DB.cfg.gmItemLog.splice(0,DB.cfg.gmItemLog.length-500);dirty=1;
 log('[GM ITEM] '+u+' entregó '+q+' objeto(s) [slot='+sl+', rareza='+r+', tier='+t+', mejora='+li+'] a '+id);
 const w=ONL.get(id);if(w){try{w.send(JSON.stringify({t:'bad',e:'Has recibido un premio del Master. Vuelve a entrar para cargarlo de forma segura.'}));setTimeout(()=>{try{w.close()}catch(e){}},350)}catch(e){}}
 return{q,rar:['Común','Raro','Épico','Legendario'][r],slot:['Arma','Casco','Pechera','Guantes','Pantalones','Botas','Escudo','Anillo','Amuleto','Pendientes'][sl],nm:(E.acct(id).nm||name),online:!!w,ids:items.length};
};

OPS['early.list']=u=>isMaster(u)?{list:earlyList(),max:3,env:EARLY_ENV}:{e:'operación desconocida'};
OPS['early.add']=(u,m)=>{if(!isMaster(u))return{e:'operación desconocida'};const w=String(m.who||'').trim().toLowerCase().slice(0,120);if(!w)return{e:'Escribe el correo, usuario o uid'};const L=earlyList();if(L.includes(w))return{list:L,max:3};if(L.length>=3)return{e:'Ya hay 3 accesos anticipados. Quita uno primero.'};DB.cfg=DB.cfg||{};DB.cfg.early=(DB.cfg.early||[]).concat(w);dirty=1;log('early.add '+w);return{list:earlyList(),max:3}};
OPS['early.del']=(u,m)=>{if(!isMaster(u))return{e:'operación desconocida'};const w=String(m.who||'').trim().toLowerCase();DB.cfg=DB.cfg||{};DB.cfg.early=(DB.cfg.early||[]).filter(x=>String(x).toLowerCase()!==w);dirty=1;log('early.del '+w);return{list:earlyList(),max:3,env:EARLY_ENV}};
/* Control de mobs y respawn: configuración persistente, solo master puede cambiarla. */
const MOB_DEFAULTS={normalRespawn:20,dungeonRespawn:360,eventDensity:1,eventCap:4,eventBatch:2,eventInterval:30};
function mobCfg(){const x=((DB.cfg||{}).mobControl)||{};return{normalRespawn:Math.max(5,Math.min(180,Number(x.normalRespawn)||MOB_DEFAULTS.normalRespawn)),dungeonRespawn:Math.max(15,Math.min(1800,Number(x.dungeonRespawn)||MOB_DEFAULTS.dungeonRespawn)),eventDensity:Math.max(.1,Math.min(1,Number(x.eventDensity)||MOB_DEFAULTS.eventDensity)),eventCap:Math.max(0,Math.min(20,Math.floor(Number.isFinite(+x.eventCap)?+x.eventCap:MOB_DEFAULTS.eventCap))),eventBatch:Math.max(1,Math.min(8,Math.floor(Number(x.eventBatch)||MOB_DEFAULTS.eventBatch))),eventInterval:Math.max(10,Math.min(180,Number(x.eventInterval)||MOB_DEFAULTS.eventInterval))}}
/* v342 FIX: every client needs to read global mob settings; only the Master setter remains restricted. */
OPS['mobcfg.get']=u=>({cfg:mobCfg()});
const EV_DROP_DEFAULTS={hl:{chance:40,mult:1},nv:{chance:40,mult:1},lu:{chance:40,mult:1},am:{chance:40,mult:1},nz:{chance:40,mult:1}};
function evDropCfg(){const src=((DB.cfg||{}).eventDrops)||{},out={};for(const k of Object.keys(EV_DROP_DEFAULTS)){const d=EV_DROP_DEFAULTS[k],v=src[k]||{};out[k]={chance:Math.max(0,Math.min(100,Number.isFinite(+v.chance)?+v.chance:d.chance)),mult:Math.max(0,Math.min(10,Number.isFinite(+v.mult)?+v.mult:d.mult))}}return out}
OPS['eventdrops.get']=u=>({cfg:evDropCfg()});
OPS['adm.eventdrops.get']=u=>isMaster(u)?{cfg:evDropCfg()}:{e:'operación desconocida'};
OPS['adm.eventdrops.set']=(u,m)=>{if(!isMaster(u))return{e:'operación desconocida'};const src=m.cfg||{},out={};for(const k of Object.keys(EV_DROP_DEFAULTS)){const v=src[k]||{},chance=Number(v.chance),mult=Number(v.mult);if(!Number.isFinite(chance)||!Number.isFinite(mult))return{e:'Valor no válido para '+k};out[k]={chance:Math.round(Math.max(0,Math.min(100,chance))),mult:+Math.max(0,Math.min(10,mult)).toFixed(2)}}DB.cfg=DB.cfg||{};DB.cfg.eventDrops=out;DB.cfg.zoneTuning=DB.cfg.zoneTuning||zoneDefaults();DB.cfg.zoneTuning.events=DB.cfg.zoneTuning.events||{};for(const k of Object.keys(out)){const prev=DB.cfg.zoneTuning.events[k]||{density:1};DB.cfg.zoneTuning.events[k]={density:prev.density==null?1:prev.density,chance:out[k].chance,mult:out[k].mult}}dirty=1;log('[GM EVENT DROPS] '+u+' guardó '+JSON.stringify(out));return{ok:1,cfg:out}};
/* v343: ajuste independiente por cueva/evento desde el panel Master. */
const ZONE_CAVES=['ar','es','se','ab','to','co','mi','uw',''];
const ZONE_EVENTS=['hl','nv','lu','am','nz'];
const zoneDefaults=()=>({caves:{ar:{density:1,loot:1},es:{density:1,loot:1},se:{density:1,loot:1},ab:{density:1,loot:1},to:{density:1,loot:1},co:{density:1,loot:1},mi:{density:1,loot:1},uw:{density:1,loot:1},cr:{density:1,loot:1}},events:{hl:{density:1,chance:40,mult:1},nv:{density:1,chance:40,mult:1},lu:{density:1,chance:40,mult:1},am:{density:1,chance:40,mult:1},nz:{density:1,chance:40,mult:1}}});
function zoneCfg(){const d=zoneDefaults(),s=((DB.cfg||{}).zoneTuning)||{};for(const k of Object.keys(d.caves)){const v=s.caves&&s.caves[k]||{};d.caves[k]={density:Math.max(0,Math.min(4,Number.isFinite(+v.density)?+v.density:1)),loot:Math.max(0,Math.min(5,Number.isFinite(+v.loot)?+v.loot:1))}}for(const k of ZONE_EVENTS){const v=s.events&&s.events[k]||{},legacy=((DB.cfg||{}).eventDrops||{})[k]||{};d.events[k]={density:Math.max(0,Math.min(4,Number.isFinite(+v.density)?+v.density:1)),chance:Math.max(0,Math.min(100,Number.isFinite(+v.chance)?+v.chance:(Number.isFinite(+legacy.chance)?+legacy.chance:40))),mult:Math.max(0,Math.min(10,Number.isFinite(+v.mult)?+v.mult:(Number.isFinite(+legacy.mult)?+legacy.mult:1)))}}return d}
OPS['zonecfg.get']=u=>({cfg:zoneCfg()});
OPS['adm.zonecfg.get']=u=>isMaster(u)?{cfg:zoneCfg()}:{e:'operación desconocida'};
OPS['adm.zonecfg.set']=(u,m)=>{if(!isMaster(u))return{e:'operación desconocida'};const id=String(m.id||''),v=m.values||{},z=zoneCfg();const num=(k,lo,hi)=>{const n=Number(v[k]);if(!Number.isFinite(n))throw Error('Valor no válido: '+k);return Math.max(lo,Math.min(hi,n))};try{if(id.startsWith('cave:')){const k=id.slice(5);if(!Object.prototype.hasOwnProperty.call(z.caves,k))return{e:'Cueva no reconocida'};z.caves[k]={density:+num('density',0,4).toFixed(2),loot:+num('loot',0,5).toFixed(2)}}else if(id.startsWith('event:')){const k=id.slice(6);if(!ZONE_EVENTS.includes(k))return{e:'Evento no reconocido'};z.events[k]={density:+num('density',0,4).toFixed(2),chance:Math.round(num('chance',0,100)),mult:+num('mult',0,10).toFixed(2)}}else return{e:'Zona no reconocida'}}catch(e){return{e:e.message}}DB.cfg=DB.cfg||{};DB.cfg.zoneTuning=z;DB.cfg.eventDrops=DB.cfg.eventDrops||{};for(const k of ZONE_EVENTS)DB.cfg.eventDrops[k]={chance:z.events[k].chance,mult:z.events[k].mult};dirty=1;log('[GM ZONE TUNING] '+u+' '+id+' '+JSON.stringify(id.startsWith('cave:')?z.caves[id.slice(5)]:z.events[id.slice(6)]));return{ok:1,cfg:z}};
OPS['adm.mobcfg.get']=u=>isMaster(u)?{cfg:mobCfg()}:{e:'operación desconocida'};
OPS['adm.mobcfg.set']=(u,m)=>{if(!isMaster(u))return{e:'operación desconocida'};const num=(k,lo,hi,def)=>{const v=Number(m[k]);if(!Number.isFinite(v))throw Error('Valor no válido: '+k);return Math.max(lo,Math.min(hi,v))};let c;try{c={normalRespawn:Math.round(num('normalRespawn',5,180,20)),dungeonRespawn:Math.round(num('dungeonRespawn',15,1800,360)),eventDensity:+num('eventDensity',.1,1,1).toFixed(2),eventCap:Math.round(num('eventCap',0,20,4)),eventBatch:Math.round(num('eventBatch',1,8,2)),eventInterval:Math.round(num('eventInterval',10,180,30))}}catch(e){return{e:e.message}}DB.cfg=DB.cfg||{};DB.cfg.mobControl=c;dirty=1;log('[GM MOB] '+u+' actualizó control de mobs: '+JSON.stringify(c));return{ok:1,c}};
for(const k of ['gmk.sell','gmk.buy','gmk.cancel'])OPS[k]=()=>({e:'Este mercado se renovó: usa el 🏛️ Mercado de Gemas nuevo (recarga con Ctrl+Shift+R)'});
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
const SRV_ONLY=new Set(['offers','shops','orders','wallets','loot','gemtx','sm']);   // solo el servidor escribe; el cliente las lee y pide operaciones
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
const RAIZ=new Set(['index.html','play.html','privacidad.html','terminos.html','wiki.html','wiki-data.json','wiki-data.js','wiki-lore.js','site-hero.js','site-heroes.js','wiki.js','art.js','site.js','site-config.js','sw.js','config.js','claude-shim.js','heroes.js','world-client.js','catalog.js','site.css','site2.css','manifest.webmanifest']);
const TXT=new Set(['.html','.js','.css','.json','.webmanifest','.svg','.txt']);
/* v237: diagnóstico en /status: versión del cliente, si los datos están en un disco permanente, cuántos usuarios y personajes hay y cuántos arranques lleva esta carpeta de datos */
function diskInfo(){const DD=process.env.DATA_DIR||'';let sep=false,mnt=false;try{if(DD){sep=fs.statSync(DD).dev!==fs.statSync(__dirname).dev;try{const R=path.resolve(DD);mnt=fs.readFileSync('/proc/mounts','utf8').split('\n').some(l=>{const q=l.split(' ')[1];return q&&path.resolve(q.replace(/\\040/g,' '))===R})}catch(e){}}}catch(e){}return{set:!!DD,dir:DD||'(sin DATA_DIR)',perm:sep||mnt}}
function statusText(){const di=diskInfo(),nu=Object.keys(USR).length;let ns=0;try{ns=fs.readdirSync(SAVEDIR).filter(f=>/\.json$/.test(f)).length}catch(e){}
 const fd=t=>new Date(t).toLocaleString('es',{timeZone:'America/Santo_Domingo',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
 return 'Silk Road server OK'+(BUILD?' · cliente '+BUILD:'')+(world?' '+JSON.stringify(world.stats()):'')+' · cuentas:'+(AC?'si':'no')+(REQ?' · solo con cuenta':'')+(AC&&AC.mailOn()?' · correo:si':' · correo:no')
  +'\ndatos: '+di.dir+' → '+(di.perm?'DISCO PERMANENTE (los datos sobreviven a los reinicios)':di.set?'⚠ carpeta normal: NO parece un disco permanente':'⚠ SIN DATA_DIR: los datos se pierden en cada reinicio')
  +'\nusuarios registrados: '+nu+' · personajes guardados: '+ns
  +'\narranques con estos datos: '+BOOT.n+' (primero: '+fd(BOOT.first)+(BOOT.prev?' · anterior: '+fd(BOOT.prev):'')+')'}
function serveStatic(q,r){let p;try{p=decodeURIComponent(String(q.url||'/').split('?')[0])}catch(e){return false}
 if(p==='/status'||p==='/health'||(q.method!=='GET'&&q.method!=='HEAD'))return false;if(p.endsWith('/'))p+='index.html';
 let f=path.normalize(path.join(PUB,p));if(f.indexOf(PUB+path.sep)!==0)return false;
 if(!FC[f]&&!fs.existsSync(f)){const b=p.slice(1);if(RAIZ.has(b)||/^[\w.-]+\.(png|jpg|jpeg)$/i.test(b)||/^audio\/[\w-]+\.mp3$/.test(b))f=path.join(__dirname,b);else return false}   /* respaldo: si no hay carpeta public/, sirve el cliente suelto en la raíz (solo archivos del juego, nunca los del servidor) */
 let c=FC[f];if(!c){let st;try{st=fs.statSync(f)}catch(e){return false}if(!st.isFile())return false;const buf=fs.readFileSync(f),ext=path.extname(f).toLowerCase();
  c=FC[f]={buf,gz:TXT.has(ext)&&buf.length>1400?zlib.gzipSync(buf,{level:9}):null,type:MIME[ext]||'application/octet-stream',etag:'"'+crypto.createHash('md5').update(buf).digest('hex').slice(0,16)+'"',ext}}
 const h={'content-type':c.type,etag:c.etag,'cache-control':(TXT.has(c.ext)||p==='/sw.js')?'no-cache':'public, max-age=86400','x-content-type-options':'nosniff'};
 if(q.headers['if-none-match']===c.etag){r.writeHead(304,h);r.end();return true}
 const gz=c.gz&&/\bgzip\b/.test(q.headers['accept-encoding']||'');if(gz){h['content-encoding']='gzip';h.vary='Accept-Encoding'}
 const b=gz?c.gz:c.buf;h['content-length']=b.length;r.writeHead(200,h);r.end(q.method==='HEAD'?undefined:b);return true}
const srv=http.createServer((q,r)=>{if(String(q.url||'').split('?')[0]==='/maint'){maintHttp(q,r);return}if(String(q.url||'').split('?')[0]==='/launch'){r.writeHead(200,{'content-type':'application/json','cache-control':'no-store','access-control-allow-origin':'*'});r.end(JSON.stringify({at:LAUNCH_AT,now:Date.now()}));return}if(serveStatic(q,r))return;r.writeHead(200,{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'});r.end(statusText())});
const wss=new WebSocketServer({server:srv,maxPayload:450000});
const world=require('./world')(DB,log,{
 lv:u=>E.acct(u).lv,tag:u=>GD.tagOf(u),bdg:u=>bdgOf(u),pv:u=>true,fee:(u,n)=>{const a=E.acct(u);if(!(E.avail(a,'gold')>=n))return false;E.deliver(u,{gold:-n,note:'🏛️ Entrada al Coliseo (−'+n+' 🪙)'});return true},pay:(u,n,note)=>{E.deliver(u,{gold:n,note})},kill:(k,v,f,kn)=>MK.pvKill(k,v,f,kn),przok:k=>MK.prizeOk(k),prz:(u,k,q,n)=>MK.grant(u,k,q,n),wanted:u=>MK.btyHas(u),gm:u=>isMaster(u),gid:u=>E.acct(u).gld||'',tjoin:u=>{try{TR.join(u)}catch(e){log('terr join '+e.message)}},
 look:u=>{const a=E.acct(u);return{lv:a.lv,gt:GD.tagOf(u),sk:a.sk}},
 mint:(u,it)=>{const c=E.cleanItem(Object.assign({},it,{id:'s'+E.rid(8)}));if(!c)return it;S.ECO.reg[c.id]={o:u,k:'i',t:Date.now()};dirty=1;return c}});
S.world=world;try{TR.init()}catch(e){log('terr init '+e.stack)}
function bc(c,id,o,n){for(const ws of wss.clients){if(!ws.uid)continue;for(const s in ws.subs){const b=ws.subs[s];if(b.c!==c)continue;const mo=match(o,b.w),mn=match(n,b.w);if(mo||mn)ws.send(JSON.stringify({t:'ch',sid:+s,id,d:mn?n:null}))}}}
/* Cupo de jugadores y fila de turnos: MAX_PLAYERS=N limita los conectados a la vez (0/ausente = sin limite). Master y acceso anticipado siempre entran. */
const MAXP=parseInt(process.env.MAX_PLAYERS||'0',10)||0,QUE=new Map();
function qGate(u){if(!MAXP||isMaster(u)||isEarly(u)||ONL.has(u))return 0;const now=Date.now();for(const [k,v] of QUE)if(now-v.t>45000)QUE.delete(k);
 let q=QUE.get(u);if(!q){q={t:now};QUE.set(u,q)}q.t=now;const free=Math.max(0,MAXP-ONL.size);let pos=0;for(const k of QUE.keys()){pos++;if(k===u)break}
 if(pos<=free){QUE.delete(u);return 0}return pos}
const IPN=new Map();
/* v237: bitácora de sincronización: en los logs de Render se ve qué personaje entrega y guarda el servidor por cuenta. */
const sumSv=d=>{try{const o=JSON.parse(d);return o&&o.ch?(String(o.nm||'?').slice(0,16)+' cl'+(o.cl|0)+' nv'+(o.lv|0)):'sin personaje'}catch(e){return '?'}};
const unm=u=>{try{return (AC&&AC.unameOf(u))||u}catch(e){return u}};const LSI=new Map();
wss.on('connection',(ws,req)=>{const og=req.headers.origin;if(ORI.length&&og&&!ORI.includes(og)&&og!=='https://'+req.headers.host&&og!=='http://'+req.headers.host){ws.close(1008);return}
 const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();const n0=(IPN.get(ip)||0)+1;if(n0>12){ws.close(1013);return}IPN.set(ip,n0);ws.on('close',()=>{const k=(IPN.get(ip)||1)-1;if(k<=0)IPN.delete(ip);else IPN.set(ip,k)});
 ws.subs={};ws.uid=null;ws.n=0;ws.t=Date.now();ws.isAlive=true;ws.on('pong',()=>ws.isAlive=true);ws.xn=0;ws.xt=Date.now();
 ws.on('message',raw=>{const now=Date.now();if(now-ws.t>1000){ws.t=now;ws.n=0}if(++ws.n>80)return;let m;try{m=JSON.parse(raw)}catch(e){return}if(!m||typeof m!=='object')return;
  const rep=(o)=>{if(ws.readyState===1)ws.send(JSON.stringify(o))},err=e=>m.rid&&rep({t:'r',rid:m.rid,ok:0,e});
  if(m.t==='hi'){const done=(u,extra)=>{if(MT&&Date.now()<MT.until&&!isMaster(u)){try{rep({t:'kick',e:MT_KICK});ws.close()}catch(e){}return}const old=ONL.get(u);if(old&&old!==ws){try{old.send(JSON.stringify({t:'kick',e:'Tu cuenta se abrió en otro dispositivo'}));old.close(4001)}catch(e){}}
     if(!launched()&&!isMaster(u)&&!isEarly(u)){log('pre-apertura bloqueado: uid='+u+' ids='+earlyIds(u).join(' | '));rep({t:'bad',e:'El reino abre el '+new Date(LAUNCH_AT).toLocaleString('es',{timeZone:'America/Santo_Domingo',day:'numeric',month:'long',hour:'numeric',minute:'2-digit'})+' (hora de República Dominicana). Vuelve entonces.',launch:LAUNCH_AT});try{ws.close()}catch(e){}return}
     {const q=qGate(u);if(q){rep({t:'bad',e:'El reino está lleno ('+ONL.size+'/'+MAXP+' jugadores). Eres el #'+q+' en la fila. Espera unos segundos y vuelve a entrar.',full:1,pos:q});try{ws.close()}catch(e){}return}}
     ws.uid=u;if(extra&&extra.ses)ws.ses=extra.ses;ONL.set(u,ws);try{SO.presence(u,1)}catch(e){}const a=E.acct(u);rep(Object.assign({t:'ok',uid:u,ent:E.ent(u)},extra||{}));
     if(isMaster(u)){const o=(DB.cfg||{}).master;if(!o||o.u!==u){DB.cfg=DB.cfg||{};DB.cfg.master={u,ts:Date.now()};dirty=1;bc('cfg','master',o||null,DB.cfg.master)}}
     setTimeout(()=>E.flushDl(u),400);setTimeout(()=>{try{rep(wsvMsg())}catch(e){}},1200)};
   if(AC&&!ws.uid&&AC.pre(m,ip,rep,done,{isMaster}))return;
   if(m.g){if(!GCID){rep({t:'bad',e:'Google no configurado'});ws.close();return}
    gverify(String(m.g)).then(v=>{const u='g'+sha('g:'+v.sub).slice(0,20);ACC[u]={e:v.email,n:v.name,ts:Date.now()};dirty=1;done(u,{ses:newSes(u),email:v.email,name:v.name,master:isMaster(u)})}).catch(()=>{rep({t:'auth',e:'Google rechazó el inicio de sesión'})});return}
   if(m.ses){const a=SES[sha(m.ses)];if(!a||a.x<Date.now()){rep({t:'auth'});return}ws.ses=String(m.ses);done(a.u,{email:(ACC[a.u]||{}).e,name:(ACC[a.u]||{}).n,uname:AC.unameOf(a.u)||undefined,master:isMaster(a.u)});return}
   if(GCID||REQ){rep({t:'auth'});return}   /* con Google configurado ya no se aceptan invitados */
   const u=String(m.uid||''),k=sha(m.tok);if(!/^[\w-]{3,40}$/.test(u)||!m.tok){ws.close();return}
   if(TOK[u]&&TOK[u]!==k){rep({t:'bad'});ws.close();return}if(!TOK[u]){TOK[u]=k;dirty=1}done(u);return}
  if(!ws.uid)return;const u=ws.uid;
  if(m.t!=='sv'&&protoBad(m,0,'')){err('datos no válidos');return}
  if(m.t==='sv'){if(typeof m.d!=='string'||m.d.length>400000||now-(ws.sv||0)<1500){err('guardado rechazado');return}ws.sv=now;
   /* v236: personaje borrado = borrado de verdad. Una conexion que no ha leido el estado despues del borrado (pagehide de la pestana que borro, otro aparato con copia vieja) no puede volver a crear la partida. */
   {const wd=+((E.acct(u)||{}).wdt)||0;if(wd&&(!(ws.ldt>=wd)||(!m.force&&+m.bts>0&&+m.bts<wd))){rep({t:'r',rid:m.rid,ok:1,stale:1,wiped:1,d:null,ts:0});return}}
   /* v236: un guardado EN BLANCO (sin personaje elegido) nunca reemplaza un personaje real: se devuelve el del servidor. */
   {let nv=null;try{nv=JSON.parse(m.d)}catch(e){}if(nv&&!nv.ch){let o=null,ov=null;try{o=JSON.parse(fs.readFileSync(savePath(u),'utf8'));ov=JSON.parse(o.d)}catch(e){}if(ov&&ov.ch){log('[sync] guardado en blanco rechazado: '+u);rep({t:'r',rid:m.rid,ok:1,stale:1,blank:1,d:o.d,ts:o.ts});return}}}
   /* v235: si otro dispositivo guardó después de la última sincronización de este (bts), este guardado es viejo: NO se escribe, se devuelve el del servidor. */
   if(+m.bts>0&&!m.force){let o=null;try{o=JSON.parse(fs.readFileSync(savePath(u),'utf8'))}catch(e){}if(o&&o.ts>+m.bts+50){log('[sync] guardado viejo rechazado: '+unm(u)+' (el servidor tiene uno más nuevo: '+sumSv(o.d)+')');rep({t:'r',rid:m.rid,ok:1,stale:1,d:o.d,ts:o.ts});return}}
   let r;try{r=E.audit(u,m.d,m.ack)}catch(e){log('audit error '+e.stack);err('error de validación');return}
   if(r.rej){E.flag(u,'guardado rechazado: '+r.rej);err(r.rej);return}
   const sts=Date.now();try{fs.writeFileSync(savePath(u),JSON.stringify({d:r.out,ts:sts}))}catch(e){err('no se pudo guardar');return}
   {const sg=sumSv(r.out);if(LSI.get(u)!==sg){LSI.set(u,sg);log('[sync] sv '+unm(u)+' → '+sg)}}
   try{const v=JSON.parse(r.out);S.guildSeen&&S.guildSeen(u,v.lv|0,v.cl|0);if(DB.shops&&DB.shops[u])MK.shopView(u)}catch(e){}
   rep({t:'r',rid:m.rid,ok:1,ts:sts,fix:r.fix,acked:r.acked,ent:E.ent(u)});E.flushDl(u);return}
  if(m.t==='ld'){let o=null;try{o=JSON.parse(fs.readFileSync(savePath(u),'utf8'))}catch(e){}ws.ldt=Date.now();log('[sync] ld '+unm(u)+' → '+(o?sumSv(o.d)+' (guardado hace '+Math.round((Date.now()-o.ts)/60000)+' min)':'sin partida en el servidor'));const wd=+((E.acct(u)||{}).wdt)||0;rep({t:'r',rid:m.rid,ok:1,wp:WIPE_ID+(wd?'/'+wd:''),d:o?o.d:null,ts:o?o.ts:0,ent:E.ent(u)});setTimeout(()=>E.flushDl(u),300);return}
  if(m.t==='x'){if(now-ws.xt>1000){ws.xt=now;ws.xn=0}if(++ws.xn>12){err('demasiadas peticiones');return}
   const opn=String(m.op||'');if(opn==='acc.out'){if(ws.ses){delete SES[sha(ws.ses)];dirty=1;ws.ses=null}rep({t:'r',rid:m.rid,ok:1});return}   /* v237: cerrar sesión invalida el token de esta conexión */
   const f=hasOwn(OPS,opn)?OPS[opn]:null;if(typeof f!=='function'){err('operación desconocida');return}
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
/* v230: aviso de mantenimiento con cuenta regresiva para todos los jugadores conectados.
   Abre en el navegador: https://TU-SERVICIO.onrender.com/maint?pw=TU_MASTER_PASSWORD&warn=5&hold=5
   (warn = minutos de aviso antes de sacar a todos, hold = minutos que nadie puede entrar). Cancelar: &cancel=1 */
const MT_KICK='🛠️ Estamos actualizando Silk Road (unos 5 minutos).\n\nCuando vuelvas: entra PRIMERO desde el dispositivo (PC o celular) donde tengas tu mejor progreso, espera a ver tu héroe y después ya puedes usar el otro. Solo por esta vez.';
let MT=(DB.cfg&&DB.cfg.maint)||null;const MTS={};
const maintSave=()=>{DB.cfg=DB.cfg||{};DB.cfg.maint=MT;dirty=1};
const maintAll=m=>{for(const ws of wss.clients){if(ws.uid&&ws.readyState===1){try{ws.send(JSON.stringify(m))}catch(e){}}}};
function maintHttp(q,r){const u=new URL(q.url,'http://x'),pw=u.searchParams.get('pw')||'',H={'content-type':'text/plain; charset=utf-8','cache-control':'no-store'};
 let ok=false;try{const a=Buffer.from(pw),b=Buffer.from(process.env.MASTER_PASSWORD||'');ok=b.length>0&&a.length===b.length&&require('crypto').timingSafeEqual(a,b)}catch(e){}
 if(!ok){r.writeHead(403,H);r.end('no autorizado');return}
 if(u.searchParams.get('cancel')){MT=null;maintSave();r.writeHead(200,H);r.end('Mantenimiento cancelado');return}
 const warn=Math.max(0,Math.min(30,+u.searchParams.get('warn')||5)),hold=Math.max(0,Math.min(60,+u.searchParams.get('hold')||5));
 MT={end:Date.now()+warn*60000,until:Date.now()+(warn+hold)*60000,kicked:0};maintSave();
 maintInit();maintTick();r.writeHead(200,H);r.end('Mantenimiento programado: aviso '+warn+' min, luego nadie entra '+hold+' min. Jugadores conectados: '+ONL.size)}
function maintInit(){for(const k in MTS)delete MTS[k];if(!MT)return;const left=MT.end-Date.now();for(const s of [300,240,180,120,60,30,10])if(s*1000>left+1500)MTS[s]=1}
/* Tras un reinicio, si FORCE_RELOAD_MIN esta puesto (ej. 5), todo cliente que se reconecte recibe la pantalla de mantenimiento con el boton de recargar y no entra hasta que pasen esos minutos. */
{const fr=+process.env.FORCE_RELOAD_MIN||0;if(fr>0&&!(MT&&MT.until>Date.now()+fr*60000)){MT={end:Date.now(),until:Date.now()+fr*60000,kicked:1};maintSave()}}
/* reload.json {"id":"v232","min":5}: el reinicio fuerza la recarga SOLO si el id es distinto al ultimo que se aplico (lo cambias tu en las subidas que lo necesiten). */
try{const rj=JSON.parse(fs.readFileSync(require('path').join(__dirname,'reload.json'),'utf8'));DB.cfg=DB.cfg||{};if(rj&&rj.id&&DB.cfg.lastReload!==String(rj.id)){DB.cfg.lastReload=String(rj.id);const mn=Math.max(0,Math.min(60,+rj.min||5));dirty=1;if(mn>0&&!(MT&&MT.until>Date.now()+mn*60000)){MT={end:Date.now(),until:Date.now()+mn*60000,kicked:1};maintSave()}}}catch(e){}
maintInit();
function maintTick(){if(!MT)return;const now=Date.now();if(now>MT.until){MT=null;maintSave();return}const left=MT.end-now;
 if(left>0){for(const s of [300,240,180,120,60,30,10]){if(left<=s*1000&&!MTS[s]){MTS[s]=1;{const t=s>=60?(s/60)+' minuto'+(s>60?'s':''):s+' segundos';maintAll({t:'note',m:'⚠️ Reinicio por actualización en '+t+'. Guarda tu progreso y sal del juego. Al volver: entra primero desde tu mejor dispositivo (PC o celular).'})}}}}
 else if(!MT.kicked){MT.kicked=1;maintSave();for(const ws of wss.clients){if(!ws.uid||(ws.uid&&isMaster(ws.uid)))continue;try{ws.send(JSON.stringify({t:'kick',e:MT_KICK}));ws.close(4002)}catch(e){}}}}
setInterval(maintTick,1000);

srv.listen(PORT,()=>console.log('Silk Road server en puerto',PORT));
