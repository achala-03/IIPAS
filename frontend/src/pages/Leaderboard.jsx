import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Flame, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/progress/leaderboard');
        if (res.data.success && res.data.data.length > 0) {
          setLeaderboardData(res.data.data);
        } else {
          setLeaderboardData([]);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10"></div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-hero mb-6 shadow-glow">
            <Trophy className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4">Global <span className="text-gradient">Leaderboard</span></h1>
          <p className="text-muted-foreground text-lg">Top performers of the week. Keep practicing to climb the ranks!</p>
        </div>

        <div className="glass-card shadow-card rounded-3xl overflow-hidden border border-border">
          <div className="grid grid-cols-12 gap-4 p-4 sm:p-6 border-b border-border bg-muted/30 font-semibold text-sm text-muted-foreground">
            <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
            <div className="col-span-7 sm:col-span-5">Candidate</div>
            <div className="col-span-3 sm:col-span-3 text-center hidden sm:block">Target Role</div>
            <div className="col-span-3 sm:col-span-3 text-right pr-4">Score</div>
          </div>

          <div className="divide-y divide-border/50 min-h-[300px] relative">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <RefreshCw className="w-8 h-8 animate-spin mb-4 text-primary" />
                <p>Loading ranking data...</p>
              </div>
            ) : leaderboardData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Trophy className="w-12 h-12 mb-4 opacity-20" />
                <p>No candidates have completed an interview yet.</p>
                <p className="text-sm mt-1">Be the first to claim the top spot!</p>
              </div>
            ) : (
              leaderboardData.map((user, i) => {
                const isMe = currentUser?._id === user._id;
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    key={user._id || user.rank}
                    className={`grid grid-cols-12 gap-4 p-4 sm:p-6 items-center transition-colors hover:bg-muted/20 ${i < 3 ? 'bg-primary/[0.02]' : ''} ${isMe ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
                  >
                    <div className="col-span-2 sm:col-span-1 flex justify-center">
                      {i === 0 ? <Medal className="w-8 h-8 text-yellow-500" /> :
                        i === 1 ? <Medal className="w-8 h-8 text-gray-400" /> :
                          i === 2 ? <Medal className="w-8 h-8 text-amber-600" /> :
                            <span className="font-bold text-lg text-muted-foreground">#{user.rank}</span>}
                    </div>

                    <div className="col-span-7 sm:col-span-5 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${i < 3 ? 'bg-gradient-hero shadow-glow' : 'bg-primary/20 text-primary'}`}>
                        {user.avatar || (user.name ? user.name.substring(0, 2).toUpperCase() : 'U')}
                      </div>
                      <div>
                        <h3 className="font-bold text-base flex items-center gap-2">
                          {user.name}
                          {isMe && <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                          <Flame className="w-3 h-3" /> {user.streak || 0} day streak
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3 sm:col-span-3 text-center hidden sm:block">
                      <span className="inline-block px-3 py-1 rounded-full bg-muted text-xs font-medium truncate max-w-full">{user.targetRole || user.role || 'Candidate'}</span>
                    </div>

                    <div className="col-span-3 sm:col-span-3 text-right pr-4 font-display font-bold text-primary text-xl">
                      {user.score.toLocaleString()} <span className="text-xs text-muted-foreground font-body font-normal">pts</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
