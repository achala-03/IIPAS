const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Memory storage for resume text extraction
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files allowed'));
    }
  }
});

// @route POST /api/upload/resume
router.post('/resume', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    // Extract text from buffer (basic text extraction)
    let text = '';
    if (req.file.mimetype === 'text/plain') {
      text = req.file.buffer.toString('utf8');
    } else {
      // For PDF/DOC, convert buffer to string (simplified)
      text = req.file.buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
    }

    // Update user with resume info
    await User.findByIdAndUpdate(req.user._id, {
      resumeText: text.substring(0, 5000) // Store first 5000 chars
    });

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        filename: req.file.originalname,
        size: req.file.size,
        text: text.substring(0, 2000) // Return preview
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Upload failed.' });
  }
});

module.exports = router;
