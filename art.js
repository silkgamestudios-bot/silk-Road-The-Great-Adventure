/* Arte conceptual de Silk Road: escenas y emblemas dibujados en SVG (originales, sin imágenes externas).
   Los personajes son los sprites reales del juego (skins.png). */
(function(){
const W=800,H=350;
const rng=seed=>{let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}};
const f=n=>Math.round(n*10)/10;
let UID=0;

/* ---------- emblemas de clase (escudo + símbolo) ---------- */
const SYM={
0:`<circle r="22" fill="none" stroke="#ffe08a" stroke-width="5"/><rect x="-8" y="-8" width="16" height="16" fill="#1b1329" stroke="#ffe08a" stroke-width="3"/><path d="M-30 30h60" stroke="#ffe08a" stroke-width="3"/>`,
1:`<path d="M0 -34 L6 -26 V14 H-6 V-26Z" fill="#e8eef7"/><rect x="-18" y="12" width="36" height="6" rx="2" fill="#ffe08a"/><rect x="-3" y="18" width="6" height="16" fill="#b8862a"/><circle cy="38" r="4" fill="#ffe08a"/>`,
2:`<path d="M0 -38 C16 -14 26 -2 20 14 C14 32 -14 32 -20 14 C-26 -2 -6 -8 0 -38Z" fill="#ff7a2e"/><path d="M0 -12 C9 2 12 8 8 16 C4 24 -4 24 -8 16 C-12 8 -3 4 0 -12Z" fill="#ffe08a"/>`,
3:`<path d="M-16 -34 Q30 0 -16 34" fill="none" stroke="#ffe08a" stroke-width="5" stroke-linecap="round"/><path d="M-16 -34 L-16 34" stroke="#e8eef7" stroke-width="1.5"/><path d="M-28 0 H34" stroke="#e8eef7" stroke-width="3"/><path d="M34 0 l-9 -6 v12z" fill="#e8eef7"/>`,
4:`<circle r="30" fill="none" stroke="#fff3c4" stroke-width="2" stroke-dasharray="3 5"/><ellipse cy="-16" rx="9" ry="12" fill="none" stroke="#ffe08a" stroke-width="5"/><path d="M0 -4 V32 M-14 10 H14" stroke="#ffe08a" stroke-width="6" stroke-linecap="round"/>`,
5:`<path d="M20 -22 A28 28 0 1 0 28 4" fill="none" stroke="#ffe08a" stroke-width="7" stroke-linecap="round"/><circle cx="0" cy="2" r="6" fill="#ff9a3a"/>`,
6:`<path d="M0 -34 C28 -16 28 18 0 34 C-28 18 -28 -16 0 -34Z" fill="#3fb596"/><path d="M0 -26 V30" stroke="#0b3a30" stroke-width="2.5"/><path d="M0 -4 l12 -10 M0 8 l-12 -10 M0 18 l11 -9" stroke="#0b3a30" stroke-width="2" fill="none"/>`,
7:`<rect x="-26" y="-30" width="40" height="18" rx="3" fill="#cfd6df" transform="rotate(-18)"/><rect x="-3" y="-20" width="7" height="52" fill="#a8652d" transform="rotate(-18)"/><path d="M-26 30 h52 l-6 -10 h-40z" fill="#4a4f5a"/>`
};
function emblem(c,size){
  const id='e'+(++UID);
  return `<svg class="emb" viewBox="-50 -62 100 124" width="${size||96}" height="${(size||96)*1.24}" role="img" aria-label="Emblema"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a58"/><stop offset="1" stop-color="#150d24"/></linearGradient></defs><path d="M0 -58 L44 -42 V10 C44 38 16 56 0 62 C-16 56 -44 38 -44 10 V-42Z" fill="url(#${id})" stroke="#e6b64f" stroke-width="3"/><path d="M0 -50 L36 -37 V9 C36 33 13 48 0 53 C-13 48 -36 33 -36 9 V-37Z" fill="none" stroke="#e6b64f" stroke-opacity=".45" stroke-width="1"/><g transform="translate(0,2)">${SYM[c]||''}</g></svg>`;
}

/* ---------- capas de relieve ---------- */
function ridge(R,base,amp,steps,color,op,snow){
  let pts=[],y=base;const n=steps;
  for(let i=0;i<=n;i++){y+=(R()-.5)*amp;y=Math.max(base-amp*2.4,Math.min(base+amp*1.4,y));pts.push([i*W/n,y])}
  let d='M0 '+H+' L'+pts.map(p=>f(p[0])+' '+f(p[1])).join(' L')+' L'+W+' '+H+'Z';
  let s=`<path d="${d}" fill="${color}" opacity="${op||1}"/>`;
  if(snow){let sd='';pts.forEach((p,i)=>{if(i>0&&i<n&&p[1]<base-amp*.5&&p[1]<pts[i-1][1]&&p[1]<pts[i+1][1]){sd+=`M${f(p[0])} ${f(p[1])} l-14 22 l7 -5 l7 9 l7 -9 l7 5Z `}});s+=`<path d="${sd}" fill="#f4f7ff" opacity=".85"/>`}
  return s;
}
function dunes(R,base,color,op){
  let d='M0 '+H+' L0 '+base,x=0;
  while(x<W){const w=120+R()*160,h=(R()-.5)*34;d+=` Q${f(x+w/2)} ${f(base+h-26)} ${f(x+w)} ${f(base+h*.4)}`;x+=w}
  return `<path d="${d} L${W} ${H}Z" fill="${color}" opacity="${op||1}"/>`;
}
function trees(R,y0,n,color,sc){
  let s='';for(let i=0;i<n;i++){const x=R()*W,h=(26+R()*40)*sc,w=h*.45;
    s+=`<path d="M${f(x)} ${f(y0)} l${f(-w)} 0 l${f(w*.55)} ${f(-h*.45)} l${f(-w*.4)} 0 l${f(w*.85)} ${f(-h*.55)} l${f(w*.85)} ${f(h*.55)} l${f(-w*.4)} 0 l${f(w*.55)} ${f(h*.45)}Z" fill="${color}"/>`}
  return s;
}
function roundTrees(R,y0,n,color,sc){let s='';for(let i=0;i<n;i++){const x=R()*W,h=(24+R()*30)*sc;s+=`<rect x="${f(x-2)}" y="${f(y0-h*.5)}" width="4" height="${f(h*.5)}" fill="${color}"/><circle cx="${f(x)}" cy="${f(y0-h*.62)}" r="${f(h*.36)}" fill="${color}"/>`}return s}
function ruins(R,y0,color){
  let s='';let x=40;
  while(x<W-40){const t=R();
    if(t<.35){const h=70+R()*70;s+=`<rect x="${f(x)}" y="${f(y0-h)}" width="20" height="${f(h)}" fill="${color}"/><rect x="${f(x-4)}" y="${f(y0-h-8)}" width="28" height="8" fill="${color}"/>`;x+=46}
    else if(t<.6){const h=50+R()*40;s+=`<path d="M${f(x)} ${f(y0)} v${f(-h)} h18 v${f(h*.3)} h${f(-4)} v${f(h*.7)}Z" fill="${color}"/>`;x+=34}
    else{const w=70+R()*60,h=48+R()*34;s+=`<rect x="${f(x)}" y="${f(y0-h)}" width="${f(w)}" height="${f(h)}" fill="${color}"/>`;for(let k=0;k<w/16;k++)s+=`<rect x="${f(x+k*16+2)}" y="${f(y0-h-10)}" width="9" height="10" fill="${color}"/>`;x+=w+26}}
  return s+`<rect x="0" y="${y0}" width="${W}" height="${H-y0}" fill="${color}"/>`;
}
function cave(R,color,glow,webs){
  let s=`<path d="M0 0 H${W} V${H} H0Z" fill="${color}" opacity=".0"/>`;let x=-20;
  while(x<W+20){const w=30+R()*60,h=40+R()*110;s+=`<path d="M${f(x)} 0 L${f(x+w/2)} ${f(h)} L${f(x+w)} 0Z" fill="${color}"/>`;x+=w*.7}
  x=-20;while(x<W+20){const w=26+R()*50,h=24+R()*70;s+=`<path d="M${f(x)} ${H} L${f(x+w/2)} ${f(H-h)} L${f(x+w)} ${H}Z" fill="${color}"/>`;x+=w*.8}
  for(let i=0;i<9;i++){const cx=60+R()*(W-120),cy=H-30-R()*60,h=16+R()*30;s+=`<path d="M${f(cx)} ${f(cy)} l${f(-6)} ${f(-h*.6)} l${f(6)} ${f(-h*.5)} l${f(6)} ${f(h*.5)}Z" fill="${glow}" opacity=".9"/><circle cx="${f(cx)}" cy="${f(cy-h*.5)}" r="${f(h*1.4)}" fill="${glow}" opacity=".12"/>`}
  if(webs){for(let k=0;k<5;k++){const wx=R()*W,wl=60+R()*120;s+=`<path d="M${f(wx)} 0 V${f(wl)}" stroke="#ffffff" stroke-opacity=".35" stroke-width="1"/><circle cx="${f(wx)}" cy="${f(wl)}" r="3" fill="#fff" opacity=".5"/>`;for(let j=1;j<6;j++){s+=`<path d="M${f(wx-j*8)} ${f(j*wl/7)} Q${f(wx)} ${f(j*wl/7+10)} ${f(wx+j*8)} ${f(j*wl/7)}" fill="none" stroke="#fff" stroke-opacity=".22"/>`}}}
  return s;
}
function constell(R,color){
  let s='';for(let c=0;c<3;c++){let x=80+R()*(W-300),y=40+R()*140;const pts=[[x,y]];for(let i=0;i<6;i++){x+=30+R()*50;y+=(R()-.5)*70;pts.push([x,Math.max(20,Math.min(220,y))])}
    s+=`<path d="M${pts.map(p=>f(p[0])+' '+f(p[1])).join(' L')}" fill="none" stroke="${color}" stroke-opacity=".5" stroke-width="1.2"/>`+pts.map(p=>`<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(2+R()*2.6)}" fill="#fff"/><circle cx="${f(p[0])}" cy="${f(p[1])}" r="9" fill="${color}" opacity=".18"/>`).join('')}
  s+=`<circle cx="${W/2}" cy="170" r="130" fill="none" stroke="${color}" stroke-opacity=".28" stroke-width="1.5" stroke-dasharray="2 8"/><circle cx="${W/2}" cy="170" r="96" fill="none" stroke="${color}" stroke-opacity=".2"/>`;
  return s;
}
function embers(R,n,c1,c2){let s='';for(let i=0;i<n;i++){const x=R()*W,y=R()*H,r=.8+R()*2.4;s+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${R()<.5?c1:c2}" opacity="${f(.35+R()*.6)}"/>`}return s}
function aurora(R,cols){let s='';cols.forEach((c,i)=>{let d=`M0 ${60+i*26}`;for(let x=0;x<=W;x+=80)d+=` Q${x+40} ${f(20+R()*150)} ${x+80} ${f(40+i*26+R()*60)}`;s+=`<path d="${d} V${150+i*40} H0Z" fill="${c}" opacity=".22" filter="url(#bl)"/>`});return s}
function rays(R,x,y,c){let s='';for(let i=0;i<9;i++){const a=(-90+(i-4)*13)*Math.PI/180,L=520;s+=`<path d="M${x} ${y} L${f(x+Math.cos(a-.05)*L)} ${f(y+Math.sin(a-.05)*L)} L${f(x+Math.cos(a+.05)*L)} ${f(y+Math.sin(a+.05)*L)}Z" fill="${c}" opacity=".08"/>`}return s}
function fireflies(R,n,c){let s='';for(let i=0;i<n;i++){const x=R()*W,y=140+R()*190;s+=`<circle cx="${f(x)}" cy="${f(y)}" r="2" fill="${c}"/><circle cx="${f(x)}" cy="${f(y)}" r="8" fill="${c}" opacity=".2"/>`}return s}
function tower(x,y0,c1,c2){return `<path d="M${x-26} ${y0} V${y0-190} h-10 l10 -18 h52 l10 18 h-10 V${y0}Z" fill="${c1}"/><path d="M${x-12} ${y0-190} l12 -34 l12 34Z" fill="${c2}"/>`+[0,1,2,3,4,5,6,7].map(i=>`<rect x="${x-4}" y="${y0-170+i*20}" width="8" height="12" fill="#ffd97a" opacity="${i%3?.2:.7}"/>`).join('')}
function lake(R,y0,c){let s=`<rect x="0" y="${y0}" width="${W}" height="${H-y0}" fill="${c}"/>`;for(let i=0;i<14;i++){const x=R()*W,y=y0+6+R()*(H-y0-10),w=20+R()*70;s+=`<path d="M${f(x)} ${f(y)} h${f(w)}" stroke="#fff" stroke-opacity=".18" stroke-width="1.4"/>`}return s}
function caravanSil(x,y,c,k){let s='';for(let i=0;i<3;i++){const ox=x+i*58*k;s+=`<g transform="translate(${f(ox)} ${y}) scale(${k})" fill="${c}"><ellipse cx="22" cy="-30" rx="22" ry="10"/><path d="M14 -38 q6 -16 12 0z"/><path d="M40 -34 q10 -2 14 -16 q3 -6 9 -6 l3 5 q-5 2 -6 8 q-4 14 -14 20z"/><rect x="6" y="-24" width="3.2" height="24"/><rect x="14" y="-24" width="3.2" height="24"/><rect x="31" y="-24" width="3.2" height="24"/><rect x="39" y="-24" width="3.2" height="24"/></g>`}return s}
function sprite(o){if(!o)return'';const k=o.k||7,w=16*k,x=o.x,y=o.y,hid='h'+(++UID),halo=o.halo?`<defs><radialGradient id="${hid}"><stop offset="0" stop-color="${o.halo}" stop-opacity=".6"/><stop offset=".6" stop-color="${o.halo}" stop-opacity=".16"/><stop offset="1" stop-color="${o.halo}" stop-opacity="0"/></radialGradient></defs><circle cx="${x}" cy="${y-w/2}" r="${w*.95}" fill="url(#${hid})"/>`:'';
  if(o.hero&&window.HEROES&&HEROES[o.c]){const hw=16*k;return halo+`<ellipse cx="${x}" cy="${y+2}" rx="${w*.36}" ry="${k*1.5}" fill="#000" opacity=".45"/><image x="${f(x-hw/2)}" y="${f(y-hw+k)}" width="${hw}" height="${hw}" href="${HEROES[o.c].down[0]}" style="image-rendering:pixelated"/>`}
  return halo+`<ellipse cx="${x}" cy="${y+2}" rx="${w*.36}" ry="${k*1.5}" fill="#000" opacity=".45"/><svg x="${f(x-w/2)}" y="${f(y-w+k)}" width="${w}" height="${w}" viewBox="${o.c*32} ${o.t*16} 16 16" overflow="hidden"><image href="skins.png" width="256" height="64" style="image-rendering:pixelated"/></svg>`}

/* ---------- escena genérica ---------- */
function scene(o){
  const R=rng(o.seed||1),id='s'+(++UID),sky=o.sky||['#10081c','#4a1a3a','#e0803a'];
  let b=`<svg class="art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${o.label||'Arte conceptual'}" xmlns="http://www.w3.org/2000/svg"><defs>
  <linearGradient id="${id}k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset=".55" stop-color="${sky[1]}"/><stop offset="1" stop-color="${sky[2]}"/></linearGradient>
  <radialGradient id="${id}v" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>
  <radialGradient id="${id}s"><stop offset="0" stop-color="${o.sun&&o.sun.c||'#fff'}"/><stop offset="1" stop-color="${o.sun&&o.sun.c||'#fff'}" stop-opacity="0"/></radialGradient>
  <filter id="bl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter></defs>
  <rect width="${W}" height="${H}" fill="url(#${id}k)"/>`;
  if(o.stars){for(let i=0;i<90;i++)b+=`<circle cx="${f(R()*W)}" cy="${f(R()*H*.6)}" r="${f(.4+R()*1.3)}" fill="#fff" opacity="${f(.25+R()*.7)}"/>`}
  if(o.celest)b+=constell(R,o.celest);
  if(o.aurora)b+=aurora(R,o.aurora);
  if(o.sun){const s=o.sun;b+=`<circle cx="${s.x}" cy="${s.y}" r="${s.r*3.4}" fill="url(#${id}s)" opacity=".5"/><circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${s.c}"/>`;if(o.rays)b+=rays(R,s.x,s.y,s.c)}
  const L=o.layers||[['#2a1840',215,26,.9],['#1c1030',250,22,1]];
  L.forEach((l,i)=>{b+=ridge(R,l[1],l[2],22,l[0],l[3],o.snow&&i<L.length-1)});
  const m=o.motif;
  if(m=='dunes'){b+=dunes(R,262,o.ground||'#2a1226',1)+dunes(R,300,'#150a1a',1)}
  else if(m=='forest'){b+=trees(R,262,34,'#0d2a22',1)+trees(R,300,26,'#071a15',1.3)}
  else if(m=='round'){b+=roundTrees(R,265,30,'#0f3a2a',1)+roundTrees(R,305,22,'#082218',1.35)}
  else if(m=='ruins'){b+=ruins(R,280,o.ground||'#140c20')}
  else if(m=='plain'){b+=dunes(R,278,o.ground||'#142a1c',1)+dunes(R,312,'#0a1a10',1)}
  else if(m=='cave'){b+=cave(R,o.ground||'#0a0612',o.glow||'#b06bff',o.webs)}
  else if(m=='tower'){b+=lake(R,262,o.ground||'#0b1a30')+tower(W*.62,262,'#05060d','#05060d')+trees(R,262,14,'#05080f',.8)}
  else if(m=='crag'){b+=ridge(R,268,18,16,'#2a1a14',1)+ridge(R,300,14,16,'#140a08',1)}
  else if(m=='sea'){b+=lake(R,255,o.ground||'#0a1830')}
  if(o.caravan)b+=caravanSil(80,282,'#0a0510',.9);
  if(o.fire)b+=embers(R,70,'#ffb02e','#ff5a2e');
  if(o.flies)b+=fireflies(R,26,'#c8ff8a');
  if(o.mist)b+=`<rect x="-20" y="${H-120}" width="${W+40}" height="110" fill="#fff" opacity="${o.mist}" filter="url(#bl)"/><rect x="-20" y="${H-70}" width="${W+40}" height="70" fill="${o.mistc||'#cfd8ff'}" opacity="${o.mist*.8}" filter="url(#bl)"/>`;
  b+=`<rect width="${W}" height="${H}" fill="url(#${id}v)"/>`;
  if(o.emblem!=null)b+=`<g opacity=".2" transform="translate(${o.ex||650} 150) scale(1.9)">${SYM[o.emblem]}</g>`;
  if(o.sprite)b+=sprite(o.sprite);
  b+=`</svg>`;
  return b;
}

/* ---------- temas por clase ---------- */
const CT=[
 {sky:['#220a2c','#a4402e','#f6b256'],sun:{x:560,y:200,r:46,c:'#ffd98a'},layers:[['#6a2a3a',212,22,.8],['#3a1630',240,18,1]],motif:'dunes',caravan:1,seed:11,ground:'#2a1226',mist:.06},
 {sky:['#0d1424','#2a3b58','#8ea4c4'],sun:{x:640,y:120,r:30,c:'#fff3d0'},layers:[['#3a4a66',208,20,.9],['#222d44',236,16,1]],motif:'ruins',seed:22,ground:'#10172a',mist:.08},
 {sky:['#12051c','#5a1a3a','#e0602a'],sun:{x:300,y:210,r:38,c:'#ff9a3a'},layers:[['#4a1630',215,26,.9],['#220a1c',250,20,1]],motif:'crag',fire:1,seed:33},
 {sky:['#07161a','#1d4a3c','#86d7a4'],sun:{x:600,y:100,r:26,c:'#eafff0'},layers:[['#1a5a46',212,22,.8],['#0f3a2e',238,18,1]],motif:'forest',seed:44,mist:.1,mistc:'#d9ffe8'},
 {sky:['#1a1a3a','#7a6aa8','#ffe3a0'],sun:{x:400,y:180,r:44,c:'#fff8dc'},layers:[['#6a5a96',222,20,.8],['#3a2f60',248,16,1]],motif:'ruins',rays:1,seed:55,ground:'#20183c',mist:.1},
 {sky:['#0e1430','#46598a','#f7dba4'],sun:{x:520,y:170,r:34,c:'#fff0c0'},layers:[['#5a6a98',170,34,.85],['#38466e',212,30,.95],['#1c2444',244,22,1]],snow:1,motif:'crag',seed:66,mist:.12},
 {sky:['#03100e','#0a3a30','#2bbf8d'],sun:{x:620,y:90,r:36,c:'#e8fff4'},stars:1,flies:1,layers:[['#0d4a3a',214,22,.8],['#082a22',240,18,1]],motif:'round',seed:77,mist:.1,mistc:'#aaffdd'},
 {sky:['#1a0904','#5a1a0a','#f0701a'],sun:null,layers:[['#3a1208',226,24,.9]],motif:'cave',ground:'#0d0503',glow:'#ff8a2e',fire:1,seed:88}
];
const HALO=['#ffd98a','#a8c4ff','#ff9a5a','#8affb0','#fff3c4','#ffc070','#8affd8','#ff9a6a'];
function classScene(c,t){return scene(Object.assign({},CT[c],{emblem:c,ex:140,sprite:{c,t:t==null?3:t,x:650,y:312,k:9,halo:HALO[c],hero:1},label:'Escena de la clase'}))}

/* ---------- biomas y lugares ---------- */
const PL={
 g:{n:'Llanuras de Chang\'an',s:'Donde empieza la Ruta: pasto, aldeas y mercaderes novatos.',o:{sky:['#183a6a','#5aa7e0','#ffe9b0'],sun:{x:620,y:110,r:30,c:'#fff7d0'},layers:[['#4a8a5a',226,16,.85],['#2a6a3a',250,12,1]],motif:'plain',ground:'#1f5a2e',seed:101}},
 f:{n:'Bosque de Jade',s:'Árboles verdes y cuevas húmedas. Hogar de elfas y arqueros.',o:{sky:['#06201a','#1d6a50','#9fe8b8'],sun:{x:540,y:90,r:28,c:'#f4fff0'},layers:[['#2a8a64',210,20,.8],['#14583f',236,16,1]],motif:'forest',seed:102,mist:.14,mistc:'#d8ffe9'}},
 s:{n:'Estepa de Gansu',s:'Praderas amarillas barridas por el viento.',o:{sky:['#2a3a6a','#d89a5a','#ffe0a0'],sun:{x:200,y:200,r:36,c:'#fff0c0'},layers:[['#c08a4a',228,14,.8],['#8a5e2e',252,12,1]],motif:'plain',ground:'#7a5a28',seed:103}},
 m:{n:'Cordillera Qilian',s:'Picos nevados y monasterios sin puertas.',o:{sky:['#0e1430','#46598a','#f7dba4'],sun:{x:620,y:130,r:30,c:'#fff0c0'},layers:[['#6a7aa8',160,36,.85],['#3a4676',204,30,.95],['#1c2444',240,22,1]],snow:1,motif:'crag',seed:104,mist:.14}},
 d:{n:'Desierto Taklamakán',s:'«Entra y no vuelvas»: el mar de arena que se traga caravanas.',o:{sky:['#2a0f2c','#c4563a','#ffcf7a'],sun:{x:470,y:215,r:52,c:'#fff0b0'},layers:[['#b0603a',240,10,.8]],motif:'dunes',caravan:1,ground:'#6a2a26',seed:105,mist:.05}},
 w:{n:'Pamir Helado',s:'Tierras de hielo y ventiscas eternas.',o:{sky:['#07122a','#2a4a8a','#bfe0ff'],sun:{x:300,y:90,r:22,c:'#ffffff'},layers:[['#8aa8d8',190,30,.8],['#5a78b0',224,24,.95],['#2a3f70',250,18,1]],snow:1,motif:'crag',stars:1,aurora:['#40ffb0','#6a8aff'],seed:106,mist:.18}},
 r:{n:'Cañones Malditos',s:'Roca roja y segadores. Aquí empieza lo peligroso.',o:{sky:['#1a0a1a','#7a2a2a','#e08a4a'],sun:{x:620,y:170,r:30,c:'#ffb070'},layers:[['#7a2a26',200,26,.9],['#4a1618',232,22,1]],motif:'crag',ground:'#2a0c10',seed:107,mist:.07,mistc:'#ffb090'}},
 a:{n:'Reino de Cenizas',s:'Tierra quemada, volcanes y los jefes más duros del mapa.',o:{sky:['#0a0810','#3a1a22','#c05a2a'],sun:null,layers:[['#2a1a1a',196,30,.9],['#160d0d',236,24,1]],motif:'crag',fire:1,seed:108,mist:.08,mistc:'#ff9a60'}}
};
const SP_={
 celest:{n:'Santuario Celestial',s:'En los extremos del mapa duermen el Caballo y el Buey Celestial.',o:{sky:['#05041a','#1a1a5a','#5a4ac0'],stars:1,celest:'#ffe08a',layers:[['#1a1a4a',224,18,.9],['#0b0b2a',250,14,1]],motif:'plain',ground:'#0a0a24',seed:201,mist:.1,mistc:'#a8a0ff'}},
 fire:{n:'Ignarax, el Devorador de Caminos',s:'Un dragón de fuego baja del cielo tres veces al mes.',o:{sky:['#12030a','#6a1408','#ff7a1a'],sun:{x:400,y:150,r:70,c:'#ff9a2e'},layers:[['#3a0f0a',210,28,.9],['#1c0805',244,22,1]],motif:'crag',fire:1,seed:202,mist:.1,mistc:'#ff7a30'}},
 ice:{n:'Glacius, la Tormenta Eterna',s:'El dragón de hielo que congela la Ruta.',o:{sky:['#04102a','#1a4a8a','#a8e0ff'],stars:1,aurora:['#40e0ff','#a080ff','#40ffb0'],layers:[['#4a78b8',200,28,.85],['#2a4a88',236,22,1]],snow:1,motif:'crag',seed:203,mist:.18,mistc:'#d8f0ff'}},
 tower:{n:'Torre del Lago',s:'600 pisos de piedra negra junto al agua. Nadie ha visto el final.',o:{sky:['#07061a','#2a2a6a','#8a8ae0'],stars:1,sun:{x:180,y:90,r:26,c:'#eef0ff'},layers:[['#1a1a48',216,22,.9]],motif:'tower',ground:'#0a1630',seed:204,mist:.1}},
 spider:{n:'Cueva de las Arañas',s:'Telarañas colgantes y la Reina de las Arañas al fondo.',o:{sky:['#06040c','#120a22','#241442'],layers:[],motif:'cave',glow:'#b06bff',webs:1,ground:'#07040c',seed:205}},
 abyss:{n:'Abismo del Lodo Negro',s:'Veinte pisos de lodo humeante y un Señor del Abismo.',o:{sky:['#030203','#120a10','#2a1220'],layers:[],motif:'cave',glow:'#40ffb0',ground:'#040203',seed:206,mist:.05,mistc:'#40ffb0'}},
 swamp:{n:'Pantano de las Serpientes',s:'Aguas bajas, cañaverales y un nido de víboras.',o:{sky:['#0a1a10','#2a4a2a','#8aa860'],stars:1,sun:{x:560,y:100,r:24,c:'#e8ffc0'},layers:[['#1f3a24',218,18,.9]],motif:'round',flies:1,seed:208,mist:.2,mistc:'#bfe8a0'}},
 bones:{n:'Catacumbas de los Huesos',s:'El Rey de los Huesos reina entre criptas húmedas.',o:{sky:['#0a0a12','#26263a','#6a6a8a'],layers:[['#1a1a2a',220,18,.9]],motif:'ruins',ground:'#0c0c16',seed:207,mist:.12,stars:1}}
};
function place(k){const p=PL[k]||SP_[k];return p?scene(Object.assign({label:p.n},p.o)):''}
function placeMeta(k){return PL[k]||SP_[k]}

window.ART={emblem,scene,classScene,place,placeMeta,PL,SP_,CT,sprite,SYM};
})();
