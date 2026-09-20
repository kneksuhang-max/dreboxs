import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { db, initializeDatabase, addLog } from "./db/dexie";
import { useAppStore } from "./store/useAppStore";
import { Navbar } from "./components/common/Navbar";
import { PinLockScreen } from "./components/common/PinLockScreen";
import { CommandMenu } from "./components/common/CommandMenu";
import { Toast } from "./components/common/Toast";
import { Dashboard1Overview } from "./components/dashboards/Dashboard1Overview";
import { Dashboard2FormAndLogs } from "./components/dashboards/Dashboard2FormAndLogs";
import { Dashboard3ProductList } from "./components/dashboards/Dashboard3ProductList";
import { Dashboard4Categories } from "./components/dashboards/Dashboard4Categories";
import { Dashboard5Tags } from "./components/dashboards/Dashboard5Tags";
import { Dashboard6Favorites } from "./components/dashboards/Dashboard6Favorites";
import { Dashboard7Archive } from "./components/dashboards/Dashboard7Archive";
import { Dashboard8Settings } from "./components/dashboards/Dashboard8Settings";
import { ProductDetailModal } from "./components/modals/ProductDetailModal";
import { ProductEditModal } from "./components/modals/ProductEditModal";
import { exportToPDF, exportToExcel } from "./utils/export";
import { sendTelegramSummary } from "./utils/telegram";
import { executeCloudAutoExport } from "./utils/cloudSync";
import { getMeiliClient, syncIndexToMeili } from "./utils/meiliSearch";
import { Database, Shield, Send, Terminal } from "lucide-react";
import { useAutoLock } from "./hooks/useAutoLock";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DreBoXsMain />
    </QueryClientProvider>
  );
}

function DreBoXsMain() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  const {
    activeTab,
    isPinLocked,
    setIsPinLocked,
    selectedDetailProductId,
    editingModalProductId,
    setEditingModalProductId,
    showToast,
  } = useAppStore();

  // Initialize Dexie.js database
  useEffect(() => {
    initializeDatabase().then(() => {
      setIsDbReady(true);
    });
  }, []);

  // Live Queries from Dexie IndexedDB
  const products = useLiveQuery(() => db.products.toArray(), [], []) ?? [];
  const categories = useLiveQuery(() => db.categories.toArray(), [], []) ?? [];
  const tags = useLiveQuery(() => db.tags.toArray(), [], []) ?? [];
  const logs =
    useLiveQuery(
      () => db.logs.orderBy("timestamp").reverse().limit(100).toArray(),
      [],
      [],
    ) ?? [];
  const settings = useLiveQuery(() => db.settings.get("config"), [], null);

  // Initial PIN check: Lock on first load ONLY IF PIN is enabled in settings AND not already unlocked in this session
  useEffect(() => {
    if (settings) {
      if (settings.isPinEnabled) {
        const isSessionUnlocked =
          typeof window !== "undefined" &&
          sessionStorage.getItem("dreboxs_session_unlocked") === "true";
        if (!isSessionUnlocked) {
          setIsPinLocked(true);
        } else {
          setIsPinLocked(false);
        }
      } else {
        // If PIN is disabled, ensure it is NEVER locked
        setIsPinLocked(false);
      }
    }
  }, [settings?.isPinEnabled, setIsPinLocked]);

  // Cloud Auto-Export & MeiliSearch Sync on Significant Data Change
  const prevProductCountRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (!isDbReady) return;
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevProductCountRef.current = products.length;
      return;
    }

    const hasSignificantChange =
      prevProductCountRef.current !== null &&
      prevProductCountRef.current !== products.length;

    prevProductCountRef.current = products.length;

    if (hasSignificantChange) {
      // Sync with MeiliSearch if available
      if (settings?.meiliHost) {
        const meiliClient = getMeiliClient(
          settings.meiliHost,
          settings.meiliApiKey,
        );
        if (meiliClient) {
          syncIndexToMeili(
            meiliClient,
            settings.meiliIndexName || "drebxs_products",
            products,
            categories,
          ).catch((err) =>
            console.debug("MeiliSearch background sync status:", err),
          );
        }
      }

      // Trigger Cloud Auto-Export if enabled on change
      if (
        settings?.autoExportEnabled &&
        settings.autoExportTrigger === "on_change"
      ) {
        const hasCredentials =
          (settings.autoExportService === "gdrive" &&
            settings.googleDriveAccessToken) ||
          (settings.autoExportService === "dropbox" &&
            (settings.dropboxAccessToken || settings.dropboxToken)) ||
          (settings.autoExportService === "both" &&
            (settings.googleDriveAccessToken ||
              settings.dropboxAccessToken ||
              settings.dropboxToken));

        if (hasCredentials) {
          executeCloudAutoExport(products, categories, tags, settings).catch(
            (err) => {
              console.debug("Background cloud auto-export error:", err);
            },
          );
        }
      }
    }
  }, [products, categories, tags, settings, isDbReady]);

  // Cloud Auto-Export on Periodic Interval Timer
  useEffect(() => {
    if (
      !isDbReady ||
      !settings?.autoExportEnabled ||
      settings.autoExportTrigger !== "interval"
    ) {
      return;
    }

    const minutes = Math.max(5, settings.autoExportIntervalMinutes || 30);
    const intervalMs = minutes * 60 * 1000;

    const intervalId = setInterval(() => {
      executeCloudAutoExport(products, categories, tags, settings).catch(
        (err) => {
          console.debug("Interval cloud auto-export error:", err);
        },
      );
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [isDbReady, settings, products, categories, tags]);

  // Refresh callback
  const handleRefreshData = useCallback(async () => {
    // Dexie live queries automatically react to table mutations
  }, []);

  // Quick action: export PDF
  const handleExportPDF = () => {
    exportToPDF(products, categories);
    showToast("Dokumen PDF berhasil diunduh", "success");
  };

  // Quick action: export Excel
  const handleExportExcel = () => {
    exportToExcel(products, categories, tags);
    showToast("File Excel XLSX berhasil diunduh", "success");
  };

  // Quick action: send Telegram
  const handleSendTelegram = async () => {
    setIsSendingTelegram(true);
    const token =
      settings?.telegramBotToken ||
      "8982518789:AAFUk4YNyEO6nhTQykdkNW4P3SEwo2aWoRY";
    const chatId = settings?.telegramChatId || "1986364721";
    try {
      const res = await sendTelegramSummary(
        products,
        categories,
        token,
        chatId,
      );
      if (res.success) {
        showToast(res.message, "success");
        await addLog(
          "TELEGRAM_SYNC",
          "system",
          `Kirim ringkasan inventaris ke chat ID: ${chatId}`,
        );
      } else {
        showToast(res.message, "error");
      }
    } catch {
      showToast("Gagal mengirim ke Telegram bot", "error");
    } finally {
      setIsSendingTelegram(false);
    }
  };

  // Keyboard Shortcuts Integration (cmdk: Ctrl+K, Ctrl+N, Ctrl+E, Ctrl+P, Ctrl+L, Ctrl+D, Ctrl+1..8)
  useKeyboardShortcuts({
    onExportPDF: handleExportPDF,
    onExportExcel: handleExportExcel,
    isPinEnabled: settings?.isPinEnabled ?? false,
  });

  // Auto-Lock Integration on Inactivity (e.g. 5 minutes for public devices)
  useAutoLock({
    isPinEnabled: settings?.isPinEnabled ?? false,
    autoLockMinutes: settings?.autoLockMinutes ?? 5,
  });

  const selectedProduct =
    products.find((p) => p.id === selectedDetailProductId) || null;
  const favoriteCount = products.filter((p) => p.isFavorite).length;
  const archiveCount = products.filter((p) => p.status === "archived").length;

  if (!isDbReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950 p-4">
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">
          <Database className="h-4 w-4 animate-spin text-zinc-900 dark:text-zinc-100" />
          <span>Memuat DreBoXs IndexedDB...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900 transition-colors">
      {/* PIN Lock Screen if locked - user must enter PIN before accessing DreBoXs */}
      {Boolean(settings?.isPinEnabled && isPinLocked) && (
        <PinLockScreen correctPin={settings?.pinCode || "1234"} />
      )}

      {/* Top Navigation */}
      <Navbar
        productCount={products.length}
        favoriteCount={favoriteCount}
        archiveCount={archiveCount}
        isPinEnabled={settings?.isPinEnabled ?? false}
      />

      {/* Main Content View */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {activeTab === "overview" && (
          <Dashboard1Overview
            products={products}
            categories={categories}
            onExportPDF={handleExportPDF}
            onSendTelegram={handleSendTelegram}
            isSendingTelegram={isSendingTelegram}
          />
        )}

        {activeTab === "form_logs" && (
          <Dashboard2FormAndLogs
            products={products}
            categories={categories}
            tags={tags}
            logs={logs}
            onRefreshData={handleRefreshData}
          />
        )}

        {activeTab === "products" && (
          <Dashboard3ProductList
            products={products}
            categories={categories}
            tags={tags}
            onRefreshData={handleRefreshData}
          />
        )}

        {activeTab === "categories" && (
          <Dashboard4Categories
            categories={categories}
            products={products}
            onRefreshData={handleRefreshData}
          />
        )}

        {activeTab === "tags" && (
          <Dashboard5Tags
            tags={tags}
            products={products}
            categories={categories}
            onRefreshData={handleRefreshData}
          />
        )}

        {activeTab === "favorites" && (
          <Dashboard6Favorites
            products={products}
            categories={categories}
            onRefreshData={handleRefreshData}
          />
        )}

        {activeTab === "archive" && (
          <Dashboard7Archive
            products={products}
            categories={categories}
            onRefreshData={handleRefreshData}
          />
        )}

        {activeTab === "settings" && (
          <Dashboard8Settings
            settings={settings ?? null}
            products={products}
            categories={categories}
            tags={tags}
            onRefreshData={handleRefreshData}
          />
        )}
      </main>

      {/* Global Modals */}
      <CommandMenu
        products={products}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onSendTelegram={handleSendTelegram}
      />

      <ProductDetailModal
        product={selectedProduct}
        categories={categories}
        onRefreshData={handleRefreshData}
      />

      <ProductEditModal
        productId={editingModalProductId}
        categories={categories}
        tags={tags}
        onRefreshData={handleRefreshData}
        onClose={() => setEditingModalProductId(null)}
      />

      <Toast />

      {/* Ultra Minimalist Monochrome Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-3 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              DreBoXs
            </span>
            <span>—</span>
            <span>Dream Boxs / Kotak Impian</span>
          </div>

          
        </div>
      </footer>
    </div>
  );
}
