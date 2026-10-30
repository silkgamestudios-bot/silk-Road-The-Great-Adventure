/* Gremios: crear (10 💎), hasta 500 miembros, rangos, invitaciones, solicitudes, tag, tesoro, chat y registro. Todo validado en el servidor. */
module.exports=function(S,E){
const {ECO,cat}=S,GC=cat.GUILD;
ECO.guilds=ECO.guilds||{};ECO.ginv=ECO.ginv||{};ECO.gtag=ECO.gtag||{};ECO.gname=ECO.gname||{};
const G=ECO.guilds,now=()=>Date.now();
const GH=id=>Object.prototype.hasOwnProperty.call(G,id)?G[id]:undefined;   // búsqueda segura: ids como 'constructor' no existen
const clean=(t,n)=>String(t==null?'':t).replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,n);
const int=(v,a,b,d)=>{v=Math.floor(+v);return Number.isFinite(v)?Math.min(b,Math.max(a,v)):d};
const CH={};/* chat reciente en memoria */
const TAGRE=()=>new RegExp('^[A-Z0-9]{'+GC.tagMin+','+GC.tagMax+'}$');
function log(g,t){g.log.unshift([now(),t]);if(g.log.length>60)g.log.length=60}
const myG=u=>{const a=E.acct(u);return a.gld&&G[a.gld]?G[a.gld]:null};
const rank=(g,u)=>g.mem[u]?g.mem[u].r:-1;
const count=g=>Object.keys(g.mem).length;
function summary(g){return{id:g.id,name:g.name,tag:g.tag,desc:g.desc,emb:g.emb,mode:g.mode,n:count(g),max:GC.max,leader:g.mem[g.leader]?g.mem[g.leader].nm:'',created:g.created}}
function full(g,u){const me=g.mem[u]||{r:0};
 const mem=Object.entries(g.mem).map(([id,m])=>({u:id,nm:m.nm,c:m.c,lv:m.lv,r:m.r,on:S.online(id)?1:0,ls:m.ls||0,jt:m.jt||0})).sort((a,b)=>b.r-a.r||b.on-a.on||b.lv-a.lv);
 const o=Object.assign(summary(g),{motd:g.motd,mem,me:{r:me.r},bank:g.bank,log:g.log.slice(0,40),chat:(CH[g.id]||[]).slice(-40)});
 if(me.r>=1){o.apps=Object.entries(g.app||{}).map(([id,x])=>Object.assign({u:id},x));o.inv=Object.entries(g.inv||{}).map(([id,x])=>({u:id,nm:x.nm,by:x.by,ts:x.ts}))}
 return o}
function pushG(g,except){for(const id of Object.keys(g.mem))if(id!==except&&S.online(id))S.push(id,{t:'gs',g:full(g,id)})}
function tagOf(u){const a=E.acct(u);return a.gld&&G[a.gld]?G[a.gld].tag:''}
S.guildName=(u,nm)=>{const g=myG(u);if(g&&g.mem[u]){g.mem[u].nm=nm;S.dirty()}};
S.guildSeen=(u,lv,c)=>{const g=myG(u);if(g&&g.mem[u]){g.mem[u].lv=lv;g.mem[u].c=c;g.mem[u].ls=now()}};
const err=e=>({e});
const ops={};
ops['g.me']=(u)=>{const g=myG(u);
 const inv=Object.entries(ECO.ginv[u]||{}).filter(([id,x])=>G[id]&&now()-x.ts<3*864e5).map(([id,x])=>Object.assign({id},summary(G[id]),{by:x.by}));
 return{ok:1,g:g?full(g,u):null,inv,price:GC.precio}};
ops['g.create']=(u,m)=>{const a=E.acct(u);if(a.gld&&G[a.gld])return err('Ya perteneces a un gremio');if(!a.nm)return err('Elige primero el nombre de tu personaje');
 const name=clean(m.name,GC.nameMax),tag=clean(m.tag,GC.tagMax).toUpperCase();
 if(!/^[\p{L}\p{N} '-]{3,20}$/u.test(name))return err('Nombre: 3 a 20 letras o números');
 if(!TAGRE().test(tag))return err('Tag: '+GC.tagMin+' a '+GC.tagMax+' letras o números');
 if(ECO.gname[name.toLowerCase()])return err('Ese nombre de gremio ya existe');
 if(ECO.gtag[tag])return err('Ese tag ya está en uso');
 if(E.gTot(a)<GC.precio)return err('Necesitas '+GC.precio+' 💎');
 E.spendGems(a,GC.precio,false,'Crear gremio');const id='G'+E.rid(5);
 const g=G[id]={id,name,tag,desc:clean(m.desc,140),motd:'',emb:{i:int(m.ei,0,11,0),c:int(m.ec,0,7,0)},mode:['inv','app','open'].includes(m.mode)?m.mode:'inv',leader:u,created:now(),mem:{},inv:{},app:{},bank:0,log:[]};
 g.mem[u]={r:2,nm:a.nm,c:Math.max(0,a.cls),lv:a.lv,jt:now(),ls:now()};a.gld=id;ECO.gname[name.toLowerCase()]=id;ECO.gtag[tag]=id;
 log(g,'🏰 '+a.nm+' fundó el gremio');S.dirty();E.pushEnt(u);return{ok:1,g:full(g,u)}};
function addMember(g,u,why){const a=E.acct(u);if(count(g)>=GC.max)return err('El gremio está lleno ('+GC.max+')');if(a.gld&&G[a.gld])return err('Ya está en un gremio');
 g.mem[u]={r:0,nm:a.nm||'Jugador',c:Math.max(0,a.cls),lv:a.lv,jt:now(),ls:now()};a.gld=g.id;delete g.inv[u];delete g.app[u];if(ECO.ginv[u])delete ECO.ginv[u][g.id];
 log(g,'➕ '+(a.nm||'Jugador')+' '+(why||'se unió'));S.dirty();E.pushEnt(u);return{ok:1}}
ops['g.list']=(u,m)=>{const q=clean(m.q,20).toLowerCase();
 const L=Object.values(G).filter(g=>!q||g.name.toLowerCase().includes(q)||g.tag.toLowerCase().includes(q)).sort((a,b)=>count(b)-count(a)).slice(0,30).map(summary);return{ok:1,list:L}};
ops['g.join']=(u,m)=>{const g=GH(String(m.id||''));if(!g)return err('Ese gremio ya no existe');const a=E.acct(u);if(a.gld&&G[a.gld])return err('Ya perteneces a un gremio');
 if(g.mode==='open'){const r=addMember(g,u,'se unió');if(r.e)return r;pushG(g,u);return{ok:1,g:full(g,u)}}
 if(g.mode==='app'){if(Object.keys(g.app).length>=100)return err('Demasiadas solicitudes pendientes');g.app[u]={nm:a.nm,c:Math.max(0,a.cls),lv:a.lv,ts:now()};S.dirty();pushG(g);return{ok:1,pending:1}}
 return err('Este gremio solo entra por invitación')};
ops['g.invite']=(u,m)=>{const g=myG(u);if(!g||rank(g,u)<1)return err('Solo oficiales y el líder pueden invitar');const t=E.uidByName(m.name);if(!t)return err('No existe un jugador con ese nombre');if(t===u)return err('Ese eres tú');
 const ta=E.acct(t);if(ta.gld&&G[ta.gld])return err('Ese jugador ya está en un gremio');if(count(g)>=GC.max)return err('El gremio está lleno');
 if(Object.keys(g.inv).length>=200)return err('Demasiadas invitaciones pendientes');
 g.inv[t]={nm:ta.nm,by:g.mem[u].nm,ts:now()};(ECO.ginv[t]=ECO.ginv[t]||{})[g.id]={by:g.mem[u].nm,ts:now()};
 log(g,'✉️ '+g.mem[u].nm+' invitó a '+ta.nm);S.dirty();S.push(t,{t:'ginv',g:summary(g),by:g.mem[u].nm});pushG(g);return{ok:1}};
ops['g.accept']=(u,m)=>{const id=String(m.id||''),g=GH(id),inv=ECO.ginv[u]&&Object.prototype.hasOwnProperty.call(ECO.ginv[u],id)&&ECO.ginv[u][id];if(!g||!inv||now()-inv.ts>3*864e5)return err('La invitación ya no es válida');
 const r=addMember(g,u,'aceptó la invitación');if(r.e)return r;pushG(g,u);return{ok:1,g:full(g,u)}};
ops['g.decline']=(u,m)=>{const id=String(m.id||'');if(ECO.ginv[u])delete ECO.ginv[u][id];if(GH(id)&&G[id].inv)delete G[id].inv[u];S.dirty();return{ok:1}};
ops['g.cancelinv']=(u,m)=>{const g=myG(u);if(!g||rank(g,u)<1)return err('Sin permiso');const t=String(m.u||'');delete g.inv[t];if(ECO.ginv[t])delete ECO.ginv[t][g.id];S.dirty();pushG(g);return{ok:1}};
ops['g.app']=(u,m)=>{const g=myG(u);if(!g||rank(g,u)<1)return err('Sin permiso');const t=String(m.u||''),ap=g.app[t];if(!ap)return err('La solicitud ya no existe');
 if(m.ok){const r=addMember(g,t,'fue aceptado');if(r.e){delete g.app[t];S.dirty();return r}pushG(g)}
 else{delete g.app[t];log(g,'🚫 Solicitud de '+ap.nm+' rechazada');S.dirty();pushG(g)}return{ok:1}};
ops['g.leave']=(u)=>{const g=myG(u);if(!g)return err('No tienes gremio');const a=E.acct(u);
 if(g.leader===u&&count(g)>1)return err('Eres el líder: transfiere el mando o disuelve el gremio');if(g.leader===u)return ops['g.disband'](u);
 delete g.mem[u];a.gld='';log(g,'➖ '+a.nm+' salió del gremio');S.dirty();E.pushEnt(u);pushG(g);return{ok:1}};
ops['g.kick']=(u,m)=>{const g=myG(u);const t=String(m.u||'');if(!g||!g.mem[t])return err('Ese jugador no está en el gremio');const rs=rank(g,u),rt=rank(g,t);
 if(t===u)return err('Usa Salir del gremio');if(rs<1||rs<=rt)return err('No tienes rango para expulsarlo');
 const nm=g.mem[t].nm;delete g.mem[t];E.acct(t).gld='';log(g,'🚪 '+g.mem[u].nm+' expulsó a '+nm);S.dirty();E.pushEnt(t);S.push(t,{t:'gs',g:null,kicked:g.name});pushG(g);return{ok:1}};
ops['g.rank']=(u,m)=>{const g=myG(u);const t=String(m.u||'');if(!g||rank(g,u)<2)return err('Solo el líder cambia rangos');if(!g.mem[t]||t===u)return err('Jugador inválido');
 const want=m.r===1?1:0;if(want===1&&Object.values(g.mem).filter(x=>x.r===1).length>=25)return err('Máximo 25 oficiales');
 g.mem[t].r=want;log(g,(want?'⭐ Ascendió a Oficial: ':'⬇️ Degradó a Miembro: ')+g.mem[t].nm);S.dirty();pushG(g);return{ok:1}};
ops['g.transfer']=(u,m)=>{const g=myG(u);const t=String(m.u||'');if(!g||g.leader!==u)return err('Solo el líder');if(!g.mem[t]||t===u)return err('Jugador inválido');
 g.mem[u].r=1;g.mem[t].r=2;g.leader=t;log(g,'👑 '+g.mem[u].nm+' cedió el mando a '+g.mem[t].nm);S.dirty();pushG(g);return{ok:1}};
ops['g.disband']=(u)=>{const g=myG(u);if(!g||g.leader!==u)return err('Solo el líder');const left=g.bank|0;
 if(left>0)E.deliver(u,{gold:left,note:'🏰 Tesoro del gremio disuelto: +'+left+' 🪙'});
 for(const id of Object.keys(g.mem)){E.acct(id).gld='';E.pushEnt(id);if(id!==u)S.push(id,{t:'gs',g:null,kicked:g.name,disb:1})}
 for(const id in ECO.ginv)if(ECO.ginv[id])delete ECO.ginv[id][g.id];
 delete ECO.gname[g.name.toLowerCase()];delete ECO.gtag[g.tag];delete G[g.id];delete CH[g.id];S.dirty();return{ok:1}};
ops['g.edit']=(u,m)=>{const g=myG(u);if(!g)return err('No tienes gremio');const r=rank(g,u);if(r<1)return err('Sin permiso');
 if(m.motd!=null)g.motd=clean(m.motd,160);
 if(r>=2){if(m.desc!=null)g.desc=clean(m.desc,140);if(m.mode&&['inv','app','open'].includes(m.mode))g.mode=m.mode;
  if(m.ei!=null||m.ec!=null)g.emb={i:int(m.ei,0,11,g.emb.i),c:int(m.ec,0,7,g.emb.c)};
  if(m.tag!=null){const tag=clean(m.tag,GC.tagMax).toUpperCase();if(tag!==g.tag){if(!TAGRE().test(tag))return err('Tag no válido');if(ECO.gtag[tag])return err('Ese tag ya está en uso');
   const a=E.acct(u);if(!E.spendGems(a,2,false,'Cambiar tag del gremio'))return err('Cambiar el tag cuesta 2 💎');delete ECO.gtag[g.tag];ECO.gtag[tag]=g.id;g.tag=tag;log(g,'🏷️ Nuevo tag: ['+tag+']');E.pushEnt(u)}}}
 S.dirty();pushG(g);return{ok:1}};
ops['g.chat']=(u,m)=>{const g=myG(u);if(!g)return err('No tienes gremio');const t=clean(m.text,140);if(!t)return err('Mensaje vacío');const a=E.acct(u),n=now();
 if(n-(a.lastChat||0)<1200)return err('Más despacio');a.lastChat=n;
 const msg={nm:g.mem[u].nm,r:g.mem[u].r,t,ts:n},c=CH[g.id]=CH[g.id]||[];c.push(msg);if(c.length>60)c.shift();
 for(const id of Object.keys(g.mem))if(S.online(id))S.push(id,{t:'gc',gid:g.id,m:msg});return{ok:1}};
ops['g.dep']=(u,m)=>{const g=myG(u);if(!g)return err('No tienes gremio');const q=int(m.q,1,1e12,0);if(!q)return err('Cantidad inválida');const a=E.acct(u);
 if(E.avail(a,'gold')<q)return err('Oro insuficiente (sincroniza e inténtalo)');
 const tx=Math.ceil(q*.03),net=q-tx;E.deliver(u,{gold:-q,note:'🏰 Depositaste '+q+' 🪙 en el tesoro (comisión 3%: '+tx+')'});g.bank+=net;log(g,'💰 '+g.mem[u].nm+' depositó '+q+' 🪙 (llegan '+net+' tras la comisión 3%)');S.dirty();pushG(g);return{ok:1}};
ops['g.wd']=(u,m)=>{const g=myG(u);if(!g||g.leader!==u)return err('Solo el líder retira del tesoro');const q=int(m.q,1,1e12,0);if(!q||q>g.bank)return err('Cantidad inválida');
 g.bank-=q;E.deliver(u,{gold:q,note:'🏰 Retiraste '+q+' 🪙 del tesoro'});log(g,'🏧 '+g.mem[u].nm+' retiró '+q+' 🪙');S.dirty();pushG(g);return{ok:1}};
return{ops,tagOf,myG,full,summary}};
