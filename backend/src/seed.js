/**
 * CredenceOS - Comprehensive Multi-Persona Database Seeder
 * Populates 8-10 diverse real-world profiles across:
 * - Roles: Admin, Loan Officer, Collection Agent, Various Borrowers
 * - KYC States: VERIFIED, UNDER_REVIEW, SUBMITTED
 * - Loan Lifecycles: ACTIVE, OVERDUE (Delinquent), UNDER_REVIEW, CLOSED (Fully Paid), REJECTED, SUBMITTED
 * - Underwriting: Prime, Near-Prime, Subprime, High DTI
 * - Full Amortization schedules, Ledger Payments, and Tamper-Proof Audit Trails.
 */

const bcrypt = require('bcryptjs');
const { 
  sequelize, 
  User, 
  Customer, 
  Agent, 
  KYC, 
  Loan, 
  UnderwritingRecord, 
  RepaymentSchedule, 
  Payment, 
  AuditLog 
} = require('./models');
const { calculateEMI, generateAmortizationSchedule } = require('./services/amortizationService');

async function seedDatabase() {
  console.log('🔄 Connecting to database and synchronizing schema...');
  // Sync schema without crashing existing constraints
  await sequelize.sync({ force: true });
  console.log('✅ Schema synchronized successfully.');

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('agent123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

  console.log('🌱 Seeding 8+ diverse institutional users and borrowers...');

  // =========================================================================
  // 1. INSTITUTIONAL STAFF (Admin, Loan Officer, 2 Collection Agents)
  // =========================================================================
  const adminUser = await User.create({
    name: 'Vikramaditya Sharma',
    email: 'admin@example.com',
    password: hashedPassword,
    role: 'admin',
    isEmailVerified: true
  });

  const officerUser = await User.create({
    name: 'Pooja Iyer',
    email: 'officer@example.com',
    password: staffPassword,
    role: 'loan_officer',
    isEmailVerified: true
  });

  const agent1User = await User.create({
    name: 'Rajesh Kulkarni',
    email: 'agent@example.com',
    password: staffPassword,
    role: 'agent',
    isEmailVerified: true
  });
  const agent1 = await Agent.create({
    id: agent1User.id,
    name: agent1User.name,
    email: agent1User.email,
    phone: '+91 98765 43210'
  });

  const agent2User = await User.create({
    name: 'Amit Saxena',
    email: 'agent2@example.com',
    password: staffPassword,
    role: 'agent',
    isEmailVerified: true
  });
  const agent2 = await Agent.create({
    id: agent2User.id,
    name: agent2User.name,
    email: agent2User.email,
    phone: '+91 98111 22334'
  });

  // =========================================================================
  // 2. BORROWER PERSONAS (6 Diverse Real-World Cases)
  // =========================================================================

  // --- Persona A: Ananya Verma (Prime Salaried, Active Healthy Loan) ---
  const cust1User = await User.create({
    name: 'Ananya Verma',
    email: 'customer@example.com',
    password: customerPassword,
    role: 'customer',
    isEmailVerified: true
  });
  const cust1 = await Customer.create({
    id: cust1User.id,
    name: cust1User.name,
    email: cust1User.email,
    phone: '+91 91234 56789',
    address: 'Flat 402, Green Heights, Indiranagar, Bengaluru, KA - 560038'
  });
  const kyc1 = await KYC.create({
    customerId: cust1.id,
    panNumber: 'ABCDE1234F',
    aadhaarLastFour: '7890',
    dateOfBirth: '1995-08-14',
    address: cust1.address,
    status: 'VERIFIED',
    submittedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    reviewedAt: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000),
    reviewerId: adminUser.id
  });

  // Loan 1: Active Loan (₹200,000, 12 mo, 13.5%, 2 EMIs paid on time)
  const p1 = 200000;
  const amort1 = generateAmortizationSchedule(p1, 13.5, 12);
  const loan1 = await Loan.create({
    customerId: cust1.id,
    agentId: agent1.id,
    assignedOfficerId: officerUser.id,
    amount: p1,
    interestRate: 13.5,
    termMonths: 12,
    monthlyEMI: amort1.monthlyEMI,
    totalPayable: amort1.totalPayable,
    outstandingPrincipal: amort1.schedule[1].closingPrincipal,
    status: 'ACTIVE',
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    disbursedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    recoveryStatus: 'CURRENT_ON_TIME'
  });
  await UnderwritingRecord.create({
    loanId: loan1.id,
    monthlyIncome: 95000,
    existingMonthlyDebt: 12000,
    dtiPercent: 31.48,
    creditScore: 765,
    employmentType: 'SALARIED',
    riskScore: 88,
    riskCategory: 'LOW',
    recommendation: 'RECOMMENDED_FOR_APPROVAL',
    contributingFactors: [
      { factor: 'DTI_HEALTHY', impact: 'POSITIVE', description: 'Conservative DTI of 31.48% (<= 35%)' },
      { factor: 'CREDIT_EXCELLENT', impact: 'POSITIVE', description: 'Prime CIBIL Score (765)' }
    ],
    bureauReportId: 'CIR-CIBIL-202609018471',
    bureauProvider: 'CIBIL_TRANSUNION',
    bureauControlNumber: '202609018471',
    bureauInquiryDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    bureauScoreTier: 'PRIME',
    tamperProofHash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'
  });
  // Repayment schedule for Loan 1
  const sched1 = amort1.schedule.map((item, idx) => ({
    loanId: loan1.id,
    installmentNumber: item.installmentNumber,
    dueDate: item.dueDate.split('T')[0],
    openingPrincipal: item.openingPrincipal,
    principalComponent: item.principalComponent,
    interestComponent: item.interestComponent,
    totalEMI: item.emi,
    closingPrincipal: item.closingPrincipal,
    status: idx < 2 ? 'PAID' : 'SCHEDULED',
    paidDate: idx < 2 ? new Date(Date.now() - (55 - idx * 30) * 24 * 60 * 60 * 1000) : null,
    paymentReference: idx < 2 ? `TXN-EMI-00${idx + 1}` : null
  }));
  await RepaymentSchedule.bulkCreate(sched1);
  await Payment.create({
    loanId: loan1.id,
    repaymentScheduleId: 1,
    amount: amort1.monthlyEMI,
    paymentDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
    transactionReference: 'TXN-EMI-001',
    idempotencyKey: 'idem-key-001',
    paymentMethod: 'MOCK_UPI',
    status: 'SUCCESS',
    reconciled: true
  });
  await Payment.create({
    loanId: loan1.id,
    repaymentScheduleId: 2,
    amount: amort1.monthlyEMI,
    paymentDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    transactionReference: 'TXN-EMI-002',
    idempotencyKey: 'idem-key-002',
    paymentMethod: 'MOCK_UPI',
    status: 'SUCCESS',
    reconciled: true
  });


  // --- Persona B: Rohan Deshmukh (Subprime, Overdue Delinquent Loan) ---
  const cust2User = await User.create({
    name: 'Rohan Deshmukh',
    email: 'rohan.deshmukh@example.com',
    password: customerPassword,
    role: 'customer',
    isEmailVerified: true
  });
  const cust2 = await Customer.create({
    id: cust2User.id,
    name: cust2User.name,
    email: cust2User.email,
    phone: '+91 98220 44556',
    address: 'B-12, Sai Krupa Society, Shivaji Nagar, Pune, MH - 411005'
  });
  await KYC.create({
    customerId: cust2.id,
    panNumber: 'SUBPR9876K',
    aadhaarLastFour: '4512',
    dateOfBirth: '1991-03-22',
    address: cust2.address,
    status: 'VERIFIED',
    submittedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    reviewedAt: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000),
    reviewerId: officerUser.id
  });
  const p2 = 150000;
  const amort2 = generateAmortizationSchedule(p2, 16.5, 12);
  const loan2 = await Loan.create({
    customerId: cust2.id,
    agentId: agent1.id,
    assignedOfficerId: officerUser.id,
    amount: p2,
    interestRate: 16.5,
    termMonths: 12,
    monthlyEMI: amort2.monthlyEMI,
    totalPayable: amort2.totalPayable,
    outstandingPrincipal: p2,
    status: 'OVERDUE',
    startDate: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
    disbursedDate: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
    recoveryStatus: 'FIELD_VISIT_SCHEDULED'
  });
  await UnderwritingRecord.create({
    loanId: loan2.id,
    monthlyIncome: 42000,
    existingMonthlyDebt: 18000,
    dtiPercent: 77.74,
    creditScore: 580,
    employmentType: 'SELF_EMPLOYED',
    riskScore: 25,
    riskCategory: 'HIGH',
    recommendation: 'REJECT_OR_REFER',
    contributingFactors: [
      { factor: 'DTI_ELEVATED', impact: 'NEGATIVE', description: 'Extreme DTI of 77.74% (> 50%)' },
      { factor: 'CREDIT_SUBPRIME', impact: 'NEGATIVE', description: 'Subprime Credit Score (580)' },
      { factor: 'OVER_LEVERAGED', impact: 'NEGATIVE', description: '4 active tradelines detected' }
    ],
    bureauReportId: 'CIR-CIBIL-202607149021',
    bureauProvider: 'CIBIL_TRANSUNION',
    bureauControlNumber: '202607149021',
    bureauInquiryDate: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
    bureauScoreTier: 'SUBPRIME',
    tamperProofHash: 'subprime_audit_hash_9876543210abcdef'
  });
  const sched2 = amort2.schedule.map((item, idx) => ({
    loanId: loan2.id,
    installmentNumber: item.installmentNumber,
    dueDate: item.dueDate.split('T')[0],
    openingPrincipal: item.openingPrincipal,
    principalComponent: item.principalComponent,
    interestComponent: item.interestComponent,
    totalEMI: item.emi,
    closingPrincipal: item.closingPrincipal,
    status: idx < 2 ? 'OVERDUE' : 'SCHEDULED'
  }));
  await RepaymentSchedule.bulkCreate(sched2);


  // --- Persona C: Dr. Meera Nair (High-Net-Worth Prime, Application UNDER_REVIEW) ---
  const cust3User = await User.create({
    name: 'Dr. Meera Nair',
    email: 'meera.nair@example.com',
    password: customerPassword,
    role: 'customer',
    isEmailVerified: true
  });
  const cust3 = await Customer.create({
    id: cust3User.id,
    name: cust3User.name,
    email: cust3User.email,
    phone: '+91 94470 12345',
    address: 'Villa 7, Palm Meadows, Whitefield, Bengaluru, KA - 560066'
  });
  await KYC.create({
    customerId: cust3.id,
    panNumber: 'PRIME5432M',
    aadhaarLastFour: '9081',
    dateOfBirth: '1987-11-05',
    address: cust3.address,
    status: 'VERIFIED',
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    reviewerId: officerUser.id
  });
  const p3 = 500000;
  const amort3 = generateAmortizationSchedule(p3, 11.5, 36);
  const loan3 = await Loan.create({
    customerId: cust3.id,
    agentId: null,
    assignedOfficerId: officerUser.id,
    amount: p3,
    interestRate: 11.5,
    termMonths: 36,
    monthlyEMI: amort3.monthlyEMI,
    totalPayable: amort3.totalPayable,
    outstandingPrincipal: p3,
    status: 'UNDER_REVIEW',
    recoveryStatus: 'PENDING_APPROVAL'
  });
  await UnderwritingRecord.create({
    loanId: loan3.id,
    monthlyIncome: 165000,
    existingMonthlyDebt: 8000,
    dtiPercent: 14.84,
    creditScore: 810,
    employmentType: 'SALARIED',
    riskScore: 100,
    riskCategory: 'LOW',
    recommendation: 'RECOMMENDED_FOR_APPROVAL',
    contributingFactors: [
      { factor: 'DTI_HEALTHY', impact: 'POSITIVE', description: 'Superior DTI of 14.84%' },
      { factor: 'CREDIT_EXCELLENT', impact: 'POSITIVE', description: 'Prime 810 Bureau Score' }
    ],
    bureauReportId: 'CIR-CIBIL-202610110099',
    bureauProvider: 'CIBIL_TRANSUNION',
    bureauControlNumber: '202610110099',
    bureauInquiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    bureauScoreTier: 'PRIME',
    tamperProofHash: 'prime_audit_hash_1122334455667788'
  });


  // --- Persona D: Kunal Bhatia (New Applicant, KYC SUBMITTED & Pending Review) ---
  const cust4User = await User.create({
    name: 'Kunal Bhatia',
    email: 'kunal.bhatia@example.com',
    password: customerPassword,
    role: 'customer',
    isEmailVerified: true
  });
  const cust4 = await Customer.create({
    id: cust4User.id,
    name: cust4User.name,
    email: cust4User.email,
    phone: '+91 98200 99887',
    address: '401, Sea View Apts, Bandra West, Mumbai, MH - 400050'
  });
  await KYC.create({
    customerId: cust4.id,
    panNumber: 'BKUPB8877L',
    aadhaarLastFour: '2345',
    dateOfBirth: '1998-04-12',
    address: cust4.address,
    status: 'SUBMITTED',
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  });


  // --- Persona E: Sneha Patel (Fully Closed & Settled Loan) ---
  const cust5User = await User.create({
    name: 'Sneha Patel',
    email: 'sneha.patel@example.com',
    password: customerPassword,
    role: 'customer',
    isEmailVerified: true
  });
  const cust5 = await Customer.create({
    id: cust5User.id,
    name: cust5User.name,
    email: cust5User.email,
    phone: '+91 97250 88776',
    address: '15, Navrangpura Park, Ahmedabad, GJ - 380009'
  });
  await KYC.create({
    customerId: cust5.id,
    panNumber: 'PATEL3322Q',
    aadhaarLastFour: '6712',
    dateOfBirth: '1992-09-18',
    address: cust5.address,
    status: 'VERIFIED',
    submittedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
    reviewedAt: new Date(Date.now() - 199 * 24 * 60 * 60 * 1000),
    reviewerId: adminUser.id
  });
  const p5 = 80000;
  const amort5 = generateAmortizationSchedule(p5, 12, 6);
  const loan5 = await Loan.create({
    customerId: cust5.id,
    agentId: agent2.id,
    assignedOfficerId: officerUser.id,
    amount: p5,
    interestRate: 12,
    termMonths: 6,
    monthlyEMI: amort5.monthlyEMI,
    totalPayable: amort5.totalPayable,
    outstandingPrincipal: 0.00,
    status: 'CLOSED',
    startDate: new Date(Date.now() - 190 * 24 * 60 * 60 * 1000),
    disbursedDate: new Date(Date.now() - 190 * 24 * 60 * 60 * 1000),
    recoveryStatus: 'FULLY_SETTLED'
  });
  await UnderwritingRecord.create({
    loanId: loan5.id,
    monthlyIncome: 75000,
    existingMonthlyDebt: 5000,
    dtiPercent: 25.07,
    creditScore: 740,
    employmentType: 'SALARIED',
    riskScore: 90,
    riskCategory: 'LOW',
    recommendation: 'RECOMMENDED_FOR_APPROVAL',
    contributingFactors: [
      { factor: 'DTI_HEALTHY', impact: 'POSITIVE', description: 'Low DTI at 25.07%' }
    ],
    bureauReportId: 'CIR-CIBIL-202604018899',
    bureauProvider: 'CIBIL_TRANSUNION',
    bureauControlNumber: '202604018899',
    bureauInquiryDate: new Date(Date.now() - 190 * 24 * 60 * 60 * 1000),
    bureauScoreTier: 'PRIME',
    tamperProofHash: 'closed_loan_audit_hash_00112233'
  });
  const sched5 = amort5.schedule.map((item, idx) => ({
    loanId: loan5.id,
    installmentNumber: item.installmentNumber,
    dueDate: item.dueDate.split('T')[0],
    openingPrincipal: item.openingPrincipal,
    principalComponent: item.principalComponent,
    interestComponent: item.interestComponent,
    totalEMI: item.emi,
    closingPrincipal: item.closingPrincipal,
    status: 'PAID',
    paidDate: new Date(Date.now() - (180 - idx * 30) * 24 * 60 * 60 * 1000),
    paymentReference: `TXN-SETTLE-00${idx + 1}`
  }));
  await RepaymentSchedule.bulkCreate(sched5);


  // --- Persona F: Deepak Choudhary (Overleveraged, REJECTED by Underwriting) ---
  const cust6User = await User.create({
    name: 'Deepak Choudhary',
    email: 'deepak.c@example.com',
    password: customerPassword,
    role: 'customer',
    isEmailVerified: true
  });
  const cust6 = await Customer.create({
    id: cust6User.id,
    name: cust6User.name,
    email: cust6User.email,
    phone: '+91 99345 66778',
    address: 'C-304, Ganga Vihar, Jaipur, RJ - 302015'
  });
  await KYC.create({
    customerId: cust6.id,
    panNumber: 'CHOUD1122P',
    aadhaarLastFour: '5566',
    dateOfBirth: '1989-06-25',
    address: cust6.address,
    status: 'VERIFIED',
    submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    reviewedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    reviewerId: officerUser.id
  });
  const p6 = 300000;
  const amort6 = generateAmortizationSchedule(p6, 17, 24);
  const loan6 = await Loan.create({
    customerId: cust6.id,
    agentId: null,
    assignedOfficerId: officerUser.id,
    amount: p6,
    interestRate: 17,
    termMonths: 24,
    monthlyEMI: amort6.monthlyEMI,
    totalPayable: amort6.totalPayable,
    outstandingPrincipal: p6,
    status: 'REJECTED',
    recoveryStatus: 'REJECTED_CAPACITY'
  });
  await UnderwritingRecord.create({
    loanId: loan6.id,
    monthlyIncome: 35000,
    existingMonthlyDebt: 22000,
    dtiPercent: 105.3,
    creditScore: 590,
    employmentType: 'BUSINESS',
    riskScore: 20,
    riskCategory: 'HIGH',
    recommendation: 'REJECT_OR_REFER',
    contributingFactors: [
      { factor: 'DTI_ELEVATED', impact: 'NEGATIVE', description: 'Debt obligation exceeds 100% of income' },
      { factor: 'CREDIT_SUBPRIME', impact: 'NEGATIVE', description: 'Subprime score below 600' }
    ],
    bureauReportId: 'CIR-CIBIL-202610017766',
    bureauProvider: 'CIBIL_TRANSUNION',
    bureauControlNumber: '202610017766',
    bureauInquiryDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    bureauScoreTier: 'SUBPRIME',
    tamperProofHash: 'rejected_audit_hash_aabbccddeeff'
  });


  // --- Persona G: Ritu Sen (New-To-Credit Salaried, Small Ticket Approved) ---
  const cust7User = await User.create({
    name: 'Ritu Sen',
    email: 'ritu.sen@example.com',
    password: customerPassword,
    role: 'customer',
    isEmailVerified: true
  });
  const cust7 = await Customer.create({
    id: cust7User.id,
    name: cust7User.name,
    email: cust7User.email,
    phone: '+91 98301 23456',
    address: 'Flat 3B, Lake View Residency, Salt Lake, Kolkata, WB - 700091'
  });
  await KYC.create({
    customerId: cust7.id,
    panNumber: 'NTC009988Z',
    aadhaarLastFour: '1122',
    dateOfBirth: '2001-07-19',
    address: cust7.address,
    status: 'VERIFIED',
    submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    reviewedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    reviewerId: officerUser.id
  });
  const p7 = 50000;
  const amort7 = generateAmortizationSchedule(p7, 14, 12);
  const loan7 = await Loan.create({
    customerId: cust7.id,
    agentId: agent2.id,
    assignedOfficerId: officerUser.id,
    amount: p7,
    interestRate: 14,
    termMonths: 12,
    monthlyEMI: amort7.monthlyEMI,
    totalPayable: amort7.totalPayable,
    outstandingPrincipal: p7,
    status: 'APPROVED',
    recoveryStatus: 'AWAITING_DISBURSEMENT'
  });
  await UnderwritingRecord.create({
    loanId: loan7.id,
    monthlyIncome: 45000,
    existingMonthlyDebt: 0,
    dtiPercent: 9.98,
    creditScore: -1,
    employmentType: 'SALARIED',
    riskScore: 78,
    riskCategory: 'LOW',
    recommendation: 'RECOMMENDED_FOR_APPROVAL',
    contributingFactors: [
      { factor: 'DTI_HEALTHY', impact: 'POSITIVE', description: 'Zero existing debt; healthy 9.98% DTI' }
    ],
    bureauReportId: 'CIR-CIBIL-202610051122',
    bureauProvider: 'CIBIL_TRANSUNION',
    bureauControlNumber: '202610051122',
    bureauInquiryDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    bureauScoreTier: 'NEW_TO_CREDIT',
    tamperProofHash: 'ntc_audit_hash_334455667788'
  });

  // =========================================================================
  // 3. SEED REGULATORY COMPLIANCE AUDIT TRAIL
  // =========================================================================
  console.log('📜 Seeding regulatory compliance audit logs...');
  const auditEntries = [
    {
      actorId: adminUser.id,
      actorRole: 'admin',
      action: 'SYSTEM_BOOTSTRAP',
      entityType: 'System',
      entityId: 1,
      newState: { status: 'INITIALIZED', profileCount: 10 }
    },
    {
      actorId: officerUser.id,
      actorRole: 'loan_officer',
      action: 'KYC_VERIFIED',
      entityType: 'KYC',
      entityId: kyc1.id,
      newState: { status: 'VERIFIED', panMasked: 'ABCDE****F' }
    },
    {
      actorId: adminUser.id,
      actorRole: 'admin',
      action: 'LOAN_APPROVED',
      entityType: 'Loan',
      entityId: loan1.id,
      newState: { status: 'APPROVED', principal: 200000, emi: amort1.monthlyEMI }
    },
    {
      actorId: adminUser.id,
      actorRole: 'admin',
      action: 'TREASURY_DISBURSED',
      entityType: 'Loan',
      entityId: loan1.id,
      newState: { status: 'DISBURSED', method: 'IMPS_NEFT' }
    },
    {
      actorId: cust1User.id,
      actorRole: 'customer',
      action: 'PAYMENT_RECEIVED',
      entityType: 'Payment',
      entityId: 1,
      newState: { amount: amort1.monthlyEMI, txRef: 'TXN-EMI-001' }
    },
    {
      actorId: officerUser.id,
      actorRole: 'loan_officer',
      action: 'LOAN_DELINQUENCY_FLAGGED',
      entityType: 'Loan',
      entityId: loan2.id,
      newState: { status: 'OVERDUE', assignedAgent: agent1User.name }
    },
    {
      actorId: officerUser.id,
      actorRole: 'loan_officer',
      action: 'LOAN_REJECTED',
      entityType: 'Loan',
      entityId: loan6.id,
      newState: { status: 'REJECTED', reason: 'High DTI > 100%' }
    }
  ];

  for (const entry of auditEntries) {
    await AuditLog.create(entry);
  }

  console.log('\n=============================================================');
  console.log('🎉 Database seeding complete with 10 diverse demo personas!');
  console.log('-------------------------------------------------------------');
  console.log('Staff Credentials:');
  console.log('  👑 Admin / Committee:     admin@example.com / admin123');
  console.log('  🔍 Loan Officer:          officer@example.com / agent123');
  console.log('  🏃 Field Recovery Agent:  agent@example.com / agent123');
  console.log('  🏃 Recovery Agent 2:      agent2@example.com / agent123');
  console.log('\nBorrower Personas:');
  console.log('  🟢 Active Prime Loan:     customer@example.com / customer123 (Ananya)');
  console.log('  🔴 Delinquent Overdue:    rohan.deshmukh@example.com / customer123 (Rohan)');
  console.log('  🟡 Review In Progress:    meera.nair@example.com / customer123 (Dr. Meera)');
  console.log('  📄 KYC Pending Review:    kunal.bhatia@example.com / customer123 (Kunal)');
  console.log('  🔵 Closed / Settled:      sneha.patel@example.com / customer123 (Sneha)');
  console.log('  ⛔ High-DTI Rejected:     deepak.c@example.com / customer123 (Deepak)');
  console.log('  ⭐ New-to-Credit Appr:    ritu.sen@example.com / customer123 (Ritu)');
  console.log('=============================================================\n');

  process.exit(0);
}

seedDatabase().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
