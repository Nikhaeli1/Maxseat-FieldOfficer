import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginEnforcer, logoutEnforcer, saveToken, getToken } from '../api/apiService';

const AuthContext = createContext(null);

const USER_KEY = '@maxseat_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true while restoring session

  // ── Restore persisted session on app start ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token    = await getToken();
        const userJson = await AsyncStorage.getItem(USER_KEY);
        if (token && userJson) {
          setUser(JSON.parse(userJson));
        }
      } catch (_) {
        // Corrupted storage — force fresh login
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = async (username, password) => {
    const data = await loginEnforcer(username, password);
    if (!data.success) throw new Error(data.error || 'Login failed.');
    await saveToken(data.token);
    const profile = {
      username:     data.username,
      full_name:    data.full_name,
      badge:        data.badge,
      precinct:     data.precinct,
      shift_status: data.shift_status,
    };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = async () => {
    await logoutEnforcer();
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};