import React, { createContext, useState, useEffect } from 'react';
import { fetchAPI } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('staff_token');
    if (token) {
      fetchAPI('/auth/me')
        .then((res) => {
          if (res && res.user) {
            setUser(res.user);
          } else {
            localStorage.removeItem('staff_token');
            setUser(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('staff_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('staff_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (username, password, name, role) => {
    return await fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, name, role }),
    });
  };

  const logout = () => {
    localStorage.removeItem('staff_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
