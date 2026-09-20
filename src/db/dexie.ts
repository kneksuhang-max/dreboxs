import Dexie, { type Table } from "dexie";
import type { Product, Category, Tag, LogEntry, AppSettings } from "../types";

export class DreBoXsDatabase extends Dexie {
  products!: Table<Product, string>;
  categories!: Table<Category, string>;
  tags!: Table<Tag, string>;
  logs!: Table<LogEntry, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super("DreBoXsDB");
    this.version(1).stores({
      products:
        "id, name, price, categoryId, *tags, isFavorite, status, priority, targetMonth, createdAt, updatedAt",
      categories: "id, name, createdAt",
      tags: "id, name, createdAt",
      logs: "id, action, entity, timestamp",
      settings: "id",
    });
  }
}

export const db = new DreBoXsDatabase();

let initPromise: Promise<void> | null = null;

// Default initial seeding - completely idempotent
export function initializeDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = doInitializeDatabase();
  }
  return initPromise;
}

async function doInitializeDatabase(): Promise<void> {
  // One-time cleanup of starter dummy data as requested
  try {
    const dummyClearedKey = "dreboxs_dummy_data_cleared_v2";
    if (
      typeof localStorage !== "undefined" &&
      !localStorage.getItem(dummyClearedKey)
    ) {
      // Delete starter dummy product if present
      await db.products.delete("sample-mbp");

      // Delete starter dummy categories if present
      const dummyCatIds = [
        "cat-elektronik",
        "cat-kerja",
        "cat-hobi",
        "cat-kendaraan",
        "cat-rumah",
      ];
      for (const cId of dummyCatIds) {
        await db.categories.delete(cId);
      }

      // Delete starter dummy tags if present
      const dummyTagIds = [
        "tag-impian2026",
        "tag-selfreward",
        "tag-produktivitas",
        "tag-setup",
      ];
      for (const tId of dummyTagIds) {
        await db.tags.delete(tId);
      }

      localStorage.setItem(dummyClearedKey, "true");
      await addLog(
        "SYSTEM",
        "system",
        "Inisialisasi bersih: Data dummy produk, kategori, dan tag telah dikosongkan.",
      );
    }
  } catch (err) {
    console.warn("Cleanup dummy note:", err);
  }

  // Ensure default config exists
  try {
    const settings = await db.settings.get("config");
    if (!settings) {
      await db.settings.put({
        id: "config",
        pinCode: "1234", // default demo PIN, customizable in Settings
        isPinEnabled: false, // Default to disabled so user can choose to enable
        telegramBotToken: "8982518789:AAFUk4YNyEO6nhTQykdkNW4P3SEwo2aWoRY",
        telegramChatId: "1986364721",
        googleDriveFolder: "DreBoXs_Backup",
        dropboxToken: "",
        apiKey: "drbx_live_" + Math.random().toString(36).substring(2, 12),
        autoLockMinutes: 10,
        lastSyncTimestamp: Date.now(),
      });
    }
  } catch (err) {
    console.warn("Settings seeding note:", err);
  }
}

export async function addLog(
  action: LogEntry["action"],
  entity: LogEntry["entity"],
  details: string,
): Promise<void> {
  try {
    const entry: LogEntry = {
      id:
        "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      action,
      entity,
      details,
      timestamp: Date.now(),
    };
    await db.logs.add(entry);
  } catch (err) {
    console.error("Failed to write log:", err);
  }
}
