'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { adminAPI, AdminUser } from '@/lib/api';
import { getToken, removeToken } from '@/lib/auth';
import { 
  Loader2, 
  Trash2, 
  Users, 
  Shield, 
  ShieldCheck,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResending, setIsResending] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkAuthAndLoadUsers();
  }, []);

  const checkAuthAndLoadUsers = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await adminAPI.getUsers();
      setUsers(response.items);
    } catch (err) {
      console.error('Failed to load users:', err);
      setMessage({ type: 'error', text: 'Failed to load users' });
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    removeToken();
    router.push('/');
  };

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true);
    setMessage(null);

    try {
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      setMessage({ type: 'success', text: 'User deleted successfully' });
      setDeleteConfirm(null);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete user' });
    }

    setIsDeleting(false);
  };

  const handleResendVerification = async (userId: string, userEmail: string) => {
    setIsResending(userId);
    setMessage(null);

    try {
      await adminAPI.resendUserVerification(userId);
      setMessage({ type: 'success', text: `Verification email sent to ${userEmail}` });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to send verification email' });
    }

    setIsResending(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
      
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-nihongo-primary" />
              <h1 className="text-3xl font-bold gradient-text">User Management</h1>
            </div>
            <p className="text-nihongo-text-muted">View and manage all registered users</p>
          </header>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg mb-6 ${
              message.type === 'success' 
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-nihongo-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-nihongo-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-nihongo-text">{users.length}</p>
                  <p className="text-sm text-nihongo-text-muted">Total Users</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-nihongo-text">
                    {users.filter(u => u.is_email_verified).length}
                  </p>
                  <p className="text-sm text-nihongo-text-muted">Verified</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-nihongo-text">
                    {users.filter(u => !u.is_email_verified).length}
                  </p>
                  <p className="text-sm text-nihongo-text-muted">Unverified</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-nihongo-text">
                    {users.filter(u => u.is_admin).length}
                  </p>
                  <p className="text-sm text-nihongo-text-muted">Admins</p>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-nihongo-border">
                    <th className="text-left py-4 px-4 text-sm font-medium text-nihongo-text-muted">User</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-nihongo-text-muted">Email</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-nihongo-text-muted">Status</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-nihongo-text-muted">Joined</th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-nihongo-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-nihongo-border/50 hover:bg-nihongo-bg/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nihongo-primary to-pink-600 
                                        flex items-center justify-center text-sm font-bold text-white">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-nihongo-text">{user.username}</p>
                            {user.is_admin && (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                                <Shield className="w-3 h-3" />
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-nihongo-text-muted">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {user.is_email_verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-500">
                            <XCircle className="w-3 h-3" />
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-nihongo-text-muted">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Resend verification button for unverified users */}
                          {!user.is_email_verified && (
                            <button
                              onClick={() => handleResendVerification(user.id, user.email)}
                              disabled={isResending === user.id}
                              className="p-2 text-nihongo-text-muted hover:text-nihongo-primary hover:bg-nihongo-primary/10 
                                       rounded-lg transition-colors disabled:opacity-50"
                              title="Resend verification email"
                            >
                              {isResending === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          
                          {/* Delete button */}
                          {deleteConfirm === user.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={isDeleting}
                                className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 
                                         disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isDeleting ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  'Confirm'
                                )}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={isDeleting}
                                className="px-3 py-1 text-sm bg-nihongo-bg text-nihongo-text-muted rounded-lg 
                                         hover:text-nihongo-text disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              className="p-2 text-nihongo-text-muted hover:text-red-500 hover:bg-red-500/10 
                                       rounded-lg transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-nihongo-text-muted mx-auto mb-4" />
                <p className="text-nihongo-text-muted">No users found</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal for dangerous operations */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-nihongo-text">Delete User?</h3>
                <p className="text-sm text-nihongo-text-muted">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-nihongo-text-muted mb-6">
              Are you sure you want to delete this user? All their data including scores and progress will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteUser(deleteConfirm)}
                disabled={isDeleting}
                className="flex-1 btn bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Delete User'
                )}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 btn bg-nihongo-bg text-nihongo-text-muted hover:text-nihongo-text"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
