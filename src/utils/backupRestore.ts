import { db, addLog } from "../db/dexie";
import type { Product, Category, Tag, LogEntry, AppSettings } from "../types";

export interface CompleteDatabaseBackup {
  meta: {
    app: "DreBoXs";
    version: number;
    exportDate: string;
    timestamp: number;
    counts: {
      products: number;
      categories: number;
      tags: number;
      logs: number;
      settings: number;
    };
  };
  products: Product[];
  categories: Category[];
  tags: Tag[];
  logs: LogEntry[];
  settings?: AppSettings;
}

/**
 * Downloads all data in IndexedDB as a complete JSON file
 */
export async function exportCompleteDatabaseJSON(): Promise<void> {
  const products = await db.products.toArray();
  const categories = await db.categories.toArray();
  const tags = await db.tags.toArray();
  const logs = await db.logs.toArray();
  const settings = await db.settings.get("config");

  const payload: CompleteDatabaseBackup = {
    meta: {
      app: "DreBoXs",
      version: 2,
      exportDate: new Date().toISOString(),
      timestamp: Date.now(),
      counts: {
        products: products.length,
        categories: categories.length,
        tags: tags.length,
        logs: logs.length,
        settings: settings ? 1 : 0,
      },
    },
    products,
    categories,
    tags,
    logs,
    settings,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  const filename = `DreBoXs_Complete_Backup_${dateStr}_${timeStr}.json`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  await addLog(
    "BACKUP",
    "system",
    `Ekspor cadangan penuh IndexedDB: ${products.length} barang, ${categories.length} kategori, ${tags.length} tag, ${logs.length} riwayat log.`,
  );
}

/**
 * Validates an uploaded backup JSON file
 */
export function validateDatabaseBackupJSON(jsonContent: string): {
  valid: boolean;
  message: string;
  data?: CompleteDatabaseBackup;
} {
  try {
    const parsed = JSON.parse(jsonContent);

    // Accept both v2 complete backup and legacy v1 array format
    if (parsed.meta && parsed.meta.app === "DreBoXs") {
      return {
        valid: true,
        message: `Cadangan DreBoXs v${parsed.meta.version} terverifikasi (${parsed.products?.length || 0} barang, ${parsed.categories?.length || 0} kategori).`,
        data: parsed as CompleteDatabaseBackup,
      };
    }

    if (Array.isArray(parsed.products) || Array.isArray(parsed.categories)) {
      return {
        valid: true,
        message: `File backup JSON terverifikasi (${parsed.products?.length || 0} barang).`,
        data: {
          meta: {
            app: "DreBoXs",
            version: 1,
            exportDate: new Date().toISOString(),
            timestamp: Date.now(),
            counts: {
              products: parsed.products?.length || 0,
              categories: parsed.categories?.length || 0,
              tags: parsed.tags?.length || 0,
              logs: parsed.logs?.length || 0,
              settings: parsed.settings ? 1 : 0,
            },
          },
          products: parsed.products || [],
          categories: parsed.categories || [],
          tags: parsed.tags || [],
          logs: parsed.logs || [],
          settings: parsed.settings,
        },
      };
    }

    return {
      valid: false,
      message: "Format file tidak sesuai dengan struktur basis data DreBoXs.",
    };
  } catch (err) {
    return {
      valid: false,
      message: "File tidak dapat dibaca sebagai format JSON yang valid.",
    };
  }
}

/**
 * Restores the complete database into IndexedDB
 */
export async function restoreCompleteDatabase(
  backup: CompleteDatabaseBackup,
  mode: "replace" | "merge" = "replace",
): Promise<{ success: boolean; message: string }> {
  try {
    await db.transaction(
      "rw",
      db.products,
      db.categories,
      db.tags,
      db.logs,
      db.settings,
      async () => {
        if (mode === "replace") {
          await db.products.clear();
          await db.categories.clear();
          await db.tags.clear();
          await db.logs.clear();
        }

        if (backup.categories && backup.categories.length > 0) {
          await db.categories.bulkPut(backup.categories);
        }
        if (backup.tags && backup.tags.length > 0) {
          await db.tags.bulkPut(backup.tags);
        }
        if (backup.products && backup.products.length > 0) {
          await db.products.bulkPut(backup.products);
        }
        if (backup.logs && backup.logs.length > 0) {
          await db.logs.bulkPut(backup.logs);
        }
        if (backup.settings) {
          await db.settings.put({
            ...backup.settings,
            id: "config",
          });
        }
      },
    );

    const actionText =
      mode === "replace" ? "Penggantian Penuh" : "Penggabungan";
    await addLog(
      "BACKUP",
      "system",
      `Pemulihan data sukses (${actionText}): ${backup.products?.length || 0} barang dipulihkan.`,
    );

    return {
      success: true,
      message: `Pemulihan data ${actionText.toLowerCase()} berhasil! (${backup.products?.length || 0} barang dipulihkan)`,
    };
  } catch (err) {
    console.error("Error during database restore:", err);
    return {
      success: false,
      message: "Terjadi kegagalan saat menulis data pemulihan ke IndexedDB.",
    };
  }
}
