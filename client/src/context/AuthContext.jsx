import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Start from whatever is saved in the browser, so a refresh keeps you logged in
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Ask the server who we really are. Fixes a stale role, and logs out an
  // expired token or a deleted account.
  const refreshUser = async () => {
    try {
      const res = await api.get('/api/auth/me');
      const fresh = { id: res.data.id, username: res.data.username, role: res.data.role };
      localStorage.setItem('user', JSON.stringify(fresh));
      setUser(fresh);
      return res.data;
    } catch (err) {
      if (err.response?.status === 401) logout();
      return null;
    }
  };

  // Once, when the app opens
  useEffect(() => {
    if (localStorage.getItem('token')) refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);