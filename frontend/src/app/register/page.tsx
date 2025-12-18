'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle, RefreshCw, Clock, Gift } from 'lucide-react';
import { authAPI } from '@/lib/api';

const RESEND_COOLDOWN_SECONDS = 120; // 2 minutes

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [honeypot, setHoneypot] = useState('');
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [isInvited, setIsInvited] = useState(false);

  // Read invitation params from URL
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('invitation_token');
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
      setIsInvited(true);
    }
    if (tokenParam) {
      setInvitationToken(tokenParam);
      setIsInvited(true);
    }
  }, [searchParams]);

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

  const passwordRequirements = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[a-z]/.test(password), text: 'One lowercase letter' },
    { met: /\d/.test(password), text: 'One number' },
    { met: password === confirmPassword && password.length > 0, text: 'Passwords match' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Honeypot check - if filled, it's a bot
    if (honeypot) {
      router.push('/not-found');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAPI.register(username, email, password, honeypot, invitationToken || undefined);
      setRegisteredEmail(response.email);
      setRegistrationSuccess(true);
      // Start cooldown immediately after registration (email was just sent)
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    setResendSuccess(false);
    setError(null);

    try {
      await authAPI.resendVerification(registeredEmail);
      setResendSuccess(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  // Success state after registration
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12 sakura-pattern">
        <div className="absolute top-20 right-10 text-6xl opacity-20">桜</div>
        <div className="absolute bottom-20 left-20 text-4xl opacity-15">確認</div>
        
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="text-4xl">🌸</span>
              <span className="text-3xl font-bold gradient-text">NihongoWOW</span>
            </Link>
          </div>

          <div className="card text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-green-500" />
            </div>
            
            <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
            
            <p className="text-nihongo-text-muted mb-6">
              We&apos;ve sent a verification link to
              <br />
              <span className="text-nihongo-text font-medium">{registeredEmail}</span>
            </p>
            
            <p className="text-sm text-nihongo-text-muted mb-6">
              Please click the link in the email to verify your account.
              <br />
              The link will expire in 24 hours.
            </p>

            {/* Resend Success */}
            {resendSuccess && (
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg mb-4">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-400">Verification email sent!</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Resend Button */}
            <button
              onClick={handleResendVerification}
              disabled={isResending || resendCooldown > 0}
              className="w-full py-3 text-sm text-nihongo-text-muted hover:text-nihongo-primary 
                       transition-colors flex items-center justify-center gap-2 disabled:opacity-50
                       border border-nihongo-border rounded-lg hover:border-nihongo-primary/50
                       disabled:hover:text-nihongo-text-muted disabled:hover:border-nihongo-border"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <Clock className="w-4 h-4" />
                  Resend available in {formatTime(resendCooldown)}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Didn&apos;t receive the email? Resend
                </>
              )}
            </button>

            <div className="mt-6 pt-6 border-t border-nihongo-border">
              <Link 
                href="/login" 
                className="btn btn-primary w-full py-3"
              >
                Go to Login
                <ArrowRight className="w-5 h-5" />
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

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 sakura-pattern">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 text-6xl opacity-20">桜</div>
      <div className="absolute bottom-20 left-20 text-4xl opacity-15">登録</div>
      
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="text-4xl">🌸</span>
            <span className="text-3xl font-bold gradient-text">NihongoWOW</span>
          </Link>
          <p className="mt-3 text-nihongo-text-muted">
            {isInvited 
              ? "You've been invited! Complete your registration below."
              : "Create an account to start your Japanese journey."
            }
          </p>
        </div>

        {/* Invitation Banner */}
        {isInvited && (
          <div className="flex items-center gap-3 p-4 bg-nihongo-primary/10 border border-nihongo-primary/30 rounded-lg mb-6">
            <Gift className="w-5 h-5 text-nihongo-primary flex-shrink-0" />
            <p className="text-sm text-nihongo-primary">
              You&apos;ve been invited to join NihongoWOW! Your email has been pre-filled.
            </p>
          </div>
        )}

        {/* Register Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
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

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-nihongo-text mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-nihongo-text-muted" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="input-with-icon"
                  required
                  minLength={3}
                  maxLength={100}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-nihongo-text mb-2">
                Email Address
                {isInvited && (
                  <span className="ml-2 text-xs text-nihongo-primary">(from invitation)</span>
                )}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-nihongo-text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => !isInvited && setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={`input-with-icon ${isInvited ? 'bg-nihongo-bg cursor-not-allowed' : ''}`}
                  required
                  readOnly={isInvited}
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
                  minLength={8}
                  maxLength={128}
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-nihongo-text mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-nihongo-text-muted" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-with-icon"
                  required
                  minLength={8}
                  maxLength={128}
                />
              </div>
            </div>

            {/* Password Requirements */}
            <div className="space-y-2">
              {passwordRequirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle 
                    className={`w-4 h-4 ${req.met ? 'text-green-500' : 'text-nihongo-text-muted'}`} 
                  />
                  <span className={req.met ? 'text-green-500' : 'text-nihongo-text-muted'}>
                    {req.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !passwordRequirements.every(r => r.met)}
              className="btn btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
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

          {/* Login Link */}
          <p className="text-center text-nihongo-text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-nihongo-primary hover:underline font-medium">
              Sign in
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

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-nihongo-primary" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
