/* Cuentas con usuario y contraseña + recuperación por WhatsApp (clave temporal automática) y por correo.
   - Contraseñas: scrypt con sal propia (nunca se guardan en claro). Bloqueo tras 5 fallos. Límites por IP.
   - WhatsApp (v427): el jugador da su número al registrarse. Si olvida la contraseña se le envía una clave temporal (vale 30 min). Es una credencial APARTE: no cambia su contraseña de siempre, así nadie puede dejar a otro sin cuenta pidiéndola. Con ella entra a un formulario para crear la contraseña nueva. Ver whatsapp.js y WHATSAPP_SETUP.md.
   - Correo: Resend o Brevo por HTTPS (EMAIL_PROVIDER, EMAIL_API_KEY, EMAIL_FROM). Sin proveedor, la recuperación pide ayuda por WhatsApp.
   - Master: MASTER_USER + MASTER_PASSWORD (variables de Render): cuenta fija, nadie puede registrar ese nombre. */
const crypto=require('crypto'),fs=require('fs');
module.exports=function(ctx){
const {USR,ACC,SES,sha,log,WA}=ctx,dirty=ctx.dirty;
const norm=s=>String(s||'').trim().toLowerCase();
const NAME=/^[A-Za-z0-9_]{3,16}$/,MAIL=/^[^\s@<>]{1,60}@[^\s@<>]{1,40}\.[^\s@<>]{2,15}$/;
const PROV=(process.env.EMAIL_PROVIDER||'').toLowerCase(),KEY=process.env.EMAIL_API_KEY||'',FROM=process.env.EMAIL_FROM||'',FROMN=process.env.EMAIL_FROM_NAME||'Karavan Online';
const mailOn=()=>PROV==='test'||((PROV==='resend'||PROV==='brevo')&&KEY&&FROM);
/* ---- v427: WhatsApp de recuperación ---- */
const WAP=require('./whatsapp')({log});
const WREQ=process.env.WA_REQUIRE_EXISTING==='1',WMAX=3,TMIN=+process.env.WA_TEMP_MIN||30;   /* WA_REQUIRE_EXISTING=1: las cuentas viejas no pueden jugar sin dar su número · WMAX: cuentas por número · TMIN: minutos que vale la clave temporal */
const normWa=s=>{let d=String(s||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);if(d.length===10&&/^(809|829|849)/.test(d))d='1'+d;return /^(1[2-9]\d{2}[2-9]\d{6}|[2-9]\d{7,14})$/.test(d)?d:''};
const maskWa=w=>w?'+'+'•'.repeat(Math.max(0,w.length-4))+w.slice(-4):'';
const fmtWa=w=>/^1\d{10}$/.test(w||'')?'+1 '+w.slice(1,4)+' '+w.slice(4,7)+' '+w.slice(7):(w?'+'+w:'');
const waCount=(w,self)=>{let n=0;for(const k in USR){const x=USR[k];if(x!==self&&x.w===w)n++}return n};
const TA='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   /* 32 símbolos, sin I, O, 0, 1: se leen bien en el celular */
const tmpPw=()=>{let s='';for(let i=0;i<8;i++)s+=TA[crypto.randomInt(0,TA.length)];return s.slice(0,4)+'-'+s.slice(4)};
const tkey=p=>String(p||'').replace(/[^A-Za-z0-9]/g,'').toUpperCase();   /* acepta minúsculas, espacios o sin guion */
const waText=(n,code)=>'Karavan Online 🐪\nHola '+n+': tu clave temporal es\n\n'+code+'\n\nEntra con tu usuario y esta clave (vale '+TMIN+' minutos); el juego te pedirá crear tu contraseña nueva. Si no la pediste tú, ignora este mensaje: tu contraseña de siempre sigue funcionando.';
const uidOf=n=>'u'+sha('u:'+norm(n)).slice(0,20);
const hashPw=(p,salt)=>new Promise((res,rej)=>crypto.scrypt(String(p),salt,32,{N:16384,r:8,p:1,maxmem:64*1024*1024},(e,k)=>e?rej(e):res(k.toString('hex'))));
const eq=(a,b)=>{const x=Buffer.from(a,'hex'),y=Buffer.from(b,'hex');return x.length===y.length&&crypto.timingSafeEqual(x,y)};
async function mkPw(p){const s=crypto.randomBytes(16).toString('hex');return{s,h:await hashPw(p,s)}}
/* v237: la contraseña se compara tal cual y, si no coincide, sin espacios al inicio/final (teclados de celular que agregan un espacio al autocompletar o dictar). Las contraseñas nuevas se guardan ya sin esos espacios. */
const chk=async(p,a)=>{p=String(p||'');if(eq(await hashPw(p,a.s),a.h))return true;const t=p.trim();return t!==p&&t.length>0&&eq(await hashPw(t,a.s),a.h)};
const chkT=async(p,tw)=>{const k=tkey(p);return k.length>0&&k.length<=16&&eq(await hashPw(k,tw.s),tw.h)};   /* v427: clave temporal de WhatsApp */
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
 if(m.reg){const r=m.reg||{},n=String(r.n||'').trim(),p=String(r.p||'').trim(),e=norm(r.e),rc=String(r.rc||'').toUpperCase().replace(/[^A-Z0-9_]/g,'').slice(0,16);
  if(!lim('reg'+ip,5,36e5))return fail('Demasiados registros desde tu conexión. Intenta en una hora.');
  if(!NAME.test(n))return fail('Usuario: de 3 a 16 letras, números o guion bajo.');
  if(p.length<8||p.length>64)return fail('La contraseña debe tener entre 8 y 64 caracteres.');
  if(norm(p)===norm(n))return fail('La contraseña no puede ser igual al usuario.');
  if(!MAIL.test(e))return fail('Escribe un correo válido: lo necesitas para recuperar la contraseña.');
  const w=normWa(r.w);if(!w)return fail(r.w===undefined?'Falta tu número de WhatsApp. Actualiza la página (Ctrl+F5) y vuelve a intentar.':'Escribe tu número de WhatsApp con el código de país (ej. +1 809 555 1234). Lo usamos para enviarte una clave temporal si olvidas tu contraseña.');
  if(waCount(w)>=WMAX)return fail('Ese número de WhatsApp ya está en '+WMAX+' cuentas. Usa otro número.');
  if(USR[norm(n)])return fail('Ese usuario ya existe.');
  if(rc&&!(ctx.refOk&&ctx.refOk(rc)))return fail('Ese código de influencer no existe. Revísalo o déjalo vacío.');
  if(Object.values(USR).some(x=>x.e===e))return fail('Ese correo ya está registrado. Entra con tu usuario o recupera tu contraseña.');
  mkPw(p).then(pw=>{if(USR[norm(n)]){fail('Ese usuario ya existe.');return}const u=uidOf(n);USR[norm(n)]={u,n,e,w,wt:Date.now(),h:pw.h,s:pw.s,ts:Date.now(),f:0,lk:0};ACC[u]={e,n,ts:Date.now(),pw:1};if(rc){ACC[u].rf=rc;ACC[u].ri=sha('ip:'+ip).slice(0,12)}dirty();
   done(u,{ses:sesFor(u),email:e,name:n,uname:n,master:false,fresh:1})}).catch(()=>fail('No se pudo crear la cuenta.'));return true}
 if(m.lg){const r=m.lg||{},k=norm(r.n),p=String(r.p||'');
  if(!lim('lg'+ip,25,6e5))return fail('Demasiados intentos. Espera unos minutos.');
  const a=USR[k];if(!a||!a.h){hashPw(p,'0'.repeat(32)).then(()=>fail(BAD),()=>fail(BAD));return true}
  if(a.lk&&a.lk>Date.now())return fail('Cuenta bloqueada unos minutos por intentos fallidos. Prueba más tarde o recupera tu contraseña.');
  chk(p,a).then(async good=>{if(good){a.f=0;a.lk=0;dirty();done(a.u,{ses:sesFor(a.u),email:a.e,name:a.n,uname:a.n,master:E.isMaster(a.u)});return}
   /* v427: clave temporal enviada por WhatsApp. NO abre sesión: da 15 min para crear la contraseña nueva (el cliente muestra ese formulario) */
   if(a.tw&&a.tw.x>Date.now()&&a.u!==masterUid&&await chkT(p,a.tw)){const tk=crypto.randomBytes(18).toString('hex');a.rt={h:sha(tk+a.u),x:Date.now()+15*6e4};a.f=0;a.lk=0;dirty();rep({t:'auth',tmp:1,n:a.n,tk,e:'Entraste con tu clave temporal. Crea ahora tu contraseña nueva.'});return}
   a.f=(a.f||0)+1;if(a.f>=5){a.lk=Date.now()+10*6e4;a.f=0}dirty();fail(BAD)}).catch(()=>fail(BAD));return true}
 if(m.rq){const r=m.rq||{},k=norm(r.n),e=norm(r.e);const ok=()=>{rep({t:'rec',ok:1,m:'Si los datos coinciden, te enviamos un código al correo. Vale por 15 minutos.'});return true};
  if(!lim('rq'+ip,6,36e5)||!lim('rqk'+k,3,36e5))return fail('Demasiadas solicitudes. Intenta en una hora.');
  {const a0=USR[k];try{ctx.notify&&ctx.notify('🔑 Karavan Online · Pidieron recuperar contraseña\nUsuario escrito: '+String(r.n||'').slice(0,20)+(a0?' (existe)':' (NO existe)')+'\nCorreo escrito: '+String(r.e||'').slice(0,60)+(a0&&a0.e?(a0.e===e?' ✅ coincide con la cuenta':' ❌ no coincide (la cuenta tiene '+a0.e+')'):'')+'\nResuélvelo en Zona GM > 🔑 Recuperar cuenta.')}catch(x){}}
  if(!mailOn()){rep({t:'rec',ok:0,m:'Avisamos al soporte de tu solicitud. Te escribirán para restablecer tu contraseña. También puedes escribir por WhatsApp: +'+WA})
   ;return true}
  const a=USR[k];if(!a||!a.e||a.e!==e||a.u===masterUid)return ok();
  const code=String(crypto.randomInt(0,1e8)).padStart(8,'0');a.rc={h:sha(code+a.u),x:Date.now()+15*6e4,t:0};dirty();
  sendMail(a.e,'Código para recuperar tu contraseña · Karavan Online','<div style="font-family:Georgia,serif"><h2>Karavan Online</h2><p>Tu código para cambiar la contraseña de <b>'+a.n+'</b> es:</p><p style="font-size:30px;letter-spacing:4px"><b>'+code+'</b></p><p>Vale por 15 minutos. Si no lo pediste, ignora este correo.</p></div>').catch(x=>log('correo falló: '+x.message));return ok()}
 if(m.rw){const r=m.rw||{},k=norm(r.n),w=normWa(r.w);   /* v427: «olvidé mi contraseña» → clave temporal por WhatsApp */
  const ok=()=>{rep({t:'rec',ok:1,sent:1,m:'Si los datos coinciden, te enviamos por WhatsApp una clave temporal (puede tardar un minuto). Escríbela en «Contraseña»; después el juego te pedirá crear una nueva. Vale '+TMIN+' minutos.'});return true};
  if(!w){rep({t:'rec',ok:0,m:'Escribe tu número de WhatsApp con el código de país (ej. +1 809 555 1234): el mismo que diste al registrarte.'});return true}
  if(!lim('rw'+ip,8,36e5)||!lim('rwk'+k,3,36e5)||!lim('rwn'+w,5,36e5))return fail('Demasiadas solicitudes. Intenta en una hora.');
  const a=USR[k],hit=!!(a&&a.h&&a.w&&a.w===w&&a.u!==masterUid);
  const gm=why=>{try{ctx.notify&&ctx.notify('📲 Karavan Online · Pidieron recuperar contraseña por WhatsApp'+(why?' ('+why+')':'')+'\nUsuario escrito: '+String(r.n||'').slice(0,20)+(a?' (existe)':' (NO existe)')+'\nWhatsApp escrito: '+fmtWa(w)+(a&&a.w?(a.w===w?' ✅ coincide con la cuenta':' ❌ no coincide (la cuenta tiene '+fmtWa(a.w)+')'):a?' (la cuenta no tiene número guardado)':'')+'\nResuélvelo en Zona GM > 🔑 Recuperar cuenta.')}catch(x){}};
  if(!WAP.on()){gm('sin proveedor de WhatsApp configurado');rep({t:'rec',ok:0,m:'Avisamos al soporte de tu solicitud. Te escribirán para restablecer tu contraseña. También puedes escribir por WhatsApp: +'+WA});return true}
  if(!hit){if(a&&a.u!==masterUid)gm('el número no coincide');hashPw('x','0'.repeat(32)).then(ok,ok);return true}   /* mismo tiempo de respuesta que cuando sí coincide: no se puede adivinar qué usuarios existen */
  const code=tmpPw();
  mkPw(tkey(code)).then(pw=>{a.tw={h:pw.h,s:pw.s,x:Date.now()+TMIN*6e4};a.f=0;a.lk=0;dirty();ok();log('rw: clave temporal pedida para '+a.n);
   WAP.send(a.w,code,waText(a.n,code)).catch(x=>{log('WhatsApp falló: '+x.message);a.tw=null;dirty();gm('FALLÓ el envío: '+String(x.message).slice(0,140))})}).catch(()=>ok());return true}
 if(m.rt){const r=m.rt||{},k=norm(r.n),t=String(r.t||'').replace(/[^a-f0-9]/g,''),p=String(r.p||'').trim();
  if(!lim('rt'+ip,10,36e5))return fail('Demasiados intentos. Intenta en una hora.');
  const a=USR[k],bad=()=>{rep({t:'rec',ok:0,m:'El link venció o ya se usó. Pídele uno nuevo al soporte.'});return true};
  if(p.length<8||p.length>64){rep({t:'rec',ok:0,m:'La contraseña debe tener entre 8 y 64 caracteres.'});return true}
  if(!a||!a.rt||a.rt.x<Date.now()||a.u===masterUid||!t||!eq(sha(t+a.u),a.rt.h))return bad();
  mkPw(p).then(pw=>{a.h=pw.h;a.s=pw.s;a.rt=null;a.rc=null;a.tw=null;a.f=0;a.lk=0;for(const q in SES)if(SES[q].u===a.u)delete SES[q];dirty();rep({t:'rec',ok:1,done:1,m:'Contraseña cambiada. Ya puedes entrar.'})}).catch(()=>bad());return true}
 if(m.rs){const r=m.rs||{},k=norm(r.n),e=norm(r.e),c=String(r.c||'').replace(/\D/g,''),p=String(r.p||'').trim();
  if(!lim('rs'+ip,10,36e5))return fail('Demasiados intentos. Intenta en una hora.');
  const a=USR[k],bad=()=>{rep({t:'rec',ok:0,m:'Código incorrecto o vencido.'});return true};
  if(p.length<8||p.length>64){rep({t:'rec',ok:0,m:'La contraseña debe tener entre 8 y 64 caracteres.'});return true}
  if(!a||!a.rc||a.e!==e||a.rc.x<Date.now()||a.u===masterUid)return bad();
  if(++a.rc.t>5){a.rc=null;dirty();return bad()}
  if(!eq(sha(c+a.u),a.rc.h)){dirty();return bad()}
  mkPw(p).then(pw=>{a.h=pw.h;a.s=pw.s;a.rc=null;a.tw=null;a.f=0;a.lk=0;for(const t in SES)if(SES[t].u===a.u)delete SES[t];dirty();rep({t:'rec',ok:1,done:1,m:'Contraseña cambiada. Ya puedes entrar.'})}).catch(()=>bad());return true}
 return false}
/* ---- operaciones con sesión iniciada ---- */
const byUid=u=>{if(ctx.prim)u=ctx.prim(u);return Object.values(USR).find(x=>x.u===u)};   /* v381: un personaje adicional se resuelve a su cuenta */
const ops={
 'acc.info':u=>{const a=byUid(u);return a?{n:a.n,em:a.e,pw:1,w:maskWa(a.w),ww:WAP.on()?1:0,wr:WREQ&&a.u!==masterUid?1:0,mst:a.u===masterUid?1:0}:{pw:0}},
 /* v427: guardar o cambiar el WhatsApp de recuperación. Pide la contraseña actual: quien robe una sesión abierta no puede ponerse de dueño de la cuenta */
 'acc.wa':async(u,m)=>{const a=byUid(u);if(!a)return{e:'Esta cuenta no usa contraseña'};if(a.u===masterUid)return{e:'El master no usa recuperación por WhatsApp'};
  const w=normWa(m.w);if(!w)return{e:'Escribe tu número de WhatsApp con el código de país (ej. +1 809 555 1234)'};
  if(!lim('wa'+a.u,6,36e5))return{e:'Demasiados intentos. Intenta en una hora.'};
  if(!(await chk(m.o,a)))return{e:'La contraseña actual no es correcta'};
  if(a.w!==w&&waCount(w,a)>=WMAX)return{e:'Ese número de WhatsApp ya está en '+WMAX+' cuentas. Usa otro número.'};
  a.w=w;a.wt=Date.now();dirty();log('acc.wa '+a.n);return{ok:1,w:maskWa(w),f:fmtWa(w)}},
 'acc.pw':async(u,m)=>{const a=byUid(u);if(!a)return{e:'Esta cuenta no usa contraseña'};if(u===masterUid)return{e:'La contraseña del master se cambia en Render'};
  const np=String(m.n||'').trim();if(np.length<8||np.length>64)return{e:'La contraseña nueva debe tener entre 8 y 64 caracteres'};
  if(!lim('pw'+u,5,36e5))return{e:'Demasiados intentos'};
  if(!(await chk(m.o,a)))return{e:'La contraseña actual no es correcta'};
  const pw=await mkPw(np);a.h=pw.h;a.s=pw.s;a.tw=null;dirty();return{ok:1}},
 'adm.mk':async(u,m)=>{if(!ctx.isMaster(u))return{e:'solo el master'};const n=String(m.n||'').trim(),p=String(m.p||'').trim();
  if(!NAME.test(n))return{e:'Usuario: de 3 a 16 letras, números o guion bajo'};if(p.length<8||p.length>64)return{e:'Contraseña de 8 a 64 caracteres'};if(norm(p)===norm(n))return{e:'La contraseña no puede ser igual al usuario'};
  if(USR[norm(n)])return{e:'Ese usuario ya existe'};if(!lim('mk'+u,20,36e5))return{e:'Demasiados intentos'};
  const pw=await mkPw(p);if(USR[norm(n)])return{e:'Ese usuario ya existe'};const uid=uidOf(n);USR[norm(n)]={u:uid,n,e:'',h:pw.h,s:pw.s,ts:Date.now(),f:0,lk:0,mk:1};ACC[uid]={e:'',n,ts:Date.now(),pw:1,mk:1};dirty();log('adm.mk '+n);return{ok:1,n}},
 'adm.tmp2':async(u,m)=>{if(!ctx.isMaster(u))return{e:'solo el master'};const q=norm(m.n),a=USR[q]||Object.values(USR).find(x=>x.e&&x.e===q);if(!a)return{e:'No existe ese usuario o correo'};if(a.u===masterUid)return{e:'No se puede'};
  const A='abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789',p=[...crypto.randomBytes(10)].map(x=>A[x%A.length]).join('');const pw=await mkPw(p);a.h=pw.h;a.s=pw.s;a.f=0;a.lk=0;a.rc=null;a.rt=null;a.tw=null;for(const t in SES)if(SES[t].u===a.u)delete SES[t];dirty();log('adm.tmp2 '+a.n);return{ok:1,n:a.n,em:a.e||'',w:a.w||'',p}},
 'adm.link2':async(u,m)=>{if(!ctx.isMaster(u))return{e:'solo el master'};const q=norm(m.n),a=USR[q]||Object.values(USR).find(x=>x.e&&x.e===q);if(!a)return{e:'No existe ese usuario o correo'};if(a.u===masterUid)return{e:'No se puede'};
  const t=crypto.randomBytes(18).toString('hex');a.rt={h:sha(t+a.u),x:Date.now()+24*36e5};dirty();log('adm.link2 '+a.n);return{ok:1,n:a.n,em:a.e||'',w:a.w||'',q:'rt='+encodeURIComponent(a.n)+'.'+t}},
 'adm.pw':async(u,m)=>{if(!ctx.isMaster(u))return{e:'solo el master'};const a=USR[norm(m.n)];if(!a)return{e:'No existe ese usuario'};if(a.u===masterUid)return{e:'No se puede'};
  const np=String(m.p||'').trim();if(np.length<8||np.length>64)return{e:'Contraseña temporal de 8 a 64 caracteres'};const pw=await mkPw(np);a.h=pw.h;a.s=pw.s;a.f=0;a.lk=0;a.rc=null;a.tw=null;for(const t in SES)if(SES[t].u===a.u)delete SES[t];dirty();return{ok:1}}};
return{pre,ops,masterUid,mailOn,waOn:()=>WAP.on(),waProv:()=>WAP.provider(),isAcct:u=>!!byUid(u),unameOf:u=>{const a=byUid(u);return a?a.n:''}}};