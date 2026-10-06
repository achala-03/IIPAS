import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoAnalyzer } from '../../components/video/VideoAnalyzer';
import { EmotionTimeline } from '../../components/video/EmotionTimeline';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Send, SkipForward, Volume2, VolumeX,
  RefreshCw, Globe, CheckCircle, XCircle, Clock,
  TrendingUp, BarChart3, Brain, Star, Download
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { generateQuestions, getAnswerFeedback, getIdealAnswer } from '../../utils/gemini';
import { speakWithDeepgram, stopSpeaking, startDeepgramSTT, stopDeepgramSTT, preloadQuestionsAudio } from '../../utils/deepgram';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import { useQueryClient } from '@tanstack/react-query';

// ── QUESTION BANKS ─────────────────────────────────────────────────────────────
const QUESTION_BANK = {
  'Software Developer': [
    'Tell me about yourself and your software development journey.',
    'What are the core differences between OOP and functional programming?',
    'Explain time complexity. What is the difference between O(n) and O(n²)?',
    'Describe a challenging technical problem you solved. What was your approach?',
    'What is the difference between SQL and NoSQL databases? When would you use each?',
    'Explain REST vs GraphQL. What are the trade-offs?',
    'What is a deadlock? How do you prevent it?',
    'Describe your experience with version control (Git). What is your branching strategy?',
    'How do you approach code reviews and giving constructive feedback?',
    'What steps do you take when debugging a production issue?',
    'Explain how you would design a URL shortener like bit.ly.',
    'How do you stay updated with new technologies?',
  ],
  'Frontend Developer': [
    'Tell me about yourself and your frontend development background.',
    'What is the Virtual DOM in React and why does it improve performance?',
    'Explain the difference between `useEffect`, `useMemo`, and `useCallback` in React.',
    'How do you optimize a slow-loading web page? List at least 3 techniques.',
    'What is CSS specificity and how does the cascade work?',
    'Explain Flexbox vs CSS Grid. When would you use each?',
    'What are Web Accessibility (a11y) best practices you follow?',
    'How does event bubbling work in JavaScript?',
    'Explain the difference between `localStorage`, `sessionStorage`, and cookies.',
    'What is CORS? How does it affect frontend development?',
    'Describe a complex UI component you built from scratch.',
    'How do you test your frontend code? What tools do you use?',
  ],
  'Backend Developer': [
    'Tell me about yourself and your backend development experience.',
    'Explain the difference between authentication and authorization.',
    'How would you design a scalable REST API?',
    'What is database indexing and how does it improve query performance?',
    'Explain microservices vs monolithic architecture. What are the trade-offs?',
    'How do you handle race conditions in a multi-threaded application?',
    'What is database normalization? Explain the first three normal forms.',
    'Describe how you would implement caching in your application.',
    'What is a message queue? When would you use Kafka or RabbitMQ?',
    'How do you secure an API endpoint? List all the methods you know.',
    'Explain the CAP theorem in distributed systems.',
    'What monitoring and logging practices do you follow in production?',
  ],
  'Data Analyst': [
    'Tell me about yourself and your data analysis experience.',
    'How do you ensure data quality and accuracy in your analysis?',
    'Describe a time you found a key business insight from complex data.',
    'What is the difference between OLTP and OLAP systems?',
    'Explain the difference between a JOIN and a UNION in SQL.',
    'How do you handle missing or inconsistent data in your datasets?',
    'What statistical methods do you use to validate your findings?',
    'Describe a project where data analysis had a measurable business impact.',
    'What tools do you use for data visualization and why?',
    'How do you present data findings to non-technical stakeholders?',
    'Explain the concept of a cohort analysis.',
    'What is A/B testing? How do you design an A/B test?',
  ],
  'Business Analyst': [
    'Tell me about yourself and your business analysis experience.',
    'How do you gather and document requirements from stakeholders?',
    'Describe a process improvement you identified and implemented.',
    'What is the difference between a use case and a user story?',
    'How do you handle conflicting requirements from different stakeholders?',
    'What methodologies do you follow — Agile, Waterfall, or hybrid?',
    'Tell me about a time you managed a difficult stakeholder relationship.',
    'How do you prioritize features when resources are limited?',
    'What tools do you use for requirement documentation (Jira, Confluence, etc.)?',
    'Explain how you would conduct a gap analysis.',
    'What is MoSCoW prioritization?',
    'Describe how you would create a business case for a new project.',
  ],
  'DevOps Engineer': [
    'Tell me about yourself and your DevOps journey.',
    'Explain the difference between CI (Continuous Integration) and CD (Continuous Deployment).',
    'What is containerization? How does Docker differ from a virtual machine?',
    'Describe your experience with Kubernetes. How does it handle container orchestration?',
    'What is Infrastructure as Code (IaC)? Which tools have you used?',
    'How do you implement a zero-downtime deployment strategy?',
    'Explain the concept of blue-green deployments vs canary deployments.',
    'How do you monitor the health of a production system?',
    'What is a service mesh? How does Istio work?',
    'Describe how you would handle a major production outage.',
    'How do you secure a CI/CD pipeline?',
    'What cloud platforms (AWS, GCP, Azure) have you worked with?',
  ],
  'Customer Support': [
    'Tell me about yourself and your customer service experience.',
    'How do you handle an angry or frustrated customer?',
    'Describe a time you went above and beyond for a customer.',
    'How do you manage multiple customer queries simultaneously?',
    'What does excellent customer service mean to you?',
    'Tell me about a time you resolved a complex customer complaint.',
    'How do you stay calm and empathetic during stressful interactions?',
    'What CRM tools have you used?',
    'Describe a situation where you had to escalate an issue.',
    'How do you gather customer feedback to improve service?',
  ],
  'HR Executive': [
    'Tell me about yourself and your HR experience.',
    'How do you handle a conflict between two employees?',
    'Describe your experience with the end-to-end recruitment process.',
    'How do you ensure fair and unbiased hiring practices?',
    'Tell me about a challenging HR situation you successfully resolved.',
    'How do you measure employee engagement and satisfaction?',
    'What strategies do you use for employee retention?',
    'How do you handle a performance improvement plan (PIP)?',
    'Describe your experience with compensation and benefits planning.',
    'What is your approach to onboarding new employees?',
  ],
};

const DEFAULT_QUESTIONS = [
  'Tell me about yourself.',
  'Why should we hire you?',
  'What are your greatest strengths and weaknesses?',
  'Tell me about a time you showed leadership.',
  'Where do you see yourself in 5 years?',
  'How do you handle pressure and tight deadlines?',
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── CINEMATIC AI AVATAR ────────────────────────────────────────────────────────
function AvatarSpeaker({ speaking, thinking }) {
  const eyeAnim = speaking
    ? { scaleY: [1, 0.1, 1, 1, 0.1, 1], transition: { duration: 2.5, repeat: Infinity } }
    : { scaleY: [1, 0.05, 1], transition: { duration: 3, repeat: Infinity, repeatDelay: 2 } };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {speaking && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: 'hsl(var(--primary)/0.15)' }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: 'hsl(var(--accent)/0.1)' }}
              animate={{ scale: [1, 1.7, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
            />
          </>
        )}

        <motion.div
          className="relative w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' }}
          animate={speaking ? { boxShadow: ['0 0 0px hsl(var(--primary)/0.3)', '0 0 40px hsl(var(--primary)/0.6)', '0 0 0px hsl(var(--primary)/0.3)'] } : {}}
          transition={{ duration: 1.5, repeat: speaking ? Infinity : 0 }}
        >
          <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
            <circle cx="35" cy="35" r="28" fill="white" fillOpacity="0.15" />
            <motion.ellipse cx="24" cy="28" rx="4" ry="5" fill="white" animate={eyeAnim} />
            <motion.ellipse cx="46" cy="28" rx="4" ry="5" fill="white" animate={eyeAnim} />
            <motion.circle cx="25" cy="29" r="2" fill="hsl(var(--primary))" animate={speaking ? { x: [0, 1, -1, 0] } : {}} transition={{ duration: 1.5, repeat: Infinity }} />
            <motion.circle cx="47" cy="29" r="2" fill="hsl(var(--primary))" animate={speaking ? { x: [0, 1, -1, 0] } : {}} transition={{ duration: 1.5, repeat: Infinity }} />
            <motion.path
              d={thinking ? 'M18 21 Q24 17 30 21' : 'M18 22 Q24 19 30 22'}
              stroke="white" strokeWidth="2.5" strokeLinecap="round"
              animate={thinking ? { d: 'M18 19 Q24 15 30 19' } : {}}
            />
            <motion.path
              d={thinking ? 'M40 21 Q46 17 52 21' : 'M40 22 Q46 19 52 22'}
              stroke="white" strokeWidth="2.5" strokeLinecap="round"
              animate={thinking ? { d: 'M40 19 Q46 15 52 19' } : {}}
            />
            <motion.path
              d={speaking ? 'M23 48 Q35 58 47 48' : 'M25 48 Q35 54 45 48'}
              stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"
              animate={speaking ? { d: ['M23 48 Q35 58 47 48', 'M24 46 Q35 52 46 46', 'M23 48 Q35 58 47 48'] } : {}}
              transition={{ duration: 0.5, repeat: speaking ? Infinity : 0 }}
            />
          </svg>

          {thinking && (
            <div className="absolute bottom-4 flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-2 h-2 rounded-full bg-white"
                  animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          )}
        </motion.div>

        {speaking && (
          <motion.div
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'hsl(var(--accent))' }}
            animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }}
          >
            <Volume2 className="h-4 w-4 text-white" />
          </motion.div>
        )}
      </div>

      {/* Sound wave bars */}
      <div className="flex items-end gap-1 h-8">
        {[0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.7, 1, 0.4, 0.8, 0.6, 0.3].map((h, i) => (
          <motion.div
            key={i} className="w-1.5 rounded-full" style={{ background: 'hsl(var(--primary))' }}
            animate={speaking ? { height: [`${h * 8}px`, `${h * 28}px`, `${h * 8}px`], opacity: [0.4, 1, 0.4] } : { height: '4px', opacity: 0.2 }}
            transition={{ duration: 0.5 + i * 0.05, repeat: Infinity, delay: i * 0.06 }}
          />
        ))}
      </div>

      <motion.p className="text-xs font-medium" style={{ color: 'hsl(var(--primary))' }}
        animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}>
        {thinking ? '🤔 Analyzing your answer . . .' : speaking ? '🎤 Interviewer speaking . . .' : '✨ Ready for your answer'}
      </motion.p>
    </div>
  );
}

// ── MAIN INTERVIEW SESSION ─────────────────────────────────────────────────────
export default function InterviewSession() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const config = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('interviewConfig') || '{}'); }
    catch { return {}; }
  }, []);

  const { role = 'Software Developer', difficulty = 'Medium', experience = 'Fresher', questionCount = 7 } = config;
  const { lang } = useLanguage();

  const [phase, setPhase] = useState('interview'); // 'interview' | 'results'
  const [isGenerating, setIsGenerating] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showHindi, setShowHindi] = useState(lang === 'Hindi');
  const [answers, setAnswers] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const recognitionRef = useRef(null);

  const [videoEnabled, setVideoEnabled] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('interviewConfig') || '{}').videoEnabled !== false; }
    catch { return true; }
  });
  const [emotionTimeline, setEmotionTimeline] = useState([]);
  const [lastConfidence, setLastConfidence] = useState(0);

  const handleEmotionSnapshot = useCallback((emotions) => {
    // Record the current emotion state (called from VideoAnalyzer)
  }, []);

  const handleConfidenceUpdate = useCallback((conf) => {
    setLastConfidence(conf);
  }, []);

  // Always generate fresh AI questions using Gemini
  useEffect(() => {
    const fetchAIQuestions = async () => {
      try {
        const count = questionCount || 7;
        const generated = await generateQuestions({
          role, difficulty, experience, count,
          resumeText: config.resumeText || '',
        });
        setQuestions(generated);
        preloadQuestionsAudio(generated);
      } catch (e) {
        console.error('AI question generation failed, using question bank:', e);
        const pool = QUESTION_BANK[role] || DEFAULT_QUESTIONS;
        const count = questionCount || 7;
        const fallbackList = shuffleArray(pool).slice(0, Math.min(count, pool.length));
        setQuestions(fallbackList);
        preloadQuestionsAudio(fallbackList);
      } finally {
        setIsGenerating(false);
      }
    };

    fetchAIQuestions();
  }, []);

  const speakText = useCallback((text) => {
    if (isMuted) return;
    speakWithDeepgram(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  }, [isMuted]);

  useEffect(() => {
    setShowHindi(lang === 'Hindi');
  }, [lang]);

  useEffect(() => {
    if (questions[currentQ]) {
      const timer = setTimeout(() => speakText(questions[currentQ]), 50);
      return () => {
        clearTimeout(timer);
        stopSpeaking();
      };
    }
    return () => stopSpeaking();
  }, [currentQ, questions, speakText]);

  const saveAndAdvance = useCallback((record) => {
    record.confidenceScore = lastConfidence;
    setAnswers(prev => [...prev, record]);
    setEmotionTimeline(prev => [...prev, { questionIndex: currentQ, confidence: lastConfidence, timestamp: Date.now() }]);
    setAnswer('');
    setFeedback(null);
    if (currentQ + 1 >= questions.length) {
      setPhase('results');
      stopSpeaking();
      stopDeepgramSTT();
      setIsRecording(false);
    } else {
      setCurrentQ(prev => prev + 1);
      setQuestionStartTime(Date.now());
    }
  }, [currentQ, questions.length, lastConfidence]);

  const toggleRecording = () => {
    if (isRecording) {
      stopDeepgramSTT();
      setIsRecording(false);
      return;
    }
    stopSpeaking();
    setIsSpeaking(false);
    setIsRecording(true);
    startDeepgramSTT({
      onTranscript: (transcript, isFinal) => {
        setAnswer(transcript);
      },
      onEnd: () => {
        setIsRecording(false);
      },
      onError: (err) => {
        console.warn('[STT Error]:', err);
        setIsRecording(false);
      }
    });
  };

  // Helper: call Gemini with model fallback chain
  // (now handled by ../../utils/gemini.js)

  const getAIFeedback = async () => {
    if (!answer.trim()) return;
    setAiLoading(true);
    setFeedback(null);
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);

    try {
      const feedbackData = await getAnswerFeedback({
        question: questions[currentQ],
        answer,
        role,
        difficulty,
        experience,
      });
      setFeedback(feedbackData);
      setTimeout(() => {
        saveAndAdvance({ question: questions[currentQ], answer, feedback: feedbackData, skipped: false, timeTaken });
      }, 4000);
    } catch (err) {
      const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
      // Fallback score: based on word count only (no random inflation)
      const fallbackScore = wordCount < 5 ? 10 : wordCount < 15 ? 25 : wordCount < 30 ? 38 : 45;
      let idealAnswer = 'Practice answering this with the STAR method (Situation, Task, Action, Result).';
      try {
        idealAnswer = await getIdealAnswer({ question: questions[currentQ], role, difficulty });
      } catch { /* use default */ }
      const fallback = {
        original: answer.substring(0, 200) || '(No answer provided)',
        improved: idealAnswer,
        tips: wordCount < 5 ? 'Always attempt an answer — even a partial response shows initiative.' : 'Be more specific and use real examples from your experience.',
        score: fallbackScore,
      };
      setFeedback(fallback);
      setTimeout(() => {
        saveAndAdvance({ question: questions[currentQ], answer, feedback: fallback, skipped: false, timeTaken });
      }, 3500);
    } finally {
      setAiLoading(false);
    }
  };

  const skipQuestion = useCallback(() => {
    if (currentQ >= questions.length) return;
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
    const q = questions[currentQ];
    saveAndAdvance({
      question: q,
      answer: '',
      feedback: null,
      skipped: true,
      timeTaken
    });
  }, [currentQ, questions, questionStartTime, saveAndAdvance]);

  const restart = () => {
    const pool = QUESTION_BANK[role] || DEFAULT_QUESTIONS;
    setQuestions(shuffleArray(pool).slice(0, 7));
    setCurrentQ(0);
    setAnswer('');
    setFeedback(null);
    setAnswers([]);
    setPhase('interview');
    setQuestionStartTime(Date.now());
  };

  // ── RESULTS ───────────────────────────────────────────────────────────
  const results = useMemo(() => {
    if (answers.length === 0) return null;
    const answered = answers.filter(a => !a.skipped);
    const skipped = answers.length - answered.length;

    // Skipped questions count as 0 — prevents inflated scores
    // Also cap feedback score at 0 for empty/very short answers
    const totalScore = answers.reduce((s, a) => {
      if (a.skipped) return s + 0;
      const rawScore = a.feedback?.score;
      // If score is missing/null, use 25 as a low default (not 50)
      return s + (typeof rawScore === 'number' ? rawScore : 25);
    }, 0);
    const avgScore = Math.round(totalScore / answers.length);

    const avgTime = answered.length > 0
      ? Math.round(answered.reduce((s, a) => s + a.timeTaken, 0) / answered.length) : 0;

    // Fluency: based on average answer length (word count) of answered questions
    const avgWordCount = answered.length > 0
      ? Math.round(answered.reduce((s, a) => s + (a.answer?.trim().split(/\s+/).filter(Boolean).length || 0), 0) / answered.length)
      : 0;
    // Fluency score: 20+ words is great, < 5 words is poor
    const fluencyRaw = avgWordCount >= 60 ? 90 : avgWordCount >= 40 ? 80 : avgWordCount >= 20 ? 70 : avgWordCount >= 10 ? 50 : avgWordCount >= 5 ? 35 : 15;
    // Blend with answer quality score
    const fluency = Math.min(100, Math.max(0, Math.round((fluencyRaw + avgScore) / 2)));

    // Grammar: approximated from the ratio of answered vs skipped and avg score
    // Higher skip rate → lower grammar score; also reflects answer quality
    const skipPenalty = skipped > 0 ? Math.round((skipped / answers.length) * 30) : 0;
    const grammar = Math.min(100, Math.max(0, avgScore - skipPenalty));

    // Confidence: from video if available, otherwise derive from score + answer length
    const videoConfidenceAvg = answers.filter(a => a.confidenceScore > 0).length > 0
      ? Math.round(answers.filter(a => a.confidenceScore > 0).reduce((s, a) => s + a.confidenceScore, 0) / answers.filter(a => a.confidenceScore > 0).length)
      : null;
    const confidence = videoConfidenceAvg !== null
      ? videoConfidenceAvg
      : Math.min(100, Math.max(0, Math.round((avgScore * 0.7) + (fluency * 0.3))));

    const grade = avgScore >= 85 ? 'Excellent' : avgScore >= 70 ? 'Good' : avgScore >= 50 ? 'Fair' : 'Needs Work';
    const gradeColor = avgScore >= 85 ? 'text-green-500' : avgScore >= 70 ? 'text-primary' : avgScore >= 50 ? 'text-yellow-500' : 'text-destructive';
    
    return { 
      id: Date.now().toString(),
      role, difficulty, experience, 
      date: new Date().toISOString(),
      total: answers.length, answered: answered.length, skipped, avgScore, avgTime, fluency, confidence, grammar, grade, gradeColor, answers
    };
  }, [answers, role, difficulty, experience]);

  // Save to history when phase changes to results
  useEffect(() => {
    if (phase === 'results' && results) {
      const userKey = user?.email ? `interviewHistory_${user.email}` : 'interviewHistory';
      const existingHistory = JSON.parse(localStorage.getItem(userKey) || '[]');
      // Avoid duplicate saves
      if (!existingHistory.some(h => h.id === results.id)) {
        const itemWithUser = { ...results, userEmail: user?.email || 'guest' };
        localStorage.setItem(userKey, JSON.stringify([itemWithUser, ...existingHistory]));

        // Post to backend API to sync with MongoDB and update Dashboard stats
        api.post('/interviews/record', results)
          .then(() => {
            console.log('Interview recorded to MongoDB');
            // Invalidate dashboard cache so stats refresh automatically
            queryClient.invalidateQueries(['dashboardStats']);
          })
          .catch(err => console.warn('Failed to record interview to MongoDB:', err));
      }
    }
  }, [phase, results, user]);

  // Fetch ideal answers for skipped questions asynchronously on results screen
  useEffect(() => {
    if (phase !== 'results' || answers.length === 0) return;

    let isMounted = true;
    const fetchSkippedIdealAnswers = async () => {
      for (let i = 0; i < answers.length; i++) {
        const item = answers[i];
        if (item.skipped && (!item.feedback || !item.feedback.improved)) {
          try {
            const ideal = await getIdealAnswer({ question: item.question, role, difficulty });
            if (ideal && isMounted) {
              setAnswers(prev => {
                const updated = [...prev];
                if (updated[i]) {
                  updated[i] = {
                    ...updated[i],
                    feedback: {
                      original: '(Skipped — no answer provided)',
                      improved: ideal,
                      tips: 'Practice answering this type of question — it\'s commonly asked in interviews.',
                      score: 0,
                    }
                  };
                }
                return updated;
              });
            }
          } catch (e) {
            console.warn(`Failed to fetch ideal answer for skipped question ${i}:`, e);
          }
        }
      }
    };

    fetchSkippedIdealAnswers();

    return () => { isMounted = false; };
  }, [phase]);

  // ── RESULTS SCREEN ────────────────────────────────────────────────────────────
  if (phase === 'results' && results) {
    return (
      <div className="max-w-3xl mx-auto pt-4 pb-10">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-display font-bold mb-2">Interview Complete!</h1>
          <p className="text-muted-foreground">Detailed performance report for <span className="font-semibold text-foreground">{role}</span> interview</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-8 rounded-3xl glass-card shadow-purple mb-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-5" />
          <div className="relative">
            <div className="text-7xl font-display font-bold mb-1" style={{ color: 'hsl(var(--primary))' }}>{results.avgScore}</div>
            <div className="text-2xl font-semibold mb-1">/100</div>
            <div className={`text-xl font-bold mb-4 ${results.gradeColor}`}>{results.grade} Performance</div>
            <div className="flex justify-center gap-2 flex-wrap">
              {results.avgScore >= 70 && <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600">🌟 Interview Ready</span>}
              {results.answered >= 5 && <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">💪 Strong Completion</span>}
              {results.skipped === 0 && <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">✅ No Skips</span>}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Answered', value: `${results.answered}/${results.total}`, Icon: CheckCircle, color: 'text-green-500' },
            { label: 'Skipped', value: results.skipped, Icon: XCircle, color: results.skipped > 0 ? 'text-yellow-500' : 'text-green-500' },
            { label: 'Avg Time', value: `${results.avgTime}s`, Icon: Clock, color: 'text-accent' },
            { label: 'Grammar', value: `${results.grammar}%`, Icon: Star, color: 'text-primary' },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
              className="p-4 rounded-2xl glass-card shadow-card text-center">
              <card.Icon className={`h-5 w-5 ${card.color} mx-auto mb-2`} />
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl glass-card shadow-card mb-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Skill Assessment
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Overall Score', value: results.avgScore, color: 'bg-primary' },
              { label: 'Fluency', value: results.fluency, color: 'bg-accent' },
              { label: 'Confidence', value: results.confidence, color: 'bg-green-500' },
              { label: 'Grammar Accuracy', value: results.grammar, color: 'bg-yellow-500' },
            ].map(skill => (
              <div key={skill.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{skill.label}</span>
                  <span className="font-bold">{skill.value}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${skill.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${skill.value}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-accent" /> Question-by-Question Breakdown
          </h3>
          <div className="space-y-3">
            {answers.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.07 }}
                className="p-4 rounded-xl glass-card shadow-card">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${a.skipped ? 'bg-yellow-500/10 text-yellow-600' : 'bg-green-500/10 text-green-600'}`}>
                    {a.skipped ? '⏭' : `${a.feedback?.score ?? '✓'}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1">Q{i + 1}: {a.question}</p>
                    {a.skipped ? (
                      <>
                        <p className="text-xs text-yellow-500 font-medium mb-2">⏭ Skipped</p>
                        {a.feedback?.improved ? (
                          <div className="space-y-2">
                            <div className="p-2.5 rounded-lg" style={{ background: 'hsl(45 90% 50% / 0.07)', border: '1px solid hsl(45 90% 50% / 0.25)' }}>
                              <p className="text-xs"><span className="font-semibold text-yellow-500">📖 Ideal Answer:</span> {a.feedback.improved}</p>
                            </div>
                            <p className="text-xs text-muted-foreground"><span className="font-medium text-primary">💡 Tip:</span> {a.feedback.tips}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                            <span>Fetching ideal answer with Groq AI...</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">Your answer: {a.answer}</p>
                        {a.feedback && (
                          <div className="space-y-2">
                            <div className="p-2.5 rounded-lg" style={{ background: 'hsl(152 60% 45% / 0.08)', border: '1px solid hsl(152 60% 45% / 0.25)' }}>
                              <p className="text-xs"><span className="font-semibold text-green-600">✨ Ideal Answer:</span> {a.feedback.improved}</p>
                            </div>
                            <p className="text-xs text-muted-foreground"><span className="font-medium text-primary">💡 Tip:</span> {a.feedback.tips}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="h-3 w-3 inline mr-1" />{a.timeTaken}s
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="p-5 rounded-2xl glass-card shadow-card mb-8">
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" /> Personalized Recommendations
          </h3>
          <div className="space-y-2">
            {[
              results.avgScore < 70 && 'Practice the STAR method (Situation, Task, Action, Result) for behavioral questions.',
              results.skipped > 1 && 'Review common interview questions for your role to reduce blank answers.',
              results.grammar < 75 && 'Focus on sentence structure and articulation when practicing answers.',
              results.avgTime > 120 && 'Try to keep answers between 60-90 seconds — practice being concise.',
              'Record yourself answering and watch it back to identify filler words.',
            ].filter(Boolean).map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-0.5 flex-shrink-0">→</span>
                <span className="text-muted-foreground">{tip}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={restart} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-glow">
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
          <button onClick={() => navigate('/dashboard')} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border glass-card font-medium hover:bg-secondary/50 transition-colors">
            Back to Dashboard
          </button>
          <button onClick={() => navigate('/dashboard/history')} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border glass-card font-medium hover:bg-secondary/50 transition-colors">
            <Download className="h-4 w-4" /> View All Reports
          </button>
        </div>
      </div>
    );
  }

  // ── INTERVIEW SCREEN ─────────────────────────────────────────────────────────
  if (isGenerating) {
    return (
      <div className="max-w-3xl mx-auto pt-20 pb-10 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 relative mb-6">
          <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-b-2 border-accent animate-spin" style={{ animationDirection: 'reverse' }}></div>
          <Brain className="absolute inset-0 m-auto h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">🤖 AI is crafting your questions...</h2>
        <p className="text-muted-foreground">Generating {questionCount} fresh, unique {role} questions tailored to {difficulty} level.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pt-2 pb-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Q {currentQ + 1}/{questions.length}</span>
          <div className="flex gap-1.5 flex-1">
            {questions.map((_, i) => (
              <motion.div
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors duration-500 ${i < currentQ ? 'bg-green-500' : i === currentQ ? 'bg-primary' : 'bg-muted'}`}
                initial={i === currentQ ? { scaleX: 0 } : {}}
                animate={{ scaleX: 1 }}
              />
            ))}
          </div>
          <button onClick={() => { const nextMuted = !isMuted; setIsMuted(nextMuted); if (nextMuted) stopSpeaking(); }}
            className="text-muted-foreground hover:text-foreground transition-colors">
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Side by Side Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Avatar, Question & Answer Input */}
          <div className={`space-y-6 ${videoEnabled ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
            {/* Avatar + Question card */}
            <div className="p-6 rounded-3xl glass-card shadow-purple text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-hero opacity-60 rounded-t-3xl" />
              <div className="mb-4"><AvatarSpeaker speaking={isSpeaking} thinking={aiLoading} /></div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{role} Interview</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => speakText(questions[currentQ])}
                    className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Replay question">
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.h2 key={currentQ}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="text-xl font-display font-semibold">
                  {questions[currentQ]}
                </motion.h2>
              </AnimatePresence>
            </div>

            {/* Answer section */}
            <AnimatePresence mode="wait">
              {!feedback ? (
                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-4">
                  <div className="relative">
                    <textarea
                      placeholder="Type your answer here, or use the microphone to speak..."
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); getAIFeedback(); } }}
                      className="w-full min-h-[150px] rounded-2xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                    {answer && (
                      <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                        {answer.split(' ').filter(Boolean).length} words
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 items-center">
                    <button
                      onClick={toggleRecording}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${isRecording ? 'bg-destructive text-destructive-foreground' : 'border border-border glass-card hover:border-primary/50'}`}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="h-4 w-4" />
                          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>Recording...</motion.span>
                        </>
                      ) : (
                        <><Mic className="h-4 w-4" /> Speak Answer</>
                      )}
                    </button>

                    <button
                      onClick={getAIFeedback}
                      disabled={aiLoading || !answer.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-hero text-primary-foreground shadow-glow hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {aiLoading ? <><RefreshCw className="h-4 w-4 animate-spin" /> Analyzing...</> : <><Send className="h-4 w-4" /> Submit Answer</>}
                    </button>

                    <button
                      onClick={skipQuestion} disabled={aiLoading}
                      className="flex items-center gap-1.5 ml-auto px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-medium transition-colors"
                    >
                      <SkipForward className="h-4 w-4" /> I don't know
                    </button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">Ctrl+Enter to submit • Chrome recommended for voice recording</p>
                </motion.div>
              ) : (
                <motion.div key="feedback" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'hsl(var(--primary)/0.08)', border: '1px solid hsl(var(--primary)/0.2)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center text-white font-bold text-lg">
                        {feedback.score}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">AI Score</p>
                        <p className="text-xs text-muted-foreground">Moving to next question in 4s…</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-32 rounded-full bg-muted overflow-hidden">
                      <motion.div className="h-full bg-gradient-hero rounded-full" initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: 4, ease: 'linear' }} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl" style={{ background: 'hsl(var(--destructive)/0.06)', border: '1px solid hsl(var(--destructive)/0.2)' }}>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: 'hsl(var(--destructive))' }}>📝 Your Answer</h4>
                      <p className="text-sm leading-relaxed">{feedback.original}</p>
                    </div>
                    <div className="p-5 rounded-2xl" style={{ background: 'hsl(152 60% 45% / 0.08)', border: '1px solid hsl(152 60% 45% / 0.25)' }}>
                      <h4 className="text-sm font-semibold mb-2 text-green-600 dark:text-green-400">✨ Improved Version</h4>
                      <p className="text-sm leading-relaxed">{feedback.improved}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--primary)/0.06)', border: '1px solid hsl(var(--primary)/0.2)' }}>
                    <p className="text-sm"><span className="font-semibold text-primary">💡 Tip:</span> {feedback.tips}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Video Camera & Emotion Analysis */}
          {videoEnabled && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.2 }}
              className="lg:col-span-5 space-y-4"
            >
              <VideoAnalyzer
                isActive={phase === 'interview'}
                onConfidenceUpdate={handleConfidenceUpdate}
                compact={true}
              />
              {emotionTimeline.length > 0 && (
                <div className="glass rounded-2xl border border-border/50 p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Emotion Timeline</h3>
                  <EmotionTimeline timeline={emotionTimeline} />
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
