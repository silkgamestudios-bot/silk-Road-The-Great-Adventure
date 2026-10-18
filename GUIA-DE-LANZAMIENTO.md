# Guía de lanzamiento · Silk Road (de cero a jugadores reales)

Tiempo estimado: 30–40 minutos. Lo que necesitas: tu cuenta de GitHub, Render (plan de pago), Netlify y tu cuenta de Google.

## Paso 0 · Lo que ya está hecho
- Pay ID de Binance **748095851** y WhatsApp **18093965707** ya vienen configurados.
- Servidor con reglas anti-trampas, mundo compartido, party, mercado, subastas, gemas, login con Google, guardado en la nube, copias de seguridad cada 6 h y avisos de pago por WhatsApp.
- Sitio: launcher, wiki, juego instalable (app), privacidad y términos.

## Paso 1 · GitHub
1. Crea un repositorio nuevo (privado está bien) llamado `silk-road`.
2. Sube **todo el contenido** de esta carpeta (sin `node_modules`). Ya viene `.gitignore`.

## Paso 2 · Render (servidor)
1. Render → **New → Blueprint** → elige el repo. Lee `render.yaml` (plan Starter + disco de 1 GB en `/data`).
2. Cuando termine, copia la URL: `https://silk-road-server-xxxx.onrender.com`.
3. Abre esa URL: debe decir **«Silk Road server OK»** y el número de enemigos.

## Paso 3 · Netlify (sitio)
1. Netlify → **Add new site → Import from GitHub** → el mismo repo. (`netlify.toml` ya publica la carpeta `client`.)
2. Copia tu URL: `https://algo.netlify.app`.

## Paso 4 · Google (inicio de sesión)
1. https://console.cloud.google.com → crea un proyecto «Silk Road».
2. **APIs y servicios → Pantalla de consentimiento de OAuth** → Externo → nombre «Silk Road», tu correo; en *Dominios* y enlaces pon `https://algo.netlify.app/privacidad.html` y `.../terminos.html` → Publicar la app.
3. **Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación web**. En *Orígenes autorizados de JavaScript* pon `https://algo.netlify.app`. Copia el ID (`...apps.googleusercontent.com`).

## Paso 5 · Conectar todo con un comando
En tu computadora (o en la consola de GitHub Codespaces), dentro de la carpeta:
```
node tools/configure.js --server wss://silk-road-server-xxxx.onrender.com --site https://algo.netlify.app --google TU_ID.apps.googleusercontent.com --email TU_GMAIL@gmail.com
```
Esto escribe `client/config.js` y completa `render.yaml`. Haz **commit y push**: Netlify y Render se actualizan solos.

## Paso 6 · WhatsApp de pagos (CallMeBot, gratis)
1. Entra a https://www.callmebot.com/blog/free-api-whatsapp-messages/ y sigue los pasos para activar **tu número 18093965707**. Te darán una clave (apikey).
2. Render → tu servicio → **Environment** → `CALLMEBOT_KEY` = esa clave → Save. (Es secreta: no la subas a GitHub.)
3. (Alternativa oficial: WhatsApp Cloud API de Meta con `WA_TOKEN` y `WA_PHONE_ID`.)

## Paso 7 · Pruebas antes de abrir (checklist)
- [ ] `https://algo.netlify.app` muestra el launcher con tu logo.
- [ ] **JUGAR** pide iniciar sesión con Google y entra.
- [ ] Entras con tu Gmail → en el menú del héroe ves el **panel de master** (gemas).
- [ ] Con otra cuenta de Gmail entras como jugador normal (sin panel de master).
- [ ] Dos cuentas: invita a una party y ven el reparto de XP.
- [ ] Una cuenta abre una tienda (Mercader) y la otra la ve.
- [ ] Jugador manda un comprobante de gemas → te llega el **WhatsApp** → lo apruebas → recibe las gemas.
- [ ] Cierras el navegador y entras desde otro dispositivo: tu personaje sigue ahí.
- [ ] En el celular: «Instalar app» → abre en pantalla completa.

## Operación diaria
- **Aprobar pagos**: llega WhatsApp → abre el juego con tu Gmail → menú → Gemas → Aprobar (verifica antes el pago real en Binance Pay).
- **Copias de seguridad**: automáticas cada 6 h en el disco (`/data/backups`, 14 copias). Descárgalas de vez en cuando desde la consola de Render.
- **Actualizar el juego**: cambia `client/play.html`, sube el número `V` en `client/sw.js`, y si cambió el mapa/enemigos corre `node tools/export-world.js client/play.html server/world.json` y `node tools/export-wiki.js client/play.html client/wiki-data.json`. Push.
- **Probar el servidor**: `cd server && npm ci && cd .. && node tools/test-server.js` (45 pruebas) y `node tools/test-economy.js` (50 pruebas).

## Problemas comunes
| Síntoma | Causa / solución |
|---|---|
| «Origen no permitido» / no conecta | `ALLOWED_ORIGINS` en Render debe ser exactamente tu URL de Netlify (https, sin `/` final). |
| El botón de Google no sale | Falta el ID en `client/config.js` o el origen no está en Google Cloud. |
| «Google rechazó el inicio de sesión» | `GOOGLE_CLIENT_ID` de Render distinto al de `config.js`. |
| No eres master | `MASTER_EMAIL` distinto al Gmail con el que entraste; recuerda minúsculas. |
| No llega el WhatsApp | `CALLMEBOT_KEY` vacía o número no activado en CallMeBot. Mira los logs de Render. |
| Los celulares ven la versión vieja | Sube la constante `V` de `client/sw.js`. |

## Lo que todavía NO es 100% a prueba de trampas
El oro, el inventario y la vida siguen calculándose en el cliente (el servidor valida movimiento, daño, botín del mundo, gemas y reglas del mercado). Un jugador con conocimientos podría alterar su propio oro local. Es la siguiente fase: mover oro e inventario al servidor. Mientras tanto, las **gemas (dinero real) sí están protegidas** por el libro de cuentas del servidor.


## Antes de abrir a testers (v45)
2. Concede gemas de prueba a los testers desde tu cuenta master (menú → Gemas).
3. Corre `node tools/test-server.js` y `node tools/test-economy.js` antes de cada despliegue.
