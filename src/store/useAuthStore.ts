import { create } from 'zustand';
import api from '@/lib/api';

interface AuthState {
    user: any | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (userData: any, token: string) => void;
    logout: () => void;
    fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
    isAuthenticated: !!(typeof window !== 'undefined' && localStorage.getItem('token')),
    login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
    },
    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
    },
    fetchProfile: async () => {
        try {
            const response = await api.get('/auth/profile');
            set({ user: response.data, isAuthenticated: true });
        } catch (error) {
            localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false });
        }
    },
}));
