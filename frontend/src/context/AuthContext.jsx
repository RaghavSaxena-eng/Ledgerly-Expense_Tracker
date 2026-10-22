import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  const applySession = useCallback((data) => {
    if (data.token) setToken(data.token);
    setUser(data.user);
    setOrg(data.organization);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setOrg(null);
  }, []);

  const refresh = useCallback(async () => {
    const data = await api.get('/auth/me');
    applySession(data);
    return data;
  }, [applySession]);

  useEffect(() => {
    if (!getToken()) return;
    refresh()
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [refresh, logout]);

  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      org,
      loading,
      refresh,
      logout,
      setOrg,
      login: async (email, password) => applySession(await api.post('/auth/login', { email, password })),
      register: async (payload) => applySession(await api.post('/auth/register', payload)),
    }),
    [user, org, loading, refresh, logout, applySession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
