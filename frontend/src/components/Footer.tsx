'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-8 px-6 border-t border-nihongo-border bg-nihongo-bg">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌸</span>
          <span className="font-bold gradient-text">NihongoWOW</span>
        </div>
        
        <p className="text-sm text-nihongo-text-muted">
          © {currentYear} NihongoWOW. Learn Japanese the fun way.
        </p>
        
        <div className="flex items-center gap-6 text-sm text-nihongo-text-muted">
          <Link href="/quiz" className="hover:text-nihongo-text transition-colors">Quiz</Link>
          <Link href="/salad" className="hover:text-nihongo-text transition-colors">Salad</Link>
          <Link href="/lines" className="hover:text-nihongo-text transition-colors">Lines</Link>
          <span className="text-nihongo-border">|</span>
          <Link href="/faq" className="hover:text-nihongo-text transition-colors">FAQ</Link>
          <Link href="/imprint" className="hover:text-nihongo-text transition-colors">Imprint</Link>
          <Link href="/privacy" className="hover:text-nihongo-text transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}
