const Interview = require('../models/Interview');
const Feedback = require('../models/Feedback');
const Progress = require('../models/Progress');
const User = require('../models/User');
const geminiService = require('../services/geminiService');

// @desc    Create new interview session
// @route   POST /api/interviews
const createInterview = async (req, res) => {
  try {
    const { type, difficulty, experience, jobRole, company, language, duration, resumeData } = req.body;

    const interview = await Interview.create({
      user: req.user._id,
      title: `${jobRole} - ${type} Interview`,
      type, difficulty, experience, jobRole,
      company: company || 'General',
      language: language || 'English',
      duration: duration || 20,
      status: 'in_progress',
      startTime: new Date(),
      resumeData: resumeData || null
    });

    // Get opening message from AI
    const config = { type, difficulty, experience, jobRole, company: company || 'General', language: language || 'English', duration: duration || 20, resumeData };
    const openingMessage = await geminiService.startInterview(config);

    // Save to conversation
    interview.conversation.push({ role: 'interviewer', message: openingMessage, questionIndex: 0 });
    await interview.save();

    res.status(201).json({
      success: true,
      data: {
        interview,
        message: openingMessage
      }
    });
  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({ success: false, message: 'Failed to create interview. ' + error.message });
  }
};

// @desc    Send message in interview
// @route   POST /api/interviews/:id/message
const sendMessage = async (req, res) => {
  try {
    const { message, isVoice } = req.body;
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });

    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found.' });
    if (interview.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Interview is not active.' });
    }

    // Add user message to conversation
    interview.conversation.push({
      role: 'candidate',
      message,
      questionIndex: interview.conversation.filter(c => c.role === 'interviewer').length
    });

    // Get AI response
    const config = {
      type: interview.type,
      difficulty: interview.difficulty,
      experience: interview.experience,
      jobRole: interview.jobRole,
      company: interview.company,
      language: interview.language,
      duration: interview.duration,
      resumeData: interview.resumeData
    };

    // Pass conversation history (excluding latest user message)
    const historyForAI = interview.conversation.slice(0, -1);
    const aiResponse = await geminiService.continueInterview(config, historyForAI, message);

    interview.conversation.push({
      role: 'interviewer',
      message: aiResponse,
      questionIndex: interview.conversation.filter(c => c.role === 'interviewer').length
    });

    interview.answeredQuestions = interview.conversation.filter(c => c.role === 'candidate').length;
    interview.totalQuestions = interview.conversation.filter(c => c.role === 'interviewer').length;
    await interview.save();

    res.json({ success: true, data: { message: aiResponse, interview } });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to process message. ' + error.message });
  }
};

// @desc    End interview and generate feedback
// @route   POST /api/interviews/:id/end
const endInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found.' });

    // Get closing message
    const config = {
      type: interview.type, difficulty: interview.difficulty,
      experience: interview.experience, jobRole: interview.jobRole,
      company: interview.company, language: interview.language, duration: interview.duration
    };

    let closingMessage = '';
    try {
      closingMessage = await geminiService.closeInterview(config, interview.conversation);
    } catch (e) {
      closingMessage = 'Thank you for completing the interview. Your results are being processed.';
    }

    // Generate final feedback
    const feedbackData = await geminiService.generateFinalFeedback({
      conversation: interview.conversation,
      scores: interview.scores,
      jobRole: interview.jobRole,
      type: interview.type,
      difficulty: interview.difficulty,
      company: interview.company,
      language: interview.language
    });

    // Create feedback document
    const feedback = await Feedback.create({
      interview: interview._id,
      user: req.user._id,
      overallScore: feedbackData.overallScore || 65,
      grade: feedbackData.grade || 'B',
      scores: feedbackData.scores || interview.scores,
      strengths: feedbackData.strengths || [],
      weaknesses: feedbackData.weaknesses || [],
      missingConcepts: feedbackData.missingConcepts || [],
      communicationTips: feedbackData.communicationTips || [],
      recruiterComment: feedbackData.recruiterComment || '',
      overallSummary: feedbackData.overallSummary || '',
      recommendedTopics: feedbackData.recommendedTopics || [],
      learningRoadmap: feedbackData.learningRoadmap || [],
      nextPracticePlan: feedbackData.nextPracticePlan || '',
      readinessScore: feedbackData.readinessScore || 60,
      starEvaluation: feedbackData.starEvaluation || { situation: 0, task: 0, action: 0, result: 0 }
    });

    // Update interview
    interview.status = 'completed';
    interview.endTime = new Date();
    interview.actualDuration = Math.floor((new Date() - interview.startTime) / 1000);
    interview.scores = feedbackData.scores || interview.scores;
    interview.feedback = feedback._id;
    await interview.save();

    // Update user progress
    await updateUserProgress(req.user._id, interview, feedback);

    res.json({
      success: true,
      data: { feedback, closingMessage, interviewId: interview._id }
    });
  } catch (error) {
    console.error('End interview error:', error);
    res.status(500).json({ success: false, message: 'Failed to end interview. ' + error.message });
  }
};

const updateUserProgress = async (userId, interview, feedback) => {
  try {
    let progress = await Progress.findOne({ user: userId });
    if (!progress) {
      progress = await Progress.create({ user: userId });
    }

    progress.totalInterviews = (progress.totalInterviews || 0) + 1;
    progress.completedInterviews = (progress.completedInterviews || 0) + 1;

    // Update average score
    const totalScore = (progress.averageScore * (progress.completedInterviews - 1) + feedback.overallScore) / progress.completedInterviews;
    progress.averageScore = Math.round(totalScore);

    if (feedback.overallScore > (progress.highestScore || 0)) {
      progress.highestScore = feedback.overallScore;
    }

    // Update skill scores
    if (feedback.scores) {
      Object.keys(feedback.scores).forEach(skill => {
        const prev = progress.skillScores[skill] || 0;
        progress.skillScores[skill] = Math.round((prev + (feedback.scores[skill] || 0)) / 2);
      });
    }

    // Add to daily progress
    progress.dailyProgress.push({
      date: new Date(),
      score: feedback.overallScore,
      interviewId: interview._id
    });

    // Update streak
    const today = new Date().toDateString();
    const lastDate = progress.lastInterviewDate ? new Date(progress.lastInterviewDate).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastDate === yesterday) {
      progress.currentStreak = (progress.currentStreak || 0) + 1;
    } else if (lastDate !== today) {
      progress.currentStreak = 1;
    }

    if (progress.currentStreak > (progress.longestStreak || 0)) {
      progress.longestStreak = progress.currentStreak;
    }

    progress.lastInterviewDate = new Date();
    progress.weakTopics = feedback.weaknesses?.slice(0, 5) || [];
    progress.strongTopics = feedback.strengths?.slice(0, 5) || [];
    progress.readinessScore = feedback.readinessScore || 60;

    await progress.save();

    // Update user totals
    await User.findByIdAndUpdate(userId, {
      totalInterviews: progress.completedInterviews,
      averageScore: progress.averageScore,
      streak: progress.currentStreak,
      lastInterviewDate: new Date()
    });
  } catch (err) {
    console.error('Progress update error:', err);
  }
};

// @desc    Get all user interviews
// @route   GET /api/interviews
const getInterviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;

    const interviews = await Interview.find(query)
      .populate('feedback', 'overallScore grade')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Interview.countDocuments(query);

    res.json({ success: true, data: { interviews, total, page: +page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch interviews.' });
  }
};

// @desc    Get single interview
// @route   GET /api/interviews/:id
const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id })
      .populate('feedback');
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found.' });
    res.json({ success: true, data: { interview } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch interview.' });
  }
};

// @desc    Abandon interview
// @route   DELETE /api/interviews/:id
const abandonInterview = async (req, res) => {
  try {
    await Interview.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'abandoned', endTime: new Date() }
    );
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to abandon interview.' });
  }
};

// @desc    Record a completed interview session directly
// @route   POST /api/interviews/record
const recordInterview = async (req, res) => {
  try {
    const { role, difficulty, experience, total, answered, skipped, avgScore, avgTime, fluency, confidence, grammar, grade, answers } = req.body;

    const interview = await Interview.create({
      user: req.user._id,
      title: `${role || 'Software Developer'} Interview`,
      type: 'Technical',
      difficulty: difficulty || 'Medium',
      experience: experience || 'Fresher',
      jobRole: role || 'Software Developer',
      status: 'completed',
      startTime: new Date(Date.now() - (avgTime || 30) * 1000 * (total || 1)),
      endTime: new Date(),
      actualDuration: (avgTime || 30) * (total || 1),
      scores: {
        overall: avgScore || 50,
        fluency: fluency || 50,
        confidence: confidence || 50,
        grammar: grammar || 50
      }
    });

    const feedback = await Feedback.create({
      interview: interview._id,
      user: req.user._id,
      overallScore: avgScore || 50,
      grade: grade || 'Good',
      scores: { overall: avgScore || 50, fluency: fluency || 50, confidence: confidence || 50, grammar: grammar || 50 },
      strengths: [`Completed ${role} interview with ${answered || 0} questions answered`],
      weaknesses: skipped > 0 ? [`Skipped ${skipped} questions`] : [],
      readinessScore: avgScore || 50
    });

    interview.feedback = feedback._id;
    await interview.save();

    await updateUserProgress(req.user._id, interview, feedback);

    res.status(201).json({
      success: true,
      data: { interview, feedback }
    });
  } catch (error) {
    console.error('Record interview error:', error);
    res.status(500).json({ success: false, message: 'Failed to record interview: ' + error.message });
  }
};

module.exports = { createInterview, sendMessage, endInterview, getInterviews, getInterview, abandonInterview, recordInterview };
