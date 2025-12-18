'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { authAPI } from '@/lib/api';
import { Loader2, ShieldX } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'not_logged_in' | 'not_admin'>('loading');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getToken();
    
    // Not logged in -> redirect to login
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const user = await authAPI.getCurrentUser();
      
      if (user.is_admin) {
        // Admin -> redirect to dashboard
        router.push('/admin/dashboard');
      } else {
        // Logged in but not admin
        setStatus('not_admin');
      }
    } catch {
      // Token invalid -> redirect to login
      router.push('/login');
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-nihongo-primary" />
      </div>
    );
  }

  // Not admin state
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 sakura-pattern">
      <div className="absolute top-20 right-10 text-6xl opacity-20">桜</div>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="text-4xl">🌸</span>
            <span className="text-3xl font-bold gradient-text">NihongoWOW</span>
          </Link>
        </div>

        <div className="card text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <ShieldX className="w-10 h-10 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          
          <p className="text-nihongo-text-muted mb-8">
            You don&apos;t have administrator privileges.
            <br />
            Please contact an administrator if you believe this is an error.
          </p>

          <Link 
            href="/quiz" 
            className="btn btn-primary w-full py-3"
          >
            Go to Quiz
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
