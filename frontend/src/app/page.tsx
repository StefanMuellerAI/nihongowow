'use client';

import Link from 'next/link';
import { 
  BookOpen, 
  Shuffle, 
  GitBranch, 
  Trophy, 
  Zap, 
  Target,
  ArrowRight,
  Star,
  Users,
  TrendingUp
} from 'lucide-react';
import Footer from '@/components/Footer';

const features = [
  {
    icon: BookOpen,
    title: 'Quiz Mode',
    description: 'Test your vocabulary knowledge with dynamic quizzes. Translate between Japanese and English with instant feedback.',
    href: '/quiz',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
  },
  {
    icon: Shuffle,
    title: 'Salad Mode',
    description: 'Match Romaji cards to their Hiragana or Katakana characters. Race against the clock to improve your recognition speed.',
    href: '/salad',
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
  },
  {
    icon: GitBranch,
    title: 'Lines Mode',
    description: 'Connect Japanese words to their translations by drawing lines. A fun way to strengthen word associations.',
    href: '/lines',
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },
];

const benefits = [
  {
    icon: Trophy,
    title: 'Track Your Progress',
    description: 'Daily highscores keep you motivated. See your improvements over time.',
  },
  {
    icon: Zap,
    title: 'Learn Faster',
    description: 'Multiple game modes engage different parts of your brain for better retention.',
  },
  {
    icon: Target,
    title: 'Personalized Learning',
    description: 'Filter vocabulary by tags and focus on what matters most to you.',
  },
];

const stats = [
  { label: 'Game Modes', value: '3' },
  { label: 'Kana Characters', value: '96+' },
  { label: 'Learning Methods', value: 'Multiple' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-nihongo-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-nihongo-bg/80 backdrop-blur-lg border-b border-nihongo-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl">🌸</span>
            <span className="text-2xl font-bold gradient-text">NihongoWOW</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-4 py-2 text-nihongo-text-muted hover:text-nihongo-text transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="btn btn-primary"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden sakura-pattern">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-pulse">桜</div>
        <div className="absolute top-40 right-20 text-4xl opacity-15">日本語</div>
        <div className="absolute bottom-20 left-1/4 text-3xl opacity-10">学ぶ</div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-nihongo-primary/10 rounded-full border border-nihongo-primary/30 mb-8">
            <Star className="w-4 h-4 text-nihongo-primary" />
            <span className="text-sm text-nihongo-primary">Learn Japanese the fun way</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Master <span className="gradient-text">Japanese</span>
            <br />
            Through Play
          </h1>
          
          <p className="text-xl text-nihongo-text-muted max-w-2xl mx-auto mb-10">
            Interactive games that make learning Hiragana, Katakana, and vocabulary 
            enjoyable and effective. Track your progress with daily highscores.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register" className="btn btn-primary text-lg px-8 py-4">
              Start Learning Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/quiz" className="btn btn-secondary text-lg px-8 py-4">
              Try a Quick Quiz
            </Link>
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-12">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-nihongo-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Three Ways to <span className="gradient-text">Learn</span>
            </h2>
            <p className="text-nihongo-text-muted max-w-2xl mx-auto">
              Each game mode targets different skills to give you a well-rounded 
              Japanese learning experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Link 
                key={feature.title}
                href={feature.href}
                className={`group relative p-8 rounded-2xl border ${feature.borderColor} ${feature.bgColor} 
                          hover:scale-105 transition-all duration-300 overflow-hidden`}
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 
                              group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-6`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 group-hover:text-nihongo-primary transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-nihongo-text-muted mb-4">
                    {feature.description}
                  </p>
                  
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-nihongo-primary">
                    Play Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-nihongo-bg-light">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Choose <span className="gradient-text">NihongoWOW</span>?
              </h2>
              
              <div className="space-y-8">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-nihongo-primary/10 
                                  flex items-center justify-center">
                      <benefit.icon className="w-6 h-6 text-nihongo-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">{benefit.title}</h3>
                      <p className="text-nihongo-text-muted">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              {/* Decorative card stack */}
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-full h-full bg-nihongo-primary/5 rounded-2xl transform rotate-3" />
                <div className="absolute -top-2 -left-2 w-full h-full bg-nihongo-primary/10 rounded-2xl transform rotate-1" />
                <div className="relative bg-nihongo-bg border border-nihongo-border rounded-2xl p-8">
                  <div className="text-center mb-6">
                    <span className="text-6xl mb-4 block japanese-text">勉強</span>
                    <p className="text-lg text-nihongo-text-muted">benkyō</p>
                    <p className="text-sm text-nihongo-primary">study, learning</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="text-center p-4 bg-nihongo-bg-light rounded-xl">
                      <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                      <p className="text-xs text-nihongo-text-muted">Progress</p>
                    </div>
                    <div className="text-center p-4 bg-nihongo-bg-light rounded-xl">
                      <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                      <p className="text-xs text-nihongo-text-muted">Highscores</p>
                    </div>
                    <div className="text-center p-4 bg-nihongo-bg-light rounded-xl">
                      <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-xs text-nihongo-text-muted">Community</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your <span className="gradient-text">Japanese Journey</span>?
          </h2>
          <p className="text-xl text-nihongo-text-muted mb-10">
            Create a free account to track your progress and compete with daily highscores.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn btn-primary text-lg px-8 py-4">
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn btn-secondary text-lg px-8 py-4">
              Already have an account?
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
