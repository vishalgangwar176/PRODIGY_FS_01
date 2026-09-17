import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading]         = useState(true); // true during initial session restore

  // Keep the axios interceptor in sync with token state
  const syncToken = (token) => {
    window.__authToken = token;
    setAccessToken(token);
  };

  // ── Restore session on app mount ────────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        syncToken(data.accessToken);
        setUser(data.user);
      } catch {
        // No valid refresh token — user must log in
        syncToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // ── Listen for forced logout from api interceptor ───────────────────────────
  useEffect(() => {
    const onForceLogout = () => {
      syncToken(null);
      setUser(null);
    };
    window.addEventListener('auth:logout', onForceLogout);
    return () => window.removeEventListener('auth:logout', onForceLogout);
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    syncToken(data.accessToken);
    setUser(data.user);
    return data;
  }, []);

  // ── Register ─────────────────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    syncToken(data.accessToken);
    setUser(data.user);
    return data;
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // best effort
    } finally {
      syncToken(null);
      setUser(null);
    }
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
