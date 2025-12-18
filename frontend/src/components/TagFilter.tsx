'use client';

import { useState, useEffect } from 'react';
import { vocabularyAPI } from '@/lib/api';
import { Tag, X } from 'lucide-react';

interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export default function TagFilter({ selectedTags, onTagsChange }: TagFilterProps) {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const tags = await vocabularyAPI.getTags();
      setAvailableTags(tags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const clearAll = () => {
    onTagsChange([]);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-sm text-nihongo-text-muted">Loading tags...</p>
      </div>
    );
  }

  if (availableTags.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm text-nihongo-text-muted">No tags available</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-nihongo-text">
          <Tag size={16} />
          <span>Filter by Tags</span>
        </div>
        {selectedTags.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-nihongo-text-muted hover:text-nihongo-accent flex items-center gap-1"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
        {availableTags.map(tag => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
                isSelected
                  ? 'bg-nihongo-primary text-nihongo-bg'
                  : 'bg-nihongo-bg text-nihongo-text-muted hover:text-nihongo-text hover:border-nihongo-primary border border-nihongo-border'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}

