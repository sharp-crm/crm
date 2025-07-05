import axios from 'axios';
import { create } from 'zustand';

interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId?: string;
  createdBy?: string;
  phoneNumber?: string; // optional for extension
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (payload: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId?: string;
    createdBy?: string;
    phoneNumber?: string;
    accessToken: string;
    refreshToken: string;
  }) => void;
  logout: () => void;
  initializeFromSession: () => void;
  setUser: (updated: Partial<User>) => void; // ✅ NEW
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,

  login: (payload) => {
    const { userId, email, firstName, lastName, role, tenantId, createdBy, phoneNumber, accessToken, refreshToken } = payload;
    const user = { userId, email, firstName, lastName, role, tenantId, createdBy, phoneNumber };
    set({ user, accessToken, refreshToken });

    // Store in both session and local storage
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', refreshToken);

    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  logout: async () => {
    try {
      await axios.post('http://localhost:3000/api/auth/logout');
    } catch (err) {
      console.warn('Logout API failed or not implemented.');
    }

    set({ user: null, accessToken: null, refreshToken: null });
    sessionStorage.clear();
    localStorage.clear();

    window.location.href = '/login';
  },

  initializeFromSession: () => {
    // Try session storage first
    let userStr = sessionStorage.getItem('user');
    let accessToken = sessionStorage.getItem('accessToken');
    let refreshToken = sessionStorage.getItem('refreshToken');

    // If not in session storage, try local storage
    if (!userStr || !accessToken || !refreshToken) {
      userStr = localStorage.getItem('user');
      accessToken = localStorage.getItem('accessToken') || localStorage.getItem('authToken'); // Legacy support
      refreshToken = localStorage.getItem('refreshToken');
    }

          if (userStr && accessToken && refreshToken) {
        try {
          const user = JSON.parse(userStr);
          set({ user, accessToken, refreshToken });
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          // Clear invalid data
          sessionStorage.clear();
          localStorage.clear();
        }
      }
  },

  // ✅ Manually update user fields like name, phone after PUT
  setUser: (updated) => {
    set((state) => {
      if (!state.user) return {};
      const newUser = { ...state.user, ...updated };
      sessionStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('user', JSON.stringify(newUser));
      return { user: newUser };
    });
  }
}));

export default useAuthStore;