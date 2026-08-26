const { 
  Loan, 
  Customer, 
  Agent, 
  KYC, 
  RepaymentSchedule, 
  UnderwritingRecord, 
  sequelize 
} = require('../models');
const { calculateEMI, generateAmortizationSchedule } = require('../services/amortizationService');
const { evaluateUnderwriting } = require('../services/underwritingService');
const { recordAudit } = require('../services/auditService');
const { 
  asyncHandler, 
  NotFoundError, 
  ValidationError, 
  AuthorizationError 
} = require('../utils/errorHandler');

// Valid state transitions
const VALID_TRANSITIONS = {
  'DRAFT': ['SUBMITTED', 'CANCELLED'],
  'SUBMITTED': ['UNDER_REVIEW', 'REJECTED', 'CANCELLED'],
  'UNDER_REVIEW': ['APPROVED', 'REJECTED'],
  'APPROVED': ['DISBURSED', 'CANCELLED'],
  'DISBURSED': ['ACTIVE'],
  'ACTIVE': ['OVERDUE', 'CLOSED'],
  'OVERDUE': ['ACTIVE', 'CLOSED'],
  'REJECTED': [],
  'CLOSED': [],
  'CANCELLED': []
};

exports.getAllLoans = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.status) {
    where.status = req.query.status;
  }

  const loans = await Loan.findAll({
    where,
    include: [
      { model: Customer, attributes: ['id', 'name', 'email', 'phone'] },
      { model: Agent, attributes: ['id', 'name', 'email', 'phone'] },
      { model: UnderwritingRecord },
      { model: RepaymentSchedule }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    count: loans.length,
    data: { loans }
  });
});

exports.getLoanById = asyncHandler(async (req, res) => {
  const loan = await Loan.findByPk(req.params.id, {
    include: [
      { model: Customer, attributes: ['id', 'name', 'email', 'phone'] },
      { model: Agent, attributes: ['id', 'name', 'email', 'phone'] },
      { model: UnderwritingRecord },
      { model: RepaymentSchedule, order: [['installmentNumber', 'ASC']] }
    ]
  });

  if (!loan) {
    throw new NotFoundError('Loan record not found');
  }

  // RBAC verification for customers
  if (req.user.role === 'customer' && loan.customerId !== req.user.id) {
    throw new AuthorizationError('You are only authorized to access your own loan files');
  }

  res.json({
    success: true,
    data: { loan }
  });
});

exports.createLoan = asyncHandler(async (req, res) => {
  const customerId = req.user.role === 'customer' ? req.user.id : req.body.customerId;
  const { 
    amount, 
    interestRate = 13.5, 
    termMonths, 
    monthlyIncome = 50000, 
    existingMonthlyDebt = 0, 
    creditScore = 700, 
    employmentType = 'SALARIED' 
  } = req.body;

  const customer = await Customer.findByPk(customerId);
  if (!customer) {
    throw new NotFoundError('Customer record not found');
  }

  // Pre-condition: Check KYC status
  const kyc = await KYC.findOne({ where: { customerId } });
  if (!kyc || kyc.status !== 'VERIFIED') {
    throw new ValidationError('Customer must have a VERIFIED KYC before applying for credit');
  }

  const p = parseFloat(amount);
  const rate = parseFloat(interestRate);
  const tenure = parseInt(termMonths, 10);

  if (p < 5000 || p > 2500000) {
    throw new ValidationError('Loan amount must be between 5,000 and 2,500,000');
  }

  if (tenure < 3 || tenure > 84) {
    throw new ValidationError('Loan tenure must be between 3 and 84 months');
  }

  const emi = calculateEMI(p, rate, tenure);

  // Run Underwriting Rule Engine
  const activeLoans = await Loan.count({
    where: { customerId, status: ['ACTIVE', 'OVERDUE', 'DISBURSED'] }
  });

  const underwriting = evaluateUnderwriting({
    monthlyIncome,
    existingMonthlyDebt,
    requestedAmount: p,
    interestRate: rate,
    termMonths: tenure,
    creditScore,
    employmentType,
    activeLoansCount: activeLoans
  });

  // DB Transaction for atomic creation
  const result = await sequelize.transaction(async (t) => {
    const loan = await Loan.create({
      customerId,
      amount: p,
      interestRate: rate,
      termMonths: tenure,
      monthlyEMI: emi,
      totalPayable: Math.round(emi * tenure * 100) / 100,
      outstandingPrincipal: p,
      status: 'SUBMITTED'
    }, { transaction: t });

    const underwritingRecord = await UnderwritingRecord.create({
      loanId: loan.id,
      monthlyIncome,
      existingMonthlyDebt,
      dtiPercent: underwriting.metrics.dtiPercent,
      creditScore: underwriting.metrics.creditScore,
      employmentType,
      riskScore: underwriting.riskScore,
      riskCategory: underwriting.riskCategory,
      recommendation: underwriting.recommendation,
      contributingFactors: underwriting.contributingFactors
    }, { transaction: t });

    // Generate tentative repayment schedule preview
    const amortization = generateAmortizationSchedule(p, rate, tenure);
    const scheduleRecords = amortization.schedule.map(item => ({
      loanId: loan.id,
      installmentNumber: item.installmentNumber,
      dueDate: item.dueDate.split('T')[0],
      openingPrincipal: item.openingPrincipal,
      principalComponent: item.principalComponent,
      interestComponent: item.interestComponent,
      totalEMI: item.emi,
      closingPrincipal: item.closingPrincipal,
      status: 'SCHEDULED'
    }));

    await RepaymentSchedule.bulkCreate(scheduleRecords, { transaction: t });

    return { loan, underwritingRecord };
  });

  await recordAudit({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'LOAN_SUBMISSION',
    entityType: 'Loan',
    entityId: result.loan.id,
    newState: {
      amount: p,
      tenure,
      riskCategory: underwriting.riskCategory,
      monthlyEMI: emi
    },
    req
  });

  res.status(201).json({
    success: true,
    message: 'Loan application submitted and underwriting analysis generated',
    data: {
      loan: result.loan,
      underwriting: result.underwritingRecord
    }
  });
});

exports.updateLoanStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  const loan = await Loan.findByPk(id);
  if (!loan) {
    throw new NotFoundError('Loan record not found');
  }

  const currentStatus = loan.status;
  const validNext = VALID_TRANSITIONS[currentStatus] || [];

  if (!validNext.includes(status)) {
    throw new ValidationError(`Invalid state transition from ${currentStatus} to ${status}. Allowed: ${validNext.join(', ') || 'NONE'}`);
  }

  const prevState = loan.toJSON();
  const updateData = { status };

  if (status === 'APPROVED') {
    updateData.startDate = new Date();
  } else if (status === 'DISBURSED') {
    updateData.disbursedDate = new Date();
    updateData.status = 'ACTIVE'; // Auto-transition to ACTIVE once funds are released
  }

  await loan.update(updateData);

  await recordAudit({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: `LOAN_STATUS_${status}`,
    entityType: 'Loan',
    entityId: loan.id,
    previousState: prevState,
    newState: loan.toJSON(),
    metadata: { remarks },
    req
  });

  res.json({
    success: true,
    message: `Loan transitioned from ${currentStatus} to ${loan.status}`,
    data: { loan }
  });
});

exports.getLoansByCustomer = asyncHandler(async (req, res) => {
  const customerId = req.params.customerId;
  if (req.user.role === 'customer' && parseInt(customerId, 10) !== req.user.id) {
    throw new AuthorizationError('You can only view your own loan applications');
  }

  const loans = await Loan.findAll({
    where: { customerId },
    include: [{ model: UnderwritingRecord }, { model: RepaymentSchedule }],
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    count: loans.length,
    data: { loans }
  });
});

exports.assignAgent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { agentId } = req.body;

  const loan = await Loan.findByPk(id);
  if (!loan) throw new NotFoundError('Loan not found');

  const agent = await Agent.findByPk(agentId);
  if (!agent) throw new NotFoundError('Agent not found');

  await loan.update({ agentId, recoveryStatus: 'ASSIGNED_TO_FIELD' });

  await recordAudit({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'AGENT_ASSIGNED',
    entityType: 'Loan',
    entityId: loan.id,
    metadata: { agentId, agentName: agent.name },
    req
  });

  res.json({
    success: true,
    message: `Loan #${loan.id} assigned to recovery agent ${agent.name}`,
    data: { loan }
  });
});

exports.getLoansByAgent = asyncHandler(async (req, res) => {
  const agentId = req.params.agentId;
  const loans = await Loan.findAll({
    where: { agentId },
    include: [{ model: Customer, attributes: ['id', 'name', 'email', 'phone', 'address'] }, { model: RepaymentSchedule }],
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    count: loans.length,
    data: { loans }
  });
});

exports.updateRecoveryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { recoveryStatus } = req.body;

  const loan = await Loan.findByPk(id);
  if (!loan) throw new NotFoundError('Loan record not found');

  await loan.update({ recoveryStatus });

  res.json({
    success: true,
    message: 'Recovery status updated successfully',
    data: { loan }
  });
});

exports.deleteLoan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const loan = await Loan.findByPk(id);
  if (!loan) throw new NotFoundError('Loan record not found');

  await loan.destroy();
  res.json({
    success: true,
    message: 'Loan deleted successfully'
  });
});

