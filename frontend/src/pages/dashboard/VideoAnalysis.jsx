import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Camera, Info, ArrowRight } from 'lucide-react';
import { VideoAnalyzer } from '../../components/video/VideoAnalyzer';
import { EmotionTimeline } from '../../components/video/EmotionTimeline';
import { Link } from 'react-router-dom';

export default function VideoAnalysisPage() {
  const [emotionData, setEmotionData] = useState(null);
  const [confidenceLevel, setConfidenceLevel] = useState(0);
  const [timeline, setTimeline] = useState([]);

  const handleEmotionData = (data) => {
    setEmotionData(data);
    setTimeline(prev => {
      const last = prev[prev.length - 1];
      if (!last || Date.now() - last.timestamp > 5000) {
        const dominant = Object.keys(data).reduce((a, b) => data[a] > data[b] ? a : b, 'neutral');
        return [...prev.slice(-29), { timestamp: Date.now(), emotions: data, confidence: confidenceLevel, questionIndex: prev.length }];
      }
      return prev;
    });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold mb-1">Video Analysis</h1>
        <p className="text-muted-foreground text-sm">Practice with real-time facial emotion detection and confidence scoring</p>
      </motion.div>

      {/* Info Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-start gap-3"
      >
        <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium mb-1">How it works</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Enable your camera to see real-time emotion analysis. The AI detects 7 facial emotions 
            (happy, sad, angry, surprised, fearful, disgusted, neutral) and computes a confidence score 
            based on emotional stability, facial steadiness, and expression consistency. 
            All processing happens locally in your browser — no data is sent to any server.
          </p>
        </div>
      </motion.div>

      {/* Video Analyzer */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <VideoAnalyzer
          isActive={true}
          onEmotionData={handleEmotionData}
          onConfidenceUpdate={setConfidenceLevel}
        />
      </motion.div>

      {/* Emotion Timeline */}
      {timeline.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl border border-border/50 p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Session Timeline</h3>
          <EmotionTimeline timeline={timeline} />
        </motion.div>
      )}

      {/* CTA to start interview with video */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="p-6 rounded-2xl glass-card shadow-card border border-border text-center">
        <Video className="h-8 w-8 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-display font-bold mb-2">Ready for a Full Interview?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Start a mock interview with video analysis enabled for comprehensive feedback
        </p>
        <Link to="/dashboard/setup">
          <button className="px-6 py-3 rounded-xl bg-gradient-hero text-white font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto">
            <Camera className="h-4 w-4" /> Start Interview with Video <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
      </motion.div>
    </div>
  );
}
