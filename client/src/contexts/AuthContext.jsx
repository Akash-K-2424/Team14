import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

/**
 * AuthProvider
 * Manages authentication state across the app.
 * Stores JWT token and user data in localStorage.
 */
export function AuthProvider({ children }) {
  // Initialize from LocalStorage for immediate authenticated state
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('resuai_user');
      const parsed = (savedUser && savedUser !== "undefined") ? JSON.parse(savedUser) : null;
      if (parsed) console.log('AuthTrace: Loaded user from localStorage', parsed.email);
      return parsed;
    } catch (e) {
      console.error('AuthTrace: Failed to parse user from localStorage:', e);
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('resuai_token'));
  const [loading, setLoading] = useState(!user && !!localStorage.getItem('resuai_token'));

  // Logout - defined early to avoid ReferenceErrors
  const logout = () => {
    console.log('AuthTrace: Logging out...');
    localStorage.removeItem('resuai_token');
    localStorage.removeItem('resuai_user');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  // Shared success handler for all auth methods
  const handleAuthSuccess = (data) => {
    console.log('AuthTrace: Authentication successful, updating state...', data.user.email);
    localStorage.setItem('resuai_token', data.token);
    localStorage.setItem('resuai_user', JSON.stringify(data.user));
    
    // Update all states simultaneously
    setToken(data.token);
    setUser(data.user);
    setLoading(false); 
    
    return data;
  };

  // Verify token in background ONLY if we don't have fresh data
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        console.log('AuthTrace: No token, skipping verify');
        setLoading(false);
        setUser(null);
        return;
      }

      // If we already have a user and we're NOT in a loading state, 
      // it means we just logged in. Skip redundant verification.
      if (user && !loading) {
        console.log('AuthTrace: User already present, skipping background verify');
        return;
      }

      try {
        console.log('AuthTrace: Verifying token in background...');
        const { data } = await api.get('/auth/me');
        console.log('AuthTrace: Background verify success');
        setUser(data.user);
        localStorage.setItem('resuai_user', JSON.stringify(data.user));
      } catch (error) {
        console.error('AuthTrace: Background verify failed', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Login
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return handleAuthSuccess(data);
  };

  // Signup
  const signup = async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password });
    return handleAuthSuccess(data);
  };

  // Google Login
  const googleLogin = async (token) => {
    const { data } = await api.post('/auth/google', { token });
    return handleAuthSuccess(data);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    googleLogin,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access auth context.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
