import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Star,
  Package,
  Edit,
  ExternalLink,
  Eye,
  CircleDollarSign,
} from "lucide-react";
import type { Product, Category } from "../../types";
import { db, addLog } from "../../db/dexie";
import { formatIDR, formatDate } from "../../utils/formatters";
import { useAppStore } from "../../store/useAppStore";
import { animatePageIn } from "../../utils/animations";
import { ProductSortFilterBar } from "../common/ProductSortFilterBar";
import { sortProducts, type SortOption } from "../../utils/productSorting";
import { ProductCardLinkButton } from "../common/ProductCardLinkButton";

interface Dashboard6FavoritesProps {
  products: Product[];
  categories: Category[];
  onRefreshData: () => Promise<void>;
}

export const Dashboard6Favorites: React.FC<Dashboard6FavoritesProps> = ({
  products,
  categories,
  onRefreshData,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { openEditModal, setSelectedDetailProductId, setActiveTab, showToast } =
    useAppStore();

  useEffect(() => {
    animatePageIn(containerRef.current);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState<SortOption>("latest");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const favoriteProducts = useMemo(() => {
    return products.filter((p) => p.isFavorite && p.status !== "archived");
  }, [products]);

  const totalFavoriteBudget = useMemo(() => {
    return favoriteProducts.reduce((acc, p) => acc + (p.price || 0), 0);
  }, [favoriteProducts]);

  const catMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const filteredFavorites = useMemo(() => {
    let result = favoriteProducts.filter((p) => {
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === "all" || p.categoryId === selectedCategory;
      const matchPriority =
        selectedPriority === "all" || p.priority === selectedPriority;

      return matchSearch && matchCategory && matchPriority;
    });

    return sortProducts(result, selectedSort);
  }, [
    favoriteProducts,
    searchQuery,
    selectedCategory,
    selectedPriority,
    selectedSort,
  ]);

  const handleToggleFavorite = async (
    product: Product,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    try {
      await db.products.update(product.id, {
        isFavorite: false,
        updatedAt: Date.now(),
      });
      await addLog(
        "UPDATE",
        "product",
        `Menghapus dari favorit: "${product.name}"`,
      );
      await onRefreshData();
      showToast(`"${product.name}" dihapus dari daftar favorit`, "info");
    } catch (err) {
      console.error(err);
      showToast("Gagal mengubah status favorit", "error");
    }
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 sm:flex-row sm:items-center">
        
        <div>
          
          <h1 className="font-mono text-base font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
            Daftar Produk Favorit
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">
              Total Harga Favorit:{" "}
            </span>
            <strong className="font-mono text-zinc-900 dark:text-zinc-100">
              {formatIDR(totalFavoriteBudget)}
            </strong>
          </div>
        </div>
      </div>

      {/* Collapsible Filter & Sort Bar (Default Hidden) */}
      {favoriteProducts.length > 0 && (
        <ProductSortFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          showCategoryFilter={true}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          showPriorityFilter={true}
          totalFiltered={filteredFavorites.length}
          totalAll={favoriteProducts.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          placeholder="Cari dalam barang favorit..."
        />
      )}

      {favoriteProducts.length === 0 ? (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center">
          <Star className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <h3 className="mt-2 font-mono text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100">
            Belum Ada Produk Favorit
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Beri tanda bintang pada barang di Daftar Produk untuk memunculkannya
            di sini.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className="mt-4 inline-flex items-center gap-1.5 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white"
          >
            <Package className="h-3.5 w-3.5" />
            <span>Buka Daftar Produk</span>
          </button>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
          Tidak ada barang favorit yang sesuai dengan filter atau pencarian
          Anda.
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredFavorites.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedDetailProductId(item.id)}
              className="group flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 hover:border-zinc-900 dark:hover:border-zinc-300 transition-colors cursor-pointer"
            >
              <div>
                {/* Photo thumbnail */}
                {item.imageUrl ? (
                  <div className="mb-2 h-36 w-full overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
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

                {/* Top header */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.2 text-zinc-700 dark:text-zinc-300">
                    {item.categoryId
                      ? catMap.get(item.categoryId) || "Umum"
                      : "Umum"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(item, e)}
                    className="p-1 text-zinc-800 dark:text-zinc-200 hover:text-zinc-500"
                    title="Hapus dari Favorit"
                  >
                    <Star className="h-3.5 w-3.5 fill-zinc-900 dark:fill-zinc-100 text-zinc-900 dark:text-zinc-100" />
                  </button>
                </div>

                <div className="mt-1.5 font-medium text-xs text-zinc-900 dark:text-zinc-100 group-hover:underline line-clamp-2">
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
                        className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1 py-0.2"
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

              {/* Card Footer */}
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
                    className="border border-zinc-200 dark:border-zinc-700 p-1 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                    title="Edit Data"
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
                <th className="p-2.5">Kategori</th>
                <th className="p-2.5">Harga</th>
                <th className="p-2.5">Prioritas</th>
                <th className="p-2.5">Tanggal</th>
                <th className="p-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredFavorites.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedDetailProductId(p.id)}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                >
                  <td className="p-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                    {p.name}
                  </td>
                  <td className="p-2.5 text-zinc-600 dark:text-zinc-400">
                    {catMap.get(p.categoryId || "") || "-"}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {formatIDR(p.price)}
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
};
