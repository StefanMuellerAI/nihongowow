import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'FAQ | Learn Japanese Vocabulary - Common Questions',
  description: 'Frequently asked questions about learning Japanese vocabulary, hiragana, katakana, and using NihongoWOW. Get answers to common Japanese learning questions.',
  keywords: [
    'Japanese learning FAQ',
    'how to learn hiragana',
    'how to learn katakana',
    'best way to learn Japanese vocabulary',
    'JLPT study tips',
    'Japanese for beginners',
    'learn Japanese online free',
  ],
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'FAQ | Learn Japanese Vocabulary - NihongoWOW',
    description: 'Get answers to common questions about learning Japanese vocabulary, hiragana, and katakana.',
    url: '/faq',
  },
};

const faqs = [
  {
    question: 'How do I start learning Japanese vocabulary?',
    answer: 'Start with our Quiz Mode! Begin by learning basic greetings and common words. Our app uses spaced repetition and interactive quizzes to help you memorize vocabulary effectively. Focus on learning 10-20 new words per day and review regularly.',
  },
  {
    question: 'What is the difference between Hiragana and Katakana?',
    answer: 'Hiragana and Katakana are both Japanese phonetic alphabets with 46 basic characters each. Hiragana is used for native Japanese words and grammatical elements, while Katakana is primarily used for foreign loanwords, onomatopoeia, and emphasis. Our Salad Mode helps you practice both!',
  },
  {
    question: 'How long does it take to learn Hiragana and Katakana?',
    answer: 'Most learners can memorize Hiragana in 1-2 weeks with consistent daily practice of 15-30 minutes. Katakana typically takes another 1-2 weeks. With NihongoWOW\'s practice games, you can speed up this process through interactive learning and immediate feedback.',
  },
  {
    question: 'Is NihongoWOW free to use?',
    answer: 'Yes! NihongoWOW is completely free to use. You can access all our vocabulary quizzes, hiragana practice, katakana training, and word matching games without any payment. Create a free account to track your progress and compete on daily highscores.',
  },
  {
    question: 'What vocabulary is included in NihongoWOW?',
    answer: 'Our vocabulary database includes words from various JLPT levels (N5-N1), common everyday expressions, and thematic vocabulary sets. You can filter by tags to focus on specific categories like JLPT levels, Genki textbook chapters, or topic areas.',
  },
  {
    question: 'How does the Quiz Mode work?',
    answer: 'In Quiz Mode, you\'ll be shown Japanese words and asked to provide the English translation (or vice versa). You can type your answer or choose from multiple choice options. The app provides instant feedback and tracks your correct/incorrect answers to help identify areas for improvement.',
  },
  {
    question: 'What is the best way to memorize Japanese vocabulary?',
    answer: 'The most effective approach combines multiple techniques: 1) Use spaced repetition (practice words at increasing intervals), 2) Learn words in context rather than isolation, 3) Practice both recognition and recall, 4) Use multiple modalities (reading, listening, writing). Our different game modes target these various learning styles.',
  },
  {
    question: 'Can I track my learning progress?',
    answer: 'Absolutely! Create a free account to unlock progress tracking features. You\'ll see your daily scores, track improvements over time, and compete on our daily highscore boards. This gamification helps keep you motivated throughout your Japanese learning journey.',
  },
  {
    question: 'How many words should I learn per day?',
    answer: 'For beginners, we recommend starting with 5-10 new words per day while reviewing previous vocabulary. As you become more comfortable, you can increase to 15-20 words daily. Quality matters more than quantity - make sure you can recall words before moving on.',
  },
  {
    question: 'What is JLPT and how does NihongoWOW help prepare for it?',
    answer: 'JLPT (Japanese Language Proficiency Test) is the standardized test for Japanese language ability, with levels from N5 (beginner) to N1 (advanced). NihongoWOW includes vocabulary tagged by JLPT level, so you can focus your practice on words that will appear on your target test level.',
  },
  {
    question: 'Does NihongoWOW work on mobile devices?',
    answer: 'Yes! NihongoWOW is a progressive web app (PWA) that works on any device with a modern web browser. You can add it to your home screen for quick access and practice Japanese vocabulary on the go.',
  },
  {
    question: 'How is NihongoWOW different from other Japanese learning apps?',
    answer: 'NihongoWOW focuses on making vocabulary learning fun through gamification. With multiple game modes (Quiz, Salad, Lines, Memory), daily highscores, and instant feedback, learning feels more like playing than studying. Plus, it\'s completely free with no hidden costs.',
  },
];

// Generate FAQ Schema for SEO
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-nihongo-bg flex flex-col">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-nihongo-bg/80 backdrop-blur-lg border-b border-nihongo-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl">🌸</span>
            <span className="text-2xl font-bold gradient-text">NihongoWOW</span>
          </Link>
          
          <Link 
            href="/" 
            className="flex items-center gap-2 text-nihongo-text-muted hover:text-nihongo-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Frequently Asked <span className="gradient-text">Questions</span>
        </h1>
        <p className="text-xl text-nihongo-text-muted max-w-2xl mx-auto">
          Everything you need to know about learning Japanese vocabulary with NihongoWOW
        </p>
      </section>

      {/* FAQ Content */}
      <main className="flex-1 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group bg-nihongo-bg-light border border-nihongo-border rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-nihongo-bg transition-colors">
                  <h2 className="text-lg font-semibold text-nihongo-text pr-4">
                    {faq.question}
                  </h2>
                  <ChevronDown className="w-5 h-5 text-nihongo-text-muted flex-shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-6">
                  <p className="text-nihongo-text-muted leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center bg-nihongo-bg-light border border-nihongo-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Start Learning <span className="gradient-text">Japanese</span>?
            </h2>
            <p className="text-nihongo-text-muted mb-6">
              Join thousands of learners mastering Japanese vocabulary with our free interactive games.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="btn btn-primary px-8 py-3">
                Create Free Account
              </Link>
              <Link href="/quiz" className="btn btn-secondary px-8 py-3">
                Try a Quiz Now
              </Link>
            </div>
          </div>

          {/* Additional SEO Content */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">
              Why Learn Japanese with <span className="gradient-text">NihongoWOW</span>?
            </h2>
            <div className="prose prose-invert max-w-none text-nihongo-text-muted">
              <p className="mb-4">
                Learning Japanese vocabulary doesn&apos;t have to be boring. NihongoWOW transforms 
                vocabulary acquisition into an engaging experience through gamification and 
                interactive practice. Whether you&apos;re preparing for the JLPT, studying with 
                textbooks like Genki, or simply exploring the Japanese language for fun, our 
                platform adapts to your learning style.
              </p>
              <p className="mb-4">
                Our vocabulary trainer covers essential Japanese words from beginner to advanced 
                levels. Practice hiragana and katakana with our Salad Mode, test your translation 
                skills in Quiz Mode, or strengthen word associations with Lines Mode. Each game 
                mode offers a unique approach to reinforce your learning.
              </p>
              <p>
                With daily highscores and progress tracking, you&apos;ll stay motivated as you 
                watch your Japanese skills improve. Best of all, NihongoWOW is completely free 
                - no subscriptions, no hidden fees, just effective Japanese vocabulary learning.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

