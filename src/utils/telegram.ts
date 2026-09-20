import type { Product, Category, Tag } from "../types";
import { formatIDR } from "./formatters";

const DEFAULT_BOT_TOKEN = "8982518789:AAFUk4YNyEO6nhTQykdkNW4P3SEwo2aWoRY";
const DEFAULT_CHAT_ID = "1986364721";

export interface TelegramResult {
  success: boolean;
  message: string;
  response?: unknown;
}

export async function sendTelegramSummary(
  products: Product[],
  categories: Category[],
  token: string = DEFAULT_BOT_TOKEN,
  chatId: string = DEFAULT_CHAT_ID,
): Promise<TelegramResult> {
  try {
    const totalItems = products.length;
    const totalBudget = products.reduce(
      (acc, curr) => acc + (curr.price || 0),
      0,
    );
    const favoriteCount = products.filter((p) => p.isFavorite).length;

    // Category breakdown
    const catMap = new Map<
      string,
      { count: number; total: number; name: string }
    >();
    categories.forEach((c) =>
      catMap.set(c.id, { count: 0, total: 0, name: c.name }),
    );

    products.forEach((p) => {
      const cat = p.categoryId ? catMap.get(p.categoryId) : undefined;
      if (cat) {
        cat.count++;
        cat.total += p.price;
      }
    });

    let catBreakdownText = "";
    catMap.forEach((val) => {
      if (val.count > 0) {
        catBreakdownText += `• ${val.name}: ${val.count} item (${formatIDR(val.total)})\n`;
      }
    });

    // Top items
    const topItems = [...products]
      .sort((a, b) => b.price - a.price)
      .slice(0, 5);
    let topItemsText = "";
    topItems.forEach((item, idx) => {
      topItemsText += `${idx + 1}. ${item.name} — ${formatIDR(item.price)}\n`;
    });

    const messageText =
      `📦 *[DreBoXs — Laporan Ringkasan Kotak Impian]*\n` +
      `📅 Waktu: ${new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(new Date())}\n\n` +
      `📊 *Statistik Utama:*\n` +
      `• Total Produk Impian: *${totalItems}*\n` +
      `• Total Estimasi Anggaran: *${formatIDR(totalBudget)}*\n` +
      `• Produk Prioritas/Favorit: *${favoriteCount}*\n\n` +
      `🗂 *Distribusi Kategori:*\n` +
      (catBreakdownText || "• Belum ada kategori spesifik\n") +
      `\n🌟 *5 Produk Teratas Berdasarkan Nilai:*\n` +
      (topItemsText || "• Belum ada barang tersimpan\n") +
      `\n_Dikirim otomatis dari DreBoXs Applet._`;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: "Markdown",
      }),
    });

    const data = await res.json();
    if (data.ok) {
      return {
        success: true,
        message: "Laporan ringkas berhasil terkirim ke Telegram!",
        response: data,
      };
    } else {
      return {
        success: false,
        message: `Gagal mengirim ke Telegram: ${data.description || "Error API"}`,
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Koneksi gagal";
    return { success: false, message: `Error koneksi Telegram: ${errorMsg}` };
  }
}

export async function sendTelegramJsonBackup(
  products: Product[],
  categories: Category[],
  tags: Tag[],
  token: string = DEFAULT_BOT_TOKEN,
  chatId: string = DEFAULT_CHAT_ID,
): Promise<TelegramResult> {
  try {
    const backupData = {
      app: "DreBoXs",
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      summary: {
        totalProducts: products.length,
        totalBudget: products.reduce((a, b) => a + b.price, 0),
        totalCategories: categories.length,
        totalTags: tags.length,
      },
      products,
      categories,
      tags,
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const fileName = `DreBoXs_Backup_${new Date().toISOString().slice(0, 10)}.json`;

    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("document", blob, fileName);
    formData.append(
      "caption",
      `📦 *Cadangan Data DreBoXs*\n📅 ${new Date().toLocaleDateString("id-ID")}\nTotal: ${products.length} barang (${formatIDR(backupData.summary.totalBudget)})`,
    );

    const url = `https://api.telegram.org/bot${token}/sendDocument`;
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.ok) {
      return {
        success: true,
        message: "File backup JSON berhasil dikirim ke Telegram bot Anda!",
        response: data,
      };
    } else {
      return {
        success: false,
        message: `Gagal mengirim file ke Telegram: ${data.description || "Error API"}`,
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Koneksi gagal";
    return {
      success: false,
      message: `Error pengiriman file JSON: ${errorMsg}`,
    };
  }
}
