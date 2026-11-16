'use strict';
/* v433 · MINI-JEFES — Banshee, Necromancer y Velociraptor. Todo lo que importa lo decide el SERVIDOR.
   Reglas del Documento Maestro:
   · Un jefe = un territorio, un santuario, una arena, una ofrenda, un token y un equipo exclusivo.
   · Primera ofrenda = cadena de 3 misiones de descubrimiento (una vez por personaje). Después, un encargo repetible fabrica nuevas ofrendas con materiales
     del territorio. La ofrenda, el token y los materiales son materiales de cuenta (mercado P2P). NINGUNA ofrenda sale del jefe.
   · Combate en solitario o con Party. UNA sola ofrenda por encuentro: la pone el LÍDER y se consume cuando el servidor confirma que el combate empieza.
     No se gasta mientras se espera ni si la Party pierde el turno. La Party sale del servidor (presencia), nunca de una lista del cliente.
   · Cada participante necesita nivel mínimo, santuario descubierto, cooldown personal libre, estar en la Party activa y presente.
   · Una arena por jefe (AVAILABLE · RESERVED · ACTIVE · CLEANUP), cola FIFO, protección contra turnos duplicados, combates simultáneos, intrusos y reinicios.
   · Cooldown individual de 12 h por jefe con el reloj del servidor; empieza con una victoria válida (playerId, bossId, lastKillAt, nextAvailableAt).
   · Botín: UNA tirada por encuentro (45 % consumibles · 5 % equipo exclusivo · 3 % token · 47 % nada) y UN solo participante al azar lo recibe
     (sin pesos por daño, nivel, líder, tiempo ni orden). Queda registrado (encounterId, bossId, partyId, categoría, jugador, objeto, hora) y es idempotente.
   v434 · ARENA Y COMBATE DE LA BANSHEE (la primera pelea abierta; Necromancer y Velociraptor llegan en v436 y v437):
   · v435: la arena es el SÓTANO de la Mansión Embrujada del Lago, un interior de 4 pisos que el cliente dibuja a pantalla completa (arena VIRTUAL, TERR.ban.va = 'ban.S'): no ocupa
     terreno del mundo, así que no hay nada que sellar ni que mover por coordenadas. El cliente avisa en qué escena está (world.js guarda p.mj) y el servidor decide con eso quién está
     DENTRO de la arena (inArenaU). Entrar y salir de la sala lo hace el cliente cuando el servidor se lo ordena (mbq start / exit). Las arenas físicas (TERR.x.ar) siguen soportadas.
   · (v434, arenas físicas) un rectángulo del mundo (TERR.x.ar). El SERVIDOR mete a los peleadores (world.place), sella la arena
     (solo entra quien está en el encuentro: world.js pregunta a blocked()), y los saca al terminar (evacuación). Nadie de fuera puede entrar ni atacar.
   · La vida del jefe la guarda el SERVIDOR (compartida por toda la Party). Los clientes mandan su daño (hit) con topes por mensaje y por segundo; el jefe no cae antes
     del tiempo mínimo de pelea. La segunda fase (25 %) la sella el servidor con la hora de un límite de turno de ataque que todos conocen (st1), así todos cambian a la vez.
   · La victoria y la derrota las decide el servidor (tick): vida a 0 = victoria (una sola tirada, un solo receptor); todos caídos / desconectados / tiempo = derrota (la ofrenda ya se gastó).
   · Se abre la Banshee y (v436) el Necromancer (OPENB). MJ_FIGHTS=0 cierra todo; MJ_BHP multiplica la vida de los jefes.
   v436 · CASTILLO MALDITO Y SALÓN DE LOS ESPEJOS (Necromancer): misma arquitectura que la mansión de la Banshee (arena VIRTUAL TERR.nec.va = 'nec.S', 4 pisos que dibuja el cliente),
   con un castillo en mitad de la llanura (huella sólida cs/mn, geometría compartida con el cliente entre las marcas GEO2) y la mecánica de los espejos: el jugador puede
   romper hasta DOS de los cuatro espejos (mb.mirror). El servidor lo registra, avisa a la Party (mbm) y fija la hora en que surte efecto en el siguiente límite de turno de ataque,
   para que todos los clientes (que calculan el guion con la misma semilla) cambien a la vez.
   v437 · BOSQUE DE LOS COLMILLOS Y CLARO DEL DEPREDADOR (Velociraptor): misma arquitectura (arena VIRTUAL TERR.rap.va = 'rap.S': 4 sectores que dibuja el cliente a pantalla completa), con un bosque vivo sobre el
   territorio (árboles, claros y senderos, geometría compartida con el cliente entre las marcas GEO3) y la mecánica de la HIERBA ALTA: solo el Mago puede quemar un manchón (mb.burn). El servidor valida clase,
   presencia, enfriamiento y tope (2 manchones a la vez), fija la hora en que surte efecto (siguiente límite de turno con margen) y avisa a la Party (mbf): el fuego es LOCAL, TEMPORAL y limitado, nunca permanente. */
module.exports=function(S,E,X){
 X=X||{};
 const ops={},err=e=>({e}),now=()=>(X.now?X.now():Date.now());
 const crypto=require('crypto');
 const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
 const tokn=()=>crypto.randomBytes(8).toString('hex');
 const envN=(k,d,lo,hi)=>{const v=parseFloat(process.env[k]);return Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):d};
 const CD=12*36e5,CONF=60000,MAXP=8,QMAX=40,MAXFIGHT=20*60000,OFFLINE=90000,RECON=25000,CLEAN=3000;
 /* v434: salida de la arena tras el combate (ms): victoria = tiempo para ver el resultado; derrota = más corto */
 const EXIT_W=14000,EXIT_L=6000,P2=.25,HITPM=.25,HITPS=.40;
 const FIGHTS=X.fights!=null?!!X.fights:process.env.MJ_FIGHTS!=='0';
 const OPENB={ban:1,nec:1,rap:1};                           /* jefes cuya arena ya está construida (v434: Banshee · v436: Necromancer · v437: Velociraptor) */
 const isOpen=b=>FIGHTS&&(X.fights!=null||!!OPENB[b]);
 /* afinación sin tocar el código (variables de Render): MJ_HP / MJ_DM (vida y daño de los monstruos de territorio), MJ_XP (experiencia), MJ_CNT (cantidad), MJ_RZ (segundos de reaparición), MJ_OFF=1 (sin monstruos de territorio) */
 const HPK=envN('MJ_HP',1,.05,20),DMK=envN('MJ_DM',1,.05,10),XPK=envN('MJ_XP',1,.05,20),CNTK=envN('MJ_CNT',1,.1,3),RZ=Math.round(envN('MJ_RZ',25,5,600)*1000);
 const BHPK=envN('MJ_BHP',1,.02,50);   /* v434: multiplicador de la vida de los JEFES (afinación sin tocar el código) */
 /* ───────── jefes ─────────
    min = nivel de acceso · lv = nivel del jefe · of/tk = clave de la ofrenda y del token · fight = tiempo mínimo de pelea (s) · hpk = vida del jefe en «vidas del monstruo más duro de su nivel» (v434) · st1 = duración del turno de ataque de la fase 1 (ms; el cliente usa el mismo número) · pot/mpot = consumibles de la tirada
    eq = equipo exclusivo, creado como el juego crea los objetos de jefe (slot sl, tier t, rareza r, clase k, multiplicador de estadísticas mul) */
 const B={
  ban:{n:'Banshee',min:35,lv:45,of:'mbo1',ofn:'Medallón de la Viuda',tk:'mbt1',tkn:'Esencia del Viento Espectral',fight:30,hpk:3,st1:5200,pot:[8,20],mpot:[5,12],
   eq:{n:'Espada del Lamento',sl:0,k:1,t:1,r:2,mul:1.25},terr:'Pueblo de los Lamentos',arena:'Mansión Embrujada',ic:'👻',alt:'el altar, en el sótano de la mansión',st2:3600,
   desc:'Espíritu de la viuda que nunca dejó de llorar. Flota sobre la Mansión Embrujada y su grito paraliza al que se acerca.'},
  nec:{n:'Necromancer',min:65,lv:75,of:'mbo2',ofn:'Cruz del Ritual Prohibido',tk:'mbt2',tkn:'Núcleo de las Sombras',fight:45,hpk:3,st1:5200,pot:[15,35],mpot:[10,22],
   eq:{n:'Sombrero del Señor Oscuro',sl:2,k:2,t:2,r:2,mul:1.25},terr:'Llanura de los Condenados',arena:'Salón de los Espejos del Castillo Maldito',ic:'💀',alt:'el altar del Salón de los Espejos, en el nivel más hondo del castillo',st2:3600,
   desc:'Señor de las sombras que salta de espejo en espejo. Domina la Llanura de los Condenados desde su Castillo Maldito.'},
  rap:{n:'Velociraptor',min:100,lv:120,of:'mbo3',ofn:'Huevo del Depredador Ancestral',tk:'mbt3',tkn:'Corazón de la Naturaleza Salvaje',fight:45,hpk:3,st1:5200,pot:[25,50],mpot:[15,30],
   eq:{n:'Casco de Piel Ancestral',sl:2,k:-1,t:3,r:2,mul:1.25},terr:'Bosque de los Colmillos',arena:'Claro del Depredador',ic:'🦖',alt:'el altar del nido, en el centro del Claro del Depredador',st2:3600,
   desc:'Depredador alfa de colmillos que parece una sombra entre la maleza alta. Acecha, olfatea y salta cuando menos lo esperas.'}};
 const IDS=Object.keys(B);
 const P_CONS=.45,P_EQ=.05,P_TOK=.03;                       /* el resto (47 %) = ninguna recompensa */
 const roll=()=>{const r=Math.random();return r<P_CONS?'cons':r<P_CONS+P_EQ?'eq':r<P_CONS+P_EQ+P_TOK?'tok':'none'};
 /* materiales de cuenta nuevos (el cliente tiene la misma tabla al final de su lista de materiales) */
 const MAT={mbo1:['🔔','Medallón de la Viuda'],mbo2:['✝️','Cruz del Ritual Prohibido'],mbo3:['🥚','Huevo del Depredador Ancestral'],
  mbt1:['🌬️','Esencia del Viento Espectral'],mbt2:['🔮','Núcleo de las Sombras'],mbt3:['💚','Corazón de la Naturaleza Salvaje'],
  mm11:['📜','Fragmento de recuerdo'],mm12:['💨','Polvo espectral'],mm13:['🧵','Hilo de plata'],
  mm21:['🪞','Fragmento de espejo'],mm22:['🌑','Polvo oscuro'],mm23:['📖','Página del ritual'],
  mm31:['🥚','Huevo de señuelo'],mm32:['🌿','Material natural'],mm33:['🦴','Garra de raptor']};
 /* ───────── territorios y misiones ─────────
    r = rectángulo [x, y, ancho, alto] en casillas · npc = personajes (posición exacta en casillas, sobre terreno libre) · pt = puntos de investigación (SECRETOS: nunca salen del servidor)
    gp = puntos de recolección (visibles) · door = puerta del santuario (solo se revela al descubrirlo) · mob = monstruos del territorio (niveles menores que el jefe)
    steps: talk (npc) · find (puntos de investigación) · kill (monstruos del territorio) · deliver (materiales) · end = cierra la cadena: da la primera ofrenda y descubre el santuario */
 const TERR={
  ban:{r:[200,30,190,90],door:[352,62],
   /* v435 · Mansión Embrujada del Lago: lk = lago [x, y, ancho, alto] en casillas · mn = puerta de la mansión (casilla de la fachada) · pi = muelle [x, y, ancho, largo]
      va = escena de la arena VIRTUAL (el sótano de la mansión: 4 pisos, el cliente los dibuja con el motor de interiores) · la puerta del santuario (door) es la entrada, junto a la fachada */
   lk:[316,38,73,41],mn:[352,60],pi:[351,69,3,10],va:'ban.S',
   npc:[{n:'Mara, la Campanera',x:258,y:108,role:'Campanera del pueblo',c:2}],craft:0,
   mats:{mm11:'Fragmento de recuerdo',mm12:'Polvo espectral',mm13:'Hilo de plata'},rec:{mm11:3,mm12:4,mm13:2},ec:'Recuerdos perdidos',
   ecd:'Mara reúne los recuerdos de los muertos del pueblo. Tráele fragmentos, polvo espectral e hilo de plata y fabricará un nuevo Medallón de la Viuda.',
   pt:{a:[[245,79],[264,72],[280,90]],b:[[266,46],[274,42],[282,48]]},
   gp:[{x:241,y:70,m:'mm11'},{x:272,y:100,m:'mm12'},{x:284,y:58,m:'mm13'},{x:254,y:54,m:'mm12'}],
   mob:{v:'mjSpe',nm:'Espectro del lamento',lv:[35,40],cnt:26,hpk:.9,dmk:1,rwk:1,spm:1.2,ag:300},
   ms:[{n:'Las campanas del silencio',lv:35,d:'Mara, la Campanera, vigila el Pueblo de los Lamentos desde sus afueras. Quiere saber por qué las campanas suenan solas cada noche.',
     st:[{t:'talk',n:'Habla con Mara',d:'Habla con Mara, la Campanera, en las afueras del Pueblo de los Lamentos.',npc:0},
         {t:'find',n:'Tres casas abandonadas',d:'Investiga tres casas abandonadas del pueblo y recoge los fragmentos de cartas. Fíjate en el termómetro: 🔥 caliente / ❄️ frío.',p:'a'}]},
    {n:'Los espíritus del pueblo',lv:38,d:'Los espectros protegen un secreto enterrado. Hay que apagarlos y llegar hasta la tumba de la viuda.',
     st:[{t:'kill',n:'Espectros del lamento',d:'Derrota 10 espectros del lamento que rondan las casas.',k:10},
         {t:'find',n:'La tumba de la viuda',d:'Busca en el cementerio la tumba de la mujer desaparecida y su broche de plata.',p:'b'}]},
    {n:'La última canción de la viuda',lv:40,d:'Con los recuerdos reunidos, Mara puede hacer que la viuda cante por última vez.',
     st:[{t:'deliver',n:'Recuerdos para Mara',d:'Reúne 3 fragmentos de recuerdo, 3 polvos espectrales y 2 hilos de plata de los espectros del pueblo.',m:{mm11:3,mm12:3,mm13:2}},
         {t:'talk',n:'La última ofrenda',d:'Vuelve con Mara: fabricará el Medallón de la Viuda y te mostrará el camino a la Mansión Embrujada.',npc:0,end:1}]}]},
  nec:{r:[840,60,160,110],door:[950,126],
   /* v436 · Castillo Maldito: mn = puerta del castillo (casilla de la fachada, sobre la explanada) · cs = [semiancho de la huella, fondo de la huella, semiancho de la explanada, fondo de la explanada] en casillas · va = escena de la arena VIRTUAL (el Salón de los Espejos, el nivel más bajo del castillo: 4 pisos que dibuja el cliente) */
   mn:[950,121],cs:[14.4,22,11,13],va:'nec.S',
   npc:[{n:'Darian, el Erudito',x:875,y:109,role:'Erudito de la llanura',c:4},{n:'Ashar, el Herrero',x:902,y:152,role:'Herrero del ritual',c:5}],craft:1,
   mats:{mm21:'Fragmento de espejo',mm22:'Polvo oscuro',mm23:'Página del ritual'},rec:{mm21:3,mm22:5,mm23:2},ec:'Fragmentos de la oscuridad',
   ecd:'Ashar, el Herrero, repara las cruces rituales. Tráele fragmentos de espejo, polvo oscuro y páginas del ritual y forjará una nueva Cruz del Ritual Prohibido.',
   pt:{a:[[890,90],[902,130],[884,148]],b:[[924,86],[950,94],[970,132]]},
   gp:[{x:910,y:100,m:'mm22'},{x:964,y:90,m:'mm21'},{x:980,y:120,m:'mm23'},{x:936,y:160,m:'mm22'}],
   mob:{v:'mjGua',nm:'Guardián maldito',lv:[60,70],cnt:20,hpk:1.3,dmk:1.1,rwk:1,spm:1,ag:280},
   ms:[{n:'Los documentos prohibidos',lv:65,d:'Darian, el Erudito, estudia las ruinas de la Llanura de los Condenados y busca las páginas de un libro que no debió escribirse.',
     st:[{t:'talk',n:'Habla con Darian',d:'Habla con Darian, el Erudito, junto a las ruinas de la llanura.',npc:0},
         {t:'find',n:'Las ruinas antiguas',d:'Investiga tres ruinas y recupera las páginas del libro ritual. 🔥 caliente / ❄️ frío.',p:'a'}]},
    {n:'Los guardianes malditos',lv:68,d:'El Castillo Maldito está custodiado. Los guardianes caen, pero los espejos antiguos siguen mirando.',
     st:[{t:'kill',n:'Guardianes malditos',d:'Derrota 12 guardianes malditos de la llanura.',k:12},
         {t:'find',n:'Los espejos antiguos',d:'Localiza tres espejos antiguos en distintos sectores de las ruinas.',p:'b'}]},
    {n:'El ritual de los siete espejos',lv:70,d:'Ashar puede reparar la Cruz del Ritual Prohibido, pero necesita los restos de los guardianes.',
     st:[{t:'deliver',n:'Restos para Ashar',d:'Reúne 3 fragmentos de espejo, 4 polvos oscuros y 2 páginas del ritual de los guardianes.',m:{mm21:3,mm22:4,mm23:2}},
         {t:'talk',n:'La cruz del ritual',d:'Lleva todo a Ashar, el Herrero: reparará la Cruz del Ritual Prohibido y te abrirá el Castillo Maldito.',npc:1,end:1}]}]},
  rap:{r:[1190,745,190,130],door:[1340,849],
   /* v437 · Bosque de los Colmillos: mn = base del Portal del Bosque (fachada) · va = escena de la arena VIRTUAL (el Claro del Depredador, el sector más hondo y más ancho) · fo = parámetros del bosque vivo
      (r territorio · g portal · gw/gd huella sólida del portal · ge/gx explanada · s semilla · d densidad · fe borde que se aclara · tw medio ancho de senderos · x zonas sin árboles (la cueva) · c claros públicos · t senderos). NO incluye los puntos secretos. */
   mn:[1340,846],va:'rap.S',fo:{"r":[1190,745,190,130],"g":[1340,846],"gw":12,"gd":14,"ge":9,"gx":11,"s":9137,"d":0.3,"fe":7,"tw":2.1,"x":[[1196,820,42,38]],"c":[[1206,801,4.2],[1271,844,3.4],[1300,765,3.4],[1354,829,3.4],[1235,840,3.4],[1290,805,3.4],[1341,777,4.2],[1273,803,4.2]],"t":[[[1206,801],[1210,805],[1214,805],[1218,805],[1222,805],[1226,805],[1230,805],[1234,805],[1238,805],[1242,806],[1246,810],[1250,812],[1254,813],[1258,811],[1262,807],[1266,803],[1270,803],[1273,803]],[[1273,803],[1277,805],[1281,805],[1285,805],[1289,805],[1290,805]],[[1206,801],[1210,805],[1214,809],[1218,811],[1222,815],[1226,819],[1230,823],[1234,827],[1235,831],[1235,835],[1235,839],[1235,840]],[[1235,840],[1239,843],[1243,843],[1247,843],[1251,843],[1255,843],[1259,843],[1263,843],[1267,843],[1271,844]],[[1271,844],[1275,848],[1279,850],[1283,850],[1287,850],[1291,851],[1295,851],[1299,851],[1303,852],[1307,853],[1311,853],[1315,853],[1319,853],[1323,853],[1327,852],[1331,852],[1335,852],[1339,852],[1340,852]],[[1290,805],[1294,801],[1298,797],[1299,793],[1299,789],[1299,785],[1299,781],[1299,777],[1299,773],[1300,769],[1300,765]],[[1290,805],[1294,801],[1298,797],[1302,793],[1306,789],[1310,785],[1314,781],[1317,777],[1321,777],[1325,777],[1329,777],[1333,777],[1337,777],[1341,777]],[[1341,777],[1345,781],[1349,785],[1351,789],[1352,793],[1353,797],[1353,801],[1353,805],[1353,809],[1354,813],[1354,817],[1354,821],[1354,825],[1354,829]],[[1354,829],[1350,833],[1346,837],[1342,841],[1340,845],[1340,849],[1340,852]],[[1271,844],[1270,840],[1270,836],[1270,832],[1270,828],[1272,824],[1276,820],[1280,816],[1284,812],[1288,808],[1290,805]]]},
   npc:[{n:'Kael, el Cazador de la Frontera',x:1206,y:801,role:'Cazador de la frontera',c:3}],craft:0,
   mats:{mm31:'Huevo de señuelo',mm32:'Material natural',mm33:'Garra de raptor'},rec:{mm31:2,mm32:5,mm33:3},ec:'El ciclo de los depredadores',
   ecd:'Kael estudia el ciclo de los raptores. Tráele huevos de señuelo, material natural y garras y preparará un nuevo Huevo del Depredador Ancestral.',
   pt:{a:[[1249,785],[1290,773],[1330,795],[1317,805]],b:[[1285,839],[1320,845],[1360,805]]},
   gp:[{x:1271,y:844,m:'mm32'},{x:1300,y:765,m:'mm31'},{x:1354,y:829,m:'mm33'},{x:1235,y:840,m:'mm32'},{x:1290,y:805,m:'mm31'}],
   mob:{v:'mjRap',nm:'Raptor joven',lv:[95,110],cnt:22,hpk:1.1,dmk:1.15,rwk:1,spm:1.6,ag:420},
   ms:[{n:'Rastros en la maleza',lv:100,d:'Kael, el Cazador de la Frontera, perdió a su expedición en el Bosque de los Colmillos. Algo grande se mueve entre la maleza.',
     st:[{t:'talk',n:'Habla con Kael',d:'Habla con Kael, el Cazador de la Frontera, en el límite del bosque.',npc:0},
         {t:'find',n:'Zonas de huellas',d:'Investiga cuatro zonas de huellas y los restos de las expediciones. 🔥 caliente / ❄️ frío.',p:'a'}]},
    {n:'Depredadores menores',lv:105,d:'Los jóvenes raptores patrullan el bosque. Hay que reducirlos para llegar a los nidos.',
     st:[{t:'kill',n:'Raptores jóvenes',d:'Derrota 12 raptores jóvenes del bosque.',k:12},
         {t:'find',n:'Los nidos del alfa',d:'Sigue las huellas hasta los nidos y localiza el nido principal.',p:'b'}]},
    {n:'El nido del depredador',lv:110,d:'Kael necesita materiales del nido para preparar el huevo y atraer al alfa.',
     st:[{t:'deliver',n:'Materiales del nido',d:'Recupera 2 huevos de señuelo, 4 materiales naturales y 2 garras de raptor.',m:{mm31:2,mm32:4,mm33:2}},
         {t:'kill',n:'Defiende el nido',d:'Derrota 10 raptores jóvenes que acechan el nido.',k:10},
         {t:'talk',n:'El huevo ancestral',d:'Lleva el material a Kael: preparará el Huevo del Depredador Ancestral y te mostrará el Claro del Depredador.',npc:0,end:1}]}]}};
 /* pasos en lista plana con el número de misión (la historia es una sola cadena de pasos; el diario la ve en 3 misiones) */
 IDS.forEach(b=>{const T=TERR[b];T.st=[];T.ms.forEach((m,i)=>m.st.forEach(s=>{if(s.t==='find')s.pts=T.pt[s.p];T.st.push(Object.assign({},s,{mi:i}))}))});
 const MATN={};IDS.forEach(b=>Object.assign(MATN,TERR[b].mats));
 /* v435 · terreno del lago de la Mansión Embrujada (la MISMA geometría la usa el cliente al dibujar y estampar el mapa; el servidor la usa para que ningún monstruo camine por el agua) */
 /*GEO*/
 const lkWater=(L,x,y)=>{const cx=L[0]+L[2]/2,cy=L[1]+L[3]/2-.5,dx=(x+.5-cx)/(L[2]/2),dy=(y+.5-cy)/(L[3]/2-1),a=Math.atan2(dy,dx),n=1+.075*Math.sin(a*3+1.3)+.05*Math.sin(a*5+.4)+.035*Math.sin(a*9+2.2);return dx*dx+dy*dy<n*n};
 const lkCell=(L,m,p,x,y)=>{const cx=m[0]+.5;
  if(x>=p[0]&&x<p[0]+p[2]&&y>=p[1]&&y<p[1]+p[3]+3)return 2;
  if(x>=p[0]-1&&x<=p[0]+p[2]&&y>=p[1]+p[3]&&y<p[1]+p[3]+3)return 2;
  if(Math.abs(x+.5-cx)<=7.4&&y>=m[1]-4&&y<=m[1])return 3;
  const dx=(x+.5-cx)/14.5,dy=(y+.5-(m[1]+4.6))/5;if(dx*dx+dy*dy<1)return 2;
  return lkWater(L,x,y)?1:0};
 /*FINGEO*/
 /* v436 · huella del Castillo Maldito (la MISMA función la usa el cliente al dibujar y estampar el mapa): 3 = huella sólida (la tapa la fachada) · 2 = explanada y camino despejados (sin rocas ni árboles) */
 /*GEO2*/
 const csCell=(c,m,x,y)=>{const dx=Math.abs(x+.5-(m[0]+.5));
  if(dx<=c[0]&&y>m[1]-c[1]&&y<=m[1])return 3;
  if(dx<=c[2]&&y>m[1]&&y<=m[1]+c[3])return 2;
  return 0};
 /*FINGEO2*/
 /* v437 · bosque vivo del Velociraptor (la MISMA función la usa el cliente al dibujar y estampar el mapa): 4 = árbol (sólido) · 3 = huella sólida del Portal del Bosque (la tapa la fachada) · 2 = explanada despejada (sin rocas ni árboles) · 0 = sin árboles */
 /*GEO3*/
 const foH=(x,y,s)=>{let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1274126177))|0;h=Math.imul(h^(h>>>13),1103515245);h^=h>>>16;return(h>>>0)/4294967296};
 const foN=(x,y,s)=>{const k=7,gx=Math.floor(x/k),gy=Math.floor(y/k),fx=x/k-gx,fy=y/k-gy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=foH(gx,gy,s),b=foH(gx+1,gy,s),c=foH(gx,gy+1,s),e=foH(gx+1,gy+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+e)*u*v};
 const foSeg=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/l)):0;return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)};
 const foCell=(F,x,y)=>{const r=F.r;if(x<r[0]||y<r[1]||x>=r[0]+r[2]||y>=r[1]+r[3])return 0;const px=x+.5,py=y+.5,g=F.g;
  if(Math.abs(px-g[0]-.5)<=F.gw&&py>g[1]-F.gd&&py<=g[1]+1)return 3;
  if(Math.abs(px-g[0]-.5)<=F.ge&&py>g[1]+1&&py<=g[1]+1+F.gx)return 2;
  for(const q of F.x)if(px>=q[0]&&px<q[0]+q[2]&&py>=q[1]&&py<q[1]+q[3])return 0;
  for(const c of F.c)if((px-c[0])*(px-c[0])+(py-c[1])*(py-c[1])<c[2]*c[2])return 0;
  for(const t of F.t)for(let i=0;i<t.length-1;i++)if(foSeg(px,py,t[i],t[i+1])<=F.tw)return 0;
  const e=Math.min(px-r[0],py-r[1],r[0]+r[2]-px,r[1]+r[3]-py),n=foN(px,py,F.s);
  return foH(x,y,F.s+7)<F.d*(.35+1.3*n)*Math.min(1,e/F.fe)?4:0};
 /*FINGEO3*/
 function lakeSolid(){const o={solid:[],clear:[]};
  {const T=TERR.ban;if(T&&T.lk){const L=T.lk,m=T.mn,p=T.pi;
   for(let y=L[1];y<L[1]+L[3]+3;y++)for(let x=L[0]-1;x<L[0]+L[2]+1;x++){const c=lkCell(L,m,p,x,y);if(c===1||c===3)o.solid.push(x,y);else if(c===2)o.clear.push(x,y)}}}
  {const T=TERR.nec;if(T&&T.cs){const c=T.cs,m=T.mn;
   const hw=Math.max(c[0],c[2])+2;for(let y=m[1]-c[1]-1;y<=m[1]+c[3]+1;y++)for(let x=Math.floor(m[0]-hw);x<=Math.ceil(m[0]+hw);x++){const k=csCell(c,m,x,y);if(k===3)o.solid.push(x,y);else if(k===2)o.clear.push(x,y)}}}
  {const T=TERR.rap;if(T&&T.fo){const F=T.fo,r=F.r;                                       /* v437: árboles y huella del portal = sólidos · explanada del portal = despejada */
   for(let y=r[1];y<r[1]+r[3];y++)for(let x=r[0];x<r[0]+r[2];x++){const k=foCell(F,x,y);if(k===3||k===4)o.solid.push(x,y);else if(k===2)o.clear.push(x,y)}}}
  return o}
 /* ───────── estado ───────── */
 const AR={};IDS.forEach(b=>AR[b]={st:'AVAILABLE',q:[],cur:null,until:0,enc:null});   /* arenas (memoria) */
 const GR={},EN={},IN={},LAST={},GT={},EVAC={};   /* grupos en cola, encuentros, jugador → id (grupo o encuentro), última vez en línea, recolección por jugador, jugadores que salen de la arena (v434) */
 let SEQ=0;const nid=p=>p+(++SEQ).toString(36)+tokn().slice(0,6);
 const MB=a=>{a.mb=a.mb||{};a.mb.d=a.mb.d||{};a.mb.cd=a.mb.cd||{};a.mb.lk=a.mb.lk||{};a.mb.w=a.mb.w||{};a.mb.q=a.mb.q||{};return a.mb};
 const nmOf=u=>{const a=S.ECO.acc[u];return a&&a.nm?String(a.nm).slice(0,20):'Viajero'};
 const push=(u,m)=>{try{S.push&&S.push(u,m)}catch(e){}};
 const pushAll=(mem,m)=>mem.forEach(u=>push(u,m));
 const logS=t=>{try{S.log&&S.log('[minijefes] '+t)}catch(e){}};
 const dirty=()=>{try{S.dirty&&S.dirty()}catch(e){}};
 const online=u=>X.online?!!X.online(u):(S.online?!!S.online(u):true);
 /* ───────── posición y presencia (todo del servidor) ───────── */
 const TS=()=>{try{return S.world&&S.world.dim?S.world.dim().t:32}catch(e){return 32}};
 const wpos=u=>{if(X.pos)return X.pos(u);const w=S.world&&S.world.where&&S.world.where(u);if(!w||w.dg||w.city)return null;const T=TS();return{x:w.x/T,y:w.y/T}};
 const inRect=(p,b)=>{const r=TERR[b].r;return!!p&&p.x>=r[0]&&p.x<r[0]+r[2]&&p.y>=r[1]&&p.y<r[1]+r[3]};
 /* v435: escena del jugador (la manda el cliente en cada paso: 'ban.S' = sótano de la mansión) · arena virtual (va) o física (ar) */
 const sceneOf=(u,b)=>{try{if(X.scene)return String(X.scene(u,b)||'');const w=S.world&&S.world.where&&S.world.where(u);return w&&w.mj?String(w.mj):''}catch(e){return''}};
 const VA=b=>!!(TERR[b]&&TERR[b].va),ARN=b=>!!(TERR[b]&&(TERR[b].va||TERR[b].ar));
 const inHouse=(u,b)=>VA(b)&&sceneOf(u,b).indexOf(b+'.')===0;      /* dentro de la mansión (cualquier piso) */
 const present=(u,b)=>{if(X.present)return!!X.present(u,b);if(process.env.MJ_PRESENT==='0')return true;return inRect(wpos(u),b)||inHouse(u,b)};
 const dist=(p,x,y)=>Math.hypot(p.x-x,p.y-y);
/* ───────── v434 · arena: colocar y sacar jugadores (lo hace world.js), geometría y protección ───────── */
 const useWorld=()=>!!(X.place||(S.world&&S.world.place));
 const arenaChecks=()=>X.arenaChecks!=null?!!X.arenaChecks:useWorld();
 const wplace=(u,x,y)=>{try{if(X.place)return!!X.place(u,x,y);const w=S.world;return!!(w&&w.place&&w.place(u,x,y))}catch(e){logS('place '+e.message);return false}};
 const ctr=c=>c*TS()+TS()/2;
 /* arena VIRTUAL (v435): no se mueve a nadie por coordenadas; el cliente entra al sótano al recibir «start» y sale al recibir «exit». placeIn solo comprueba que el jugador siga conectado al mundo. */
 const placeIn=(u,b,i)=>{const a=TERR[b];if(a.va)return online(u)&&inWorld(u);if(!a.ar)return true;const p=a.sp[i%a.sp.length];return wplace(u,ctr(p[0]),ctr(p[1]))};
 const placeOut=(u,b,i)=>{const a=TERR[b];if(a.va){push(u,{t:'mbq',b,st:'exit'});return true}if(!a.ar)return true;const p=a.ex[i%a.ex.length];return wplace(u,ctr(p[0]),ctr(p[1]))};
 const inAr=(p,b)=>{const a=TERR[b].ar;return!!(a&&p&&p.x>=a[0]&&p.x<a[0]+a[2]&&p.y>=a[1]&&p.y<a[1]+a[3])};
 const inArenaU=(u,b)=>VA(b)?sceneOf(u,b)===TERR[b].va:inAr(wpos(u),b);
 /* ¿está jugando? = conectado Y con presencia en el mundo. Tras recargar la página el jugador está conectado pero SIN presencia hasta que toca «Jugar»: ese lapso cuenta como desconexión (manda el reloj de 90 s), no como «fuera de la arena». */
 const inWorld=u=>{if(X.pos)return!!X.pos(u);const w=S.world&&S.world.where;return w?!!S.world.where(u):true};
 const here=u=>online(u)&&(!arenaChecks()||inWorld(u));
 const inArenaPx=(x,y)=>{const t=TS();for(const b of IDS){const a=TERR[b].va?null:TERR[b].ar;if(a&&x>=a[0]*t&&x<(a[0]+a[2])*t&&y>=a[1]*t&&y<(a[1]+a[3])*t)return b}return null};
 /* ¿(x,y) [px] cae en una arena donde este jugador NO puede estar? Solo entra quien está en el encuentro (o está saliendo). world.js lo consulta en cada paso. */
 function blocked(x,y,u){const b=inArenaPx(x,y);if(!b)return false;const id=IN[u],en=id&&EN[id];return!((en&&en.b===b&&!en.done)||EVAC[u]===b)}
 /* si alguien aparece dentro de una arena sin tener derecho (reconexión tras un combate, truco…), se le saca por la puerta */
 function outOf(u,x,y){const b=inArenaPx(x,y);if(!b||!blocked(x,y,u))return null;const e=TERR[b].ex[0];return[ctr(e[0]),ctr(e[1])]}
 /* ───────── Party: sale de la presencia que el servidor ya guarda (pres/{uid}: p = id de Party, pl = líder, t = hora), no de lo que diga un cliente ───────── */
 const D=()=>S.DB||{};
 const presOf=u=>{const r=D().pres&&D().pres[u];return r&&now()-(+r.t||0)<30000?r:null};
 function partyOf(u){
  if(X.party)return X.party(u);
  const r=presOf(u);if(!r||!r.p)return{pid:'',leader:u,mem:[u]};
  const pid=String(r.p),mem=[],pl=[];
  for(const x in (D().pres||{})){const q=presOf(x);if(!q||String(q.p||'')!==pid||!online(x))continue;mem.push(x);if(q.pl)pl.push(x)}
  if(!mem.includes(u))mem.push(u);
  mem.sort();const leader=pl.length?pl.sort()[0]:mem[0];
  return{pid,leader,mem:mem.slice(0,MAXP)}}
 /* ───────── requisitos de un jugador ───────── */
 function elig(u,b,needOf){
  const a=S.ECO.acc[u],c=B[b];if(!a||!a.nm)return'Elige primero el nombre de tu personaje';
  if((a.lv|0)<c.min)return'Necesitas nivel '+c.min+' para '+c.n;
  const m=MB(a);if(!m.d[b])return'Aún no has descubierto el santuario de '+c.n;
  if((m.cd[b]||0)>now())return'Tu cooldown de '+c.n+' sigue activo';
  if(needOf&&E.avail(a,'prov',c.of)<1)return'Te falta la ofrenda: '+c.ofn;
  if(!present(u,b))return'Debes estar en el territorio de '+c.n;
  return null}
 /* ───────── arena y cola ───────── */
 const posOf=(b,g)=>{const A=AR[b],i=A.q.indexOf(g);return i<0?0:i+1+(A.st==='AVAILABLE'?0:1)};
 function setIn(g,v){g.mem.forEach(u=>{if(v)IN[u]=g.id;else if(IN[u]===g.id)delete IN[u]})}
 function promote(b){
  const A=AR[b];if(A.st!=='AVAILABLE'||!A.q.length)return;
  const g=A.q.shift();A.st='RESERVED';A.cur=g;g.dl=now()+CONF;g.ready={};
  pushAll(g.mem,{t:'mbq',b,st:'turn',id:g.id,dl:g.dl,lead:nmOf(g.lead)});
  A.q.forEach(x=>pushAll(x.mem,{t:'mbq',b,st:'pos',id:x.id,pos:posOf(b,x)}))}
 function release(b,wait){const A=AR[b];A.cur=null;if(wait){A.st='CLEANUP';A.until=now()+CLEAN}else{A.st='AVAILABLE';promote(b)}}
 function dropGroup(g,why){
  const A=AR[g.b],i=A.q.indexOf(g);if(i>=0)A.q.splice(i,1);
  const was=A.cur===g;delete GR[g.id];setIn(g,0);
  pushAll(g.mem,{t:'mbq',b:g.b,st:'out',id:g.id,why:why||''});
  if(was)release(g.b,0)}
 /* ───────── encuentros guardados (para no perder ni duplicar nada si el servidor se reinicia) ───────── */
 const EL=()=>{const R=S.ECO;R.mbe=R.mbe&&typeof R.mbe==='object'?R.mbe:{};return R.mbe};
 function saveEnc(en){const L=EL();L[en.id]={b:en.b,lead:en.lead,mem:en.mem,t0:en.t0,done:en.done?1:0,res:en.res||null};const k=Object.keys(L);if(k.length>150){k.sort((x,y)=>(L[x].t0||0)-(L[y].t0||0));for(const x of k.slice(0,k.length-150))delete L[x]}dirty()}
 /* ───────── comienzo del combate ───────── */
 /* vida del jefe = k × la vida del monstruo más duro del juego (tipo 8, 7500 PV a nivel 29) escalada al nivel del jefe con el mismo crecimiento de daño del héroe que usa stat();
    así se necesitan «k veces» los golpes del monstruo más duro actual. Cada integrante extra suma +75 % (su daño también suma). */
 const bossHp=(b,n)=>{const c=B[b];return Math.max(500,Math.round(7500*(1+.12*(c.lv-1))/(1+.12*28)*(c.hpk||3)*BHPK*(1+.75*Math.max(0,(n||1)-1))))};
 function start(g){
  const b=g.b,c=B[b],A=AR[b];if(g.started)return null;
  if(!g.ready[g.lead]){dropGroup(g,'El líder no confirmó a tiempo: la Party pierde el turno y no se gastó ninguna ofrenda.');return null}
  let ok=[];
  for(const u of g.mem){if(!g.ready[u])continue;const e=elig(u,b,u===g.lead);if(!e)ok.push(u);else push(u,{t:'mbq',b,st:'denied',id:g.id,why:e})}
  if(!ok.includes(g.lead)){dropGroup(g,'El líder ya no cumple los requisitos: no se gastó la ofrenda.');return null}
  /* v434: el SERVIDOR mete a los peleadores en el salón. Quien no se pueda colocar no participa; si no se puede colocar al líder no empieza nada y no se gasta la ofrenda. */
  if(ARN(b)&&useWorld()){
   const put=[];ok.forEach((u,i)=>{if(placeIn(u,b,i))put.push(u);else push(u,{t:'mbq',b,st:'denied',id:g.id,why:'No se pudo llevarte a la arena (¿sigues conectado al mundo?).'})});
   if(!put.includes(g.lead)){put.forEach((u,i)=>placeOut(u,b,i));dropGroup(g,'No se pudo preparar la arena: no se gastó la ofrenda.');return null}
   ok=put}
  g.started=1;
  const t0=now(),n=ok.length,mhp=bossHp(b,n);
  const en={id:nid('e'),b,gid:g.id,lead:g.lead,mem:ok.slice(),tok:{},t0,done:0,res:null,seed:crypto.randomBytes(4).readUInt32BE(0),n,mhp,hp:mhp,p2:0,fell:{},dmg:{},rt:{},out:{},bt:0,dh:0,mir:[],mr:{},burn:[],br:{}};
  /* UNA sola ofrenda por encuentro: la del líder, y se consume justo ahora que el servidor confirma el combate */
  E.deliver(g.lead,{prov:{pk:c.of,q:-1},note:'🗝️ '+c.ofn+' entregada: combate contra '+c.n});
  ok.forEach(u=>{en.tok[u]=tokn();IN[u]=en.id});
  g.mem.forEach(u=>{if(!ok.includes(u)&&IN[u]===g.id)delete IN[u]});
  delete GR[g.id];A.cur=null;A.st='ACTIVE';A.enc=en;EN[en.id]=en;saveEnc(en);
  ok.forEach((u,i)=>push(u,{t:'mbq',b,st:'start',id:en.id,tok:en.tok[u],lv:c.lv,mem:ok.map(nmOf),seed:en.seed,t0,ts:now(),hp:en.hp,mhp,sp:i}));
  g.mem.filter(u=>!ok.includes(u)).forEach(u=>push(u,{t:'mbq',b,st:'out',id:g.id,why:'No cumples los requisitos de este combate (nivel, santuario, cooldown o Party).'}));
  return en}
 /* cierra el encuentro. Con arena construida los peleadores siguen dentro unos segundos (ver el resultado) y luego el servidor los saca; la arena no se libera hasta entonces. */
 function endEnc(en,exitMs){
  const A=AR[en.b];en.done=1;en.mem.forEach(u=>{if(IN[u]===en.id)delete IN[u]});saveEnc(en);
  if(A.enc===en){A.enc=null;
   if(ARN(en.b)&&useWorld()){const at=now()+(exitMs!=null?exitMs:EXIT_W),ev=en.mem.filter(u=>!(en.qt&&en.qt[u]));A.ev={mem:ev,at};ev.forEach(u=>{EVAC[u]=en.b});A.st='CLEANUP';A.cur=null;A.until=at+CLEAN}
   else release(en.b,1)}}
 function evac(b){const A=AR[b];if(!A.ev)return;const L=A.ev.mem;A.ev=null;L.forEach((u,i)=>{if(EVAC[u]===b){placeOut(u,b,i);delete EVAC[u]}})}
 /* ───────── v434 · la pelea: vida compartida, caídos, fase 2 ───────── */
 /* próximo límite de turno de ataque (todos los clientes cuentan los turnos desde t0 con la misma duración st1): la fase 2 empieza ahí, con margen para que a nadie le llegue tarde el aviso */
 const nextBoundary=(en,t)=>{const s=B[en.b].st1,k=Math.ceil((t+600-en.t0)/s);return en.t0+k*s};
 /* v436: igual, pero ya en fase 2 los turnos son más cortos (st2) y se cuentan desde el inicio de la fase */
 const nextBound2=(en,t)=>{const s2=B[en.b].st2||3600;if(en.p2&&t+600>=en.p2)return en.p2+Math.ceil((t+600-en.p2)/s2)*s2;return nextBoundary(en,t)};
 function bcast(en,force){
  const t=now();if(!force&&t-en.bt<250)return;en.bt=t;en.dh=0;
  const fl=en.mem.filter(u=>en.fell[u]).map(nmOf);
  pushAll(en.mem,{t:'mbh',b:en.b,id:en.id,hp:Math.max(0,Math.round(en.hp)),mhp:en.mhp,p2:en.p2||0,ts:t,fl,al:en.mem.length-fl.length})}
 function hit(u,m){
  try{
   const id=IN[u],en=id&&EN[id];if(!en||en.done||String(m&&m.id||'')!==en.id||String(m&&m.tok||'')!==en.tok[u]||en.fell[u])return 0;
   const t=now();let d=Math.floor(+(m&&m.d));if(!(d>0))return 0;
   if(t-en.t0<400)return 0;
   const c=B[en.b],base=bossHp(en.b,1),r=en.rt[u]||(en.rt[u]={t:0,w:t,s:0});
   if(t-r.t<50)return 0;r.t=t;                                          /* como mucho ~20 mensajes por segundo */
   if(t-r.w>=1000){r.w=t;r.s=0}
   d=Math.min(d,Math.round(base*HITPM));if(r.s+d>base*HITPS)d=Math.max(0,Math.round(base*HITPS-r.s));
   if(d<=0)return 0;
   if(arenaChecks()&&!inArenaU(u,en.b))return 0;                        /* atacar desde fuera de la arena no cuenta */
   r.s+=d;
   const floor=(t-en.t0<c.fight*1000)?1:0,before=en.hp;                 /* el jefe no cae antes del tiempo mínimo de pelea */
   en.hp=Math.max(floor,en.hp-d);if(en.hp<before){en.dmg[u]=(en.dmg[u]||0)+(before-en.hp);en.dh=1}
   if(!en.p2&&en.hp<=en.mhp*P2){en.p2=nextBoundary(en,t);bcast(en,1)}else bcast(en,0);
   if(en.hp<=0&&t-en.t0>=c.fight*1000)resolve(en);
   return 1}catch(e){logS('hit '+e.message);return 0}}
 /* un integrante cae (sin vida, abandona, se desconecta o sale de la arena). Si ya no queda nadie en pie, derrota. */
 function fallOf(en,u,why){
  if(en.done||!en.mem.includes(u))return;
  /* abandonar («Salir»): se le saca al instante y deja de contar para el botín y la recarga (quien cae peleando sí cuenta); vale también si ya había caído */
  if(why==='quit'&&!(en.qt&&en.qt[u])){(en.qt=en.qt||{})[u]=now();delete IN[u];if(ARN(en.b)&&useWorld()){EVAC[u]=en.b;placeOut(u,en.b,en.mem.indexOf(u));delete EVAC[u]}}
  if(en.fell[u])return;en.fell[u]=now();
  push(u,{t:'mbq',b:en.b,st:'fell',id:en.id,why:why||''});
  if(en.mem.every(x=>en.fell[x]))loseEnc(en,'Todos cayeron');else bcast(en,1)}
 function loseEnc(en,why){
  if(en.done)return;en.res={ok:1,lost:1,id:en.id};
  pushAll(en.mem,{t:'mbr',b:en.b,id:en.id,lost:1,why:why||'',ex:EXIT_L});endEnc(en,EXIT_L)}
 /* ───────── premio: UNA tirada por encuentro ─────────
    El equipo se crea igual que los objetos de jefe del juego (genBossItem): tier t, rareza r, estadísticas = setSt(RM[r]·(1+0,6·t)·mul).
    Está dentro del tope que el servidor acepta para cualquier objeto (itemMax = ×2,6) y queda registrado a nombre del ganador. */
 function setSt(it,m){const sl=it.sl,K=it.k;if(sl==0)it.dm=Math.round(5*m);else if(sl==1)it.hp=Math.round(8*m);else if(sl==2){it.hp=Math.round(4*m);it.dm=Math.round(1*m)}else if(sl==3){it.dm=Math.round(2*m);it.hp=Math.round(2*m)}else if(sl==4)it.hp=Math.round(5*m);else if(sl==5)it.sp=Math.round(2*m);else{if(K==2||K==4||K==6)it.mp=Math.round(8*m);else{it.hp=Math.round(3*m);if(K==0)it.gd=Math.round(4*m)}}}
 function mkEq(u,a,b){
  const q=B[b].eq,cls=a.cls>=0&&a.cls<=7?a.cls|0:0,k=q.k>=0?q.k:cls,RM=E.RM||[1,1.6,2.4,3.5];
  const it={sl:q.sl,t:q.t,li:Math.min(9,q.t*2+1),r:q.r,k,n:q.n,du:100,u:1,id:E.rid(6)};
  setSt(it,RM[q.r]*(1+q.t*.6)*q.mul);
  const c=E.cleanItem?E.cleanItem(it):it;if(!c)return null;   /* si el validador del juego no lo aceptara, no se entrega algo que luego se borraría */
  S.ECO.reg[c.id]={o:u,k:'i',t:now()};return c}
 function grant(u,b,cat){
  const a=S.ECO.acc[u],c=B[b];if(!a)return null;
  if(cat==='cons'){
   const h=ri(c.pot[0],c.pot[1]),m=ri(c.mpot[0],c.mpot[1]),w=Math.random();
   const d={note:'🧪 Botín de '+c.n};let t;
   if(w<.4){d.pot=h;t='🧪 '+h+' pociones de vida'}else if(w<.7){d.mpot=m;t='🔷 '+m+' pociones de maná'}else{d.pot=h;d.mpot=m;t='🧪 '+h+' de vida y 🔷 '+m+' de maná'}
   E.deliver(u,d);return{t}}
  if(cat==='tok'){E.deliver(u,{prov:{pk:c.tk,q:1},note:'✨ '+c.tkn});return{t:'✨ '+c.tkn,id:c.tk}}
  if(cat==='eq'){const it=mkEq(u,a,b);if(!it)return null;E.deliver(u,{item:it,note:'🎁 '+c.eq.n});return{t:'🎁 '+c.eq.n,id:it.id}}
  return null}
 function logRes(en,res){
  const L=S.ECO.mbl=S.ECO.mbl||[];
  L.push({encounterId:en.id,bossId:en.b,partyId:en.gid,rewardCategory:res.cat,selectedPlayerId:res.sel||null,rewardItemId:res.rid||null,timestamp:now()});
  if(L.length>1000)L.splice(0,L.length-1000)}
 function resolve(en){
  if(en.done)return en.res;                                  /* idempotente: un encuentro se resuelve UNA vez */
  const c=B[en.b],t=now();en.done=1;
  const part=en.mem.filter(u=>!(en.qt&&en.qt[u])),mem=part.length?part:en.mem;          /* quien abandonó no cuenta: ni botín ni recarga */
  /* cooldown individual de 12 h para cada participante que ganó (reloj del servidor) */
  mem.forEach(u=>{const a=S.ECO.acc[u];if(!a)return;const m=MB(a);m.lk[en.b]=t;m.cd[en.b]=t+CD;m.w[en.b]=(m.w[en.b]||0)+1});
  /* quién puede recibir el premio: los que siguen conectados (si nadie, todos); sin pesos de ningún tipo */
  const live=mem.filter(u=>online(u)||t-(LAST[u]||0)<OFFLINE),pool=live.length?live:mem;
  const cat=roll();let sel=null,g=null;
  if(cat!=='none'){sel=pool[Math.floor(Math.random()*pool.length)];g=grant(sel,en.b,cat)}
  const res={ok:1,id:en.id,b:en.b,cat:g||cat==='none'?cat:'none',sel:g?sel:null,selNm:g?nmOf(sel):null,txt:g?g.t:null,rid:g&&g.id||null,mem:mem.map(nmOf)};
  en.res=res;logRes(en,res);dirty();
  mem.forEach(u=>push(u,{t:'mbr',b:en.b,id:en.id,cat:res.cat,selNm:res.selNm,txt:res.txt,mine:u===res.sel?1:0,cd:t+CD,ex:EXIT_W,dmg:Math.round(en.dmg&&en.dmg[u]||0)}));
  endEnc(en,EXIT_W);return res}
 /* ───────── reloj del servidor ───────── */
 function tick(){
  try{
   const t=now();
   for(const u in IN)if(here(u))LAST[u]=t;
   for(const b of IDS){
    const A=AR[b];
    if(A.st==='RESERVED'&&A.cur&&t>A.cur.dl)start(A.cur);
    else if(A.st==='ACTIVE'&&A.enc){
     const en=A.enc,c=B[b];
     for(const u of en.mem){if(en.done)break;if(en.fell[u])continue;
      if(t-(LAST[u]||en.t0)>OFFLINE){fallOf(en,u,'off');continue}                       /* desconectado más de 90 s: cae */
      if(arenaChecks()&&t-en.t0>(VA(b)?12000:2500)){
       /* sin conexión o sin entrar aún al mundo (recargó la página, se cortó el internet): NO cuenta como «fuera de la arena»; manda el reloj de 90 s de arriba. Al volver a jugar tiene RECON ms para que el servidor lo coloque otra vez (mb.back). */
       if(!here(u)){(en.rc=en.rc||{})[u]=t;delete en.out[u]}
       else if(!inArenaU(u,b)){
        if(en.rc&&en.rc[u]&&t-en.rc[u]<RECON)delete en.out[u];
        else{const s0=en.out[u]||(en.out[u]=t);if(t-s0>3000)fallOf(en,u,'out')}}      /* fuera de la arena: cae (no puede seguir atacando) */
       else delete en.out[u]}}
     if(en.done)continue;
     if(t-en.t0>MAXFIGHT){loseEnc(en,'Se acabó el tiempo');continue}
     if(en.hp<=0&&t-en.t0>=c.fight*1000){resolve(en);continue}
     if(en.dh)bcast(en,0)}
    else if(A.st==='CLEANUP'){if(A.ev&&t>=A.ev.at)evac(b);if(!A.ev&&t>=A.until){A.st='AVAILABLE';promote(b)}}}
  }catch(e){logS('tick '+e.message)}}
 /* si el servidor se reinició con un combate a medias: la ofrenda del líder vuelve a su cuenta UNA vez y el encuentro queda cerrado sin premio */
 function recover(){
  try{const L=EL();let n=0;
   for(const id in L){const e=L[id];if(!e||e.done||e.rf)continue;e.rf=1;e.done=1;e.res={ok:1,lost:1,id,aborted:1};
    if(e.lead&&B[e.b]&&S.ECO.acc[e.lead]){E.deliver(e.lead,{prov:{pk:B[e.b].of,q:1},note:'🗝️ El servidor se reinició en pleno combate: tu ofrenda vuelve a tu cuenta'});n++}}
   if(n){dirty();logS('recuperados '+n+' encuentros a medias (ofrendas devueltas)')}}catch(e){logS('recover '+e.message)}}
 /* ───────── vistas ───────── */
 const bits=n=>{let c=0;n=n|0;while(n){c+=n&1;n>>=1}return c};
 const QS=(a,b)=>{const m=MB(a);return m.q[b]=m.q[b]||{s:0,p:0,f:0}};
 const isDone=(a,b)=>QS(a,b).s>=TERR[b].st.length;
 const stepOf=(a,b)=>{const q=QS(a,b);return q.s<TERR[b].st.length?TERR[b].st[q.s]:null};
 /* vista de misiones para el Diario (sin puntos secretos) */
 function qView(u,b){
  const a=S.ECO.acc[u];if(!a)return null;const q=QS(a,b),T=TERR[b],st=stepOf(a,b),have={};
  for(const k in T.rec)have[k]=E.avail(a,'prov',k);
  const cur=st?st.mi:T.ms.length,ms=T.ms.map((m,i)=>{
   let first=0;for(let j=0;j<i;j++)first+=T.ms[j].st.length;
   return{n:m.n,lv:m.lv,d:m.d,state:i<cur?'done':i===cur?'cur':'lock',
    st:m.st.map((s,j)=>{const gi=first+j,dn=q.s>gi,cu=q.s===gi;
     const o={t:s.t,n:s.n,d:s.d,done:dn?1:0,cur:cu?1:0};
     if(s.t==='kill'){o.k=s.k;o.p=dn?s.k:cu?q.p:0}
     else if(s.t==='find'){o.k=s.pts.length;o.p=dn?s.pts.length:cu?bits(q.f):0}
     else if(s.t==='deliver'){o.m=Object.keys(s.m).map(k=>({k,n:MATN[k],q:s.m[k],h:Math.min(s.m[k],have[k]!=null?have[k]:E.avail(a,'prov',k))}))}
     else if(s.t==='talk'){o.npc=T.npc[s.npc].n}
     return o})}});
  return{s:q.s,n:T.st.length,done:st?0:1,cur,ms,rec:T.rec,have,ec:T.ec,ecd:T.ecd,
   mats:Object.keys(T.mats).map(k=>({k,n:T.mats[k],ic:MAT[k][0]})),craftNpc:T.npc[T.craft].n}}
 /* geografía pública del territorio (NO incluye los puntos secretos; la puerta solo se revela cuando el santuario ya está descubierto) */
 function geo(a,b){const T=TERR[b],m=MB(a);
  return{r:T.r.slice(),ar:T.ar&&!T.va?T.ar.slice():null,bp:T.bp?T.bp.slice():null,ex:T.ex?T.ex[0].slice():null,lk:T.lk?T.lk.slice():null,mn:T.mn?T.mn.slice():null,pi:T.pi?T.pi.slice():null,cs:T.cs?T.cs.slice():null,fo:T.fo?JSON.parse(JSON.stringify(T.fo)):null,va:T.va||null,npc:T.npc.map(n=>({n:n.n,x:n.x,y:n.y,role:n.role,c:n.c})),door:m.d[b]?T.door.slice():null,gp:T.gp.map((g,i)=>({i,x:g.x,y:g.y,m:g.m})),
   mob:{v:T.mob.v,nm:T.mob.nm,lv:T.mob.lv.slice()}}}
 const myState=(u,b)=>{
  const a=S.ECO.acc[u],c=B[b],A=AR[b],m=a?MB(a):{d:{},cd:{}},id=IN[u],g=id&&GR[id],en=id&&EN[id];
  return{id:b,n:c.n,min:c.min,lv:c.lv,ofn:c.ofn,tkn:c.tkn,terr:c.terr,arena:c.arena,ic:c.ic,desc:c.desc,eq:c.eq.n,
   disc:m.d[b]?1:0,cd:Math.max(0,(m.cd[b]||0)-now()),lk:m.lk&&m.lk[b]||0,of:a?E.avail(a,'prov',c.of):0,tk:a?E.avail(a,'prov',c.tk):0,
   st:A.st,qn:A.q.length,pos:g&&g.b===b?(A.cur===g?0:posOf(b,g)):0,turn:g&&A.cur===g?1:0,dl:g&&A.cur===g?g.dl:0,
   party:g&&g.b===b?g.mem.map(nmOf):[],lead:g&&g.b===b?nmOf(g.lead):'',
   open:isOpen(b)?1:0,
   fight:en&&en.b===b&&!en.done?en.id:null,tok:en&&en.b===b&&!en.done?en.tok[u]:null,
   fx:en&&en.b===b&&!en.done?{seed:en.seed,t0:en.t0,ts:now(),hp:Math.round(en.hp),mhp:en.mhp,p2:en.p2||0,fell:en.fell[u]?1:0,mem:en.mem.map(nmOf),lv:B[b].lv,mir:(en.mir||[]).map(x=>[x.k,x.at]),burn:(en.burn||[]).map(x=>[x.k,x.at])}:null,
   err:a?elig(u,b,true):'Sin cuenta',q:qView(u,b),geo:a?geo(a,b):null}};
 ops['mb.me']=(u,m)=>({ok:1,fights:IDS.some(isOpen)?1:0,now:now(),bosses:IDS.map(b=>myState(u,b))});
 /* ───────── cola, turnos y combate ───────── */
 ops['mb.join']=(u,m)=>{
  const b=String(m.b||'');if(!B[b])return err('Jefe no válido');
  if(!isOpen(b))return err('El combate contra '+B[b].n+' se abre en una próxima actualización.');
  if(IN[u]){const g=GR[IN[u]];if(g&&g.b===b)return{ok:1,id:g.id,pos:posOf(b,g),again:1};return err('Ya estás en una cola o en un combate: termina o sal primero.')}
  const e=elig(u,b,true);if(e)return err(e);
  if(VA(b)&&process.env.MJ_ALTAR!=='0'&&sceneOf(u,b)!==TERR[b].va)return err('La ofrenda se hace en '+(B[b].alt||'el altar')+'.');   /* v435 · v436: el texto sale de la tabla de jefes */
  /* la Party la dice el servidor; solo su líder pide el turno */
  const py=partyOf(u);if(py.pid&&py.leader!==u)return err('Solo el líder de la Party puede pedir turno y poner la ofrenda.');
  const mem=[u],skip=[];
  for(const x of py.mem){if(x===u)continue;
   if(IN[x]){skip.push({n:nmOf(x),why:'ya está en otra cola o combate'});continue}
   const w=elig(x,b,false);if(w){skip.push({n:nmOf(x),why:w});continue}
   mem.push(x)}
  if(AR[b].q.length>=QMAX)return err('La cola está llena. Inténtalo más tarde.');
  const g={id:nid('g'),b,lead:u,pid:py.pid,mem:mem.slice(0,MAXP),t:now(),ready:{},dl:0};GR[g.id]=g;setIn(g,1);AR[b].q.push(g);
  g.mem.forEach(x=>{if(x!==u)push(x,{t:'mbq',b,st:'inv',id:g.id,lead:nmOf(u)})});
  promote(b);return{ok:1,id:g.id,pos:posOf(b,g),mem:g.mem.map(nmOf),skip}};
 ops['mb.leave']=(u,m)=>{
  const id=IN[u];if(!id)return{ok:1,none:1};
  if(EN[id])return err('Estás en pleno combate.');
  const g=GR[id];if(!g)return{ok:1,none:1};
  if(g.lead===u){dropGroup(g,'El líder salió de la cola.');return{ok:1}}
  g.mem=g.mem.filter(x=>x!==u);delete IN[u];delete g.ready[u];push(u,{t:'mbq',b:g.b,st:'out',id:g.id});
  if(AR[g.b].cur===g&&g.mem.every(x=>g.ready[x]))start(g);
  return{ok:1}};
 ops['mb.ok']=(u,m)=>{
  const g=GR[IN[u]];if(!g)return err('No tienes un turno pendiente.');
  const A=AR[g.b];if(A.cur!==g)return err('Todavía no es tu turno.');
  if(now()>g.dl)return err('Se acabó el tiempo para confirmar.');
  const e=elig(u,g.b,u===g.lead);if(e)return err(e);
  g.ready[u]=1;pushAll(g.mem,{t:'mbq',b:g.b,st:'rdy',id:g.id,n:g.mem.filter(x=>g.ready[x]).length,of:g.mem.length});
  if(g.mem.every(x=>g.ready[x]))start(g);
  return{ok:1}};
 const encOf=(u,m)=>{const en=EN[String(m.id||'')];if(!en||!en.mem.includes(u))return[null,'Encuentro no válido'];if(String(m.tok||'')!==en.tok[u])return[null,'Código de encuentro no válido'];return[en,null]};
 /* v434: con arena construida la victoria la decide el SERVIDOR (vida del jefe a 0 en tick/hit). Quien llama aquí solo consulta el resultado; no puede darse la victoria.
    (X.legacyWin=true conserva el comportamiento de la v433 para las pruebas de los demás jefes sin arena.) */
 const serverWin=b=>ARN(b)&&!X.legacyWin;
 ops['mb.win']=(u,m)=>{
  const[en,e]=encOf(u,m);if(e)return err(e);
  if(en.done)return en.res&&!en.res.lost?Object.assign({},en.res,{again:1,mine:en.res.sel===u?1:0}):err('Este encuentro ya terminó');
  if(serverWin(en.b))return err('La victoria la decide el servidor: derrota al jefe.');
  const c=B[en.b];if(now()-en.t0<c.fight*1000)return err('Victoria no válida: el combate no pudo terminar tan rápido.');
  const r=resolve(en);return Object.assign({},r,{mine:r.sel===u?1:0})};
 /* «me rindo»: con arena construida solo cae quien llama (la Party sigue); sin arena (v433) termina el encuentro como antes */
 ops['mb.lose']=(u,m)=>{
  const[en,e]=encOf(u,m);if(e)return err(e);
  if(en.done)return{ok:1,again:1};
  if(serverWin(en.b)){fallOf(en,u,'quit');return{ok:1}}
  loseEnc(en,'');return{ok:1}};
 /* v434: «he caído» (mis puntos de vida llegaron a 0 en la arena) o «salir» (quit:1). El cliente lo avisa; el servidor es quien da el encuentro por perdido cuando ya no queda nadie en pie. */
 ops['mb.fall']=(u,m)=>{
  const[en,e]=encOf(u,m);if(e)return err(e);
  if(en.done)return{ok:1,again:1};
  fallOf(en,u,m&&m.quit?'quit':'dead');return{ok:1}};
 /* v436: romper un espejo del Salón (solo el Necromancer; hasta DOS por combate). El servidor fija la hora en que surte efecto (siguiente límite de turno con margen) y avisa a la Party:
    todos los clientes quitan ese espejo de las opciones de teletransporte del jefe EN EL MISMO turno y la descarga de energía estalla a la vez. */
 ops['mb.mirror']=(u,m)=>{
  const[en,e]=encOf(u,m);if(e)return err(e);
  if(en.done)return{ok:1,again:1};
  if(en.b!=='nec')return err('Este jefe no tiene espejos.');
  if(en.fell[u])return err('Has caído: ya no puedes romper espejos.');
  if(arenaChecks()&&!inArenaU(u,en.b))return err('Debes estar dentro del salón.');
  const t=now(),k=Math.floor(+m.k);if(!(k>=0&&k<4))return err('Espejo no válido.');
  if(t-en.t0<3000)return err('Aún no: el Necromancer acaba de despertar.');
  const L=en.mir=en.mir||[];
  if(L.some(x=>x.k===k))return{ok:1,again:1,k,at:L.find(x=>x.k===k).at};
  if(L.length>=2)return err('Ya se rompieron los dos espejos que se pueden destruir.');
  const R=en.mr=en.mr||{};if(t-(R[u]||0)<1500)return err('Despacio.');R[u]=t;
  const at=nextBound2(en,t+1500);L.push({k,at,u});
  pushAll(en.mem,{t:'mbm',b:en.b,id:en.id,k,at,ts:t,by:nmOf(u),p2:en.p2||0});
  return{ok:1,k,at}};
 /* v437: quemar un manchón de HIERBA ALTA del Claro (solo el Mago, clase 2). El fuego es local (un manchón), temporal (BURN_MS) y limitado (BURN_MAX a la vez, enfriamiento por Mago).
    El servidor fija la hora en que surte efecto (siguiente límite de turno con margen) y avisa a la Party (mbf): todos los clientes, que calculan el guion con la misma semilla, ven arder el manchón en el mismo turno. */
 const BURN_MS=16000,BURN_CD=9000,BURN_MAX=2,PATCHES=6;
 ops['mb.burn']=(u,m)=>{
  const[en,e]=encOf(u,m);if(e)return err(e);
  if(en.done)return{ok:1,again:1};
  if(en.b!=='rap')return err('Aquí no hay hierba que quemar.');
  const a=S.ECO.acc[u];if(!a||(a.cls|0)!==2)return err('Solo el Mago puede quemar la hierba.');
  if(en.fell[u])return err('Has caído: ya no puedes quemar nada.');
  if(arenaChecks()&&!inArenaU(u,en.b))return err('Debes estar dentro del claro.');
  const t=now(),k=m.k;if(!(Number.isInteger(k)&&k>=0&&k<PATCHES))return err('Hierba no válida.');
  if(t-en.t0<3000)return err('Aún no: el Velociraptor acaba de despertar.');
  const L=en.burn=en.burn||[],live=L.filter(x=>t<x.at+BURN_MS);
  if(live.some(x=>x.k===k))return{ok:1,again:1,k,at:live.find(x=>x.k===k).at};
  if(live.length>=BURN_MAX)return err('Ya hay dos manchones ardiendo: espera a que el fuego se apague.');
  const R=en.br=en.br||{};if(t-(R[u]||0)<BURN_CD)return err('Despacio: el fuego del Mago necesita recuperarse.');R[u]=t;
  const at=nextBound2(en,t+1500);L.push({k,at,u});if(L.length>40)L.splice(0,L.length-40);
  pushAll(en.mem,{t:'mbf',b:en.b,id:en.id,k,at,ts:t,by:nmOf(u),p2:en.p2||0,ms:BURN_MS});
  return{ok:1,k,at,ms:BURN_MS}};
 /* v434: «volver a la arena» tras recargar la página o perder la conexión en pleno combate: el SERVIDOR te coloca de nuevo en el salón (solo si sigues en el encuentro y no has caído) */
 ops['mb.back']=(u,m)=>{
  const id=IN[u],en=id&&EN[id];
  if(!en||en.done||!en.mem.includes(u))return err('No tienes un combate activo.');
  if(en.fell[u])return err('Ya caíste en este combate.');
  if(!(ARN(en.b)&&useWorld()))return{ok:1,none:1};
  if(inArenaU(u,en.b))return{ok:1,already:1};
  if(VA(en.b))return{ok:1,virtual:1};                                      /* v435: el cliente vuelve solo al sótano (MJMAN.toHall); el servidor no puede mover a nadie */
  if(!placeIn(u,en.b,Math.max(0,en.mem.indexOf(u))))return err('No se pudo llevarte a la arena.');
  return{ok:1}};
 /* gancho para que otras partes del servidor marquen el santuario como descubierto (solo desde código del servidor) */
 const markDisc=(u,b)=>{const a=S.ECO.acc[u];if(!a||!B[b])return 0;MB(a).d[b]=1;dirty();return 1};
 /* ═════════ MISIONES DE DESCUBRIMIENTO, MATERIALES Y OFRENDAS (todo validado por el servidor) ═════════ */
 const RT=3.2,RN=7,DROP_Q=.35,DROP_E=.30,MATMAX=60,GCD=120000,
  TEMP=[[7,'🔥','¡Muy caliente! Está a pocos pasos.'],[16,'🌡️','Caliente: vas bien encaminado.'],[32,'☀️','Tibio: sigues en la zona, pero aún queda.'],[64,'🌥️','Frío: te alejas o estás lejos.'],[1e9,'❄️','Helado: aquí no hay nada.']];
 const adv=(u,b,a)=>{const q=QS(a,b);q.s++;q.p=0;q.f=0;dirty();push(u,{t:'mbq2',b,q:qView(u,b)})};
 const nearNpc=(u,b,i)=>{const p=wpos(u);if(!p)return false;const n=TERR[b].npc[i];return dist(p,n.x,n.y)<=RN};
 function qBase(u,b){
  const a=S.ECO.acc[u],c=B[b];if(!a||!a.nm)return[null,'Elige primero el nombre de tu personaje'];
  if((a.lv|0)<c.min)return[null,'Necesitas nivel '+c.min+' para esta aventura'];return[a,null]}
 ops['mb.talk']=(u,m)=>{
  const b=String(m.b||'');if(!B[b])return err('Jefe no válido');const[a,e]=qBase(u,b);if(e)return err(e);
  const st=stepOf(a,b);if(!st||st.t!=='talk')return err(st?'Ahora toca: '+st.n:'Ya completaste esta aventura. Usa el encargo repetible.');
  if(!nearNpc(u,b,st.npc))return err('Acércate a '+TERR[b].npc[st.npc].n+' para hablar con él o ella.');
  if(st.end){
   E.deliver(u,{prov:{pk:B[b].of,q:1},note:'🗝️ '+B[b].ofn+': tu primera ofrenda'});markDisc(u,b);
   adv(u,b,a);return{ok:1,end:1,disc:1,txt:'¡Has descubierto el santuario de '+B[b].n+'! Recibes tu primera ofrenda: '+B[b].ofn+'.',q:qView(u,b)}}
  adv(u,b,a);return{ok:1,q:qView(u,b)}};
 ops['mb.find']=(u,m)=>{
  const b=String(m.b||'');if(!B[b])return err('Jefe no válido');const[a,e]=qBase(u,b);if(e)return err(e);
  const st=stepOf(a,b);if(!st||st.t!=='find')return err(st?'Ahora toca: '+st.n:'Ya completaste esta aventura.');
  const q=QS(a,b),t=now();if(t-(q.ft||0)<2500)return{ok:1,wait:1,txt:'Despacio: el terreno no se revisa tan rápido.'};q.ft=t;
  const p=wpos(u);if(!p||!inRect(p,b))return err('Debes estar dentro del territorio, en campo abierto.');
  let best=1e9;
  for(let i=0;i<st.pts.length;i++){if(q.f>>i&1)continue;const d=dist(p,st.pts[i][0],st.pts[i][1]);
   if(d<=RT){q.f|=1<<i;dirty();const left=st.pts.length-bits(q.f);
    if(left<=0){adv(u,b,a);return{ok:1,found:1,done:1,q:qView(u,b)}}
    push(u,{t:'mbq2',b,q:qView(u,b)});return{ok:1,found:1,q:qView(u,b)}}
   best=Math.min(best,d)}
  const h=TEMP.findIndex(x=>best<=x[0]);return{ok:1,hot:h,ic:TEMP[h][1],txt:TEMP[h][2]}};
 ops['mb.deliver']=(u,m)=>{
  const b=String(m.b||'');if(!B[b])return err('Jefe no válido');const[a,e]=qBase(u,b);if(e)return err(e);
  const st=stepOf(a,b);if(!st||st.t!=='deliver')return err(st?'Ahora toca: '+st.n:'Ya completaste esta aventura.');
  if(!TERR[b].npc.some((n,i)=>nearNpc(u,b,i)))return err('Acércate a '+TERR[b].npc[0].n+' para entregar los materiales.');
  for(const k in st.m)if(E.avail(a,'prov',k)<st.m[k])return err('Te faltan '+(st.m[k]-E.avail(a,'prov',k))+' de «'+MATN[k]+'». Consíguelos derrotando criaturas del territorio.');
  for(const k in st.m)E.deliver(u,{prov:{pk:k,q:-st.m[k]},note:'📜 Entregaste '+st.m[k]+' · '+MATN[k]});
  adv(u,b,a);return{ok:1,q:qView(u,b)}};
 /* encargo repetible: nueva ofrenda a cambio de materiales (solo tras terminar la historia, junto al NPC que fabrica) */
 ops['mb.craft']=(u,m)=>{
  const b=String(m.b||'');if(!B[b])return err('Jefe no válido');const[a,e]=qBase(u,b);if(e)return err(e);
  if(!isDone(a,b))return err('Primero completa la aventura de '+B[b].n+'.');
  if(!nearNpc(u,b,TERR[b].craft))return err('Acércate a '+TERR[b].npc[TERR[b].craft].n+' para fabricar.');
  const rec=TERR[b].rec;for(const k in rec)if(E.avail(a,'prov',k)<rec[k])return err('Te faltan '+(rec[k]-E.avail(a,'prov',k))+' de «'+MATN[k]+'».');
  for(const k in rec)E.deliver(u,{prov:{pk:k,q:-rec[k]},note:'🔨 '+TERR[b].ec+': −'+rec[k]+' '+MATN[k]});
  E.deliver(u,{prov:{pk:B[b].of,q:1},note:'🗝️ Fabricaste: '+B[b].ofn});dirty();
  push(u,{t:'mbq2',b,q:qView(u,b)});return{ok:1,txt:'Fabricaste: '+B[b].ofn,q:qView(u,b)}};
 /* puntos de recolección del territorio (encargo repetible): 1-2 materiales cada 2 min por punto y por jugador, solo junto al punto */
 ops['mb.gather']=(u,m)=>{
  const b=String(m.b||'');if(!B[b])return err('Jefe no válido');const[a,e]=qBase(u,b);if(e)return err(e);
  if(!isDone(a,b))return err('Los puntos de recolección se abren al terminar la aventura de '+B[b].n+'.');
  const i=Math.floor(+m.i),g=TERR[b].gp[i];if(!g)return err('Punto no válido');
  const p=wpos(u);if(!p||dist(p,g.x,g.y)>4)return err('Acércate al punto de recolección.');
  const t=now(),k=u+'|'+b+i;if((GT[k]||0)>t)return{ok:1,wait:1,ms:GT[k]-t,txt:'Aquí ya no queda nada por ahora.'};
  if(E.avail(a,'prov',g.m)>=MATMAX)return err('Ya llevas muchos «'+MATN[g.m]+'».');
  GT[k]=t+GCD;const q=ri(1,2);E.deliver(u,{prov:{pk:g.m,q},note:'🎒 Recolectaste '+q+' · '+MATN[g.m]});
  return{ok:1,m:g.m,q,txt:'+'+q+' '+MATN[g.m]}};
 /* gancho del mundo: cada baja de un jugador (la avisa el mundo al servidor). Solo cuentan los monstruos DEL territorio. */
 const KL={};
 function onKill(u,ty,kind,dyn,mob){
  try{
   if(!mob||mob.k!=='mj'||!B[mob.mj])return;
   const b=mob.mj,a=S.ECO.acc[u];if(!a||!a.nm||(a.lv|0)<B[b].min)return;
   const k=KL[u]=KL[u]||{t:0,n:0},t=now();if(t-k.t>=6e4){k.t=t;k.n=0}if(++k.n>150)return;   /* tope por minuto contra golpes fantasma */
   const st=stepOf(a,b),q=QS(a,b);
   if(st&&st.t==='kill'){q.p++;if(q.p>=st.k)adv(u,b,a);else{dirty();if(q.p%3===0)push(u,{t:'mbq2',b,q:qView(u,b)})}}
   else if(st&&st.t==='deliver'){for(const mk in st.m)if(E.avail(a,'prov',mk)<st.m[mk]&&Math.random()<DROP_Q)E.deliver(u,{prov:{pk:mk,q:1},note:'🎒 '+MATN[mk]})}
   else if(!st){for(const mk in TERR[b].rec)if(E.avail(a,'prov',mk)<MATMAX&&Math.random()<DROP_E)E.deliver(u,{prov:{pk:mk,q:1},note:'🎒 '+MATN[mk]})}
   /* en los pasos de «derrota» los monstruos también sueltan material con menos frecuencia, para llegar con algo a la entrega */
   if(st&&st.t==='kill'){const mats=Object.keys(TERR[b].mats);if(Math.random()<.12){const mk=mats[Math.floor(Math.random()*mats.length)];if(E.avail(a,'prov',mk)<MATMAX)E.deliver(u,{prov:{pk:mk,q:1},note:'🎒 '+MATN[mk]})}}
  }catch(e){logS('onKill '+e.message)}}
 /* ───────── monstruos de territorio (los crea world.js con estas cifras) ─────────
    Calibrados con las fórmulas del propio juego, sin inventar escalas:
    · vida  = vida del monstruo más duro actual (tipo 8, 7500 PV, nivel 29) × (daño base del jugador de su nivel ÷ el de nivel 29) → los MISMOS golpes para matarlo.
    · daño  = 5 + 3·tier (la fórmula de daño de monstruos del juego) con tier = (nivel−1)/3,5 (REC) — pega ~10 % de la vida base del héroe de su nivel por golpe.
    · botín = (12 + 10·tier)/(12 + 10·8) × recompensa del tipo 8 (la fórmula de recompensa de dgScale). */
 function stat(b,L){
  const M=TERR[b].mob,st=(L-1)/3.5;
  return{hp:Math.max(1,Math.round(7500*(1+.12*(L-1))/(1+.12*28)*M.hpk*HPK)),dm:(5+3*st)*M.dmk*DMK,rw:(12+10*st)/92*M.rwk*XPK,nv:L}}
 function zones(){
  if(process.env.MJ_OFF==='1'||X.noMobs)return[];
  return IDS.map(b=>{const T=TERR[b],M=T.mob;
   const free=[];T.npc.forEach(n=>free.push([n.x,n.y]));free.push(T.door.slice());T.gp.forEach(g=>free.push([g.x,g.y]));['a','b'].forEach(k=>T.pt[k].forEach(p=>free.push(p.slice())));
   const av=T.lk?[[T.lk[0]-6,T.lk[1]-14,T.lk[2]+12,T.lk[3]+22]]:T.cs?[[Math.floor(T.mn[0]-T.cs[2]-5),T.mn[1]-T.cs[1]-6,Math.ceil(2*(T.cs[2]+5))+1,T.cs[1]+6+T.cs[3]+5]]:T.fo?[[T.fo.g[0]-T.fo.ge-4,T.fo.g[1]-T.fo.gd-3,2*T.fo.ge+9,T.fo.gd+T.fo.gx+8]]:T.ar?[[T.ar[0]-9,T.ar[1]-9,T.ar[2]+18,T.ar[3]+22]]:[];   /* v434/v435/v436: alrededor de la mansión (con su lago) y del castillo (con su explanada) no nacen monstruos */
   return{id:b,v:M.v,nm:M.nm,rect:T.r.slice(),cnt:Math.max(1,Math.round(M.cnt*CNTK)),lv:M.lv.slice(),free,av,rz:RZ,spm:M.spm,ag:M.ag}})}
 recover();
 let iv=null,iv2=null;try{if(!X.noTimer){iv=setInterval(tick,1500);if(iv.unref)iv.unref();
  iv2=setInterval(()=>{try{const t=now();for(const b of IDS){const en=AR[b].enc;if(en&&!en.done&&en.dh&&t-en.bt>=250)bcast(en,1)}}catch(e){}},300);if(iv2.unref)iv2.unref()}}catch(e){}
 /* rectángulos de arena en px para world.js: [x0,y0,x1,y1] */
 const arenas=t=>{t=t||TS();const o=[];for(const b of IDS){const a=TERR[b].va?null:TERR[b].ar;if(a)o.push([a[0]*t,a[1]*t,(a[0]+a[2])*t,(a[1]+a[3])*t])}return o};
 return{ops,markDisc,onKill,TERR,tick,B,AR,GR,EN,IN,EVAC,elig,roll,stat,zones,qView,MAT,partyOf,resolve,start,mkEq,IDS,CD,bossHp,hit,fallOf,bcast,blocked,outOf,inArenaPx,isOpen,arenas,VA,ARN,sceneOf,inArenaU,placeIn,placeOut,lakeSolid,lkCell,lkWater,csCell,foCell,nextBound2,
  _stop:()=>{if(iv)clearInterval(iv);if(iv2)clearInterval(iv2)}}};
