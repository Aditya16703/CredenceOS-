const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

// Report routes accessible by admin and loan officers
router.use(auth(['admin', 'loan_officer']));

// Get recovered loans report
router.get('/recovered', reportController.getRecoveredLoans);

// Get outstanding loans report
router.get('/outstanding', reportController.getOutstandingLoans);

// Get comprehensive recovery report
router.get('/recovery', reportController.getRecoveryReport);

module.exports = router;
