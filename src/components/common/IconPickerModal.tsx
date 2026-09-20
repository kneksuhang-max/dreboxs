import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Check,
  Palette,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { IconifyIcon } from "./IconifyIcon";

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIcon: string;
  selectedColor?: string;
  onSelect: (icon: string, color: string) => void;
  title?: string;
  categoryName?: string;
}

// Curated Icon Collections with Lucide and Simple Icons identifiers
const CURATED_CATEGORIES: { name: string; icons: string[] }[] = [
  {
    name: "Gadget & Teknologi",
    icons: [
      "lucide:laptop",
      "lucide:smartphone",
      "lucide:headphones",
      "lucide:camera",
      "lucide:watch",
      "lucide:cpu",
      "lucide:monitor",
      "lucide:tablet",
      "lucide:speaker",
      "lucide:gamepad-2",
      "lucide:hard-drive",
      "lucide:mouse",
    ],
  },
  {
    name: "Kerja & Kantor",
    icons: [
      "lucide:briefcase",
      "lucide:folder",
      "lucide:pen-tool",
      "lucide:calendar",
      "lucide:file-text",
      "lucide:bookmark",
      "lucide:archive",
      "lucide:clipboard-list",
      "lucide:layers",
      "lucide:printer",
    ],
  },
  {
    name: "Hobi & Hiburan",
    icons: [
      "lucide:music",
      "lucide:palette",
      "lucide:film",
      "lucide:dice-5",
      "lucide:guitar",
      "lucide:radio",
      "lucide:mic",
      "lucide:disc",
      "lucide:ticket",
      "lucide:clapperboard",
    ],
  },
  {
    name: "Kendaraan & Mobilitas",
    icons: [
      "lucide:car",
      "lucide:bike",
      "lucide:plane",
      "lucide:ship",
      "lucide:fuel",
      "lucide:navigation",
      "lucide:gauge",
      "lucide:compass",
      "lucide:key",
      "lucide:map-pin",
    ],
  },
  {
    name: "Rumah & Interior",
    icons: [
      "lucide:home",
      "lucide:sofa",
      "lucide:lamp",
      "lucide:bed",
      "lucide:utensils",
      "lucide:refrigerator",
      "lucide:coffee",
      "lucide:bath",
      "lucide:armchair",
      "lucide:plug",
    ],
  },
  {
    name: "Fashion & Gaya",
    icons: [
      "lucide:shirt",
      "lucide:glasses",
      "lucide:shopping-bag",
      "lucide:gem",
      "lucide:scissors",
      "lucide:footprints",
      "lucide:crown",
      "lucide:sparkles",
      "lucide:umbrella",
      "lucide:tag",
    ],
  },
  {
    name: "Olahraga & Kesehatan",
    icons: [
      "lucide:dumbbell",
      "lucide:heart-pulse",
      "lucide:medal",
      "lucide:trophy",
      "lucide:activity",
      "lucide:flame",
      "lucide:timer",
      "lucide:target",
      "lucide:apple",
    ],
  },
  {
    name: "Edukasi & Keuangan",
    icons: [
      "lucide:book-open",
      "lucide:graduation-cap",
      "lucide:library",
      "lucide:lightbulb",
      "lucide:wallet",
      "lucide:credit-card",
      "lucide:banknote",
      "lucide:piggy-bank",
      "lucide:coins",
      "lucide:trending-up",
    ],
  },
  {
    name: "Marketplace & Brand",
    icons: [
      "simple-icons:tokopedia",
      "simple-icons:shopee",
      "simple-icons:blibli",
      "simple-icons:bukalapak",
      "simple-icons:tiktok",
      "simple-icons:amazon",
      "simple-icons:apple",
      "simple-icons:samsung",
      "simple-icons:sony",
      "simple-icons:playstation",
      "simple-icons:nintendo",
      "simple-icons:steam",
    ],
  },
];

const COLOR_PRESETS = [
  { label: "Zinc Dark", hex: "#18181B" },
  { label: "Biru Samudra", hex: "#2563EB" },
  { label: "Emerald Hijau", hex: "#059669" },
  { label: "Ungu Royal", hex: "#7C3AED" },
  { label: "Rose Pink", hex: "#E11D48" },
  { label: "Amber Emas", hex: "#D97706" },
  { label: "Cyan Langit", hex: "#0891B2" },
  { label: "Orange Terang", hex: "#EA580C" },
  { label: "Slate Tenang", hex: "#475569" },
  { label: "Teal Elegan", hex: "#0D9488" },
];

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  selectedIcon,
  selectedColor = "#2563EB",
  onSelect,
  title = "Pilih Ikon Kategori (Iconify API)",
  categoryName,
}) => {
  const [activeIcon, setActiveIcon] = useState(selectedIcon || "lucide:layers");
  const [activeColor, setActiveColor] = useState(selectedColor || "#2563EB");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"presets" | "search">("presets");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveIcon(selectedIcon || "lucide:layers");
      setActiveColor(selectedColor || "#2563EB");
    }
  }, [isOpen, selectedIcon, selectedColor]);

  // Handle Search using Iconify Public API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const query = searchQuery.trim().toLowerCase();
        // Call Iconify public search endpoint
        const response = await fetch(
          `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=60`,
        );
        if (!response.ok) {
          throw new Error("Gagal menghubungi Iconify API");
        }
        const data = await response.json();
        if (data && Array.isArray(data.icons)) {
          setSearchResults(data.icons);
        } else {
          setSearchResults([]);
        }
      } catch (err: any) {
        console.warn("Iconify API search error:", err);
        setSearchError(
          "Koneksi ke Iconify API bermasalah. Anda tetap bisa memilih dari daftar ikon kurasi.",
        );
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleApply = () => {
    onSelect(activeIcon, activeColor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] border border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live Preview Box & Color Selector */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Live Preview Category Badge */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center border shadow-xs transition-colors"
                style={{
                  backgroundColor: `${activeColor}15`,
                  borderColor: activeColor,
                }}
              >
                <IconifyIcon
                  icon={activeIcon}
                  className="h-6 w-6"
                  color={activeColor}
                />
              </div>
              <div>
                <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase">
                  Pratinjau Kategori
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="flex items-center gap-1.5 border px-2.5 py-1 text-xs font-semibold"
                    style={{
                      borderColor: activeColor,
                      backgroundColor: `${activeColor}10`,
                      color: activeColor,
                    }}
                  >
                    <IconifyIcon
                      icon={activeIcon}
                      className="h-3.5 w-3.5"
                      color={activeColor}
                    />
                    <span>{categoryName || "Nama Kategori"}</span>
                  </span>
                </div>
                <div className="mt-1 font-mono text-[10px] text-zinc-400">
                  Ikon:{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {activeIcon}
                  </span>
                </div>
              </div>
            </div>

            {/* Color Palette Presets */}
            <div className="w-full sm:w-auto">
              <div className="flex items-center gap-1 mb-1.5 text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400">
                <Palette className="h-3 w-3" />
                <span>Pilih Warna Ikon:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setActiveColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`h-6 w-6 rounded-xs transition-transform border ${
                      activeColor.toLowerCase() === c.hex.toLowerCase()
                        ? "scale-115 border-white ring-2 ring-zinc-900 dark:ring-zinc-100 ring-offset-1"
                        : "border-black/20 hover:scale-105"
                    }`}
                    title={c.label}
                  />
                ))}
                {/* Custom Hex input */}
                <input
                  type="text"
                  value={activeColor}
                  onChange={(e) => setActiveColor(e.target.value)}
                  placeholder="#000000"
                  className="h-6 w-20 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-1.5 font-mono text-[10px] uppercase text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 focus:outline-none"
                  title="Kode Warna Hex Kustom"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar & Tab Navigation */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-2.5 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim() && activeTab !== "search") {
                  setActiveTab("search");
                }
              }}
              placeholder="Cari ribuan ikon di Iconify API (contoh: laptop, car, game, shirt, camera)..."
              className="h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-8 pr-8 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("presets");
                }}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("presets")}
              className={`h-8 px-3 text-xs font-semibold border transition-colors ${
                activeTab === "presets"
                  ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-900"
              }`}
            >
              Koleksi Populer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("search")}
              className={`h-8 px-3 text-xs font-semibold border transition-colors ${
                activeTab === "search"
                  ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-900"
              }`}
            >
              Cari Iconify API{" "}
              {searchResults.length > 0 && `(${searchResults.length})`}
            </button>
          </div>
        </div>

        {/* Icon Grid Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[46vh] space-y-4">
          {/* View: Search Results from Iconify API */}
          {activeTab === "search" && (
            <div>
              <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>Hasil Pencarian Iconify API:</span>
                {isSearching && (
                  <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Mencari di Iconify...</span>
                  </span>
                )}
              </div>

              {searchError && (
                <div className="mb-3 flex items-center gap-1.5 border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}

              {!isSearching && searchResults.length === 0 ? (
                <div className="border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-xs text-zinc-400">
                  {searchQuery.trim()
                    ? `Tidak ditemukan ikon untuk kata kunci "${searchQuery}". Coba kata kunci bahasa Inggris umum seperti "car", "watch", "bag", "tech", "food".`
                    : "Ketik kata kunci di atas untuk mencari dari ratusan ribu ikon Iconify API."}
                </div>
              ) : (
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {searchResults.map((iconName) => {
                    const isSelected = activeIcon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setActiveIcon(iconName)}
                        className={`group relative flex flex-col items-center justify-center p-2 border transition-all ${
                          isSelected
                            ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900/10 dark:bg-zinc-100/10 shadow-xs"
                            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-500"
                        }`}
                        title={iconName}
                      >
                        <div className="flex h-8 w-8 items-center justify-center">
                          <IconifyIcon
                            icon={iconName}
                            className="h-6 w-6 transition-transform group-hover:scale-110"
                            color={isSelected ? activeColor : undefined}
                          />
                        </div>
                        <span className="mt-1 font-mono text-[8px] text-zinc-400 dark:text-zinc-500 truncate w-full text-center">
                          {iconName.split(":")[1] || iconName}
                        </span>
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                            <Check className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* View: Curated Preset Collections */}
          {activeTab === "presets" && (
            <div className="space-y-4">
              {CURATED_CATEGORIES.map((cat) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="font-mono text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                    {cat.name}
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {cat.icons.map((iconName) => {
                      const isSelected = activeIcon === iconName;
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setActiveIcon(iconName)}
                          className={`group relative flex flex-col items-center justify-center p-2 border transition-all ${
                            isSelected
                              ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900/10 dark:bg-zinc-100/10 shadow-xs"
                              : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-500"
                          }`}
                          title={iconName}
                        >
                          <div className="flex h-8 w-8 items-center justify-center">
                            <IconifyIcon
                              icon={iconName}
                              className="h-6 w-6 transition-transform group-hover:scale-110"
                              color={isSelected ? activeColor : undefined}
                            />
                          </div>
                          <span className="mt-1 font-mono text-[8px] text-zinc-400 dark:text-zinc-500 truncate w-full text-center">
                            {iconName.split(":")[1] || iconName}
                          </span>
                          {isSelected && (
                            <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                              <Check className="h-2.5 w-2.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>Terpilih:</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {activeIcon}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-4 py-1.5 text-xs font-bold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Gunakan Ikon & Warna Ini</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
