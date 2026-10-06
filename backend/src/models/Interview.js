const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'AI Interview Session'
  },
  type: {
    type: String,
    enum: ['HR', 'Technical', 'Mixed', 'Behavioral', 'Coding'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
  },
  experience: {
    type: String,
    enum: ['Fresher', '1 Year', '2 Years', '3 Years', '5 Years', '5+ Years', '10+ Years'],
    required: true
  },
  jobRole: {
    type: String,
    required: true
  },
  company: {
    type: String,
    default: 'General'
  },
  language: {
    type: String,
    default: 'English'
  },
  duration: {
    type: Number, // in minutes
    default: 20
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'abandoned'],
    default: 'scheduled'
  },
  startTime: Date,
  endTime: Date,
  actualDuration: Number, // seconds taken
  
  // Conversation History
  conversation: [{
    role: { type: String, enum: ['interviewer', 'candidate'] },
    message: String,
    timestamp: { type: Date, default: Date.now },
    questionIndex: Number
  }],
  
  // Scores
  scores: {
    technicalAccuracy: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    completeness: { type: Number, default: 0 },
    grammar: { type: Number, default: 0 },
    professionalism: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 },
    overall: { type: Number, default: 0 }
  },
  
  totalQuestions: { type: Number, default: 0 },
  answeredQuestions: { type: Number, default: 0 },
  
  // Resume data if uploaded
  resumeData: {
    text: String,
    skills: [String],
    experience: String
  },
  
  // Video Analysis Data
  videoAnalysis: {
    enabled: { type: Boolean, default: false },
    overallConfidence: { type: Number, default: 0 },
    dominantEmotion: { type: String, default: '' },
    emotionBreakdown: {
      happy: { type: Number, default: 0 },
      sad: { type: Number, default: 0 },
      angry: { type: Number, default: 0 },
      fearful: { type: Number, default: 0 },
      disgusted: { type: Number, default: 0 },
      surprised: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 }
    },
    timeline: [{
      questionIndex: Number,
      confidence: Number,
      dominantEmotion: String,
      timestamp: Date
    }]
  },
  
  feedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  }
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
