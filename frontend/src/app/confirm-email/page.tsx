'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, ArrowRight, RefreshCw, Mail, Clock } from 'lucide-react';
import { authAPI } from '@/lib/api';

const RESEND_COOLDOWN_SECONDS = 120; // 2 minutes

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const confirmEmail = useCallback(async () => {
    if (!token) return;

    try {
      await authAPI.confirmEmail(token);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Verification failed. The link may be invalid or expired.');
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      confirmEmail();
    } else {
      setStatus('error');
      setErrorMessage('No verification token provided.');
    }
  }, [token, confirmEmail]);

  const handleResendVerification = async () => {
    if (!email || resendCooldown > 0) return;
    
    setIsResending(true);
    setResendSuccess(false);

    try {
      await authAPI.resendVerification(email);
      setResendSuccess(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch {
      // Silent fail - don't reveal if email exists
    } finally {
      setIsResending(false);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12 sakura-pattern">
        <div className="w-full max-w-md text-center">
          <div className="card">
            <Loader2 className="w-16 h-16 animate-spin text-nihongo-primary mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">Verifying Your Email</h1>
            <p className="text-nihongo-text-muted">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12 sakura-pattern">
        <div className="absolute top-20 right-10 text-6xl opacity-20">桜</div>
        <div className="absolute bottom-20 left-20 text-4xl opacity-15">成功</div>
        
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="text-4xl">🌸</span>
              <span className="text-3xl font-bold gradient-text">NihongoWOW</span>
            </Link>
          </div>

          <div className="card text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            
            <h1 className="text-2xl font-bold mb-4">Email Verified!</h1>
            
            <p className="text-nihongo-text-muted mb-8">
              Your email has been successfully verified.
              <br />
              You can now log in to your account.
            </p>

            <Link 
              href="/login" 
              className="btn btn-primary w-full py-4 text-lg"
            >
              Go to Login
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <p className="text-center mt-6">
            <Link href="/" className="text-sm text-nihongo-text-muted hover:text-nihongo-text transition-colors">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 sakura-pattern">
      <div className="absolute top-20 right-10 text-6xl opacity-20">桜</div>
      <div className="absolute bottom-20 left-20 text-4xl opacity-15">エラー</div>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="text-4xl">🌸</span>
            <span className="text-3xl font-bold gradient-text">NihongoWOW</span>
          </Link>
        </div>

        <div className="card text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Verification Failed</h1>
          
          <p className="text-nihongo-text-muted mb-6">
            {errorMessage}
          </p>

          {/* Resend Section */}
          <div className="border-t border-nihongo-border pt-6 mt-6">
            <p className="text-sm text-nihongo-text-muted mb-4">
              Need a new verification link? Enter your email below.
            </p>
            
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-nihongo-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-with-icon"
                  disabled={resendCooldown > 0}
                />
              </div>
              <button
                onClick={handleResendVerification}
                disabled={isResending || !email || resendCooldown > 0}
                className="btn btn-primary px-4 disabled:opacity-50"
              >
                {isResending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : resendCooldown > 0 ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
              </button>
            </div>

            {resendCooldown > 0 && (
              <p className="text-sm text-nihongo-text-muted mb-4">
                You can request a new email in {formatTime(resendCooldown)}
              </p>
            )}

            {resendSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                If an account exists, a new verification email has been sent.
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-nihongo-border">
            <Link 
              href="/login" 
              className="text-nihongo-primary hover:underline font-medium"
            >
              Back to Login
            </Link>
          </div>
        </div>

        <p className="text-center mt-6">
          <Link href="/" className="text-sm text-nihongo-text-muted hover:text-nihongo-text transition-colors">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-nihongo-primary" />
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}
