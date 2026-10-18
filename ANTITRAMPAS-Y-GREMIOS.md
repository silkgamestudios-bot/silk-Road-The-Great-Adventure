# Silk Road v45 · antitrampas, gremios, boutique y mercado del servidor

## Qué manda el servidor (el cliente no puede falsificarlo)
- **Gemas, VIP, buffs, licencia y apariencias compradas:** solo el servidor las cambia. Se compran con `skin.buy`, `buff.buy`, `evskin.gem/coin`, `buff.gold` y `gem.tx`; el cliente solo recibe el resultado. Las gemas transferidas solo sirven para apariencias (nunca para buffs).
- **Mercado, tiendas de Mercader y subastas:** el servidor guarda las ofertas y hace los cobros con impuesto del 3 % por cada lado. Las colecciones `offers`, `shops`, `orders`, `wallets` ya no admiten escritura del cliente.
- **Entregas con confirmación:** lo que ganas o pagas en un trato llega como una entrega que el cliente aplica una sola vez y confirma en su siguiente guardado. Si no confirma en 90 s, el servidor la aplica a la fuerza.
- **Objetos y mascotas:** cada uno tiene un id registrado a nombre de su dueño. Copiar el id de otro, duplicar un objeto o inventar estadísticas imposibles lo elimina y suma un aviso.
- **Nombres únicos** (sin importar mayúsculas) y **una sola sesión por cuenta** (abrirla en otro dispositivo cierra la anterior).
- **Guardado auditado:** en cada guardado el servidor revisa oro, nivel/XP, mercancía, provisiones, monedas de evento, habilidades y objetos contra lo que es posible en el tiempo transcurrido. Lo imposible se recorta, nunca se acepta. A los 3 avisos te llega un WhatsApp con el jugador y el motivo.
- **Gremios:** precio, capacidad, rangos, tesoro, nombre y etiqueta únicos se validan en el servidor.

## Lo que NO cubre (sé consciente)
- El combate local (daño que haces a mobs normales, tu vida) lo calcula el navegador. El servidor limita el daño que cuenta contra los enemigos del mundo compartido y recorta el oro, la XP y los objetos que salen de ahí, pero un jugador con herramientas puede ganar más rápido de lo normal dentro de los topes.
- Los topes son generosos a propósito para no castigar a jugadores legítimos. Si ves abusos dentro del tope, baja `AUDIT_SLACK` (por ejemplo a 1.2).
- Los jefes todavía se calculan en el cliente; su oro se limita con una bolsa por nivel.
- La apariencia de la Boutique se ve en tu personaje; que los demás jugadores la vean es la siguiente fase (el servidor ya la valida y la envía).
- WhatsApp (CallMeBot) e inicio de sesión de Google están probados con servicios simulados, no con los reales.

## Variables nuevas (Render)
`FIRST_IMPORT` (1/0), `IMPORT_GOLD_PER_LV` (150000), `AUDIT_SLACK` (1.5). Quita `GEM_LEGACY`: ya no existe, las gemas solo las concede el master.

## Pruebas
`node tools/test-server.js` (45 pruebas de reglas, Google, master y nube) y `node tools/test-economy.js` (33 pruebas de auditoría, mercado, subastas, tienda y gremios).

## Chat y amigos (v46)
El servidor pone el nombre del que escribe, limpia el texto (sin HTML, 140 caracteres), limita la velocidad (1 mensaje global cada 1,5 s) y silencia 3 minutos a quien repite el mismo mensaje. Máximo 30 amigos por cuenta (los dos lados deben aceptar), bloqueo en el servidor y mensajes privados guardados aunque el otro esté desconectado.
