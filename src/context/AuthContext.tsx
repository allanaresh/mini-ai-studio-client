import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/User';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAndSetToken = async () => {
      console.log('AuthContext - Initializing auth state check');
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      console.log('Checking auth state:', { 
        hasToken: !!savedToken, 
        hasUser: !!savedUser,
        tokenLength: savedToken?.length
      });

      if (!savedToken || !savedUser) {
        console.log('No saved auth state found');
        if (savedToken) localStorage.removeItem('token');
        if (savedUser) localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        console.log('Verifying token with server...');
        const isValid = await authService.verifyToken(savedToken);
        console.log('Token verification result:', isValid);
        
        if (isValid) {
          console.log('Token is valid, restoring session');
          let parsedUser;
          try {
            parsedUser = JSON.parse(savedUser);
            setToken(savedToken);
            setUser(parsedUser);
            console.log('Session restored successfully');
          } catch (parseError) {
            console.error('Error parsing saved user:', parseError);
            logout();
          }
        } else {
          console.log('Token is invalid, cleaning up...');
          logout();
        }
      } catch (error) {
        console.error('Error during token verification:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifyAndSetToken();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    console.log('Logging out...');
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('Auth state cleared');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};