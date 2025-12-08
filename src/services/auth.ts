import api from '@/lib/api';
import { AuthResponse, LoginCredentials, RegisterCredentials, User, BudgetUnit } from '@/types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', credentials);
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('auth-token');
    }
  },

  async getMe(): Promise<{ user: User; units: BudgetUnit[] }> {
    const response = await api.get<{ user: User; units: BudgetUnit[] }>('/auth/me');
    return response.data;
  },

  async refreshToken(): Promise<{ token: string }> {
    const response = await api.post<{ token: string }>('/auth/refresh');
    return response.data;
  },
};