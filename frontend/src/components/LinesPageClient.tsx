'use client';

import Sidebar from '@/components/Sidebar';
import LinesGame from '@/components/LinesGame';
import AppFooter from '@/components/AppFooter';

export default function LinesPageClient() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 flex flex-col">
          <LinesGame />
        </main>
        <AppFooter />
      </div>
    </div>
  );
}

