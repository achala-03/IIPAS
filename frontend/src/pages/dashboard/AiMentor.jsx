import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';

const SYSTEM_PROMPT = `You are an expert AI career mentor named "IIPAS Mentor". You specialize in:
- Interview preparation strategies (behavioral, technical, HR rounds)
- Resume and LinkedIn profile reviews
- Salary negotiation tactics
- Career path guidance and skill roadmaps
- Technical concepts explanation (DSA, system design, frontend, backend, DevOps, etc.)
- Soft skills improvement (communication, confidence, STAR method)

Always be encouraging, professional, concise, and actionable. Format your responses with clear structure using bullet points or numbered lists when helpful. If the user asks a technical question, give a clear explanation with examples. If they share an interview answer, evaluate it and provide an improved version.`;

const QUICK_PROMPTS = [
  'How do I answer: Tell me about yourself?',
  'Tips for salary negotiation',
  'How to crack system design interviews',
  'I have an interview tomorrow - help!',
  'What skills should a Frontend Dev have?',
  'Explain the STAR method with examples',
];

function TypingIndicator() {
  return (
    <div className="flex gap-4 max-w-[85%]">
      <div className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm bg-gradient-hero text-primary-foreground">
        <Bot size={20} />
      </div>
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm rounded-tl-sm flex items-center gap-1.5 h-12">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg, index }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-4 ${isUser ? 'ml-auto flex-row-reverse max-w-[85%]' : 'max-w-[92%]'}`}
    >
      <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm ${isUser ? 'bg-secondary text-secondary-foreground' : 'bg-gradient-hero text-primary-foreground'}`}>
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>
      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${isUser ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border border-border shadow-sm rounded-tl-sm'}`}>
        {msg.content.split('\n').map((line, i, arr) => (
          <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
        ))}
      </div>
    </motion.div>
  );
}

export default function AiMentor() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${user?.name?.split(' ')[0] || 'there'}! ?? I'm your AI career mentor.\n\nI can help you with:\n... Interview strategies & mock answers\n... Resume and skill gap analysis\n... Salary negotiation tips\n... Technical concept explanations\n\nWhat would you like to work on today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (messageText) => {
    const text = (messageText || input).trim();
    if (!text || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error('VITE_GROQ_API_KEY not configured in frontend/.env');

      // Build OpenAI-compatible message history for Groq
      const groqMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        // Include prior conversation history (skip initial greeting — system prompt handles tone)
        ...messages.slice(1).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        { role: 'user', content: text },
      ];

      const models = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
      let aiText = null;

      for (const model of models) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: groqMessages,
              max_tokens: 1024,
              temperature: 0.75,
            }),
          });

          if (!res.ok) { console.warn(`Groq model ${model} HTTP ${res.status}`); continue; }
          const data = await res.json();
          aiText = data.choices?.[0]?.message?.content;
          if (aiText) break;
        } catch (modelErr) {
          console.warn(`Groq model ${model} failed:`, modelErr.message);
        }
      }

      if (!aiText) throw new Error('All AI models failed to respond.');
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      console.error('AI Mentor Error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${error.message}\n\nPlease check your internet connection and try again.` }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Chat cleared! Ready to help again, ${user?.name?.split(' ')[0] || 'there'}. What would you like to discuss?`
    }]);
    setInput('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-500">
      <div className="mb-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold mb-1 flex items-center gap-2">
            AI Mentor Chat <Sparkles className="text-primary" size={24} />
          </h1>
          <p className="text-muted-foreground text-sm">Your personal 24/7 career guide - powered by Groq AI.</p>
        </div>
        <button onClick={clearChat} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
          <RefreshCw size={13} /> Clear
        </button>
      </div>

      <div className="flex-1 glass-card rounded-3xl border border-primary/20 shadow-card flex flex-col overflow-hidden relative min-h-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <AnimatePresence>
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} index={i} />)}
            {isLoading && (
              <motion.div key="typing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-5 pb-3 flex-shrink-0">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Zap size={11} /> Quick start:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button key={i} onClick={() => sendMessage(prompt)} disabled={isLoading}
                  className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 bg-card/50 backdrop-blur-md border-t border-border flex-shrink-0">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about interviews, resumes, salary..."
              disabled={isLoading}
              className="w-full bg-background border border-input rounded-full pl-6 pr-14 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner disabled:opacity-60"
            />
            <button type="submit" disabled={!input.trim() || isLoading}
              className="absolute right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shadow-md">
              {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
            </button>
          </form>
          <div className="text-center mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle size={11} /> AI can make mistakes - verify important information independently.
          </div>
        </div>
      </div>
    </div>
  );
}
