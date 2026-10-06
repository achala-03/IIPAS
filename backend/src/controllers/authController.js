const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({ name, email: email.toLowerCase(), password, provider: 'email' });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: { user, token }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Check for Super Admin
    if (
      process.env.ADMIN_EMAIL &&
      process.env.ADMIN_PASSWORD &&
      email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase() &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = generateToken('admin_id', 'admin');
      const adminUser = {
        _id: 'admin_id',
        name: 'Super Admin',
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
      };
      return res.json({ success: true, message: 'Super Admin login successful!', data: { user: adminUser, token } });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken(user._id);
    const userObj = user.toJSON();

    res.json({ success: true, message: 'Login successful!', data: { user: userObj, token } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
};

// @desc    Firebase Google login / register
// @route   POST /api/auth/firebase
const firebaseAuth = async (req, res) => {
  try {
    const { uid, email, name, photoURL, provider } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ success: false, message: 'Firebase UID and email required.' });
    }

    let user = await User.findOne({ $or: [{ firebaseUid: uid }, { email: email.toLowerCase() }] });

    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        firebaseUid: uid,
        avatar: photoURL || null,
        provider: provider || 'google',
        emailVerified: true
      });
    } else {
      if (!user.firebaseUid) user.firebaseUid = uid;
      if (photoURL && !user.avatar) user.avatar = photoURL;
      await user.save();
    }

    const token = generateToken(user._id);
    res.json({ success: true, message: 'Authentication successful!', data: { user, token } });
  } catch (error) {
    console.error('Firebase auth error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed.' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get user data.' });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, preferredLanguage, targetRole, experience, skills, githubUrl, linkedinUrl } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (preferredLanguage) updates.preferredLanguage = preferredLanguage;
    if (targetRole !== undefined) updates.targetRole = targetRole;
    if (experience) updates.experience = experience;
    if (skills) updates.skills = skills;
    if (githubUrl !== undefined) updates.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) updates.linkedinUrl = linkedinUrl;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated!', data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Profile update failed.' });
  }
};

module.exports = { register, login, firebaseAuth, getMe, updateProfile };
