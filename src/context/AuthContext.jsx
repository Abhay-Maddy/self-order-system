import React, { createContext, useState, useEffect } from 'react';
import { fetchAPI } from '../utils/api';
import { safeStorage } from '../utils/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = safeStorage.getItem('staff_token');
    if (token) {
      fetchAPI('/auth/me')
        .then((res) => {
          if (res && res.user) {
            setUser(res.user);
          } else {
            safeStorage.removeItem('staff_token');
            setUser(null);
          }
        })
        .catch(() => {
          safeStorage.removeItem('staff_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (usernameOrObj, password) => {
    if (typeof usernameOrObj === 'object' && usernameOrObj !== null) {
      if (usernameOrObj.token) safeStorage.setItem('staff_token', usernameOrObj.token);
      setUser(usernameOrObj.user || usernameOrObj);
      return usernameOrObj.user || usernameOrObj;
    }

    const res = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: usernameOrObj, password }),
    });
    safeStorage.setItem('staff_token', res.token);
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
    safeStorage.removeItem('staff_token');
    setUser(null);
  };


  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
