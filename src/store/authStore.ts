import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User } from '@shared/types';
import { api } from '@/lib/api-client';
type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
};
type AuthActions = {
  register: (userData: Omit<User, 'id'>) => Promise<void>;
  login: (credentials: Pick<User, 'email' | 'password'>) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  updateUser: (userId: string, data: Partial<Pick<User, 'name' | 'password'>>) => Promise<void>;
};
const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    immer((set, get) => ({
      user: null,
      isAuthenticated: false,
      register: async (userData) => {
        const user = await api<User>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData),
        });
        set((state) => {
          state.user = user;
          state.isAuthenticated = true;
        });
      },
      login: async (credentials) => {
        const user = await api<User>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
        });
        set((state) => {
          state.user = user;
          state.isAuthenticated = true;
        });
      },
      logout: () => {
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
        });
        // Also clear the first-visit flag on logout to give a fresh experience
        localStorage.removeItem('futures-wheel-hub-has-visited');
      },
      setUser: (user) => {
        set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
        });
      },
      updateUser: async (userId, data) => {
        const updatedUser = await api<User>(`/api/users/${userId}`, {
          method: 'PUT',
          body: JSON.stringify({ ...data, userId }),
        });
        set(state => {
          if (state.user) {
            state.user.name = updatedUser.name;
          }
        });
      },
    })),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
export default useAuthStore;