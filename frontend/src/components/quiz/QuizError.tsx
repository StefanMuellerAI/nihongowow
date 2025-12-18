'use client';

import { XCircle } from 'lucide-react';

interface QuizErrorProps {
  error: string | null;
  onRetry: () => void;
}

export function QuizError({ error, onRetry }: QuizErrorProps) {
  return (
    <div className="card text-center">
      <XCircle className="w-16 h-16 text-nihongo-accent mx-auto mb-4" />
      <h2 className="text-xl font-bold mb-2">Oops!</h2>
      <p className="text-nihongo-text-muted mb-6">{error}</p>
      <button onClick={onRetry} className="btn btn-primary">
        Try Again
      </button>
    </div>
  );
}
