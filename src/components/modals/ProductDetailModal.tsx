import React, { useEffect, useRef } from "react";
import {
  X,
  ExternalLink,
  Edit,
  Trash2,
  Star,
  Tag as TagIcon,
  Layers,
  Archive,
  RotateCcw,
  Copy,
  Check,
  Globe,
} from "lucide-react";
import type { Product, Category } from "../../types";
import {
  formatIDR,
  formatDate,
  formatDateTime,
  formatMonthYear,
} from "../../utils/formatters";
import { db, addLog } from "../../db/dexie";
import { useAppStore } from "../../store/useAppStore";
import { animateModalIn } from "../../utils/animations";
import { detectStoreLabel } from "../../utils/productSorting";
import { IconifyIcon } from "../common/IconifyIcon";

interface ProductDetailModalProps {
  product: Product | null;
  categories: Category[];
  onRefreshData: () => Promise<void>;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  categories,
  onRefreshData,
}) => {
  const { setSelectedDetailProductId, openEditModal, showToast } =
    useAppStore();
  const modalBoxRef = useRef<HTMLDivElement>(null);
  const [copiedLinkIndex, setCopiedLinkIndex] = React.useState<number | null>(
    null,
  );

  useEffect(() => {
    if (product && modalBoxRef.current) {
      animateModalIn(modalBoxRef.current);
    }
  }, [product]);

  if (!product) return null;

  const handleCopyLink = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkIndex(index);
    showToast("Tautan berhasil disalin ke clipboard", "success");
    setTimeout(() => {
      setCopiedLinkIndex((prev) => (prev === index ? null : prev));
    }, 2000);
  };

  const categoryName = product.categoryId
    ? categories.find((c) => c.id === product.categoryId)?.name ||
      "Tanpa Kategori"
    : "Tanpa Kategori";

  const handleToggleFavorite = async () => {
    try {
      const nextFav = !product.isFavorite;
      await db.products.update(product.id, {
        isFavorite: nextFav,
        updatedAt: Date.now(),
      });
      await addLog(
        "UPDATE",
        "product",
        `Ubah status favorit: ${product.name} -> ${nextFav}`,
      );
      await onRefreshData();
      showToast(
        nextFav ? "Ditambahkan ke Favorit" : "Dihapus dari Favorit",
        "info",
      );
    } catch {
      showToast("Gagal mengubah status favorit", "error");
    }
  };

  const handleToggleArchive = async () => {
    try {
      const isArchived = product.status === "archived";
      const nextStatus = isArchived ? "dream" : "archived";
      await db.products.update(product.id, {
        status: nextStatus,
        updatedAt: Date.now(),
      });
      await addLog(
        "UPDATE",
        "product",
        `${isArchived ? "Memulihkan dari arsip" : "Mengarsipkan"}: ${product.name}`,
      );
      await onRefreshData();
      showToast(
        isArchived
          ? "Dipulihkan ke Daftar Impian"
          : "Barang dipindahkan ke Arsip",
        "success",
      );
      setSelectedDetailProductId(null);
    } catch {
      showToast("Gagal mengubah status arsip", "error");
    }
  };

  const handleDelete = async () => {
    if (confirm(`Yakin ingin menghapus "${product.name}"?`)) {
      try {
        await db.products.delete(product.id);
        await addLog("DELETE", "product", `Hapus produk: ${product.name}`);
        await onRefreshData();
        showToast("Produk berhasil dihapus", "success");
        setSelectedDetailProductId(null);
      } catch {
        showToast("Gagal menghapus produk", "error");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60"
        onClick={() => setSelectedDetailProductId(null)}
      />

      {/* Modal Box */}
      <div
        ref={modalBoxRef}
        className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto border border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Rincian Barang Impian
            </span>
            {product.isFavorite && (
              <span className="border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-1.5 py-0.2 font-mono text-[10px] text-white dark:text-zinc-900">
                FAVORIT
              </span>
            )}
            {product.status === "archived" && (
              <span className="border border-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.2 font-mono text-[10px] text-zinc-800 dark:text-zinc-200">
                ARSIP
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`p-1.5 border transition-colors ${
                product.isFavorite
                  ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-zinc-900"
              }`}
              title={
                product.isFavorite ? "Hapus dari favorit" : "Jadikan favorit"
              }
            >
              <Star className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDetailProductId(null)}
              className="p-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-100"
              title="Tutup (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 text-xs">
          {/* Main Info */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              {product.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
                {formatIDR(product.price)}
              </span>
              {(() => {
                const catObj = categories.find(
                  (c) => c.id === product.categoryId,
                );
                return (
                  <span
                    className="flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[11px] text-zinc-800 dark:text-zinc-200"
                    style={{
                      borderColor: catObj?.color || undefined,
                      backgroundColor: catObj?.color
                        ? `${catObj.color}15`
                        : undefined,
                    }}
                  >
                    <IconifyIcon
                      icon={catObj?.icon || "lucide:layers"}
                      className="h-3.5 w-3.5"
                      color={catObj?.color}
                    />
                    <span>{categoryName}</span>
                  </span>
                );
              })()}
              <span className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 font-mono text-[11px] uppercase text-zinc-600 dark:text-zinc-300">
                Status: {product.status}
              </span>
            </div>
          </div>

          {/* Photo */}
          {product.imageUrl && (
            <div className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2 flex justify-center">
              <img
                src={product.imageUrl}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="max-h-64 max-w-full object-contain"
              />
            </div>
          )}

          {/* Meta specs */}
          <div className="grid grid-cols-2 gap-2 border-y border-zinc-100 dark:border-zinc-800 py-3 text-[11px]">
            <div>
              <span className="text-zinc-400">Target Realisasi:</span>
              <div className="font-medium text-zinc-800 dark:text-zinc-200">
                {formatMonthYear(product.targetMonth)}
              </div>
            </div>
            <div>
              <span className="text-zinc-400">Tingkat Prioritas:</span>
              <div className="font-mono uppercase font-semibold text-zinc-800 dark:text-zinc-200">
                {product.priority}
              </div>
            </div>
            <div>
              <span className="text-zinc-400">Tanggal Ditambahkan:</span>
              <div className="font-mono text-zinc-600 dark:text-zinc-400">
                {formatDateTime(product.createdAt)}
              </div>
            </div>
            <div>
              <span className="text-zinc-400">Terakhir Diperbarui:</span>
              <div className="font-mono text-zinc-600 dark:text-zinc-400">
                {formatDateTime(product.updatedAt)}
              </div>
            </div>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <TagIcon className="h-3 w-3" /> Tag Pengelompokan:
              </div>
              <div className="flex flex-wrap gap-1">
                {product.tags.map((t) => (
                  <span
                    key={t}
                    className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-800 dark:text-zinc-200"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links formatted as prominent interactive Buttons */}
          {product.links.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center justify-between">
                <span>Tautan Toko / Link Produk ({product.links.length}):</span>
                <span className="text-[10px] text-zinc-400 font-normal">
                  Klik tombol untuk membuka halaman toko
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {product.links.map((link, idx) => {
                  const store = detectStoreLabel(link);
                  const isCopied = copiedLinkIndex === idx;

                  return (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 hover:border-zinc-900 dark:hover:border-zinc-400 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] font-semibold shrink-0"
                          style={{
                            borderColor: store.color || "#2563EB",
                            backgroundColor: store.color
                              ? `${store.color}15`
                              : undefined,
                            color: store.color || undefined,
                          }}
                        >
                          <IconifyIcon
                            icon={store.icon || "lucide:globe"}
                            className="h-3 w-3"
                            color={store.color}
                          />
                          <span>{store.label}</span>
                        </span>
                        <span className="truncate font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                          {link}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(link, idx)}
                          className="flex h-7 items-center gap-1 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2 text-[11px] text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-400"
                          title="Salin tautan ke clipboard"
                        >
                          {isCopied ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{isCopied ? "Tersalin" : "Salin"}</span>
                        </button>

                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-7 items-center gap-1.5 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-3 text-[11px] font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white"
                          title={`Buka ${store.label}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Kunjungi Toko</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Catatan & Deskripsi:
            </div>
            <div className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
              {product.description || (
                <span className="italic text-zinc-400">
                  Tidak ada deskripsi.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center justify-center gap-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 sm:py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 w-full sm:w-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Hapus</span>
            </button>

            <button
              type="button"
              onClick={handleToggleArchive}
              className="flex items-center justify-center gap-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 sm:py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300 w-full sm:w-auto"
            >
              {product.status === "archived" ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Pulihkan</span>
                </>
              ) : (
                <>
                  <Archive className="h-3.5 w-3.5" />
                  <span>Arsipkan</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedDetailProductId(null)}
              className="flex-1 sm:flex-none text-center border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 sm:py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedDetailProductId(null);
                openEditModal(product.id);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-4 py-2 sm:py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Produk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
