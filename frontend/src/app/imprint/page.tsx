'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

export default function ImprintPage() {
  return (
    <div className="min-h-screen bg-nihongo-bg flex flex-col">
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

      {/* Content */}
      <main className="flex-1 pt-24 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold gradient-text mb-8">Imprint</h1>
          
          <div className="prose prose-invert max-w-none space-y-8">
            {/* Provider Information */}
            <section className="bg-nihongo-bg-light rounded-xl p-6 border border-nihongo-border">
              <h2 className="text-xl font-bold text-nihongo-text mb-4">Provider Information</h2>
              <p className="text-nihongo-text-muted">
                Stefan Müller<br />
                StefanAI – Research & Development<br />
                Graeffstr. 22<br />
                50823 Cologne, Germany
              </p>
            </section>

            {/* Contact */}
            <section className="bg-nihongo-bg-light rounded-xl p-6 border border-nihongo-border">
              <h2 className="text-xl font-bold text-nihongo-text mb-4">Contact</h2>
              <p className="text-nihongo-text-muted">
                Phone: +49 221 5702984<br />
                Email: <a href="mailto:info@stefanai.de" className="text-nihongo-primary hover:underline">info@stefanai.de</a>
              </p>
            </section>

            {/* VAT ID */}
            <section className="bg-nihongo-bg-light rounded-xl p-6 border border-nihongo-border">
              <h2 className="text-xl font-bold text-nihongo-text mb-4">VAT Identification Number</h2>
              <p className="text-nihongo-text-muted">
                VAT ID according to § 27 a of the German Value Added Tax Act:<br />
                DE347707954
              </p>
            </section>

            {/* Editorial Responsibility */}
            <section className="bg-nihongo-bg-light rounded-xl p-6 border border-nihongo-border">
              <h2 className="text-xl font-bold text-nihongo-text mb-4">Editorially Responsible</h2>
              <p className="text-nihongo-text-muted">
                Stefan Müller<br />
                Graeffstr. 22<br />
                50823 Cologne, Germany
              </p>
            </section>

            {/* EU Dispute Resolution */}
            <section className="bg-nihongo-bg-light rounded-xl p-6 border border-nihongo-border">
              <h2 className="text-xl font-bold text-nihongo-text mb-4">EU Dispute Resolution</h2>
              <p className="text-nihongo-text-muted">
                The European Commission provides a platform for online dispute resolution (ODR):{' '}
                <a 
                  href="https://ec.europa.eu/consumers/odr/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-nihongo-primary hover:underline"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
                <br /><br />
                You can find our email address in the contact section above.
              </p>
            </section>

            {/* Consumer Dispute Resolution */}
            <section className="bg-nihongo-bg-light rounded-xl p-6 border border-nihongo-border">
              <h2 className="text-xl font-bold text-nihongo-text mb-4">Consumer Dispute Resolution</h2>
              <p className="text-nihongo-text-muted">
                We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
