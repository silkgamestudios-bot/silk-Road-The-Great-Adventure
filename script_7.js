
/* v203: el boton PvP real (#pvb, creado por world-client.js) se coloca en la fila superior junto al mapa */
setInterval(function(){var p=document.getElementById('pvb'),row=document.querySelector('#rc .rrow'),m=document.getElementById('mapb');if(p&&row&&m&&p.parentElement!==row)row.insertBefore(p,m)},400);
