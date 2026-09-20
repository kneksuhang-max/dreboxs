import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Package,
  CircleDollarSign,
  ArrowRight,
  ChevronLeft,
  Star,
  ExternalLink,
  Tag as TagIcon,
  Sparkles,
  Palette,
} from "lucide-react";
import type { Category, Product } from "../../types";
import { db, addLog } from "../../db/dexie";
import { formatIDR, formatDate } from "../../utils/formatters";
import { useAppStore } from "../../store/useAppStore";
import { animatePageIn } from "../../utils/animations";
import { ProductSortFilterBar } from "../common/ProductSortFilterBar";
import { sortProducts, type SortOption } from "../../utils/productSorting";
import { ProductCardLinkButton } from "../common/ProductCardLinkButton";
import { IconPickerModal } from "../common/IconPickerModal";
import { IconifyIcon } from "../common/IconifyIcon";

interface Dashboard4CategoriesProps {
  categories: Category[];
  products: Product[];
  onRefreshData: () => Promise<void>;
}

export const Dashboard4Categories: React.FC<Dashboard4CategoriesProps> = ({
  categories,
  products,
  onRefreshData,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setActiveTab, setSelectedDetailProductId, openEditModal, showToast } =
    useAppStore();

  useEffect(() => {
    animatePageIn(containerRef.current);
  }, []);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("lucide:layers");
  const [color, setColor] = useState("#2563EB");
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Dedicated Category Product List View State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSort, setSelectedSort] = useState<SortOption>("latest");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId) || null;
  }, [categories, selectedCategoryId]);

  // Products belonging to the selected category
  const categoryProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    return products.filter((p) => p.categoryId === selectedCategoryId);
  }, [products, selectedCategoryId]);

  // Filtered and sorted products for dedicated category view
  const filteredCategoryProducts = useMemo(() => {
    let result = categoryProducts.filter((p) => {
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        selectedStatus === "all" || p.status === selectedStatus;
      const matchPriority =
        selectedPriority === "all" || p.priority === selectedPriority;

      return matchSearch && matchStatus && matchPriority;
    });

    return sortProducts(result, selectedSort);
  }, [
    categoryProducts,
    searchQuery,
    selectedStatus,
    selectedPriority,
    selectedSort,
  ]);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Nama kategori wajib diisi", "error");
      return;
    }

    try {
      if (editingCatId) {
        await db.categories.update(editingCatId, {
          name: name.trim(),
          description: description.trim(),
          icon: icon || "lucide:layers",
          color: color || "#2563EB",
        });
        await addLog(
          "UPDATE",
          "category",
          `Memperbarui kategori: "${name.trim()}"`,
        );
        showToast("Kategori berhasil diperbarui", "success");
      } else {
        const newCat: Category = {
          id: "cat-" + Date.now(),
          name: name.trim(),
          description: description.trim(),
          icon: icon || "lucide:layers",
          color: color || "#2563EB",
          createdAt: Date.now(),
        };
        await db.categories.add(newCat);
        await addLog(
          "CREATE",
          "category",
          `Menambahkan kategori baru: "${name.trim()}"`,
        );
        showToast("Kategori baru berhasil ditambahkan", "success");
      }

      setName("");
      setDescription("");
      setIcon("lucide:layers");
      setColor("#2563EB");
      setEditingCatId(null);
      await onRefreshData();
    } catch (err) {
      console.error(err);
      showToast("Gagal menyimpan kategori", "error");
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
    setIcon(cat.icon || "lucide:layers");
    setColor(cat.color || "#2563EB");
  };

  const handleDeleteCategory = async (id: string, catName: string) => {
    try {
      await db.categories.delete(id);
      await addLog("DELETE", "category", `Menghapus kategori: "${catName}"`);
      await onRefreshData();
      setDeleteConfirmId(null);
      if (selectedCategoryId === id) {
        setSelectedCategoryId(null);
      }
      showToast(`Kategori "${catName}" berhasil dihapus`, "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal menghapus kategori", "error");
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
  // VIEW: Dedicated Category Product List Page
  // ==========================================
  if (selectedCategoryId && activeCategory) {
    const totalValue = categoryProducts.reduce(
      (sum, p) => sum + (p.price || 0),
      0,
    );

    return (
      <div ref={containerRef} className="space-y-4">
        {/* Header with Back Button */}
        <div className="flex flex-col gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => setSelectedCategoryId(null)}
              className="mb-1.5 flex items-center gap-1 font-mono text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Semua Kategori</span>
            </button>
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center border shadow-2xs shrink-0"
                style={{
                  borderColor: activeCategory.color || "#2563EB",
                  backgroundColor: `${activeCategory.color || "#2563EB"}15`,
                }}
              >
                <IconifyIcon
                  icon={activeCategory.icon || "lucide:layers"}
                  className="h-5 w-5"
                  color={activeCategory.color || "#2563EB"}
                />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-base font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                  Kategori: {activeCategory.name}
                </h1>
                <span className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-600 dark:text-zinc-300">
                  {categoryProducts.length} barang
                </span>
              </div>
            </div>
            {activeCategory.description && (
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {activeCategory.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1 font-mono text-xs text-zinc-800 dark:text-zinc-200">
              <span className="text-zinc-400 dark:text-zinc-500 mr-1">
                Alokasi:
              </span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {formatIDR(totalValue)}
              </span>
            </div>
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
          selectedCategory={selectedCategoryId}
          onCategoryChange={() => {}}
          categories={categories}
          showCategoryFilter={false}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          showStatusFilter={true}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          showPriorityFilter={true}
          totalFiltered={filteredCategoryProducts.length}
          totalAll={categoryProducts.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          placeholder={`Cari dalam kategori ${activeCategory.name}...`}
        />

        {/* Products Grid / Table */}
        {filteredCategoryProducts.length === 0 ? (
          <div className="border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {categoryProducts.length === 0
                ? `Belum ada barang impian dalam kategori "${activeCategory.name}".`
                : "Tidak ada barang yang cocok dengan filter atau pencarian Anda."}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredCategoryProducts.map((item) => (
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
                    <span className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.2 text-zinc-600 dark:text-zinc-300">
                      {activeCategory.name}
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
                {filteredCategoryProducts.map((p) => (
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
      </div>
    );
  }

  // ==========================================
  // VIEW: Main Category Management List
  // ==========================================
  return (
    <div ref={containerRef} className="space-y-6">
      {/* Title Bar */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <h1 className="font-mono text-base font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
          Daftar Kategori
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Tambah/Edit Kategori (4 cols) */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 lg:col-span-4 transition-colors">
          <div className="mb-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              {editingCatId ? "Edit Kategori" : "Tambah Kategori Baru"}
            </h2>
            {editingCatId && (
              <button
                type="button"
                onClick={() => {
                  setEditingCatId(null);
                  setName("");
                  setDescription("");
                  setIcon("lucide:layers");
                  setColor("#2563EB");
                }}
                className="font-mono text-[10px] text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Batal Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSaveCategory} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Nama Kategori
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
              />
            </div>

            {/* Icon & Color Selector using Iconify API */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Ikon
                </label>
              </div>
              <button
                type="button"
                onClick={() => setIsIconPickerOpen(true)}
                className="w-full flex items-center justify-between border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 p-2 hover:border-zinc-900 dark:hover:border-zinc-400 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center border"
                    style={{
                      borderColor: color || "#2563EB",
                      backgroundColor: `${color || "#2563EB"}15`,
                    }}
                  >
                    <IconifyIcon
                      icon={icon || "lucide:layers"}
                      className="h-4 w-4"
                      color={color || "#2563EB"}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {icon || "lucide:layers"}
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: color || "#2563EB" }}
                      />
                      <span>{color || "#2563EB"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 shrink-0">
                  <Sparkles className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
                  <span>Pilih Ikon</span>
                </div>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Deskripsi
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan deskripsi..."
                className="mt-1 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="flex h-8 w-full items-center justify-center gap-1.5 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>
                {editingCatId ? "Simpan Perubahan" : "Tambah Kategori"}
              </span>
            </button>
          </form>
        </div>

        {/* List of Categories (8 cols) */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 lg:col-span-8 transition-colors">
          <div className="mb-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Daftar Kategori Tersedia
              </h2>
            </div>
            <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
              {categories.length} kategori
            </span>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {categories.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
                Belum ada kategori yang dibuat.
              </div>
            ) : (
              categories.map((cat) => {
                const catProducts = products.filter(
                  (p) => p.categoryId === cat.id,
                );
                const catTotalBudget = catProducts.reduce(
                  (sum, p) => sum + p.price,
                  0,
                );

                return (
                  <div
                    key={cat.id}
                    className="flex flex-col justify-between gap-2 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 sm:flex-row sm:items-center transition-colors"
                  >
                    <div
                      className="cursor-pointer flex items-center gap-3"
                      onClick={() => setSelectedCategoryId(cat.id)}
                    >
                      {/* Iconify Category Icon Box */}
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center border shadow-2xs"
                        style={{
                          borderColor: cat.color || "#2563EB",
                          backgroundColor: `${cat.color || "#2563EB"}12`,
                        }}
                      >
                        <IconifyIcon
                          icon={cat.icon || "lucide:layers"}
                          className="h-5 w-5"
                          color={cat.color || "#2563EB"}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 hover:underline">
                            {cat.name}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-1">
                            {catProducts.length} barang
                          </span>
                        </div>
                        {cat.description && (
                          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                            {cat.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-1 text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
                          <CircleDollarSign className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
                          <span>
                            Total Anggaran: {formatIDR(catTotalBudget)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-[11px] text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        title="Buka Halaman Produk Kategori Ini"
                      >
                        <Package className="h-3 w-3" />
                        <span>Lihat Barang</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="border border-zinc-200 dark:border-zinc-700 p-1 text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                        title="Edit Kategori"
                      >
                        <Edit className="h-3 w-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(cat.id)}
                        className="border border-zinc-200 dark:border-zinc-700 p-1 text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                        title="Hapus Kategori"
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

      {/* Category Icon Picker Modal via Iconify API */}
      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        selectedIcon={icon}
        selectedColor={color}
        categoryName={name || "Contoh Kategori"}
        title="Icon Picker Kategori (Iconify API)"
        onSelect={(newIcon, newColor) => {
          setIcon(newIcon);
          setColor(newColor);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm border border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-xl">
            <h3 className="font-mono text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100">
              Hapus Kategori
            </h3>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Apakah Anda yakin ingin menghapus kategori ini? Barang yang
              sebelumnya menggunakan kategori ini akan dialihkan ke kategori
              umum.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = categories.find(
                    (c) => c.id === deleteConfirmId,
                  );
                  if (target) handleDeleteCategory(target.id, target.name);
                }}
                className="border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-3 py-1 text-xs text-white dark:text-zinc-900 font-semibold hover:bg-zinc-800 dark:hover:bg-white"
              >
                Hapus Kategori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
