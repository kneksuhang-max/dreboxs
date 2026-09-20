import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Hash,
  Plus,
  Trash2,
  Package,
  ArrowRight,
  Edit,
  ChevronLeft,
  CircleDollarSign,
  Star,
  ExternalLink,
  Check,
} from "lucide-react";
import type { Tag, Product, Category } from "../../types";
import { db, addLog } from "../../db/dexie";
import { formatIDR, formatDate } from "../../utils/formatters";
import { useAppStore } from "../../store/useAppStore";
import { animatePageIn } from "../../utils/animations";
import { ProductSortFilterBar } from "../common/ProductSortFilterBar";
import { sortProducts, type SortOption } from "../../utils/productSorting";
import { ProductCardLinkButton } from "../common/ProductCardLinkButton";

interface Dashboard5TagsProps {
  tags: Tag[];
  products: Product[];
  categories?: Category[];
  onRefreshData: () => Promise<void>;
}

export const Dashboard5Tags: React.FC<Dashboard5TagsProps> = ({
  tags,
  products,
  categories = [],
  onRefreshData,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setActiveTab, setSelectedDetailProductId, openEditModal, showToast } =
    useAppStore();

  useEffect(() => {
    animatePageIn(containerRef.current);
  }, []);

  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editTagNameInput, setEditTagNameInput] = useState("");
  const [deleteConfirmTag, setDeleteConfirmTag] = useState<Tag | null>(null);

  // Dedicated Tag Product List State
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSort, setSelectedSort] = useState<SortOption>("latest");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const activeTag = useMemo(() => {
    return tags.find((t) => t.id === selectedTagId) || null;
  }, [tags, selectedTagId]);

  // Products containing the active tag
  const tagProducts = useMemo(() => {
    if (!activeTag) return [];
    return products.filter((p) =>
      p.tags.some((t) => t.toLowerCase() === activeTag.name.toLowerCase()),
    );
  }, [products, activeTag]);

  // Filtered and sorted products for dedicated tag page
  const filteredTagProducts = useMemo(() => {
    let result = tagProducts.filter((p) => {
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === "all" || p.categoryId === selectedCategory;
      const matchStatus =
        selectedStatus === "all" || p.status === selectedStatus;
      const matchPriority =
        selectedPriority === "all" || p.priority === selectedPriority;

      return matchSearch && matchCategory && matchStatus && matchPriority;
    });

    return sortProducts(result, selectedSort);
  }, [
    tagProducts,
    searchQuery,
    selectedCategory,
    selectedStatus,
    selectedPriority,
    selectedSort,
  ]);

  // Add new Tag
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagName.trim().replace(/^#/, "");
    if (!clean) {
      showToast("Nama tag tidak boleh kosong", "error");
      return;
    }

    const exists = tags.some(
      (t) => t.name.toLowerCase() === clean.toLowerCase(),
    );
    if (exists) {
      showToast("Tag sudah ada", "error");
      return;
    }

    try {
      const tag: Tag = {
        id: "tag-" + Date.now(),
        name: clean,
        createdAt: Date.now(),
      };
      await db.tags.add(tag);
      await addLog("CREATE", "tag", `Menambahkan tag: #${clean}`);
      await onRefreshData();
      setNewTagName("");
      showToast(`Tag #${clean} berhasil ditambahkan`, "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal menambahkan tag", "error");
    }
  };

  // Edit Tag module
  const handleStartEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setEditTagNameInput(tag.name);
  };

  const handleSaveEditTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag) return;

    const newClean = editTagNameInput.trim().replace(/^#/, "");
    if (!newClean) {
      showToast("Nama tag tidak boleh kosong", "error");
      return;
    }

    const oldName = editingTag.name;
    if (newClean.toLowerCase() === oldName.toLowerCase()) {
      setEditingTag(null);
      return;
    }

    const duplicate = tags.some(
      (t) =>
        t.id !== editingTag.id &&
        t.name.toLowerCase() === newClean.toLowerCase(),
    );
    if (duplicate) {
      showToast(`Tag #${newClean} sudah ada`, "error");
      return;
    }

    try {
      // 1. Update tag entity in db
      await db.tags.update(editingTag.id, {
        name: newClean,
      });

      // 2. Cascade rename tag in all products using this tag
      const affectedProducts = products.filter((p) =>
        p.tags.some((t) => t.toLowerCase() === oldName.toLowerCase()),
      );

      for (const p of affectedProducts) {
        const updatedTags = p.tags.map((t) =>
          t.toLowerCase() === oldName.toLowerCase() ? newClean : t,
        );
        await db.products.update(p.id, {
          tags: updatedTags,
          updatedAt: Date.now(),
        });
      }

      await addLog(
        "UPDATE",
        "tag",
        `Mengubah tag #${oldName} menjadi #${newClean} pada ${affectedProducts.length} barang`,
      );
      await onRefreshData();
      setEditingTag(null);
      showToast(
        `Tag #${oldName} berhasil diubah menjadi #${newClean}`,
        "success",
      );
    } catch (err) {
      console.error(err);
      showToast("Gagal memperbarui tag", "error");
    }
  };

  // Delete Tag
  const handleDeleteTag = async (tag: Tag) => {
    try {
      await db.tags.delete(tag.id);
      await addLog("DELETE", "tag", `Menghapus tag: #${tag.name}`);
      await onRefreshData();
      if (selectedTagId === tag.id) {
        setSelectedTagId(null);
      }
      setDeleteConfirmTag(null);
      showToast(`Tag #${tag.name} berhasil dihapus`, "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal menghapus tag", "error");
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (
    product: Product,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    try {
      const nextFav = !product.isFavorite;
      await db.products.update(product.id, {
        isFavorite: nextFav,
        updatedAt: Date.now(),
      });
      await addLog(
        "UPDATE",
        "product",
        `${nextFav ? "Menandai favorit" : "Hapus favorit"}: "${product.name}"`,
      );
      await onRefreshData();
      showToast(
        nextFav
          ? `"${product.name}" ditambahkan ke Favorit`
          : `"${product.name}" dihapus dari Favorit`,
        "info",
      );
    } catch (err) {
      console.error(err);
      showToast("Gagal mengubah status favorit", "error");
    }
  };

  // ==========================================
  // VIEW: Dedicated Tag Product List Page
  // ==========================================
  if (selectedTagId && activeTag) {
    const totalValue = tagProducts.reduce((sum, p) => sum + (p.price || 0), 0);

    return (
      <div ref={containerRef} className="space-y-4">
        {/* Header with Back Button */}
        <div className="flex flex-col gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => setSelectedTagId(null)}
              className="mb-1.5 flex items-center gap-1 font-mono text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Semua Tag</span>
            </button>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-base font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                Tag: #{activeTag.name}
              </h1>
              <span className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-600 dark:text-zinc-300">
                {tagProducts.length} barang
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Daftar barang impian yang memiliki label tag #{activeTag.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1 font-mono text-xs text-zinc-800 dark:text-zinc-200">
              <span className="text-zinc-400 dark:text-zinc-500 mr-1">
                Total Nilai:
              </span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {formatIDR(totalValue)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleStartEditTag(activeTag)}
              className="flex items-center gap-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300 transition-colors"
            >
              <Edit className="h-3 w-3" />
              <span>Edit Nama Tag</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("form_logs")}
              className="flex items-center gap-1 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-3 py-1 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Barang</span>
            </button>
          </div>
        </div>

        {/* Collapsible Search, Sort & Filter Bar (Default Hidden) */}
        <ProductSortFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          showCategoryFilter={categories.length > 0}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          showStatusFilter={true}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          showPriorityFilter={true}
          totalFiltered={filteredTagProducts.length}
          totalAll={tagProducts.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          placeholder={`Cari dalam tag #${activeTag.name}...`}
        />

        {/* Products Grid / Table */}
        {filteredTagProducts.length === 0 ? (
          <div className="border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {tagProducts.length === 0
                ? `Belum ada barang impian yang memiliki tag #${activeTag.name}.`
                : "Tidak ada barang yang cocok dengan filter atau pencarian Anda."}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredTagProducts.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedDetailProductId(item.id)}
                className="group flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 hover:border-zinc-900 dark:hover:border-zinc-300 transition-colors cursor-pointer"
              >
                <div>
                  {item.imageUrl ? (
                    <div className="mb-2 h-36 w-full border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-200"
                      />
                    </div>
                  ) : (
                    <div className="mb-2 flex h-24 w-full items-center justify-center border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600">
                      <span className="font-mono text-[10px] uppercase">
                        Tanpa Foto
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.2 font-mono text-zinc-600 dark:text-zinc-300">
                      #{activeTag.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(item, e)}
                      className="p-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          item.isFavorite
                            ? "fill-zinc-900 dark:fill-zinc-100 text-zinc-900 dark:text-zinc-100"
                            : "text-zinc-300 dark:text-zinc-600"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-1 font-medium text-xs text-zinc-900 dark:text-zinc-100 group-hover:underline line-clamp-2">
                    {item.name}
                  </div>

                  <div className="mt-1 font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {formatIDR(item.price)}
                  </div>

                  {item.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                      {item.tags.map((t) => (
                        <span
                          key={t}
                          className={`border px-1 ${
                            t.toLowerCase() === activeTag.name.toLowerCase()
                              ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                          }`}
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
                    product={item}
                    onUpdate={onRefreshData}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 text-[11px]">
                    Rincian Barang
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(item.id);
                      }}
                      className="border border-zinc-200 dark:border-zinc-700 p-1 text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                      title="Edit Barang"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-[10px] uppercase text-zinc-600 dark:text-zinc-400">
                <tr>
                  <th className="p-2.5">Barang</th>
                  <th className="p-2.5">Harga</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Prioritas</th>
                  <th className="p-2.5">Tanggal</th>
                  <th className="p-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredTagProducts.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedDetailProductId(p.id)}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  >
                    <td className="p-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                      {p.name}
                    </td>
                    <td className="p-2.5 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {formatIDR(p.price)}
                    </td>
                    <td className="p-2.5 font-mono text-[10px] uppercase text-zinc-600 dark:text-zinc-400">
                      {p.status}
                    </td>
                    <td className="p-2.5 font-mono text-[10px] uppercase text-zinc-600 dark:text-zinc-400">
                      {p.priority}
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(p.id);
                        }}
                        className="border border-zinc-200 dark:border-zinc-700 p-1 text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                        title="Edit"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Tag Modal (Accessible inside dedicated view as well) */}
        {editingTag && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm border border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-xl">
              <h3 className="font-mono text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100">
                Edit Tag #{editingTag.name}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Mengubah nama tag akan secara otomatis memperbarui label pada
                seluruh barang terkait.
              </p>
              <form onSubmit={handleSaveEditTag} className="mt-3 space-y-3">
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    #
                  </span>
                  <input
                    type="text"
                    required
                    value={editTagNameInput}
                    onChange={(e) => setEditTagNameInput(e.target.value)}
                    className="h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-7 pr-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTag(null)}
                    className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-3 py-1 text-xs font-semibold text-white dark:text-zinc-900"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW: Main Tags Management Dashboard
  // ==========================================
  return (
    <div ref={containerRef} className="space-y-6">
      {/* Title Bar */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <h1 className="font-mono text-base font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
          Daftar Tag
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Tambah Tag (4 cols) */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 lg:col-span-4 transition-colors">
          <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            Tambah Tag Baru
          </h2>

          <form onSubmit={handleAddTag} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Nama Tag
              </label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  #
                </span>
                <input
                  type="text"
                  required
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-7 pr-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex h-8 w-full items-center justify-center gap-1.5 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Simpan Tag</span>
            </button>
          </form>
        </div>

        {/* List of Tags (8 cols) */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 lg:col-span-8 transition-colors">
          <div className="mb-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Hash className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Daftar Tag Tersedia
              </h2>
            </div>
            <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
              {tags.length} tag
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {tags.length === 0 ? (
              <div className="col-span-full p-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
                Belum ada tag yang dibuat.
              </div>
            ) : (
              tags.map((tag) => {
                const count = products.filter((p) =>
                  p.tags.some(
                    (t) => t.toLowerCase() === tag.name.toLowerCase(),
                  ),
                ).length;

                return (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 hover:border-zinc-900 dark:hover:border-zinc-400 transition-colors"
                  >
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => setSelectedTagId(tag.id)}
                    >
                      <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline">
                        #{tag.name}
                      </span>
                      <span className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.2 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                        {count} item
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedTagId(tag.id)}
                        className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-[11px] text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        title="Lihat barang dengan tag ini"
                      >
                        <Package className="h-3 w-3" />
                        <span>Lihat</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>

                      {/* Edit Tag Button */}
                      <button
                        type="button"
                        onClick={() => handleStartEditTag(tag)}
                        className="border border-zinc-200 dark:border-zinc-700 p-1 text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                        title="Edit Tag"
                      >
                        <Edit className="h-3 w-3" />
                      </button>

                      {/* Delete Tag Button */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmTag(tag)}
                        className="border border-zinc-200 dark:border-zinc-700 p-1 text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                        title="Hapus Tag"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit Tag Modal */}
      {editingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm border border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-xl">
            <h3 className="font-mono text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100">
              Modul Edit Tag
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Ubah label tag #{editingTag.name}. Perubahan ini akan diperbarui
              secara otomatis pada seluruh barang yang memiliki tag ini.
            </p>
            <form onSubmit={handleSaveEditTag} className="mt-3 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Nama Tag Baru
                </label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    #
                  </span>
                  <input
                    type="text"
                    required
                    value={editTagNameInput}
                    onChange={(e) => setEditTagNameInput(e.target.value)}
                    className="h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-7 pr-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingTag(null)}
                  className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-3 py-1 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Tag Confirmation Modal */}
      {deleteConfirmTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm border border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-xl">
            <h3 className="font-mono text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100">
              Hapus Tag #{deleteConfirmTag.name}
            </h3>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Apakah Anda yakin ingin menghapus tag ini? Tag akan dihapus dari
              daftar katalog tag.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTag(null)}
                className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTag(deleteConfirmTag)}
                className="border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-3 py-1 text-xs text-white dark:text-zinc-900 font-semibold hover:bg-zinc-800 dark:hover:bg-white"
              >
                Hapus Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
