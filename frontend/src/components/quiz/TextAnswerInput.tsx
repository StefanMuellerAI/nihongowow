'use client';

import * as wanakana from 'wanakana';
import JapaneseInput from '@/components/JapaneseInput';

interface TextAnswerInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (finalAnswer: string) => void;
  isJapanese: boolean;
  disabled?: boolean;
}

export function TextAnswerInput({
  value,
  onChange,
  onSubmit,
  isJapanese,
  disabled = false,
}: TextAnswerInputProps) {
  // Handle button click - convert any remaining romaji to hiragana
  const handleButtonClick = () => {
    const finalAnswer = isJapanese ? wanakana.toHiragana(value) : value;
    onSubmit(finalAnswer);
  };

  return (
    <div className="space-y-4">
      <JapaneseInput
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        isJapanese={isJapanese}
        placeholder={isJapanese ? 'Type in romaji...' : 'Type your answer...'}
      />
      <button
        onClick={handleButtonClick}
        disabled={!value.trim() || disabled}
        className="btn btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Check Answer
      </button>
    </div>
  );
}
