# Silk Road Online (GitHub + Render + Netlify)

`server/` Node + WebSocket · `client/` juego (index.html, claude-shim.js, world-client.js) · `tools/export-world.js` · `render.yaml` · `netlify.toml`

## Puesta en marcha (con el plan de pago de Render)
1. **GitHub**: sube todo el contenido de esta carpeta a un repo (sin `node_modules`).
2. **Render**: New → Blueprint → elige el repo (lee `render.yaml`: plan starter + disco `/data`). Completa `ALLOWED_ORIGINS` (tu Netlify) y `MASTER_UID` (tu uid). Copia la URL `https://xxxx.onrender.com`.
3. **Cliente**: en `client/claude-shim.js` cambia `wss://CAMBIA-ESTO.onrender.com` por tu URL con `wss://`. Push.
4. **Netlify**: Add new site → Import from GitHub → publica la carpeta `client` (ya está en `netlify.toml`).
5. Prueba sin editar: `https://TU-SITIO.netlify.app/?server=wss://xxxx.onrender.com`

## Qué hace el servidor
- **Almacén en tiempo real** con las llamadas del juego (collection/doc/where/onSnapshot): party, mercado, carruajes, presencia.
- **Identidad**: uid + secreto por navegador, ligados en el servidor (no se puede suplantar).
- **Reglas**: cada quien escribe solo lo suyo; buzones privados (`pmsg`, `loot`, `hits`, `orders`); límites de tamaño y de mensajes/segundo.
- **Gemas (dinero real)**: ledger en el servidor. Una billetera no puede subir sin una concesión (`gemgrant`, solo `MASTER_UID`) o una transferencia (`gemtx`) con saldo verificado. Prueba: inflar de 100 a 900 → rechazado.
- **Mundo compartido autoritativo** (`server/world.js` + `world.json`): 23,149 enemigos controlados por el servidor (persecución, ataque, regreso, reaparición 30 s), validación de movimiento (velocidad, paredes, teletransporte solo a ciudades), tope de daño por golpe y por segundo, y botín tomado de las mismas tablas del juego. En party el reparto lo hace el servidor (mitad igual, mitad por aporte, tope de oro por minuto; sin crear oro).
- **Sin world.json** el servidor funciona igual y el juego queda en modo local.

## Regenerar el mundo cuando cambies el juego
`node tools/export-world.js client/play.html server/world.json` (lee el mapa, enemigos y botín del propio juego) y haz push.

## Ajuste de balance
Constantes `CFG` al inicio de `server/world.js` (aggro, reaparición, tope de oro, tope de daño).

## Cuentas con Google, master y pagos (v43)
1. **Google**: en https://console.cloud.google.com → APIs y servicios → Credenciales → *Crear credenciales → ID de cliente de OAuth* → tipo **Aplicación web** → en *Orígenes autorizados de JavaScript* pon tu URL de Netlify (y `http://localhost:8080` si pruebas). Copia el ID (`xxxx.apps.googleusercontent.com`).
2. Pégalo en **dos sitios**: `client/config.js` (`googleClientId`, y tu URL `wss://` de Render) y la variable `GOOGLE_CLIENT_ID` en Render. Con eso, el juego pide iniciar sesión con Google; si lo dejas vacío funciona en modo invitado.
3. **Master**: en Render pon `MASTER_EMAIL` = tu Gmail. Al iniciar sesión con ese Gmail el servidor te reconoce como master automáticamente (no hace falta contraseña) y ves el panel de gemas dentro del juego.
4. **Pagos**: el Pay ID `748095851` y el WhatsApp `18093965707` ya están en el juego y en `render.yaml`. Cuando un jugador envía un comprobante, el servidor te manda un WhatsApp con jugador, monto, gemas y número de orden. Tú aprobas dentro del juego (las gemas las concede solo el master).
5. **Para que el WhatsApp salga solo** hace falta un proveedor (WhatsApp no deja enviar mensajes sin uno). Opción gratis: **CallMeBot** (callmebot.com/blog/free-api-whatsapp-messages): activas tu número siguiendo sus pasos, te dan una clave y la pones en `CALLMEBOT_KEY`. Opción oficial: WhatsApp Cloud API de Meta (`WA_TOKEN` y `WA_PHONE_ID`). Sin ninguno, las solicitudes llegan igual al panel de gemas del juego y el aviso queda en el log del servidor.
6. **Cuentas**: el personaje se guarda en la nube atado al Gmail y se recupera en cualquier dispositivo (se conserva el de mayor nivel si hay dos).
- `node tools/test-server.js` prueba party, mercader, mascotas/subastas, gemas, login con Google, master, WhatsApp y guardado en la nube (39 pruebas).

## Web app, launcher y wiki (carpeta `client`)
- `index.html` = launcher con botón **JUGAR** y botón **Instalar app**; `play.html` = el juego; `wiki.html` = wiki (clases, sets, bestiario, jefes, mascotas, ciudades, XP, eventos, roadmap).
- PWA: `manifest.webmanifest` + `sw.js` + iconos. Se instala en la pantalla de inicio del celular y abre en **pantalla completa** (el juego también pide pantalla completa al primer toque).
- El wiki lee `wiki-data.json`, que sale del propio juego: `node tools/export-wiki.js client/play.html client/wiki-data.json`. Si cambias el juego, regenera este archivo y `server/world.json` (`node tools/export-world.js client/play.html server/world.json`).
- Sube `sw.js` la constante `V` (p. ej. `sr-v43`) en cada versión nueva para que los celulares se actualicen.

## Importante
- **Netlify solo sirve la carpeta `client` (estático).** El servidor usa WebSocket, así que NO puede vivir en Netlify: va en Render (o Railway/Fly). Por eso son dos servicios.
- Si cambias el juego (mapa/enemigos), vuelve a correr `node tools/export-world.js client/play.html server/world.json` y haz push; el número de enemigos del cliente y del servidor debe coincidir (ahora 9,601).
- GitHub Actions (`.github/workflows/check.yml`) revisa la sintaxis del servidor en cada push.
- Reglas de `loot` y `offers` ya están cerradas (v42): no se puede regalar oro negativo ni tocar ofertas ajenas, solo pujar más alto en subastas abiertas.

## Pendiente
- Jefes, guardias y enemigos salvajes siguen locales (aún no pasan por el servidor).
- La vida del jugador sigue en el cliente (el servidor envía el daño, no lo valida).
- Reglas `offers` y `loot` abiertas (marcadas TODO en `server.js`).
- Guardar el estado del jugador (oro, inventario) en el servidor es la siguiente fase de seguridad.


## Novedades v45
Minimapa corregido, clic para caminar, críticos y combos, Boutique con 32 apariencias, Gremios y economía/antitrampas en el servidor. Lee `ANTITRAMPAS-Y-GREMIOS.md`.

## Novedades v46
Cuevas rediseñadas (pasillos anchos, muros de roca, escaleras con tiles de DawnLike), cripta a ~4 min de Chang'an, cuevas siempre visibles en el mapa, tajo circular del Caballero (8 casillas), establo con jaulas y animales que se mueven, piel moderna del HUD/diálogos, chat global + mensajes privados + 30 amigos (servidor) y sitio web actualizado.
