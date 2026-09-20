import React, { useState } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Layers,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Sparkles,
} from "lucide-react";
import type { Category } from "../../types";
import { SORT_OPTIONS, type SortOption } from "../../utils/productSorting";

interface ProductSortFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  categories: Category[];
  showCategoryFilter?: boolean;
  selectedSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  showStatusFilter?: boolean;
  selectedPriority?: string;
  onPriorityChange?: (priority: string) => void;
  showPriorityFilter?: boolean;
  totalFiltered: number;
  totalAll?: number;
  viewMode?: "grid" | "table";
  onViewModeChange?: (mode: "grid" | "table") => void;
  placeholder?: string;
  onResetFilters?: () => void;
}

export const ProductSortFilterBar: React.FC<ProductSortFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  showCategoryFilter = true,
  selectedSort,
  onSortChange,
  selectedStatus = "all",
  onStatusChange,
  showStatusFilter = false,
  selectedPriority = "all",
  onPriorityChange,
  showPriorityFilter = false,
  totalFiltered,
  totalAll,
  viewMode = "grid",
  onViewModeChange,
  placeholder = "Cari barang, tag (#), atau deskripsi...",
  onResetFilters,
}) => {
  // Requirement: "Search, Filter, dan Sort ubah default nya menjadi Tersembunyi/Hide"
  const [isOpen, setIsOpen] = useState(false);

  // Check if any filter or non-default sort is active
  const isFiltered =
    Boolean(searchQuery.trim()) ||
    (showCategoryFilter && selectedCategory !== "all") ||
    (showStatusFilter && selectedStatus !== "all") ||
    (showPriorityFilter && selectedPriority !== "all") ||
    selectedSort !== "latest";

  const handleReset = () => {
    onSearchChange("");
    if (showCategoryFilter) onCategoryChange("all");
    if (showStatusFilter && onStatusChange) onStatusChange("all");
    if (showPriorityFilter && onPriorityChange) onPriorityChange("all");
    onSortChange("latest");
    if (onResetFilters) onResetFilters();
  };

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors">
      {/* Top Bar Header: Toggle Button & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:px-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isOpen
                ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold"
                : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-400"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>
              {isOpen
                ? "Sembunyikan Filter & Urutan"
                : "Tampilkan Filter & Urutan"}
            </span>
            {isOpen ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {isFiltered && (
            <span className="flex items-center gap-1 border border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-900 dark:text-zinc-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Filter Aktif
            </span>
          )}

          {isFiltered && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline decoration-dotted"
              title="Reset semua filter ke default"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            <strong className="text-zinc-900 dark:text-zinc-100">
              {totalFiltered}
            </strong>
            {totalAll !== undefined && totalAll !== totalFiltered && (
              <span> dari {totalAll}</span>
            )}{" "}
            barang
          </span>

          {onViewModeChange && (
            <div className="flex items-center border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800">
              <button
                type="button"
                onClick={() => onViewModeChange("grid")}
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
                onClick={() => onViewModeChange("table")}
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
          )}
        </div>
      </div>

      {/* Collapsible Panel: Search, Category, Sorting, Status, and Priority */}
      {isOpen && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-3 space-y-3">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
            {/* Search Input (5 or 6 cols) */}
            <div className="relative sm:col-span-6 lg:col-span-5">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={placeholder}
                className="h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-8 pr-7 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 top-2 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown Kontrol Urutan / Sorting (4 cols) */}
            <div className="sm:col-span-6 lg:col-span-4">
              <div className="relative">
                <select
                  value={selectedSort}
                  onChange={(e) => onSortChange(e.target.value as SortOption)}
                  className="h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Urutkan: {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Kategori (3 cols) */}
            {showCategoryFilter && (
              <div className="sm:col-span-6 lg:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                >
                  <option value="all">
                    Semua Kategori ({categories.length})
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter Status (Optional, 2 or 3 cols) */}
            {showStatusFilter && onStatusChange && (
              <div className="sm:col-span-3 lg:col-span-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => onStatusChange(e.target.value)}
                  className="h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="dream">Impian</option>
                  <option value="planned">Direncanakan</option>
                  <option value="purchased">Tercapai</option>
                  <option value="archived">Arsip</option>
                </select>
              </div>
            )}

            {/* Filter Prioritas (Optional, 2 or 3 cols) */}
            {showPriorityFilter && onPriorityChange && (
              <div className="sm:col-span-3 lg:col-span-2">
                <select
                  value={selectedPriority}
                  onChange={(e) => onPriorityChange(e.target.value)}
                  className="h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                >
                  <option value="all">Semua Prioritas</option>
                  <option value="high">Prioritas Tinggi</option>
                  <option value="medium">Prioritas Sedang</option>
                  <option value="low">Prioritas Rendah</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
