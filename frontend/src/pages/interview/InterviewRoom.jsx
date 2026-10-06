import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Loader2, Mic, MicOff, Send, PhoneOff, Bot, User, Volume2, VolumeX } from 'lucide-react';

export default function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const messagesEndRef = useRef(null);

  // Speech Recognition (Web Speech API)
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Text to Speech
  const [isSpeaking, setIsSpeaking] = useState(true);
  const synth = window.speechSynthesis;

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const { data } = await api.get(`/interviews/${id}`);
        setInterview(data.data.interview);
        setMessages(data.data.interview.conversation || []);
        setIsLoading(false);
      } catch (error) {
        alert('Failed to load interview.');
        navigate('/dashboard');
      }
    };
    fetchInterview();
  }, [id, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Read the latest AI message aloud
  useEffect(() => {
    if (isSpeaking && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'interviewer') {
        speakText(lastMsg.message);
      }
    }
  }, [messages, isSpeaking]);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      // Set language based on interview config
      if (interview?.language && interview.language !== 'English') {
        // Simple mapping, a real app would have a robust map
        const langMap = { 'Hindi': 'hi-IN', 'Bengali': 'bn-IN', 'Tamil': 'ta-IN', 'Telugu': 'te-IN' };
        recognitionRef.current.lang = langMap[interview.language] || 'en-IN';
      } else {
        recognitionRef.current.lang = 'en-US';
      }

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput((prev) => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        // If user manually turned it off, it's fine. If it timed out, maybe restart.
        if (isListening) setIsListening(false);
      };
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synth) synth.cancel();
    };
  }, [interview]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (synth.speaking) synth.cancel(); // Stop AI speaking if user wants to talk
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const speakText = (text) => {
    if (!synth) return;
    synth.cancel();
    const utterThis = new SpeechSynthesisUtterance(text);
    
    // Set voice based on language
    if (interview?.language && interview.language !== 'English') {
      const langMap = { 'Hindi': 'hi-IN', 'Bengali': 'bn-IN', 'Tamil': 'ta-IN', 'Telugu': 'te-IN' };
      utterThis.lang = langMap[interview.language] || 'en-IN';
    } else {
      utterThis.lang = 'en-US';
    }
    
    synth.speak(utterThis);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isSending) return;

    if (isListening) toggleListen();
    if (synth.speaking) synth.cancel();

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'candidate', message: userMessage }]);
    setIsSending(true);

    try {
      const { data } = await api.post(`/interviews/${id}/message`, { message: userMessage });
      setMessages(data.data.interview.conversation);
    } catch (error) {
      console.error(error);
      alert('Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleEnd = async () => {
    if (!window.confirm("Are you sure you want to end this interview?")) return;
    
    setIsEnding(true);
    if (synth) synth.cancel();
    if (isListening) recognitionRef.current?.stop();

    try {
      await api.post(`/interviews/${id}/end`);
      navigate(`/dashboard/report/${id}`);
    } catch (error) {
      console.error(error);
      alert('Failed to end interview gracefully.');
      navigate('/dashboard');
    }
  };

  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center bg-background"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:32px_32px] pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="h-20 glass border-b border-border/50 px-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">{interview.company} • {interview.jobRole}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Interview in Progress ({interview.language})
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSpeaking(!isSpeaking)}
            className={`p-2 rounded-full transition-colors ${isSpeaking ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            title="Toggle Voice Output"
          >
            {isSpeaking ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          
          <button 
            onClick={handleEnd}
            disabled={isEnding}
            className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isEnding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><PhoneOff size={16} /> End Interview</>}
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 space-y-6 relative z-10 container max-w-4xl mx-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-4 ${msg.role === 'candidate' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === 'candidate' ? 'bg-blue-500/20 text-blue-500' : 'bg-primary/20 text-primary border border-primary/30'
            }`}>
              {msg.role === 'candidate' ? <User size={20} /> : <Bot size={20} />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl p-5 shadow-sm ${
              msg.role === 'candidate' 
                ? 'bg-blue-600 text-white rounded-tr-sm' 
                : 'glass-card border border-border rounded-tl-sm'
            }`}>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.message}</p>
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
              <Bot size={20} className="text-primary" />
            </div>
            <div className="glass-card rounded-2xl rounded-tl-sm p-5 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-6 glass border-t border-border/50 relative z-10">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSend} className="flex gap-3">
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListen}
                className={`p-4 rounded-xl flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' 
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
                title="Voice Input"
              >
                {isListening ? <Mic size={24} /> : <MicOff size={24} />}
              </button>
            )}
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Type your answer..."}
              disabled={isSending}
              className="flex-1 bg-background border border-border rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-[15px]"
            />
            
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={20} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
