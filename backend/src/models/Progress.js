const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalInterviews: { type: Number, default: 0 },
  completedInterviews: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  highestScore: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastInterviewDate: Date,
  
  // Skill breakdown
  skillScores: {
    technicalAccuracy: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    completeness: { type: Number, default: 0 },
    grammar: { type: Number, default: 0 },
    professionalism: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 }
  },
  
  // History for charts
  dailyProgress: [{
    date: { type: Date },
    score: Number,
    interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview' }
  }],
  
  weeklyProgress: [{
    week: String, // 'YYYY-WW'
    avgScore: Number,
    count: Number
  }],
  
  monthlyProgress: [{
    month: String, // 'YYYY-MM'
    avgScore: Number,
    count: Number
  }],
  
  // Topic performance
  topicPerformance: [{
    topic: String,
    score: Number,
    attempts: Number
  }],
  
  weakTopics: [String],
  strongTopics: [String],
  
  // Badges earned
  badges: [{
    name: String,
    description: String,
    earnedAt: Date,
    icon: String
  }],
  
  readinessScore: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Progress', progressSchema);
