# Silk Road — Mercado USDT con garantía (v410) · todo por NUESTRO Binance Pay

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
