// components/nerd-modal/useModalStore.ts

import { create } from "zustand";

type ModalState = {
  isOpen: boolean;
  content: React.ReactNode | null;
  open: (content: React.ReactNode) => void;
  close: () => void;
};

export const useModalStore = create<ModalState>((set, get) => ({
  isOpen: false,
  content: null,

  open: (content: React.ReactNode) => {
    // Only update if not already open with the same content
    const current = get();
    if (!current.isOpen || current.content !== content) {
      set({ content, isOpen: true });
    }
  },

  close: () => {
    // Only update if currently open
    const current = get();
    if (current.isOpen) {
      set({ content: null, isOpen: false });
    }
  },
}));
