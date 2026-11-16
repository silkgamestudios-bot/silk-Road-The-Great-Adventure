/* Karavan Online · módulo compartido del sitio (portada y wiki) · v427
   - sprites reales del juego (atlas kv-spr.png / kv-ico.png)
   - cartas de héroe con luz y visor con su lore
   - música original del sitio con botón de silencio (recuerda tu elección)
   - cinta de Black Friday */
(function(){
'use strict';
const dc=s=>String(s).replace(/(\d)\.(\d{1,2})(?!\d)/g,'$1,$2'),dmf=v=>dc(v);   /* coma decimal (es): ×0,85 · 1,5 s (los grupos de miles con 3 cifras no se tocan) */
const CFG=window.KV_CONFIG={
  PLAY_URL:'play.html',
  /* Cinta de Black Friday (hora RD). Debe coincidir con la promo del juego (Zona GM › Gemas › 🔥 Promo). PROMO:null la oculta. */
  PROMO:{from:'2026-11-12T00:00:00-04:00',mid:'2026-11-26T00:00:00-04:00',to:'2026-12-01T00:00:00-04:00',p1:25,p2:100}
};
const KV=window.KV={},SPR={"adumbral-large-down-1":[0,24,24],"adumbral-large-down-2":[1,24,24],"adumbral-large-down-3":[2,24,24],"agonite-golem-down-1":[3,16,16],"agonite-golem-down-2":[4,16,16],"agonite-golem-down-3":[5,16,16],"an-camel-1":[6,16,16],"an-camel-2":[7,16,16],"an-cow-1":[8,16,16],"an-cow-2":[9,16,16],"an-deer-1":[10,16,16],"an-deer-2":[11,16,16],"an-dog-1":[12,16,16],"an-dog-2":[13,16,16],"an-falcon-1":[14,16,16],"an-falcon-2":[15,16,16],"an-goat-1":[16,16,16],"an-goat-2":[17,16,16],"an-horse-1":[18,16,16],"an-horse-2":[19,16,16],"an-jackal-1":[20,16,16],"an-jackal-2":[21,16,16],"an-lion-1":[22,16,16],"an-lion-2":[23,16,16],"an-nhorse-1":[24,16,16],"an-nhorse-2":[25,16,16],"an-owl-1":[26,16,16],"an-owl-2":[27,16,16],"an-scorp-1":[28,16,16],"an-scorp-2":[29,16,16],"an-sheep-1":[30,16,16],"an-sheep-2":[31,16,16],"an-whorse-1":[32,16,16],"an-whorse-2":[33,16,16],"an-wolf-1":[34,16,16],"an-wolf-2":[35,16,16],"an-wolfw-1":[36,16,16],"an-wolfw-2":[37,16,16],"anvil-1":[38,16,16],"assassin-down-1":[39,16,16],"assassin-down-2":[40,16,16],"assassin-down-3":[41,16,16],"bandit-1":[42,16,16],"bandit-2":[43,16,16],"bat-1":[44,16,16],"bat-2":[45,16,16],"blood-lord-down-1":[46,16,16],"blood-lord-down-2":[47,16,16],"blood-lord-down-3":[48,16,16],"bones-1":[49,16,16],"c0-down-1":[50,16,16],"c0-down-2":[51,16,16],"c0-down-3":[52,16,16],"c0-left-1":[53,16,16],"c0-left-2":[54,16,16],"c0-left-3":[55,16,16],"c0-right-1":[56,16,16],"c0-right-2":[57,16,16],"c0-right-3":[58,16,16],"c0-up-1":[59,16,16],"c0-up-2":[60,16,16],"c0-up-3":[61,16,16],"c1-down-1":[62,16,16],"c1-down-2":[63,16,16],"c1-down-3":[64,16,16],"c1-left-1":[65,16,16],"c1-left-2":[66,16,16],"c1-left-3":[67,16,16],"c1-right-1":[68,16,16],"c1-right-2":[69,16,16],"c1-right-3":[70,16,16],"c1-up-1":[71,16,16],"c1-up-2":[72,16,16],"c1-up-3":[73,16,16],"c2-down-1":[74,16,16],"c2-down-2":[75,16,16],"c2-down-3":[76,16,16],"c2-left-1":[77,16,16],"c2-left-2":[78,16,16],"c2-left-3":[79,16,16],"c2-right-1":[80,16,16],"c2-right-2":[81,16,16],"c2-right-3":[82,16,16],"c2-up-1":[83,16,16],"c2-up-2":[84,16,16],"c2-up-3":[85,16,16],"c3-down-1":[86,16,16],"c3-down-2":[87,16,16],"c3-down-3":[88,16,16],"c3-left-1":[89,16,16],"c3-left-2":[90,16,16],"c3-left-3":[91,16,16],"c3-right-1":[92,16,16],"c3-right-2":[93,16,16],"c3-right-3":[94,16,16],"c3-up-1":[95,16,16],"c3-up-2":[96,16,16],"c3-up-3":[97,16,16],"c4-down-1":[98,16,16],"c4-down-2":[99,16,16],"c4-down-3":[100,16,16],"c4-left-1":[101,16,16],"c4-left-2":[102,16,16],"c4-left-3":[103,16,16],"c4-right-1":[104,16,16],"c4-right-2":[105,16,16],"c4-right-3":[106,16,16],"c4-up-1":[107,16,16],"c4-up-2":[108,16,16],"c4-up-3":[109,16,16],"c5-down-1":[110,16,16],"c5-down-2":[111,16,16],"c5-down-3":[112,16,16],"c5-left-1":[113,16,16],"c5-left-2":[114,16,16],"c5-left-3":[115,16,16],"c5-right-1":[116,16,16],"c5-right-2":[117,16,16],"c5-right-3":[118,16,16],"c5-up-1":[119,16,16],"c5-up-2":[120,16,16],"c5-up-3":[121,16,16],"c6-down-1":[122,16,16],"c6-down-2":[123,16,16],"c6-down-3":[124,16,16],"c6-left-1":[125,16,16],"c6-left-2":[126,16,16],"c6-left-3":[127,16,16],"c6-right-1":[128,16,16],"c6-right-2":[129,16,16],"c6-right-3":[130,16,16],"c6-up-1":[131,16,16],"c6-up-2":[132,16,16],"c6-up-3":[133,16,16],"c7-down-1":[134,16,16],"c7-down-2":[135,16,16],"c7-down-3":[136,16,16],"c7-left-1":[137,16,16],"c7-left-2":[138,16,16],"c7-left-3":[139,16,16],"c7-right-1":[140,16,16],"c7-right-2":[141,16,16],"c7-right-3":[142,16,16],"c7-up-1":[143,16,16],"c7-up-2":[144,16,16],"c7-up-3":[145,16,16],"candle-1":[146,16,16],"candle-2":[147,16,16],"chest":[148,16,16],"clay-oven-1":[149,16,16],"crypt-warden-down-1":[150,16,16],"crypt-warden-down-2":[151,16,16],"crypt-warden-down-3":[152,16,16],"cupid-1":[153,16,16],"cupid-2":[154,16,16],"dungium-golem-down-1":[155,16,16],"dungium-golem-down-2":[156,16,16],"dungium-golem-down-3":[157,16,16],"elf-1":[158,16,16],"elf-2":[159,16,16],"fire-elemental-1":[160,16,16],"fire-elemental-2":[161,16,16],"ghost-1":[162,16,16],"ghost-2":[163,16,16],"goblin-down-1":[164,16,18],"goblin-down-2":[165,16,18],"goblin-down-3":[166,16,18],"iron-golem-down-1":[167,16,16],"iron-golem-down-2":[168,16,16],"iron-golem-down-3":[169,16,16],"iron-rocks-1":[170,16,16],"jack-1":[171,16,16],"jack-2":[172,16,16],"lion-1":[173,16,16],"lion-2":[174,16,16],"mn-croc-1":[175,16,16],"mn-croc-2":[176,16,16],"mn-lam2-1":[177,16,16],"mn-lam2-2":[178,16,16],"mn-lami-1":[179,16,16],"mn-lami-2":[180,16,16],"mn-medu-1":[181,16,16],"mn-medu-2":[182,16,16],"mn-mino-1":[183,16,16],"mn-mino-2":[184,16,16],"mn-were-1":[185,16,16],"mn-were-2":[186,16,16],"mn-worm-1":[187,16,16],"mn-worm-2":[188,16,16],"mn-wormb-1":[189,16,16],"mn-wormb-2":[190,16,16],"mn-wormg-1":[191,16,16],"mn-wormg-2":[192,16,16],"mn-wormr-1":[193,16,16],"mn-wormr-2":[194,16,16],"mn-wormy-1":[195,16,16],"mn-wormy-2":[196,16,16],"mummy-down-1":[197,16,16],"mummy-down-2":[198,16,16],"mummy-down-3":[199,16,16],"noctis-golem-down-1":[200,16,16],"noctis-golem-down-2":[201,16,16],"noctis-golem-down-3":[202,16,16],"orc-1":[203,16,16],"orc-2":[204,16,16],"orc-berserker-1":[205,16,16],"orc-berserker-2":[206,16,16],"pharaoh-down-1":[207,16,16],"pharaoh-down-2":[208,16,16],"pharaoh-down-3":[209,16,16],"raider-1":[210,16,16],"raider-2":[211,16,16],"rat-1":[212,16,16],"rat-2":[213,16,16],"reap-1":[214,16,16],"reap-2":[215,16,16],"reno-1":[216,16,16],"reno-2":[217,16,16],"ruler-1":[218,16,16],"ruler-2":[219,16,16],"sc-1":[220,16,16],"sc-2":[221,16,16],"scb-1":[222,16,16],"scb-2":[223,16,16],"silk-1":[224,16,16],"silk-2":[225,16,16],"skel-1":[226,16,16],"skel-2":[227,16,16],"snake-1":[228,16,16],"snake-2":[229,16,16],"snowscamp-down-1":[230,17,17],"snowscamp-down-2":[231,17,17],"snowscamp-down-3":[232,17,17],"sp-1":[233,16,16],"sp-2":[234,16,16],"spx1-1":[235,16,16],"spx1-2":[236,16,16],"spx2-1":[237,16,16],"spx2-2":[238,16,16],"spx3-1":[239,16,16],"spx3-2":[240,16,16],"spx4-1":[241,16,16],"spx4-2":[242,16,16],"spx5-1":[243,16,16],"spx5-2":[244,16,16],"spx6-1":[245,16,16],"spx6-2":[246,16,16],"thief-1":[247,16,16],"thief-2":[248,16,16],"tomb-1":[249,16,16],"trader-basic-1":[250,16,16],"trader-basic-2":[251,16,16],"trader-priest-1":[252,16,16],"trader-priest-2":[253,16,16],"tw-b0a-1":[254,16,16],"tw-b0a-2":[255,16,16],"tw-b0b-1":[256,16,16],"tw-b0b-2":[257,16,16],"tw-b0c-1":[258,16,16],"tw-b0c-2":[259,16,16],"tw-b0d-1":[260,16,16],"tw-b0d-2":[261,16,16],"tw-b0e-1":[262,16,16],"tw-b0e-2":[263,16,16],"tw-b0f-1":[264,16,16],"tw-b0f-2":[265,16,16],"tw-b1a-1":[266,16,16],"tw-b1a-2":[267,16,16],"tw-b1b-1":[268,16,16],"tw-b1b-2":[269,16,16],"tw-b1c-1":[270,16,16],"tw-b1c-2":[271,16,16],"tw-b1d-1":[272,16,16],"tw-b1d-2":[273,16,16],"tw-b1e-1":[274,16,16],"tw-b1e-2":[275,16,16],"tw-b1f-1":[276,16,16],"tw-b1f-2":[277,16,16],"tw-b2a-1":[278,16,16],"tw-b2a-2":[279,16,16],"tw-b2b-1":[280,16,16],"tw-b2b-2":[281,16,16],"tw-b2c-1":[282,16,16],"tw-b2c-2":[283,16,16],"tw-b2d-1":[284,16,16],"tw-b2d-2":[285,16,16],"tw-b2e-1":[286,16,16],"tw-b2e-2":[287,16,16],"tw-b2f-1":[288,16,16],"tw-b2f-2":[289,16,16],"tw-b3a-1":[290,16,16],"tw-b3a-2":[291,16,16],"tw-b3b-1":[292,16,16],"tw-b3b-2":[293,16,16],"tw-b3c-1":[294,16,16],"tw-b3c-2":[295,16,16],"tw-b3d-1":[296,16,16],"tw-b3d-2":[297,16,16],"tw-b3e-1":[298,16,16],"tw-b3e-2":[299,16,16],"tw-b3f-1":[300,16,16],"tw-b3f-2":[301,16,16],"tw-b4a-1":[302,16,16],"tw-b4a-2":[303,16,16],"tw-b4b-1":[304,16,16],"tw-b4b-2":[305,16,16],"tw-b4c-1":[306,16,16],"tw-b4c-2":[307,16,16],"tw-b4d-1":[308,16,16],"tw-b4d-2":[309,16,16],"tw-b4e-1":[310,16,16],"tw-b4e-2":[311,16,16],"tw-b4f-1":[312,16,16],"tw-b4f-2":[313,16,16],"tw-b5a-1":[314,16,16],"tw-b5a-2":[315,16,16],"tw-b5b-1":[316,16,16],"tw-b5b-2":[317,16,16],"tw-b5c-1":[318,16,16],"tw-b5c-2":[319,16,16],"tw-b5d-1":[320,16,16],"tw-b5d-2":[321,16,16],"tw-b5e-1":[322,16,16],"tw-b5e-2":[323,16,16],"tw-b5f-1":[324,16,16],"tw-b5f-2":[325,16,16],"tw-g600-1":[326,16,16],"tw-g600-2":[327,16,16],"tw-n0-1":[328,16,16],"tw-n0-2":[329,16,16],"tw-n1-1":[330,16,16],"tw-n1-2":[331,16,16],"tw-n2-1":[332,16,16],"tw-n2-2":[333,16,16],"tw-n3-1":[334,16,16],"tw-n3-2":[335,16,16],"tw-n4-1":[336,16,16],"tw-n4-2":[337,16,16],"tw-n5-1":[338,16,16],"tw-n5-2":[339,16,16],"vampire-down-1":[340,16,16],"vampire-down-2":[341,16,16],"vampire-down-3":[342,16,16],"web-1":[343,16,16],"workbench-1":[344,16,16],"zomb-1":[345,16,16],"zomb-2":[346,16,16],"zs-z0-1":[347,16,16],"zs-z0-2":[348,16,16],"zs-z1-1":[349,16,16],"zs-z1-2":[350,16,16],"zs-z10-1":[351,16,16],"zs-z10-2":[352,16,16],"zs-z11-1":[353,16,16],"zs-z11-2":[354,16,16],"zs-z2-1":[355,16,16],"zs-z2-2":[356,16,16],"zs-z3-1":[357,16,16],"zs-z3-2":[358,16,16],"zs-z4-1":[359,16,16],"zs-z4-2":[360,16,16],"zs-z5-1":[361,16,16],"zs-z5-2":[362,16,16],"zs-z6-1":[363,16,16],"zs-z6-2":[364,16,16],"zs-z7-1":[365,16,16],"zs-z7-2":[366,16,16],"zs-z8-1":[367,16,16],"zs-z8-2":[368,16,16],"zs-z9-1":[369,16,16],"zs-z9-2":[370,16,16]};
const $=(s,r)=>(r||document).querySelector(s),$$=(s,r)=>[...(r||document).querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
KV.esc=esc;KV.dc=dc;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- sprites del juego ---------- */
KV.spXY=n=>{const a=SPR[n];return a?{x:a[0]%40,y:(a[0]/40)|0,w:a[1],h:a[2]}:null};
KV.sp=(n,k,extra,cls)=>{const a=KV.spXY(n);if(!a)return '';return '<i class="sp'+(cls?' '+cls:'')+'" style="--x:'+a.x+';--y:'+a.y+';--w:'+a.w+';--h:'+a.h+(k?';--k:'+k:'')+'" '+(extra||'')+' aria-hidden="true"></i>'};
KV.ic=(i,k,extra,cls)=>i==null?'':'<i class="ic'+(cls?' '+cls:'')+'" style="--x:'+(i%40)+';--y:'+((i/40)|0)+(k?';--k:'+k:'')+'" '+(extra||'')+' aria-hidden="true"></i>';
/* v427 · bestiario nuevo del juego: monstruos de 48×72 (kv-mobs.png: 9 tipos × 3 cuadros) y dragones de 120×120 (8 × 3 cuadros) */
KV.mb=(i,k,extra)=>'<i class="mbx" style="--i:'+i+';--f:0;--k:'+(k||1.5)+'" data-mb="1" '+(extra||'')+' aria-hidden="true"></i>';
KV.dz=(i,k,extra)=>'<i class="dzx" style="--i:'+i+';--f:1;--k:'+(k||1)+'" data-dz="1" '+(extra||'')+' aria-hidden="true"></i>';
const SEQ=[1,2,1,3],DZQ=[1,0,1,2];let tk=0;
function tick(){tk++;const f=SEQ[tk%4];$$('[data-an]').forEach(e=>{const a=KV.spXY(e.dataset.an+'-'+f);if(a){e.style.setProperty('--x',a.x);e.style.setProperty('--y',a.y)}});
 $$('[data-mb]').forEach(e=>e.style.setProperty('--f',f-1));$$('[data-dz]').forEach(e=>e.style.setProperty('--f',DZQ[tk%4]))}
if(!reduce)setInterval(()=>{if(!document.hidden)tick()},230);

/* ---------- héroes ---------- */
const CG=['#ffc233','#58a6ff','#ff4d5e','#35d6d0','#ffe680','#b07bff','#3ddc84','#ff8a3d'];
const ROM=['I','II','III','IV','V','VI','VII','VIII'];
const DIRS=[['down','⬇️','Frente'],['left','⬅️','Izquierda'],['up','⬆️','Espalda'],['right','➡️','Derecha']];
KV.CG=CG;KV.ROM=ROM;
const W=()=>window.WIKI,L=()=>window.LORE;
KV.heroCard=function(c){
  const w=W(),l=L();if(!w||!l)return '';const k=w.classes[c],lo=l.classes[c];const mx=key=>Math.max(...w.classes.map(x=>x[key]));
  const bar=(lab,v,m,txt)=>'<span><span class="lb">'+lab+'<b>'+txt+'</b></span><span class="mb"><i style="width:'+Math.max(8,Math.min(100,100*v/m))+'%"></i></span></span>';
  return '<button type="button" class="hc" data-hero="'+c+'" style="--cg:'+CG[c]+'" aria-label="Ver la leyenda de '+esc(k.n)+'">'
   +'<span class="fx"><i></i><i></i><i></i><i></i><i></i><i></i></span><i class="cn tl"></i><i class="cn tr"></i><i class="cn bl"></i><i class="cn br"></i>'
   +'<span class="no">CLASE '+ROM[c]+'</span>'
   +'<span class="ped">'+KV.sp('c'+c+'-down-1',7,'data-an="c'+c+'-down"')+'</span>'
   +'<span class="nme">'+esc(k.n)+'</span><span class="ttl">'+esc(lo.titulo)+'</span><span class="lm">'+esc(lo.lema)+'</span>'
   +'<span class="mini">'+bar('Vida',k.hp,mx('hp'),k.hp)+bar('Daño',k.dm,mx('dm'),'×'+dmf(k.dm))+bar('Veloc.',k.sp,mx('sp'),k.sp)+bar('Maná',k.mp,mx('mp'),k.mp)+'</span>'
   +'<span class="sks">'+k.skills.slice(0,5).map(s=>'<span title="'+esc(s.n)+'">'+s.ic+'</span>').join('')+'</span>'
   +'<span class="go">Ver leyenda</span></button>';
};
let cur=0,dir='down',walk=true,tier=-1,root=null,lastFocus=null;
function buildHV(){
  root=document.createElement('div');root.className='hv';root.hidden=true;
  root.innerHTML='<div class="hv-bg"></div><div class="hv-card" role="dialog" aria-modal="true" aria-label="Leyenda del héroe"><button class="hv-x" aria-label="Cerrar">✕</button><div class="hv-body"></div></div>';
  document.body.appendChild(root);
  root.addEventListener('click',e=>{
    const t=e.target;
    if(t.classList.contains('hv-bg')||t.closest('.hv-x')){closeHV();return}
    const d=t.closest('[data-dir]');if(d){dir=d.dataset.dir;walk=true;paint(true);return}
    if(t.closest('[data-walk]')){walk=!walk;paint(true);return}
    const n=t.closest('[data-nav]');if(n){openHV((cur+(+n.dataset.nav)+8)%8,true);return}
    const ti=t.closest('[data-tier]');if(ti){tier=+ti.dataset.tier;paint(true);return}
    if(t.closest('[data-wk-link]'))closeHV();
  });
  let sx=0,sy=0;
  root.addEventListener('touchstart',e=>{const t=e.changedTouches[0];sx=t.clientX;sy=t.clientY},{passive:true});
  root.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.6&&!e.target.closest('.hv-info'))openHV((cur+(dx<0?1:7))%8,true)},{passive:true});
  addEventListener('keydown',e=>{if(root.hidden)return;if(e.key==='Escape')closeHV();else if(e.key==='ArrowRight')openHV((cur+1)%8,true);else if(e.key==='ArrowLeft')openHV((cur+7)%8,true);else if(e.key==='Tab'){const f=$$('button,a[href]',root).filter(x=>x.offsetParent!==null);if(!f.length)return;const a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
}
function openHV(c,keep){if(!root)buildHV();if(!keep){dir='down';walk=true;tier=-1;lastFocus=document.activeElement}cur=c;root.hidden=false;document.body.classList.add('hv-open');paint();if(!keep){const x=$('.hv-x',root);x&&x.focus()}}
function closeHV(){if(!root)return;root.hidden=true;document.body.classList.remove('hv-open');try{lastFocus&&lastFocus.focus&&lastFocus.focus()}catch(e){}}
KV.hero={open:openHV,close:closeHV};
function hbar(lab,val,max,txt){return '<div class="hst"><label>'+lab+'<b>'+txt+'</b></label><div class="hbar"><i style="width:'+Math.max(6,Math.min(100,100*val/max))+'%"></i></div></div>'}
function paint(soft){
  const w=W(),l=L(),c=cur,k=w.classes[c],lo=l.classes[c];const mx=key=>Math.max(...w.classes.map(x=>x[key]));
  const sk=tier>=0?k.skins[tier]:null;
  const body=$('.hv-body',root);const card=$('.hv-card',root);card.style.setProperty('--cg',CG[c]);
  const onWiki=/wiki/i.test(location.pathname);
  const wl=(onWiki?'':'wiki.html')+'#/clase/'+c;
  const fig=tier>=0?'<span class="spr" style="--c:'+c+';--t:'+tier+';--k:14"></span>':KV.sp('c'+c+'-'+dir+'-1',14,walk?'data-an="c'+c+'-'+dir+'"':'');
  const keepScroll=soft&&$('.hv-info',root)?$('.hv-info',root).scrollTop:0;
  body.innerHTML=
   '<div class="hv-stage"><div class="hv-fig">'+fig+'</div>'
   +'<div class="hv-ctl"'+(tier>=0?' style="opacity:.4;pointer-events:none"':'')+'>'+DIRS.map(d=>'<button class="'+(d[0]===dir?'on':'')+'" data-dir="'+d[0]+'" title="'+d[2]+'" aria-label="'+d[2]+'">'+d[1]+'</button>').join('')+'<button class="'+(walk?'on':'')+'" data-walk="1" title="Animar" aria-label="Animar">'+(walk?'⏸':'▶')+'</button></div>'
   +'<div class="hv-nav"><button data-nav="-1" aria-label="Héroe anterior">‹</button><span>'+ROM[c]+' / VIII</span><button data-nav="1" aria-label="Héroe siguiente">›</button></div></div>'
   +'<div class="hv-info"><div class="hv-ttl">'+esc(lo.titulo)+'</div><h2>'+k.ic+' '+esc(k.n)+'</h2><div class="hv-lema">'+esc(lo.lema)+'</div>'
   +'<p class="hv-d">'+esc(dc(k.d))+'</p>'
   +'<div class="hv-sec">Su leyenda</div><div class="hv-lore">'+lo.p.map(t=>'<p>'+t+'</p>').join('')+'</div>'
   +(lo.ideal?'<div class="hv-ideal">'+esc(lo.ideal)+'</div>':'')
   +'<div class="hv-sec">Atributos</div><div class="hv-stats">'+hbar('Vida',k.hp,mx('hp'),k.hp)+hbar('Daño',k.dm,mx('dm'),'×'+dmf(k.dm))+hbar('Veloc.',k.sp,mx('sp'),k.sp)+hbar('Maná',k.mp,mx('mp'),k.mp)+hbar('Alcance',k.rg||20,mx('rg'),k.rg?k.rg+' px':'Melee')+hbar('Área de skill',1,1,esc(k.skill_area))+'</div>'
   +'<div class="hv-sec">Habilidades ('+k.skills.length+')</div><div class="hv-sk">'+k.skills.map(s=>'<div title="'+esc(dc(s.d))+'"><span>'+s.ic+'</span><i><b>'+esc(s.n)+'</b><small>Nivel '+s.lv+' · '+s.mp+' MP</small></i></div>').join('')+'</div>'
   +'<div class="hv-sec">Apariencias</div><div class="hv-tiers"><button class="'+(tier<0?'on':'')+'" data-tier="-1" title="Héroe base">'+KV.sp('c'+c+'-down-1',3)+'<small>Base</small></button>'+k.skins.map((s,t)=>'<button class="'+(t===tier?'on':'')+'" data-tier="'+t+'" title="'+esc(s.n)+'"><span class="spr" style="--c:'+c+';--t:'+t+';--k:3"></span><small>'+esc(w.rar[t])+'</small></button>').join('')+'</div>'
   +(sk?'<p class="hv-sn"><b>'+esc(sk.n)+'</b> · '+esc(w.rar[tier])+' · Armadura '+sk.ar+' · Def '+sk.df+'% · Crít '+sk.cr+'%</p>':'<p class="hv-sn">Héroe base, tal como empiezas en el juego. Prueba sus apariencias ↑</p>')
   +'<div class="hv-act"><a class="btn btn-sm" href="'+wl+'" data-wk-link="1">📖 Leyenda completa en la wiki</a><a class="btn btn-gold btn-sm" href="'+CFG.PLAY_URL+'">⚔ Jugar</a></div></div>';
  if(soft&&keepScroll)$('.hv-info',root).scrollTop=keepScroll;
}
document.addEventListener('click',e=>{const s=e.target.closest&&e.target.closest('[data-hero]');if(!s)return;e.preventDefault();openHV(+s.dataset.hero)});

/* ---------- lightbox ---------- */
document.addEventListener('click',e=>{
  const s=e.target.closest&&e.target.closest('.shot');if(!s)return;const lb=$('#lb');if(!lb)return;
  const m=s.querySelector('img,svg');if(!m)return;
  if(m.tagName==='IMG'){const big=m.dataset.big||m.currentSrc||m.src;lb.innerHTML='<img src="'+big+'" alt="">'}else lb.innerHTML=m.outerHTML;
  lb.classList.add('on');
});
document.addEventListener('DOMContentLoaded',()=>{
  const lb=$('#lb');if(lb){lb.addEventListener('click',()=>lb.classList.remove('on'));addEventListener('keydown',e=>{if(e.key==='Escape')lb.classList.remove('on')})}
  const mn=$('.menu-btn'),sd=$('.side');if(mn&&sd)mn.addEventListener('click',()=>sd.classList.toggle('open'));
  tick();
});

/* ---------- cinta de Black Friday ---------- */
KV.promoBar=function(){
  const old=document.getElementById('bfr');if(old)old.remove();document.documentElement.style.setProperty('--promo','0px');
  const p=CFG.PROMO;if(!p)return;const a=Date.parse(p.from),m=Date.parse(p.mid),z=Date.parse(p.to);if(!(a&&z))return;
  const n=Date.now();if(n>=z||a-n>21*864e5)return;
  const MS=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'],dd=t=>{const d=new Date(t-4*36e5);return d.getUTCDate()+' '+MS[d.getUTCMonth()]};
  const pc=q=>q==100?'¡el DOBLE de gemas!':'+'+q+'% de gemas';
  const t=n<a?'🔥 BLACK FRIDAY en Karavan Online · del '+dd(a)+' al '+dd(z-1)+': bono de gemas en cada compra'+(p.p2?' (¡hasta el doble!)':''):
    (m&&n>=m)?'🔥 BLACK FRIDAY · '+pc(p.p2)+' hasta el '+dd(z-1):
    '🔥 BLACK FRIDAY · '+pc(p.p1)+' hasta el '+dd((m||z)-1)+(m&&p.p2?' · del '+dd(m)+': '+pc(p.p2):'');
  const e=document.createElement('a');e.id='bfr';e.className='bfr';e.href=CFG.PLAY_URL;e.textContent=t;document.body.insertBefore(e,document.body.firstChild);
  const hh=()=>document.documentElement.style.setProperty('--promo',e.offsetHeight+'px');hh();addEventListener('resize',hh);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(hh);
};
document.addEventListener('DOMContentLoaded',KV.promoBar);

/* ---------- música original del sitio: «Caravana de Oro» ---------- */
(function(){
  const K='sr_site_music',SRC='audio/karavan-caravana-de-oro.mp3',VOL=.62;
  let off=false,pos=0;try{off=localStorage.getItem(K)==='off';pos=+localStorage.getItem(K+'_t')||0}catch(e){}
  let a=null,fadeT=0,blob=0,lastSave=0,tip=null;
  const btn=document.createElement('button');btn.id='kvm';btn.type='button';
  btn.innerHTML='<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="tx"></span>';
  const tx=btn.querySelector('.tx');
  const playing=()=>a&&!a.paused&&!a.ended;
  function ui(){
    const on=playing()&&!off;
    btn.classList.toggle('on',on);btn.classList.toggle('mute',off);btn.classList.toggle('wait',!on&&!off);
    tx.textContent=on?'Música':off?'Silenciada':'Activar música';
    btn.setAttribute('aria-pressed',on?'true':'false');
    btn.setAttribute('aria-label',on?'Silenciar la música':'Activar la música de Karavan Online');
    btn.title=on?'Silenciar la música':'Activar la música';
    if(tip&&(on||off)){tip.remove();tip=null}
  }
  function fade(to,ms,done){clearInterval(fadeT);if(!a){done&&done();return}const from=a.volume,t0=performance.now();fadeT=setInterval(()=>{const q=Math.min(1,(performance.now()-t0)/ms);try{a.volume=Math.max(0,Math.min(1,from+(to-from)*q))}catch(e){}if(q>=1){clearInterval(fadeT);done&&done()}},40)}
  function ensure(){
    if(a)return a;
    a=new Audio();a.loop=true;a.preload='auto';a.volume=0;a.setAttribute('playsinline','');a.src=SRC;
    a.addEventListener('loadedmetadata',()=>{try{if(pos>1&&isFinite(a.duration)&&a.currentTime<1)a.currentTime=pos%Math.max(1,a.duration-1)}catch(e){}},{once:true});
    a.addEventListener('playing',ui);a.addEventListener('pause',ui);
    a.addEventListener('timeupdate',()=>{const n=Date.now();if(n-lastSave>4000){lastSave=n;try{localStorage.setItem(K+'_t',String(Math.floor(a.currentTime||0)))}catch(e){}}});
    a.addEventListener('error',()=>{if(blob)return;blob=1;fetch(SRC).then(r=>r.blob()).then(b=>{a.src=URL.createObjectURL(b);if(!off)return a.play()}).then(()=>fade(VOL,1500)).catch(()=>{})});
    try{if('mediaSession' in navigator){navigator.mediaSession.metadata=new MediaMetadata({title:'Caravana de Oro',artist:'Silk Games Studios',album:'Karavan Online',artwork:[{src:'icon-192.png',sizes:'192x192',type:'image/png'}]});navigator.mediaSession.setActionHandler('play',()=>toggle(true));navigator.mediaSession.setActionHandler('pause',()=>toggle(false))}}catch(e){}
    return a;
  }
  function start(){
    if(off)return Promise.resolve(false);
    ensure();
    let p;try{p=a.play()}catch(e){return Promise.resolve(false)}
    return (p&&p.then?p:Promise.resolve()).then(()=>{fade(VOL,1600);ui();return true}).catch(()=>{ui();return false});
  }
  function stop(user){
    if(user){off=true;try{localStorage.setItem(K,'off')}catch(e){}}
    fade(0,320,()=>{try{a&&a.pause()}catch(e){}ui()});ui();
  }
  function toggle(want){
    const on=playing()&&!off;
    if(want===undefined)want=!on;
    if(want){off=false;try{localStorage.setItem(K,'on')}catch(e){}start().then(ok=>{if(!ok)ui()})}else stop(true);
  }
  btn.addEventListener('click',e=>{e.stopPropagation();toggle()});
  /* los navegadores no dejan sonar solos: arranca con el primer toque o tecla (si no la silenciaste antes) */
  const evs=['pointerup','touchend','click','keydown'];
  function first(e){
    if(e&&e.target&&e.target.closest&&e.target.closest('#kvm'))return;
    if(e&&e.type==='keydown'&&(e.key==='Tab'||e.key==='Shift'))return;
    if(off){evs.forEach(v=>removeEventListener(v,first,true));return}
    start().then(ok=>{if(ok)evs.forEach(v=>removeEventListener(v,first,true))});
  }
  evs.forEach(v=>addEventListener(v,first,true));
  addEventListener('pagehide',()=>{try{if(a)localStorage.setItem(K+'_t',String(Math.floor(a.currentTime||0)))}catch(e){}});
  document.addEventListener('visibilitychange',()=>{if(!a)return;if(document.hidden){try{a.pause()}catch(e){}}else if(!off&&a.currentTime>0){start()}});
  document.addEventListener('DOMContentLoaded',()=>{
    document.body.appendChild(btn);ui();
    if(!off){tip=document.createElement('div');tip.id='kvm-tip';tip.textContent='🎵 Toca en cualquier parte para escuchar la música del reino';document.body.appendChild(tip);setTimeout(()=>{if(tip){tip.remove();tip=null}},9000)}
  });
  KV.music={toggle,isOn:()=>playing()&&!off,start,stop};
})();
})();
