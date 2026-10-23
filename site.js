/* Portada: cuenta regresiva, botón JUGAR bloqueado, estrellas y fuegos de apertura. */
(function(){
const C=window.SR_CONFIG||{};
let launch=Date.parse(C.LAUNCH_AT)||0,off=0,synced=0;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const local=/^(localhost|127\.|0\.0\.0\.0|)$/.test(location.hostname);
const sim=local?+(new URLSearchParams(location.search).get('sim')||0):0;
if(sim){launch=Date.now()+sim*1000}
const now=()=>Date.now()+off;
const pad=n=>String(n).padStart(2,'0');

/* hora del servidor (evita que alguien adelante su reloj) */
async function sync(){
  if(sim)return;
  try{
    const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),3500);
    const r=await fetch((C.SERVER_URL||'')+'/launch',{signal:ctl.signal,cache:'no-store'});clearTimeout(to);
    const j=await r.json();
    if(j&&j.now){off=j.now-Date.now();launch=j.at||(j.now-1);synced=1}
  }catch(e){}
}

let live=false,last=[];
function setNum(id,v){const el=document.getElementById(id);if(!el)return;if(el.textContent!==v){el.textContent=v;el.classList.remove('tick');void el.offsetWidth;el.classList.add('tick')}}
function tick(){
  const ms=launch-now();
  if(ms<=0){if(!live)goLive();return}
  const s=Math.floor(ms/1000),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),x=s%60;
  setNum('cd-d',pad(d));setNum('cd-h',pad(h));setNum('cd-m',pad(m));setNum('cd-s',pad(x));
  const bar=$('#cd-bar i');if(bar){const total=Math.max(1,launch-(window.__t0||launch-864e5));bar.style.width=Math.min(100,Math.max(0,100*(1-ms/total)))+'%'}
  $$('[data-eta]').forEach(e=>e.textContent=(d?d+' d ':'')+pad(h)+':'+pad(m)+':'+pad(x));
}
function lock(on){
  $$('[data-play]').forEach(a=>{
    a.setAttribute('aria-disabled',on?'true':'false');
    a.classList.toggle('locked',on);
    if(on){a.removeAttribute('href');a.setAttribute('role','button')}else{a.setAttribute('href',C.PLAY_URL||'play.html');a.removeAttribute('role')}
    const t=a.querySelector('[data-lbl]');if(t)t.textContent=on?(a.dataset.lock||'🔒 Jugar'):(a.dataset.go||'⚔️ Jugar ahora');
  });
}
function goLive(){
  live=true;document.body.classList.add('live');lock(false);
  const l=$('#cd-label');if(l)l.textContent='¡El reino está abierto!';
  const h=$('#play-hint');if(h)h.textContent='La Gran Ruta te espera. Entra con tu cuenta.';
  boom();
}
function whenText(){
  const el=$('#cd-when');if(!el||!launch)return;
  const d=new Date(launch);
  let loc='';try{loc=d.toLocaleString('es',{weekday:'long',day:'numeric',month:'long',hour:'numeric',minute:'2-digit',timeZoneName:'short'})}catch(e){}
  el.innerHTML='Apertura: <b>viernes 23 de octubre · 8:00 PM</b> ('+(C.TZ_LABEL||'hora RD')+')'+(loc?'<br><small>En tu zona: '+loc+'</small>':'');
}

/* estrellas */
function stars(){
  const cv=$('#stars');if(!cv)return;const g=cv.getContext('2d');let w,h,S=[];
  const rs=()=>{w=cv.width=cv.offsetWidth;h=cv.height=cv.offsetHeight;S=Array.from({length:Math.round(w*h/5200)},()=>({x:Math.random()*w,y:Math.random()*h*.8,r:Math.random()*1.4+.2,p:Math.random()*6.28,v:.4+Math.random()*1.4}))};
  rs();addEventListener('resize',rs);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  (function f(t){g.clearRect(0,0,w,h);for(const s of S){const a=.35+.65*Math.abs(Math.sin(s.p+t/1000*s.v));g.fillStyle='rgba(255,244,214,'+a+')';g.beginPath();g.arc(s.x,s.y,s.r,0,7);g.fill()}if(!reduce)requestAnimationFrame(f)})(0);
}

/* fuegos de apertura */
function boom(){
  const cv=document.createElement('canvas');cv.id='boom';document.body.appendChild(cv);const g=cv.getContext('2d');
  cv.width=innerWidth;cv.height=innerHeight;const P=[],cols=['#ffd97a','#ffb02e','#ff5a3a','#fff3c4','#e6b64f'];
  const burst=(x,y)=>{for(let i=0;i<70;i++){const a=Math.random()*6.283,v=2+Math.random()*6;P.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,c:cols[i%5],r:1.5+Math.random()*2.4})}};
  [0,350,700,1100,1500].forEach((t,i)=>setTimeout(()=>burst(innerWidth*(.2+.15*i+Math.random()*.1),innerHeight*(.25+Math.random()*.25)),t));
  (function f(){g.clearRect(0,0,cv.width,cv.height);for(const p of P){p.x+=p.vx;p.y+=p.vy;p.vy+=.06;p.vx*=.985;p.l-=.011;g.globalAlpha=Math.max(0,p.l);g.fillStyle=p.c;g.beginPath();g.arc(p.x,p.y,p.r,0,7);g.fill()}g.globalAlpha=1;if(P.some(p=>p.l>0)||performance.now()<window.__b+2200)requestAnimationFrame(f);else cv.remove()})();window.__b=performance.now();
}

document.addEventListener('click',e=>{
  const a=e.target.closest&&e.target.closest('[data-play]');
  if(a&&a.getAttribute('aria-disabled')==='true'){e.preventDefault();a.classList.remove('shake');void a.offsetWidth;a.classList.add('shake');
    const h=$('#play-hint');if(h){const ms=launch-now(),s=Math.max(0,Math.floor(ms/1000));h.textContent='Aún no abre el reino. Faltan '+(Math.floor(s/3600)?Math.floor(s/3600)+' h ':'')+pad(Math.floor(s%3600/60))+' min '+pad(s%60)+' s.'}}
});
document.addEventListener('DOMContentLoaded',()=>{
  const mn=$('.menu-btn'),sd=$('.side');if(mn&&sd)mn.addEventListener('click',()=>sd.classList.toggle('open'));
});
window.__t0=launch-864e5;
(async function init(){
  stars();whenText();lock(true);
  await sync();window.__t0=launch-864e5;whenText();
  setInterval(tick,250);tick();
  if(sim)console.log('[sim] la apertura es en',sim,'segundos');
})();
})();
