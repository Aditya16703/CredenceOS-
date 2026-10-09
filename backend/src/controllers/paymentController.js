const crypto = require('crypto');
const { Payment, Loan, RepaymentSchedule, sequelize } = require('../models');
const { recordAudit } = require('../services/auditService');
const { asyncHandler, NotFoundError, ValidationError, AuthorizationError } = require('../utils/errorHandler');

exports.getAllPayments = asyncHandler(async (req, res) => {
  const where = {};
  if (req.user.role === 'customer') {
    where['$Loan.customerId$'] = req.user.id;
  } else if (req.user.role === 'agent') {
    where['$Loan.agentId$'] = req.user.id;
  }

  const payments = await Payment.findAll({
    where,
    include: [{ model: Loan, attributes: ['id', 'amount', 'status', 'customerId', 'agentId'] }],
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    count: payments.length,
    data: payments
  });
});

exports.createPayment = asyncHandler(async (req, res) => {
  const { loanId, repaymentScheduleId, amount, paymentMethod = 'MOCK_UPI' } = req.body;
  const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || null;

  const paymentAmount = parseFloat(amount);
  if (!paymentAmount || paymentAmount <= 0) {
    throw new ValidationError('Payment amount must be greater than zero');
  }

  const loan = await Loan.findByPk(loanId);
  if (!loan) {
    throw new NotFoundError('Loan record not found');
  }

  if (req.user.role === 'customer' && loan.customerId !== req.user.id) {
    throw new AuthorizationError('You can only make payments towards your own loans');
  }

  if (!['ACTIVE', 'OVERDUE', 'DISBURSED', 'APPROVED'].includes(loan.status)) {
    throw new ValidationError(`Cannot accept payments for loans in ${loan.status} state`);
  }

  // Generate unique transaction reference
  const txRef = 'TXN-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();

  // Process transaction atomically
  const result = await sequelize.transaction(async (t) => {
    const payment = await Payment.create({
      loanId,
      repaymentScheduleId: repaymentScheduleId || null,
      amount: paymentAmount,
      paymentDate: new Date(),
      transactionReference: txRef,
      idempotencyKey,
      paymentMethod,
      status: 'SUCCESS',
      reconciled: true
    }, { transaction: t });

    // Deduct principal/balance
    const newBalance = Math.max(0, Math.round((parseFloat(loan.outstandingPrincipal) - paymentAmount) * 100) / 100);
    const updates = { outstandingPrincipal: newBalance };

    if (newBalance <= 0) {
      updates.status = 'CLOSED';
    } else if (loan.status === 'OVERDUE' || loan.status === 'APPROVED') {
      updates.status = 'ACTIVE'; // Mark to active upon payment
      if (loan.status === 'APPROVED') {
        updates.disbursedDate = new Date();
      }
    }

    await loan.update(updates, { transaction: t });

    // If linked to an installment, mark it PAID
    if (repaymentScheduleId) {
      const schedule = await RepaymentSchedule.findByPk(repaymentScheduleId, { transaction: t });
      if (schedule) {
        await schedule.update({
          status: 'PAID',
          paidDate: new Date(),
          paymentReference: txRef
        }, { transaction: t });
      }
    }

    return { payment, remainingBalance: newBalance, loanStatus: updates.status || loan.status };
  });

  await recordAudit({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: 'PAYMENT_RECEIVED',
    entityType: 'Payment',
    entityId: result.payment.id,
    newState: {
      amount: paymentAmount,
      txRef,
      remainingLoanBalance: result.remainingBalance,
      loanStatus: result.loanStatus
    },
    req
  });

  res.status(201).json({
    success: true,
    message: 'Payment processed successfully',
    data: {
      payment: result.payment,
      remainingLoanBalance: result.remainingBalance,
      loanStatus: result.loanStatus
    }
  });
});

exports.getPaymentsByLoan = asyncHandler(async (req, res) => {
  const { loanId } = req.params;
  const payments = await Payment.findAll({
    where: { loanId },
    order: [['paymentDate', 'DESC']]
  });

  res.json({
    success: true,
    count: payments.length,
    data: payments
  });
});

// Mock Webhook Reconciliation Receiver
exports.handleMockWebhook = asyncHandler(async (req, res) => {
  const { event, transactionReference, status } = req.body;

  if (!transactionReference) {
    throw new ValidationError('transactionReference is required for webhook event');
  }

  const payment = await Payment.findOne({ where: { transactionReference } });
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Transaction reference unknown' });
  }

  if (payment.status === 'SUCCESS' && status === 'SUCCESS') {
    return res.json({ success: true, message: 'Webhook already processed (Idempotent acknowledge)' });
  }

  await payment.update({
    status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
    reconciled: true
  });

  res.json({
    success: true,
    message: `Reconciliation webhook processed for ${transactionReference}`
  });
});
