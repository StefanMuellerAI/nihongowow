'use client';

import { Loader2, Volume2 } from 'lucide-react';

interface TTSButtonProps {
  isLoading: boolean;
  isPlaying: boolean;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}

export function TTSButton({
  isLoading,
  isPlaying,
  onClick,
  disabled = false,
  title = 'Listen to pronunciation',
  className = '',
}: TTSButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`p-2 rounded-lg transition-all duration-200 ${
        isPlaying
          ? 'bg-nihongo-primary text-nihongo-bg'
          : 'text-nihongo-text-muted hover:text-nihongo-primary hover:bg-nihongo-primary/10'
      } disabled:opacity-50 ${className}`}
      title={title}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </button>
  );
}



