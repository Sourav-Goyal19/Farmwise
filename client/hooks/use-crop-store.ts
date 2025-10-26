import { create } from "zustand";

type CropStore = {
  isOpen: boolean;
  onOpen: (id?: string) => void;
  onClose: () => void;
  id?: string;
};

export const useNewCrop = create<CropStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true, id: undefined }),
  onClose: () => set({ isOpen: false, id: undefined }),
  id: undefined,
}));

export const useOpenCrop = create<CropStore>((set) => ({
  isOpen: false,
  onOpen: (id?: string) => set({ isOpen: true, id }),
  onClose: () => set({ isOpen: false, id: undefined }),
  id: undefined,
}));
