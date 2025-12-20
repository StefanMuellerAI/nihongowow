import type { Metadata } from 'next';
import QuizPageClient from '@/components/quiz/QuizPageClient';

export const metadata: Metadata = {
  title: 'Japanese Vocabulary Quiz | Free Online Practice',
  description: 'Test your Japanese vocabulary with our free interactive quiz. Translate between Japanese and English, get instant feedback, and track your learning progress.',
  keywords: [
    'Japanese vocabulary quiz',
    'learn Japanese words',
    'Japanese translation practice',
    'JLPT vocabulary test',
    'Japanese flashcard quiz',
  ],
  alternates: {
    canonical: '/quiz',
  },
  openGraph: {
    title: 'Japanese Vocabulary Quiz | NihongoWOW',
    description: 'Test your Japanese vocabulary with our free interactive quiz. Get instant feedback and track your progress.',
    url: '/quiz',
  },
};

export default function QuizPage() {
  return <QuizPageClient />;
}
