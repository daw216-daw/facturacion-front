import { createContext, useContext, useEffect, useState } from 'react';
import api from '../../../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- LOGIN ---
  const login = async (email, password) => {
    const { data } = await api.post('/login', { email, password });

    localStorage.setItem('token', data.token);
    api.defaults.headers.common.Authorization = `Bearer ${data.token}`;

    setUser(data.user);
    return data.user;
  };

  // --- LOGOUT (NUEVO) ---
  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      // aunque falle, limpiamos igual
    }

    localStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;

    setUser(null);
  };

  // --- /me ---
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    api.get('/me')
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
