'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { settingsAPI } from '@/lib/api';
import { getToken, removeToken, isAuthenticated } from '@/lib/auth';
import { Loader2, Save, Timer, Hash } from 'lucide-react';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings state
  const [saladTimeLimit, setSaladTimeLimit] = useState(120);
  const [saladKanaPerRound, setSaladKanaPerRound] = useState(20);

  useEffect(() => {
    checkAuthAndLoadSettings();
  }, []);

  const checkAuthAndLoadSettings = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await settingsAPI.getAll();
      setSaladTimeLimit(parseInt(response.settings.salad_time_limit || '120'));
      setSaladKanaPerRound(parseInt(response.settings.salad_kana_per_round || '20'));
    } catch (err) {
      console.error('Failed to load settings:', err);
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    removeToken();
    router.push('/');
  };

  const handleSave = async () => {
    const token = getToken();
    if (!token) return;

    setIsSaving(true);
    setMessage(null);

    try {
      await settingsAPI.update('salad_time_limit', saladTimeLimit.toString(), token);
      await settingsAPI.update('salad_kana_per_round', saladKanaPerRound.toString(), token);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-nihongo-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar isAdmin onLogout={handleLogout} />
      
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold gradient-text">Settings</h1>
            <p className="text-nihongo-text-muted">Configure game settings</p>
          </header>

          {/* Salad Settings */}
          <div className="card mb-6">
            <h2 className="text-xl font-bold text-nihongo-text mb-6 flex items-center gap-2">
              <span className="text-2xl">🥗</span>
              Salad Mode Settings
            </h2>

            <div className="space-y-6">
              {/* Time Limit */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-nihongo-text mb-2">
                  <Timer className="w-4 h-4" />
                  Time Limit (seconds)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="30"
                    max="300"
                    step="10"
                    value={saladTimeLimit}
                    onChange={(e) => setSaladTimeLimit(parseInt(e.target.value))}
                    className="flex-1 accent-nihongo-primary"
                  />
                  <span className="w-20 text-center text-lg font-mono text-nihongo-primary">
                    {Math.floor(saladTimeLimit / 60)}:{(saladTimeLimit % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <p className="text-xs text-nihongo-text-muted mt-1">
                  How long users have to complete the Salad game (30s - 5min)
                </p>
              </div>

              {/* Kana Per Round */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-nihongo-text mb-2">
                  <Hash className="w-4 h-4" />
                  Kana per Round
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={saladKanaPerRound}
                    onChange={(e) => setSaladKanaPerRound(parseInt(e.target.value))}
                    className="flex-1 accent-nihongo-primary"
                  />
                  <span className="w-16 text-center text-lg font-mono text-nihongo-primary">
                    {saladKanaPerRound}
                  </span>
                </div>
                <p className="text-xs text-nihongo-text-muted mt-1">
                  Number of kana pairs to match each round (5 - 50)
                </p>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg mb-6 ${
              message.type === 'success' 
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary w-full py-3"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save Settings
          </button>
        </div>
      </main>
    </div>
  );
}

