/**
 * CredenceOS - Database Seeder Script
 * Populates realistic demo records for Admin, Recovery Officer, Customer,
 * verified KYC, loans with Amortization schedules, Underwriting scores, and Audit logs.
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
} = require('./src/models');
const { generateAmortizationSchedule } = require('./src/services/amortizationService');

async function seedDatabase() {
  console.log('🔄 Connecting to database and synchronizing schema...');
  await sequelize.sync({ force: true }); // Reset and re-create schema
  console.log('✅ Schema synchronized successfully.');

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const agentPassword = await bcrypt.hash('agent123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

  // 1. Seed Users
  console.log('🌱 Seeding core users...');
  const adminUser = await User.create({
    name: 'Vikramaditya Sharma',
    email: 'admin@example.com',
    password: hashedPassword,
    role: 'admin'
  });

  const agentUser = await User.create({
    name: 'Rajesh Kulkarni',
    email: 'agent@example.com',
    password: agentPassword,
    role: 'agent'
  });

  const customerUser = await User.create({
    name: 'Ananya Verma',
    email: 'customer@example.com',
    password: customerPassword,
    role: 'customer'
  });

  // 2. Associate Profiles
  const agentProfile = await Agent.create({
    id: agentUser.id,
    name: agentUser.name,
    email: agentUser.email,
    phone: '+91 98765 43210'
  });

  const customerProfile = await Customer.create({
    id: customerUser.id,
    name: customerUser.name,
    email: customerUser.email,
    phone: '+91 91234 56789',
    address: 'Flat 402, Green Heights, Bengaluru, KA - 560102'
  });

  // 3. Seed KYC Record
  console.log('🪪 Seeding verified KYC record...');
  await KYC.create({
    customerId: customerProfile.id,
    panNumber: 'ABCDE1234F',
    aadhaarLastFour: '7890',
    dateOfBirth: '1995-08-14',
    address: customerProfile.address,
    status: 'VERIFIED',
    submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    reviewedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
    reviewerId: adminUser.id
  });

  // 4. Seed Active Loan with Underwriting & Repayment Ledger
  console.log('📊 Seeding active loan, amortization ledger, and underwriting...');
  const principal = 200000;
  const rate = 13.5;
  const tenure = 12;

  const amortization = generateAmortizationSchedule(principal, rate, tenure);

  const loan = await Loan.create({
    customerId: customerProfile.id,
    agentId: agentProfile.id,
    amount: principal,
    interestRate: rate,
    termMonths: tenure,
    monthlyEMI: amortization.monthlyEMI,
    totalPayable: amortization.totalPayable,
    outstandingPrincipal: principal - 17915.22, // 1st EMI paid
    status: 'ACTIVE',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    disbursedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    recoveryStatus: 'CURRENT_ON_TIME'
  });

  // Underwriting Record
  await UnderwritingRecord.create({
    loanId: loan.id,
    monthlyIncome: 85000,
    existingMonthlyDebt: 12000,
    dtiPercent: 35.19,
    creditScore: 765,
    employmentType: 'SALARIED',
    riskScore: 85,
    riskCategory: 'LOW',
    recommendation: 'RECOMMENDED_FOR_APPROVAL',
    contributingFactors: [
      { factor: 'DTI_HEALTHY', impact: 'POSITIVE', description: 'Conservative DTI under 36%' },
      { factor: 'CREDIT_PRIME', impact: 'POSITIVE', description: 'Prime credit profile (765)' }
    ]
  });

  // Repayment Schedule
  const scheduleRows = amortization.schedule.map((item, index) => ({
    loanId: loan.id,
    installmentNumber: item.installmentNumber,
    dueDate: item.dueDate.split('T')[0],
    openingPrincipal: item.openingPrincipal,
    principalComponent: item.principalComponent,
    interestComponent: item.interestComponent,
    totalEMI: item.emi,
    closingPrincipal: item.closingPrincipal,
    status: index === 0 ? 'PAID' : 'SCHEDULED',
    paidDate: index === 0 ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : null,
    paymentReference: index === 0 ? 'TXN-DEMO-EMI-001' : null
  }));

  await RepaymentSchedule.bulkCreate(scheduleRows);

  // Initial Payment Record
  await Payment.create({
    loanId: loan.id,
    repaymentScheduleId: 1,
    amount: amortization.monthlyEMI,
    paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    transactionReference: 'TXN-DEMO-EMI-001',
    idempotencyKey: 'idem-demo-key-001',
    paymentMethod: 'MOCK_UPI',
    status: 'SUCCESS',
    reconciled: true
  });

  // 5. Seed Audit Trail
  console.log('📜 Seeding compliance audit logs...');
  await AuditLog.create({
    actorId: adminUser.id,
    actorRole: 'admin',
    action: 'KYC_VERIFIED',
    entityType: 'KYC',
    entityId: 1,
    newState: { status: 'VERIFIED' }
  });

  await AuditLog.create({
    actorId: adminUser.id,
    actorRole: 'admin',
    action: 'LOAN_STATUS_APPROVED',
    entityType: 'Loan',
    entityId: loan.id,
    newState: { status: 'APPROVED', amount: principal }
  });

  await AuditLog.create({
    actorId: customerUser.id,
    actorRole: 'customer',
    action: 'PAYMENT_RECEIVED',
    entityType: 'Payment',
    entityId: 1,
    newState: { amount: amortization.monthlyEMI, txRef: 'TXN-DEMO-EMI-001' }
  });

  console.log('\n========================================');
  console.log('🎉 Database seeding complete!');
  console.log('Default credentials:');
  console.log('  Admin:    admin@example.com / admin123');
  console.log('  Agent:    agent@example.com / agent123');
  console.log('  Customer: customer@example.com / customer123');
  console.log('========================================\n');
  process.exit(0);
}

seedDatabase().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
