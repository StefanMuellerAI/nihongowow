'use client';

import { useEffect } from 'react';
import { useQuizState, useTTS, useFillInBlank } from '@/hooks/quiz';
import { QuizLoading } from './QuizLoading';
import { QuizError } from './QuizError';
import { QuizStats } from './QuizStats';
import { QuizQuestion } from './QuizQuestion';
import { QuizResult } from './QuizResult';
import { HintSection } from './HintSection';
import { FillInBlankInput } from './FillInBlankInput';
import { MultipleChoice } from './MultipleChoice';
import { TextAnswerInput } from './TextAnswerInput';

interface QuizProps {
  selectedTags?: string[];
}

export default function Quiz({ selectedTags = [] }: QuizProps) {
  const quiz = useQuizState(selectedTags);
  const tts = useTTS();
  const fillInBlank = useFillInBlank();

  // Reset fill-in-blank when question changes
  useEffect(() => {
    if (quiz.question?.mode === 'fill_in_blank' && quiz.question.gap_count) {
      fillInBlank.reset(quiz.question.gap_count);
    }
  }, [quiz.question]);

  // Handle fill-in-blank submit
  const handleFillInBlankSubmit = () => {
    if (!quiz.question?.display_text || !quiz.question.gap_indices) return;
    if (!fillInBlank.isComplete) return;

    const reconstructedWord = fillInBlank.reconstructWord(
      quiz.question.display_text,
      quiz.question.gap_indices
    );
    quiz.submitAnswer(reconstructedWord);
  };

  // Render loading state
  if (quiz.state === 'loading') {
    return <QuizLoading />;
  }

  // Render error state
  if (quiz.state === 'error') {
    return <QuizError error={quiz.error} onRetry={quiz.loadQuestion} />;
  }

  const isFillInBlank = quiz.question?.mode === 'fill_in_blank';
  const isMultipleChoice = quiz.question?.question_type === 'multiple_choice' && quiz.question.options;
  const isJapaneseInput = quiz.question?.mode === 'to_japanese';

  return (
    <div className="max-w-2xl mx-auto">
      <QuizStats
        correct={quiz.stats.correct}
        total={quiz.stats.total}
        tags={selectedTags}
      />

      <div className="card animate-fade-in">
        <QuizQuestion
          question={quiz.question}
          tts={tts}
          state={quiz.state}
        />

        {/* AI Hint Section - only show during question state, not for fill_in_blank (uses TTS instead) */}
        {quiz.state === 'question' && !isFillInBlank && (
          <HintSection
            hint={quiz.hint}
            isLoading={quiz.isLoadingHint}
            onGetHint={quiz.getHint}
            disabled={quiz.hintUsed}
          />
        )}

        {/* Question Input Area */}
        {quiz.state === 'question' && (
          <>
            {isFillInBlank && quiz.question?.display_text && quiz.question?.gap_indices ? (
              <FillInBlankInput
                displayText={quiz.question.display_text}
                gapIndices={quiz.question.gap_indices}
                values={fillInBlank.gapInputs}
                gapInputRefs={fillInBlank.gapInputRefs}
                onChange={fillInBlank.handleGapChange}
                onKeyDown={(index, e) => fillInBlank.handleGapKeyDown(index, e, handleFillInBlankSubmit)}
                onSubmit={handleFillInBlankSubmit}
              />
            ) : isMultipleChoice && quiz.question?.options ? (
              <MultipleChoice
                options={quiz.question.options}
                onSelect={quiz.submitAnswer}
              />
            ) : (
              <TextAnswerInput
                value={quiz.answer}
                onChange={quiz.setAnswer}
                onSubmit={quiz.submitAnswer}
                isJapanese={isJapaneseInput}
              />
            )}
          </>
        )}

        {/* Result Area */}
        {quiz.state === 'result' && quiz.result && (
          <QuizResult
            result={quiz.result}
            question={quiz.question}
            onNext={quiz.loadQuestion}
            tts={tts}
          />
        )}
      </div>

      {/* Keyboard hints */}
      {quiz.state === 'question' && quiz.question?.question_type === 'text' && (
        <p className="text-center text-sm text-nihongo-text-muted mt-4">
          Press <kbd className="px-2 py-1 bg-nihongo-bg-light rounded border border-nihongo-border">Enter</kbd> to submit
        </p>
      )}
      {quiz.state === 'result' && (
        <p className="text-center text-sm text-nihongo-text-muted mt-4">
          Press <kbd className="px-2 py-1 bg-nihongo-bg-light rounded border border-nihongo-border">Enter</kbd> for next question
        </p>
      )}
    </div>
  );
}



