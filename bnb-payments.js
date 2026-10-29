'use strict';
/* Silk Road v348 — verificador BNB Smart Chain.
 * Este módulo SOLO verifica un hash y devuelve evidencia; no acredita Gemas ni ejecuta pagos.
 * La acreditación debe ser idempotente y enlazada a una orden creada por el servidor.
 */
const crypto = require('crypto');
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const cfg = {
  mode: String(process.env.BNB_PAYMENTS_MODE || 'test').toLowerCase(),
  rpc: String(process.env.BSC_RPC_URL || '').trim(),
  chainId: Number(process.env.BSC_CHAIN_ID || 97),
  receiver: String(process.env.BNB_RECEIVER_ADDRESS || '').trim().toLowerCase(),
  token: String(process.env.BSC_USDT_TOKEN_ADDRESS || '').trim().toLowerCase(),
  decimals: Number(process.env.BSC_USDT_DECIMALS || 18),
  confirmations: Math.max(1, Number(process.env.BSC_CONFIRMATIONS || 12))
};
const addressRE = /^0x[a-f0-9]{40}$/;
const hashRE = /^0x[a-f0-9]{64}$/;
function normAddr(v) { return String(v || '').toLowerCase(); }
function topicAddress(v) { return '0x' + String(v).slice(-40).toLowerCase(); }
function amountUnits(amount) {
  const s = String(amount);
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error('Importe inválido');
  const p = s.split('.');
  if ((p[1] || '').length > cfg.decimals) throw new Error('Demasiados decimales');
  return BigInt(p[0]) * (10n ** BigInt(cfg.decimals)) + BigInt(((p[1] || '') + '0'.repeat(cfg.decimals)).slice(0, cfg.decimals) || '0');
}
async function rpc(method, params) {
  if (!cfg.rpc) throw new Error('Falta BSC_RPC_URL');
  const res = await fetch(cfg.rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  if (!res.ok) throw new Error('RPC HTTP ' + res.status);
  const j = await res.json();
  if (j.error) throw new Error('RPC: ' + (j.error.message || 'error desconocido'));
  return j.result;
}
function configStatus() {
  return { mode: cfg.mode, chainId: cfg.chainId, receiverConfigured: addressRE.test(cfg.receiver), tokenConfigured: addressRE.test(cfg.token), confirmations: cfg.confirmations, ready: !!cfg.rpc && addressRE.test(cfg.receiver) && addressRE.test(cfg.token) && cfg.chainId === (cfg.mode === 'live' ? 56 : 97) };
}
async function verifyPayment({ txHash, expectedAmount, expectedSender } = {}) {
  if (cfg.mode !== 'test' && cfg.mode !== 'live') throw new Error('BNB_PAYMENTS_MODE debe ser test o live');
  if (cfg.mode === 'live' && cfg.chainId !== 56) throw new Error('Modo live requiere BSC mainnet (chainId 56)');
  if (cfg.mode === 'test' && cfg.chainId !== 97) throw new Error('Modo test requiere BSC testnet (chainId 97)');
  if (!addressRE.test(cfg.receiver) || !addressRE.test(cfg.token)) throw new Error('Configura BNB_RECEIVER_ADDRESS y BSC_USDT_TOKEN_ADDRESS');
  if (!hashRE.test(normAddr(txHash))) throw new Error('Hash de transacción inválido');
  const [chainHex, receipt, tx, headHex] = await Promise.all([
    rpc('eth_chainId', []), rpc('eth_getTransactionReceipt', [txHash]), rpc('eth_getTransactionByHash', [txHash]), rpc('eth_blockNumber', [])
  ]);
  if (parseInt(chainHex, 16) !== cfg.chainId) throw new Error('El RPC está conectado a otra red');
  if (!receipt || !tx) return { ok: false, pending: true, reason: 'Transacción aún no encontrada o sin recibo' };
  if (receipt.status !== '0x1') throw new Error('La transacción falló');
  const block = parseInt(receipt.blockNumber, 16), head = parseInt(headHex, 16);
  const confirmations = Math.max(0, head - block + 1);
  if (confirmations < cfg.confirmations) return { ok: false, pending: true, confirmations, required: cfg.confirmations, reason: 'Esperando confirmaciones' };
  if (expectedSender && normAddr(tx.from) !== normAddr(expectedSender)) throw new Error('La cartera de origen no coincide con la orden');
  const wanted = amountUnits(expectedAmount);
  const matches = (receipt.logs || []).filter(l => normAddr(l.address) === cfg.token && l.topics && String(l.topics[0]).toLowerCase() === TRANSFER_TOPIC && l.topics.length >= 3 && topicAddress(l.topics[2]) === cfg.receiver && BigInt(l.data || '0x0') === wanted);
  if (matches.length !== 1) throw new Error(matches.length ? 'Hay varios movimientos coincidentes; requiere revisión' : 'No se encontró una transferencia exacta del token, destinatario e importe esperados');
  const log = matches[0];
  return { ok: true, chainId: cfg.chainId, txHash: txHash.toLowerCase(), blockNumber: block, confirmations, token: cfg.token, receiver: cfg.receiver, sender: topicAddress(log.topics[1]), amount: String(expectedAmount), logIndex: parseInt(log.logIndex, 16), evidenceId: crypto.createHash('sha256').update(txHash.toLowerCase() + ':' + log.logIndex).digest('hex') };
}
module.exports = { configStatus, verifyPayment };
