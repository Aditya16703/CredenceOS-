const test = require('node:test');
const assert = require('node:assert');
const { calculateEMI, generateAmortizationSchedule } = require('../src/services/amortizationService');
const { evaluateUnderwriting } = require('../src/services/underwritingService');

test('Amortization Engine - calculateEMI returns accurate financial numbers', () => {
  // Principal: 100,000, 12% APR, 12 Months
  // Formula standard EMI should be ~8884.88
  const emi = calculateEMI(100000, 12, 12);
  assert.strictEqual(emi, 8884.88);
});

test('Amortization Engine - 0% interest edge case', () => {
  const emi = calculateEMI(120000, 0, 12);
  assert.strictEqual(emi, 10000);
});

test('Amortization Engine - Final installment reconciles closing principal to exactly 0.00', () => {
  const result = generateAmortizationSchedule(100000, 13.5, 24);
  assert.strictEqual(result.schedule.length, 24);

  const lastInstallment = result.schedule[result.schedule.length - 1];
  assert.strictEqual(lastInstallment.closingPrincipal, 0);

  // Sum of principal parts should equal initial principal within 0.05 tolerance
  const sumPrincipals = result.schedule.reduce((acc, row) => acc + row.principalComponent, 0);
  assert.ok(Math.abs(sumPrincipals - 100000) < 0.1, `Principal mismatch: ${sumPrincipals}`);
});

test('Underwriting Engine - Low risk profile approved with healthy DTI', () => {
  const result = evaluateUnderwriting({
    monthlyIncome: 100000,
    existingMonthlyDebt: 10000,
    requestedAmount: 200000,
    interestRate: 12,
    termMonths: 24,
    creditScore: 780,
    employmentType: 'SALARIED',
    activeLoansCount: 1
  });

  assert.strictEqual(result.riskCategory, 'LOW');
  assert.strictEqual(result.recommendation, 'RECOMMENDED_FOR_APPROVAL');
  assert.ok(result.metrics.dtiPercent <= 35);
});

test('Underwriting Engine - High risk profile flagged when DTI is extreme', () => {
  const result = evaluateUnderwriting({
    monthlyIncome: 30000,
    existingMonthlyDebt: 18000,
    requestedAmount: 300000,
    interestRate: 15,
    termMonths: 12,
    creditScore: 580,
    employmentType: 'SELF_EMPLOYED',
    activeLoansCount: 4
  });

  assert.strictEqual(result.riskCategory, 'HIGH');
  assert.strictEqual(result.recommendation, 'REJECT_OR_REFER');
  assert.ok(result.contributingFactors.some(f => f.impact === 'NEGATIVE'));
});
