'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { QuizResult as QuizResultType, QuizQuestion } from '@/lib/api';
import { TTSButton } from './TTSButton';
import { UseTTSReturn } from '@/hooks/quiz/useTTS';
import { useSuccessSound } from '@/hooks/useSuccessSound';

interface QuizResultProps {
  result: QuizResultType;
  question: QuizQuestion | null;
  onNext: () => void;
  tts: UseTTSReturn;
}

export function QuizResult({ result, question, onNext, tts }: QuizResultProps) {
  const successSound = useSuccessSound();
  const hasPlayedSoundRef = useRef(false);

  // Play success sound when answer is correct
  useEffect(() => {
    if (result.correct && !hasPlayedSoundRef.current) {
      hasPlayedSoundRef.current = true;
      successSound.play();
    }
  }, [result.correct, successSound]);

  // Reset sound flag when result changes
  useEffect(() => {
    hasPlayedSoundRef.current = false;
  }, [result]);

  // Play TTS for the correct answer
  const handlePlayCorrectAnswer = () => {
    let japaneseText = '';

    if (question?.mode === 'to_japanese' || question?.mode === 'fill_in_blank') {
      // For to_japanese and fill_in_blank, speak the correct Japanese reading
      japaneseText = result.correct_answer;
    } else if (question?.mode === 'to_english') {
      // Extract Japanese from the question for to_english mode
      const match = question?.question.match(/\(([^)]+)\)/);
      japaneseText = match ? match[1] : '';
    }

    if (japaneseText) {
      tts.play(japaneseText);
    }
  };

  return (
    <div className={`animate-slide-up ${result.correct ? 'animate-pulse-success' : 'animate-shake'}`}>
      <div className={`flex items-center justify-center gap-3 mb-6 ${
        result.correct ? 'text-green-500' : 'text-nihongo-accent'
      }`}>
        {result.correct ? (
          <CheckCircle className="w-12 h-12" />
        ) : (
          <XCircle className="w-12 h-12" />
        )}
        <span className="text-2xl font-bold">
          {result.correct ? 'Correct!' : 'Incorrect'}
        </span>
      </div>

      {!result.correct && (
        <div className="bg-nihongo-bg rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-nihongo-text-muted mb-1">Correct answer:</p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-xl font-medium japanese-text text-nihongo-primary">
              {result.correct_answer}
            </p>
            {/* TTS for correct answer */}
            <TTSButton
              isLoading={tts.isLoading}
              isPlaying={tts.isPlaying}
              onClick={handlePlayCorrectAnswer}
            />
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        className="btn btn-primary w-full py-4 text-lg"
      >
        Next Question
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}



