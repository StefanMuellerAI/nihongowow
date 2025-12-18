'use client';

import Sidebar from '@/components/Sidebar';
import LinesGame from '@/components/LinesGame';

export default function LinesPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <LinesGame />
      </main>
    </div>
  );
}




