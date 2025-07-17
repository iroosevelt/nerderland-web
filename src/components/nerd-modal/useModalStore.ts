import { create } from "zustand";

type ModalState = {
  isOpen: boolean;
  content: React.ReactNode | null;
  open: (content: React.ReactNode) => void;
  close: () => void;
};

export const useModalStore = create<ModalState>((set) => {
  const open = (content: React.ReactNode) =>
    set(() => ({ content, isOpen: true }));
  const close = () => set(() => ({ content: null, isOpen: false }));

  return {
    isOpen: false,
    content: null,
    open,
    close,
  };
});
