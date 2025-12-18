'use client';

// Gap character used in display (fullwidth underscore)
const GAP_CHAR = '＿';

interface FillInBlankInputProps {
  displayText: string;
  gapIndices: number[];
  values: string[];
  gapInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function FillInBlankInput({
  displayText,
  gapIndices,
  values,
  gapInputRefs,
  onChange,
  onKeyDown,
  onSubmit,
  disabled = false,
}: FillInBlankInputProps) {
  const isComplete = values.length > 0 && values.every(v => v !== '');

  return (
    <div className="space-y-6">
      {/* Display word with gaps and inline inputs */}
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {displayText.split('').map((char, idx) => {
          const gapIndex = gapIndices.indexOf(idx);
          const isGap = gapIndex !== -1;

          if (isGap) {
            return (
              <input
                key={idx}
                ref={(el) => { gapInputRefs.current[gapIndex] = el; }}
                type="text"
                value={values[gapIndex] || ''}
                onChange={(e) => onChange(gapIndex, e.target.value)}
                onKeyDown={(e) => onKeyDown(gapIndex, e)}
                className="w-14 h-14 text-3xl text-center font-bold japanese-text 
                  bg-nihongo-bg border-2 border-nihongo-primary rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-nihongo-primary focus:border-transparent
                  text-nihongo-primary"
                maxLength={3}
                autoFocus={gapIndex === 0}
                disabled={disabled}
              />
            );
          }

          return (
            <span
              key={idx}
              className="w-14 h-14 text-4xl font-bold japanese-text gradient-text 
                flex items-center justify-center"
            >
              {char}
            </span>
          );
        })}
      </div>

      <button
        onClick={onSubmit}
        disabled={!isComplete || disabled}
        className="btn btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Check Answer
      </button>
    </div>
  );
}
