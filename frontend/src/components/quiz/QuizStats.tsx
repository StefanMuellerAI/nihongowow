'use client';

interface QuizStatsProps {
  correct: number;
  total: number;
  tags: string[];
}

export function QuizStats({ correct, total, tags }: QuizStatsProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div className="text-sm text-nihongo-text-muted">
        {tags.length > 0 && (
          <span className="inline-flex items-center gap-2">
            Filtering:
            {tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-nihongo-primary/20 text-nihongo-primary rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </span>
        )}
      </div>
      <div className="text-sm">
        <span className="text-green-500">{correct}</span>
        <span className="text-nihongo-text-muted"> / {total}</span>
      </div>
    </div>
  );
}





