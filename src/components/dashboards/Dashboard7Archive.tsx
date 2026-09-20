import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Archive,
  ArchiveRestore,
  Trash2,
  ExternalLink,
  Package,
  AlertTriangle,
  RotateCcw,
  Edit,
} from "lucide-react";
import type { Product, Category } from "../../types";
import { formatIDR, formatDate } from "../../utils/formatters";
import { db, addLog } from "../../db/dexie";
import { useAppStore } from "../../store/useAppStore";
import { animatePageIn, animateStaggerIn } from "../../utils/animations";
import { ProductSortFilterBar } from "../common/ProductSortFilterBar";
import { sortProducts, type SortOption } from "../../utils/productSorting";
import { ProductCardLinkButton } from "../common/ProductCardLinkButton";

interface Dashboard7ArchiveProps {
  products: Product[];
  categories: Category[];
  onRefreshData: () => Promise<void>;
}

export const Dashboard7Archive: React.FC<Dashboard7ArchiveProps> = ({
  products,
  categories,
  onRefreshData,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setSelectedDetailProductId, openEditModal, showToast } =
    useAppStore();

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSort, setSelectedSort] = useState<SortOption>("latest");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isProcessing, setIsProcessing] = useState(false);

  // GSAP animation on mount
  useEffect(() => {
    animatePageIn(containerRef.current);
  }, []);

  // Filter archived products
  const archivedProducts = useMemo(() => {
    return products.filter((p) => p.status === "archived");
  }, [products]);

  // Filtered and sorted by search, category & sort
  const filteredArchived = useMemo(() => {
    const filtered = archivedProducts.filter((p) => {
      const matchCategory =
        selectedCategory === "all" || p.categoryId === selectedCategory;
      const matchKeyword =
        !searchKeyword.trim() ||
        p.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        p.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        p.tags.some((t) =>
          t.toLowerCase().includes(searchKeyword.toLowerCase()),
        );
      return matchCategory && matchKeyword;
    });

    return sortProducts(filtered, selectedSort);
  }, [archivedProducts, selectedCategory, searchKeyword, selectedSort]);

  // Animate items on list change
  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll(".archive-item-card");
      if (cards.length > 0) {
        animateStaggerIn(cards);
      }
    }
  }, [filteredArchived.length, viewMode]);

  // Metrics
  const totalArchivedValue = useMemo(() => {
    return archivedProducts.reduce((acc, p) => acc + (p.price || 0), 0);
  }, [archivedProducts]);

  // Restore single product
  const handleRestoreProduct = async (
    product: Product,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    try {
      await db.products.update(product.id, {
        status: "dream",
        updatedAt: Date.now(),
      });
      await addLog(
        "UPDATE",
        "product",
        `Memulihkan barang impian dari arsip: ${product.name}`,
      );
      await onRefreshData();
      showToast(`"${product.name}" dipulihkan ke Daftar Impian`, "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal memulihkan produk", "error");
    }
  };

  // Permanently delete single product
  const handleDeletePermanent = async (
    product: Product,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    if (
      !confirm(
        `Hapus permanen "${product.name}"? Tindakan ini tidak dapat dibatalkan.`,
      )
    ) {
      return;
    }
    try {
      await db.products.delete(product.id);
      await addLog(
        "DELETE",
        "product",
        `Hapus permanen dari arsip: ${product.name}`,
      );
      await onRefreshData();
      showToast(`"${product.name}" telah dihapus secara permanen`, "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal menghapus produk", "error");
    }
  };

  // Batch restore all
  const handleBatchRestoreAll = async () => {
    if (archivedProducts.length === 0) return;
    if (
      !confirm(
        `Pulihkan seluruh ${archivedProducts.length} barang dari arsip ke daftar impian?`,
      )
    ) {
      return;
    }
    setIsProcessing(true);
    try {
      const now = Date.now();
      for (const p of archivedProducts) {
        await db.products.update(p.id, {
          status: "dream",
          updatedAt: now,
        });
      }
      await addLog(
        "UPDATE",
        "product",
        `Memulihkan semua (${archivedProducts.length}) barang arsip`,
      );
      await onRefreshData();
      showToast(
        `${archivedProducts.length} barang berhasil dipulihkan`,
        "success",
      );
    } catch (err) {
      console.error(err);
      showToast("Gagal memulihkan batch barang", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch delete all archived
  const handleBatchDeleteAll = async () => {
    if (archivedProducts.length === 0) return;
    if (
      !confirm(
        `Hapus PERMANEN SEMUA (${archivedProducts.length}) barang di dalam arsip? Data tidak dapat dipulihkan!`,
      )
    ) {
      return;
    }
    setIsProcessing(true);
    try {
      for (const p of archivedProducts) {
        await db.products.delete(p.id);
      }
      await addLog(
        "DELETE",
        "product",
        `Mengosongkan arsip: menghapus ${archivedProducts.length} produk`,
      );
      await onRefreshData();
      showToast("Seluruh arsip berhasil dikosongkan", "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal mengosongkan arsip", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-base font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
              Arsip
            </h1>
          </div>
        </div>

        {/* Global Batch Action Buttons */}
        {archivedProducts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleBatchRestoreAll}
              className="flex items-center gap-1.5 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-3 py-1 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors disabled:opacity-50"
              title="Pulihkan seluruh barang arsip kembali ke status Impian"
            >
              <ArchiveRestore className="h-3.5 w-3.5" />
              <span>Pulihkan Semua</span>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleBatchDeleteAll}
              className="flex items-center gap-1.5 border border-red-600 bg-white dark:bg-zinc-900 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
              title="Hapus permanen semua barang di dalam arsip"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Kosongkan Arsip</span>
            </button>
          </div>
        )}
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:p-4">
          <div className="font-mono text-[10px] uppercase text-zinc-600 dark:text-zinc-400">
            Total Nilai Arsip
          </div>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatIDR(totalArchivedValue)}
          </div>
          <div className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
            Akumulasi nilai seluruh barang non-aktif
          </div>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:p-4">
          <div className="font-mono text-[10px] uppercase text-zinc-600 dark:text-zinc-400">
            Jumlah Barang Arsip
          </div>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {filteredArchived.length}
          </div>
          <div className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
            Sesuai kriteria pencarian & filter
          </div>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:p-4">
          <div className="font-mono text-[10px] uppercase text-zinc-600 dark:text-zinc-400">
            Status Keamanan
          </div>
          <div className="mt-1 font-mono text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
            TERISOLASI
          </div>
          <div className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
            Tidak memengaruhi total impian aktif
          </div>
        </div>
      </div>

      {/* Collapsible Search, Filter & Sort Bar (Default Hidden) */}
      <ProductSortFilterBar
        searchQuery={searchKeyword}
        onSearchChange={setSearchKeyword}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        showCategoryFilter={true}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
        totalFiltered={filteredArchived.length}
        totalAll={archivedProducts.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        placeholder="Cari dalam arsip: nama, tag (#), deskripsi..."
      />

      {/* Archive Product List */}
      {filteredArchived.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-400">
            <Archive className="h-6 w-6" />
          </div>
          <h3 className="mt-3 font-mono text-sm font-bold uppercase text-zinc-900 dark:text-zinc-100">
            Tidak Ada Barang di Arsip
          </h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
            {archivedProducts.length === 0
              ? "Anda belum mengarsipkan barang apa pun."
              : "Tidak ada barang arsip yang cocok dengan filter atau kata kunci pencarian Anda."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredArchived.map((product) => {
            const categoryName = product.categoryId
              ? categories.find((c) => c.id === product.categoryId)?.name ||
                "Umum"
              : "Umum";

            return (
              <div
                key={product.id}
                onClick={() => setSelectedDetailProductId(product.id)}
                className="archive-item-card group flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 hover:border-zinc-900 dark:hover:border-zinc-300 transition-colors cursor-pointer"
              >
                <div>
                  {product.imageUrl ? (
                    <div className="mb-2 h-36 w-full border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-200 grayscale contrast-125"
                      />
                    </div>
                  ) : (
                    <div className="mb-2 flex h-24 w-full items-center justify-center border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600">
                      <span className="font-mono text-[10px] uppercase">
                        Arsip (Tanpa Foto)
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.2 text-zinc-600 dark:text-zinc-300">
                      {categoryName}
                    </span>
                    <span className="border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 font-mono text-[9px] uppercase text-zinc-600 dark:text-zinc-400">
                      Diarsipkan
                    </span>
                  </div>

                  <div className="mt-1 font-medium text-xs text-zinc-900 dark:text-zinc-100 group-hover:underline line-clamp-2">
                    {product.name}
                  </div>

                  <div className="mt-1 font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {formatIDR(product.price)}
                  </div>

                  {product.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                      {product.tags.map((t) => (
                        <span
                          key={t}
                          className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Direct Link Button with Editable Label */}
                <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <ProductCardLinkButton
                    product={product}
                    onUpdate={onRefreshData}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 text-[11px]">
                    Rincian
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(product.id);
                      }}
                      className="border border-zinc-200 dark:border-zinc-700 p-1 text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                      title="Edit Barang"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRestoreProduct(product, e)}
                      className="border border-zinc-200 dark:border-zinc-700 p-1 text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                      title="Pulihkan ke Daftar Impian"
                    >
                      <ArchiveRestore className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeletePermanent(product, e)}
                      className="border border-zinc-200 dark:border-zinc-700 p-1 text-zinc-400 hover:border-red-600 hover:text-red-600"
                      title="Hapus Permanen"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-x-auto">
          <table className="w-full min-w-190 text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 font-mono text-[11px] uppercase text-zinc-500 dark:text-zinc-400">
                <th className="p-3">Produk</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Harga Arsip</th>
                <th className="p-3">Tag</th>
                <th className="p-3">Tanggal Arsip</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredArchived.map((product) => {
                const categoryName = product.categoryId
                  ? categories.find((c) => c.id === product.categoryId)?.name ||
                    "-"
                  : "-";

                return (
                  <tr
                    key={product.id}
                    onClick={() => setSelectedDetailProductId(product.id)}
                    className="archive-item-card hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="h-9 w-9 object-cover border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-400">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {product.name}
                          </div>
                          {product.description && (
                            <p className="line-clamp-1 max-w-xs text-[11px] text-zinc-500 dark:text-zinc-400">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-zinc-600 dark:text-zinc-400">
                      {categoryName}
                    </td>
                    <td className="p-3 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatIDR(product.price)}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-40">
                        {product.tags.length > 0 ? (
                          product.tags.map((t) => (
                            <span
                              key={t}
                              className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1 py-0.2 font-mono text-[9px] text-zinc-500 dark:text-zinc-400"
                            >
                              #{t}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-zinc-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                      {formatDate(product.updatedAt || product.createdAt)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(product.id);
                          }}
                          className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300"
                          title="Edit Barang"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRestoreProduct(product, e)}
                          className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300"
                          title="Pulihkan barang ke status impian"
                        >
                          <ArchiveRestore className="h-3 w-3" />
                          <span>Pulihkan</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeletePermanent(product, e)}
                          className="border border-zinc-200 dark:border-zinc-700 p-1 text-zinc-400 hover:border-red-600 hover:text-red-600"
                          title="Hapus permanen dari database"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
