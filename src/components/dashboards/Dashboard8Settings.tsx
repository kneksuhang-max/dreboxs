import React, { useState, useRef, useEffect } from "react";
import {
  Lock,
  KeyRound,
  ShieldCheck,
  FileText,
  FileSpreadsheet,
  Download,
  Upload,
  Send,
  Cloud,
  RefreshCw,
  Code,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Database,
  Smartphone,
  ExternalLink,
  Sparkles,
  Search,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Clock,
  Keyboard,
  ShieldAlert,
  ShieldOff,
  Save,
  Sliders,
  HardDrive,
  Trash2,
  AlertTriangle,
  Globe,
  Palette,
  Plus,
  RotateCcw,
  ShoppingBag,
} from "lucide-react";
import type {
  AppSettings,
  Product,
  Category,
  Tag,
  LinkPreset,
} from "../../types";
import { db, addLog } from "../../db/dexie";
import { IconifyIcon } from "../common/IconifyIcon";
import { IconPickerModal } from "../common/IconPickerModal";
import {
  DEFAULT_LINK_PRESETS,
  getCachedLinkPresets,
  saveLinkPresets,
  resetLinkPresetsToDefault,
  loadLinkPresets,
  detectStoreWithPresets,
} from "../../utils/linkPresets";
import {
  exportToPDF,
  exportToExcel,
  exportToJSON,
  parseAndValidateImportJSON,
} from "../../utils/export";
import {
  exportCompleteDatabaseJSON,
  validateDatabaseBackupJSON,
  restoreCompleteDatabase,
  type CompleteDatabaseBackup,
} from "../../utils/backupRestore";
import { runAccessibilityContrastAudit } from "../../utils/contrastAudit";
import {
  sendTelegramSummary,
  sendTelegramJsonBackup,
} from "../../utils/telegram";
import {
  testMeiliConnection,
  type MeiliConnectionStatus,
} from "../../utils/meiliSearch";
import { useAppStore } from "../../store/useAppStore";
import { formatDate } from "../../utils/formatters";
import { animatePageIn } from "../../utils/animations";
import { useTheme } from "../../context/ThemeContext";

interface Dashboard8SettingsProps {
  settings: AppSettings | null | undefined;
  products: Product[];
  categories: Category[];
  tags: Tag[];
  onRefreshData: () => Promise<void>;
}

export const Dashboard8Settings: React.FC<Dashboard8SettingsProps> = ({
  settings,
  products,
  categories,
  tags,
  onRefreshData,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setIsPinLocked, showToast } = useAppStore();
  const { theme, resolvedTheme, setTheme, toggleTheme, isDark } = useTheme();

  // GSAP animation on mount
  useEffect(() => {
    animatePageIn(containerRef.current);
  }, []);

  // Synchronize local states whenever settings from Dexie finish loading or update
  useEffect(() => {
    if (settings) {
      setIsPinEnabled(Boolean(settings.isPinEnabled));
      setAutoLockMinutes(settings.autoLockMinutes ?? 5);
      setTelegramToken(settings.telegramBotToken || "");
      setTelegramChatId(settings.telegramChatId || "");
      setAutoExportEnabled(Boolean(settings.autoExportEnabled));
      if (settings.autoExportFormat)
        setAutoExportFormat(settings.autoExportFormat);
      if (settings.autoExportService)
        setAutoExportService(settings.autoExportService);
      if (settings.autoExportTrigger)
        setAutoExportTrigger(settings.autoExportTrigger);
      if (settings.autoExportIntervalMinutes)
        setAutoExportIntervalMinutes(settings.autoExportIntervalMinutes);
      if (settings.googleDriveAccessToken)
        setGdriveAccessToken(settings.googleDriveAccessToken);
      if (settings.googleDriveFolderId)
        setGdriveFolderId(settings.googleDriveFolderId);
      if (settings.dropboxAccessToken || settings.dropboxToken) {
        setDropboxAccessToken(
          settings.dropboxAccessToken || settings.dropboxToken || "",
        );
      }
      if (settings.meiliHost) setMeiliHost(settings.meiliHost);
      if (settings.meiliApiKey) setMeiliApiKey(settings.meiliApiKey);
      if (settings.meiliIndexName) setMeiliIndexName(settings.meiliIndexName);
    }
  }, [settings]);

  // PIN & Auto-lock Form
  const [isPinEnabled, setIsPinEnabled] = useState(
    settings?.isPinEnabled ?? false,
  );
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(
    settings?.autoLockMinutes ?? 5,
  );
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // Telegram Form
  const [telegramToken, setTelegramToken] = useState(
    settings?.telegramBotToken || "",
  );
  const [telegramChatId, setTelegramChatId] = useState(
    settings?.telegramChatId || "",
  );
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);

  // Cloud Auto-Export Form
  const [autoExportEnabled, setAutoExportEnabled] = useState(
    settings?.autoExportEnabled ?? false,
  );
  const [autoExportFormat, setAutoExportFormat] = useState<
    "pdf" | "excel" | "both"
  >(settings?.autoExportFormat || "both");
  const [autoExportService, setAutoExportService] = useState<
    "gdrive" | "dropbox" | "both"
  >(settings?.autoExportService || "both");
  const [autoExportTrigger, setAutoExportTrigger] = useState<
    "on_change" | "daily" | "interval"
  >(settings?.autoExportTrigger || "on_change");
  const [autoExportIntervalMinutes, setAutoExportIntervalMinutes] =
    useState<number>(settings?.autoExportIntervalMinutes || 30);
  const [gdriveAccessToken, setGdriveAccessToken] = useState(
    settings?.googleDriveAccessToken || "",
  );
  const [gdriveFolderId, setGdriveFolderId] = useState(
    settings?.googleDriveFolderId || "",
  );
  const [dropboxAccessToken, setDropboxAccessToken] = useState(
    settings?.dropboxAccessToken || settings?.dropboxToken || "",
  );
  const [dropboxFolderPath, setDropboxFolderPath] = useState(
    settings?.dropboxToken ? "/DreBoXs" : "",
  );
  const [showTokens, setShowTokens] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncMessage, setCloudSyncMessage] = useState<string | null>(null);

  // MeiliSearch Form
  const [meiliHost, setMeiliHost] = useState(
    settings?.meiliHost || "http://localhost:7700",
  );
  const [meiliApiKey, setMeiliApiKey] = useState(settings?.meiliApiKey || "");
  const [meiliIndexName, setMeiliIndexName] = useState(
    settings?.meiliIndexName || "drebxs_products",
  );
  const [isTestingMeili, setIsTestingMeili] = useState(false);
  const [isSyncingMeili, setIsSyncingMeili] = useState(false);
  const [meiliStatus, setMeiliStatus] = useState<MeiliConnectionStatus | null>(
    null,
  );

  // API Key & Peer Sync
  const [apiKey] = useState(
    settings?.apiKey ||
      "drebxs_live_key_" + Math.random().toString(36).substring(2, 10),
  );
  const [isCopiedKey, setIsCopiedKey] = useState(false);
  const [importedJsonStatus, setImportedJsonStatus] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Database Restore Modal State
  const [pendingRestore, setPendingRestore] =
    useState<CompleteDatabaseBackup | null>(null);
  const [restoreMode, setRestoreMode] = useState<"replace" | "merge">(
    "replace",
  );
  const [isRestoring, setIsRestoring] = useState(false);

  // Persistent Storage Permission State
  const [isPersisted, setIsPersisted] = useState<boolean | null>(null);
  const [storageEstimate, setStorageEstimate] = useState<{
    quota: number;
    usage: number;
  } | null>(null);
  const [isCheckingStorage, setIsCheckingStorage] = useState(false);
  const [isRequestingPersist, setIsRequestingPersist] = useState(false);

  // Reset Data Modal State
  const [resetTarget, setResetTarget] = useState<
    "all" | "products" | "categories" | "tags" | null
  >(null);
  const [resetConfirmationText, setResetConfirmationText] = useState("");
  const [isResettingData, setIsResettingData] = useState(false);

  // Check Storage Persistence Status
  const checkStorageStatus = async () => {
    setIsCheckingStorage(true);
    try {
      if (typeof navigator !== "undefined" && navigator.storage) {
        if (navigator.storage.persisted) {
          const persisted = await navigator.storage.persisted();
          setIsPersisted(persisted);
        }
        if (navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          setStorageEstimate({
            quota: estimate.quota || 0,
            usage: estimate.usage || 0,
          });
        }
      }
    } catch (err) {
      console.warn("Storage persistence check error:", err);
    } finally {
      setIsCheckingStorage(false);
    }
  };

  useEffect(() => {
    checkStorageStatus();
  }, []);

  // Request Persistent Storage
  const handleRequestPersistentStorage = async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.storage ||
      !navigator.storage.persist
    ) {
      showToast(
        "Browser Anda tidak mendukung Storage Persistence API",
        "error",
      );
      return;
    }
    setIsRequestingPersist(true);
    try {
      const granted = await navigator.storage.persist();
      setIsPersisted(granted);
      if (granted) {
        showToast(
          "Izin penyimpanan persisten AKTIF! Data terlindungi dari pembersihan otomatis browser.",
          "success",
        );
        await addLog(
          "UPDATE",
          "system",
          "Izin penyimpanan persisten (Persistent Storage) diaktifkan oleh pengguna.",
        );
      } else {
        showToast(
          "Browser menolak izin penyimpanan persisten (tergantung frekuensi interaksi situs atau kebijakan browser).",
          "info",
        );
      }
      await checkStorageStatus();
    } catch (err) {
      console.error(err);
      showToast("Gagal meminta izin penyimpanan persisten", "error");
    } finally {
      setIsRequestingPersist(false);
    }
  };

  // Reset Data Handlers
  const handleOpenResetModal = (
    target: "all" | "products" | "categories" | "tags",
  ) => {
    setResetTarget(target);
    setResetConfirmationText("");
  };

  const handleCloseResetModal = () => {
    setResetTarget(null);
    setResetConfirmationText("");
  };

  const handleConfirmReset = async () => {
    if (!resetTarget) return;

    if (resetConfirmationText.trim().toUpperCase() !== "RESET") {
      showToast(
        'Ketik "RESET" dengan huruf kapital untuk mengonfirmasi',
        "error",
      );
      return;
    }

    setIsResettingData(true);
    try {
      if (resetTarget === "products") {
        await db.products.clear();
        await addLog(
          "DELETE",
          "product",
          "Reset data: Seluruh produk impian telah dihapus/dikosongkan.",
        );
        showToast("Seluruh data produk berhasil direset", "success");
      } else if (resetTarget === "categories") {
        await db.categories.clear();
        await addLog(
          "DELETE",
          "category",
          "Reset data: Seluruh kategori produk telah dihapus/dikosongkan.",
        );
        showToast("Seluruh data kategori berhasil direset", "success");
      } else if (resetTarget === "tags") {
        await db.tags.clear();
        await addLog(
          "DELETE",
          "tag",
          "Reset data: Seluruh tag produk telah dihapus/dikosongkan.",
        );
        showToast("Seluruh data tag berhasil direset", "success");
      } else if (resetTarget === "all") {
        await Promise.all([
          db.products.clear(),
          db.categories.clear(),
          db.tags.clear(),
        ]);
        await addLog(
          "DELETE",
          "system",
          "Reset Total: Seluruh produk, kategori, dan tag telah dikosongkan.",
        );
        showToast(
          "Seluruh data Produk, Kategori, dan Tag berhasil direset!",
          "success",
        );
      }

      await onRefreshData();
      handleCloseResetModal();
      await checkStorageStatus();
    } catch (err) {
      console.error(err);
      showToast("Gagal melakukan reset data", "error");
    } finally {
      setIsResettingData(false);
    }
  };

  // Link & Marketplace Presets State (Iconify API)
  const [linkPresets, setLinkPresets] = useState<LinkPreset[]>(() =>
    getCachedLinkPresets(),
  );
  const [editingPreset, setEditingPreset] = useState<LinkPreset | null>(null);
  const [presetName, setPresetName] = useState("");
  const [presetDomains, setPresetDomains] = useState("");
  const [presetIcon, setPresetIcon] = useState("lucide:shopping-bag");
  const [presetColor, setPresetColor] = useState("#2563EB");
  const [isPresetIconPickerOpen, setIsPresetIconPickerOpen] = useState(false);
  const [testUrl, setTestUrl] = useState(
    "https://www.tokopedia.com/discovery/gadget-terbaru",
  );

  // Load Presets from DB on mount
  useEffect(() => {
    loadLinkPresets().then((loaded) => {
      if (loaded && loaded.length > 0) {
        setLinkPresets(loaded);
      }
    });
  }, []);

  const handleStartEditPreset = (preset: LinkPreset) => {
    setEditingPreset(preset);
    setPresetName(preset.name);
    setPresetDomains(preset.domains.join(", "));
    setPresetIcon(preset.icon);
    setPresetColor(preset.color);
  };

  const handleCancelEditPreset = () => {
    setEditingPreset(null);
    setPresetName("");
    setPresetDomains("");
    setPresetIcon("lucide:shopping-bag");
    setPresetColor("#2563EB");
  };

  const handleSavePresetForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = presetName.trim();
    if (!cleanName) {
      showToast("Nama preset link / marketplace wajib diisi", "error");
      return;
    }

    const domainList = presetDomains
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);

    let updatedList: LinkPreset[];
    if (editingPreset) {
      updatedList = linkPresets.map((p) =>
        p.id === editingPreset.id
          ? {
              ...p,
              name: cleanName,
              domains: domainList,
              icon: presetIcon,
              color: presetColor,
            }
          : p,
      );
      showToast(`Preset "${cleanName}" berhasil diperbarui`, "success");
    } else {
      const newPreset: LinkPreset = {
        id: `preset-${Date.now()}`,
        name: cleanName,
        domains: domainList,
        icon: presetIcon,
        color: presetColor,
        isCustom: true,
      };
      updatedList = [...linkPresets, newPreset];
      showToast(`Preset "${cleanName}" berhasil ditambahkan`, "success");
    }

    setLinkPresets(updatedList);
    await saveLinkPresets(updatedList);
    await addLog(
      "UPDATE",
      "system",
      `Simpan preset link marketplace: "${cleanName}"`,
    );
    handleCancelEditPreset();
  };

  const handleDeletePresetItem = async (preset: LinkPreset) => {
    if (!confirm(`Hapus preset "${preset.name}"?`)) return;
    const updated = linkPresets.filter((p) => p.id !== preset.id);
    setLinkPresets(updated);
    await saveLinkPresets(updated);
    await addLog("UPDATE", "system", `Hapus preset link: "${preset.name}"`);
    showToast(`Preset "${preset.name}" berhasil dihapus`, "info");
    if (editingPreset?.id === preset.id) {
      handleCancelEditPreset();
    }
  };

  const handleResetPresetsToDefault = async () => {
    if (
      !confirm(
        "Kembalikan semua preset link dan marketplace ke daftar default bawaan DreBoXs?",
      )
    ) {
      return;
    }
    const defaults = await resetLinkPresetsToDefault();
    setLinkPresets(defaults);
    await addLog(
      "UPDATE",
      "system",
      "Reset preset link & marketplace ke default",
    );
    showToast(
      "Seluruh preset berhasil dikembalikan ke standar default",
      "success",
    );
    handleCancelEditPreset();
  };

  // Save PIN and Auto-Lock Settings
  const handleSavePinSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    // If user is disabling PIN
    if (!isPinEnabled) {
      try {
        await db.settings.update("config", {
          isPinEnabled: false,
          autoLockMinutes: Number(autoLockMinutes),
        });
        setIsPinLocked(false);
        await addLog(
          "PIN_CHANGE",
          "security",
          "Fitur PIN dinonaktifkan (Tanpa proteksi PIN)",
        );
        await onRefreshData();
        setCurrentPinInput("");
        setNewPin("");
        setConfirmPin("");
        showToast(
          "Fitur PIN dinonaktifkan. Aplikasi kini terbuka tanpa kunci PIN.",
          "success",
        );
        return;
      } catch {
        showToast("Gagal menonaktifkan fitur PIN", "error");
        return;
      }
    }

    // If user is enabling PIN or updating PIN credentials
    if (newPin) {
      if (newPin.length < 4 || newPin.length > 6) {
        showToast("PIN baru harus 4 sampai 6 digit angka", "error");
        return;
      }
      if (newPin !== confirmPin) {
        showToast("Konfirmasi PIN baru tidak sesuai", "error");
        return;
      }
      if (
        settings?.pinCode &&
        settings.pinCode.length >= 4 &&
        currentPinInput
      ) {
        if (currentPinInput !== settings.pinCode) {
          showToast("PIN saat ini tidak valid", "error");
          return;
        }
      }
    } else if (!settings?.pinCode) {
      showToast(
        "Masukkan PIN baru (4-6 digit angka) untuk mengaktifkan fitur PIN",
        "error",
      );
      return;
    }

    try {
      await db.settings.update("config", {
        isPinEnabled: true,
        autoLockMinutes: Number(autoLockMinutes),
        ...(newPin ? { pinCode: newPin } : {}),
      });
      await addLog(
        "PIN_CHANGE",
        "security",
        `Pengaturan PIN diaktifkan (AutoLock: ${autoLockMinutes}m)`,
      );
      await onRefreshData();
      setCurrentPinInput("");
      setNewPin("");
      setConfirmPin("");
      showToast(
        "Pengaturan keamanan PIN dan auto-lock berhasil disimpan",
        "success",
      );
    } catch {
      showToast("Gagal memperbarui pengaturan PIN", "error");
    }
  };

  // Direct 1-click toggle for PIN feature
  const handleTogglePinDirectly = async (targetEnabled: boolean) => {
    try {
      if (!targetEnabled) {
        await db.settings.update("config", {
          isPinEnabled: false,
        });
        setIsPinEnabled(false);
        setIsPinLocked(false);
        await addLog(
          "PIN_CHANGE",
          "security",
          "Fitur PIN dinonaktifkan seketika",
        );
        await onRefreshData();
        showToast(
          "Fitur PIN berhasil dinonaktifkan. Aplikasi tidak akan meminta PIN.",
          "success",
        );
      } else {
        const pinToUse = settings?.pinCode || "1234";
        await db.settings.update("config", {
          isPinEnabled: true,
          pinCode: pinToUse,
        });
        setIsPinEnabled(true);
        await addLog("PIN_CHANGE", "security", "Fitur PIN diaktifkan seketika");
        await onRefreshData();
        showToast(`Fitur PIN diaktifkan (Kode PIN: ${pinToUse}).`, "success");
      }
    } catch {
      showToast("Gagal memperbarui status PIN", "error");
    }
  };

  // Save Telegram Settings
  const handleSaveTelegramSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.settings.update("config", {
        telegramBotToken: telegramToken.trim(),
        telegramChatId: telegramChatId.trim(),
      });
      await addLog(
        "UPDATE",
        "system",
        "Pengaturan token & chat ID Telegram disimpan",
      );
      await onRefreshData();
      showToast(
        "Pengaturan token & chat ID Telegram berhasil disimpan",
        "success",
      );
    } catch {
      showToast("Gagal menyimpan pengaturan Telegram", "error");
    }
  };

  // Save Cloud Auto-Export Settings
  const handleSaveCloudExportSettings = async () => {
    try {
      await db.settings.update("config", {
        autoExportEnabled,
        autoExportFormat,
        autoExportService,
        autoExportTrigger,
        autoExportIntervalMinutes: Number(autoExportIntervalMinutes),
        googleDriveAccessToken: gdriveAccessToken.trim(),
        googleDriveFolderId: gdriveFolderId.trim(),
        dropboxAccessToken: dropboxAccessToken.trim(),
        dropboxToken: dropboxAccessToken.trim(),
      });
      await addLog(
        "UPDATE",
        "system",
        `Pengaturan Cloud Auto-Export disimpan (Aktif: ${autoExportEnabled})`,
      );
      await onRefreshData();
      showToast("Pengaturan Cloud Auto-Export berhasil disimpan", "success");
    } catch {
      showToast("Gagal menyimpan pengaturan Cloud Auto-Export", "error");
    }
  };

  // Trigger Telegram Summary
  const handleTriggerTelegramSummary = async () => {
    setIsSendingTelegram(true);
    setTelegramStatus("Mengirim ringkasan ke Telegram...");
    try {
      const res = await sendTelegramSummary(
        products,
        categories,
        telegramToken,
        telegramChatId,
      );
      if (res.success) {
        setTelegramStatus(
          "Terkirim dengan sukses ke chat ID " + telegramChatId,
        );
        showToast(res.message, "success");
        await addLog(
          "TELEGRAM_SYNC",
          "system",
          `Kirim ringkasan inventaris ke chat ID: ${telegramChatId}`,
        );
      } else {
        setTelegramStatus(res.message);
        showToast(res.message, "error");
      }
    } catch (err) {
      console.error(err);
      setTelegramStatus("Gagal mengirim ke Telegram.");
    } finally {
      setIsSendingTelegram(false);
    }
  };

  // Trigger Telegram JSON Backup
  const handleTriggerTelegramBackup = async () => {
    setIsSendingTelegram(true);
    setTelegramStatus("Mengirim berkas JSON cadangan...");
    try {
      const res = await sendTelegramJsonBackup(
        products,
        categories,
        tags,
        telegramToken,
        telegramChatId,
      );
      if (res.success) {
        setTelegramStatus("File JSON terkirim ke Telegram");
        showToast(res.message, "success");
        await addLog(
          "TELEGRAM_SYNC",
          "system",
          "Kirim file backup JSON ke Telegram",
        );
      } else {
        setTelegramStatus(res.message);
        showToast(res.message, "error");
      }
    } catch (err) {
      console.error(err);
      setTelegramStatus("Gagal mengirim file ke Telegram.");
    } finally {
      setIsSendingTelegram(false);
    }
  };

  // Handle Full Database Backup Download
  const handleDownloadFullBackup = async () => {
    try {
      await exportCompleteDatabaseJSON();
      showToast(
        "Cadangan penuh basis data DreBoXs berhasil diunduh",
        "success",
      );
    } catch (err) {
      console.error(err);
      showToast("Gagal membuat file cadangan penuh", "error");
    }
  };

  // Handle Database File Selection for Restore
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const validation = validateDatabaseBackupJSON(text);

        if (!validation.valid || !validation.data) {
          setImportedJsonStatus(validation.message);
          showToast(validation.message, "error");
          return;
        }

        setPendingRestore(validation.data);
        setImportedJsonStatus(
          `File terverifikasi: ${validation.data.products?.length || 0} barang ditemukan.`,
        );
      } catch (err) {
        console.error(err);
        showToast("Gagal memproses file JSON cadangan", "error");
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be selected again if needed
    e.target.value = "";
  };

  // Confirm and Execute Restore
  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;
    setIsRestoring(true);
    try {
      const result = await restoreCompleteDatabase(pendingRestore, restoreMode);
      if (result.success) {
        showToast(result.message, "success");
        await onRefreshData();
        setPendingRestore(null);
        setImportedJsonStatus(result.message);
      } else {
        showToast(result.message, "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal memulihkan basis data", "error");
    } finally {
      setIsRestoring(false);
    }
  };

  // Trigger Accessibility Audit
  const handleRunA11yAudit = () => {
    const results = runAccessibilityContrastAudit();
    const failures = results.filter((r) => r.status === "FAIL");
    if (failures.length === 0) {
      showToast(
        `Aksesibilitas Kontras Sempurna! Seluruh ${results.length} teks lolos WCAG AA.`,
        "success",
      );
    } else {
      showToast(
        `Audit Selesai: ${failures.length} dari ${results.length} teks dianalisis (Cek Console).`,
        "info",
      );
    }
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Title Bar */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <h1 className="font-mono text-base font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
          Pengaturan
        </h1>
      </div>

      {/* Grid Configuration Modules */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (6 cols) */}
        <div className="space-y-6 lg:col-span-6">
          {/* Section 0: Mode Gelap & Tampilan */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-colors">
            <div className="mb-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-1.5">
                {isDark ? (
                  <Moon className="h-4 w-4 text-zinc-100" />
                ) : (
                  <Sun className="h-4 w-4 text-zinc-900" />
                )}
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Mode Gelap / Terang
                </h2>
              </div>
              <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {isDark ? "AKTIF: DARK" : "AKTIF: LIGHT"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTheme("light");
                  showToast("Mode Terang diaktifkan", "info");
                }}
                className={`flex items-center justify-center gap-1.5 border p-2 text-xs font-mono transition-colors ${
                  theme === "light"
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-400"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Terang</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme("dark");
                  showToast("Mode Gelap diaktifkan", "info");
                }}
                className={`flex items-center justify-center gap-1.5 border p-2 text-xs font-mono transition-colors ${
                  theme === "dark"
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-400"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Gelap</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme("system");
                  showToast("Mode Sistem Otomatis diaktifkan", "info");
                }}
                className={`flex items-center justify-center gap-1.5 border p-2 text-xs font-mono transition-colors ${
                  theme === "system"
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-400"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Sistem</span>
              </button>
            </div>

            {/* Accessibility Contrast Audit Diagnostic */}
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                  Uji Kontras Aksesibilitas (WCAG AA)
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Jalankan verifikasi rasio kontras 4.5:1
                </div>
              </div>
              <button
                type="button"
                onClick={handleRunA11yAudit}
                className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 text-xs font-mono text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-400 transition-colors"
              >
                Uji kontras
              </button>
            </div>
          </div>

          {/* Section 1: Modul PIN 4-6 Angka & Auto-Lock */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-colors">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-zinc-800 dark:text-zinc-200" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Keamanan PIN
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-[10px] uppercase px-2 py-0.5 border ${
                    isPinEnabled
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                      : "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {isPinEnabled
                    ? "PIN Aktif (Terkunci)"
                    : "PIN Nonaktif (Terbuka)"}
                </span>

                <button
                  type="button"
                  onClick={() => handleTogglePinDirectly(!isPinEnabled)}
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-mono font-medium border transition-colors ${
                    isPinEnabled
                      ? "border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50"
                      : "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white"
                  }`}
                >
                  {isPinEnabled ? (
                    <>
                      <ShieldOff className="h-3.5 w-3.5" />
                      <span>Nonaktifkan PIN Langsung</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Aktifkan PIN Langsung</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {!isPinEnabled ? (
              <div className="mb-3 border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <strong className="font-semibold">
                      Fitur PIN Sedang Nonaktif:
                    </strong>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-400/90">
                      Aplikasi DreBoXs dapat dibuka langsung kapan saja tanpa
                      perlu memasukkan kode PIN
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-3 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                <div className="flex items-start gap-2">
                  <Lock className="h-4 w-4 shrink-0 mt-0.5 text-zinc-700 dark:text-zinc-300" />
                  <div>
                    <strong className="font-semibold">Fitur PIN Aktif:</strong>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                      Aplikasi terlindungi oleh PIN{" "}
                      {settings?.pinCode
                        ? `(${settings.pinCode.length} digit)`
                        : ""}
                      . Jika ingin menonaktifkan agar tidak meminta PIN lagi,
                      klik tombol &quot;Nonaktifkan PIN Langsung&quot; di atas
                      atau hilangkan centang di bawah lalu simpan.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSavePinSettings} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={isPinEnabled}
                    onChange={(e) => setIsPinEnabled(e.target.checked)}
                    className="h-4 w-4 rounded-none border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-0"
                  />
                  <span>Aktifkan PIN</span>
                </label>
              </div>

              {/* Auto-Lock Duration Selection */}
              <div className="border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 p-2.5">
                <div className="flex items-center justify-between">
                  <select
                    value={autoLockMinutes}
                    onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                    disabled={!isPinEnabled}
                    className="h-7 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none disabled:opacity-50"
                  >
                    <option value={1}>1 Menit</option>
                    <option value={3}>3 Menit</option>
                    <option value={5}>5 Menit (Standar)</option>
                    <option value={10}>10 Menit</option>
                    <option value={15}>15 Menit</option>
                    <option value={30}>30 Menit</option>
                    <option value={0}>
                      Nonaktif (Tidak Pernah Kunci Otomatis)
                    </option>
                  </select>
                </div>
                <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                  {isPinEnabled
                    ? "Mengunci otomatis aplikasi jika tidak ada interaksi mouse atau keyboard selama durasi yang ditentukan."
                    : "Auto-lock otomatis dinonaktifkan karena fitur PIN tidak aktif."}
                </p>
              </div>

              {isPinEnabled && (
                <>
                  {settings?.pinCode && (
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        PIN Saat Ini (Hanya perlu diisi jika ingin mengganti
                        kode PIN)
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        value={currentPinInput}
                        onChange={(e) =>
                          setCurrentPinInput(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="Ketik PIN saat ini (opsional jika hanya ubah auto-lock)"
                        className="mt-1 h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-400 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        PIN Baru (4-6 Digit Angka)
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        value={newPin}
                        onChange={(e) =>
                          setNewPin(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder={
                          settings?.pinCode
                            ? "Kosongkan jika tetap pakai PIN lama"
                            : "Contoh: 1234"
                        }
                        className="mt-1 h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        Konfirmasi PIN Baru
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        value={confirmPin}
                        onChange={(e) =>
                          setConfirmPin(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="Ketik ulang PIN baru"
                        disabled={!newPin}
                        className="mt-1 h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-400 focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between pt-2">
                {isPinEnabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPinLocked(true);
                      sessionStorage.removeItem("dreboxs_session_unlocked");
                    }}
                    className="border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    Uji Kunci Sekarang
                  </button>
                ) : (
                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                    Perubahan tersimpan otomatis & persisten saat refresh
                  </span>
                )}

                <button
                  type="submit"
                  className="flex items-center gap-1.5 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>
                    {isPinEnabled ? "Simpan Pengaturan PIN" : "Nonaktifkan PIN"}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Pintasan Keyboard (Keyboard Shortcuts cmdk) */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-colors">
            <div className="mb-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Keyboard className="h-4 w-4 text-zinc-800 dark:text-zinc-200" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Keyboard Shortcuts
                </h2>
              </div>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-zinc-700 dark:text-zinc-300">
                  Buka Menu Perintah & Pencarian Cerdas
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                    Ctrl
                  </kbd>
                  <span className="text-zinc-400">+</span>
                  <kbd className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                    K
                  </kbd>
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-zinc-700 dark:text-zinc-300">
                  Tambah Barang Impian Baru (Buka Form)
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                    Ctrl
                  </kbd>
                  <span className="text-zinc-400">+</span>
                  <kbd className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                    N
                  </kbd>
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-zinc-700 dark:text-zinc-300">
                  Ekspor Inventaris ke File Excel (.xlsx)
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                    Ctrl
                  </kbd>
                  <span className="text-zinc-400">+</span>
                  <kbd className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                    E
                  </kbd>
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-zinc-700 dark:text-zinc-300">
                  Ekspor & Cetak Dokumen PDF Resmi
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                    Ctrl
                  </kbd>
                  <span className="text-zinc-400">+</span>
                  <kbd className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                    P
                  </kbd>
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-zinc-700 dark:text-zinc-300">
                  Kunci Layar Aplikasi dengan PIN Seketika
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                    Ctrl
                  </kbd>
                  <span className="text-zinc-400">+</span>
                  <kbd className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                    L
                  </kbd>
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-zinc-700 dark:text-zinc-300">
                  Ganti Cepat Mode Tampilan (Dark / Light)
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                    Ctrl
                  </kbd>
                  <span className="text-zinc-400">+</span>
                  <kbd className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                    D
                  </kbd>
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-zinc-700 dark:text-zinc-300">
                  Navigasi Langsung ke Dasbor 1 s.d. 8
                </span>
                <div className="flex items-center gap-1">
                  <kbd className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                    Ctrl
                  </kbd>
                  <span className="text-zinc-400">+</span>
                  <kbd className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                    1..8
                  </kbd>
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-zinc-700 dark:text-zinc-300">
                  Tutup Dialog / Modal / Menu Terbuka
                </span>
                <kbd className="border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                  Esc
                </kbd>
              </div>
            </div>
          </div>

          {/* Section 3: Cadangan Penuh & Pemulihan Basis Data (Backup & Restore IndexedDB) */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-colors">
            <div className="mb-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Database className="h-4 w-4 text-zinc-800 dark:text-zinc-200" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Backup & Restore
                </h2>
              </div>
            </div>

            <div className="space-y-2">
              {/* Complete Database Backup */}
              <div className="flex items-center justify-between border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 p-2.5">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-white dark:text-zinc-900" />
                  <div>
                    <div className="text-xs font-semibold text-white dark:text-zinc-900">
                      Unduh Cadangan Penuh (Full Backup JSON)
                    </div>
                    <div className="text-[10px] text-zinc-300 dark:text-zinc-700">
                      Mencakup {products.length} barang, {categories.length}{" "}
                      kategori, {tags.length} tag, seluruh log & pengaturan
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadFullBackup}
                  className="border border-white dark:border-zinc-900 bg-white dark:bg-zinc-900 px-3 py-1 text-xs font-mono font-bold text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  JSON
                </button>
              </div>

              {/* PDF & Excel Standard Exports */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    exportToPDF(products, categories);
                    showToast("Dokumen PDF berhasil dibuat", "success");
                  }}
                  className="flex items-center justify-center gap-1.5 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 p-2 text-xs text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-400 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exportToExcel(products, categories, tags);
                    showToast("File Excel XLSX berhasil dibuat", "success");
                  }}
                  className="flex items-center justify-center gap-1.5 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 p-2 text-xs text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-400 transition-colors"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            {/* Restore / Impor Database JSON */}
            <div className="mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                Pulihkan Data dari File JSON
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-1.5 flex w-full items-center justify-center gap-1.5 border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 py-2.5 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-400 transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Pilih File JSON</span>
              </button>
              {importedJsonStatus && (
                <p className="mt-1.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                  {importedJsonStatus}
                </p>
              )}
            </div>

            {/* Restore Confirmation Dialog Preview */}
            {pendingRestore && (
              <div className="mt-4 border border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/90 p-3 space-y-3 font-mono text-xs">
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-bold border-b border-zinc-200 dark:border-zinc-700 pb-1.5">
                  <AlertCircle className="h-4 w-4" />
                  <span>Konfirmasi Pemulihan Data</span>
                </div>

                <div className="text-[11px] text-zinc-700 dark:text-zinc-300 space-y-0.5">
                  <div>
                    Barang Impian:{" "}
                    <strong>
                      {pendingRestore.products?.length || 0} entri
                    </strong>
                  </div>
                  <div>
                    Kategori:{" "}
                    <strong>
                      {pendingRestore.categories?.length || 0} entri
                    </strong>
                  </div>
                  <div>
                    Tag:{" "}
                    <strong>{pendingRestore.tags?.length || 0} entri</strong>
                  </div>
                  <div>
                    Riwayat Log:{" "}
                    <strong>{pendingRestore.logs?.length || 0} entri</strong>
                  </div>
                  <div>
                    Tanggal Ekspor:{" "}
                    {pendingRestore.meta?.exportDate
                      ? formatDate(
                          new Date(pendingRestore.meta.exportDate).getTime(),
                        )
                      : "Tidak diketahui"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-sans font-semibold text-zinc-800 dark:text-zinc-200">
                    Pilih Metode Pemulihan:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRestoreMode("replace")}
                      className={`border p-2 text-center text-[11px] transition-colors ${
                        restoreMode === "replace"
                          ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                          : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <div>Gantikan Penuh</div>
                      <div className="text-[9px] opacity-75 font-normal">
                        Hapus yang ada & timpa
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRestoreMode("merge")}
                      className={`border p-2 text-center text-[11px] transition-colors ${
                        restoreMode === "merge"
                          ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                          : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <div>Gabungkan Data</div>
                      <div className="text-[9px] opacity-75 font-normal">
                        Pertahankan data lokal
                      </div>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPendingRestore(null)}
                    className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    disabled={isRestoring}
                    className="border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-3 py-1 text-xs font-bold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-50"
                  >
                    {isRestoring ? "Memulihkan..." : "Lanjutkan Pemulihan Data"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section: Izin Penyimpanan Persisten (Persistent Storage Permission) */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-colors">
            <div className="mb-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-1.5">
                <HardDrive className="h-4 w-4 text-zinc-800 dark:text-zinc-200" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Izin Penyimpanan Persisten
                </h2>
              </div>
              <span
                className={`border px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                  isPersisted === true
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                    : "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {isPersisted === true
                  ? "PERSISTEN: TERLINDUNGI"
                  : isPersisted === false
                    ? "STATUS: STANDAR"
                    : "MEMERIKSA..."}
              </span>
            </div>

            {/* Storage Quota / Estimate */}
            {storageEstimate && (
              <div className="mt-3 border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] text-zinc-700 dark:text-zinc-300">
                  <span>Penggunaan Memori Browser:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {(storageEstimate.usage / (1024 * 1024)).toFixed(2)} MB
                    <span className="text-zinc-400 font-normal">
                      {" "}
                      /{" "}
                      {(storageEstimate.quota / (1024 * 1024 * 1024)).toFixed(
                        2,
                      )}{" "}
                      GB Kuota
                    </span>
                  </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          1,
                          (storageEstimate.usage /
                            (storageEstimate.quota || 1)) *
                            100,
                        ),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Permission Control & Actions */}
            <div className="mt-3 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={handleRequestPersistentStorage}
                disabled={isRequestingPersist || isPersisted === true}
                className={`flex h-9 sm:h-8 w-full sm:flex-1 items-center justify-center gap-1.5 border px-3 text-xs font-semibold transition-colors ${
                  isPersisted === true
                    ? "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-default"
                    : "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white"
                } disabled:opacity-60`}
              >
                <HardDrive className="h-3.5 w-3.5" />
                <span>
                  {isRequestingPersist
                    ? "Meminta Izin..."
                    : isPersisted === true
                      ? "Izin Persisten Telah Aktif"
                      : "Minta Izin Penyimpanan Persisten"}
                </span>
              </button>

              <button
                type="button"
                onClick={checkStorageStatus}
                disabled={isCheckingStorage}
                className="flex h-9 sm:h-8 w-full sm:w-auto items-center justify-center gap-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                title="Periksa ulang status penyimpanan browser"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isCheckingStorage ? "animate-spin" : ""}`}
                />
                <span>Cek Status</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Telegram Bot, Cloud Auto-Export & Public API (6 cols) */}
        <div className="space-y-6 lg:col-span-6">
          {/* Section 4: Integrasi Telegram Bot */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-colors">
            <div className="mb-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Send className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Telegram Bot
                </h2>
              </div>
              <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                Live API
              </span>
            </div>

            <form onSubmit={handleSaveTelegramSettings} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="submit"
                  className="flex h-9 sm:h-8 w-full sm:flex-1 items-center justify-center gap-1.5 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-2 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Simpan Kredensial</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerTelegramSummary}
                  disabled={isSendingTelegram || !telegramToken}
                  className="flex h-9 sm:h-8 w-full sm:flex-1 items-center justify-center gap-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-400 disabled:opacity-50 transition-colors"
                >
                  <Send className="h-3 w-3" />
                  <span>Kirim Teks</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerTelegramBackup}
                  disabled={isSendingTelegram || !telegramToken}
                  className="flex h-9 sm:h-8 w-full sm:flex-1 items-center justify-center gap-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-400 disabled:opacity-50 transition-colors"
                >
                  <Database className="h-3 w-3" />
                  <span>Kirim JSON</span>
                </button>
              </div>

              {telegramStatus && (
                <div className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                  {telegramStatus}
                </div>
              )}
            </form>
          </div>

          {/* Section 5: Pusat Ekspor Otomatis Cloud (Google Drive & Dropbox) */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-colors">
            <div className="mb-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Cloud className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Ekspor Otomatis ke Aplikasi Cloud
                </h2>
              </div>
              <span
                className={`font-mono text-[10px] ${autoExportEnabled ? "text-zinc-900 dark:text-zinc-100 font-bold" : "text-zinc-400"}`}
              >
                {autoExportEnabled ? "STATUS: AKTIF" : "STATUS: NONAKTIF"}
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {/* Toggle Enable */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-900 dark:text-zinc-100 font-semibold">
                <input
                  type="checkbox"
                  checked={autoExportEnabled}
                  onChange={(e) => setAutoExportEnabled(e.target.checked)}
                  className="h-4 w-4 rounded-none border-zinc-400 text-zinc-900 focus:ring-0"
                />
                <span>Aktifkan Ekspor Otomatis ke Cloud</span>
              </label>

              {/* Format Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Format Berkas Ekspor
                </label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAutoExportFormat("pdf")}
                    className={`border px-2 py-1.5 text-xs font-mono transition-colors ${
                      autoExportFormat === "pdf"
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900"
                    }`}
                  >
                    PDF (JsPDF)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoExportFormat("excel")}
                    className={`border px-2 py-1.5 text-xs font-mono transition-colors ${
                      autoExportFormat === "excel"
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900"
                    }`}
                  >
                    Excel (SheetJS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoExportFormat("both")}
                    className={`border px-2 py-1.5 text-xs font-mono transition-colors ${
                      autoExportFormat === "both"
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900"
                    }`}
                  >
                    Keduanya
                  </button>
                </div>
              </div>

              {/* Cloud Service Destination */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Layanan Cloud Tujuan
                </label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAutoExportService("gdrive")}
                    className={`border px-2 py-1.5 text-xs font-mono transition-colors ${
                      autoExportService === "gdrive"
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900"
                    }`}
                  >
                    Google Drive
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoExportService("dropbox")}
                    className={`border px-2 py-1.5 text-xs font-mono transition-colors ${
                      autoExportService === "dropbox"
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900"
                    }`}
                  >
                    Dropbox
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoExportService("both")}
                    className={`border px-2 py-1.5 text-xs font-mono transition-colors ${
                      autoExportService === "both"
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900"
                    }`}
                  >
                    Keduanya
                  </button>
                </div>
              </div>

              {/* Trigger Options */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Pemicu Ekspor (Trigger)
                </label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAutoExportTrigger("on_change")}
                    className={`border px-2 py-1.5 text-xs font-mono transition-colors ${
                      autoExportTrigger === "on_change"
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900"
                    }`}
                  >
                    Perubahan Data
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoExportTrigger("daily")}
                    className={`border px-2 py-1.5 text-xs font-mono transition-colors ${
                      autoExportTrigger === "daily"
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900"
                    }`}
                  >
                    Setiap Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoExportTrigger("interval")}
                    className={`border px-2 py-1.5 text-xs font-mono transition-colors ${
                      autoExportTrigger === "interval"
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900"
                    }`}
                  >
                    Interval Waktu
                  </button>
                </div>
              </div>

              {autoExportTrigger === "interval" && (
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Interval Waktu Ekspor
                  </label>
                  <select
                    value={autoExportIntervalMinutes}
                    onChange={(e) =>
                      setAutoExportIntervalMinutes(Number(e.target.value))
                    }
                    className="mt-1 h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200"
                  >
                    <option value={15}>Setiap 15 Menit</option>
                    <option value={30}>Setiap 30 Menit</option>
                    <option value={60}>Setiap 1 Jam</option>
                    <option value={120}>Setiap 2 Jam</option>
                    <option value={360}>Setiap 6 Jam</option>
                  </select>
                </div>
              )}

              {/* Cloud Credentials Inputs */}
              {(autoExportService === "gdrive" ||
                autoExportService === "both") && (
                <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-2">
                  <span className="font-mono text-[10px] font-bold uppercase text-zinc-800 dark:text-zinc-200">
                    Konfigurasi Google Drive
                  </span>
                  <div>
                    <label className="block text-[10px] text-zinc-600 dark:text-zinc-400">
                      Folder Name / ID di Google Drive
                    </label>
                    <input
                      type="text"
                      value={gdriveFolderId}
                      onChange={(e) => setGdriveFolderId(e.target.value)}
                      placeholder="Contoh: DreBoXs_Backup"
                      className="mt-0.5 h-7 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                </div>
              )}

              {(autoExportService === "dropbox" ||
                autoExportService === "both") && (
                <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-2">
                  <span className="font-mono text-[10px] font-bold uppercase text-zinc-800 dark:text-zinc-200">
                    Konfigurasi Dropbox
                  </span>
                  <div>
                    <label className="block text-[10px] text-zinc-600 dark:text-zinc-400">
                      Dropbox Access Token
                    </label>
                    <input
                      type="password"
                      value={dropboxAccessToken}
                      onChange={(e) => setDropboxAccessToken(e.target.value)}
                      placeholder="sl.u.AF..."
                      className="mt-0.5 h-7 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleSaveCloudExportSettings}
                  className="flex items-center gap-1.5 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Simpan Pengaturan Cloud</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Modul Kustomisasi Preset Link & Marketplace dengan Iconify API */}
      <div className="mt-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-colors">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
            <div>
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Kustomisasi Preset Link & Marketplace
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetPresetsToDefault}
              className="flex items-center gap-1 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 text-xs font-mono text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-400 transition-colors"
              title="Kembalikan ke 12 preset bawaan"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>

        {/* Top Split: Form Tambah/Ubah Preset + Tester Deteksi URL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Form Preset (7 cols) */}
          <div className="lg:col-span-7 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 p-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2 mb-3">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                <Plus className="h-3.5 w-3.5" />
                <span>
                  {editingPreset
                    ? `Edit Preset: ${editingPreset.name}`
                    : "Tambah Preset Marketplace Baru"}
                </span>
              </div>
              {editingPreset && (
                <button
                  type="button"
                  onClick={handleCancelEditPreset}
                  className="font-mono text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <form
              onSubmit={handleSavePresetForm}
              className="space-y-3 font-sans"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nama Toko / Marketplace */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Nama Toko / Preset *
                  </label>
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Contoh: Tokopedia, Gramedia, Erafone"
                    className="mt-1 h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                    required
                  />
                </div>

                {/* Kata Kunci Domain */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Kata Kunci Domain (pisahkan koma)
                  </label>
                  <input
                    type="text"
                    value={presetDomains}
                    onChange={(e) => setPresetDomains(e.target.value)}
                    placeholder="tokopedia.com, toky.id"
                    className="mt-1 h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* Ikon & Warna Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Ikon Iconify Picker Trigger */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Ikon Iconify
                  </label>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 items-center justify-center border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 shrink-0"
                      style={{ color: presetColor }}
                    >
                      <IconifyIcon
                        icon={presetIcon}
                        className="h-4 w-4"
                        color={presetColor}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPresetIconPickerOpen(true)}
                      className="flex h-8 flex-1 items-center justify-between border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-xs text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-300 transition-colors"
                    >
                      <span className="truncate font-mono text-[11px]">
                        {presetIcon}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400 shrink-0 ml-1">
                        Cari Ikon →
                      </span>
                    </button>
                  </div>
                </div>

                {/* Warna Merek */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Warna Icon
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={presetColor}
                      onChange={(e) => setPresetColor(e.target.value)}
                      className="h-8 w-8 cursor-pointer border border-zinc-300 dark:border-zinc-700 p-0.5 bg-white dark:bg-zinc-800"
                    />
                    <input
                      type="text"
                      value={presetColor}
                      onChange={(e) => setPresetColor(e.target.value)}
                      placeholder="#2563EB"
                      className="h-8 flex-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Brand Colors Palette */}
              <div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 mb-1">
                  Pilihan Cepat Warna Marketplace:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: "Tokopedia", color: "#00AA5B" },
                    { name: "Shopee", color: "#EE4D2D" },
                    { name: "Blibli", color: "#0072C6" },
                    { name: "Bukalapak", color: "#E00034" },
                    { name: "TikTok", color: "#000000" },
                    { name: "Amazon", color: "#FF9900" },
                    { name: "Lazada", color: "#0F146D" },
                    { name: "Samsung", color: "#1428A0" },
                    { name: "Apple", color: "#555555" },
                    { name: "Steam", color: "#171A21" },
                    { name: "Universal Blue", color: "#2563EB" },
                    { name: "Emerald", color: "#059669" },
                  ].map((item) => (
                    <button
                      key={item.color}
                      type="button"
                      onClick={() => setPresetColor(item.color)}
                      className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-400"
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview of Product Card Button */}
              <div className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5 mt-2">
                <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 mb-1.5">
                  Pratinjau Tombol di Card Produk:
                </div>
                <div className="max-w-xs">
                  <div className="flex items-center justify-between gap-1.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    <div className="flex items-center gap-1.5 truncate">
                      <div
                        className="flex h-4 w-4 shrink-0 items-center justify-center"
                        style={{ color: presetColor }}
                      >
                        <IconifyIcon
                          icon={presetIcon}
                          className="h-3.5 w-3.5"
                          color={presetColor}
                        />
                      </div>
                      <span className="truncate">
                        {presetName || "Nama Toko"}
                      </span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-zinc-400 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                {editingPreset && (
                  <button
                    type="button"
                    onClick={handleCancelEditPreset}
                    className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  className="flex items-center gap-1 border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 px-4 py-1.5 text-xs font-bold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>
                    {editingPreset ? "Perbarui Preset" : "Simpan Preset Baru"}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Tester Deteksi Otomatis (5 cols) */}
          <div className="lg:col-span-5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-xs text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700 pb-2 mb-3">
                <Search className="h-3.5 w-3.5" />
                <span>Uji Deteksi URL Otomatis</span>
              </div>

              <div>
                <label className="block font-mono text-[10px] text-zinc-500 mb-1">
                  Masukkan URL:
                </label>
                <input
                  type="text"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-8 w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-300 focus:outline-none"
                />
              </div>

              {/* Match Result Display */}
              {(() => {
                const detected = detectStoreWithPresets(testUrl, linkPresets);
                return (
                  <div className="mt-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase text-zinc-400">
                        Hasil Deteksi:
                      </span>
                      <span
                        className={`font-mono text-[9px] uppercase px-1.5 py-0.2 border ${
                          detected.isKnown
                            ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold"
                            : "border-zinc-300 dark:border-zinc-700 text-zinc-500"
                        }`}
                      >
                        {detected.isKnown ? "Domain Cocok" : "Domain Umum"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 shrink-0"
                        style={{ color: detected.color }}
                      >
                        <IconifyIcon
                          icon={detected.icon}
                          className="h-4 w-4"
                          color={detected.color}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {detected.label}
                        </div>
                        <div className="font-mono text-[10px] text-zinc-400 truncate">
                          Ikon: {detected.icon}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Daftar Preset Terkonfigurasi */}
        <div>
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Daftar Preset Marketplace ({linkPresets.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {linkPresets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between gap-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="flex h-7 w-7 items-center justify-center border shrink-0"
                    style={{
                      borderColor: preset.color,
                      backgroundColor: `${preset.color}15`,
                      color: preset.color,
                    }}
                  >
                    <IconifyIcon
                      icon={preset.icon}
                      className="h-4 w-4"
                      color={preset.color}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {preset.name}
                    </div>
                    <div className="font-mono text-[9px] text-zinc-400 truncate">
                      {preset.domains.length > 0
                        ? preset.domains.join(", ")
                        : "Umum (tanpa domain)"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEditPreset(preset)}
                    className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    title="Ubah Preset"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePresetItem(preset)}
                    className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Hapus Preset"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preset Icon Picker Modal using Iconify API */}
      <IconPickerModal
        isOpen={isPresetIconPickerOpen}
        onClose={() => setIsPresetIconPickerOpen(false)}
        selectedIcon={presetIcon}
        selectedColor={presetColor}
        title="Pilih Ikon Marketplace (Iconify API)"
        onSelect={(icon, color) => {
          setPresetIcon(icon);
          setPresetColor(color);
        }}
      />

      {/* Section 7: Zona Bahaya & Modul Reset Seluruh Data (Produk, Kategori, Tag) */}
      <div className="mt-6 border border-red-200 dark:border-red-950/60 bg-red-50/20 dark:bg-red-950/10 p-4 transition-colors">
        <div className="mb-3 flex items-center justify-between border-b border-red-100 dark:border-red-900/40 pb-2">
          <div className="flex items-center gap-1.5">
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
              Zona Bahaya: Reset Seluruh Data
            </h2>
          </div>
          <span className="border border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-950/80 px-2 py-0.5 font-mono text-[10px] font-bold text-red-700 dark:text-red-300">
            TINDAKAN PERMANEN
          </span>
        </div>

        {/* Action Grid for Resetting */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Reset All */}
          <div className="flex flex-col justify-between border border-red-300 dark:border-red-800/80 bg-white dark:bg-zinc-900 p-3">
            <div>
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Reset Seluruh Data</span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                Kosongkan Produk ({products.length}), Kategori (
                {categories.length}), dan Tag ({tags.length}) sekaligus.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenResetModal("all")}
              className="mt-3 flex h-8 w-full items-center justify-center gap-1 border border-red-600 dark:border-red-500 bg-red-600 dark:bg-red-600 px-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              <span>Reset Total Data</span>
            </button>
          </div>

          {/* Reset Products Only */}
          <div className="flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
            <div>
              <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                Reset Produk Saja
              </div>
              <p className="mt-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                Hapus semua {products.length} barang impian. Kategori & tag
                tetap utuh.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenResetModal("products")}
              className="mt-3 flex h-8 w-full items-center justify-center gap-1 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 text-xs font-medium text-red-600 dark:text-red-400 hover:border-red-600 dark:hover:border-red-500 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              <span>Reset Produk ({products.length})</span>
            </button>
          </div>

          {/* Reset Categories Only */}
          <div className="flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
            <div>
              <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                Reset Kategori Saja
              </div>
              <p className="mt-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                Hapus semua {categories.length} kategori kelompok.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenResetModal("categories")}
              className="mt-3 flex h-8 w-full items-center justify-center gap-1 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 text-xs font-medium text-red-600 dark:text-red-400 hover:border-red-600 dark:hover:border-red-500 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              <span>Reset Kategori ({categories.length})</span>
            </button>
          </div>

          {/* Reset Tags Only */}
          <div className="flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
            <div>
              <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                Reset Tag Saja
              </div>
              <p className="mt-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                Hapus semua {tags.length} tag pengelompokan produk.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenResetModal("tags")}
              className="mt-3 flex h-8 w-full items-center justify-center gap-1 border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 text-xs font-medium text-red-600 dark:text-red-400 hover:border-red-600 dark:hover:border-red-500 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              <span>Reset Tag ({tags.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Safety Confirmation Modal for Reset Data */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md border border-red-400 dark:border-red-700 bg-white dark:bg-zinc-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wide">
                Konfirmasi Reset Data Permanen
              </h3>
            </div>

            <div className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
              <p>Anda akan mengosongkan / mereset data berikut:</p>
              <div className="border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-2.5 font-mono text-xs text-red-800 dark:text-red-300">
                {resetTarget === "all" && (
                  <div>
                    <strong>RESET TOTAL:</strong> {products.length} Produk,{" "}
                    {categories.length} Kategori, dan {tags.length} Tag.
                  </div>
                )}
                {resetTarget === "products" && (
                  <div>
                    <strong>PRODUK:</strong> Seluruh {products.length} barang
                    impian akan dihapus.
                  </div>
                )}
                {resetTarget === "categories" && (
                  <div>
                    <strong>KATEGORI:</strong> Seluruh {categories.length}{" "}
                    kategori akan dihapus.
                  </div>
                )}
                {resetTarget === "tags" && (
                  <div>
                    <strong>TAG:</strong> Seluruh {tags.length} tag akan
                    dihapus.
                  </div>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Tindakan ini tidak dapat dibatalkan. Untuk melanjutkan, ketik{" "}
                <strong className="font-mono text-zinc-900 dark:text-zinc-100">
                  RESET
                </strong>{" "}
                pada kolom di bawah ini:
              </p>
            </div>

            <div>
              <input
                type="text"
                value={resetConfirmationText}
                onChange={(e) => setResetConfirmationText(e.target.value)}
                placeholder="Ketik RESET untuk konfirmasi..."
                className="h-9 w-full border border-red-300 dark:border-red-700 bg-white dark:bg-zinc-800 px-3 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:border-red-600 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <button
                type="button"
                onClick={handleCloseResetModal}
                disabled={isResettingData}
                className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-300"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={
                  resetConfirmationText.trim().toUpperCase() !== "RESET" ||
                  isResettingData
                }
                className="flex items-center gap-1.5 border border-red-600 bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>
                  {isResettingData ? "Mereset Data..." : "Ya, Reset Sekarang"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
