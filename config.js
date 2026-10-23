/* Configuración del cliente. Si el juego se abre desde el mismo servidor de Render, usa su propia dirección automáticamente.
   Si lo alojas en otro sitio (Netlify, etc.), pon abajo la dirección de Render: wss://TU-SERVICIO.onrender.com */
(function(){
 var RENDER='';
 var same=(location.protocol==='https:'?'wss://':'ws://')+location.host;
 window.SR_CFG={server:RENDER||same,accounts:true,googleClientId:''};
 /* Si este dispositivo ya tiene una cuenta, no se ofrece "Crear cuenta" en el login (evita cuentas duplicadas y partidas perdidas).
    Al cerrar sesión desde "👤 Mi cuenta" el dispositivo queda libre otra vez. */
 try{if(localStorage.getItem('sr_acc')){var st=document.createElement('style');st.textContent='[data-t="up"]{display:none!important}';document.head.appendChild(st)}}catch(e){}
})();
