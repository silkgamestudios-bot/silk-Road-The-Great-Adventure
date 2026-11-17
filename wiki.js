/* Karavan Online · Wiki · v404
   Se genera con los datos reales del juego (wiki-data.js, wiki-lore.js y wiki-items.js, extraídos del juego en vivo). */
(function(){
'use strict';
const W=window.WIKI,L=window.LORE,I=window.KVI,KV=window.KV;
const $=s=>document.querySelector(s),$$=(s,r)=>[...(r||document).querySelectorAll(s)];
const esc=KV.esc,dc=KV.dc,fmt=n=>{n=+n;return Number.isInteger(n)?String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.'):n.toLocaleString('es',{maximumFractionDigits:2})};
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const CG=KV.CG;
const BIO={g:'Llanura',f:'Bosque',s:'Estepa',m:'Montaña',d:'Desierto',w:'Hielo',r:'Cañón',a:'Cenizas'};
const RC=['','r1','r2','r3'];
const RN=['Común','Raro','Épico','Legendario'];            /* rarezas de objetos (como en el juego) */
const RCOL=['#b9b9b9','#4aa3ff','#c46bff','#ffb020'];
const TCOL=['#b9b9b9','#4aa3ff','#c46bff','#ffb020','#ff4a6a'];  /* color por rango de poder (nivel del set) */
const SN=['Arma','Pechera','Casco','Guantes','Pantalón','Calzado','Secundario','Anillo','Amuleto','Pendientes'];
const SNI=['⚔️','🦺','⛑️','🧤','👖','👢','🛡️','💍','📿','✨'];
const ELI=I.misc.eli;
const money=n=>fmt(n)+' 🪙';
const tbl=(h,rows,num)=>'<div class="tbl"><table><thead><tr>'+h.map((x,i)=>'<th'+(num&&num.includes(i)?' class="num"':'')+'>'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map((x,i)=>'<td'+(num&&num.includes(i)?' class="num"':'')+'>'+x+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
const spr=(c,t,k)=>'<span class="spr" style="--c:'+c+';--t:'+t+';--k:'+(k||4)+'"></span>';
const pill=(t,c)=>'<span class="pill '+(c||'')+'">'+t+'</span>';
const note=(t,w)=>'<div class="note'+(w?' warn':'')+'">'+t+'</div>';
const gem=n=>'<b>'+n+'</b> 💎';
const SP=(n,k)=>KV.sp(n,k,'data-an="'+n.replace(/-\d$/,'')+'"');         /* sprite animado del juego */
const SPS=(n,k)=>KV.sp(n,k);                                              /* sprite quieto */
const CNAME=c=>W.classes[c].n;

/* ---------- navegación (cada grupo tiene su color) ---------- */
const NAV=[
 ['Empezar','#21d6c4',[['inicio','🏠','Inicio'],['guia','🧭','Guía del recién llegado'],['lore','📜','La Gran Ruta (lore)'],['plataformas','📱','Jugar en PC, Android y iOS']]],
 ['Héroes','#ffc83d',[['clases','⚔️','Las 8 clases'],['skills','✨','Habilidades'],['entrenamiento','🕯️','Entrenamiento'],['mascotas','🐎','Mascotas y monturas']]],
 ['Objetos','#b27bff',[['objetos','🎒','Catálogo de objetos'],['equipo','🛡️','Rarezas y sets de clase'],['forja','🔨','Potenciación y forja']]],
 ['El mundo','#46a8ff',[['mundo','🗺️','Tierras y ciudades'],['cuevas','🕳️','Cuevas y la Torre'],['submundo','🔥','El Submundo'],['monstruos','👹','Monstruos y jefes'],['celestiales','🌠','Celestiales y dragones'],['clima','🌦️','Clima y estaciones']]],
 ['Progreso y oro','#ff9d1c',[['farmeo','💰','Farmeo, oro y botín'],['misiones','📋','Misiones diarias'],['carpas','🏕️','Carpas y edificios'],['premium','💎','Servicios premium'],['gremios','🏰','Gremios y territorios']]],
 ['Más','#34d27b',[['eventos','🎃','Eventos y estaciones'],['novedades','🆕','Novedades'],['arte','🎨','Arte y fondos'],['creditos','ℹ️','Créditos']]]
];
const FLAT=NAV.flatMap(g=>g[2].map(x=>x.concat([g])));
const GOF=r=>(NAV.find(g=>g[2].some(x=>x[0]==r))||NAV[0]);
let CURG=NAV[0];
const head=(t,s,k)=>'<header class="pg-h"><div class="k">'+esc(k||CURG[0])+'</div><h1>'+t+'</h1>'+(s?'<p>'+s+'</p>':'')+'</header>';

const P={};


/* =====================================================================
   OBJETOS · catálogo completo (datos extraídos del juego en vivo)
   ===================================================================== */
const cl=(v,a,b)=>Math.max(a,Math.min(b,v|0));
const EQ=(k,li,sl)=>I.eq[(k*10+li)*7+sl];           /* 8 clases × 10 sets × 7 piezas */
const BS=(k,i,sl)=>I.bas[(k*10+i)*7+sl];            /* 8 clases × 10 niveles de Armería × 7 piezas */
const LVS=[1,10,20,30,40,50,60,70,80,90];
const SKA=k=>W.classes[k].skill_area;
const VAL=k=>(I.val[k]||[])[2];
const ST_DEF=[['dm','⚔️','% daño'],['hp','❤️',' vida'],['sp','👟','% vel.'],['gd','🪙','% oro'],['mp','💧',' MP']];
/* líneas de atributos de una variante, tal como las muestra el juego */
function stLines(v,k){
  const s=v.st||{},o=[];
  ST_DEF.forEach(d=>{if(s[d[0]])o.push(d[1]+' +'+s[d[0]]+d[2])});
  if(v.res)o.push(ELI[v.res[0]]+' −'+v.res[1]+'% daño de '+v.res[0]);
  if(v.sk&&k!=null)o.push('✨ +'+v.sk+' pts de '+SKA(k));
  return o;
}
/* resumen «común → legendario» para las etiquetas de las tarjetas */
function rngTags(vs){
  const a=vs[0].st||{},b=vs[3].st||{},o=[];
  ST_DEF.forEach(d=>{if(b[d[0]])o.push(d[1]+' '+(a[d[0]]||0)+'–'+b[d[0]]+(d[2].charAt(0)=='%'?'%':''))});
  return o.slice(0,2);
}
const rcell=(v,k,extra)=>'<div style="--rc:'+RCOL[v.r]+'">'+KV.ic(v.ic,1.6)+'<b>'+RN[v.r]+'</b>'+stLines(v,k).map(x=>'<span>'+x+'</span>').join('')+(extra||'')+'</div>';
const kvl=rows=>'<dl class="kvl">'+rows.filter(Boolean).map(r=>'<div><dt>'+r[0]+'</dt><dd>'+r[1]+'</dd></div>').join('')+'</dl>';
const iconOf=e=>e.ic!=null?KV.ic(e.ic,e.k||1,'',''):'<span class="em" style="font-size:'+(24*(e.k||1))+'px">'+e.em+'</span>';

/* ---------- entradas por categoría ---------- */
function eqEntry(r){
  return{id:String(r.sl),v:'sets/'+r.k+'/'+r.li,n:r.n,ic:r.v[0].ic,sub:SN[r.sl]+' · nivel '+fmt(r.rl),tags:rngTags(r.v),c:TCOL[r.t],
   dlg:()=>'<div class="rr">'+r.v.map(v=>rcell(v,r.k)).join('')+'</div>'
    +kvl([['Conjunto',esc(I.setn[r.k][r.li])],['Clase',SPS('c'+r.k+'-down-1',1.5)+' '+esc(CNAME(r.k))],['Ranura',SNI[r.sl]+' '+SN[r.sl]],['Nivel requerido',fmt(r.rl)],['Rarezas','Común · Raro · Épico · Legendario']])
    +note('Los atributos de las cuatro rarezas son ×1, ×1,6, ×2,4 y ×3,5 del valor base. Se pueden <a href="#/forja">potenciar hasta +12</a> y encantar con un hechizo.')
    +(r.v[0].res?note('Esta pieza da <b>resistencia elemental</b> y puntos de habilidad ✨ extra para tu clase.'):'')
    +note('Pertenece a '+esc(CNAME(r.k))+'. Si la lleva otra clase, sus bonos <b>restan un 60 %</b> en vez de sumar.',1)};
}
function bsEntry(r,i){
  return{id:String(r.sl),v:'armeria/'+r.k+'/'+i,n:r.n,ic:r.v[0].ic,sub:SN[r.sl]+' · nivel '+r.L,tags:[money(r.v[0].pr)+' – '+money(r.v[3].pr)],c:TCOL[Math.min(4,i>>1)],
   dlg:()=>'<div class="rr">'+r.v.map(v=>rcell(v,r.k,'<span class="px">'+money(v.pr)+'</span>')).join('')+'</div>'
    +kvl([['Se compra en','🛡️ Armería (todas las ciudades)'],['Clase',SPS('c'+r.k+'-down-1',1.5)+' '+esc(CNAME(r.k))],['Ranura',SNI[r.sl]+' '+SN[r.sl]],['Nivel requerido',fmt(r.L)],['Rarezas','Común · Raro · Épico · Legendario']])
    +note('Equipo básico a la venta: sus atributos son el 70 % de los de un set de botín del mismo rango. El precio sube con la rareza (×1, ×1,6, ×2,4 y ×3,5).')
    +note('Pertenece a '+esc(CNAME(r.k))+'. Si la lleva otra clase, sus bonos <b>restan un 60 %</b> en vez de sumar.',1)};
}
const jwTier=i=>Math.min(4,Math.floor(i/3));
function jwEntry(r){
  return{id:r.i+'_'+r.sl,v:'joyas/'+r.sl,n:r.n,ic:r.v[0].ic,sub:SN[r.sl]+' · nivel '+fmt(r.rl),tags:rngTags(r.v),c:TCOL[jwTier(r.i)],
   dlg:()=>'<div class="rr">'+r.v.map(v=>rcell(v,null)).join('')+'</div>'
    +kvl([['Ranura',SNI[r.sl]+' '+SN[r.sl]],['Nivel requerido',fmt(r.rl)],['Clase','Todas (sus bonos suman completos)'],['Rarezas','Común · Raro · Épico · Legendario']])
    +note('Las joyas no son de ninguna clase: sirven a cualquier héroe y se pueden <a href="#/forja">potenciar</a> como el resto del equipo.')};
}
const POTL={h:['Pociones de vida','❤️','Todas las clases'],m:['Pociones de maná','💧','Todas las clases'],g:['Brebajes de guerra','🛡️','Caballero y Enana Guerrera'],a:['Esencias arcanas','🔮','Mago, Sanador y Elfa Druida']};
function potEntry(p){
  const mp=p.mp;
  return{id:p.l+p.t,v:'pociones',n:p.n,ic:p.ic,sub:'Nivel '+fmt(p.lv)+' · '+(mp?'recupera maná':'recupera vida'),tags:[(mp?'💧 +':'❤️ +')+fmt(p.amt)],c:p.col,
   dlg:()=>kvl([['Efecto',(mp?'💧 Recupera <b>'+fmt(p.amt)+'</b> de maná':'❤️ Recupera <b>'+fmt(p.amt)+'</b> de vida')],['Nivel requerido',fmt(p.lv)],['Clases',POTL[p.l][2]],['Precio (1 unidad)',money(p.pr)],['Precio (paquete de 5)',money(p.pr5)],['Se compra en','🧪 Botica (todas las ciudades)']])
    +note('Con el servicio <a href="#/premium">Poción automática</a> el juego bebe una sola cuando tu vida baja del 30 %. Las pociones de loot se pasan a la mochila de uso desde 🎒 Objetos.')};
}
const FOODN={carne:'Cruda',car2:'Cruda',car3:'Cruda',car4:'Cruda',car5:'Cruda',cocida:'Cocida',coc2:'Cocida',coc3:'Cocida',coc4:'Cocida',coc5:'Cocida'};
const FOODD={
 pasto:['Alimento de monturas: los herbívoros (caballo, camello, corcel…) comen pasto.','🐎'],hierba:['Cura a tu mascota (5 % de su vida) y le quita la enfermedad. La vende un Mercader.','🌿'],
 lazo:['Se fabrican en el Gremio de Cazadores y sirven para domar.','🪢'],hil:['Se gasta 1 por lanzamiento de caña. Se comercia entre jugadores.','🧵']};
function foodEntry(p){
  const k=p.k,v=I.val[k]||[],raw=/^(carne|car\d|fi\d)$/.test(k),cook=/^(cocida|coc\d|fc\d)$/.test(k),fish=/^f[ic]\d$/.test(k);
  const eff=FOODD[k]?FOODD[k][0]:raw?(fish?'Se cocina en la Carpa del Cocinero. Cuanto más grande el pez, mejor la comida.':'Se cocina en la Carpa del Cocinero (o se la das cruda a tu mascota carnívora).'):'Recupera <b>vida y maná</b> poco a poco durante varios minutos (de 2 % cada 5 s la común hasta 6 % la legendaria).';
  return{id:k,v:'comida',n:p.n,ic:p.ic,sub:(raw?'Ingrediente':cook?'Comida preparada':'Útil'),tags:v[2]?[money(v[2])]:[],c:cook?'#ff9d1c':raw?'#ff6a5a':'#34d27b',
   dlg:()=>kvl([['Qué hace',eff],v[2]?['Valor base',money(v[2])]:null,['Se vende en','Carpa del Cocinero y Mercaderes'],cook?['Dónde se hace','🍖 Carpa del Cocinero (suroeste de cada ciudad)']:null])
    +(cook||raw?note('El <b>Nivel de Caza</b> mejora la calidad de la carne que obtienes. Ver <a href="#/farmeo">Farmeo, oro y botín</a>.'):'')};
}
function minEntry(m){
  const g=m.g;
  return{id:'m_'+m.k,v:'materiales',n:m.n,ic:m.ic2,sub:(g?'Gema':'Mineral')+' · pico nivel '+m.req,tags:[money(m.px)],c:m.c,
   dlg:()=>kvl([['Tipo',g?'💎 Gema (se vende o se usa en la potenciación)':'⛏️ Mineral'],['Herramienta mínima','Pico nivel '+m.req+' ('+I.tool[Math.min(3,m.req-1)].n+')'],['Zonas donde aparece','Peligro '+m.tw[0]+' a '+m.tw[1]],['Frecuencia relativa',fmt(m.w)],['Valor base',money(m.px)]])
    +note('Se extrae de las vetas del mapa con un <a href="#/objetos/herramientas">pico</a> y se usa para <a href="#/forja">potenciar equipo</a>.')};
}
function xmEntry(m){
  const rn=['Común','Poco común','Raro','Épico','Legendario','Mítico'];
  return{id:'x_'+m.k,v:'materiales',n:m.n,ic:m.ic,sub:m.dr?'Material de dragón':'Submundo · '+rn[m.rar],tags:[money(m.px)],c:m.c,
   dlg:()=>kvl([['Rareza',rn[m.rar]],m.dr?['Dónde se consigue','🐉 Dragones del mes (Ignarax y Glacius)']:['Dónde se consigue','🔥 Monstruos del Submundo desde el nivel '+m.mn],m.dr?null:['Frecuencia relativa',fmt(m.w)],['Valor base',money(m.px)]])
    +note(m.dr?'Los materiales de dragón se piden en las potenciaciones más altas (+11 y +12). Ver <a href="#/forja">Potenciación y forja</a>.':'Los materiales del Submundo se gastan en la <a href="#/forja">Forja encantada</a>. Ver <a href="#/submundo">El Submundo</a>.')};
}
const OTH=[
 ['fe','Chatarra','Material de la Herrería para forjar piezas. También sale al desguazar objetos.',150,'⛓️',I.mat.find(x=>x.k=='fe')],
 ['cu','Cuero','Material de la Herrería para forjar piezas. También sale al desguazar objetos.',120,'🧶',I.mat.find(x=>x.k=='cu')],
 ['mad','Madera','Se tala con un hacha; sirve para antorchas, flechas y construcciones de gremio.',VAL('mad'),'🪵',I.mat.find(x=>x.k=='mad')],
 ['tel','Tela de araña','La sueltan las arañas. Se usa en el Refuerzo Arácnido y en las antorchas.',VAL('tel'),'🕸️',I.mat.find(x=>x.k=='tel')],
 ['cur','Piel de lobo','La sueltan los lobos. Sirve para fabricar antorchas y equipo.',VAL('cur'),'🟫',I.mat.find(x=>x.k=='cur')],
 ['pat','Pata de araña','La sueltan las arañas. Se usa en el Refuerzo Arácnido.',VAL('pat'),'🕷️',null],
 ['ant','Antorcha de estaca','Ilumina de noche y en cuevas y te protege del frío. Se gasta con el tiempo.',VAL('ant'),'🔥',I.torch.find(x=>x.k=='ant')]];
function othEntry(o){
  return{id:'o_'+o[0],v:'materiales',n:o[1],ic:o[5]?o[5].ic:null,em:o[4],sub:'Material',tags:o[3]?[money(o[3])]:[],c:'#c9a35a',
   dlg:()=>kvl([['Qué es',o[2]],o[3]?['Valor base',money(o[3])]:null])};
}
function toolEntry(t){
  const pick=t.kd!='hacha',kd={pico:'⛏️ Pico',pala:'🪏 Pala',hacha:'🪓 Hacha'}[t.kd];
  const tiers=['Madera/Piedra','Hierro','Acero','Mitril'];
  const dur=pick?I.sys.TLD[t.t]:t.pw,pr=pick?I.sys.TLP[t.kd][t.t]:t.pr;
  return{id:'t_'+t.kd+t.t,v:'herramientas',n:t.n,ic:t.ic,sub:kd+' · nivel '+(t.t+1),tags:[money(pr)],c:TCOL[Math.min(4,t.t+1)],
   dlg:()=>kvl([['Tipo',kd],['Nivel de herramienta',(t.t+1)+' de 4 ('+tiers[t.t]+')'],['Usos antes de romperse',fmt(dur)],['Precio',money(pr)],['Se compra en','🏪 Tienda de herramientas / Herrería']])
    +note(t.kd=='pico'?'Cada mineral pide un nivel mínimo de pico. Ver <a href="#/objetos/materiales">minerales y gemas</a>.':t.kd=='pala'?'La pala sirve para cavar tesoros y sellos enterrados.':'Con el hacha talas árboles para conseguir madera.')};
}
function arrowEntry(a){
  const f=I.sys.WFR[a.i],mn=f?(I.sys.MNBn[f[0]]||f[0]):'',p=VAL('ar'+a.i);
  return{id:'a_'+a.i,v:'herramientas',n:a.n,ic:a.ic,sub:'🏹 Flecha del Arquero',tags:['×'+fmt(I.sys.WFM[a.i])+' daño'],c:a.col,
   dlg:()=>kvl([['Multiplicador de daño','×'+fmt(I.sys.WFM[a.i])],p?['Valor base (1 flecha)',money(p)]:null,f?['Receta por lote (×20 flechas)','1 '+esc(mn.toLowerCase())+' (punta) + '+f[2]+' madera + '+fmt(f[3])+' 🪙']:['Receta','No se fabrica: es la flecha que viene con el arco'],f?['Probabilidad de éxito del lote',Math.round(f[4]*100)+' %']:null])
    +note('Las flechas se gastan al disparar. Se fabrican en la <b>Fletchería</b> de la Herrería (un lote malo pierde la punta, la madera y la tarifa) y también se comercian entre jugadores.')};
}
function bagEntry(b){
  const bn=['Común','Poco común','Rara','Épica','Legendaria','Mítica'];
  const how=b.cap<=40?'Cae como botín.':b.cap==65?'Cae como botín, sobre todo en el Submundo (máximo 2 en tu poder).':'Se consigue como recompensa de misiones y de jefes.';
  return{id:'b_'+b.cap,v:'mochilas',n:b.n,ic:b.ic,sub:b.cap+' espacios · '+bn[b.t],tags:['🎒 '+b.cap],c:TCOL[Math.min(4,Math.max(0,b.t-1))],
   dlg:()=>kvl([['Capacidad','<b>'+b.cap+'</b> espacios'],['Rareza',bn[b.t]],['Cómo se consigue',how]])
    +note('Las mochilas y las bolsas de loot pueden ser de cualquier capacidad. Los bolsos se equipan desde 🎒 Objetos.')};
}
function keyEntry(k,isChest){
  const kn=['Común','Poco común','Rara','Épica','Legendaria','Mítica'][k.i-1],vk=VAL((isChest?'cf':'kl')+k.i);
  return{id:(isChest?'c':'k')+k.i,v:'cofres',n:(isChest?'Cofre ':'Llave ')+kn.toLowerCase(),ic:isChest?k.cf:k.kl,sub:isChest?'Cofre · se abre con su llave':'Llave · abre su cofre',tags:vk?[money(vk)]:[],c:k.c,
   dlg:()=>kvl([['Rareza',kn],['Tipo',isChest?'📦 Cofre':'🗝️ Llave'],['Combina con',isChest?'Llave '+kn.toLowerCase():'Cofre '+kn.toLowerCase()],vk?['Valor base',money(vk)]:null])
    +note('Las llaves salen como premio de las misiones difíciles y de las cacerías; abren cofres de la misma rareza con equipo y objetos. Ver <a href="#/misiones">misiones diarias</a>.')};
}
function skinEntry(s){
  const rn=W.rar[s.t];
  return{id:'s_'+s.id,v:'apariencias',n:s.n,ic:s.ic,sub:esc(CNAME(s.c))+' · '+rn,tags:['💎 '+s.g],c:TCOL[Math.min(4,s.t+1)],
   dlg:()=>'<div class="rr" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">'
     +[['🛡️ Armadura',s.ar],['🔰 Defensa',s.df+'%'],['⚡ Resist. elemental',s.er],['🎯 Penetración',s.pr],['💥 Golpe',s.hit],['✴️ Crítico',s.cr+'%']].map(x=>'<div style="--rc:'+TCOL[Math.min(4,s.t+1)]+'"><b>'+x[0]+'</b><span style="font-size:20px">'+x[1]+'</span></div>').join('')+'</div>'
    +kvl([['Clase',SPS('c'+s.c+'-down-1',1.5)+' '+esc(CNAME(s.c))],['Rareza',rn],['Elemento',(ELI[s.el]||'')+' '+esc(s.el)],['Estilo de combate',esc(s.st)],['Precio','<b>'+s.g+'</b> 💎'],['Se compra en','👘 Boutique de apariencias']])
    +note('Cada apariencia cambia el aspecto de tu héroe y da bonos permanentes. Solo cuenta la de tu clase, y los bonos tienen tope: no se acumulan con otras apariencias.')};
}
const TJL={dm:'⚔️ Daño',hp:'❤️ Vida',df:'🛡️ Defensa',mp:'💧 MP máx.',mr:'🔮 MP de la comida',cr:'💥 Crítico',sp:'👟 Velocidad'};
function trajEntry(q){
  const rn=['','Rara','Épica','Legendaria'][q.t];
  return{id:'j_'+q.id,v:'apariencias',n:q.n,em:'👘',k:1.2,sub:esc(CNAME(q.c))+' · Traje '+rn.toLowerCase(),tags:['💎 '+q.g],c:q.au,
   dlg:()=>'<div style="text-align:center;margin:6px 0 12px"><span style="display:inline-block;filter:'+q.f+' drop-shadow(0 6px 0 rgba(0,0,0,.4)) drop-shadow(0 0 18px '+q.au+')">'+SPS('c'+q.c+'-down-1',8)+'</span></div>'
    +kvl([['Clase',esc(CNAME(q.c))],['Rareza',rn],['Bono',TJL[q.bn[0]]+' <b>+'+q.bn[1]+'%</b>'],['Precio','<b>'+q.g+'</b> 💎'],['Se compra en','👘 Boutique de apariencias › Trajes']])
    +note('Hay 3 trajes por héroe, con bono de poder de +2 %, +3 % y +4 %. Solo cuenta el traje de tu clase y no se acumula con otras apariencias.')};
}

/* ---------- piezas de interfaz del catálogo ---------- */
const flt=segs=>'<div class="flt">'+segs.map(s=>'<div class="seg"><span>'+s[0]+'</span>'+s[1]+'</div>').join('')+'</div>';
const itCard=e=>'<a class="it" href="#/objetos/'+e.v+'~'+esc(e.id)+'" data-e="'+esc(e.id)+'" style="--rc:'+e.c+'"><span class="ib">'+iconOf(e)+'</span><span><b>'+esc(e.n)+'</b><small>'+e.sub+'</small>'+(e.tags&&e.tags.length?'<span class="tg">'+e.tags.map(t=>'<span>'+t+'</span>').join('')+'</span>':'')+'</span></a>';
const itg=es=>'<div class="itg">'+es.map(itCard).join('')+'</div>';
const VIEWS_LIST=[['sets','⚔️','Sets de clase'],['armeria','🛡️','Armería'],['joyas','💍','Joyas'],['pociones','🧪','Pociones'],['comida','🍖','Comida y pesca'],['materiales','⛏️','Materiales'],['herramientas','🪓','Herramientas'],['mochilas','🎒','Mochilas'],['cofres','📦','Cofres y llaves'],['apariencias','👘','Apariencias']];
const catTabs=cur=>'<div class="flt tabs" aria-label="Categorías del catálogo">'+'<a class="cb'+(cur?'':' on')+'" href="#/objetos">🎒 Todo</a>'+VIEWS_LIST.map(v=>'<a class="cb'+(v[0]==cur?' on':'')+'" href="#/objetos/'+v[0]+'">'+v[1]+' '+v[2]+'</a>').join('')+'</div>';
const crumbs=(...p)=>'<nav class="crumbs" aria-label="Ruta"><a href="#/objetos">Catálogo</a>'+p.map(x=>' <i>›</i> '+x).join('')+'</nav>';
const clsChips=(k,mk)=>W.classes.map(c=>'<a class="cb'+(c.id==k?' on':'')+'" style="--cc:'+CG[c.id]+'" href="'+mk(c.id)+'">'+SPS('c'+c.id+'-down-1',1.4)+esc(c.n)+'</a>').join('');
const lvChips=(cur,vals,cols,mk)=>vals.map((v,i)=>'<a class="cb'+(i==cur?' on':'')+'" style="--cc:'+cols[i]+'" href="'+mk(i)+'">'+v+'</a>').join('');

/* ---------- vistas ---------- */
const VIEWS={};
VIEWS.sets=a=>{
  const k=cl(+a[0]||0,0,7),li=cl(a[1]==null||a[1]===''?0:+a[1],0,9),rows=[0,1,2,3,4,5,6].map(sl=>EQ(k,li,sl)),r0=rows[0],set=I.setn[k][li],ents=rows.map(eqEntry);
  const rl=[...Array(10).keys()].map(i=>fmt(EQ(k,i,0).rl)),cols=[...Array(10).keys()].map(i=>TCOL[EQ(k,i,0).t]);
  return{title:'Sets de clase',sub:'Diez conjuntos de siete piezas por clase, de nivel 50 a 1.200. Toca una pieza para ver sus cuatro rarezas.',ents,
   html:crumbs('Sets de clase',esc(CNAME(k))+' · nivel '+rl[li])
    +flt([['Clase',clsChips(k,c=>'#/objetos/sets/'+c+'/'+li)],['Nivel del set',lvChips(li,rl,cols,i=>'#/objetos/sets/'+k+'/'+i)]])
    +'<div class="setbar" style="--tc:'+TCOL[r0.t]+'"><div class="sb-i">'+SPS('c'+k+'-down-1',4)+'</div><div><small>Conjunto de nivel '+fmt(r0.rl)+' · '+esc(CNAME(k))+'</small><h3>'+esc(set)+'</h3></div><div class="sb-n"><b>7</b><small>piezas</small></div><div class="sb-n"><b>4</b><small>rarezas</small></div></div>'
    +itg(ents)+'<p class="cnt">Siete piezas × cuatro rarezas = 28 objetos en este set. Mira también el <a href="#/objetos/armeria/'+k+'/0">equipo básico de la Armería</a> de esta clase.</p>'};
};
VIEWS.armeria=a=>{
  const k=cl(+a[0]||0,0,7),i=cl(a[1]==null||a[1]===''?0:+a[1],0,9),rows=[0,1,2,3,4,5,6].map(sl=>BS(k,i,sl)),ents=rows.map(r=>bsEntry(r,i));
  const cols=[...Array(10).keys()].map(j=>TCOL[Math.min(4,j>>1)]);
  const tot=rows.reduce((s,r)=>s+r.v[0].pr,0);
  return{title:'Armería',sub:'Equipo básico que se compra con oro en cualquier ciudad, para cada clase y cada tramo de nivel.',ents,
   html:crumbs('Armería',esc(CNAME(k))+' · nivel '+LVS[i])
    +flt([['Clase',clsChips(k,c=>'#/objetos/armeria/'+c+'/'+i)],['Nivel',lvChips(i,LVS,cols,j=>'#/objetos/armeria/'+k+'/'+j)]])
    +'<div class="setbar" style="--tc:'+TCOL[Math.min(4,i>>1)]+'"><div class="sb-i">'+SPS('c'+k+'-down-1',4)+'</div><div><small>Equipo básico de nivel '+LVS[i]+' · '+esc(CNAME(k))+'</small><h3>Armería de '+esc(CNAME(k))+'</h3></div><div class="sb-n"><b>'+fmt(tot)+'</b><small>🪙 el set común</small></div><div class="sb-n"><b>4</b><small>rarezas</small></div></div>'
    +itg(ents)+'<p class="cnt">Precios de la rareza Común. Cada rareza superior cuesta ×1,6, ×2,4 y ×3,5. Las Armerías de las ciudades tienen los mismos precios.</p>'};
};
VIEWS.joyas=a=>{
  const f=a[0]=='7'||a[0]=='8'||a[0]=='9'?+a[0]:0,rows=I.jw.filter(r=>!f||r.sl==f),ents=rows.map(jwEntry);
  const chips=[['Todas',0],['💍 Anillos',7],['📿 Amuletos',8],['✨ Pendientes',9]].map(x=>'<a class="cb'+(x[1]==f?' on':'')+'" href="#/objetos/joyas'+(x[1]?'/'+x[1]:'')+'">'+x[0]+'</a>').join('');
  return{title:'Joyas',sub:'Anillos, amuletos y pendientes: trece niveles de poder que sirven a cualquier clase.',ents,
   html:crumbs('Joyas')+flt([['Ranura',chips]])+itg(ents)+'<p class="cnt">'+ents.length+' joyas × 4 rarezas. Un héroe lleva dos anillos, un amuleto y unos pendientes a la vez.</p>'};
};
VIEWS.pociones=a=>{
  const ents=I.pot.map(potEntry);
  const sec=l=>'<h2>'+POTL[l][1]+' '+POTL[l][0]+'</h2><p>'+POTL[l][2]+'.</p>'+itg(ents.filter(e=>e.id[0]==l));
  return{title:'Pociones',sub:'Cuatro líneas de siete rangos: de la poción menor (nivel 1) a la divina (nivel 400).',ents,
   html:crumbs('Pociones')+sec('h')+sec('m')+sec('g')+sec('a')+note('Los <b>brebajes de guerra</b> curan un 50 % más que una poción de vida del mismo rango y son para las clases de cuerpo a cuerpo con más vida; las <b>esencias arcanas</b> devuelven un 60 % más de maná y son para los lanzadores de hechizos.')};
};
VIEWS.comida=a=>{
  const g=ks=>I.prov.filter(p=>ks.includes(p.k)).map(foodEntry),G=[['🥩 Carne cruda',g(['carne','car2','car3','car4','car5'])],['🍖 Carne cocida',g(['cocida','coc2','coc3','coc4','coc5'])],['🐟 Pescado',g(['fi1','fi2','fi3','fi4'])],['🍤 Pescado cocinado',g(['fc1','fc2','fc3','fc4'])],['🌾 Para tus mascotas y la pesca',g(['pasto','hierba','lazo','hil'])]];
  const ents=G.flatMap(x=>x[1]);
  return{title:'Comida y pesca',sub:'Lo que cazas y pescas se cocina en la Carpa del Cocinero para recuperar vida y maná.',ents,
   html:crumbs('Comida y pesca')+G.map(x=>'<h2>'+x[0]+'</h2>'+itg(x[1])).join('')+note('La carne y el pescado tienen cinco y cuatro calidades. Cocinados dan un efecto de recuperación durante 6 minutos y hasta es posible alimentar a tus mascotas.')};
};
VIEWS.materiales=a=>{
  const mi=I.min.filter(m=>!m.g).map(minEntry),gm=I.min.filter(m=>m.g).map(minEntry),dr=I.xmat.filter(m=>m.dr).map(xmEntry),sb=I.xmat.filter(m=>m.sub).map(xmEntry),ot=OTH.map(othEntry);
  const ents=[].concat(mi,gm,dr,sb,ot);
  return{title:'Minerales y materiales',sub:'Todo lo que se extrae, se caza o se talla: desde la piedra hasta la Lágrima de Lete.',ents,
   html:crumbs('Materiales')+'<h2>⛏️ Minerales</h2><p>Se sacan de las vetas del mapa con el pico. Cuanto más valioso, más difícil de encontrar.</p>'+itg(mi)
    +'<h2>💎 Gemas</h2><p>Aparecen en vetas de peligro medio y alto y se usan en potenciaciones avanzadas.</p>'+itg(gm)
    +'<h2>🐲 Materiales de dragón</h2><p>Solo los sueltan Ignarax y Glacius en los eventos mensuales.</p>'+itg(dr)
    +'<h2>🔥 Materiales del Submundo</h2><p>Trece materiales que caen de los monstruos del Submundo según su nivel: cuanto más profundo, más raros. Se gastan en la forja encantada.</p>'+itg(sb)
    +'<h2>🧰 Otros materiales</h2>'+itg(ot)};
};
VIEWS.herramientas=a=>{
  const ts=I.tool.map(toolEntry),ar=I.arrow.map(arrowEntry),ents=ts.concat(ar);
  return{title:'Herramientas y flechas',sub:'Picos para minar, palas para cavar, hachas para talar y flechas para el Arquero.',ents,
   html:crumbs('Herramientas')+'<h2>⛏️ Picos</h2>'+itg(ts.filter(e=>e.id.startsWith('t_pico')))+'<h2>🪏 Palas</h2>'+itg(ts.filter(e=>e.id.startsWith('t_pala')))+'<h2>🪓 Hachas</h2>'+itg(ts.filter(e=>e.id.startsWith('t_hacha')))+'<h2>🏹 Flechas</h2>'+itg(ar)
    +note('Las herramientas se desgastan con cada uso. Comprar otra del mismo tipo reemplaza la que tienes.')};
};
VIEWS.mochilas=a=>{
  const ents=I.bag.map(bagEntry);
  return{title:'Mochilas y bolsos',sub:'De 25 a 500 espacios: mochila de uso y bolsa de botín.',ents,
   html:crumbs('Mochilas')+itg(ents)+note('Solo la mochila de 40 y el Bolso de Fuego de 65 espacios caen como botín; las demás se entregan por misiones y jefes.')};
};
VIEWS.cofres=a=>{
  const ents=[].concat(I.key.map(k=>keyEntry(k,0)),I.key.map(k=>keyEntry(k,1)));
  return{title:'Cofres y llaves',sub:'Seis rarezas de llaves y cofres: la llave siempre abre un cofre de su rareza.',ents,
   html:crumbs('Cofres y llaves')+'<h2>🗝️ Llaves</h2>'+itg(ents.filter(e=>e.id[0]=='k'))+'<h2>📦 Cofres</h2>'+itg(ents.filter(e=>e.id[0]=='c'))
    +note('Las llaves salen de las misiones Difíciles, Muy difíciles y Brutales y de las cacerías. También existen los <b>Sellos</b> (Alba, Cuervo, Ocaso y Luna) de la <a href="#/cuevas">Cámara de los Cuatro Sellos</a>.')};
};
VIEWS.apariencias=a=>{
  const c=a[0]==null||a[0]===''?-1:cl(+a[0],0,7),sk=I.skin.filter(s=>c<0||s.c==c).map(skinEntry),tj=I.traj.filter(s=>c<0||s.c==c).map(trajEntry),ents=sk.concat(tj);
  const chips='<a class="cb'+(c<0?' on':'')+'" href="#/objetos/apariencias">Todas</a>'+clsChips(c,x=>'#/objetos/apariencias/'+x);
  return{title:'Apariencias y trajes',sub:'Cuatro apariencias de clase y tres trajes por héroe, con bonos permanentes.',ents,
   html:crumbs('Apariencias')+flt([['Clase',chips]])+'<h2>🧙 Apariencias de clase</h2>'+itg(sk)+'<h2>👘 Trajes</h2>'+itg(tj)
    +note('Las apariencias se compran con 💎 en la boutique. Los bonos solo cuentan para tu clase y tienen tope.')};
};

/* ---------- portada del catálogo ---------- */
function hub(){
  const cnt={sets:560*4,armeria:560*4,joyas:39*4,pociones:28,comida:I.prov.length,materiales:I.min.length+I.xmat.length+OTH.length,herramientas:I.tool.length+I.arrow.length,mochilas:I.bag.length,cofres:12,apariencias:I.skin.length+I.traj.length};
  const total=Object.values(cnt).reduce((a,b)=>a+b,0)+I.pets.length;
  const SAMP={sets:[EQ(0,9,0),EQ(1,9,1),EQ(2,9,0),EQ(3,9,0),EQ(4,9,0),EQ(5,9,0)].map(r=>r.v[3].ic),armeria:[BS(0,9,0),BS(1,9,1),BS(2,9,2),BS(3,9,0),BS(4,9,3),BS(5,9,5)].map(r=>r.v[3].ic),
   joyas:I.jw.filter(r=>r.i>=10).map(r=>r.v[3].ic).slice(0,6),pociones:[0,1,2,3,4,5,6].map(t=>I.pot[t].ic),comida:I.prov.slice(10,16).map(p=>p.ic),materiales:I.min.map(m=>m.ic2).slice(4,10),
   herramientas:[I.tool[3].ic,I.tool[7].ic,I.tool[11].ic,I.arrow[7].ic,I.arrow[5].ic],mochilas:I.bag.slice(5).map(b=>b.ic),cofres:I.key.slice(2).map(k=>k.cf).concat(I.key.slice(4).map(k=>k.kl)),apariencias:I.skin.filter(s=>s.t==3).map(s=>s.ic).slice(0,6)};
  const DESC={sets:'Diez conjuntos de siete piezas para cada clase, de nivel 50 a 1.200.',armeria:'Equipo básico a la venta en cada ciudad, con su precio.',joyas:'Anillos, amuletos y pendientes de trece niveles.',pociones:'Vida, maná, brebajes de guerra y esencias arcanas.',comida:'Carne, pescado y todo lo que se cocina.',materiales:'Minerales, gemas, escamas de dragón y materiales del Submundo.',herramientas:'Picos, palas, hachas y flechas.',mochilas:'De 25 a 500 espacios.',cofres:'Seis rarezas de llaves y cofres.',apariencias:'Apariencias de clase y trajes con bonos.'};
  const COL={sets:'#ffb020',armeria:'#4aa3ff',joyas:'#c46bff',pociones:'#ff5a5a',comida:'#ff9d1c',materiales:'#21d6c4',herramientas:'#c9a35a',mochilas:'#34d27b',cofres:'#ff4a6a',apariencias:'#b27bff'};
  return head('Catálogo de objetos','Todo el botín de Karavan Online, con sus sprites reales del juego y sus cuatro rarezas.','Objetos')
   +'<div class="stats hubn"><div class="stat"><label>Objetos y variantes<b>'+fmt(total)+'</b></label></div><div class="stat"><label>Piezas de equipo<b>'+fmt(560+560+39)+'</b></label></div><div class="stat"><label>Rarezas<b>4</b></label></div><div class="stat"><label>Categorías<b>'+VIEWS_LIST.length+'</b></label></div></div>'
   +'<div class="isrch"><input id="iq" type="search" placeholder="Buscar un objeto: espada, poción, mitril, anillo…" autocomplete="off" aria-label="Buscar objetos"><div id="ires" class="itg" hidden></div></div>'
   +'<div class="catg">'+VIEWS_LIST.map(v=>'<a class="cat" href="#/objetos/'+v[0]+'" style="--cc:'+COL[v[0]]+'"><span class="cat-ic">'+(SAMP[v[0]]||[]).slice(0,6).map(i=>KV.ic(i,1.4)).join('')+'</span><b>'+v[1]+' '+v[2]+'</b><small>'+DESC[v[0]]+'</small><em>'+fmt(cnt[v[0]])+' objetos</em></a>').join('')
   +'<a class="cat" href="#/mascotas" style="--cc:#34d27b"><span class="cat-ic">'+['dog','wolf','falcon','horse','camel','scorp'].map(k=>SPS('an-'+k+'-1',2)).join('')+'</span><b>🐎 Mascotas y monturas</b><small>Compañeros de combate y monturas veloces.</small><em>'+I.pets.length+' criaturas</em></a></div>'
   +note('<b>Cómo leer las rarezas:</b> cada pieza existe en <span style="color:#b9b9b9"><b>Común</b></span>, <span style="color:#4aa3ff"><b>Raro</b></span>, <span style="color:#c46bff"><b>Épico</b></span> y <span style="color:#ffb020"><b>Legendario</b></span>. Los atributos se multiplican ×1, ×1,6, ×2,4 y ×3,5. Más detalles en <a href="#/equipo">Rarezas y sets de clase</a>.');
}
P.objetos=(view,...a)=>{
  if(!view||!VIEWS[view]){ENTS=[];return hub()}
  const r=VIEWS[view](a);ENTS=r.ents||[];
  return head(r.title,r.sub,'Objetos')+catTabs(view)+r.html;
};
let ENTS=[];

/* búsqueda de objetos (portada del catálogo y buscador lateral) */
let OIDX=null;
function buildOIdx(){
  OIDX=[];const add=(t,s,r,ic,em)=>OIDX.push({t,s,r,ic,em,n:norm(t+' '+s)});
  I.eq.forEach(r=>add(r.n,'Set · '+CNAME(r.k)+' · '+SN[r.sl]+' nv '+fmt(r.rl),'#/objetos/sets/'+r.k+'/'+r.li+'~'+r.sl,r.v[0].ic));
  I.bas.forEach(r=>add(r.n,'Armería · '+CNAME(r.k)+' · '+SN[r.sl]+' nv '+r.L,'#/objetos/armeria/'+r.k+'/'+LVS.indexOf(r.L)+'~'+r.sl,r.v[0].ic));
  I.jw.forEach(r=>add(r.n,'Joya · '+SN[r.sl]+' nv '+fmt(r.rl),'#/objetos/joyas/'+r.sl+'~'+r.i+'_'+r.sl,r.v[0].ic));
  I.pot.forEach(p=>add(p.n,'Poción · nivel '+p.lv,'#/objetos/pociones~'+p.l+p.t,p.ic));
  I.prov.forEach(p=>add(p.n,'Comida y pesca','#/objetos/comida~'+p.k,p.ic));
  I.min.forEach(m=>add(m.n,(m.g?'Gema':'Mineral'),'#/objetos/materiales~m_'+m.k,m.ic2));
  I.xmat.forEach(m=>add(m.n,m.dr?'Material de dragón':'Material del Submundo','#/objetos/materiales~x_'+m.k,m.ic));
  OTH.forEach(o=>add(o[1],'Material','#/objetos/materiales~o_'+o[0],o[5]?o[5].ic:null,o[4]));
  I.tool.forEach(t=>add(t.n,'Herramienta','#/objetos/herramientas~t_'+t.kd+t.t,t.ic));
  I.arrow.forEach(t=>add(t.n,'Flecha','#/objetos/herramientas~a_'+t.i,t.ic));
  I.bag.forEach(b=>add(b.n,'Mochila · '+b.cap+' espacios','#/objetos/mochilas~b_'+b.cap,b.ic));
  I.key.forEach(k=>{const kn=['Común','Poco común','Rara','Épica','Legendaria','Mítica'][k.i-1].toLowerCase();add('Llave '+kn,'Llave','#/objetos/cofres~k'+k.i,k.kl);add('Cofre '+kn,'Cofre','#/objetos/cofres~c'+k.i,k.cf)});
  I.skin.forEach(s=>add(s.n,'Apariencia · '+CNAME(s.c),'#/objetos/apariencias/'+s.c+'~s_'+s.id,s.ic));
  I.traj.forEach(q=>add(q.n,'Traje · '+CNAME(q.c),'#/objetos/apariencias/'+q.c+'~j_'+q.id,null,'👘'));
}
function searchItems(q,lim){
  if(!OIDX)buildOIdx();const ks=norm(q.trim()).split(/\s+/).filter(Boolean);if(!ks.length)return[];
  const r=[];for(const x of OIDX){if(ks.every(k=>x.n.includes(k))){r.push(x);if(r.length>=lim)break}}return r;
}

/* ---------- ventana de detalle de un objeto ---------- */
let DLG=null,DLGE=null,DLGF=null;
function dlgBuild(){
  DLG=document.createElement('div');DLG.className='dlg';DLG.hidden=true;
  DLG.innerHTML='<div class="bg"></div><div class="bx" role="dialog" aria-modal="true" aria-label="Detalle del objeto"></div>';document.body.appendChild(DLG);
  DLG.addEventListener('click',e=>{
    if(e.target.classList.contains('bg')||e.target.closest('.x')){dlgClose(true);return}
    const n=e.target.closest('[data-dn]');if(n)dlgStep(+n.dataset.dn);
  });
  addEventListener('keydown',e=>{
    if(DLG.hidden)return;
    if(e.key==='Escape'){dlgClose(true)}else if(e.key==='ArrowRight')dlgStep(1);else if(e.key==='ArrowLeft')dlgStep(-1);
    else if(e.key==='Tab'){const f=$$('button,a[href]',DLG).filter(x=>x.offsetParent!==null);if(!f.length)return;const a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}
  });
  let sx=0,sy=0;
  DLG.addEventListener('touchstart',e=>{const t=e.changedTouches[0];sx=t.clientX;sy=t.clientY},{passive:true});
  DLG.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dx)>80&&Math.abs(dx)>Math.abs(dy)*1.8)dlgStep(dx<0?1:-1)},{passive:true});
}
function dlgOpen(e,keep){
  if(!DLG)dlgBuild();
  const i=ENTS.indexOf(e),bx=DLG.querySelector('.bx');
  bx.style.setProperty('--rc',e.c);
  bx.innerHTML='<button class="x" aria-label="Cerrar">✕</button><div class="big">'+iconOf(Object.assign({},e,{k:3}))+'</div><h3>'+esc(e.n)+'</h3><div class="sub">'+e.sub+'</div>'+e.dlg()
   +(ENTS.length>1?'<div class="dnav"><button data-dn="-1" aria-label="Anterior">‹ Anterior</button><span>'+(i+1)+' / '+ENTS.length+'</span><button data-dn="1" aria-label="Siguiente">Siguiente ›</button></div>':'');
  bx.scrollTop=0;
  if(!DLGE||DLG.hidden)DLGF=document.activeElement;
  DLGE=e;DLG.hidden=false;document.body.classList.add('hv-open');
  if(!keep){const x=bx.querySelector('.x');x&&x.focus()}
  try{history.replaceState(null,'','#/objetos/'+e.v+'~'+e.id)}catch(_){}
}
function dlgStep(d){if(!DLGE||!ENTS.length)return;const i=(ENTS.indexOf(DLGE)+d+ENTS.length)%ENTS.length;dlgOpen(ENTS[i],true)}
function dlgClose(restore){
  if(!DLG||DLG.hidden)return;DLG.hidden=true;document.body.classList.remove('hv-open');
  if(restore&&DLGE){try{history.replaceState(null,'','#/objetos/'+DLGE.v)}catch(_){}}
  DLGE=null;try{DLGF&&DLGF.focus&&DLGF.focus()}catch(_){}
}
const dlgById=id=>{const e=ENTS.find(x=>String(x.id)===String(id));if(e)dlgOpen(e);return !!e};
document.addEventListener('click',ev=>{
  const a=ev.target.closest&&ev.target.closest('a.it[data-e]');if(!a||ev.metaKey||ev.ctrlKey||ev.shiftKey||ev.button)return;
  const e=ENTS.find(x=>String(x.id)===a.dataset.e);if(!e)return;ev.preventDefault();dlgOpen(e);
});

/* ---- bloques conservados de la wiki anterior (datos reales del juego) ---- */
P.guia=()=>head('Guía del recién llegado','Tus primeros pasos en la Ruta')
 +'<h2>Tutorial del juego</h2><ul>'+W.tuto.map(t=>'<li>'+esc(t)+'.</li>').join('')+'</ul>'
 +'<h2>Consejos rápidos</h2><ul>'
 +'<li><b>Elige clase según cómo quieras jugar:</b> tanque (Caballero, Enana), mucho daño (Mago, Arquero), apoyo (Sanador), técnico (Monje, Elfa) o negocios (Mercader). <a href="#/clases">Ver clases</a>.</li>'
 +'<li><b>El nivel solo sube vida y maná.</b> Tu poder de combate (daño, defensa y agilidad) sale de las 3 skills que entrenas en la Carpa. <a href="#/entrenamiento">Cómo entrenar</a>.</li>'
 +'<li><b>Toca 🎁 para recoger el botín</b> o activa el servicio de loot automático. <a href="#/premium">Servicios</a>.</li>'
 +'<li><b>Los monstruos no sueltan oro:</b> véndele equipo al NPC (25 %) o a otros jugadores, haz misiones y derrota jefes. <a href="#/farmeo">Cómo conseguir oro</a>.</li>'
 +'<li><b>Si mueres pierdes XP y casi todo tu botín.</b> La Bendición te deja conservar mochila, carga y oro.</li>'
 +'<li><b>Cocina tu carne y pescado</b> en la Carpa del Cocinero (suroeste de la ciudad) para recuperar vida y maná.</li>'
 +'<li><b>Las ciudades están a salvo.</b> Los enemigos más duros viven lejos: sigue el camino de Chang\'an hacia el oeste. <a href="#/mundo">Mapa y tierras</a>.</li></ul>'
 +note('Los niveles recomendados de las tierras suben de 1 hasta 29 en el mapa base; los jefes, cuevas y la Torre del Lago van mucho más allá.');

const skillHtml=s=>'<div class="skill"><div class="i">'+s.ic+'</div><div><h4>'+esc(s.n)+'</h4><p>'+esc(dc(s.d))+'</p><div class="m">'+(s.lv?pill('Nivel '+s.lv):'')+pill('💧 '+s.mp+' MP')+pill('⏱ '+fmt(s.cd)+' s')+'</div></div></div>';
const setHtml=s=>'<div class="set"><div class="lv">'+fmt(s.lv)+'<small>NIVEL</small></div><div class="pcs"><b>'+esc(s.p[0])+'</b> · '+s.p.slice(1).map(esc).join(' · ')+'</div></div>';

P.skills=(cid)=>{
  cid=+cid||0;const c=W.classes[cid];
  return head('Habilidades','Las 12 habilidades de cada clase se desbloquean por nivel.')
  +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 22px">'+W.classes.map(x=>'<a class="btn" style="padding:9px 14px;font-size:12px;'+(x.id==cid?'background:rgba(230,182,79,.3)':'')+'" href="#/skills/'+x.id+'">'+x.ic+' '+x.n+'</a>').join('')+'</div>'
  +'<h2>'+c.ic+' '+c.n+'</h2><div class="sk">'+c.skills.map(skillHtml).join('')+'</div>'
  +note('Los valores de MP son los del nivel 1. El costo y la recarga de MP crecen junto con tu reserva a medida que subes de nivel, así que el maná siempre pesa.');
};

P.entrenamiento=()=>head('Entrenamiento','La Carpa de Entrenamiento: donde se forja tu poder')
 +note('<b>Regla de oro:</b> el nivel (máximo '+fmt(W.train_skill.lvmax)+') solo sube tu <b>vida y tu maná</b>. Tu <b>poder</b> (daño, defensa y agilidad) sale de tres skills que se entrenan en la Carpa, cada una hasta el nivel '+W.train_skill.max+'.')
 +'<h2>Las tres skills</h2><div class="stats">'+['Ataque','Defensa','Agilidad'].map((n,i)=>'<div class="stat"><label>'+W.train_skill.icons[i]+' '+n+'<b>hasta '+W.train_skill.max+'</b></label><div class="bar"><i style="width:100%"></i></div></div>').join('')+'</div>'
 +'<h2>Los tres ritos</h2><p>Haces una ofrenda de oro <b>por cada hora</b> de entrenamiento y tu héroe pelea solo contra espíritus que renacen sin parar. Cada rito sirve para un rango de skill.</p>'
 +tbl(['Rito','Ofrenda por hora','Enemigos','Puntos por hora','Skill (mín–máx)','Rival'],W.train.map(t=>[t.ic+' '+esc(t.n),fmt(t.of)+' 🪙',t.N,fmt(t.pph),t.min+' – '+t.cap,esc(t.d)]),[1,2,3])
 +'<h2>Puntos para subir cada skill</h2>'+tbl(['De la skill','Puntos para pasar a la siguiente'],W.train_skill.need.map(x=>[x[0],fmt(x[1])]),[0,1])
 +note('La dificultad crece un 7% por cada nivel de skill. Entrenar los primeros niveles es rápido; los últimos hasta '+W.train_skill.max+' son una maratón reservada para los jugadores más dedicados.')
 +'<h2>Área de skill por clase</h2>'+tbl(['Clase','Se entrena como'],W.classes.map(c=>[c.ic+' '+c.n,esc(c.skill_area)]));

P.farmeo=()=>{
  const f=W.farm;
  return head('Farmeo, oro y botín','Los monstruos ya no sueltan oro: aquí está de dónde sale y en qué se gasta')
  +note('<b>Los monstruos ya no llevan dinero encima.</b> Lo que sueltan es <b>equipo, pociones, carne y materiales</b>. El oro entra por vender equipo, las misiones, los jefes, el comercio de caravanas y los mercados de jugadores.')
  +'<h2>XP y botín por tipo de enemigo</h2><p>Los valores son <b>base</b>: se multiplican por tus bonos de equipo y los servicios que actives. Los enemigos de élite y de horda dan más.</p>'
  +tbl(['Enemigo','Nivel ref.','XP base','Equipo','Poción de vida','Poción de maná','Carne'],f.map(x=>[x.ic+' '+esc(x.n),x.lv,x.xp,Math.round(x.pi*100)+'%',Math.round(x.pp*100)+'%',Math.round(x.pm*100)+'%',x.pc?Math.round(x.pc*100)+'%':'—']),[1,2,3,4,5,6])
  +'<h2>Cuántas muertes cuesta cada nivel</h2><p>Contra enemigos de tu mismo nivel y sin bonos, subir un nivel cuesta aproximadamente:</p>'
  +tbl(['Tu nivel','Muertes por nivel'],[['1 a 5','≈ 30 a 55 (30 % menos)'],['10','≈ 295'],['30','≈ 1.900'],['50','≈ 4.540'],['100','≈ 14.750'],['200','≈ 47.900'],['300','≈ 95.500']],[1])
  +'<p>Un enemigo de <b>más nivel</b> que tú da hasta un 40 % extra (4 % por cada nivel de diferencia) y uno muy por debajo de tu nivel da cada vez menos. Los enemigos de élite y de horda dan más, y con tu equipo y tus servicios la cuenta baja.</p>'
  +'<p>El <b>equipo</b> de los monstruos se vende al NPC o a otros jugadores. Los enemigos de élite pueden soltar equipo de verdad, y los jefes y la Torre del Lago, el mejor.</p>'
  +'<h2>De dónde sale el oro</h2><ul>'
  +'<li><b>Vender equipo:</b> el NPC paga el <b>25 %</b> del valor de la pieza (<b>45 %</b> con la Licencia de Mercader). En la 🛡️ Armería puedes marcarlas una a una o usar <b>💰 Vender todo el loot</b> (conserva lo épico, legendario y mejorado). A otros jugadores puedes pedirles lo que quieras en el Mercado.</li>'
  +'<li><b>Misiones, Cacería y jefes:</b> las recompensas en oro vienen de aquí. <a href="#/misiones">Ver misiones</a>.</li>'
  +'<li><b>Comercio:</b> el Mercader abre su tienda ambulante y las caravanas llevan mercancía entre ciudades.</li></ul>'
  +'<h2>En qué se gasta</h2>'+tbl(['Gasto','Cuánto cuesta'],[['🙏 Bendición de la Iglesia','1.500 × 1,17 elevado al nivel (con tope en el nivel 30; después suma 1.500 por cada nivel más)'],['🔧 Reparar en la Herrería','35 % del valor de lo perdido'],['🕯️ Ritos de entrenamiento','8.000 · 80.000 · 400.000 🪙 por hora, según el rito'],['⬆️ Subir de nivel','Pide un 25 % más de XP que antes (a nivel 100: 492.000 XP)']],[])
  +'<h2>Cómo farmear mejor</h2><ul>'
  +'<li><b>Activa el loot automático</b> para no perder botín mientras peleas. <a href="#/premium">Ver servicios</a>.</li>'
  +'<li><b>Sube a zonas de más peligro cuando tu equipo aguante:</b> el equipo que sueltan es de más nivel y se vende mejor.</li>'
  +'<li><b>Saquea los cuerpos con 💰</b> antes de que pasen 60 segundos. <a href="#/monstruos">Cómo funcionan</a>.</li>'
  +'<li><b>Repártete por el mapa:</b> cada celda tiene una batería de reapariciones que se recarga en 90 días, y las vetas, los árboles y los peces del mundo se agotan para todos. Tope por cuenta y día: 60 vetas, 120 árboles y 150 peces.</li>'
  +'<li><b>Caza presas y cocina:</b> la carne cocida recupera vida y maná (2% cada 5 s la común, hasta 6% la legendaria) durante 6 minutos.</li>'
  +'<li><b>Usa las misiones diarias</b> para sumar XP y oro extra. <a href="#/misiones">Ver misiones</a>.</li>'
  +'<li><b>El Mercader es una tienda ambulante:</b> compra y vende objetos a otros jugadores desde su carruaje (ya no comercia bienes).</li></ul>'
  +'<h2>Nivel de Caza</h2><p>Cada presa cuenta para tu Nivel de Caza, que mejora la calidad de la carne.</p>'+tbl(['Nivel de Caza','Presas necesarias'],W.hz.map((n,i)=>[i+1,fmt(n)]),[0,1]);
};

P.misiones=()=>head('Misiones diarias','Objetivos que se renuevan cada día')
 +tbl(['','Misión',...W.dqd],W.dq.map(q=>[q.ic,esc(q.n),...q.tg.map(t=>t?fmt(t):'—')]),[2,3,4,5])
 +'<p><small>Las cantidades son la meta según la dificultad de la misión. Cuanto más difícil, mayor la recompensa.</small></p>';

P.carpas=()=>head('Carpas y edificios','Los servicios que encuentras en cada ciudad')
 +'<div class="grid g3">'+W.bld.map(b=>'<div class="card"><span class="ico">'+b.ic+'</span><h3>'+esc(b.n)+'</h3><p>'+esc(b.d)+'</p></div>').join('')+'</div>';

P.premium=()=>head('Servicios premium','Se pagan con gemas. Mejoran la comodidad, no la fuerza')
 +note('<b>👑 Lo más sencillo: un plan.</b> El <b>Plan Jugador</b> (7 💎 por 30 días, 4 💎 por 15) trae loot automático, poción automática, comercio y Mercado, Licencia de Cazador y distintivo. El <b>Plan Mercader</b> (10 💎 por 30 días, 6 💎 por 15; solo clase Mercader) incluye <b>todo el Plan Jugador</b> y además Escolta de caravana y Licencia de Mercader: <b>no se pagan dos VIP</b> (por separado costaría 20 💎). Los servicios sueltos de la tabla siguen disponibles, pero el plan sale más barato.')
 +tbl(['','Servicio','Qué hace','Duración y precio'],W.prem.map(p=>[p.ic,'<b>'+esc(p.n)+'</b>',esc(p.d),p.dur.map((d,i)=>d+' días: '+gem(p.p[i])).join('<br>')]))
 +note('Máximo 90 días acumulados por servicio. Todas las gemas valen para todo: servicios, apariencias, Bonus, boletos y gremios, vengan de una recarga, del Mercado de Gemas o de otro jugador.')
 +note('<b>🌐 Traducción del chat:</b> 10 💎 por 30 días. Pulsa 🌐 junto a cualquier mensaje de otro idioma para leerlo en el tuyo. Elegir tu idioma es gratis.');

P.gremios=()=>head('Gremios y territorios','Une a tus amigos y reclama tu pedazo de la Ruta')
 +'<div class="stats"><div class="stat"><label>Fundar un gremio<b>'+W.guild.gems+' 💎</b></label></div><div class="stat"><label>Miembros máximos<b>'+W.guild.max+'</b></label></div><div class="stat"><label>Etiqueta<b>2 a 4 letras</b></label></div><div class="stat"><label>Nombre<b>3 a 20 letras</b></label></div></div>'
 +'<h2>Territorios</h2><p>Los gremios pueden construir en el mundo con madera, piedra y hierro:</p><p>'+Object.values(W.terr).map(x=>pill(esc(x))).join(' ')+'</p>'
 +'<h2>Lo que cuesta</h2>'+tbl(['Concepto','Gemas','Detalle'],[['🏰 Fundar el gremio','10 💎','Se paga <b>una sola vez</b>. No hay mensualidad ni mantenimiento.'],['🛡️ Territorio pequeño','8 💎','Desde 5 miembros · 100.000 🪙 del tesoro · tributo semanal: el mayor entre 2.500 🪙 y el 2 % del tesoro ÷ 4'],['🛡️ Territorio mediano','20 💎','Desde 50 miembros · 400.000 🪙 del tesoro · tributo semanal: el mayor entre 10.000 🪙 y el 3 % del tesoro ÷ 4'],['🛡️ Territorio grande','45 💎','Desde 150 miembros · 1.200.000 🪙 del tesoro · tributo semanal: el mayor entre 30.000 🪙 y el 5 % del tesoro ÷ 4'],['📐 Planos de construcción','Muralla 3 · Puerta 2 · Torre 5 · Casa 8','Se compran <b>una sola vez por gremio</b>; después se construye con madera, piedra y hierro.']],[])
 +note('El <b>territorio es opcional</b>. Tras reclamarlo, el <b>primer mes no se paga tributo</b>; después sale del <b>tesoro del gremio</b>, no de las gemas de nadie.')
 +note('Define el mensaje del día, la descripción y el modo de entrada desde los Ajustes del gremio.');

P.eventos=()=>{const M=['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return head('Eventos y estaciones','El mundo cambia con el calendario')
  +'<h2>Eventos</h2>'+tbl(['','Evento','Fechas'],W.events.map(e=>[e.ic,esc(e.n),e.a?e.a[1]+' de '+M[e.a[0]]+' – '+e.b[1]+' de '+M[e.b[0]]:'Según el calendario lunar']))
  +'<h2>Estaciones</h2><div class="hits cols">'+W.seasons.map((s,i)=>'<a class="hit" href="#/clima" style="--hc:'+['#8fd4ff','#ff9ed2','#ffd24a','#ff9a3d'][i]+'"><b>'+s.ic+' '+s.n+'</b><small>'+['Diciembre – Febrero','Marzo – Mayo','Junio – Agosto','Septiembre – Noviembre'][i]+' · ver el clima</small></a>').join('')+'</div>'
  +'<p>La estación cambia la apariencia del mundo según el mes. Durante Noche de Brujas aparecen enemigos y tesoros especiales.</p>'
  +'<h2>Dragones</h2><p>Tres veces al mes baja <b>Ignarax</b> o <b>Glacius</b>. Ver <a href="#/celestiales">Celestiales y dragones</a>.</p>';};

/* ---------- clima (datos tomados de la lógica real del juego) ---------- */
const WX=[
 ['clear','☀️','Despejado','Sin efectos. Ideal para farmear tranquilo.',[]],
 ['rain','🌧️','Lluvia','Los caminos se embarran con charcos y tu antorcha se gasta 40% más rápido.',['Visión 85%','Antorcha ×1,4','Empuje leve','−3°']],
 ['storm','⛈️','Tormenta','Caen rayos ⚡ que golpean a los enemigos cercanos… y a ti si estás debajo y sin refugio (12% de tu vida máxima, nunca te matan).',['Visión 75%','Antorcha ×1,8','Viento fuerte','−4°']],
 ['snow','🌨️','Nevada','La nieve se acumula y te frena hasta 28%. Los caminos que pisas se despejan.',['Visión 85%','Antorcha ×1,2','−5°']],
 ['blizzard','❄️','Ventisca','El viento te empuja, casi no ves y la nieve se acumula rápido. Busca refugio en una ciudad.',['Visión 50%','Antorcha ×2,4','Empuje máximo','−12% velocidad extra','−11°']],
 ['wind','🍂','Vendaval','Vuelan hojas. El viento desvía tus flechas y hechizos, y empuja al jugador.',['Visión 92%','Antorcha ×1,5','Desvía proyectiles','−2°']],
 ['heat','🥵','Ola de calor','Correr te cansa mucho más rápido (gasto de energía ×1,6) si hace más de 34°.',['Energía ×1,6','+9°']],
 ['sand','🏜️','Tormenta de arena','Poca visibilidad y el viento te empuja. Solo en el desierto (fuera de él se vuelve vendaval).',['Visión 55%','Antorcha ×1,3','Energía ×1,2','−12% velocidad extra','+3°']],
 ['fog','🌫️','Niebla','Ves poco, pero los enemigos también a ti.',['Visión 50%','−2°']],
 ['petal','🌸','Brisa de pétalos','Solo adorna: pétalos en el aire, sin penalizaciones.',[]]
];
const SZN=[['inv','❄️','Invierno','Diciembre – Febrero',2,[['snow',4],['clear',3],['blizzard',2],['fog',1]],'Nevadas y ventiscas. La nieve se acumula y se derrite lento.'],
 ['pri','🌸','Primavera','Marzo – Mayo',18,[['clear',4],['rain',3],['petal',2],['storm',1],['fog',1]],'Lluvias, tormentas con rayos y pétalos en el aire.'],
 ['ver','☀️','Verano','Junio – Agosto',30,[['clear',4],['heat',3],['storm',1],['sand',1],['rain',1]],'Olas de calor y tormentas de arena. Cuida tu energía.'],
 ['oto','🍂','Otoño','Septiembre – Noviembre',20,[['clear',3],['rain',3],['wind',3],['fog',2],['storm',1]],'Vendavales de hojas, lluvia y niebla.']];
const WXN={};WX.forEach(w=>WXN[w[0]]=w);
P.clima=()=>head('Clima y estaciones','El mundo cambia: lluvia, rayos, nieve que se acumula, calor y tormentas de arena. Es el mismo clima para todos los jugadores.')
 +note('<b>Cómo funciona:</b> la estación sigue el calendario real. Cada <b>8 minutos</b> el servidor sortea el clima según la estación (igual para todos) y el terreno lo adapta: en el desierto la lluvia se vuelve arena; en las montañas y el hielo, nieve. Las <b>ciudades, templos, cuevas y mazmorras</b> te protegen de todo.')
 +'<h2>Las cuatro estaciones</h2><div class="grid g4">'+SZN.map(s=>{const tot=s[5].reduce((a,x)=>a+x[1],0);return '<div class="card"><span class="ico">'+s[1]+'</span><h3>'+s[2]+'</h3><small style="color:var(--mute)">'+s[3]+' · base '+s[4]+'°</small><p style="margin:8px 0">'+s[6]+'</p><div style="display:grid;gap:5px">'+s[5].map(x=>'<div class="hst" style="font-size:14px"><label>'+WXN[x[0]][1]+' '+WXN[x[0]][2]+'<b>'+Math.round(100*x[1]/tot)+'%</b></label><div class="bar"><i style="width:'+(100*x[1]/tot)+'%"></i></div></div>').join('')+'</div></div>'}).join('')+'</div>'
 +'<h2>Tipos de clima y sus efectos</h2>'+tbl(['Clima','Qué hace','Detalles'],WX.map(w=>[w[1]+' <b>'+w[2]+'</b>',w[3],w[4].map(x=>pill(x)).join(' ')||'—']))
 +'<h2>El terreno cambia el clima</h2>'+tbl(['Terreno','Qué pasa','Temperatura'],[
   ['🏜️ Desierto','Lluvia, tormenta y ventisca se vuelven <b>tormenta de arena</b>; nieve, niebla y pétalos desaparecen.','+6° (y oscila ±7° entre día y noche)'],
   ['⛰️ Montaña','Lluvia → nieve, tormenta → ventisca, sin calor. Siempre hay algo de nieve en el suelo.','−9°'],
   ['🧊 Hielo / Pamir','Igual que la montaña, pero con nieve permanente y mucho más frío.','−18°'],
   ['🌲 Bosque','Clima normal, un poco más fresco.','−2°'],
   ['🌾 Estepa','Clima normal; la arena se vuelve vendaval.','−1°'],
   ['🏞️ Cañón','Clima normal; la arena se vuelve vendaval.','+2°'],
   ['🟢 Llanura / Cenizas','Clima normal.','0°']
 ])
 +'<h2>Temperatura</h2><p>Temperatura = base de la estación + terreno + clima + un vaivén de día y noche (más caliente a media tarde, más frío de madrugada).</p>'
 +tbl(['Efecto','Cuándo','Consecuencia'],[
   ['🥶 Mucho frío','Menos de −4° y sin antorcha encendida','Vas 8% más lento y recuperas solo 60% del MP. <b>Enciende tu antorcha 🔦 o llamas 🔥.</b>'],
   ['🥵 Mucho calor','Más de 34° al aire libre','Correr gasta 60% más energía.']
 ])
 +'<h2>El suelo recuerda</h2><ul>'
 +'<li><b>Nieve acumulada:</b> crece mientras nieva (más rápido con ventisca) y se derrite con el calor. Frena hasta 28% tu velocidad.</li>'
 +'<li><b>Huellas:</b> al caminar sobre la nieve despejas el camino y te frena menos; si nieva de nuevo, se vuelve a cubrir.</li>'
 +'<li><b>Charcos:</b> con lluvia el suelo se moja y brillan los charcos; la movilidad baja un 8%. Los caminos se oscurecen con el barro.</li>'
 +'<li><b>Ciudades:</b> los techos se cubren de nieve y gotean cuando llueve.</li></ul>'
 +'<h2>Rayos de la tormenta</h2><p>Durante una tormenta caen rayos cada pocos segundos (más seguido si es intensa). Cada rayo hace un daño fuerte a los enemigos en su zona, y si te cae al lado sin refugio te quita el 12% de tu vida máxima (nunca te deja en 0). Se ven y se oyen: el trueno llega después según la distancia.</p>'
 +'<h2>Consejos</h2><ul><li>Entra a una ciudad o templo para esperar una ventisca, o aprovecha: los enemigos también te ven menos con niebla.</li><li>Lleva antorcha siempre en invierno y en cuevas frías.</li><li>Arqueros y magos: con vendaval tus proyectiles se desvían, acércate un poco más.</li><li>Cuando llueve o hay tormenta, farmea cerca de una ciudad para refugiarte.</li></ul>'
 +'<p>Los eventos especiales (Noche de Brujas, Navidad, Nowruz…) también cambian el ambiente: mira <a href="#/eventos">Eventos y estaciones</a>.</p>';

P.submundo=()=>head('El Submundo del Templo de los Celestiales','Un mundo entero bajo las ruinas griegas · mobs míticos nv 40–350 · Portón de Fuego y Balor')
 +note('<b>Cómo se entra:</b> en el centro del <b>Templo de los Celestiales</b>, un templo griego en ruinas sobre una meseta, queda la boca del Submundo, rodeada por las estatuas del León, el Caballo y el Buey Celestiales. Hace falta el servicio <b>VIP de 7 '+'💎</b> o el <b>Combo Cazador de 3 '+'💎</b> activo. Si el servicio se acaba mientras estás abajo, te devuelve al templo.')
 +'<p>El Submundo tiene el mismo tamaño que el mapa de arriba, pero está hecho de cuevas y galerías: caminos que se abren, se cruzan y se pierden. Todo lo que ves son ruinas, ríos de lava y criaturas de la mitología.</p>'
 +'<h2>Zonas y monstruos</h2><p>Cuanto más lejos del inicio, más fuertes son los monstruos: <b>nivel 40 al empezar y hasta 350</b> cerca del final. Su vida, su daño y lo que dan al morir suben con su nivel.</p>'
 +tbl(['Zona','Qué te encuentras'],[
  ['Galerías de Hades','Trasgos, orcos del Tártaro, arácnidos de Aracne, escorpiones, hoplitas esqueleto'],
  ['Laberinto del Minotauro','Minotauros, cíclopes, sátiros abisales, autómatas de Hefesto, carneros dorados'],
  ['Nido de las Lamias','Lamias, medusas, cocodrilos del Estigia, náyades corruptas'],
  ['Campos de Asfódelos','Centauros caídos, nigromantes de Hécate, psicopompos, sombras de Caronte'],
  ['Ríos de Fuego','Diablos del Flegetonte, demonios de brasas, súcubos, titanes sangrientos, Cerbero'],
  ['Puertas del Tártaro','Demonios ardientes, arcángeles caídos, archidemonios, grandes demonios, titanes de piedra']])
 +'<h3>Criaturas míticas que verás</h3><div class="mons">'+[['mn-mino','Minotauro','Laberinto del Minotauro'],['mn-medu','Medusa','Nido de las Lamias'],['mn-lami','Lamia','Nido de las Lamias'],['mn-croc','Cocodrilo del Estigia','Nido de las Lamias'],['mn-wormg','Gusano de la galería','Submundo'],['mn-were','Hombre lobo','Submundo']].map(m=>'<div class="mon">'+spBase(m[0],3.6,1)+'<span><b>'+m[1]+'</b><small>'+m[2]+'</small></span></div>').join('')+'</div>'
 +'<h2>El Refugio</h2><p>En el camino, antes del final, queda un <b>pequeño pueblo destruido y disperso</b>. No hay gente por las calles: los vendedores están escondidos y no salen, pero atienden en sus puertas.</p>'
 +'<ul><li><b>Zona segura:</b> nadie te puede atacar dentro del Refugio.</li><li><b>Punto de reaparición:</b> si mueres en el Submundo, vuelves al Refugio.</li><li><b>Servicios:</b> Posada, Iglesia, Herrería, Armería, Botica, Materiales, Carpa del Almacén y Carpa del Cocinero. Todo en pequeño.</li></ul>'
 +'<h2>La cueva del Portón de Fuego</h2><p>Al fondo del Submundo hay una cueva con un <b>portón enorme, rodeado de fuego</b>, cerrado a cal y canto. Delante del portón hay <b>8 placas</b> en el suelo.</p>'
 +'<ul><li>El portón solo se abre cuando <b>8 héroes están a la vez sobre las 8 placas</b>. Da igual si van en party o no.</li><li>Si alguien se baja, el portón se vuelve a cerrar.</li></ul>'
 +'<h2>Balor, Señor del Portón</h2><div class="stats"><div class="stat"><label>Nivel<b>400</b></label></div><div class="stat"><label>Vida<b>20.000.000</b></label></div><div class="stat"><label>Elemento<b>🔥 Fuego</b></label></div></div>'
 +'<p>Al abrirse el portón sale <b>Balor</b>, un demonio enorme. Su vida es <b>compartida</b> entre todos los que lo pelean, y es un jefe de paso: <b>solo da experiencia y oro</b>, con mucha más experiencia que oro. Al derrotarlo queda abierto el camino al <b>Infierno</b>.</p>'
 +note('El Infierno (lava, ríos de fuego, demonios y goblins más fuertes) es el mapa de la <b>temporada 2</b>. Por ahora el portal al final de la cueva todavía no lleva a ningún sitio.')
 +'<h2>Botín del Submundo</h2>'+tbl(['Qué','Probabilidad','Detalle'],[
  ['Equipo común','12%','Nivel 30, 50 o 60 al azar; sus estadísticas suben con el nivel'],
  ['🔥 Bolso de Fuego','5%','Mochila o bolsa de loot de <b>65 espacios</b>. Máximo 2 en tu poder'],
   ['Experiencia','siempre','Nivel del monstruo → 1/700 de lo que cuesta subir ese nivel']],[1])
 +'<p>Ejemplos de experiencia por monstruo: nivel 40 → 64 · nivel 100 → 562 · nivel 200 → 3.565 · nivel 300 → 11.066 · nivel 350 → 17.147.</p>';


/* =====================================================================
   PÁGINAS
   ===================================================================== */
const spBase=(b,k,an)=>{const n=KV.spXY(b+'-down-1')?b+'-down-1':b+'-1';return an?SP(n,k):SPS(n,k)};
const fig=(src,cap,sub,cls)=>'<figure class="shot'+(cls?' '+cls:'')+'"><img src="'+src+'" alt="'+esc(cap)+'" loading="lazy" decoding="async"><figcaption>'+esc(cap)+(sub?'<small>'+esc(sub)+'</small>':'')+'</figcaption></figure>';
const NEWS=[]; /* se rellena más abajo */

/* ---------- Inicio ---------- */
P.inicio=()=>{
  const groups=NAV.map(g=>'<div class="gcard" style="--gc:'+g[1]+'"><h3>'+g[0]+'</h3>'+g[2].filter(x=>x[0]!='inicio').map(x=>'<a href="#/'+x[0]+'"><span>'+x[1]+'</span>'+x[2]+'</a>').join('')+'</div>').join('');
  const facts=[['⚔️','8','clases'],['🎒','+4.800','objetos'],['🗺️','16','tierras'],['🏛️','12','ciudades-oasis'],['🕳️','12','mazmorras y cuevas'],['🐎',I.pets.length,'mascotas y monturas']];
  return '<section class="wkh"><img class="wkl" src="kv-logo.webp" alt="Karavan Online" width="1500" height="696"><div class="wkt"><span class="eyebrow">Wiki oficial</span><h1>Todo sobre el reino de las caravanas</h1><p>Clases, objetos con sus sprites reales, mapas, cuevas, mascotas y secretos, sacados directamente de los datos del juego.</p>'
   +'<div class="wk-s"><input id="q2" type="search" placeholder="Buscar: Mago, mitril, Torre del Lago…" autocomplete="off" aria-label="Buscar en la wiki"></div>'
   +'<div class="wk-b"><a class="btn btn-gold btn-sm" href="play.html">⚔ Jugar ahora</a><a class="btn btn-sm" href="#/guia">🧭 Guía del recién llegado</a><a class="btn btn-sm" href="#/objetos">🎒 Catálogo de objetos</a></div></div></section>'
   +'<div class="stats wk-f">'+facts.map(f=>'<div class="stat"><label><span>'+f[0]+' '+f[2]+'</span><b>'+f[1]+'</b></label></div>').join('')+'</div>'
   +'<div class="quote">'+esc(L.world.quote)+'</div>'
   +'<h2>Explora por tema</h2><div class="gg">'+groups+'</div>'
   +'<h2>Los 8 héroes</h2><p>Toca una carta para ver a tu héroe tal como se ve en el juego, con su historia y sus habilidades.</p><div class="hgrid hg2">'+W.classes.map(c=>KV.heroCard(c.id)).join('')+'</div>'
   +'<h2>Lo más nuevo</h2><div class="hits cols">'+NEWS.slice(0,3).map(n=>'<a class="hit" href="#/novedades" style="--hc:'+n.c+'"><b>'+n.ic+' '+n.t+'</b><small>'+n.v+' · '+n.s+'</small></a>').join('')+'</div>';
};

/* ---------- Lore ---------- */
P.lore=()=>head(L.world.title,'El mundo de Karavan Online')
 +'<div class="lore">'+L.world.p.map(t=>'<p>'+t+'</p>').join('')+'</div>'
 +'<div class="quote">'+L.world.quote+'</div>'
 +'<h2>Las Bestias Celestiales</h2><div class="stage-row" style="--gc:#b27bff">'+['nhorse','cow','lion'].map(b=>'<div class="sr-i">'+SP('an-'+b+'-1',6)+'<small>'+({nhorse:'Caballo Celestial',cow:'Buey Celestial',lion:'León Celestial Dorado'})[b]+'</small></div>').join('')+'</div><div class="lore"><p>'+L.celest.p.join('</p><p>')+'</p></div>'
 +'<h2>Los dragones del mes</h2><div class="stage-row" style="--gc:#ff4a62">'+W.dragons.map(d=>'<div class="sr-i">'+(DRG[d.k]||'')+'<small>'+esc(d.n)+'</small></div>').join('')+'</div><div class="lore"><p>'+L.dragon.p[0]+'</p></div>'
 +'<h2>Leyendas de cada clase</h2><div class="hits cols">'+W.classes.map(c=>'<a class="hit" href="#/clase/'+c.id+'" style="--hc:'+CG[c.id]+'"><b>'+c.ic+' '+c.n+'</b> · '+esc(L.classes[c.id].titulo)+'<small>'+esc(L.classes[c.id].lema)+'</small></a>').join('')+'</div>';
const DRG={};   /* imágenes de dragón (se rellena si existen sus sprites reales) */

/* ---------- Plataformas ---------- */
const KB=t=>'<kbd>'+t+'</kbd>';
P.plataformas=()=>head('Jugar en PC, Android y iOS','Karavan Online corre en el navegador: sin descargas, sin instalar nada y con tu progreso guardado en tu cuenta.')
 +'<div class="trio">'
 +'<div class="plc" style="--pc:#46a8ff">'+fig('kv-dev-pc.jpg','Karavan Online en PC','Pantalla completa con F11')+'<h3>💻 PC y portátil</h3><p>Windows, macOS, Linux y Chromebook, con <b>Chrome, Edge, Firefox o Safari</b> actualizados.</p><ul><li>Entra a <b>karavanonline.com</b> y pulsa <b>⚔ Jugar</b>.</li><li>Teclado y ratón; el clic derecho sobre otro jugador abre su menú.</li><li>Pulsa <b>F11</b> para pantalla completa.</li></ul></div>'
 +'<div class="plc" style="--pc:#34d27b">'+fig('kv-dev-and.jpg','Karavan Online en Android','En horizontal y a pantalla completa')+'<h3>🤖 Android</h3><p>Cualquier móvil o tablet con <b>Chrome</b> (recomendado), Edge o Firefox.</p><ul><li>Gira el teléfono en <b>horizontal</b>.</li><li>Menú ⋮ → <b>Añadir a pantalla de inicio</b> para tener el icono.</li><li>Mueve con el joystick de la izquierda y ataca con los botones de la derecha.</li></ul></div>'
 +'<div class="plc" style="--pc:#ff9d1c">'+fig('kv-dev-ios.jpg','Karavan Online en iPhone y iPad','Safari · Añadir a inicio')+'<h3>🍎 iPhone y iPad</h3><p>Usa <b>Safari</b> en iOS o iPadOS.</p><ul><li>Toca <b>Compartir</b> (□↑) → <b>Añadir a pantalla de inicio</b>: se abre a pantalla completa como una app.</li><li>Activa el sonido con el interruptor lateral y juega en horizontal.</li></ul></div></div>'
 +'<h2>Controles en PC</h2>'+tbl(['Tecla','Acción'],[
   [KB('W')+' '+KB('A')+' '+KB('S')+' '+KB('D')+' o '+KB('←')+' '+KB('↑')+' '+KB('↓')+' '+KB('→'),'Mover al héroe'],
   [KB('Espacio'),'Atacar al enemigo más cercano'],[KB('E'),'Hablar con un NPC, entrar a edificios y abrir el menú'],[KB('I'),'Abrir el menú del héroe: equipo, mochila, habilidades y mapa'],
   [KB('Q'),'Beber una poción'],[KB('F')+' · '+KB('1')+' '+KB('2')+' '+KB('3'),'Botones rápidos de hechizo y objeto'],[KB('4')+' … '+KB('9')+' '+KB('0')+' '+KB('-')+' '+KB('='),'Hechizos de la 4.ª a la 12.ª habilidad'],
   [KB('V'),'Cambiar entre los planos A y B de botones rápidos'],[KB('M'),'Montar o desmontar'],[KB('R'),'Alternar correr'],[KB('G'),'Recoger el botín cercano'],[KB('Esc'),'Cerrar ventanas'],[KB('F11'),'Pantalla completa del navegador']])
 +'<h2>Controles en móvil</h2><div class="howto"><div><b>🕹️ Mover:</b> toca y arrastra en la mitad izquierda de la pantalla.</div><div><b>⚔️ Atacar:</b> botón de espada a la derecha; los hechizos están junto a él.</div><div><b>🎁 Botín:</b> toca el botón del regalo para recoger lo que cae.</div><div><b>🎒 Menú:</b> mochila, equipo, habilidades, mapa y tiendas.</div></div>'
 +'<h2>Consejos para jugar mejor</h2><ul><li><b>Tu progreso es tuyo:</b> crea una cuenta y entra con ella desde cualquier dispositivo; tus personajes se guardan en la nube.</li><li><b>Pantalla completa:</b> en Ajustes del juego, el botón ⛶ la activa; en iPhone usa Compartir → Añadir a pantalla de inicio.</li><li><b>Botones a tu gusto:</b> en Ajustes puedes mover los botones de la pantalla (✋ Mover botones) y recuperar los ocultos (🎮 Restaurar botones ocultos).</li><li><b>Actualizar:</b> cuando salga una versión nueva y el juego se vea raro, pulsa <b>Ctrl + F5</b> en PC o recarga la página con fuerza en el móvil.</li><li><b>Sonido:</b> la música de esta web se silencia con el botón 🎵 de abajo a la derecha; el juego tiene su propio volumen en Ajustes.</li></ul>'
 +note('<b>¿Y una app para Google Play o App Store?</b> Por ahora Karavan Online se juega solo desde el navegador; así no hace falta esperar a ninguna tienda para recibir las novedades: entras y estás al día.');

/* ---------- Clases ---------- */
P.clases=()=>head('Las 8 clases','Cada una con su estilo, su lore y su propia lista de habilidades. Toca una carta para ver su leyenda.')
 +'<div class="hgrid hg2">'+W.classes.map(c=>KV.heroCard(c.id)).join('')+'</div>'
 +'<h2>Comparativa</h2>'+tbl(['Clase','Vida base','MP base','Daño','Velocidad','Alcance','Daño recibido','Habilidad insignia'],W.classes.map(c=>['<a href="#/clase/'+c.id+'">'+SPS('c'+c.id+'-down-1',1.5)+c.ic+' '+c.n+'</a>',c.hp,c.mp,'×'+fmt(c.dm),c.sp,c.rg?c.rg+' px':'Cuerpo a cuerpo','×'+fmt(c.df),c.sig]),[1,2,3,4]);

const setRow=(k,li)=>{
  const r0=EQ(k,li,0),tc=TCOL[r0.t];
  return '<a class="setrow" href="#/objetos/sets/'+k+'/'+li+'" style="--tc:'+tc+'"><span class="lv">'+fmt(r0.rl)+'<small>NIVEL</small></span><span class="snm"><b>'+esc(I.setn[k][li])+'</b><small>'+[0,1,2,3,4,5,6].map(s=>esc(EQ(k,li,s).n)).join(' · ')+'</small></span><span class="pcs">'+[0,1,2,3,4,5,6].map(s=>KV.ic(EQ(k,li,s).v[3].ic,1)).join('')+'</span></a>';
};
P.clase=(id)=>{
  id=cl(+id||0,0,7);const c=W.classes[id],lo=L.classes[id],cg=CG[id];
  const mx=k=>Math.max(...W.classes.map(x=>x[k]));
  const st=(lab,val,txt,k)=>'<div class="stat" style="--cc:'+cg+'"><label>'+lab+'<b>'+txt+'</b></label><div class="bar"><i style="width:'+Math.max(6,Math.min(100,100*val/mx(k)))+'%"></i></div></div>';
  const ob=I.skin.filter(s=>s.c==id);
  let h='<section class="clsban" style="--cg:'+cg+'"><span class="fx"><i></i><i></i><i></i><i></i><i></i><i></i></span><div class="cb-fig">'+SP('c'+id+'-down-1',10)+'</div><div class="cb-t"><div class="ttl">'+esc(lo.titulo)+'</div><h1>'+c.ic+' '+esc(c.n)+'</h1><div class="lema">'+esc(lo.lema)+'</div><div class="cb-p">'+pill('❤️ Vida '+c.hp)+pill('⚔️ Daño ×'+fmt(c.dm))+pill('👟 Vel. '+c.sp)+pill(c.rg?'🎯 '+c.rg+' px':'🗡️ Cuerpo a cuerpo')+'</div><p style="margin-top:14px"><button type="button" class="btn btn-sm" data-hero="'+id+'">🔍 Ver al héroe como en el juego</button></p></div></section>';
  h+='<div class="lore">'+lo.p.map(t=>'<p>'+t+'</p>').join('')+'</div>'+note('<b>'+esc(lo.ideal)+'</b><br>'+esc(dc(c.d)));
  h+='<h2>Atributos</h2><div class="stats">'
   +st('Vida base',c.hp,c.hp,'hp')+st('Vida por nivel',c.hl||1,'+'+(c.hl||0),'hl')+st('MP base',c.mp,c.mp,'mp')+st('Daño',c.dm,'×'+fmt(c.dm),'dm')+st('Velocidad',c.sp,c.sp,'sp')+st('Rango de ataque',c.rg||20,c.rg?c.rg+' px':'Cuerpo a cuerpo','rg')
   +'<div class="stat"><label>Daño recibido<b>×'+fmt(c.df)+'</b></label><div class="bar"><i style="width:'+Math.min(100,c.df*60)+'%;--cc:#b02a30"></i></div></div>'
   +'<div class="stat"><label>Cadencia de golpe<b>'+fmt(c.cd)+' s</b></label><div class="bar"><i style="width:'+Math.min(100,100*(1-c.cd/1.1))+'%"></i></div></div></div>';
  h+='<p>Área de skill: <b>'+esc(c.skill_area)+'</b> · Habilidad insignia: <b>'+esc(c.sig)+'</b> (recarga '+fmt(c.scd)+' s)</p>';
  h+='<h2>Apariencias de clase</h2><p>Cuatro rarezas que cambian tu aspecto y suman armadura y bonos. <a href="#/objetos/apariencias/'+id+'">Ver las fichas completas</a>.</p><div class="tiers">'
   +c.skins.map((s,t)=>'<a class="tier" href="#/objetos/apariencias/'+id+'~s_'+(ob[t]?ob[t].id:'')+'" style="--tg:'+cg+'44">'+spr(id,t,7)+'<h4>'+esc(s.n)+'</h4><small>'+pill(W.rar[t],RC[t])+' '+pill(esc(s.el))+'</small><small>Armadura '+s.ar+' · Def '+s.df+'% · Crít '+s.cr+'%</small><small>'+gem(s.g)+'</small></a>').join('')+'</div>';
  if(c.trajes.length)h+='<h2>Trajes</h2>'+tbl(['Traje','Rareza','Bono','Precio'],c.trajes.map(t=>[esc(t.n),pill(W.rar[t.t]||'',RC[t.t]),(TJL[t.bn[0]]||esc(t.bn[0]))+' <b>+'+t.bn[1]+'%</b>',gem(t.g)]));
  h+='<h2>Habilidades</h2><div class="sk">'+c.skills.map(s=>skillHtml(s)).join('')+'</div>';
  h+='<h2>Sets de equipo</h2><p>Diez conjuntos de siete piezas, de nivel '+fmt(W.eqlv[0])+' a '+fmt(W.eqlv[9])+'. Toca uno para ver todas sus piezas y rarezas.</p><div class="setrows">'+[0,1,2,3,4,5,6,7,8,9].map(li=>setRow(id,li)).join('')+'</div>';
  h+='<p style="display:flex;justify-content:space-between;margin-top:34px;gap:10px;flex-wrap:wrap"><a class="btn" href="#/clase/'+((id+7)%8)+'">← '+W.classes[(id+7)%8].n+'</a><a class="btn" href="#/clase/'+((id+1)%8)+'">'+W.classes[(id+1)%8].n+' →</a></p>';
  return h;
};

/* ---------- Rarezas y sets de clase ---------- */
P.equipo=(cid)=>{
  return head('Rarezas y sets de clase','Siete piezas por set, cuatro rarezas y diez niveles de poder, de la Maza de Comerciante a las armas del Génesis.')
  +'<h2>Las cuatro rarezas</h2><div class="rr">'+RN.map((n,i)=>'<div style="--rc:'+RCOL[i]+'">'+KV.ic(EQ(0,0,0).v[i].ic,1.6)+'<b>'+n+'</b><span>Atributos ×'+fmt(W.rm[i])+'</span><span>'+['El punto de partida','Más fuerte y más rara','Pocas veces la verás','La mejor de cada pieza'][i]+'</span></div>').join('')+'</div>'
  +'<p>Una misma pieza existe en las cuatro rarezas y se ve igual: lo que cambia son sus atributos. Un <b>Legendario</b> vale 3,5 veces lo que un Común del mismo nivel.</p>'
  +'<h2>Las siete piezas de un set</h2><div class="hits cols">'+SN.slice(0,7).map((s,i)=>'<a class="hit" href="#/objetos/sets/0/9~'+i+'" style="--hc:#b27bff"><span class="hi">'+KV.ic(EQ(0,9,i).v[3].ic,1.3)+'</span><b>'+s+'</b><small>'+['Daño','Vida','Daño y vida','Daño y vida','Vida','Velocidad','Vida, maná u oro según tu clase'][i]+'</small></a>').join('')+'</div><p class="cnt">Los iconos son las piezas del set Mítico del Mercader; toca una para ver sus cuatro rarezas.</p>'
  +'<h2>Los diez niveles de poder</h2><p>Cada clase tiene diez sets. Se consiguen derrotando jefes, en las cuevas y en la Torre del Lago; los más altos son botín de la Torre y del Submundo.</p>'
  +'<div class="ladder">'+W.eqlv.map((lv,li)=>'<a class="lad" href="#/objetos/sets/0/'+li+'" style="--tc:'+TCOL[EQ(0,li,0).t]+'"><b>'+fmt(lv)+'</b><small>nivel</small></a>').join('')+'</div>'
  +'<h2>Elige tu clase</h2><div class="hits cols">'+W.classes.map(c=>'<a class="hit" href="#/objetos/sets/'+c.id+'/9~0" style="--hc:'+CG[c.id]+'"><span class="hi">'+KV.ic(EQ(c.id,9,0).v[3].ic,1.4)+'</span><b>'+c.ic+' '+c.n+'</b><small>'+esc(EQ(c.id,9,0).n)+'</small></a>').join('')+'</div>'
  +'<h2>Reglas del equipo</h2><ul>'
  +'<li><b>Equipo de otra clase:</b> sus bonos <b>restan un 60 %</b> en lugar de sumar. Solo las joyas sirven a todos.</li>'
  +'<li><b>Resistencia elemental:</b> algunas piezas de armadura (niveles 50, 75 y desde 110) reducen un 5 %, 7 % o 9 % el daño de fuego, hielo o tierra, según tu clase.</li>'
  +'<li><b>Puntos de habilidad ✨:</b> cada pieza de armadura de tu clase suma puntos a tu área de skill (el 20 % de su nivel, ×1,25 si tiene resistencia).</li>'
  +'<li><b>Durabilidad:</b> el equipo se desgasta al combatir, y más despacio cuanto mayor es su nivel. Solo las piezas <b>Comunes</b> pueden romperse: a 0 % dejan de dar bonos hasta que las reparas. Las de rareza <b>Raro, Épico y Legendario nunca se rompen</b>: al desgastarse pierden efectividad hasta un mínimo del 40 % y el Herrero las restaura. Reparar cuesta el <b>35 %</b> del valor de lo perdido.</li>'
  +'<li><b>Potenciación y encantamiento:</b> hasta +12 (+10 % por nivel) y hasta 5 niveles de hechizo. <a href="#/forja">Ver la forja</a>.</li>'
  +'<li><b>Vender:</b> el NPC paga solo el <b>25 %</b> del valor de la pieza (<b>45 %</b> si tienes la Licencia de Mercader). Para sacarle más provecho, negocia el equipo bueno con otros jugadores en el Mercado.</li></ul>'
  +'<h2>Familias de material</h2><p>El equipo forjado se agrupa en cinco familias de material: <b>'+W.tiers.ta.map(esc).join(', ')+'</b>.</p>'
  +note('Además de los sets existe la <a href="#/objetos/armeria">Armería</a> (equipo básico a la venta), las <a href="#/objetos/joyas">joyas</a>, las <a href="#/objetos/pociones">pociones</a> y mucho más en el <a href="#/objetos">catálogo completo</a>.');
};

/* ---------- Potenciación y forja ---------- */
const MATI=k=>{const m=I.min.find(x=>x.k==k);if(m)return KV.ic(m.ic2,.9)+' ';const x=I.xmat.find(y=>y.k==k);return x?KV.ic(x.ic,.9)+' ':''};
const MATN=k=>I.sys.MNBn[k]||k;
const matList=m=>Object.keys(m).map(k=>MATI(k)+m[k]+'× '+esc(MATN(k))).join('<br>');
const ARCC=[null,{pat:6,tel:3,p:1},{pat:12,tel:6,p:1},{pat:20,tel:10,p:.85},{pat:32,tel:16,p:.7},{pat:50,tel:25,p:.55}];
P.forja=()=>{
  const U=I.sys.UPCC,FG=I.sys.FGV,FQ=I.sys.FGQ,FM=I.sys.FGM,FX=I.sys.FGX,FN=I.misc.fgn,FI=I.misc.fgi;
  return head('Potenciación y forja','Mejora tu equipo con minerales, pata de araña y hechizos. Si falla, pierdes los materiales pero tu objeto está a salvo.')
  +'<h2>✨ Potenciación (+1 a +12)</h2><p>Cada nivel de potenciación suma un <b>10 %</b> más de los bonos base de la pieza. Se hace en la Herrería con oro y minerales; a partir del +4 hay riesgo de que falle.</p>'
  +tbl(['Nivel','Bonus total','Oro','Materiales','Éxito'],U.map((u,i)=>u?['<b>+'+i+'</b>','+'+(i*10)+' %',money(u.g),matList(u.m),'<b style="color:'+(u.p>=.8?'#34d27b':u.p>=.4?'#ffc83d':'#ff4a62')+'">'+Math.round(u.p*100)+' %</b>']:null).filter(Boolean),[2])
  +note('El <b>+11</b> y el <b>+12</b> piden escamas y corazones de dragón: se consiguen en los <a href="#/celestiales">dragones del mes</a>.')
  +'<h2>🕷️ Refuerzo Arácnido (1 a 5)</h2><p>Un refuerzo independiente de la potenciación: suma un <b>8 %</b> por nivel a los bonos de la pieza. Se paga con patas y telas de araña que sueltan las arañas de las cuevas.</p>'
  +tbl(['Nivel','Bonus','🕷️ Patas de araña','🕸️ Telas de araña','Éxito'],ARCC.map((a,i)=>a?['<b>🕷️ '+i+'</b>','+'+(i*8)+' %',a.pat,a.tel,Math.round(a.p*100)+' %']:null).filter(Boolean),[1,2,3,4])
  +'<h2>🔮 Forja encantada: hechizos en el equipo</h2><p>Con materiales del <a href="#/submundo">Submundo</a> se puede encantar una pieza con uno de ocho hechizos. Cada hechizo da su propio bono y sube hasta el nivel 5.</p>'
  +'<div class="enc">'+FN.slice(1).map((n,i)=>'<div class="en"><span class="eic">'+FI[i+1]+'</span><b>'+esc(n)+'</b><small>+ '+esc(FX[i+1])+'</small><span class="em3">'+FM[i+1].map(k=>MATI(k)+esc(MATN(k))).join('<br>')+'</span></div>').join('')+'</div>'
  +'<h3>Coste de cada nivel de encantamiento</h3>'+tbl(['Nivel','Material A','Material B','Material C','Lágrima de Lete','Oro','Éxito'],FG.map((f,i)=>f?['<b>Nv '+i+'</b>',f.a+'×',f.b?f.b+'×':'—',f.x?f.x+'×':'—',f.l?f.l+'×':'—',money(f.g),Math.round(f.p*100)+' %']:null).filter(Boolean),[1,2,3,4,5,6])
  +'<p>Cada hechizo usa tres materiales distintos (A, B y C, en el orden de la lista de arriba). El nivel 5 también pide <b>Lágrima de Lete</b>, el material más raro del juego.</p>'
  +'<h2>⚒️ Forja mágica: equipo ya encantado</h2><p>Para quien no quiere arriesgar: la forja mágica fabrica directamente una pieza de tu clase con un hechizo ya puesto, <b>sin riesgo de fallo</b>.</p>'
  +tbl(['Calidad','Rareza','Hechizo inicial','Material A','Material B','Material C','Oro'],FQ.map((q,i)=>q?['<b>'+q.n+'</b>',pill(RN[q.r],RC[q.r]),'Nivel '+q.el,q.a+'×',q.b?q.b+'×':'—',q.x?q.x+'×':'—',money(q.g)]:null).filter(Boolean),[3,4,5,6])
  +'<h2>🏪 Qué hay en la Herrería</h2><div class="hits cols">'+[['🔧','Reparar','Devuelve la durabilidad del equipo.'],['✨','Potenciar','De +1 a +12 con minerales.'],['🕷️','Refuerzo arácnido','Patas y telas de araña.'],['🔮','Forja mágica','Equipo con hechizo, sin riesgo.'],['🪄','Encantar','Pon un hechizo en tu pieza.'],['💎','Submundo','Materiales del Submundo.'],['🏹','Fletchería','Flechas por lotes de 20.'],['🔥','Antorchas','Antorchas de estaca.']].map(x=>'<div class="hit" style="--hc:#ff9d1c"><b>'+x[0]+' '+x[1]+'</b><small>'+x[2]+'</small></div>').join('')+'</div>'
  +note('Los materiales se ven con sus iconos reales en el <a href="#/objetos/materiales">catálogo de materiales</a>.');
};

/* ---------- Mundo ---------- */
const TILE=(i,cls)=>'<span class="tile'+(cls?' '+cls:'')+'" style="background-position:'+((i%4)*100/3)+'% '+(Math.floor(i/4)*100/6)+'%" role="img" aria-label="Captura del juego"></span>';
const TILEP=(f,cls)=>'<span class="tile pic'+(cls?' '+cls:'')+'" style="background-image:url('+f+')" role="img" aria-label="Captura del juego"></span>';
P.mundo=()=>head('Tierras y ciudades','Un mapa de '+fmt(W.world.w)+' × '+fmt(W.world.h)+' casillas con 16 tierras, 12 ciudades-oasis y más de '+fmt(Math.floor(W.world.mobs/100)*100)+' enemigos.')
 +'<h2>Las 16 tierras</h2><p>Cada tierra tiene un nivel de peligro (de 0 a 8) y un tipo de paisaje. Las capturas son del juego real.</p>'
 +'<div class="rgs">'+W.regions.map((r,i)=>{const lv=[1,5,8,12,15,19,22,26,29][r.t];return '<div class="rg" style="--gc:'+['#34d27b','#2fbf71','#9acd32','#d6b04a','#9db3c9','#e3b45a','#d9a441','#9fd4ff','#c9a24a','#d2693a','#c97b3a','#a0522d','#8a6a9a','#6e5a6a','#8d7f96','#c4a24a'][i]+'">'+TILE(i)+'<div class="rg-t"><b>'+esc(r.n)+'</b><small>'+BIO[r.b]+' · ('+r.x+', '+r.y+')</small><span>'+pill('Peligro '+r.t,RC[Math.min(3,Math.floor(r.t/3))])+' '+pill('Nivel ref. '+lv)+'</span></div></div>'}).join('')+'</div>'
 +'<h2>Las 12 ciudades-oasis</h2><p>Las ciudades son zonas seguras con todos los servicios: posada, herrería, armería, botica, establo, almacén y más.</p>'
 +'<div class="hg-c">'+W.cities.map((c,i)=>'<div class="cty"><span class="ci">'+['🏯','🛕','🕌','🕌','🏰','🕌','🕌','⛪','🏯','🛕','🏛️','🏛️'][i]+'</span><b>'+esc(c.n)+'</b><small>'+c.tx+', '+c.ty+'</small></div>').join('')+'</div>'
 +'<div class="ctw">'+TILE(10,'wide')+TILE(12,'wide')+'</div><p class="cnt" style="text-align:center">Plazas de las ciudades en el juego: el mercado, la herrería, la posada, el establo y la iglesia a un paso.</p>'
 +'<h3>Edificios de cada ciudad</h3><div class="grid g4" style="margin-top:10px">'+W.bld.map(b=>'<div class="card" style="padding:14px 16px"><span class="ico">'+b.ic+'</span><h3 style="font-size:15px;margin:0 0 4px">'+esc(b.n)+'</h3></div>').join('')+'</div>'
 +'<p>Detalles de cada servicio en <a href="#/carpas">Carpas y edificios</a>.</p>'
 +'<h2>Puntos de interés</h2><p>'+W.landmarks.length+' lugares repartidos por el mapa que se descubren caminando: oasis, ruinas, templos, torres, altares, criptas, miradores, fortalezas, santuarios y tumbas. Cada uno aparece en tu mapa cuando te acercas.</p>'
 +'<h2>Zonas malditas</h2><p>Doce zonas marcadas con ☠ en el mapa, llenas de muertos vivientes y élites. Se descubren caminando cerca.</p><p>'+W.zones_cursed.map(z=>pill('☠ '+esc(z),'d')).join(' ')+'</p>'
 +note('Ver también <a href="#/clima">clima y estaciones</a>: el terreno cambia la temperatura, la lluvia y la nieve de cada tierra.');

/* ---------- Cuevas ---------- */
const DGX={ /* información extra por mazmorra (datos verificados en el juego) */
 'ar':['Telarañas por todas partes. Las arañas son más fuertes cuanto más bajas.','Arañas'],
 'es':['Esqueletos, zombis y fantasmas entre montones de huesos.','Catacumbas'],
 'se':['Serpientes y escorpiones en un pantano medio hundido.','Pantano'],
 'ab':['Un pozo de lodo humeante que parece no tener fondo.','Abismo'],
 'to':['La Torre del Lago: 600 pisos y su botín de equipo es exclusivo. Se dice que nadie ha visto el final.','Torre'],
 'co':['Un coliseo romano con taquillas. Todos contra todos, 6 minutos, nivel e items igualados: no pierdes nada.','Coliseo'],
 'mi':['Una mina con rieles y vetas: túneles de cobre, cámaras de amatista y el trono de la Reina Tejedora.','Mina'],
 'lw':['Aullidos en una cueva fría entre las montañas: hombres lobo de ocho colores.','Lobos'],
 'cs':['Una puerta de piedra con cuatro huecos. Hacen falta <b>cuatro jugadores</b>, cada uno con un sello distinto (🌅 Alba, 🐦‍⬛ Cuervo, 🌇 Ocaso y 🌙 Luna) que se desentierran en cuatro puntos del mapa y se pueden comerciar.','Sellos'],
 'rn':['Madriguera enorme de ratas gigantes: cada dos pisos, otro jefe distinto.','Ratas'],
 'dr':['Una montaña enorme del noroeste con la entrada sellada: se abre desde el <b>nivel 35</b> y baja nueve pisos. Ocho dragones elementales, uno por piso, y al fondo el <b>Dragón Ancestral</b>. <a href="#/celestiales~santuario">Ver el Santuario</a>.','Santuario'],
 'uw':['Un mundo entero bajo el Templo de los Celestiales. Ver la página del Submundo.','Submundo'],
 '':['La primera cripta del camino: ideal para estrenar tu héroe.','Cripta']};
P.cuevas=()=>head('Cuevas, mazmorras y la Torre','Trece lugares con sus guardianes, sus rumores y sus pisos sin fin: cuevas, minas, la Torre del Lago, el Coliseo, el Santuario de los Dragones y el Submundo.')
 +'<p>Las cuevas se generan piso a piso. <b>Cada piso trae un 20 % más de monstruos, y más fuertes, que el anterior</b>, así que el nivel recomendado sube a medida que bajas. Hay un tope de monstruos por cueva para que el juego vaya fluido.</p>'
 +'<div class="dgs">'+I.dg.map(d=>{
   const x=DGX[d.id]||DGX[''],isTw=d.id=='to',isUw=d.id=='uw',isCo=d.id=='co';
   return '<article class="dgc" id="dg-'+(d.id||'cr')+'">'+(d.id=='dr'?TILEP('kv-dr.jpg'):TILE(16+d.i))+'<div class="dg-b"><h3>'+esc(d.nm)+'</h3>'
    +(d.rumor?'<p class="rum"><i>Se rumorea: '+esc(d.rumor)+'.</i></p>':'')+'<p>'+x[0]+'</p>'
    +'<div class="dg-s">'+(isUw?'':'<span>🏗️ <b>'+fmt(d.n)+'</b> '+(d.n==1?'piso':'pisos')+'</span>')+(d.lv?'<span>⚔️ <b>'+esc(d.lv)+'</b></span>':'')+(d.gd?'<span>👑 '+esc(d.gd)+'</span>':'')+(d.mbd?'<span>🛡️ '+esc(d.mbd)+'</span>':'')+'<span>📍 '+d.tx+', '+d.ty+'</span></div></div></article>'}).join('')+'</div>'
 +note('La <b>Torre del Lago</b> llega al nivel 9.916 y su botín de equipo es exclusivo. Los jefes de cada cueva sueltan mejor botín que el mundo abierto.')
 +note('Las bocas de las cuevas quedan lejos de las ciudades (130 casillas o más) y las montañas bloquean el paso: solo se entra por la entrada. Lleva pociones y antorchas.')
 +'<h2>Criaturas de las cuevas</h2><div class="mons">'+[['spx1','Araña saltarina'],['spx2','Tarántula de cueva'],['spx3','Viuda de las cavernas'],['spx6','Reina de las Arañas'],['skel','Esqueleto'],['zomb','Zombi'],['ghost','Fantasma'],['bat','Murciélago'],['mn-were','Hombre lobo'],['rat','Rata gigante'],['snake','Víbora'],['reap','Segador']].map(m=>'<div class="mon">'+spBase(m[0],3.6,1)+'<span><b>'+m[1]+'</b></span></div>').join('')+'</div>';

/* ---------- Monstruos ---------- */
const BSP={'Coloso de Hierro':'iron-golem','Elemental de Fuego':'fire-elemental','Coloso de Agonita':'agonite-golem','Señor de Sangre':'blood-lord','Coloso de Dungio':'dungium-golem','Sombra Abismal':'adumbral-large','Coloso de Noctis':'noctis-golem','Rey Faraón':'pharaoh'};
const FSP=['rat','snake','bandit','goblin','mummy','orc','orc-berserker','vampire','pharaoh'];
const LSP={dog:'an-dog',hawk:'an-falcon',owl:'an-owl',wolf:'an-wolfw'};
P.monstruos=()=>head('Monstruos y jefes','Los nueve enemigos del camino, los jefes del mundo, las guaridas de bestias y los mini-jefes de los santuarios. Los sprites son los del juego.')
 +'<h2>Los 9 enemigos del camino</h2><p>Cada tierra tiene su enemigo: cuanto más lejos de Chang\'an, más duro es. Se mueven en escuadras, así que casi nunca estarás solo contra uno.</p><div class="mons">'+W.farm.map((f,i)=>'<div class="mon mb" style="--c:'+TCOL[Math.min(4,Math.floor(f.t/2))]+'">'+KV.mb(i,1.25)+'<span><b>'+esc(f.n)+'</b><small>Nivel '+f.lv+' · '+fmt(f.cnt)+' en el mapa</small><small class="mz">'+esc(f.z)+'</small><p>'+esc(f.d)+'</p></span></div>').join('')+'</div>'
 +tbl(['Enemigo','Dónde vive','Peligro','Nivel de ref.','En el mapa'],W.farm.map(f=>[f.ic+' '+esc(f.n),esc(f.z),pill('Peligro '+f.t,RC[Math.min(3,Math.floor(f.t/3))]),f.lv,fmt(f.cnt)]),[3,4])
 +'<h2>Cómo pelean</h2><ul>'
 +'<li><b>Escuadras con líder:</b> los tres primeros enemigos van en escuadras de 8, los tres siguientes de 10 y los tres últimos de 12. Ocho te rodean, uno por casilla; los demás esperan su turno. El más fuerte lleva la marca <b>🚩 Líder</b> y, cuando cae un compañero, grita <b>📯 ¡Refuerzos!</b>. Desde el cuarto enemigo, algunos te rodean en arco para flanquearte.</li>'
 +'<li><b>Aviso local:</b> cada monstruo te ve por su cuenta (cono de visión y obstáculos) y solo avisa a los compañeros que tiene a unos 200 píxeles. Se quedan cerca de su «casa»: a veces patrullan entre dos o tres puntos y, si te alejas, vuelven y se curan.</li>'
 +'<li><b>Cadáveres que se pueden saquear:</b> al morir dejan su cuerpo sobre una mancha durante <b>60 segundos</b>. Si muestra 💰, acércate (menos de unos 75 píxeles) y pulsa <b>G</b> en PC o <b>Tomar</b> en el móvil: el primero que llegue se lo lleva. Sale una poción (10 %), equipo común del nivel del monstruo +5 (6 %) y, muy rara vez, equipo poco común (0,006 %). Solo cuenta en el mundo abierto.</li>'
 +'<li><b>Reapariciones limitadas:</b> el mapa se divide en 305 celdas y cada una tiene su batería de reapariciones: solo el 45 % de los monstruos está despierto y, cuando muere uno, despierta otro y gasta 1 de batería. Sin batería no hay monstruos; se recarga en 90 días. Por eso conviene repartirse por el mapa.</li></ul>'
 +'<h2>Jefes del mundo</h2><p>Ocho colosos y señores con guaridas fijas en el mapa.</p><div class="mons">'+W.bosses.map(b=>'<div class="mon boss">'+spBase(BSP[b.n]||'iron-golem',4.4,1)+'<span><b>'+esc(b.n)+'</b><small>Nivel '+b.lv+' · '+fmt(b.hp)+' de vida</small></span></div>').join('')+'</div>'
 +tbl(['Jefe','Nivel','Vida','Daño','Velocidad'],W.bosses.map(b=>['👑 '+esc(b.n),b.lv,fmt(b.hp),fmt(b.dm),fmt(b.spd)]),[1,2,3,4])
 +'<h2>Guaridas de bestias</h2><div class="mons">'+W.lairs.map(l=>'<div class="mon">'+spBase(LSP[l.k]||'an-dog',3.6,1)+'<span><b>'+esc(l.n)+'</b><small>'+fmt(l.hp)+' de vida · peligro mín. '+l.tmin+'</small></span></div>').join('')+'</div>'
 +'<h2>Jefes de horda</h2><p>Cada tipo de enemigo tiene su jefe de horda, que aparece con su manada.</p>'+tbl(['Jefe','Vida','Daño'],W.hordes.map(h=>[esc(h.n),fmt(h.hp),fmt(h.dm)]),[1,2])
 +'<h2>Criaturas míticas del Submundo</h2><div class="mons">'+[['mn-mino','Minotauro'],['mn-medu','Medusa'],['mn-lami','Lamia'],['mn-croc','Cocodrilo del Estigia'],['mn-wormg','Gusano de la galería'],['mn-were','Hombre lobo']].map(m=>'<div class="mon">'+spBase(m[0],3.6,1)+'<span><b>'+m[1]+'</b></span></div>').join('')+'</div>'
 +'<h2>Mini-jefes de los santuarios</h2><p>Tres criaturas que viven en su propio <b>territorio</b>: un pueblo encantado, una llanura maldita y un bosque de colmillos. En cada uno hay un personaje que te encarga <b>tres misiones</b> para descubrir su <b>santuario</b>, monstruos propios algo más débiles que el jefe, materiales para fabricar la <b>ofrenda</b> que abre la puerta y un <b>equipo exclusivo</b>.</p>'
 +'<div class="mons">'+(window.MJW||[]).map(m=>'<div class="mon mj" style="--c:'+m.col+'"><img alt="'+esc(m.n)+'" src="'+m.im.u+'" width="'+Math.round(m.im.w*.6)+'" height="'+Math.round(m.im.h*.6)+'"><span><b>'+m.ic+' '+esc(m.n)+'</b><small>Desde el nivel <strong>'+m.min+'</strong> · jefe de nivel <strong>'+m.lv+'</strong></small><small class="mz">'+esc(m.terr)+' · '+m.r+'</small><p>'+esc(m.d)+'</p></span></div>').join('')+'</div>'
 +tbl([''].concat((window.MJW||[]).map(m=>m.ic+' '+esc(m.n))),[['Nivel de acceso','min'],['Nivel del jefe','lv'],['Arena','arena'],['Combate','st'],['Habla con','npc'],['Monstruos del territorio','mob'],['Ofrenda','of'],['Ficha','tk'],['Equipo exclusivo','eq']].map(r=>['<b>'+r[0]+'</b>'].concat((window.MJW||[]).map(m=>esc(String(m[r[1]]))))))
 +'<h2>Cómo se descubre un santuario</h2><ol class="mjw-steps">'
 +'<li><b>Busca el territorio.</b> Aparece con un contorno punteado en el 🗺️ mapa del mundo cuando te acercas a su nivel. Al entrar, el ambiente cambia: niebla, color, decorado y criaturas propias.</li>'
 +'<li><b>Habla con su personaje.</b> Te da tres misiones: investigar con el botón 🔍 (el termómetro avisa si estás 🔥 caliente o ❄️ frío), derrotar monstruos del territorio y reunir materiales. Todo queda en el 📖 <b>Diario de aventuras</b>.</li>'
 +'<li><b>Recibe tu primera ofrenda.</b> Al terminar la última misión el personaje te la entrega y el 🕯️ <b>santuario</b> queda descubierto para siempre en ese personaje.</li></ol>'
 +'<ul><li>La <b>ofrenda</b> nunca la suelta el jefe. Para conseguir otra, el personaje del lugar te da un encargo repetible: reúne los materiales del territorio y la fabrica.</li>'
 +'<li>Ofrendas, fichas y materiales son <b>materiales de cuenta</b>: se pueden comerciar con otros jugadores en el mercado.</li>'
 +'<li>Los monstruos del territorio son de un nivel <b>menor que el del jefe</b>: sirven para prepararte, no para farmear sin fin.</li></ul>'
 +'<h2>⚔️ El combate contra la Banshee</h2><p>La <b>Mansión Embrujada</b> se levanta sobre una isla en medio de un <b>lago negro</b>, en el Pueblo de los Lamentos, y ya está abierta: es la primera arena de mini-jefe. Tiene <b>cuatro pisos</b> y la Banshee espera en el <b>sótano</b>. Es de nivel <b>45</b> y se puede enfrentar <b>en solitario o en Party</b>. Necesitas el nivel 35, el santuario descubierto y un <b>Medallón de la Viuda</b>.</p>'
 +'<h3>La mansión por dentro</h3>'
 +'<ul><li><b>Cuatro pisos:</b> el <b>Altillo</b>, el <b>Primer piso</b>, la <b>Planta baja</b> y, bajo tierra, el <b>Sótano</b>. Cada piso tiene varias habitaciones y se recorren por las escaleras. Se llega por un muelle de tablones sobre el lago: el agua que rodea la isla no se puede pisar.</li>'
 +'<li>Al tocar <b>🚪 Entrar a la Mansión Embrujada</b>, junto a la puerta, el interior ocupa <b>toda la pantalla</b>.</li>'
 +'<li><b>Criaturas de la Banshee:</b> espectros del lamento, fantasmas y esqueletos en la planta baja; espectros sangrientos, zombis y esqueletos gélidos en el primer piso; murciélagos vampiro, arañas de cueva y un segador abisal en el altillo. Te atacan en cualquier momento: <b>dentro de la mansión no hay zona segura</b>, y si una criatura te derrota es una <b>muerte normal del juego</b> (pierdes experiencia y oro como siempre y reapareces en la ciudad más cercana). Solo durante la pelea contra la Banshee caer no cuesta nada.</li>'
 +'<li>En el <b>sótano</b> está el <b>🕯️ altar de la ofrenda</b>, un lugar helado de pilares de mármol donde la Banshee te espera.</li>'
 +'<li>Cada piso es una escena distinta: los compañeros de Party que estén en otro piso no se ven entre sí.</li></ul>'
 +'<h3>Cómo se pelea</h3>'
 +'<ol class="mjw-steps">'
 +'<li><b>Baja al sótano y pide turno.</b> Entra a la mansión, baja hasta el sótano y acércate al altar: toca <b>🕯️ Altar de la ofrenda</b> para abrir el 📖 Diario y pulsa <b>⚔️ Pedir turno</b>. La ofrenda se hace en el altar, no desde fuera. En Party lo hace solo el <b>líder</b>, que pone la ofrenda; todos los miembros deben cumplir el nivel, tener el santuario descubierto, no tener recarga activa y estar en el territorio o dentro de la mansión.</li>'
 +'<li><b>Espera tu turno.</b> La arena es de uso exclusivo: si hay alguien peleando te pones en cola desde el mismo altar (ves tu posición y puedes salir de ella cuando quieras); aunque haya una pelea en curso puedes bajar al sótano a esperar, y no ves lo que pasa en ella. Cuando te toca tienes un minuto para pulsar <b>Entrar</b> y la pelea te lleva sola al sótano, estés donde estés dentro del territorio. En Party la pelea empieza cuando todos confirman o se acaba el minuto: si el líder no confirmó se pierde el turno (sin gastar nada) y quien no confirme se queda fuera de esa pelea.</li>'
 +'<li><b>La ofrenda se gasta al empezar,</b> cuando el servidor confirma el combate. Si algo falla antes, no la pierdes.</li>'
 +'<li><b>Pelea.</b> La Banshee ataca por turnos y cada ataque se marca en el suelo antes de golpear: muévete para esquivarlo. La vida del jefe es <b>compartida</b> por todo el grupo. Mientras dura la pelea las escaleras del sótano <b>se sellan</b>: se sale al terminar o con el botón 🚪.</li>'
 +'<li><b>Fase 2.</b> Al bajar al 25 % de su vida se enfurece: ataca más rápido y suma el <b>Último Lamento</b> con combinaciones de sus otros ataques.</li>'
 +'<li><b>Fin del combate.</b> Si el jefe cae, ganas. Si caen todos los participantes, gana la Banshee (la ofrenda ya estaba gastada).</li></ol>'
 +'<h3>Sus habilidades</h3>'
 +'<ul><li><b>📢 Chillido del Lamento.</b> Flota hacia el centro del sótano, toma aire y <b>chilla</b>: un sonido agudo y desagradable que se oye en toda la mansión, seguido de una <b>onda de choque</b> circular que barre la sala. <i>Los pilares de mármol frenan la onda: detrás de cada uno queda una sombra segura, que el aviso dibuja en azul con un escudo antes de soltarla. Escóndete tras un pilar.</i></li><li><b>👥 Ecos Fantasmales.</b> Se divide en tres figuras; al final todas lanzan un orbe, pero solo hiere el de la <b>verdadera</b>. <i>Las ilusiones se ven más transparentes y sus orbes parpadean: apártate del orbe sólido.</i></li><li><b>🌫️ Paso entre Sombras.</b> Desaparece y reaparece en otro punto de la sala con una explosión circular. <i>Un remolino marca dónde aparecerá: no te quedes ahí.</i></li><li><b>🌪️ Danza del Vendaval.</b> Una corriente de viento la acompaña por la sala y hiere poco a poco a quien esté dentro. <i>Mantente fuera de la corriente.</i></li><li><b>💀 Último Lamento</b> (solo en fase 2). Una gran explosión roja cubre el centro de la sala tras un aviso, y a veces combina otros ataques: ilusiones que chillan, sombra y chillido, vendaval con orbes y un triple chillido. <i>Aléjate del centro cuando se marque el círculo y, si oyes el chillido, busca la sombra azul de un pilar.</i></li></ul>'
 +'<h3>Si caes</h3><ul><li><b>Caer no cuesta nada:</b> no pierdes experiencia, oro ni objetos. Te quedas mirando y, al salir, tu vida se restaura (al menos al 60 %).</li><li><b>🚪 Salir:</b> si quieres irte antes, el botón 🚪 de la barra del jefe (pide confirmar con un segundo toque) te saca al instante. Quien abandona <b>no cuenta para el botín ni recibe recarga</b>.</li><li>Si recargas la página o se corta la conexión en plena pelea, <b>vuelves al mismo punto</b> (hasta 90 segundos sin conexión).</li><li>Lo que pasa en el sótano durante tu pelea solo lo ven tú y tu Party: quien espera turno en la misma sala no ve al jefe ni sus ataques.</li></ul>'
 +'<h3>Recompensa y recarga</h3><p>Al ganar se hace <b>una sola tirada</b> por combate:</p>'
 +'<ul><li><b>45 %</b> · 🧪 Pociones de vida y de maná</li><li><b>5 %</b> · ⚔️ Equipo exclusivo: Espada del Lamento (arma de Caballero)</li><li><b>3 %</b> · 🌬️ Esencia del Viento Espectral (ficha)</li><li><b>47 %</b> · Nada esta vez</li></ul>'
 +'<ul><li>La tirada es para <b>un</b> participante elegido al azar entre los que no abandonaron y siguen conectados (también los que cayeron peleando); no depende de quién pegó más y todos ven quién se la lleva.</li><li>La <b>recarga es individual</b>: 12 horas desde tu victoria (con el reloj del servidor) para volver a enfrentar a ese jefe.</li><li>La ofrenda nunca la suelta el jefe y no hay experiencia por ganar: el premio es solo el botín de la tirada.</li></ul>'
 +'<h2>⚔️ El combate contra el Necromancer</h2><p>El <b>Castillo Maldito</b> se alza sobre un risco en la <b>Llanura de los Condenados</b>, un terreno seco y quemado con un camino de piedra y braseros de fuego verde, obeliscos, espejos rotos y círculos rituales. Se ve desde muy lejos: según te acercas el cielo se oscurece con sombras de nubes y relámpagos y, mientras aún no lo tienes a la vista, un halo verde y violeta en el borde de la pantalla apunta hacia él. Tiene <b>cuatro pisos</b> y el Necromancer espera en el más hondo, el <b>Salón de los Espejos</b>. Es de nivel <b>75</b> y se puede enfrentar <b>en solitario o en Party</b>. Necesitas el nivel 65, el santuario descubierto y una <b>Cruz del Ritual Prohibido</b>.</p>'
 +'<h3>El castillo por dentro</h3>'
 +'<ul><li><b>Cuatro pisos:</b> el <b>Gran Vestíbulo</b> (la entrada), la <b>Biblioteca Prohibida</b> y la <b>Torre del Hechicero</b> hacia arriba y, escalera abajo desde el vestíbulo, el <b>Salón de los Espejos</b>. Cada piso tiene varias salas y se recorren por las escaleras.</li>'
 +'<li>Al tocar <b>🏰 Entrar al Castillo Maldito</b>, junto a la puerta, el interior ocupa <b>toda la pantalla</b>.</li>'
 +'<li><b>Criaturas del castillo</b> (nivel 60 a 70): guardianes malditos, esqueletos gélidos, zombis pútridos y guardianes de cripta en el vestíbulo; espectros sangrientos, caballeros esqueleto, vampiros ancestrales, segadores abisales y guardianes carmesí en la biblioteca; vampiros cazadores, murciélagos vampiro y esqueletos sangrientos en la torre. Te atacan en cualquier momento: <b>dentro del castillo no hay zona segura</b>, y si una criatura te derrota es una <b>muerte normal del juego</b> (pierdes experiencia y oro como siempre y reapareces en la ciudad más cercana). Solo durante la pelea contra el Necromancer caer no cuesta nada.</li>'
 +'<li>El <b>Salón de los Espejos</b> no tiene criaturas: solo el Necromancer, que duerme en su trono junto al <b>🕯️ altar de la ofrenda</b>, entre columnas, un gran círculo ritual en el suelo, luz verde y violeta y <b>cuatro espejos mágicos</b>, dos a cada lado de la sala.</li>'
 +'<li>Cada piso es una escena distinta: los compañeros de Party que estén en otro piso no se ven entre sí.</li></ul>'
 +'<h3>Cómo se pelea contra el Necromancer</h3>'
 +'<ol class="mjw-steps">'
 +'<li><b>Baja al Salón y pide turno.</b> Entra al castillo, baja hasta el Salón de los Espejos y acércate al altar: toca <b>🕯️ Altar de la ofrenda</b> para abrir el 📖 Diario y pulsa <b>⚔️ Pedir turno</b>. La ofrenda se hace en el altar, no desde fuera. En Party lo hace solo el <b>líder</b>, que pone la ofrenda; todos los miembros deben cumplir el nivel, tener el santuario descubierto, no tener recarga activa y estar en el territorio o dentro del castillo.</li>'
 +'<li><b>Espera tu turno.</b> La arena es de uso exclusivo: si hay alguien peleando te pones en cola desde el mismo altar (ves tu posición y puedes salir de ella cuando quieras); aunque haya una pelea en curso puedes bajar al Salón a esperar, y no ves lo que pasa en ella. Cuando te toca tienes un minuto para pulsar <b>Entrar</b> y la pelea te lleva sola al Salón, estés donde estés dentro del territorio. En Party la pelea empieza cuando todos confirman o se acaba el minuto: si el líder no confirmó se pierde el turno (sin gastar nada) y quien no confirme se queda fuera de esa pelea.</li>'
 +'<li><b>La ofrenda se gasta al empezar,</b> cuando el servidor confirma el combate. Si algo falla antes, no la pierdes.</li>'
 +'<li><b>Pelea.</b> El Necromancer ataca por turnos y cada ataque se avisa antes de golpear: muévete para esquivarlo. La vida del jefe es <b>compartida</b> por todo el grupo. Mientras dura la pelea la escalera del Salón <b>queda sellada por una barrera de sombras</b>: se sale al terminar o con el botón 🚪.</li>'
 +'<li><b>Fase 2.</b> Al bajar al 25 % de su vida invoca el <b>Pacto de las Sombras</b>: despiertan todos los espejos que seguían dormidos y ataca más rápido, combinando esferas, círculos, saltos y condenados.</li>'
 +'<li><b>Fin del combate.</b> Si el jefe cae, ganas. Si caen todos los participantes, gana el Necromancer (la ofrenda ya estaba gastada).</li></ol>'
 +'<h3>Los espejos</h3>'
 +'<ul><li>El Necromancer no camina: <b>sale de un espejo, ataca y se disuelve en él</b>, y vuelve a salir por otro. <b>Solo se le puede dañar cuando está fuera del cristal.</b></li>'
 +'<li><b>El espejo por el que va a salir brilla en verde</b> un momento antes y se oye un tintineo desde su lado de la sala. Si queda fuera de pantalla, una <b>flecha verde</b> en el borde te indica hacia dónde mirar, y una <b>flecha violeta</b> señala al jefe cuando no lo ves. Tras usarlo, el espejo se apaga un instante.</li>'
 +'<li>En la fase 1 solo usa <b>dos de los cuatro espejos</b> (los otros duermen, apagados); en la fase 2 despiertan todos los que sigan enteros.</li>'
 +'<li><b>💥 Romper espejo.</b> Junto a un espejo aparece el botón (pasados unos segundos de pelea). Puedes romper hasta <b>2 espejos por combate</b>, contando los de todo el grupo: el Necromancer tendrá menos salidas, sobre todo en la fase 2, que usa todos los que queden. Pero el espejo <b>estalla en una descarga de energía</b> unos segundos después de romperlo: un círculo rojo en el suelo marca hasta dónde llega y hiere a quien esté dentro. <i>Rómpelo y aléjate enseguida.</i></li></ul>'
 +'<h3>Sus habilidades</h3>'
 +'<ul><li><b>💀 Proyectil de la Muerte.</b> Sale del espejo y lanza dos esferas oscuras, una tras otra, y una línea punteada avisa a quién apunta. Las esferas te <b>persiguen</b>, pero giran despacio. <i>Rodea una columna: la esfera se rompe contra ella.</i></li><li><b>🦴 Legión Condenada.</b> Unas runas se abren junto al espejo y se levantan hasta <b>2 condenados</b> que te persiguen cuerpo a cuerpo; caen con unos 6 golpes, duran poco y no invocan más. En Party, cada jugador se las ve con los suyos. <i>Acaba con ellos antes de que te rodeen, o rodea una columna.</i></li><li><b>🌀 Salto Dimensional.</b> Se disuelve en un remolino y reaparece en otro espejo, y después en un tercero; cada llegada suelta una pulsación de energía alrededor del espejo. <i>El aro del suelo marca dónde aparecerá: no te quedes ahí.</i></li><li><b>⭕ Círculo de Condena.</b> Marca en el suelo, bajo ti y a tu alrededor, tres círculos de runas que se llenan uno tras otro y estallan en una columna de luz. <i>Sal del círculo antes de que se llene.</i></li><li><b>🕯️ Pacto de las Sombras</b> (solo en fase 2). Se coloca en el centro del Salón, los espejos despiertan lanzando rayos y estalla una gran nova ritual; después encadena combinaciones de esferas, círculos, saltos y legión. <i>Corre a las esquinas, fuera del círculo grande.</i></li></ul>'
 +'<h3>Si caes</h3><ul><li><b>Caer no cuesta nada:</b> no pierdes experiencia, oro ni objetos. Te quedas mirando y, al salir, tu vida se restaura (al menos al 60 %). Mientras estás caído no puedes romper espejos.</li><li><b>🚪 Salir:</b> si quieres irte antes, el botón 🚪 de la barra del jefe (pide confirmar con un segundo toque) te saca al instante. Quien abandona <b>no cuenta para el botín ni recibe recarga</b>.</li><li>Si recargas la página o se corta la conexión en plena pelea, <b>vuelves al mismo punto</b> (hasta 90 segundos sin conexión) y los espejos que ya se rompieron siguen rotos.</li><li>Lo que pasa en el Salón durante tu pelea solo lo ven tú y tu Party: quien espera turno en la misma sala no ve al jefe ni sus ataques.</li></ul>'
 +'<h3>Recompensa y recarga del Necromancer</h3><p>Al ganar se hace <b>una sola tirada</b> por combate:</p>'
 +'<ul><li><b>45 %</b> · 🧪 Pociones de vida y de maná</li><li><b>5 %</b> · 🎩 Equipo exclusivo: Sombrero del Señor Oscuro (casco de Mago)</li><li><b>3 %</b> · 🔮 Núcleo de las Sombras (ficha)</li><li><b>47 %</b> · Nada esta vez</li></ul>'
 +'<ul><li>La tirada es para <b>un</b> participante elegido al azar entre los que no abandonaron y siguen conectados (también los que cayeron peleando); no depende de quién pegó más y todos ven quién se la lleva.</li><li>La <b>recarga es individual</b>: 12 horas desde tu victoria (con el reloj del servidor) para volver a enfrentar a ese jefe. No afecta a la de la Banshee.</li><li>La ofrenda nunca la suelta el jefe y no hay experiencia por ganar: el premio es solo el botín de la tirada.</li></ul>'
 +'<h2>⚔️ El combate contra el Velociraptor</h2><p>El <b>Bosque de los Colmillos</b> es un bosque vivo: árboles que no se pueden atravesar, senderos de tierra pisada y claros de hierba alta. Se entra por el <b>Portal de los Colmillos</b>, un muro de roca cubierto de musgo y raíces con dos colmillos gigantes que se cruzan sobre una boca oscura, un cráneo de raptor con ojos ámbar y un nido en la cornisa. Tiene <b>cuatro zonas</b> y el Velociraptor reina en la más ancha de todas, el <b>Claro del Depredador</b>. Es de nivel <b>120</b> y se puede enfrentar <b>en solitario o en Party</b>. Necesitas el nivel 100, el santuario descubierto y un <b>Huevo del Depredador Ancestral</b>.</p>'
 +'<h3>El bosque por dentro</h3>'
 +'<ul><li><b>Cuatro zonas:</b> la <b>Senda de los Colmillos</b> (la entrada y el cruce de caminos), que lleva por un lado a la <b>Cañada de los Nidos</b> y de ahí a la <b>Colina de las Huellas</b>, y por el otro al <b>Claro del Depredador</b>. Cada cruce entre zonas tiene su rótulo con el nombre del lugar al que lleva.</li>'
 +'<li>Al tocar <b>🌲 Entrar al Bosque de los Colmillos</b>, junto al portal, el interior ocupa <b>toda la pantalla</b>. La hierba alta se agita a tu paso, hay luciérnagas entre los troncos y las copas de los árboles pasan por encima de quien camina detrás (se vuelven translúcidas para que no pierdas de vista a nadie).</li>'
 +'<li><b>Criaturas del bosque</b> (nivel 95 a 110): raptores jóvenes, lobos nocturnos, víboras verdes y viudas de las cavernas en la Senda; cobras negras, tejedoras pálidas, lobos alfa y anacondas del pantano en la Cañada; leones sombríos, arañas de cueva y corales rojos en la Colina. Te atacan en cualquier momento: <b>dentro del bosque no hay zona segura</b>, y si una criatura te derrota es una <b>muerte normal del juego</b> (pierdes experiencia y oro como siempre y reapareces en la ciudad más cercana). Solo durante la pelea contra el Velociraptor caer no cuesta nada.</li>'
 +'<li>El <b>Claro del Depredador</b> no tiene criaturas: solo el Velociraptor, un depredador de casi el doble de tu altura. En el centro está el <b>🕯️ nido-altar de la ofrenda</b>, con huevos, huesos y huellas, y alrededor hay rocas, troncos caídos y <b>seis manchones de hierba alta</b>.</li>'
 +'<li>Cada zona es una escena distinta: los compañeros de Party que estén en otra zona no se ven entre sí.</li></ul>'
 +'<h3>Cómo se pelea contra el Velociraptor</h3>'
 +'<ol class="mjw-steps">'
 +'<li><b>Ve al Claro y pide turno.</b> Entra al bosque, cruza la Senda hasta el Claro del Depredador y acércate al nido-altar: toca <b>🕯️ Nido-altar de la ofrenda</b> para abrir el 📖 Diario y pulsa <b>⚔️ Pedir turno</b>. La ofrenda se hace en el altar, no desde fuera. En Party lo hace solo el <b>líder</b>, que pone la ofrenda; todos los miembros deben cumplir el nivel, tener el santuario descubierto, no tener recarga activa y estar en el territorio o dentro del bosque.</li>'
 +'<li><b>Espera tu turno.</b> La arena es de uso exclusivo: si hay alguien peleando te pones en cola desde el mismo altar (ves tu posición y puedes salir de ella cuando quieras); aunque haya una pelea en curso puedes ir al Claro a esperar, y no ves lo que pasa en ella. Cuando te toca tienes un minuto para pulsar <b>Entrar</b> y la pelea te lleva sola al Claro, estés donde estés dentro del territorio. En Party la pelea empieza cuando todos confirman o se acaba el minuto: si el líder no confirmó se pierde el turno (sin gastar nada) y quien no confirme se queda fuera de esa pelea.</li>'
 +'<li><b>La ofrenda se gasta al empezar,</b> cuando el servidor confirma el combate. Si algo falla antes, no la pierdes.</li>'
 +'<li><b>Pelea.</b> El Velociraptor ataca por turnos y cada ataque se avisa antes de golpear: muévete para esquivarlo. La vida del jefe es <b>compartida</b> por todo el grupo. Mientras dura la pelea la senda de salida del Claro <b>queda cerrada por una muralla de zarzas</b>: se sale al terminar o con el botón 🚪.</li>'
 +'<li><b>Fase 2.</b> Al bajar al 25 % de su vida despierta el <b>Instinto Alfa</b>: se mueve más rápido, embosca más veces, descansa menos entre ataques y los encadena (carga y barrido, emboscada y barrido, garras y carga, doble carga).</li>'
 +'<li><b>Fin del combate.</b> Si el jefe cae, ganas. Si caen todos los participantes, gana el Velociraptor (la ofrenda ya estaba gastada).</li></ol>'
 +'<h3>La hierba alta y la emboscada</h3>'
 +'<ul><li>El Velociraptor <b>se esconde en la hierba alta y salta sobre uno de los héroes</b>. Antes de saltar delata dónde está: <b>la hierba se agita</b> y se dobla hacia donde corre, aparecen <b>huellas y polvo</b> y se oyen <b>pasos entre la maleza</b>, con el sonido del lado donde está. Al fijar a su presa, un <b>círculo en el suelo</b> marca dónde va a caer: sal de él antes del salto.</li>'
 +'<li><b>🐾 Rastrear</b> (todas las clases). Durante unos segundos ves su escondite, a quién persigue y dónde saltaría. Dura 5 segundos (<b>9 para el Arquero y la Elfa Druida</b>) y se recarga en 14.</li>'
 +'<li><b>🔥 Quemar hierba</b> (solo el Mago). Junto a un manchón de hierba alta, el Mago puede quemarlo: el fuego es <b>local</b> (solo ese manchón), <b>temporal</b> (queda ceniza unos 16 segundos y la hierba rebrota) y <b>limitado</b> (como mucho dos manchones quemados a la vez y una recarga de 9 segundos por Mago). Si el Velociraptor estaba escondido ahí, sale chamuscado y rugiendo sin saltar; y no puede esconderse en un manchón quemado, así que tiene menos emboscadas posibles. El fuego no hiere a tus compañeros.</li>'
 +'<li>Las demás clases no necesitan fuego: con Rastrear, las señales de la hierba y el círculo de caída se esquiva igual. <i>Mantente fuera de los manchones cuando oigas pasos.</i></li></ul>'
 +'<h3>Sus habilidades</h3>'
 +'<ul><li><b>💨 Carga del Depredador.</b> Se agacha, gruñe y se lanza en línea recta; un <b>carril rojo</b> en el suelo marca por dónde pasará. Si choca con una roca o un tronco queda <b>aturdido</b> un momento. <i>Sal del carril de lado, o ponte detrás de una roca para que se estrelle.</i></li><li><b>🌿 Emboscada de la Maleza.</b> Corre hasta un manchón de hierba alta, se esconde y salta sobre el héroe que eligió. <i>Mira la hierba, escucha los pasos y no te quedes en el círculo.</i></li><li><b>🌀 Barrido de Cola.</b> Se acerca, se gira y barre con la cola en un <b>anillo</b> a su alrededor. <i>Aléjate de él cuando levante la cola.</i></li><li><b>🩸 Combo de Garras.</b> Tres zarpazos seguidos, cada uno en una dirección distinta, que el aviso dibuja en el suelo como abanicos. <i>Sal hacia un lado antes del primero.</i></li><li><b>🐺 Instinto Alfa</b> (solo en fase 2). Ruge y suelta una gran <b>onda</b> a su alrededor; después encadena ataques con menos descanso. <i>Sal del círculo del rugido y no te confíes cuando parezca que descansa.</i></li></ul>'
 +'<h3>Si caes</h3><ul><li><b>Caer no cuesta nada:</b> no pierdes experiencia, oro ni objetos. Te quedas mirando y, al salir, tu vida se restaura (al menos al 60 %). Mientras estás caído no puedes quemar hierba.</li><li><b>🚪 Salir:</b> si quieres irte antes, el botón 🚪 de la barra del jefe (pide confirmar con un segundo toque) te saca al instante. Quien abandona <b>no cuenta para el botín ni recibe recarga</b>.</li><li>Si recargas la página o se corta la conexión en plena pelea, <b>vuelves al mismo punto</b> (hasta 90 segundos sin conexión) y la hierba que ya ardió sigue quemada.</li><li>Lo que pasa en el Claro durante tu pelea solo lo ven tú y tu Party: quien espera turno en la misma zona no ve al jefe ni sus ataques.</li></ul>'
 +'<h3>Recompensa y recarga del Velociraptor</h3><p>Al ganar se hace <b>una sola tirada</b> por combate:</p>'
 +'<ul><li><b>45 %</b> · 🧪 Pociones de vida y de maná</li><li><b>5 %</b> · 🪖 Equipo exclusivo: Casco de Piel Ancestral (casco de la clase de quien gane la tirada)</li><li><b>3 %</b> · 🌿 Corazón de la Naturaleza Salvaje (ficha)</li><li><b>47 %</b> · Nada esta vez</li></ul>'
 +'<ul><li>La tirada es para <b>un</b> participante elegido al azar entre los que no abandonaron y siguen conectados (también los que cayeron peleando); no depende de quién pegó más y todos ven quién se la lleva.</li><li>La <b>recarga es individual</b>: 12 horas desde tu victoria (con el reloj del servidor) para volver a enfrentar a ese jefe. No afecta a la de la Banshee ni a la del Necromancer.</li><li>La ofrenda nunca la suelta el jefe y no hay experiencia por ganar: el premio es solo el botín de la tirada.</li></ul>'
 +note('Ver <a href="#/submundo">El Submundo</a> para los monstruos de nivel 40 a 350 y a <a href="#/farmeo">Farmeo, oro y botín</a> para lo que sueltan.');

/* ---------- Celestiales y dragones ---------- */
P.celestiales=()=>head('Celestiales y dragones','Las criaturas legendarias de la Ruta')
 +'<h2>Las Bestias Celestiales</h2><div class="stage-row" style="--gc:#b27bff">'+[['nhorse','Caballo Celestial'],['cow','Buey Celestial'],['lion','León Celestial Dorado']].map(b=>'<div class="sr-i">'+SP('an-'+b[0]+'-1',6)+'<small>'+b[1]+'</small></div>').join('')+'</div><div class="lore"><p>'+L.celest.p.join('</p><p>')+'</p></div>'
 +tbl(['Bestia','Vida','Maná','Dónde'],W.celest.map(z=>['🌠 '+esc(z.n),fmt(z.hp),fmt(z.mp),'Esquina '+z.dir+' del mapa']),[1,2])
 +note('Derrotar a una Celestial te da su montura como premio: el <b>Corcel Dorado</b> o el <b>Buey Robusto</b>. No se venden en ninguna tienda. El <b>León Rojo</b> es la tercera montura de premio. Ver <a href="#/mascotas">Mascotas y monturas</a>.')
 +'<h2>Los dragones del mes</h2><div class="stage-row" style="--gc:#ff4a62">'+W.dragons.map(d=>'<div class="sr-i">'+(DRG[d.k]||SP(d.k=='fire'?'fire-elemental-1':'blood-lord-down-1',6))+'<small>'+esc(d.n)+'</small></div>').join('')+'</div><div class="lore"><p>'+L.dragon.p[0]+'</p></div>'
 +tbl(['Dragón','Elemento'],W.dragons.map(d=>[esc(d.n),d.k=='fire'?'🔥 Fuego':'❄️ Hielo']))
 +note('Hay tres eventos de dragón por mes. La fecha, la hora y el dragón son iguales para todos los jugadores. Sueltan <a href="#/objetos/materiales">escamas y corazones de dragón</a>.')
 +(()=>{const S=W.sanct,dg=I.dg.find(d=>d.id=='dr');
  return '<h2 id="santuario">🐲 El Santuario de los Dragones</h2>'
  +'<div class="snc">'+TILEP('kv-dr.jpg')+'<div class="snb"><h3>La Montaña de los Dragones</h3><p>'+(dg&&dg.rumor?'<i>Se rumorea: '+esc(dg.rumor)+'.</i> ':'')+'En el extremo noroeste del mapa, cerca de la casilla <b>'+S.x+', '+S.y+'</b>, hay un macizo de piedra oscura con una sola entrada. Se abre desde el <b>nivel '+S.lv0+'</b> y baja nueve pisos: ocho dragones elementales, uno por piso, y en el último la catedral del <b>Dragón Ancestral</b>.</p>'
  +'<p>Los dragones son duros (<b>vida ×1,7 y daño ×1,2</b>) y lanzan un <b>aliento elemental en cono</b>: cuando veas el aviso ❗, sal de la línea. Cada piso tiene su propia arquitectura y su propia paleta. Lleva grupo, pociones y buena armadura.</p></div></div>'
  +'<div class="stage-row" style="--gc:#ff4a62">'+S.floors.slice(0,8).map((f,i)=>'<div class="sr-i" style="--dc:'+f.col+'">'+KV.dz(i,1.15)+'<small>'+esc(f.dr)+'</small><span class="flr"><i></i>'+f.ic+' '+esc(f.el)+' · Nv '+f.lv+'</span></div>').join('')+'</div>'
  +tbl(['Piso','Lugar','Dragón','Elemento','Nivel'],S.floors.map((f,i)=>[i+1,esc(f.n)+' <small>('+esc(f.arq)+')</small>',(i<8?'':'👑 ')+esc(f.dr),f.ic+' '+esc(f.el),'<span style="white-space:nowrap">Nv '+f.lv+'</span>']),[0,4])
  +'<h3>Jefe: Dragón Ancestral</h3><p>En el piso 9 reina el <b>'+esc(S.boss.n)+'</b>, un dragón gigante de nivel aproximado <b>'+S.boss.lv+'</b> (vida ×1,8 y daño ×1,3). Suelta, con un <b>2 %</b>, un arma <b>épica de nivel 700</b> al azar, además de objetos comunes y raros y pociones de vida y maná. Los demás dragones sueltan lo mismo que el resto de monstruos (sin oro).</p>'
  +note('Los dragones del Santuario también se mueven en grupos pequeños: se avisan solo entre vecinos, patrullan y vuelven a su sitio si te alejas. Ver <a href="#/monstruos">cómo pelean los monstruos</a>.')})();

/* ---------- Mascotas y monturas ---------- */
P.mascotas=()=>{
  const sp=p=>spBase('an-'+p.sp,5,1),f=n=>n==null?'—':n;
  const card=p=>'<article class="pet"><div class="pt-s" style="--gc:'+(p.kind=='m'?'#ffc83d':'#34d27b')+'">'+sp(p)+'</div><div class="pt-b"><h3>'+p.ic+' '+esc(p.n)+'</h3><div class="pt-k">'+(p.kind=='m'?pill('Montura','r3'):pill('Compañero','g'))+(p.both?' '+pill('Montura y mascota','r2'):'')+' '+(p.price?pill(money(p.price),'t'):pill('Premio de jefe','r3'))+'</div><p>'+esc(p.d)+'</p><div class="pt-n"><span>❤️ <b>'+p.hp+'</b></span><span>⚡ <b>'+p.en+'</b></span><span>⚔️ <b>'+p.atk+'</b></span>'+(p.rng?'<span>🎯 <b>'+p.rng+'</b></span>':'')+(p.spd?'<span>👟 <b>+'+Math.round((p.spd-1)*100)+'%</b></span>':'')+(p.cargo?'<span>📦 <b>+'+p.cargo+'</b></span>':'')+'</div></div></article>';
  return head('Mascotas y monturas','Compañeros que pelean contigo y monturas veloces. Todos suben de nivel como tú.')
  +'<h2>🐕 Compañeros de combate</h2><div class="pets">'+I.pets.filter(p=>p.kind=='c').map(card).join('')+'</div>'
  +'<h2>🐎 Monturas</h2><div class="pets">'+I.pets.filter(p=>p.kind=='m'&&!p.both).map(card).join('')+'</div>'
  +'<h2>🌠 Bestias de premio</h2><p>Se ganan derrotando a las Bestias Celestiales y funcionan como montura <b>y</b> como mascota de combate.</p><div class="pets">'+I.pets.filter(p=>p.both).map(card).join('')+'</div>'
  +'<h2 id="premium">🦖 Mascotas premium · Tienda de mascotas (💎)</h2>'+'<p>En el menú del héroe, <b>💎 Tienda → 🦖 Tienda mascotas</b>, se <b>alquilan o se compran con gemas</b>. Ahí solo se venden las mascotas <b>premium</b>: la primera, y por ahora la única, es el <b>T-Rex</b>.</p>'+'<p>Todas las <b>demás mascotas y monturas no se compran con gemas</b>: las consiguen los jugadores y se las venden entre ellos (por gemas, oro, USDT, subasta o trato directo; ver el <a href="#/mascotas~mercado-mascotas">Mercado de mascotas</a>). Los compañeros se ganan con los encargos del Maestro de animales en el Establo o venciendo a los guardianes de sus guaridas, y las monturas viven salvajes y se doman con 🪢 lazo.</p>'+'<style>.kvtrex{display:block;width:64px;height:64px;background:url(data:image/png;base64,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) 0 -128px no-repeat;image-rendering:pixelated;animation:kvtrexw .9s steps(1,end) infinite;transform:scale(1.55);transform-origin:center}@keyframes kvtrexw{0%{background-position:0 -128px}50%{background-position:-64px -128px}100%{background-position:0 -128px}}</style>'+'<div class="pets"><article class="pet" style="border-color:rgba(255,200,61,.65)"><div class="pt-s" style="--gc:#ffc83d"><span class="kvtrex" role="img" aria-label="T-Rex caminando"></span></div><div class="pt-b"><h3>🦖 T-Rex</h3><div class="pt-k">'+pill('Compañero','g')+' '+pill('Premium','r3')+' '+pill('10 💎 · o 3 💎 por 7 días','t')+'</div><p>Enorme: mide unas <b>3,7 veces</b> lo que un héroe. <b>Súper agresivo</b> (sale a buscar enemigos y muerde sin parar), pero de <b>caminar lento y pesado</b> como un dinosaurio de verdad. Ruge al llegar y cuando pelea, y <b>cada paso hace vibrar la pantalla</b> (se puede apagar). Como tú, <b>choca con casas, murallas, árboles, agua y cuevas</b>: rodea los obstáculos y, si queda atrapado, aparece a tu lado. Su <b>vida y su energía</b> se ven en dos barritas sobre su cabeza, igual que las de las demás mascotas y las de tu montura.</p><div class="pt-n"><span>❤️ <b>700</b></span><span>⚡ <b>260</b></span><span>⚔️ <b>44</b></span><span>🎯 <b>86</b></span></div></div></article></div>'+'<h3>Alquilar o comprar</h3>'+tbl(['','🕒 Alquilar','💎 Comprar'],[['Precio','3 💎 por 7 días','10 💎, para siempre'],['Renovar','Sí: +7 días cada vez (hasta 30 días juntos)','—'],['Si luego la compras','Conserva su nivel: pagas 10 💎 y es tuya','—'],['Habilidades y equipo','No','Sí (Templo y Herrero)'],['Vender, regalar o cambiar','No','Sí: mercado de oro, USDT, gemas, subasta y trato directo'],['Al terminar','Se retira sola del establo','—']])+note('Las mascotas alquiladas o compradas ocupan un lugar del establo (máximo <b>8</b>). El T-Rex solo se consigue en la tienda: no se puede inventar ni copiar, el servidor lo comprueba.')+'<h2 id="templo">🛕 Templo de las Bestias · 4 habilidades por mascota</h2>'+'<p>En el menú del héroe: <b>🎒 Inventario → 🛕 Templo</b> (también hay un botón 🛕 en cada mascota de la pestaña 🐾 Mascotas). Cada mascota comprada tiene <b>4 habilidades propias</b> que suben hasta el <b>nivel 5</b> pagando oro (incluye 3 % de impuesto). Cada habilidad pide un nivel mínimo de mascota, y <b>+4 por cada nivel que ya subiste</b> de esa misma habilidad.</p>'+tbl(['🦖 T-Rex','Qué hace','Nivel 1','Nivel 5'],[["🦷 <b>Mordisco aplastante</b>", "Más daño en cada mordida y más probabilidad de crítico (×2)", "+6 % de daño · 4 % de crítico", "+30 % de daño · 20 % de crítico"], ["📣 <b>Rugido ancestral</b>", "Ruge y aturde a los enemigos cercanos", "cada 24 s · aturde 1,8 s · 165 px", "cada 16 s · aturde 3 s · 225 px"], ["🦎 <b>Coletazo</b>", "Azota la cola: daño en área, cada vez más seguido", "cada 8,4 s · daño ×1,6 en área (120 px)", "cada 6 s · daño ×2,4 en área (120 px)"], ["🦶 <b>Pisotón sísmico</b>", "Hace temblar el suelo: gran daño en área y aturdimiento", "cada 18,5 s · daño ×2,35 · aturde 1 s · 120 px", "cada 12,5 s · daño ×3,75 · aturde 1 s · 160 px"]])+tbl(['Mascota','Habilidad 1','Habilidad 2','Habilidad 3','Habilidad 4'],[['🐕 Perro','🦴 Mordida fiel (daño)','🛡️ Pelaje curtido (vida)','💞 Lamer heridas (te cura)','🔊 Ladrido atronador (área)'],['🐺 Lobo','🐺 Colmillos de lobo (daño)','❄️ Piel de invierno (vida)','🌙 Aullido sanador (te cura)','🐾 Aullido de la manada (área)'],['🦅 Halcón','🦅 Garras afiladas (daño)','🪶 Plumaje fuerte (vida)','🍃 Viento de vida (te cura)','🎯 Picada letal (área)'],['🦉 Búho','🦉 Garras nocturnas (daño)','🌑 Plumaje de sombra (vida)','🎶 Canto sanador (te cura)','😱 Chillido sombrío (área)'],['🐴 Caballo','🐎 Galope (velocidad)','🧲 Cascos de hierro (vida)','🦵 Coz rápida (daño)','💨 Aliento largo (energía)'],['🐪 Camello','🏜️ Paso firme (velocidad)','📦 Joroba cargada (carga)','🛡️ Piel gruesa (vida)','💧 Oasis interior (energía)'],['🐎 Corcel oscuro','🌑 Galope oscuro (velocidad)','🦵 Coz sombría (daño)','🛡️ Armadura de sombra (vida)','💨 Resuello eterno (energía)']])+'<h3>Qué da cada tipo de habilidad</h3>'+tbl(['Efecto','Nivel 1','Nivel 5'],[["🗡️ Daño", "+7 % de daño", "+35 %"], ["❤️ Vida", "+9 % de vida máxima", "+45 %"], ["💞 Cura", "cada 31 s te cura 2,5 % de tu vida (si estás herido y está cerca)", "cada 19 s · 12,5 %"], ["💥 Ataque en área", "cada 22 s · daño ×1,9 (110 px)", "cada 14 s · ×3,1"], ["🐎 Velocidad (monturas)", "+1,2 % de velocidad al montarla", "+6 %"], ["💨 Energía (monturas)", "+12 % de recuperación de energía al montarla", "+60 %"], ["📦 Carga (camello)", "+8 de carga al montarla", "+40"]])+'<h3>Nivel de mascota que se necesita</h3><p>Para subir una habilidad al nivel 1, 2, 3, 4 o 5, la mascota debe tener al menos este nivel (máximo 30):</p>'+tbl(['','→ Nv 1','→ Nv 2','→ Nv 3','→ Nv 4','→ Nv 5'],[["Habilidad 1", "1", "5", "9", "13", "17"], ["Habilidad 2", "4", "8", "12", "16", "20"], ["Habilidad 3", "8", "12", "16", "20", "24"], ["Habilidad 4", "12", "16", "20", "24", "28"]])+'<h3>Costo en oro de cada nivel</h3>'+tbl(['Nivel','H1','H2','H3','H4','T-Rex H1','T-Rex H2','T-Rex H3','T-Rex H4'],[["Nv 1", "61.800 🪙", "92.700 🪙", "123.600 🪙", "185.400 🪙", "123.600 🪙", "185.400 🪙", "247.200 🪙", "370.800 🪙"], ["Nv 2", "185.400 🪙", "278.100 🪙", "370.800 🪙", "556.200 🪙", "370.800 🪙", "556.200 🪙", "741.600 🪙", "1.112.400 🪙"], ["Nv 3", "556.200 🪙", "834.300 🪙", "1.112.400 🪙", "1.668.600 🪙", "1.112.400 🪙", "1.668.600 🪙", "2.224.800 🪙", "3.337.200 🪙"], ["Nv 4", "1.648.000 🪙", "2.472.000 🪙", "3.296.000 🪙", "4.944.000 🪙", "3.296.000 🪙", "4.944.000 🪙", "6.592.000 🪙", "9.888.000 🪙"], ["Nv 5", "4.944.000 🪙", "7.416.000 🪙", "9.888.000 🪙", "14.832.000 🪙", "9.888.000 🪙", "14.832.000 🪙", "19.776.000 🪙", "29.664.000 🪙"]],[1,2,3,4,5,6,7,8])+note('Las habilidades viajan con la mascota: si la vendes, el comprador las recibe. El T-Rex cuesta el doble de entrenar. Las mascotas alquiladas no aprenden habilidades.')+'<h2 id="equipo-mascota">🛡️ Equipo de mascota · 4 piezas (solo el Herrero)</h2>'+'<p>Como el héroe, la mascota viste equipo, pero con <b>4 piezas</b>: <b>Casco</b> (vida), <b>Peto</b> (menos daño recibido), <b>Garras</b> (daño) y <b>Grebas</b> (velocidad). <b>Solo se fabrican con el Herrero</b> (Herrería → 🦖 Equipo mascota), con oro y materiales, y cuestan <b>mucho más</b> que las piezas básicas de los héroes. Se ponen y se quitan desde el 🛕 Templo, y <b>se pueden vender como todo lo demás</b> (NPC, mercado, subasta, USDT…). Con las 4 piezas puestas, el T-Rex lleva un aro brillante a sus pies, del color de su pieza de menor nivel.</p>'+tbl(['Pieza','Efecto','Mascota','Oro (con 3 % de impuesto)','Materiales'],[["<b>Casco de Hueso</b>", "+4 % de vida máxima", "Nv 1", "82.400 🪙", "⚙️ Hierro ×24 · 🟫 Piel de lobo ×30"], ["<b>Peto de Hueso</b>", "3 % menos daño recibido", "Nv 1", "123.600 🪙", "⚙️ Hierro ×36 · 🟫 Piel de lobo ×45"], ["<b>Garras de Hueso</b>", "+4 % de daño", "Nv 1", "98.880 🪙", "⚙️ Hierro ×29 · 🟫 Piel de lobo ×36"], ["<b>Grebas de Hueso</b>", "+3 % de velocidad", "Nv 1", "74.160 🪙", "⚙️ Hierro ×22 · 🟫 Piel de lobo ×27"], ["<b>Casco de Acero</b>", "+8 % de vida máxima", "Nv 6", "309.000 🪙", "⚙️ Hierro ×50 · 🥈 Plata ×14 · 🟫 Piel de lobo ×60"], ["<b>Peto de Acero</b>", "6 % menos daño recibido", "Nv 6", "463.500 🪙", "⚙️ Hierro ×75 · 🥈 Plata ×21 · 🟫 Piel de lobo ×90"], ["<b>Garras de Acero</b>", "+8 % de daño", "Nv 6", "370.800 🪙", "⚙️ Hierro ×60 · 🥈 Plata ×17 · 🟫 Piel de lobo ×72"], ["<b>Grebas de Acero</b>", "+6 % de velocidad", "Nv 6", "278.100 🪙", "⚙️ Hierro ×45 · 🥈 Plata ×13 · 🟫 Piel de lobo ×54"], ["<b>Casco de Mitril</b>", "+13 % de vida máxima", "Nv 12", "1.133.000 🪙", "🥈 Plata ×30 · 🥇 Oro en bruto ×12 · 💠 Mitril ×6 · 🟫 Piel de lobo ×100"], ["<b>Peto de Mitril</b>", "10 % menos daño recibido", "Nv 12", "1.699.500 🪙", "🥈 Plata ×45 · 🥇 Oro en bruto ×18 · 💠 Mitril ×9 · 🟫 Piel de lobo ×150"], ["<b>Garras de Mitril</b>", "+13 % de daño", "Nv 12", "1.359.600 🪙", "🥈 Plata ×36 · 🥇 Oro en bruto ×14 · 💠 Mitril ×7 · 🟫 Piel de lobo ×120"], ["<b>Grebas de Mitril</b>", "+9 % de velocidad", "Nv 12", "1.019.700 🪙", "🥈 Plata ×27 · 🥇 Oro en bruto ×11 · 💠 Mitril ×5 · 🟫 Piel de lobo ×90"], ["<b>Casco Dracónico</b>", "+19 % de vida máxima", "Nv 18", "4.120.000 🪙", "💠 Mitril ×24 · 💎 Diamante ×4 · 🐲 Escama de dragón ×6"], ["<b>Peto Dracónico</b>", "15 % menos daño recibido", "Nv 18", "6.180.000 🪙", "💠 Mitril ×36 · 💎 Diamante ×6 · 🐲 Escama de dragón ×9"], ["<b>Garras Dracónico</b>", "+19 % de daño", "Nv 18", "4.944.000 🪙", "💠 Mitril ×29 · 💎 Diamante ×5 · 🐲 Escama de dragón ×7"], ["<b>Grebas Dracónico</b>", "+13 % de velocidad", "Nv 18", "3.708.000 🪙", "💠 Mitril ×22 · 💎 Diamante ×4 · 🐲 Escama de dragón ×5"], ["<b>Casco Ancestral</b>", "+26 % de vida máxima", "Nv 24", "14.420.000 🪙", "💎 Diamante ×10 · 🐲 Escama de dragón ×18 · ❤️‍🔥 Corazón de dragón ×2"], ["<b>Peto Ancestral</b>", "21 % menos daño recibido", "Nv 24", "21.630.000 🪙", "💎 Diamante ×15 · 🐲 Escama de dragón ×27 · ❤️‍🔥 Corazón de dragón ×3"], ["<b>Garras Ancestral</b>", "+26 % de daño", "Nv 24", "17.304.000 🪙", "💎 Diamante ×12 · 🐲 Escama de dragón ×22 · ❤️‍🔥 Corazón de dragón ×2"], ["<b>Grebas Ancestral</b>", "+18 % de velocidad", "Nv 24", "12.978.000 🪙", "💎 Diamante ×9 · 🐲 Escama de dragón ×16 · ❤️‍🔥 Corazón de dragón ×2"]],[3])+note('Una pieza puesta viaja con la mascota si la vendes. Las mascotas alquiladas no usan equipo. Los héroes no pueden ponerse estas piezas.')+'<h2 id="mercado-mascotas">🏪 Mercado de mascotas (💎)</h2>'+'<p>Además del mercado de oro, la subasta, el mercado de USDT y el trato directo, hay un <b>mercado de mascotas en gemas</b> dentro de la Tienda de mascotas, donde vendes <b>cualquier mascota o montura tuya</b> que no sea alquilada (la que domaste, la que ganaste o la que compraste). Publicar cuesta el <b>3 %</b> del precio (no se devuelve), el comprador paga otro <b>3 %</b>, el anuncio dura <b>8 días</b> y puedes tener hasta 12. Se ve cuántas habilidades y piezas trae cada mascota.</p>'+'<h2 id="vibracion">📳 Pasos del T-Rex y vibración</h2>'+'<p>Cada pisada del T-Rex suena, levanta polvo y <b>sacude la pantalla</b>; en los celulares Android además <b>vibra</b>. Si te molesta, se apaga con el botón <b>📳 Vibración</b> de la ficha del T-Rex (menú 🐾 Mascotas) o del 🛕 Templo, y se queda guardado. El rugido y los pisotones usan el mismo interruptor.</p>'+note('Con gemas solo se vende el <b>T-Rex</b> (<a href="#/mascotas~premium">Tienda de mascotas</a>). Los demás compañeros se ganan en el <b>Establo</b> de cada ciudad (encargos del Maestro de animales) o venciendo a los guardianes de sus guaridas, y las monturas se doman con lazo. Comen <b>carne</b> (compañeros) o <b>pasto</b> (monturas) y se curan con hierbas medicinales. Ver <a href="#/objetos/comida">comida y pesca</a>.')
  +note('Además existen <b>misiones de cadena</b> para conseguir al perro, el lobo, el halcón y el búho sin pagar: pruebas de escolta, caza y defensa en el mapa.')
  +note('<b>🗑️ Destruir:</b> en el menú 🐾 Mascotas (y en el 🛕 Templo) cada mascota tiene el botón <b>Destruir</b>; se confirma con un segundo toque y no se recupera. Las <b>alquiladas</b> no se pueden destruir y el equipo que lleve la mascota vuelve a tu mochila.');
};

/* ---------- Arte y fondos ---------- */
const DL=(f,n)=>'<a class="btn btn-sm dl" href="'+f+'" download>⬇ '+n+'</a>';
P.arte=()=>head('Arte y fondos','Arte original de Karavan Online. Toca una imagen para verla grande o descarga el fondo de pantalla.')
 +'<h2>Logo</h2><div class="logo-box"><img src="kv-logo.webp" alt="Logo de Karavan Online" width="1500" height="696" loading="lazy"></div><p>'+DL('kv-logo.webp','Logo (WebP con fondo transparente)')+'</p>'
 +'<h2>Fondos de pantalla</h2><div class="walls"><figure class="wall shot"><img src="kv-bg.jpg" alt="Fondo 16:9" loading="lazy"><figcaption>PC · 16:9 · 2400 × 1350</figcaption>'+DL('kv-bg.jpg','Descargar')+'</figure><figure class="wall shot"><img src="kv-bg-p.jpg" alt="Fondo vertical" loading="lazy"><figcaption>Móvil · vertical · 900 × 1948</figcaption>'+DL('kv-bg-p.jpg','Descargar')+'</figure></div>'
 +'<h2>Las cartas de los héroes</h2><div class="hgrid hg2">'+W.classes.map(c=>KV.heroCard(c.id)).join('')+'</div>'
 +'<h2>En PC, Android y iOS</h2><div class="gal g3">'+fig('kv-dev-pc.jpg','PC','Captura real del juego')+fig('kv-dev-and.jpg','Android','Captura real del juego')+fig('kv-dev-ios.jpg','iPhone y iPad','Captura real del juego')+'</div>'
 +'<h2>Lugares del juego</h2><div class="gal">'+fig('kv-places.jpg','Hoja de lugares','16 tierras y 12 cuevas, capturas reales del juego','wide')+'</div>'
 +'<h2>Música</h2><div class="note">🎵 <b>Caravana de Oro</b>, tema original de Karavan Online compuesto para esta web. Puedes silenciarla con el botón 🎵 de abajo a la derecha; recuerda tu elección.</div><p><audio controls preload="none" src="audio/karavan-caravana-de-oro.mp3" style="width:100%;max-width:520px"></audio></p>';

/* ---------- Créditos ---------- */
P.creditos=()=>head('Créditos','Quién hizo qué')
 +'<p><b>Karavan Online</b> es un juego de Silk Games Studios, creado en República Dominicana.</p>'
 +'<h2>Original de Karavan Online</h2><ul><li>Logo, fondos de pantalla, cartas de héroe, capturas, música «Caravana de Oro» y textos de esta wiki.</li>'
 +'<li>Hombre lobo y gusanos gigantes: dibujados por Silk Games Studios con la paleta DawnLike.</li></ul>'
 +'<h2>Arte y código de terceros</h2><ul>'
 +'<li>Juego base y sprites: <b>Rogueworld</b> © 2021 Johnathan Fisher (Arcan), licencia MIT.</li>'
 +'<li>Tileset <b>DawnLike v1.81</b> de DragonDePlatino (personajes, animales, mascotas, minotauro, medusa, lamias y cocodrilo), paleta DawnBringer. Licencia indicada en OpenGameArt: CC-BY 4.0 (el README del pack dice CC-BY-SA 3.0).</li>'
 +'<li>Sprites de los héroes: <b>aveontrainer</b> (DeviantArt), descarga libre.</li>'
 +'<li>Iconos de comida, pociones, gemas, llaves, cofres, carcajes y bolsos: hoja de pixel art (autor y licencia por confirmar).</li>'
 +'<li>Tipografías Cinzel y Cormorant Garamond, servidas desde esta misma web (SIL Open Font License).</li></ul>'
 +'<h2>Los datos</h2><p>Los datos de la wiki (objetos, atributos, precios, mapas) se extraen directamente del juego en vivo, así que reflejan lo que hay dentro.</p>'
 +note('¿Algo no cuadra con lo que ves en el juego? Díselo al equipo en el chat global del juego: la wiki se vuelve a generar con cada versión.');

/* ---------- Novedades (de las notas de cada versión) ---------- */
NEWS.push(...[
{
"v": "v442",
"ic": "🌱",
"c": "#7bd88f",
"t": "Más fácil empezar, más premio por alejarse",
"s": "Subida rápida del 1 al 5 y más XP cuanto más lejos de las ciudades",
"li": [
"<b>⬆️ Nv 1 a 5: 30 % menos muertes por nivel.</b> Del 5 al 10 la dificultad sube poco a poco hasta la de siempre, y del 10 en adelante sigue la misma fórmula con un 15 % más de muertes por nivel.",
"<b>🧭 Más lejos, más XP.</b> Cada enemigo da hasta un 40 % más de XP cuanto más lejos está de las ciudades de inicio y más fuerte es su zona. Así el +15 % de requisito se compensa al aventurarte. Ver <a href=\"#/farmeo\">Farmeo, oro y botín</a>."
],
"id": "v442"
},
{
"v": "v440",
"ic": "⚖️",
"c": "#ffb347",
"t": "Subir de nivel un 25 % más rápido",
"s": "Menos muertes por nivel en toda la escala, sin cambiar la forma del juego",
"li": [
"<b>⬆️ Un 25 % menos de muertes por nivel, en todos los niveles.</b> Contra enemigos de tu nivel y sin bonos: ≈ 260 muertes por nivel a Nv 10 (antes ≈ 350), ≈ 1.650 a Nv 30 (antes ≈ 2.240), ≈ 3.950 a Nv 50 (antes ≈ 5.300) y ≈ 12.800 a Nv 100 (antes ≈ 17.100). Un Archidemonio de nivel 29 pasa de dar ≈ 14 XP a dar ≈ 18 XP a un héroe de Nv 30. Ver <a href=\"#/farmeo\">Farmeo, oro y botín</a>."
],
"id": "v440"
},
{
"v": "v439",
"ic": "⚖️",
"c": "#ffb347",
"t": "Experiencia más equilibrada",
"s": "Subir de nivel un 30 % más rápido que antes, sin cambiar la forma del juego",
"li": [
"<b>⬆️ Un 30 % menos de muertes por nivel, en toda la escala.</b> Contra enemigos de tu nivel y sin bonos: ≈ 350 muertes por nivel a Nv 10 (antes ≈ 490), ≈ 2.240 a Nv 30 (antes ≈ 3.150), ≈ 5.300 a Nv 50 (antes ≈ 7.500) y ≈ 17.100 a Nv 100 (antes ≈ 24.400). Un Archidemonio de nivel 29 pasa de dar 9 XP a dar ≈ 14 XP a un héroe de Nv 30. Ver <a href=\"#/farmeo\">Farmeo, oro y botín</a>."
],
"id": "v439"
},
{
"v": "v438",
"ic": "⚖️",
"c": "#ffb347",
"t": "Subir de nivel más rápido, radar en el minimapa y servicios premium más claros",
"s": "Cambios a partir de lo que reportaron los probadores: experiencia, radar, botón Destruir, vender todo el loot, precios de planes y gremios",
"li": [
"<b>⬆️ Subir de nivel un poco más rápido.</b> La cuenta final de muertes por nivel quedó en la versión v439 (arriba). Ver <a href=\"#/farmeo\">Farmeo, oro y botín</a>.",
"<b>📡 Radar en el minimapa.</b> Vuelven los puntos rojos de los enemigos vivos a tu alrededor (18 casillas a la redonda), con un anillo de alcance y un contador abajo; alfas y jefes cercanos salen en naranja. El Halcón y el Búho siguen viendo más lejos.",
"<b>🗑️ Destruir mascota.</b> Cada compañero tiene el botón Destruir en 🐾 Mascotas y en el Templo (doble toque para confirmar). Las alquiladas no se pueden destruir y el equipo que lleven vuelve a tu mochila.",
"<b>💰 Vender todo el loot.</b> En la 🛡️ Armería: resumen con el total ya sin impuesto y confirmación. Conserva los objetos épicos, legendarios y mejorados; marcar uno a uno sigue igual.",
"<b>👑 Servicios premium ordenados.</b> Tres tarjetas claras: <b>Plan Jugador</b> (7 💎 por 30 días), <b>Plan Mercader</b> (10 💎, antes 12; incluye <b>todo</b> el Plan Jugador: no hay que pagar dos VIP) y <b>Gremio</b>, con una tabla comparativa. Ver <a href=\"#/premium\">Servicios premium</a>.",
"<b>🏰 Gremios más baratos.</b> Fundarlo cuesta 10 💎 una sola vez, sin mensualidad. Los territorios bajan de 15/40/90 a 8/20/45 💎, los planos de construcción de 8/5/12/18 a 3/2/5/8 💎, el tributo semanal es menor y el primer mes es gratis. Ver <a href=\"#/gremios\">Gremios y territorios</a>.",
"<b>📋 Misiones de búsqueda del Tablón.</b> Ya no caen dentro del Santuario de los Dragones, donde era imposible recogerlas.",
"<b>👥 Grupos.</b> Si tu juego es de otra versión que el servidor, ahora te lo avisa y se actualiza solo cuando no estás peleando; con la misma versión todos ven los mismos enemigos."
],
"id": "v438"
},
{
"v": "v437",
"ic": "🦖",
"c": "#8fd16a",
"t": "El Bosque de los Colmillos y el combate contra el Velociraptor",
"s": "Un bosque vivo de cuatro zonas, un claro con hierba alta donde el depredador se esconde y un jefe que salta desde la maleza",
"li": [
"<b>🌲 El Bosque de los Colmillos.</b> Un bosque vivo: árboles que no se atraviesan, senderos de tierra y un portal de roca con dos colmillos gigantes. Cuatro zonas (Senda de los Colmillos, Cañada de los Nidos, Colina de las Huellas y Claro del Depredador) que ocupan toda la pantalla; las copas de los árboles pasan por encima de quien camina detrás.",
"<b>🐺 Criaturas del bosque.</b> Raptores jóvenes, lobos, víboras, cobras, arañas, leones sombríos y anacondas de nivel 95 a 110 recorren las zonas. Dentro del bosque no hay zona segura.",
"<b>🕯️ El nido-altar.</b> El Velociraptor espera en el Claro del Depredador, la arena más ancha de los tres jefes. La ofrenda se hace en el nido-altar del centro y desde ahí se pide turno; durante la pelea la senda de salida se cierra con zarzas.",
"<b>🌿 Emboscada de la Maleza.</b> Se esconde en la hierba alta y salta sobre uno de los héroes: la hierba se agita, aparecen huellas y polvo y se oyen pasos. Todas las clases pueden pulsar 🐾 Rastrear para ver su escondite; el Mago puede 🔥 quemar un manchón de hierba (local y temporal) para dejarlo sin escondite.",
"<b>🦖 Cinco habilidades.</b> Carga del Depredador, Emboscada de la Maleza, Barrido de Cola, Combo de Garras y, al bajar del 25 % de vida, el Instinto Alfa. Cada ataque se avisa antes de golpear y tiene su propio sonido y efecto.",
"<b>🎁 Una sola tirada.</b> Al ganar: 45 % pociones, 5 % Casco de Piel Ancestral (casco de la clase del ganador), 3 % Corazón de la Naturaleza Salvaje, 47 % nada. Recarga individual de 12 horas.",
"<b>🗺️ Los tres jefes ya están abiertos.</b> Banshee, Necromancer y Velociraptor. Ver <a href=\"#/monstruos\">Monstruos y jefes</a>."
],
"id": "v437"
},
{
"v": "v436",
"ic": "🏰",
"c": "#b88cff",
"t": "El Castillo Maldito y el combate contra el Necromancer",
"s": "Un castillo de cuatro pisos que se ve desde lejos, el Salón de los Espejos y un jefe que salta de espejo en espejo",
"li": [
"<b>🏰 El Castillo Maldito.</b> Se alza sobre un risco en la Llanura de los Condenados, con cielo de tormenta, relámpagos y un halo verde y violeta que señala su dirección desde lejos. Cuatro pisos (Gran Vestíbulo, Biblioteca Prohibida, Torre del Hechicero y Salón de los Espejos) con varias salas; el interior ocupa toda la pantalla.",
"<b>💀 Criaturas del castillo.</b> Guardianes malditos, esqueletos, zombis, espectros, vampiros y segadores de nivel 60 a 70 recorren los pisos. Dentro del castillo no hay zona segura.",
"<b>🪞 El Salón de los Espejos.</b> El Necromancer espera en lo más hondo, entre columnas y un círculo ritual. La ofrenda se hace en su altar y desde ahí se pide turno; durante la pelea la escalera se sella.",
"<b>🪞 Salta de espejo en espejo.</b> Sale de un espejo, ataca y se disuelve en él. El espejo por el que va a salir brilla en verde antes y solo se le puede dañar cuando está fuera del cristal.",
"<b>💥 Romper espejos.</b> Puedes romper hasta 2 espejos por combate: tendrá menos salidas, pero el espejo estalla en una descarga de energía, así que aléjate al romperlo.",
"<b>☠️ Cinco habilidades.</b> Proyectil de la Muerte, Legión Condenada, Salto Dimensional, Círculo de Condena y, al bajar del 25 % de vida, el Pacto de las Sombras. Cada ataque se avisa antes de golpear y tiene su propio sonido y efecto.",
"<b>🎁 Una sola tirada.</b> Al ganar: 45 % pociones, 5 % Sombrero del Señor Oscuro (casco de Mago), 3 % Núcleo de las Sombras, 47 % nada. Recarga individual de 12 horas.",
"<b>📱 Celular.</b> En pantallas pequeñas la barra del jefe acorta la etiqueta de la fase para no tapar los botones.",
"<b>🔒 Velociraptor</b> recibirá su arena en una próxima actualización. Ver <a href=\"#/monstruos\">Monstruos y jefes</a>."
],
"id": "v436"
},
{
"v": "v435",
"ic": "🏚️",
"c": "#8fc8ff",
"t": "La Mansión Embrujada, rehecha: cuatro pisos y un lago",
"s": "La Banshee espera en el sótano, la mansión ocupa toda la pantalla y su grito ahora es una onda de choque",
"li": [
"<b>🏚️ Cuatro pisos.</b> Altillo, primer piso, planta baja y sótano, con varias habitaciones y escaleras entre ellos. Al entrar, la mansión ocupa toda la pantalla; por fuera tiene una fachada de piedra con las ventanas encendidas.",
"<b>👻 Criaturas de la Banshee.</b> Espectros, fantasmas, zombis, esqueletos, murciélagos, arañas y un segador abisal recorren los pisos. Dentro de la mansión no hay zona segura: si una criatura te derrota es una muerte normal del juego; solo durante la pelea contra la Banshee caer no cuesta nada.",
"<b>🕯️ El altar del sótano.</b> La Banshee espera abajo. La ofrenda se hace en su altar y desde ahí se pide turno. Si hay una pelea en curso puedes bajar a esperar tu lugar en la cola; durante la pelea las escaleras del sótano se sellan.",
"<b>🌊 Un lago negro.</b> La mansión se alza sobre una isla; se llega por un muelle de tablones y el agua de alrededor no se puede pisar.",
"<b>📢 Chillido del Lamento.</b> El ataque en cono desaparece. Ahora la Banshee chilla (un sonido agudo y desagradable) y suelta una onda de choque por todo el sótano. Los pilares de mármol la frenan: detrás de cada uno hay una sombra segura, marcada en azul antes del golpe.",
"<b>👥 Party por pisos.</b> Cada piso es otra escena: los compañeros que estén en otro piso no se ven entre sí. Si estás en la isla cuando tu líder empieza, la pelea te lleva sola al sótano.",
"<b>🔒 Necromancer y Velociraptor</b> recibirán su propia arena en próximas actualizaciones. Ver <a href=\"#/monstruos\">Monstruos y jefes</a>."
],
"id": "v435"
},
{
"v": "v434",
"ic": "👻",
"c": "#8fc8ff",
"t": "La Banshee ya se puede combatir",
"s": "Primera arena de mini-jefe: la Mansión Embrujada, en solitario o en Party",
"li": [
"<b>⚔️ Combate contra la Banshee.</b> Con el nivel 35, el santuario descubierto y un Medallón de la Viuda, pide turno desde el 📖 Diario (botón «Pedir turno»). En Party lo pide solo el líder, que pone la ofrenda; todos deben cumplir los requisitos y estar en el territorio.",
"<b>🏚️ Arena propia.</b> La Mansión Embrujada es de uso exclusivo: si está ocupada te pones en cola, ves tu posición y puedes salir de ella cuando quieras. Lo que pasa dentro no lo ven los de fuera.",
"<b>👻 Cinco habilidades.</b> Grito del Lamento, Ecos Fantasmales, Paso entre Sombras y Danza del Vendaval, y al bajar del 25 % de vida, el Último Lamento. Cada ataque se marca en el suelo antes de golpear: se esquiva moviéndote.",
"<b>💀 Caer no cuesta nada.</b> Sin pérdida de experiencia, oro ni objetos; sales con la vida restaurada. El botón 🚪 te saca antes (pide confirmar), pero quien abandona no cuenta para el botín ni recibe recarga.",
"<b>🎁 Una sola tirada.</b> Al ganar, un participante al azar recibe: 45 % pociones, 5 % equipo exclusivo, 3 % ficha, 47 % nada. La recarga de 12 horas es individual.",
"<b>📱 Para celular y PC.</b> La cámara sigue la pelea y, si recargas la página en pleno combate, vuelves al mismo punto.",
"<b>🔒 Necromancer y Velociraptor</b> abrirán sus arenas en próximas actualizaciones. Ver <a href=\"#/monstruos\">Monstruos y jefes</a>."
],
"id": "v434"
},
{
"v": "v433",
"ic": "🕯️",
"c": "#8fc8ff",
"t": "Mini-jefes: Banshee, Necromancer y Velociraptor",
"s": "Tres territorios nuevos con misiones, santuario oculto y ofrendas",
"li": [
"<b>🗺️ Tres territorios nuevos.</b> El <b>Pueblo de los Lamentos</b> (Banshee, desde el nivel 35), la <b>Llanura de los Condenados</b> (Necromancer, desde el 65) y el <b>Bosque de los Colmillos</b> (Velociraptor, desde el 100). Aparecen con un contorno punteado en el mapa del mundo y cambian el ambiente al entrar: niebla, color y decorado propio.",
"<b>📖 Diario de aventuras.</b> Cada territorio tiene su personaje (Mara, Darian y Ashar, Kael) con tres misiones: investigar con el botón 🔍 (termómetro 🔥 caliente / ❄️ frío), derrotar monstruos del territorio y reunir materiales. Todo se sigue desde el botón 📖 de arriba a la derecha.",
"<b>🕯️ Santuario y ofrenda.</b> Al terminar las tres misiones recibes tu primera ofrenda y el santuario queda descubierto. Después, un encargo repetible fabrica nuevas ofrendas con materiales del territorio. Ofrendas, fichas y materiales se pueden comerciar entre jugadores.",
"<b>🦖 Sprites nuevos con pasos animados.</b> Banshee, Necromancer y Velociraptor, y los monstruos de cada territorio. El raptor mueve las patas al caminar según lo que avanza.",
"<b>⚔️ El combate en la arena todavía no está abierto.</b> Llega en próximas actualizaciones. Ver <a href=\"#/monstruos\">Monstruos y jefes</a>."
],
"id": "v433"
},
{
"v": "v432",
"ic": "💀",
"c": "#b58cff",
"t": "Torre del Lago: el Nigromante y los demás campeones invocadores",
"s": "Sus esbirros se deshacen cuando el campeón muere, y cada campeón reaparece como nuevo",
"li": [
"<b>💀 Los esbirros se deshacen con su invocador.</b> Antes, al derrotar a un campeón que invoca (el <b>Nigromante</b> de los pisos 301–400, el Chamán Goblin, la Naga Abisal…), los esbirros que había levantado se quedaban vivos persiguiéndote por el piso. Ahora desaparecen en cuanto cae el campeón.",
"<b>🔄 Reaparece como nuevo.</b> Un campeón que había entrado en furia (por debajo del 35 % de vida) volvía a salir ya enfurecido: pegaba más fuerte y más rápido desde el primer segundo. Ahora cada vida empieza normal, con la energía llena, y se enfurece de nuevo a su debido tiempo.",
"No cambia la vida, el daño, las recompensas ni la probabilidad de cofre de ningún campeón."
],
"id": "v432"
},
{
"v": "v431",
"ic": "🪢",
"c": "#ffb86b",
"t": "La tienda de gemas vende solo el T-Rex",
"s": "El resto de mascotas y monturas las consiguen (y las venden) los jugadores",
"li": [
"<b>🦖 Solo el T-Rex</b> se alquila (3 💎 por 7 días) o se compra (10 💎) en la Tienda de mascotas. El perro, el lobo, el halcón, el búho, el caballo, el camello y el corcel oscuro <b>ya no se venden por gemas</b>.",
"<b>🪢 Las demás las consiguen los jugadores:</b> los compañeros con los encargos del Maestro de animales o venciendo a los guardianes de sus guaridas, y las monturas domándolas con lazo. Después se venden a otros jugadores por <b>gemas, oro, USDT, subasta o trato directo</b>; el Mercado de mascotas en 💎 sigue dentro de la Tienda de mascotas y sirve para cualquier mascota o montura tuya que no sea alquilada.",
"<b>Si ya tenías una alquilada</b> (perro, lobo, caballo…): se queda contigo hasta que termine su alquiler, pero ya no se puede renovar ni comprar. Las que ya compraste son tuyas para siempre y se pueden vender.",
"No toca tus gemas, tu oro ni tus mascotas."
],
"id": "v431"
},
{
"v": "v430",
"ic": "✨",
"c": "#7fd6ff",
"t": "Pantalla más limpia: barras sobre la cabeza",
"s": "Se acabó el cuadro de mascotas y montura de la izquierda",
"li": [
"<b>❤️ Vida y ⚡ energía sobre la cabeza:</b> el T-Rex, tu mascota y tu montura llevan cada uno su barrita de vida (arriba) y de energía (abajo), con su nombre y nivel, como las del héroe. Si vas montado, las de la montura salen justo encima de las tuyas.",
"<b>🧼 Se quitó el cuadro de la izquierda</b> (y el botón 🐾 que lo volvía a abrir): la pantalla queda libre. Los números exactos, el hambre y las habilidades siguen en el menú, en <b>🐾 Mascotas</b>.",
"Es un cambio del juego en tu navegador: no toca tus mascotas, gemas ni oro."
],
"id": "v430"
},
{
"v": "v429",
"ic": "🧱",
"c": "#7bd88f",
"t": "Choques: el T-Rex ya no atraviesa casas ni muros",
"s": "Las mascotas de tierra caminan solo por donde camina el héroe",
"li": [
"<b>🦖 El T-Rex choca con todo lo que bloquea al héroe:</b> casas, murallas, árboles, agua, vallas, ruinas, cuevas y el interior de los edificios. Ya no camina por encima de las casas: <b>rodea los obstáculos</b> para llegar a ti o a su presa. Ver <a href=\"#/mascotas~premium\">Mascotas premium</a>.",
"<b>🧭 Si no cabe o queda atrapado</b> (un pasillo muy angosto, una muralla que lo encierra), <b>aparece a tu lado</b> en un sitio libre. Nunca nace ni reaparece dentro de una pared o de una casa.",
"<b>🐕 Perro, lobo y demás compañeros de tierra</b> también respetan casas, muros y agua. El <b>halcón y el búho</b> siguen volando por encima de todo, como siempre.",
"Es un cambio del juego en tu navegador: no toca tus mascotas, gemas ni oro."
],
"id": "v429"
},
{
"v": "v428",
"ic": "🦖",
"c": "#ffc83d",
"t": "Mascotas premium: T-Rex, Templo y equipo de mascota",
"s": "La primera mascota de la Tienda de mascotas y todo lo que la rodea",
"li": [
"<b>🦖 T-Rex:</b> la primera mascota premium. Es unas <b>3,7 veces más grande que un héroe</b>, súper agresiva pero de caminar lento y pesado, ruge, mueve las patas al andar y <b>cada paso hace vibrar la pantalla</b> (se apaga en 🐾 Mascotas o en el Templo). Ver <a href=\"#/mascotas~premium\">Mascotas premium</a>.",
"<b>💎 Tienda de mascotas</b> (menú Tienda): cada mascota de la tienda se <b>alquila 7 días por 3 💎</b> o se <b>compra por 10 💎</b> (desde v431 la tienda vende solo el T-Rex). Las compradas se venden, subastan, cambian y regalan como todo lo demás; las alquiladas no.",
"<b>🛕 Templo de las Bestias:</b> cada mascota tiene <b>4 habilidades</b> (hasta nivel 5, se pagan con oro). Ver <a href=\"#/mascotas~templo\">el Templo</a>.",
"<b>🛡️ Equipo de mascota:</b> 4 piezas (casco, peto, garras y grebas) en 5 niveles, <b>solo las fabrica el Herrero</b> y cuestan más que el equipo de héroe. Se pueden vender. Ver <a href=\"#/mascotas~equipo-mascota\">el equipo</a>.",
"<b>🏪 Mercado de mascotas en gemas:</b> vende tus mascotas compradas por 💎 (comisión del 3 %). Las habilidades y el equipo viajan con la mascota.",
"El servidor decide todo lo que cuesta gemas y oro, y revisa que nadie invente un T-Rex, habilidades ni piezas de equipo."
],
"id": "v428"
},
{
"v": "v427",
"ic": "📲",
"c": "#21d6c4",
"t": "Versión unificada y recuperación de cuenta por WhatsApp",
"s": "Todo lo nuevo en una sola versión",
"li": [
"Una sola versión con todo: <b>Karavan Online</b> (nombre, logo, wiki y música) más el <a href=\"#/celestiales~santuario\">Santuario de los Dragones</a>, la economía nueva, los monstruos nuevos y el saqueo de cadáveres.",
"<b>📲 Número de WhatsApp para recuperar tu cuenta:</b> al crear la cuenta lo pones (hasta 3 cuentas por número). Si ya tenías cuenta, el juego te lo pide al entrar (puedes dejarlo para más tarde); también puedes añadirlo o cambiarlo en <b>Cuenta</b>.",
"¿Olvidaste tu contraseña? Toca <b>«Olvidé mi contraseña»</b>, escribe tu usuario y te llega una <b>clave temporal por WhatsApp</b>. Entras con ella, el juego te pide una contraseña nueva y listo. La clave sirve una sola vez y dura 30 minutos.",
"El enemigo del inicio se llama ahora <b>Rata guerrera</b> en el bestiario (su sprite siempre fue una rata).",
"La wiki se actualizó: <a href=\"#/monstruos\">monstruos con sus sprites nuevos</a>, <a href=\"#/farmeo\">farmeo sin oro de monstruos</a>, reparación al 35 %, ritos a 8.000 · 80.000 · 400.000 y las cuevas con sus coordenadas actuales."
],
"id": "v427"
},
{
"v": "v426",
"ic": "💰",
"c": "#ffc83d",
"t": "Saqueo de cadáveres",
"s": "Los cuerpos duran 60 segundos y se pueden saquear",
"li": [
"Los cuerpos duran <b>60 segundos</b>. Los que muestran 💰 se saquean con <b>G</b> (PC) o el botón <b>Tomar</b> (móvil) a menos de unos 75 píxeles; el primero que llegue se lo lleva.",
"Sale una poción (10 %), equipo común del nivel del monstruo +5 (6 %) y, rarísimo, equipo poco común (0,006 %). Solo en el mundo abierto.",
"Corregido: el servidor seguía soltando oro de monstruos; ahora no suelta."
],
"id": "v426"
},
{
"v": "v425",
"ic": "🔋",
"c": "#34d27b",
"t": "Baterías de monstruos y recursos globales",
"s": "El mundo ya no se llena de monstruos sin fin",
"li": [
"El mundo se divide en <b>305 celdas</b>; cada una tiene una batería de reapariciones (se recarga en 90 días) y solo el 45 % de sus monstruos está despierto.",
"<b>Vetas, árboles y peces son globales:</b> si un jugador agota una veta o un árbol, queda agotado para todos hasta que se repone. Topes por cuenta y día: 60 vetas, 120 árboles y 150 peces.",
"Bendición de la Iglesia: el servidor cobra ahora el mismo precio que muestra el juego.",
"Sin conexión al servidor, el juego se pausa a los 4 segundos con un aviso y cierra la sesión a los 60."
],
"id": "v425"
},
{
"v": "v424",
"ic": "⚖️",
"c": "#ff9d1c",
"t": "Economía II y monstruos que caminan",
"s": "Bendición, reparación y ritos más baratos",
"li": [
"<b>Bendición:</b> 1.500 × 1,17 elevado al nivel (con tope en el nivel 30; después suma 1.500 por cada nivel más). <b>Reparar</b> pasa del 60 % al <b>35 %</b>. <b>Ritos</b> de entrenamiento: 8.000 · 80.000 · 400.000 por hora.",
"Los monstruos tienen animación de caminata de verdad (rebote, balanceo y pasos alternados) y respiran en reposo."
],
"id": "v424"
},
{
"v": "v423",
"ic": "🪙",
"c": "#ffe49a",
"t": "Economía: el oro tiene que valer",
"s": "Los monstruos ya no sueltan oro",
"li": [
"<b>Los monstruos ya no sueltan oro</b>; solo equipo, pociones, carne y materiales. El oro sale de vender piezas, misiones, jefes y comercio.",
"El NPC paga el <b>25 %</b> del valor de las piezas (antes 45 %); con Licencia de Mercader, <b>45 %</b> (antes 80 %).",
"Subir de nivel pide un <b>25 % más de XP</b>: a nivel 100 son 492.000 en vez de 393.000."
],
"id": "v423"
},
{
"v": "v418",
"ic": "🧠",
"c": "#ff6a5a",
"t": "Comportamiento de monstruos estilo MMORPG",
"s": "Cada monstruo te ve por su cuenta",
"li": [
"Los monstruos aparecen separados (unos 4–5 casillas entre sí), cada uno con su «casa» y su correa.",
"Cada uno te ve por su cuenta (cono de visión y obstáculos) y solo avisa a los compañeros a unos 200 píxeles. Hacen pausas largas y cerca del 35 % patrulla entre 2 o 3 puntos."
],
"id": "v418"
},
{
"v": "v417",
"ic": "🐲",
"c": "#ff4a62",
"t": "Santuario de los Dragones",
"s": "Una cueva de 9 pisos bajo la Montaña de los Dragones",
"li": [
"La Montaña de los Dragones se abre desde el <b>nivel 35</b> y en su centro hay la entrada a un <a href=\"#/celestiales~santuario\">santuario subterráneo de 9 pisos</a>: uno por especie (tierra, viento, agua, hielo, rayo, veneno, sombra y fuego) y la catedral del <b>Dragón Ancestral</b>.",
"Niveles de piso: 35 · 150 · 250 · 350 · 450 · 550 · 650 · 750 · 850. Los dragones tienen aliento elemental en cono con aviso ❗.",
"El jefe suelta, con un 2 %, un arma <b>épica de nivel 700</b> al azar."
],
"id": "v417"
},
{
"v": "v413–v416",
"ic": "🔧",
"c": "#b27bff",
"t": "Montaña de los Dragones y desgaste de equipo",
"s": "El equipo ya no se rompe tan rápido",
"li": [
"Los 8 dragones elementales (nivel 550 a 800) viven dentro de un gran macizo montañoso en el noroeste, con ceniza volcánica y brasas.",
"<b>Desgaste de equipo calibrado:</b> depende del nivel de la pieza. Solo las piezas <b>Comunes</b> se rompen; Raro, Épico y Legendario pierden efectividad hasta un mínimo del 40 % y el Herrero las restaura.",
"La rata del inicio estrena sprite: una rata guerrera de capa azul."
],
"id": "v413"
},
{
"v": "v412",
"ic": "🏛️",
"c": "#46a8ff",
"t": "Templo de los Celestiales",
"s": "La entrada al Submundo, renovada",
"li": [
"Un templo griego en ruinas sobre una meseta, con la boca del <a href=\"#/submundo\">Submundo</a> en el centro y las estatuas del León, el Caballo y el Buey Celestiales.",
"Nuevos monstruos: Minotauro (nv 65), Gusano (nv 35), Medusas (nv 55) y el Demonio del Abismo (nv 250). Vida, daño, oro, XP y botín suben con el nivel del monstruo."
],
"id": "v412"
},
{
"v": "v410–v411",
"ic": "🚩",
"c": "#21d6c4",
"t": "Cadáveres y escuadras de monstruos",
"s": "Líder, refuerzos y flanqueo",
"li": [
"Los monstruos mueren dejando su <b>cuerpo sobre una mancha</b> (sangre, baba, polvo de hueso…).",
"<b>Escuadras</b> de 8, 10 o 12 con un líder <b>🚩</b> que llama <b>📯 refuerzos</b> y, desde el cuarto enemigo, te flanquean.",
"Llegan también el mercado USDT por Binance Pay, el ranking global completo y un tablón de misiones reforzado."
],
"id": "v410"
},
{
"v": "v407–v409",
"ic": "🏘️",
"c": "#ffc83d",
"t": "Pueblos con casas y Mercado de Frutas",
"s": "Pueblos en sprite y la Enana renovada",
"li": [
"Comercios con sprites nuevos y <b>casas entrables</b> en el anillo exterior de cada pueblo (cada una guarda frutas).",
"<b>Mercado de Frutas</b> en los 12 pueblos: 8 frutas que curan vida y maná durante 3 minutos y frutales cosechables por el mapa.",
"La <b>atracción</b> del Caballero ya no arrastra a los monstruos a toda velocidad: caminan solo un 25 % más rápido que tú y te rodean en las 8 casillas. Sprite nuevo para la Enana Guerrera."
],
"id": "v407"
},
{
"v": "v405–v406",
"ic": "🐺",
"c": "#ff9d1c",
"t": "Monstruos nuevos y dragones elementales",
"s": "Nuevos sprites para el mundo abierto",
"li": [
"Los nueve enemigos del camino estrenan sprites nuevos de cuatro direcciones y se suman goblins, ghoul, orcos cornudos y momias en distintas zonas. <a href=\"#/monstruos\">Ver los monstruos</a>.",
"Cuevas con boca de cueva dibujada y a 130 casillas o más de los pueblos; interiores con paredes de piedras redondas, antorchas y cristales.",
"Sangre pixel-art, efectos propios para cada hechizo de las 8 clases y los <b>8 dragones elementales</b> con partículas de su elemento."
],
"id": "v405"
},
{
"v": "v404",
"ic": "🐪",
"c": "#ffc83d",
"t": "Nace Karavan Online",
"s": "Nuevo nombre, logo, arte, wiki y música original",
"li": [
"El juego pasa a llamarse <b>Karavan Online</b> y vive en <b>karavanonline.com</b>. Tu cuenta, tus personajes y tu progreso siguen exactamente igual.",
"Logo con más profundidad y arte nuevo: fondos de pantalla para PC y móvil, cartas de héroe con luz propia y capturas del juego. <a href=\"#/arte\">Ver el arte</a>.",
"Wiki rehecha con los <b>sprites reales del juego</b>: un <a href=\"#/objetos\">catálogo de objetos</a> con las cuatro rarezas, los atributos y los precios de cada pieza.",
"Toca la carta de un héroe para abrir su <b>leyenda</b>, sus habilidades y sus apariencias.",
"Música original de la web, <b>«Caravana de Oro»</b>, con botón para silenciarla; recuerda tu elección.",
"Guía para jugar en <a href=\"#/plataformas\">PC, Android y iOS</a>."
],
"id": "v404"
},
{
"v": "v403",
"ic": "🐺",
"c": "#ff6a5a",
"t": "Mobs que te rodean, oro más justo y ciudades sin parque",
"s": "Combate más agresivo y menos oro en las primeras ciudades",
"li": [
"<b>Los enemigos ya no retroceden</b> cuando los golpeas ni huyen con poca vida: pelean hasta el final.",
"Te ven en 360° y desde un poco más lejos; si golpeas a uno, los que están cerca también te atacan.",
"<b>Cerco como en los MMORPG modernos:</b> los que te persiguen ocupan las 8 casillas que te rodean y los demás esperan su turno. Con el cerco cerrado te abres paso matando.",
"Si no te gusta: Menú › ⚙️ Opciones › ⚔️ Combate › «🐺 Mobs agresivos».",
"<b>Oro de nivel bajo más pequeño:</b> la «pieza de basura» de los monstruos de las primeras ciudades vale ahora según su tipo (de 32 a 261 🪙 en vez de 324 🪙). Lo que ya tenías no cambia.",
"Las 12 ciudades <b>ya no tienen parque</b>: el Mercado de Gemas queda con la plaza abierta delante.",
"Los botones 🔀 (plano de hechizos), 🧪, 🏃, 🤫, 🐴 y 🐾 actúan al tocarlos <b>aunque tengas el joystick sostenido</b>."
],
"id": "v403"
},
{
"v": "v402",
"ic": "📱",
"c": "#46a8ff",
"t": "HUD ordenado para celular",
"s": "Accesos rápidos, ficha compacta y tablero de tareas",
"li": [
"En celular horizontal, una fila de accesos rápidos abre cada ventana con un toque: 🎒 Objetos · 🛡️ Equipo · 📜 Misiones · ✨ Hechizos · 🗺️ Mapa · 👥 Party · ⏱️ Caza · 🔔 Avisos · ☰ Menú.",
"Ficha compacta con nombre, nivel, vida, maná, XP, oro y mochila.",
"El <b>tablero de tareas</b> ocupa menos y ya no tapa el joystick; muestra tus misiones, tus encargos y la Cacería en curso.",
"El icono 📜 muestra un «!» rojo cuando hay algo listo para cobrar.",
"Para todos: el grupo <b>⚙️ Sistema</b> ya trae Opciones, Caza y Avisos."
],
"id": "v402"
},
{
"v": "v401",
"ic": "⚡",
"c": "#34d27b",
"t": "Pago automático de gemas, cuevas de lobos y ratas, Cacería",
"s": "Gemas por Binance Pay, dos cuevas nuevas y tareas de caza",
"li": [
"<b>⚡ Pago automático de gemas</b> con Binance Pay: paquetes de 1, 3, 5, 10, 20 y 50 USDT (1 USDT = 1 💎). El juego reconoce tu pago y te acredita las gemas solo.",
"Dos cuevas nuevas de 16 pisos: la <b>Cueva de los Hombres Lobo</b> (nivel 45 a 450) y la <b>Madriguera de las Ratas Gigantes</b> (nivel 65 a 600), con un color y un jefe por tramo. <a href=\"#/cuevas\">Ver las cuevas</a>.",
"La <b>Cámara de los Cuatro Sellos</b> y su jefe, el Segador de las Cuatro Puertas: hacen falta cuatro jugadores.",
"El Hombre Lobo de las noches de Halloween es ahora el lobo arenoso de nivel 10, con sprite nuevo de cuatro direcciones.",
"<b>Cacería</b> (Misiones › 🎯): una tarea de caza según tu nivel que da XP, oro y puntos de racha.",
"La XP por muerte depende del nivel del enemigo: contra uno más fuerte ganas hasta un 40 % más. Todos los enemigos sueltan equipo.",
"HUD más cómodo en celulares de pantalla baja; las antorchas de estaca ya se clavan en el Submundo y tus mascotas reaparecen a tu lado si se quedan atrás."
],
"id": "v401"
},
{
"v": "v400",
"ic": "🕯️",
"c": "#b27bff",
"t": "Ambiente en la Red Subterránea",
"s": "Polvo, gotas, brasas y cristales con destello",
"li": [
"Polvo y gotas que se ven donde hay luz, brasas que suben de los braseros y destellos sobre los cristales.",
"Cada tipo de sala tiene su propio color. No cambia cuánto oscurece ni nada del combate."
],
"id": "v400"
},
{
"v": "v399",
"ic": "🌌",
"c": "#b27bff",
"t": "Ambientación de cuevas, torres y Submundo",
"s": "Cada lugar con su color, su luz y su vida",
"li": [
"Cada cueva tiene su atmósfera: la Cripta es azul frío, la Cueva de las Arañas violeta con esporas, las Catacumbas ámbar, el Pantano verde con luciérnagas, el Abismo rojo con brasas y la Mina ocre con chispas.",
"La <b>Torre del Lago</b> cambia de paleta cada 100 pisos, en seis tramos con nombre.",
"El <b>Submundo</b> es frío y azulado, con esporas cian, cristales que iluminan y goteras.",
"La boca de las cuevas del mundo abierto tiene resplandor, niebla y hongos que brillan."
],
"id": "v399"
},
{
"v": "v398",
"ic": "📜",
"c": "#ffc83d",
"t": "Tablón de la Ruta",
"s": "600 misiones globales cada día: gana el primero",
"li": [
"Se abre en el Diario: Progreso › Tareas › pestaña <b>📜 Tablón</b>.",
"<b>600 misiones iguales para todos</b>, cada una más difícil que la anterior. Se renuevan a medianoche (hora de República Dominicana).",
"<b>Gana el primero:</b> si alguien la cumple o la encuentra antes, desaparece para los demás.",
"Premios intransferibles: cofres y llaves del Tablón con oro de hasta 200.000, bolas de buff, equipo Raro y, muy rara vez, VIP de 15 o 30 días."
],
"id": "v398"
},
{
"v": "v397",
"ic": "🏜️",
"c": "#ff9d1c",
"t": "Karez, la ciudad escondida",
"s": "Bajo las ciudades hay otra ciudad",
"li": [
"Una pequeña ciudad de canales escondida bajo la Ruta: plaza con pozo, casas de tres pisos con sótano y decenas de vecinos que piden algo a cambio de pistas.",
"Los mapas dan coordenadas <b>aproximadas</b>: nada aparece marcado en tu mapa, hay que explorar.",
"Hay llaves personales e intransferibles y cofres con reliquias únicas. Descubrir cómo entrar es parte del juego."
],
"id": "v397"
},
{
"v": "v396",
"ic": "🧶",
"c": "#ff4a62",
"t": "El Sello del Ovillo",
"s": "La entrada a la Red Subterránea ya no es libre",
"li": [
"El acceso a la Red Subterránea ya no es un pozo abierto en la plaza: ahora es una <b>trampilla sellada con hilo rojo</b> dentro de un edificio que <b>cambia cada día</b> en cada ciudad.",
"Solo la abre la <b>Llave del Ovillo</b>, que se consigue siguiendo una cadena de misiones, hablando con la gente y resolviendo un acertijo escondido."
],
"id": "v396"
},
{
"v": "v395",
"ic": "🌄",
"c": "#34d27b",
"t": "El mundo abierto se pinta de verdad",
"s": "Suelo de pixel art con paleta propia para cada región",
"li": [
"Suelo de pixel art continuo en lugar de un mosaico de cuadros: la hierba tiene manchas, matas, flores y piedrecitas; la arena, ondas de viento; la ceniza, grietas; la nieve, ventisqueros.",
"Una <b>paleta propia para cada una de las 16 tierras</b>, con transiciones orgánicas entre biomas, caminos, orillas de agua, crestas de roca y adoquín y césped en las ciudades.",
"La nieve y la lluvia se posan sobre el suelo. No cambia el mapa ni las colisiones."
],
"id": "v395"
},
{
"v": "v394",
"ic": "🕳️",
"c": "#21d6c4",
"t": "La Red Subterránea de la Ruta",
"s": "Túneles que unen las 12 ciudades",
"li": [
"Bajo las 12 ciudades hay una plaza subterránea unida a las demás por túneles: sirve de camino entre ciudades.",
"12 cámaras de guardián, 12 cámaras de recursos, 6 ruinas con acertijo y vetas de mineral.",
"Si te derrotan abajo, reapareces en la ciudad cuya plaza subterránea queda más cerca."
],
"id": "v394"
},
{
"v": "v393",
"ic": "🏠",
"c": "#ff9d1c",
"t": "Las casas de los pueblos se pueden entrar",
"s": "16 locales con interior de pixel art en cada ciudad",
"li": [
"En las 12 ciudades, los 16 edificios tienen puerta: botón <b>🚪 Entrar</b> (o la tecla E) y fundido a un interior dibujado a mano.",
"Dentro hay tendero, clientes y animales que pasean; con 💬 Hablar cada uno te contesta con frases de su oficio.",
"Cada servicio (Armería, Botica, Herrería, Posada, Establo…) funciona desde su mostrador. Cinco estilos de arquitectura según la ciudad."
],
"id": "v393"
},
{
"v": "v392",
"ic": "🔧",
"c": "#9db3c9",
"t": "Precio del botín y árbol de habilidades",
"s": "El equipo vuelve a venderse a ≈324 🪙",
"li": [
"El equipo que sueltan los monstruos vuelve a venderse a ≈324 🪙 (se había quedado en 30).",
"Las habilidades del <b>Árbol</b> ya se colocan en los botones de hechizo y se cambian con el switch 🔀."
],
"id": "v392"
},
{
"v": "v391",
"ic": "🔥",
"c": "#ff9d1c",
"t": "Antorcha de estaca",
"s": "Luz cooperativa en el mundo abierto y en las cuevas",
"li": [
"Nuevo objeto de crafteo: la <b>antorcha de estaca</b> se clava en el mapa y, cuando cae la noche o hay oscuridad (también en cuevas oscuras), ilumina un rango de luz durante <b>4 horas</b>. Luego se apaga y hay que plantar otra.",
"Si un grupo planta varias, ilumina una gran zona: un camino iluminado entre amigos.",
"Comercio entre jugadores desde el nivel 1, solo de antorchas.",
"La noche vuelve a su ciclo largo de siempre."
],
"id": "v391"
},
{
"v": "v390",
"ic": "🌙",
"c": "#7d7cff",
"t": "Jugabilidad de las noches",
"s": "Treguas, topes de daño y NPC que no te atrapan",
"li": [
"En la ciudad y pegado a ella no salen cazadores ni hordas del evento. Al salir hay <b>tregua</b>: 150 s sin cazadores y 60 s sin hordas.",
"Si te refugias en la ciudad, o los dejas atrás, los enemigos del evento se esfuman.",
"Los enemigos de Halloween son finitos y más suaves, y <b>nadie muere de un solo golpe</b>.",
"El botín en línea sale igual al programado según el nivel del monstruo.",
"Los NPC del pueblo ya no atrapan jugadores ni estorban en las tiendas."
],
"id": "v390"
},
{
"v": "v388–v389",
"ic": "🔥",
"c": "#ff4a62",
"t": "Black Friday de gemas y noches más jugables",
"s": "Bono de gemas del 12 al 30 de noviembre",
"li": [
"<b>Promo Black Friday:</b> del 12 al 25 de noviembre, +25 % de gemas; del 26 al 30, +100 % (el doble). El bono cubre los primeros 20 USDT de compra por cuenta y no se suma al descuento de revendedor.",
"Anuncio dentro del juego y cinta en esta web.",
"Los enemigos de la noche hacen un <b>45 % menos de daño</b> y los del amo tienen un 30 % más de vida en lugar de pegar más fuerte.",
"Revisión del ataque de los 8 héroes al entrenar skills."
],
"id": "v388"
},
{
"v": "v386–v387",
"ic": "🏛️",
"c": "#ffc83d",
"t": "Templo de las Ocho Sendas",
"s": "Templo griego techado rodeado de bosque sagrado",
"li": [
"El lugar de entrenamiento es ahora un <b>templo griego techado</b> en pixel art real, rodeado de un bosque sagrado con hiedra, mariposas, luciérnagas y pétalos.",
"La pantalla de entrenamiento tiene botones <b>▶ Continuar</b> y <b>🚪 Salir</b>.",
"Monstruos nuevos en pixel art: hombres lobo, minotauros, medusas y gusanos. <a href=\"#/entrenamiento\">Ver el entrenamiento</a>."
],
"id": "v386"
},
{
"v": "v384–v385",
"ic": "🕷️",
"c": "#b27bff",
"t": "Cuevas-colmena con tope de monstruos",
"s": "Reaparición a los 3 minutos y reposición a los 90 días",
"li": [
"Las cuevas de Arañas, Catacumbas, Pantano, Abismo y Mina tienen un <b>tope de monstruos por cueva</b> para todo el servidor.",
"Cada muerte descuenta del tope; los monstruos reaparecen a los 3 minutos y, si se agota, la cueva se repone a los 90 días."
],
"id": "v384"
},
{
"v": "v382–v383",
"ic": "🧑‍🤝‍🧑",
"c": "#46a8ff",
"t": "Mercado de personajes",
"s": "Vende y compra personajes completos",
"li": [
"Un personaje (nivel, equipo, mascotas, oro…) tiene valor y se puede <b>vender o comprar</b> dentro del juego, con el servidor como intermediario.",
"Se paga en 💎 gemas o USDT (nunca en oro) y la comisión se cobra siempre en gemas.",
"Para vender un personaje tienes que conservar al menos otro; el personaje con el que juegas en ese momento no se puede vender."
],
"id": "v382"
},
{
"v": "v381",
"ic": "👥",
"c": "#34d27b",
"t": "Varios personajes por cuenta",
"s": "Pantalla «Elige tu personaje»",
"li": [
"Una cuenta puede tener <b>varios personajes</b> (por defecto 3). Al tocar ▶ CONTINUAR eliges con cuál jugar.",
"Son de la cuenta: gemas, apariencias, VIP, Premium, boletos e idioma de traducción. Son de cada personaje: nivel, clase, oro, mochila, equipo, mascotas, misiones, gremio y amigos.",
"«Nueva partida» ya no borra nada: ahora es «✦ Nuevo personaje»."
],
"id": "v381"
},
{
"v": "v380",
"ic": "💎",
"c": "#21d6c4",
"t": "Todas las gemas valen para todo",
"s": "Se acaba la diferencia entre gemas propias y transferidas",
"li": [
"Vengan de una recarga, del Mercado de Gemas o de otro jugador, <b>todas las gemas son iguales</b> y sirven para todo: apariencias, trajes, Bonus, Premium, boletos, cambio de clase y nombre, gremios y más."
],
"id": "v380"
},
{
"v": "v378–v379",
"ic": "🧭",
"c": "#9db3c9",
"t": "Cuevas compartidas",
"s": "Todos ven los mismos enemigos en la cueva",
"li": [
"Misma cueva y mismo piso = <b>mismos enemigos</b>, en las mismas posiciones y con las mismas variantes para todos los jugadores del grupo.",
"Cada piso se divide en zonas de enemigos que reaparecen a los 3 minutos."
],
"id": "v378"
},
{
"v": "v377",
"ic": "🌕",
"c": "#ffe680",
"t": "Fases de la luna y bono nocturno de party",
"s": "La luz de luna aclara la noche",
"li": [
"Fases lunares reales (ciclo de 29,5 días): la luna llena aclara la noche en exteriores y la luna nueva trae oscuridad total, así que hará falta antorcha.",
"La tarjeta de clima muestra la fase y el porcentaje de iluminación. <a href=\"#/clima\">Ver el clima</a>.",
"Las parties con bono de grupo ganan +1 % de XP de noche en el exterior."
],
"id": "v377"
},
{
"v": "v374–v376",
"ic": "✧",
"c": "#46a8ff",
"t": "Árbol de habilidades en los botones y mercados en horizontal",
"s": "HUD más ordenado y mercados para móvil horizontal",
"li": [
"Botón <b>✧ Árbol</b> en el Menú y en Equipo. Las habilidades del árbol se asignan solas a los botones ＋ al equiparlas.",
"El Mercado de Gemas y el de objetos se rediseñaron para móvil en horizontal: categorías a la izquierda, objetos en el centro, detalle a la derecha y barra de saldo."
],
"id": "v374"
},
{
"v": "v353–v373",
"ic": "🌳",
"c": "#34d27b",
"t": "Árbol de Linaje de Habilidades y Bazar USDT",
"s": "Habilidades secundarias y primeros pasos del Bazar",
"li": [
"<b>Árbol de Linaje</b>: panel visual con tu profesión como raíz y ramas para las 8 profesiones. Hasta tres habilidades secundarias; las de otra profesión rinden al 30 %.",
"Primeros pasos del <b>Bazar Global USDT</b> (BNB Smart Chain, botón MetaMask).",
"Mercados de la Seda y de Gemas rediseñados para móvil."
],
"id": "v353"
},
{
"v": "v335–v352",
"ic": "⚖️",
"c": "#c9a35a",
"t": "Economía, Iglesia y cuevas-colmena",
"s": "Bendición, cambio de clase y cueva de las Arañas",
"li": [
"<b>Bendición por vida</b> en la Iglesia: protege tu oro, mochila y bolsa de loot al morir y reduce la pérdida de XP.",
"<b>Cambio de clase</b> en la Iglesia por 1 💎, conservando nivel, nombre, inventario y progreso.",
"Botón de reporte de nivel/vida para jugadores con problemas.",
"Telas de araña: probabilidad de drop del 12 % al 5 %; patas de araña al 3 %.",
"Cueva de las Arañas con población tipo colmena y reaparición limitada."
],
"id": "v335"
},
{
"v": "v325–v334",
"ic": "⛏️",
"c": "#d9a441",
"t": "Mina de la Gran Montaña y tesoros",
"s": "12 pisos de laberintos oscuros cerca de Lanzhou",
"li": [
"<b>Mina de la Gran Montaña</b>: 12 pisos con laberintos oscuros, arañas de ocho colores (nivel 20 a 79), capataces y la Reina Tejedora en el piso 12.",
"<b>Refuerzo Arácnido</b> en la Herrería: patas y telas para potenciar equipo hasta nivel 5. <a href=\"#/forja\">Ver la forja</a>.",
"Vetas de mineral en las paredes de cada piso, hasta el diamante.",
"Los 100 tesoros de Halloween son los mismos para todo el servidor.",
"Todos ven los mismos monstruos en cuevas, mazmorras y mina.",
"Pociones: ahora puedes llevar hasta 800 de cada una."
],
"id": "v325"
},
{
"v": "v318–v324",
"ic": "💍",
"c": "#c46bff",
"t": "Joyería, influencers y aldeanos",
"s": "Anillo, amuleto y pendientes de nivel 10 a 1.200",
"li": [
"<b>Joyería</b>: anillos (puedes llevar dos), amuletos y pendientes en 13 niveles, del cobre al celestial. <a href=\"#/objetos/joyas\">Ver las joyas</a>.",
"Sistema de <b>influencers</b>: códigos de invitación con premios por jugador válido.",
"Mapa del mundo con botón <b>📍 Lugares</b>: todos los sitios con nombre y coordenadas.",
"Aldeanos nuevos que caminan por las ciudades, con 16 personajes distintos."
],
"id": "v318"
},
{
"v": "v304–v317",
"ic": "🛡️",
"c": "#ffb020",
"t": "Arte nuevo de objetos y equipo",
"s": "Iconos, sets de armadura, armas y escudos",
"li": [
"Iconos nuevos de pixel art para comida, pociones, gemas y llaves; <b>cofres de seis rarezas</b>; mochilas de 25 a 500 espacios.",
"Armas comunes de cinco tipos (espada, hacha, hoja alada, arco y báculo) en cinco niveles.",
"<b>Un set de armadura propio para cada clase</b>, y cada pieza da puntos de habilidad a tu área.",
"Escudos nuevos para el slot secundario y pantalla de Equipo con muñeco. <a href=\"#/equipo\">Ver los sets</a>."
],
"id": "v304"
},
{
"v": "v293–v303",
"ic": "🧙",
"c": "#ff8a3d",
"t": "Héroes detallados y party",
"s": "Sprites nuevos de los 8 héroes",
"li": [
"Los 8 héroes se ven mejor: contorno oscuro, sombra, luz de borde, respiración y destello rojo al recibir daño.",
"<b>Héroes detallados</b>: sprites nuevos y más finos para los 8 héroes, activados por defecto (se pueden apagar en Ajustes).",
"Trato entre jugadores gratis, aviso de «recibiste» y premio del Coliseo.",
"En party, todos ven los mismos monstruos en cuevas, Torre y jefes de área; quien entra después ve el estado real de la mazmorra."
],
"id": "v293"
},
{
"v": "v277–v292",
"ic": "🏛️",
"c": "#ffc83d",
"t": "Coliseo y PvP",
"s": "Arena, gradas, torneo con leones y botón 💀",
"li": [
"Coliseo rehecho: arena rodeada de gradas con público, entrada de <b>Gladiador o Espectador</b> y Torneo con leones.",
"Todos hacen exactamente el mismo daño en la arena y tú eliges cuánto apostar; hay un Campeón del Coliseo.",
"Zona segura alrededor del Coliseo.",
"Botón <b>💀 de PvP</b>, objetivo PvP automático y, en PC, clic derecho sobre un jugador para abrir su menú.",
"Con un plan activo eliges un distintivo (60 opciones de banderas y emojis) que todos ven junto a tu nombre. La ventana de party se arrastra a cualquier parte."
],
"id": "v277"
},
{
"v": "v276",
"ic": "🏛️",
"c": "#ffc83d",
"t": "Coliseo Karavan",
"s": "Un coliseo romano cerca de las ciudades, con taquillas. Entrada: 1000 ",
"li": [
"Un coliseo romano cerca de las ciudades, con taquillas. Entrada: <b>1000 🪙</b>.",
"<b>Todos contra todos</b> en una arena abierta con columnas y muros para cubrirte. Mínimo 2 gladiadores, hasta 16.",
"<b>Nivel e items igualados</b>: la vida es igual para todos y solo cuenta tu habilidad. <b>No pierdes nada</b> (XP ni items).",
"El combate dura <b>6 minutos</b>: la arena se va cerrando y quien queda fuera pierde vida. Gana el último en pie (o el que más vida tenga al acabar el tiempo).",
"El ganador se lleva el pozo de las entradas; el <b>5% se quema</b>."
],
"id": "v276"
},
{
"v": "v275",
"ic": "⚔️",
"c": "#46a8ff",
"t": "PvP gratis y party",
"s": "El PvP abierto ya no necesita VIP: se activa con el botón ⚔️ desde el ",
"li": [
"El <b>PvP abierto ya no necesita VIP</b>: se activa con el botón ⚔️ desde el nivel 1 (fuera de ciudades y mazmorras).",
"La <b>party es gratis</b>; solo el comercio sigue como servicio.",
"Ves el <b>% de crítico</b> de tus compañeros en su info y el tuyo en el menú de party."
],
"id": "v275"
},
{
"v": "v273",
"ic": "🕷️",
"c": "#34d27b",
"t": "Cuevas temáticas",
"s": "Cada cueva tiene su tema: Arañas (6 formas nuevas, más fuertes según b",
"li": [
"Cada cueva tiene su tema: <b>Arañas</b> (6 formas nuevas, más fuertes según bajas), <b>Catacumbas</b> (esqueletos, zombis y fantasmas), <b>Pantano</b> (serpientes y escorpiones) y <b>Abismo</b>.",
"El primer piso es más tranquilo cerca de la entrada: hay que adentrarse.",
"Cada piso trae ~20% más monstruos y más fuertes que el anterior."
],
"id": "v273"
},
{
"v": "v272",
"ic": "👥",
"c": "#ff9d1c",
"t": "Jugadores y consumo",
"s": "Toca a otro jugador para ver su ficha: clase, nivel, zona, party y ami",
"li": [
"Toca a otro jugador para ver su ficha: clase, nivel, zona, party y amistad, con mensaje privado y agregar amigo gratis.",
"<b>La party es gratis para todos.</b> El <b>comercio</b> es del servicio 🤝 Comercio y Party (3 💎) o del 👑 Plan Jugador (7 💎); sin eso salen con 🔒.",
"Los botones de uso rápido ahora pueden ser ❤️ poción de vida y 💧 poción de maná, y todos muestran cuántos tienes.",
"El panel <b>Consumo</b> bajo tu vida y maná muestra la imagen de la carne o pescado que comiste, con su barra de tiempo.",
"Las noches del evento de Halloween son más oscuras."
],
"id": "v272"
},
{
"v": "v271",
"ic": "📌",
"c": "#b27bff",
"t": "Encargos del día",
"s": "Nueva pestaña Progreso › Tareas › 📌 Encargos: 200 misiones sencillas (",
"li": [
"Nueva pestaña <b>Progreso › Tareas › 📌 Encargos</b>: 200 misiones sencillas (llevar paquetes entre ciudades, visitar lugares, caminar, cazar, pescar, minar, cocinar…).",
"Cada día salen 8 nuevos; aceptas hasta 4 y cobras hasta 8. Pagan poco XP y poco oro: son para moverte por el mapa.",
"Los encargos de viaje se marcan con 📌 en tu mapa y pagan más cuanto más lejos queda el destino.",
"Cadenas de mascotas: los puntos de pista y de defensa ahora están en lugares despejados (sin árboles ni agua) y alcanzables; los de defensa se marcan con 🛡️ en el mapa. Arreglado el bug de la misión del perro."
],
"id": "v271"
},
{
"v": "v269",
"ic": "🛒",
"c": "#ff6a5a",
"t": "Mercader renovado",
"s": "El Mercader ya no comercia Seda, Especias, Jade, Té ni Vidrio: ahora e",
"li": [
"El Mercader ya no comercia Seda, Especias, Jade, Té ni Vidrio: ahora es una <b>tienda ambulante</b> de objetos.",
"<b>🛒 Mi carruaje:</b> sube objetos desde tu mochila, ponles precio, abre o cierra tu tienda y fija a cuánto % compras.",
"<b>🏪 Tiendas:</b> buscador de objetos entre todas las tiendas abiertas; compra con 3 % de impuesto.",
"<b>Mapa:</b> las tiendas abiertas se marcan con 🛒; toca una para ver la tienda, escribir al Mercader en privado o ir hasta él.",
"El Máster puede cambiar de clase en cualquier momento (zona GM → 🎭 Cambiar de clase).",
"El Máster es inmortal, entra al Submundo sin VIP y puede teletransportarse tocando el mapa.",
"Arreglado: el Bolso de Fuego de 65 espacios ahora se conserva al guardar."
],
"id": "v269"
},
{
"v": "v263–v268",
"ic": "🔥",
"c": "#21d6c4",
"t": "El Submundo",
"s": "Nuevo mundo bajo las ruinas del Ágora Caída, con mobs míticos nv 40–35",
"li": [
"Nuevo mundo bajo las ruinas del Ágora Caída, <a href=\"#/submundo\">con mobs míticos nv 40–350</a>.",
"Portón de Fuego (8 placas) y el jefe Balor, nivel 400, 20 M de vida.",
"Pueblo-refugio: zona segura, reaparición y tiendas escondidas.",
"Botín propio: equipo común nv 30/50/60 y el Bolso de Fuego de 65 espacios.",
"Experiencia y oro por monstruo según su nivel."
],
"id": "v263"
},
{
"v": "v262",
"ic": "🏙️",
"c": "#ffc83d",
"t": "Pueblos más grandes",
"s": "Cada ciudad creció con un anillo exterior: calles empedradas, arcos de",
"li": [
"Cada ciudad creció con un anillo exterior: calles empedradas, arcos de entrada con el nombre de la ciudad y casas con el estilo de cada cultura. Las ciudades son zona segura."
],
"id": "v262"
},
{
"v": "v258–v267",
"ic": "⚡",
"c": "#46a8ff",
"t": "Cuevas más fluidas",
"s": "Las cuevas se dibujan desde caché y solo procesan los monstruos cercan",
"li": [
"Las cuevas se dibujan desde caché y solo procesan los monstruos cercanos: mucho más FPS, sobre todo en celulares."
],
"id": "v258"
},
{
"v": "v258–v267",
"ic": "🖥️",
"c": "#21d6c4",
"t": "Pantalla completa y brasas",
"s": "Entrada en pantalla completa y título animado",
"li": [
"El juego entra en pantalla completa al tocar y el título tiene brasas animadas."
],
"id": "v258"
}
]);

P.novedades=()=>head('Novedades','Lo que se fue añadiendo al juego, de la versión más reciente a la más antigua.')
 +'<div class="vchips" aria-label="Saltar a una versión">'+NEWS.map(n=>'<a href="#/novedades~'+n.id+'" style="--hc:'+n.c+'">'+n.v+'</a>').join('')+'</div>'
 +NEWS.map(n=>'<article class="nw" id="'+n.id+'" style="--hc:'+n.c+'"><header><span class="nv">'+n.v+'</span><h2>'+n.ic+' '+n.t+'</h2></header><ul>'+n.li.map(x=>'<li>'+x+'</li>').join('')+'</ul></article>').join('')
 +note('Las notas completas de cada versión (con todos los números) las publica el equipo en el chat global y en el juego al actualizar.');


/* =====================================================================
   BUSCADOR
   ===================================================================== */
let SIDX=null;
function buildIdx(){
  SIDX=[];const add=(t,s,r,em)=>SIDX.push({t,s,r,em,n:norm(t+' '+s)});
  FLAT.forEach(x=>add(x[2],'Página · '+x[3][0],'#/'+x[0],x[1]));
  W.classes.forEach(c=>{
    add(c.n,'Clase · '+L.classes[c.id].titulo,'#/clase/'+c.id,c.ic);
    c.skills.forEach(s=>add(s.n,'Habilidad de '+c.n+(s.lv?' · nivel '+s.lv:''),'#/skills/'+c.id,s.ic));
  });
  W.farm.forEach(f=>add(f.n,'Enemigo del camino · nivel '+f.lv,'#/monstruos',f.ic));
  W.bosses.forEach(b=>add(b.n,'Jefe del mundo · nivel '+b.lv,'#/monstruos','👑'));
  W.hordes.forEach(h=>add(h.n,'Jefe de horda','#/monstruos','👹'));
  W.lairs.forEach(l=>add(l.n,'Guarida de bestias','#/monstruos','🐾'));
  (window.MJW||[]).forEach(m=>{add(m.n,'Mini-jefe · nivel '+m.lv+' · '+m.terr,'#/monstruos',m.ic);add(m.terr,'Territorio del mini-jefe '+m.n,'#/monstruos','🕯️');add(m.of,'Ofrenda de '+m.n,'#/monstruos','🗝️')});
  W.regions.forEach(r=>add(r.n,'Tierra · '+BIO[r.b],'#/mundo','🗺️'));
  W.cities.forEach(c=>add(c.n,'Ciudad-oasis','#/mundo','🏛️'));
  [...new Set(W.landmarks)].forEach(n=>add(n,'Punto de interés','#/mundo','📍'));
  I.dg.forEach(d=>add(d.nm,'Cueva o mazmorra','#/cuevas~dg-'+(d.id||'cr'),'🕳️'));
  W.celest.forEach(z=>add(z.n,'Bestia Celestial','#/celestiales','🌠'));
  W.dragons.forEach(d=>add(d.n,'Dragón del mes','#/celestiales','🐉'));
  I.pets.forEach(p=>add(p.n,p.kind=='m'?'Montura':'Mascota de combate','#/mascotas',p.ic));
  add('T-Rex','Mascota premium (💎)','#/mascotas~premium','🦖');add('Tienda de mascotas','Solo el T-Rex: alquilar 7 días · comprar con gemas','#/mascotas~premium','💎');add('Templo de las Bestias','Habilidades de mascota','#/mascotas~templo','🛕');
  add('Equipo de mascota','Casco, peto, garras y grebas (Herrero)','#/mascotas~equipo-mascota','🛡️');add('Mercado de mascotas','Venta de mascotas por gemas','#/mascotas~mercado-mascotas','🏪');add('Vibración del T-Rex','Pasos y rugido','#/mascotas~vibracion','📳');
  W.bld.forEach(b=>add(b.n,'Edificio de la ciudad','#/carpas',b.ic));
  W.prem.forEach(p=>add(p.n,'Servicio premium','#/premium',p.ic));
  W.events.forEach(e=>add(e.n,'Evento','#/eventos',e.ic));
  W.dq.forEach(q=>add(q.n,'Misión diaria','#/misiones',q.ic));
  W.train.forEach(t=>add(t.n,'Rito de entrenamiento','#/entrenamiento',t.ic));
  I.misc.fgn.slice(1).forEach((n,i)=>add(n,'Hechizo de la forja encantada','#/forja','🔮'));
  [['Balor','Jefe del Submundo · nivel 400'],['Portón de Fuego','Submundo · ocho placas'],['Templo de los Celestiales','Entrada al Submundo'],['Lágrima de Lete','El material más raro del juego']].forEach(x=>add(x[0],x[1],'#/submundo','🔥'));
  [['Dragón Ancestral','Jefe del Santuario de los Dragones · piso 9'],['Montaña de los Dragones','Santuario de 9 pisos · desde el nivel 35']].concat(W.sanct.floors.slice(0,8).map(f=>[f.dr,'Dragón del Santuario · '+f.el+' · Nv '+f.lv])).forEach(x=>add(x[0],x[1],'#/celestiales~santuario','🐲'));
  NEWS.forEach(n=>add(n.t,'Novedad · '+n.v,'#/novedades~'+n.id,n.ic));
}
const hitHtml=x=>'<a class="hit" href="'+x.r+'" style="--hc:#ffc83d"><b>'+(x.em||'')+' '+esc(x.t)+'</b><small>'+esc(x.s)+'</small></a>';
const resItem=x=>'<a class="it" href="'+x.r+'" style="--rc:#b27bff"><span class="ib">'+(x.ic!=null?KV.ic(x.ic,1.2):'<span class="em" style="font-size:26px">'+(x.em||'•')+'</span>')+'</span><span><b>'+esc(x.t)+'</b><small>'+esc(x.s)+'</small></span></a>';
function runSearch(q,lim){
  const ks=norm(q.trim()).split(/\s+/).filter(Boolean);if(!ks.length)return null;
  if(!SIDX)buildIdx();
  const pg=SIDX.filter(x=>ks.every(k=>x.n.includes(k))).sort((a,b)=>(b.n.startsWith(ks[0])?1:0)-(a.n.startsWith(ks[0])?1:0));
  return{pg,it:searchItems(q,lim||60)};
}
function resultsInner(q,lim){
  const r=runSearch(q,lim);if(!r)return'';
  const total=r.pg.length+r.it.length;
  if(!total)return'<p class="cnt">No encontré nada con «'+esc(q)+'». Prueba con otra palabra: una clase, un monstruo, un material, una cueva…</p>';
  return(r.pg.length?'<h2>En la wiki</h2><div class="hits cols">'+r.pg.slice(0,30).map(hitHtml).join('')+'</div>':'')
   +(r.it.length?'<h2>Objetos</h2><div class="itg">'+r.it.map(resItem).join('')+'</div>'+(r.it.length>=(lim||60)?'<p class="cnt">Mostrando los primeros '+r.it.length+'. Afina la búsqueda para ver más.</p>':''):'');
}

/* =====================================================================
   ROUTER
   ===================================================================== */
function sideHtml(name,args){
  const sub=()=>{
    if(name=='objetos')return VIEWS_LIST.map(v=>'<a class="sub'+(args[0]==v[0]?' on':'')+'" href="#/objetos/'+v[0]+'"><span class="n">'+v[1]+'</span>'+v[2]+'</a>').join('');
    if(name=='clase'||name=='clases')return W.classes.map(c=>'<a class="sub'+(name=='clase'&&(+args[0]||0)==c.id?' on':'')+'" href="#/clase/'+c.id+'" style="--gc:'+CG[c.id]+'"><span class="n">'+c.ic+'</span>'+esc(c.n)+'</a>').join('');
    return'';
  };
  return'<input id="q" type="search" placeholder="Buscar en la wiki…  ( / )" autocomplete="off" aria-label="Buscar en la wiki">'
   +NAV.map(g=>'<div class="sg" style="--gc:'+g[1]+'"><h4>'+g[0]+'</h4>'+g[2].map(x=>{
      const on=x[0]==name||(name=='clase'&&x[0]=='clases');
      return'<a href="#/'+x[0]+'" class="'+(on&&!(name=='objetos'&&args[0])?'on':'')+(on?' cur':'')+'"><span class="n">'+x[1]+'</span>'+x[2]+'</a>'+(on?sub():'');
    }).join('')+'</div>').join('');
}
function parseHash(){
  const raw=(location.hash||'').replace(/^#\/?/,'');const i=raw.indexOf('~');
  const pp=i<0?raw:raw.slice(0,i),dec=s=>{try{return decodeURIComponent(s)}catch(_){return s}};
  const seg=pp.split('/').filter(Boolean).map(dec);
  return{name:seg[0]||'inicio',args:seg.slice(1),path:seg.join('/')||'inicio',det:i<0?null:dec(raw.slice(i+1))};
}
function pageTitle(name,args){
  if(name=='inicio')return'Wiki';
  if(name=='clase')return W.classes[cl(+args[0]||0,0,7)].n;
  if(name=='objetos'){const v=VIEWS_LIST.find(x=>x[0]==args[0]);return v?v[2]:'Catálogo de objetos'}
  const f=FLAT.find(x=>x[0]==name);return f?f[2]:'Wiki';
}
let LASTPATH=null,SRCH=false;
function renderPage(r){
  const pg=$('#page');if(r.name!='objetos')ENTS=[];
  pg.innerHTML=P[r.name](...r.args);
  pg.classList.remove('in');void pg.offsetWidth;pg.classList.add('in');
  $$('.flt.tabs',pg).forEach(t=>{const on=t.querySelector('.cb.on');if(on&&t.scrollWidth>t.clientWidth)t.scrollLeft=Math.max(0,on.offsetLeft-(t.clientWidth-on.offsetWidth)/2)});
}
function route(force){
  const r=parseHash();if(!P[r.name]){r.name='inicio';r.args=[];r.path='inicio'}
  CURG=GOF(r.name=='clase'?'clases':r.name);
  const same=!force&&!SRCH&&LASTPATH===r.path;
  if(!same){
    SRCH=false;dlgClose(false);
    const sd=$('#side');sd.innerHTML=sideHtml(r.name,r.args);sd.classList.remove('open');
    $('#page').style.setProperty('--ac',CURG[1]);
    renderPage(r);
    document.title=pageTitle(r.name,r.args)+' · Karavan Online';
    LASTPATH=r.path;
    try{window.scrollTo({top:0,left:0,behavior:'instant'})}catch(_){window.scrollTo(0,0)}
  }
  if(r.det){
    if(!dlgById(r.det)){const el=document.getElementById(r.det);if(el){el.scrollIntoView({block:'start'});el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash')}}
  }else if(same)dlgClose(false);
}

/* ---------- entradas de búsqueda ---------- */
document.addEventListener('input',e=>{
  const t=e.target;if(!t||!t.id)return;const v=t.value||'';
  if(t.id=='q'){
    if(v.trim().length>=2){
      SRCH=true;const pg=$('#page');
      pg.innerHTML=head('Resultados','Coincidencias con «'+esc(v.trim())+'»','Buscar')+'<div class="sres">'+resultsInner(v,60)+'</div>';
    }else if(SRCH){SRCH=false;const h=parseHash();if(!P[h.name]){h.name='inicio';h.args=[]}renderPage(h)}
  }else if(t.id=='q2'){
    let box=$('#q2res');if(!box){box=document.createElement('div');box.id='q2res';box.className='sres';t.closest('.wk-s').after(box)}
    box.innerHTML=v.trim().length>=2?resultsInner(v,24):'';
  }else if(t.id=='iq'){
    const box=$('#ires');if(!box)return;
    const r=v.trim().length>=2?runSearch(v,72):null;
    if(!r){box.hidden=true;box.innerHTML='';return}
    const all=r.it;
    box.innerHTML=all.length?all.map(resItem).join(''):'<p class="cnt" style="grid-column:1/-1">No encontré ese objeto. Prueba con otra palabra.</p>';
    box.hidden=false;
  }
});
/* un resultado que apunta a la misma dirección en la que ya estás no dispara hashchange */
document.addEventListener('click',e=>{
  const a=e.target.closest&&e.target.closest('.sres a[href^="#/"],#ires a[href^="#/"]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.button)return;
  if(a.getAttribute('href')===location.hash){e.preventDefault();SRCH=false;route(true)}
});
addEventListener('keydown',e=>{
  if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement||{}).tagName||'')&&!(DLG&&!DLG.hidden)){
    const q=$('#q2')&&$('#q2').offsetParent?$('#q2'):$('#q');if(q){e.preventDefault();q.focus();q.select&&q.select()}
  }
});
addEventListener('hashchange',()=>route());
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>route());else route();
})();
