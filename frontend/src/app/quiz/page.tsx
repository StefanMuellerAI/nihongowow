'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Quiz } from '@/components/quiz';
import TagFilter from '@/components/TagFilter';
import AppFooter from '@/components/AppFooter';

export default function QuizPage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-col">
        <Sidebar />
        <div className="w-64 border-r border-nihongo-border bg-nihongo-bg-light">
          <TagFilter
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <header className="text-center mb-12">
              <h1 className="text-4xl font-bold gradient-text mb-2">Quiz Mode</h1>
              <p className="text-nihongo-text-muted">
                Test your Japanese vocabulary knowledge
              </p>
            </header>
            
            <Quiz selectedTags={selectedTags} />
          </div>
        </main>
        <AppFooter />
      </div>
    </div>
  );
}

