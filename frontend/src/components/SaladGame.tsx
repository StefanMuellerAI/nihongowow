'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { kanaAPI, settingsAPI, scoresAPI, KanaItem } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { Timer, Trophy, RotateCcw, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useSuccessSound } from '@/hooks/useSuccessSound';

interface SaladGameProps {
  kanaType: 'hiragana' | 'katakana' | 'mixed';
  onKanaTypeChange: (type: 'hiragana' | 'katakana' | 'mixed') => void;
}

type GameState = 'loading' | 'ready' | 'playing' | 'finished' | 'timeout';

interface KanaCard extends KanaItem {
  id: string;
  matched: boolean;
}

// Memoized Romaji Card Component
interface RomajiCardProps {
  card: KanaCard;
  onDragStart: (e: React.DragEvent, card: KanaCard) => void;
}

const RomajiCardComponent = memo(function RomajiCardComponent({ card, onDragStart }: RomajiCardProps) {
  const handleDragStart = useCallback((e: React.DragEvent) => {
    onDragStart(e, card);
  }, [card, onDragStart]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="w-16 h-16 bg-nihongo-bg-light border-2 border-nihongo-border rounded-xl 
               flex items-center justify-center cursor-grab active:cursor-grabbing
               hover:border-nihongo-primary hover:bg-nihongo-primary/10 transition-all
               text-lg font-medium text-nihongo-text select-none"
    >
      {card.romaji}
    </div>
  );
});

// Memoized Kana Card Component
interface KanaCardComponentProps {
  card: KanaCard;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, card: KanaCard) => void;
}

const KanaCardComponent = memo(function KanaCardComponent({ card, onDragOver, onDrop }: KanaCardComponentProps) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    onDrop(e, card);
  }, [card, onDrop]);

  return (
    <div
      onDragOver={onDragOver}
      onDrop={handleDrop}
      title={card.matched ? undefined : card.romaji}
      className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold
                japanese-text select-none transition-all cursor-default ${
        card.matched
          ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
          : 'bg-nihongo-bg-light border-2 border-nihongo-border text-nihongo-text hover:border-nihongo-primary'
      }`}
    >
      {card.kana}
    </div>
  );
});

export default function SaladGame({ kanaType, onKanaTypeChange }: SaladGameProps) {
  const [gameState, setGameState] = useState<GameState>('loading');
  const [romajiCards, setRomajiCards] = useState<KanaCard[]>([]);
  const [kanaCards, setKanaCards] = useState<KanaCard[]>([]);
  const [timeLimit, setTimeLimit] = useState(120);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [matchedCount, setMatchedCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [draggedCard, setDraggedCard] = useState<KanaCard | null>(null);
  const [kanaPerRound, setKanaPerRound] = useState(20);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const successSound = useSuccessSound();

  // Load settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getAll();
      const limit = parseInt(response.settings.salad_time_limit || '120');
      const perRound = parseInt(response.settings.salad_kana_per_round || '20');
      setTimeLimit(limit);
      setTimeRemaining(limit);
      setKanaPerRound(perRound);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  // Load kana when type changes or game starts
  const loadKana = useCallback(async () => {
    setGameState('loading');
    
    try {
      const response = await kanaAPI.getRandom(kanaType, kanaPerRound);
      const kanaData = response.kana;
      
      // Create romaji cards
      const romaji: KanaCard[] = kanaData.map((k, i) => ({
        ...k,
        id: `romaji-${i}`,
        matched: false,
      }));
      
      // Create kana cards (shuffled differently)
      const kana: KanaCard[] = [...kanaData]
        .sort(() => Math.random() - 0.5)
        .map((k, i) => ({
          ...k,
          id: `kana-${i}`,
          matched: false,
        }));
      
      // Shuffle romaji cards too
      setRomajiCards(romaji.sort(() => Math.random() - 0.5));
      setKanaCards(kana);
      setMatchedCount(0);
      setErrors(0);
      setTimeRemaining(timeLimit);
      setGameState('ready');
    } catch (err) {
      console.error('Failed to load kana:', err);
      setGameState('ready');
    }
  }, [kanaType, kanaPerRound, timeLimit]);

  useEffect(() => {
    loadKana();
  }, [loadKana]);

  // Timer
  useEffect(() => {
    if (gameState === 'playing' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setGameState('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, timeRemaining]);

  // Update score on timeout
  useEffect(() => {
    if (gameState === 'timeout' && matchedCount > 0 && isAuthenticated()) {
      scoresAPI.update('salad', matchedCount).catch(err => {
        console.error('Failed to update score:', err);
      });
    }
  }, [gameState, matchedCount]);

  const startGame = () => {
    setGameState('playing');
  };

  const restartGame = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    await loadKana();
    // Start game immediately after restart
    setGameState('playing');
  };

  // Memoized drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, card: KanaCard) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetCard: KanaCard) => {
    e.preventDefault();
    
    if (!draggedCard || targetCard.matched) {
      setDraggedCard(null);
      return;
    }
    
    // Check if match
    if (draggedCard.romaji === targetCard.romaji) {
      // Correct match! Play success sound
      successSound.play();
      
      setRomajiCards(prev => prev.map(c => 
        c.id === draggedCard.id ? { ...c, matched: true } : c
      ));
      setKanaCards(prev => prev.map(c => 
        c.romaji === targetCard.romaji ? { ...c, matched: true } : c
      ));
      
      setMatchedCount(prev => {
        const newMatchedCount = prev + 1;
        
        // Check if all matched
        if (newMatchedCount === romajiCards.length) {
          setGameState('finished');
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          
          // Update score if authenticated
          if (isAuthenticated()) {
            scoresAPI.update('salad', newMatchedCount).catch(err => {
              console.error('Failed to update score:', err);
            });
          }
        }
        
        return newMatchedCount;
      });
    } else {
      // Wrong match
      setErrors(prev => prev + 1);
    }
    
    setDraggedCard(null);
  }, [draggedCard, romajiCards.length, successSound]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeSpent = timeLimit - timeRemaining;

  // Filter unmatched romaji cards for rendering
  const unmatchedRomajiCards = romajiCards.filter(c => !c.matched);

  if (gameState === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-nihongo-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold gradient-text">Salad Mode</h1>
          <select
            value={kanaType}
            onChange={(e) => onKanaTypeChange(e.target.value as 'hiragana' | 'katakana' | 'mixed')}
            disabled={gameState === 'playing'}
            className="bg-nihongo-bg-light border border-nihongo-border rounded-lg px-4 py-2 text-nihongo-text focus:border-nihongo-primary"
          >
            <option value="hiragana">Hiragana</option>
            <option value="katakana">Katakana</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-500">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              {matchedCount}/{romajiCards.length}
            </span>
            <span className="text-nihongo-accent">
              <XCircle className="w-4 h-4 inline mr-1" />
              {errors}
            </span>
          </div>
          
          {/* Timer */}
          <div className={`flex items-center gap-2 text-2xl font-mono ${
            timeRemaining <= 30 ? 'text-nihongo-accent animate-pulse' : 'text-nihongo-text'
          }`}>
            <Timer className="w-6 h-6" />
            {formatTime(timeRemaining)}
          </div>
          
          {/* Restart */}
          <button
            onClick={restartGame}
            className="btn btn-secondary"
          >
            <RotateCcw className="w-4 h-4" />
            Restart
          </button>
        </div>
      </div>

      {/* Game Area */}
      {gameState === 'ready' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-lg mx-auto">
            <h2 className="text-4xl font-bold mb-4 gradient-text">Ready?</h2>
            <p className="text-nihongo-text-muted mb-8">
              Drag the romaji cards to their matching {kanaType === 'mixed' ? 'kana' : kanaType} characters.
              <br />
              You have {formatTime(timeLimit)} to match all {romajiCards.length} pairs!
            </p>
            <button onClick={startGame} className="btn btn-primary text-xl px-12 py-4 mx-auto block">
              Start Game
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="flex-1 grid grid-cols-2 gap-8">
          {/* Romaji Column */}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-nihongo-text-muted mb-4 text-center">ROMAJI</h3>
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-wrap gap-3 justify-center content-start">
                {unmatchedRomajiCards.map(card => (
                  <RomajiCardComponent
                    key={card.id}
                    card={card}
                    onDragStart={handleDragStart}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Kana Column */}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-nihongo-text-muted mb-4 text-center">
              {kanaType === 'mixed' ? 'KANA' : kanaType.toUpperCase()}
            </h3>
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-wrap gap-3 justify-center content-start">
                {kanaCards.map(card => (
                  <KanaCardComponent
                    key={card.id}
                    card={card}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finished Screen */}
      {(gameState === 'finished' || gameState === 'timeout') && (
        <div className="flex-1 flex items-center justify-center">
          <div className="card text-center max-w-md">
            {gameState === 'finished' ? (
              <>
                <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold gradient-text mb-2">Congratulations!</h2>
                <p className="text-nihongo-text-muted mb-6">
                  You matched all {matchedCount} pairs!
                </p>
              </>
            ) : (
              <>
                <Timer className="w-20 h-20 text-nihongo-accent mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-nihongo-accent mb-2">Time&apos;s Up!</h2>
                <p className="text-nihongo-text-muted mb-6">
                  You matched {matchedCount} of {romajiCards.length} pairs.
                </p>
              </>
            )}
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-nihongo-bg rounded-lg p-4">
                <p className="text-sm text-nihongo-text-muted">Time</p>
                <p className="text-2xl font-bold text-nihongo-primary">{formatTime(timeSpent)}</p>
              </div>
              <div className="bg-nihongo-bg rounded-lg p-4">
                <p className="text-sm text-nihongo-text-muted">Errors</p>
                <p className="text-2xl font-bold text-nihongo-accent">{errors}</p>
              </div>
            </div>
            
            <button onClick={restartGame} className="btn btn-primary w-full">
              <RotateCcw className="w-5 h-5" />
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
