import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Clock, Settings2, Play, CheckCircle, XCircle, ArrowRight, RefreshCw, BarChart3, TrendingUp, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateQuizQuestions } from '../utils/gemini';

const ALL_QUESTIONS = [
  // Quantitative
  { q: "If a train travels 60 km/h for 2 hours, how far does it go?", options: ["120 km", "100 km", "60 km", "150 km"], a: 0, category: "Quantitative" },
  { q: "What is 15% of 200?", options: ["15", "30", "45", "60"], a: 1, category: "Quantitative" },
  { q: "A shopkeeper sells an item for $150 at a 25% profit. What was the cost price?", options: ["$120", "$100", "$125", "$110"], a: 0, category: "Quantitative" },
  { q: "If x + y = 10 and x - y = 4, what is the value of x * y?", options: ["21", "24", "16", "25"], a: 0, category: "Quantitative" },
  { q: "The average of 5 consecutive numbers is 20. What is the largest number?", options: ["21", "22", "23", "24"], a: 1, category: "Quantitative" },
  { q: "Two pipes can fill a tank in 10 and 15 hours. How long if both open?", options: ["5 hours", "6 hours", "8 hours", "12 hours"], a: 1, category: "Quantitative" },
  { q: "A train 150m long passes a pole in 15 seconds. What is its speed?", options: ["10 m/s", "15 m/s", "36 km/h", "54 km/h"], a: 0, category: "Quantitative" },
  { q: "The ratio of ages of A and B is 3:4. After 4 years it will be 4:5. Current age of A?", options: ["12", "15", "16", "20"], a: 0, category: "Quantitative" },
  { q: "Find the compound interest on $1000 at 10% per annum for 2 years.", options: ["$200", "$210", "$220", "$250"], a: 1, category: "Quantitative" },
  { q: "What is the probability of getting a sum of 7 when two dice are rolled?", options: ["1/6", "1/12", "1/36", "1/4"], a: 0, category: "Quantitative" },
  
  // Logical Reasoning
  { q: "Look at this series: 2, 6, 18, 54, ... What number should come next?", options: ["108", "148", "162", "216"], a: 2, category: "Logical" },
  { q: "SCD, TEF, UGH, ____, WKL", options: ["CMN", "UJI", "VIJ", "IJT"], a: 2, category: "Logical" },
  { q: "If 'APPLE' is coded as 'EQTPI', how is 'MANGO' coded?", options: ["QERKS", "QERJS", "REQSK", "QRSKE"], a: 0, category: "Logical" },
  { q: "Pointing to a photograph, a man says, 'She is the daughter of my grandfather's only son.' How is she related to him?", options: ["Mother", "Sister", "Aunt", "Daughter"], a: 1, category: "Logical" },
  { q: "Which word does NOT belong with the others?", options: ["Tulip", "Rose", "Bud", "Daisy"], a: 2, category: "Logical" },
  { q: "Odometer is to mileage as compass is to:", options: ["Speed", "Hiking", "Needle", "Direction"], a: 3, category: "Logical" },
  { q: "Window is to pane as book is to:", options: ["Novel", "Glass", "Cover", "Page"], a: 3, category: "Logical" },
  { q: "If A is the brother of B; B is the sister of C; and C is the father of D, how D is related to A?", options: ["Nephew", "Niece", "Cannot be determined", "Brother"], a: 2, category: "Logical" },
  { q: "In a row of boys, If A who is 10th from the left and B who is 9th from the right interchange their positions, A becomes 15th from the left. How many boys are there in the row?", options: ["23", "27", "28", "31"], a: 0, category: "Logical" },
  
  // Verbal
  { q: "Choose the correct synonym for 'MITIGATE'", options: ["Aggravate", "Alleviate", "Instigate", "Complicate"], a: 1, category: "Verbal" },
  { q: "Choose the correct antonym for 'OBSCURE'", options: ["Clear", "Hidden", "Dark", "Vague"], a: 0, category: "Verbal" },
  { q: "Find the correctly spelt word.", options: ["Accomodation", "Accommodation", "Accomodation", "Acommodation"], a: 1, category: "Verbal" },
  { q: "The idiom 'To bite the dust' means:", options: ["To eat voraciously", "To fail or die", "To clean thoroughly", "To attack from behind"], a: 1, category: "Verbal" },
  { q: "She has been living here ____ 2015.", options: ["for", "since", "from", "in"], a: 1, category: "Verbal" },
  { q: "Neither of the boys ____ returned.", options: ["have", "has", "are", "is"], a: 1, category: "Verbal" },
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz() {
  const [phase, setPhase] = useState('setup'); // setup, active, results
  const [config, setConfig] = useState({ questionsCount: 10, difficulty: 'Mixed' });
  const [questions, setQuestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0); // per question
  
  // ── SETUP PHASE ──
  const startQuiz = async () => {
    setIsGenerating(true);
    try {
      const generated = await generateQuizQuestions({
        count: config.questionsCount,
        difficulty: config.difficulty,
      });
      setQuestions(generated);
    } catch (err) {
      console.warn('AI quiz generation failed, fallback to shuffled bank:', err);
      const selected = shuffleArray(ALL_QUESTIONS).slice(0, config.questionsCount);
      setQuestions(selected);
    } finally {
      setIsGenerating(false);
      setAnswers({});
      setCurrentQ(0);
      setTimeLeft(60);
      setPhase('active');
    }
  };

  // Timer logic for active phase
  useEffect(() => {
    if (phase !== 'active' || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(l => l - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase === 'active' && timeLeft === 0) {
      handleNext(); // Auto-skip when time runs out
    }
  }, [timeLeft, phase]);

  const handleSelect = (idx) => {
    setAnswers({ ...answers, [currentQ]: idx });
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setTimeLeft(60);
    } else {
      setPhase('results');
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  // ── RESULTS ──
  const results = useMemo(() => {
    if (phase !== 'results') return null;
    let score = 0;
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    
    questions.forEach((q, i) => {
      if (answers[i] === undefined) skipped++;
      else if (answers[i] === q.a) correct++;
      else incorrect++;
    });

    score = Math.round((correct / questions.length) * 100);
    
    return { score, correct, incorrect, skipped, total: questions.length };
  }, [phase, answers, questions]);

  // ── RENDER ──
  if (isGenerating) {
    return (
      <div className="max-w-3xl mx-auto pt-20 pb-10 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 relative mb-6">
          <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
          <div className="absolute inset-2 rounded-full border-b-2 border-accent animate-spin" style={{ animationDirection: 'reverse' }} />
          <Brain className="absolute inset-0 m-auto h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">🤖 Groq AI is crafting your Aptitude Test...</h2>
        <p className="text-muted-foreground">Generating {config.questionsCount} fresh, unique aptitude & reasoning questions.</p>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="max-w-3xl mx-auto pt-10 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-4 bg-primary/10 text-primary">
            <Brain className="h-4 w-4" /> Comprehensive Aptitude Test
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">Configure Your Quiz</h1>
          <p className="text-muted-foreground">Select how many questions you want to solve. We'll generate a custom test covering Quantitative, Logical, and Verbal reasoning.</p>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-border shadow-card max-w-xl mx-auto">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-3">Number of Questions</label>
              <div className="grid grid-cols-3 gap-3">
                {[5, 10, 20].map(n => (
                  <button
                    key={n}
                    onClick={() => setConfig({ ...config, questionsCount: n })}
                    className={`p-3 rounded-xl border font-semibold transition-all ${
                      config.questionsCount === n ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3">Difficulty Mix</label>
              <div className="grid grid-cols-2 gap-3">
                {['Mixed', 'Challenging'].map(d => (
                  <button
                    key={d}
                    onClick={() => setConfig({ ...config, difficulty: d })}
                    className={`p-3 rounded-xl border font-semibold transition-all ${
                      config.difficulty === d ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={startQuiz}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-gradient-hero text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
              >
                <Play className="w-5 h-5" /> Start Quiz Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'active') {
    const q = questions[currentQ];
    const isLast = currentQ === questions.length - 1;

    return (
      <div className="max-w-3xl mx-auto pt-6 px-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm font-semibold text-muted-foreground">
            Question {currentQ + 1} of {questions.length}
          </div>
          <div className={`flex items-center gap-2 font-bold px-3 py-1.5 rounded-lg border ${timeLeft < 15 ? 'text-destructive border-destructive bg-destructive/10 animate-pulse' : 'text-primary border-primary/20 bg-primary/5'}`}>
            <Clock className="w-4 h-4" /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <div className="w-full bg-muted h-2 rounded-full mb-8 overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-hero rounded-full" 
            initial={{ width: 0 }}
            animate={{ width: `${((currentQ) / questions.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card p-6 sm:p-10 rounded-3xl border border-border shadow-card mb-8"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-4 block">{q.category} Reasoning</span>
            <h2 className="text-2xl font-display font-bold mb-8">{q.q}</h2>

            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 font-medium flex items-center justify-between ${
                    answers[currentQ] === i 
                      ? 'border-primary bg-primary/10 text-foreground' 
                      : 'border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span><span className="inline-block w-6 text-sm opacity-50">{String.fromCharCode(65 + i)}.</span> {opt}</span>
                  {answers[currentQ] === i && <CheckCircle className="w-5 h-5 text-primary" />}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="px-6 py-3 font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip Question
          </button>
          
          <button
            onClick={handleNext}
            disabled={answers[currentQ] === undefined}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all shadow-md"
          >
            {isLast ? 'Submit Test' : 'Next Question'} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    return (
      <div className="max-w-4xl mx-auto pt-6 px-4 pb-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-display font-bold mb-2">Quiz Completed!</h1>
          <p className="text-muted-foreground">Here is how you performed on your aptitude test.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-10">
          <div className="sm:col-span-3 p-8 rounded-3xl glass-card shadow-purple text-center border border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-hero opacity-5" />
            <div className="relative">
              <div className="text-7xl font-display font-bold mb-1" style={{ color: 'hsl(var(--primary))' }}>{results.score}%</div>
              <p className="text-lg font-medium text-muted-foreground mb-4">Overall Score</p>
              
              <div className="flex justify-center gap-3">
                {results.score >= 80 && <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold uppercase tracking-wider">🌟 Excellent</span>}
                {results.skipped === 0 && <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-bold uppercase tracking-wider">✅ 100% Attempted</span>}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-border text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <div className="text-3xl font-bold text-green-500">{results.correct}</div>
            <div className="text-sm text-muted-foreground mt-1">Correct Answers</div>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-border text-center">
            <XCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
            <div className="text-3xl font-bold text-destructive">{results.incorrect}</div>
            <div className="text-sm text-muted-foreground mt-1">Incorrect Answers</div>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-border text-center">
            <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <div className="text-3xl font-bold text-yellow-500">{results.skipped}</div>
            <div className="text-sm text-muted-foreground mt-1">Skipped</div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-border mb-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><BarChart3 className="text-primary" /> Detailed Review</h3>
          <div className="space-y-4">
            {questions.map((q, i) => {
              const uAns = answers[i];
              const isCorrect = uAns === q.a;
              const isSkipped = uAns === undefined;
              
              return (
                <div key={i} className={`p-5 rounded-2xl border ${isCorrect ? 'border-green-500/20 bg-green-500/5' : isSkipped ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-destructive/20 bg-destructive/5'}`}>
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1">
                      {isCorrect ? <CheckCircle className="w-5 h-5 text-green-500" /> : isSkipped ? <Clock className="w-5 h-5 text-yellow-500" /> : <XCircle className="w-5 h-5 text-destructive" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold mb-2 text-sm">Q{i+1}: {q.q}</p>
                      <div className="grid sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-background border border-border">
                          <span className="text-muted-foreground mb-1 block">Your Answer:</span>
                          <span className={isCorrect ? 'text-green-500 font-medium' : isSkipped ? 'text-yellow-500' : 'text-destructive font-medium'}>
                            {isSkipped ? 'Skipped' : q.options[uAns]}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                            <span className="text-green-600/70 mb-1 block">Correct Answer:</span>
                            <span className="text-green-600 font-medium">{q.options[q.a]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setPhase('setup')}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity shadow-glow"
          >
            <RefreshCw className="w-5 h-5" /> Take Another Test
          </button>
        </div>
      </div>
    );
  }

  return null;
}
