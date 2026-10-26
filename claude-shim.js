/* Reemplaza claude.use('db'/'user') para que el juego funcione en Netlify, hablando con el servidor de Render. */
(function(){
const CFG=window.SR_CFG||{},SERVER=new URLSearchParams(location.search).get('server')||CFG.server||'wss://CAMBIA-ESTO.onrender.com',GID=CFG.googleClientId||'',GATED=!!(GID||CFG.accounts);
const LS={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};
/* v237: mientras la cuenta se sincroniza, el menú del título queda bloqueado: nadie crea ni continúa una partida antes de saber qué personaje tiene su cuenta en la nube. */
if(GATED){try{document.documentElement.classList.add('sr-sync');const st=document.createElement('style');st.id='sraccCss';st.textContent='html.sr-sync #tmu{pointer-events:none;opacity:.45}#sracc{position:absolute;top:10px;left:10px;z-index:7;display:none;flex-direction:column;align-items:flex-start;gap:5px;max-width:min(64vw,380px);padding:7px 10px;border-radius:12px;background:rgba(8,10,24,.74);border:1px solid rgba(255,214,102,.45);color:#f5e6c4;font:600 12px/1.3 Georgia,serif;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}#sracc b{color:#ffd66b}#sracl{display:flex;flex-direction:column;gap:2px}#sraco{padding:4px 10px;border-radius:9px;border:1px solid rgba(255,214,102,.55);background:rgba(255,214,102,.14);color:#ffe9a8;font:700 11px Georgia,serif;cursor:pointer}@media (max-height:560px){#srlg{display:none}.srh{font-size:12.5px!important;margin:4px 2px 2px!important}}@media (max-height:420px){#sracc{max-width:205px;font:600 11px/1.25 Georgia,serif;padding:5px 8px;gap:3px}#sraco{padding:3px 8px;font-size:10.5px}}';document.documentElement.appendChild(st)}catch(e){}}
let uid=null,tok=null,ses=LS.get('sr_ses'),idRes,idP=new Promise(r=>idRes=r),me={};
let LOC0=LS.get('silkroad_v1'),first0=1;   /* v237: copia del aparato tal como estaba al abrir la página, antes de que el juego (o el servidor) la modifique */
if(!GATED){uid=LS.get('sr_uid');tok=LS.get('sr_tok');if(!uid){const r=()=>crypto.randomUUID().replace(/-/g,'');uid='p'+r().slice(0,20);tok=r();LS.set('sr_uid',uid);LS.set('sr_tok',tok)}idRes(uid)}
let ws,q=[],subs={},rq={},sid=0,rid=0,ok=0;
const raw=m=>{const s=JSON.stringify(m);if(ws&&ws.readyState==1&&ok)ws.send(s);else q.push(s)};
function conn(){ws=new WebSocket(SERVER);ok=0;
 ws.onopen=()=>{ws.send(JSON.stringify(GATED?(ses?{t:'hi',ses}:{t:'hi',noauth:1}):{t:'hi',uid,tok}))};
 ws.onmessage=e=>{got=1;let m;try{m=JSON.parse(e.data)}catch(x){return}
  if(m.t&&m.t[0]=='w'){SRNET.onmsg&&SRNET.onmsg(m)}
  else if(m.t=='ent'){G(g=>g.ent(m.ent))}
  else if(m.t=='dl'){G(g=>g.dl(m.list))}
  else if(m.t=='note'){if(m.rc&&window.SRRCV){try{window.SRRCV(m.rc)}catch(e){}}else G(g=>g.note(m.m))}
  else if(m.t=='gs'||m.t=='gc'||m.t=='ginv'){SRNET.ongd&&SRNET.ongd(m)}
  else if(m.t=='cg'||m.t=='dm'||m.t=='fq'||m.t=='fa'||m.t=='fr'||m.t=='fp'){SRNET.onsoc&&SRNET.onsoc(m)}
  else if(m.t=='kick'){ok=0;try{ws.onclose=null;ws.close()}catch(x){}document.body.innerHTML='<div style="padding:40px;color:#f5e6c4;font:20px Georgia;text-align:center;background:#0d1526;height:100vh">'+(m.e||'Sesión abierta en otro dispositivo')+'<br><br><button onclick="location.reload()" style="font-size:18px;padding:10px 20px">Volver a entrar</button></div>'}
  else if(m.t=='auth'){ses=null;LS.del('sr_ses');showLogin(m.e)}
  else if(m.t=='rec'){recMsg(m)}
  else if(m.t=='ok'){if(m.ent)G(g=>g.ent(m.ent));setTimeout(()=>G(g=>g.onok&&g.onok()),800);if(GATED){uid=m.uid;me=m;if(m.ses){ses=m.ses;LS.set('sr_ses',ses)}if(m.uname)LS.set('sr_lu',m.uname);hideLogin();idRes(uid);chipUpdate();setTimeout(()=>{try{document.documentElement.classList.remove('sr-sync')}catch(e){}},30000);cloudSync()}ok=1;SRNET.onopen&&SRNET.onopen();for(const s in subs)ws.send(JSON.stringify({t:'sub',sid:+s,col:subs[s].c,w:subs[s].w}));q.splice(0).forEach(s=>ws.send(s))}
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
const flushNow=async()=>{const d=LS.get(SKEY);if(!d||!ok||!synced||stl||window.SR_WIPING)return;let ack=[];G(g=>ack=g.ack());const go=()=>rpc({t:'sv',d,ack,bts:+LS.get('sr_bts')||0}).then(r=>{if(r.stale){staleFix(r);return}pend=null;lastUp=Date.now();if(r.ts)LS.set('sr_bts',String(r.ts));G(g=>{if(r.acked&&r.acked.length)g.acked(r.acked);if(r.fix)g.fix(r.fix);if(r.ent)g.ent(r.ent)})});
 try{await go()}catch(e){await new Promise(r=>setTimeout(r,1700));try{await go()}catch(x){}}};
window.SRNET={flush:flushNow,rpc,send:m=>{if(ws&&ws.readyState==1&&ok)ws.send(JSON.stringify(m))},up:()=>!!(ws&&ws.readyState==1&&ok),onmsg:null,onopen:null};
window.claude=window.claude||{use:async k=>k=='db'?db:k=='user'?{id:()=>idP}:null};
window.SRACC={get:()=>me,logout:()=>logout(),open:()=>accOpen(),state:()=>ST};
/* ---- Inicio de sesión: usuario y contraseña (+ Google si está configurado) ---- */
let ov=null,tab='in';let wt=null,cl=0;let got=0,cov=null,cT0=0;const stopWt=()=>{if(wt){clearTimeout(wt);wt=null}};
const pre=m=>{if(ws&&ws.readyState==1){ws.send(JSON.stringify(m));return true}return false};
const CSS='width:100%;box-sizing:border-box;padding:11px 12px;margin:5px 0;border-radius:10px;border:2px solid #6b4a17;background:#0b1224;color:#f5e6c4;font:16px Georgia,serif';
const BTN='width:100%;padding:12px;margin:8px 0 2px;border-radius:10px;border:0;background:linear-gradient(#e0434a,#b3262e);color:#fff;font:700 17px Georgia,serif;cursor:pointer;box-shadow:0 3px 0 #6f1319';
const LNK='background:none;border:0;box-shadow:none;color:#ffd66b;font:14px Georgia,serif;text-decoration:underline;cursor:pointer;padding:6px';
const $$=id=>document.getElementById(id);
/* v237: utilidades compartidas (resumen de un guardado, nombres de clase, escape de texto) */
const CLN=['Mercader','Caballero','Mago','Arquero','Sanador','Monje','Elfa Druida','Enana Guerrera'];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sumOf=s=>{try{const o=JSON.parse(s);if(!o||!o.ch)return null;return{nm:String(o.nm||'Viajero').slice(0,24),cl:o.cl|0,lv:(o.lv|0)||1}}catch(e){return null}};
const blank=s=>{try{const o=JSON.parse(s);return !o||!o.ch}catch(e){return false}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const TAB='flex:1;margin:0;padding:10px 6px;border-radius:10px;border:2px solid #6b4a17;background:#0b1224;color:#d8c9a0;font:700 15px Georgia,serif;cursor:pointer;box-shadow:none;';
const TABON='background:linear-gradient(#ffd66b,#d9a441);color:#2a1608;border-color:#ffd66b;';
const HINT='color:#d8c9a0;font-size:13.5px;line-height:1.4;margin:6px 2px 4px;text-align:left';
function hideLogin(){stopWt();if(ov){ov.remove();ov=null}}
function loginBody(){
 const f=(id,ph,type,ac,ml,x,st)=>'<input id="'+id+'" placeholder="'+ph+'" type="'+type+'" autocomplete="'+ac+'" maxlength="'+(ml||64)+'" '+(x||'')+' style="'+CSS+(st||'')+'">';
 const NA='autocapitalize="none" autocorrect="off" spellcheck="false"';
 const U=(ph,v)=>f('su',ph,'text','username',16,NA+(v?' value="'+esc(v)+'"':''));
 const EM=ph=>f('se',ph,'email','email',60,NA);
 const PW=(ph,ac)=>'<div style="position:relative">'+f('sp',ph,'password',ac,64,NA,'padding-right:46px')+'<button type="button" id="seye" aria-label="Mostrar u ocultar la contraseña" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);background:none;border:0;box-shadow:none;color:#ffd66b;font-size:19px;cursor:pointer;padding:6px 8px;line-height:1">👁</button></div>';
 const tabs='<div style="display:flex;gap:6px;margin:12px 0 2px"><button data-t="in" style="'+TAB+(tab=='in'?TABON:'')+'">Entrar</button><button data-t="up" style="'+TAB+(tab=='up'?TABON:'')+'">Crear cuenta</button></div>';
 if(tab=='in')return tabs+'<p class="srh" style="'+HINT+'">¿Ya creaste tu cuenta en otro aparato (celular o computadora)? Escribe aquí <b>el mismo usuario y la misma contraseña</b>: entras con tu mismo personaje y sigues donde lo dejaste.</p>'+U('Usuario',LS.get('sr_lu')||'')+PW('Contraseña','current-password')+'<button id="sgo" style="'+BTN+'">Entrar</button><div><button data-t="rq" style="'+LNK+'">Olvidé mi contraseña</button></div>';
 if(tab=='up')return tabs+'<p class="srh" style="'+HINT+'">Crea tu cuenta <b>una sola vez</b>. Para jugar en otro aparato no la crees de nuevo: toca «Entrar» y usa el mismo usuario y contraseña.</p>'+U('Usuario (3 a 16 letras o números)')+EM('Correo (para recuperar tu contraseña)')+PW('Contraseña (mínimo 8)','new-password')+'<button id="sgo" style="'+BTN+'">Crear cuenta y entrar</button>';
 if(tab=='rq')return '<p style="color:#d8c9a0;font-size:14px;margin:8px 0 4px">Te enviamos un código al correo con el que te registraste.</p>'+U('Usuario')+EM('Correo de tu cuenta')+'<button id="sgo" style="'+BTN+'">Enviar código</button><div><button data-t="rs" style="'+LNK+'">Ya tengo el código</button><button data-t="in" style="'+LNK+'">Volver</button></div>';
 return '<div style="margin-top:8px"></div>'+U('Usuario')+EM('Correo de tu cuenta')+f('sc','Código de 8 dígitos','text','one-time-code',8,NA)+PW('Contraseña nueva (mínimo 8)','new-password')+'<button id="sgo" style="'+BTN+'">Cambiar contraseña</button><div><button data-t="in" style="'+LNK+'">Volver</button></div>'}
function loginMsg(t,good){const e=$$('srge');if(e){if(!good&&t&&/incorrectos/.test(t))t+=' (el usuario no distingue mayúsculas; la contraseña sí). ¿Aún no creaste tu cuenta? Toca «Crear cuenta».';e.textContent=t||'';e.style.color=good?'#9fe8a8':'#ff9a9a'}}
function loginRender(msg,good){if(!ov)return;ov.querySelector('#srb').innerHTML=loginBody()+(GID?'<div style="margin:12px 0 0;color:#b9a97f;font-size:13px">o</div><div id="srg" style="display:flex;justify-content:center;min-height:44px"></div>':'');
 const tt=$$('srt');if(tt)tt.textContent=tab=='in'?'Entra a tu cuenta':tab=='up'?'Crea tu cuenta':'Recupera tu contraseña';
 const ey=$$('seye');if(ey)ey.onclick=()=>{const i=$$('sp');if(i)i.type=i.type=='password'?'text':'password'};
 ov.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;loginRender()});
 ov.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')$$('sgo').click()}));
 $$('sgo').onclick=()=>{const v=id=>($$(id)||{}).value||'';loginMsg('');const go=m=>{if(!pre(m)){loginMsg('Conectando con el servidor… un momento.',1);return}loginMsg('Un momento…',1);stopWt();wt=setTimeout(()=>loginMsg('El servidor tardó en responder. Intenta de nuevo en unos segundos.'),8000)};
  if(tab=='in')go({t:'hi',lg:{n:v('su'),p:v('sp')}});else if(tab=='up')go({t:'hi',reg:{n:v('su'),e:v('se'),p:v('sp')}});
  else if(tab=='rq')go({t:'hi',rq:{n:v('su'),e:v('se')}});else go({t:'hi',rs:{n:v('su'),e:v('se'),c:v('sc'),p:v('sp')}})};
 loginMsg(msg,good);if(GID)gbtn()}
function gbtn(){const go=()=>{google.accounts.id.initialize({client_id:GID,callback:r=>pre({t:'hi',g:r.credential}),ux_mode:'popup'});const g=$$('srg');if(g)google.accounts.id.renderButton(g,{theme:'filled_blue',size:'large',shape:'pill',text:'signin_with',locale:'es'})};
 if(window.google&&google.accounts)go();else{const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=1;s.onload=go;s.onerror=()=>loginMsg('No se pudo cargar Google. Usa tu usuario y contraseña.');document.head.appendChild(s)}}
const TLOGO='<div style="font:900 36px/1 Georgia,serif;letter-spacing:.07em;color:#ffd66b;text-shadow:0 2px 0 #7a5410,0 0 18px rgba(255,178,58,.4)">SILK ROAD</div><div style="font:600 10.5px/1 Georgia,serif;letter-spacing:.42em;color:#e9d7a8;margin-top:8px">THE GREAT ADVENTURE</div>';
function lgFix(root){try{root.querySelectorAll('img[data-lg]').forEach(im=>{const sw=()=>{if(!im.parentNode)return;const d=document.createElement('div');if(im.id)d.id=im.id;d.style.cssText='padding:6px 0 0';d.innerHTML=TLOGO;im.replaceWith(d)};im.onerror=sw;if(im.complete&&!im.naturalWidth)sw()})}catch(e){}}
function showLogin(err){stopWt();if(!GATED)return;if(ov){loginMsg(err);return}ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;z-index:99999;background:radial-gradient(900px 500px at 50% 0,#24396b,#0d1526);display:flex;padding:16px;font-family:Georgia,serif;color:#f5e6c4;text-align:center;overflow:auto';
 ov.innerHTML='<div style="margin:auto;max-width:400px;width:100%;background:linear-gradient(#22345f,#121c35);border:3px solid #6b4a17;border-radius:16px;padding:22px;box-shadow:0 12px 40px #000c"><img id="srlg" data-lg="1" src="logo.jpg" style="width:100%;border-radius:10px;border:2px solid #6b4a17"><h2 id="srt" style="color:#ffd66b;margin:12px 0 4px">Entra a tu cuenta</h2><div id="srb"></div><p id="srge" style="font-size:14px;min-height:18px;margin:8px 0 0"></p><div style="font-size:11px;color:#8d7f5e;margin-top:6px">'+(typeof SR_V!=='undefined'?esc(SR_V):'')+'</div></div>';
 document.body.appendChild(ov);lgFix(ov);loginRender(err)}
function recMsg(m){stopWt();if(m.done){tab='in';loginRender(m.m,1)}else loginMsg(m.m,m.ok)}
if(GATED)addEventListener('DOMContentLoaded',()=>{if(!ses)showLogin()});
/* ===== Pantalla de carga profesional: barra de progreso hasta que el servidor responde ===== */
function covShow(){if(cov||got||!GATED)return;cT0=Date.now();cov=document.createElement('div');
 cov.style.cssText='position:fixed;inset:0;z-index:100000;background:radial-gradient(900px 500px at 50% 0,#24396b,#0d1526);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Georgia,serif;color:#f5e6c4;text-align:center';
 cov.innerHTML='<div style="max-width:400px;width:100%"><img data-lg="1" src="logo.jpg" style="width:100%;border-radius:12px;border:2px solid #6b4a17;box-shadow:0 12px 40px #000c"><h2 style="color:#ffd66b;margin:18px 0 6px;font-size:22px">Conectando con el reino…</h2><div style="height:12px;border-radius:8px;background:#0b1224;border:2px solid #6b4a17;overflow:hidden"><div id="srcb" style="height:100%;width:3%;background:linear-gradient(90deg,#d9a441,#ffd66b);transition:width .4s"></div></div><p id="srct" style="font-size:14px;color:#b9a97f;margin:12px 0 0;min-height:36px">Despertando el servidor, un momento.</p><button id="srcr" style="display:none;margin-top:10px;padding:10px 18px;border-radius:10px;border:2px solid #6b4a17;background:#3b2a10;color:#ffd66b;font:inherit;cursor:pointer" onclick="location.reload()">Reintentar</button></div>';
 document.body.appendChild(cov);lgFix(cov);
 const iv=setInterval(()=>{const t=(Date.now()-cT0)/1000;
  if(got||!cov){clearInterval(iv);const b=$$('srcb');if(b)b.style.width='100%';setTimeout(()=>{if(cov){cov.style.transition='opacity .4s';cov.style.opacity='0';const c=cov;cov=null;setTimeout(()=>c.remove(),450)}},250);return}
  const b=$$('srcb'),x=$$('srct');if(b)b.style.width=Math.round(92*(1-Math.exp(-t/22)))+'%';
  if(x)x.textContent=t<10?'Despertando el servidor, un momento.':t<40?'El servidor se está iniciando. Puede tardar hasta un minuto la primera vez.':t<100?'Casi listo… gracias por la paciencia.':'Está tardando más de lo normal. Pulsa Reintentar.';
  if(t>=100){const r=$$('srcr');if(r)r.style.display='inline-block'}},400)}
if(GATED){if(document.body)covShow();else addEventListener('DOMContentLoaded',covShow)}

/* ---- Cuenta: cambiar contraseña, cerrar sesión y (master) restablecer la de un jugador ---- */
function accOpen(){if(!me||!me.uid)return;const BK=LS.get('sr_bak'),B0=BK&&!blank(BK)?sumOf(BK):null,BS=B0&&(!ST.cloud||ST.cloud.cl===B0.cl)?B0:null;   /* el servidor fija la clase de cada cuenta: solo se ofrece un respaldo de la misma clase */const d=document.createElement('div');d.style.cssText='position:fixed;inset:0;z-index:99998;background:#000a;display:flex;align-items:center;justify-content:center;padding:14px;font-family:Georgia,serif';
 const I=(id,ph,t)=>'<input id="'+id+'" placeholder="'+ph+'" type="'+(t||'password')+'" maxlength="64" style="'+CSS+'">';
 d.innerHTML='<div style="max-width:380px;width:100%;max-height:92vh;overflow:auto;background:linear-gradient(#22345f,#121c35);border:3px solid #6b4a17;border-radius:16px;padding:18px;color:#f5e6c4"><h3 style="margin:0 0 4px;color:#ffd66b">👤 '+esc(me.uname||me.name||'Mi cuenta')+'</h3><div style="color:#b9a97f;font-size:13px">'+(me.email||'')+'</div>'+
  (me.uname?'<h4 style="margin:14px 0 2px">Cambiar contraseña</h4>'+I('ao','Contraseña actual')+I('an','Contraseña nueva (mínimo 8)')+'<button id="apw" style="'+BTN+'">Guardar contraseña</button>':'')+
  (me.master?'<h4 style="margin:14px 0 2px">Master: restablecer contraseña de un jugador</h4>'+I('au','Usuario del jugador','text')+I('ap','Contraseña temporal (8+)','text')+'<button id="aad" style="'+BTN+'">Restablecer</button>':'')+
  '<h4 style="margin:14px 0 2px">💾 Partida en la nube</h4><div style="color:#b9a97f;font-size:12px;margin-bottom:6px">Si este aparato y otro muestran personajes distintos, elige cuál es el bueno.</div><button id="asd" style="'+BTN+';background:#3a4a7a;box-shadow:none;margin-bottom:6px">⬇ Traer la partida del servidor</button><button id="asu" style="'+BTN+';background:#3a4a7a;box-shadow:none">⬆ Usar la partida de este aparato</button>'+
  (BS?'<button id="asr" style="'+BTN+';background:#3a4a7a;box-shadow:none;margin-top:6px">♻ Recuperar respaldo: «'+esc(BS.nm)+'» Nv '+BS.lv+'</button>':'')+
  '<p id="am" style="font-size:14px;min-height:18px;margin:8px 0"></p><div style="display:flex;gap:8px"><button id="alo" style="'+BTN+';background:#3a4a7a;box-shadow:none">Cambiar de cuenta</button><button id="acl" style="'+BTN+';background:#3a4a7a;box-shadow:none">Cerrar</button></div></div>';
 document.body.appendChild(d);const m=(t,g)=>{const e=d.querySelector('#am');e.textContent=t;e.style.color=g?'#9fe8a8':'#ff9a9a'},v=id=>d.querySelector('#'+id).value;
 d.querySelector('#acl').onclick=()=>d.remove();d.querySelector('#alo').onclick=()=>{m('Cerrando sesión…',1);SRACC.logout()};
 const pw=d.querySelector('#apw');if(pw)pw.onclick=()=>rpc({t:'x',op:'acc.pw',o:v('ao'),n:v('an')}).then(()=>{m('Contraseña cambiada',1)}).catch(e=>m(e.message));
 const sd=d.querySelector('#asd'),su=d.querySelector('#asu');
sd.onclick=()=>{if(!sd.dataset.a){sd.dataset.a=1;sd.textContent='¿Seguro? Se descarta la de este aparato. Toca otra vez';return}
  rpc({t:'ld'}).then(r=>{if(!r.d){m('El servidor no tiene partida tuya todavía.');return}halt();const cur=LS.get(SKEY);if(cur&&cur!==r.d)bak(cur);_si.call(localStorage,SKEY,r.d);dropQB();LS.set('sr_bts',String(r.ts||0));LS.set('sr_own',uid);sessionStorage.setItem('sr_rl','1');location.reload()}).catch(e=>m(e.message))};
 su.onclick=()=>{if(!su.dataset.a){su.dataset.a=1;su.textContent='¿Seguro? Reemplaza la del servidor. Toca otra vez';return}
  G(g=>g.save&&g.save());const cur=LS.get(SKEY);if(!cur){m('Este aparato no tiene partida guardada.');return}
  {const L=sumOf(cur);if(L&&ST.cloud&&L.cl!==ST.cloud.cl){m('Este aparato tiene un personaje de otra clase que el de tu cuenta («'+ST.cloud.nm+'»). No se puede usar.');return}}
  m('Subiendo…',1);const up=n=>rpc({t:'sv',d:cur,force:1}).then(r=>{if(r.wiped){m('Ese personaje fue borrado. Recarga el juego.');return}if(r.ts)LS.set('sr_bts',String(r.ts));pend=null;m('Listo: el servidor ahora tiene la partida de este aparato.',1)}).catch(e=>{if(n<3&&/rechazado/.test(e.message))setTimeout(()=>up(n+1),1800);else m(e.message)});setTimeout(()=>up(0),1800)};
 const sr=d.querySelector('#asr');if(sr)sr.onclick=()=>{if(!sr.dataset.a){sr.dataset.a=1;sr.textContent='¿Seguro? Reemplaza el personaje de este aparato y el de la nube. Toca otra vez';return}
  const b=LS.get('sr_bak');if(!b||blank(b)){m('No hay respaldo.');return}
  m('Restaurando…',1);halt();const cur=LS.get(SKEY);_si.call(localStorage,SKEY,b);if(cur&&!blank(cur))_si.call(localStorage,'sr_bak',cur);else LS.del('sr_bak');dropQB();LS.del('sr_bts');LS.set('sr_own',uid);
  const up=n=>rpc({t:'sv',d:b,force:1}).then(r=>{if(r.wiped){m('Ese personaje fue borrado. Recarga el juego.');return}if(r.ts)LS.set('sr_bts',String(r.ts));sessionStorage.setItem('sr_rl','1');location.reload()}).catch(e=>{if(n<3&&/rechazado/.test(e.message))setTimeout(()=>up(n+1),1800);else m(e.message)});setTimeout(()=>up(0),1800)};
 const ad=d.querySelector('#aad');if(ad)ad.onclick=()=>rpc({t:'x',op:'adm.pw',n:v('au'),p:v('ap')}).then(()=>m('Listo: dale esa contraseña temporal al jugador',1)).catch(e=>m(e.message))}
/* ---- Guardado en la nube atado a la cuenta ---- */
const SKEY='silkroad_v1';let lastUp=0,pend=null,syncing=0,synced=GATED?0:1,loggingOut=0,retry=0;   /* sin cuentas (modo invitado) no hay sincronización previa que esperar */
/* v237: estado visible de la cuenta (lo muestra la tarjeta del título). phase: wait | sync | done | err */
const ST={phase:'wait',cloud:null,err:''};
const _si=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v){_si.call(this,k,v);if(k===SKEY&&ok){pend=v;if(!lastUp||Date.now()-lastUp>(window.SR_GAME&&SR_GAME.ack().length?2500:20000))flushSave()}};
let inflight=0,stl=0;
/* v236: antes de recargar con OTRO estado (bajar del servidor, descartar copia local, borrar) se congela todo: ni el guardado del juego ni el pagehide pueden subir la copia vieja encima. */
const halt=()=>{window.SR_WIPING=1;pend=null;stl=1};
/* v237: respaldo de una copia local que se descarta (solo si tiene personaje) y limpieza del respaldo de accesos rápidos, que la partida del servidor reescribe. */
const bak=s=>{try{if(s&&!blank(s))_si.call(localStorage,'sr_bak',s)}catch(e){}};
const dropQB=()=>LS.del(SKEY+'_quickbar');
/* staleFix: el servidor tiene una partida más nueva. halt() ANTES de escribirla: si no, el autoguardado del juego (que sigue vivo en memoria hasta que la página recarga) volvería a escribir encima la copia vieja y la subiría. */
function staleFix(r){if(stl)return;const had=window.SR_WIPING;halt();const cur=LS.get(SKEY);if(cur&&cur!==r.d)bak(cur);if(r.d){_si.call(localStorage,SKEY,r.d);dropQB();LS.set('sr_bts',String(r.ts));sessionStorage.setItem('sr_rl','1');location.reload()}else{stl=0;if(!had)window.SR_WIPING=0}}
/* v237: NADA se sube hasta terminar de sincronizar la cuenta (synced): así una copia vieja o de otra cuenta no puede pisar la nube antes de saber qué hay allí. */
function flushSave(){if(!pend||!ok||!synced||inflight||stl||window.SR_WIPING)return;const d=pend;pend=null;lastUp=Date.now();inflight=1;let ack=[];G(g=>ack=g.ack());rpc({t:'sv',d,ack,bts:+LS.get('sr_bts')||0}).then(r=>{inflight=0;if(r.stale){staleFix(r);return}if(r.ts)LS.set('sr_bts',String(r.ts));G(g=>{if(r.acked&&r.acked.length)g.acked(r.acked);if(r.fix)g.fix(r.fix);if(r.ent)g.ent(r.ent)})}).catch(()=>{inflight=0;pend=pend||d})}
setInterval(()=>{if(pend)flushSave()},8000);addEventListener('pagehide',()=>{try{if(pend&&ok&&synced)if(!stl&&!window.SR_WIPING)ws.send(JSON.stringify({t:'sv',d:pend,bts:+LS.get('sr_bts')||0}))}catch(e){}});
/* v237: tarjeta del título: con qué cuenta juegas, qué personaje hay en la nube y botón para cambiar de cuenta. */
function chipUpdate(){try{chipUpd()}catch(e){}}
function chipUpd(){const c=$$('sracc');if(!c)return;const u=me&&(me.uname||me.name);
 const T=document.getElementById('ttl'),B=document.getElementById('tbr'),vis=!!u&&T&&!T.hidden&&!T.classList.contains('out')&&B&&B.classList.contains('off');
 c.style.display=vis?'flex':'none';if(!vis)return;
 const cl=ST.phase=='done'?(ST.cloud?'☁ En tu cuenta: <b>'+esc(ST.cloud.nm)+'</b> · '+esc(CLN[ST.cloud.cl]||'Héroe')+' · Nv '+ST.cloud.lv:'☁ Tu cuenta aún no tiene personaje'):ST.phase=='err'?'⚠ Sin conexión con la nube (reintentando)':'☁ Sincronizando con tu cuenta…';
 const h='<span>👤 <b>'+esc(u)+'</b></span><span>'+cl+'</span>',l=c.querySelector('#sracl');if(l&&l.innerHTML!==h)l.innerHTML=h}
function chipInit(){try{chipIn()}catch(e){}}
function chipIn(){const T=document.getElementById('ttl');if(!T||$$('sracc'))return;const c=document.createElement('div');c.id='sracc';c.innerHTML='<div id="sracl"></div><button id="sraco" type="button">Cambiar de cuenta</button>';T.appendChild(c);
 c.addEventListener('click',e=>e.stopPropagation());
 const b=c.querySelector('#sraco');b.onclick=()=>{if(!b.dataset.a){b.dataset.a=1;b.textContent='¿Seguro? Toca otra vez';setTimeout(()=>{if(b.isConnected&&!b.disabled){delete b.dataset.a;b.textContent='Cambiar de cuenta'}},4000);return}b.disabled=true;b.textContent='Cerrando sesión…';logout()};
 try{new MutationObserver(chipUpdate).observe(T,{attributes:true,subtree:true,attributeFilter:['class','hidden']})}catch(e){}chipUpdate()}
if(GATED)addEventListener('DOMContentLoaded',chipInit);
/* v237: cerrar sesión de verdad: sube lo último de ESTA cuenta, invalida la sesión en el servidor y borra del aparato la partida (la de este usuario no puede quedarse para el siguiente). */
async function logout(){if(loggingOut)return;loggingOut=1;let up=0;
 try{
  if(ok&&synced&&!stl&&!window.SR_WIPING){G(g=>g.save&&g.save());
   const t0=Date.now();while(inflight&&Date.now()-t0<3000)await sleep(100);
   const d=LS.get(SKEY);if(!d||blank(d))up=1;
   else for(let n=0;n<2&&!up;n++){try{await Promise.race([rpc({t:'sv',d,bts:+LS.get('sr_bts')||0}),sleep(4000)]);up=1}catch(e){if(/rechazado/.test(String(e&&e.message)))await sleep(1700);else break}}}
  halt();if(ok)await Promise.race([rpc({t:'x',op:'acc.out'}).catch(()=>{}),sleep(1500)])}catch(e){}
 halt();if(!up)bak(LS.get(SKEY));   /* si no se pudo subir, la copia queda como respaldo recuperable */
 for(const k of [SKEY,SKEY+'_quickbar','sr_bts','sr_acc','sr_own','sr_wp','sr_ses'])LS.del(k);
 try{sessionStorage.removeItem('sr_rl');sessionStorage.removeItem('sr_skip')}catch(e){}
 location.reload()}
async function cloudSync(){if(syncing)return;syncing=1;let leave=0;if(!synced){ST.phase='sync';chipUpdate()}
 try{
  const own=LS.get('sr_own')||LS.get('sr_acc');let loc=LS.get(SKEY);const org=first0?LOC0:null;first0=0;
  /* v237: la copia local es de OTRA cuenta (otro usuario jugó en este aparato): jamás se mezcla. Se respalda, se borra y se recarga limpio (si no, el juego en memoria seguiría con el personaje ajeno). */
  if(loc&&own&&own!==uid){leave=1;halt();bak(org||loc);LS.del(SKEY);dropQB();LS.del('sr_bts');LS.set('sr_own',uid);LS.set('sr_acc',uid);sessionStorage.removeItem('sr_rl');location.reload();return}
  const r=await rpc({t:'ld'}),sts=+r.ts||0,bts=+LS.get('sr_bts')||0;ST.cloud=r.d?sumOf(r.d):null;
  if(r.wp&&LS.get('sr_wp')!==r.wp){LS.set('sr_wp',r.wp);if(loc){leave=1;halt();LS.del(SKEY);dropQB();LS.del('sr_bts');sessionStorage.removeItem('sr_rl');location.reload();return}}
  /* v230: EL SERVIDOR ES LA VERDAD. sr_bts = fecha del guardado del servidor con el que este dispositivo quedó sincronizado.
     - Sin copia local: se baja la del servidor.
     - Si otro dispositivo guardó después (sts>bts): gana el servidor.
     - Si nadie más guardó (sts<=bts): la copia local (más nueva) sube al servidor.
     - Sin referencia (primera vez con esta versión): regla antigua una sola vez (mayor nivel/xp). */
  /* v236: una copia local EN BLANCO (el juego arrancó y guardó su estado por defecto) no cuenta como copia: nunca debe pisar una partida real del servidor */
  if(loc&&r.d&&!blank(r.d)&&blank(loc)){loc=null;sessionStorage.removeItem('sr_rl')}
  const takeServer=()=>{leave=1;halt();bak(org||loc);_si.call(localStorage,SKEY,r.d);dropQB();LS.set('sr_bts',String(sts));LS.set('sr_own',uid);LS.set('sr_acc',uid);sessionStorage.setItem('sr_rl','1');location.reload()};
  /* v237: copia local de dueño desconocido (aparato usado antes de las cuentas, o por alguien que salió de su cuenta con una versión vieja). El servidor fija el nombre y la clase de cada cuenta: si el personaje no coincide con el de la nube (o la cuenta aún no tiene uno), esa copia no es de esta cuenta: se respalda y se empieza limpio. */
  if(loc&&!own&&!blank(loc)){const L=sumOf(org||loc),S=r.d?sumOf(r.d):null;
   if(!(L&&S&&L.nm===S.nm&&L.cl===S.cl)){if(r.d&&!blank(r.d)){takeServer();return}
    leave=1;halt();bak(org||loc);LS.del(SKEY);dropQB();LS.del('sr_bts');LS.set('sr_own',uid);LS.set('sr_acc',uid);sessionStorage.removeItem('sr_rl');location.reload();return}}
  if(r.d&&!loc&&!sessionStorage.getItem('sr_rl')){takeServer();return}
  if(r.d&&loc&&loc!==r.d&&!sessionStorage.getItem('sr_rl')){
   if(bts){if(sts>bts){takeServer();return}}
   else{let a={},b={};try{a=JSON.parse(loc)}catch(e){}try{b=JSON.parse(r.d)}catch(e){}
    if((b.lv||0)>(a.lv||0)||((b.lv||0)==(a.lv||0)&&(b.xp||0)>(a.xp||0)+1)){takeServer();return}}}
  if(r.d&&loc===r.d&&sts)LS.set('sr_bts',String(sts));
  LS.set('sr_own',uid);LS.set('sr_acc',uid);sessionStorage.removeItem('sr_rl');
  synced=1;retry=0;ST.phase='done';
  if(pend)flushSave();else if(loc)rpc({t:'sv',d:loc}).then(x=>{if(x&&x.stale){staleFix(x);return}if(x&&x.ts)LS.set('sr_bts',String(x.ts))}).catch(()=>{})
 }catch(e){if(!leave){ST.phase='err';ST.err=String(e&&e.message||e);if(retry++<5)setTimeout(()=>{if(ok&&!synced)cloudSync()},4000)}}
 finally{syncing=0;if(!leave)try{document.documentElement.classList.remove('sr-sync')}catch(e){}chipUpdate()}}
conn();
})();