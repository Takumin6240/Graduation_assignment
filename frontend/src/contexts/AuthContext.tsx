import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { User, Admin, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');

    if (token && userType === 'student') {
      authAPI
        .getCurrentUser()
        .then((response) => {
          setUser(response.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (token && userType === 'admin') {
      const adminData = localStorage.getItem('adminData');
      if (adminData) {
        setAdmin(JSON.parse(adminData));
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const register = async (username: string, password: string, nickname: string, grade: number) => {
    const response = await authAPI.register(username, password, nickname, grade);
    const { token, user: userData } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('userType', 'student');
    setUser(userData);
  };

  const login = async (username: string, password: string) => {
    const response = await authAPI.login(username, password);
    const { token, user: userData } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('userType', 'student');
    setUser(userData);
  };

  const loginAdmin = async (username: string, password: string) => {
    const response = await authAPI.loginAdmin(username, password);
    const { token, admin: adminData } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('userType', 'admin');
    localStorage.setItem('adminData', JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('adminData');
    setUser(null);
    setAdmin(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    admin,
    login,
    loginAdmin,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!(user || admin),
    isAdmin: !!admin,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
