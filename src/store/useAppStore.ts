import { create } from "zustand";
import type { DashboardTab } from "../types";

export type AppTheme = "light" | "dark";

// Helper to get initial theme from localStorage or system preference
const getInitialTheme = (): AppTheme => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("drebxs_theme");
    if (saved === "dark" || saved === "light") {
      const isDark = saved === "dark";
      document.documentElement.classList.toggle("dark", isDark);
      document.body?.classList.toggle("dark", isDark);
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
      return saved;
    }
    // Check OS preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      document.documentElement.classList.add("dark");
      document.body?.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
      return "dark";
    }
  }
  return "light";
};

interface AppState {
  activeTab: DashboardTab;
  editingProductId: string | null;
  editingModalProductId: string | null;
  selectedDetailProductId: string | null;
  searchQuery: string;
  isCommandMenuOpen: boolean;
  isPinLocked: boolean;
  toast: { text: string; type: "success" | "info" | "error" } | null;
  theme: AppTheme;

  setActiveTab: (tab: DashboardTab) => void;
  setEditingProductId: (id: string | null) => void;
  setEditingModalProductId: (id: string | null) => void;
  setSelectedDetailProductId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setIsCommandMenuOpen: (open: boolean) => void;
  setIsPinLocked: (locked: boolean) => void;
  showToast: (text: string, type?: "success" | "info" | "error") => void;
  clearToast: () => void;
  startEditProduct: (id: string) => void;
  openEditModal: (id: string) => void;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const getInitialActiveTab = (): DashboardTab => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("dreboxs_active_tab") as DashboardTab;
    const validTabs: DashboardTab[] = [
      "overview",
      "form_logs",
      "products",
      "categories",
      "tags",
      "favorites",
      "archive",
      "settings",
    ];
    if (saved && validTabs.includes(saved)) {
      return saved;
    }
  }
  return "overview";
};

export const useAppStore = create<AppState>((set, get) => {
  const initialTheme = getInitialTheme();
  const initialActiveTab = getInitialActiveTab();

  return {
    activeTab: initialActiveTab,
    editingProductId: null,
    editingModalProductId: null,
    selectedDetailProductId: null,
    searchQuery: "",
    isCommandMenuOpen: false,
    isPinLocked: false,
    toast: null,
    theme: initialTheme,

    setActiveTab: (tab) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("dreboxs_active_tab", tab);
      }
      set({ activeTab: tab });
    },
    setEditingProductId: (id) => set({ editingProductId: id }),
    setEditingModalProductId: (id) => set({ editingModalProductId: id }),
    setSelectedDetailProductId: (id) => set({ selectedDetailProductId: id }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setIsCommandMenuOpen: (open) => set({ isCommandMenuOpen: open }),
    setIsPinLocked: (locked) => {
      if (typeof window !== "undefined") {
        if (!locked) {
          sessionStorage.setItem("dreboxs_session_unlocked", "true");
        } else {
          sessionStorage.removeItem("dreboxs_session_unlocked");
        }
      }
      set({ isPinLocked: locked });
    },
    showToast: (text, type = "info") => {
      set({ toast: { text, type } });
      setTimeout(() => {
        set((state) => (state.toast?.text === text ? { toast: null } : {}));
      }, 4000);
    },
    clearToast: () => set({ toast: null }),
    startEditProduct: (id: string) =>
      set({ editingProductId: id, activeTab: "form_logs" }),
    openEditModal: (id: string) => set({ editingModalProductId: id }),
    setTheme: (newTheme: AppTheme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("drebxs_theme", newTheme);
        const isDark = newTheme === "dark";
        document.documentElement.classList.toggle("dark", isDark);
        document.body?.classList.toggle("dark", isDark);
        document.documentElement.style.colorScheme = isDark ? "dark" : "light";
      }
      set({ theme: newTheme });
    },
    toggleTheme: () => {
      const current = get().theme;
      const nextTheme = current === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        localStorage.setItem("drebxs_theme", nextTheme);
        const isDark = nextTheme === "dark";
        document.documentElement.classList.toggle("dark", isDark);
        document.body?.classList.toggle("dark", isDark);
        document.documentElement.style.colorScheme = isDark ? "dark" : "light";
      }
      set({ theme: nextTheme });
    },
  };
});
