import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NihongoWOW - Japanese Vocabulary Trainer',
  description: 'Learn Japanese vocabulary with interactive quizzes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-nihongo-bg sakura-pattern">
        {children}
      </body>
    </html>
  )
}

