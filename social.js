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
ops['soc.me']=(u)=>({ok:1,s:state(u),g:GLOB.slice(-30)});
ops['soc.find']=(u,m)=>{const t=resolve(m);if(!t||t===u)return err('No existe un jugador con ese nombre');return{ok:1,p:row(t)}};
ops['chat.g']=(u,m)=>{const a=acctOf(u);if(!a.nm)return err('Elige primero el nombre de tu personaje');const t=clean(m.text);if(!t)return err('Mensaje vacío');
 if(!rate(u,'g',1500))return err('Espera un momento antes de escribir otra vez');if(a.mute&&a.mute>now())return err('Estás silenciado por unos minutos');
 const last=a.lastg||'';if(last===t.toLowerCase()){a.dupg=(a.dupg|0)+1;if(a.dupg>=3){a.mute=now()+3*60e3;a.dupg=0;return err('Spam detectado: silenciado 3 minutos')}}else a.dupg=0;a.lastg=t.toLowerCase();
 const msg={u,nm:a.nm,gt:S.tagOf?S.tagOf(u):'',t,ts:now()};GLOB.push(msg);if(GLOB.length>GMAX)GLOB.shift();
 for(const id of Object.keys(ECO.acc))if(S.online(id)){const bl=so(id).bl;if(bl.includes(u))continue;S.push(id,{t:'cg',m:msg})}return{ok:1}};
ops['dm.send']=(u,m)=>{const a=acctOf(u);if(!a.nm)return err('Elige primero el nombre de tu personaje');const to=resolve(m);if(!to||!has(ECO.acc,to))return err('Ese jugador no existe');if(to===u)return err('No puedes escribirte a ti mismo');
 const t=clean(m.text);if(!t)return err('Mensaje vacío');if(!rate(u,'d',700))return err('Más despacio');
 const sb=so(to);if(sb.bl.includes(u))return err('Ese jugador no recibe tus mensajes');if(so(u).bl.includes(to))return err('Lo tienes bloqueado');
 const msg={f:u,nm:a.nm,t,ts:now()};
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
return{ops,presence,state,sys,tagOf:null}};
