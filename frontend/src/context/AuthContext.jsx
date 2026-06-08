import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from local storage on load
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(parsedUser);
          
          // Verify/refresh user data from backend
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
        } catch (error) {
          console.error('Session restoration failed:', error.message);
          const isParseError = error instanceof SyntaxError;
          const isAuthError = error.status === 401 || error.status === 403;
          if (isParseError || isAuthError) {
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    try {
      console.log("LOGIN REQUEST");
      const response = await api.post('/auth/login', { email, password });
      console.log("LOGIN RESPONSE", response.data);
      const { token: userToken, user: userData } = response.data;
      console.log("USER ROLE", response.data.user.role);
      console.log("TOKEN RECEIVED", userToken);
      
      localStorage.setItem('token', userToken);
      console.log("TOKEN SAVED", userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log("USER SAVED", userData);

      setToken(userToken);
      setUser(userData);
      
      return userData;
    } catch (error) {
      throw error;
    }
  };

  // Register handler
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token: userToken, user: regData } = response.data;
      
      setToken(userToken);
      setUser(regData);
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(regData));
      
      return regData;
    } catch (error) {
      throw error;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.get('/auth/logout');
    } catch (error) {
      console.error('Logout error on server:', error.message);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  // Update user profile cache
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Reusable hook to consume auth state easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
