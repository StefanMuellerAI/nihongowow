'use client';

import { useState, useRef, useCallback } from 'react';
import { quizAPI } from '@/lib/api';

export interface UseTTSReturn {
  isLoading: boolean;
  isPlaying: boolean;
  play: (text: string) => Promise<void>;
  stop: () => void;
}

export function useTTS(): UseTTSReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback(async (text: string) => {
    if (!text || isLoading) return;

    setIsLoading(true);
    try {
      const audioBlob = await quizAPI.getTTS(text);
      const audioUrl = URL.createObjectURL(audioBlob);

      // Stop any currently playing audio
      stop();

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, stop]);

  return {
    isLoading,
    isPlaying,
    play,
    stop,
  };
}
