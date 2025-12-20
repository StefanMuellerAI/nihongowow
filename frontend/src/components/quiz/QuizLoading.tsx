'use client';

import { Loader2 } from 'lucide-react';

export function QuizLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="w-12 h-12 text-nihongo-primary animate-spin" />
      <p className="mt-4 text-nihongo-text-muted">Loading question...</p>
    </div>
  );
}



