'use client';

import { useState, useEffect, useCallback } from 'react';
import { quizAPI, scoresAPI, QuizQuestion, QuizResult } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

export type QuizState = 'loading' | 'question' | 'result' | 'error';

export interface UseQuizStateReturn {
  state: QuizState;
  question: QuizQuestion | null;
  result: QuizResult | null;
  error: string | null;
  stats: { correct: number; total: number };
  answer: string;
  setAnswer: (value: string) => void;
  loadQuestion: () => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  hint: string | null;
  isLoadingHint: boolean;
  hintUsed: boolean;
  getHint: () => Promise<void>;
}

export function useQuizState(selectedTags: string[] = []): UseQuizStateReturn {
  const [state, setState] = useState<QuizState>('loading');
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  // Hint state
  const [hint, setHint] = useState<string | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  const loadQuestion = useCallback(async () => {
    setState('loading');
    setAnswer('');
    setResult(null);
    setError(null);
    setHint(null);
    setHintUsed(false);

    try {
      const tagsParam = selectedTags.length > 0 ? selectedTags.join(',') : undefined;
      const newQuestion = await quizAPI.getRandomQuestion(tagsParam);
      setQuestion(newQuestion);
      setState('question');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question');
      setState('error');
    }
  }, [selectedTags]);

  // Load initial question
  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  // Handle Enter key for "Next Question" in result state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state === 'result' && e.key === 'Enter') {
        e.preventDefault();
        loadQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, loadQuestion]);

  const submitAnswer = useCallback(async (answerToCheck: string) => {
    if (!question || !answerToCheck.trim()) return;

    try {
      const checkResult = await quizAPI.checkAnswer(
        question.vocabulary_id,
        answerToCheck.trim(),
        question.mode
      );
      setResult(checkResult);
      const newCorrect = stats.correct + (checkResult.correct ? 1 : 0);
      setStats(prev => ({
        correct: newCorrect,
        total: prev.total + 1,
      }));
      setState('result');

      // Update score if authenticated and answer is correct
      if (checkResult.correct && isAuthenticated()) {
        try {
          await scoresAPI.update('quiz', newCorrect);
        } catch (scoreErr) {
          console.error('Failed to update score:', scoreErr);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check answer');
      setState('error');
    }
  }, [question, stats.correct]);

  const getHint = useCallback(async () => {
    if (!question || hintUsed || isLoadingHint) return;

    setIsLoadingHint(true);
    try {
      const response = await quizAPI.getHint(question.vocabulary_id, question.mode);
      setHint(response.hint);
      setHintUsed(true);
    } catch (err) {
      setHint('Could not get hint. Please try again.');
    } finally {
      setIsLoadingHint(false);
    }
  }, [question, hintUsed, isLoadingHint]);

  return {
    state,
    question,
    result,
    error,
    stats,
    answer,
    setAnswer,
    loadQuestion,
    submitAnswer,
    hint,
    isLoadingHint,
    hintUsed,
    getHint,
  };
}



