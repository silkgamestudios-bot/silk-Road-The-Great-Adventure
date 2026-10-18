/* Catálogo compartido (cliente + servidor). El SERVIDOR es quien manda en precios y efectos; el cliente solo lo muestra.
   Para cambiar un precio o un atributo edita este archivo (y vuelve a generar el juego con tools/build.js). */
(function(root,f){const r=f();if(typeof module!=='undefined'&&module.exports)module.exports=r;else root.SRCAT=r})(this,function(){
const CLASES=['Mercader','Caballero','Mago','Arquero','Sanador','Monje','Elfa Druida','Enana Guerrera'];
/* estilo de golpe por clase: melee = cuerpo a cuerpo, ranged = distancia, magic = mágico */
const ESTILO=['melee','melee','magic','ranged','magic','melee','magic','melee'];
const RAR=['Común','Rara','Épica','Legendaria'];
/* por rareza: precio en gemas, armadura (PV), defensa %, resistencia elemental %, protección % (bloqueo), golpe %, daño elemental %, crítico % */
const TIER=[{g:5,ar:25,df:2,er:0,pr:0,hit:2,el:0,cr:0},{g:9,ar:50,df:3,er:3,pr:0,hit:3,el:2,cr:0},{g:15,ar:85,df:5,er:5,pr:3,hit:5,el:4,cr:1},{g:25,ar:140,df:7,er:8,pr:5,hit:7,el:6,cr:3}];
const MUL={melee:{ar:1.25,df:1.25,pr:1.25,hit:1,el:.6,er:1,cr:1},ranged:{ar:.8,df:.9,pr:.8,hit:1.3,el:.8,er:.8,cr:1.4},magic:{ar:.75,df:.8,pr:.9,hit:.9,el:1.4,er:1.3,cr:1}};
/* [clase, tier, índice en Player0.png de DawnLike, nombre, elemento] */
const DEF=[
[0,0,12,'Aprendiz de la Seda','tierra'],[0,1,14,'Corsario de Samarcanda','agua'],[0,2,35,'Caravanero del Desierto','fuego'],[0,3,28,'Gran Visir Dorado','luz'],
[1,0,25,'Centinela de Hierro','tierra'],[1,1,27,'Berserker del Norte','hielo'],[1,2,60,'Paladín del Alba','luz'],[1,3,93,'Coloso de Acero','tierra'],
[2,0,29,'Mago de Brasas','fuego'],[2,1,30,'Hechicero Azul','hielo'],[2,2,31,'Eremita Ígneo','fuego'],[2,3,61,'Archimago Carmesí','sombra'],
[3,0,26,'Cazador del Bosque','naturaleza'],[3,1,58,'Centinela Élfico','naturaleza'],[3,2,65,'Sombra Encapuchada','sombra'],[3,3,38,'Francotirador de Jade','tierra'],
[4,0,32,'Clériga de la Cruz','luz'],[4,1,33,'Sacerdotisa de Nieve','hielo'],[4,2,41,'Hermana de la Aurora','luz'],[4,3,6,'Doncella del Agua','agua'],
[5,0,64,'Monje del Bastón','tierra'],[5,1,63,'Puño de Ámbar','fuego'],[5,2,10,'Discípulo de la Brisa','aire'],[5,3,15,'Maestro Vendado','sombra'],
[6,0,56,'Druida de Hojas','naturaleza'],[6,1,57,'Hoja Dorada','luz'],[6,2,62,'Chamana del Pantano','veneno'],[6,3,70,'Espíritu del Bosque','naturaleza'],
[7,0,89,'Escudera de Roca','tierra'],[7,1,90,'Forjadora de Oro','fuego'],[7,2,91,'Martillo Gris','hielo'],[7,3,88,'Barbirroja Ancestral','fuego']];
const SKINS={};
for(const [c,t,ix,n,el] of DEF){const st=ESTILO[c],b=TIER[t],m=MUL[st],id='b'+c+'_'+t,R=k=>Math.round(b[k]*m[k]);
 SKINS[id]={id,c,t,ix,n,el,st,g:b.g,ar:R('ar'),df:R('df'),er:R('er'),pr:R('pr'),hit:R('hit'),el_:R('el'),cr:R('cr')}}
/* servicios (buffs) que se pagan con gemas propias: ver precios en el juego */
const BUFFS={cmb:{n:'Combo Cazador',g:5,d:'Loot automático + poción automática'},es:{n:'Escolta de caravana',g:3,d:'Tus orcos defienden el carruaje'},lic:{n:'Licencia de Mercader',g:10,d:'Carruaje y tienda de jugadores'},vipm:{n:'VIP Mercader',g:15,d:'Todo incluido para Mercader'},vipj:{n:'VIP Jugador',g:6,d:'Combo + Bendición'}};
const GUILD={precio:10,max:500,tagMin:2,tagMax:4,nameMin:3,nameMax:20};
return{CLASES,ESTILO,RAR,TIER,SKINS,BUFFS,GUILD,DEF}});
