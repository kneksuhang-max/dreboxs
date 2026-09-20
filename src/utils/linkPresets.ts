import type { LinkPreset } from "../types";
import { db } from "../db/dexie";

export const DEFAULT_LINK_PRESETS: LinkPreset[] = [
  {
    id: "tokopedia",
    name: "Tokopedia",
    domains: ["tokopedia.com", "tokopedia.link"],
    icon: "simple-icons:tokopedia",
    color: "#03AC0E",
  },
  {
    id: "shopee",
    name: "Shopee",
    domains: ["shopee.co.id", "shopee.com", "shp.ee"],
    icon: "simple-icons:shopee",
    color: "#EE4D2D",
  },
  {
    id: "blibli",
    name: "Blibli",
    domains: ["blibli.com"],
    icon: "simple-icons:blibli",
    color: "#0095DA",
  },
  {
    id: "bukalapak",
    name: "Bukalapak",
    domains: ["bukalapak.com"],
    icon: "simple-icons:bukalapak",
    color: "#E31F51",
  },
  {
    id: "tiktok",
    name: "TikTok Shop",
    domains: ["tiktok.com"],
    icon: "simple-icons:tiktok",
    color: "#FE2C55",
  },
  {
    id: "amazon",
    name: "Amazon",
    domains: ["amazon.com", "amazon.co", "amazon."],
    icon: "simple-icons:amazon",
    color: "#FF9900",
  },
  {
    id: "lazada",
    name: "Lazada",
    domains: ["lazada.co.id", "lazada.com"],
    icon: "simple-icons:lazada",
    color: "#0F146D",
  },
  {
    id: "apple",
    name: "Apple Store",
    domains: ["apple.com"],
    icon: "simple-icons:apple",
    color: "#555555",
  },
  {
    id: "samsung",
    name: "Samsung Store",
    domains: ["samsung.com"],
    icon: "simple-icons:samsung",
    color: "#1428A0",
  },
  {
    id: "steam",
    name: "Steam Store",
    domains: ["steampowered.com", "steamcommunity.com"],
    icon: "simple-icons:steam",
    color: "#171A21",
  },
  {
    id: "website",
    name: "Situs Resmi",
    domains: [],
    icon: "lucide:globe",
    color: "#2563EB",
  },
  {
    id: "buy_now",
    name: "Beli Sekarang",
    domains: [],
    icon: "lucide:shopping-bag",
    color: "#10B981",
  },
];

const LOCAL_STORAGE_PRESETS_KEY = "dreboxs_link_presets_v1";

// Synchronously get presets with localStorage cache for instant rendering
export function getCachedLinkPresets(): LinkPreset[] {
  if (typeof localStorage === "undefined") return DEFAULT_LINK_PRESETS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed reading cached presets:", err);
  }
  return DEFAULT_LINK_PRESETS;
}

// Asynchronously load presets from Dexie Settings and sync with localStorage
export async function loadLinkPresets(): Promise<LinkPreset[]> {
  try {
    const settings = await db.settings.get("config");
    if (
      settings &&
      settings.customLinkPresets &&
      settings.customLinkPresets.length > 0
    ) {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(
          LOCAL_STORAGE_PRESETS_KEY,
          JSON.stringify(settings.customLinkPresets),
        );
      }
      return settings.customLinkPresets;
    }
  } catch (err) {
    console.warn("Failed loading presets from DB:", err);
  }
  return getCachedLinkPresets();
}

// Save presets to DB and localStorage
export async function saveLinkPresets(presets: LinkPreset[]): Promise<void> {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_PRESETS_KEY, JSON.stringify(presets));
  }
  try {
    await db.settings.update("config", {
      customLinkPresets: presets,
    });
  } catch (err) {
    console.warn("Failed saving presets to DB:", err);
  }
}

// Reset presets to default
export async function resetLinkPresetsToDefault(): Promise<LinkPreset[]> {
  await saveLinkPresets(DEFAULT_LINK_PRESETS);
  return DEFAULT_LINK_PRESETS;
}

export interface DetectedStoreInfo {
  label: string;
  isKnown: boolean;
  preset?: LinkPreset;
  icon: string;
  color: string;
}

// Match URL against presets
export function detectStoreWithPresets(
  url: string,
  presets?: LinkPreset[],
): DetectedStoreInfo {
  const activePresets =
    presets && presets.length > 0 ? presets : getCachedLinkPresets();

  if (!url || !url.trim()) {
    return {
      label: "Tautan Web",
      isKnown: false,
      icon: "lucide:globe",
      color: "#71717A",
    };
  }

  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase();

    // Check each preset's domains
    for (const preset of activePresets) {
      if (preset.domains && preset.domains.length > 0) {
        const matches = preset.domains.some((d) =>
          host.includes(d.toLowerCase()),
        );
        if (matches) {
          return {
            label: preset.name,
            isKnown: true,
            preset,
            icon: preset.icon || "lucide:shopping-bag",
            color: preset.color || "#09090B",
          };
        }
      }
    }

    // Fallback cleanly
    const cleanHost = host.replace(/^www\./, "");
    return {
      label: cleanHost,
      isKnown: false,
      icon: "lucide:globe",
      color: "#52525B",
    };
  } catch {
    return {
      label: "Tautan Web",
      isKnown: false,
      icon: "lucide:globe",
      color: "#71717A",
    };
  }
}
