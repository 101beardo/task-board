import { create } from "zustand";

/**
 * Ephemeral drag state. Kept out of TanStack Query's cache on purpose: it is
 * pure UI, it changes on every pointer move, and nothing on the server cares
 * about it. Zustand keeps the re-renders scoped to the components that read it.
 */
interface BoardUiState {
  /** The task currently being dragged, or null. Drives the drag overlay. */
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
}

export const useBoardUi = create<BoardUiState>((set) => ({
  activeTaskId: null,
  setActiveTaskId: (activeTaskId) => set({ activeTaskId }),
}));
