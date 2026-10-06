const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  interview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Overall Assessment
  overallScore: { type: Number, default: 0 },
  grade: { type: String, default: 'B' }, // A+, A, B+, B, C, D, F
  
  // Detailed Scores
  scores: {
    technicalAccuracy: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    completeness: { type: Number, default: 0 },
    grammar: { type: Number, default: 0 },
    professionalism: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 }
  },
  
  // AI Generated Content
  strengths: [String],
  weaknesses: [String],
  missingConcepts: [String],
  communicationTips: [String],
  recruiterComment: String,
  overallSummary: String,
  
  // Per-Question Analysis
  questionAnalysis: [{
    question: String,
    userAnswer: String,
    betterAnswer: String,
    score: Number,
    feedback: String,
    tags: [String]
  }],
  
  // Learning Resources
  recommendedTopics: [String],
  learningRoadmap: [{
    week: Number,
    topic: String,
    resources: [String]
  }],
  
  // Next Steps
  nextPracticePlan: String,
  readinessScore: { type: Number, default: 0 },
  
  // STAR Method Evaluation
  starEvaluation: {
    situation: Number,
    task: Number,
    action: Number,
    result: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
