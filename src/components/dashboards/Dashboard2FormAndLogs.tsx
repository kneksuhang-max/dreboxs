import React, { useState, useEffect, useRef } from "react";
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Search,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading,
  Code,
  Quote,
  Eye,
  History,
  CheckCircle2,
  Tag as TagIcon,
  Layers,
  X,
  Clock,
  Globe,
} from "lucide-react";
import type { Product, Category, Tag, LogEntry, LinkPreset } from "../../types";
import { db, addLog } from "../../db/dexie";
import {
  formatThousand,
  parseThousandToNumber,
  formatIDR,
  formatDateTime,
} from "../../utils/formatters";
import { useAppStore } from "../../store/useAppStore";
import { animatePageIn } from "../../utils/animations";
import {
  detectStoreWithPresets,
  getCachedLinkPresets,
} from "../../utils/linkPresets";
import { IconifyIcon } from "../common/IconifyIcon";

interface Dashboard2FormAndLogsProps {
  products: Product[];
  categories: Category[];
  tags: Tag[];
  logs: LogEntry[];
  onRefreshData: () => Promise<void>;
}

export const Dashboard2FormAndLogs: React.FC<Dashboard2FormAndLogsProps> = ({
  products,
  categories,
  tags,
  logs,
  onRefreshData,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { editingProductId, setEditingProductId, showToast } = useAppStore();

  useEffect(() => {
    animatePageIn(containerRef.current);
  }, []);

  // Form State
  const [name, setName] = useState("");
  const [priceFormatted, setPriceFormatted] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [linkButtonLabels, setLinkButtonLabels] = useState<string[]>([""]);
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [status, setStatus] = useState<Product["status"]>("dream");
  const [priority, setPriority] = useState<Product["priority"]>("medium");
  const [targetMonth, setTargetMonth] = useState("");

  // UI helpers
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [descViewMode, setDescViewMode] = useState<"write" | "preview">(
    "write",
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load editing product if editingProductId is set
  useEffect(() => {
    if (editingProductId) {
      const prod = products.find((p) => p.id === editingProductId);
      if (prod) {
        setName(prod.name);
        setPriceFormatted(formatThousand(prod.price));
        setCategoryId(prod.categoryId || "");
        setSelectedTags([...prod.tags]);
        const initialLinks =
          prod.links && prod.links.length > 0 ? [...prod.links] : [""];
        setLinks(initialLinks);
        const initialLabels = initialLinks.map((_, i) => {
          if (prod.linkButtonLabels && prod.linkButtonLabels[i]) {
            return prod.linkButtonLabels[i];
          }
          if (i === 0 && prod.linkButtonLabel) {
            return prod.linkButtonLabel;
          }
          return "";
        });
        setLinkButtonLabels(initialLabels);
        setImageUrl(prod.imageUrl || "");
        setDescription(prod.description || "");
        setIsFavorite(prod.isFavorite);
        setStatus(prod.status);
        setPriority(prod.priority);
        setTargetMonth(prod.targetMonth || "");
      }
    }
  }, [editingProductId, products]);

  // Click outside to close category dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Price handler with thousand separator formatting
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const num = parseThousandToNumber(rawValue);
    if (num === 0 && rawValue.replace(/\D/g, "") === "") {
      setPriceFormatted("");
    } else {
      setPriceFormatted(formatThousand(num));
    }
  };

  const presets: LinkPreset[] = getCachedLinkPresets();

  // Links management
  const handleAddLink = (presetUrl = "", presetName = "") => {
    if (links.length === 1 && !links[0]) {
      setLinks([presetUrl]);
      setLinkButtonLabels([presetName]);
    } else {
      setLinks([...links, presetUrl]);
      setLinkButtonLabels([...linkButtonLabels, presetName]);
    }
  };

  const handleLinkChange = (index: number, val: string) => {
    const updated = [...links];
    updated[index] = val;
    setLinks(updated);

    // If label at this index is empty, automatically fill with detected store name
    if (val.trim()) {
      const detected = detectStoreWithPresets(val, presets);
      if (
        !linkButtonLabels[index] ||
        linkButtonLabels[index] === "Buka Tautan"
      ) {
        const updatedLabels = [...linkButtonLabels];
        updatedLabels[index] = detected.label;
        setLinkButtonLabels(updatedLabels);
      }
    }
  };

  const handleButtonLabelChange = (index: number, val: string) => {
    const updated = [...linkButtonLabels];
    updated[index] = val;
    setLinkButtonLabels(updated);
  };

  const handleRemoveLink = (index: number) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    const updatedLabels = linkButtonLabels.filter((_, i) => i !== index);
    setLinks(updatedLinks.length > 0 ? updatedLinks : [""]);
    setLinkButtonLabels(updatedLabels.length > 0 ? updatedLabels : [""]);
  };

  // Tags management
  const handleAddTag = (tagName: string) => {
    const clean = tagName.trim().replace(/^#/, "");
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags([...selectedTags, clean]);
      // Also register into tags database if not exists
      const exists = tags.some(
        (t) => t.name.toLowerCase() === clean.toLowerCase(),
      );
      if (!exists) {
        db.tags.add({
          id: "tag-" + Date.now(),
          name: clean,
          createdAt: Date.now(),
        });
      }
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagName));
  };

  // Drag & Drop Photo Upload
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Mohon unggah file format gambar (JPG/PNG/WebP)", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
        showToast("Foto berhasil dimuat", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  // Rich Text helper tools
  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById(
      "product-description-editor",
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);
    const replacement = prefix + (selectedText || "teks") + suffix;

    const newText =
      description.substring(0, start) +
      replacement +
      description.substring(end);
    setDescription(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + replacement.length - suffix.length,
      );
    }, 10);
  };

  // Reset form
  const handleResetForm = () => {
    setName("");
    setPriceFormatted("");
    setCategoryId("");
    setSelectedTags([]);
    setLinks([""]);
    setLinkButtonLabels([""]);
    setImageUrl("");
    setDescription("");
    setIsFavorite(false);
    setStatus("dream");
    setPriority("medium");
    setTargetMonth("");
    setEditingProductId(null);
  };

  // Save to Dexie.js IndexedDB
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("Nama Produk wajib diisi", "error");
      return;
    }

    const numericPrice = parseThousandToNumber(priceFormatted);
    if (!numericPrice || numericPrice <= 0) {
      showToast("Harga Produk wajib diisi dengan angka valid", "error");
      return;
    }

    const filteredLinks = links.map((l) => l.trim()).filter(Boolean);
    const cleanLabels = filteredLinks.map(
      (_, i) => linkButtonLabels[i]?.trim() || "",
    );

    try {
      const now = Date.now();
      const productPayload: Product = {
        id:
          editingProductId ||
          "prod-" + now + "-" + Math.random().toString(36).substring(2, 6),
        name: name.trim(),
        price: numericPrice,
        categoryId: categoryId || undefined,
        tags: selectedTags,
        links: filteredLinks,
        linkButtonLabel: cleanLabels[0] || undefined,
        linkButtonLabels: cleanLabels,
        imageUrl: imageUrl.trim() || undefined,
        description: description.trim(),
        isFavorite,
        status,
        priority,
        targetMonth: targetMonth || undefined,
        createdAt: editingProductId
          ? products.find((p) => p.id === editingProductId)?.createdAt || now
          : now,
        updatedAt: now,
      };

      await db.products.put(productPayload);

      const action = editingProductId ? "UPDATE" : "CREATE";
      const logDetails = editingProductId
        ? `Memperbarui barang impian: "${productPayload.name}" (${formatIDR(numericPrice)})`
        : `Menambahkan barang impian baru: "${productPayload.name}" (${formatIDR(numericPrice)})`;

      await addLog(action, "product", logDetails);
      await onRefreshData();

      showToast(
        editingProductId
          ? "Perubahan berhasil diperbarui!"
          : "Barang impian berhasil disimpan ke Dexie.js!",
        "success",
      );
      handleResetForm();
    } catch (err) {
      console.error("Failed to save to Dexie:", err);
      showToast("Gagal menyimpan ke database IndexedDB", "error");
    }
  };

  // Quick add new category from dropdown
  const handleQuickAddCategory = async () => {
    if (!categorySearch.trim()) return;
    const newCat: Category = {
      id: "cat-" + Date.now(),
      name: categorySearch.trim(),
      createdAt: Date.now(),
    };
    await db.categories.add(newCat);
    await addLog(
      "CREATE",
      "category",
      `Menambahkan kategori baru: ${newCat.name}`,
    );
    await onRefreshData();
    setCategoryId(newCat.id);
    setCategorySearch("");
    setIsCategoryDropdownOpen(false);
    showToast(`Kategori "${newCat.name}" berhasil dibuat`, "success");
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  const selectedCategoryObj = categories.find((c) => c.id === categoryId);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-mono text-base font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
            Form & Log
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {editingProductId
              ? `Sedang mengedit data barang impian [${name || editingProductId}]`
              : " "}
          </p>
        </div>

        {editingProductId && (
          <div className="flex items-center gap-2">
            <span className="border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-2 py-1 font-mono text-[11px] text-white dark:text-zinc-900 font-semibold">
              Mode Edit Aktif
            </span>
            <button
              type="button"
              onClick={handleResetForm}
              className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Batalkan Edit
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Col: Modul Form Input (7 cols) */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 lg:col-span-7 transition-colors">
          <div className="mb-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Form Barang Impian
            </h2>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              * Menandakan input wajib
            </span>
          </div>

          <form onSubmit={handleSaveProduct} className="space-y-4">
            {/* 1. Nama Produk (Wajib) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Nama Produk{" "}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 h-9 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
              />
            </div>

            {/* 2. Harga Produk (Wajib, format titik ribuan Intl.NumberFormat) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Harga{" "}
                </label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    value={priceFormatted}
                    onChange={handlePriceChange}
                    className="h-9 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* Target Waktu / Bulan */}
              <div>
                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Target
                </label>
                <input
                  type="month"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="mt-1 h-9 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                />
              </div>
            </div>

            {/* 3. Kategori (Dropdown opsional dengan fitur search di dalamnya) */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Kategori{" "}
                </label>
                {selectedCategoryObj && (
                  <button
                    type="button"
                    onClick={() => setCategoryId("")}
                    className="text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Hapus Pilihan
                  </button>
                )}
              </div>

              <div
                onClick={() =>
                  setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                }
                className="mt-1 flex h-9 cursor-pointer items-center justify-between border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-zinc-800 dark:text-zinc-200 hover:border-zinc-500 dark:hover:border-zinc-400"
              >
                <span
                  className={
                    selectedCategoryObj
                      ? "font-medium text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-400 dark:text-zinc-500"
                  }
                >
                  {selectedCategoryObj
                    ? selectedCategoryObj.name
                    : "-- Pilih kategori --"}
                </span>
                <Layers className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              </div>

              {/* Dropdown menu with internal search */}
              {isCategoryDropdownOpen && (
                <div className="absolute left-0 right-0 z-20 mt-1 border border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 shadow-lg">
                  <div className="relative mb-2">
                    <Search className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Cari kategori..."
                      className="h-8 w-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-7 pr-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredCategories.length === 0 ? (
                      <div className="py-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
                        <span>Kategori tidak ditemukan.</span>
                        {categorySearch.trim() && (
                          <button
                            type="button"
                            onClick={handleQuickAddCategory}
                            className="mt-1 block w-full border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 py-1 text-xs text-white dark:text-zinc-900 font-semibold"
                          >
                            + Tambah "{categorySearch.trim()}"
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredCategories.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setCategoryId(c.id);
                            setIsCategoryDropdownOpen(false);
                            setCategorySearch("");
                          }}
                          className={`flex cursor-pointer items-center justify-between px-2 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                            categoryId === c.id
                              ? "bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100"
                              : "text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          <span>{c.name}</span>
                          {c.description && (
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate max-w-37.5">
                              {c.description}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Input Tag (Multi-select) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Tag
              </label>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 border border-zinc-900 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 text-xs text-zinc-900 dark:text-zinc-100 font-mono"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  placeholder="Ketik tag lalu tekan Enter..."
                  className="min-w-35 flex-1 bg-transparent text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              {/* Tag suggestions from DB */}
              <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                <TagIcon className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
                <span>Pilih cepat:</span>
                {tags.slice(0, 6).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleAddTag(t.name)}
                    className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.2 hover:border-zinc-900 dark:hover:border-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    +{t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Link Produk & Label Tombol Card (Multi link) */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1">
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Tautan
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 hidden sm:inline">
                    Preset Toko:
                  </span>
                  {[
                    { name: "Tokopedia", domain: "https://www.tokopedia.com/" },
                    { name: "Shopee", domain: "https://shopee.co.id/" },
                  ].map((sp) => (
                    <button
                      key={sp.name}
                      type="button"
                      onClick={() => handleAddLink(sp.domain, sp.name)}
                      className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      +{sp.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddLink("")}
                    className="flex items-center gap-1 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-white dark:text-zinc-900 ml-1"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    <span>Link</span>
                  </button>
                </div>
              </div>

              <div className="mt-2 space-y-2">
                {links.map((link, idx) => {
                  const store = detectStoreWithPresets(link, presets);
                  return (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2"
                    >
                      {/* Label Tombol di sebelah Kiri Input Tautan Produk */}
                      <div className="relative w-full sm:w-44 shrink-0">
                        <div
                          className="pointer-events-none absolute left-2 top-2 flex h-4 w-4 items-center justify-center shrink-0"
                          style={{ color: store.color }}
                        >
                          <IconifyIcon
                            icon={store.icon}
                            className="h-3.5 w-3.5"
                            color={store.color}
                            fallback={<Globe className="h-3.5 w-3.5" />}
                          />
                        </div>
                        <input
                          type="text"
                          value={linkButtonLabels[idx] || ""}
                          onChange={(e) =>
                            handleButtonLabelChange(idx, e.target.value)
                          }
                          placeholder={store.label || `Tombol ${idx + 1}`}
                          title={`Label Tombol ${idx + 1} pada Card (di sebelah kiri tautan)`}
                          className="h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-7 pr-2 font-sans text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                        />
                      </div>

                      {/* Input Tautan Produk di sebelah kanan Label Tombol */}
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => handleLinkChange(idx, e.target.value)}
                        placeholder="https://"
                        className="h-8 flex-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                      />

                      <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                        {link && (
                          <a
                            href={
                              link.startsWith("http") ? link : `https://${link}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-8 px-2.5 items-center justify-center gap-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                            title="Buka Link di Tab Baru"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Tes Link</span>
                          </a>
                        )}
                        {links.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLink(idx)}
                            className="flex h-8 w-8 items-center justify-center border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                            title="Hapus Link Ini"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. Upload Foto (Drag & Drop) & URL Gambar + Pratinjau Otomatis */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Foto Produk
              </label>

              {/* URL Input */}
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="URL gambar"
                  className="h-8 flex-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                />
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Hapus
                  </button>
                )}
              </div>

              {/* Drag & Drop Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center border border-dashed p-4 transition-colors ${
                  isDragging
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800"
                    : "border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 hover:border-zinc-500 dark:hover:border-zinc-400"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />

                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  PNG, JPG, WebP
                </span>
              </div>

              {/* Live Preview Box */}
              {imageUrl && (
                <div className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" /> Pratinjau Foto Otomatis:
                    </span>
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      Batal Foto
                    </button>
                  </div>
                  <div className="flex justify-center bg-zinc-50 dark:bg-zinc-900 p-2 border border-zinc-100 dark:border-zinc-700">
                    <img
                      src={imageUrl}
                      alt="Pratinjau"
                      referrerPolicy="no-referrer"
                      className="max-h-48 max-w-full object-contain"
                      onError={() =>
                        showToast(
                          "Gagal memuat pratinjau gambar dari URL ini",
                          "error",
                        )
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 7. Deskripsi Barang (Textarea Saja) */}
            <div>
              <label
                htmlFor="product-description"
                className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1"
              >
                Deskripsi
              </label>
              <textarea
                id="product-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
              />
            </div>

            {/* Priority & Favorite Toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Status */}
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Status:
                  </span>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as Product["status"])
                    }
                    className="h-7 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                  >
                    <option value="dream">Impian</option>
                    <option value="planned">Direncanakan</option>
                    <option value="purchased">Tercapai</option>
                    <option value="archived">Arsip</option>
                  </select>
                </div>

                {/* Prioritas */}
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Prioritas:
                  </span>
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as Product["priority"])
                    }
                    className="h-7 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                  >
                    <option value="low">Rendah</option>
                    <option value="medium">Menengah</option>
                    <option value="high">Tinggi</option>
                  </select>
                </div>
              </div>

              {/* Favorite toggle checkbox */}
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="h-4 w-4 rounded-none border-zinc-400 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:ring-0"
                />
                <span>Tandai sebagai Favorit</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <button
                type="button"
                onClick={handleResetForm}
                className="flex h-9 w-full sm:w-auto items-center justify-center gap-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Form</span>
              </button>

              <button
                type="submit"
                className="flex h-9 w-full sm:w-auto items-center justify-center gap-1.5 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{editingProductId ? "Perbarui..." : "Simpan"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Riwayat Log History (5 cols) */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 lg:col-span-5 transition-colors">
          <div className="mb-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <div className="flex items-center gap-1.5">
              <History className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Riwayat Log
              </h2>
            </div>
            <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
              {logs.length} catatan
            </span>
          </div>

          <div className="max-h-140 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800">
            {logs.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
                Belum ada aktivitas yang tercatat.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-[10px] uppercase font-bold px-1 py-0.2 border ${
                        log.action === "CREATE"
                          ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                          : log.action === "UPDATE"
                            ? "border-zinc-500 text-zinc-800 dark:text-zinc-200"
                            : log.action === "DELETE"
                              ? "border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
                              : "border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="mt-1 text-zinc-800 dark:text-zinc-200 font-medium leading-tight">
                    {log.details}
                  </p>
                  <div className="mt-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                    Modul: {log.entity}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
