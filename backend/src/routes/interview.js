const express = require('express');
const { createInterview, sendMessage, endInterview, getInterviews, getInterview, abandonInterview, recordInterview } = require('../controllers/interviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/record', recordInterview);
router.route('/').get(getInterviews).post(createInterview);
router.route('/:id').get(getInterview).delete(abandonInterview);
router.post('/:id/message', sendMessage);
router.post('/:id/end', endInterview);

module.exports = router;
