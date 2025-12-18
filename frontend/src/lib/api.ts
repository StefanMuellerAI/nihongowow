const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper to get token from localStorage
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nihongowow_token');
}

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Use provided token or get from storage
  const authToken = token || getStoredToken();
  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    
    // Handle Pydantic validation errors (422) which return an array of error details
    if (Array.isArray(error.detail)) {
      // Extract the first validation error message
      const firstError = error.detail[0];
      const message = firstError?.msg || firstError?.message || 'Validation error';
      throw new Error(message);
    }
    
    // Handle string error messages
    if (typeof error.detail === 'string') {
      throw new Error(error.detail);
    }
    
    throw new Error('An error occurred');
  }
  
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json();
}

// Auth types
export interface MFARequired {
  mfa_required: boolean;
  email: string;
  message: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  is_email_verified: boolean;
  mfa_enabled: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  email: string;
}

export interface EmailConfirmResponse {
  success: boolean;
  message: string;
}

// Auth API
export const authAPI = {
  login: (email: string, password: string, website?: string) =>
    fetchAPI<Token | MFARequired>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, website }),
    }),
  
  register: (username: string, email: string, password: string, website?: string, invitationToken?: string) =>
    fetchAPI<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, website, invitation_token: invitationToken }),
    }),
  
  verifyMFA: (email: string, code: string) =>
    fetchAPI<Token>('/api/auth/verify-mfa', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),
  
  resendMFA: (email: string) =>
    fetchAPI<{ success: boolean; message: string }>('/api/auth/resend-mfa', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  
  confirmEmail: (token: string) =>
    fetchAPI<EmailConfirmResponse>('/api/auth/confirm-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  
  resendVerification: (email: string) =>
    fetchAPI<{ success: boolean; message: string }>('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  
  getCurrentUser: () =>
    fetchAPI<UserInfo>('/api/auth/me'),
  
  // Legacy method for compatibility
  getMe: (token: string) =>
    fetchAPI<UserInfo>('/api/auth/me', { token }),
};

// Score types
export interface TodayScores {
  quiz: number;
  salad: number;
  lines: number;
}

export interface ScoreEntry {
  id: string;
  game_type: string;
  date: string;
  score: number;
  updated_at: string;
}

export interface ScoreHistory {
  scores: ScoreEntry[];
}

// Scores API
export const scoresAPI = {
  update: (gameType: 'quiz' | 'salad' | 'lines', score: number) =>
    fetchAPI<ScoreEntry>('/api/scores/update', {
      method: 'POST',
      body: JSON.stringify({ game_type: gameType, score }),
    }),
  
  getTodayScores: () =>
    fetchAPI<TodayScores>('/api/scores/today'),
  
  getBestScores: () =>
    fetchAPI<TodayScores>('/api/scores/best'),
  
  getMyScores: (gameType?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (gameType) params.set('game_type', gameType);
    if (limit) params.set('limit', limit.toString());
    const query = params.toString();
    return fetchAPI<ScoreHistory>(`/api/scores/me${query ? `?${query}` : ''}`);
  },
};

// Vocabulary types
export interface Vocabulary {
  id: string;
  expression: string;
  reading: string;
  meaning: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

export interface VocabularyListResponse {
  items: Vocabulary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface VocabularyCreate {
  expression: string;
  reading: string;
  meaning: string;
  tags?: string;
}

// Vocabulary API
export const vocabularyAPI = {
  getAll: (params?: { page?: number; page_size?: number; search?: string; tags?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.tags) searchParams.set('tags', params.tags);
    
    const query = searchParams.toString();
    return fetchAPI<VocabularyListResponse>(`/api/vocabulary${query ? `?${query}` : ''}`);
  },
  
  getById: (id: string) =>
    fetchAPI<Vocabulary>(`/api/vocabulary/${id}`),
  
  create: (data: VocabularyCreate, token?: string) =>
    fetchAPI<Vocabulary>('/api/vocabulary', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),
  
  update: (id: string, data: Partial<VocabularyCreate>, token?: string) =>
    fetchAPI<Vocabulary>(`/api/vocabulary/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),
  
  delete: (id: string, token?: string) =>
    fetchAPI<void>(`/api/vocabulary/${id}`, {
      method: 'DELETE',
      token,
    }),
  
  getTags: () =>
    fetchAPI<string[]>('/api/vocabulary/tags'),
  
  getRandom: (count?: number) =>
    fetchAPI<Vocabulary[]>(`/api/vocabulary/random${count ? `?count=${count}` : ''}`),
  
  importCSV: async (file: File, token?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const authToken = token || getStoredToken();
    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${API_URL}/api/vocabulary/import`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Import failed' }));
      throw new Error(error.detail);
    }
    
    return response.json() as Promise<{ imported: number; skipped: number; errors: string[] }>;
  },
};

// Quiz types
export interface QuizQuestion {
  vocabulary_id: string;
  question: string;
  mode: 'to_japanese' | 'to_english' | 'fill_in_blank';
  question_type: 'text' | 'multiple_choice';
  options: string[] | null;
  // Fields for fill_in_blank mode:
  display_text: string | null;
  gap_indices: number[] | null;
  gap_count: number | null;
  tts_text: string | null;  // Full word for TTS audio hint
}

export interface QuizResult {
  correct: boolean;
  correct_answer: string;
  user_answer: string;
}

export interface HintResponse {
  hint: string;
  available: boolean;
}

// Quiz API
export const quizAPI = {
  getRandomQuestion: (tags?: string) => {
    const params = tags ? `?tags=${encodeURIComponent(tags)}` : '';
    return fetchAPI<QuizQuestion>(`/api/quiz/random${params}`);
  },
  
  checkAnswer: (vocabularyId: string, answer: string, mode: string) =>
    fetchAPI<QuizResult>('/api/quiz/check', {
      method: 'POST',
      body: JSON.stringify({
        vocabulary_id: vocabularyId,
        answer,
        mode,
      }),
    }),
  
  getHint: (vocabularyId: string, mode: string) =>
    fetchAPI<HintResponse>('/api/quiz/hint', {
      method: 'POST',
      body: JSON.stringify({
        vocabulary_id: vocabularyId,
        mode,
      }),
    }),
  
  getTTS: async (text: string): Promise<Blob> => {
    const response = await fetch(`${API_URL}/api/quiz/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'TTS failed' }));
      throw new Error(error.detail);
    }
    
    return response.blob();
  },
};

// Kana types
export interface KanaItem {
  romaji: string;
  kana: string;
}

export interface KanaListResponse {
  hiragana: KanaItem[];
  katakana: KanaItem[];
}

// Kana API
export const kanaAPI = {
  getAll: () =>
    fetchAPI<KanaListResponse>('/api/kana'),
  
  getRandom: (type: 'hiragana' | 'katakana' | 'mixed', count?: number) => {
    const params = new URLSearchParams({ type });
    if (count) params.set('count', count.toString());
    return fetchAPI<{ kana: KanaItem[]; count: number }>(`/api/kana/random?${params}`);
  },
};

// Settings types
export interface SettingsResponse {
  settings: Record<string, string>;
}

// Settings API
export const settingsAPI = {
  getAll: () =>
    fetchAPI<SettingsResponse>('/api/settings'),
  
  get: (key: string) =>
    fetchAPI<{ key: string; value: string }>(`/api/settings/${key}`),
  
  update: (key: string, value: string, token?: string) =>
    fetchAPI<{ key: string; value: string }>(`/api/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
      token,
    }),
};

// Admin types - Invitations
export interface Invitation {
  id: string;
  email: string;
  accepted: boolean;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
  invited_by_username: string;
}

export interface InvitationListResponse {
  items: Invitation[];
  total: number;
}

// Admin types - Users
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  is_email_verified: boolean;
  mfa_enabled: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface UserListResponse {
  items: AdminUser[];
  total: number;
}

// Admin types - Cache
export interface HintCacheItem {
  id: string;
  vocabulary_id: string;
  expression: string;
  reading: string;
  meaning: string;
  mode: string;
  hint: string;
  created_at: string;
}

export interface HintCacheListResponse {
  items: HintCacheItem[];
  total: number;
}

export interface TTSCacheItem {
  id: string;
  text: string;
  created_at: string;
}

export interface TTSCacheListResponse {
  items: TTSCacheItem[];
  total: number;
}

export interface CacheStats {
  hint_count: number;
  tts_count: number;
}

// Admin API
export const adminAPI = {
  // Invitations
  createInvitation: (email: string) =>
    fetchAPI<Invitation>('/api/admin/invitations', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  
  getInvitations: () =>
    fetchAPI<InvitationListResponse>('/api/admin/invitations'),
  
  deleteInvitation: (id: string) =>
    fetchAPI<void>(`/api/admin/invitations/${id}`, {
      method: 'DELETE',
    }),
  
  resendInvitation: (id: string) =>
    fetchAPI<Invitation>(`/api/admin/invitations/${id}/resend`, {
      method: 'POST',
    }),
  
  // Users
  getUsers: () =>
    fetchAPI<UserListResponse>('/api/admin/users'),
  
  deleteUser: (id: string) =>
    fetchAPI<void>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    }),
  
  resendUserVerification: (id: string) =>
    fetchAPI<AdminUser>(`/api/admin/users/${id}/resend-verification`, {
      method: 'POST',
    }),
  
  // Cache Management
  getCacheStats: () =>
    fetchAPI<CacheStats>('/api/admin/cache/stats'),
  
  getHintCache: () =>
    fetchAPI<HintCacheListResponse>('/api/admin/cache/hints'),
  
  updateHintCache: (id: string, hint: string) =>
    fetchAPI<HintCacheItem>(`/api/admin/cache/hints/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ hint }),
    }),
  
  deleteHintCache: (id: string) =>
    fetchAPI<void>(`/api/admin/cache/hints/${id}`, {
      method: 'DELETE',
    }),
  
  clearAllHintCache: () =>
    fetchAPI<void>('/api/admin/cache/hints', {
      method: 'DELETE',
    }),
  
  getTTSCache: () =>
    fetchAPI<TTSCacheListResponse>('/api/admin/cache/tts'),
  
  getTTSAudio: async (id: string): Promise<Blob> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('nihongowow_token') : null;
    
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}/api/admin/cache/tts/${id}/audio`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch audio');
    }
    
    return response.blob();
  },
  
  deleteTTSCache: (id: string) =>
    fetchAPI<void>(`/api/admin/cache/tts/${id}`, {
      method: 'DELETE',
    }),
  
  clearAllTTSCache: () =>
    fetchAPI<void>('/api/admin/cache/tts', {
      method: 'DELETE',
    }),
};
