'use client';

import { useCallback, useRef } from 'react';

/**
 * Hook to play a simple "pling" success sound using Web Audio API.
 * No external audio files needed - sound is generated programmatically.
 */
export function useSuccessSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const play = useCallback(() => {
    try {
      // Create audio context lazily (required for browsers)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const currentTime = ctx.currentTime;

      // Create oscillator for the "pling" tone
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Pleasant "pling" sound - high frequency sine wave
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, currentTime); // A5 note
      oscillator.frequency.exponentialRampToValueAtTime(1760, currentTime + 0.05); // Slide up to A6

      // Quick attack, medium decay envelope
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.01); // Quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3); // Decay

      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.3);
    } catch (err) {
      // Audio might not be supported or allowed
      console.warn('Could not play success sound:', err);
    }
  }, []);

  return { play };
}
