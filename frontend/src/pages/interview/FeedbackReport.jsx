import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { Loader2, Download, ChevronLeft, Target, Award, BrainCircuit, AlertCircle, ArrowRight, Video } from 'lucide-react';
import { ConfidenceMeter } from '../../components/video/ConfidenceMeter';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function FeedbackReport() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/reports/${id}`);
        setData(res.data.data);
      } catch (error) {
        console.error(error);
        alert('Failed to load report.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (!data || !data.feedback) return <div className="text-center py-20">Report not found or not ready yet.</div>;

  const { feedback, interview } = data;
  const scores = feedback.scores || {};
  
  const radarData = [
    { subject: 'Technical', A: scores.technicalAccuracy || 0, fullMark: 100 },
    { subject: 'Communication', A: scores.communication || 0, fullMark: 100 },
    { subject: 'Confidence', A: scores.confidence || 0, fullMark: 100 },
    { subject: 'Problem Solving', A: scores.problemSolving || 0, fullMark: 100 },
    { subject: 'Professionalism', A: scores.professionalism || 0, fullMark: 100 },
    { subject: 'Completeness', A: scores.completeness || 0, fullMark: 100 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <Link to="/dashboard/history" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={20} /> Back to History
        </Link>
        <button onClick={() => window.print()} className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors border border-border">
          <Download size={16} /> Download PDF
        </button>
      </div>

      {/* Main Score Card */}
      <div className="glass-card rounded-3xl p-8 lg:p-12 relative overflow-hidden border border-primary/20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Award size={16} /> {interview.jobRole} • {interview.difficulty}
            </div>
            <h1 className="text-4xl font-bold mb-4">Interview Report</h1>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              {feedback.overallSummary || "Here is a detailed breakdown of your performance."}
            </p>
            
            <div className="flex gap-8">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-extrabold text-primary">{feedback.overallScore || 0}</span>
                  <span className="text-xl text-muted-foreground mb-1">/100</span>
                </div>
              </div>
              <div className="w-px h-16 bg-border"></div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Grade</p>
                <span className={`text-5xl font-extrabold ${['A+', 'A'].includes(feedback.grade) ? 'text-green-500' : ['B+', 'B'].includes(feedback.grade) ? 'text-blue-500' : 'text-yellow-500'}`}>
                  {feedback.grade || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full bg-background/50 rounded-3xl border border-border p-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Feedback Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-card rounded-3xl p-8 border border-border">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-green-500">
            <Target size={24} /> Key Strengths
          </h3>
          <ul className="space-y-4">
            {feedback.strengths?.map((item, i) => (
              <li key={i} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0 mt-0.5">✓</div>
                <span className="text-muted-foreground leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card rounded-3xl p-8 border border-border">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-yellow-500">
            <AlertCircle size={24} /> Areas for Improvement
          </h3>
          <ul className="space-y-4">
            {feedback.weaknesses?.map((item, i) => (
              <li key={i} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center shrink-0 mt-0.5">!</div>
                <span className="text-muted-foreground leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recruiter Comment */}
      <div className="glass-card rounded-3xl p-8 border border-primary/20 bg-primary/5">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BrainCircuit size={24} className="text-primary" /> Recruiter's Note
        </h3>
        <p className="text-lg italic text-muted-foreground border-l-4 border-primary pl-6">
          "{feedback.recruiterComment || 'No specific comment provided.'}"
        </p>
      </div>

      {/* Action Plan */}
      <div className="glass-card rounded-3xl p-8 border border-border">
        <h3 className="text-xl font-bold mb-6">Your Action Plan</h3>
        <p className="text-muted-foreground mb-8 p-4 rounded-xl bg-background border border-border">
          {feedback.nextPracticePlan || 'Review your weak topics and practice again.'}
        </p>
        
        <div className="grid sm:grid-cols-2 gap-4">
          {feedback.recommendedTopics?.map((topic, i) => (
            <div key={i} className="p-4 rounded-xl border border-border hover:border-primary/50 bg-background/50 transition-colors flex justify-between items-center group cursor-pointer">
              <span className="font-medium text-muted-foreground group-hover:text-foreground">{topic}</span>
              <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>

      {/* Video Analysis */}
      <div className="glass-card rounded-3xl p-8 border border-border">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Video className="text-primary" size={24} /> Video Analysis
        </h3>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="shrink-0">
            <ConfidenceMeter value={scores.confidence || 0} size={160} />
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2">Overall Confidence</h4>
            <p className="text-muted-foreground leading-relaxed">
              Based on your facial expressions and emotional state during the interview, your overall confidence score is {scores.confidence || 0}%. 
              {(scores.confidence || 0) > 75 ? ' You appeared highly confident and composed!' : (scores.confidence || 0) > 50 ? ' You appeared moderately confident, but showed some signs of nervousness.' : ' You appeared quite nervous. Practice keeping a relaxed, positive expression.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
