'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Quiz } from '@/components/quiz';
import AppFooter from '@/components/AppFooter';
import { userPreferencesAPI } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

export default function QuizPage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    if (!isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    try {
      const preferences = await userPreferencesAPI.get();
      setSelectedTags(preferences.selected_tags || []);
    } catch (err) {
      console.error('Failed to load user preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <header className="text-center mb-12">
              <h1 className="text-4xl font-bold gradient-text mb-2">Quiz Mode</h1>
              <p className="text-nihongo-text-muted">
                Test your Japanese vocabulary knowledge
              </p>
              {selectedTags.length > 0 && (
                <p className="text-sm text-nihongo-primary mt-2">
                  Filtering by: {selectedTags.join(', ')}
                </p>
              )}
            </header>
            
            {!isLoading && <Quiz selectedTags={selectedTags} />}
          </div>
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
