const AUTH_STORAGE_KEY = "auth_data";

export interface StoredAuthData {
  user: {
    id: number;
    username: string;
    role: string;
    email?: string;
    teamId?: number;
    isSuperAdmin?: boolean;
  };
  sessionToken?: string;
  expires: number;
}

export function getStoredAuthData(): StoredAuthData | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuthData;
    if (!parsed?.user || !parsed.expires || parsed.expires <= Date.now()) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function getSessionToken(): string | null {
  return getStoredAuthData()?.sessionToken ?? null;
}

export function getEdgeFunctionHeaders(): Record<string, string> {
  const token = getSessionToken();
  return token ? { "x-session-token": token } : {};
}

export function getRpcSessionArgs(): { p_session_token: string } {
  const token = getSessionToken();
  if (!token) {
    throw new Error("Geen actieve sessie");
  }
  return { p_session_token: token };
}
