import React, { useEffect, useRef } from "react";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  PenSquare,
  Package,
  Layers,
  Hash,
  Star,
  Archive,
  Settings,
  FileText,
  FileSpreadsheet,
  Send,
  Lock,
  Plus,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import type { Product } from "../../types";
import { formatIDR } from "../../utils/formatters";
import { animateModalIn } from "../../utils/animations";

interface CommandMenuProps {
  products: Product[];
  onExportPDF: () => void;
  onExportExcel: () => void;
  onSendTelegram: () => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({
  products,
  onExportPDF,
  onExportExcel,
  onSendTelegram,
}) => {
  const {
    isCommandMenuOpen,
    setIsCommandMenuOpen,
    setActiveTab,
    startEditProduct,
    setIsPinLocked,
    showToast,
    theme,
    toggleTheme,
  } = useAppStore();

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCommandMenuOpen && menuRef.current) {
      animateModalIn(menuRef.current);
    }
  }, [isCommandMenuOpen]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" && (e.metaKey || e.ctrlKey))
      ) {
        e.preventDefault();
        setIsCommandMenuOpen(!isCommandMenuOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isCommandMenuOpen, setIsCommandMenuOpen]);

  if (!isCommandMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 bg-black/60 backdrop-blur-xs">
      <div
        ref={menuRef}
        className="w-full max-w-xl border border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-none overflow-hidden"
      >
        <Command className="w-full">
          {/* Search bar inside command */}
          <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-3">
            <Command.Input
              placeholder="Ketik perintah atau cari produk impian..."
              className="h-11 w-full bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setIsCommandMenuOpen(false)}
              className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* List Results */}
          <Command.List className="max-h-80 overflow-y-auto p-2 text-xs">
            <Command.Empty className="p-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Tidak ada hasil yang cocok.
            </Command.Empty>

            {/* Navigasi Modul Dasbor (1 - 8) */}
            <Command.Group
              heading="NAVIGASI MODUL DASBOR"
              className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 py-1"
            >
              <Command.Item
                onSelect={() => {
                  setActiveTab("overview");
                  setIsCommandMenuOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-900 aria-selected:text-white dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-900"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dasbor 1: Ikhtisar & Laporan Bulanan</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setActiveTab("form_logs");
                  setIsCommandMenuOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-900 aria-selected:text-white dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-900"
              >
                <PenSquare className="h-3.5 w-3.5" />
                <span>Dasbor 2: Form Input & Riwayat Log</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setActiveTab("products");
                  setIsCommandMenuOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-900 aria-selected:text-white dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-900"
              >
                <Package className="h-3.5 w-3.5" />
                <span>Dasbor 3: Daftar Produk Impian</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setActiveTab("categories");
                  setIsCommandMenuOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-900 aria-selected:text-white dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-900"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Dasbor 4: Daftar Kategori</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setActiveTab("tags");
                  setIsCommandMenuOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-900 aria-selected:text-white dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-900"
              >
                <Hash className="h-3.5 w-3.5" />
                <span>Dasbor 5: Daftar Tag</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setActiveTab("favorites");
                  setIsCommandMenuOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-900 aria-selected:text-white dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-900"
              >
                <Star className="h-3.5 w-3.5" />
                <span>Dasbor 6: Daftar Produk Favorit</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setActiveTab("archive");
                  setIsCommandMenuOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-900 aria-selected:text-white dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-900"
              >
                <Archive className="h-3.5 w-3.5" />
                <span>Dasbor 7: Arsip Produk Impian</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setActiveTab("settings");
                  setIsCommandMenuOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-900 aria-selected:text-white dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-900"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Dasbor 8: Pengaturan & Integrasi</span>
              </Command.Item>
            </Command.Group>

            {/* Aksi Cepat */}
            <Command.Group
              heading="AKSI CEPAT & PENGATURAN"
              className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 py-1"
            >
              <Command.Item
                onSelect={() => {
                  toggleTheme();
                  setIsCommandMenuOpen(false);
                  showToast(
                    theme === "dark"
                      ? "Mode Terang diaktifkan"
                      : "Mode Gelap diaktifkan",
                    "info",
                  );
                }}
                className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-900 aria-selected:text-white dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-900"
              >
                {theme === "dark" ? (
                  <Sun className="h-3.5 w-3.5" />
                ) : (
                  <Moon className="h-3.5 w-3.5" />
                )}
                <span>
                  Ganti Tema: {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
                </span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setActiveTab("form_logs");
                  setIsCommandMenuOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-900 aria-selected:text-white dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-900"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Barang Impian Baru</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setIsCommandMenuOpen(false);
                  onExportPDF();
                }}
                className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-900 aria-selected:text-white dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-900"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Ekspor ke Dokumen PDF</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setIsCommandMenuOpen(false);
                  onExportExcel();
                }}
                className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-900 aria-selected:text-white dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-900"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Ekspor ke File Excel XLSX</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setIsCommandMenuOpen(false);
                  onSendTelegram();
                }}
                className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-900 aria-selected:text-white dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-900"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Kirim Ringkasan ke Bot Telegram</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setIsCommandMenuOpen(false);
                  setIsPinLocked(true);
                  showToast("Aplikasi dikunci dengan PIN", "info");
                }}
                className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-900 aria-selected:text-white dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-900"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Kunci Aplikasi Sekarang</span>
              </Command.Item>
            </Command.Group>

            {/* Pencarian Produk Langsung */}
            {products.length > 0 && (
              <Command.Group
                heading="PRODUK IMPIAN"
                className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 py-1"
              >
                {products.slice(0, 15).map((prod) => (
                  <Command.Item
                    key={prod.id}
                    value={`${prod.name} ${prod.tags.join(" ")}`}
                    onSelect={() => {
                      startEditProduct(prod.id);
                      setIsCommandMenuOpen(false);
                    }}
                    className="flex cursor-pointer items-center justify-between px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 aria-selected:bg-zinc-900 aria-selected:text-white dark:aria-selected:bg-zinc-100 dark:aria-selected:text-zinc-900"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Package className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{prod.name}</span>
                    </div>
                    <span className="font-mono text-[11px] shrink-0 font-semibold">
                      {formatIDR(prod.price)}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer Helper */}
          <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 text-[10px] font-mono text-zinc-400">
            <span>Gunakan panah ↑ ↓ untuk memilih</span>
            <span>Esc untuk keluar</span>
          </div>
        </Command>
      </div>
    </div>
  );
};
