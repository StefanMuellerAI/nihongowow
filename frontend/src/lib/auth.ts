'use client';

const TOKEN_KEY = 'nihongowow_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// Hook-like function to check auth status and redirect if needed
export function requireAuth(redirectTo: string = '/login'): boolean {
  if (typeof window === 'undefined') return false;
  
  if (!isAuthenticated()) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

// Parse JWT token to get user info (without verification)
export function parseToken(token: string): { username: string; exp: number } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return {
      username: payload.sub,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

// Check if token is expired
export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) return true;
  
  const parsed = parseToken(token);
  if (!parsed) return true;
  
  // Token expires if current time is past expiration
  return Date.now() >= parsed.exp * 1000;
}

// Get current username from token
export function getCurrentUsername(): string | null {
  const token = getToken();
  if (!token) return null;
  
  const parsed = parseToken(token);
  return parsed?.username || null;
}
