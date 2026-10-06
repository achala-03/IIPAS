const express = require('express');
const { submitContact, submitFeedback } = require('../controllers/contactController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', submitContact);
router.post('/feedback', protect, submitFeedback);

module.exports = router;
