import React, { useState, useEffect, useRef } from "react";
import {
  Package,
  Star,
  Layers,
  ArrowUpRight,
  Calendar,
  FileText,
  Send,
  Plus,
  BarChart3,
  Percent,
  CircleDollarSign,
} from "lucide-react";
import type { Product, Category, LogEntry } from "../../types";
import { formatIDR, formatMonthYear } from "../../utils/formatters";
import { useAppStore } from "../../store/useAppStore";
import { animatePageIn } from "../../utils/animations";
import { PriceTrendChart } from "./PriceTrendChart";

interface Dashboard1OverviewProps {
  products: Product[];
  categories: Category[];
  logs?: LogEntry[];
  onExportPDF: () => void;
  onSendTelegram: () => void;
  isSendingTelegram: boolean;
}

export const Dashboard1Overview: React.FC<Dashboard1OverviewProps> = ({
  products,
  categories,
  logs = [],
  onExportPDF,
  onSendTelegram,
  isSendingTelegram,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setActiveTab, startEditProduct } = useAppStore();
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>("all");

  useEffect(() => {
    animatePageIn(containerRef.current);
  }, []);

  // Calculations
  const totalItems = products.length;
  const totalBudget = products.reduce(
    (acc, curr) => acc + (curr.price || 0),
    0,
  );
  const averagePrice =
    totalItems > 0 ? Math.round(totalBudget / totalItems) : 0;
  const favoriteCount = products.filter((p) => p.isFavorite).length;
  const purchasedCount = products.filter(
    (p) => p.status === "purchased",
  ).length;
  const purchasedValue = products
    .filter((p) => p.status === "purchased")
    .reduce((a, b) => a + b.price, 0);

  // Category distribution
  const categoryStats = categories
    .map((cat) => {
      const items = products.filter((p) => p.categoryId === cat.id);
      const subtotal = items.reduce((acc, curr) => acc + curr.price, 0);
      const percent = totalBudget > 0 ? (subtotal / totalBudget) * 100 : 0;
      return {
        category: cat,
        count: items.length,
        subtotal,
        percent: percent.toFixed(1),
      };
    })
    .sort((a, b) => b.subtotal - a.subtotal);

  // Monthly breakdown
  const monthlyMap = new Map<
    string,
    { count: number; total: number; items: Product[] }
  >();
  products.forEach((p) => {
    const m = p.targetMonth || "Belum Dijadwalkan";
    const curr = monthlyMap.get(m) || { count: 0, total: 0, items: [] };
    curr.count += 1;
    curr.total += p.price;
    curr.items.push(p);
    monthlyMap.set(m, curr);
  });

  const monthlyList = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      label:
        month === "Belum Dijadwalkan"
          ? "Fleksibel / Belum Dijadwalkan"
          : formatMonthYear(month),
      ...data,
    }))
    .sort((a, b) =>
      a.month === "Belum Dijadwalkan"
        ? 1
        : b.month === "Belum Dijadwalkan"
          ? -1
          : a.month.localeCompare(b.month),
    );

  // Filtered monthly items for deep analysis table
  const currentMonthData =
    selectedMonthFilter === "all"
      ? null
      : monthlyList.find((m) => m.month === selectedMonthFilter);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-mono text-base font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
            Ikhtisar & Laporan Bulanan
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("form_logs")}
            className="flex h-9 sm:h-8 items-center justify-center gap-1.5 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-3 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Barang</span>
          </button>

          <button
            type="button"
            onClick={onExportPDF}
            className="flex h-9 sm:h-8 items-center justify-center gap-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Unduh PDF</span>
          </button>

          <button
            type="button"
            onClick={onSendTelegram}
            disabled={isSendingTelegram}
            className="flex h-9 sm:h-8 items-center justify-center gap-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            <Send className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>
              {isSendingTelegram
                ? "Mengirim..."
                : "Kirim ke Telegram"}
            </span>
          </button>
        </div>
      </div>

      {/* Real-Time KPI Cards (Ultra Minimalist Grid) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {/* Card 1: Total Barang */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:p-3.5 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider">
              Total Produk
            </span>
            <Package className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
          </div>
          <div className="mt-2 font-mono text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {totalItems}
          </div>
          <div className="mt-1 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
            {purchasedCount} item telah tercapai
          </div>
        </div>

        {/* Card 2: Total Nilai Impian */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:p-3.5 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider">
              Total Harga
            </span>
            <CircleDollarSign className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
          </div>
          <div
            className="mt-2 truncate font-mono text-sm sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
            title={formatIDR(totalBudget)}
          >
            {formatIDR(totalBudget)}
          </div>
          <div className="mt-1 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
            Rata-rata {formatIDR(averagePrice)}
          </div>
        </div>

        {/* Card 3: Prioritas / Favorit */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:p-3.5 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider">
              Favorit & Prioritas
            </span>
            <Star className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
          </div>
          <div className="mt-2 font-mono text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {favoriteCount}
          </div>
          <div className="mt-1 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
            Barang paling diutamakan
          </div>
        </div>

        {/* Card 4: Kategori Aktif */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:p-3.5 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider">
              Kategori Terdaftar
            </span>
            <Layers className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
          </div>
          <div className="mt-2 font-mono text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {categories.length}
          </div>
          <div className="mt-1 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
            Terdistribusi rapi
          </div>
        </div>
      </div>

      {/* Visualisasi Tren Harga Recharts */}
      <PriceTrendChart products={products} logs={logs} />

      {/* Two Column Layout: Kategori Breakdown & Ringkasan Laporan Bulanan */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Col: Distribusi Kategori (5 Cols) */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 lg:col-span-5 transition-colors">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Alokasi Kategori
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("categories")}
              className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-0.5"
            >
              Kelola <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {categoryStats.length === 0 ? (
              <p className="py-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
                Belum ada kategori terdaftar.
              </p>
            ) : (
              categoryStats.map((item) => (
                <div key={item.category.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {item.category.name}
                    </span>
                    <span className="font-mono text-zinc-600 dark:text-zinc-400">
                      {formatIDR(item.subtotal)} ({item.percent}%)
                    </span>
                  </div>
                  {/* Ultra Minimalist Progress Bar: Flat 2px height */}
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full bg-zinc-900 dark:bg-zinc-100"
                      style={{
                        width: `${Math.min(100, parseFloat(item.percent))}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
                    <span>{item.count} barang</span>
                    <span>{item.category.description || ""}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Modul Laporan Bulanan untuk Analisis Mendalam (7 Cols) */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 lg:col-span-7 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Laporan Bulanan & Proyeksi Target
              </h2>
            </div>

            {/* Filter Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">
                Filter Bulan:
              </span>
              <select
                value={selectedMonthFilter}
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                className="h-7 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
              >
                <option value="all">Semua Bulan ({monthlyList.length})</option>
                {monthlyList.map((m) => (
                  <option key={m.month} value={m.month}>
                    {m.label} ({m.count} item)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly Report Data Table */}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                  <th className="px-3 py-2 font-medium">Target Periode</th>
                  <th className="px-3 py-2 text-center font-medium">
                    Jumlah Item
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Estimasi Biaya
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Porsi Anggaran
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {monthlyList.map((m) => {
                  const share =
                    totalBudget > 0
                      ? ((m.total / totalBudget) * 100).toFixed(1)
                      : "0";
                  const isHighlighted = selectedMonthFilter === m.month;
                  return (
                    <tr
                      key={m.month}
                      onClick={() =>
                        setSelectedMonthFilter(
                          selectedMonthFilter === m.month ? "all" : m.month,
                        )
                      }
                      className={`cursor-pointer transition-colors ${
                        isHighlighted
                          ? "bg-zinc-100 dark:bg-zinc-800 font-semibold"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                        {m.label}
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-zinc-700 dark:text-zinc-300">
                        {m.count}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-900 dark:text-zinc-100">
                        {formatIDR(m.total)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-500 dark:text-zinc-400">
                        {share}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Drill-down list if specific month is selected */}
          {currentMonthData && (
            <div className="mt-4 border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                Rincian Barang untuk: {currentMonthData.label}
              </div>
              <div className="space-y-1.5">
                {currentMonthData.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => startEditProduct(item.id)}
                    className="flex cursor-pointer items-center justify-between border border-zinc-100 dark:border-zinc-800 px-2.5 py-1.5 text-xs hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800"
                  >
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {item.name}
                    </span>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300">
                      {formatIDR(item.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Footer Insight */}
          <div className="mt-4 border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 text-[11px] text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-100">
              <Percent className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
              <span>Analisis Realisasi:</span>
            </div>
            <p className="mt-1 leading-relaxed">
              Sebanyak{" "}
              <strong className="font-mono text-zinc-900 dark:text-zinc-100">
                {purchasedCount}
              </strong>{" "}
              dari{" "}
              <strong className="font-mono text-zinc-900 dark:text-zinc-100">
                {totalItems}
              </strong>{" "}
              barang impian telah terealisasi ({formatIDR(purchasedValue)}).
              Untuk mencapai sisa target dibutuhkan alokasi sebesar{" "}
              <strong className="font-mono text-zinc-900 dark:text-zinc-100">
                {formatIDR(totalBudget - purchasedValue)}
              </strong>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access: Top 5 Highest Priority Dream Items */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-colors">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Barang Impian Utama & Prioritas Tinggi
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-0.5"
          >
            Lihat Semua ({products.length}) <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {products
            .filter((p) => p.isFavorite || p.priority === "high")
            .slice(0, 6)
            .map((item) => (
              <div
                key={item.id}
                onClick={() => startEditProduct(item.id)}
                className="group cursor-pointer border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 transition-colors hover:border-zinc-900 dark:hover:border-zinc-400"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-xs text-zinc-900 dark:text-zinc-100 group-hover:underline">
                    {item.name}
                  </div>
                  {item.isFavorite && (
                    <Star className="h-3.5 w-3.5 shrink-0 fill-zinc-900 dark:fill-zinc-100 text-zinc-900 dark:text-zinc-100" />
                  )}
                </div>
                <div className="mt-1 font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatIDR(item.price)}
                </div>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                  {item.targetMonth && (
                    <span className="border border-zinc-200 dark:border-zinc-700 px-1 py-0.2">
                      {formatMonthYear(item.targetMonth)}
                    </span>
                  )}
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      className="border border-zinc-200 dark:border-zinc-700 px-1 py-0.2"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
