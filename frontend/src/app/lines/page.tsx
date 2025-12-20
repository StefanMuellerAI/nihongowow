import type { Metadata } from 'next';
import LinesPageClient from '@/components/LinesPageClient';

export const metadata: Metadata = {
  title: 'Japanese Word Matching Game | Connect Words to Translations',
  description: 'Learn Japanese vocabulary by connecting words to their translations. A fun and interactive way to strengthen your Japanese word associations and memory.',
  keywords: [
    'Japanese word game',
    'vocabulary matching',
    'learn Japanese words',
    'Japanese translation game',
    'word association game',
    'Japanese memory game',
  ],
  alternates: {
    canonical: '/lines',
  },
  openGraph: {
    title: 'Japanese Word Matching Game | NihongoWOW',
    description: 'Connect Japanese words to their translations. A fun way to strengthen word associations!',
    url: '/lines',
  },
};

export default function LinesPage() {
  return <LinesPageClient />;
}
