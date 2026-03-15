import { create } from 'zustand';

const useAuthStore = create((set) => ({
  isLoggedIn: false,
  admin: null,
  token: null,

  login: (admin, token) => {
    set({ isLoggedIn: true, admin, token });
    localStorage.setItem('admin-auth-storage', JSON.stringify({ state: { isLoggedIn: true, admin, token } }));
  },

  logout: () => {
    set({ isLoggedIn: false, admin: null, token: null });
    localStorage.removeItem('admin-auth-storage');
  },

  updateAdmin: (admin) => {
    set({ admin });
  },

  // Restore from localStorage on init
  restore: () => {
    const stored = localStorage.getItem('admin-auth-storage');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.state) {
          set(data.state);
        }
      } catch (e) {
        console.error('Failed to restore auth state:', e);
      }
    }
  },
}));

// Restore on init
useAuthStore.getState().restore();

export default useAuthStore;
