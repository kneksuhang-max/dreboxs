import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  Star,
  Edit,
  Trash2,
  ExternalLink,
  Plus,
  LayoutGrid,
  List,
  Eye,
  ArrowUpDown,
  Filter,
  CheckCircle,
  Tag as TagIcon,
  Sparkles,
  RefreshCw,
  Hash,
  Layers,
  Package,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table";
import type { Product, Category, Tag } from "../../types";
import { formatIDR, formatDate } from "../../utils/formatters";
import { db, addLog } from "../../db/dexie";
import { useAppStore } from "../../store/useAppStore";
import { animatePageIn } from "../../utils/animations";
import {
  SORT_OPTIONS,
  sortProducts,
  type SortOption,
} from "../../utils/productSorting";
import { ProductCardLinkButton } from "../common/ProductCardLinkButton";
import {
  searchSmartEngine,
  getAutoSearchSuggestions,
  DEFAULT_SEARCH_WEIGHTS,
  type SearchWeights,
  type SearchHit,
  getMeiliClient,
  syncIndexToMeili,
} from "../../utils/meiliSearch";

interface Dashboard3ProductListProps {
  products: Product[];
  categories: Category[];
  tags: Tag[];
  onRefreshData: () => Promise<void>;
}

export const Dashboard3ProductList: React.FC<Dashboard3ProductListProps> = ({
  products,
  categories,
  tags,
  onRefreshData,
}) => {
  const {
    startEditProduct,
    openEditModal,
    setSelectedDetailProductId,
    setActiveTab,
    showToast,
    searchQuery,
    setSearchQuery,
  } = useAppStore();

  // Requirements:
  // "Tampilan Grid Card ubah menjadi Default."
  // "Search, Filter, dan Sort ubah default nya menjadi Tersembunyi/Hide."
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [showFilterSort, setShowFilterSort] = useState(false);
  const [selectedSort, setSelectedSort] = useState<SortOption>("latest");
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("all");
  const [selectedPriorityFilter, setSelectedPriorityFilter] =
    useState<string>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  // MeiliSearch / Smart Search State
  const [showRelevanceSettings, setShowRelevanceSettings] = useState(false);
  const [searchWeights, setSearchWeights] = useState<SearchWeights>(
    DEFAULT_SEARCH_WEIGHTS,
  );
  const [typoTolerance, setTypoTolerance] = useState(true);
  const [isSyncingMeili, setIsSyncingMeili] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    animatePageIn(pageRef.current);
  }, []);

  // Close auto-complete when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const catMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  // Real-time auto-complete suggestions
  const suggestions = useMemo(() => {
    return getAutoSearchSuggestions(searchQuery, products, categories, 6);
  }, [searchQuery, products, categories]);

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
        `${nextFav ? "Menandai sebagai favorit" : "Menghapus dari favorit"}: "${product.name}"`,
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

  // Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    try {
      await db.products.delete(id);
      await addLog("DELETE", "product", `Menghapus barang impian: "${name}"`);
      await onRefreshData();
      setDeleteConfirmId(null);
      showToast(`Barang "${name}" berhasil dihapus`, "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal menghapus barang", "error");
    }
  };

  // Sync to local/remote MeiliSearch instance
  const handleSyncMeiliSearch = async () => {
    setIsSyncingMeili(true);
    try {
      const client = getMeiliClient();
      if (!client) {
        showToast("Klien MeiliSearch tidak dapat diinisialisasi", "error");
        return;
      }
      const res = await syncIndexToMeili(
        client,
        "drebxs_products",
        products,
        categories,
      );
      if (res.success) {
        showToast(res.message, "success");
        await addLog("SYSTEM", "system", res.message);
      } else {
        showToast(
          `Sinkronisasi Meili: ${res.message}. Menggunakan Embedded Smart Engine.`,
          "info",
        );
      }
    } catch (err) {
      console.warn(err);
      showToast("Engine pencarian cerdas lokal aktif.", "info");
    } finally {
      setIsSyncingMeili(false);
    }
  };

  // MeiliSearch Smart Engine Filtering
  const { filteredProducts, searchHitMap } = useMemo(() => {
    // 1. Run smart search engine
    const searchHits = searchSmartEngine(
      searchQuery,
      products,
      categories,
      searchWeights,
      typoTolerance,
    );

    const hitMap = new Map<string, SearchHit>();
    searchHits.forEach((h) => hitMap.set(h.product.id, h));

    // 2. Apply dropdown filters
    const matched = searchHits
      .map((h) => h.product)
      .filter((p) => {
        const matchesCategory =
          selectedCategoryFilter === "all" ||
          p.categoryId === selectedCategoryFilter;
        const matchesStatus =
          selectedStatusFilter === "all"
            ? p.status !== "archived"
            : p.status === selectedStatusFilter;
        const matchesPriority =
          selectedPriorityFilter === "all" ||
          p.priority === selectedPriorityFilter;
        return matchesCategory && matchesStatus && matchesPriority;
      });

    // 3. Apply sort order
    const sorted =
      searchQuery.trim() && selectedSort === "latest"
        ? matched
        : sortProducts(matched, selectedSort);

    return { filteredProducts: sorted, searchHitMap: hitMap };
  }, [
    products,
    categories,
    searchQuery,
    searchWeights,
    typoTolerance,
    selectedCategoryFilter,
    selectedStatusFilter,
    selectedPriorityFilter,
    selectedSort,
  ]);

  // TanStack Table Columns
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: "favorite",
        header: "",
        cell: ({ row }) => {
          const isFav = row.original.isFavorite;
          return (
            <button
              type="button"
              onClick={(e) => handleToggleFavorite(row.original, e)}
              className="p-1 hover:text-zinc-900"
              title={isFav ? "Hapus dari Favorit" : "Tandai Favorit"}
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  isFav
                    ? "fill-zinc-900 text-zinc-900"
                    : "text-zinc-300 hover:text-zinc-600"
                }`}
              />
            </button>
          );
        },
        size: 30,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1 font-mono text-[11px] font-semibold text-zinc-700"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            NAMA BARANG IMPIAN
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2.5 py-1">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 border border-zinc-200 dark:border-zinc-700 object-cover shrink-0"
                />
              )}
              <div className="truncate">
                <div
                  onClick={() => setSelectedDetailProductId(item.id)}
                  className="cursor-pointer font-medium text-xs text-zinc-900 dark:text-zinc-100 hover:underline truncate"
                >
                  {item.name}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                  {item.tags.slice(0, 3).map((t) => (
                    <span key={t}>#{t}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "categoryId",
        header: "KATEGORI",
        cell: ({ row }) => {
          const catName = row.original.categoryId
            ? catMap.get(row.original.categoryId)
            : "Umum";
          return (
            <span className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-700 dark:text-zinc-300">
              {catName || "Umum"}
            </span>
          );
        },
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1 font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-300"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ESTIMASI HARGA
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {formatIDR(row.original.price)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "STATUS",
        cell: ({ row }) => {
          const s = row.original.status;
          return (
            <span
              className={`font-mono text-[10px] uppercase px-1.5 py-0.2 border ${
                s === "purchased"
                  ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : s === "planned"
                    ? "border-zinc-700 dark:border-zinc-500 text-zinc-800 dark:text-zinc-200"
                    : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {s === "dream"
                ? "Impian"
                : s === "planned"
                  ? "Direncanakan"
                  : s === "purchased"
                    ? "Tercapai"
                    : "Arsip"}
            </span>
          );
        },
      },
      {
        accessorKey: "priority",
        header: "PRIORITAS",
        cell: ({ row }) => {
          const p = row.original.priority;
          return (
            <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 uppercase">
              {p === "high" ? "Tinggi" : p === "medium" ? "Sedang" : "Rendah"}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1 font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-300"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            TANGGAL INPUT
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "AKSI",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedDetailProductId(item.id)}
                className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                title="Lihat Detail"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => startEditProduct(item.id)}
                className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                title="Edit Produk"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(item.id)}
                className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                title="Hapus Produk"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        },
      },
    ],
    [catMap],
  );

  const table = useReactTable({
    data: filteredProducts,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const totalFilteredBudget = filteredProducts.reduce((a, b) => a + b.price, 0);

  return (
    <div ref={pageRef} className="space-y-4">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-mono text-base font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
            Daftar Produk
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Search, Filter & Sort (Default Hidden) */}
          <button
            type="button"
            onClick={() => setShowFilterSort(!showFilterSort)}
            className={`flex h-8 items-center gap-1.5 border px-2.5 text-xs font-medium transition-colors ${
              showFilterSort
                ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold"
                : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300"
            }`}
            title="Sembunyikan/Tampilkan alat pencarian, filter, dan urutan"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>
              {showFilterSort ? "Tutup Filter & Urutan" : "Filter & Urutan"}
            </span>
            {(searchQuery ||
              selectedCategoryFilter !== "all" ||
              selectedStatusFilter !== "all" ||
              selectedPriorityFilter !== "all" ||
              selectedSort !== "latest") && (
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
            )}
            {showFilterSort ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {/* View switcher (Default Grid) */}
          <div className="flex items-center border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 transition-colors ${
                viewMode === "grid"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
              title="Tampilan Grid Card (Default)"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 transition-colors ${
                viewMode === "table"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
              title="Tampilan Tabel"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("form_logs")}
            className="flex h-8 items-center gap-1.5 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-3 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (Collapsible, Default Hidden) */}
      {showFilterSort && (
        <div className="space-y-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
            {/* Search input with Auto-Complete (4 cols) */}
            <div ref={searchContainerRef} className="relative sm:col-span-4">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Pencarian Cerdas: nama, tag (#), deskripsi..."
                className="h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-8 pr-8 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-[10px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  ✕
                </button>
              )}

              {/* Auto-Complete Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-9 z-30 divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg">
                  <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Sparkles className="h-2.5 w-2.5 text-zinc-700 dark:text-zinc-300" />{" "}
                      Saran Pencarian Otomatis
                    </span>
                    <span className="font-mono text-[9px]">
                      MeiliSearch Index
                    </span>
                  </div>
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSearchQuery(s.text.replace(/^#/, ""));
                        setShowSuggestions(false);
                      }}
                      className="flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <span className="font-mono text-zinc-900 dark:text-zinc-100 font-medium truncate">
                        {s.text}
                      </span>
                      <span className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1 py-0.2 font-mono text-[9px] uppercase text-zinc-500 dark:text-zinc-400">
                        {s.hint}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Control Dropdown (3 cols) */}
            <div className="sm:col-span-3">
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as SortOption)}
                className="h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter (2 cols) */}
            <div className="sm:col-span-2">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter (2 cols) */}
            <div className="sm:col-span-2">
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="dream">Impian</option>
                <option value="planned">Direncanakan</option>
                <option value="purchased">Tercapai</option>
                <option value="archived">Arsip</option>
              </select>
            </div>

            {/* Priority Filter (1 col) */}
            <div className="sm:col-span-1">
              <select
                value={selectedPriorityFilter}
                onChange={(e) => setSelectedPriorityFilter(e.target.value)}
                className="h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
              >
                <option value="all">Semua</option>
                <option value="high">Tinggi</option>
                <option value="medium">Sedang</option>
                <option value="low">Rendah</option>
              </select>
            </div>
          </div>

          {/* Reset Filters & Active summary */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSort("latest");
                  setSelectedCategoryFilter("all");
                  setSelectedStatusFilter("all");
                  setSelectedPriorityFilter("all");
                }}
                className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Filter</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRelevanceSettings(!showRelevanceSettings)}
                className={`flex items-center gap-1 border px-2 py-0.5 text-[11px] transition-colors ${
                  showRelevanceSettings
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                    : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <SlidersHorizontal className="h-3 w-3" />
                <span>Bobot Pencarian</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncMeiliSearch}
                disabled={isSyncingMeili}
                className="flex items-center gap-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isSyncingMeili ? "animate-spin" : ""}`}
                />
                <span>
                  {isSyncingMeili ? "Menyinkronkan..." : "Sinkron Meili"}
                </span>
              </button>
              <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                {filteredProducts.length} barang
              </span>
            </div>
          </div>

          {/* Collapsible Relevance Weights Settings Panel */}
          {showRelevanceSettings && (
            <div className="border border-zinc-900 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 p-3 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                <span className="font-mono text-[11px] font-bold uppercase text-zinc-900 dark:text-zinc-100">
                  Konfigurasi Bobot & Relevansi Pencarian
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Nilai bobot lebih tinggi memprioritaskan kecocokan atribut
                  tersebut
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="block font-mono text-[10px] text-zinc-700 dark:text-zinc-300 font-semibold">
                    Bobot Nama Produk ({searchWeights.name})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={searchWeights.name}
                    onChange={(e) =>
                      setSearchWeights({
                        ...searchWeights,
                        name: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full accent-zinc-900 dark:accent-zinc-100"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-zinc-700 dark:text-zinc-300 font-semibold">
                    Bobot Tag (#{searchWeights.tags})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={searchWeights.tags}
                    onChange={(e) =>
                      setSearchWeights({
                        ...searchWeights,
                        tags: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full accent-zinc-900 dark:accent-zinc-100"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-zinc-700 dark:text-zinc-300 font-semibold">
                    Bobot Kategori ({searchWeights.category})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={searchWeights.category}
                    onChange={(e) =>
                      setSearchWeights({
                        ...searchWeights,
                        category: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full accent-zinc-900 dark:accent-zinc-100"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-zinc-700 dark:text-zinc-300 font-semibold">
                    Bobot Deskripsi ({searchWeights.description})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={searchWeights.description}
                    onChange={(e) =>
                      setSearchWeights({
                        ...searchWeights,
                        description: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full accent-zinc-900 dark:accent-zinc-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={typoTolerance}
                    onChange={(e) => setTypoTolerance(e.target.checked)}
                    className="h-3.5 w-3.5 rounded-none border-zinc-400 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:ring-0"
                  />
                  <span>
                    Toleransi Salah Ketik (Typo Tolerance / Levenshtein
                    Distance)
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setSearchWeights(DEFAULT_SEARCH_WEIGHTS);
                    setTypoTolerance(true);
                    showToast(
                      "Bobot relevansi dikembalikan ke default",
                      "info",
                    );
                  }}
                  className="text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Reset Default
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-header tally */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        <div>
          Menampilkan{" "}
          <strong className="font-mono text-zinc-900 dark:text-zinc-100">
            {filteredProducts.length}
          </strong>{" "}
          barang
          {searchQuery && <span> untuk pencarian "{searchQuery}"</span>}
        </div>
        <div className="font-mono text-zinc-800 dark:text-zinc-200">
          Subtotal Filter: <strong>{formatIDR(totalFilteredBudget)}</strong>
        </div>
      </div>

      {/* View 1: TanStack Table */}
      {viewMode === "table" && (
        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <table className="w-full min-w-180 text-left text-xs">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 font-mono text-[11px] text-zinc-600 dark:text-zinc-400"
                >
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-3 py-2.5 font-semibold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-8 text-center text-zinc-400 dark:text-zinc-500"
                  >
                    Tidak ada barang impian yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-3 py-2 text-zinc-800 dark:text-zinc-200"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View 2: Grid Cards */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-zinc-400 dark:text-zinc-500">
              Tidak ada barang impian yang ditemukan.
            </div>
          ) : (
            filteredProducts.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedDetailProductId(item.id)}
                className="group flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 hover:border-zinc-900 dark:hover:border-zinc-300 transition-colors cursor-pointer"
              >
                <div>
                  {/* Photo thumbnail */}
                  {item.imageUrl ? (
                    <div className="mb-2 h-36 w-full border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover  group-hover:scale-102 transition-transform duration-200"
                      />
                    </div>
                  ) : (
                    <div className="mb-2 flex h-24 w-full items-center justify-center border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600">
                      <span className="font-mono text-[10px] uppercase">
                        Tanpa Foto
                      </span>
                    </div>
                  )}

                  {/* Top Bar: Category and Favorite */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.2 text-zinc-600 dark:text-zinc-300">
                      {item.categoryId
                        ? catMap.get(item.categoryId) || "Umum"
                        : "Umum"}
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

                  {/* Title */}
                  <div className="mt-1 font-medium text-xs text-zinc-900 dark:text-zinc-100 group-hover:underline line-clamp-2">
                    {item.name}
                  </div>

                  {/* Price */}
                  <div className="mt-1 font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {formatIDR(item.price)}
                  </div>

                  {/* Tags */}
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

                  {/* MeiliSearch Hit Relevance Badge */}
                  {searchQuery && searchHitMap.get(item.id) && (
                    <div className="mt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-1.5">
                      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 dark:text-zinc-400">
                        <span>
                          Cocok pada:{" "}
                          <strong className="text-zinc-800 dark:text-zinc-200 uppercase">
                            {searchHitMap.get(item.id)?.matchField}
                          </strong>
                        </span>
                        <span className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1 font-bold text-zinc-900 dark:text-zinc-100">
                          Skor {searchHitMap.get(item.id)?.score}
                        </span>
                      </div>
                      {searchHitMap.get(item.id)?.snippet && (
                        <p className="mt-1 border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-1 font-mono text-[9px] text-zinc-600 dark:text-zinc-300 line-clamp-1">
                          "{searchHitMap.get(item.id)?.snippet}"
                        </p>
                      )}
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

                {/* Card Actions Footer */}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 text-[11px]"></span>

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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(item.id);
                      }}
                      className="border border-zinc-200 dark:border-zinc-700 p-1 text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                      title="Hapus"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm border border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-xl">
            <h3 className="font-mono text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100">
              Konfirmasi
            </h3>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Apakah Anda yakin ingin menghapus barang ini secara permanen.
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
                  const target = products.find((p) => p.id === deleteConfirmId);
                  if (target) handleDeleteProduct(target.id, target.name);
                }}
                className="border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-3 py-1 text-xs text-white dark:text-zinc-900 font-semibold hover:bg-zinc-800 dark:hover:bg-white"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
