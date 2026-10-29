
/* v282: acción contextual discreta: cada botón de #ctx muestra solo su emoji; el nombre aparece 2,5 s en una línea fina cuando el botón aparece */
(()=>{const re=/^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|\p{Emoji_Modifier})*)\s*(.*)$/su;let seen=new Set(),capT=0;
function cap(t){let c=document.getElementById('ctxc');if(!c){c=document.createElement('div');c.id='ctxc';document.body.appendChild(c)}c.textContent=t;c.classList.add('on');clearTimeout(capT);capT=setTimeout(()=>c.classList.remove('on'),2500)}
function scan(){const ctx=document.getElementById('ctx');if(!ctx)return;const now=new Set(),nw=[];for(const b of ctx.querySelectorAll('button')){if(b.hidden)continue;const t=(b.textContent||'').trim();const m=re.exec(t);if(m){if(b.dataset.e!==m[1])b.dataset.e=m[1];b.title=t;b.setAttribute('aria-label',t)}else delete b.dataset.e;now.add(b.id);if(!seen.has(b.id))nw.push(t)}seen=now;if(nw.length)cap(nw.join('  ·  '))}
setInterval(scan,300)})();
