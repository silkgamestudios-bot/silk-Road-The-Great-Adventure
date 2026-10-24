/* Reemplaza claude.use('db'/'user') para que el juego funcione en Netlify, hablando con el servidor de Render. */
(function(){
const CFG=window.SR_CFG||{},SERVER=new URLSearchParams(location.search).get('server')||CFG.server||'wss://CAMBIA-ESTO.onrender.com',GID=CFG.googleClientId||'',GATED=!!(GID||CFG.accounts);
const LS={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};
let uid=null,tok=null,ses=LS.get('sr_ses'),idRes,idP=new Promise(r=>idRes=r),me={};
if(!GATED){uid=LS.get('sr_uid');tok=LS.get('sr_tok');if(!uid){const r=()=>crypto.randomUUID().replace(/-/g,'');uid='p'+r().slice(0,20);tok=r();LS.set('sr_uid',uid);LS.set('sr_tok',tok)}idRes(uid)}
let ws,q=[],subs={},rq={},sid=0,rid=0,ok=0;
const raw=m=>{const s=JSON.stringify(m);if(ws&&ws.readyState==1&&ok)ws.send(s);else q.push(s)};
function conn(){ws=new WebSocket(SERVER);ok=0;
 ws.onopen=()=>{ws.send(JSON.stringify(GATED?(ses?{t:'hi',ses}:{t:'hi',noauth:1}):{t:'hi',uid,tok}))};
 ws.onmessage=e=>{got=1;let m;try{m=JSON.parse(e.data)}catch(x){return}
  if(m.t&&m.t[0]=='w'){SRNET.onmsg&&SRNET.onmsg(m)}
  else if(m.t=='ent'){G(g=>g.ent(m.ent))}
  else if(m.t=='dl'){G(g=>g.dl(m.list))}
  else if(m.t=='note'){G(g=>g.note(m.m))}
  else if(m.t=='gs'||m.t=='gc'||m.t=='ginv'){SRNET.ongd&&SRNET.ongd(m)}
  else if(m.t=='cg'||m.t=='dm'||m.t=='fq'||m.t=='fa'||m.t=='fr'||m.t=='fp'){SRNET.onsoc&&SRNET.onsoc(m)}
  else if(m.t=='kick'){ok=0;try{ws.onclose=null;ws.close()}catch(x){}document.body.innerHTML='<div style="padding:40px;color:#f5e6c4;font:20px Georgia;text-align:center;background:#0d1526;height:100vh">'+(m.e||'Sesión abierta en otro dispositivo')+'<br><br><button onclick="location.reload()" style="font-size:18px;padding:10px 20px">Volver a entrar</button></div>'}
  else if(m.t=='auth'){ses=null;LS.del('sr_ses');showLogin(m.e)}
  else if(m.t=='rec'){recMsg(m)}
  else if(m.t=='ok'){if(m.ent)G(g=>g.ent(m.ent));setTimeout(()=>G(g=>g.onok&&g.onok()),800);if(GATED){uid=m.uid;me=m;if(m.ses){ses=m.ses;LS.set('sr_ses',ses)}hideLogin();idRes(uid);cloudSync()}ok=1;SRNET.onopen&&SRNET.onopen();for(const s in subs)ws.send(JSON.stringify({t:'sub',sid:+s,col:subs[s].c,w:subs[s].w}));q.splice(0).forEach(s=>ws.send(s))}
  else if(m.t=='snap'){const b=subs[m.sid];if(b){b.docs=m.docs||{};b.cb(snap(b.docs))}}
  else if(m.t=='ch'){const b=subs[m.sid];if(b){if(m.d)b.docs[m.id]=m.d;else delete b.docs[m.id];b.cb(snap(b.docs))}}
  else if(m.t=='r'){const p=rq[m.rid];if(p){delete rq[m.rid];m.ok?p.ok(m):p.no(new Error(m.e||'error'))}}};
 ws.onclose=()=>{ok=0;cl++;if(wt){stopWt();loginMsg('Se perdió la conexión un momento. Reconectando…')}setTimeout(conn,2000)};ws.onerror=()=>{try{ws.close()}catch(e){}}}
const G=f=>{try{window.SR_GAME&&f(window.SR_GAME)}catch(e){}};
const rpc=m=>new Promise((ok2,no)=>{m.rid=++rid;rq[m.rid]={ok:ok2,no};raw(m);setTimeout(()=>{if(rq[m.rid]){delete rq[m.rid];no(new Error('timeout'))}},10000)});
const snap=docs=>({docs:Object.keys(docs).map(id=>({id,data:()=>docs[id]})),size:Object.keys(docs).length});
const col=c=>{const mk=w=>({where:(f,o,v)=>mk(w.concat([[f,o,v]])),
 onSnapshot(cb,er){const id=++sid;subs[id]={c,w,cb,docs:{}};raw({t:'sub',sid:id,col:c,w});return()=>{delete subs[id];raw({t:'unsub',sid:id})}},
 get:()=>rpc({t:'q',col:c,w}).then(r=>snap(r.docs||{}))});
 return Object.assign(mk([]),{doc:id=>{id=id||('d'+Math.random().toString(36).slice(2,12)+Date.now().toString(36));
  return{id,set:d=>rpc({t:'set',col:c,id,d}),update:d=>rpc({t:'upd',col:c,id,d}),delete:()=>rpc({t:'del',col:c,id}),
   get:()=>rpc({t:'get',col:c,id}).then(r=>({exists:!!r.d,id,data:()=>r.d}))}},
  add:d=>{const id='d'+Math.random().toString(36).slice(2,12)+Date.now().toString(36);return rpc({t:'set',col:c,id,d}).then(()=>({id}))}})};
const db={collection:col};
const flushNow=async()=>{const d=LS.get(SKEY);if(!d||!ok)return;let ack=[];G(g=>ack=g.ack());const go=()=>rpc({t:'sv',d,ack}).then(r=>{pend=null;lastUp=Date.now();if(r.ts)LS.set('sr_bts',String(r.ts));G(g=>{if(r.acked&&r.acked.length)g.acked(r.acked);if(r.fix)g.fix(r.fix);if(r.ent)g.ent(r.ent)})});
 try{await go()}catch(e){await new Promise(r=>setTimeout(r,1700));try{await go()}catch(x){}}};
window.SRNET={flush:flushNow,rpc,send:m=>{if(ws&&ws.readyState==1&&ok)ws.send(JSON.stringify(m))},up:()=>!!(ws&&ws.readyState==1&&ok),onmsg:null,onopen:null};
window.claude=window.claude||{use:async k=>k=='db'?db:k=='user'?{id:()=>idP}:null};
window.SRACC={get:()=>me,logout:()=>{LS.del('sr_ses');LS.del('sr_acc');LS.del('sr_bts');location.reload()},open:()=>accOpen()};
/* ---- Inicio de sesión: usuario y contraseña (+ Google si está configurado) ---- */
let ov=null,tab='in';let wt=null,cl=0;let got=0,cov=null,cT0=0;const stopWt=()=>{if(wt){clearTimeout(wt);wt=null}};
const pre=m=>{if(ws&&ws.readyState==1){ws.send(JSON.stringify(m));return true}return false};
const CSS='width:100%;box-sizing:border-box;padding:11px 12px;margin:5px 0;border-radius:10px;border:2px solid #6b4a17;background:#0b1224;color:#f5e6c4;font:16px Georgia,serif';
const BTN='width:100%;padding:12px;margin:8px 0 2px;border-radius:10px;border:0;background:linear-gradient(#e0434a,#b3262e);color:#fff;font:700 17px Georgia,serif;cursor:pointer;box-shadow:0 3px 0 #6f1319';
const LNK='background:none;border:0;color:#ffd66b;font:14px Georgia,serif;text-decoration:underline;cursor:pointer;padding:6px';
const $$=id=>document.getElementById(id);
function hideLogin(){stopWt();if(ov){ov.remove();ov=null}}
function loginBody(){
 const f=(id,ph,type,ac,ml)=>'<input id="'+id+'" placeholder="'+ph+'" type="'+type+'" autocomplete="'+ac+'" maxlength="'+(ml||64)+'" style="'+CSS+'">';
 if(tab=='in')return f('su','Usuario','text','username',16)+f('sp','Contraseña','password','current-password')+'<button id="sgo" style="'+BTN+'">Entrar</button><div><button data-t="up" style="'+LNK+'">Crear cuenta</button><button data-t="rq" style="'+LNK+'">Olvidé mi contraseña</button></div>';
 if(tab=='up')return f('su','Usuario (3 a 16 letras o números)','text','username',16)+f('se','Correo (para recuperar tu contraseña)','email','email',60)+f('sp','Contraseña (mínimo 8)','password','new-password')+'<button id="sgo" style="'+BTN+'">Crear cuenta y entrar</button><div><button data-t="in" style="'+LNK+'">Ya tengo cuenta</button></div>';
 if(tab=='rq')return '<p style="color:#d8c9a0;font-size:14px;margin:4px 0">Te enviamos un código al correo con el que te registraste.</p>'+f('su','Usuario','text','username',16)+f('se','Correo de tu cuenta','email','email',60)+'<button id="sgo" style="'+BTN+'">Enviar código</button><div><button data-t="rs" style="'+LNK+'">Ya tengo el código</button><button data-t="in" style="'+LNK+'">Volver</button></div>';
 return f('su','Usuario','text','username',16)+f('se','Correo de tu cuenta','email','email',60)+f('sc','Código de 8 dígitos','text','one-time-code',8)+f('sp','Contraseña nueva (mínimo 8)','password','new-password')+'<button id="sgo" style="'+BTN+'">Cambiar contraseña</button><div><button data-t="in" style="'+LNK+'">Volver</button></div>'}
function loginMsg(t,good){const e=$$('srge');if(e){e.textContent=t||'';e.style.color=good?'#9fe8a8':'#ff9a9a'}}
function loginRender(msg,good){if(!ov)return;ov.querySelector('#srb').innerHTML=loginBody()+(GID?'<div style="margin:12px 0 0;color:#b9a97f;font-size:13px">o</div><div id="srg" style="display:flex;justify-content:center;min-height:44px"></div>':'');
 ov.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;loginRender()});
 ov.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')$$('sgo').click()}));
 $$('sgo').onclick=()=>{const v=id=>($$(id)||{}).value||'';loginMsg('');const go=m=>{if(!pre(m)){loginMsg('Conectando con el servidor… un momento.',1);return}loginMsg('Un momento…',1);stopWt();wt=setTimeout(()=>loginMsg('El servidor tardó en responder. Intenta de nuevo en unos segundos.'),8000)};
  if(tab=='in')go({t:'hi',lg:{n:v('su'),p:v('sp')}});else if(tab=='up')go({t:'hi',reg:{n:v('su'),e:v('se'),p:v('sp')}});
  else if(tab=='rq')go({t:'hi',rq:{n:v('su'),e:v('se')}});else go({t:'hi',rs:{n:v('su'),e:v('se'),c:v('sc'),p:v('sp')}})};
 loginMsg(msg,good);if(GID)gbtn()}
function gbtn(){const go=()=>{google.accounts.id.initialize({client_id:GID,callback:r=>pre({t:'hi',g:r.credential}),ux_mode:'popup'});const g=$$('srg');if(g)google.accounts.id.renderButton(g,{theme:'filled_blue',size:'large',shape:'pill',text:'signin_with',locale:'es'})};
 if(window.google&&google.accounts)go();else{const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=1;s.onload=go;s.onerror=()=>loginMsg('No se pudo cargar Google. Usa tu usuario y contraseña.');document.head.appendChild(s)}}
function showLogin(err){stopWt();if(!GATED)return;if(ov){loginMsg(err);return}ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;z-index:99999;background:radial-gradient(900px 500px at 50% 0,#24396b,#0d1526);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Georgia,serif;color:#f5e6c4;text-align:center;overflow:auto';
 ov.innerHTML='<div style="max-width:400px;width:100%;background:linear-gradient(#22345f,#121c35);border:3px solid #6b4a17;border-radius:16px;padding:22px;box-shadow:0 12px 40px #000c"><img src="logo.jpg" style="width:100%;border-radius:10px;border:2px solid #6b4a17"><h2 id="srt" style="color:#ffd66b;margin:12px 0 4px">Entra a tu cuenta</h2><div id="srb"></div><p id="srge" style="font-size:14px;min-height:18px;margin:8px 0 0"></p></div>';
 document.body.appendChild(ov);loginRender(err)}
function recMsg(m){stopWt();if(m.done){tab='in';loginRender(m.m,1)}else loginMsg(m.m,m.ok)}
if(GATED)addEventListener('DOMContentLoaded',()=>{if(!ses)showLogin()});
/* ===== Pantalla de carga profesional: barra de progreso hasta que el servidor responde ===== */
function covShow(){if(cov||got||!GATED)return;cT0=Date.now();cov=document.createElement('div');
 cov.style.cssText='position:fixed;inset:0;z-index:100000;background:radial-gradient(900px 500px at 50% 0,#24396b,#0d1526);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Georgia,serif;color:#f5e6c4;text-align:center';
 cov.innerHTML='<div style="max-width:400px;width:100%"><img src="logo.jpg" style="width:100%;border-radius:12px;border:2px solid #6b4a17;box-shadow:0 12px 40px #000c"><h2 style="color:#ffd66b;margin:18px 0 6px;font-size:22px">Conectando con el reino…</h2><div style="height:12px;border-radius:8px;background:#0b1224;border:2px solid #6b4a17;overflow:hidden"><div id="srcb" style="height:100%;width:3%;background:linear-gradient(90deg,#d9a441,#ffd66b);transition:width .4s"></div></div><p id="srct" style="font-size:14px;color:#b9a97f;margin:12px 0 0;min-height:36px">Despertando el servidor, un momento.</p><button id="srcr" style="display:none;margin-top:10px;padding:10px 18px;border-radius:10px;border:2px solid #6b4a17;background:#3b2a10;color:#ffd66b;font:inherit;cursor:pointer" onclick="location.reload()">Reintentar</button></div>';
 document.body.appendChild(cov);
 const iv=setInterval(()=>{const t=(Date.now()-cT0)/1000;
  if(got||!cov){clearInterval(iv);const b=$$('srcb');if(b)b.style.width='100%';setTimeout(()=>{if(cov){cov.style.transition='opacity .4s';cov.style.opacity='0';const c=cov;cov=null;setTimeout(()=>c.remove(),450)}},250);return}
  const b=$$('srcb'),x=$$('srct');if(b)b.style.width=Math.round(92*(1-Math.exp(-t/22)))+'%';
  if(x)x.textContent=t<10?'Despertando el servidor, un momento.':t<40?'El servidor se está iniciando. Puede tardar hasta un minuto la primera vez.':t<100?'Casi listo… gracias por la paciencia.':'Está tardando más de lo normal. Pulsa Reintentar.';
  if(t>=100){const r=$$('srcr');if(r)r.style.display='inline-block'}},400)}
if(GATED){if(document.body)covShow();else addEventListener('DOMContentLoaded',covShow)}

/* ---- Cuenta: cambiar contraseña, cerrar sesión y (master) restablecer la de un jugador ---- */
function accOpen(){if(!me||!me.uid)return;const d=document.createElement('div');d.style.cssText='position:fixed;inset:0;z-index:99998;background:#000a;display:flex;align-items:center;justify-content:center;padding:14px;font-family:Georgia,serif';
 const I=(id,ph,t)=>'<input id="'+id+'" placeholder="'+ph+'" type="'+(t||'password')+'" maxlength="64" style="'+CSS+'">';
 d.innerHTML='<div style="max-width:380px;width:100%;max-height:92vh;overflow:auto;background:linear-gradient(#22345f,#121c35);border:3px solid #6b4a17;border-radius:16px;padding:18px;color:#f5e6c4"><h3 style="margin:0 0 4px;color:#ffd66b">👤 '+(me.uname||me.name||'Mi cuenta')+'</h3><div style="color:#b9a97f;font-size:13px">'+(me.email||'')+'</div>'+
  (me.uname?'<h4 style="margin:14px 0 2px">Cambiar contraseña</h4>'+I('ao','Contraseña actual')+I('an','Contraseña nueva (mínimo 8)')+'<button id="apw" style="'+BTN+'">Guardar contraseña</button>':'')+
  (me.master?'<h4 style="margin:14px 0 2px">Master: restablecer contraseña de un jugador</h4>'+I('au','Usuario del jugador','text')+I('ap','Contraseña temporal (8+)','text')+'<button id="aad" style="'+BTN+'">Restablecer</button>':'')+
  '<h4 style="margin:14px 0 2px">💾 Partida en la nube</h4><div style="color:#b9a97f;font-size:12px;margin-bottom:6px">Si este aparato y otro muestran personajes distintos, elige cuál es el bueno.</div><button id="asd" style="'+BTN+';background:#3a4a7a;box-shadow:none;margin-bottom:6px">⬇ Traer la partida del servidor</button><button id="asu" style="'+BTN+';background:#3a4a7a;box-shadow:none">⬆ Usar la partida de este aparato</button>'+
  '<p id="am" style="font-size:14px;min-height:18px;margin:8px 0"></p><div style="display:flex;gap:8px"><button id="alo" style="'+BTN+';background:#3a4a7a;box-shadow:none">Cerrar sesión</button><button id="acl" style="'+BTN+';background:#3a4a7a;box-shadow:none">Cerrar</button></div></div>';
 document.body.appendChild(d);const m=(t,g)=>{const e=d.querySelector('#am');e.textContent=t;e.style.color=g?'#9fe8a8':'#ff9a9a'},v=id=>d.querySelector('#'+id).value;
 d.querySelector('#acl').onclick=()=>d.remove();d.querySelector('#alo').onclick=()=>SRACC.logout();
 const pw=d.querySelector('#apw');if(pw)pw.onclick=()=>rpc({t:'x',op:'acc.pw',o:v('ao'),n:v('an')}).then(()=>{m('Contraseña cambiada',1)}).catch(e=>m(e.message));
 const sd=d.querySelector('#asd'),su=d.querySelector('#asu');
sd.onclick=()=>{if(!sd.dataset.a){sd.dataset.a=1;sd.textContent='¿Seguro? Se descarta la de este aparato. Toca otra vez';return}
  rpc({t:'ld'}).then(r=>{if(!r.d){m('El servidor no tiene partida tuya todavía.');return}halt();try{const cur=LS.get(SKEY);if(cur&&cur!==r.d)_si.call(localStorage,'sr_bak',cur)}catch(e){}_si.call(localStorage,SKEY,r.d);LS.set('sr_bts',String(r.ts||0));sessionStorage.setItem('sr_rl','1');location.reload()}).catch(e=>m(e.message))};
 su.onclick=()=>{if(!su.dataset.a){su.dataset.a=1;su.textContent='¿Seguro? Reemplaza la del servidor. Toca otra vez';return}
  G(g=>g.save&&g.save());const cur=LS.get(SKEY);if(!cur){m('Este aparato no tiene partida guardada.');return}
  m('Subiendo…',1);const up=n=>rpc({t:'sv',d:cur,force:1}).then(r=>{if(r.wiped){m('Ese personaje fue borrado. Recarga el juego.');return}if(r.ts)LS.set('sr_bts',String(r.ts));pend=null;m('Listo: el servidor ahora tiene la partida de este aparato.',1)}).catch(e=>{if(n<3&&/rechazado/.test(e.message))setTimeout(()=>up(n+1),1800);else m(e.message)});setTimeout(()=>up(0),1800)};
 const ad=d.querySelector('#aad');if(ad)ad.onclick=()=>rpc({t:'x',op:'adm.pw',n:v('au'),p:v('ap')}).then(()=>m('Listo: dale esa contraseña temporal al jugador',1)).catch(e=>m(e.message))}
/* ---- Guardado en la nube atado a la cuenta ---- */
const SKEY='silkroad_v1';let lastUp=0,pend=null,syncing=0;
const _si=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v){_si.call(this,k,v);if(k===SKEY&&ok){pend=v;if(!lastUp||Date.now()-lastUp>(window.SR_GAME&&SR_GAME.ack().length?2500:20000))flushSave()}};
let inflight=0,stl=0;
/* v236: antes de recargar con OTRO estado (bajar del servidor, descartar copia local, borrar) se congela todo: ni el guardado del juego ni el pagehide pueden subir la copia vieja encima. */
const halt=()=>{window.SR_WIPING=1;pend=null;stl=1};
function staleFix(r){if(stl)return;stl=1;pend=null;try{const cur=LS.get(SKEY);if(cur&&cur!==r.d)_si.call(localStorage,'sr_bak',cur)}catch(e){}if(r.d){_si.call(localStorage,SKEY,r.d);LS.set('sr_bts',String(r.ts));sessionStorage.setItem('sr_rl','1');location.reload()}else stl=0}
function flushSave(){if(!pend||!ok||inflight||stl||window.SR_WIPING)return;const d=pend;pend=null;lastUp=Date.now();inflight=1;let ack=[];G(g=>ack=g.ack());rpc({t:'sv',d,ack,bts:+LS.get('sr_bts')||0}).then(r=>{inflight=0;if(r.stale){staleFix(r);return}if(r.ts)LS.set('sr_bts',String(r.ts));G(g=>{if(r.acked&&r.acked.length)g.acked(r.acked);if(r.fix)g.fix(r.fix);if(r.ent)g.ent(r.ent)})}).catch(()=>{inflight=0;pend=pend||d})}
setInterval(()=>{if(pend)flushSave()},8000);addEventListener('pagehide',()=>{try{if(pend&&ok)if(!stl&&!window.SR_WIPING)ws.send(JSON.stringify({t:'sv',d:pend,bts:+LS.get('sr_bts')||0}))}catch(e){}});
async function cloudSync(){if(syncing)return;syncing=1;try{
 const prev=LS.get('sr_acc');if(prev&&prev!==uid){LS.del(SKEY);LS.del('sr_bts')}LS.set('sr_acc',uid);
 const r=await rpc({t:'ld'}),sts=+r.ts||0,bts=+LS.get('sr_bts')||0;let loc=LS.get(SKEY);
 if(r.wp&&LS.get('sr_wp')!==r.wp){LS.set('sr_wp',r.wp);if(loc){halt();LS.del(SKEY);LS.del('sr_bts');sessionStorage.removeItem('sr_rl');location.reload();return}}
 /* v230: EL SERVIDOR ES LA VERDAD. sr_bts = fecha del guardado del servidor con el que este dispositivo quedó sincronizado.
    - Sin copia local: se baja la del servidor.
    - Si otro dispositivo guardó después (sts>bts): gana el servidor.
    - Si nadie más guardó (sts<=bts): la copia local (más nueva) sube al servidor.
    - Sin referencia (primera vez con esta versión): regla antigua una sola vez (mayor nivel/xp). */
 /* v236: una copia local EN BLANCO (el juego arrancó y guardó su estado por defecto) no cuenta como copia: nunca debe pisar una partida real del servidor */
 const blank=s=>{try{const o=JSON.parse(s);return !o||!o.ch}catch(e){return false}};
 if(loc&&r.d&&!blank(r.d)&&blank(loc)){loc=null;sessionStorage.removeItem('sr_rl')}
 const takeServer=()=>{halt();_si.call(localStorage,SKEY,r.d);LS.set('sr_bts',String(sts));sessionStorage.setItem('sr_rl','1');location.reload()};
 if(r.d&&!loc&&!sessionStorage.getItem('sr_rl')){takeServer();return}
 if(r.d&&loc&&loc!==r.d&&!sessionStorage.getItem('sr_rl')){
  if(bts){if(sts>bts){takeServer();return}}
  else{let a={},b={};try{a=JSON.parse(loc)}catch(e){}try{b=JSON.parse(r.d)}catch(e){}
   if((b.lv||0)>(a.lv||0)||((b.lv||0)==(a.lv||0)&&(b.xp||0)>(a.xp||0)+1)){takeServer();return}}}
 if(r.d&&loc===r.d&&sts)LS.set('sr_bts',String(sts));
 sessionStorage.removeItem('sr_rl');if(loc)rpc({t:'sv',d:loc}).then(x=>{if(x&&x.stale){staleFix(x);return}if(x&&x.ts)LS.set('sr_bts',String(x.ts))}).catch(()=>{})}catch(e){}syncing=0}
conn();
})();