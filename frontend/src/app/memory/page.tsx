import type { Metadata } from 'next';
import MemoryPageClient from '@/components/MemoryPageClient';

export const metadata: Metadata = {
  title: 'Japanese Memory Game | Learn Vocabulary Through Play',
  description: 'Boost your Japanese vocabulary retention with our memory game. Match Japanese words and meanings while training your memory and language skills.',
  keywords: [
    'Japanese memory game',
    'vocabulary memory',
    'learn Japanese through games',
    'Japanese word memory',
    'language learning game',
    'Japanese flashcard memory',
  ],
  alternates: {
    canonical: '/memory',
  },
  openGraph: {
    title: 'Japanese Memory Game | NihongoWOW',
    description: 'Boost your Japanese vocabulary retention with our memory game. Learn through play!',
    url: '/memory',
  },
};

export default function MemoryPage() {
  return <MemoryPageClient />;
}
