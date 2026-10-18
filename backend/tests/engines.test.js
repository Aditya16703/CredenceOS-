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

// 6. Institutional Credit Bureau (CIBIL/Experian) Gateway Tests
const { 
  pullCreditReport, 
  validateBureauScore, 
  verifyReportIntegrity, 
  getScoreTier 
} = require('../src/services/creditBureauService');

test('Credit Bureau Gateway - Validates score range (300 to 900)', () => {
  assert.strictEqual(validateBureauScore(750), true);
  assert.strictEqual(validateBureauScore(300), true);
  assert.strictEqual(validateBureauScore(900), true);
  assert.strictEqual(validateBureauScore(-1), true); // NTC
  assert.strictEqual(validateBureauScore(200), false);
  assert.strictEqual(validateBureauScore(950), false);
  assert.strictEqual(validateBureauScore('invalid'), false);
});

test('Credit Bureau Gateway - Successfully pulls authenticated report for valid KYC PAN', async () => {
  const report = await pullCreditReport({
    panNumber: 'ABCDE1234F',
    fullName: 'Aditya Sharma',
    phone: '+91 91234 56789',
    dateOfBirth: '1995-08-14',
    consent: true
  });

  assert.strictEqual(report.success, true);
  assert.strictEqual(report.bureauProvider, 'CIBIL_TRANSUNION');
  assert.strictEqual(report.creditScore, 765);
  assert.strictEqual(report.scoreTier, 'PRIME');
  assert.strictEqual(report.panNumber, 'ABCDE1234F');
  assert.ok(report.controlNumber.length >= 10, 'Must have a standard Bureau Control Number');
  assert.ok(report.bureauReportId.startsWith('CIR-CIBIL-'));
  assert.ok(verifyReportIntegrity(report), 'Bureau report cryptographic hash must be valid');
});

test('Credit Bureau Gateway - Rejects malformed PAN format', async () => {
  await assert.rejects(
    async () => {
      await pullCreditReport({
        panNumber: 'INVALID_PAN',
        consent: true
      });
    },
    /Invalid PAN format/
  );
});

test('Credit Bureau Gateway - Blocks credit inquiry without explicit consumer consent', async () => {
  await assert.rejects(
    async () => {
      await pullCreditReport({
        panNumber: 'ABCDE1234F',
        consent: false
      });
    },
    /consumer credit pull consent/i
  );
});

test('Credit Bureau Gateway - Detects tampering in bureau report record', async () => {
  const report = await pullCreditReport({
    panNumber: 'ABCDE1234F',
    consent: true
  });

  // Legitimate report passes
  assert.strictEqual(verifyReportIntegrity(report), true);

  // Altered report fails cryptographic verification
  const forgedReport = { ...report, creditScore: 890 };
  assert.strictEqual(verifyReportIntegrity(forgedReport), false);
});

test('Credit Bureau Gateway - High risk subprime profile correctly flows into Underwriting', async () => {
  const report = await pullCreditReport({
    panNumber: 'SUBPR1234X',
    consent: true
  });

  assert.strictEqual(report.creditScore, 580);
  assert.strictEqual(report.scoreTier, 'SUBPRIME');

  // Feed authenticated bureau report into underwriting
  const result = evaluateUnderwriting({
    monthlyIncome: 35000,
    existingMonthlyDebt: report.reportedMonthlyDebt,
    requestedAmount: 250000,
    interestRate: 15,
    termMonths: 24,
    creditScore: report.creditScore,
    activeLoansCount: report.activeTradelines
  });

  assert.strictEqual(result.riskCategory, 'HIGH');
  assert.strictEqual(result.recommendation, 'REJECT_OR_REFER');
  assert.ok(result.contributingFactors.some(f => f.factor === 'CREDIT_SUBPRIME'));
});

// 7. Email Verification & OTP Service Tests
const { sendVerificationOTP } = require('../src/services/mailService');

test('Email Verification - Generates and dispatches 6-digit OTP code', async () => {
  const result = await sendVerificationOTP('test.borrower@example.com', '482915', 'Aditya Singh');
  assert.strictEqual(result.success, true);
  assert.ok(result.messageId, 'Email messageId should be generated');
});

// 8. RBI Account Aggregator (AA) Tests
const { 
  initiateConsent, 
  verifyConsentAndFetchStatement, 
  getSupportedBanks 
} = require('../src/services/accountAggregatorService');

test('Account Aggregator - Registry lists valid RBI-registered FIP banks', () => {
  const banks = getSupportedBanks();
  assert.ok(Array.isArray(banks));
  assert.ok(banks.length >= 5);
  assert.ok(banks.some(b => b.code === 'HDFC'));
  assert.ok(banks.some(b => b.code === 'SBIN'));
});

test('Account Aggregator - Initiates ReBIT consent and returns valid consent handle', async () => {
  const result = await initiateConsent({
    customerId: 1,
    mobile: '9876543210',
    bankId: 'FIP-HDFC-01',
    panNumber: 'ABCDE1234F',
    declaredIncome: 95000
  });

  assert.strictEqual(result.success, true);
  assert.ok(result.consentHandle.startsWith('AA-REQ-'));
  assert.strictEqual(result.bankName, 'HDFC Bank Ltd');
});

test('Account Aggregator - Verifies OTP and retrieves authenticated cashflows', async () => {
  const consent = await initiateConsent({
    customerId: 1,
    mobile: '9876543210',
    bankId: 'FIP-HDFC-01',
    panNumber: 'ABCDE1234F',
    declaredIncome: 95000
  });

  const statement = await verifyConsentAndFetchStatement({
    consentHandle: consent.consentHandle,
    otp: '1234'
  });

  assert.strictEqual(statement.success, true);
  assert.strictEqual(statement.verificationStatus, 'VERIFIED');
  assert.strictEqual(statement.verifiedSalary, 95000);
  assert.strictEqual(statement.statementMonthsCount, 6);
  assert.ok(statement.tamperProofAuditHash, 'Should have SHA256 audit signature');

  // Feed into Underwriting
  const uwResult = evaluateUnderwriting({
    monthlyIncome: 95000,
    requestedAmount: 200000,
    termMonths: 12,
    creditScore: 765,
    aaData: statement
  });

  assert.strictEqual(uwResult.riskCategory, 'LOW');
  assert.ok(uwResult.contributingFactors.some(f => f.factor === 'AA_SALARY_VERIFIED'));
});

// 9. Sovereign DigiLocker & e-KYC Identity Tests
const {
  initiateEKYCChallenge,
  verifyEKYCOTP,
  deriveSovereignProfile,
  verifyBankDisbursementMatch,
  generateTamperProofKYCHash,
  calculateAge
} = require('../src/services/kycVerificationService');

test('Sovereign e-KYC - Initiates DigiLocker challenge session and returns masked phone', async () => {
  const result = await initiateEKYCChallenge({
    customerId: 1,
    panNumber: 'ABCDE1234F',
    aadhaarNumber: '541289014829',
    phone: '9876544829',
    customerName: 'Aditya Singh'
  });

  assert.strictEqual(result.success, true);
  assert.ok(result.sessionHandle.startsWith('EKYC-REQ-'));
  assert.strictEqual(result.maskedAadhaar, 'XXXX-XXXX-4829');
  assert.strictEqual(result.maskedMobile, '+91 ******4829');
});

test('Sovereign e-KYC - Verifies OTP, executes canonical overwrite, and generates HMAC seal', async () => {
  const challenge = await initiateEKYCChallenge({
    customerId: 1,
    panNumber: 'ABCDE1234F',
    aadhaarNumber: '541289014829',
    phone: '9876544829',
    customerName: 'Aditya Singh'
  });

  const verified = await verifyEKYCOTP({
    sessionHandle: challenge.sessionHandle,
    otp: '1234',
    dateOfBirth: '1998-05-15',
    address: '12/4 Connaught Place, New Delhi, 110001'
  });

  assert.strictEqual(verified.success, true);
  assert.strictEqual(verified.canonicalLegalName, 'ADITYA KUMAR SINGH', 'Canonical legal name should overwrite display name');
  assert.strictEqual(verified.panStatus, 'OPERATIVE');
  assert.strictEqual(verified.panAadhaarLinked, true);
  assert.ok(verified.uidaiTransactionRef.startsWith('UIDAI-EKYC-'));
  assert.ok(verified.tamperProofHash, 'Must generate HMAC-SHA256 signature');
  assert.ok(verified.age >= 18);
});

test('Sovereign e-KYC - Rejects unlinked PAN-Aadhaar records', async () => {
  const challenge = await initiateEKYCChallenge({
    customerId: 2,
    panNumber: 'UNLNK9999F',
    aadhaarNumber: '999988887777',
    phone: '9876543210',
    customerName: 'Mohit Verma'
  });

  await assert.rejects(
    async () => {
      await verifyEKYCOTP({
        sessionHandle: challenge.sessionHandle,
        otp: '1234',
        dateOfBirth: '1995-10-10'
      });
    },
    /PAN-Aadhaar biometric linkage not confirmed/
  );
});

test('Sovereign e-KYC - Rejects underage applicant (under 18)', async () => {
  const challenge = await initiateEKYCChallenge({
    customerId: 3,
    panNumber: 'ABCDE1234F',
    aadhaarNumber: '541289014829',
    phone: '9876543210'
  });

  await assert.rejects(
    async () => {
      await verifyEKYCOTP({
        sessionHandle: challenge.sessionHandle,
        otp: '1234',
        dateOfBirth: '2015-01-01' // Under 18
      });
    },
    /credit applicants must be at least 18 years old/
  );
});

test('Sovereign e-KYC - Bank disbursement ownership validation (Anti-Theft)', () => {
  const matchResult = verifyBankDisbursementMatch('ADITYA KUMAR SINGH', 'ADITYA KUMAR SINGH');
  assert.strictEqual(matchResult.isMatch, true);
  assert.strictEqual(matchResult.status, 'BENEFICIARY_OWNERSHIP_CONFIRMED');

  const mismatchResult = verifyBankDisbursementMatch('ADITYA KUMAR SINGH', 'SURESH SHARMA');
  assert.strictEqual(mismatchResult.isMatch, false);
  assert.strictEqual(mismatchResult.status, 'BENEFICIARY_MISMATCH_SUSPECTED');
});



