'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { authAPI } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Honeypot check - if filled, it's a bot
    if (honeypot) {
      router.push('/not-found');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(email, password, honeypot);
      
      if ('mfa_required' in response && response.mfa_required) {
        // Redirect to MFA verification page
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      } else if ('access_token' in response) {
        // Direct login (MFA disabled)
        localStorage.setItem('nihongowow_token', response.access_token);
        
        // Fetch user info to check admin status
        try {
          const userInfo = await authAPI.getCurrentUser();
          if (userInfo.is_admin) {
            router.push('/admin/dashboard');
          } else {
            router.push('/quiz');
          }
        } catch {
          // If user info fetch fails, default to quiz
          router.push('/quiz');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 sakura-pattern">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 text-6xl opacity-20">桜</div>
      <div className="absolute bottom-20 right-20 text-4xl opacity-15">ログイン</div>
      
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="text-4xl">🌸</span>
            <span className="text-3xl font-bold gradient-text">NihongoWOW</span>
          </Link>
          <p className="mt-3 text-nihongo-text-muted">Welcome back! Sign in to continue learning.</p>
        </div>

        {/* Login Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Honeypot field - hidden from humans, filled by bots */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-nihongo-text mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-nihongo-text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-with-icon"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-nihongo-text mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-nihongo-text-muted" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-with-icon"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-nihongo-border" />
            <span className="text-sm text-nihongo-text-muted">or</span>
            <div className="flex-1 h-px bg-nihongo-border" />
          </div>

          {/* Register Link */}
          <p className="text-center text-nihongo-text-muted">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-nihongo-primary hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <p className="text-center mt-6">
          <Link href="/" className="text-sm text-nihongo-text-muted hover:text-nihongo-text transition-colors">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}

