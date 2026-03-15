import { create } from 'zustand';

const useSettingsStore = create((set) => ({
  smtp: null,
  antiBanConfig: null,

  setSmtp: (smtp) => set({ smtp }),

  setAntiBanConfig: (config) => set({ antiBanConfig: config }),
}));

export default useSettingsStore;
