'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { 
  User, 
  Trophy, 
  Calendar, 
  TrendingUp, 
  Loader2, 
  LogOut,
  BookOpen,
  Shuffle,
  GitBranch,
  Star
} from 'lucide-react';
import { authAPI, scoresAPI, TodayScores } from '@/lib/api';
import { getToken, removeToken } from '@/lib/auth';

interface UserInfo {
  id: string;
  username: string;
  email: string;
  is_email_verified: boolean;
  created_at: string;
}

interface ScoreHistory {
  id: string;
  game_type: string;
  date: string;
  score: number;
}

const gameIcons: Record<string, React.ElementType> = {
  quiz: BookOpen,
  salad: Shuffle,
  lines: GitBranch,
};

const gameColors: Record<string, string> = {
  quiz: 'text-pink-500',
  salad: 'text-violet-500',
  lines: 'text-cyan-500',
};

const gameBgColors: Record<string, string> = {
  quiz: 'bg-pink-500/10',
  salad: 'bg-violet-500/10',
  lines: 'bg-cyan-500/10',
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [todayScores, setTodayScores] = useState<TodayScores | null>(null);
  const [bestScores, setBestScores] = useState<TodayScores | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [userInfo, today, best, history] = await Promise.all([
        authAPI.getCurrentUser(),
        scoresAPI.getTodayScores(),
        scoresAPI.getBestScores(),
        scoresAPI.getMyScores(),
      ]);
      
      setUser(userInfo);
      setTodayScores(today);
      setBestScores(best);
      setScoreHistory(history.scores || []);
    } catch (err) {
      console.error('Failed to load profile data:', err);
      // If unauthorized, redirect to login
      removeToken();
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-nihongo-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">Profile</h1>
              <p className="text-nihongo-text-muted">View your stats and highscores</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* User Info Card */}
          <div className="card mb-8">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-nihongo-primary to-pink-600 
                            flex items-center justify-center text-3xl font-bold text-white">
                {user.username.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{user.username}</h2>
                <p className="text-nihongo-text-muted mb-4">{user.email}</p>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-nihongo-text-muted">
                    <Calendar className="w-4 h-4" />
                    Member since {memberSince}
                  </div>
                  {user.is_email_verified && (
                    <div className="flex items-center gap-2 text-green-500">
                      <Star className="w-4 h-4" />
                      Verified
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Today's Scores */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-nihongo-primary" />
              Today&apos;s Scores
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              {(['quiz', 'salad', 'lines'] as const).map((game) => {
                const Icon = gameIcons[game];
                const score = todayScores?.[game] || 0;
                const best = bestScores?.[game] || 0;
                
                return (
                  <div key={game} className={`card ${gameBgColors[game]} border-none`}>
                    <div className="flex items-center gap-3 mb-4">
                      <Icon className={`w-6 h-6 ${gameColors[game]}`} />
                      <span className="font-medium capitalize">{game}</span>
                    </div>
                    
                    <p className="text-4xl font-bold mb-1">{score}</p>
                    <p className="text-sm text-nihongo-text-muted">
                      Best: {best}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All-Time Best */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              All-Time Best
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              {(['quiz', 'salad', 'lines'] as const).map((game) => {
                const Icon = gameIcons[game];
                const best = bestScores?.[game] || 0;
                
                return (
                  <div key={game} className="card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${gameBgColors[game]}`}>
                          <Icon className={`w-5 h-5 ${gameColors[game]}`} />
                        </div>
                        <span className="font-medium capitalize">{game}</span>
                      </div>
                      <span className="text-2xl font-bold gradient-text">{best}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Score History */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-nihongo-primary" />
              Recent Activity
            </h3>
            
            {scoreHistory.length > 0 ? (
              <div className="card">
                <div className="space-y-4">
                  {scoreHistory.slice(0, 10).map((score) => {
                    const Icon = gameIcons[score.game_type];
                    const dateStr = new Date(score.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    });
                    
                    return (
                      <div 
                        key={score.id} 
                        className="flex items-center justify-between py-3 border-b border-nihongo-border last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${gameBgColors[score.game_type]}`}>
                            <Icon className={`w-5 h-5 ${gameColors[score.game_type]}`} />
                          </div>
                          <div>
                            <p className="font-medium capitalize">{score.game_type}</p>
                            <p className="text-sm text-nihongo-text-muted">{dateStr}</p>
                          </div>
                        </div>
                        <span className="text-xl font-bold">{score.score}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="card text-center py-12">
                <Trophy className="w-12 h-12 text-nihongo-text-muted mx-auto mb-4" />
                <p className="text-nihongo-text-muted">No scores yet. Start playing to track your progress!</p>
                <Link href="/quiz" className="btn btn-primary mt-4 inline-flex">
                  Start Playing
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

