const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  preferredLanguage: {
    type: String,
    default: 'English'
  },
  targetRole: {
    type: String,
    default: ''
  },
  experience: {
    type: String,
    default: 'Fresher'
  },
  skills: [String],
  resumeUrl: String,
  githubUrl: String,
  linkedinUrl: String,
  totalInterviews: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastInterviewDate: Date,
  badges: [String],
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  provider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
