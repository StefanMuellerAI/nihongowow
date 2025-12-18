'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { setToken } from '@/lib/auth';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (digit && index === 5 && newCode.every(d => d)) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleSubmit(pasted);
    }
  };

  const handleSubmit = async (codeString?: string) => {
    const verificationCode = codeString || code.join('');
    if (verificationCode.length !== 6) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.verifyMFA(email, verificationCode);
      setToken(response.access_token);
      
      // Fetch user info to check admin status
      try {
        const userInfo = await authAPI.getCurrentUser();
        
        // Admins go to dashboard, others to quiz
        if (userInfo.is_admin) {
          router.push('/admin/dashboard');
        } else {
          router.push('/quiz');
        }
      } catch {
        // If user info fetch fails, default to quiz
        router.push('/quiz');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      await authAPI.resendMFA(email);
      setResendSuccess(true);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
      // Hide success message after 5 seconds
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-nihongo-accent mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Invalid Request</h1>
          <p className="text-nihongo-text-muted mb-6">No email address provided.</p>
          <Link href="/login" className="btn btn-primary">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 sakura-pattern">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 text-6xl opacity-20">桜</div>
      <div className="absolute bottom-20 right-20 text-4xl opacity-15">確認</div>
      
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="text-4xl">🌸</span>
            <span className="text-3xl font-bold gradient-text">NihongoWOW</span>
          </Link>
        </div>

        {/* Verification Card */}
        <div className="card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-nihongo-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-nihongo-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
            <p className="text-nihongo-text-muted">
              We sent a 6-digit verification code to
              <br />
              <span className="text-nihongo-text font-medium">{email}</span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {resendSuccess && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg mb-6">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-400">New verification code sent!</p>
            </div>
          )}

          {/* Code Input */}
          <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                className="w-12 h-14 text-center text-2xl font-bold bg-nihongo-bg-light border-2 
                         border-nihongo-border rounded-lg focus:border-nihongo-primary focus:ring-2 
                         focus:ring-nihongo-primary/20 transition-all disabled:opacity-50"
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            onClick={() => handleSubmit()}
            disabled={isLoading || code.some(d => !d)}
            className="btn btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify & Continue
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Resend Button */}
          <button
            onClick={handleResend}
            disabled={isResending}
            className="w-full py-3 text-sm text-nihongo-text-muted hover:text-nihongo-primary 
                     transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Didn&apos;t receive the code? Resend
              </>
            )}
          </button>
        </div>

        {/* Back to Login */}
        <p className="text-center mt-6">
          <Link href="/login" className="text-sm text-nihongo-text-muted hover:text-nihongo-text transition-colors">
            ← Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-nihongo-primary" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}

