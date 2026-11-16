# Guías de configuración · pagos, mercado USDT y WhatsApp (Karavan Online)

Este archivo reúne las guías que antes eran archivos sueltos (PAGOS_AUTOMATICOS_BINANCE.md, USDT_MARKET_RULES.md, BNB_PAYMENTS_SETUP.md y WHATSAPP_SETUP.md) para respetar el tope de 99 archivos de la subida a GitHub. El contenido es el mismo.

**Índice:** 1 · Cobro automático de gemas (Binance Pay) · 2 · Mercado USDT con garantía · 3 · Preparación de pagos BNB · 4 · WhatsApp para recuperar cuentas (al final).

---

## 1 · Cobro automático de gemas (Binance Pay)

# Cobro automático en USDT (Binance Pay)

## Render → Environment
| Variable | Valor |
|---|---|
| `BINANCE_API_KEY` | tu llave de solo lectura (ya la tienes) |
| `BINANCE_SECRET` | tu secreto (ya lo tienes) |
| `BINANCE_PAY_ID` | tu Pay ID que recibe los pagos (ya se usa en el juego) |
| `PAY_PACKS` (opcional) | `{"1":1,"3":3,"5":5,"10":10,"20":20,"50":50}` = precio base USDT → gemas |
| `PAY_MAXDISC_PCT` (opcional) | 5 = el descuento máximo es 5% del precio base (mínimo 5 centavos, tope 0,49) |
| `PAY_TTL_MIN` (opcional) | 15 |
| `PAY_POLL_MS` (opcional) | 8000 (consulta a Binance solo si hay órdenes pendientes; si no, 1 vez por minuto) |

En Binance, la API key necesita solo **Enable Reading** (la consulta es `GET /sapi/v1/pay/transactions`, historial de Binance Pay).
Al arrancar, el log de Render dice `[pay] pagos automáticos ACTIVOS`. (v401: apenas se crea una orden el servidor consulta a Binance en seguida; el jugador ve sus gemas a los pocos segundos de pagar, ya no hay que esperar el minuto de reposo.)

## Cómo funciona
1. Jugador → Comprar gemas → ⚡ Pago automático → elige paquete (ej. 10 USDT).
2. El servidor crea la orden con monto único = base − 0,01 hasta 5% del precio (1 USDT: hasta 0,05 · 3: 0,15 · 5: 0,25 · 10 o más: 0,49) (ej. 9,63), sin repetir con otras órdenes vivas. Dura 15 min; el monto queda reservado 2 min más por si Binance tarda en mostrar el pago.
3. El juego muestra monto + Copiar, contador, pasos y estado; consulta el estado cada 4 s.
4. El servidor lee el historial de Binance Pay, cruza monto exacto + hora dentro de la ventana, acredita las gemas UNA vez y guarda el ID de transacción de Binance (una transacción jamás se procesa dos veces).
5. Lo que no coincide (monto distinto, llegó tarde, sin orden) va a **Zona GM → Dinero → 💳 Pagos por revisar** (monto, hora, transacción). Desde ahí puedes acreditar (si hay una orden de ese monto) o marcar resuelto. También te avisa por WhatsApp.

## Seguridad
- El jugador sale de la sesión del servidor; el navegador solo manda el paquete (1, 3, 5, 10…) y el servidor decide monto y gemas.
- Las órdenes se guardan en `db.json` (disco `/data`), con las copias automáticas de siempre.
- Máx. 6 órdenes por jugador cada 10 min. Una orden activa por jugador.
- No hace falta CORS: el juego habla con el servidor por el mismo WebSocket autenticado que ya usa (funciona desde Blogger).

## Margen y comisión
- El jugador paga entre base−descuento máximo y base−0,01. Con base 10 recibes mínimo 9,51; con base 1, mínimo 0,95. Ajusta `PAY_PACKS` o los precios base si quieres otro mínimo.
- Haz primero un pago real pequeño (paquete de 1 USDT: llega entre 0,95 y 0,99) y confirma que en tu cuenta entra exactamente ese monto. Binance Pay entre usuarios normalmente no cobra comisión al que recibe.
- La promo de Black Friday SÍ se aplica en el pago automático, con la misma regla que el resto del juego: manda `DB.cfg.promo` (el panel 🔥 Promo del master); si no hay nada guardado, valen los de fábrica (+25 % del 12 al 26 de nov y +100 % del 26 de nov al 1 de dic, hora RD, sobre los primeros 20 USDT por cuenta). El bono se ve en cada paquete de la tienda y la orden queda guardada con el bono que se prometió. El descuento de revendedor NO se aplica en el pago automático.
- El pago manual (ID de orden, captura, WhatsApp, «Mis solicitudes») se quitó de la tienda del jugador: Comprar gemas es solo el pago automático. Las solicitudes manuales viejas siguen contando para el tope de la promo.
- Si el servidor no ve las llaves de Binance, la tienda dice «no disponible» y el master ve el motivo exacto en pantalla (Falta BINANCE_API_KEY / BINANCE_SECRET / BINANCE_PAY_ID). Los nombres de las variables se leen sin distinguir mayúsculas (sirve «Binance_Api_key»).

## Error 451 (Binance bloquea la región de Render) → relay en Frankfurt
1. Render → New → Web Service → mismo repo de GitHub, Region **Frankfurt**, Start Command `node relay.js`. Env: `RELAY_TOKEN` = una clave larga inventada.
2. En el servicio principal agregá: `BINANCE_RELAY_URL` = URL del relay (https://xxxx.onrender.com) y `RELAY_TOKEN` = la misma clave.
3. Manual Deploy del principal. Si el relay está en plan gratis se duerme: usá Starter para que responda siempre.


---

## 2 · Mercado USDT con garantía

# Karavan Online (antes Silk Road) — Mercado USDT con garantía (v410) · todo por NUESTRO Binance Pay

Sin MetaMask, sin blockchain, sin contratos. Nosotros somos el intermediario.

## Flujo
1. **Vendedor** publica (objeto, mascota, boleto o gemas) con precio en USDT y escribe su **ID de Binance Pay** y su **usuario de Binance**. El servidor retiene el artículo (garantía).
2. **Comprador** pulsa Comprar → el anuncio queda reservado y se crea una orden con un monto único (precio − 0.01…0.49). Paga ese monto exacto al Pay ID del juego.
3. `pay.js` lee el historial de Binance Pay (API de solo lectura) y al ver el pago: entrega el artículo, avisa al comprador (aviso + buzón), avisa al vendedor y te manda **a ti** (master) una notificación con todos los datos: qué se vendió, quién compró, cuánto pagó, a quién pagar (Pay ID + usuario) y cuánto (precio − 5%).
4. **Tú pagas** al vendedor desde tu Binance y pulsas «Ya pagué» en Mercado USDT → Master. El vendedor recibe el aviso en su buzón.

## Reglas
- Comisión: **5% del precio de venta**, descontada al vendedor y pagada en USDT. Ej.: venta de 100 USDT → vendedor recibe 95.00.
- Precio mínimo 1.00 USDT, máximo 50 000. Máx. 15 anuncios por jugador.
- Reserva/orden: 15 min (PAY_TTL_MIN). Si vence sin pago, el anuncio vuelve a estar disponible.
- Cada pago de Binance se usa una sola vez (ID de transacción). Pagos con monto raro, tarde o sin orden van a **revisión manual** (igual que las gemas).
- Si llega un pago y el artículo ya no está, te llega el aviso «REEMBOLSO NECESARIO» y aparece en la pestaña Master.
- Personajes: el mercado de personajes también verifica el pago solo y aprueba la venta (antes lo aprobaba el master a mano; el comprobante manual sigue como respaldo).
- Gemas por USDT: el vendedor pone N gemas a un precio total en USDT; el comprador paga y recibe las gemas.

## Variables de entorno (las mismas de los pagos de gemas)
BINANCE_API_KEY, BINANCE_SECRET (solo lectura), BINANCE_PAY_ID. Sin ellas el Mercado USDT queda apagado y lo dice en pantalla.

## Archivos
- `usdtmkt.js` (nuevo): anuncios, garantía, buzón, pagos a vendedores.
- `pay.js`: órdenes del mercado (`newMk`) con el mismo verificador de pagos.
- `charmkt.js`: personajes con verificación automática.
- Ya NO se usan: `bnb-payments.js`, `usdt-market-config.js`, `contracts/`, `scripts/deploy-escrow.js` (se pueden borrar).


---

## 3 · Verificador de pagos BNB (opcional)

# Karavan Online (antes Silk Road) v348 — preparación de pagos BNB

## Estado de esta entrega
Se añade `bnb-payments.js`, un verificador de evidencia de transferencia ERC-20 en BNB Smart Chain. **No acredita Gemas, no crea órdenes y no envía ni custodia fondos todavía.** Esta separación es intencional: acreditar dinero sin una orden de servidor e idempotencia sería inseguro.

## Configuración segura inicial (testnet)
Variables de entorno:

- `BNB_PAYMENTS_MODE=test`
- `BSC_CHAIN_ID=97`
- `BSC_RPC_URL=<URL RPC BNB Smart Chain testnet>`
- `BNB_RECEIVER_ADDRESS=0x98Bc386F8276C6fB20792768125a0597847A16AA` (la dirección indicada por el propietario; confirmar que se controla y que se usará en testnet antes de pruebas)
- `BSC_USDT_TOKEN_ADDRESS=<contrato ERC-20 de token de prueba en testnet>`
- `BSC_USDT_DECIMALS=18`
- `BSC_CONFIRMATIONS=12`

No hay un USDT oficial de mainnet que deba asumirse automáticamente en testnet. Debe configurarse el contrato exacto y verificarse en un explorador fiable antes de probar.

## Reglas antes de activar dinero real
1. Crear órdenes de pago exclusivamente en el servidor, vinculadas a una cuenta y un paquete de Gemas fijo.
2. No aceptar del cliente el número de Gemas ni el precio como autoridad.
3. Verificar chain ID, dirección del token, destinatario, importe exacto, hash, recibo exitoso y confirmaciones.
4. Guardar una clave única por hash + índice del log y hacer la acreditación en una operación atómica; no procesar dos veces.
5. Reconciliar con el nodo y conservar un historial auditable. Nunca confiar únicamente en el estado de MetaMask ni en una captura.
6. Probar pagos repetidos, importes incorrectos, token falso, cadena incorrecta, transacción fallida, reorgs y reinicios del servidor.
7. Mantener las claves privadas fuera del servidor del juego. Este módulo no necesita ninguna clave privada.

## API del módulo
```js
const payments = require('./bnb-payments');
console.log(payments.configStatus());
const result = await payments.verifyPayment({ txHash, expectedAmount: '5.00', expectedSender });
```
`verifyPayment` solo verifica la evidencia. El siguiente paso de desarrollo es conectar órdenes persistentes e idempotentes con `E.grantGems(...)` después de validar que el hash no se haya utilizado previamente.

---

## 4 · WhatsApp para recuperar cuentas

# WhatsApp para recuperar cuentas · Karavan Online (v427)

Qué hace: el jugador da su número de WhatsApp al crear la cuenta. Si olvida su contraseña, toca **«Olvidé mi contraseña»**, escribe su usuario (y su número) y el servidor le **envía solo, por WhatsApp, una clave temporal** (ej. `K7QD-4M2X`). Entra con ella, el juego le pide crear una contraseña nueva y listo.

El servidor ya trae todo el código (`whatsapp.js` + `accounts.js`). **Solo falta que elijas un proveedor de envío y pongas sus datos en Render → Environment.** Mientras no lo hagas, el juego funciona igual pero la recuperación queda en modo manual (ver al final).

---

## 1) Opción recomendada: API oficial de WhatsApp (Meta Cloud API)

Es la más estable y la que no te banea el número. Hace falta una cuenta de Meta for Developers / WhatsApp Business y un número que **no** esté en uso en la app normal de WhatsApp.

1. En <https://developers.facebook.com> crea una app tipo **Business** y añade el producto **WhatsApp**. Verifica tu negocio si Meta lo pide (Silk Games Studios).
2. En *WhatsApp → API Setup* añade tu número y copia el **Phone number ID** (no es el número, es un identificador largo) → será `WA_PHONE_ID`.
3. Crea un **token permanente**: Business Settings → Users → **System users** → crea uno (Admin) → *Add assets* (tu app y tu cuenta de WhatsApp, control total) → **Generate token** con los permisos `whatsapp_business_messaging` y `whatsapp_business_management`, sin vencimiento → será `WA_TOKEN`. (El token temporal de 24 h de la pantalla de pruebas NO sirve en producción.)
4. Crea la **plantilla de Autenticación** (obligatoria para escribir a un jugador que no te ha escrito antes):
   - WhatsApp Manager → *Plantillas de mensajes* → **Crear plantilla**.
   - Categoría: **Autenticación**. Nombre: `karavan_clave` (o el que quieras, en minúsculas y con guion bajo). Idioma: **Español (es)**.
   - Botón de código: **Copiar código**. Caducidad del código: **30 minutos** (igual que `WA_TEMP_MIN`). Puedes marcar «Añadir recomendación de seguridad».
   - Envíala a revisión. Las de autenticación suelen aprobarse en minutos.
5. En **Render → tu servicio → Environment** añade:

| Variable | Valor |
|---|---|
| `WA_TOKEN` | el token permanente del paso 3 |
| `WA_PHONE_ID` | el Phone number ID del paso 2 |
| `WA_TEMPLATE` | `karavan_clave` (el nombre exacto de la plantilla aprobada) |
| `WA_TEMPLATE_LANG` | `es` (opcional; es el valor por defecto) |
| `WA_API_VERSION` | opcional (por defecto `v23.0`) |

   Si ya tenías `WA_TOKEN` y `WA_PHONE_ID` para los avisos al dueño, **son los mismos**: solo añade `WA_TEMPLATE`.
6. **Manual Deploy** en Render. Abre `https://karavanonline.com/status`: al final debe decir `whatsapp:meta`. Si dice `whatsapp:no`, falta alguna variable.
7. Pruébalo: crea una cuenta de prueba con tu número → cierra sesión → «Olvidé mi contraseña». En unos segundos te llega el mensaje.

**Cómo lo ve el jugador:** Meta escribe las plantillas de autenticación a su manera: *«K7QD-4M2X es tu código de verificación»*, con un botón «Copiar código». Esa clave es su contraseña temporal (vale 30 minutos y una sola vez). El juego se lo explica en la pantalla de recuperación.

**Costo:** Meta cobra por cada mensaje de plantilla de la categoría Autenticación (el precio depende del país del jugador). Revisa la tarifa vigente de República Dominicana en la página de precios de WhatsApp Business. Tienes límites por número y por IP (abajo), así que nadie puede dispararte el gasto.

---

## 2) Alternativa: Twilio

1. En Twilio activa **WhatsApp** (sandbox para pruebas; en producción, un remitente aprobado) y copia el Account SID y el Auth Token.
2. Variables en Render:

| Variable | Valor |
|---|---|
| `TWILIO_SID` | Account SID |
| `TWILIO_TOKEN` | Auth Token |
| `TWILIO_FROM` | `whatsapp:+1XXXXXXXXXX` (tu remitente) |
| `TWILIO_CONTENT_SID` | (producción) SID de una plantilla aprobada de Autenticación con la variable `{{1}}` = la clave. Si lo dejas vacío se envía texto libre, que solo llega dentro de las 24 h desde que el jugador te escribió o en el sandbox |

3. Manual Deploy y revisa `/status` → `whatsapp:twilio`.

---

## 3) Alternativa: gateway HTTP propio (Evolution API, WhatsApp Web, etc.)

Sirve cualquier servicio al que se le haga un `POST` con JSON. **Ojo:** los gateways no oficiales (basados en WhatsApp Web) pueden hacer que WhatsApp bloquee el número; úsalos bajo tu riesgo.

| Variable | Valor |
|---|---|
| `WA_PROVIDER` | `http` |
| `WA_HTTP_URL` | la URL de envío de tu gateway |
| `WA_HTTP_TOKEN` | (opcional) se envía como `Authorization: Bearer …` |
| `WA_HTTP_HEADERS` | (opcional) JSON con cabeceras extra, ej. `{"apikey":"MI_CLAVE"}` |
| `WA_HTTP_BODY` | (opcional) cuerpo JSON con `{{to}}` (número con código de país, sin +), `{{text}}` (mensaje completo) y `{{code}}` (solo la clave). Ej. Evolution API: `{"number":"{{to}}","text":"{{text}}"}` |

Si no pones `WA_HTTP_BODY`, se manda `{"to","phone","number","message","text","body","code"}` con los mismos datos. Revisa `/status` → `whatsapp:http`.

---

## 4) Otras variables

| Variable | Para qué |
|---|---|
| `WA_PROVIDER` | Fuerza el proveedor: `meta`, `twilio` o `http`. Si no la pones, se detecta sola por las variables que existan |
| `WA_TEMP_MIN` | Minutos que vale la clave temporal (por defecto 30). Si la cambias, cambia también la caducidad de la plantilla de Meta |
| `WA_REQUIRE_EXISTING=1` | Las cuentas **viejas** (sin número) no pueden jugar hasta añadir su WhatsApp. Sin esta variable el juego solo se lo pide con un aviso («Más tarde» lo deja para después) |
| `MASTER_WHATSAPP` / `CALLMEBOT_KEY` | Tu WhatsApp de soporte y su aviso automático (ya existían). Reciben las alertas de recuperación |
| `WA_PROVIDER=test` | **Solo pruebas locales:** en vez de enviar, guarda el mensaje en `outbox_wa.json`. No lo uses en producción (guardaría las claves en texto) |

---

## 5) Reglas y seguridad (ya incluidas)

- El número es **obligatorio** al registrarse (con selector de país; por defecto República Dominicana +1, 809/829/849). Máximo **3 cuentas por número**.
- La clave temporal es una **credencial aparte**, de un solo uso y con vencimiento. La contraseña de siempre **sigue funcionando** hasta que el jugador cree una nueva, así nadie puede dejar fuera a un jugador pidiendo claves.
- Al entrar con la temporal **no se abre sesión**: el juego obliga a crear una contraseña nueva (8 a 64 caracteres). Al guardarla se cierran las demás sesiones.
- La respuesta del servidor es **siempre la misma** («si los datos coinciden, te enviamos…»): no se puede averiguar qué usuarios o números existen.
- Límites por hora: 3 solicitudes por usuario, 5 por número y 8 por IP. La cuenta master no se puede recuperar por este medio.
- Las contraseñas siguen guardadas con scrypt (nadie puede verlas). Pedir una clave temporal también limpia un bloqueo por intentos fallidos de esa cuenta.
- Cambiar el número desde **Cuenta → 📲 WhatsApp de recuperación** exige la contraseña actual.

## 6) Sin proveedor configurado (modo manual)

Si `/status` dice `whatsapp:no`, cuando alguien pide recuperar su cuenta el jugador ve «Avisamos al soporte» y a ti te llega la alerta («📲 Pidieron recuperar contraseña por WhatsApp», con el usuario, el número escrito y si coincide). Entonces: **Zona GM → 🔑 Recuperar cuenta** → escribes el usuario → **🎲 Clave temporal nueva** → **📲 Enviar por WhatsApp** (abre WhatsApp con el mensaje listo hacia el número guardado del jugador).

## 7) Si algo falla

- Mira los logs de Render: `rw: clave temporal pedida para <usuario>` (se generó) y `WhatsApp falló: …` (el proveedor respondió con error; también te llega alerta y la clave queda anulada).
- Meta `132001`/«template does not exist»: el nombre o el idioma de `WA_TEMPLATE` no coinciden con la plantilla aprobada.
- Meta `131030`: en modo desarrollo solo se puede escribir a números de prueba autorizados en *API Setup*.
- Meta `131047`/«re-engagement»: se intentó mandar texto libre fuera de la ventana de 24 h; falta `WA_TEMPLATE`.
- Meta `190`: token vencido o sin permisos; genera uno permanente (paso 3).
- Twilio `63016`/`63007`: remitente o plantilla no aprobados para ese destino.
