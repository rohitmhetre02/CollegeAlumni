import { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      // Ensure approvalStatus is set for students/alumni
      if (!parsedUser.approvalStatus && (parsedUser.role === 'student' || parsedUser.role === 'alumni')) {
        parsedUser.approvalStatus = 'pending';
        localStorage.setItem('user', JSON.stringify(parsedUser));
      }
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Ensure approvalStatus is included
      const userWithStatus = {
        ...user,
        approvalStatus: user.approvalStatus || (user.role === 'student' || user.role === 'alumni' ? 'pending' : 'approved')
      };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userWithStatus));
      setUser(userWithStatus);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      
      // Ensure approvalStatus is included
      const userWithStatus = {
        ...user,
        approvalStatus: user.approvalStatus || (user.role === 'student' || user.role === 'alumni' ? 'pending' : 'approved')
      };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userWithStatus));
      setUser(userWithStatus);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    setUser,
    login,
    register,
    logout,
    fetchCurrentUser,
    loading,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

