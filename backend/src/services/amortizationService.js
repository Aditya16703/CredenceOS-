/**
 * CredenceOS - Amortization & Repayment Engine
 * Standard reducing-balance EMI calculation with monthly repayment schedule.
 * Handles final installment rounding reconciliation so sum(principals) === total principal.
 */

function calculateEMI(principal, annualRatePercent, termMonths) {
  if (!principal || principal <= 0) return 0;
  if (!termMonths || termMonths <= 0) return 0;
  
  // If 0% interest
  if (annualRatePercent === 0) {
    return Math.round((principal / termMonths) * 100) / 100;
  }

  const monthlyRate = annualRatePercent / 12 / 100;
  // EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
  const factor = Math.pow(1 + monthlyRate, termMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return Math.round(emi * 100) / 100;
}

function generateAmortizationSchedule(principal, annualRatePercent, termMonths, startDate = new Date()) {
  const p = parseFloat(principal);
  const rate = parseFloat(annualRatePercent);
  const n = parseInt(termMonths, 10);

  if (p <= 0 || n <= 0) {
    throw new Error('Principal and termMonths must be greater than zero');
  }

  const monthlyRate = rate / 12 / 100;
  const emi = calculateEMI(p, rate, n);

  let currentBalance = p;
  const schedule = [];
  const baseDate = new Date(startDate);

  let totalInterest = 0;
  let totalPrincipalPaid = 0;

  for (let installmentNo = 1; installmentNo <= n; installmentNo++) {
    const dueDate = new Date(baseDate);
    dueDate.setMonth(dueDate.getMonth() + installmentNo);

    const interestComponent = Math.round((currentBalance * monthlyRate) * 100) / 100;
    let principalComponent = Math.round((emi - interestComponent) * 100) / 100;

    // Edge case / Final installment reconciliation:
    // Ensure closing principal reaches exactly 0.00 without penny discrepancies
    if (installmentNo === n || principalComponent > currentBalance) {
      principalComponent = Math.round(currentBalance * 100) / 100;
    }

    const actualEmi = Math.round((principalComponent + interestComponent) * 100) / 100;
    const closingBalance = Math.max(0, Math.round((currentBalance - principalComponent) * 100) / 100);

    schedule.push({
      installmentNumber: installmentNo,
      dueDate: dueDate.toISOString(),
      openingPrincipal: currentBalance,
      principalComponent,
      interestComponent,
      emi: actualEmi,
      closingPrincipal: closingBalance,
      status: 'SCHEDULED', // SCHEDULED, PAID, OVERDUE, WAIVED
      paidDate: null,
      paymentReference: null
    });

    totalInterest += interestComponent;
    totalPrincipalPaid += principalComponent;
    currentBalance = closingBalance;
  }

  return {
    principal: p,
    annualInterestRate: rate,
    termMonths: n,
    monthlyEMI: emi,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayable: Math.round((p + totalInterest) * 100) / 100,
    schedule
  };
}

module.exports = {
  calculateEMI,
  generateAmortizationSchedule
};
