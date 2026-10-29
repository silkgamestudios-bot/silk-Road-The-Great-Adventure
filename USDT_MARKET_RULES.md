# Silk Road — reglas del Bazar Global USDT (v350, testnet)

## Reglas acordadas
- Red objetivo: BNB Smart Chain.
- Moneda de precio/pago del bazar: USDT.
- Referencia de compra de Gemas: **1 Gema = 1 USDT**. Esto no significa que las Gemas sean canjeables o retirables por USDT.
- Artículos normales: tarifa de publicación de **5% del precio anunciado**, cobrada en Gemas fraccionarias. Ejemplo: artículo de 1.00 USDT → 0.0500 Gemas.
- Personajes: tarifa especial fija de publicación de **5 Gemas**; mientras estén publicados deben quedar bloqueados para evitar transferencias paralelas.
- Venta completada: comisión del vendedor de **5% del precio de venta**, descontada del importe del vendedor.
- No se incluye una tarifa adicional fija para el comprador en las reglas actuales.
- Gemas fraccionarias: 1 Gema = 10,000 unidades internas (0.0001 Gema por unidad). Los cálculos usan enteros, no números de coma flotante.
- Solo se deben publicar artículos transferibles; excluir objetos ligados, consumidos, de misión o no transferibles. La lista definitiva requiere validación con el inventario del servidor.

## Ejemplos
- Publicar artículo de 1.00 USDT: 0.0500 Gemas.
- Publicar artículo de 10.00 USDT: 0.5000 Gemas.
- Publicar personaje: 5.0000 Gemas.
- Venta por 100.00 USDT: comisión 5.00 USDT; neto teórico del vendedor 95.00 USDT.

## Estado técnico real
- `usdt-market-config.js` calcula tarifas; **no cobra ni transfiere fondos**.
- `bnb-payments.js` verifica evidencia de una transferencia ERC-20 según configuración; **no crea órdenes ni acredita Gemas**.
- El mercado actual de `market.js` es un mercado interno basado en oro/recursos; no se debe confundir con un bazar USDT ya operativo.
- Esta entrega sigue en modo de preparación/testnet. No se debe activar dinero real ni anunciar que las ventas se liquidan automáticamente.

## Antes de producción
1. Crear órdenes de pago persistentes en el servidor vinculadas a cuenta, propósito, importe y vencimiento.
2. Confirmar el contrato exacto del token en la red elegida; no confiar solo en el ticker “USDT”.
3. Verificar chain ID, token, receptor, importe, recibo exitoso y confirmaciones en el servidor.
4. Registrar de forma persistente e idempotente `chainId:txHash:logIndex`; impedir doble acreditación tras reinicios o reintentos.
5. Diseñar estados de compra, reserva/bloqueo de artículo, entrega y recuperación/reembolso ante fallos.
6. Para personajes, bloquear la cuenta/personaje durante la publicación y transferirlo como personaje secundario solo al completar la venta de forma segura.
7. Probar pagos duplicados, importes incorrectos, token falso, red incorrecta, fallos, reinicios y reorganizaciones de cadena.
8. Revisar requisitos legales, fiscales y de custodia aplicables antes de aceptar dinero real.
