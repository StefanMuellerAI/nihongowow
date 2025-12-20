import type { Metadata } from 'next';
import SaladPageClient from '@/components/SaladPageClient';

export const metadata: Metadata = {
  title: 'Hiragana & Katakana Practice | Kana Matching Game',
  description: 'Master hiragana and katakana with our fun matching game. Match Romaji to Kana characters, race against the clock, and improve your Japanese reading speed.',
  keywords: [
    'hiragana practice',
    'katakana practice',
    'learn hiragana',
    'learn katakana',
    'kana matching game',
    'Japanese alphabet practice',
    'romaji to hiragana',
  ],
  alternates: {
    canonical: '/salad',
  },
  openGraph: {
    title: 'Hiragana & Katakana Practice Game | NihongoWOW',
    description: 'Master hiragana and katakana with our fun matching game. Improve your Japanese reading speed!',
    url: '/salad',
  },
};

export default function SaladPage() {
  return <SaladPageClient />;
}
