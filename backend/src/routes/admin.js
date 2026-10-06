const express = require('express');
const { getAdminStats } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Interview = require('../models/Interview');

const router = express.Router();
router.use(protect, adminOnly);

router.get('/stats', getAdminStats);
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(50).select('-password');
    res.json({ success: true, data: { users } });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to fetch users.' }); }
});
router.get('/interviews', async (req, res) => {
  try {
    const interviews = await Interview.find().populate('user', 'name email').populate('feedback', 'overallScore').sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: { interviews } });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to fetch interviews.' }); }
});

module.exports = router;
