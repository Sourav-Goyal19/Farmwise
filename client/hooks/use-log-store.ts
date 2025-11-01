import { create } from "zustand";

type LogStore = {
  isOpen: boolean;
  onOpen: (id?: string) => void;
  onClose: () => void;
  id?: string;
};

export const useNewLog = create<LogStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true, id: undefined }),
  onClose: () => set({ isOpen: false, id: undefined }),
  id: undefined,
}));

export const useOpenLog = create<LogStore>((set) => ({
  isOpen: false,
  onOpen: (id?: string) => set({ isOpen: true, id }),
  onClose: () => set({ isOpen: false, id: undefined }),
  id: undefined,
}));
