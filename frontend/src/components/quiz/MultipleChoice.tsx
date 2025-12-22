'use client';

interface MultipleChoiceProps {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
}

export function MultipleChoice({ options, onSelect, disabled = false }: MultipleChoiceProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => onSelect(option)}
          disabled={disabled}
          className="btn btn-secondary text-lg py-4 japanese-text hover:border-nihongo-primary hover:bg-nihongo-primary/5 disabled:opacity-50"
        >
          {option}
        </button>
      ))}
    </div>
  );
}





