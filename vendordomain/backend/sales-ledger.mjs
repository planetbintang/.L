import { randomUUID } from 'node:crypto';

const CURRENCY = 'IDR';
const MAX_ITEMS = 100;
const MAX_QUANTITY = 1_000_000;

function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireSale(sales, id) {
  const sale = sales.find((item) => item.id === id);
  if (!sale) fail(404, 'Transaksi penjualan tidak ditemukan');
  return sale;
}

function requireMoney(value, label, { allowZero = true } = {}) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || (!allowZero && value === 0)) {
    fail(400, `${label} harus berupa bilangan rupiah bulat yang aman${allowZero ? ' dan tidak negatif' : ' lebih dari nol'}`);
  }
  return value;
}

function addMoney(total, value, label) {
  const next = total + value;
  if (!Number.isSafeInteger(next)) fail(422, `${label} melampaui batas angka aman`);
  return next;
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > MAX_ITEMS) {
    fail(400, `items harus berisi 1 sampai ${MAX_ITEMS} baris`);
  }

  let subtotal = 0;
  let costBasis = 0;
  const normalized = items.map((item, index) => {
    if (!isObject(item)) fail(400, `Baris item ${index + 1} tidak valid`);
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    if (!name || name.length > 160) fail(400, `Nama item ${index + 1} wajib diisi dan maksimal 160 karakter`);
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) {
      fail(400, `Kuantitas item ${index + 1} harus bilangan bulat 1–${MAX_QUANTITY}`);
    }

    const unitPrice = requireMoney(item.unitPrice, `Harga item ${index + 1}`, { allowZero: false });
    const unitCost = requireMoney(item.unitCost, `Biaya pokok item ${index + 1}`);
    const lineTotal = unitPrice * item.quantity;
    const lineCost = unitCost * item.quantity;
    if (!Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(lineCost)) {
      fail(400, `Nilai item ${index + 1} melampaui batas angka aman`);
    }
    subtotal = addMoney(subtotal, lineTotal, 'Subtotal penjualan');
    costBasis = addMoney(costBasis, lineCost, 'Total biaya pokok');
    return { name, quantity: item.quantity, unitPrice, unitCost, lineTotal, lineCost };
  });

  return { items: normalized, subtotal, costBasis };
}

function sumPayments(sale) {
  return sale.payments.reduce((sum, payment) => addMoney(sum, payment.amount, 'Total pembayaran'), 0);
}

export function createSale(sales, input, now = () => new Date().toISOString()) {
  if (!isObject(input)) fail(400, 'Body transaksi harus berupa object JSON');
  const customer = typeof input.customer === 'string' ? input.customer.trim() : '';
  if (!customer || customer.length > 160) fail(400, 'customer wajib diisi dan maksimal 160 karakter');
  if (input.currency !== undefined && input.currency !== CURRENCY) {
    fail(400, 'Ledger ini hanya menerima currency IDR');
  }
  const { items, subtotal, costBasis } = validateItems(input.items);
  const sale = {
    id: randomUUID(),
    customer,
    currency: CURRENCY,
    items,
    subtotal,
    total: subtotal,
    costBasis,
    status: 'draft',
    payments: [],
    createdAt: now(),
    confirmedAt: null,
    fulfilledAt: null,
    cancelledAt: null,
  };
  sales.unshift(sale);
  return sale;
}

export function findSale(sales, id) {
  return requireSale(sales, id);
}

export function confirmSale(sales, id, now = () => new Date().toISOString()) {
  const sale = requireSale(sales, id);
  if (sale.status !== 'draft') fail(409, 'Hanya transaksi draft yang dapat dikonfirmasi');
  sale.status = 'confirmed';
  sale.confirmedAt = now();
  return sale;
}

export function fulfillSale(sales, id, now = () => new Date().toISOString()) {
  const sale = requireSale(sales, id);
  if (sale.status !== 'confirmed') fail(409, 'Transaksi harus dikonfirmasi sebelum dipenuhi');
  sale.status = 'fulfilled';
  sale.fulfilledAt = now();
  return sale;
}

export function cancelSale(sales, id, now = () => new Date().toISOString()) {
  const sale = requireSale(sales, id);
  if (!['draft', 'confirmed'].includes(sale.status)) fail(409, 'Transaksi yang sudah dipenuhi atau dibatalkan tidak dapat dibatalkan lagi');
  if (sale.payments.length) fail(409, 'Catat pengembalian dana melalui prosedur terpisah sebelum membatalkan transaksi berbayar');
  sale.status = 'cancelled';
  sale.cancelledAt = now();
  return sale;
}

export function recordSalePayment(sales, id, input, now = () => new Date().toISOString()) {
  const sale = requireSale(sales, id);
  if (!isObject(input)) fail(400, 'Body pembayaran harus berupa object JSON');
  if (!['confirmed', 'fulfilled'].includes(sale.status)) {
    fail(409, 'Pembayaran hanya dapat dicatat untuk transaksi yang sudah dikonfirmasi');
  }

  const amount = requireMoney(input.amount, 'Jumlah pembayaran', { allowZero: false });
  const reference = typeof input.reference === 'string' ? input.reference.trim() : '';
  if (!reference || reference.length > 120) fail(400, 'reference wajib diisi dan maksimal 120 karakter');
  if (sale.payments.some((payment) => payment.reference === reference)) {
    fail(409, 'Reference pembayaran sudah digunakan pada transaksi ini');
  }
  const paid = sumPayments(sale);
  if (amount > sale.total - paid) fail(400, 'Jumlah pembayaran melebihi sisa nilai transaksi');

  const payment = {
    id: randomUUID(),
    amount,
    currency: CURRENCY,
    reference,
    method: 'manual-record',
    receivedAt: now(),
  };
  sale.payments.push(payment);
  return { sale, payment };
}

export function summarizeSales(sales, now = () => new Date().toISOString()) {
  let draftOrderValue = 0;
  let confirmedOrderValue = 0;
  let recognizedRevenue = 0;
  let cashAssetRecorded = 0;
  let accountsReceivableAsset = 0;
  let customerAdvanceLiability = 0;
  let costOfGoodsSold = 0;

  for (const sale of sales) {
    const paid = sumPayments(sale);
    cashAssetRecorded = addMoney(cashAssetRecorded, paid, 'Total kas tercatat');

    if (sale.status === 'draft') draftOrderValue = addMoney(draftOrderValue, sale.total, 'Nilai draft');
    if (sale.status === 'confirmed') {
      confirmedOrderValue = addMoney(confirmedOrderValue, sale.total, 'Nilai order terkonfirmasi');
      customerAdvanceLiability = addMoney(customerAdvanceLiability, paid, 'Total uang muka pelanggan');
    }
    if (sale.status === 'fulfilled') {
      recognizedRevenue = addMoney(recognizedRevenue, sale.total, 'Total pendapatan diakui');
      accountsReceivableAsset = addMoney(accountsReceivableAsset, sale.total - paid, 'Total piutang usaha');
      costOfGoodsSold = addMoney(costOfGoodsSold, sale.costBasis, 'Total harga pokok penjualan');
    }
  }

  const salesRelatedAssets = addMoney(cashAssetRecorded, accountsReceivableAsset, 'Total aset terkait penjualan');
  return {
    currency: CURRENCY,
    basis: 'internal-operational-ledger-not-statutory-reporting',
    asOf: now(),
    salesCount: sales.length,
    draftOrderValue,
    confirmedOrderValue,
    recognizedRevenue,
    cashAssetRecorded,
    accountsReceivableAsset,
    salesRelatedAssets,
    customerAdvanceLiability,
    costOfGoodsSold,
    grossProfit: recognizedRevenue - costOfGoodsSold,
    notes: [
      'Pendapatan adalah penghasilan, bukan aset; aset terkait penjualan di sini hanya kas yang dicatat dan piutang atas barang/jasa yang telah dipenuhi.',
      'Uang muka untuk transaksi yang belum dipenuhi dicatat sebagai liabilitas pelanggan, bukan pendapatan.',
      'Penerimaan kas dicatat manual dan tidak memproses atau memverifikasi pembayaran bank.',
      'Nilai belum mencakup pajak, diskon, retur, persediaan, atau kebijakan akuntansi formal.',
    ],
  };
}
