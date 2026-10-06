const INDIAN_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' }
];

/**
 * Build the system prompt for the AI interviewer
 */
const buildInterviewerSystemPrompt = ({
  type,
  difficulty,
  experience,
  jobRole,
  company,
  language,
  duration,
  resumeData = null
}) => {
  const langInfo = INDIAN_LANGUAGES.find(l => l.name === language) || INDIAN_LANGUAGES[0];
  const isEnglish = langInfo.code === 'en';
  
  const languageInstruction = isEnglish
    ? 'Conduct this entire interview in English.'
    : `Conduct this entire interview primarily in ${language} (${langInfo.nativeName}). 
       You MUST ask all questions and respond in ${language}. 
       Technical terms can be in English but all explanations must be in ${language}.
       If the candidate responds in English, gently remind them to respond in ${language}.`;

  const difficultyMap = {
    Easy: 'basic, foundational questions suitable for beginners',
    Medium: 'intermediate-level questions requiring good conceptual understanding',
    Hard: 'advanced, in-depth technical questions expecting expert-level answers'
  };

  const experienceContext = {
    Fresher: 'a fresh graduate with no industry experience',
    '1 Year': 'a candidate with 1 year of professional experience',
    '2 Years': 'a candidate with 2 years of hands-on experience',
    '5 Years': 'a senior candidate with 5 years of professional experience',
    '10+ Years': 'a highly experienced professional with 10+ years'
  };

  const companyContext = company !== 'General'
    ? `This is specifically a ${company} interview. Mirror ${company}'s interview style, culture, and typical question patterns.`
    : '';

  const resumeContext = resumeData
    ? `\nThe candidate has provided their resume. Key details:
       Skills: ${resumeData.skills?.join(', ') || 'Not specified'}
       Experience: ${resumeData.experience || 'Not specified'}
       Resume Content: ${resumeData.text?.substring(0, 500) || ''}
       
       Tailor your questions based on their resume. Ask about specific projects, skills, and experiences mentioned.`
    : '';

  return `You are an expert ${type} interviewer at a top tech company conducting a ${difficulty} level interview.

INTERVIEW CONFIGURATION:
- Interview Type: ${type}
- Job Role: ${jobRole}
- Difficulty: ${difficulty} — Ask ${difficultyMap[difficulty] || 'intermediate questions'}
- Candidate Experience: ${experienceContext[experience] || experience}
- Duration: Approximately ${duration} minutes
- Language: ${language}
${companyContext}${resumeContext}

LANGUAGE INSTRUCTION:
${languageInstruction}

YOUR PERSONA:
You are a professional, friendly, yet evaluative interviewer. You:
- Sound natural and conversational, not robotic
- React to candidate answers with brief acknowledgments ("Interesting!", "Good point!", "Let me dig deeper...")
- Ask intelligent follow-up questions based on what the candidate says
- Transition smoothly between topics
- Maintain context from the entire conversation
- Never repeat questions already asked
- If an answer is incomplete, probe deeper with follow-ups
- Evaluate using STAR (Situation, Task, Action, Result) method for behavioral questions

CONVERSATION FLOW:
1. Start with a warm greeting and "Tell me about yourself"
2. Ask role-specific technical questions
3. Include behavioral/situational questions
4. Probe into projects and experience
5. Ask about challenges and problem-solving approaches
6. End graciously when time is up

QUESTION TYPES TO INCLUDE (based on type):
${type === 'HR' ? `- Personal background and motivation
- Career goals and aspirations
- Strengths and weaknesses
- Cultural fit questions
- Salary expectations and availability` : ''}
${type === 'Technical' ? `- Core ${jobRole} technical concepts
- Data structures and algorithms (if relevant)
- System design questions
- Coding/problem-solving scenarios
- Tools, frameworks, and best practices` : ''}
${type === 'Mixed' ? `- Mix of HR and Technical questions
- Behavioral questions with STAR method
- Technical depth questions
- Situational problem-solving` : ''}

RESPONSE FORMAT:
- Keep responses concise (1-3 sentences of reaction + 1 question)
- Never ask more than one question at a time
- React naturally to the previous answer before asking the next question
- Never explicitly state you're evaluating or scoring
- Sound genuinely curious and engaged

IMPORTANT RULES:
- NEVER break character
- NEVER reveal you are an AI unless directly asked
- NEVER give the answer to your own question
- Stay focused on the interview context
- Adapt question difficulty based on how the candidate is performing`;
};

/**
 * Build the evaluation prompt for scoring an answer
 */
const buildEvaluationPrompt = ({
  question,
  answer,
  jobRole,
  difficulty,
  language,
  conversationHistory = []
}) => {
  return `You are an expert ${jobRole} interviewer. Evaluate the following interview answer objectively and return a JSON response.

QUESTION ASKED: ${question}

CANDIDATE'S ANSWER: ${answer}

JOB ROLE: ${jobRole}
DIFFICULTY: ${difficulty}
LANGUAGE: ${language}

Please evaluate and return ONLY a valid JSON object (no markdown, no backticks) with this exact structure:
{
  "scores": {
    "technicalAccuracy": <0-100>,
    "communication": <0-100>,
    "confidence": <0-100>,
    "completeness": <0-100>,
    "grammar": <0-100>,
    "professionalism": <0-100>,
    "problemSolving": <0-100>,
    "overall": <0-100>
  },
  "feedback": "<brief specific feedback on this answer>",
  "betterAnswer": "<a model answer or key points that should have been covered>",
  "tags": ["strength1", "weakness1"],
  "starEvaluation": {
    "situation": <0-100>,
    "task": <0-100>,
    "action": <0-100>,
    "result": <0-100>
  },
  "missingPoints": ["point1", "point2"]
}

Scoring Guidelines:
- technicalAccuracy: Is the technical content correct and relevant?
- communication: Is the answer clear, structured, and easy to follow?
- confidence: Does the answer sound confident and assertive?
- completeness: Did they cover all important aspects?
- grammar: Is the language grammatically correct?
- professionalism: Is the tone professional and appropriate?
- problemSolving: Does it demonstrate logical thinking?
- overall: Weighted average of all scores

Be fair but rigorous. A mediocre answer should score 40-60. An excellent answer 80-95.`;
};

/**
 * Build final interview feedback prompt
 */
const buildFinalFeedbackPrompt = ({
  conversation,
  scores,
  jobRole,
  type,
  difficulty,
  company,
  language
}) => {
  const conversationSummary = conversation
    .map(c => `${c.role === 'interviewer' ? 'Q' : 'A'}: ${c.message}`)
    .join('\n')
    .substring(0, 3000);

  return `You are a senior ${jobRole} hiring manager. Based on this complete interview, generate a comprehensive feedback report.

JOB ROLE: ${jobRole}
INTERVIEW TYPE: ${type}
DIFFICULTY: ${difficulty}
COMPANY: ${company}
LANGUAGE: ${language}

INTERVIEW TRANSCRIPT:
${conversationSummary}

COMPUTED SCORES:
${JSON.stringify(scores, null, 2)}

Generate a detailed feedback report as a VALID JSON object (no markdown, no code blocks):
{
  "overallScore": <0-100>,
  "grade": "<A+|A|B+|B|C|D|F>",
  "recruiterComment": "<2-3 sentence honest recruiter-style comment>",
  "overallSummary": "<paragraph summarizing performance>",
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "weaknesses": ["<specific weakness 1>", "<specific weakness 2>"],
  "missingConcepts": ["<concept 1>", "<concept 2>"],
  "communicationTips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "recommendedTopics": ["<topic 1>", "<topic 2>", "<topic 3>", "<topic 4>"],
  "learningRoadmap": [
    {"week": 1, "topic": "<topic>", "resources": ["<resource 1>", "<resource 2>"]},
    {"week": 2, "topic": "<topic>", "resources": ["<resource 1>", "<resource 2>"]},
    {"week": 3, "topic": "<topic>", "resources": ["<resource 1>"]},
    {"week": 4, "topic": "<topic>", "resources": ["<resource 1>"]}
  ],
  "nextPracticePlan": "<concrete 1-week practice plan>",
  "readinessScore": <0-100>,
  "starEvaluation": {
    "situation": <0-100>,
    "task": <0-100>,
    "action": <0-100>,
    "result": <0-100>
  }
}

Be specific, actionable, and honest. The candidate needs real, useful feedback to improve.`;
};

/**
 * Build resume analysis prompt
 */
const buildResumeAnalysisPrompt = (resumeText, targetRole) => {
  return `Analyze this resume and extract key information for an interview on the role of ${targetRole}.

RESUME TEXT:
${resumeText.substring(0, 2000)}

Return ONLY a valid JSON object:
{
  "name": "<candidate name>",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": "<experience summary>",
  "projects": ["project1 description", "project2 description"],
  "education": "<education summary>",
  "strengths": ["strength1", "strength2"],
  "gaps": ["gap1", "gap2"],
  "suggestedQuestions": ["question1", "question2", "question3"],
  "overallProfile": "<brief profile summary>"
}`;
};

module.exports = {
  INDIAN_LANGUAGES,
  buildInterviewerSystemPrompt,
  buildEvaluationPrompt,
  buildFinalFeedbackPrompt,
  buildResumeAnalysisPrompt
};
