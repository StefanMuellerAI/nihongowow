'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppFooter from '@/components/AppFooter';
import { adminAPI, HintCacheItem, TTSCacheItem, CacheStats } from '@/lib/api';
import { getToken, removeToken } from '@/lib/auth';
import { 
  Loader2, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Lightbulb, 
  Volume2,
  AlertTriangle,
  Play,
  Square
} from 'lucide-react';

export default function AdminCachePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hints' | 'tts'>('hints');
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [hints, setHints] = useState<HintCacheItem[]>([]);
  const [ttsItems, setTTSItems] = useState<TTSCacheItem[]>([]);
  const [editingHint, setEditingHint] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState<'hints' | 'tts' | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef) {
        audioRef.pause();
        URL.revokeObjectURL(audioRef.src);
      }
    };
  }, [audioRef]);

  const checkAuthAndLoad = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    await loadData();
    setIsLoading(false);
  };

  const loadData = async () => {
    try {
      const [statsData, hintsData, ttsData] = await Promise.all([
        adminAPI.getCacheStats(),
        adminAPI.getHintCache(),
        adminAPI.getTTSCache()
      ]);
      setStats(statsData);
      setHints(hintsData.items);
      setTTSItems(ttsData.items);
    } catch (err) {
      console.error('Failed to load cache data:', err);
      setMessage({ type: 'error', text: 'Failed to load cache data' });
    }
  };

  const handleLogout = () => {
    removeToken();
    router.push('/');
  };

  const startEditHint = (hint: HintCacheItem) => {
    setEditingHint(hint.id);
    setEditValue(hint.hint);
  };

  const cancelEdit = () => {
    setEditingHint(null);
    setEditValue('');
  };

  const saveHint = async (id: string) => {
    try {
      await adminAPI.updateHintCache(id, editValue);
      setHints(hints.map(h => h.id === id ? { ...h, hint: editValue } : h));
      setEditingHint(null);
      setEditValue('');
      setMessage({ type: 'success', text: 'Hint updated successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update hint' });
    }
  };

  const deleteHint = async (id: string) => {
    try {
      await adminAPI.deleteHintCache(id);
      setHints(hints.filter(h => h.id !== id));
      setStats(stats ? { ...stats, hint_count: stats.hint_count - 1 } : null);
      setMessage({ type: 'success', text: 'Hint deleted' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete hint' });
    }
  };

  const deleteTTS = async (id: string) => {
    try {
      await adminAPI.deleteTTSCache(id);
      setTTSItems(ttsItems.filter(t => t.id !== id));
      setStats(stats ? { ...stats, tts_count: stats.tts_count - 1 } : null);
      setMessage({ type: 'success', text: 'TTS entry deleted' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete TTS entry' });
    }
  };

  const playTTS = async (id: string) => {
    // Stop current audio if playing
    if (audioRef) {
      audioRef.pause();
      URL.revokeObjectURL(audioRef.src);
      setAudioRef(null);
      if (playingId === id) {
        setPlayingId(null);
        return;
      }
    }

    try {
      setPlayingId(id);
      const audioBlob = await adminAPI.getTTSAudio(id);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setPlayingId(null);
        URL.revokeObjectURL(audioUrl);
        setAudioRef(null);
      };
      
      audio.onerror = () => {
        setPlayingId(null);
        setMessage({ type: 'error', text: 'Failed to play audio' });
        URL.revokeObjectURL(audioUrl);
        setAudioRef(null);
      };
      
      setAudioRef(audio);
      await audio.play();
    } catch (err) {
      setPlayingId(null);
      setMessage({ type: 'error', text: 'Failed to load audio' });
    }
  };

  const clearAllHints = async () => {
    try {
      await adminAPI.clearAllHintCache();
      setHints([]);
      setStats(stats ? { ...stats, hint_count: 0 } : null);
      setConfirmClear(null);
      setMessage({ type: 'success', text: 'All hints cleared' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to clear hints' });
    }
  };

  const clearAllTTS = async () => {
    try {
      await adminAPI.clearAllTTSCache();
      setTTSItems([]);
      setStats(stats ? { ...stats, tts_count: 0 } : null);
      setConfirmClear(null);
      setMessage({ type: 'success', text: 'All TTS entries cleared' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to clear TTS entries' });
    }
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
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold gradient-text">AI Cache</h1>
              <p className="text-nihongo-text-muted">Manage cached hints and TTS audio</p>
            </header>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-nihongo-text">{stats.hint_count}</p>
                  <p className="text-sm text-nihongo-text-muted">Cached Hints</p>
                </div>
              </div>
              <div className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Volume2 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-nihongo-text">{stats.tts_count}</p>
                  <p className="text-sm text-nihongo-text-muted">Cached TTS</p>
                </div>
              </div>
            </div>
          )}

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

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('hints')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'hints'
                  ? 'bg-nihongo-primary text-white'
                  : 'bg-nihongo-bg-light text-nihongo-text-muted hover:text-nihongo-text'
              }`}
            >
              <Lightbulb className="w-4 h-4 inline mr-2" />
              Hints ({stats?.hint_count || 0})
            </button>
            <button
              onClick={() => setActiveTab('tts')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'tts'
                  ? 'bg-nihongo-primary text-white'
                  : 'bg-nihongo-bg-light text-nihongo-text-muted hover:text-nihongo-text'
              }`}
            >
              <Volume2 className="w-4 h-4 inline mr-2" />
              TTS ({stats?.tts_count || 0})
            </button>
          </div>

          {/* Hints Tab */}
          {activeTab === 'hints' && (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-nihongo-text">Cached Hints</h2>
                {hints.length > 0 && (
                  <button
                    onClick={() => setConfirmClear('hints')}
                    className="btn btn-danger text-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </button>
                )}
              </div>

              {hints.length === 0 ? (
                <p className="text-nihongo-text-muted text-center py-8">No cached hints yet</p>
              ) : (
                <div className="space-y-4">
                  {hints.map((hint) => (
                    <div key={hint.id} className="bg-nihongo-bg rounded-lg p-4 border border-nihongo-border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-lg font-bold text-nihongo-primary japanese-text">
                            {hint.expression}
                          </span>
                          <span className="text-nihongo-text-muted ml-2">({hint.reading})</span>
                          <span className={`ml-3 text-xs px-2 py-1 rounded ${
                            hint.mode === 'to_japanese' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {hint.mode === 'to_japanese' ? 'EN → JP' : 'JP → EN'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {editingHint === hint.id ? (
                            <>
                              <button
                                onClick={() => saveHint(hint.id)}
                                className="p-2 text-green-400 hover:bg-green-500/20 rounded"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-2 text-nihongo-text-muted hover:bg-nihongo-bg-light rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditHint(hint)}
                                className="p-2 text-nihongo-text-muted hover:text-nihongo-primary hover:bg-nihongo-bg-light rounded"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteHint(hint.id)}
                                className="p-2 text-nihongo-text-muted hover:text-red-400 hover:bg-red-500/20 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-nihongo-text-muted mb-2">{hint.meaning}</p>
                      {editingHint === hint.id ? (
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full p-3 bg-nihongo-bg-light border border-nihongo-border rounded-lg text-nihongo-text"
                          rows={3}
                        />
                      ) : (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                          <p className="text-amber-200 text-sm">{hint.hint}</p>
                        </div>
                      )}
                      <p className="text-xs text-nihongo-text-muted mt-2">
                        Created: {new Date(hint.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TTS Tab */}
          {activeTab === 'tts' && (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-nihongo-text">Cached TTS Audio</h2>
                {ttsItems.length > 0 && (
                  <button
                    onClick={() => setConfirmClear('tts')}
                    className="btn btn-danger text-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </button>
                )}
              </div>

              {ttsItems.length === 0 ? (
                <p className="text-nihongo-text-muted text-center py-8">No cached TTS entries yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-nihongo-border">
                        <th className="text-left py-3 px-4 text-nihongo-text-muted font-medium">Text</th>
                        <th className="text-left py-3 px-4 text-nihongo-text-muted font-medium">Created</th>
                        <th className="text-right py-3 px-4 text-nihongo-text-muted font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ttsItems.map((tts) => (
                        <tr key={tts.id} className="border-b border-nihongo-border/50 hover:bg-nihongo-bg-light/50">
                          <td className="py-3 px-4">
                            <span className="text-lg text-nihongo-primary japanese-text">{tts.text}</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-nihongo-text-muted">
                            {new Date(tts.created_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => playTTS(tts.id)}
                              className={`p-2 rounded mr-1 ${
                                playingId === tts.id
                                  ? 'text-nihongo-primary bg-nihongo-primary/20'
                                  : 'text-nihongo-text-muted hover:text-nihongo-primary hover:bg-nihongo-primary/20'
                              }`}
                              title={playingId === tts.id ? 'Stop' : 'Play'}
                            >
                              {playingId === tts.id ? (
                                <Square className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => deleteTTS(tts.id)}
                              className="p-2 text-nihongo-text-muted hover:text-red-400 hover:bg-red-500/20 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <AppFooter />
      </div>

          {/* Confirm Clear Modal */}
          {confirmClear && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-nihongo-bg-light rounded-xl p-6 max-w-md w-full mx-4 border border-nihongo-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-nihongo-text">Clear All {confirmClear === 'hints' ? 'Hints' : 'TTS'}?</h3>
                    <p className="text-sm text-nihongo-text-muted">This action cannot be undone.</p>
                  </div>
                </div>
                <p className="text-nihongo-text mb-6">
                  {confirmClear === 'hints' 
                    ? `Are you sure you want to delete all ${stats?.hint_count || 0} cached hints?`
                    : `Are you sure you want to delete all ${stats?.tts_count || 0} cached TTS entries?`
                  }
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setConfirmClear(null)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmClear === 'hints' ? clearAllHints : clearAllTTS}
                    className="btn btn-danger"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
    </div>
  );
}
