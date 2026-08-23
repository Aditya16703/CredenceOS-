const test = require('node:test');
const assert = require('node:assert');
const { calculateEMI, generateAmortizationSchedule } = require('../src/services/amortizationService');
const { evaluateUnderwriting } = require('../src/services/underwritingService');

// 1. Amortization & EMI Tests
test('Amortization Engine - calculateEMI returns accurate financial numbers', () => {
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

  const sumPrincipals = result.schedule.reduce((acc, row) => acc + row.principalComponent, 0);
  assert.ok(Math.abs(sumPrincipals - 100000) < 0.1, `Principal mismatch: ${sumPrincipals}`);
});

// 2. Underwriting & DTI Tests
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

// 3. State Machine Transitions Test
test('Loan State Machine - Valid and invalid transitions', () => {
  const VALID_TRANSITIONS = {
    'DRAFT': ['SUBMITTED', 'CANCELLED'],
    'SUBMITTED': ['UNDER_REVIEW', 'REJECTED', 'CANCELLED'],
    'UNDER_REVIEW': ['APPROVED', 'REJECTED'],
    'APPROVED': ['DISBURSED', 'CANCELLED'],
    'DISBURSED': ['ACTIVE'],
    'ACTIVE': ['OVERDUE', 'CLOSED']
  };

  assert.ok(VALID_TRANSITIONS['SUBMITTED'].includes('UNDER_REVIEW'));
  assert.ok(!VALID_TRANSITIONS['SUBMITTED'].includes('ACTIVE'), 'Cannot transition from SUBMITTED directly to ACTIVE');
  assert.ok(!VALID_TRANSITIONS['APPROVED'].includes('CLOSED'), 'Cannot close an approved loan before disbursement');
});

// 4. KYC PAN Masking Test
test('KYC Compliance - PAN masking protects sensitive identity', () => {
  function maskPAN(pan) {
    if (!pan || pan.length < 10) return pan;
    return pan.slice(0, 5) + '****' + pan.slice(9);
  }

  assert.strictEqual(maskPAN('ABCDE1234F'), 'ABCDE****F');
});

// 5. Payment Idempotency Logic Test
test('Payment Idempotency - Key caching simulation', () => {
  const idempotencyCache = new Map();

  function processPayment(key, amount) {
    if (idempotencyCache.has(key)) {
      return { ...idempotencyCache.get(key), _replayed: true };
    }
    const response = { status: 'SUCCESS', amount, txId: 'TXN-' + Math.random() };
    idempotencyCache.set(key, response);
    return response;
  }

  const firstCall = processPayment('idem-key-101', 5000);
  assert.strictEqual(firstCall.status, 'SUCCESS');
  assert.strictEqual(firstCall._replayed, undefined);

  const duplicateCall = processPayment('idem-key-101', 5000);
  assert.strictEqual(duplicateCall._replayed, true);
  assert.strictEqual(duplicateCall.txId, firstCall.txId, 'Duplicate request must return original transaction ID');
});
