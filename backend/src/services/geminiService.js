const { getModel } = require('../config/gemini');
const {
  buildInterviewerSystemPrompt,
  buildEvaluationPrompt,
  buildFinalFeedbackPrompt,
  buildResumeAnalysisPrompt
} = require('../prompts/interviewPrompts');

class GeminiService {
  constructor() {
    this.model = null;
  }

  getModel(systemInstruction = undefined) {
    return getModel('gemini-1.5-flash', systemInstruction);
  }

  /**
   * Start a new interview session - get opening question
   */
  async startInterview(config) {
    const systemPrompt = buildInterviewerSystemPrompt(config);
    const model = this.getModel(systemPrompt);

    const chat = model.startChat({
      history: [],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 512,
      }
    });

    const result = await chat.sendMessage('Please start the interview with a warm greeting and your first question.');
    const response = await result.response;
    return response.text();
  }

  /**
   * Continue interview conversation
   */
  async continueInterview(config, conversationHistory, userMessage) {
    const systemPrompt = buildInterviewerSystemPrompt(config);
    const model = this.getModel(systemPrompt);

    // Build history for Gemini (only AI messages as model, user messages as user)
    const history = [];
    for (const msg of conversationHistory) {
      if (msg.role === 'interviewer') {
        history.push({ role: 'model', parts: [{ text: msg.message }] });
      } else if (msg.role === 'candidate') {
        history.push({ role: 'user', parts: [{ text: msg.message }] });
      }
    }

    const chat = model.startChat({
      history,
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 512,
      }
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();
  }

  /**
   * Evaluate a single answer
   */
  async evaluateAnswer({ question, answer, jobRole, difficulty, language, conversationHistory }) {
    const prompt = buildEvaluationPrompt({ question, answer, jobRole, difficulty, language, conversationHistory });
    const model = this.getModel();

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      }
    });

    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse evaluation response');
  }

  /**
   * Generate final comprehensive feedback
   */
  async generateFinalFeedback({ conversation, scores, jobRole, type, difficulty, company, language }) {
    const prompt = buildFinalFeedbackPrompt({ conversation, scores, jobRole, type, difficulty, company, language });
    const model = this.getModel();

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
      }
    });

    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse feedback response');
  }

  /**
   * Analyze resume and generate personalized questions
   */
  async analyzeResume(resumeText, targetRole) {
    const prompt = buildResumeAnalysisPrompt(resumeText, targetRole);
    const model = this.getModel();

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      }
    });

    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse resume analysis');
  }

  /**
   * Generate career roadmap
   */
  async generateCareerRoadmap(currentRole, targetRole, skills, experience) {
    const prompt = `Generate a detailed career roadmap for someone transitioning from ${currentRole || 'entry level'} to ${targetRole}.
Current skills: ${skills.join(', ')}
Experience: ${experience}

Return ONLY a valid JSON object:
{
  "currentLevel": "<assessment>",
  "targetLevel": "<target description>",
  "estimatedTime": "<time to achieve>",
  "roadmap": [
    {"phase": 1, "title": "<title>", "duration": "<duration>", "skills": ["skill1"], "milestones": ["milestone1"]},
    {"phase": 2, "title": "<title>", "duration": "<duration>", "skills": ["skill1"], "milestones": ["milestone1"]}
  ],
  "immediateActions": ["action1", "action2", "action3"],
  "resources": [{"name": "<name>", "url": "<url>", "type": "course|book|project"}]
}`;

    const model = this.getModel();
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 1500 }
    });

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('Failed to generate roadmap');
  }

  /**
   * Wrap interview with a closing message
   */
  async closeInterview(config, conversationHistory) {
    const systemPrompt = buildInterviewerSystemPrompt(config);
    const model = this.getModel(systemPrompt);

    const history = conversationHistory.map(msg => ({
      role: msg.role === 'interviewer' ? 'model' : 'user',
      parts: [{ text: msg.message }]
    }));

    const chat = model.startChat({
      history,
      generationConfig: { temperature: 0.7, maxOutputTokens: 256 }
    });

    const result = await chat.sendMessage('Please wrap up the interview professionally with closing remarks. Thank the candidate and let them know what to expect next.');
    return result.response.text();
  }
}

module.exports = new GeminiService();
