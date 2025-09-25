import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AuthResult, keycloakAuth } from './keycloak.service';
import { TokenData, UserInfo } from './storage';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserInfo | null;
  tokens: TokenData | null;
  login: () => Promise<AuthResult>;
  logout: () => Promise<void>;
  checkAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [tokens, setTokens] = useState<TokenData | null>(null);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      const session = await keycloakAuth.getCurrentSession();
      
      if (session) {
        setIsAuthenticated(true);
        setUser(session.userInfo);
        setTokens(session.tokens);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setTokens(null);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setIsAuthenticated(false);
      setUser(null);
      setTokens(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      const result = await keycloakAuth.login();
      
      if (result.success && result.tokens) {
        setIsAuthenticated(true);
        setUser(result.userInfo || null);
        setTokens(result.tokens);
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await keycloakAuth.logout();
      setIsAuthenticated(false);
      setUser(null);
      setTokens(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Même en cas d'erreur, on nettoie l'état local
      setIsAuthenticated(false);
      setUser(null);
      setTokens(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    tokens,
    login,
    logout,
    checkAuthState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}