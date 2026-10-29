# Silk Road v348 — preparación de pagos BNB

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
