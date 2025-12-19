'use client';

import Sidebar from '@/components/Sidebar';
import MemoryGame from '@/components/MemoryGame';
import AppFooter from '@/components/AppFooter';

export default function MemoryPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 flex flex-col">
          <MemoryGame />
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
