/* Wiki de Silk Road: se genera a partir de los datos reales del juego (wiki-data.js). */
(function(){
const W=window.WIKI,L=window.LORE,A=window.ART;
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=n=>(+n).toLocaleString('es');
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const CG=['#b8862a','#6b7c93','#b8442a','#3a8f4a','#e3d79a','#d8892a','#2f9f78','#a8552d'];
const BIO={g:'Llanura',f:'Bosque',s:'Estepa',m:'Montaña',d:'Desierto',w:'Hielo',r:'Cañón',a:'Cenizas'};
const BIOK={g:'g',f:'f',s:'s',m:'m',d:'d',w:'w',r:'r',a:'a'};
const RC=['','r1','r2','r3'];
const tbl=(h,rows,num)=>'<div class="tbl"><table><thead><tr>'+h.map((x,i)=>'<th'+(num&&num.includes(i)?' class="num"':'')+'>'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map((x,i)=>'<td'+(num&&num.includes(i)?' class="num"':'')+'>'+x+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
const spr=(c,t,k)=>'<span class="spr" style="--c:'+c+';--t:'+t+';--k:'+(k||4)+'"></span>';
const pill=(t,c)=>'<span class="pill '+(c||'')+'">'+t+'</span>';
const note=(t,w)=>'<div class="note'+(w?' warn':'')+'">'+t+'</div>';
const gem=n=>'<b>'+n+'</b> 💎';
const mpOf=c=>W.classes[c];
const head=(t,s)=>'<h1>'+t+'</h1>'+(s?'<p class="sub">'+s+'</p>':'');

/* ---------- navegación ---------- */
const NAV=[
 ['Empezar',[['inicio','🏠','Inicio'],['lore','📜','La Gran Ruta (lore)'],['guia','🧭','Guía del recién llegado']]],
 ['Personajes',[['clases','⚔️','Las 8 clases'],['skills','✨','Habilidades'],['equipo','🛡️','Equipo y rarezas'],['entrenamiento','🕯️','Entrenamiento']]],
 ['El mundo',[['mundo','🗺️','Tierras y ciudades'],['cuevas','🕳️','Cuevas y la Torre'],['submundo','🔥','El Submundo'],['monstruos','👹','Monstruos y jefes'],['clima','🌦️','Clima y estaciones'],['celestiales','🌠','Celestiales y dragones'],['mascotas','🐎','Mascotas y monturas']]],
 ['Progreso y oro',[['farmeo','💰','Farmeo, oro y botín'],['misiones','📋','Misiones diarias'],['carpas','🏕️','Carpas y edificios'],['premium','💎','Servicios premium'],['gremios','🏰','Gremios y territorios']]],
 ['Más',[['eventos','🎃','Eventos y estaciones'],['novedades','🆕','Novedades'],['arte','🎨','Arte conceptual'],['creditos','ℹ️','Créditos']]]
];
function side(cur){
  return '<input id="q" type="search" placeholder="Buscar en la wiki…" autocomplete="off" aria-label="Buscar">'+NAV.map(g=>'<h4>'+g[0]+'</h4>'+g[1].map(x=>'<a href="#/'+x[0]+'" class="'+(cur==x[0]||(cur=='clase'&&x[0]=='clases')?'on':'')+'"><span class="n">'+x[1]+'</span>'+x[2]+'</a>').join('')).join('');
}

/* ---------- páginas ---------- */
const P={};

P.inicio=()=>{
  const hits=NAV.slice(1).flatMap(g=>g[1]).map(x=>'<a class="hit" href="#/'+x[0]+'"><b>'+x[1]+' '+x[2]+'</b></a>').join('');
  return head('Wiki de Silk Road','Todo lo que necesitas saber de la Gran Ruta, sacado directamente de los datos del juego.')
  +'<div class="quote">'+esc(L.world.quote)+'</div>'
  +'<h2>Empieza por aquí</h2><div class="hits" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">'+hits+'</div>'
  +'<h2>Las 8 clases</h2><div class="grid g4 slots" style="margin-top:14px">'+W.classes.map(c=>HERO.slot(c.id)).join('')+'</div>';
};

P.lore=()=>head(L.world.title,'El mundo de Silk Road')
 +'<div class="lore">'+L.world.p.map(t=>'<p>'+t+'</p>').join('')+'</div>'
 +'<div class="quote">'+L.world.quote+'</div>'
 +'<h2>Las Bestias Celestiales</h2><div class="sheet">'+A.place('celest')+'</div><div class="lore"><p>'+L.celest.p.join('</p><p>')+'</p></div>'
 +'<h2>Los dragones del mes</h2><div class="sheet">'+A.place('fire')+'</div><div class="lore"><p>'+L.dragon.p[0]+'</p></div>'
 +'<h2>Leyendas de cada clase</h2><div class="hits">'+W.classes.map(c=>'<a class="hit" href="#/clase/'+c.id+'"><b>'+c.ic+' '+c.n+'</b> · '+L.classes[c.id].titulo+'<small>'+L.classes[c.id].lema+'</small></a>').join('')+'</div>';

P.guia=()=>head('Guía del recién llegado','Tus primeros pasos en la Ruta')
 +'<h2>Tutorial del juego</h2><ul>'+W.tuto.map(t=>'<li>'+esc(t)+'.</li>').join('')+'</ul>'
 +'<h2>Consejos rápidos</h2><ul>'
 +'<li><b>Elige clase según cómo quieras jugar:</b> tanque (Caballero, Enana), mucho daño (Mago, Arquero), apoyo (Sanador), técnico (Monje, Elfa) o negocios (Mercader). <a href="#/clases">Ver clases</a>.</li>'
 +'<li><b>El nivel solo sube vida y maná.</b> Tu poder de combate (daño, defensa y agilidad) sale de las 3 skills que entrenas en la Carpa. <a href="#/entrenamiento">Cómo entrenar</a>.</li>'
 +'<li><b>Toca 🎁 para recoger el botín</b> o activa el servicio de loot automático. <a href="#/premium">Servicios</a>.</li>'
 +'<li><b>Si mueres pierdes XP y casi todo tu botín.</b> La Bendición te deja conservar mochila, carga y oro.</li>'
 +'<li><b>Cocina tu carne y pescado</b> en la Carpa del Cocinero (suroeste de la ciudad) para recuperar vida y maná.</li>'
 +'<li><b>Las ciudades están a salvo.</b> Los enemigos más duros viven lejos: sigue el camino de Chang\'an hacia el oeste. <a href="#/mundo">Mapa y tierras</a>.</li></ul>'
 +note('Los niveles recomendados de las tierras suben de 1 hasta 29 en el mapa base; los jefes, cuevas y la Torre del Lago van mucho más allá.');

/* --- clases --- */
P.clases=()=>head('Las 8 clases','Cada una con su estilo, su lore y su propia lista de habilidades.')
 +'<div class="grid g4 slots">'+W.classes.map(c=>HERO.slot(c.id)).join('')+'</div>'
 +'<h2>Comparativa</h2>'+tbl(['Clase','Vida base','MP base','Daño','Velocidad','Alcance','Daño recibido','Habilidad insignia'],W.classes.map(c=>['<a href="#/clase/'+c.id+'">'+c.ic+' '+c.n+'</a>',c.hp,c.mp,'×'+c.dm,c.sp,c.rg?c.rg+' px':'Cuerpo a cuerpo','×'+c.df,c.sig]),[1,2,3,4]);

P.clase=(id)=>{
  id=Math.max(0,Math.min(7,+id||0));const c=W.classes[id],lo=L.classes[id];
  const mx=k=>Math.max(...W.classes.map(x=>x[k]));
  const st=(lab,val,txt,k)=>'<div class="stat" style="--cc:'+CG[id]+'"><label>'+lab+'<b>'+txt+'</b></label><div class="bar"><i style="width:'+Math.max(6,Math.min(100,100*val/mx(k)))+'%"></i></div></div>';
  let h='<div class="sheet">'+A.classScene(id,3)+'<div class="cap"><div class="ttl">'+lo.titulo+'</div><h1>'+c.ic+' '+c.n+'</h1><div class="lema">'+lo.lema+'</div></div></div>';
  h+='<p style="text-align:center"><button type="button" class="btn" data-hero="'+id+'">🔍 Ver al héroe tal como se ve en el juego</button></p>';
  h+='<div class="lore">'+lo.p.map(t=>'<p>'+t+'</p>').join('')+'</div>'+note('<b>'+lo.ideal+'</b><br>'+esc(c.d));
  h+='<h2>Atributos</h2><div class="stats">'
   +st('Vida base',c.hp,c.hp,'hp')+st('Vida por nivel',c.hl||1,'+'+(c.hl||0),'hl')+st('MP base',c.mp,c.mp,'mp')+st('Daño',c.dm,'×'+c.dm,'dm')+st('Velocidad',c.sp,c.sp,'sp')+st('Rango de ataque',c.rg||20,c.rg?c.rg+' px':'Cuerpo a cuerpo','rg')
   +'<div class="stat"><label>Daño recibido<b>×'+c.df+'</b></label><div class="bar"><i style="width:'+Math.min(100,c.df*60)+'%;--cc:#b02a30"></i></div></div>'
   +'<div class="stat"><label>Cadencia de golpe<b>'+c.cd+' s</b></label><div class="bar"><i style="width:'+Math.min(100,100*(1-c.cd/1.1))+'%"></i></div></div></div>';
  h+='<p>Área de skill: <b>'+esc(c.skill_area)+'</b> · Habilidad insignia: <b>'+esc(c.sig)+'</b> (recarga '+c.scd+' s)</p>';
  h+='<h2>Apariencias de clase</h2><p>Cuatro rarezas que cambian tu aspecto y suman armadura y bonos.</p><div class="tiers">'
   +c.skins.map((s,t)=>'<div class="tier" style="--tg:'+CG[id]+'30">'+spr(id,t,7)+'<h4>'+esc(s.n)+'</h4><small>'+pill(W.rar[t],RC[t])+' '+pill(esc(s.el))+'</small><small>Armadura '+s.ar+' · Def '+s.df+'% · Crít '+s.cr+'%</small><small>'+gem(s.g)+'</small></div>').join('')+'</div>';
  if(c.trajes.length)h+='<h2>Trajes</h2>'+tbl(['Traje','Rareza','Bono','Precio'],c.trajes.map(t=>[esc(t.n),pill(W.rar[t.t]||'',RC[t.t]),esc(t.bn[0].toUpperCase())+' +'+t.bn[1],gem(t.g)]));
  h+='<h2>Habilidades</h2><div class="sk">'+c.skills.map(s=>skillHtml(s)).join('')+'</div>';
  h+='<h2>Sets de equipo</h2><p>Diez conjuntos de siete piezas, de nivel '+W.eqlv[0]+' a '+fmt(W.eqlv[9])+'.</p>'+c.sets.map(s=>setHtml(s)).join('');
  h+='<p style="display:flex;justify-content:space-between;margin-top:34px;gap:10px;flex-wrap:wrap"><a class="btn" href="#/clase/'+((id+7)%8)+'">← '+W.classes[(id+7)%8].n+'</a><a class="btn" href="#/clase/'+((id+1)%8)+'">'+W.classes[(id+1)%8].n+' →</a></p>';
  return h;
};
const skillHtml=s=>'<div class="skill"><div class="i">'+s.ic+'</div><div><h4>'+esc(s.n)+'</h4><p>'+esc(s.d)+'</p><div class="m">'+(s.lv?pill('Nivel '+s.lv):'')+pill('💧 '+s.mp+' MP')+pill('⏱ '+s.cd+' s')+'</div></div></div>';
const setHtml=s=>'<div class="set"><div class="lv">'+fmt(s.lv)+'<small>NIVEL</small></div><div class="pcs"><b>'+esc(s.p[0])+'</b> · '+s.p.slice(1).map(esc).join(' · ')+'</div></div>';

P.skills=(cid)=>{
  cid=+cid||0;const c=W.classes[cid];
  return head('Habilidades','Las 12 habilidades de cada clase se desbloquean por nivel.')
  +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 22px">'+W.classes.map(x=>'<a class="btn" style="padding:9px 14px;font-size:12px;'+(x.id==cid?'background:rgba(230,182,79,.3)':'')+'" href="#/skills/'+x.id+'">'+x.ic+' '+x.n+'</a>').join('')+'</div>'
  +'<h2>'+c.ic+' '+c.n+'</h2><div class="sk">'+c.skills.map(skillHtml).join('')+'</div>'
  +note('Los valores de MP son los del nivel 1. El costo y la recarga de MP crecen junto con tu reserva a medida que subes de nivel, así que el maná siempre pesa.');
};

P.equipo=(cid)=>{
  cid=+cid||0;const c=W.classes[cid];
  return head('Equipo y rarezas','Siete piezas por set, cuatro rarezas y diez niveles de poder.')
  +'<h2>Rarezas</h2>'+tbl(['Rareza','Multiplicador de atributos'],W.rar.map((r,i)=>[pill(r,RC[i]),'×'+W.rm[i]]))
  +'<h2>Sets por clase</h2><div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 18px">'+W.classes.map(x=>'<a class="btn" style="padding:9px 14px;font-size:12px;'+(x.id==cid?'background:rgba(230,182,79,.3)':'')+'" href="#/equipo/'+x.id+'">'+x.ic+' '+x.n+'</a>').join('')+'</div>'
  +c.sets.map(setHtml).join('')
  +note('Las piezas de cada set son: arma, pecho, casco, guantes, pantalón, botas y escudo (o accesorio de mano). Los niveles mayores se consiguen derrotando jefes, en cuevas y en la Torre del Lago.')
  +'<h2>Familias de materiales</h2><p>El equipo forjado se agrupa en cinco familias de material: <b>'+W.tiers.ta.map(esc).join(', ')+'</b>. El Gremio de Forja y la Herrería de cada ciudad sirven para fabricar, reparar y mejorar.</p>'
  +'<h2>Pociones</h2>'+tbl(['Poción','Efecto','Rangos'],Object.values(W.potions).map(p=>[p.ic+' '+esc(p.n),p.mp?'Recupera maná':'Recupera vida'+(p.cl?' (clases con rol especial)':''),W.potion_ranks.filter(Boolean).join(' · ')]))
  +'<h2>Herramientas</h2><div class="tbl"><table><thead><tr><th>Hacha</th><th class="num">Precio</th></tr></thead><tbody>'+W.axes.map(a=>'<tr><td>🪓 '+esc(a[0])+'</td><td class="num">'+fmt(a[1])+' 🪙</td></tr>').join('')+'</tbody></table></div>'
  +'<p>Flechas del Arquero: '+W.arrows.map(esc).join(' → ')+'.</p>';
};

P.entrenamiento=()=>head('Entrenamiento','La Carpa de Entrenamiento: donde se forja tu poder')
 +note('<b>Regla de oro:</b> el nivel (máximo '+fmt(W.train_skill.lvmax)+') solo sube tu <b>vida y tu maná</b>. Tu <b>poder</b> (daño, defensa y agilidad) sale de tres skills que se entrenan en la Carpa, cada una hasta el nivel '+W.train_skill.max+'.')
 +'<h2>Las tres skills</h2><div class="stats">'+['Ataque','Defensa','Agilidad'].map((n,i)=>'<div class="stat"><label>'+W.train_skill.icons[i]+' '+n+'<b>hasta '+W.train_skill.max+'</b></label><div class="bar"><i style="width:100%"></i></div></div>').join('')+'</div>'
 +'<h2>Los tres ritos</h2><p>Haces una ofrenda de oro y peleas contra enemigos de entrenamiento. Cada rito sirve para un rango de skill.</p>'
 +tbl(['Rito','Ofrenda','Enemigos','Puntos por hora','Skill (mín–máx)','Rival'],W.train.map(t=>[t.ic+' '+esc(t.n),fmt(t.of)+' 🪙',t.N,fmt(t.pph),t.min+' – '+t.cap,esc(t.d)]),[1,2,3])
 +'<h2>Puntos para subir cada skill</h2>'+tbl(['De la skill','Puntos para pasar a la siguiente'],W.train_skill.need.map(x=>[x[0],fmt(x[1])]),[0,1])
 +note('La dificultad crece un 7% por cada nivel de skill. Entrenar los primeros niveles es rápido; los últimos hasta '+W.train_skill.max+' son una maratón reservada para los jugadores más dedicados.')
 +'<h2>Área de skill por clase</h2>'+tbl(['Clase','Se entrena como'],W.classes.map(c=>[c.ic+' '+c.n,esc(c.skill_area)]));

/* --- mundo --- */
P.mundo=()=>head('Tierras y ciudades','Un mapa de '+W.world.w+' × '+W.world.h+' casillas con 16 tierras y 12 ciudades-oasis.')
 +'<h2>Las 16 tierras</h2><p>Cada tierra tiene un nivel de peligro (de 0 a 8) y un tipo de paisaje. El nivel de referencia de los enemigos del mapa va del 1 al 29.</p>'
 +tbl(['Tierra','Paisaje','Peligro','Nivel de referencia'],W.regions.map(r=>[esc(r.n),BIO[r.b],pill('Nivel '+r.t,RC[Math.min(3,Math.floor(r.t/3))]),[1,5,8,12,15,19,22,26,29][r.t]]))
 +'<h2>Las 12 ciudades-oasis</h2><p>Las ciudades son zonas seguras con todos los servicios. Cada una tiene su carácter comercial.</p>'
 +tbl(['Ciudad','Coordenadas'],W.cities.map(c=>['🏛️ '+esc(c.n),c.tx+', '+c.ty]),[1])
 +'<h2>Puntos de interés</h2><p>'+W.landmarks.map(l=>pill(esc(l))).join(' ')+'</p>'
 +'<h2>Zonas malditas</h2><p>Doce zonas marcadas con ☠ en el mapa, llenas de muertos vivientes y élites. Se descubren caminando cerca.</p><p>'+W.zones_cursed.map(z=>pill('☠ '+esc(z),'r2')).join(' ')+'</p>'
 +'<h2>Paisajes</h2><div class="gal">'+['g','f','m','d'].map(k=>shot(k)).join('')+'</div>';

P.cuevas=()=>head('Cuevas y la Torre del Lago','Cinco mazmorras con guardianes únicos')
 +W.caves.map((c,i)=>{const k=['spider','bones','swamp','abyss','tower'][i];const rumor=c.rumor;
   return '<h2>'+esc(c.n)+'</h2><div class="sheet">'+A.place(k)+'</div><p><i>Se rumorea: '+esc(rumor)+'.</i></p><div class="stats"><div class="stat"><label>Pisos<b>'+fmt(c.fl)+'</b></label></div><div class="stat"><label>Guardián<b style="font-size:13px">'+esc(c.guard)+'</b></label></div></div><p>Zonas: '+c.floors.map(x=>pill(esc(x))).join(' ')+'</p>'}).join('')
 +note('La <b>Torre del Lago</b> tiene 600 pisos y su botín de equipo es exclusivo. Se dice que nadie ha visto el final.');

P.monstruos=()=>head('Monstruos y jefes','Desde las ratas de Chang\'an hasta el Faraón maldito')
 +'<h2>Los 9 enemigos del camino</h2>'+tbl(['Enemigo','Peligro','Nivel de ref.','En el mapa'],W.farm.map(f=>[f.ic+' '+f.n,pill('Nivel '+f.t,RC[Math.min(3,Math.floor(f.t/3))]),f.lv,fmt(f.cnt)]),[2,3])
 +'<h2>Jefes del mundo</h2><p>Ocho colosos y señores con guaridas fijas en el mapa.</p>'+tbl(['Jefe','Nivel','Vida','Daño','Velocidad'],W.bosses.map(b=>['👑 '+esc(b.n),b.lv,fmt(b.hp),b.dm,b.spd]),[1,2,3,4])
 +'<h2>Guaridas de bestias</h2>'+tbl(['Bestia','Vida','Daño','Peligro mín.'],W.lairs.map(l=>[esc(l.n),fmt(l.hp),l.dm,l.tmin]),[1,2,3])
 +'<h2>Jefes de horda</h2><p>Cada tipo de enemigo tiene su jefe de horda, que aparece con su manada.</p>'+tbl(['Jefe','Vida','Daño'],W.hordes.map(h=>[esc(h.n),fmt(h.hp),h.dm]),[1,2]);

P.celestiales=()=>head('Celestiales y dragones','Las criaturas legendarias de la Ruta')
 +'<h2>Las Bestias Celestiales</h2><div class="sheet">'+A.place('celest')+'</div><div class="lore"><p>'+L.celest.p.join('</p><p>')+'</p></div>'
 +tbl(['Bestia','Vida','Maná','Dónde'],W.celest.map(z=>['🌠 '+esc(z.n),fmt(z.hp),fmt(z.mp),'Esquina '+z.dir+' del mapa']),[1,2])
 +note('Derrotar a una Celestial te da su montura como premio: el <b>Corcel Dorado</b> o el <b>Buey Robusto</b>. No se venden en ninguna tienda.')
 +'<h2>Los dragones del mes</h2><div class="gal">'+shot('fire')+shot('ice')+'</div><div class="lore"><p>'+L.dragon.p[0]+'</p></div>'
 +tbl(['Dragón','Elemento'],W.dragons.map(d=>[esc(d.n),d.k=='fire'?'🔥 Fuego':'❄️ Hielo']))
 +note('Hay tres eventos de dragón por mes. La fecha, la hora y el dragón son iguales para todos los jugadores.');

P.mascotas=()=>head('Mascotas y monturas','Compañeros que pelean contigo y monturas veloces')
 +tbl(['','Nombre','Tipo','Vida','Energía','Precio','Descripción'],W.pets.map(p=>[p.ic||'🐾',esc(p.n),p.kind=='m'?pill('Montura','r1'):pill('Compañero'),p.hp,p.en,p.price?fmt(p.price)+' 🪙':pill('Premio','r3'),esc(p.d||'')]),[3,4])
 +note('Las mascotas se compran en el <b>Establo</b> de cada ciudad. El Corcel Dorado, el Buey Robusto y el León Rojo son premios y no se compran.');

/* --- progreso --- */
P.farmeo=()=>{
  const f=W.farm;
  return head('Farmeo, oro y botín','De dónde sale el oro y cómo sacarle más provecho')
  +note('Todos los valores son <b>base</b>: se multiplican por tus bonos de equipo, el oro del Mercader y los servicios que actives. Los enemigos de élite y de horda dan más.')
  +'<h2>XP y oro por tipo de enemigo</h2>'+tbl(['Enemigo','Nivel ref.','XP base','Prob. de oro','Oro por drop','Oro por kill*'],f.map(x=>[x.ic+' '+x.n,x.lv,x.xp,Math.round(x.pg*100)+'%',x.gold,'<b>'+x.eg+'</b>']),[1,2,3,4,5])
  +'<p><small>* Promedio base por enemigo muerto, antes de bonos. Un kill de nivel alto rinde mucho más que uno bajo: el oro crece 50% por cada nivel de peligro.</small></p>'
  +'<h2>Otros drops</h2>'+tbl(['Enemigo','Equipo viejo','Poción de vida','Poción de maná','Carne'],f.map(x=>[x.ic+' '+x.n,Math.round(x.pi*100)+'%',Math.round(x.pp*100)+'%',Math.round(x.pm*100)+'%',x.pc?Math.round(x.pc*100)+'%':'—']),[1,2,3,4])
  +'<p>El <b>equipo viejo</b> se vende a los comerciantes. Los enemigos de élite pueden soltar equipo de verdad, y los jefes y la Torre del Lago, el mejor.</p>'
  +'<h2>Cómo farmear mejor</h2><ul>'
  +'<li><b>Activa el loot automático</b> para no perder oro mientras peleas. <a href="#/premium">Ver servicios</a>.</li>'
  +'<li><b>Sube a zonas de más peligro cuando tu equipo aguante:</b> el oro por kill pasa de menos de 1 en las ratas a casi 15 en el Faraón maldito.</li>'
  +'<li><b>Caza presas y cocina:</b> la carne cocida recupera vida y maná (2% cada 5 s la común, hasta 6% la legendaria) durante 6 minutos.</li>'
  +'<li><b>Usa las misiones diarias</b> para sumar XP y oro extra. <a href="#/misiones">Ver misiones</a>.</li>'
  +'<li><b>El Mercader gana con el comercio:</b> compra barato en una ciudad y vende caro en otra por la Ruta.</li></ul>'
  +'<h2>Nivel de Caza</h2><p>Cada presa cuenta para tu Nivel de Caza, que mejora la calidad de la carne.</p>'+tbl(['Nivel de Caza','Presas necesarias'],W.hz.map((n,i)=>[i+1,fmt(n)]),[0,1]);
};

P.misiones=()=>head('Misiones diarias','Objetivos que se renuevan cada día')
 +tbl(['','Misión',...W.dqd],W.dq.map(q=>[q.ic,esc(q.n),...q.tg.map(t=>t?fmt(t):'—')]),[2,3,4,5])
 +'<p><small>Las cantidades son la meta según la dificultad de la misión. Cuanto más difícil, mayor la recompensa.</small></p>';

P.carpas=()=>head('Carpas y edificios','Los servicios que encuentras en cada ciudad')
 +'<div class="grid g3">'+W.bld.map(b=>'<div class="card"><span class="ico">'+b.ic+'</span><h3>'+esc(b.n)+'</h3><p>'+esc(b.d)+'</p></div>').join('')+'</div>';

P.premium=()=>head('Servicios premium','Se pagan con gemas propias. Mejoran la comodidad, no la fuerza')
 +tbl(['','Servicio','Qué hace','Duración y precio'],W.prem.map(p=>[p.ic,'<b>'+esc(p.n)+'</b>',esc(p.d),p.dur.map((d,i)=>d+' días: '+gem(p.p[i])).join('<br>')]))
 +note('Máximo 90 días acumulados por servicio. Las gemas <b>propias</b> se usan para servicios; las <b>transferidas</b> solo valen para apariencias.')
 +note('<b>🌐 Traducción del chat:</b> 10 💎 por 30 días. Pulsa 🌐 junto a cualquier mensaje de otro idioma para leerlo en el tuyo. Elegir tu idioma es gratis.');

P.gremios=()=>head('Gremios y territorios','Une a tus amigos y reclama tu pedazo de la Ruta')
 +'<div class="stats"><div class="stat"><label>Fundar un gremio<b>'+W.guild.gems+' 💎</b></label></div><div class="stat"><label>Miembros máximos<b>'+W.guild.max+'</b></label></div><div class="stat"><label>Etiqueta<b>2 a 4 letras</b></label></div><div class="stat"><label>Nombre<b>3 a 20 letras</b></label></div></div>'
 +'<h2>Territorios</h2><p>Los gremios pueden construir en el mundo con madera, piedra y hierro:</p><p>'+Object.values(W.terr).map(x=>pill(esc(x))).join(' ')+'</p>'
 +note('Define el mensaje del día, la descripción y el modo de entrada desde los Ajustes del gremio.');

P.eventos=()=>{const M=['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return head('Eventos y estaciones','El mundo cambia con el calendario')
  +'<h2>Eventos</h2>'+tbl(['','Evento','Fechas'],W.events.map(e=>[e.ic,esc(e.n),e.a?e.a[1]+' de '+M[e.a[0]]+' – '+e.b[1]+' de '+M[e.b[0]]:'Según el calendario lunar']))
  +'<h2>Estaciones</h2>'+tbl(['','Estación'],W.seasons.map(s=>[s.ic,s.n]))
  +'<p>La estación cambia la apariencia del mundo según el mes. Durante Noche de Brujas aparecen enemigos y tesoros especiales.</p>'
  +'<h2>Dragones</h2><p>Tres veces al mes baja <b>Ignarax</b> o <b>Glacius</b>. Ver <a href="#/celestiales">Celestiales y dragones</a>.</p>';};

/* --- arte --- */
const shot=(k,cap)=>{const m=A.placeMeta(k);return '<figure class="shot" data-art="'+k+'">'+A.place(k)+'<figcaption>'+esc((m&&m.n)||cap)+'<small>'+esc((m&&m.s)||'')+'</small></figcaption></figure>'};
const clsShot=c=>'<figure class="shot" data-cls="'+c+'">'+A.classScene(c,3)+'<figcaption>'+W.classes[c].ic+' '+W.classes[c].n+'<small>'+L.classes[c].titulo+'</small></figcaption></figure>';
P.arte=()=>head('Arte conceptual','Escenas y emblemas originales de Silk Road. Toca una imagen para verla grande.')
 +'<h2>Las clases</h2><div class="gal">'+[0,1,2,3,4,5,6,7].map(clsShot).join('')+'</div>'
 +'<h2>Emblemas</h2><div class="tiers" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">'+W.classes.map(c=>'<div class="tier">'+A.emblem(c.id,84)+'<h4>'+c.n+'</h4></div>').join('')+'</div>'
 +'<h2>Las tierras</h2><div class="gal">'+['g','f','s','m','d','w','r','a'].map(k=>shot(k)).join('')+'</div>'
 +'<h2>Lugares de leyenda</h2><div class="gal">'+['celest','fire','ice','tower','spider','abyss','bones'].map(k=>shot(k)).join('')+'</div>';


/* ---------- clima (datos tomados de la lógica real del juego) ---------- */
const WX=[
 ['clear','☀️','Despejado','Sin efectos. Ideal para farmear tranquilo.',[]],
 ['rain','🌧️','Lluvia','Los caminos se embarran con charcos y tu antorcha se gasta 40% más rápido.',['Visión 85%','Antorcha ×1.4','Empuje leve','−3°']],
 ['storm','⛈️','Tormenta','Caen rayos ⚡ que golpean a los enemigos cercanos… y a ti si estás debajo y sin refugio (12% de tu vida máxima, nunca te matan).',['Visión 75%','Antorcha ×1.8','Viento fuerte','−4°']],
 ['snow','🌨️','Nevada','La nieve se acumula y te frena hasta 28%. Los caminos que pisas se despejan.',['Visión 85%','Antorcha ×1.2','−5°']],
 ['blizzard','❄️','Ventisca','El viento te empuja, casi no ves y la nieve se acumula rápido. Busca refugio en una ciudad.',['Visión 50%','Antorcha ×2.4','Empuje máximo','−12% velocidad extra','−11°']],
 ['wind','🍂','Vendaval','Vuelan hojas. El viento desvía tus flechas y hechizos, y empuja al jugador.',['Visión 92%','Antorcha ×1.5','Desvía proyectiles','−2°']],
 ['heat','🥵','Ola de calor','Correr te cansa mucho más rápido (gasto de energía ×1.6) si hace más de 34°.',['Energía ×1.6','+9°']],
 ['sand','🏜️','Tormenta de arena','Poca visibilidad y el viento te empuja. Solo en el desierto (fuera de él se vuelve vendaval).',['Visión 55%','Antorcha ×1.3','Energía ×1.2','−12% velocidad extra','+3°']],
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

P.creditos=()=>head('Créditos','Quién hizo qué')
 +'<p><b>Silk Road: The Great Adventure</b> es un juego de Silk Games Studios.</p>'
 +'<ul><li>Sprites de personajes y enemigos: tileset <b>DawnLike</b> (CC-BY 4.0) de DragonDePlatino y DawnBringer.</li><li>Las escenas, emblemas y textos de esta wiki son originales.</li><li>Los datos de la wiki se extraen directamente del juego, así que siempre reflejan lo que hay dentro.</li></ul>';

/* ---------- búsqueda ---------- */
let IDX=null;
function buildIdx(){
  IDX=[];const add=(t,s,r)=>IDX.push({t,s,r,n:norm(t+' '+s)});
  NAV.forEach(g=>g[1].forEach(x=>add(x[2],g[0],'#/'+x[0])));
  W.classes.forEach(c=>{add(c.n,'Clase · '+L.classes[c.id].titulo,'#/clase/'+c.id);c.skills.forEach(s=>add(s.n,c.n+' · habilidad nv '+s.lv,'#/skills/'+c.id));c.skins.forEach(s=>add(s.n,c.n+' · apariencia','#/clase/'+c.id));c.sets.forEach(s=>s.p.forEach(p=>add(p,c.n+' · set nv '+s.lv,'#/equipo/'+c.id)))});
  W.farm.forEach(f=>add(f.n,'Enemigo · farmeo','#/farmeo'));W.bosses.forEach(b=>add(b.n,'Jefe nv '+b.lv,'#/monstruos'));W.hordes.forEach(b=>add(b.n,'Jefe de horda','#/monstruos'));W.lairs.forEach(b=>add(b.n,'Guarida','#/monstruos'));
  W.caves.forEach(c=>{add(c.n,'Cueva','#/cuevas');add(c.guard,'Guardián de '+c.n,'#/cuevas')});W.regions.forEach(r=>add(r.n,'Tierra','#/mundo'));W.cities.forEach(c=>add(c.n,'Ciudad','#/mundo'));W.landmarks.forEach(l=>add(l,'Punto de interés','#/mundo'));W.zones_cursed.forEach(z=>add(z,'Zona maldita','#/mundo'));
  W.celest.forEach(z=>add(z.n,'Bestia celestial','#/celestiales'));['Balor|Jefe del Portón de Fuego (nv 400)','Minotauro|Submundo','Portón de Fuego|Submundo (8 placas)','Bolso de Fuego|Bolso de 65 espacios','Ágora Caída|Entrada al Submundo','Refugio|Pueblo seguro del Submundo','Infierno|Temporada 2'].forEach(z=>{const q=z.split('|');add(q[0],q[1],'#/submundo')});W.dragons.forEach(d=>add(d.n,'Dragón','#/celestiales'));W.pets.forEach(p=>add(p.n,'Mascota o montura','#/mascotas'));W.bld.forEach(b=>add(b.n,'Edificio','#/carpas'));W.prem.forEach(p=>add(p.n,'Servicio premium','#/premium'));W.events.forEach(e=>add(e.n,'Evento','#/eventos'));W.dq.forEach(q=>add(q.n,'Misión diaria','#/misiones'));W.train.forEach(t=>add(t.n,'Rito de entrenamiento','#/entrenamiento'));
}
function search(q){
  if(!IDX)buildIdx();const k=norm(q.trim());if(!k)return null;
  const r=IDX.filter(x=>x.n.includes(k)).slice(0,40);
  return '<h1>Resultados</h1><p class="sub">'+r.length+' coincidencias para «'+esc(q)+'»</p><div class="hits">'+(r.map(x=>'<a class="hit" href="'+x.r+'"><b>'+esc(x.t)+'</b><small>'+esc(x.s)+'</small></a>').join('')||'<p>No encontré nada. Prueba con otra palabra.</p>')+'</div>';
}


/* ---------- v268: Submundo y Novedades ---------- */
P.submundo=()=>head('El Submundo del Ágora Caída','Un mundo entero bajo las ruinas griegas · mobs míticos nv 40–350 · Portón de Fuego y Balor')
 +note('<b>Cómo se entra:</b> bajo las ruinas del <b>Ágora Caída</b> hay una puerta al Submundo. Hace falta el servicio <b>VIP de 7 '+'💎</b> o el <b>Combo Cazador de 3 '+'💎</b> activo. Si el servicio se acaba mientras estás abajo, te devuelve a las ruinas.')
 +'<p>El Submundo tiene el mismo tamaño que el mapa de arriba, pero está hecho de cuevas y galerías: caminos que se abren, se cruzan y se pierden. Todo lo que ves son ruinas, ríos de lava y criaturas de la mitología.</p>'
 +'<h2>Zonas y monstruos</h2><p>Cuanto más lejos del inicio, más fuertes son los monstruos: <b>nivel 40 al empezar y hasta 350</b> cerca del final. Su vida, su daño y lo que dan al morir suben con su nivel.</p>'
 +tbl(['Zona','Qué te encuentras'],[
  ['Galerías de Hades','Trasgos, orcos del Tártaro, arácnidos de Aracne, escorpiones, hoplitas esqueleto'],
  ['Laberinto del Minotauro','Minotauros, cíclopes, sátiros abisales, autómatas de Hefesto, carneros dorados'],
  ['Nido de las Lamias','Lamias, medusas, cocodrilos del Estigia, náyades corruptas'],
  ['Campos de Asfódelos','Centauros caídos, nigromantes de Hécate, psicopompos, sombras de Caronte'],
  ['Ríos de Fuego','Diablos del Flegetonte, demonios de brasas, súcubos, titanes sangrientos, Cerbero'],
  ['Puertas del Tártaro','Demonios ardientes, arcángeles caídos, archidemonios, grandes demonios, titanes de piedra']])
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
  ['Oro','45%','Un 12% de la experiencia que daría el monstruo'],
  ['Experiencia','siempre','Nivel del monstruo → 1/700 de lo que cuesta subir ese nivel']],[1])
 +'<p>Ejemplos de experiencia por monstruo: nivel 40 → 64 · nivel 100 → 562 · nivel 200 → 3.565 · nivel 300 → 11.066 · nivel 350 → 17.147.</p>';
P.novedades=()=>head('Novedades','Lo último que se añadió al juego')
 +'<h2>🔥 El Submundo (v263–v268)</h2><ul><li>Nuevo mundo bajo las ruinas del Ágora Caída, <a href="#/submundo">con mobs míticos nv 40–350</a>.</li><li>Portón de Fuego (8 placas) y el jefe Balor, nivel 400, 20 M de vida.</li><li>Pueblo-refugio: zona segura, reaparición y tiendas escondidas.</li><li>Botín propio: equipo común nv 30/50/60 y el Bolso de Fuego de 65 espacios.</li><li>Experiencia y oro por monstruo según su nivel.</li></ul>'
 +'<h2>🏙️ Pueblos más grandes (v262)</h2><p>Cada ciudad creció con un anillo exterior: calles empedradas, arcos de entrada con el nombre de la ciudad y casas con el estilo de cada cultura. Las ciudades son zona segura.</p>'
 +'<h2>⚡ Cuevas más fluidas (v258–v267)</h2><p>Las cuevas se dibujan desde caché y solo procesan los monstruos cercanos: mucho más FPS, sobre todo en celulares.</p>'
 +'<h2>🎒 Mochilas</h2><p>Mochila y bolsa de loot pueden ser de 25, 40 o 65 espacios. Los bolsos se usan desde 🎒 Objetos.</p>'
 +'<h2>🖥️ Pantalla completa y música</h2><p>El juego entra en pantalla completa al tocar, el título tiene brasas animadas y esta web ya tiene música ambiente (botón 🔊 abajo a la derecha).</p>';

/* ---------- router ---------- */
function route(){
  const h=(location.hash||'#/inicio').replace(/^#\/?/,'').split('/');const name=h[0]||'inicio',arg=h[1];
  const cur=P[name]?name:'inicio';
  $('#side').innerHTML=side(cur);$('#side').classList.remove('open');
  const q=$('#q');if(q)q.addEventListener('input',e=>{const r=search(e.target.value);const m=$('#page');if(r){m.innerHTML=r}else render(cur,arg)});
  render(cur,arg);
  document.title=(cur=='inicio'?'Wiki':(NAV.flatMap(g=>g[1]).find(x=>x[0]==cur)||[0,0,cur])[2])+' · Silk Road';
  window.scrollTo({top:0,behavior:'instant'in window?'instant':'auto'});
}
function render(name,arg){$('#page').innerHTML=P[name](arg)}
addEventListener('hashchange',route);
document.addEventListener('click',e=>{
  const s=e.target.closest&&e.target.closest('.shot');if(!s)return;
  const lb=$('#lb');lb.innerHTML=s.querySelector('svg').outerHTML;lb.classList.add('on');
});
document.addEventListener('DOMContentLoaded',()=>{
  const lb=$('#lb');lb.addEventListener('click',()=>lb.classList.remove('on'));
  addEventListener('keydown',e=>{if(e.key=='Escape')lb.classList.remove('on')});
  route();
});
})();
