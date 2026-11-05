import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cancelSale,
  confirmSale,
  createSale,
  findSale,
  fulfillSale,
  recordSalePayment,
  summarizeSales,
} from '../sales-ledger.mjs';

const instant = () => '2026-11-05T00:00:00.000Z';
const input = {
  customer: 'Pelanggan Uji',
  currency: 'IDR',
  items: [{ name: 'Paket layanan', quantity: 2, unitPrice: 120_000, unitCost: 40_000 }],
};

function captureError(action, status, text) {
  assert.throws(action, (error) => {
    assert.equal(error.status, status);
    assert.match(error.message, text);
    return true;
  });
}

test('ledger memisahkan order, pendapatan, kas, piutang, uang muka, dan harga pokok', () => {
  const sales = [];
  const sale = createSale(sales, input, instant);
  assert.equal(sale.status, 'draft');
  assert.equal(sale.total, 240_000);
  assert.equal(sale.costBasis, 80_000);

  confirmSale(sales, sale.id, instant);
  recordSalePayment(sales, sale.id, { amount: 100_000, reference: 'BANK-REF-001' }, instant);
  let summary = summarizeSales(sales, instant);
  assert.equal(summary.recognizedRevenue, 0);
  assert.equal(summary.cashAssetRecorded, 100_000);
  assert.equal(summary.accountsReceivableAsset, 0);
  assert.equal(summary.customerAdvanceLiability, 100_000);
  assert.equal(summary.salesRelatedAssets, 100_000);

  fulfillSale(sales, sale.id, instant);
  summary = summarizeSales(sales, instant);
  assert.equal(summary.recognizedRevenue, 240_000);
  assert.equal(summary.costOfGoodsSold, 80_000);
  assert.equal(summary.grossProfit, 160_000);
  assert.equal(summary.cashAssetRecorded, 100_000);
  assert.equal(summary.accountsReceivableAsset, 140_000);
  assert.equal(summary.customerAdvanceLiability, 0);
  assert.equal(summary.salesRelatedAssets, 240_000);

  recordSalePayment(sales, sale.id, { amount: 140_000, reference: 'BANK-REF-002' }, instant);
  summary = summarizeSales(sales, instant);
  assert.equal(summary.cashAssetRecorded, 240_000);
  assert.equal(summary.accountsReceivableAsset, 0);
  assert.equal(summary.salesRelatedAssets, 240_000);
  assert.equal(summary.recognizedRevenue, 240_000);
});

test('ledger menolak status yang salah, reference duplikat, overpayment, dan pembatalan berbayar', () => {
  const sales = [];
  const sale = createSale(sales, input, instant);
  captureError(() => fulfillSale(sales, sale.id, instant), 409, /dikonfirmasi/);
  confirmSale(sales, sale.id, instant);
  recordSalePayment(sales, sale.id, { amount: 100_000, reference: 'REF-SAMA' }, instant);
  captureError(() => recordSalePayment(sales, sale.id, { amount: 10_000, reference: 'REF-SAMA' }, instant), 409, /sudah digunakan/);
  captureError(() => recordSalePayment(sales, sale.id, { amount: 140_001, reference: 'REF-LEBIH' }, instant), 400, /melebihi sisa/);
  captureError(() => cancelSale(sales, sale.id, instant), 409, /pengembalian dana/);
  fulfillSale(sales, sale.id, instant);
  captureError(() => cancelSale(sales, sale.id, instant), 409, /tidak dapat dibatalkan/);
  assert.equal(findSale(sales, sale.id).status, 'fulfilled');
});

test('ledger memvalidasi IDR, jumlah baris, kuantitas, harga dan biaya pokok', () => {
  const sales = [];
  captureError(() => createSale(sales, null, instant), 400, /object JSON/);
  captureError(() => createSale(sales, { ...input, currency: 'USD' }, instant), 400, /IDR/);
  captureError(() => createSale(sales, { ...input, items: [] }, instant), 400, /baris/);
  captureError(() => createSale(sales, { ...input, items: [{ ...input.items[0], quantity: 1.5 }] }, instant), 400, /Kuantitas/);
  captureError(() => createSale(sales, { ...input, items: [{ ...input.items[0], unitPrice: -1 }] }, instant), 400, /Harga/);
  captureError(() => createSale(sales, { ...input, items: [{ ...input.items[0], unitCost: undefined }] }, instant), 400, /Biaya pokok/);
  assert.equal(sales.length, 0);
});

test('order batal tidak masuk pendapatan, kas atau piutang', () => {
  const sales = [];
  const sale = createSale(sales, input, instant);
  confirmSale(sales, sale.id, instant);
  cancelSale(sales, sale.id, instant);
  const summary = summarizeSales(sales, instant);
  assert.equal(summary.confirmedOrderValue, 0);
  assert.equal(summary.recognizedRevenue, 0);
  assert.equal(summary.cashAssetRecorded, 0);
  assert.equal(summary.accountsReceivableAsset, 0);
  assert.equal(summary.salesCount, 1);
});
