const geminiService = require('../services/geminiService');
const { INDIAN_LANGUAGES } = require('../prompts/interviewPrompts');

// @desc    Analyze resume text
// @route   POST /api/ai/analyze-resume
const analyzeResume = async (req, res) => {
  try {
    const { resumeText, targetRole } = req.body;
    if (!resumeText) return res.status(400).json({ success: false, message: 'Resume text is required.' });

    const analysis = await geminiService.analyzeResume(resumeText, targetRole || 'Software Developer');
    res.json({ success: true, data: { analysis } });
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ success: false, message: 'Failed to analyze resume.' });
  }
};

// @desc    Generate career roadmap
// @route   POST /api/ai/career-roadmap
const generateCareerRoadmap = async (req, res) => {
  try {
    const { currentRole, targetRole, skills, experience } = req.body;
    const roadmap = await geminiService.generateCareerRoadmap(currentRole, targetRole, skills || [], experience || 'Fresher');
    res.json({ success: true, data: { roadmap } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate roadmap.' });
  }
};

// @desc    Get supported languages
// @route   GET /api/ai/languages
const getLanguages = async (req, res) => {
  res.json({ success: true, data: { languages: INDIAN_LANGUAGES } });
};

// @desc    Get daily challenge question
// @route   GET /api/ai/daily-challenge
const getDailyChallenge = async (req, res) => {
  try {
    const roles = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer'];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    const { getModel } = require('../config/gemini');
    const model = getModel();
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `Generate one challenging interview question for a ${randomRole} position. Return ONLY a JSON object: {"question": "<question>", "role": "${randomRole}", "difficulty": "<Easy|Medium|Hard>", "category": "<category>", "hint": "<brief hint>"}` }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 256 }
    });

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const challenge = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      question: "Explain the difference between REST and GraphQL APIs and when to use each.",
      role: randomRole,
      difficulty: "Medium",
      category: "System Design",
      hint: "Consider scalability, flexibility, and performance"
    };

    res.json({ success: true, data: { challenge } });
  } catch (error) {
    res.json({
      success: true,
      data: {
        challenge: {
          question: "Explain the concept of microservices architecture and its advantages over monolithic architecture.",
          role: "Full Stack Developer",
          difficulty: "Medium",
          category: "System Design",
          hint: "Think about scalability, deployment, and team independence"
        }
      }
    });
  }
};

module.exports = { analyzeResume, generateCareerRoadmap, getLanguages, getDailyChallenge };
