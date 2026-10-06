const express = require('express');
const { analyzeResume, generateCareerRoadmap, getLanguages, getDailyChallenge } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/languages', getLanguages);
router.get('/daily-challenge', getDailyChallenge);
router.post('/analyze-resume', protect, analyzeResume);
router.post('/career-roadmap', protect, generateCareerRoadmap);

module.exports = router;
