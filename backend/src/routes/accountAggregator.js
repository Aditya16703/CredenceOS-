const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  initiateConsent, 
  verifyConsentAndFetchStatement, 
  getSupportedBanks 
} = require('../services/accountAggregatorService');
const { asyncHandler } = require('../utils/errorHandler');
const { KYC, Customer } = require('../models');

// 1. Get supported FIP Banks
router.get('/banks', (req, res) => {
  res.json({
    success: true,
    data: { banks: getSupportedBanks() }
  });
});

// 2. Initiate Consent Request
router.post('/consent/initiate', auth(), asyncHandler(async (req, res) => {
  const { bankId, mobile, declaredIncome } = req.body;
  const customerId = req.user.id;

  // Retrieve borrower KYC PAN if available
  const kyc = await KYC.findOne({ where: { customerId } });
  const customer = await Customer.findByPk(customerId);

  const result = await initiateConsent({
    customerId,
    mobile: mobile || customer?.phone || '9123456789',
    bankId,
    panNumber: kyc?.panNumber || 'ABCDE1234F',
    declaredIncome: parseFloat(declaredIncome) || 50000
  });

  res.status(200).json(result);
}));

// 3. Verify OTP & Fetch Verified Bank Cashflows
router.post('/consent/verify', auth(), asyncHandler(async (req, res) => {
  const { consentHandle, otp } = req.body;

  const result = await verifyConsentAndFetchStatement({
    consentHandle,
    otp: otp || '1234'
  });

  res.status(200).json(result);
}));

module.exports = router;
