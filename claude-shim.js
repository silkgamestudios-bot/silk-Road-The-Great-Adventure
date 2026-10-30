/* Reemplaza claude.use('db'/'user') para que el juego funcione en Netlify, hablando con el servidor de Render. */
(function(){
const CFG=window.SR_CFG||{},SERVER=new URLSearchParams(location.search).get('server')||CFG.server||'wss://CAMBIA-ESTO.onrender.com',GID=CFG.googleClientId||'',GATED=!!(GID||CFG.accounts);
const LS={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};
/* v237: mientras la cuenta se sincroniza, el menú del título queda bloqueado: nadie crea ni continúa una partida antes de saber qué personaje tiene su cuenta en la nube. */
if(GATED){try{document.documentElement.classList.add('sr-sync');const st=document.createElement('style');st.id='sraccCss';st.textContent='html.sr-sync #tmu{pointer-events:none;opacity:.45}#sracc{position:absolute;top:10px;left:10px;z-index:7;display:none;flex-direction:column;align-items:flex-start;gap:5px;max-width:min(64vw,380px);padding:7px 10px;border-radius:12px;background:rgba(8,10,24,.74);border:1px solid rgba(255,214,102,.45);color:#f5e6c4;font:600 12px/1.3 Georgia,serif;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}#sracc b{color:#ffd66b}#sracl{display:flex;flex-direction:column;gap:2px}#sraco{padding:4px 10px;border-radius:9px;border:1px solid rgba(255,214,102,.55);background:rgba(255,214,102,.14);color:#ffe9a8;font:700 11px Georgia,serif;cursor:pointer}@media (max-height:560px){#srlg{display:none}.srh{font-size:12.5px!important;margin:4px 2px 2px!important}}@media (max-height:420px){#sracc{max-width:205px;font:600 11px/1.25 Georgia,serif;padding:5px 8px;gap:3px}#sraco{padding:3px 8px;font-size:10.5px}}';document.documentElement.appendChild(st)}catch(e){}}
let uid=null,tok=null,ses=LS.get('sr_ses'),idRes,idP=new Promise(r=>idRes=r),me={};
let LOC0=LS.get('silkroad_v1'),first0=1;   /* v237: copia del aparato tal como estaba al abrir la página, antes de que el juego (o el servidor) la modifique */
if(!GATED){uid=LS.get('sr_uid');tok=LS.get('sr_tok');if(!uid){const r=()=>crypto.randomUUID().replace(/-/g,'');uid='p'+r().slice(0,20);tok=r();LS.set('sr_uid',uid);LS.set('sr_tok',tok)}idRes(uid)}
let ws,q=[],subs={},rq={},sid=0,rid=0,ok=0,pendingPre=null;
const raw=m=>{const s=JSON.stringify(m);if(ws&&ws.readyState==1&&ok)ws.send(s);else q.push(s)};
function conn(){ws=new WebSocket(SERVER);ok=0;
 ws.onopen=()=>{ws.send(JSON.stringify(GATED?(ses?{t:'hi',ses}:{t:'hi',noauth:1}):{t:'hi',uid,tok}));if(pendingPre){const m=pendingPre;pendingPre=null;try{ws.send(JSON.stringify(m))}catch(e){pendingPre=m}}};
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
  else if(m.t=='ok'){stopWt();pendingPre=null;if(m.ent)G(g=>g.ent(m.ent));setTimeout(()=>G(g=>g.onok&&g.onok()),800);if(GATED){uid=m.uid;me=m;if(m.ses){ses=m.ses;LS.set('sr_ses',ses)}if(m.uname)LS.set('sr_lu',m.uname);hideLogin();idRes(uid);chipUpdate();try{window.dispatchEvent(new Event('sr-chars'))}catch(x){}setTimeout(()=>{try{document.documentElement.classList.remove('sr-sync')}catch(e){}},30000);cloudSync()}ok=1;SRNET.onopen&&SRNET.onopen();for(const s in subs)ws.send(JSON.stringify({t:'sub',sid:+s,col:subs[s].c,w:subs[s].w}));q.splice(0).forEach(s=>ws.send(s))}
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
window.SRACC={get:()=>me,logout:()=>logout(),open:()=>accOpen(),state:()=>ST,hasChars:()=>!!(GATED&&me&&Array.isArray(me.chars)&&me.chars.length),chars_open:o=>chOpen(o||{}),market_open:o=>cmOpen(o||{})};
/* ---- Inicio de sesión: usuario y contraseña (+ Google si está configurado) ---- */
let ov=null,tab='in';let wt=null,cl=0;let got=0,cov=null,cT0=0;const stopWt=()=>{if(wt){clearTimeout(wt);wt=null}};
const pre=m=>{if(ws&&ws.readyState==1){try{ws.send(JSON.stringify(m));return true}catch(e){pendingPre=m;return true}}pendingPre=m;return true};
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
 const REFC=()=>{try{const q=new URLSearchParams(location.search).get('ref');if(q){localStorage.setItem('sr_ref',q.replace(/[^A-Za-z0-9_]/g,'').slice(0,16).toUpperCase())}return localStorage.getItem('sr_ref')||''}catch(e){return''}};
 const EM=ph=>f('se',ph,'email','email',60,NA);
 const PW=(ph,ac)=>'<div style="position:relative">'+f('sp',ph,'password',ac,64,NA,'padding-right:46px')+'<button type="button" id="seye" aria-label="Mostrar u ocultar la contraseña" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);background:none;border:0;box-shadow:none;color:#ffd66b;font-size:19px;cursor:pointer;padding:6px 8px;line-height:1">👁</button></div>';
 const tabs='<div style="display:flex;gap:6px;margin:12px 0 2px"><button data-t="in" style="'+TAB+(tab=='in'?TABON:'')+'">Entrar</button><button data-t="up" style="'+TAB+(tab=='up'?TABON:'')+'">Crear cuenta</button></div>';
 if(tab=='in')return tabs+'<p class="srh" style="'+HINT+'">¿Ya creaste tu cuenta en otro aparato (celular o computadora)? Escribe aquí <b>el mismo usuario y la misma contraseña</b>: entras con tu mismo personaje y sigues donde lo dejaste.</p>'+U('Usuario',LS.get('sr_lu')||'')+PW('Contraseña','current-password')+'<button id="sgo" style="'+BTN+'">Entrar</button><div><button data-t="rq" style="'+LNK+'">Olvidé mi contraseña</button></div>';
 if(tab=='up')return tabs+'<p class="srh" style="'+HINT+'">Crea tu cuenta <b>una sola vez</b>. Para jugar en otro aparato no la crees de nuevo: toca «Entrar» y usa el mismo usuario y contraseña.</p>'+U('Usuario (3 a 16 letras o números)')+EM('Correo (para recuperar tu contraseña)')+PW('Contraseña (mínimo 8)','new-password')+f('sr','Código de influencer (opcional)','text','off',16,NA+' value="'+REFC()+'"')+'<button id="sgo" style="'+BTN+'">Crear cuenta y entrar</button>';
 if(tab=='rq')return '<p style="color:#d8c9a0;font-size:14px;margin:8px 0 4px">Te enviamos un código al correo con el que te registraste.</p>'+U('Usuario')+EM('Correo de tu cuenta')+'<button id="sgo" style="'+BTN+'">Enviar código</button><div><button data-t="rs" style="'+LNK+'">Ya tengo el código</button><button data-t="in" style="'+LNK+'">Volver</button></div>';
 return '<div style="margin-top:8px"></div>'+U('Usuario')+EM('Correo de tu cuenta')+f('sc','Código de 8 dígitos','text','one-time-code',8,NA)+PW('Contraseña nueva (mínimo 8)','new-password')+'<button id="sgo" style="'+BTN+'">Cambiar contraseña</button><div><button data-t="in" style="'+LNK+'">Volver</button></div>'}
function loginMsg(t,good){const e=$$('srge');if(e){if(!good&&t&&/incorrectos/.test(t))t+=' (el usuario no distingue mayúsculas; la contraseña sí). ¿Aún no creaste tu cuenta? Toca «Crear cuenta».';e.textContent=t||'';e.style.color=good?'#9fe8a8':'#ff9a9a'}}
function loginRender(msg,good){if(!ov)return;ov.querySelector('#srb').innerHTML=loginBody()+(GID?'<div style="margin:12px 0 0;color:#b9a97f;font-size:13px">o</div><div id="srg" style="display:flex;justify-content:center;min-height:44px"></div>':'');
 const tt=$$('srt');if(tt)tt.textContent=tab=='in'?'Entra a tu cuenta':tab=='up'?'Crea tu cuenta':'Recupera tu contraseña';
 const ey=$$('seye');if(ey)ey.onclick=()=>{const i=$$('sp');if(i)i.type=i.type=='password'?'text':'password'};
 ov.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;loginRender()});
 ov.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')$$('sgo').click()}));
 $$('sgo').onclick=()=>{const v=id=>($$(id)||{}).value||'';loginMsg('');const go=m=>{if(!pre(m)){loginMsg('Conectando con el servidor… un momento.',1);return}loginMsg('Un momento…',1);stopWt();wt=setTimeout(()=>loginMsg('El servidor tardó en responder. Intenta de nuevo en unos segundos.'),8000)};
  if(tab=='in')go({t:'hi',lg:{n:v('su'),p:v('sp')}});else if(tab=='up')go({t:'hi',reg:{n:v('su'),e:v('se'),p:v('sp'),rc:v('sr')}});
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
 const nc=me&&Array.isArray(me.chars)?me.chars.filter(x=>!x.blank).length:0,h='<span>👤 <b>'+esc(u)+'</b>'+(me&&Array.isArray(me.chars)&&me.chars.length?' · 👥 '+nc+' de '+(me.max||3)+' personajes':'')+'</span><span>'+cl+'</span>',l=c.querySelector('#sracl');if(l&&l.innerHTML!==h)l.innerHTML=h}
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
 try{sessionStorage.removeItem('sr_rl');sessionStorage.removeItem('sr_skip');sessionStorage.removeItem('sr_auto')}catch(e){}
 location.reload()}
/* ===== v381: VARIOS PERSONAJES POR CUENTA · pantalla «Elige tu personaje» =====
   Cada personaje tiene su propia partida en el servidor. Gemas, VIP, apariencias y boletos son de la cuenta y los comparten todos.
   Cambiar de personaje = subir el actual, pedirle al servidor el elegido, poner su partida en este aparato y recargar entrando directo. */
let chBusy=0;
const CHEMO=['💰','🛡️','🔮','🏹','✨','🥋','🌿','⚒️'];
const CHCSS='#srch{position:fixed;inset:0;z-index:99990;display:flex;padding:12px;background:rgba(4,7,18,.88);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font-family:Georgia,serif;color:#f5e6c4;overflow:auto;-webkit-overflow-scrolling:touch}'+
 '#srch .p{margin:auto;width:100%;max-width:800px;box-sizing:border-box;background:linear-gradient(#22345f,#121c35);border:3px solid #6b4a17;border-radius:16px;padding:18px 16px 16px;box-shadow:0 12px 40px #000c;text-align:center}'+
 '#srch h2{margin:0 0 3px;color:#ffd66b;font:900 25px Georgia,serif;letter-spacing:.05em;text-shadow:0 2px 0 #7a5410}'+
 '#srch .s{color:#b9a97f;font-size:12.5px;line-height:1.35;margin:0 0 12px}#srch .s b{color:#ffd66b}'+
 '#srch .g{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}'+
 '#srch .c{position:relative;width:160px;min-height:178px;box-sizing:border-box;padding:12px 8px 10px;border:2px solid #6b4a17;border-radius:12px;background:linear-gradient(#18274a,#0b1224);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;font:inherit;color:inherit;text-align:center;-webkit-tap-highlight-color:transparent}'+
 '#srch .c.dq{border-color:#e0434a;box-shadow:0 0 0 2px rgba(224,67,74,.35)}#srch .c.on{border-color:#ffd66b;box-shadow:0 0 0 2px rgba(255,214,102,.35),0 0 20px rgba(255,178,58,.4);background:linear-gradient(#26396a,#101a36)}'+
 '#srch .c img{width:64px;height:64px;image-rendering:pixelated}#srch .c .e{font-size:44px;line-height:64px;height:64px}'+
 '#srch .c b{color:#ffd66b;font-size:16.5px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
 '#srch .c small{color:#d8c9a0;font-size:12.5px}#srch .c .t{margin-top:auto;font-size:11px;color:#9fe8a8;letter-spacing:.03em}'+
 '#srch .c .x{position:absolute;top:4px;right:4px;width:30px;height:30px;border-radius:8px;border:1px solid #6b4a17;background:#0b1224cc;color:#ff9a9a;font-size:14px;cursor:pointer;padding:0;line-height:1}'+
 '#srch .c.n{border-style:dashed;background:rgba(11,18,36,.55);justify-content:center}#srch .c.n b{white-space:normal;line-height:1.2}#srch .c.n .e{color:#ffd66b;font-size:40px}#srch .c.n.off{opacity:.5;cursor:default}'+
 '#srch .b{display:flex;gap:10px;justify-content:center;margin-top:14px}#srch .b button{min-width:130px;padding:12px 16px;border-radius:10px;border:0;font:700 16px Georgia,serif;cursor:pointer}'+
 '#srch .go{background:linear-gradient(#e0434a,#b3262e);color:#fff;box-shadow:0 3px 0 #6f1319}#srch .go:disabled{opacity:.45;box-shadow:none;cursor:default}#srch .no{background:#3a4a7a;color:#f5e6c4}#srch .dl{background:linear-gradient(#a33,#722);color:#fff}'+
 '#srch .m{min-height:18px;font-size:14px;margin:10px 0 0;line-height:1.35}#srch .q{margin:12px auto 0;max-width:520px;padding:12px;border:2px solid #a33;border-radius:12px;background:#2a0f14;font-size:14px;line-height:1.4}'+
 '@media (max-height:470px){#srch{padding:6px}#srch .p{padding:9px 10px 10px}#srch h2{font-size:19px}#srch .s{margin-bottom:7px;font-size:11.5px}#srch .g{gap:7px}#srch .c{width:132px;min-height:132px;padding:7px 5px 6px}#srch .c img{width:44px;height:44px}#srch .c .e{font-size:32px;line-height:44px;height:44px}#srch .c b{font-size:14.5px}#srch .c small{font-size:11.5px}#srch .b{margin-top:8px}#srch .b button{padding:8px 12px;font-size:14px;min-width:110px}#srch .m{margin-top:5px;font-size:12.5px}}';
function chIcon(c){let u='';try{if(c.cl>=0&&window.SR_CIC)u=window.SR_CIC(c.cl)||''}catch(e){}return u?'<img alt="" src="'+u+'">':'<div class="e">'+(CHEMO[c.cl]||'🧙')+'</div>'}
const CHCSS2='#srch .b{flex-wrap:wrap}#srch .mk{background:linear-gradient(#2f8a5a,#1d5a3a);color:#eaffe9;box-shadow:0 3px 0 #123a26}'+
 '#srch .c .v{position:absolute;top:4px;left:4px;width:30px;height:30px;border-radius:8px;border:1px solid #6b4a17;background:#0b1224cc;font-size:15px;cursor:pointer;padding:0;line-height:1}#srch .c .v.on{border-color:#ffd66b;background:#4a3510cc}'+
 '#srch .c.sl{border-color:#a98d45}#srch .c .t.sv{color:#ffd66b}'+
 '#srch .q.sp{border-color:#2f8a5a;background:#0f2419}#srch .q.sp label{display:block;text-align:left;font-size:13px;color:#cfe8d4}#srch .q.sp input{display:block;width:100%;box-sizing:border-box;margin-top:3px;padding:9px 10px;border-radius:8px;border:1px solid #3d6b50;background:#0a140f;color:#f5e6c4;font:16px Georgia,serif}'+
 '#srch .pg{display:flex;gap:8px;margin:8px 0}#srch .pg label{flex:1;min-width:0}#srch .sr{margin:6px 0 0;color:#9fe8a8;font-size:13px}'+
 '@media (max-height:470px){#srch .q.sp{margin-top:6px;padding:8px}#srch .q.sp input{padding:6px 8px;font-size:14px}#srch .pg{margin:5px 0}}';
function chOpen(o){
 if(!GATED||!me||!Array.isArray(me.chars)||!me.chars.length||document.getElementById('srch'))return false;
 if(!document.getElementById('srchCss')){const st=document.createElement('style');st.id='srchCss';st.textContent=CHCSS+CHCSS2;document.head.appendChild(st)}
 const live=me.uid,S={list:me.chars.slice(),max:me.max||3,sel:me.sel||live,del:null,busy:0,sell:null,fee:5,gu:1,gem:null,refund:1};
 if(!S.list.some(c=>c.u===S.sel))S.sel=live;
 const root=document.createElement('div');root.id='srch';document.body.appendChild(root);
 const msg=(t,good)=>{const e=root.querySelector('.m');if(e){e.textContent=t||'';e.style.color=good?'#9fe8a8':'#ff9a9a'}};
 const close=()=>{try{root.remove()}catch(e){}removeEventListener('keydown',key,true)};
 const key=e=>{if(e.key==='Escape'&&!S.busy&&!document.getElementById('srcm')){e.stopPropagation();close();o.onCancel&&o.onCancel()}};addEventListener('keydown',key,true);
 const canNew=()=>S.list.some(c=>c.blank)||S.list.length<S.max;
 const canSell=c=>!me.master&&!c.blank&&!c.sale;   /* v383: cualquier personaje (también el 1.º); la cuenta tiene que conservar otro (lo valida el servidor y se avisa aquí) */
 const others=u=>S.list.filter(c=>c.u!==u&&!c.blank&&!c.sale).length;
 const f=n=>Number(n).toLocaleString('es');
 const money=p=>[p.m?'💎 '+f(p.m):'',p.u?'💵 '+Number(p.u).toFixed(2):''].filter(Boolean).join(' · ');
 const rd=s=>{const e=root.querySelector(s);return e?String(e.value||'').trim():''};
 if(o.intent==='new'&&canNew()&&!S.list.some(c=>c.blank))S.sel='+';   /* «Nuevo personaje»: ya viene elegido «Crear nuevo» */
 function draw(){
  const used=S.list.filter(c=>!c.blank).length;
  const cards=S.list.map(c=>'<div class="c'+(S.sel===c.u?' on':'')+(S.del===c.u?' dq':'')+(c.sale?' sl':'')+'" data-u="'+esc(c.u)+'" role="button" tabindex="0">'+
   (c.blank||c.sale?'':'<button class="x" data-d="'+esc(c.u)+'" title="Borrar este personaje" aria-label="Borrar este personaje">🗑</button>')+
   (c.sale?'<button class="v on" data-cs="'+esc(c.sale.id)+'" title="Cancelar la venta" aria-label="Cancelar la venta">🏷️</button>':canSell(c)?'<button class="v" data-s="'+esc(c.u)+'" title="Vender este personaje" aria-label="Vender este personaje">💰</button>':'')+chIcon(c)+
   '<b>'+esc(c.nm||'Personaje nuevo')+'</b><small>'+(c.blank?'Aún sin clase ni nombre':esc(CLN[c.cl]||'Héroe')+' · Nv '+(c.lv|0))+'</small>'+
   (c.sale?'<div class="t sv">🏷️ En venta · '+money(c.sale.pr||{})+'</div>':c.u===live?'<div class="t">'+(o.ingame?'● Jugando ahora':'★ Último que usaste')+'</div>':'')+'</div>').join('');
  const nw=S.list.some(c=>c.blank)?'':'<div class="c n'+(canNew()?'':' off')+(S.sel==='+'?' on':'')+'" data-n="1" role="button" tabindex="0"><div class="e">＋</div><b>Crear nuevo personaje</b><small>'+(canNew()?used+' de '+S.max+' personajes':'Máximo '+S.max+'. Borra uno para crear otro')+'</small></div>';
  const q=S.del?(()=>{const c=S.list.find(x=>x.u===S.del)||{};return '<div class="q">¿Borrar a <b style="color:#ffd66b">'+esc(c.nm||'este personaje')+'</b> (Nv '+(c.lv|0)+')? Se pierden su nivel, oro, objetos y mascotas. <b>Tus gemas, VIP y apariencias NO se pierden</b> (son de la cuenta). No se puede deshacer.<div class="b"><button class="no" data-k="dn">No, conservar</button><button class="dl" data-k="dy">Sí, borrar</button></div></div>'})():'';
  const sp=S.sell?(()=>{const c=S.list.find(x=>x.u===S.sell)||{};return '<div class="q sp"><b style="color:#ffd66b">💰 Vender a «'+esc(c.nm||'este personaje')+'»</b> <small>('+esc(CLN[c.cl]||'Héroe')+' · Nv '+(c.lv|0)+')</small><br><span style="font-size:13px">Pon el precio en <b>💎 gemas</b> y/o <b>💵 USDT</b> (el oro no se acepta): quien compre elige cómo pagar. Recibes el precio <b>completo</b>; la <b>comisión se paga en 💎</b> y se retiene al publicar. El personaje queda <b>en garantía</b> (nadie lo juega) hasta que se venda o cancelas. Se traspasa completo; tus gemas, VIP y apariencias <b>NO</b> se van con él.</span>'+
   (S.can===0?'<p class="sr" style="color:#ffb86b">⚠️ Para publicar necesitas el servicio 🎯 Combo Cazador (o VIP). Comprar sí es libre.</p>':'')+
   '<div class="pg"><label>💎 Gemas<input id="spm" inputmode="numeric" autocomplete="off" placeholder="0"></label><label>💵 USDT<input id="spu" inputmode="decimal" autocomplete="off" placeholder="0.00"></label></div>'+
   '<label id="spp" style="display:none">Tu ID de Binance Pay (o correo/cartera) para que te paguemos los USDT<input id="spy" autocomplete="off" maxlength="64" placeholder="Ej. 748095851"></label>'+
   '<p class="sr" id="spr">Pon al menos un precio.</p><div class="b"><button class="no" data-k="sn">Cancelar</button><button class="go" data-k="sy">Publicar</button></div></div>'})():'';
  const cur=S.sel==='+'?{}:(S.list.find(c=>c.u===S.sel)||{});
  const lbl=S.sel==='+'?'Crear y entrar':(cur.blank?'Empezar':'Entrar');
  root.innerHTML='<div class="p"><h2>ELIGE TU PERSONAJE</h2><p class="s">👤 <b>'+esc(me.uname||me.name||'tu cuenta')+'</b> · tus 💎 gemas, VIP, apariencias y boletos son de la cuenta: <b>los usan todos tus personajes</b>.</p><div class="g">'+cards+nw+'</div>'+q+sp+
   (S.del||S.sell?'':'<div class="b"><button class="no" data-k="cn">Cancelar</button><button class="go" data-k="go"'+(S.busy||(S.sel==='+'&&!canNew())?' disabled':'')+'>'+lbl+'</button><button class="mk" data-k="mk">🛒 Mercado de personajes</button></div>')+'<p class="m"></p></div>'}
 /* comisión en 💎 (igual que el servidor: % del precio más alto expresado en 💎, mínimo 1), lo que recibirá y si le alcanzan las gemas; el campo del ID de Binance Pay solo si pone precio en USDT */
 const feeOf=(m,u)=>{const k=S.fee||0;if(!(k>0))return 0;const base=Math.max(m,u>0?Math.ceil(u/100/(S.gu||1)-1e-9):0);return base>0?Math.max(1,Math.ceil(base*k/100-1e-9)):0};
 function spUpd(){const m=Math.floor(+rd('#spm'))||0,u=Math.round((parseFloat(rd('#spu').replace(',','.'))||0)*100),out=[];
  if(m>0)out.push('💎 '+f(m));if(u>0)out.push('💵 '+(u/100).toFixed(2)+' USDT');
  const fee=feeOf(m,u),have=S.gem,r=root.querySelector('#spr'),p=root.querySelector('#spp'),b=root.querySelector('[data-k=sy]');
  const short=out.length&&have!=null&&fee>have;
  if(r){r.style.color=short?'#ff9a9a':'';
   r.textContent=!out.length?'Pon al menos un precio.':
    'Recibirás completo: '+out.join(' · ')+'. Comisión: '+f(fee)+' 💎 ('+(S.fee||0)+'%), se retiene al publicar, solo se cobra si se vende'+(S.refund===0?'':' y se te devuelve si cancelas')+'.'+(have!=null?' Tienes '+f(have)+' 💎'+(short?': te faltan '+f(fee-have)+' 💎 para publicar.':'.'):'')}
  if(b)b.disabled=!!short;
  if(p)p.style.display=u>0?'block':'none'}
 async function go(){
  if(S.busy)return;const sel=S.sel;
  if(sel!=='+'&&sel===live){close();o.onEnter&&o.onEnter();return}
  S.busy=1;draw();msg('Guardando tu personaje actual…',1);
  try{await charGo(sel==='+'?'new':'sel',sel==='+'?'':sel,t=>msg(t,1))}
  catch(e){S.busy=0;draw();msg(String(e&&e.message||e||'No se pudo cambiar de personaje'))}}
 async function del(u){
  const wasLive=u===live;S.busy=1;S.del=null;draw();msg('Borrando…',1);if(wasLive)window.SR_WIPING=1;
  try{const r=await rpc({t:'x',op:'char.del',u});
   if(wasLive){if(r.next){swapTo(r.next);return}
    halt();dropQB();LS.del(SKEY);LS.del('sr_bts');sessionStorage.removeItem('sr_rl');try{sessionStorage.setItem('sr_skip','1')}catch(e){}location.reload();return}
   S.list=r.chars||S.list;S.max=r.max||S.max;me.chars=S.list;if(S.sel===u)S.sel=live;S.busy=0;draw();msg('Personaje borrado.',1)}
  catch(e){if(wasLive)window.SR_WIPING=0;S.busy=0;draw();msg(String(e&&e.message||e||'No se pudo borrar'))}}
 async function sellGo(){
  if(S.busy||!S.sell)return;const m=rd('#spm'),u=rd('#spu'),y=rd('#spy'),b=root.querySelector('[data-k=sy]');
  S.busy=1;if(b)b.disabled=true;msg('Publicando…',1);
  try{const r=await rpc({t:'x',op:'chm.sell',u:S.sell,pm:m,pu:u,pay:y});S.list=r.chars||S.list;me.chars=S.list;if(r.gem!=null)S.gem=r.gem;S.sell=null;S.busy=0;draw();msg('✅ Publicado en el Mercado de personajes. Se retuvo la comisión: '+f(r.fee|0)+' 💎'+(S.refund===0?'.':' (se te devuelve si cancelas).')+' Mientras esté en venta no se puede jugar; puedes cancelar la venta con 🏷️.',1)}
  catch(e){S.busy=0;if(b)b.disabled=false;msg(String(e&&e.message||e||'No se pudo publicar'))}}
 async function cancelSale(id){
  S.busy=1;msg('Cancelando la venta…',1);
  try{const r=await rpc({t:'x',op:'chm.cancel',id});S.list=r.chars||S.list;me.chars=S.list;if(r.gem!=null)S.gem=r.gem;S.busy=0;draw();msg('Venta cancelada: ya puedes jugar con ese personaje.'+(r.back>0?' Te devolvimos '+f(r.back)+' 💎 de comisión.':''),1)}
  catch(e){S.busy=0;msg(String(e&&e.message||e||'No se pudo cancelar la venta'))}}
 const refresh=()=>rpc({t:'x',op:'char.list'}).then(r=>{if(!r||!r.chars||S.busy||S.del||!document.getElementById('srch'))return;S.list=r.chars;S.max=r.max||S.max;me.chars=r.chars;if(S.sell)return;   /* con el panel de precios abierto solo se actualizan los datos (no se redibuja para no borrar lo escrito) */if(S.sel!=='+'&&!S.list.some(c=>c.u===S.sel))S.sel=live;draw()}).catch(()=>{});
 root.addEventListener('click',e=>{
  if(S.busy)return;const t=e.target;
  const sv=t.closest('[data-s]');if(sv){e.stopPropagation();
   if(!others(sv.dataset.s)){msg('Es tu único personaje: crea otro primero (con su clase y nombre). Tu cuenta tiene que conservar al menos un personaje para poder vender este.');return}
   if(sv.dataset.s===live){msg('Estás jugando con este personaje: entra con otro de tus personajes y vuelve a «Elige tu personaje» para venderlo.');return}S.sell=sv.dataset.s;S.del=null;draw();spUpd();return}
  const cs=t.closest('[data-cs]');if(cs){e.stopPropagation();cancelSale(cs.dataset.cs);return}
  const d=t.closest('[data-d]');if(d){e.stopPropagation();S.del=d.dataset.d;draw();return}
  const k=t.closest('[data-k]');if(k){const a=k.dataset.k;if(a==='cn'){close();o.onCancel&&o.onCancel()}else if(a==='go')go();else if(a==='dn'){S.del=null;draw()}else if(a==='dy')del(S.del);else if(a==='sn'){S.sell=null;draw()}else if(a==='sy')sellGo();else if(a==='mk')cmOpen({onClose:refresh,onChange:refresh});return}
  const n=t.closest('[data-n]');if(n){if(canNew()){S.sel='+';draw()}else msg('Ya tienes '+S.max+' personajes: borra uno para poder crear otro.');return}
  const c=t.closest('[data-u]');if(c&&!S.del&&!S.sell){const cc=S.list.find(x=>x.u===c.dataset.u);if(cc&&cc.sale){msg('Está en venta: cancela la venta (🏷️) para volver a jugarlo.');return}S.sel=c.dataset.u;draw()}});
 root.addEventListener('input',e=>{if(e.target&&e.target.closest&&e.target.closest('.sp')){if(!S.busy)msg('');spUpd()}});   /* al corregir un campo se quita el aviso rojo anterior */
 root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.c')){e.preventDefault();e.target.click()}});
 draw();
 /* lista fresca del servidor (por si cambió desde otro aparato) y la comisión vigente */
 refresh();
 rpc({t:'x',op:'chm.list'}).then(r=>{if(r){if(r.fee!=null)S.fee=r.fee;if(r.gu>0)S.gu=r.gu;if(r.gem!=null)S.gem=r.gem;if(r.refund!=null)S.refund=r.refund;S.can=r.can;if(S.sell)spUpd()}}).catch(()=>{});
 return true}
/* ===== v383: MERCADO DE PERSONAJES · gemas 💎 y USDT 💵 =====
   Se publica CUALQUIER personaje (el 1.º también) con precio en gemas y/o USDT; queda en garantía y la comisión (en 💎) se retiene al publicar. Gemas: compra instantánea.
   USDT: el personaje se reserva, el comprador paga por Binance Pay al master, envía su número de orden y el master aprueba (y luego le paga al vendedor el precio completo). */
const CMCSS='#srcm{position:fixed;inset:0;z-index:99995;display:flex;padding:12px;background:rgba(4,7,18,.92);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font-family:Georgia,serif;color:#f5e6c4;overflow:auto;-webkit-overflow-scrolling:touch}'+
 '#srcm .p{position:relative;margin:auto;width:100%;max-width:880px;box-sizing:border-box;background:linear-gradient(#1c3a36,#0f1c22);border:3px solid #7a5a1c;border-radius:16px;padding:16px 14px 14px;box-shadow:0 12px 40px #000c}'+
 '#srcm h2{margin:0;color:#ffd66b;font:900 23px Georgia,serif;letter-spacing:.04em;text-shadow:0 2px 0 #7a5410;text-align:center;padding:0 34px}'+
 '#srcm .s{color:#b9c7a8;font-size:12.5px;line-height:1.35;margin:4px 0 10px;text-align:center;padding:0 34px}#srcm .s b{color:#ffd66b}'+
 '#srcm .xc{position:absolute;top:8px;right:8px;width:34px;height:34px;border-radius:9px;border:1px solid #6b4a17;background:#0b1224cc;color:#f5e6c4;font-size:16px;cursor:pointer;padding:0}'+
 '#srcm .tb{display:flex;gap:6px;justify-content:center;margin:0 0 10px;flex-wrap:wrap}#srcm .tb button{padding:8px 13px;border-radius:9px;border:1px solid #6b4a17;background:#18274a;color:#f5e6c4;font:700 14px Georgia,serif;cursor:pointer}#srcm .tb button.on{background:#e0a93a;color:#2a1a00;border-color:#ffd66b}'+
 '#srcm .g{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}'+
 '#srcm .c{position:relative;width:184px;box-sizing:border-box;padding:10px 8px;border:2px solid #6b4a17;border-radius:12px;background:linear-gradient(#18274a,#0b1224);display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent}#srcm .c.rs{opacity:.7}'+
 '#srcm .c img{width:56px;height:56px;image-rendering:pixelated}#srcm .c .e{font-size:40px;line-height:56px;height:56px}'+
 '#srcm .c b{color:#ffd66b;font-size:16px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#srcm .c small{color:#d8c9a0;font-size:12px}#srcm .c .d{color:#a9b894}#srcm .c .t{font-size:11.5px;color:#ffd66b}'+
 '#srcm .pc{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin:3px 0}#srcm .k{padding:3px 7px;border-radius:999px;font:700 12px Georgia,serif;background:#2a2f4a}#srcm .kg{background:#4a3a10;color:#ffd66b}#srcm .km{background:#1d3a5a;color:#9fd2ff}#srcm .ku{background:#17462f;color:#9fe8a8}'+
 '#srcm button{font-family:Georgia,serif}#srcm .go,#srcm .no,#srcm .dl,#srcm .by{padding:10px 14px;border-radius:10px;border:0;font:700 15px Georgia,serif;cursor:pointer}#srcm .go{background:linear-gradient(#e0434a,#b3262e);color:#fff;box-shadow:0 3px 0 #6f1319}#srcm .no{background:#3a4a7a;color:#f5e6c4}#srcm .dl{background:linear-gradient(#a33,#722);color:#fff}#srcm .sm{padding:6px 10px;font-size:13px}'+
 '#srcm .by{color:#fff}#srcm .by.bg{background:linear-gradient(#b9871f,#7e5a10)}#srcm .by.bm{background:linear-gradient(#2f6fb0,#1c4a7a)}#srcm .by.bu{background:linear-gradient(#2f8a5a,#1d5a3a)}'+
 '#srcm .m{min-height:18px;font-size:14px;margin:10px 0 0;text-align:center;line-height:1.35}#srcm .em{color:#b9a97f;text-align:center;font-size:14px;margin:14px 8px}'+
 '#srcm .q{margin:12px auto 0;max-width:560px;padding:12px;border:2px solid #a98d45;border-radius:12px;background:#201a0c;font-size:14px;line-height:1.4;text-align:center}'+
 '#srcm .b,#srcm .row{display:flex;gap:10px;justify-content:center;margin-top:10px;flex-wrap:wrap}#srcm .row input{flex:1;min-width:140px;max-width:340px;padding:10px;border-radius:8px;border:1px solid #3d6b50;background:#0a140f;color:#f5e6c4;font:16px Georgia,serif}'+
 '#srcm .pp{margin:0 auto 12px;max-width:640px;padding:12px;border:2px solid #2f8a5a;border-radius:12px;background:#0f2419;font-size:14px;line-height:1.45}#srcm .pp ol{margin:6px 0 8px;padding-left:20px}#srcm code{background:#0a140f;padding:2px 6px;border-radius:6px;color:#9fe8a8;user-select:all}'+
 '#srcm .hs{margin:14px auto 0;max-width:640px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;font-size:12.5px;color:#b9c7a8}#srcm .hs span{padding:3px 8px;border-radius:999px;background:#18274a}'+
 '#srcm .fi{max-width:640px;margin:0 auto;text-align:left}#srcm .hd{display:flex;gap:12px;align-items:center;margin:10px 0}#srcm .hd img{width:72px;height:72px;image-rendering:pixelated}#srcm .hd .e{font-size:52px}#srcm .hd b{font-size:22px;color:#ffd66b}#srcm .fi h4{margin:10px 0 4px;color:#ffd66b;text-align:left}#srcm .fi ul{margin:0;padding-left:18px;columns:2;font-size:14px}'+
 '#srcm .ar{margin:8px auto;max-width:700px;padding:10px 12px;border:1px solid #6b4a17;border-radius:10px;background:#12203a;font-size:14px;line-height:1.4}#srcm .ar.sm{font-size:12.5px;padding:5px 10px}#srcm h4{margin:12px 0 4px;color:#ffd66b;text-align:center}'+
 '@media (max-height:470px){#srcm{padding:6px}#srcm .p{padding:10px 10px 10px}#srcm h2{font-size:18px}#srcm .s{font-size:11.5px;margin-bottom:6px}#srcm .c{width:150px;padding:6px 5px}#srcm .c img{width:40px;height:40px}#srcm .c .e{font-size:30px;line-height:40px;height:40px}}'+
 '@media (max-width:420px){#srcm .c{width:46%}#srcm .fi ul{columns:1}}';
function cmOpen(o){
 o=o||{};if(!GATED||!me||document.getElementById('srcm'))return false;
 if(!document.getElementById('srcmCss')){const st=document.createElement('style');st.id='srcmCss';st.textContent=CMCSS;document.head.appendChild(st)}
 const S={tab:'b',d:null,adm:null,v:null,ask:null,busy:0,note:'',good:0};
 const root=document.createElement('div');root.id='srcm';document.body.appendChild(root);
 const key=e=>{if(e.key==='Escape'&&!S.busy){e.stopPropagation();close()}};addEventListener('keydown',key,true);
 const close=()=>{try{root.remove()}catch(e){}removeEventListener('keydown',key,true);o.onClose&&o.onClose()};
 const f=n=>Number(n).toLocaleString('es'),RC=['#d8d8d8','#6fb7ff','#c58bff','#ffb347'];
 const say=(t,good)=>{S.note=t||'';S.good=good?1:0;const e=root.querySelector('.m');if(e){e.textContent=S.note;e.style.color=S.good?'#9fe8a8':'#ff9a9a'}};
 const er=e=>String(e&&e.message||e||'Algo salió mal');
 const chips=p=>(p.m?'<span class="k km">💎 '+f(p.m)+'</span>':'')+(p.u?'<span class="k ku">💵 '+Number(p.u).toFixed(2)+' USDT</span>':'');
 const tm=ts=>{try{return new Date(ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}catch(e){return ''}};
 const val=s=>{const e=root.querySelector(s);return e?String(e.value||'').trim():''};
 const card=(x,extra)=>'<div class="c'+(x.st==='resv'||x.st==='paid'?' rs':'')+'" data-v="'+esc(x.id)+'" role="button" tabindex="0">'+chIcon({cl:x.cl})+'<b>'+esc(x.nm||'Personaje')+'</b><small>'+esc(CLN[x.cl]||'Héroe')+' · Nv '+(x.lv|0)+'</small><div class="pc">'+chips(x.pr)+'</div><small class="d">🪙 '+f(x.g)+' · ⚔️ '+(x.eq|0)+' · 🐾 '+(x.pt|0)+'</small>'+(extra||(x.st==='resv'||x.st==='paid'?'<div class="t">⏳ Reservado</div>':''))+'</div>';
 const payBox=b=>'<div class="pp"><b>💵 Tu compra de «'+esc(b.nm)+'» · '+Number(b.usdt).toFixed(2)+' USDT</b>'+
  (b.paid?'<p>✅ Comprobante enviado'+(b.ref?' (orden <code>'+esc(b.ref)+'</code>)':'')+'. El master está verificando tu pago; cuando lo confirme, el personaje aparece en «Elige tu personaje».</p><div class="row"><input id="rf" placeholder="Corregir número de orden" maxlength="60" value="'+esc(b.ref||'')+'"><button class="go sm" data-pd="'+esc(b.id)+'">Reenviar</button></div>':
   '<ol><li>Paga <b>'+Number(b.usdt).toFixed(2)+' USDT</b> por <b>Binance Pay</b> al ID <code>'+esc(b.pid)+'</code> <button class="no sm" data-cp="'+esc(b.pid)+'">Copiar ID</button></li><li>Pega el <b>número de orden</b> de Binance Pay y envíalo:</li></ol><div class="row"><input id="rf" placeholder="Número de orden de Binance Pay" maxlength="60" autocomplete="off"><button class="go sm" data-pd="'+esc(b.id)+'">Ya pagué</button></div><small>⏳ Reservado para ti hasta las '+tm(b.until)+'. Si no pagas, se libera solo.</small><div class="row"><button class="no sm" data-ab="'+esc(b.id)+'">Cancelar la compra</button></div>')+'</div>';
 const buyTab=()=>{const d=S.d||{l:[],buying:[],h:[]};
  return (d.room===0?'<p class="em">⚠️ Tu cuenta ya tiene '+(d.max||3)+' personajes: borra uno para poder comprar otro.</p>':'')+(d.buying||[]).map(payBox).join('')+
   (d.l.length?'<div class="g">'+d.l.map(x=>card(x)).join('')+'</div>':'<p class="em">Todavía no hay personajes a la venta. En «Elige tu personaje» toca 💰 en el personaje que quieras vender (tu cuenta tiene que conservar otro).</p>')+
   ((d.h||[]).length?'<div class="hs"><b>Últimas ventas:</b>'+d.h.map(h=>'<span>'+esc(h.nm)+' · Nv '+(h.lv|0)+' · '+(h.c==='g'?'🪙 '+f(h.v):h.c==='m'?'💎 '+f(h.v):'💵 '+Number(h.v).toFixed(2))+'</span>').join('')+'</div>':'')};
 const mineTab=()=>{const d=S.d||{mine:[],pay:[]};
  return (d.can?'':'<p class="em">Para publicar necesitas el servicio <b>🎯 Combo Cazador</b> (o VIP). Comprar es libre.</p>')+
   (d.mine.length?'<div class="g">'+d.mine.map(x=>card(x,(x.hold?'<small class="d">🔒 Comisión retenida: '+f(x.hold)+' 💎</small>':'')+(x.st==='open'?'<button class="no sm" data-cn="'+esc(x.id)+'">Cancelar venta</button>':'<div class="t">⏳ '+(x.st==='paid'?'Pago en revisión':'Comprador pagando')+'</div>'))).join('')+'</div>':'<p class="em">No tienes personajes en venta. En «Elige tu personaje» toca 💰 en el personaje que quieras vender (el que estás jugando ahora no se puede vender: entra con otro de tus personajes; y tu cuenta tiene que conservar al menos uno).</p>')+
   ((d.pay||[]).length?'<h4>Tus cobros en USDT</h4>'+d.pay.map(p=>'<div class="ar">'+(p.st==='paid'?'✅ Te pagaron ':'💵 Te pagaremos ')+'<b>'+Number(p.net).toFixed(2)+' USDT</b> por «'+esc(p.nm)+'»'+(p.fg>0?' (el precio completo: tu comisión de '+f(p.fg)+' 💎 ya estaba retenida)':'')+(p.st==='paid'?'':' · el master lo hace a mano; te avisamos')+'</div>').join(''):'')};
 const admTab=()=>{const a=S.adm||{o:[],pay:[],done:[]};
  const rows=a.o.map(x=>'<div class="ar"><b>'+esc(x.nm)+'</b> · Nv '+(x.lv|0)+' · <b>'+Number(x.usdt).toFixed(2)+' USDT</b><br><small>Comprador: '+esc(x.bn)+' ('+esc(x.be)+') · Vendedor: '+esc(x.sn)+' ('+esc(x.se)+')'+(x.fg>0?' · comisión ya retenida: '+f(x.fg)+' 💎 (al vendedor se le paga el precio completo)':'')+'<br>'+(x.st==='paid'?'Orden Binance Pay: <code>'+esc(x.ref)+'</code> · enviada a las '+tm(x.pts):'⏳ Reservado a las '+tm(x.rts)+': aún sin comprobante')+'</small><div class="row"><button class="go sm" data-ap="'+esc(x.id)+'">✅ Aprobar y entregar</button><button class="dl sm" data-rj="'+esc(x.id)+'">❌ Rechazar</button></div></div>').join('')||'<p class="em">No hay pagos por revisar.</p>';
  const pays=a.pay.map(p=>'<div class="ar">💵 Pagar <b>'+Number(p.net).toFixed(2)+' USDT</b> al ID <code>'+esc(p.pay)+'</code><br><small>Vendedor: '+esc(p.sn)+' ('+esc(p.se)+') · por «'+esc(p.nm)+'» · '+(p.fg>0?'precio completo; la comisión ya se cobró en gemas: '+f(p.fg)+' 💎':'('+Number(p.gross).toFixed(2)+' − '+Number(p.fee).toFixed(2)+' de comisión)')+'</small><div class="row"><button class="go sm" data-po="'+esc(p.id)+'">Marcar pagado</button></div></div>').join('');
  const dn=a.done.map(p=>'<div class="ar sm">✅ Pagado '+Number(p.net).toFixed(2)+' USDT a '+esc(p.sn)+' · «'+esc(p.nm)+'» · '+tm(p.pts)+'</div>').join('');
  return '<p class="s">Antes de aprobar, verifica en tu Binance que llegó el pago (monto y número de orden). Los compradores pagan a tu Pay ID.</p><h4>Pagos de compradores por revisar</h4>'+rows+'<div class="row"><input id="rjw" placeholder="Motivo si rechazas (opcional)" maxlength="120"></div><h4>Pagos pendientes a vendedores</h4>'+(pays||'<p class="em">No debes nada a ningún vendedor.</p>')+(dn?'<h4>Últimos pagos hechos</h4>'+dn:'')};
 const detail=()=>{const v=S.v.v,s=v.s||{},pr=v.pr||{};
  const eqs=(s.eq||[]).map(i=>'<li style="color:'+(RC[i.r]||RC[0])+'">'+esc(i.n)+(i.up?' +'+i.up:'')+(i.en?' ✨':'')+'</li>').join('');
  const pts=(s.pets||[]).map(p=>'<li>'+esc(p.n)+' · Nv '+(p.lv|0)+'</li>').join('');
  const none=t=>'<p class="em" style="text-align:left;margin:2px 0">'+t+'</p>';
  const ask=S.ask;
  const btn=(c,t)=>pr[c]?'<button class="by b'+c+'" data-by="'+c+'">'+t+'</button>':'';
  const what=ask==='m'?'💎 '+f(pr.m):'💵 '+Number(pr.u).toFixed(2)+' USDT';
  const q=ask?'<div class="q">¿Comprar a <b style="color:#ffd66b">'+esc(s.nm||v.nm)+'</b> por <b>'+what+'</b>?<br>'+(ask==='u'?'Lo reservamos para ti 45 minutos: pagas por Binance Pay y el master confirma tu pago.':'Se cobra y el personaje pasa a tu cuenta al instante.')+' Recibes el personaje completo (nivel, oro, objetos, mascotas); las gemas, VIP y apariencias del vendedor <b>no</b> se traspasan. No hay devolución.<div class="b"><button class="no" data-k="no">No</button><button class="go" data-k="yes">Sí, comprar</button></div></div>':'';
  /* lo de comprar va ARRIBA (en celular horizontal no hace falta bajar); el detalle va debajo */
  const act=v.mine?'<p class="em">Es tu personaje en venta.</p>':v.st!=='open'?'<p class="em">⏳ Alguien lo está pagando. Vuelve en unos minutos.</p>':ask?q:'<div class="b" style="margin:4px 0 0">'+btn('m','Comprar con 💎 '+f(pr.m||0))+btn('u','Pagar 💵 '+Number(pr.u||0).toFixed(2)+' USDT')+'</div>';
  return '<div class="fi"><button class="no sm" data-k="bk">← Volver</button><div class="hd">'+chIcon({cl:s.cl})+'<div><b>'+esc(s.nm||v.nm)+'</b><br><small>'+esc(CLN[s.cl]||'Héroe')+' · Nv '+(s.lv|0)+' · Vendedor: '+esc(v.sn)+'</small><div class="pc" style="justify-content:flex-start">'+chips(pr)+'</div></div></div>'+act+
   '<p style="margin:10px 0 4px">🪙 Oro: <b>'+f((s.g|0)+(s.bk|0))+'</b> · 🎒 Bolsa: <b>'+(s.bag|0)+'</b> objetos · ⚔️ Habilidades: <b>'+(s.sx||[]).join(' / ')+'</b></p>'+
   '<h4>Equipo puesto</h4>'+(eqs?'<ul>'+eqs+'</ul>':none('Sin equipo'))+'<h4>Mascotas</h4>'+(pts?'<ul>'+pts+'</ul>':none('Sin mascotas'))+'</div>'};
 function draw(){
  const d=S.d,tabs='<div class="tb"><button data-t="b" class="'+(S.tab==='b'?'on':'')+'">🛒 Comprar</button><button data-t="m" class="'+(S.tab==='m'?'on':'')+'">🏷️ Mis ventas'+(d&&d.mine&&d.mine.length?' ('+d.mine.length+')':'')+'</button>'+(me.master?'<button data-t="a" class="'+(S.tab==='a'?'on':'')+'">🛡️ Master'+(d&&d.adm?' ('+d.adm+')':'')+'</button>':'')+'<button data-k="rf" aria-label="Actualizar">↻</button></div>';
  const body=S.v?detail():S.tab==='b'?buyTab():S.tab==='m'?mineTab():admTab();
  root.innerHTML='<div class="p"><button class="xc" data-k="x" aria-label="Cerrar">✕</button><h2>MERCADO DE PERSONAJES</h2>'+(S.v?'':'<p class="s">Compra y vende personajes con 💎 gemas o 💵 USDT. Se traspasa el personaje completo; las gemas, el VIP y las apariencias son de cada cuenta y <b>no</b> se venden. Para publicar se retiene una comisión del <b>'+((d&&d.fee!=null)?d.fee:5)+'%</b> en 💎 (solo se cobra si se vende).</p>'+tabs)+body+'<p class="m"></p></div>';
  say(S.note,S.good)}
 async function load(){
  try{S.d=await rpc({t:'x',op:'chm.list'})}catch(e){S.d=S.d||{l:[],mine:[],buying:[],pay:[],h:[],fee:5};say(er(e))}
  if(S.tab==='a'&&me.master){try{S.adm=await rpc({t:'x',op:'chm.adm'})}catch(e){say(er(e))}}
  draw()}
 async function act(fn,okMsg){
  if(S.busy)return;S.busy=1;try{const r=await fn();if(okMsg)say(typeof okMsg==='function'?okMsg(r):okMsg,1)}catch(e){say(er(e))}S.busy=0;await load()}
 root.addEventListener('click',async e=>{
  if(S.busy)return;const t=e.target,at=n=>{const x=t.closest('['+n+']');return x?x.getAttribute(n):null};
  const k=at('data-k');
  if(k==='x'){close();return}
  if(k==='rf'){say('');await load();return}
  if(k==='bk'){S.v=null;S.ask=null;say('');draw();return}
  if(k==='no'){S.ask=null;draw();return}
  if(k==='yes'){const c=S.ask,id=S.v.v.id;S.busy=1;say('Procesando…',1);
   try{const r=await rpc({t:'x',op:'chm.buy',id,c});S.ask=null;S.v=null;S.tab='b';
    if(r.rsv)say('Reservado para ti. Sigue los pasos para pagar por Binance Pay.',1);
    else{if(r.chars)me.chars=r.chars;say('🎉 ¡Listo! «'+r.nm+'» ya está en tu cuenta. Búscalo en «Elige tu personaje».',1);o.onChange&&o.onChange()}}
   catch(e){S.ask=null;say(er(e))}
   S.busy=0;await load();return}
  const tb=at('data-t');if(tb){S.tab=tb;S.v=null;S.ask=null;say('');await load();return}
  const cn=at('data-cn');if(cn){await act(async()=>{const r=await rpc({t:'x',op:'chm.cancel',id:cn});if(r.chars)me.chars=r.chars;o.onChange&&o.onChange()},'Venta cancelada: ya puedes jugar con ese personaje.');return}
  const pd=at('data-pd');if(pd){const ref=val('#rf');await act(()=>rpc({t:'x',op:'chm.paid',id:pd,ref}),'✅ Comprobante enviado. El master verificará tu pago y te avisamos.');return}
  const ab=at('data-ab');if(ab){await act(()=>rpc({t:'x',op:'chm.abort',id:ab}),'Compra cancelada.');return}
  const cp=at('data-cp');if(cp){try{await navigator.clipboard.writeText(cp);say('ID copiado: '+cp,1)}catch(e){say('Copia el ID a mano: '+cp,1)}return}
  const ap=at('data-ap');if(ap){await act(()=>rpc({t:'x',op:'chm.approve',id:ap}),r=>'✅ Aprobado: el personaje ya está en la cuenta del comprador. Págale '+Number(r.pay.net).toFixed(2)+' USDT al vendedor (ID '+r.pay.pay+') y márcalo como pagado.');return}
  const rj=at('data-rj');if(rj){const why=val('#rjw');await act(()=>rpc({t:'x',op:'chm.reject',id:rj,why}),'Pago rechazado: el personaje vuelve a estar a la venta.');return}
  const po=at('data-po');if(po){await act(()=>rpc({t:'x',op:'chm.paidout',id:po}),'Pago al vendedor marcado como hecho.');return}
  const by=at('data-by');if(by){S.ask=by;draw();return}
  const vv=at('data-v');if(vv){S.busy=1;say('Cargando la ficha…',1);
   try{S.v=await rpc({t:'x',op:'chm.view',id:vv});S.ask=null;say('')}catch(e){say(er(e));S.v=null}
   S.busy=0;if(S.v)draw();else await load();return}});
 root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.c')){e.preventDefault();e.target.click()}});
 draw();say('Cargando…',1);load().then(()=>say(''));
 return true}
async function charGo(kind,target,say){
 if(!GATED||!ok)throw new Error('Sin conexión con el servidor. Inténtalo en unos segundos.');
 if(chBusy||stl||window.SR_WIPING)throw new Error('Un momento…');
 if(!synced)throw new Error('Tu cuenta aún se está sincronizando. Espera unos segundos y vuelve a intentarlo.');chBusy=1;
 try{
  /* 1) lo último del personaje actual sube al servidor; si no se puede subir, NO se cambia (así no se pierde nada) */
  {
   G(g=>g.save&&g.save());const t0=Date.now();while(inflight&&Date.now()-t0<3000)await sleep(100);
   const d=LS.get(SKEY);
   if(d&&!blank(d)){let up=0,last='';
    for(let n=0;n<3&&!up;n++){try{await Promise.race([rpc({t:'sv',d,bts:+LS.get('sr_bts')||0}),sleep(5000).then(()=>{throw new Error('timeout')})]);up=1}catch(e){last=String(e&&e.message||e);if(/rechazado|timeout/.test(last))await sleep(1700);else break}}
    if(!up)throw new Error('No se pudo guardar tu personaje actual ('+last+'). Revisa tu conexión e inténtalo otra vez.')}}
  if(say)say(kind==='new'?'Creando personaje nuevo…':'Cambiando de personaje…');
  /* 2) el servidor deja elegido al personaje y devuelve su partida guardada */
  const r=await rpc({t:'x',op:kind==='new'?'char.new':'char.sel',u:target});
  swapTo(r)}
 finally{chBusy=0}}
/* pone en este aparato la partida del personaje elegido (o la deja vacía si es nuevo) y recarga entrando directo, sin pasar por el título */
function swapTo(r){
 halt();dropQB();
 if(r.d&&!blank(r.d)){_si.call(localStorage,SKEY,r.d);LS.set('sr_bts',String(r.ts||0));sessionStorage.setItem('sr_rl','1')}
 else{LS.del(SKEY);LS.del('sr_bts');sessionStorage.removeItem('sr_rl')}
 LS.set('sr_own',r.u);LS.set('sr_acc',r.u);if(r.wp)LS.set('sr_wp',r.wp);
 try{sessionStorage.setItem('sr_skip','1');sessionStorage.setItem('sr_auto','1')}catch(e){}
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