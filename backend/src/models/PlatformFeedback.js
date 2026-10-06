const mongoose = require('mongoose');

const platformFeedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  category: { type: String, enum: ['bug', 'feature_request', 'general'], default: 'general' },
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('PlatformFeedback', platformFeedbackSchema);
