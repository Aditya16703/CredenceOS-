const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const idempotency = require('../middleware/idempotency');

router.get('/', auth(), paymentController.getAllPayments);
router.post('/', auth(['customer', 'admin']), idempotency, paymentController.createPayment);
router.get('/loan/:loanId', auth(), paymentController.getPaymentsByLoan);
router.post('/webhook', paymentController.handleMockWebhook); // Mock gateway webhook

module.exports = router;
