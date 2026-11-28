'use strict';
/* v531 · ESCENARIOS TEMÁTICOS del Mapa 2 (Hrímland).
   · Jefes diarios ancestrales (cueva del Oso, montaña del Dragón de Huesos, castillo de Valdrak, cueva de los Dragones de Ascuas):
     cada piso cambia de decorado según su zona (AN_TAG) y la arena del jefe lleva su propio círculo ritual y utilería.
   · Los 8 jefes de área nórdicos tienen su escenario en el mundo (suelo, utilería alta/baja ordenada con el héroe, ambiente y cartel de zona).
   Todo se dibuja con el canvas del juego (variables globales g, T, M, DG, BOSS, P…). Solo se carga con ?w=2. */
(function(){
const hh=(x,y,a)=>{let q=((x*374761393)^(y*668265263)^(a*2246822519))>>>0;q=((q^(q>>>13))*1274126177)>>>0;return((q^(q>>>16))>>>0)/4294967296};
const mul=s=>{let a=s>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const sh=(x,y,w,h)=>{g.fillStyle='rgba(0,0,0,.32)';g.beginPath();g.ellipse(x,y,w,h||w*.32,0,0,7);g.fill()};
/* ───────── ARTE PIXEL: cada objeto se dibuja una vez en baja resolución (como los sprites del juego),
   se le pone contorno oscuro, luz en el borde y grano, y se amplía SIN suavizar. ───────── */
const SPC={};
const hx=(a,b)=>{let q=(a*2654435761+b*40503)>>>0;q=((q^(q>>>15))*2246822519)>>>0;return((q^(q>>>13))>>>0)/4294967296};
function mk(key,w,h,fn,o){
 if(SPC[key])return SPC[key];o=o||{};const W=w+2,H=h+2,c=document.createElement('canvas');c.width=W;c.height=H;const q=c.getContext('2d');q.translate(1,1);fn(q,w,h);q.setTransform(1,0,0,1,0,0);
 let d=q.getImageData(0,0,W,H),a=d.data;for(let i=3;i<a.length;i+=4)a[i]=a[i]>100?255:0;
 const src=new Uint8ClampedArray(a),al=(x,y)=>x<0||y<0||x>=W||y>=H?0:src[(y*W+x)*4+3];
 const ol=o.ol||[10,13,20];
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;
  if(src[i+3]){let k=0;if(!al(x-1,y)||!al(x,y-1))k=o.lt==null?26:o.lt;else if(!al(x+1,y)||!al(x,y+1))k=-(o.dk==null?34:o.dk);
   const n=(hx(x,y+W)-.5)*(o.nz==null?16:o.nz);for(let t=0;t<3;t++)a[i+t]=Math.max(0,Math.min(255,src[i+t]+k+n))}
  else if(al(x-1,y)||al(x+1,y)||al(x,y-1)||al(x,y+1)){a[i]=ol[0];a[i+1]=ol[1];a[i+2]=ol[2];a[i+3]=255}}
 q.putImageData(d,0,0);return SPC[key]=c}
const lg=(q,x0,y0,x1,y1,st)=>{const g2=q.createLinearGradient(x0,y0,x1,y1);st.forEach((c,i)=>g2.addColorStop(i/(st.length-1),c));return g2};
const poly=(q,pts,f)=>{q.fillStyle=f;q.beginPath();pts.forEach((p,i)=>i?q.lineTo(p[0],p[1]):q.moveTo(p[0],p[1]));q.closePath();q.fill()};
const px=(q,x,y,w,h,c)=>{q.fillStyle=c;q.fillRect(x,y,w,h)};
function blit(c,x,y,sc,al,flip){if(!c)return;const w=c.width*sc,h=c.height*sc;const sm=g.imageSmoothingEnabled;g.imageSmoothingEnabled=false;if(al!=null)g.globalAlpha=al;g.drawImage(c,Math.round(x-w/2),Math.round(y-h+sc*2),w,h);g.globalAlpha=1;g.imageSmoothingEnabled=sm}
const cl=(s,d,a,b)=>Math.max(1,Math.min(Math.min(b||3,3),Math.round(s/(d*1.75))));
const SD={
 tomb:v=>mk('tomb'+v,16,20,(q,w,h)=>{poly(q,[[1,19],[1,8],[2,4],[5,1.5],[8,1],[11,1.5],[14,4],[15,8],[15,19]],lg(q,0,0,16,0,['#9aa0b0','#757b8c','#565b6a']));if(v==2){q.clearRect(0,0,16,5);poly(q,[[1,6],[5,4],[7,7],[11,3],[15,6],[15,9],[1,9]],'#757b8c')}px(q,7,6,2,9,'#3b3f4c');px(q,4,8,8,2,'#3b3f4c');px(q,0,17,16,3,'#4c505c');px(q,2,16,12,1,'#3b3f4c');if(v==1){for(const [x,y] of [[2,13],[3,14],[12,12],[13,14],[5,16],[10,16],[1,11]])px(q,x,y,2,1,'#4f7a3e');px(q,3,12,1,1,'#6aa04c')}if(v==2)px(q,9,10,1,5,'#2c2f3a')}),
 cross:()=>mk('cross',14,24,(q)=>{poly(q,[[5,0],[9,0],[9,6],[14,6],[14,10],[9,10],[9,22],[5,22],[5,10],[0,10],[0,6],[5,6]],lg(q,0,0,14,0,['#a8aebe','#7a8092','#555a69']));px(q,2,22,10,2,'#4c505c');px(q,6,1,1,19,'#c6ccdc')}),
 coffin:()=>mk('coffin',14,24,(q)=>{poly(q,[[4,0],[10,0],[13,6],[11,23],[3,23],[1,6]],'#3a2012');poly(q,[[5,2],[9,2],[11,7],[10,21],[4,21],[3,7]],lg(q,0,0,14,0,['#7a4a2a','#5a331c','#42240f']));px(q,6,5,2,11,'#d6aa4a');px(q,4,8,6,2,'#d6aa4a');px(q,5,2,4,1,'#9a6a3a')}),
 skull:()=>mk('skull',10,10,(q)=>{q.fillStyle='#e8e0c8';q.beginPath();q.ellipse(5,4.2,4.3,4,0,0,7);q.fill();px(q,2,6,6,4,'#e8e0c8');px(q,2,4,2,2,'#1a1410');px(q,6,4,2,2,'#1a1410');px(q,4,6,2,1,'#2a201a');for(let i=0;i<3;i++)px(q,3+i*2,9,1,1,'#2a201a')}),
 bones:()=>mk('bones',20,9,(q)=>{q.strokeStyle='#e4dcc2';q.lineWidth=2;q.lineCap='round';q.beginPath();q.moveTo(2,2);q.lineTo(17,6);q.moveTo(3,7);q.lineTo(16,1);q.stroke();q.fillStyle='#e4dcc2';for(const [x,y] of [[2,2],[17,6],[3,7],[16,1]]){q.beginPath();q.arc(x,y,1.6,0,7);q.fill()}px(q,9,3,2,2,'#cfc6a8')}),
 spike:(h)=>mk('spike'+h,12,h,(q,w,H)=>{poly(q,[[0,H-1],[3,H*.32],[6,0],[6,H-1]],lg(q,0,0,6,0,['#4a98d0','#7cc8f2']));poly(q,[[6,0],[6,H-1],[11,H-1],[9,H*.4]],lg(q,6,0,12,0,['#c2ecff','#8ed2f4']));px(q,6,2,1,H-6,'#ffffff');px(q,3,H*.4|0,1,H*.3|0,'#b8e6ff');px(q,9,H*.55|0,1,H*.25|0,'#ffffff')},{nz:10}),
 menhir:()=>mk('menhir',14,26,(q)=>{poly(q,[[1,25],[2,6],[5,1],[9,0],[12,5],[13,25]],lg(q,0,0,14,0,['#7a8294','#5c6374','#434a5a']));px(q,6,9,2,5,'#8fe6ff');px(q,5,11,4,1,'#8fe6ff');px(q,6,17,2,3,'#8fe6ff')},{}),
 rib:()=>mk('rib',30,26,(q)=>{q.strokeStyle='#dcd3b4';q.lineWidth=3;q.lineCap='round';q.beginPath();q.moveTo(15,2);q.lineTo(15,24);q.stroke();for(let k=0;k<4;k++){const y=4+k*5;q.beginPath();q.moveTo(15,y);q.quadraticCurveTo(2,y-3,3,y+9);q.stroke();q.beginPath();q.moveTo(15,y);q.quadraticCurveTo(28,y-3,27,y+9);q.stroke()}},{nz:10}),
 egg:(c)=>mk('egg'+c,12,14,(q)=>{q.fillStyle=lg(q,0,0,12,0,[c,'#8a826a']);q.beginPath();q.ellipse(6,8,5,6.4,0,0,7);q.fill();px(q,3,5,1,2,'#fff8');for(const [x,y] of [[4,10],[8,9],[6,12],[7,6]])px(q,x,y,1,1,'#5a4a36')}),
 dtree:()=>mk('dtree',30,38,(q)=>{q.strokeStyle='#2b2422';q.lineCap='round';q.lineWidth=4;q.beginPath();q.moveTo(15,37);q.lineTo(15,15);q.stroke();q.lineWidth=2.4;for(const [a,b,c2,d2] of [[15,22,4,12],[15,18,26,8],[15,14,8,2],[15,12,22,1],[4,12,2,6],[26,8,29,3]]){q.beginPath();q.moveTo(a,b);q.lineTo(c2,d2);q.stroke()}px(q,13,28,1,8,'#4a3f3a');px(q,17,22,1,6,'#1a1412')}),
 mound:()=>mk('mound',32,20,(q)=>{q.fillStyle=lg(q,0,0,0,20,['#6a7a52','#3c4a30']);q.beginPath();q.ellipse(16,19,15.5,17,0,Math.PI,0);q.fill();px(q,13,10,6,9,'#0b0c0e');px(q,12,8,8,2,'#8a6a40');px(q,11,9,2,10,'#6e5330');px(q,19,9,2,10,'#6e5330');for(const [x,y] of [[5,14],[9,9],[22,12],[26,15],[18,5]])px(q,x,y,2,1,'#86a066')}),
 spire:(h)=>mk('spire'+h,14,h,(q,w,H)=>{poly(q,[[0,H-1],[2,H*.45],[6,0],[9,H*.4],[13,H-1]],lg(q,0,0,14,0,['#2e2530','#17121a','#0e0a10']));poly(q,[[6,0],[9,H*.4],[13,H-1],[8,H-1]],'#251c28');q.fillStyle='#ff7a2a';for(let i=0;i<5;i++){px(q,6-(i%2),Math.round(H*.12+i*H*.17),2,Math.round(H*.1),i%2?'#ffb040':'#ff6a20')}},{nz:8,lt:14}),
 brazier:()=>mk('brazier',16,16,(q)=>{poly(q,[[6,15],[7,6],[9,6],[10,15]],'#3a343e');poly(q,[[1,4],[15,4],[12,10],[4,10]],lg(q,0,0,16,0,['#5a5260','#3a3440']));px(q,1,3,14,2,'#6a6072');poly(q,[[4,15],[12,15],[10,12],[6,12]],'#2a2630')}),
 stand:()=>mk('stand',14,28,(q)=>{px(q,6,2,2,26,'#4a3a2a');px(q,1,0,12,4,'#5a4a34');px(q,2,26,10,2,'#3a2e22')}),
 egg2:()=>null,
 tapestry:()=>mk('tapestry',16,22,(q)=>{px(q,0,0,16,3,'#c9a24a');poly(q,[[1,3],[15,3],[15,19],[8,22],[1,19]],lg(q,0,3,0,22,['#a01832','#6a0e22']));poly(q,[[8,6],[12,11],[8,16],[4,11]],'#d6aa4a');px(q,7,9,2,4,'#6a0e22')}),
 shield:()=>mk('shield',14,16,(q)=>{poly(q,[[1,1],[13,1],[13,9],[7,15],[1,9]],lg(q,0,0,14,0,['#c2c8d6','#8a92a6','#636b80']));px(q,6,3,2,10,'#b01a2c');px(q,3,6,8,2,'#b01a2c')}),
 glass:(c)=>mk('glass'+c,12,18,(q)=>{q.fillStyle='#14101a';q.beginPath();q.moveTo(0,17);q.lineTo(0,6);q.arc(6,6,6,Math.PI,0);q.lineTo(12,17);q.fill();q.fillStyle=c;q.beginPath();q.moveTo(2,16);q.lineTo(2,6.5);q.arc(6,6.5,4,Math.PI,0);q.lineTo(10,16);q.fill();px(q,5,2,2,15,'#14101a');px(q,2,9,8,1,'#14101a');px(q,3,4,2,3,'#fff4')}),
 shelf:()=>mk('shelf',30,28,(q)=>{px(q,0,0,30,28,'#3a2214');const cs=['#7a1c2c','#2c3a5a','#3a5a3a','#8a6a1c','#5a2a6a','#a04a1c'];for(let r=0;r<2;r++){for(let k=0,x=2;x<27;k++){const bw=2+(hx(k,r)*2|0),bh=9-(hx(k+9,r)*3|0);px(q,x,2+r*13+(10-bh),bw,bh,cs[(k+r*3)%6]);x+=bw+(hx(k,3)<.15?2:0)}px(q,1,12+r*13,28,2,'#5a3a22')}}),
 niche:()=>mk('niche',30,26,(q)=>{px(q,0,0,30,26,'#1a1214');for(let r=0;r<2;r++)for(let k=0;k<2;k++){px(q,2+k*15,2+r*12,12,10,'#0b0708');if(hx(k,r)<.75){q.fillStyle='#e0d8bf';q.beginPath();q.arc(8+k*15,6+r*12,3,0,7);q.fill();px(q,6+k*15,9+r*12,5,2,'#e0d8bf');px(q,6+k*15,5+r*12,1,2,'#0b0708');px(q,9+k*15,5+r*12,1,2,'#0b0708')}}}),
 moonwin:()=>mk('moonwin',12,18,(q)=>{q.fillStyle='#0a1028';q.beginPath();q.moveTo(0,17);q.lineTo(0,6);q.arc(6,6,6,Math.PI,0);q.lineTo(12,17);q.fill();q.fillStyle='#dce8ff';q.beginPath();q.arc(6,8,3.6,0,7);q.fill();q.fillStyle='#0a1028';q.beginPath();q.arc(7.8,7,3.2,0,7);q.fill();px(q,2,14,1,1,'#fff');px(q,9,12,1,1,'#fff')}),
 icicles:()=>mk('icicles',30,12,(q)=>{for(let k=0;k<6;k++){const x=k*5,hh2=5+(hx(k,2)*6|0);poly(q,[[x,0],[x+4,0],[x+2,hh2]],lg(q,0,0,0,12,['#e6f6ff','#8ed2f4']))}}),
 claw:()=>mk('claw',20,20,(q)=>{q.strokeStyle='#080c16';q.lineCap='round';q.lineWidth=2;for(let i=0;i<3;i++){q.beginPath();q.moveTo(3+i*5,1);q.quadraticCurveTo(6+i*5,10,9+i*5,19);q.stroke()}},{ol:[0,0,0],lt:0,dk:0,nz:0}),
 wreck:()=>mk('wreck',40,32,(q)=>{poly(q,[[1,20],[6,26],[34,26],[39,14],[34,14],[6,16]],lg(q,0,14,0,28,['#5a4028','#2c1e12']));px(q,4,14,32,3,'#7a5a36');px(q,18,1,3,16,'#3a2a1c');poly(q,[[21,2],[34,8],[30,15],[21,15]],'#cfc6ae');px(q,8,19,24,1,'#2c1e12');for(let k=0;k<5;k++)px(q,7+k*6,17,2,2,'#8a6a40');px(q,34,10,4,5,'#8a2a1c')}),
 scale:(c)=>mk('scale'+c,30,16,(q)=>{q.fillStyle=lg(q,0,0,0,16,[c,'#0e2a26']);q.beginPath();q.ellipse(15,16,14.5,15,0,Math.PI,0);q.fill();q.strokeStyle='#ffffff30';q.lineWidth=1;for(let r=0;r<3;r++)for(let k=0;k<5;k++){q.beginPath();q.arc(3+k*6+(r%2)*3,5+r*4,3,0,Math.PI);q.stroke()}}),
 sword:()=>mk('sword',22,7,(q)=>{px(q,5,2,16,2,'#c6ccd8');px(q,20,2,2,2,'#e8ecf4');px(q,3,0,2,7,'#7a5a2a');px(q,0,2,4,2,'#4a3320')}),
 chain:()=>mk('chain',20,8,(q)=>{q.strokeStyle='#9aa0ae';q.lineWidth=2;for(let k=0;k<3;k++){q.beginPath();q.ellipse(3+k*6,4,3,2,0,0,7);q.stroke()}}),
 pillarI:()=>null
};
const BL=(n,v,x,y,sc,al)=>blit(SD[n](v),x,y,sc,al);
/* decals de suelo: charcos / escarcha / nieve con 2 tonos, en píxeles */
function decal(kind,x,y,sc,v){const key='dc'+kind+(v|0);const c=mk(key,18,9,(q)=>{const A={pool:['#7a0c1c','#b02438'],frost:['#cfe8fa','#ffffff'],snow:['#f2f8ff','#c4dcf2'],mud:['#2a1c26','#4a3040'],ice:['#4a8ec0','#9ad4f4'],purple:['#3a1a4a','#7a3a9a'],water:['#1c5a78','#4aa0c0']}[kind]||['#444','#777'];q.fillStyle=A[0];q.beginPath();q.ellipse(9,4.5,8.2,3.8,0,0,7);q.fill();q.fillStyle=A[1];q.beginPath();q.ellipse(6+(v%3),3.2,3,1.2,0,0,7);q.fill();if(v%2)px(q,11,5,3,1,A[1])},{nz:6,ol:kind=='frost'||kind=='snow'?[160,190,220]:[20,8,12],lt:0,dk:10});blit(c,x,y+4,sc)}
const U={
 pool(x,y,w,c){decal('pool',x,y,cl(w,7,1,3),(x|0)&3)},
 poolK(k,x,y,w){decal(k,x,y,cl(w,7,1,3),(x|0)&3)},
 bone(x,y,s){BL('bones',0,x,y+4,cl(s,9,1,2))},
 skull(x,y,s){BL('skull',0,x,y+6,cl(s,7,1,3))},
 tomb(x,y,s,v){BL('tomb',v?1:0,x,y+2,cl(s,7,2,3))},
 tomb2(x,y,s){BL('tomb',2,x,y+2,cl(s,7,2,3))},
 cross(x,y,s){BL('cross',0,x,y+2,cl(s,7,2,3))},
 coffin(x,y,s){BL('coffin',0,x,y+10,cl(s,7,2,3))},
 candle(x,y,now){const f=.7+.3*Math.sin((now||0)*9+x*.3);if(typeof sp=='function')sp('candle-1',x,y+2,2);if(now!=null){g.globalCompositeOperation='lighter';const r=g.createRadialGradient(x,y-10,1,x,y-10,36);r.addColorStop(0,'rgba(255,170,60,'+(.26*f).toFixed(2)+')');r.addColorStop(1,'rgba(255,170,60,0)');g.fillStyle=r;g.fillRect(x-36,y-46,72,72);g.globalCompositeOperation='source-over'}},
 spike(x,y,h,c1){const hh2=h>34?34:h>20?26:18;BL('spike',hh2,x,y+3,cl(h,14,1,4))},
 frost(x,y,w){decal('frost',x,y,cl(w,7,1,3),(x|0)&3)},
 snow(x,y,w){decal('snow',x,y,cl(w,7,1,3),(x|0)&3)},
 crack(x,y,l,c,w){g.strokeStyle=c||'rgba(255,110,40,.8)';g.lineWidth=Math.max(2,Math.round((w||2)/2)*2);g.lineCap='square';g.lineJoin='miter';g.beginPath();const px0=Math.round(x-l*.5),py0=Math.round(y);g.moveTo(px0,py0);g.lineTo(Math.round(x-l*.2),Math.round(y+l*.14));g.lineTo(Math.round(x+l*.05),Math.round(y-l*.1));g.lineTo(Math.round(x+l*.25),Math.round(y+l*.1));g.lineTo(Math.round(x+l*.5),Math.round(y-l*.04));g.stroke()},
 claw(x,y,s,c){BL('claw',0,x,y+8,cl(s,8,1,3),.75)},
 rib(x,y,s){BL('rib',0,x,y+2,cl(s,9,2,4))},
 egg(x,y,s,c){BL('egg',c||'#d4cbb0',x,y+6,cl(s,5,2,4))},
 tree(x,y,s,c){BL('dtree',0,x,y+2,cl(s,12,2,4))},
 root(x,y,l,a,c){g.strokeStyle=c||'#3a2430';g.lineCap='round';g.lineJoin='round';g.lineWidth=Math.max(4,Math.round(l*.09/2)*2);g.beginPath();g.moveTo(Math.round(x),Math.round(y));g.bezierCurveTo(Math.round(x+Math.cos(a)*l*.3),Math.round(y+Math.sin(a)*l*.3-l*.2),Math.round(x+Math.cos(a+.7)*l*.7),Math.round(y+Math.sin(a+.7)*l*.5),Math.round(x+Math.cos(a)*l),Math.round(y+Math.sin(a)*l*.5));g.stroke();g.strokeStyle='rgba(255,255,255,.12)';g.lineWidth=2;g.stroke()},
 spire(x,y,h){const hh2=h>34?36:h>24?28:20;BL('spire',hh2,x,y+3,cl(h,16,1,4))},
 stone(x,y,h,c){BL('menhir',0,x,y+3,cl(h,10,1,4))},
 rune(x,y,r,c,now,a){g.save();g.translate(x,y);g.scale(1,.55);g.rotate((now||0)*(a||.05));g.strokeStyle=c;g.lineWidth=3;g.beginPath();g.arc(0,0,r,0,7);g.stroke();g.lineWidth=2;g.beginPath();g.arc(0,0,r*.8,0,7);g.stroke();for(let k=0;k<12;k++){const an=k/12*6.283;g.fillStyle=c;g.fillRect(Math.cos(an)*r*.9-3,Math.sin(an)*r*.9-3,6,6)}g.beginPath();for(let k=0;k<=5;k++){const an=k*2.5133-1.5708;k?g.lineTo(Math.cos(an)*r*.7,Math.sin(an)*r*.7):g.moveTo(Math.cos(an)*r*.7,Math.sin(an)*r*.7)}g.stroke();g.restore()},
 mound(x,y,s){BL('mound',0,x,y+2,cl(s,9,2,4))},
 chain(x,y,l,a){const c=SD.chain();for(let i=0;i<Math.min(l,4);i++)blit(c,x+i*20*Math.cos(a>1.5?-.3:.3),y+i*3,1)},
 wreck(x,y,s){BL('wreck',0,x,y+4,cl(s,10,2,4))},
 scale(x,y,s,c){BL('scale',c||'#2f7a52',x,y+2,cl(s,8,2,4))},
 wisp(x,y,now,c){const f=.5+.5*Math.sin(now*2.2+x*.1),yy=y-Math.abs(Math.sin(now*1.1+x*.07))*14;g.globalCompositeOperation='lighter';const r=g.createRadialGradient(x,yy,0,x,yy,18);r.addColorStop(0,'rgba('+c+','+(.75*f).toFixed(2)+')');r.addColorStop(1,'rgba('+c+',0)');g.fillStyle=r;g.fillRect(x-18,yy-18,36,36);g.globalCompositeOperation='source-over'},
 sword(x,y,s,c){BL('sword',0,x,y+3,cl(s,10,1,3))},
 page(x,y,s){g.fillStyle='rgba(235,225,200,.9)';g.fillRect(Math.round(x)-5,Math.round(y)-3,10,7);g.fillStyle='rgba(60,40,30,.6)';g.fillRect(Math.round(x)-3,Math.round(y)-1,6,1);g.fillRect(Math.round(x)-3,Math.round(y)+1,4,1)},
 book(x,y,s,c){g.fillStyle=c||'#7a1c2c';g.fillRect(Math.round(x)-6,Math.round(y)-3,12,7);g.fillStyle='#d6aa4a';g.fillRect(Math.round(x)-6,Math.round(y),12,1)},
 flame(x,y,s,now,c){const f=Math.floor(now*10+x)%3,hh2=[10,13,9][f];g.fillStyle='rgba('+c+',.95)';g.fillRect(Math.round(x)-5,Math.round(y)-hh2,10,hh2);g.fillRect(Math.round(x)-3,Math.round(y)-hh2-4,6,4);g.fillStyle='rgba(255,236,170,.95)';g.fillRect(Math.round(x)-2,Math.round(y)-hh2+2,4,hh2-2)},
 brazier(x,y,s,now,c){BL('brazier',0,x,y+2,cl(s,7,2,3));U.flame(x,y-22,1,now,c);g.globalCompositeOperation='lighter';const r=g.createRadialGradient(x,y-26,2,x,y-26,s*3.2);r.addColorStop(0,'rgba('+c+',.24)');r.addColorStop(1,'rgba('+c+',0)');g.fillStyle=r;g.fillRect(x-s*3.2,y-26-s*3.2,s*6.4,s*6.4);g.globalCompositeOperation='source-over'},
 bat(x,y,now,k){const w=Math.sin(now*14+k*2)>0?-3:3;g.fillStyle='#120a14';g.fillRect(Math.round(x)-2,Math.round(y),4,3);g.fillRect(Math.round(x)-9,Math.round(y)+w,7,2);g.fillRect(Math.round(x)+2,Math.round(y)+w,7,2);g.fillRect(Math.round(x)-12,Math.round(y)+w*2,3,2);g.fillRect(Math.round(x)+9,Math.round(y)+w*2,3,2);g.fillStyle='#ff3a58';g.fillRect(Math.round(x)-1,Math.round(y),1,1);g.fillRect(Math.round(x)+1,Math.round(y),1,1)}
};
/* ───────── DECORADO DE LOS PISOS (cachés de casillas: sin animación) ─────────
   cada tema define: tint (velo del piso por zona), it (objetos del suelo [prob, función]), wl (decorado de la cara de la pared por zona) */
const TINTS={
 vc:['rgba(50,6,26,.26)','rgba(80,94,120,.2)','rgba(30,6,14,.3)','rgba(120,0,30,.3)','rgba(70,18,40,.24)','rgba(110,140,230,.17)','rgba(26,16,14,.34)','rgba(130,8,40,.3)'],
 ob:['rgba(170,215,255,.14)','rgba(120,190,255,.18)','rgba(150,220,255,.22)','rgba(60,70,90,.2)','rgba(40,110,170,.26)','rgba(20,26,46,.26)'],
 mt:['rgba(190,205,225,.16)','rgba(40,36,34,.26)','rgba(140,170,210,.2)','rgba(70,40,24,.28)','rgba(200,220,245,.18)','rgba(150,190,240,.2)','rgba(10,10,16,.42)','rgba(90,20,10,.32)'],
 df:['rgba(120,20,0,.22)','rgba(150,40,0,.26)','rgba(90,10,0,.28)','rgba(160,90,0,.24)','rgba(20,6,6,.4)']
};
const IT={
 vc:[
  [[.05,(x,y,r)=>U.bone(x,y,9)],[.05,(x,y)=>U.pool(x,y,9)],[.02,(x,y)=>U.crack(x,y,22,'rgba(0,0,0,.6)',1.6)]],
  [[.08,(x,y,r)=>U.tomb(x,y+6,13,r<.03)],[.035,(x,y)=>U.cross(x,y+6,12)],[.07,(x,y)=>U.frost(x,y,11)],[.03,(x,y)=>U.pool(x,y,10)],[.05,(x,y)=>{g.strokeStyle='rgba(60,70,50,.8)';g.lineWidth=1.3;for(let i=-2;i<=2;i++){g.beginPath();g.moveTo(x+i*2,y+4);g.lineTo(x+i*3,y-4-(i&1)*2);g.stroke()}}]],
  [[.04,(x,y)=>U.pool(x,y,10)],[.03,(x,y)=>U.bone(x,y,8)],[.025,(x,y)=>U.sword(x,y,16)]],
  [[.14,(x,y)=>U.pool(x,y,11+(x&3))],[.045,(x,y)=>U.candle(x,y+8)],[.02,(x,y)=>U.cross(x,y+8,13)],[.03,(x,y)=>U.skull(x,y,8)]],
  [[.08,(x,y)=>U.page(x,y,13)],[.05,(x,y)=>U.book(x,y,13,'#5a1424')],[.03,(x,y)=>U.pool(x,y,8)],[.03,(x,y)=>U.candle(x,y+8)]],
  [[.07,(x,y)=>U.rune(x,y,13,'rgba(150,190,255,.45)',0)],[.05,(x,y)=>U.frost(x,y,11)],[.025,(x,y)=>U.bone(x,y,8)]],
  [[.08,(x,y)=>U.coffin(x,y-2,12)],[.1,(x,y)=>U.skull(x,y,8)],[.08,(x,y)=>U.bone(x,y,9)],[.03,(x,y)=>U.pool(x,y,9)]],
  [[.07,(x,y)=>U.pool(x,y,11)],[.05,(x,y)=>U.coffin(x,y-2,13)],[.045,(x,y)=>U.candle(x,y+8)],[.04,(x,y)=>{g.fillStyle='rgba(255,205,90,.55)';g.fillRect(x-4,y-1,8,3)}]]
 ],
 ob:[
  [[.05,(x,y)=>U.snow(x,y,11)],[.04,(x,y)=>U.spike(x,y+6,18)],[.03,(x,y)=>U.bone(x,y,8)]],
  [[.07,(x,y)=>U.frost(x,y,12)],[.06,(x,y)=>U.spike(x,y+6,20)],[.03,(x,y)=>U.claw(x,y,16)]],
  [[.09,(x,y)=>U.spike(x,y+8,26)],[.06,(x,y)=>U.frost(x,y,12)],[.04,(x,y)=>U.snow(x,y,10)]],
  [[.1,(x,y)=>U.bone(x,y,10)],[.06,(x,y)=>U.skull(x,y,9)],[.05,(x,y)=>U.rib(x,y+6,18)],[.04,(x,y)=>U.claw(x,y,16)]],
  [[.1,(x,y)=>U.frost(x,y,13)],[.05,(x,y)=>U.spike(x,y+8,22,'#5aa8d8')],[.05,(x,y)=>U.poolK('ice',x,y,14)]],
  [[.09,(x,y)=>U.claw(x,y,20)],[.07,(x,y)=>U.bone(x,y,10)],[.04,(x,y)=>U.skull(x,y,9)],[.03,(x,y)=>U.rib(x,y+6,16)]]
 ],
 mt:[
  [[.06,(x,y)=>U.snow(x,y,11)],[.05,(x,y)=>U.stone(x,y+6,16,'#7a8494')],[.03,(x,y)=>U.bone(x,y,9)]],
  [[.1,(x,y)=>U.bone(x,y,10)],[.06,(x,y)=>U.skull(x,y,9)],[.04,(x,y)=>U.rib(x,y+6,16)]],
  [[.08,(x,y)=>U.frost(x,y,12)],[.06,(x,y)=>U.spike(x,y+8,20)],[.05,(x,y)=>U.snow(x,y,10)]],
  [[.07,(x,y)=>{U.egg(x,y+8,13,'#d8cfae')}],[.07,(x,y)=>U.bone(x,y,9)],[.04,(x,y)=>U.rib(x,y+6,16)],[.05,(x,y)=>U.poolK('mud',x,y,14)]],
  [[.09,(x,y)=>U.snow(x,y,12)],[.05,(x,y)=>U.stone(x,y+6,16,'#7a8494')],[.04,(x,y)=>U.frost(x,y,12)]],
  [[.08,(x,y)=>U.spike(x,y+8,24)],[.06,(x,y)=>U.frost(x,y,12)],[.04,(x,y)=>U.bone(x,y,9)]],
  [[.07,(x,y)=>U.crack(x,y,24,'rgba(255,90,20,.55)',1.6)],[.06,(x,y)=>U.spire(x,y+7,20,'#14101a','rgba(255,90,30,.7)')],[.05,(x,y)=>U.skull(x,y,9)]],
  [[.08,(x,y)=>U.crack(x,y,26,'rgba(255,120,30,.8)',2)],[.07,(x,y)=>U.rib(x,y+6,18)],[.05,(x,y)=>U.skull(x,y,10)],[.04,(x,y)=>U.spire(x,y+7,22,'#14101a')]]
 ],
 df:[
  [[.08,(x,y)=>U.crack(x,y,24,'rgba(255,110,30,.8)',2)],[.04,(x,y)=>U.spire(x,y+7,18)]],
  [[.1,(x,y)=>U.crack(x,y,26,'rgba(255,130,40,.85)',2)],[.05,(x,y)=>U.egg(x,y+8,13,'#8a3a22')]],
  [[.09,(x,y)=>U.crack(x,y,24,'rgba(255,90,20,.8)',2)],[.05,(x,y)=>U.bone(x,y,9)],[.04,(x,y)=>U.spire(x,y+7,20)]],
  [[.1,(x,y)=>U.crack(x,y,28,'rgba(255,200,70,.85)',2)],[.05,(x,y)=>U.egg(x,y+8,14,'#c8a040')]],
  [[.07,(x,y)=>U.crack(x,y,26,'rgba(255,60,20,.9)',2.2)],[.06,(x,y)=>U.spire(x,y+7,24)],[.04,(x,y)=>U.skull(x,y,10)]]
 ]
};
/* decorado de la cara de la pared (sur de la pared = suelo) */
const WP=(n,v,x,y,sc)=>blit(SD[n](v),x,y,sc);
const WALL={
 vc:[
  (px,py,H)=>{if(H(1)<.4)WP('tapestry',0,px+16,py+27,1)},
  (px,py,H)=>{if(H(1)<.35)WP('cross',0,px+16,py+30,1);else if(H(2)<.3){g.strokeStyle='#3a5230';g.lineWidth=2;g.beginPath();g.moveTo(px+7,py);g.lineTo(px+9,py+12);g.lineTo(px+6,py+24);g.moveTo(px+23,py);g.lineTo(px+21,py+10);g.lineTo(px+24,py+20);g.stroke()}},
  (px,py,H)=>{if(H(1)<.4)WP('shield',0,px+16,py+22,1);if(H(2)<.2)WP('sword',0,px+16,py+14,1)},
  (px,py,H)=>{if(H(1)<.55)WP('glass','#d8203c',px+16,py+26,1)},
  (px,py,H)=>{WP('shelf',0,px+16,py+30,1)},
  (px,py,H)=>{if(H(1)<.5)WP('moonwin',0,px+16,py+26,1)},
  (px,py,H)=>{WP('niche',0,px+16,py+30,1)},
  (px,py,H)=>{WP('tapestry',0,px+9,py+27,1);if(H(1)<.7)WP('tapestry',0,px+24,py+27,1)}
 ],
 ob:[
  (px,py,H)=>{if(H(1)<.5)WP('icicles',0,px+16,py+14,1)},
  (px,py,H)=>{WP('icicles',0,px+16,py+14,1)},
  (px,py,H)=>{WP('icicles',0,px+16,py+14,1);if(H(2)<.4)U.spike(px+10+H(3)*12,py+31,18)},
  (px,py,H)=>{if(H(1)<.55)U.claw(px+16,py+22,16);if(H(2)<.3)WP('skull',0,px+16,py+28,2)},
  (px,py,H)=>{WP('icicles',0,px+16,py+14,1);g.fillStyle='rgba(120,200,255,.28)';g.fillRect(px,py+20,T,8)},
  (px,py,H)=>{U.claw(px+10,py+20,16);if(H(2)<.6)U.claw(px+22,py+22,14)}
 ],
 mt:[
  (px,py,H)=>{g.fillStyle='rgba(238,246,255,.55)';g.fillRect(px+2,py+1,28,4)},
  (px,py,H)=>{if(H(1)<.6)WP('bones',0,px+16,py+20,2)},
  (px,py,H)=>{WP('icicles',0,px+16,py+14,1)},
  (px,py,H)=>{g.fillStyle='rgba(60,40,26,.75)';g.fillRect(px+3,py+18,26,9);if(H(1)<.7)WP('egg','#d8cfae',px+16,py+30,2)},
  (px,py,H)=>{g.fillStyle='rgba(255,255,255,.16)';for(let k=0;k<4;k++)g.fillRect(px+2,py+5+k*6,28-k*3,2)},
  (px,py,H)=>{U.spike(px+16,py+31,18)},
  (px,py,H)=>{g.fillStyle='#ff6a20';g.fillRect(px+8,py+2,2,8);g.fillRect(px+10,py+10,2,8);g.fillRect(px+8,py+18,2,8)},
  (px,py,H)=>{U.rib(px+16,py+30,22);g.fillStyle='#ff6a20';g.fillRect(px+4,py+3,2,8)}
 ],
 df:[
  (px,py,H)=>{g.fillStyle='#ff6a20';g.fillRect(px+8,py+2,2,8);g.fillRect(px+10,py+10,2,8);g.fillRect(px+8,py+18,2,8)}
 ]
};
const NTAG={vc:8,ob:6,mt:8,df:5};
function tile(t,x,y,px,py){
 const id=DG.id,T0=TINTS[id];if(!T0)return;
 const f=Math.max(1,DG.f|0),nn=Math.max(2,DG.n||30),nt=NTAG[id],ti=Math.min(nt-1,Math.floor((f-1)/nn*nt));
 const gv=(xx,yy)=>{const r=M[yy];return r?r[xx]:9},isF=(xx,yy)=>{const v=gv(xx,yy);return v==7||v==8},H=a=>hh(x,y,a+f*31);
 if(t==9||t==2){
  if(!(isF(x,y+1)||isF(x,y-1)||isF(x+1,y)||isF(x-1,y)))return;
  g.fillStyle=T0[ti];g.fillRect(px,py,T,T);
  if(isF(x,y+1)){g.save();g.beginPath();g.rect(px,py,T,T);g.clip();try{WALL[id][Math.min(WALL[id].length-1,ti)](px,py,H)}catch(e){}g.restore()}
  return}
 if(t!=7&&t!=8)return;
 g.fillStyle=T0[ti];g.fillRect(px,py,T,T);
 if(id=='vc'&&ti==2&&((x+y)&1)){g.fillStyle='rgba(0,0,0,.24)';g.fillRect(px,py,T,T)}
 if(id=='vc'&&ti==7){const c=(x%9+9)%9;if(c>=3&&c<=5){g.fillStyle='rgba(120,10,36,.4)';g.fillRect(px,py,T,T);if(c==3||c==5){g.fillStyle='rgba(230,180,70,.45)';g.fillRect(px+(c==3?T-3:0),py,3,T)}}}
 const L=IT[id][Math.min(IT[id].length-1,ti)];let k=0;
 g.save();g.beginPath();g.rect(px-8,py-22,T+16,T+30);g.clip();
 for(const [p,fn] of L){const r=H(40+k*7);if(r<p){try{fn(px+6+H(60+k)*20,py+8+H(80+k)*16,r/p)}catch(e){}}k++}
 g.restore()}
/* ───────── ARENA DEL JEFE: utilería propia (animada) ───────── */
function arena(id,sx,sy,R,now,A){
 const q=A&&A.p;
 if(id=='vc'){
  /* círculo de sangre latiendo + estrella invertida */
  const pu=.55+.35*Math.sin(now*1.7);g.save();g.lineWidth=3;g.strokeStyle='rgba(190,20,50,'+(.35*pu+.2).toFixed(2)+')';g.beginPath();g.ellipse(sx,sy,R*.74,R*.64,0,0,7);g.stroke();g.beginPath();for(let k=0;k<=5;k++){const an=k*2.5133+1.5708,xx=sx+Math.cos(an)*R*.74,yy=sy+Math.sin(an)*R*.64;k?g.lineTo(xx,yy):g.moveTo(xx,yy)}g.stroke();
  g.fillStyle='rgba(120,6,24,'+(.32+.1*pu).toFixed(2)+')';g.beginPath();g.ellipse(sx,sy,R*.2,R*.17,0,0,7);g.fill();g.restore();
  /* cementerio: lápidas, cruces y ataúdes en el borde */
  for(let k=0;k<14;k++){const an=k/14*6.283+.2,rr=R*(k%2?.9:.82),x=sx+Math.cos(an)*rr,y=sy+Math.sin(an)*rr*.82;if(Math.sin(an)<-.25)continue;if(k%4==0)U.coffin(x,y-6,16);else if(k%3==0)U.cross(x,y,16);else U.tomb(x,y,15,k%5==0)}
  for(let k=0;k<5;k++){const an=k*1.3+.5,rr=R*(.35+.1*(k%3)),x=sx+Math.cos(an)*rr,y=sy+Math.sin(an)*rr*.8;U.pool(x,y,16+(k%3)*4)}
  for(let k=0;k<6;k++){const an=k*1.1+.9,rr=R*.55,x=sx+Math.cos(an)*rr,y=sy+Math.sin(an)*rr*.8;U.candle(x,y,now)}
  if(typeof sp=='function'){g.save();g.globalAlpha=.5;for(let k=0;k<3;k++)sp('ghost-'+(1+Math.floor(now*2+k)%2),sx-R*.5+k*R*.5+Math.sin(now*.8+k*2)*14,sy-R*.15-Math.abs(Math.sin(now*1.1+k))*18,3);g.restore()}
  /* murciélagos */
  for(let k=0;k<7;k++){const a=now*.55+k*.9,x=sx+Math.cos(a)*R*(.5+.35*Math.sin(k)),y=sy-60+Math.sin(a*1.3)*R*.35-Math.abs(Math.sin(now*.7+k))*20;U.bat(x,y,now,k)}
 }else if(id=='ob'){
  const pu=.5+.5*Math.sin(now*1.5);g.save();g.lineWidth=2.5;g.strokeStyle='rgba(160,225,255,'+(.3+.18*pu).toFixed(2)+')';g.beginPath();g.ellipse(sx,sy,R*.7,R*.6,0,0,7);g.stroke();g.restore();
  for(let k=0;k<10;k++){const an=k/10*6.283+.3,rr=R*.86,x=sx+Math.cos(an)*rr,y=sy+Math.sin(an)*rr*.82;U.spike(x,y,34+(k%3)*12,'#8fd0f4')}
  for(let k=0;k<4;k++){const an=k*1.57+.8,x=sx+Math.cos(an)*R*.5,y=sy+Math.sin(an)*R*.42;U.claw(x,y,46,'rgba(8,14,28,.55)')}
  for(let k=0;k<3;k++){const an=k*2.1+.2,x=sx+Math.cos(an)*R*.62,y=sy+Math.sin(an)*R*.55;U.rib(x,y,30);U.skull(x+30,y+4,12)}
  g.save();for(let i=0;i<34;i++){const x=sx+(((i*89.3+now*10*(.5+i%3*.3))%(R*2))-R),y=sy-R*.8+((i*47.1+now*24)%(R*1.6));g.fillStyle='rgba(240,248,255,.7)';g.fillRect(x,y,2,2)}g.restore();
 }else if(id=='mt'){
  g.save();g.lineWidth=3;g.strokeStyle='rgba(255,170,80,'+(.22+.12*Math.sin(now*2)).toFixed(2)+')';g.beginPath();g.ellipse(sx,sy,R*.72,R*.62,0,0,7);g.stroke();g.restore();
  for(let k=0;k<5;k++){const an=k/5*6.283+.5,rr=R*.82,x=sx+Math.cos(an)*rr,y=sy+Math.sin(an)*rr*.8;U.rib(x,y,46);U.rib(x+22,y+4,38)}
  for(let k=0;k<6;k++){const an=k*1.05+.2,rr=R*.5,x=sx+Math.cos(an)*rr,y=sy+Math.sin(an)*rr*.8;U.egg(x,y,16+(k%2)*4,k%2?'#d8cfae':'#b8ae92')}
  for(let k=0;k<7;k++){const an=k*.9+1,rr=R*.35,x=sx+Math.cos(an)*rr,y=sy+Math.sin(an)*rr*.8;U.crack(x,y,38,'rgba(255,110,30,'+(.6+.3*Math.sin(now*3+k)).toFixed(2)+')',2.4)}
  for(let k=0;k<4;k++){const an=k*1.57+.2,x=sx+Math.cos(an)*R*.64,y=sy+Math.sin(an)*R*.55;g.strokeStyle='#8a7a5a';g.lineWidth=3;g.beginPath();g.moveTo(x,y);g.lineTo(x,y-34);g.stroke();U.skull(x,y-40,11)}
  g.save();for(let i=0;i<22;i++){const ph=(now*.3+i*.137)%1,x=sx-R*.8+((i*61)%(R*1.6)),y=sy+R*.4-ph*R*1.1;g.fillStyle='rgba(255,'+(120+(i*29)%90)+',40,'+((1-ph)*.8).toFixed(2)+')';g.fillRect(x,y,2.4,2.4)}g.restore();
 }else if(id=='df'){
  for(let k=0;k<9;k++){const an=k/9*6.283+.3,l=R*(.45+.2*(k%3));g.strokeStyle='rgba(255,'+(80+(k*37)%120)+',30,'+(.55+.3*Math.sin(now*3+k)).toFixed(2)+')';g.lineWidth=3;g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+Math.cos(an)*l*.5+Math.sin(k)*14,sy+Math.sin(an)*l*.42);g.lineTo(sx+Math.cos(an)*l,sy+Math.sin(an)*l*.85);g.stroke()}
  for(let k=0;k<8;k++){const an=k/8*6.283+.7,x=sx+Math.cos(an)*R*.86,y=sy+Math.sin(an)*R*.74;U.spire(x,y,40+(k%3)*10)}
 }
}
/* ───────── ESCENARIOS DE LOS 8 JEFES DE ÁREA ───────── */
const ZR=300;
const ZN=['❄️ Glaciar del Gigante','⛓️ Cadenas del Lobo Gris','⚰️ Túmulos de Valgrim','🔥 Forja de Surt','🌳 Raíces del Mundo','☠️ Puertas de Niflheim','🌊 Anillo de la Serpiente','🌋 Campo de Ragnarök'];
/* cada tema: suelo [centro, borde], runa, props [[función, cantidad, rMin, rMax, tamaño], …], ambiente */
const ZT=[
 {g:['rgba(170,220,255,.38)','rgba(120,180,230,.0)'],rn:'rgba(170,225,255,.55)',amb:'snow',pr:[[(x,y,s)=>U.spike(x,y,s*2.6,'#9ad6f6'),16,.55,1,22],[(x,y,s)=>U.snow(x,y,s*1.6),12,.2,.95,14],[(x,y,s)=>U.stone(x,y,s*2.2,'#7a8aa0'),6,.5,.95,20],[(x,y,s)=>{U.poolK('ice',x,y,s*3.4)},7,.2,.8,12]]},
 {g:['rgba(60,62,72,.45)','rgba(60,62,72,0)'],rn:'rgba(190,190,210,.4)',amb:'fog',pr:[[(x,y,s,i,now)=>{U.tree(x,y,s*3,'#232226')},9,.6,1,16],[(x,y,s)=>U.skull(x,y,s*.8),12,.15,.9,12],[(x,y,s,i)=>U.chain(x,y,8,i*.7),6,.25,.8,0],[(x,y,s)=>U.claw(x,y,s*2,'rgba(0,0,0,.45)'),7,.2,.8,16],[(x,y,s)=>U.stone(x,y,s*1.8,'#4a4c58'),5,.5,.9,16]]},
 {g:['rgba(60,100,70,.4)','rgba(40,70,50,0)'],rn:'rgba(120,230,160,.45)',amb:'wisp',pr:[[(x,y,s)=>U.mound(x,y,s*2.4),6,.45,.95,20],[(x,y,s,i)=>U.tomb(x,y,s*1.4,i%3==0),12,.2,.9,16],[(x,y,s)=>U.tree(x,y,s*3,'#2a2a22'),6,.65,1,16],[(x,y,s)=>U.stone(x,y,s*2,'#586058'),5,.5,.95,18],[(x,y,s)=>U.skull(x,y,s*.7),6,.2,.8,12]]},
 {g:['rgba(190,60,10,.45)','rgba(120,20,0,0)'],rn:'rgba(255,140,50,.6)',amb:'ember',pr:[[(x,y,s,i,now)=>U.crack(x,y,s*5,'rgba(255,'+(100+(i*29)%90)+',30,'+(.7+.25*Math.sin(now*2.4+i)).toFixed(2)+')',2.6),14,.1,.95,22],[(x,y,s)=>U.spire(x,y,s*2.6),12,.5,1,22],[(x,y,s,i,now)=>U.brazier(x,y,s*.9,now,'255,120,30'),4,.55,.85,16],[(x,y,s)=>U.tree(x,y,s*2.6,'#1a1210'),5,.7,1,16]]},
 {g:['rgba(70,30,60,.45)','rgba(40,18,40,0)'],rn:'rgba(190,110,230,.45)',amb:'spore',pr:[[(x,y,s,i)=>U.root(x,y,s*5,(i%2?2.4:.7)+i*.3,'#3a2430'),14,.3,1,26],[(x,y,s)=>U.bone(x,y,s*.9),12,.15,.9,12],[(x,y,s)=>U.skull(x,y,s*.8),7,.2,.8,12],[(x,y,s)=>U.poolK('purple',x,y,s*3),6,.2,.7,12],[(x,y,s)=>U.tree(x,y,s*3.4,'#241a22'),4,.7,1,16]]},
 {g:['rgba(120,170,220,.38)','rgba(40,60,100,0)'],rn:'rgba(160,200,255,.55)',amb:'souls',pr:[[(x,y,s)=>U.rib(x,y,s*2.4),8,.45,1,18],[(x,y,s)=>U.skull(x,y,s*.9),12,.15,.9,12],[(x,y,s)=>U.spike(x,y,s*2.4,'#8ab8e0'),10,.55,1,20],[(x,y,s)=>U.frost(x,y,s*1.6),10,.15,.85,14],[(x,y,s)=>U.stone(x,y,s*2.6,'#303850'),4,.7,1,20]]},
 {g:['rgba(30,90,110,.42)','rgba(20,60,90,0)'],rn:'rgba(110,220,230,.5)',amb:'mist',pr:[[(x,y,s,i)=>U.scale(x,y,s*2.2,i%2?'#2b5a3e':'#1f4a52'),18,.5,1,20],[(x,y,s)=>U.wreck(x,y,s*1.6),4,.55,.95,16],[(x,y,s)=>U.poolK('water',x,y,s*3.6),10,.15,.8,14],[(x,y,s)=>U.stone(x,y,s*2.3,'#4a5a64'),6,.6,1,18]]},
 {g:['rgba(150,20,10,.5)','rgba(70,10,0,0)'],rn:'rgba(255,90,60,.65)',amb:'ember',pr:[[(x,y,s,i,now)=>U.crack(x,y,s*6,'rgba(255,'+(70+(i*31)%110)+',30,'+(.75+.25*Math.sin(now*3+i)).toFixed(2)+')',3),16,.1,1,24],[(x,y,s)=>U.spire(x,y,s*3),12,.5,1,24],[(x,y,s)=>U.wreck(x,y,s*1.6),4,.55,.95,16],[(x,y,s)=>U.sword(x,y,s*2.4,'#8a8e9a'),6,.2,.8,16],[(x,y,s,i,now)=>U.brazier(x,y,s,now,'255,90,40'),6,.45,.95,16],[(x,y,s)=>U.skull(x,y,s),7,.2,.8,12]]}
];
let ZP=null;
function zinit(){
 if(ZP||typeof BOSS=='undefined'||!BOSS.length||BOSS[0].ax==null)return;
 ZP=BOSS.slice(0,8).map((b,i)=>{const th=ZT[i];if(!th)return null;const r=mul(7700+i*131),list=[];
  th.pr.forEach((pp,pi)=>{const [fn,n,r0,r1,sz]=pp;for(let k=0;k<n;k++){const an=r()*6.283,rr=ZR*(r0+(r1-r0)*r()),sz2=sz*(.75+r()*.6);list.push({fn,x:Math.cos(an)*rr,y:Math.sin(an)*rr*.78,s:sz2,i:k+pi*7})}});
  list.sort((a,c)=>a.y-c.y);return{b,th,list,cx:b.ax*T+16,cy:b.ay*T+16,seen:0}})}
function zdraw(cx,cy,now,front){
 if(typeof DG!='undefined'&&DG.f)return;zinit();if(!ZP)return;
 for(let zi=0;zi<ZP.length;zi++){const z=ZP[zi];if(!z)continue;const sx=z.cx-cx,sy=z.cy-cy;if(sx<-ZR-60||sx>VW+ZR+60||sy<-ZR-60||sy>VH+ZR+60)continue;
  if(!front){
   /* suelo: mancha, aro rúnico, ambiente de fondo */
   const gr=g.createRadialGradient(sx,sy,10,sx,sy,ZR);gr.addColorStop(0,z.th.g[0]);gr.addColorStop(.75,z.th.g[0].replace(/[\d.]+\)$/,'.16)'));gr.addColorStop(1,z.th.g[1]);g.fillStyle=gr;g.beginPath();g.ellipse(sx,sy,ZR*1.05,ZR*.84,0,0,7);g.fill();
   g.save();g.beginPath();g.ellipse(sx,sy,ZR*1.05,ZR*.84,0,0,7);g.clip();U.rune(sx,sy,ZR*.6,z.th.rn,now,.04*(zi%2?1:-1));U.rune(sx,sy,ZR*.26,z.th.rn,now,-.07);g.restore();
   if(!z.seen&&Math.hypot(P.x-z.cx,P.y-z.cy)<ZR*.9){z.seen=1;try{toast(ZN[zi],3200)}catch(e){}}
  }
  for(const p of z.list){const wy=z.cy+p.y;const inFront=wy>P.y;if(inFront!==!!front)continue;const x=sx+p.x,y=sy+p.y;if(x<-70||x>VW+70||y<-120||y>VH+80)continue;try{p.fn(x,y,p.s,p.i,now)}catch(e){}}
  if(front){/* ambiente por encima */
   const a=z.th.amb;g.save();
   if(a=='snow'||a=='mist'||a=='fog'||a=='souls'){for(let i=0;i<30;i++){const ph=(now*(a=='snow'?.12:.04)+i*.071)%1,x=sx-ZR+((i*97.3)%(ZR*2))+Math.sin(now*.5+i)*16,y=sy-ZR*.8+ph*ZR*1.6;if(a=='snow'){g.fillStyle='rgba(245,250,255,.75)';g.fillRect(x,y,2.2,2.2)}else if(a=='souls'){if(i%6==0&&typeof sp=='function'){g.save();g.globalAlpha=.45;sp('ghost-'+(1+Math.floor(now*2+i)%2),x,sy+ZR*.3-ph*ZR*.6,3);g.restore()}g.fillStyle='rgba(170,210,255,'+(.4*(1-Math.abs(ph*2-1))).toFixed(2)+')';g.beginPath();g.ellipse(x,sy+ZR*.4-ph*ZR*.9,5,9,0,0,7);g.fill()}else{g.fillStyle='rgba('+(a=='fog'?'190,190,205':'150,200,220')+',.07)';g.beginPath();g.ellipse(x,sy+Math.sin(i)*ZR*.5,60,10,0,0,7);g.fill()}}}
   else if(a=='ember'){for(let i=0;i<26;i++){const ph=(now*.3+i*.137)%1,x=sx-ZR*.8+((i*61)%(ZR*1.6))+Math.sin(now*2+i)*8,y=sy+ZR*.3-ph*ZR*.9;g.fillStyle='rgba(255,'+(110+((i*29)%110))+',40,'+((1-ph)*.85).toFixed(2)+')';g.fillRect(x,y,2.6,2.6)}}
   else if(a=='wisp'){for(let i=0;i<7;i++)U.wisp(sx-ZR*.7+((i*83)%(ZR*1.4)),sy+Math.sin(i*2.1)*ZR*.4,now+i,'120,240,170')}
   else if(a=='spore'){for(let i=0;i<24;i++){const ph=(now*.08+i*.083)%1,x=sx-ZR*.8+((i*71)%(ZR*1.6))+Math.sin(now+i)*12,y=sy+ZR*.4-ph*ZR*.9;g.fillStyle='rgba(210,130,255,'+(.5*(1-ph)).toFixed(2)+')';g.beginPath();g.arc(x,y,2.4,0,7);g.fill()}}
   g.restore()}
 }}
window.ESN={tile,arena,ground:(cx,cy,now)=>zdraw(cx,cy,now,0),front:(cx,cy,now)=>zdraw(cx,cy,now,1),has:id=>!!TINTS[id],names:ZN};
})();
