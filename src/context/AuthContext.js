import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { authAPI } from '../services/api';
import { socketService } from '../services/socket';

let SecureStore;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      let token;
      if (Platform.OS === 'web') {
        token = localStorage.getItem('auth_token');
      } else {
        token = await SecureStore.getItemAsync('auth_token');
      }
      if (token) {
        const { data } = await authAPI.getProfile();
        setUser(data.user || data);
        socketService.connect(token);
      }
    } catch (err) {
      console.log('Auth load error:', err.message);
      await clearToken();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    const userData = data.user || data;
    const token = data.token;
    // Customer app — allow customer role (and driver too, but not admin)
    if (userData.role === 'admin') {
      throw new Error('Please use the Admin app to login');
    }
    await saveToken(token);
    setUser(userData);
    socketService.connect(token);
    return data;
  };

  const register = async (name, email, password, phone, stateId, cityId) => {
    const payload = { name, email, password, phone, role: 'customer' };
    if (stateId) payload.state_id = stateId;
    if (cityId) payload.city_id = cityId;
    const { data } = await authAPI.register(payload);
    const userData = data.user || data;
    const token = data.token;
    await saveToken(token);
    setUser(userData);
    socketService.connect(token);
    return data;
  };

  const logout = async () => {
    socketService.disconnect();
    await clearToken();
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  };

  const saveToken = async (token) => {
    if (Platform.OS === 'web') {
      localStorage.setItem('auth_token', token);
    } else {
      await SecureStore.setItemAsync('auth_token', token);
    }
  };

  const clearToken = async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('auth_token');
    } else {
      await SecureStore.deleteItemAsync('auth_token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
