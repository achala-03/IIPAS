const Feedback = require('../models/Feedback');
const Interview = require('../models/Interview');
const Progress = require('../models/Progress');
const User = require('../models/User');

// @desc    Get feedback for an interview
// @route   GET /api/reports/:interviewId
const getReport = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.interviewId, user: req.user._id });
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found.' });

    const feedback = await Feedback.findOne({ interview: req.params.interviewId });
    if (!feedback) return res.status(404).json({ success: false, message: 'Report not ready yet.' });

    res.json({ success: true, data: { feedback, interview } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch report.' });
  }
};

// @desc    Get user progress
// @route   GET /api/progress
const getProgress = async (req, res) => {
  try {
    let progress = await Progress.findOne({ user: req.user._id });
    if (!progress) {
      progress = await Progress.create({ user: req.user._id });
    }

    // Get recent interviews
    const recentInterviews = await Interview.find({ user: req.user._id, status: 'completed' })
      .populate('feedback', 'overallScore grade')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title jobRole type difficulty createdAt scores');

    res.json({
      success: true,
      data: { progress, recentInterviews }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch progress.' });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/progress/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let progress = await Progress.findOne({ user: req.user._id });

    const totalInterviews = await Interview.countDocuments({ user: req.user._id });
    const completedInterviews = await Interview.countDocuments({ user: req.user._id, status: 'completed' });
    const inProgressInterviews = await Interview.countDocuments({ user: req.user._id, status: 'in_progress' });

    // Compute averageScore and highestScore LIVE from completed interviews
    // This is always accurate, even if Progress model is stale
    const completedWithScores = await Interview.find(
      { user: req.user._id, status: 'completed' },
      { 'scores.overall': 1 }
    ).lean();

    const scores = completedWithScores
      .map(i => i.scores?.overall || 0)
      .filter(s => s > 0);

    const liveAvgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : (progress?.averageScore || 0);

    const liveHighestScore = scores.length > 0
      ? Math.max(...scores)
      : (progress?.highestScore || 0);

    const recentInterviews = await Interview.find({ user: req.user._id })
      .populate('feedback', 'overallScore grade')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title jobRole type status createdAt scores difficulty');

    // Generate weekly data for chart
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayInterviews = await Interview.find({
        user: req.user._id,
        status: 'completed',
        createdAt: {
          $gte: new Date(dateStr),
          $lt: new Date(new Date(dateStr).getTime() + 86400000)
        }
      }).populate('feedback', 'overallScore');

      const avgScore = dayInterviews.length > 0
        ? Math.round(dayInterviews.reduce((acc, i) => acc + (i.scores?.overall || i.feedback?.overallScore || 0), 0) / dayInterviews.length)
        : 0;

      last7Days.push({
        date: dateStr,
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        count: dayInterviews.length,
        avgScore
      });
    }

    res.json({
      success: true,
      data: {
        user,
        stats: {
          totalInterviews,
          completedInterviews,
          inProgressInterviews,
          averageScore: liveAvgScore,
          highestScore: liveHighestScore,
          currentStreak: progress?.currentStreak || 0,
          longestStreak: progress?.longestStreak || 0,
          readinessScore: progress?.readinessScore || 0
        },
        skillScores: progress?.skillScores || {},
        weeklyData: last7Days,
        weakTopics: progress?.weakTopics || [],
        strongTopics: progress?.strongTopics || [],
        recentInterviews,
        badges: progress?.badges || []
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data.' });
  }
};

// @desc    Admin - get all users
// @route   GET /api/admin/users
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalInterviews = await Interview.countDocuments();
    const completedInterviews = await Interview.countDocuments({ status: 'completed' });
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(10).select('-password');
    const recentInterviews = await Interview.find()
      .populate('user', 'name email')
      .populate('feedback', 'overallScore')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: { totalUsers, totalInterviews, completedInterviews, recentUsers, recentInterviews }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
};

// @desc    Get leaderboard
// @route   GET /api/progress/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).lean();
    const progressList = await Progress.find({}).lean();
    
    const progressMap = progressList.reduce((acc, p) => {
      acc[p.user.toString()] = p;
      return acc;
    }, {});

    const leaderboard = users.map(user => {
      const p = progressMap[user._id.toString()] || {};
      const completedInterviews = p.completedInterviews || user.totalInterviews || 0;
      const currentStreak = p.currentStreak || user.streak || 0;
      const averageScore = p.averageScore || user.averageScore || 0;
      
      const points = (averageScore * completedInterviews * 10) + (currentStreak * 100);
      
      return {
        _id: user._id.toString(),
        name: user.name,
        targetRole: user.targetRole || 'Candidate',
        avatar: user.avatar,
        score: points,
        streak: currentStreak,
        avgScore: averageScore,
        interviews: completedInterviews
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

    // Add rank
    leaderboard.forEach((user, index) => {
      user.rank = index + 1;
    });

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard.' });
  }
};

module.exports = { getReport, getProgress, getDashboardStats, getAdminStats, getLeaderboard };
