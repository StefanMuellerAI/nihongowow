'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as wanakana from 'wanakana';

interface JapaneseInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (finalValue: string) => void;
  isJapanese: boolean;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function JapaneseInput({
  value,
  onChange,
  onSubmit,
  isJapanese,
  placeholder = 'Type your answer...',
  disabled = false,
  autoFocus = true,
}: JapaneseInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isBoundRef = useRef(false);

  // Bind/unbind Wanakana based on Japanese mode
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    if (isJapanese && !isBoundRef.current) {
      wanakana.bind(input, { IMEMode: true });
      isBoundRef.current = true;
    } else if (!isJapanese && isBoundRef.current) {
      wanakana.unbind(input);
      isBoundRef.current = false;
    }

    return () => {
      if (isBoundRef.current && input) {
        try {
          wanakana.unbind(input);
          isBoundRef.current = false;
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [isJapanese]);

  // Sync external value changes to DOM (for reset)
  useEffect(() => {
    const input = inputRef.current;
    if (input && value === '' && input.value !== '') {
      input.value = '';
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const getFinalValue = useCallback((): string => {
    if (!inputRef.current) return '';
    
    // Get the actual DOM value (which Wanakana has modified)
    const domValue = inputRef.current.value;
    
    // If Japanese mode, ensure any remaining romaji is converted
    if (isJapanese) {
      return wanakana.toHiragana(domValue);
    }
    
    return domValue;
  }, [isJapanese]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disabled) {
      e.preventDefault();
      const finalValue = getFinalValue();
      onSubmit(finalValue);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    // Use onInput instead of onChange to get the value AFTER Wanakana converts it
    const domValue = (e.target as HTMLInputElement).value;
    onChange(domValue);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`input text-xl text-center japanese-text ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <span className={`text-xs px-2 py-1 rounded-full ${
          isJapanese 
            ? 'bg-nihongo-primary/20 text-nihongo-primary' 
            : 'bg-blue-500/20 text-blue-400'
        }`}>
          {isJapanese ? 'JP' : 'EN'}
        </span>
      </div>
    </div>
  );
}
