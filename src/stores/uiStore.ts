import { create } from 'zustand';

interface UIState {
    isImportModalOpen: boolean;
    openImportModal: () => void;
    closeImportModal: () => void;
    toggleImportModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isImportModalOpen: false,
    openImportModal: () => set({ isImportModalOpen: true }),
    closeImportModal: () => set({ isImportModalOpen: false }),
    toggleImportModal: () => set((state) => ({ isImportModalOpen: !state.isImportModalOpen })),
}));
