'use client';

import { useState, useEffect, useCallback, useRef, memo, forwardRef } from 'react';
import { vocabularyAPI, scoresAPI, userPreferencesAPI, Vocabulary } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { RotateCcw, Loader2, CheckCircle, XCircle, Play, Check } from 'lucide-react';

type GameState = 'loading' | 'ready' | 'playing' | 'checking' | 'result';

interface WordCard {
  id: string;
  vocabId: string;
  text: string;
  index: number;
}

interface Connection {
  leftId: string;
  rightId: string;
  correct?: boolean;
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Memoized Left Card Component
interface LeftCardProps {
  card: WordCard;
  isSelected: boolean;
  isConnected: boolean;
  isCorrect?: boolean;
  gameState: GameState;
  isJapanese: boolean;
  onClick: (cardId: string) => void;
}

const LeftCardComponent = memo(forwardRef<HTMLDivElement, LeftCardProps>(
  function LeftCardComponent({ card, isSelected, isConnected, isCorrect, gameState, isJapanese, onClick }, ref) {
    const handleClick = useCallback(() => {
      onClick(card.id);
    }, [card.id, onClick]);

    let borderColor = 'border-nihongo-border';
    let bgColor = 'bg-nihongo-bg-light';
    
    if (isSelected) {
      borderColor = 'border-nihongo-primary';
      bgColor = 'bg-nihongo-primary/20';
    } else if (isConnected && gameState === 'result') {
      borderColor = isCorrect ? 'border-green-500' : 'border-red-500';
      bgColor = isCorrect ? 'bg-green-500/20' : 'bg-red-500/20';
    } else if (isConnected) {
      borderColor = 'border-nihongo-primary/50';
      bgColor = 'bg-nihongo-primary/10';
    }

    return (
      <div
        ref={ref}
        onClick={handleClick}
        className={`px-6 py-3 rounded-xl border-2 cursor-pointer transition-all
                  ${borderColor} ${bgColor}
                  ${gameState === 'playing' ? 'hover:border-nihongo-primary hover:bg-nihongo-primary/10' : ''}
                  ${isJapanese ? 'japanese-text text-xl' : 'text-lg'}`}
      >
        {card.text}
      </div>
    );
  }
));

// Memoized Right Card Component
interface RightCardProps {
  card: WordCard;
  isConnected: boolean;
  isCorrect?: boolean;
  gameState: GameState;
  isJapanese: boolean;
  hasSelectedLeft: boolean;
  onClick: (cardId: string) => void;
}

const RightCardComponent = memo(forwardRef<HTMLDivElement, RightCardProps>(
  function RightCardComponent({ card, isConnected, isCorrect, gameState, isJapanese, hasSelectedLeft, onClick }, ref) {
    const handleClick = useCallback(() => {
      onClick(card.id);
    }, [card.id, onClick]);

    let borderColor = 'border-nihongo-border';
    let bgColor = 'bg-nihongo-bg-light';
    
    if (isConnected && gameState === 'result') {
      borderColor = isCorrect ? 'border-green-500' : 'border-red-500';
      bgColor = isCorrect ? 'bg-green-500/20' : 'bg-red-500/20';
    } else if (isConnected) {
      borderColor = 'border-nihongo-primary/50';
      bgColor = 'bg-nihongo-primary/10';
    }

    return (
      <div
        ref={ref}
        onClick={handleClick}
        className={`px-6 py-3 rounded-xl border-2 cursor-pointer transition-all
                  ${borderColor} ${bgColor}
                  ${gameState === 'playing' && hasSelectedLeft ? 'hover:border-nihongo-primary hover:bg-nihongo-primary/10' : ''}
                  ${isJapanese ? 'japanese-text text-xl' : 'text-lg'}`}
      >
        {card.text}
      </div>
    );
  }
));

export default function LinesGame() {
  const [gameState, setGameState] = useState<GameState>('loading');
  const [leftCards, setLeftCards] = useState<WordCard[]>([]);
  const [rightCards, setRightCards] = useState<WordCard[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [isJapaneseLeft, setIsJapaneseLeft] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const rightRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!isAuthenticated()) {
        setPrefsLoaded(true);
        return;
      }

      try {
        const preferences = await userPreferencesAPI.get();
        setSelectedTags(preferences.selected_tags || []);
      } catch (err) {
        console.error('Failed to load user preferences:', err);
      } finally {
        setPrefsLoaded(true);
      }
    };

    loadPreferences();
  }, []);

  const loadVocabulary = useCallback(async () => {
    setGameState('loading');
    setConnections([]);
    setSelectedLeft(null);
    setCorrectCount(0);
    
    try {
      // Pass tags to getRandom if any are selected
      const tagsParam = selectedTags.length > 0 ? selectedTags.join(',') : undefined;
      const vocabulary = await vocabularyAPI.getRandom(10, tagsParam);
      
      if (vocabulary.length === 0) {
        return;
      }
      
      // Randomly decide which side is Japanese
      const japaneseOnLeft = Math.random() > 0.5;
      setIsJapaneseLeft(japaneseOnLeft);
      
      // Create left cards (in order)
      const left: WordCard[] = vocabulary.map((v, i) => ({
        id: `left-${i}`,
        vocabId: v.id,
        text: japaneseOnLeft ? v.reading : v.meaning,
        index: i,
      }));
      
      // Create right cards (shuffled)
      const rightUnshuffled: WordCard[] = vocabulary.map((v, i) => ({
        id: `right-${i}`,
        vocabId: v.id,
        text: japaneseOnLeft ? v.meaning : v.reading,
        index: i,
      }));
      
      const right = shuffleArray(rightUnshuffled);
      
      setLeftCards(left);
      setRightCards(right);
      setGameState('ready');
    } catch (err) {
      console.error('Failed to load vocabulary:', err);
      setGameState('ready');
    }
  }, [selectedTags]);

  // Load vocabulary after preferences are loaded
  useEffect(() => {
    if (prefsLoaded) {
      loadVocabulary();
    }
  }, [prefsLoaded, loadVocabulary]);

  const startGame = () => {
    setGameState('playing');
  };

  const restartGame = () => {
    loadVocabulary();
  };

  // Memoized click handlers
  const handleLeftClick = useCallback((cardId: string) => {
    if (gameState !== 'playing') return;
    
    // Check if this card is already connected
    setConnections(prev => {
      const existingConnection = prev.find(c => c.leftId === cardId);
      if (existingConnection) {
        // Remove the connection
        setSelectedLeft(null);
        return prev.filter(c => c.leftId !== cardId);
      }
      return prev;
    });
    
    setSelectedLeft(current => {
      // If clicking on already selected, toggle off
      if (current === cardId) {
        return null;
      }
      return cardId;
    });
  }, [gameState]);

  const handleRightClick = useCallback((cardId: string) => {
    if (gameState !== 'playing' || !selectedLeft) return;
    
    // Check if this right card is already connected
    setConnections(prev => {
      const existingConnection = prev.find(c => c.rightId === cardId);
      if (existingConnection) {
        // Remove the existing connection and create new one
        return [
          ...prev.filter(c => c.rightId !== cardId && c.leftId !== selectedLeft),
          { leftId: selectedLeft, rightId: cardId }
        ];
      } else {
        // Create new connection
        return [
          ...prev.filter(c => c.leftId !== selectedLeft),
          { leftId: selectedLeft, rightId: cardId }
        ];
      }
    });
    
    setSelectedLeft(null);
  }, [gameState, selectedLeft]);

  const checkAnswers = useCallback(() => {
    if (connections.length !== leftCards.length) return;
    
    // Check each connection
    const checkedConnections = connections.map(conn => {
      const leftCard = leftCards.find(c => c.id === conn.leftId);
      const rightCard = rightCards.find(c => c.id === conn.rightId);
      
      const isCorrect = leftCard?.vocabId === rightCard?.vocabId;
      
      return {
        ...conn,
        correct: isCorrect,
      };
    });
    
    const newCorrectCount = checkedConnections.filter(c => c.correct).length;
    setConnections(checkedConnections);
    setCorrectCount(newCorrectCount);
    setGameState('result');
    
    // Update score if authenticated
    if (isAuthenticated() && newCorrectCount > 0) {
      scoresAPI.update('lines', newCorrectCount).catch(err => {
        console.error('Failed to update score:', err);
      });
    }
  }, [connections, leftCards, rightCards]);

  const getLineCoordinates = (leftId: string, rightId: string) => {
    const container = containerRef.current;
    const leftEl = leftRefs.current.get(leftId);
    const rightEl = rightRefs.current.get(rightId);
    
    if (!container || !leftEl || !rightEl) return null;
    
    const containerRect = container.getBoundingClientRect();
    const leftRect = leftEl.getBoundingClientRect();
    const rightRect = rightEl.getBoundingClientRect();
    
    return {
      x1: leftRect.right - containerRect.left,
      y1: leftRect.top + leftRect.height / 2 - containerRect.top,
      x2: rightRect.left - containerRect.left,
      y2: rightRect.top + rightRect.height / 2 - containerRect.top,
    };
  };

  const allConnected = connections.length === leftCards.length;

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
          <h1 className="text-3xl font-bold gradient-text">Lines Mode</h1>
          <span className="text-sm text-nihongo-text-muted px-3 py-1 bg-nihongo-bg-light rounded-full">
            {isJapaneseLeft ? 'Japanese → English' : 'English → Japanese'}
          </span>
          {selectedTags.length > 0 && (
            <span className="text-sm text-nihongo-primary px-3 py-1 bg-nihongo-primary/10 rounded-full">
              {selectedTags.join(', ')}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {gameState === 'result' && (
            <div className="flex items-center gap-4 text-lg font-medium">
              <span className="text-green-500">
                <CheckCircle className="w-5 h-5 inline mr-1" />
                {correctCount}
              </span>
              <span className="text-nihongo-accent">
                <XCircle className="w-5 h-5 inline mr-1" />
                {leftCards.length - correctCount}
              </span>
            </div>
          )}
          
          {gameState === 'playing' && (
            <span className="text-sm text-nihongo-text-muted">
              {connections.length} / {leftCards.length} connected
            </span>
          )}
          
          <button
            onClick={restartGame}
            className="btn btn-secondary"
          >
            <RotateCcw className="w-4 h-4" />
            Restart
          </button>
        </div>
      </div>

      {/* Ready Screen */}
      {gameState === 'ready' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-lg mx-auto">
            <h2 className="text-4xl font-bold mb-4 gradient-text">Ready?</h2>
            <p className="text-nihongo-text-muted mb-8">
              Connect each word on the left to its matching translation on the right.
              <br />
              Click a word on the left, then click the matching word on the right.
            </p>
            <button onClick={startGame} className="btn btn-primary text-xl px-12 py-4 mx-auto block">
              <Play className="w-6 h-6" />
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* Game Area */}
      {(gameState === 'playing' || gameState === 'result') && (
        <div className="flex-1 flex flex-col">
          <div 
            ref={containerRef}
            className="flex-1 relative flex justify-between items-stretch gap-8 px-12"
          >
            {/* SVG Overlay for lines */}
            <svg 
              className="absolute inset-0 pointer-events-none z-10"
              style={{ width: '100%', height: '100%' }}
            >
              {connections.map(conn => {
                const coords = getLineCoordinates(conn.leftId, conn.rightId);
                if (!coords) return null;
                
                let strokeColor = '#6366f1'; // nihongo-primary
                if (gameState === 'result') {
                  strokeColor = conn.correct ? '#22c55e' : '#ef4444';
                }
                
                return (
                  <line
                    key={`${conn.leftId}-${conn.rightId}`}
                    x1={coords.x1}
                    y1={coords.y1}
                    x2={coords.x2}
                    y2={coords.y2}
                    stroke={strokeColor}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            
            {/* Left Column */}
            <div className="flex flex-col justify-around py-4 z-20">
              {leftCards.map(card => {
                const isSelected = selectedLeft === card.id;
                const connection = connections.find(c => c.leftId === card.id);
                const isConnected = !!connection;
                
                return (
                  <LeftCardComponent
                    key={card.id}
                    ref={(el) => {
                      if (el) leftRefs.current.set(card.id, el);
                    }}
                    card={card}
                    isSelected={isSelected}
                    isConnected={isConnected}
                    isCorrect={connection?.correct}
                    gameState={gameState}
                    isJapanese={isJapaneseLeft}
                    onClick={handleLeftClick}
                  />
                );
              })}
            </div>
            
            {/* Right Column */}
            <div className="flex flex-col justify-around py-4 z-20">
              {rightCards.map(card => {
                const connection = connections.find(c => c.rightId === card.id);
                const isConnected = !!connection;
                
                return (
                  <RightCardComponent
                    key={card.id}
                    ref={(el) => {
                      if (el) rightRefs.current.set(card.id, el);
                    }}
                    card={card}
                    isConnected={isConnected}
                    isCorrect={connection?.correct}
                    gameState={gameState}
                    isJapanese={!isJapaneseLeft}
                    hasSelectedLeft={!!selectedLeft}
                    onClick={handleRightClick}
                  />
                );
              })}
            </div>
          </div>
          
          {/* Check Button */}
          {gameState === 'playing' && (
            <div className="flex justify-center mt-6">
              <button
                onClick={checkAnswers}
                disabled={!allConnected}
                className="btn btn-primary text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-5 h-5" />
                Check Answers
              </button>
            </div>
          )}
          
          {/* Result */}
          {gameState === 'result' && (
            <div className="flex justify-center mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold mb-4">
                  {correctCount === leftCards.length ? (
                    <span className="text-green-500">Perfect! All correct!</span>
                  ) : (
                    <span className="text-nihongo-text">
                      You got <span className="text-green-500">{correctCount}</span> out of{' '}
                      <span className="text-nihongo-primary">{leftCards.length}</span> correct
                    </span>
                  )}
                </p>
                <button onClick={restartGame} className="btn btn-primary text-lg px-8 py-3">
                  <RotateCcw className="w-5 h-5" />
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
