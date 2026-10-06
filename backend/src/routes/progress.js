const express = require('express');
const { getProgress, getDashboardStats, getLeaderboard } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public route for leaderboard (can be viewed without login, or keep protected if wanted)
// We'll keep it public so the leaderboard can be seen by anyone, but let's check if the frontend has the token.
// Actually, let's keep it protected or unprotected based on usage. The frontend might send a token if logged in.
// We'll put it BEFORE router.use(protect) just in case we want it public, or AFTER. Let's make it public.
router.get('/leaderboard', getLeaderboard);

router.use(protect);
router.get('/', getProgress);
router.get('/dashboard', getDashboardStats);

module.exports = router;
