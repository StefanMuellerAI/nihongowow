'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppFooter from '@/components/AppFooter';
import { adminAPI, Invitation } from '@/lib/api';
import { getToken, removeToken } from '@/lib/auth';
import { 
  Loader2, 
  Trash2, 
  Mail,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  UserPlus,
  AlertCircle
} from 'lucide-react';

export default function AdminInvitationsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isResending, setIsResending] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkAuthAndLoadInvitations();
  }, []);

  const checkAuthAndLoadInvitations = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await adminAPI.getInvitations();
      setInvitations(response.items);
    } catch (err) {
      console.error('Failed to load invitations:', err);
      setMessage({ type: 'error', text: 'Failed to load invitations' });
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    removeToken();
    router.push('/');
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setIsSending(true);
    setMessage(null);

    try {
      const invitation = await adminAPI.createInvitation(newEmail.trim());
      setInvitations([invitation, ...invitations]);
      setNewEmail('');
      setMessage({ type: 'success', text: `Invitation sent to ${invitation.email}` });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to send invitation' });
    }

    setIsSending(false);
  };

  const handleDeleteInvitation = async (id: string) => {
    setIsDeleting(id);
    setMessage(null);

    try {
      await adminAPI.deleteInvitation(id);
      setInvitations(invitations.filter(i => i.id !== id));
      setMessage({ type: 'success', text: 'Invitation deleted' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete invitation' });
    }

    setIsDeleting(null);
  };

  const handleResendInvitation = async (id: string) => {
    setIsResending(id);
    setMessage(null);

    try {
      const updated = await adminAPI.resendInvitation(id);
      setInvitations(invitations.map(i => i.id === id ? updated : i));
      setMessage({ type: 'success', text: `Invitation resent to ${updated.email}` });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to resend invitation' });
    }

    setIsResending(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getStatus = (invitation: Invitation) => {
    if (invitation.accepted) {
      return { label: 'Accepted', color: 'green', icon: CheckCircle };
    }
    if (isExpired(invitation.expires_at)) {
      return { label: 'Expired', color: 'red', icon: XCircle };
    }
    return { label: 'Pending', color: 'amber', icon: Clock };
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
          <div className="max-w-6xl mx-auto">
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <UserPlus className="w-8 h-8 text-nihongo-primary" />
                <h1 className="text-3xl font-bold gradient-text">Invitations</h1>
              </div>
              <p className="text-nihongo-text-muted">Invite new users to join NihongoWOW</p>
            </header>

          {/* Send Invitation Form */}
          <div className="card mb-8">
            <h2 className="text-lg font-bold text-nihongo-text mb-4 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send New Invitation
            </h2>
            <form onSubmit={handleSendInvitation} className="flex gap-4">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-nihongo-text-muted" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="input-with-icon w-full"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSending || !newEmail.trim()}
                className="btn btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Send Invitation
              </button>
            </form>
          </div>

          {/* Message */}
          {message && (
            <div className={`flex items-center gap-3 p-4 rounded-lg mb-6 ${
              message.type === 'success' 
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              {message.text}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-nihongo-primary/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-nihongo-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-nihongo-text">{invitations.length}</p>
                  <p className="text-sm text-nihongo-text-muted">Total Invitations</p>
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
                    {invitations.filter(i => i.accepted).length}
                  </p>
                  <p className="text-sm text-nihongo-text-muted">Accepted</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-nihongo-text">
                    {invitations.filter(i => !i.accepted && !isExpired(i.expires_at)).length}
                  </p>
                  <p className="text-sm text-nihongo-text-muted">Pending</p>
                </div>
              </div>
            </div>
          </div>

          {/* Invitations Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-nihongo-border">
                    <th className="text-left py-4 px-4 text-sm font-medium text-nihongo-text-muted">Email</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-nihongo-text-muted">Status</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-nihongo-text-muted">Invited By</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-nihongo-text-muted">Sent</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-nihongo-text-muted">Expires</th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-nihongo-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((invitation) => {
                    const status = getStatus(invitation);
                    const StatusIcon = status.icon;
                    
                    return (
                      <tr key={invitation.id} className="border-b border-nihongo-border/50 hover:bg-nihongo-bg/50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-nihongo-text">
                            <Mail className="w-4 h-4 text-nihongo-text-muted" />
                            {invitation.email}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-${status.color}-500/10 text-${status.color}-500`}
                                style={{
                                  backgroundColor: status.color === 'green' ? 'rgba(34, 197, 94, 0.1)' : 
                                                  status.color === 'red' ? 'rgba(239, 68, 68, 0.1)' : 
                                                  'rgba(245, 158, 11, 0.1)',
                                  color: status.color === 'green' ? 'rgb(34, 197, 94)' : 
                                        status.color === 'red' ? 'rgb(239, 68, 68)' : 
                                        'rgb(245, 158, 11)'
                                }}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-nihongo-text-muted">
                          {invitation.invited_by_username}
                        </td>
                        <td className="py-4 px-4 text-nihongo-text-muted text-sm">
                          {formatDate(invitation.created_at)}
                        </td>
                        <td className="py-4 px-4 text-nihongo-text-muted text-sm">
                          {invitation.accepted ? (
                            <span className="text-green-500">
                              Accepted {invitation.accepted_at && formatDate(invitation.accepted_at)}
                            </span>
                          ) : (
                            formatDate(invitation.expires_at)
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!invitation.accepted && (
                              <button
                                onClick={() => handleResendInvitation(invitation.id)}
                                disabled={isResending === invitation.id}
                                className="p-2 text-nihongo-text-muted hover:text-nihongo-primary hover:bg-nihongo-primary/10 
                                         rounded-lg transition-colors disabled:opacity-50"
                                title="Resend invitation"
                              >
                                {isResending === invitation.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteInvitation(invitation.id)}
                              disabled={isDeleting === invitation.id}
                              className="p-2 text-nihongo-text-muted hover:text-red-500 hover:bg-red-500/10 
                                       rounded-lg transition-colors disabled:opacity-50"
                              title="Delete invitation"
                            >
                              {isDeleting === invitation.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {invitations.length === 0 && (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-nihongo-text-muted mx-auto mb-4" />
                <p className="text-nihongo-text-muted">No invitations sent yet</p>
                <p className="text-sm text-nihongo-text-muted mt-1">
                  Use the form above to invite new users
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <AppFooter />
      </div>
    </div>
  );
}
