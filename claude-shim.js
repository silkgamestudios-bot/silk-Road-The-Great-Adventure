/* Reemplaza claude.use('db'/'user') para que el juego funcione en Netlify, hablando con el servidor de Render. */
(function(){
const SERVER=new URLSearchParams(location.search).get('server')||'wss://CAMBIA-ESTO.onrender.com';  // <- pon aquí la URL de Render (wss://...)
let uid=localStorage.getItem('sr_uid'),tok=localStorage.getItem('sr_tok');
if(!uid){const r=()=>crypto.randomUUID().replace(/-/g,'');uid='p'+r().slice(0,20);tok=r();localStorage.setItem('sr_uid',uid);localStorage.setItem('sr_tok',tok)}
let ws,q=[],subs={},rq={},sid=0,rid=0,ok=0;const LS={};const fire=(k,v)=>(LS[k]||[]).forEach(f=>{try{f(v)}catch(e){}});
const raw=m=>{const s=JSON.stringify(m);if(ws&&ws.readyState==1&&ok)ws.send(s);else q.push(s)};
function conn(){ws=new WebSocket(SERVER);ok=0;
 ws.onopen=()=>{ws.send(JSON.stringify({t:'hi',uid,tok}))};
 ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(x){return}
  if(m.t=='ok'){ok=1;fire('up');for(const s in subs)ws.send(JSON.stringify({t:'sub',sid:+s,col:subs[s].c,w:subs[s].w}));q.splice(0).forEach(s=>ws.send(s))}
  else if(m.t=='snap'){const b=subs[m.sid];if(b){b.docs=m.docs||{};b.cb(snap(b.docs))}}
  else if(m.t=='ch'){const b=subs[m.sid];if(b){if(m.d)b.docs[m.id]=m.d;else delete b.docs[m.id];b.cb(snap(b.docs))}}
  else if(m.t=='pc')fire('pc',m)
  else if(typeof m.t=='string'&&m.t.startsWith('w.'))fire(m.t,m)
  else if(m.t=='wal'){SRV.w=m.w;fire('wal',m.w)}else if(m.t=='note')fire('note',m)
  else if(m.t=='bad'){fire('bad',m);try{alert('Este navegador no coincide con la identidad guardada para ese jugador.')}catch(x){}}
  else if(m.t=='r'){const p=rq[m.rid];if(p){delete rq[m.rid];m.ok?p.ok(m):p.no(new Error(m.e||'error'))}}};
 ws.onclose=()=>{ok=0;fire('down');setTimeout(conn,2000)};ws.onerror=()=>{try{ws.close()}catch(e){}}}
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
const SRV={w:null,rpc:(t,d)=>rpc(Object.assign({},d||{},{t})),fire:(t,d)=>{if(ws&&ws.readyState==1&&ok)ws.send(JSON.stringify(Object.assign({},d||{},{t})))},on:(k,f)=>{(LS[k]=LS[k]||[]).push(f);if(k=='wal'&&SRV.w)f(SRV.w)}};window.SRV=SRV;
window.claude=window.claude||{use:async k=>k=='db'?db:k=='user'?{id:async()=>uid}:null};
conn();
})();
