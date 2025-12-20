'use client';

import { Loader2, Lightbulb } from 'lucide-react';

interface HintSectionProps {
  hint: string | null;
  isLoading: boolean;
  onGetHint: () => void;
  disabled: boolean;
}

export function HintSection({ hint, isLoading, onGetHint, disabled }: HintSectionProps) {
  if (hint) {
    return (
      <div className="mb-6">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-200">{hint}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <button
        onClick={onGetHint}
        disabled={isLoading || disabled}
        className="flex items-center gap-2 mx-auto px-4 py-2 text-sm text-nihongo-text-muted hover:text-amber-500 transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Lightbulb className="w-4 h-4" />
        )}
        {isLoading ? 'Getting hint...' : 'Need a hint?'}
      </button>
    </div>
  );
}



