import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Loader2, Target, TrendingUp, Trophy, Flame, Play, Clock, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function Dashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await api.get('/progress/dashboard');
      return res.data.data;
    },
    staleTime: 0,              // Always consider data stale — fetch fresh on every visit
    refetchOnWindowFocus: true, // Refetch when user switches back to this tab
    refetchOnMount: true,       // Always refetch when component mounts
  });

  // Also pull from localStorage as a real-time local fallback for total interviews
  const localKey = user?.email ? `interviewHistory_${user.email}` : 'interviewHistory';
  const localHistory = JSON.parse(localStorage.getItem(localKey) || '[]');
  const localCompleted = localHistory.length;
  const localAvgScore = localCompleted > 0
    ? Math.round(localHistory.reduce((s, h) => s + (h.avgScore || 0), 0) / localCompleted)
    : 0;
  const localHighest = localCompleted > 0
    ? Math.max(...localHistory.map(h => h.avgScore || 0))
    : 0;

  if (isLoading) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const stats = data?.stats || {};
  const weeklyData = data?.weeklyData || [];
  const recentInterviews = data?.recentInterviews || [];

  // Merge backend stats with local data: use whichever is higher (more recent)
  const displayInterviews = Math.max(stats.completedInterviews || 0, localCompleted);
  const displayAvgScore = localAvgScore > 0 && localCompleted >= (stats.completedInterviews || 0)
    ? localAvgScore
    : (stats.averageScore || 0);
  const displayHighest = Math.max(stats.highestScore || 0, localHighest);
  const displayStreak = stats.currentStreak || 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden border border-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10"></div>
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-muted-foreground text-lg mb-6">
            You're on a <span className="text-orange-500 font-bold">{displayStreak} day streak</span>. Keep practicing to land your dream role.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/dashboard/setup">
              <button className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]">
                <Play size={18} /> Start New Interview
              </button>
            </Link>
            <button
              onClick={() => { queryClient.invalidateQueries(['dashboardStats']); refetch(); }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
              title="Refresh dashboard stats"
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
              {isFetching ? 'Refreshing...' : 'Refresh Stats'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Avg Score', value: `${displayAvgScore}%`, icon: <Target className="text-blue-500" />, color: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Interviews Done', value: displayInterviews, icon: <TrendingUp className="text-green-500" />, color: 'bg-green-500/10 border-green-500/20' },
          { label: 'Highest Score', value: `${displayHighest}%`, icon: <Trophy className="text-yellow-500" />, color: 'bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Current Streak', value: displayStreak, icon: <Flame className="text-orange-500" />, color: 'bg-orange-500/10 border-orange-500/20' },
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-2xl border ${stat.color} bg-card shadow-sm flex items-start justify-between`}>
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-background shadow-sm`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-border relative overflow-hidden">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary"/> Performance Overview
          </h3>
          
          {stats.totalInterviews === 0 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-3xl">
              <div className="bg-card p-4 rounded-xl shadow-lg border border-border text-center max-w-xs">
                <TrendingUp size={32} className="mx-auto mb-2 text-primary opacity-50" />
                <h4 className="font-semibold text-foreground mb-1">No Data Yet</h4>
                <p className="text-xs text-muted-foreground">Start your first interview to unlock your performance analytics.</p>
              </div>
            </div>
          )}

          <div className={`h-[300px] w-full ${stats.totalInterviews === 0 ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.totalInterviews === 0 ? [
                { day: 'Mon', avgScore: 30, count: 1 }, { day: 'Tue', avgScore: 45, count: 2 }, { day: 'Wed', avgScore: 40, count: 1 },
                { day: 'Thu', avgScore: 60, count: 3 }, { day: 'Fri', avgScore: 75, count: 2 }, { day: 'Sat', avgScore: 85, count: 4 }, { day: 'Sun', avgScore: 90, count: 5 }
              ] : weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line yAxisId="left" type="monotone" dataKey="avgScore" name="Avg Score (%)" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="count" name="Interviews Given" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6 rounded-3xl border border-border flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock size={20} className="text-primary"/> Recent Activity
            </h3>
            <Link to="/dashboard/history" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {recentInterviews.length > 0 ? recentInterviews.map((interview) => (
              <Link to={`/dashboard/report/${interview._id}`} key={interview._id} className="block p-4 rounded-xl border border-border hover:border-primary/50 bg-background/50 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">{interview.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                    interview.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {interview.status === 'completed' ? `${interview.feedback?.overallScore || 0}%` : 'In Progress'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
                  <span>{interview.difficulty}</span>
                </div>
              </Link>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-6">
                <Target size={40} className="mb-4 opacity-20" />
                <p>No recent interviews</p>
                <Link to="/dashboard/setup" className="text-primary mt-2 font-medium">Start one now</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
