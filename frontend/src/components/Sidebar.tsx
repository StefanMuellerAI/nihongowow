'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  Settings, 
  LogOut,
  LogIn,
  Home,
  Database,
  Salad,
  Sliders,
  Link2,
  User,
  Trophy,
  Gamepad2,
  Users,
  UserPlus,
  HardDrive,
  Grid3X3
} from 'lucide-react';
import { isAuthenticated, removeToken, getCurrentUsername } from '@/lib/auth';
import { authAPI } from '@/lib/api';

interface SidebarProps {
  isAdmin?: boolean;
  onLogout?: () => void;
}

export default function Sidebar({ isAdmin = false, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);
      setUsername(getCurrentUsername());
      
      // Check if user is admin
      if (authenticated) {
        try {
          const user = await authAPI.getCurrentUser();
          setIsUserAdmin(user.is_admin);
        } catch {
          setIsUserAdmin(false);
        }
      } else {
        setIsUserAdmin(false);
      }
    };
    
    checkAuth();
  }, [pathname]);
  
  const userLinks = [
    { href: '/quiz', label: 'Quiz', icon: GraduationCap },
    { href: '/salad', label: 'Salad', icon: Salad },
    { href: '/lines', label: 'Lines', icon: Link2 },
    { href: '/memory', label: 'Memory', icon: Grid3X3 },
  ];
  
  const adminLinks = [
    { href: '/admin/dashboard', label: 'Vocabulary', icon: Database },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/invitations', label: 'Invitations', icon: UserPlus },
    { href: '/admin/cache', label: 'AI Cache', icon: HardDrive },
    { href: '/admin/settings', label: 'Settings', icon: Sliders },
  ];
  
  const links = isAdmin ? adminLinks : userLinks;
  
  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    setUsername(null);
    if (onLogout) {
      onLogout();
    } else {
      router.push('/');
    }
  };
  
  return (
    <aside className="w-64 min-h-screen bg-nihongo-bg-light border-r border-nihongo-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-nihongo-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nihongo-primary to-nihongo-primary-dark flex items-center justify-center">
            <span className="text-xl font-bold text-nihongo-bg japanese-text">日</span>
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">NihongoWOW</h1>
            <p className="text-xs text-nihongo-text-muted">
              {isAdmin ? 'Admin Panel' : 'Vocabulary Trainer'}
            </p>
          </div>
        </Link>
      </div>
      
      {/* User Info (if logged in) */}
      {isLoggedIn && !isAdmin && (
        <div className="p-4 border-b border-nihongo-border">
          <Link 
            href="/profile"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              pathname === '/profile'
                ? 'bg-nihongo-primary/10 text-nihongo-primary border border-nihongo-primary/30'
                : 'text-nihongo-text-muted hover:text-nihongo-text hover:bg-nihongo-bg'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nihongo-primary to-pink-600 
                          flex items-center justify-center text-sm font-bold text-white">
              {username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{username || 'User'}</p>
              <p className="text-xs text-nihongo-text-muted flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                View Profile
              </p>
            </div>
          </Link>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-nihongo-primary/10 text-nihongo-primary border border-nihongo-primary/30'
                      : 'text-nihongo-text-muted hover:text-nihongo-text hover:bg-nihongo-bg'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-nihongo-border space-y-2">
        {isAdmin ? (
          <>
            <Link
              href="/quiz"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-nihongo-text-muted hover:text-nihongo-primary hover:bg-nihongo-bg transition-all duration-200"
            >
              <Gamepad2 size={20} />
              <span className="font-medium">Spielen</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-nihongo-text-muted hover:text-nihongo-accent hover:bg-nihongo-bg transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </>
        ) : (
          <>
            {isLoggedIn ? (
              <>
                {isUserAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-nihongo-text-muted hover:text-nihongo-text hover:bg-nihongo-bg transition-all duration-200"
                  >
                    <Settings size={20} />
                    <span className="font-medium">Admin</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-nihongo-text-muted hover:text-nihongo-accent hover:bg-nihongo-bg transition-all duration-200"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-nihongo-text-muted hover:text-nihongo-primary hover:bg-nihongo-bg transition-all duration-200"
              >
                <LogIn size={20} />
                <span className="font-medium">Sign In</span>
              </Link>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
