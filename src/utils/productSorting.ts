import type { Product } from "../types";

export type SortOption =
  | "latest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc"
  | "priority_desc";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "latest", label: "Tanggal Ditambahkan (Terbaru)" },
  { value: "oldest", label: "Tanggal Ditambahkan (Terlama)" },
  { value: "price_asc", label: "Harga: Terendah → Tertinggi" },
  { value: "price_desc", label: "Harga: Tertinggi → Terendah" },
  { value: "name_asc", label: "Abjad: A → Z" },
  { value: "name_desc", label: "Abjad: Z → A" },
  { value: "priority_desc", label: "Prioritas: Tinggi → Rendah" },
];

export function sortProducts(
  products: Product[],
  sortOption: SortOption,
): Product[] {
  const sorted = [...products];

  const priorityWeight: Record<Product["priority"], number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  switch (sortOption) {
    case "latest":
      return sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    case "oldest":
      return sorted.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    case "price_asc":
      return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    case "price_desc":
      return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    case "name_asc":
      return sorted.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
    case "name_desc":
      return sorted.sort((a, b) =>
        b.name.localeCompare(a.name, undefined, { sensitivity: "base" }),
      );
    case "priority_desc":
      return sorted.sort((a, b) => {
        const diff =
          (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (diff !== 0) return diff;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    default:
      return sorted;
  }
}

import { detectStoreWithPresets } from "./linkPresets";

export function detectStoreLabel(url: string): {
  label: string;
  isKnown: boolean;
  icon?: string;
  color?: string;
} {
  const result = detectStoreWithPresets(url);
  return {
    label: result.label,
    isKnown: result.isKnown,
    icon: result.icon,
    color: result.color,
  };
}
