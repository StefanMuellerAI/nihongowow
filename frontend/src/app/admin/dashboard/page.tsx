'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import VocabularyTable from '@/components/VocabularyTable';
import AppFooter from '@/components/AppFooter';
import { getToken, removeToken, isAuthenticated } from '@/lib/auth';
import { authAPI } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const user = await authAPI.getMe(token);
      
      // Check if user is admin
      if (!user.is_admin) {
        // Not an admin, redirect to regular quiz page
        router.push('/quiz');
        return;
      }
      
      setUsername(user.username);
    } catch {
      removeToken();
      router.push('/login');
      return;
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    removeToken();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-nihongo-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar isAdmin onLogout={handleLogout} />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <header className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
                  <p className="text-nihongo-text-muted">Manage your vocabulary database</p>
                </div>
                {username && (
                  <div className="text-sm text-nihongo-text-muted">
                    Logged in as <span className="text-nihongo-primary">{username}</span>
                  </div>
                )}
              </div>
            </header>
            
            <VocabularyTable />
          </div>
        </main>
        <AppFooter />
      </div>
    </div>
  );
}

