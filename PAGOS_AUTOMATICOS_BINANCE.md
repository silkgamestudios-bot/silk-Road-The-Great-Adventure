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
Al arrancar, el log de Render dice `[pay] pagos automáticos ACTIVOS`.

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
- El bono de la promo y el descuento de revendedor NO se aplican en el pago automático (1 USDT = 1 gema); el pago manual de siempre sigue funcionando.

## Error 451 (Binance bloquea la región de Render) → relay en Frankfurt
1. Render → New → Web Service → mismo repo de GitHub, Region **Frankfurt**, Start Command `node relay.js`. Env: `RELAY_TOKEN` = una clave larga inventada.
2. En el servicio principal agregá: `BINANCE_RELAY_URL` = URL del relay (https://xxxx.onrender.com) y `RELAY_TOKEN` = la misma clave.
3. Manual Deploy del principal. Si el relay está en plan gratis se duerme: usá Starter para que responda siempre.
