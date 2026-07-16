const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const auth = require('../middleware/auth');

router.post('/submit', auth(['customer']), kycController.submitKYC);
router.get('/status', auth(['customer']), kycController.getKYCStatus);
router.get('/status/:customerId', auth(['admin', 'agent', 'loan_officer']), kycController.getKYCStatus);
router.get('/pending', auth(['admin', 'loan_officer']), kycController.getAllKYC);
router.patch('/:id/review', auth(['admin', 'loan_officer']), kycController.reviewKYC);

module.exports = router;
