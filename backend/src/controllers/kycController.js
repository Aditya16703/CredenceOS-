const { KYC, Customer } = require('../models');
const { recordAudit } = require('../services/auditService');
const { asyncHandler, ValidationError, NotFoundError, AuthorizationError } = require('../utils/errorHandler');

function maskPAN(pan) {
  if (!pan || pan.length < 10) return pan;
  return pan.slice(0, 5) + '****' + pan.slice(9);
}

function maskAadhaar(lastFour) {
  return `XXXX-XXXX-${lastFour}`;
}

exports.submitKYC = asyncHandler(async (req, res) => {
  const customerId = req.user.role === 'customer' ? req.user.id : req.body.customerId;
  const { panNumber, aadhaarNumber, dateOfBirth, address } = req.body;

  if (!panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(panNumber.trim())) {
    throw new ValidationError('Invalid PAN format (e.g. ABCDE1234F)');
  }

  if (!aadhaarNumber || !/^\d{4}$|^\d{12}$/.test(aadhaarNumber.trim())) {
    throw new ValidationError('Aadhaar must provide either the 12-digit number or last 4 digits');
  }

  const aadhaarLastFour = aadhaarNumber.trim().slice(-4);

  const existingKYC = await KYC.findOne({ where: { customerId } });
  if (existingKYC && existingKYC.status === 'VERIFIED') {
    throw new ValidationError('KYC has already been verified for this account');
  }

  const normalizedPAN = panNumber.trim().toUpperCase();

  let kycRecord;
  if (existingKYC) {
    const prevState = existingKYC.toJSON();
    await existingKYC.update({
      panNumber: normalizedPAN,
      aadhaarLastFour,
      dateOfBirth,
      address,
      status: 'SUBMITTED',
      submittedAt: new Date(),
      rejectionReason: null
    });
    kycRecord = existingKYC;
    await recordAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'KYC_RESUBMIT',
      entityType: 'KYC',
      entityId: kycRecord.id,
      previousState: prevState,
      newState: kycRecord.toJSON(),
      req
    });
  } else {
    kycRecord = await KYC.create({
      customerId,
      panNumber: normalizedPAN,
      aadhaarLastFour,
      dateOfBirth,
      address,
      status: 'SUBMITTED',
      submittedAt: new Date()
    });
    await recordAudit({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'KYC_SUBMIT',
      entityType: 'KYC',
      entityId: kycRecord.id,
      newState: kycRecord.toJSON(),
      req
    });
  }

  res.status(201).json({
    success: true,
    message: 'KYC submitted successfully and queued for verification',
    data: {
      id: kycRecord.id,
      status: kycRecord.status,
      maskedPAN: maskPAN(kycRecord.panNumber),
      maskedAadhaar: maskAadhaar(kycRecord.aadhaarLastFour),
      submittedAt: kycRecord.submittedAt
    }
  });
});

exports.getKYCStatus = asyncHandler(async (req, res) => {
  const customerId = req.user.role === 'customer' ? req.user.id : (req.params.customerId || req.user.id);
  const kyc = await KYC.findOne({ where: { customerId } });

  if (!kyc) {
    return res.json({
      success: true,
      data: { status: 'NOT_STARTED' }
    });
  }

  res.json({
    success: true,
    data: {
      id: kyc.id,
      customerId: kyc.customerId,
      status: kyc.status,
      maskedPAN: maskPAN(kyc.panNumber),
      maskedAadhaar: maskAadhaar(kyc.aadhaarLastFour),
      dateOfBirth: kyc.dateOfBirth,
      address: kyc.address,
      submittedAt: kyc.submittedAt,
      reviewedAt: kyc.reviewedAt,
      rejectionReason: kyc.rejectionReason
    }
  });
});

exports.getAllKYC = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const where = {};
  if (status) where.status = status;

  const records = await KYC.findAll({
    where,
    include: [{ model: Customer, attributes: ['id', 'name', 'email', 'phone'] }],
    order: [['submittedAt', 'DESC']]
  });

  const formatted = records.map(k => ({
    id: k.id,
    customerId: k.customerId,
    customerName: k.Customer ? k.Customer.name : 'Unknown',
    customerEmail: k.Customer ? k.Customer.email : '',
    status: k.status,
    maskedPAN: maskPAN(k.panNumber),
    maskedAadhaar: maskAadhaar(k.aadhaarLastFour),
    dateOfBirth: k.dateOfBirth,
    address: k.address,
    submittedAt: k.submittedAt,
    reviewedAt: k.reviewedAt,
    rejectionReason: k.rejectionReason
  }));

  res.json({
    success: true,
    count: formatted.length,
    data: formatted
  });
});

exports.reviewKYC = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  if (!['VERIFIED', 'REJECTED', 'UNDER_REVIEW'].includes(status)) {
    throw new ValidationError('Invalid review status. Must be VERIFIED, REJECTED, or UNDER_REVIEW');
  }

  const kyc = await KYC.findByPk(id);
  if (!kyc) {
    throw new NotFoundError('KYC record not found');
  }

  const prevState = kyc.toJSON();
  await kyc.update({
    status,
    reviewerId: req.user.id,
    reviewedAt: new Date(),
    rejectionReason: status === 'REJECTED' ? (rejectionReason || 'Documents could not be verified') : null
  });

  await recordAudit({
    actorId: req.user.id,
    actorRole: req.user.role,
    action: `KYC_${status}`,
    entityType: 'KYC',
    entityId: kyc.id,
    previousState: prevState,
    newState: kyc.toJSON(),
    req
  });

  res.json({
    success: true,
    message: `KYC status updated to ${status}`,
    data: {
      id: kyc.id,
      status: kyc.status,
      reviewedAt: kyc.reviewedAt,
      rejectionReason: kyc.rejectionReason
    }
  });
});
