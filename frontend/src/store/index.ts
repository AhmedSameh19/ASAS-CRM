import { create } from 'zustand'

export interface User {
  id: number;
  email: string;
  name: string;
  role?: string;
  requires_password_change?: boolean;
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // User profile (non-sensitive) is still stored in localStorage for instant UI on refresh.
  // The JWT itself lives only in an HttpOnly cookie — never readable by JavaScript.
  user: typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || 'null')
    : null,

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('user');
    set({ user: null });
  },
}))
