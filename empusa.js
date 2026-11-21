/* v475 · EMPUSA, la Señora del Espejismo — botín (servidor). Una tirada por participante cuando cae (la vida compartida vive en world.js).
   Probabilidades por participante (mismas «familias» que los mini-jefes: consumibles / equipo / token, más equipo común):
     5 %  → UNO de los 3 objetos exclusivos Nv 150 (1/3 cada uno): arma de tu clase · sombrero/casco de tu clase · Mochila de Escolta de 210 espacios (si ya la tienes, cae el arma)
     3 %  → ✨ Lágrima del Espejismo (token de Empusa, material mbt4)
    40 %  → equipo común Nv 110 de tu clase (rareza 70/22/7/1 % como los jefes)
    30 %  → pociones de vida y/o maná
    22 %  → nada
   El equipo se crea con el mismo formato que los objetos de jefe (tier t, rareza r, setSt) y queda registrado a nombre del ganador; tope del servidor ×2,6. */
module.exports=function(S,E){
 const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),RM=E.RM||[1,1.6,2.4,3.5];
 const P_EX=.05,P_TOK=.03,P_COM=.40,P_CONS=.30;
 const WN=['Daga del Espejismo','Espada de Empusa','Cetro de Empusa','Arco de Empusa','Báculo de Empusa','Garras de Empusa','Vara de Empusa','Hacha de Empusa'],
  HN=['Sombrero de Empusa','Yelmo de Empusa','Corona de Empusa','Capucha de Empusa','Tiara de Empusa','Cinta de Empusa','Guirnalda de Empusa','Casco de Empusa'],
  SL=['Arma del Jardín Ilusorio','Coraza del Jardín Ilusorio','Sombrero del Jardín Ilusorio','Guantes del Jardín Ilusorio','Pantalón del Jardín Ilusorio','Botas del Jardín Ilusorio','Escudo del Jardín Ilusorio'];
 function setSt(it,m){const sl=it.sl,K=it.k;if(sl==0)it.dm=Math.round(5*m);else if(sl==1)it.hp=Math.round(8*m);else if(sl==2){it.hp=Math.round(4*m);it.dm=Math.round(1*m)}else if(sl==3){it.dm=Math.round(2*m);it.hp=Math.round(2*m)}else if(sl==4)it.hp=Math.round(5*m);else if(sl==5)it.sp=Math.round(2*m);else{if(K==2||K==4||K==6)it.mp=Math.round(8*m);else{it.hp=Math.round(3*m);if(K==0)it.gd=Math.round(4*m)}}}
 function mk(u,o){const it={sl:o.sl,t:4,li:9,r:o.r,k:o.k,n:o.n,du:100,rl:o.rl,id:E.rid(6)};if(o.u)it.u=1;setSt(it,RM[o.r]*(1+4*.6)*o.mul);const c=E.cleanItem?E.cleanItem(it):it;if(!c)return null;S.ECO.reg[c.id]={o:u,k:'i',t:Date.now()};return c}
 function reward(u){
  const a=S.ECO.acc[u];if(!a)return null;const cls=a.cls>=0&&a.cls<=7?a.cls|0:0,r=Math.random();
  if(r<P_EX){
   let w=Math.floor(Math.random()*3);if(w==2&&(a.bgr|0)>=210)w=0;
   if(w==2){if(E.grantBag(u,210,'Botín de Empusa'))return{t:'🎒 Mochila de Escolta · 210 espacios',x:1};w=0}
   const it=w==0?mk(u,{sl:0,k:cls,r:3,rl:150,u:1,mul:2.3,n:WN[cls]}):mk(u,{sl:2,k:cls,r:3,rl:150,u:1,mul:2.3,n:HN[cls]});
   if(it){E.deliver(u,{item:it,note:'🌸 Botín de Empusa · '+it.n+' Nv 150'});return{t:'🌸 '+it.n+' (Nv 150, legendario)',x:1}}return null}
  if(r<P_EX+P_TOK){E.deliver(u,{prov:{pk:'mbt4',q:1},note:'✨ Lágrima del Espejismo'});return{t:'✨ Lágrima del Espejismo'}}
  if(r<P_EX+P_TOK+P_COM){const sl=Math.floor(Math.random()*7),x=Math.random(),rr=x<.7?0:x<.92?1:x<.99?2:3,k=Math.random()<.7?cls:Math.floor(Math.random()*8),
    it=mk(u,{sl,k,r:rr,rl:110,mul:1,n:SL[sl]});if(it){E.deliver(u,{item:it,note:'🎁 Botín de Empusa · '+it.n+' Nv 110'});return{t:'🎁 '+it.n+' (Nv 110)'}}return null}
  if(r<P_EX+P_TOK+P_COM+P_CONS){const h=ri(40,90),m=ri(25,60),d={note:'🧪 Botín de Empusa'};d.pot=h;d.mpot=m;E.deliver(u,d);return{t:'🧪 '+h+' pociones de vida y 🔷 '+m+' de maná'}}
  return{t:'sin botín esta vez'}}
 return{reward}};
