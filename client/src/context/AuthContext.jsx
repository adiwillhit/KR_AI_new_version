import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/endpoints.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await authAPI.getMe();
        setUser(data.data.user);
        localStorage.setItem('user', JSON.stringify(data.data.user));
      } catch {
        // Token invalid or expired — clear state
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    const { user: u, token: t } = data.data;
    setUser(u);
    setToken(t);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('token', t);
    return u;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    const { user: u, token: t } = data.data;
    setUser(u);
    setToken(t);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('token', t);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
