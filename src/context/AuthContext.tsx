import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole, LoginRequest, SignupRequest } from '../types';
import { authService, DEMO_USERS } from '../services/authService';
import { isMockMode, onUnauthorized } from '../services/apiClient';

export { DEMO_USERS };

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, explicitRole?: UserRole, password?: string) => Promise<User>;
  signup: (name: string, email: string, password?: string) => Promise<User>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // In mock mode, initialize with cached user or default to Akshit Sharma
    if (true) {
      const saved = localStorage.getItem('potholefix_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          if (isMockMode()) return DEMO_USERS.CITIZEN;
        }
      }
      if (isMockMode()) return DEMO_USERS.CITIZEN;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => !isMockMode() && !localStorage.getItem('potholefix_user'));
  const isDemo = isMockMode();

  // Listen for 401 Unauthorized events from apiClient
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      setUser(null);
    });
    return unsubscribe;
  }, []);

  // Validate session on mount if in real API mode
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      if (!isMockMode()) {
        try {
          setIsLoading(true);
          const currentUser = await authService.getCurrentUser();
          if (isMounted) {
            setUser(currentUser);
          }
        } catch {
          if (isMounted) setUser(null);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }

    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, explicitRole?: UserRole, password?: string): Promise<User> => {
      setIsLoading(true);
      try {
        const payload: LoginRequest = { email, role: explicitRole, password };
        const response = await authService.login(payload);
        setUser(response.user);
        return response.user;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const signup = useCallback(
    async (name: string, email: string, password?: string): Promise<User> => {
      setIsLoading(true);
      try {
        const payload: SignupRequest = { name, email, password, role: 'CITIZEN' };
        const response = await authService.signup(payload);
        setUser(response.user);
        return response.user;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const switchDemoRole = useCallback((role: UserRole) => {
    if (!isMockMode()) {
      console.warn('Judge Fast-Switch is disabled in Real API Mode.');
      return;
    }
    const template = DEMO_USERS[role];
    setUser(template);
    localStorage.setItem('potholefix_user', JSON.stringify(template));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        switchDemoRole,
        isDemoMode: isDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
