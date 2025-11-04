import { create } from "zustand";

type LogStore = {
  isOpen: boolean;
  onOpen: (id?: string) => void;
  onClose: () => void;
  id?: string;
};

type LogViewStore = {
  isViewOpen: boolean;
  onViewOpen: (id?: string) => void;
  onViewClose: () => void;
  viewId?: string;
};

export const useViewLog = create<LogViewStore>((set) => ({
  isViewOpen: false,
  onViewOpen: (id?: string) => set({ isViewOpen: true, viewId: id }),
  onViewClose: () => set({ isViewOpen: false, viewId: undefined }),
  viewId: undefined,
}));

export const useOpenLog = create<LogStore>((set) => ({
  isOpen: false,
  onOpen: (id?: string) => set({ isOpen: true, id }),
  onClose: () => set({ isOpen: false, id: undefined }),
  id: undefined,
}));
