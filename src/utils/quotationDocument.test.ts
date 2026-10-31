import test from 'node:test';
import assert from 'node:assert/strict';
import { generateFormalQuotationOffer, buildTechnicalSpecMatrix, generateQuotationRefNumber } from './quotationDocument.ts';
import { ProductItem } from '../types.ts';

const testVessel: ProductItem = {
  id: 'prod-wb-550',
  sku: 'ALU-WB-550',
  title: 'Alunautic WB 5.50 Monohull Aluminium Workboat',
  short_desc: 'Heavy-duty 5.50m marine grade 5083 aluminium multirole workboat',
  category_id: 'cat-alunautic',
  price_usd: 48500,
  stock_quantity: 4,
  lead_time_days: 45,
  image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
  certifications: ['ISO 9001:2015', 'CE Category C', 'IACS'],
  specifications: [
    { key: 'Length Overall (LOA)', value: '5.50', unit: 'Meters', highlight: true },
    { key: 'Beam Overall (BOA)', value: '2.10', unit: 'Meters', highlight: true },
    { key: 'Maximum Draft', value: '0.35', unit: 'Meters', highlight: true },
    { key: 'Hull Material', value: 'Aluminium 5083-H111', unit: '', highlight: true },
    { key: 'Max Speed', value: '34', unit: 'Knots', highlight: true },
    { key: 'Person Capacity', value: '6', unit: 'Persons', highlight: true },
  ],
};

test('generateQuotationRefNumber matches HPT format pattern', () => {
  const ref = generateQuotationRefNumber('256');
  assert.match(ref, /^HPT\/\d{3}\/\d{2}\/\d{2} R0$/);
});

test('buildTechnicalSpecMatrix generates exactly 22 technical specification rows', () => {
  const matrix = buildTechnicalSpecMatrix(testVessel);
  assert.equal(matrix.length, 22);
  assert.equal(matrix[0].itemNumber, 1);
  assert.equal(matrix[21].itemNumber, 22);
  assert.equal(matrix.every((r) => r.included === true), true);
  assert.match(matrix[1].requirement, /Aluminium 5083-H111/);
});

test('generateFormalQuotationOffer creates complete 4-section offer matching sample PDF', () => {
  const offer = generateFormalQuotationOffer(testVessel, {
    customer_name: 'Director of Ports',
    company_name: 'Maritime Port Authority',
    email: 'ports@maritime.gov',
  });

  // Reference and Transmittal
  assert.match(offer.referenceNo, /^HPT\/\d{3}\/\d{2}\/\d{2} R0$/);
  assert.match(offer.customizationConfirmation, /Alunautic WB 5.50/);
  assert.equal(offer.client.company, 'Maritime Port Authority');

  // Section 1: Overview
  assert.equal(offer.vesselOverview.loa, '5.50 Meters');
  assert.equal(offer.vesselOverview.boa, '2.10 Meters');
  assert.equal(offer.vesselOverview.hullMaterial, 'Aluminium 5083-H111');

  // Section 2: Matrix
  assert.equal(offer.technicalMatrix.length, 22);

  // Section 3: Commercial Offer
  assert.equal(offer.commercialOffer.baseVesselPrice, 48500);
  assert.ok(offer.commercialOffer.totalExWorks > 48500);
  assert.equal(offer.commercialOffer.currency, 'USD');

  // Section 4: Terms (30/30/30/10)
  assert.equal(offer.commercialTerms.paymentMilestones.length, 4);
  assert.deepEqual(
    offer.commercialTerms.paymentMilestones.map((m) => m.percentage),
    [30, 30, 30, 10]
  );
  assert.match(offer.commercialTerms.warranty, /18 months/);
  assert.equal(offer.commercialTerms.siteServices.standardDailyRateEur, 1200);
  assert.equal(offer.commercialTerms.siteServices.weekendDailyRateEur, 1800);
});
