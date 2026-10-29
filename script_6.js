
(()=>{
 const byText=(re)=>[...document.querySelectorAll('button,[role="button"]')].find(b=>re.test((b.innerText||b.textContent||'').trim()) && b.id!=='v182-pvp' && !b.closest('#v182-flight'));
 const p=document.getElementById('v182-pvp');
 p?.addEventListener('click',()=>{let b=byText(/PvP|Se busca|Gremio de Cazadores/i);if(b)b.click();else {const m=byText(/Menú|Menu/i);if(m)m.click();setTimeout(()=>{const q=byText(/PvP|Se busca|Gremio de Cazadores/i);if(q)q.click()},250)}});
 const f=document.getElementById('v182-flight');
 function refresh(){try{const gm=typeof gmIsM==='function'&&gmIsM();if(f)f.style.display=gm?'flex':'none'}catch(e){if(f)f.style.display='none'}}
 document.getElementById('v182-fly')?.addEventListener('click',()=>{const b=document.querySelector('button[data-h="fly"]');if(b)b.click();refresh()});
 document.getElementById('v182-fls')?.addEventListener('click',()=>{const b=document.querySelector('button[data-h="fls"]');if(b)b.click()});
 setInterval(refresh,1500);refresh();
})();
