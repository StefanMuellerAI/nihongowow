'use client';

import { useState, useRef, useCallback } from 'react';
import * as wanakana from 'wanakana';

export interface UseFillInBlankReturn {
  gapInputs: string[];
  gapInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  handleGapChange: (index: number, value: string) => void;
  handleGapKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>, onSubmit?: () => void) => void;
  reconstructWord: (displayText: string, gapIndices: number[]) => string;
  isComplete: boolean;
  reset: (gapCount: number) => void;
}

export function useFillInBlank(): UseFillInBlankReturn {
  const [gapInputs, setGapInputs] = useState<string[]>([]);
  const gapInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const reset = useCallback((gapCount: number) => {
    setGapInputs(new Array(gapCount).fill(''));
    gapInputRefs.current = new Array(gapCount).fill(null);
  }, []);

  const handleGapChange = useCallback((index: number, value: string) => {
    // Convert romaji to hiragana
    const hiraganaValue = wanakana.toHiragana(value);
    
    // Check if the result contains hiragana (not still pure romaji)
    // This prevents auto-advancing while user is typing multi-char romaji like "sho", "chi", "tsu"
    const hasHiragana = wanakana.isHiragana(hiraganaValue);
    
    // For digraphs like しょ (sho), ちゃ (cha), etc. we need to keep the full hiragana
    // But limit to max 2 characters (base + small kana)
    const finalValue = hasHiragana ? hiraganaValue.slice(0, 2) : value;

    setGapInputs(prev => {
      const newInputs = [...prev];
      newInputs[index] = finalValue;
      return newInputs;
    });

    // Only auto-focus next input if valid hiragana was created
    if (hasHiragana && index < gapInputRefs.current.length - 1) {
      gapInputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleGapKeyDown = useCallback((
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    onSubmit?: () => void
  ) => {
    if (e.key === 'Backspace' && !gapInputs[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      gapInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  }, [gapInputs]);

  const reconstructWord = useCallback((displayText: string, gapIndices: number[]): string => {
    const displayChars = displayText.split('');
    gapIndices.forEach((gapIdx, inputIdx) => {
      if (gapInputs[inputIdx]) {
        displayChars[gapIdx] = gapInputs[inputIdx];
      }
    });
    return displayChars.join('');
  }, [gapInputs]);

  // Only complete when all inputs have valid hiragana (not partial romaji like "sh")
  const isComplete = gapInputs.length > 0 && gapInputs.every(input => 
    input !== '' && wanakana.isHiragana(input)
  );

  return {
    gapInputs,
    gapInputRefs,
    handleGapChange,
    handleGapKeyDown,
    reconstructWord,
    isComplete,
    reset,
  };
}





