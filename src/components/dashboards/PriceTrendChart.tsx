import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp, Calendar, Layers, Activity } from "lucide-react";
import type { Product, LogEntry } from "../../types";
import { formatIDR } from "../../utils/formatters";
import { useTheme } from "../../context/ThemeContext";

interface PriceTrendChartProps {
  products: Product[];
  logs?: LogEntry[];
}

interface TrendPoint {
  date: string;
  timestamp: number;
  totalValue: number;
  itemCount: number;
  detail: string;
}

export const PriceTrendChart: React.FC<PriceTrendChartProps> = ({
  products,
  logs = [],
}) => {
  const { isDark } = useTheme();
  const [selectedView, setSelectedView] = useState<"cumulative" | "items">(
    "cumulative",
  );
  const [selectedProductId, setSelectedProductId] = useState<string>("all");

  // 1. Build cumulative portfolio timeline from product creation and updates
  const chartData = useMemo(() => {
    if (!products || products.length === 0) return [];

    if (selectedView === "cumulative") {
      // Sort products by creation date
      const sorted = [...products].sort((a, b) => a.createdAt - b.createdAt);
      const points: TrendPoint[] = [];
      let runningTotal = 0;
      let runningCount = 0;

      // Group by date formatted as DD/MM/YY
      const dateMap = new Map<
        string,
        { total: number; count: number; lastTs: number; details: string[] }
      >();

      sorted.forEach((p) => {
        const d = new Date(p.createdAt);
        const key = d.toLocaleDateString("id-ID", {
          month: "short",
          year: "2-digit",
        });
        runningTotal += p.price;
        runningCount += 1;

        dateMap.set(key, {
          total: runningTotal,
          count: runningCount,
          lastTs: p.createdAt,
          details: [...(dateMap.get(key)?.details || []), p.name],
        });
      });

      dateMap.forEach((val, key) => {
        points.push({
          date: key,
          timestamp: val.lastTs,
          totalValue: val.total,
          itemCount: val.count,
          detail:
            val.details.slice(0, 2).join(", ") +
            (val.details.length > 2
              ? ` (+${val.details.length - 2} lainnya)`
              : ""),
        });
      });

      // Ensure at least two points for a clean chart line
      if (points.length === 1) {
        const first = points[0];
        const prevMonth = new Date(first.timestamp - 30 * 86400000);
        const prevKey = prevMonth.toLocaleDateString("id-ID", {
          month: "short",
          year: "2-digit",
        });
        points.unshift({
          date: prevKey,
          timestamp: prevMonth.getTime(),
          totalValue: 0,
          itemCount: 0,
          detail: "Titik Awal Koleksi",
        });
      }

      return points;
    } else {
      // Individual product price history from logs and current price
      const targetProducts =
        selectedProductId === "all"
          ? products.slice(0, 8)
          : products.filter((p) => p.id === selectedProductId);

      const points: {
        date: string;
        timestamp: number;
        price: number;
        name: string;
      }[] = [];

      targetProducts.forEach((prod) => {
        // Find relevant logs for this product
        const prodLogs = logs.filter(
          (l) =>
            l.entity === "product" &&
            l.details.toLowerCase().includes(prod.name.toLowerCase()),
        );

        // Add initial point
        const createdDate = new Date(prod.createdAt).toLocaleDateString(
          "id-ID",
          {
            day: "numeric",
            month: "short",
          },
        );
        points.push({
          date: createdDate,
          timestamp: prod.createdAt,
          price: prod.price,
          name: prod.name,
        });

        // Add points from logs if timestamps differ
        prodLogs.forEach((l) => {
          if (Math.abs(l.timestamp - prod.createdAt) > 60000) {
            points.push({
              date: new Date(l.timestamp).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              }),
              timestamp: l.timestamp,
              price: prod.price, // Dexie stores latest, could be extended if history logs store old price
              name: prod.name,
            });
          }
        });
      });

      return points.sort((a, b) => a.timestamp - b.timestamp);
    }
  }, [products, logs, selectedView, selectedProductId]);

  const gridColor = isDark ? "#27272a" : "#f4f4f5";
  const axisColor = isDark ? "#a1a1aa" : "#71717a";
  const strokeColor = isDark ? "#f4f4f5" : "#18181b";
  const fillGradientId = isDark ? "trendGradientDark" : "trendGradientLight";

  const totalCurrentValue = products.reduce((acc, p) => acc + p.price, 0);

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-colors">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Visualisasi Tren Harga & Akumulasi Nilai Impian
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Riwayat evolusi anggaran barang impian dari waktu ke waktu
              berdasarkan data log
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <div className="flex border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setSelectedView("cumulative")}
              className={`px-2.5 py-1 transition-colors ${
                selectedView === "cumulative"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Akumulasi Total
            </button>
            <button
              type="button"
              onClick={() => setSelectedView("items")}
              className={`px-2.5 py-1 transition-colors ${
                selectedView === "items"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Per Barang
            </button>
          </div>

          {selectedView === "items" && products.length > 0 && (
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="h-7 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
            >
              <option value="all">Semua Barang Teratas</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name.length > 20 ? p.name.slice(0, 20) + "..." : p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 p-2.5">
        <div>
          <span className="font-mono text-[10px] uppercase text-zinc-500 dark:text-zinc-400">
            Total Akumulasi
          </span>
          <div className="font-mono text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {formatIDR(totalCurrentValue)}
          </div>
        </div>
        <div>
          <span className="font-mono text-[10px] uppercase text-zinc-500 dark:text-zinc-400">
            Jumlah Entri
          </span>
          <div className="font-mono text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {products.length} Barang Impian
          </div>
        </div>
        <div>
          <span className="font-mono text-[10px] uppercase text-zinc-500 dark:text-zinc-400">
            Rata-rata Nilai
          </span>
          <div className="font-mono text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {products.length > 0
              ? formatIDR(Math.round(totalCurrentValue / products.length))
              : "Rp 0"}
          </div>
        </div>
        <div>
          <span className="font-mono text-[10px] uppercase text-zinc-500 dark:text-zinc-400">
            Status Database
          </span>
          <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
            <Activity className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
            <span>Terpantau Real-Time</span>
          </div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="mt-4 h-64 w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400 dark:text-zinc-500">
            Belum ada data riwayat harga yang cukup untuk divisualisasikan.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData as any}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="trendGradientLight"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#18181b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="trendGradientDark"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#fafafa" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#fafafa" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
              />

              <XAxis
                dataKey="date"
                stroke={axisColor}
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
                tickLine={false}
                axisLine={{ stroke: gridColor }}
              />

              <YAxis
                stroke={axisColor}
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                tickFormatter={(val) => {
                  if (val >= 1000000000)
                    return `Rp ${(val / 1000000000).toFixed(1)}M`;
                  if (val >= 1000000)
                    return `Rp ${(val / 1000000).toFixed(0)}Jt`;
                  if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}Rb`;
                  return `Rp ${val}`;
                }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="border border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-950 p-2.5 shadow-lg font-mono text-xs">
                        <div className="flex items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-1 text-zinc-500 dark:text-zinc-400 text-[10px]">
                          <span>{data.date}</span>
                          {data.itemCount !== undefined && (
                            <span>{data.itemCount} barang</span>
                          )}
                        </div>
                        <div className="mt-1 font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                          {formatIDR(
                            data.totalValue !== undefined
                              ? data.totalValue
                              : data.price,
                          )}
                        </div>
                        {data.detail && (
                          <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                            {data.detail}
                          </div>
                        )}
                        {data.name && (
                          <div className="mt-1 text-[11px] text-zinc-700 dark:text-zinc-300 font-sans">
                            {data.name}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey={selectedView === "cumulative" ? "totalValue" : "price"}
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#${fillGradientId})`}
                dot={{
                  stroke: strokeColor,
                  strokeWidth: 2,
                  r: 3,
                  fill: isDark ? "#18181b" : "#ffffff",
                }}
                activeDot={{ r: 5, stroke: strokeColor, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
