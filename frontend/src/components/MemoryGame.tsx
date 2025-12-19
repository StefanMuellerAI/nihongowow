'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { vocabularyAPI, scoresAPI, userPreferencesAPI, Vocabulary } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { RotateCcw, Loader2, Trophy, Play, Layers } from 'lucide-react';
import { useSuccessSound } from '@/hooks/useSuccessSound';

type GameState = 'loading' | 'ready' | 'playing' | 'finished';

interface MemoryCard {
  id: string;
  vocabId: string;
  type: 'japanese' | 'meaning';
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
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

export default function MemoryGame() {
  const [gameState, setGameState] = useState<GameState>('loading');
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const successSound = useSuccessSound();
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  const loadVocabulary = useCallback(async () => {
    setGameState('loading');
    setCards([]);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setIsChecking(false);

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    try {
      // Load 15 vocabulary items for 15 pairs (30 cards)
      const tagsParam = selectedTags.length > 0 ? selectedTags.join(',') : undefined;
      const vocabulary = await vocabularyAPI.getRandom(15, tagsParam);

      if (vocabulary.length === 0) {
        return;
      }

      // Create card pairs
      const memoryCards: MemoryCard[] = [];

      vocabulary.forEach((v, index) => {
        // Japanese card: reading (expression)
        const japaneseContent = v.expression !== v.reading 
          ? `${v.reading} (${v.expression})`
          : v.reading;

        memoryCards.push({
          id: `jp-${index}`,
          vocabId: v.id,
          type: 'japanese',
          content: japaneseContent,
          isFlipped: false,
          isMatched: false,
        });

        // Meaning card
        memoryCards.push({
          id: `meaning-${index}`,
          vocabId: v.id,
          type: 'meaning',
          content: v.meaning,
          isFlipped: false,
          isMatched: false,
        });
      });

      // Shuffle all cards
      setCards(shuffleArray(memoryCards));
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

  const handleCardClick = (cardId: string) => {
    if (gameState !== 'playing' || isChecking) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    // Can't flip more than 2 cards
    if (flippedCards.length >= 2) return;

    // Flip the card
    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    // Check for match when 2 cards are flipped
    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      setIsChecking(true);

      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard) {
        // Check if they form a matching pair (same vocabId, different types)
        if (firstCard.vocabId === secondCard.vocabId && firstCard.type !== secondCard.type) {
          // Match found!
          successSound.play();

          checkTimeoutRef.current = setTimeout(() => {
            setCards(prev => prev.map(c =>
              c.vocabId === firstCard.vocabId ? { ...c, isMatched: true } : c
            ));

            const newMatchedPairs = matchedPairs + 1;
            setMatchedPairs(newMatchedPairs);
            setFlippedCards([]);
            setIsChecking(false);

            // Check if game is finished
            if (newMatchedPairs === 15) {
              setGameState('finished');

              // Update score if authenticated
              if (isAuthenticated()) {
                scoresAPI.update('memory', newMatchedPairs).catch(err => {
                  console.error('Failed to update score:', err);
                });
              }
            }
          }, 500);
        } else {
          // No match - flip cards back after delay
          checkTimeoutRef.current = setTimeout(() => {
            setCards(prev => prev.map(c =>
              newFlippedCards.includes(c.id) ? { ...c, isFlipped: false } : c
            ));
            setFlippedCards([]);
            setIsChecking(false);
          }, 1000);
        }
      }
    }
  };

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
          <h1 className="text-3xl font-bold gradient-text">Memory Mode</h1>
          {selectedTags.length > 0 && (
            <span className="text-sm text-nihongo-primary px-3 py-1 bg-nihongo-primary/10 rounded-full">
              {selectedTags.join(', ')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {gameState === 'playing' && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-nihongo-text-muted">
                <Layers className="w-4 h-4 inline mr-1" />
                {matchedPairs} / 15 Paare
              </span>
              <span className="text-nihongo-text-muted">
                {moves} Züge
              </span>
            </div>
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
              Find all 15 matching pairs!
              <br />
              Click on a card to reveal it. Match Japanese words with their meanings.
            </p>
            <button onClick={startGame} className="btn btn-primary text-xl px-12 py-4 mx-auto block">
              <Play className="w-6 h-6" />
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* Game Grid */}
      {gameState === 'playing' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-6 gap-3">
            {cards.map(card => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`
                  w-24 h-32 rounded-xl cursor-pointer transition-all duration-300 transform
                  ${card.isMatched 
                    ? 'opacity-0 pointer-events-none scale-95' 
                    : 'hover:scale-105'
                  }
                  ${card.isFlipped || card.isMatched
                    ? card.isMatched
                      ? 'border-2 border-green-500'
                      : card.type === 'japanese'
                        ? 'bg-nihongo-primary/20 border-2 border-nihongo-primary'
                        : 'bg-pink-500/20 border-2 border-pink-500'
                    : 'bg-nihongo-bg-light border-2 border-nihongo-border hover:border-nihongo-primary/50'
                  }
                  flex items-center justify-center p-2 select-none
                `}
                style={{
                  perspective: '1000px',
                }}
              >
                {card.isFlipped || card.isMatched ? (
                  <div className={`text-center ${card.type === 'japanese' ? 'japanese-text' : ''}`}>
                    <span className={`text-sm font-medium ${
                      card.type === 'japanese' ? 'text-nihongo-primary' : 'text-pink-500'
                    }`}>
                      {card.content}
                    </span>
                  </div>
                ) : (
                  <div className="text-4xl japanese-text text-nihongo-text-muted">
                    日
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finished Screen */}
      {gameState === 'finished' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="card text-center max-w-md">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold gradient-text mb-2">Congratulations!</h2>
            <p className="text-nihongo-text-muted mb-6">
              You found all {matchedPairs} pairs!
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-nihongo-bg rounded-lg p-4">
                <p className="text-sm text-nihongo-text-muted">Pairs Found</p>
                <p className="text-2xl font-bold text-nihongo-primary">{matchedPairs}</p>
              </div>
              <div className="bg-nihongo-bg rounded-lg p-4">
                <p className="text-sm text-nihongo-text-muted">Total Moves</p>
                <p className="text-2xl font-bold text-pink-500">{moves}</p>
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
