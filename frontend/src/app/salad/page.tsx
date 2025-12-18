'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import SaladGame from '@/components/SaladGame';

export default function SaladPage() {
  const [kanaType, setKanaType] = useState<'hiragana' | 'katakana' | 'mixed'>('hiragana');

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <SaladGame kanaType={kanaType} onKanaTypeChange={setKanaType} />
      </main>
    </div>
  );
}

