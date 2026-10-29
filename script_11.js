
/* Acceso anticipado (solo master): ver, agregar o quitar hasta 3 cuentas que pueden entrar antes de la apertura. */
document.addEventListener('click',async e=>{const b=e.target.closest&&e.target.closest('[data-early]');if(!b)return;e.preventDefault();
 try{const r=await SRNET.rpc({t:'x',op:'early.list'});const L=r.list||[];
  const q=prompt('🎟️ Acceso anticipado ('+L.length+'/3)\n'+(L.length?L.join('\n'):'(vacío)')+'\n\nEscribe un correo/usuario para AGREGAR, o «-correo» para QUITAR:','');
  if(!q)return;const w=q.trim(),del=w[0]=='-';
  const r2=await SRNET.rpc({t:'x',op:del?'early.del':'early.add',who:del?w.slice(1):w});toast('🎟️ Acceso anticipado: '+(r2.list||[]).length+'/3',3000)
 }catch(x){toast(String(x.message||'No se pudo'),3500)}});
/* v337: reporte de nivel accesible desde el menú Sistema; evidencia adjuntada por el servidor. */
async function srSendLevelReport(){try{if(!window.SRNET||!SRNET.rpc||!UID){toast('Inicia sesión y conecta al servidor antes de reportar.',3500);return}const note=prompt('Describe brevemente qué pasó con tu nivel o vida. El sistema adjuntará automáticamente los datos guardados por el servidor. No incluyas contraseñas.','Mi nivel o vida cambió durante una actualización.');if(note===null)return;const r=await SRNET.rpc({t:'x',op:'bug.level.report',note:String(note).slice(0,600)});toast('✅ Reporte '+r.id+' enviado al GM con evidencia del sistema.',5000)}catch(e){toast('No se pudo enviar el reporte: '+String(e&&e.message||e),4500)}}
