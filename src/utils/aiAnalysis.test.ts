import test from 'node:test';
import assert from 'node:assert/strict';
import { ProductItem } from '../types.ts';

const mockProducts: ProductItem[] = [
  {
    id: 'prod-1',
    category_id: 'cat-hydraulics',
    category_slug: 'hydraulics',
    category_name: 'High-Pressure Hydraulics',
    sku: 'HY-SP-40B',
    title: 'Three-Spindle High Pressure Screw Pump (40 Bar)',
    short_desc: 'Continuous pulsation-free fluid transfer for heavy fuel and lube oils.',
    price_usd: 1850,
    stock_quantity: 14,
    lead_time_days: 5,
    image_url: '/images/products/screw-pump.png',
    specifications: [
      { key: 'Max Working Pressure', value: '40', unit: 'Bar' },
      { key: 'Flow Capacity', value: '350', unit: 'L/min' },
      { key: 'Viscosity Handling', value: '3 - 3800', unit: 'cSt' },
    ],
  },
  {
    id: 'prod-2',
    category_id: 'cat-hydraulics',
    category_slug: 'hydraulics',
    category_name: 'High-Pressure Hydraulics',
    sku: 'HY-ACC-BLD',
    title: '350 Bar High-Pressure Bladder Accumulator',
    short_desc: 'ASME Section VIII Div 1 certified nitrogen-charged energy storage vessel.',
    price_usd: 920,
    stock_quantity: 4,
    lead_time_days: 3,
    image_url: '/images/products/accumulator.png',
    specifications: [
      { key: 'Max Working Pressure', value: '350', unit: 'Bar' },
      { key: 'Nominal Volume', value: '25', unit: 'Liters' },
      { key: 'Shell Material', value: '34CrMo4 Chrome-Moly Forged Steel' },
    ],
  },
];

test('Product snapshot contains vital engineering attributes for Gemini context', () => {
  const snapshot = mockProducts.map((p) => ({
    sku: p.sku,
    title: p.title,
    category: p.category_name,
    price_usd: p.price_usd,
    stock_quantity: p.stock_quantity,
    lead_time_days: p.lead_time_days,
    specifications: p.specifications.map((s) => `${s.key}: ${s.value} ${s.unit || ''}`.trim()),
  }));

  assert.equal(snapshot.length, 2);
  assert.equal(snapshot[0].sku, 'HY-SP-40B');
  assert.deepEqual(snapshot[0].specifications, [
    'Max Working Pressure: 40 Bar',
    'Flow Capacity: 350 L/min',
    'Viscosity Handling: 3 - 3800 cSt',
  ]);
  assert.equal(snapshot[1].stock_quantity, 4);
});

test('Context analysis identifies low stock product (< 5 units)', () => {
  const lowStock = mockProducts.filter((p) => p.stock_quantity <= 5);
  assert.equal(lowStock.length, 1);
  assert.equal(lowStock[0].sku, 'HY-ACC-BLD');
});
