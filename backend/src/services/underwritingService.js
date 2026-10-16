/**
 * CredenceOS - Transparent Rule-Based Underwriting Engine
 * Evaluates DTI (Debt-To-Income), credit tier, and employment profile.
 * Transparent risk factors and recommendation without opaque automated AI approval.
 */

const { calculateEMI } = require('./amortizationService');

function evaluateUnderwriting({
  monthlyIncome,
  existingMonthlyDebt = 0,
  requestedAmount,
  interestRate = 14,
  termMonths,
  creditScore = 650,
  employmentType = 'SALARIED', // SALARIED, SELF_EMPLOYED, BUSINESS
  activeLoansCount = 0,
  aaData = null
}) {
  const income = parseFloat(monthlyIncome);
  const existingDebt = parseFloat(existingMonthlyDebt) || 0;
  const amount = parseFloat(requestedAmount);
  const tenure = parseInt(termMonths, 10);
  const cScore = parseInt(creditScore, 10);

  if (!income || income <= 0) {
    throw new Error('Monthly income must be greater than zero');
  }

  const projectedEmi = calculateEMI(amount, interestRate, tenure);
  const totalMonthlyCommitment = existingDebt + projectedEmi;

  // DTI = (Total Monthly Obligations / Monthly Income) * 100
  const dti = Math.round((totalMonthlyCommitment / income) * 10000) / 100;

  const factors = [];
  let riskScore = 100; // 0 (Worst) to 100 (Best)

  // Factor 1: DTI ratio
  if (dti <= 35) {
    factors.push({ factor: 'DTI_HEALTHY', impact: 'POSITIVE', description: `DTI is conservative at ${dti}% (<= 35%)` });
  } else if (dti <= 50) {
    riskScore -= 20;
    factors.push({ factor: 'DTI_MODERATE', impact: 'NEUTRAL', description: `DTI is acceptable at ${dti}% (35% - 50%)` });
  } else {
    riskScore -= 45;
    factors.push({ factor: 'DTI_ELEVATED', impact: 'NEGATIVE', description: `High DTI at ${dti}% (> 50% threshold)` });
  }

  // Factor 2: Credit Score
  if (cScore >= 750) {
    factors.push({ factor: 'CREDIT_EXCELLENT', impact: 'POSITIVE', description: `Prime credit score (${cScore})` });
  } else if (cScore >= 650) {
    riskScore -= 15;
    factors.push({ factor: 'CREDIT_AVERAGE', impact: 'NEUTRAL', description: `Fair credit score (${cScore})` });
  } else {
    riskScore -= 40;
    factors.push({ factor: 'CREDIT_SUBPRIME', impact: 'NEGATIVE', description: `Subprime credit score below 650 (${cScore})` });
  }

  // Factor 3: Active Loans
  if (activeLoansCount > 3) {
    riskScore -= 15;
    factors.push({ factor: 'OVER_LEVERAGED', impact: 'NEGATIVE', description: `${activeLoansCount} active credit facilities detected` });
  }

  // Factor 4: RBI Account Aggregator Cashflow Verification
  if (aaData && aaData.verifiedSalary) {
    const verifiedSalary = parseFloat(aaData.verifiedSalary);
    const amb = parseFloat(aaData.averageMonthlyBalance || 0);
    const bounces = parseInt(aaData.bouncedDebitsCount || 0, 10);

    // Check discrepancy between declared income and verified bank credits
    if (income > verifiedSalary * 1.2) {
      riskScore -= 30;
      factors.push({
        factor: 'AA_INCOME_MISMATCH',
        impact: 'NEGATIVE',
        description: `Declared income exceeds bank verified salary credits by > 20%`
      });
    } else {
      riskScore += 10;
      factors.push({
        factor: 'AA_SALARY_VERIFIED',
        impact: 'POSITIVE',
        description: `Salary verified directly via RBI Account Aggregator (${aaData.employerName || 'Employer'})`
      });
    }

    if (bounces > 0) {
      riskScore -= Math.min(30, bounces * 10);
      factors.push({
        factor: 'AA_BOUNCED_DEBITS',
        impact: 'NEGATIVE',
        description: `${bounces} ECS/NACH return/bounce charges detected in bank statements`
      });
    }

    if (amb >= projectedEmi * 1.5) {
      riskScore += 5;
      factors.push({
        factor: 'AA_HEALTHY_BUFFER',
        impact: 'POSITIVE',
        description: `Average bank balance provides healthy 1.5x EMI coverage buffer`
      });
    }
  }

  // Risk Classification
  let riskCategory = 'LOW';
  let recommendation = 'APPROVE';

  if (riskScore < 50 || dti > 60 || cScore < 600) {
    riskCategory = 'HIGH';
    recommendation = 'REJECT_OR_REFER';
  } else if (riskScore < 75 || dti > 45) {
    riskCategory = 'MEDIUM';
    recommendation = 'MANUAL_REVIEW';
  } else {
    riskCategory = 'LOW';
    recommendation = 'RECOMMENDED_FOR_APPROVAL';
  }

  return {
    evaluatedAt: new Date().toISOString(),
    metrics: {
      monthlyIncome: income,
      existingMonthlyDebt: existingDebt,
      projectedEmi,
      totalMonthlyCommitment,
      dtiPercent: dti,
      creditScore: cScore,
      employmentType,
      activeLoansCount
    },
    riskScore: Math.max(0, riskScore),
    riskCategory, // LOW, MEDIUM, HIGH
    recommendation, // RECOMMENDED_FOR_APPROVAL, MANUAL_REVIEW, REJECT_OR_REFER
    contributingFactors: factors
  };
}

module.exports = {
  evaluateUnderwriting
};
