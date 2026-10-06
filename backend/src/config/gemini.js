const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

const getGeminiClient = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const getModel = (modelName = 'gemini-1.5-flash', systemInstruction = undefined) => {
  const client = getGeminiClient();
  const config = { model: modelName };
  if (systemInstruction) config.systemInstruction = systemInstruction;
  return client.getGenerativeModel(config);
};

module.exports = { getGeminiClient, getModel };
