/* Cuentas con usuario y contraseña + recuperación por correo.
   - Contraseñas: scrypt con sal propia (nunca se guardan en claro). Bloqueo tras 5 fallos. Límites por IP.
   - Correo: Resend o Brevo por HTTPS (EMAIL_PROVIDER, EMAIL_API_KEY, EMAIL_FROM). Sin proveedor, la recuperación pide ayuda por WhatsApp.
   - Master: MASTER_USER + MASTER_PASSWORD (variables de Render): cuenta fija, nadie puede registrar ese nombre. */
const crypto=require('crypto'),fs=require('fs');
module.exports=function(ctx){
const {USR,ACC,SES,sha,log,WA}=ctx,dirty=ctx.dirty;
const norm=s=>String(s||'').trim().toLowerCase();
const NAME=/^[A-Za-z0-9_]{3,16}$/,MAIL=/^[^\s@<>]{1,60}@[^\s@<>]{1,40}\.[^\s@<>]{2,15}$/;
const PROV=(process.env.EMAIL_PROVIDER||'').toLowerCase(),KEY=process.env.EMAIL_API_KEY||'',FROM=process.env.EMAIL_FROM||'',FROMN=process.env.EMAIL_FROM_NAME||'Silk Road';
const mailOn=()=>PROV==='test'||((PROV==='resend'||PROV==='brevo')&&KEY&&FROM);
const uidOf=n=>'u'+sha('u:'+norm(n)).slice(0,20);
const hashPw=(p,salt)=>new Promise((res,rej)=>crypto.scrypt(String(p),salt,32,{N:16384,r:8,p:1,maxmem:64*1024*1024},(e,k)=>e?rej(e):res(k.toString('hex'))));
const eq=(a,b)=>{const x=Buffer.from(a,'hex'),y=Buffer.from(b,'hex');return x.length===y.length&&crypto.timingSafeEqual(x,y)};
async function mkPw(p){const s=crypto.randomBytes(16).toString('hex');return{s,h:await hashPw(p,s)}}
/* v237: la contraseña se compara tal cual y, si no coincide, sin espacios al inicio/final (teclados de celular que agregan un espacio al autocompletar o dictar). Las contraseñas nuevas se guardan ya sin esos espacios. */
const chk=async(p,a)=>{p=String(p||'');if(eq(await hashPw(p,a.s),a.h))return true;const t=p.trim();return t!==p&&t.length>0&&eq(await hashPw(t,a.s),a.h)};
/* ---- límites por IP ---- */
const RL=new Map();const lim=(k,max,ms)=>{const n=Date.now();let a=(RL.get(k)||[]).filter(t=>n-t<ms);if(a.length>=max){RL.set(k,a);return false}a.push(n);RL.set(k,a);return true};
setInterval(()=>{const n=Date.now();for(const [k,a] of RL){const f=a.filter(t=>n-t<36e5);if(f.length)RL.set(k,f);else RL.delete(k)}},60000).unref();
/* ---- correo ---- */
async function sendMail(to,subject,html){
 if(PROV==='test'){const f=(process.env.DATA_DIR||'.')+'/outbox.json';let o=[];try{o=JSON.parse(fs.readFileSync(f,'utf8'))}catch(e){}o.push({to,subject,html,ts:Date.now()});fs.writeFileSync(f,JSON.stringify(o));return true}
 if(PROV==='resend'){const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+KEY},body:JSON.stringify({from:FROMN+' <'+FROM+'>',to:[to],subject,html})});if(!r.ok)throw new Error('resend '+r.status);return true}
 if(PROV==='brevo'){const r=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'content-type':'application/json','api-key':KEY},body:JSON.stringify({sender:{email:FROM,name:FROMN},to:[{email:to}],subject,htmlContent:html})});if(!r.ok)throw new Error('brevo '+r.status);return true}
 throw new Error('sin proveedor de correo')}
/* ---- cuenta master fija (desde variables de entorno) ---- */
const MU=process.env.MASTER_USER||'',MP=process.env.MASTER_PASSWORD||'';
const masterUid=MU&&MP&&NAME.test(MU)?uidOf(MU):'';
(async()=>{if(!masterUid)return;const k=norm(MU),old=USR[k];let h=old&&old.h?await hashPw(MP,old.s):'';if(old&&old.u===masterUid&&eq(h,old.h))return;
 const p=await mkPw(MP);USR[k]={u:masterUid,n:MU,e:norm(process.env.MASTER_EMAIL||''),h:p.h,s:p.s,ts:(old&&old.ts)||Date.now(),f:0,lk:0};ACC[masterUid]={e:USR[k].e,n:MU,ts:Date.now()};dirty();log('cuenta master lista: '+MU)})().catch(e=>log('master user error '+e.message));
const sesFor=u=>{const t=crypto.randomBytes(24).toString('hex');SES[sha(t)]={u,x:Date.now()+90*864e5};dirty();return t};
const BAD='Usuario o contraseña incorrectos';
/* ---- mensajes previos al login. Devuelve true si los atendió ---- */
function pre(m,ip,rep,done,E){
 const fail=e=>{rep({t:'auth',e});return true};
 if(m.reg){const r=m.reg||{},n=String(r.n||'').trim(),p=String(r.p||'').trim(),e=norm(r.e);
  if(!lim('reg'+ip,5,36e5))return fail('Demasiados registros desde tu conexión. Intenta en una hora.');
  if(!NAME.test(n))return fail('Usuario: de 3 a 16 letras, números o guion bajo.');
  if(p.length<8||p.length>64)return fail('La contraseña debe tener entre 8 y 64 caracteres.');
  if(norm(p)===norm(n))return fail('La contraseña no puede ser igual al usuario.');
  if(!MAIL.test(e))return fail('Escribe un correo válido: lo necesitas para recuperar la contraseña.');
  if(USR[norm(n)])return fail('Ese usuario ya existe.');
  if(Object.values(USR).some(x=>x.e===e))return fail('Ese correo ya está registrado. Entra con tu usuario o recupera tu contraseña.');
  mkPw(p).then(pw=>{if(USR[norm(n)]){fail('Ese usuario ya existe.');return}const u=uidOf(n);USR[norm(n)]={u,n,e,h:pw.h,s:pw.s,ts:Date.now(),f:0,lk:0};ACC[u]={e,n,ts:Date.now(),pw:1};dirty();
   done(u,{ses:sesFor(u),email:e,name:n,uname:n,master:false,fresh:1})}).catch(()=>fail('No se pudo crear la cuenta.'));return true}
 if(m.lg){const r=m.lg||{},k=norm(r.n),p=String(r.p||'');
  if(!lim('lg'+ip,25,6e5))return fail('Demasiados intentos. Espera unos minutos.');
  const a=USR[k];if(!a||!a.h){hashPw(p,'0'.repeat(32)).then(()=>fail(BAD),()=>fail(BAD));return true}
  if(a.lk&&a.lk>Date.now())return fail('Cuenta bloqueada unos minutos por intentos fallidos. Prueba más tarde o recupera tu contraseña.');
  chk(p,a).then(good=>{if(good){a.f=0;a.lk=0;dirty();done(a.u,{ses:sesFor(a.u),email:a.e,name:a.n,uname:a.n,master:E.isMaster(a.u)})}
   else{a.f=(a.f||0)+1;if(a.f>=5){a.lk=Date.now()+10*6e4;a.f=0}dirty();fail(BAD)}}).catch(()=>fail(BAD));return true}
 if(m.rq){const r=m.rq||{},k=norm(r.n),e=norm(r.e);const ok=()=>{rep({t:'rec',ok:1,m:'Si los datos coinciden, te enviamos un código al correo. Vale por 15 minutos.'});return true};
  if(!lim('rq'+ip,6,36e5)||!lim('rqk'+k,3,36e5))return fail('Demasiadas solicitudes. Intenta en una hora.');
  if(!mailOn()){rep({t:'rec',ok:0,m:'El envío de correos aún no está activo. Escríbele al soporte por WhatsApp: +'+WA+' y te restablecemos la contraseña.'});return true}
  const a=USR[k];if(!a||!a.e||a.e!==e||a.u===masterUid)return ok();
  const code=String(crypto.randomInt(0,1e8)).padStart(8,'0');a.rc={h:sha(code+a.u),x:Date.now()+15*6e4,t:0};dirty();
  sendMail(a.e,'Código para recuperar tu contraseña · Silk Road','<div style="font-family:Georgia,serif"><h2>Silk Road: The Great Adventure</h2><p>Tu código para cambiar la contraseña de <b>'+a.n+'</b> es:</p><p style="font-size:30px;letter-spacing:4px"><b>'+code+'</b></p><p>Vale por 15 minutos. Si no lo pediste, ignora este correo.</p></div>').catch(x=>log('correo falló: '+x.message));return ok()}
 if(m.rs){const r=m.rs||{},k=norm(r.n),e=norm(r.e),c=String(r.c||'').replace(/\D/g,''),p=String(r.p||'').trim();
  if(!lim('rs'+ip,10,36e5))return fail('Demasiados intentos. Intenta en una hora.');
  const a=USR[k],bad=()=>{rep({t:'rec',ok:0,m:'Código incorrecto o vencido.'});return true};
  if(p.length<8||p.length>64){rep({t:'rec',ok:0,m:'La contraseña debe tener entre 8 y 64 caracteres.'});return true}
  if(!a||!a.rc||a.e!==e||a.rc.x<Date.now()||a.u===masterUid)return bad();
  if(++a.rc.t>5){a.rc=null;dirty();return bad()}
  if(!eq(sha(c+a.u),a.rc.h)){dirty();return bad()}
  mkPw(p).then(pw=>{a.h=pw.h;a.s=pw.s;a.rc=null;a.f=0;a.lk=0;for(const t in SES)if(SES[t].u===a.u)delete SES[t];dirty();rep({t:'rec',ok:1,done:1,m:'Contraseña cambiada. Ya puedes entrar.'})}).catch(()=>bad());return true}
 return false}
/* ---- operaciones con sesión iniciada ---- */
const byUid=u=>Object.values(USR).find(x=>x.u===u);
const ops={
 'acc.info':u=>{const a=byUid(u);return a?{n:a.n,e:a.e,pw:1}:{pw:0}},
 'acc.pw':async(u,m)=>{const a=byUid(u);if(!a)return{e:'Esta cuenta no usa contraseña'};if(u===masterUid)return{e:'La contraseña del master se cambia en Render'};
  const np=String(m.n||'').trim();if(np.length<8||np.length>64)return{e:'La contraseña nueva debe tener entre 8 y 64 caracteres'};
  if(!lim('pw'+u,5,36e5))return{e:'Demasiados intentos'};
  if(!(await chk(m.o,a)))return{e:'La contraseña actual no es correcta'};
  const pw=await mkPw(np);a.h=pw.h;a.s=pw.s;dirty();return{ok:1}},
 'adm.mk':async(u,m)=>{if(!ctx.isMaster(u))return{e:'solo el master'};const n=String(m.n||'').trim(),p=String(m.p||'').trim();
  if(!NAME.test(n))return{e:'Usuario: de 3 a 16 letras, números o guion bajo'};if(p.length<8||p.length>64)return{e:'Contraseña de 8 a 64 caracteres'};if(norm(p)===norm(n))return{e:'La contraseña no puede ser igual al usuario'};
  if(USR[norm(n)])return{e:'Ese usuario ya existe'};if(!lim('mk'+u,20,36e5))return{e:'Demasiados intentos'};
  const pw=await mkPw(p);if(USR[norm(n)])return{e:'Ese usuario ya existe'};const uid=uidOf(n);USR[norm(n)]={u:uid,n,e:'',h:pw.h,s:pw.s,ts:Date.now(),f:0,lk:0,mk:1};ACC[uid]={e:'',n,ts:Date.now(),pw:1,mk:1};dirty();log('adm.mk '+n);return{ok:1,n}},
 'adm.pw':async(u,m)=>{if(!ctx.isMaster(u))return{e:'solo el master'};const a=USR[norm(m.n)];if(!a)return{e:'No existe ese usuario'};if(a.u===masterUid)return{e:'No se puede'};
  const np=String(m.p||'').trim();if(np.length<8||np.length>64)return{e:'Contraseña temporal de 8 a 64 caracteres'};const pw=await mkPw(np);a.h=pw.h;a.s=pw.s;a.f=0;a.lk=0;a.rc=null;for(const t in SES)if(SES[t].u===a.u)delete SES[t];dirty();return{ok:1}}};
return{pre,ops,masterUid,mailOn,isAcct:u=>!!byUid(u),unameOf:u=>{const a=byUid(u);return a?a.n:''}}};