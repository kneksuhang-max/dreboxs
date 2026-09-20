import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Edit,
  Save,
  Star,
  ExternalLink,
  Plus,
  Trash2,
  Tag as TagIcon,
  Layers,
  Upload,
  Link as LinkIcon,
  Globe,
} from "lucide-react";
import type { Product, Category, Tag, LinkPreset } from "../../types";
import { db, addLog } from "../../db/dexie";
import { useAppStore } from "../../store/useAppStore";
import { formatThousand, parseThousandToNumber } from "../../utils/formatters";
import { animateModalIn } from "../../utils/animations";
import {
  detectStoreWithPresets,
  getCachedLinkPresets,
} from "../../utils/linkPresets";
import { IconifyIcon } from "../common/IconifyIcon";

interface ProductEditModalProps {
  productId: string | null;
  categories: Category[];
  tags: Tag[];
  onRefreshData: () => Promise<void>;
  onClose: () => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  productId,
  categories,
  tags,
  onRefreshData,
  onClose,
}) => {
  const { showToast } = useAppStore();
  const modalBoxRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [priceFormatted, setPriceFormatted] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [targetMonth, setTargetMonth] = useState("");
  const [status, setStatus] = useState<Product["status"]>("dream");
  const [priority, setPriority] = useState<Product["priority"]>("medium");
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [linkButtonLabels, setLinkButtonLabels] = useState<string[]>([""]);
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      return;
    }

    db.products.get(productId).then((prod) => {
      if (prod) {
        setProduct(prod);
        setName(prod.name);
        setPriceFormatted(formatThousand(prod.price));
        setCategoryId(prod.categoryId || "");
        setTargetMonth(prod.targetMonth || "");
        setStatus(prod.status);
        setPriority(prod.priority);
        setIsFavorite(prod.isFavorite);
        setSelectedTags([...(prod.tags || [])]);
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
      }
    });
  }, [productId]);

  useEffect(() => {
    if (product && modalBoxRef.current) {
      animateModalIn(modalBoxRef.current);
    }
  }, [product]);

  if (!productId || !product) return null;

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

  const handleAddTag = (tagName: string) => {
    const clean = tagName.trim().replace(/^#/, "");
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags([...selectedTags, clean]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagName));
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Hanya berkas gambar (JPG, PNG, WebP) yang didukung", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Ukuran gambar maksimal 2MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setImageUrl(e.target.result);
        showToast("Foto produk berhasil diunggah", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Nama produk wajib diisi", "error");
      return;
    }

    const finalPrice = parseThousandToNumber(priceFormatted);
    if (finalPrice <= 0) {
      showToast("Harga produk harus lebih dari 0", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanLinks = links.map((l) => l.trim()).filter((l) => Boolean(l));
      const cleanLabels = cleanLinks.map(
        (_, i) => linkButtonLabels[i]?.trim() || "",
      );

      await db.products.update(productId, {
        name: name.trim(),
        price: finalPrice,
        categoryId: categoryId || undefined,
        tags: selectedTags,
        links: cleanLinks,
        linkButtonLabel: cleanLabels[0] || undefined,
        linkButtonLabels: cleanLabels,
        imageUrl: imageUrl.trim() || undefined,
        description: description.trim(),
        isFavorite,
        status,
        priority,
        targetMonth: targetMonth || undefined,
        updatedAt: Date.now(),
      });

      await addLog(
        "UPDATE",
        "product",
        `Memperbarui barang impian via Modal Edit: "${name.trim()}"`,
      );
      await onRefreshData();
      showToast(`Perubahan "${name.trim()}" berhasil disimpan`, "success");
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Gagal menyimpan perubahan produk", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const storePresets = [
    { name: "Tokopedia", domain: "https://www.tokopedia.com/" },
    { name: "Shopee", domain: "https://shopee.co.id/" },
    { name: "Blibli", domain: "https://www.blibli.com/" },
    { name: "Bukalapak", domain: "https://www.bukalapak.com/" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div
        ref={modalBoxRef}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
              <Edit className="h-3 w-3" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Edit Barang Impian
              </span>
              <span className="ml-2 font-mono text-[10px] text-zinc-500">
                ID: {productId.substring(0, 8)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-1.5 border transition-colors ${
                isFavorite
                  ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-zinc-900"
              }`}
              title={
                isFavorite ? "Hapus dari favorit" : "Tandai sebagai favorit"
              }
            >
              <Star className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-100"
              title="Tutup (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          {/* 1. Name & Price */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="sm:col-span-7">
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Nama Produk{" "}
                <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                  *
                </span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Sony WH-1000XM5"
                className="mt-1 h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Harga{" "}
                <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                  *
                </span>
              </label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                  Rp
                </span>
                <input
                  type="text"
                  required
                  value={priceFormatted}
                  onChange={handlePriceChange}
                  placeholder="5.000.000"
                  className="h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-8 pr-2.5 font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Category, Target Month, Status, Priority */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Kategori
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
              >
                <option value="">-- Tanpa Kategori --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Target Bulan
              </label>
              <input
                type="month"
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="mt-1 h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Product["status"])}
                className="mt-1 h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
              >
                <option value="dream">Impian</option>
                <option value="planned">Direncanakan</option>
                <option value="purchased">Tercapai</option>
                <option value="archived">Arsip</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as Product["priority"])
                }
                className="mt-1 h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
              >
                <option value="high">Tinggi</option>
                <option value="medium">Sedang</option>
                <option value="low">Rendah</option>
              </select>
            </div>
          </div>

          {/* 3. Tags */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Tag Pengelompokan
            </label>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2">
              {selectedTags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2 py-0.5 font-mono text-xs text-zinc-800 dark:text-zinc-200"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 ml-0.5"
                  >
                    ×
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
                placeholder="+ Tambah tag (Enter)"
                className="h-6 flex-1 min-w-30 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* 4. Link / Tautan Produk & Label Tombol Card */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Tautan & Tombol Card Produk
                </label>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-400 mr-1 hidden sm:inline">
                  Tombol Cepat:
                </span>
                {storePresets.map((sp) => (
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
                  className="flex items-center gap-1 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-2 py-0.5 font-mono text-[10px] text-white dark:text-zinc-900"
                >
                  <Plus className="h-2.5 w-2.5" /> Link Baru
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              {links.map((link, idx) => {
                const store = detectStoreWithPresets(link, presets);
                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5"
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
                      placeholder="https://tokopedia.com/... atau https://store.com/..."
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
                          className="flex h-8 px-2.5 items-center justify-center gap-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
                          title="Buka Tautan"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span className="hidden sm:inline">Buka</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveLink(idx)}
                        className="flex h-8 w-8 items-center justify-center border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                        title="Hapus Link"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Foto / Image */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Foto / URL Gambar
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... atau unggah gambar"
                className="h-8 flex-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
              />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-8 items-center gap-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Unggah</span>
              </button>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="h-8 px-2 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Hapus Foto
                </button>
              )}
            </div>

            {imageUrl && (
              <div className="mt-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 p-2 flex justify-center max-h-36 overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  className="max-h-32 object-contain"
                />
              </div>
            )}
          </div>

          {/* 6. Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Catatan & Deskripsi
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan spesifikasi, alasan impian, atau perbandingan..."
              className="mt-1 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 z-20 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-5 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
