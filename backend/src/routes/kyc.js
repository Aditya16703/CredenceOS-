const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const auth = require('../middleware/auth');

// Sovereign DigiLocker / UIDAI e-KYC challenge endpoints
router.post('/ekyc/initiate', auth(['customer', 'admin']), kycController.initiateEKYC);
router.post('/ekyc/verify', auth(['customer', 'admin']), kycController.confirmEKYCOTP);

// Standard KYC submission & review endpoints
router.post('/submit', auth(['customer']), kycController.submitKYC);
router.get('/status', auth(['customer']), kycController.getKYCStatus);
router.get('/status/:customerId', auth(['admin', 'agent', 'loan_officer']), kycController.getKYCStatus);
router.get('/pending', auth(['admin', 'loan_officer', 'agent']), kycController.getAllKYC);
router.patch('/:id/review', auth(['admin', 'loan_officer', 'agent']), kycController.reviewKYC);

module.exports = router;
