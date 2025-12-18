'use client';

import Link from 'next/link';

export default function AppFooter() {
  return (
    <footer className="py-4 px-6 border-t border-nihongo-border bg-nihongo-bg-light mt-auto">
      <div className="flex items-center justify-center gap-4 text-xs text-nihongo-text-muted">
        <span>© {new Date().getFullYear()} NihongoWOW</span>
        <span className="text-nihongo-border">•</span>
        <Link href="/imprint" className="hover:text-nihongo-text transition-colors">
          Imprint
        </Link>
        <span className="text-nihongo-border">•</span>
        <Link href="/privacy" className="hover:text-nihongo-text transition-colors">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
