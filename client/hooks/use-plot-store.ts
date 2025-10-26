import { create } from "zustand";

type NewPlotState = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useNewPlot = create<NewPlotState>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

type OpenPlotState = {
  id?: string;
  isOpen: boolean;
  onOpen: (id: string) => void;
  onClose: () => void;
};

export const useOpenPlot = create<OpenPlotState>((set) => ({
  id: undefined,
  isOpen: false,
  onOpen: (id: string) => set({ isOpen: true, id }),
  onClose: () => set({ isOpen: false, id: undefined }),
}));
