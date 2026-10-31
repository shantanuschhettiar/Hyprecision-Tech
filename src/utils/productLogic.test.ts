import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterAndSortProducts,
  parseNaturalLanguageQuery,
  buildProductComparisonMatrix,
  validateRfqInput,
  validateProductInput,
  type ProductItem,
} from './productLogic.ts';

const mockProducts: ProductItem[] = [
  {
    id: 'p1',
    category_id: 'cat-hydraulics',
    category_slug: 'hydraulics',
    category_name: 'Hydraulic Systems',
    sku: 'HY-SP-40B',
    title: 'Three-Spindle High Pressure Screw Pump (0-40 Bar)',
    short_desc: 'Self-priming positive displacement screw pump for fuel and hydraulic systems.',
    price_usd: 1850,
    stock_quantity: 18,
    lead_time_days: 5,
    image_url: 'https://example.com/p1.jpg',
    specifications: [
      { key: 'Working Pressure', value: '40', unit: 'Bar', highlight: true },
      { key: 'Flow Rate', value: '350', unit: 'L/min', highlight: true },
      { key: 'Material', value: 'Nodular Cast Iron GGG-40' },
    ],
  },
  {
    id: 'p2',
    category_id: 'cat-filtration',
    category_slug: 'filtration',
    category_name: 'Industrial Filtration',
    sku: 'HY-FLT-MCB',
    title: 'Mechanically Cleaned High-Flow Filter Housing',
    short_desc: 'Continuous mechanical scraper system eliminates disposable bags.',
    price_usd: 3200,
    stock_quantity: 4,
    lead_time_days: 10,
    image_url: 'https://example.com/p2.jpg',
    specifications: [
      { key: 'Filtration Rating', value: '25-500', unit: 'Microns', highlight: true },
      { key: 'Working Pressure', value: '16', unit: 'Bar' },
      { key: 'Material', value: 'SS 316L' },
    ],
  },
  {
    id: 'p3',
    category_id: 'cat-cnc',
    category_slug: 'cnc-machining',
    category_name: 'Precision CNC Machining',
    sku: 'HY-CNC-TI6',
    title: '5-Axis Titanium Aerospace Manifold Block',
    short_desc: 'Ultra-high precision CNC milled from Grade 5 Ti-6Al-4V.',
    price_usd: 460,
    stock_quantity: 0,
    lead_time_days: 3,
    image_url: 'https://example.com/p3.jpg',
    specifications: [
      { key: 'Tolerance', value: '±0.005', unit: 'mm', highlight: true },
      { key: 'Material', value: 'Titanium Grade 5' },
    ],
  },
];

test('filterAndSortProducts filters by category slug', () => {
  const result = filterAndSortProducts(mockProducts, { categorySlug: 'hydraulics' });
  assert.equal(result.length, 1);
  assert.equal(result[0].sku, 'HY-SP-40B');
});

test('filterAndSortProducts filters by search term across title, sku, and specs', () => {
  const bySku = filterAndSortProducts(mockProducts, { searchTerm: 'TI6' });
  assert.equal(bySku.length, 1);
  assert.equal(bySku[0].sku, 'HY-CNC-TI6');

  const bySpec = filterAndSortProducts(mockProducts, { searchTerm: 'Microns' });
  assert.equal(bySpec.length, 1);
  assert.equal(bySpec[0].sku, 'HY-FLT-MCB');
});

test('filterAndSortProducts filters by price range and in-stock only', () => {
  const filtered = filterAndSortProducts(mockProducts, {
    maxPrice: 2000,
    inStockOnly: true,
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].sku, 'HY-SP-40B'); // HY-CNC-TI6 is 460 but stock is 0
});

test('filterAndSortProducts sorts by price ascending', () => {
  const sorted = filterAndSortProducts(mockProducts, { sortBy: 'price-asc' });
  assert.equal(sorted[0].price_usd, 460);
  assert.equal(sorted[sorted.length - 1].price_usd, 3200);
});

test('parseNaturalLanguageQuery extracts price conditions and SKU', () => {
  const query = 'Show me pumps under $2000 with high pressure';
  const parsed = parseNaturalLanguageQuery(query);
  assert.equal(parsed.maxPrice, 2000);
  assert.equal(parsed.suggestedAction, 'SEARCH');

  const adminQuery = 'Update stock of HY-SP-40B to 25 units';
  const parsedAdmin = parseNaturalLanguageQuery(adminQuery);
  assert.equal(parsedAdmin.suggestedAction, 'DB_COMMAND');
  assert.equal(parsedAdmin.targetSku, 'HY-SP-40B');
});

test('buildProductComparisonMatrix builds matrix with diff flags', () => {
  const matrix = buildProductComparisonMatrix([mockProducts[0], mockProducts[1]]);
  assert.ok(matrix.allSpecKeys.includes('Working Pressure'));
  assert.ok(matrix.allSpecKeys.includes('Material'));

  const pressureRow = matrix.rows.find((r) => r.specKey === 'Working Pressure');
  assert.ok(pressureRow);
  assert.equal(pressureRow.isDifferent, true);
  assert.equal(pressureRow.values['p1'], '40 Bar');
  assert.equal(pressureRow.values['p2'], '16 Bar');
});

test('validateRfqInput rejects invalid emails and empty customer names', () => {
  const invalid = validateRfqInput({ customer_name: '', email: 'not-an-email' });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.customer_name);
  assert.ok(invalid.errors.email);

  const valid = validateRfqInput({
    customer_name: 'John Engineering',
    email: 'john@industrial-buyer.com',
    quantity_requested: 5,
  });
  assert.equal(valid.valid, true);
});

test('validateProductInput rejects negative price and stock', () => {
  const invalid = validateProductInput({ sku: 'AB', title: '', price_usd: -10, stock_quantity: -5 });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.sku);
  assert.ok(invalid.errors.price_usd);
  assert.ok(invalid.errors.stock_quantity);

  const valid = validateProductInput({
    sku: 'HY-PUMP-X1',
    title: 'Hydraulic Piston Pump',
    price_usd: 1200,
    stock_quantity: 10,
  });
  assert.equal(valid.valid, true);
});
