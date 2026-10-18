/* Reemplaza claude.use('db'/'user') para que el juego funcione en Netlify, hablando con el servidor de Render. */
(function(){
const CFG=window.SR_CFG||{},SERVER=new URLSearchParams(location.search).get('server')||CFG.server||'wss://CAMBIA-ESTO.onrender.com',GID=CFG.googleClientId||'';
const LS={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};
let uid=null,tok=null,ses=LS.get('sr_ses'),idRes,idP=new Promise(r=>idRes=r),me={};
if(!GID){uid=LS.get('sr_uid');tok=LS.get('sr_tok');if(!uid){const r=()=>crypto.randomUUID().replace(/-/g,'');uid='p'+r().slice(0,20);tok=r();LS.set('sr_uid',uid);LS.set('sr_tok',tok)}idRes(uid)}
let ws,q=[],subs={},rq={},sid=0,rid=0,ok=0;
const raw=m=>{const s=JSON.stringify(m);if(ws&&ws.readyState==1&&ok)ws.send(s);else q.push(s)};
function conn(){ws=new WebSocket(SERVER);ok=0;
 ws.onopen=()=>{ws.send(JSON.stringify(GID?(ses?{t:'hi',ses}:{t:'hi',noauth:1}):{t:'hi',uid,tok}))};
 ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(x){return}
  if(m.t&&m.t[0]=='w'){SRNET.onmsg&&SRNET.onmsg(m)}
  else if(m.t=='ent'){G(g=>g.ent(m.ent))}
  else if(m.t=='dl'){G(g=>g.dl(m.list))}
  else if(m.t=='note'){G(g=>g.note(m.m))}
  else if(m.t=='gs'||m.t=='gc'||m.t=='ginv'){SRNET.ongd&&SRNET.ongd(m)}
  else if(m.t=='cg'||m.t=='dm'||m.t=='fq'||m.t=='fa'||m.t=='fr'||m.t=='fp'){SRNET.onsoc&&SRNET.onsoc(m)}
  else if(m.t=='kick'){ok=0;try{ws.onclose=null;ws.close()}catch(x){}document.body.innerHTML='<div style="padding:40px;color:#f5e6c4;font:20px Georgia;text-align:center;background:#0d1526;height:100vh">'+(m.e||'Sesión abierta en otro dispositivo')+'<br><br><button onclick="location.reload()" style="font-size:18px;padding:10px 20px">Volver a entrar</button></div>'}
  else if(m.t=='auth'){ses=null;LS.del('sr_ses');showLogin(m.e)}
  else if(m.t=='ok'){if(m.ent)G(g=>g.ent(m.ent));setTimeout(()=>G(g=>g.onok&&g.onok()),800);if(GID){uid=m.uid;me=m;if(m.ses){ses=m.ses;LS.set('sr_ses',ses)}hideLogin();idRes(uid);cloudSync()}ok=1;SRNET.onopen&&SRNET.onopen();for(const s in subs)ws.send(JSON.stringify({t:'sub',sid:+s,col:subs[s].c,w:subs[s].w}));q.splice(0).forEach(s=>ws.send(s))}
  else if(m.t=='snap'){const b=subs[m.sid];if(b){b.docs=m.docs||{};b.cb(snap(b.docs))}}
  else if(m.t=='ch'){const b=subs[m.sid];if(b){if(m.d)b.docs[m.id]=m.d;else delete b.docs[m.id];b.cb(snap(b.docs))}}
  else if(m.t=='r'){const p=rq[m.rid];if(p){delete rq[m.rid];m.ok?p.ok(m):p.no(new Error(m.e||'error'))}}};
 ws.onclose=()=>{ok=0;setTimeout(conn,2000)};ws.onerror=()=>{try{ws.close()}catch(e){}}}
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
const flushNow=async()=>{const d=LS.get(SKEY);if(!d||!ok)return;let ack=[];G(g=>ack=g.ack());const go=()=>rpc({t:'sv',d,ack}).then(r=>{pend=null;lastUp=Date.now();G(g=>{if(r.acked&&r.acked.length)g.acked(r.acked);if(r.fix)g.fix(r.fix);if(r.ent)g.ent(r.ent)})});
 try{await go()}catch(e){await new Promise(r=>setTimeout(r,1700));try{await go()}catch(x){}}};
window.SRNET={flush:flushNow,rpc,send:m=>{if(ws&&ws.readyState==1&&ok)ws.send(JSON.stringify(m))},up:()=>!!(ws&&ws.readyState==1&&ok),onmsg:null,onopen:null};
window.claude=window.claude||{use:async k=>k=='db'?db:k=='user'?{id:()=>idP}:null};
window.SRACC={get:()=>me,logout:()=>{LS.del('sr_ses');LS.del('sr_acc');location.reload()}};
/* ---- Inicio de sesión con Google ---- */
let ov=null;
function hideLogin(){if(ov){ov.remove();ov=null}}
function showLogin(err){if(!GID||ov)return;ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;z-index:99999;background:radial-gradient(900px 500px at 50% 0,#24396b,#0d1526);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Georgia,serif;color:#f5e6c4;text-align:center';
 ov.innerHTML='<div style="max-width:420px;width:100%;background:linear-gradient(#22345f,#121c35);border:3px solid #6b4a17;border-radius:16px;padding:24px;box-shadow:0 12px 40px #000c"><img src="logo.jpg" style="width:100%;border-radius:10px;border:2px solid #6b4a17"><h2 style="color:#ffd66b;margin:14px 0 6px">Inicia sesión</h2><p style="color:#d8c9a0;font-size:14px;margin:0 0 14px">Tu personaje, tus gemas y tu progreso quedan atados a tu cuenta de Google. Entra desde cualquier dispositivo.</p><div id="srg" style="display:flex;justify-content:center;min-height:44px"></div><p id="srge" style="color:#ff9a9a;font-size:13px;min-height:18px">'+(err||'')+'</p></div>';
 document.body.appendChild(ov);const go=()=>{google.accounts.id.initialize({client_id:GID,callback:r=>raw({t:'hi',g:r.credential}),ux_mode:'popup'});google.accounts.id.renderButton(document.getElementById('srg'),{theme:'filled_blue',size:'large',shape:'pill',text:'signin_with',locale:'es'})};
 if(window.google&&google.accounts)go();else{const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=1;s.onload=go;s.onerror=()=>{document.getElementById('srge').textContent='No se pudo cargar Google. Revisa tu conexión.'};document.head.appendChild(s)}}
if(GID)addEventListener('DOMContentLoaded',()=>{if(!ses)showLogin()});
/* ---- Guardado en la nube atado a la cuenta ---- */
const SKEY='silkroad_v1';let lastUp=0,pend=null,syncing=0;
const _si=Storage.prototype.setItem;
Storage.prototype.setItem=function(k,v){_si.call(this,k,v);if(k===SKEY&&ok){pend=v;if(!lastUp||Date.now()-lastUp>(window.SR_GAME&&SR_GAME.ack().length?2500:20000))flushSave()}};
function flushSave(){if(!pend||!ok)return;const d=pend;pend=null;lastUp=Date.now();let ack=[];G(g=>ack=g.ack());rpc({t:'sv',d,ack}).then(r=>{G(g=>{if(r.acked&&r.acked.length)g.acked(r.acked);if(r.fix)g.fix(r.fix);if(r.ent)g.ent(r.ent)})}).catch(()=>{pend=pend||d})}
setInterval(()=>{if(pend)flushSave()},8000);addEventListener('pagehide',()=>{try{if(pend&&ok)ws.send(JSON.stringify({t:'sv',d:pend}))}catch(e){}});
async function cloudSync(){if(syncing)return;syncing=1;try{
 const prev=LS.get('sr_acc');if(prev&&prev!==uid){LS.del(SKEY)}LS.set('sr_acc',uid);
 const r=await rpc({t:'ld'}),loc=LS.get(SKEY);
 if(r.d&&!loc&&!sessionStorage.getItem('sr_rl')){_si.call(localStorage,SKEY,r.d);sessionStorage.setItem('sr_rl','1');location.reload();return}
 if(r.d&&loc&&loc!==r.d&&!sessionStorage.getItem('sr_rl')){let a={},b={};try{a=JSON.parse(loc)}catch(e){}try{b=JSON.parse(r.d)}catch(e){}
  if((b.lv||0)>(a.lv||0)||((b.lv||0)==(a.lv||0)&&(b.xp||0)>(a.xp||0)+1)){_si.call(localStorage,SKEY,r.d);sessionStorage.setItem('sr_rl','1');location.reload();return}}
 sessionStorage.removeItem('sr_rl');if(loc)rpc({t:'sv',d:loc}).catch(()=>{})}catch(e){}syncing=0}
conn();
})();
