import { apiClient, isMockMode, setAuthToken, clearAuthToken } from './apiClient';
import type { User, UserRole, AuthResponse, LoginRequest, SignupRequest } from '../types';

export const DEMO_USERS: Record<UserRole, User> = {
  CITIZEN: {
    id: 'user-citizen-01',
    name: 'Akshit Sharma',
    email: 'akshit@potholefix.in',
    role: 'CITIZEN',
    title: 'Civic Reporter',
    department: 'Community Volunteer',
    avatarInitials: 'AS',
  },
  AUTHORITY: {
    id: 'user-auth-01',
    name: 'Alice Sharma',
    email: 'alice@potholefix.gov.in',
    role: 'AUTHORITY',
    title: 'Commissioner of Public Works',
    department: 'Municipal Corporation Chandigarh',
    avatarInitials: 'AS',
  },
  REPAIR_TEAM: {
    id: 'user-team-01',
    name: 'Gurpreet Singh',
    email: 'gurpreet@pwd.punjab.gov.in',
    role: 'REPAIR_TEAM',
    title: 'Crew Lead',
    unit: 'PWD Asphalt Unit 04',
    avatarInitials: 'GS',
  },
};

const USER_STORAGE_KEY = 'potholefix_user';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    if (isMockMode()) {
      let chosenRole: UserRole = credentials.role || 'CITIZEN';
      const email = credentials.email.toLowerCase();

      if (!credentials.role) {
        if (email.includes('publicworks') || email.includes('gov') || email.includes('chen') || email.includes('alice')) {
          chosenRole = 'AUTHORITY';
        } else if (email.includes('asphalt') || email.includes('crew') || email.includes('unit') || email.includes('vance') || email.includes('pwd') || email.includes('gurpreet')) {
          chosenRole = 'REPAIR_TEAM';
        }
      }

      const template = DEMO_USERS[chosenRole];
      const user: User = {
        ...template,
        email: credentials.email,
      };

      const mockToken = `mock-token-${chosenRole.toLowerCase()}-${Date.now()}`;
      setAuthToken(mockToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      return {
        token: mockToken,
        tokenType: 'Bearer',
        expiresIn: 86400,
        user,
      };
    }

    // REAL API MODE: POST /auth/login
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email: credentials.email,
      password: credentials.password || 'password123',
    });

    if (response.token) {
      setAuthToken(response.token);
    }
    if (response.user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
    }

    return response;
  },

  async signup(data: SignupRequest): Promise<AuthResponse> {
    if (isMockMode()) {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: data.name,
        email: data.email,
        role: data.role || 'CITIZEN',
        avatarInitials: data.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'CR',
      };

      const mockToken = `mock-token-citizen-${Date.now()}`;
      setAuthToken(mockToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));

      return {
        token: mockToken,
        tokenType: 'Bearer',
        expiresIn: 86400,
        user: newUser,
      };
    }

    // REAL API MODE: POST /auth/signup
    const response = await apiClient.post<AuthResponse>('/auth/signup', {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role || 'CITIZEN',
    });

    if (response.token) {
      setAuthToken(response.token);
    }
    if (response.user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
    }

    return response;
  },

  async getCurrentUser(): Promise<User | null> {
    if (isMockMode()) {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return DEMO_USERS.CITIZEN;
        }
      }
      return DEMO_USERS.CITIZEN;
    }

    // REAL API MODE: GET /auth/me
    try {
      const user = await apiClient.get<User>('/auth/me');
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      return user;
    } catch {
      clearAuthToken();
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
  },

  logout(): void {
    clearAuthToken();
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
  },
};
