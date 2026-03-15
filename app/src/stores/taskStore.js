import { create } from 'zustand';

const useTaskStore = create((set) => ({
  currentTask: null,
  taskStatus: 'idle',
  logs: [],

  setCurrentTask: (task) => set({ currentTask: task }),

  setTaskStatus: (status) => set({ taskStatus: status }),

  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),

  clearLogs: () => set({ logs: [] }),
}));

export default useTaskStore;
