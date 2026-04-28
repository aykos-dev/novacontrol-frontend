import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'VIEWER';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithTelegram: (initData: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  login: async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', data.access_token);
    set({ token: data.access_token, isAuthenticated: true });
  },
  loginWithTelegram: async (initData: string) => {
    const { data } = await api.post('/auth/telegram', { initData });
    localStorage.setItem('token', data.access_token);
    set({ token: data.access_token, isAuthenticated: true });
  },
  logout: () => {
    const token = localStorage.getItem('token');
    if (token) {
      void api.post('/auth/logout').catch(() => undefined);
    }
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  fetchProfile: async () => {
    const { data } = await api.get('/auth/me');
    set({ user: data });
  },
}));
