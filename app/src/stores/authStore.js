import { create } from 'zustand';

const useAuthStore = create((set) => ({
  isLoggedIn: false,
  user: null,
  token: null,
  isActive: true, // Account active status from MongoDB

  login: (user, token) => set({
    isLoggedIn: true,
    user,
    token,
    isActive: user?.isActive !== false // Default to true if not specified
  }),

  updateUser: (user) => set({
    user,
    isActive: user?.isActive !== false
  }),

  setActive: (isActive) => set({ isActive }),

  logout: () => set({
    isLoggedIn: false,
    user: null,
    token: null,
    isActive: true
  }),
}));

export default useAuthStore;
