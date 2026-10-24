/* Configuración del cliente. Si el juego se abre desde el mismo servidor de Render, usa su propia dirección automáticamente.
   Si lo alojas en otro sitio (Netlify, etc.), pon abajo la dirección de Render: wss://TU-SERVICIO.onrender.com */
(function(){
 var RENDER='';
 var same=(location.protocol==='https:'?'wss://':'ws://')+location.host;
 window.SR_CFG={server:RENDER||same,accounts:true,googleClientId:''};
})();
