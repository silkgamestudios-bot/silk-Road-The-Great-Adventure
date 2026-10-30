/* Chat global, mensajes privados y amigos. El servidor pone el nombre y valida todo; el cliente solo pide. */
module.exports=function(S,E){
const ECO=S.ECO;ECO.soc=ECO.soc||{};const now=()=>Date.now(),err=e=>({e});
const MAXF=30,MAXB=50,MAXH=40,GLOB=[],GMAX=60,LEN=140;
const clean=t=>String(t==null?'':t).replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,LEN);
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const so=u=>{u=String(u);let s=has(ECO.soc,u)?ECO.soc[u]:null;if(!s){if(!has(ECO.acc,u))return{fr:[],rq:[],bl:[],dm:{}};s=ECO.soc[u]={fr:[],rq:[],bl:[],dm:{}}}return s};
const nm=u=>(has(ECO.acc,u)&&ECO.acc[u].nm)||'Jugador';
const resolve=m=>{const a=String(m.to||m.u||'').trim();if(!a)return null;if(has(ECO.acc,a))return a;return E.uidByName(a)};
const rl={};const rate=(u,k,ms)=>{const t=now(),key=u+k;if(rl[key]&&t-rl[key]<ms)return false;rl[key]=t;return true};
const acctOf=u=>E.acct(u);
const row=u=>{const a=acctOf(u);return{u,nm:a.nm||'Jugador',on:S.online(u)?1:0,lv:a.lv|0,c:Math.max(0,a.cls|0),ls:a.ts||0}};
const dmView=(s)=>{const o={};for(const p in s.dm){const d=s.dm[p];o[p]={nm:nm(p),on:S.online(p)?1:0,un:d.un|0,m:d.m.slice(-20)}}return o};
function state(u){const s=so(u);return{fr:s.fr.map(row),rq:s.rq.map(x=>({u:x,nm:nm(x)})),bl:s.bl.map(x=>({u:x,nm:nm(x)})),dm:dmView(s),max:MAXF}}
const ops={};
/* ===== Idioma de la cuenta + traducción bajo demanda (Google Translate) ===== */
const LANGS=['es','en','pt'],TR_DAY=150,TR_KEY=process.env.GOOGLE_TRANSLATE_KEY||'',TRC=new Map(),TRMAX=3000;
const langOf=u=>{const l=has(ECO.acc,u)?ECO.acc[u].lang:'';return LANGS.includes(l)?l:''};
function gTranslate(text,target){
 const k=target+'|'+text;if(TRC.has(k)){const v=TRC.get(k);TRC.delete(k);TRC.set(k,v);return Promise.resolve(v)}
 const done=v=>{TRC.set(k,v);if(TRC.size>TRMAX)TRC.delete(TRC.keys().next().value);return v};
 if(!TR_KEY)return Promise.resolve(done({t:'['+target+'] '+text,src:'',demo:1})); /* modo demo sin clave */
 return new Promise((res,rej)=>{const body=JSON.stringify({q:text,target,format:'text'});
  const rq=require('https').request({hostname:'translation.googleapis.com',path:'/language/translate/v2?key='+encodeURIComponent(TR_KEY),method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)},timeout:6000},r=>{let d='';r.on('data',c=>{d+=c;if(d.length>20000)r.destroy()});r.on('end',()=>{try{const j=JSON.parse(d),x=j.data.translations[0];res(done({t:String(x.translatedText||'').slice(0,400),src:String(x.detectedSourceLanguage||'').slice(0,5)}))}catch(e){rej(new Error('bad'))}})});
  rq.on('timeout',()=>rq.destroy(new Error('timeout')));rq.on('error',rej);rq.end(body)})}
ops['soc.lang']=(u,m)=>{const l=String(m.l||'');if(!LANGS.includes(l))return err('Idioma no válido');acctOf(u).lang=l;S.dirty();return{ok:1,lg:l}};
/* servicio premium 🌐 Traducción: 10 💎 = 30 días (máx. 90 acumulados), igual que los demás servicios de la tienda */
const TL_GEMS=10,TL_D=30,DAYMS=864e5,tlOf=u=>{const a=acctOf(u);return(a.px&&+a.px.tl)||0};
ops['tl.buy']=(u)=>{const a=acctOf(u),t=now(),cur=tlOf(u);if(!a.px)a.px={};
 if(Math.max(t,cur)-t+TL_D*DAYMS>90*DAYMS)return err('Máximo 90 días acumulados');
 if(!E.spendGems(a,TL_GEMS,false,'Traducción premium '+TL_D+' d'))return err('Te faltan 💎: la traducción cuesta '+TL_GEMS+' 💎');
 a.px.tl=Math.max(t,cur)+TL_D*DAYMS;S.dirty();E.pushEnt(u);if(S.log)S.log('[tienda] '+(a.nm||u)+' compró traducción '+TL_D+'d');return{ok:1,ent:E.ent(u),tl:a.px.tl,cost:TL_GEMS}};
ops['chat.tr']=async(u,m)=>{const a=acctOf(u),lg=langOf(u);if(!lg)return err('Elige primero tu idioma');
 if(tlOf(u)<=now())return{ok:1,need:1,cost:TL_GEMS,days:TL_D};
 if(!rate(u,'t',500))return err('Más despacio');
 let msg=null;
 if(m.k==='g'){const ts=+m.ts;msg=GLOB.find(x=>x.ts===ts&&String(x.u)===String(m.u)&&!x.sys)}
 else if(m.k==='d'){const d=so(u).dm,p=String(m.p||''),ts=+m.ts;if(has(d,p))msg=d[p].m.find(x=>x.ts===ts)}
 if(!msg)return err('Mensaje no disponible');
 const txt=String(msg.t||'');if(txt.length<2||!/[\p{L}]/u.test(txt))return{ok:1,same:1};
 if(msg.ls&&msg.ls===lg)return{ok:1,same:1};
 const day=new Date().toISOString().slice(0,10),q=a.trq&&a.trq.d===day?a.trq:(a.trq={d:day,n:0});
 const k=lg+'|'+txt;const cached=TRC.has(k);
 if(!cached&&q.n>=TR_DAY)return err('Llegaste al límite diario de traducciones ('+TR_DAY+'). Mañana se reinicia.');
 try{const r=await gTranslate(txt,lg);if(!cached){q.n++;S.dirty()}
  if(r.src&&r.src===lg)return{ok:1,same:1};
  return{ok:1,t:r.t,src:r.src,demo:r.demo?1:0,left:Math.max(0,TR_DAY-q.n)}}
 catch(e){return err('No se pudo traducir ahora, intenta de nuevo')}};
ops['soc.me']=(u)=>({ok:1,s:state(u),g:GLOB.slice(-30),lg:langOf(u),tl:tlOf(u),tc:TL_GEMS});
ops['soc.find']=(u,m)=>{const t=resolve(m);if(!t||t===u)return err('No existe un jugador con ese nombre');return{ok:1,p:row(t)}};
ops['chat.g']=(u,m)=>{const a=acctOf(u);if(!a.nm)return err('Elige primero el nombre de tu personaje');const t=clean(m.text);if(!t)return err('Mensaje vacío');
 if(!rate(u,'g',1500))return err('Espera un momento antes de escribir otra vez');if(a.mute&&a.mute>now())return err('Estás silenciado por unos minutos');
 const last=a.lastg||'';if(last===t.toLowerCase()){a.dupg=(a.dupg|0)+1;if(a.dupg>=3){a.mute=now()+3*60e3;a.dupg=0;return err('Spam detectado: silenciado 3 minutos')}}else a.dupg=0;a.lastg=t.toLowerCase();
 const msg={u,nm:a.nm,gt:S.tagOf?S.tagOf(u):'',t,ts:now(),ls:langOf(u)};GLOB.push(msg);if(GLOB.length>GMAX)GLOB.shift();
 for(const id of Object.keys(ECO.acc))if(S.online(id)){const bl=so(id).bl;if(bl.includes(u))continue;S.push(id,{t:'cg',m:msg})}return{ok:1}};
ops['dm.send']=(u,m)=>{const a=acctOf(u);if(!a.nm)return err('Elige primero el nombre de tu personaje');const to=resolve(m);if(!to||!has(ECO.acc,to))return err('Ese jugador no existe');if(to===u)return err('No puedes escribirte a ti mismo');
 const t=clean(m.text);if(!t)return err('Mensaje vacío');if(!rate(u,'d',700))return err('Más despacio');
 const sb=so(to);if(sb.bl.includes(u))return err('Ese jugador no recibe tus mensajes');if(so(u).bl.includes(to))return err('Lo tienes bloqueado');
 const msg={f:u,nm:a.nm,t,ts:now(),ls:langOf(u)};
 const put=(me,peer,un)=>{const s=so(me);const d=s.dm[peer]||(s.dm[peer]={m:[],un:0});d.m.push(msg);if(d.m.length>MAXH)d.m.shift();if(un)d.un=(d.un|0)+1;const ks=Object.keys(s.dm);if(ks.length>60){ks.sort((x,y)=>(s.dm[x].m.slice(-1)[0]||{ts:0}).ts-(s.dm[y].m.slice(-1)[0]||{ts:0}).ts);delete s.dm[ks[0]]}};
 put(u,to,0);put(to,u,1);S.dirty();S.push(to,{t:'dm',p:u,nm:a.nm,m:msg});return{ok:1,m:msg,to,tn:nm(to)}};
ops['dm.read']=(u,m)=>{const p=String(m.u||'');const dm=so(u).dm;const d=has(dm,p)?dm[p]:null;if(d)d.un=0;S.dirty();return{ok:1}};
ops['dm.clear']=(u,m)=>{const dm=so(u).dm,p=String(m.u||'');if(has(dm,p))delete dm[p];S.dirty();return{ok:1}};
ops['fr.req']=(u,m)=>{const a=acctOf(u);if(!a.nm)return err('Elige primero el nombre de tu personaje');const t=resolve(m);if(!t||!has(ECO.acc,t))return err('No existe un jugador con ese nombre');if(t===u)return err('Ese eres tú');
 const s=so(u),b=so(t);if(s.fr.includes(t))return err('Ya son amigos');if(b.bl.includes(u))return err('No puedes enviar la solicitud');if(s.bl.includes(t))return err('Lo tienes bloqueado: desbloquéalo primero');
 if(s.fr.length>=MAXF)return err('Tu lista de amigos está llena (máx. '+MAXF+')');
 if(s.rq.includes(t)){return ops['fr.acc'](u,{u:t})}   // él ya te había invitado: se acepta
 if(b.rq.includes(u))return err('Ya le enviaste una solicitud');if(b.rq.length>=40)return err('Ese jugador tiene demasiadas solicitudes pendientes');
 b.rq.push(u);S.dirty();S.push(t,{t:'fq',u,nm:a.nm});return{ok:1,pend:1,tn:nm(t)}};
ops['fr.acc']=(u,m)=>{const t=String(m.u||''),s=so(u),b=so(t);if(!has(ECO.acc,t))return err('Ese jugador ya no existe');const i=s.rq.indexOf(t);if(i<0)return err('La solicitud ya no existe');
 if(s.fr.length>=MAXF)return err('Tu lista de amigos está llena (máx. '+MAXF+')');if(b.fr.length>=MAXF){s.rq.splice(i,1);S.dirty();return err('La lista de ese jugador está llena')}
 s.rq.splice(i,1);if(!s.fr.includes(t))s.fr.push(t);if(!b.fr.includes(u))b.fr.push(u);const j=b.rq.indexOf(u);if(j>=0)b.rq.splice(j,1);S.dirty();
 S.push(t,{t:'fa',u,nm:nm(u),on:1});return{ok:1,s:state(u)}};
ops['fr.dec']=(u,m)=>{const s=so(u),i=s.rq.indexOf(String(m.u||''));if(i>=0)s.rq.splice(i,1);S.dirty();return{ok:1,s:state(u)}};
ops['fr.rem']=(u,m)=>{const t=String(m.u||''),s=so(u),b=so(t);if(!has(ECO.acc,t)){s.fr=s.fr.filter(x=>x!==t);S.dirty();return{ok:1,s:state(u)}}s.fr=s.fr.filter(x=>x!==t);b.fr=b.fr.filter(x=>x!==u);S.dirty();S.push(t,{t:'fr',u});return{ok:1,s:state(u)}};
ops['soc.block']=(u,m)=>{const t=resolve(m);if(!t||t===u||!has(ECO.acc,t))return err('Jugador no válido');const s=so(u);if(!s.bl.includes(t)){if(s.bl.length>=MAXB)return err('Lista de bloqueados llena');s.bl.push(t)}s.fr=s.fr.filter(x=>x!==t);so(t).fr=so(t).fr.filter(x=>x!==u);s.rq=s.rq.filter(x=>x!==t);S.dirty();return{ok:1,s:state(u)}};
ops['soc.unblock']=(u,m)=>{const t=String(m.u||''),s=so(u);s.bl=s.bl.filter(x=>x!==t);S.dirty();return{ok:1,s:state(u)}};
/* presencia: avisa a tus amigos cuando entras o sales */
const presence=(u,on)=>{const s=ECO.soc[u];if(!s)return;for(const f of s.fr)if(S.online(f))S.push(f,{t:'fp',u,nm:nm(u),on:on?1:0})};
/* mensaje de sistema en el chat global (avisos de reinicio, etc.) */
const sys=t=>{const msg={u:'sys',nm:'📢 Servidor',gt:'',t:String(t).slice(0,200),ts:now(),sys:1};GLOB.push(msg);if(GLOB.length>GMAX)GLOB.shift();for(const id of Object.keys(ECO.acc))if(S.online(id))S.push(id,{t:'cg',m:msg})};
/* v382: al vender un personaje se borran sus amigos, solicitudes, bloqueos y mensajes (y los hilos que otros tenían con él): el comprador empieza limpio y nadie confunde al nuevo dueño con el anterior. Los bloqueos que otros pusieron se mantienen. */
function wipe(t){t=String(t);for(const p of Object.keys(ECO.soc)){if(p===t)continue;const o=ECO.soc[p];if(!o)continue;if(Array.isArray(o.fr))o.fr=o.fr.filter(x=>x!==t);if(Array.isArray(o.rq))o.rq=o.rq.filter(x=>x!==t);if(o.dm&&has(o.dm,t))delete o.dm[t]}delete ECO.soc[t];S.dirty()}
return{ops,presence,state,sys,wipe,tagOf:null}};
