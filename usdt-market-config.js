'use strict';
/* Silk Road v350 — cálculo puro de tarifas del Bazar Global.
 * No cobra ni transfiere fondos. No activa pagos reales.
 * Todo importe se procesa como enteros para evitar errores de coma flotante.
 */
const CONFIG = Object.freeze({
  network: 'BNB Smart Chain',
  chainIdTestnet: 97,
  chainIdMainnet: 56,
  currency: 'USDT',
  gemReferenceUsdt: '1.00',
  gemSubunits: 10000, // 1 Gema = 10,000 unidades internas; 0.0001 Gema por unidad
  listingFeeBps: 500, // 5% del precio publicado, cobrado en Gemas
  characterListingFeeGems: 5, // tarifa fija especial para personajes
  sellerCommissionBps: 500, // 5% del precio de venta completada
  buyerFeeGems: 0, // no se aplica tarifa adicional de compra en las reglas actuales
  mode: 'test'
});
function parseCents(value) {
  const s = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(s)) throw new Error('Importe USDT inválido; máximo dos decimales');
  const [whole, frac = ''] = s.split('.');
  const cents = Number(whole) * 100 + Number((frac + '00').slice(0, 2));
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error('El precio debe ser mayor que cero y válido');
  return cents;
}
function formatUsdt(cents) {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error('Cantidad de centavos inválida');
  return (cents / 100).toFixed(2);
}
function formatGemsUnits(units) {
  if (!Number.isSafeInteger(units) || units < 0) throw new Error('Cantidad de Gemas inválida');
  return (units / CONFIG.gemSubunits).toFixed(4);
}
function quoteListing(priceUsdt, itemType = 'item') {
  if (itemType === 'character') {
    const units = CONFIG.characterListingFeeGems * CONFIG.gemSubunits;
    return Object.freeze({ itemType, priceUsdt: formatUsdt(parseCents(priceUsdt)), listingFeeGems: '5.0000', listingFeeUnits: units, note: 'Tarifa fija especial para personajes; cálculo informativo.' });
  }
  const priceCents = parseCents(priceUsdt);
  // Gemas internas = precio USDT × 10,000; comisión 5%.
  // priceCents * 5 unidades equivale exactamente al 5% con unidades de 0.0001 Gema.
  const units = priceCents * 5;
  return Object.freeze({ itemType: 'item', priceUsdt: formatUsdt(priceCents), listingFeeGems: formatGemsUnits(units), listingFeeUnits: units, note: 'Tarifa informativa del 5%; no se han cobrado Gemas.' });
}
function quoteSale(priceUsdt) {
  const grossCents = parseCents(priceUsdt);
  const feeCents = Math.floor((grossCents * CONFIG.sellerCommissionBps) / 10000);
  return Object.freeze({
    currency: CONFIG.currency,
    grossUsdt: formatUsdt(grossCents),
    commissionRate: '5.00%',
    commissionUsdt: formatUsdt(feeCents),
    sellerNetUsdt: formatUsdt(grossCents - feeCents),
    buyerFeeGems: '0.0000',
    note: 'Cotización informativa; no representa una transferencia ni una venta ejecutada.'
  });
}
module.exports = { CONFIG, parseCents, formatGemsUnits, quoteListing, quoteSale };
