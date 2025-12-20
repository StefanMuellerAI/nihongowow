import type { Metadata, Viewport } from 'next'
import { Inter, Noto_Sans_JP } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
})

const siteUrl = 'https://nihongowow.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'NihongoWOW | Free Japanese Vocabulary Trainer & Quiz App',
    template: '%s | NihongoWOW - Learn Japanese',
  },
  description: 'Master Japanese vocabulary with free interactive quizzes, hiragana & katakana practice games. Track your progress with daily highscores. Start learning Japanese today!',
  keywords: [
    'Japanese vocabulary trainer',
    'learn Japanese vocabulary',
    'Japanese quiz app',
    'hiragana practice',
    'katakana trainer',
    'JLPT vocabulary',
    'Japanese flashcards',
    'learn hiragana',
    'learn katakana',
    'Japanese language learning',
    'free Japanese lessons',
    'Japanese word game',
  ],
  authors: [{ name: 'NihongoWOW', url: siteUrl }],
  creator: 'NihongoWOW',
  publisher: 'NihongoWOW',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'NihongoWOW',
    title: 'NihongoWOW | Free Japanese Vocabulary Trainer & Quiz App',
    description: 'Master Japanese vocabulary with free interactive quizzes, hiragana & katakana practice games. Track your progress with daily highscores.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NihongoWOW - Learn Japanese Vocabulary',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NihongoWOW | Free Japanese Vocabulary Trainer',
    description: 'Master Japanese vocabulary with free interactive quizzes and games. Start learning today!',
    images: ['/og-image.png'],
    creator: '@nihongowow',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  category: 'education',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f472b6' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'NihongoWOW',
      description: 'Free Japanese Vocabulary Trainer & Quiz App',
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/quiz?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
      inLanguage: 'en-US',
    },
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'NihongoWOW',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        '@id': `${siteUrl}/#logo`,
        url: `${siteUrl}/icon-512.png`,
        contentUrl: `${siteUrl}/icon-512.png`,
        width: 512,
        height: 512,
        caption: 'NihongoWOW Logo',
      },
      image: {
        '@id': `${siteUrl}/#logo`,
      },
      sameAs: [],
    },
    {
      '@type': 'WebApplication',
      '@id': `${siteUrl}/#webapp`,
      name: 'NihongoWOW',
      url: siteUrl,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '150',
        bestRating: '5',
        worstRating: '1',
      },
      description: 'Master Japanese vocabulary with free interactive quizzes, hiragana & katakana practice games. Track your progress with daily highscores.',
      featureList: [
        'Japanese Vocabulary Quiz',
        'Hiragana Practice',
        'Katakana Practice',
        'Word Matching Games',
        'Progress Tracking',
        'Daily Highscores',
      ],
      screenshot: `${siteUrl}/og-image.png`,
    },
    {
      '@type': 'SoftwareApplication',
      name: 'NihongoWOW',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansJP.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-nihongo-bg sakura-pattern">
        {children}
      </body>
    </html>
  )
}
