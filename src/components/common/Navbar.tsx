import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  PenSquare,
  Package,
  Layers,
  Hash,
  Star,
  Archive,
  Settings,
  Search,
  Lock,
  Database,
  Send,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import type { DashboardTab } from "../../types";
import { animateDrawerIn } from "../../utils/animations";

interface NavbarProps {
  productCount: number;
  favoriteCount: number;
  archiveCount: number;
  isPinEnabled: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  productCount,
  favoriteCount,
  archiveCount,
  isPinEnabled,
}) => {
  const {
    activeTab,
    setActiveTab,
    setIsCommandMenuOpen,
    setIsPinLocked,
    showToast,
    theme,
    toggleTheme,
  } = useAppStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when active tab changes or on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock body scroll when mobile menu is open and trigger GSAP slide
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
      if (drawerRef.current) {
        animateDrawerIn(drawerRef.current);
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const navItems: {
    id: DashboardTab;
    label: string;
    shortLabel: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }[] = [
    {
      id: "overview",
      label: "Ikhtisar",
      shortLabel: "Ikhtisar",
      desc: "Ringkasan finansial & laporan bulanan",
      icon: LayoutDashboard,
    },
    {
      id: "form_logs",
      label: "Form & Log",
      shortLabel: "Form & Log",
      desc: "Input produk impian & riwayat aktivitas",
      icon: PenSquare,
    },
    {
      id: "products",
      label: "Produk",
      shortLabel: "Produk",
      desc: "Daftar semua barang impian & filter cerdas",
      icon: Package,
      count: productCount,
    },
    {
      id: "categories",
      label: "Kategori",
      shortLabel: "Kategori",
      desc: "Pengelompokan barang & alokasi dana",
      icon: Layers,
    },
    {
      id: "tags",
      label: "Tag",
      shortLabel: "Tag",
      desc: "Label tematik & multi-kategori",
      icon: Hash,
    },
    {
      id: "favorites",
      label: "Favorit",
      shortLabel: "Favorit",
      desc: "Prioritas tertinggi & wishlist utama",
      icon: Star,
      count: favoriteCount,
    },
    {
      id: "archive",
      label: "Arsip",
      shortLabel: "Arsip",
      desc: "Gudang barang impian yang dinonaktifkan",
      icon: Archive,
      count: archiveCount,
    },
    {
      id: "settings",
      label: "Pengaturan",
      shortLabel: "Pengaturan",
      desc: "Tema, PIN, Cloud Export, Telegram, MeiliSearch",
      icon: Settings,
    },
  ];

  const currentActiveItem =
    navItems.find((item) => item.id === activeTab) || navItems[0];

  const handleSelectTab = (tabId: DashboardTab) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors">
      {/* Top Header Bar */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* =========================================================================
            MOBILE VIEW (md:hidden): HANYA ADA HAMBURGER MENU DASBOR SAJA TIDAK ADA LAIN
            ========================================================================= */}
        <div className="flex md:hidden w-full items-center">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-full items-center justify-between border border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900 px-3 font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 transition-colors"
            title={isMobileMenuOpen ? "Tutup Menu Dasbor" : "Buka Menu Dasbor"}
            aria-label="Menu Dasbor"
            aria-expanded={isMobileMenuOpen}
          >
            <div className="flex items-center gap-2">
              <Menu className="h-4 w-4" />
              <span>MENU DASBOR: {currentActiveItem.label}</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
              <span>Buka</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </button>
        </div>

        {/* =========================================================================
            DESKTOP VIEW (hidden md:flex): Brand & Desktop Actions
            ========================================================================= */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleSelectTab("overview")}
            className="flex items-center gap-2 text-left focus:outline-none"
            aria-label="Kembali ke Ikhtisar"
          >
            <div className="flex h-8 w-8 items-center justify-center border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <span className="font-mono text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                DreBoXs
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
          {/* Quick Search Button */}
          <button
            type="button"
            onClick={() => setIsCommandMenuOpen(true)}
            className="flex h-9 items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 text-xs text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            title="Cari cepat (Ctrl+K)"
            aria-label="Cari Barang"
          >
            <Search className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
            <span>Cari...</span>
            <kbd className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-1 py-0.2 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
              ⌘K
            </kbd>
          </button>

          {/* Dark Mode Toggle (Desktop) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-100 transition-colors"
            title={
              theme === "dark" ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"
            }
            aria-label="Toggle Dark Mode"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-zinc-100" />
            ) : (
              <Moon className="h-4 w-4 text-zinc-800" />
            )}
          </button>

          {/* Telegram Shortcut (Desktop) */}
          <button
            type="button"
            onClick={() => handleSelectTab("settings")}
            className="flex h-9 items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 px-2.5 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-100"
            title="Pengaturan Telegram"
          >
            <Send className="h-3 w-3 text-zinc-500" />
            <span className="font-mono text-[11px]">Telegram</span>
          </button>

          {/* PIN Lock button */}
          {isPinEnabled ? (
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem("dreboxs_session_unlocked");
                setIsPinLocked(true);
                showToast("Aplikasi dikunci dengan PIN", "info");
              }}
              className="flex h-9 items-center gap-1.5 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-2.5 text-xs text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white"
              title="Kunci Aplikasi Sekarang"
              aria-label="Kunci dengan PIN"
            >
              <Lock className="h-3.5 w-3.5" />
              <span className="font-mono text-xs">Kunci</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                handleSelectTab("settings");
                showToast("Atur & aktifkan PIN di Pengaturan", "info");
              }}
              className="flex h-9 items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              title="PIN Saat Ini Nonaktif - Buka Pengaturan untuk Mengaktifkan"
              aria-label="Atur PIN"
            >
              <Lock className="h-3.5 w-3.5 opacity-60" />
              <span className="text-xs">PIN Nonaktif</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Navigation Tabs (Hidden on mobile to eliminate messy overflow) */}
      <div className="hidden md:block border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
        <div className="mx-auto flex max-w-7xl items-center px-4 sm:px-6">
          <nav
            className="flex space-x-1 py-1.5 overflow-x-auto"
            aria-label="Desktop Tabs"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex h-8 shrink-0 items-center gap-1.5 px-3 text-xs font-medium transition-colors ${
                    isActive
                      ? "border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                      : "border border-transparent text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`ml-1 font-mono text-[10px] px-1 py-0.2 ${
                        isActive
                          ? "border border-zinc-700 dark:border-zinc-300 bg-zinc-800 dark:bg-zinc-200 text-zinc-200 dark:text-zinc-800"
                          : "border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* MOBILE HAMBURGER MENU DRAWER / OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container (Animated by GSAP from right) */}
          <div
            ref={drawerRef}
            className="fixed inset-y-0 right-0 flex w-full max-w-xs flex-col border-l border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          >
            {/* Drawer Header */}
            <div className="flex h-14 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 bg-zinc-50 dark:bg-zinc-950">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
                  <Package className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-mono text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100">
                    Menu Dasbor
                  </div>
                  <div className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                    DreBoXs • Kotak Impian
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-100"
                aria-label="Tutup Menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Body: 8 Stacked Navigation Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <div className="px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Pilih Dasbor Aktif
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex w-full min-h-12 items-center justify-between border p-2.5 text-left transition-colors ${
                      isActive
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center border ${
                          isActive
                            ? "border-zinc-700 dark:border-zinc-300 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-mono text-xs font-bold">
                          {item.label}
                        </div>
                        <div
                          className={`text-[10px] ${
                            isActive
                              ? "text-zinc-300 dark:text-zinc-700"
                              : "text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          {item.desc}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.count !== undefined && (
                        <span
                          className={`font-mono text-[11px] px-1.5 py-0.5 border ${
                            isActive
                              ? "border-zinc-700 dark:border-zinc-300 bg-zinc-800 dark:bg-zinc-200 text-zinc-200 dark:text-zinc-800"
                              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                      <ChevronRight
                        className={`h-4 w-4 ${
                          isActive
                            ? "text-white dark:text-zinc-900"
                            : "text-zinc-400"
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer Actions with Dark Mode Toggle */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 space-y-2">
              {/* Dark Mode Toggle in Mobile Drawer */}
              <div className="flex items-center justify-between border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4 text-zinc-100" />
                  ) : (
                    <Sun className="h-4 w-4 text-zinc-900" />
                  )}
                  <span>Mode Tampilan</span>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-2.5 py-1 font-mono text-[10px] text-white dark:text-zinc-900 font-bold uppercase"
                >
                  {theme === "dark" ? "Terang" : "Gelap"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsCommandMenuOpen(true);
                }}
                className="flex h-10 w-full items-center justify-center gap-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-300"
              >
                <Search className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                <span>Pencarian Cerdas (⌘K)</span>
              </button>

              {isPinEnabled ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    sessionStorage.removeItem("dreboxs_session_unlocked");
                    setIsPinLocked(true);
                    showToast("Aplikasi dikunci dengan PIN", "info");
                  }}
                  className="flex h-10 w-full items-center justify-center gap-2 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Kunci Aplikasi Sekarang</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSelectTab("settings");
                    showToast(
                      "Fitur PIN nonaktif. Atur di tab Pengaturan.",
                      "info",
                    );
                  }}
                  className="flex h-10 w-full items-center justify-center gap-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300"
                >
                  <Lock className="h-3.5 w-3.5 opacity-60" />
                  <span>PIN Keamanan: Nonaktif</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
