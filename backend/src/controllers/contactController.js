const Contact = require('../models/Contact');
const PlatformFeedback = require('../models/PlatformFeedback');

// @desc    Submit public contact form
// @route   POST /api/contact
const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    await Contact.create({ name, email, subject, message });
    res.status(201).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};

// @desc    Submit platform feedback (logged in user)
// @route   POST /api/contact/feedback
const submitFeedback = async (req, res) => {
  try {
    const { rating, category, message } = req.body;
    await PlatformFeedback.create({ user: req.user._id, rating, category, message });
    res.status(201).json({ success: true, message: 'Thank you for your feedback!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit feedback.' });
  }
};

module.exports = { submitContact, submitFeedback };
