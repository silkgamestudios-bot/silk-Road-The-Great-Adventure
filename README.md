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

## Personaje en el servidor (fase 4) — nivel, XP, skills y carpa
- **Qué decide el servidor**: nivel, XP, las 3 skills (Ataque, Defensa, Agilidad) y la **Carpa de Entrenamiento** (tiempo real del servidor, costo, puntos, fin y retiro). El cliente solo pide (`ch.xp`, `ch.camp`, `ch.die`) y recibe el estado completo (`pc`). Si edita su nivel o sus skills en el navegador, el servidor lo corrige en el siguiente mensaje.
- **XP de combate**: la acredita el servidor directamente al matar (con la rebaja dura, el reparto por daño y la fatiga). El juego ya no la suma localmente en modo online.
- **XP de otras fuentes** (descubrimientos, tareas, jefes…): se declara al servidor con **topes** (por fuente: máx. `max(5.000, 2×XP del nivel)`; por hora: `max(20.000, 4×XP del nivel)`), así que no se puede subir sin freno.
- **Tope de daño por skill**: el servidor conoce tu skill de ataque real, así que el daño máximo por golpe depende de ella (con skill 1 el tope es ~650; con skill 600 ~2.900). Antes era un tope fijo de 2.500 para todos.
- **Muerte**: la penalización de XP/nivel la aplica el servidor (con espera de 15 s para evitar abuso).
- **Importación inicial**: al registrar por primera vez un personaje que ya existía en el navegador se acepta solo hasta nivel 30 y skills 5 (`IMPORT_LV_MAX` / `IMPORT_SK_MAX` en el servidor) y solo una vez; el resto se gana en línea.
- **Sincronía con el juego**: `cd tools && npm run parity` compara fórmulas y tablas del juego con las del servidor (XP, skills, carpa, rebaja). Si cambias algo en el juego y no en `server/char.js` / `server/world.js`, falla.

### Pruebas
`cd server && npm test` (58 gemas + 19 mundo + 23 personaje) · `cd tools && npm install && npm run e2e` (el juego real conectado al servidor: 12 gemas + 10 mundo + 12 personaje) · `npm run check` (mundo exportado y paridad de fórmulas). Capacidad medida: ~20 ms por tick con 60 jugadores dispersos, ~90 ms con 150 (límite 100 ms).

## Lo que TODAVÍA no es autoritativo
- **Oro, inventario y equipo**: siguen en el navegador. El servidor ya limita el daño según tu skill real, pero un cliente modificado puede darse oro u objetos. El **costo de la carpa** lo calcula el servidor pero lo descuenta el cliente (alguien podría entrenar sin pagar). Mover oro, objetos y el mercado al servidor es la siguiente fase y es la más grande (hay ~70 puntos del juego que tocan el oro).
- **Jefes, guardias, animales, eventos, refuerzos, ladrones y variantes de noche** siguen simulados en cada cliente (los ladrones no roban oro en modo online).
- **Beneficios comprados** (bonus, premium, atuendos): el saldo de gemas es del servidor, el efecto se aplica en el cliente.
- Render free: se duerme y no guarda disco. Para jugar de verdad: plan de pago con disco.
