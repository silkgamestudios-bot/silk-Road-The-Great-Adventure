/* Héroes de Silk Road: sprites reales del juego (4 direcciones, 3 cuadros), cartas-slot y visor. */
(function(){
const W=window.WIKI,L=window.LORE,H=window.HEROES;if(!W||!H)return;
const CG=['#b8862a','#6b7c93','#b8442a','#3a8f4a','#e3d79a','#d8892a','#2f9f78','#a8552d'];
const ROM=['I','II','III','IV','V','VI','VII','VIII'];
const DIRS=[['down','⬇️','Frente'],['left','⬅️','Izquierda'],['up','⬆️','Espalda'],['right','➡️','Derecha']];
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SEQ=[0,1,0,2];
const img=(c,d,f,k,extra)=>'<img class="hs" src="'+H[c][d][f]+'" alt="'+esc(W.classes[c].n)+'" style="--k:'+(k||6)+'" data-hc="'+c+'" data-hd="'+d+'" '+(extra||'')+' draggable="false">';
function slot(c,o){o=o||{};const k=W.classes[c],lo=L?L.classes[c]:null;
  return '<button type="button" class="slot" data-hero="'+c+'" style="--cg:'+CG[c]+'" aria-label="Ver a '+esc(k.n)+'">'
   +'<i class="cn tl"></i><i class="cn tr"></i><i class="cn bl"></i><i class="cn br"></i>'
   +'<span class="sno">CLASE '+ROM[c]+'</span>'
   +'<span class="pedestal">'+img(c,'down',0,o.k||7,'data-anim="1"')+'</span>'
   +'<b class="snm">'+k.ic+' '+esc(k.n)+'</b>'
   +(lo?'<small class="stt">'+esc(lo.titulo)+'</small><em class="slm">'+esc(lo.lema)+'</em>':'<small class="stt">'+esc(k.skill_area)+'</small>')
   +'<span class="sgo">Ver héroe ›</span></button>';
}
/* animación global */
let tk=0;setInterval(()=>{tk++;const f=SEQ[tk%4];document.querySelectorAll('img.hs[data-anim]').forEach(e=>{const c=e.dataset.hc,d=e.dataset.hd;if(H[c]&&H[c][d])e.src=H[c][d][f]})},230);

/* visor */
let cur=0,dir='down',walk=true,tier=-1,root=null;
function build(){
  root=document.createElement('div');root.className='hv';root.id='hv';root.hidden=true;
  root.innerHTML='<div class="hv-bg"></div><div class="hv-card" role="dialog" aria-modal="true" aria-label="Visor de héroe"><button class="hv-x" aria-label="Cerrar">✕</button><div class="hv-body"></div></div>';
  document.body.appendChild(root);
  root.addEventListener('click',e=>{
    const t=e.target;
    if(t.classList.contains('hv-bg')||t.closest('.hv-x')){close();return}
    const d=t.closest('[data-dir]');if(d){dir=d.dataset.dir;paint();return}
    if(t.closest('[data-walk]')){walk=!walk;paint();return}
    const n=t.closest('[data-nav]');if(n){open((cur+(+n.dataset.nav)+8)%8,true);return}
    const ti=t.closest('[data-tier]');if(ti){tier=+ti.dataset.tier;paint();return}
  });
  addEventListener('keydown',e=>{if(root.hidden)return;if(e.key=='Escape')close();if(e.key=='ArrowRight')open((cur+1)%8,true);if(e.key=='ArrowLeft')open((cur+7)%8,true)});
}
function open(c,keep){if(!root)build();cur=c;if(!keep){dir='down';walk=true;tier=-1}root.hidden=false;document.body.classList.add('hv-open');paint()}
function close(){if(root){root.hidden=true;document.body.classList.remove('hv-open')}}
function bar(lab,val,max,txt){return '<div class="hst"><label>'+lab+'<b>'+txt+'</b></label><div class="hbar"><i style="width:'+Math.max(6,Math.min(100,100*val/max))+'%"></i></div></div>'}
function paint(){
  const c=cur,k=W.classes[c],lo=L?L.classes[c]:{titulo:'',lema:'',p:[],ideal:''};const mx=key=>Math.max(...W.classes.map(x=>x[key]));
  const sk=k.skins[tier>=0?tier:0];
  const wiki=(location.pathname.split('/').pop()||'').indexOf('Wiki')>-1||/wiki/i.test(location.pathname)?'#/clase/'+c:(window.SR_WIKI||'wiki.html')+'#/clase/'+c;
  const body=root.querySelector('.hv-body');
  body.style.setProperty('--cg',CG[c]);
  body.innerHTML=
   '<div class="hv-stage"><div class="hv-glow"></div><div class="hv-floor"></div>'
   +'<div class="hv-fig">'+(tier>=0?'<span class="spr" style="--c:'+c+';--t:'+tier+';--k:14"></span>':img(c,dir,0,14,walk?'data-wk="1"':''))+'</div>'
   +'<div class="hv-ctl"'+(tier>=0?' style="opacity:.4;pointer-events:none"':'')+'>'+DIRS.map(d=>'<button class="'+(d[0]==dir?'on':'')+'" data-dir="'+d[0]+'" title="'+d[2]+'">'+d[1]+'</button>').join('')+'<button class="'+(walk?'on':'')+'" data-walk="1" title="Animar">'+(walk?'⏸':'▶')+'</button></div>'
   +'<div class="hv-nav"><button data-nav="-1" aria-label="Anterior">‹</button><span>'+ROM[c]+' / VIII</span><button data-nav="1" aria-label="Siguiente">›</button></div></div>'
   +'<div class="hv-info"><div class="hv-ttl">'+esc(lo.titulo)+'</div><h2>'+k.ic+' '+esc(k.n)+'</h2><div class="hv-lema">'+esc(lo.lema)+'</div>'
   +'<p class="hv-d">'+esc(k.d)+'</p>'
   +'<div class="hv-stats">'+bar('Vida',k.hp,mx('hp'),k.hp)+bar('Daño',k.dm,mx('dm'),'×'+k.dm)+bar('Velocidad',k.sp,mx('sp'),k.sp)+bar('MP',k.mp,mx('mp'),k.mp)+bar('Alcance',k.rg||20,mx('rg'),k.rg?k.rg+' px':'Melee')+'</div>'
   +'<div class="hv-sk">'+k.skills.slice(0,6).map(s=>'<span title="'+esc(s.n+' · nv '+s.lv+' — '+s.d)+'">'+s.ic+'</span>').join('')+'<small>+'+(k.skills.length-6)+' habilidades</small></div>'
   +'<div class="hv-tiers"><button class="'+(tier<0?'on':'')+'" data-tier="-1" title="Héroe base"><img class="hs" src="'+H[c].down[0]+'" style="--k:3" alt=""><small>Base</small></button>'+k.skins.map((s,t)=>'<button class="'+(t==tier?'on':'')+'" data-tier="'+t+'" title="'+esc(s.n)+'"><span class="spr" style="--c:'+c+';--t:'+t+';--k:3"></span><small>'+esc(W.rar[t])+'</small></button>').join('')+'</div>'
   +(tier>=0?'<p class="hv-sn"><b>'+esc(sk.n)+'</b> · '+esc(W.rar[tier])+' · Armadura '+sk.ar+' · Def '+sk.df+'% · Crít '+sk.cr+'%</p>':'<p class="hv-sn">Héroe base, tal como empiezas en el juego. Prueba sus apariencias ↑</p>')
   +(lo.p&&lo.p.length?'<p class="hv-lore">'+lo.p[0]+'</p>':'')
   +'<a class="btn" href="'+wiki+'" data-wk-link="1">Leer su leyenda completa</a></div>';
  body.querySelector('.hv-info').scrollTop=0;
}
let wt=0;setInterval(()=>{if(!root||root.hidden)return;wt++;const e=root.querySelector('img[data-wk]');if(e){e.src=H[e.dataset.hc][e.dataset.hd][SEQ[wt%4]]}},230);
document.addEventListener('click',e=>{const s=e.target.closest&&e.target.closest('[data-hero]');if(!s)return;e.preventDefault();open(+s.dataset.hero)});
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('[data-wk-link]');if(a)close()});
window.HERO={slot,img,open,close,CG,ROM};
})();
