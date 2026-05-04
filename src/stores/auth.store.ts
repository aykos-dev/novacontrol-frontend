import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'VIEWER';
}

const telegramAuthInflight = new Map<
  string,
  Promise<{ access_token: string }>
>();

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
    let inflight = telegramAuthInflight.get(initData);
    if (!inflight) {
      inflight = api
        .post('/auth/telegram', { initData })
        .then((r) => r.data as { access_token: string })
        .finally(() => {
          telegramAuthInflight.delete(initData);
        });
      telegramAuthInflight.set(initData, inflight);
    }
    const data = await inflight;
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
