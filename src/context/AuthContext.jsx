import { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, if a token is already saved (from a previous visit),
  // ask the API who it belongs to so refreshing the page doesn't log you out.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    apiClient
      .get('/user')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await apiClient.post('/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  }

  async function register(name, email, password, passwordConfirmation) {
    const res = await apiClient.post('/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  }

  async function logout() {
    try {
      await apiClient.post('/logout');
    } catch {
      // Even if the request fails (e.g. token already expired),
      // still clear the local session so the UI reflects logged-out state.
    }
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook so components just call useAuth() instead of importing
// createContext/useContext everywhere.
export function useAuth() {
  return useContext(AuthContext);
}
