'use client';

import { QuizQuestion as QuizQuestionType } from '@/lib/api';
import { TTSButton } from './TTSButton';
import { UseTTSReturn } from '@/hooks/quiz/useTTS';

interface QuizQuestionProps {
  question: QuizQuestionType | null;
  tts: UseTTSReturn;
  state: 'loading' | 'question' | 'result' | 'error';
}

export function QuizQuestion({ question, tts, state }: QuizQuestionProps) {
  if (!question) return null;

  const isFillInBlank = question.mode === 'fill_in_blank';
  const isJapaneseInput = question.mode === 'to_japanese';

  // Get the question prompt text based on mode
  const getQuestionPrompt = () => {
    if (isFillInBlank) return 'Fill in the missing characters:';
    if (isJapaneseInput) return 'Translate to Japanese (Reading):';
    return 'Translate to English:';
  };

  // Handle TTS play
  const handlePlayTTS = () => {
    if (question.mode === 'to_english') {
      // Extract reading from question like "会う (あう)"
      const match = question.question.match(/\(([^)]+)\)/);
      const textToSpeak = match ? match[1] : question.question;
      tts.play(textToSpeak);
    } else if (question.mode === 'fill_in_blank' && question.tts_text) {
      // Play the full word as audio hint
      tts.play(question.tts_text);
    }
  };

  // Show TTS button for to_english and fill_in_blank modes
  const showTTSButton = state === 'question' && 
    (question.mode === 'to_english' || (question.mode === 'fill_in_blank' && question.tts_text));

  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-2">
        <p className="text-sm text-nihongo-text-muted">
          {getQuestionPrompt()}
        </p>

        {/* TTS Button - for to_english and fill_in_blank modes */}
        {showTTSButton && (
          <TTSButton
            isLoading={tts.isLoading}
            isPlaying={tts.isPlaying}
            onClick={handlePlayTTS}
            title={isFillInBlank ? 'Listen to the word (audio hint)' : 'Listen to pronunciation'}
          />
        )}
      </div>

      {/* Show meaning as hint for fill_in_blank, otherwise show the question */}
      {isFillInBlank ? (
        <p className="text-xl text-nihongo-text-muted mb-4">
          {question.question}
        </p>
      ) : (
        <h2 className="text-4xl font-bold japanese-text gradient-text">
          {question.question}
        </h2>
      )}
    </div>
  );
}

