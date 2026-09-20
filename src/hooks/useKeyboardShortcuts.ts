import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import type { DashboardTab } from "../types";

interface KeyboardShortcutsOptions {
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  isPinEnabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onExportPDF,
  onExportExcel,
  isPinEnabled = false,
}: KeyboardShortcutsOptions = {}) => {
  const {
    activeTab,
    setActiveTab,
    setIsCommandMenuOpen,
    setIsPinLocked,
    setEditingProductId,
    toggleTheme,
    showToast,
  } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isModifier = isMac ? e.metaKey : e.ctrlKey;

      // Don't intercept shortcuts if user is typing in an input/textarea unless it's Ctrl+K, Escape, or Ctrl+D
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      // Ctrl+K / Cmd+K: Open Command Menu
      if (isModifier && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandMenuOpen(true);
        return;
      }

      // Ctrl+D / Cmd+D: Toggle Theme
      if (isModifier && e.key.toLowerCase() === "d") {
        e.preventDefault();
        toggleTheme();
        showToast("Tema tampilan dialihkan", "info");
        return;
      }

      // If user is focused inside a text input, allow normal typing for other keys
      if (isInputFocused) {
        return;
      }

      // Ctrl+N: Add Product (Switch to Form & Log tab)
      if (isModifier && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setEditingProductId(null);
        setActiveTab("form_logs");
        showToast("Buka Form Tambah Barang Impian", "info");
        return;
      }

      // Ctrl+E: Export to Excel
      if (isModifier && e.key.toLowerCase() === "e") {
        e.preventDefault();
        if (onExportExcel) {
          onExportExcel();
        }
        return;
      }

      // Ctrl+P: Export to PDF (prevent browser print if handled)
      if (isModifier && e.key.toLowerCase() === "p") {
        e.preventDefault();
        if (onExportPDF) {
          onExportPDF();
        }
        return;
      }

      // Ctrl+L: Lock App with PIN
      if (isModifier && e.key.toLowerCase() === "l") {
        e.preventDefault();
        if (isPinEnabled) {
          setIsPinLocked(true);
          showToast("Aplikasi dikunci dengan PIN", "info");
        } else {
          setActiveTab("settings");
          showToast("Aktifkan PIN di menu Pengaturan", "info");
        }
        return;
      }

      // Ctrl+1 to Ctrl+8: Quick navigation between Dashboards
      if (isModifier && /^[1-8]$/.test(e.key)) {
        e.preventDefault();
        const tabMap: Record<string, DashboardTab> = {
          "1": "overview",
          "2": "form_logs",
          "3": "products",
          "4": "categories",
          "5": "tags",
          "6": "favorites",
          "7": "archive",
          "8": "settings",
        };
        const targetTab = tabMap[e.key];
        if (targetTab && targetTab !== activeTab) {
          setActiveTab(targetTab);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeTab,
    setActiveTab,
    setIsCommandMenuOpen,
    setIsPinLocked,
    setEditingProductId,
    toggleTheme,
    showToast,
    onExportPDF,
    onExportExcel,
    isPinEnabled,
  ]);
};
