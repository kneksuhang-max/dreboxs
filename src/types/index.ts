export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId?: string;
  tags: string[];
  links: string[];
  linkButtonLabel?: string;
  linkButtonLabels?: string[];
  imageUrl?: string;
  description: string;
  isFavorite: boolean;
  status: "dream" | "planned" | "purchased" | "archived";
  priority: "low" | "medium" | "high";
  targetMonth?: string; // YYYY-MM
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string; // Iconify icon identifier (e.g. 'lucide:laptop', 'solar:gadgets-outline')
  color?: string; // Custom hex color (e.g. '#3b82f6')
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: number;
}

export interface LinkPreset {
  id: string;
  name: string;
  domains: string[];
  icon: string; // Iconify icon identifier (e.g. 'simple-icons:tokopedia', 'lucide:globe')
  color: string; // Hex brand color (e.g. '#03AC0E')
  isCustom?: boolean;
}

export interface LogEntry {
  id: string;
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "EXPORT"
    | "BACKUP"
    | "PIN_CHANGE"
    | "SECURITY"
    | "TELEGRAM_SYNC"
    | "SYSTEM";
  entity: "product" | "category" | "tag" | "security" | "system";
  details: string;
  timestamp: number;
}

export interface AppSettings {
  id: string;
  pinCode: string; // 4-6 digits
  isPinEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  googleDriveFolder: string;
  dropboxToken: string;
  apiKey: string;
  autoLockMinutes: number;
  lastSyncTimestamp?: number;

  // Cloud Auto-Export Configurations
  autoExportEnabled?: boolean;
  autoExportFormat?: "pdf" | "excel" | "both";
  autoExportService?: "gdrive" | "dropbox" | "both";
  autoExportTrigger?: "on_change" | "daily" | "interval";
  autoExportIntervalMinutes?: number;
  googleDriveAccessToken?: string;
  googleDriveFolderId?: string;
  dropboxAccessToken?: string;
  lastCloudExportTimestamp?: number;
  lastCloudExportStatus?: string;
  lastCloudExportFileName?: string;

  // MeiliSearch Configurations
  meiliHost?: string;
  meiliApiKey?: string;
  meiliIndexName?: string;
  meiliAutoSync?: boolean;
  searchWeights?: {
    name: number;
    category: number;
    tags: number;
    description: number;
  };
  searchTypoTolerance?: boolean;

  // Link Preset & Marketplace Customizations
  customLinkPresets?: LinkPreset[];
}

export type DashboardTab =
  | "overview" // Dasbor 1: Ikhtisar & Laporan Bulanan
  | "form_logs" // Dasbor 2: Form & Riwayat Log
  | "products" // Dasbor 3: Daftar Produk
  | "categories" // Dasbor 4: Daftar Kategori
  | "tags" // Dasbor 5: Daftar Tag
  | "favorites" // Dasbor 6: Daftar Produk Favorit
  | "archive" // Dasbor 7: Arsip Barang Impian
  | "settings"; // Dasbor 8: Pengaturan & Konfigurasi
