import { create } from "zustand";

interface toastState {
  message: string;
  type: "success" | "error" | "info" | null;
}

interface UIState {
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedCommentId: string | null;
  setSelectedCommentId: (id: string | null) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toast: ToastState | null;
  showToast: (message: string, type?: "success" | "error" | "warning" | "info") => void;
  hideToast: () => void;
  // Trigger re-fetching across routes
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeChannelId: "ch1", // Default to TechUnboxed
  setActiveChannelId: (id) => set({ activeChannelId: id }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  selectedCommentId: null,
  setSelectedCommentId: (id) => set({ selectedCommentId: id }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toast: null,
  showToast: (message, type = "success") => {
    set({ toast: { message, type } });
    // Auto-dismiss toast
    setTimeout(() => {
      set((state) => {
        if (state.toast?.message === message) {
          return { toast: null };
        }
        return {};
      });
    }, 4000);
  },
  hideToast: () => set({ toast: null }),
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));
