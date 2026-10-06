import { useState, useEffect } from 'react';
import { History, FileText, ArrowRight, TrendingUp, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';

export default function HistoryReports() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (user?.email) {
          const userKey = `interviewHistory_${user.email}`;
          const localStored = JSON.parse(localStorage.getItem(userKey) || '[]');
          
          try {
            const res = await api.get('/interviews');
            const apiInterviews = res.data?.data?.interviews || [];
            if (apiInterviews.length > 0) {
              const formattedApi = apiInterviews.map(i => ({
                id: i._id,
                role: i.jobRole || i.title?.replace(' Interview', '') || 'Software Developer',
                difficulty: i.difficulty || 'Medium',
                experience: i.experience || 'Fresher',
                answered: i.totalQuestions || 5,
                avgScore: i.feedback?.overallScore || i.scores?.overall || 60,
                date: i.createdAt
              }));

              const combined = [...localStored];
              formattedApi.forEach(item => {
                if (!combined.some(c => c.id === item.id)) combined.push(item);
              });
              setHistory(combined);
              return;
            }
          } catch (apiErr) {
            console.warn('API history fetch fallback to local', apiErr);
          }
          setHistory(localStored);
        } else {
          setHistory([]);
        }
      } catch {
        setHistory([]);
      }
    };
    fetchHistory();
  }, [user]);

  const totalInterviews = history.length;
  const avgScore = totalInterviews > 0 
    ? Math.round(history.reduce((acc, h) => acc + (h.avgScore || 0), 0) / totalInterviews)
    : 0;

  // Calculate strongest areas (roles)
  const roleCounts = history.reduce((acc, h) => {
    acc[h.role] = (acc[h.role] || 0) + 1;
    return acc;
  }, {});
  const strongestAreas = Object.keys(roleCounts).sort((a, b) => roleCounts[b] - roleCounts[a]).slice(0, 3);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">My Reports & History</h1>
        <p className="text-muted-foreground">View your past mock interviews and track your progress over time.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <History className="text-primary" size={20} /> Recent Sessions
          </h3>
          
          {history.length === 0 ? (
            <div className="p-8 text-center glass-card border border-border rounded-2xl">
              <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h4 className="font-semibold text-lg mb-1">No history yet</h4>
              <p className="text-muted-foreground text-sm mb-4">Complete an interview session to see your reports here.</p>
              <Link to="/dashboard/setup" className="inline-flex px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium text-sm">
                Start Interview
              </Link>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="glass-card p-5 rounded-2xl border border-border hover:border-primary/30 transition-colors shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-medium">{item.role} Interview</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.difficulty} Difficulty • {item.experience} • {item.answered} Questions</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-medium">
                      <span className={`px-2 py-0.5 rounded-full ${
                        item.avgScore >= 85 ? 'text-emerald-500 bg-emerald-500/10' :
                        item.avgScore >= 70 ? 'text-primary bg-primary/10' :
                        'text-yellow-500 bg-yellow-500/10'
                      }`}>
                        Score: {item.avgScore}/100
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                {/* For now, just link back to setup or nowhere since we don't have a standalone report page yet */}
                <Link to="/dashboard/setup" className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium text-center justify-center">
                  Retake Interview <ArrowRight size={16} />
                </Link>
              </div>
            ))
          )}
          
          {history.length > 0 && (
            <button className="w-full py-3 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-secondary/50 transition-colors text-sm font-medium text-muted-foreground">
              End of History
            </button>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <TrendingUp className="text-accent" size={20} /> Overall Stats
          </h3>
          <div className="glass-card p-6 rounded-2xl shadow-card space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Average Score</span>
                <span className="font-medium">{avgScore}/100</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${
                  avgScore >= 85 ? 'bg-emerald-500' :
                  avgScore >= 70 ? 'bg-primary' :
                  'bg-yellow-500'
                }`} style={{ width: `${avgScore}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Interviews Taken</span>
                <span className="font-medium">{totalInterviews}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: `${Math.min(totalInterviews * 10, 100)}%` }}></div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-3">Strongest Areas</h4>
              <div className="flex flex-wrap gap-2">
                {strongestAreas.length > 0 ? strongestAreas.map(area => (
                  <span key={area} className="text-xs px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">{area}</span>
                )) : (
                  <span className="text-xs text-muted-foreground">Take interviews to build stats</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
