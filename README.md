# Silk Road Online (GitHub + Render + Netlify) · fase 2

Estructura: `server/` (Node + WebSocket) · `client/` (juego + `claude-shim.js`) · `tools/` (exportador del mundo) · `render.yaml` · `netlify.toml`

## Puesta en marcha
1. **GitHub**: sube TODO esto (sin `node_modules`, ya está en `.gitignore`).
2. **Render**: New → Blueprint → tu repo. En *Environment* define:
   - `ALLOWED_ORIGINS` = la URL de tu Netlify.
   - `MASTER_KEY` = una clave larga y secreta (12+). **Sin ella el rol master queda deshabilitado** (es lo seguro).
3. **Cliente**: en `client/claude-shim.js` cambia `wss://CAMBIA-ESTO.onrender.com` por tu URL de Render (con `wss://`) y haz push.
4. **Netlify**: Add new site → Import from GitHub (publica `client`, ya en `netlify.toml`).
5. Prueba rápida: `https://TU-SITIO.netlify.app/?server=wss://xxxx.onrender.com`
6. Para ser master: en el juego, pestaña 💎 Gemas → *Acceso master* → escribe tu `MASTER_KEY`.

## Gemas (dinero real) — ahora las maneja el servidor
- El cliente **no puede escribir** `wallets`, `gemreq`, `gemgrant` ni `gemtx`. Solo pide operaciones: `gem.me, gem.spend, gem.send, gem.who, gem.req, gem.approve, gem.credit, gem.claim`.
- El servidor valida saldo, cantidades (enteros 1–1.000.000), no permite doble aprobación, limita 3 solicitudes pendientes y 10 envíos/hora, calcula las gemas de cada pago él mismo y guarda todo en un libro (`gemlog`).
- Las gemas se guardan en disco **al instante** (escritura atómica). Las recibidas por transferencia son 'transferidas' (solo atuendos), igual que antes.
- El master se reclama con `MASTER_KEY` (secreto del servidor); ya no es "el primero que llegue".
- **Saldos viejos**: los que tenían los jugadores en la versión de Claude NO se migran solos (sería un hueco para inventar saldos). Acredítalos tú con la cuenta master (*Acreditar*).

## Reglas del servidor (probadas con `npm test` en `server/`: 58 pruebas)
Identidad `uid`+secreto · solo escribes tu presencia/tienda/carruaje · ofertas y subastas solo las modifica su dueño · órdenes: no se cambia `from/to` · hits ≤ 600 y atacante verificado · loot no a ti mismo · buzones y billeteras ajenas ilegibles · límites de tamaño y de mensajes/seg.

## Mundo compartido (fase 3) — enemigos y combate en el servidor
Los **23.149 enemigos normales** viven en el servidor (`server/world.js`, datos en `server/world.json`). Todos los jugadores ven y pelean contra los mismos monstruos.
- **El servidor decide**: posición y movimiento (IA portada del juego: visión, persecución, correa, patrulla, manadas), vida, muerte, respawn, golpes a jugadores y recompensas. Corre a 10 ticks/s y manda a cada jugador solo los enemigos a ≤760 px (cambios, no todo).
- **El cliente** manda su posición (`w.pos`, 5/s) y sus golpes (`w.hit`) y dibuja lo que recibe. Al conectar compara una suma de verificación de su mundo con la del servidor; si no coincide, **juega sin conexión** como antes (también con `?world=0`, o si se cae el servidor).
- **Rebaja dura (calculada por el servidor, tabla `HC` en `world.js`)**: XP ×0.1, oro ×0.06, y el botín depende del tipo de enemigo (rata/serpiente: carne y casi nada de oro; goblin, orco, vampiro…: oro, equipo básico y pociones con probabilidades bajas).
- **Mejoras anti-abuso**: reparto por daño (quien aporta ≥10% recibe XP proporcional; el botín es solo del que más daño hizo) · **fatiga anti-bot** (más de 300 muertes en 1 h: XP y botín ×0.6; 600: ×0.3; 1000: ×0.1) · respawn de 30 s, +25% por cada jugador extra cerca (hasta +100%) para que no se acampe en grupo · el daño por golpe tiene tope (2.500) y por segundo (7.000), límite de golpes/seg, alcance verificado contra la posición del jugador, y los teletransportes inventados se rechazan (1 permitido cada 20 s) · en ciudades los enemigos no te atacan.
- Ajustes rápidos: `HC` y `LIM` al inicio de `server/world.js`. Para re-exportar el mundo si cambias el juego: `cd tools && npm run export` (y `npm run check` para comprobar).

### Pruebas
`cd server && npm test` (58 de gemas + 19 del mundo) y `cd tools && npm install && npm run e2e` (el juego real conectado al servidor: 12 + 10). Capacidad medida: ~20 ms por tick con 60 jugadores dispersos, ~90 ms con 150 (límite de 100 ms); si se agrupan es bastante menos.

## Lo que TODAVÍA no es autoritativo
- **Jefes, guardias, animales, enemigos de eventos, refuerzos, ladrones y variantes especiales de noche** siguen simulados en cada cliente (los 8 jefes y 21 guardias están en el mundo exportado pero no en el servidor). Los ladrones no roban oro en modo online (no hay forma segura de devolverlo).
- **El personaje** (nivel, XP, skills, equipo, oro, inventario) sigue en el navegador. El servidor limita y reparte, pero un cliente modificado podría darse XP/oro o armarse el equipo que quiera: eso exige mover el personaje al servidor (siguiente fase). Hasta entonces el servidor protege el **mundo compartido** y el **dinero real (gemas)**, no la progresión.
- **Beneficios comprados** (bonus, premium, atuendos): el saldo es del servidor, el efecto se aplica en el cliente. **Oro y mercado entre jugadores**: del cliente.
- Render free: se duerme y no guarda disco. Para jugar de verdad: plan de pago con disco.
