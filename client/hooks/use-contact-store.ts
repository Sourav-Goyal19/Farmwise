import { create } from "zustand";

type OpenContactState = {
  id?: string;
  isOpen: boolean;
  onOpen: (id: string) => void;
  onClose: () => void;
};

export const useOpenContact = create<OpenContactState>((set) => ({
  id: undefined,
  isOpen: false,
  onOpen: (id: string) => set({ isOpen: true, id }),
  onClose: () => set({ isOpen: false, id: undefined }),
}));

type NewContactState = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useNewContact = create<NewContactState>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
