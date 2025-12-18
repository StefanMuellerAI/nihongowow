'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
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
          <h1 className="text-4xl font-bold gradient-text mb-8">Privacy Policy</h1>
          
          <div className="prose prose-invert max-w-none space-y-8">
            {/* 1. Privacy at a Glance */}
            <section className="bg-nihongo-bg-light rounded-xl p-6 border border-nihongo-border">
              <h2 className="text-xl font-bold text-nihongo-text mb-4">1. Privacy at a Glance</h2>
              
              <h3 className="text-lg font-semibold text-nihongo-text mt-4 mb-2">General Information</h3>
              <p className="text-nihongo-text-muted mb-4">
                The following information provides a simple overview of what happens to your personal data when you visit this website. Personal data is any data that can be used to personally identify you. For detailed information on data protection, please refer to our privacy policy listed below.
              </p>

              <h3 className="text-lg font-semibold text-nihongo-text mt-4 mb-2">Data Collection on This Website</h3>
              <p className="text-nihongo-text-muted mb-4">
                <strong className="text-nihongo-text">Who is responsible for data collection on this website?</strong><br />
                Data processing on this website is carried out by the website operator. You can find the operator&apos;s contact details in the &quot;Responsible Party&quot; section of this privacy policy.
              </p>

              <p className="text-nihongo-text-muted mb-4">
                <strong className="text-nihongo-text">How do we collect your data?</strong><br />
                Your data is collected in two ways: data you provide to us directly (e.g., data entered in forms), and data automatically collected by our IT systems when you visit the website (primarily technical data such as browser type, operating system, or time of page access).
              </p>

              <p className="text-nihongo-text-muted mb-4">
                <strong className="text-nihongo-text">What do we use your data for?</strong><br />
                Some data is collected to ensure error-free website operation. Other data may be used to analyze user behavior. If contracts can be concluded or initiated through the website, the transmitted data is also processed for contract offers, orders, or other inquiries.
              </p>

              <p className="text-nihongo-text-muted">
                <strong className="text-nihongo-text">What rights do you have regarding your data?</strong><br />
                You have the right to receive information about the origin, recipient, and purpose of your stored personal data free of charge at any time. You also have the right to request correction or deletion of this data. If you have given consent for data processing, you can revoke this consent at any time for the future. You also have the right to request restriction of processing of your personal data under certain circumstances. Furthermore, you have the right to lodge a complaint with the competent supervisory authority.
              </p>
            </section>

            {/* 2. Hosting */}
            <section className="bg-nihongo-bg-light rounded-xl p-6 border border-nihongo-border">
              <h2 className="text-xl font-bold text-nihongo-text mb-4">2. Hosting</h2>
              <p className="text-nihongo-text-muted mb-4">
                We host the contents of our website with the following provider:
              </p>
              <p className="text-nihongo-text-muted mb-4">
                <strong className="text-nihongo-text">IONOS</strong><br />
                The provider is IONOS SE, Elgendorfer Str. 57, 56410 Montabaur, Germany. When you visit our website, IONOS collects various log files including your IP addresses. For details, please refer to IONOS&apos;s privacy policy:{' '}
                <a 
                  href="https://www.ionos.de/terms-gtc/terms-privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-nihongo-primary hover:underline"
                >
                  https://www.ionos.de/terms-gtc/terms-privacy
                </a>
              </p>
              <p className="text-nihongo-text-muted">
                The use of IONOS is based on Art. 6 para. 1 lit. f GDPR. We have a legitimate interest in the most reliable presentation of our website possible.
              </p>
            </section>

            {/* 3. General Information and Mandatory Information */}
            <section className="bg-nihongo-bg-light rounded-xl p-6 border border-nihongo-border">
              <h2 className="text-xl font-bold text-nihongo-text mb-4">3. General Information and Mandatory Information</h2>
              
              <h3 className="text-lg font-semibold text-nihongo-text mt-4 mb-2">Data Protection</h3>
              <p className="text-nihongo-text-muted mb-4">
                The operators of these pages take the protection of your personal data very seriously. We treat your personal data confidentially and in accordance with statutory data protection regulations and this privacy policy.
              </p>

              <h3 className="text-lg font-semibold text-nihongo-text mt-4 mb-2">Responsible Party</h3>
              <p className="text-nihongo-text-muted mb-4">
                The responsible party for data processing on this website is:<br /><br />
                Stefan Müller<br />
                Graeffstr. 22<br />
                50823 Cologne, Germany<br /><br />
                Phone: +49 221 5702984<br />
                Email: <a href="mailto:info@stefanai.de" className="text-nihongo-primary hover:underline">info@stefanai.de</a>
              </p>
              <p className="text-nihongo-text-muted">
                The responsible party is the natural or legal person who alone or jointly with others decides on the purposes and means of processing personal data (e.g., names, email addresses, etc.).
              </p>

              <h3 className="text-lg font-semibold text-nihongo-text mt-4 mb-2">Storage Duration</h3>
              <p className="text-nihongo-text-muted mb-4">
                Unless a more specific storage period has been stated within this privacy policy, your personal data will remain with us until the purpose for data processing no longer applies. If you assert a legitimate request for deletion or revoke consent for data processing, your data will be deleted unless we have other legally permissible reasons for storing your personal data (e.g., tax or commercial law retention periods); in the latter case, deletion will take place after these reasons cease to apply.
              </p>

              <h3 className="text-lg font-semibold text-nihongo-text mt-4 mb-2">Recipients of Personal Data</h3>
              <p className="text-nihongo-text-muted mb-4">
                In the course of our business activities, we work with various external parties. In some cases, the transfer of personal data to these external parties is necessary. We only pass on personal data to external parties if this is necessary for the fulfillment of a contract, if we are legally obliged to do so (e.g., disclosure of data to tax authorities), if we have a legitimate interest pursuant to Art. 6 para. 1 lit. f GDPR in the disclosure, or if another legal basis permits the data transfer.
              </p>

              <h3 className="text-lg font-semibold text-nihongo-text mt-4 mb-2">Revocation of Your Consent to Data Processing</h3>
              <p className="text-nihongo-text-muted mb-4">
                Many data processing operations are only possible with your express consent. You can revoke consent you have already given at any time. The legality of the data processing carried out until the revocation remains unaffected by the revocation.
              </p>

              <h3 className="text-lg font-semibold text-nihongo-text mt-4 mb-2">Right to Object (Art. 21 GDPR)</h3>
              <p className="text-nihongo-text-muted mb-4">
                IF DATA PROCESSING IS BASED ON ART. 6 PARA. 1 LIT. E OR F GDPR, YOU HAVE THE RIGHT TO OBJECT TO THE PROCESSING OF YOUR PERSONAL DATA AT ANY TIME FOR REASONS ARISING FROM YOUR PARTICULAR SITUATION; THIS ALSO APPLIES TO PROFILING BASED ON THESE PROVISIONS. IF YOU OBJECT, WE WILL NO LONGER PROCESS YOUR PERSONAL DATA UNLESS WE CAN DEMONSTRATE COMPELLING LEGITIMATE GROUNDS FOR THE PROCESSING WHICH OVERRIDE YOUR INTERESTS, RIGHTS AND FREEDOMS, OR THE PROCESSING SERVES TO ASSERT, EXERCISE OR DEFEND LEGAL CLAIMS.
              </p>
              <p className="text-nihongo-text-muted">
                IF YOUR PERSONAL DATA IS PROCESSED FOR DIRECT MARKETING PURPOSES, YOU HAVE THE RIGHT TO OBJECT AT ANY TIME TO THE PROCESSING OF PERSONAL DATA CONCERNING YOU FOR THE PURPOSE OF SUCH ADVERTISING; THIS ALSO APPLIES TO PROFILING INSOFAR AS IT IS RELATED TO SUCH DIRECT MARKETING.
              </p>

              <h3 className="text-lg font-semibold text-nihongo-text mt-4 mb-2">Right to Lodge a Complaint</h3>
              <p className="text-nihongo-text-muted mb-4">
                In the event of violations of the GDPR, data subjects have the right to lodge a complaint with a supervisory authority, in particular in the Member State of their habitual residence, place of work, or place of the alleged infringement.
              </p>

              <h3 className="text-lg font-semibold text-nihongo-text mt-4 mb-2">Right to Data Portability</h3>
              <p className="text-nihongo-text-muted mb-4">
                You have the right to have data that we process automatically on the basis of your consent or in fulfillment of a contract handed over to you or to a third party in a common, machine-readable format.
              </p>

              <h3 className="text-lg font-semibold text-nihongo-text mt-4 mb-2">Information, Correction and Deletion</h3>
              <p className="text-nihongo-text-muted mb-4">
                Within the framework of the applicable legal provisions, you have the right at any time to free information about your stored personal data, its origin and recipients and the purpose of data processing and, if applicable, a right to correction or deletion of this data.
              </p>

              <h3 className="text-lg font-semibold text-nihongo-text mt-4 mb-2">Right to Restriction of Processing</h3>
              <p className="text-nihongo-text-muted mb-4">
                You have the right to request the restriction of the processing of your personal data. You can contact us at any time for this purpose. The right to restriction of processing exists in the following cases:
              </p>
              <ul className="list-disc list-inside text-nihongo-text-muted mb-4 space-y-2">
                <li>If you dispute the accuracy of your personal data stored by us</li>
                <li>If the processing of your personal data is unlawful</li>
                <li>If we no longer need your personal data but you need it for legal claims</li>
                <li>If you have lodged an objection pursuant to Art. 21 para. 1 GDPR</li>
              </ul>

              <h3 className="text-lg font-semibold text-nihongo-text mt-4 mb-2">SSL/TLS Encryption</h3>
              <p className="text-nihongo-text-muted">
                This site uses SSL or TLS encryption for security reasons and to protect the transmission of confidential content. You can recognize an encrypted connection by the fact that the address line of the browser changes from &quot;http://&quot; to &quot;https://&quot; and by the lock symbol in your browser line.
              </p>
            </section>

            {/* 4. Data Collection on This Website */}
            <section className="bg-nihongo-bg-light rounded-xl p-6 border border-nihongo-border">
              <h2 className="text-xl font-bold text-nihongo-text mb-4">4. Data Collection on This Website</h2>
              
              <h3 className="text-lg font-semibold text-nihongo-text mt-4 mb-2">Cookies</h3>
              <p className="text-nihongo-text-muted mb-4">
                Our website uses cookies. Cookies are small data packets that do not cause any damage to your device. They are stored either temporarily for the duration of a session (session cookies) or permanently (permanent cookies) on your device. Session cookies are automatically deleted after your visit. Permanent cookies remain stored on your device until you delete them yourself or until they are automatically deleted by your web browser.
              </p>
              <p className="text-nihongo-text-muted mb-4">
                Cookies can come from us (first-party cookies) or from third-party companies (third-party cookies). Third-party cookies enable the integration of certain services from third-party companies within websites.
              </p>
              <p className="text-nihongo-text-muted">
                Cookies have various functions. Many cookies are technically necessary, as certain website functions would not work without them. Other cookies can be used to analyze user behavior or for advertising purposes. Cookies that are necessary to carry out the electronic communication process, to provide certain functions you have requested, or to optimize the website are stored on the basis of Art. 6 para. 1 lit. f GDPR, unless another legal basis is specified.
              </p>

              <h3 className="text-lg font-semibold text-nihongo-text mt-4 mb-2">Server Log Files</h3>
              <p className="text-nihongo-text-muted mb-4">
                The provider of the pages automatically collects and stores information in so-called server log files, which your browser automatically transmits to us. These are:
              </p>
              <ul className="list-disc list-inside text-nihongo-text-muted mb-4 space-y-1">
                <li>Browser type and version</li>
                <li>Operating system used</li>
                <li>Referrer URL</li>
                <li>Host name of the accessing computer</li>
                <li>Time of the server request</li>
                <li>IP address</li>
              </ul>
              <p className="text-nihongo-text-muted">
                This data is not merged with other data sources. The collection of this data is based on Art. 6 para. 1 lit. f GDPR. The website operator has a legitimate interest in the technically error-free presentation and optimization of their website – for this purpose, the server log files must be recorded.
              </p>

              <h3 className="text-lg font-semibold text-nihongo-text mt-4 mb-2">User Account and Authentication</h3>
              <p className="text-nihongo-text-muted">
                When you register for an account on NihongoWOW, we collect and store the information you provide (such as username and email address). This data is used to provide you with personalized learning experiences, track your progress, and maintain your account. The legal basis for this processing is Art. 6 para. 1 lit. b GDPR (contract performance) and Art. 6 para. 1 lit. f GDPR (legitimate interests in providing our services).
              </p>
            </section>

            {/* 5. Contact */}
            <section className="bg-nihongo-bg-light rounded-xl p-6 border border-nihongo-border">
              <h2 className="text-xl font-bold text-nihongo-text mb-4">5. Contact</h2>
              <p className="text-nihongo-text-muted">
                If you contact us by email or other means, your inquiry including all resulting personal data (name, inquiry) will be stored and processed by us for the purpose of handling your request. We do not pass on this data without your consent. The processing of this data is based on Art. 6 para. 1 lit. b GDPR if your inquiry is related to the performance of a contract or is necessary for the implementation of pre-contractual measures. In all other cases, the processing is based on our legitimate interest in the effective processing of inquiries addressed to us (Art. 6 para. 1 lit. f GDPR) or on your consent (Art. 6 para. 1 lit. a GDPR) if this has been requested.
              </p>
            </section>

            {/* 6. Plugins and Tools */}
            <section className="bg-nihongo-bg-light rounded-xl p-6 border border-nihongo-border">
              <h2 className="text-xl font-bold text-nihongo-text mb-4">6. Plugins and Tools</h2>
              
              <h3 className="text-lg font-semibold text-nihongo-text mt-4 mb-2">Google Fonts (Local Hosting)</h3>
              <p className="text-nihongo-text-muted">
                This site uses Google Fonts for uniform font display, which are provided by Google. The Google Fonts are installed locally. There is no connection to Google servers.
              </p>
              <p className="text-nihongo-text-muted mt-2">
                For more information about Google Fonts, see{' '}
                <a 
                  href="https://developers.google.com/fonts/faq" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-nihongo-primary hover:underline"
                >
                  https://developers.google.com/fonts/faq
                </a>
                {' '}and Google&apos;s privacy policy:{' '}
                <a 
                  href="https://policies.google.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-nihongo-primary hover:underline"
                >
                  https://policies.google.com/privacy
                </a>
              </p>
            </section>

            {/* Last Updated */}
            <section className="text-center text-nihongo-text-muted text-sm py-4">
              <p>Last updated: December 2024</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
